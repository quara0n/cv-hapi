// Test and live credentials are intentionally not interchangeable.
import {privacyApproved} from './ai-config.js';
const reply=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}});
const enc=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
export const paymentsEnabled=env=>['test','live'].includes(env.PAYMENTS_ENABLED)&&new RegExp(`^(?:sk|rk)_${env.PAYMENTS_ENABLED}_`).test(env.STRIPE_SECRET_KEY||'')&&!!env.STRIPE_WEBHOOK_SECRET&&!!env.DB;
export const hash=async value=>hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));
export async function verifySignature(raw,header,secret,now=Date.now()){
 const parts=(header||'').split(',').map(v=>v.split('=')),stamp=parts.find(v=>v[0]==='t')?.[1];
 if(!/^\d+$/.test(stamp||'')||Math.abs(now/1000-Number(stamp))>300)return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 for(const [type,value] of parts){if(type==='v1'&&/^[a-f0-9]{64}$/.test(value)&&await crypto.subtle.verify('HMAC',key,Uint8Array.from(value.match(/../g),v=>parseInt(v,16)),enc.encode(`${stamp}.${raw}`)))return true}
 return false;
}
async function boundedText(message,limit=65536){
 const reader=message.body?.getReader();if(!reader)throw Error('body');const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('size')}chunks.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return new TextDecoder().decode(bytes);
}
export async function stripe(env,path,values,key,transport=fetch){
 const response=await transport(`https://api.stripe.com/v1/${path}`,{method:values?'POST':'GET',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,...(values?{'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':key}: {})},...(values?{body:new URLSearchParams(values)}:{}),signal:AbortSignal.timeout(15000)});
 if(!response.ok){await response.body?.cancel();throw Error('stripe_unavailable')}return JSON.parse(await boundedText(response));
}
export async function paymentOwner(request){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-cvhapi-payment=([a-f0-9]{64})(?:;|$)/)?.[1];return token?hash(token):null}
const first=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).first();
export async function claimPayment(request,env){
 const owner=await paymentOwner(request);if(!owner)return null;
 return first(env,"UPDATE payments SET state='processing' WHERE owner=? AND state='paid' RETURNING *",owner);
}
export async function finishPayment(env,payment,success,transport=fetch){
 if(success){await first(env,"UPDATE payments SET state='used' WHERE id=? AND state='processing' RETURNING id",payment.id);return 'used'}
 await first(env,"UPDATE payments SET state='refund_pending' WHERE id=? AND state IN ('processing','refund_pending') RETURNING id",payment.id);
 try{
  let refund=await stripe(env,'refunds',{payment_intent:payment.intent},`refund-${payment.id}`,transport);
  if(refund.status==='pending'&&refund.id)refund=await stripe(env,`refunds/${encodeURIComponent(refund.id)}`,null,null,transport);
  if(refund.status!=='succeeded')return 'refund_pending';
  await first(env,"UPDATE payments SET state='refunded' WHERE id=? AND state='refund_pending' RETURNING id",payment.id);return 'refunded';
 }catch{return 'refund_pending'}
}
async function confirmSession(env,session){
 if(session.mode!=='payment'||session.payment_status!=='paid'||session.livemode!==(env.PAYMENTS_ENABLED==='live')||session.amount_total!==200||session.currency!=='eur'||typeof session.payment_intent!=='string')return;
 await first(env,"UPDATE payments SET state='paid',intent=? WHERE id=? AND session=? AND state='pending' RETURNING id",session.payment_intent,session.client_reference_id,session.id);
}
export async function handlePayments(request,env,transport=fetch){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/payments/config')return reply({enabled:!!paymentsEnabled(env)&&privacyApproved(env),test:env.PAYMENTS_ENABLED!=='live',amount:200,currency:'eur'});
 if(!paymentsEnabled(env))return reply({error:'payments_unavailable'},503);
 try{
  if(path==='/api/payments/webhook'){
   if(request.method!=='POST')return reply({error:'method'},405);
   const raw=await boundedText(request);
   if(!await verifySignature(raw,request.headers.get('Stripe-Signature'),env.STRIPE_WEBHOOK_SECRET))return reply({error:'signature'},400);
   const event=JSON.parse(raw);
   if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))await confirmSession(env,event.data.object);
   if(event.type==='charge.refunded'&&event.data.object.amount_refunded>0&&event.data.object.livemode===(env.PAYMENTS_ENABLED==='live')){
    // A refund may arrive before the Checkout completion event.
    const charge=event.data.object;
    const order=await first(env,'SELECT * FROM payments WHERE intent=?',charge.payment_intent);
    if(order)await first(env,"UPDATE payments SET state='refunded' WHERE id=? RETURNING id",order.id);
    else if(charge.payment_intent){
     const sessions=await stripe(env,`checkout/sessions?payment_intent=${encodeURIComponent(charge.payment_intent)}&limit=10`,null,null,transport);
     for(const session of sessions.data||[])if(session.livemode===(env.PAYMENTS_ENABLED==='live'))await first(env,"UPDATE payments SET state='refunded',intent=? WHERE id=? AND session=? RETURNING id",charge.payment_intent,session.client_reference_id,session.id);
    }
   }
   return reply({received:true});
  }
  if(path==='/api/payments/status'&&request.method==='GET'){
   const owner=await paymentOwner(request);if(!owner)return reply({state:'none'});
   let order=await first(env,'SELECT * FROM payments WHERE owner=?',owner);
   if(order?.state==='pending'&&order.session){await confirmSession(env,await stripe(env,`checkout/sessions/${encodeURIComponent(order.session)}`,null,null,transport));order=await first(env,'SELECT * FROM payments WHERE owner=?',owner)}
   if(order?.state==='refund_pending')order.state=await finishPayment(env,order,false,transport);
   return reply({state:order?.state||'none'});
  }
  if(path!=='/api/payments/checkout')return reply({error:'not_found'},404);
  if(request.method!=='POST')return reply({error:'method'},405);
  if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return reply({error:'origin'},403);
  if(!privacyApproved(env))return reply({error:'privacy_pending'},503);
  if(env.AI_ENABLED!=='true'||!env.DEEPSEEK_API_KEY)return reply({error:'unavailable'},503);
  const cap=Math.min(10,Number(env.AI_MAX_REVIEWS)||0),budget=await first(env,"SELECT used FROM ai_budget WHERE id='pilot'");
  if(cap<1||(budget?.used||0)>=cap)return reply({error:'pilot_limit'},429);
  const oldOwner=await paymentOwner(request),old=oldOwner?await first(env,'SELECT * FROM payments WHERE owner=?',oldOwner):null;
  if(old&&['paid','processing','refund_pending'].includes(old.state))return reply({error:'existing_order',state:old.state},409);
  if(old?.state==='pending'&&old.session){const session=await stripe(env,`checkout/sessions/${encodeURIComponent(old.session)}`,null,null,transport);await confirmSession(env,session);if(session.status==='open'&&session.url)return reply({url:session.url});if(session.payment_status==='paid')return reply({error:'existing_order'},409)}
  const token=hex(crypto.getRandomValues(new Uint8Array(32))),owner=await hash(token),id=crypto.randomUUID();
  await first(env,"INSERT INTO payments(id,owner,state) VALUES (?,?,'pending') RETURNING id",id,owner);
  const session=await stripe(env,'checkout/sessions',{mode:'payment','payment_method_types[0]':'card','line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':'200','line_items[0][price_data][product_data][name]':`CV Hapi — one AI review${env.PAYMENTS_ENABLED==='test'?' (TEST)':''}`,'line_items[0][quantity]':'1',client_reference_id:id,success_url:`${url.origin}/payment-return.html`,cancel_url:`${url.origin}/payment-return.html`,expires_at:String(Math.floor(Date.now()/1000)+1800)},`checkout-${id}`,transport);
  if(!session.url||new URL(session.url).origin!=='https://checkout.stripe.com')throw Error('checkout_url');
  await first(env,'UPDATE payments SET session=? WHERE id=? RETURNING id',session.id,id);
  return reply({url:session.url},200,{'Set-Cookie':`__Host-cvhapi-payment=${token}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`});
 }catch{return reply({error:'payment_unavailable'},503)}
}
