import {validateReview,MAX_TEXT} from '../src/review-core.js';
import {handlePayments,paymentsEnabled,claimPayment,finishPayment} from './payments.js';
import {privacyApproved,reviewLimit,reviewModel,localOwnerCredit} from './ai-config.js';
import {REVIEW_TIMEOUT_MS} from '../src/review-timing.js';
import {verifySuggestions} from './factual-review.js';
import {reviewPrompt} from './review-prompt.js';
import {auditFeedback} from './feedback-review.js';
import {translateFeedback} from './review-language.js';
import {paymentOwner} from './payments.js';

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function limitedJSON(message,limit){const reader=message.body?.getReader();if(!reader)throw new Error('body');let size=0,chunks=[];try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('size')}chunks.push(value)}}finally{reader.releaseLock()}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder().decode(bytes))}
export const budgetSQL=`INSERT INTO ai_budget (id, used) VALUES ('pilot', 1) ON CONFLICT(id) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used`;
const unlimitedBudgetSQL=`INSERT INTO ai_budget (id, used) VALUES ('pilot', 1) ON CONFLICT(id) DO UPDATE SET used = used + 1 RETURNING used`;
const enabled=env=>env.AI_ENABLED==='true'&&!!env.DEEPSEEK_API_KEY&&!!env.DB&&Number.isInteger(Number(env.AI_MAX_REVIEWS))&&Number(env.AI_MAX_REVIEWS)>0;
export async function handleAPI(request,env,upstream=fetch){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/payments/'))return handlePayments(request,env,upstream);
 if(url.pathname==='/api/review/status'&&request.method==='GET'){
  if(!privacyApproved(env))return json({available:false,remaining:null,reason:'privacy_pending'});
  if(!enabled(env))return json({available:false,remaining:null,reason:'unavailable'});
  try{const budget=await env.DB.prepare("SELECT used FROM ai_budget WHERE id='pilot'").bind().first();const cap=reviewLimit(env,request),remaining=Math.max(0,cap-(budget?.used||0));return json({available:remaining>0,remaining:cap===Infinity?null:remaining,...(cap===Infinity?{unlimited:true}:{}),...(env.CHECKOUT_ENABLED==='false'&&!localOwnerCredit(env,request)?{checkoutPaused:true}:{})})}catch{return json({available:false,remaining:0},503)}
 }
 if(url.pathname==='/api/review/language'){
  if(request.method!=='POST')return json({error:'method'},405);
  if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'origin'},403);
  if(!privacyApproved(env)||!enabled(env))return json({error:'unavailable'},503);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'type'},415);
  try{
   if(!localOwnerCredit(env,request)){
    const owner=await paymentOwner(request),order=owner?await env.DB.prepare('SELECT * FROM payments WHERE owner=?').bind(owner).first():null;
    if(!order||order.state!=='used')return json({error:'payment_required'},402);
   }
   const input=await limitedJSON(request,90000);
   if(input.consent!==true||!['en','mk'].includes(input.language)||!Array.isArray(input.strings)||input.strings.length<1||input.strings.length>140||input.strings.some(text=>typeof text!=='string'||text.length>7000))return json({error:'invalid_input'},400);
   const cap=reviewLimit(env,request),ticket=await (cap===Infinity?env.DB.prepare(unlimitedBudgetSQL).bind():env.DB.prepare(budgetSQL).bind(cap)).first();
   if(!ticket)return json({error:'pilot_limit'},429);
   return json({strings:await translateFeedback(input.strings,input.language,env,upstream,limitedJSON)});
  }catch{return json({error:'translation_failed'},502)}
 }
 if(url.pathname!=='/api/review')return json({error:'not_found'},404);
 if(request.method!=='POST')return json({error:'method'},405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'origin'},403);
 if(!privacyApproved(env))return json({error:'privacy_pending'},503);
 if(!enabled(env))return json({error:'unavailable'},503);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'type'},415);
 let input;try{input=await limitedJSON(request,125000)}catch{return json({error:'invalid_body'},400)}
 if(input?.consent!==true||typeof input.text!=='string'||input.text.trim().length<80||input.text.length>MAX_TEXT||typeof input.job!=='string'||input.job.length>10000||(input.letter!==undefined&&(typeof input.letter!=='string'||input.letter.length>10000))||!['en','mk'].includes(input.language))return json({error:'invalid_input'},400);
 let payment;
 if(env.PAYMENTS_ENABLED && env.PAYMENTS_ENABLED!=='false'&&!localOwnerCredit(env,request)){
  if(!paymentsEnabled(env))return json({error:'payments_unavailable'},503);
  try{payment=await claimPayment(request,env)}catch{return json({error:'unavailable'},503)}
  if(!payment)return json({error:'payment_required'},402);
 }
 const fail=async(error,status,reason)=>json({error,...(reason?{reason}:{}),...(payment?{payment:await finishPayment(env,payment,false,upstream)}:{})},status);
 // Track every attempt atomically, including explicitly unlimited local owner tests.
 // Never keep CVs, prompts, IP addresses or responses in the database.
 const cap=reviewLimit(env,request);
 try{const ticket=await (cap===Infinity?env.DB.prepare(unlimitedBudgetSQL).bind():env.DB.prepare(budgetSQL).bind(cap)).first();if(!ticket)return await fail('pilot_limit',429)}catch{return fail('unavailable',503)}
 const system=reviewPrompt(input.language);
 const reviewDeadline=Date.now()+REVIEW_TIMEOUT_MS,reviewSignal=AbortSignal.timeout(REVIEW_TIMEOUT_MS);
 try{
  const response=await upstream('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.DEEPSEEK_API_KEY}`},body:JSON.stringify({model:reviewModel(env),messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({cv:input.text,vacancy:input.job,coverLetter:input.letter||''})}],thinking:{type:'disabled'},response_format:{type:'json_object'},max_tokens:8000,stream:false}),signal:reviewSignal});
  if(!response.ok){await response.body?.cancel();return await fail('provider_unavailable',502)}
  const result=await limitedJSON(response,160000),choice=result.choices?.[0];if(choice?.finish_reason!=='stop'||typeof choice.message?.content!=='string')throw new Error('incomplete');
  const proposed=JSON.parse(choice.message.content);
  let validated=validateReview(proposed,input.text,input.letter||'',input.job);
  if(!validated.overview.trim()&&!['sections','priorities','suggestions','strengths','questions','jobMatches'].some(key=>validated[key].length))throw Error('verification_feedback_empty');
  // Paid reviews must include the section report advertised before checkout.
  if(payment&&(!validated.overview.trim()||!validated.sections.length||!validated.priorities.length))throw Error('verification_feedback_invalid');
  const counts={proposed:proposed.suggestions.length,anchored:validated.suggestions.length};
  if(validated.sections.length||validated.priorities.length)validated=await auditFeedback(validated,input,env,upstream,limitedJSON,AbortSignal.timeout(Math.max(1,reviewDeadline-Date.now())));
  validated.suggestions=await verifySuggestions(validated.suggestions,env,upstream,limitedJSON,AbortSignal.timeout(Math.max(1,reviewDeadline-Date.now())));
  if(payment)await finishPayment(env,payment,true,upstream);
  const output=json(validated);
  if(localOwnerCredit(env,request))output.headers.set('X-Review-Counts',JSON.stringify({...counts,delivered:validated.suggestions.length}));
  return output;
 }catch(error){const reason=reviewSignal.aborted||Date.now()>=reviewDeadline||['TimeoutError','AbortError'].includes(error.name)?'timeout':error.message?.startsWith('verification_')?'verification_failed':'invalid_response';return fail('review_failed',502,reason)}
}
export default {async fetch(request,env){if(new URL(request.url).pathname.startsWith('/api/'))return handleAPI(request,env);if(env.ASSETS)return env.ASSETS.fetch(request);return new Response('Not found',{status:404})}};
