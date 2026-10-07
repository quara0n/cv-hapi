import {validateReview,MAX_TEXT} from '../src/review-core.js';
import {handlePayments,paymentsEnabled,claimPayment,finishPayment,prepareDelivery,reconcilePayments,CURRENT_OFFER} from './payments.js';
import {privacyApproved,reviewLimit,reviewModel,localOwnerCredit} from './ai-config.js';
import {REVIEW_TIMEOUT_MS} from '../src/review-timing.js';
import {verifySuggestions} from './factual-review.js';
import {reviewPrompt} from './review-prompt.js';
import {auditFeedback} from './feedback-review.js';
import {translateFeedback} from './review-language.js';
import {paymentOwner} from './payments.js';
import {completeResponse} from './provider-response.js';

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function limitedJSON(message,limit){const reader=message.body?.getReader();if(!reader)throw new Error('body');let size=0,chunks=[];try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('size')}chunks.push(value)}}finally{reader.releaseLock()}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder().decode(bytes))}
export const budgetSQL=`INSERT INTO ai_budget (id, used) VALUES ('pilot', 1) ON CONFLICT(id) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used`;
const reservedBudgetSQL=`UPDATE ai_budget SET used=used+1 WHERE id='pilot' AND used+(SELECT COALESCE(SUM(reserved),0) FROM payments)-CASE WHEN EXISTS(SELECT 1 FROM payments WHERE id=? AND reserved>0) THEN 1 ELSE 0 END<? RETURNING used`;
const unlimitedBudgetSQL=`INSERT INTO ai_budget (id, used) VALUES ('pilot', 1) ON CONFLICT(id) DO UPDATE SET used = used + 1 RETURNING used`;
const enabled=env=>env.AI_ENABLED==='true'&&!!env.DEEPSEEK_API_KEY&&!!env.DB&&Number.isInteger(Number(env.AI_MAX_REVIEWS))&&Number(env.AI_MAX_REVIEWS)>0;
export async function handleAPI(request,env,upstream=fetch){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/payments/'))return handlePayments(request,env,upstream);
 if(url.pathname==='/api/review/status'&&request.method==='GET'){
  if(!privacyApproved(env))return json({available:false,remaining:null,reason:'privacy_pending'});
  if(!enabled(env))return json({available:false,remaining:null,reason:'unavailable'});
  if(env.PAYMENTS_ENABLED&&env.PAYMENTS_ENABLED!=='false'&&!localOwnerCredit(env,request)&&!paymentsEnabled(env))return json({available:false,remaining:null,reason:'payments_unavailable'});
  try{
   const budget=await env.DB.prepare("SELECT used FROM ai_budget WHERE id='pilot'").bind().first(),cap=reviewLimit(env,request);
   let reserved=0,ownedReviews=0;
   if(paymentsEnabled(env)&&cap!==Infinity){const owner=await paymentOwner(request);const row=await env.DB.prepare('SELECT COALESCE(SUM(reserved),0) n FROM payments WHERE (owner!=? OR ? IS NULL)').bind(owner,owner).first();reserved=row?.n||0;
    if(owner){const owned=await env.DB.prepare("SELECT COALESCE(SUM(review_count-reviews_delivered),0) n FROM payments WHERE owner=? AND state IN ('paid','processing','delivery_pending')").bind(owner).first();ownedReviews=owned?.n||0;}
   }
   const remaining=Math.max(0,cap-(budget?.used||0)-reserved);
   const minimum=paymentsEnabled(env)&&!localOwnerCredit(env,request)&&!ownedReviews?CURRENT_OFFER.reviewCount:1;
   return json({available:remaining>=minimum,remaining:cap===Infinity?null:remaining,...(cap===Infinity?{unlimited:true}:{}),...(env.CHECKOUT_ENABLED==='false'&&!localOwnerCredit(env,request)?{checkoutPaused:true}:{})});
  }catch{return json({available:false,remaining:0},503)}
 }
 if(url.pathname==='/api/review/language'){
  if(request.method!=='POST')return json({error:'method'},405);
  if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'origin'},403);
  if(!privacyApproved(env)||!enabled(env))return json({error:'unavailable'},503);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'type'},415);
  try{
   if(!localOwnerCredit(env,request)){
    const owner=await paymentOwner(request),order=owner?await env.DB.prepare("SELECT * FROM payments WHERE owner=? AND reviews_delivered>0 AND state IN ('paid','processing','delivery_pending','used') ORDER BY rowid DESC LIMIT 1").bind(owner).first():null;
    if(!order)return json({error:'payment_required'},402);
   }
   const input=await limitedJSON(request,90000);
   if(input.consent!==true||!['en','mk'].includes(input.language)||!Array.isArray(input.strings)||input.strings.length<1||input.strings.length>140||input.strings.some(text=>typeof text!=='string'||text.length>7000))return json({error:'invalid_input'},400);
   const cap=reviewLimit(env,request),ticket=await (cap===Infinity?env.DB.prepare(unlimitedBudgetSQL).bind():paymentsEnabled(env)?env.DB.prepare(reservedBudgetSQL).bind('',cap):env.DB.prepare(budgetSQL).bind(cap)).first();
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
 try{
  let ticket;
  if(payment){
   // The reservation remains counted until usage is recorded, so no gap can oversell it.
   await env.DB.prepare("INSERT INTO ai_budget(id,used) VALUES ('pilot',0) ON CONFLICT(id) DO NOTHING RETURNING id").bind().first();
   const result=await env.DB.batch([
    env.DB.prepare(reservedBudgetSQL.replace(' RETURNING used'," AND EXISTS (SELECT 1 FROM payments WHERE id=? AND state='processing' AND attempt=? AND lease_until>?) RETURNING used")).bind(payment.id,cap,payment.id,payment.attempt,Date.now()),
    env.DB.prepare("UPDATE payments SET reserved=MAX(0,reserved-1) WHERE id=? AND state='processing' AND attempt=? RETURNING id").bind(payment.id,payment.attempt)
   ]);
   ticket=result[0].results?.[0];
  }else ticket=await (cap===Infinity?env.DB.prepare(unlimitedBudgetSQL).bind():env.DB.prepare(budgetSQL).bind(cap)).first();
  if(!ticket)return await fail('pilot_limit',429);
 }catch{return fail('unavailable',503)}
 const system=reviewPrompt(input.language);
 const reviewDeadline=Date.now()+REVIEW_TIMEOUT_MS,reviewSignal=AbortSignal.timeout(REVIEW_TIMEOUT_MS);
 try{
  const {response,result}=await completeResponse(upstream,'https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.DEEPSEEK_API_KEY}`},body:JSON.stringify({model:reviewModel(env),messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({cv:input.text,vacancy:input.job,coverLetter:input.letter||''})}],thinking:{type:'disabled'},response_format:{type:'json_object'},max_tokens:8000,stream:false}),signal:reviewSignal},limitedJSON,160000);
  if(!response.ok){await response.body?.cancel();return await fail('provider_unavailable',502)}
  const choice=result.choices?.[0];if(choice?.finish_reason!=='stop'||typeof choice.message?.content!=='string')throw new Error('incomplete');
  const proposed=JSON.parse(choice.message.content);
  let validated=validateReview(proposed,input.text,input.letter||'',input.job);
  if(!validated.overview.trim()&&!['sections','priorities','suggestions','strengths','questions','jobMatches'].some(key=>validated[key].length))throw Error('verification_feedback_empty');
  // Paid reviews must include the section report advertised before checkout.
  if(payment&&(!validated.overview.trim()||!validated.sections.length||!validated.priorities.length))throw Error('verification_feedback_invalid');
  const counts={proposed:proposed.suggestions.length,anchored:validated.suggestions.length};
  if(validated.sections.length||validated.priorities.length)validated=await auditFeedback(validated,input,env,upstream,limitedJSON,AbortSignal.timeout(Math.max(1,reviewDeadline-Date.now())));
  validated.suggestions=await verifySuggestions(validated.suggestions,env,upstream,limitedJSON,AbortSignal.timeout(Math.max(1,reviewDeadline-Date.now())));
  const deliveryToken=payment?await prepareDelivery(env,payment):null;
  const output=json(validated);
  if(deliveryToken)output.headers.set('X-Review-Delivery-Token',deliveryToken);
  if(localOwnerCredit(env,request))output.headers.set('X-Review-Counts',JSON.stringify({...counts,delivered:validated.suggestions.length}));
  return output;
 }catch(error){const reason=reviewSignal.aborted||Date.now()>=reviewDeadline||['TimeoutError','AbortError'].includes(error.name)?'timeout':error.message?.startsWith('verification_')?'verification_failed':'invalid_response';return fail('review_failed',502,reason)}
}
export default {async fetch(request,env){if(new URL(request.url).pathname.startsWith('/api/'))return handleAPI(request,env);if(env.ASSETS)return env.ASSETS.fetch(request);return new Response('Not found',{status:404})},async scheduled(event,env,context){context.waitUntil(reconcilePayments(env))}};
