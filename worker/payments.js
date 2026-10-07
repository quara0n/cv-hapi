// Test and live credentials are intentionally not interchangeable.
import {privacyApproved,reviewLimit,localOwnerCredit} from './ai-config.js';
import {SALES_TERMS_VERSION} from '../src/sales-terms.js';
import {campaignCode} from '../src/campaigns.js';
const reply=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}});
export const CURRENT_OFFER=Object.freeze({currency:'mkd',amount:15000,reviewCount:3});
const entitlement=order=>order?{totalReviews:order.review_count,remainingReviews:['refunded','refund_pending','refund_failed'].includes(order.state)?0:Math.max(0,order.review_count-order.reviews_delivered)}:{};
const enc=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
export const paymentsEnabled=env=>['test','live'].includes(env.PAYMENTS_ENABLED)&&new RegExp(`^(?:sk|rk)_${env.PAYMENTS_ENABLED}_`).test(env.STRIPE_SECRET_KEY||'')&&!!env.STRIPE_WEBHOOK_SECRET&&!!env.DB;
export const hash=async value=>hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));
async function measurementReceipt(env,order){
 if(!order||(!order.reviews_delivered&&order.state!=='refunded'))return undefined;
 return {state:order.state==='refunded'?'refunded':'used',transaction_id:`cvhapi_${await hash(`measurement:${order.id}`)}`,amount:order.amount,currency:order.currency||'eur',...(order.state==='refunded'?{refund_amount:order.refund_amount||order.amount}:{}),live:env.PAYMENTS_ENABLED==='live'};
}
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
const paymentOwnerToken=request=>request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-cvhapi-payment=([a-f0-9]{64})(?:;|$)/)?.[1];
export async function paymentOwner(request){const token=paymentOwnerToken(request);return token?hash(token):null}
const first=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).first();
const ownerCookie=token=>`__Host-cvhapi-payment=${token}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000`;
async function allowCheckout(request,env){
 // Cloudflare overwrites this header at its edge. Keep only a keyed, hourly
 // digest, never the address. Forged/new owner cookies cannot bypass this cap.
 const hour=Math.floor(Date.now()/3600000),address=request.headers.get('CF-Connecting-IP')||'unknown';
 const key=await crypto.subtle.importKey('raw',enc.encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bucket=hex(await crypto.subtle.sign('HMAC',key,enc.encode(`checkout:${hour}:${address}`)));
 await first(env,'DELETE FROM checkout_limits WHERE expires<=? RETURNING id',Date.now());
 return first(env,'INSERT INTO checkout_limits(id,used,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET used=used+1 WHERE used<5 RETURNING used',bucket,(hour+1)*3600000);
}
async function checkoutSession(env,order,transport){
 // Keep the creation body stable even when recovery happens after our local lease.
 // Reconciliation expires open Stripe sessions before releasing their reservation.
 return stripe(env,'checkout/sessions',{...(campaignCode(order.campaign)!=='none'?{'metadata[campaign]':order.campaign}:{}),mode:'payment','payment_method_types[0]':'card','line_items[0][price_data][currency]':order.currency,'line_items[0][price_data][unit_amount]':String(order.amount),'line_items[0][price_data][product_data][name]':`CV Hapi — ${order.review_count===3?'three AI reviews':'one AI review'}${env.PAYMENTS_ENABLED==='test'?' (TEST)':''}`,'line_items[0][quantity]':'1',client_reference_id:order.id,success_url:`${order.checkout_origin}/payment-return.html?language=${order.checkout_language}`,cancel_url:`${order.checkout_origin}/payment-return.html?language=${order.checkout_language}`},`checkout-${order.id}`,transport);
}
export async function claimPayment(request,env){
 const owner=await paymentOwner(request);if(!owner)return null;
 return first(env,"UPDATE payments SET state='processing',attempt=?,lease_until=? WHERE owner=? AND state='paid' AND reviews_delivered<review_count RETURNING *",crypto.randomUUID(),Date.now()+240000,owner);
}
export async function prepareDelivery(env,payment){
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 const changed=await first(env,"UPDATE payments SET state='delivery_pending',delivery_hash=?,lease_until=? WHERE id=? AND state='processing' AND attempt=? AND lease_until>? RETURNING id",await hash(token),Date.now()+600000,payment.id,payment.attempt,Date.now());
 if(!changed)throw Error('delivery_expired');
 return token;
}
export async function finishPayment(env,payment,success,transport=fetch){
 // Completion is acknowledged by the browser, never by generation alone.
 if(success)return prepareDelivery(env,payment);
 const changed=await first(env,"UPDATE payments SET state='refund_pending',reserved=0,refund_amount=CAST((amount*(review_count-reviews_delivered)+review_count-1)/review_count AS INTEGER) WHERE id=? AND state='processing' AND attempt IS ? RETURNING *",payment.id,payment.attempt||null);
 const order=changed||await first(env,'SELECT * FROM payments WHERE id=?',payment.id);
 if(order?.state!=='refund_pending')return order?.state||'unavailable';
 // A retry lease prevents concurrent status checks/jobs from hammering Stripe.
 const locked=await first(env,"UPDATE payments SET refund_retry_at=? WHERE id=? AND state='refund_pending' AND refund_retry_at<=? RETURNING *",Date.now()+60000,payment.id,Date.now());
 if(!locked)return 'refund_pending';
 try{
  let refund=locked.refund_id?await stripe(env,`refunds/${encodeURIComponent(locked.refund_id)}`,null,null,transport):await stripe(env,'refunds',{payment_intent:locked.intent,...(locked.refund_amount>0&&locked.refund_amount<locked.amount?{amount:String(locked.refund_amount)}:{})},`refund-${payment.id}`,transport);
  if(refund.id&&refund.id!==locked.refund_id)await first(env,"UPDATE payments SET refund_id=? WHERE id=? AND state='refund_pending' RETURNING id",refund.id,payment.id);
  if(!locked.refund_id&&refund.status==='pending'&&refund.id)refund=await stripe(env,`refunds/${encodeURIComponent(refund.id)}`,null,null,transport);
  if(['failed','canceled'].includes(refund.status)){
   await first(env,"UPDATE payments SET state='refund_failed',reserved=0 WHERE id=? AND state='refund_pending' RETURNING id",payment.id);return 'refund_failed';
  }
  if(refund.status!=='succeeded')return 'refund_pending';
  await first(env,"UPDATE payments SET state='refunded' WHERE id=? AND state='refund_pending' RETURNING id",payment.id);return 'refunded';
 }catch{return 'refund_pending'}
}
export async function reconcilePayments(env,transport=fetch,scopeOwner=null){
 if(!paymentsEnabled(env))return {processed:0};
 let processed=0;
 // Bounded work per call; every transition is guarded against an ACK race.
 for(let i=0;i<5;i++){
  const order=await first(env,"SELECT * FROM payments WHERE ((state IN ('paid','processing','delivery_pending') AND (state!='paid' OR lease_until IS NOT NULL) AND COALESCE(lease_until,0)<=?) OR (state='refund_pending' AND refund_retry_at<=?)) AND (owner=? OR ? IS NULL) ORDER BY COALESCE(lease_until,0),id LIMIT 1",Date.now(),Date.now(),scopeOwner,scopeOwner);
  if(!order)break;
  if(order.state!=='refund_pending'){
   const changed=await first(env,"UPDATE payments SET state='refund_pending',reserved=0,refund_amount=CAST((amount*(review_count-reviews_delivered)+review_count-1)/review_count AS INTEGER) WHERE id=? AND state IN ('paid','processing','delivery_pending') AND (state!='paid' OR lease_until IS NOT NULL) AND COALESCE(lease_until,0)<=? RETURNING id",order.id,Date.now());
   if(!changed)continue;
  }
  await finishPayment(env,order,false,transport);processed++;
 }
 for(let i=0;i<5;i++){
  const order=await first(env,"SELECT * FROM payments WHERE state='pending' AND reserved>0 AND COALESCE(checkout_until,0)<=? AND refund_retry_at<=? AND (owner=? OR ? IS NULL) ORDER BY checkout_until LIMIT 1",Date.now(),Date.now(),scopeOwner,scopeOwner);
  if(!order)break;
  const locked=await first(env,"UPDATE payments SET refund_retry_at=? WHERE id=? AND state='pending' AND refund_retry_at<=? RETURNING id",Date.now()+60000,order.id,Date.now());
  if(!locked)continue;
  try{
   // Reusing the creation key recovers an orphaned session without a second checkout.
   if(!order.session&&!order.checkout_origin)continue;
   let session=order.session?await stripe(env,`checkout/sessions/${encodeURIComponent(order.session)}`,null,null,transport):await checkoutSession(env,order,transport);
   if(!order.session&&session.id)await first(env,"UPDATE payments SET session=? WHERE id=? AND state='pending' RETURNING id",session.id,order.id);
   await confirmSession(env,session);
   if(session.payment_status!=='paid'&&session.status==='open')session=await stripe(env,`checkout/sessions/${encodeURIComponent(session.id)}/expire`,{},`expire-${order.id}`,transport);
   if(session.status==='expired'&&session.payment_status!=='paid')await first(env,"UPDATE payments SET state='expired',reserved=0 WHERE id=? AND state='pending' RETURNING id",order.id);
  }catch{/* Keep the reservation until Stripe confirms that no paid session can redeem it. */}
  processed++;
 }
 const failed=await first(env,"SELECT COUNT(*) n FROM payments WHERE state='refund_failed'");
 return {processed,refundFailures:failed?.n||0};
}
async function confirmSession(env,session){
 if(session.mode!=='payment'||session.livemode!==(env.PAYMENTS_ENABLED==='live'))return;
 const order=await first(env,'SELECT currency,amount,review_count FROM payments WHERE id=? AND (session=? OR session IS NULL)',session.client_reference_id,session.id);
 if(!order||session.currency!==order.currency||session.amount_total!==order.amount)return;
 if(session.status==='expired'&&session.payment_status!=='paid'){
  await first(env,"UPDATE payments SET state='expired',reserved=0 WHERE id=? AND session=? AND state='pending' RETURNING id",session.client_reference_id,session.id);return;
 }
 if(session.payment_status!=='paid'||typeof session.payment_intent!=='string')return;
 await first(env,"UPDATE payments SET state='paid',intent=?,session=?,lease_until=? WHERE id=? AND (session=? OR session IS NULL) AND state='pending' RETURNING id",session.payment_intent,session.id,order.review_count>1?null:Date.now()+86400000,session.client_reference_id,session.id);
 // A delayed completion after confirmed expiry must refund rather than oversell capacity.
 await first(env,"UPDATE payments SET state='refund_pending',intent=?,session=?,reserved=0 WHERE id=? AND state='expired' RETURNING id",session.payment_intent,session.id,session.client_reference_id);
}
export async function handlePayments(request,env,transport=fetch){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/payments/config'){
  const existingToken=paymentOwnerToken(request);
  // Refresh existing customer cookies too; otherwise a pre-bundle cookie would
  // still expire after its original seven days despite unused paid credits.
  const token=paymentsEnabled(env)?existingToken||hex(crypto.getRandomValues(new Uint8Array(32))):null;
  return reply({enabled:!!paymentsEnabled(env)&&privacyApproved(env),test:env.PAYMENTS_ENABLED!=='live',amount:CURRENT_OFFER.amount,currency:CURRENT_OFFER.currency,reviewCount:CURRENT_OFFER.reviewCount,...(localOwnerCredit(env,request)?{ownerCredit:true}:{}),...(env.CHECKOUT_ENABLED==='false'?{checkoutEnabled:false}:{})},200,token?{'Set-Cookie':ownerCookie(token)}:{});
 }
 if(!paymentsEnabled(env))return reply({error:'payments_unavailable'},503);
 try{
  if(path==='/api/payments/reconcile'&&request.method==='POST'){
   // This exposes no customer records or caller-selected refund. It only settles
   // server-defined expired leases, with per-order retry locks and a bounded batch.
   return reply(await reconcilePayments(env,transport));
  }
  if(path==='/api/payments/delivered'){
   if(request.method!=='POST')return reply({error:'method'},405);
   if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return reply({error:'origin'},403);
   const owner=await paymentOwner(request),body=JSON.parse(await boundedText(request,1024));
   if(!owner||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))return reply({error:'delivery_token'},409);
   const tokenHash=await hash(body.token);
   // Ledger insertion and credit consumption form one transaction. Replaying any
   // previous delivery token cannot consume a subsequent review's allowance.
   await env.DB.batch([
    env.DB.prepare("INSERT INTO payment_deliveries(token_hash,payment_id) SELECT delivery_hash,id FROM payments WHERE owner=? AND state='delivery_pending' AND delivery_hash=? AND lease_until>? ON CONFLICT DO NOTHING").bind(owner,tokenHash,Date.now()),
    env.DB.prepare("UPDATE payments SET reviews_delivered=reviews_delivered+1,state=CASE WHEN reviews_delivered+1<review_count THEN 'paid' ELSE 'used' END,lease_until=NULL,reserved=CASE WHEN reviews_delivered+1>=review_count THEN 0 ELSE reserved END WHERE owner=? AND state='delivery_pending' AND delivery_hash=? AND lease_until>? RETURNING id").bind(owner,tokenHash,Date.now())
   ]);
   const delivered=await first(env,'SELECT p.* FROM payments p JOIN payment_deliveries d ON d.payment_id=p.id WHERE p.owner=? AND d.token_hash=?',owner,tokenHash);
   return delivered?reply({state:'used',...entitlement(delivered),measurement:await measurementReceipt(env,delivered)}):reply({error:'delivery_expired'},409);
  }
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
   if(order&&charge.amount_refunded>=(order.refund_amount||order.amount))await first(env,"UPDATE payments SET state='refunded',reserved=0,refund_amount=? WHERE id=? RETURNING id",charge.amount_refunded,order.id);
    else if(!order&&charge.payment_intent){
     const sessions=await stripe(env,`checkout/sessions?payment_intent=${encodeURIComponent(charge.payment_intent)}&limit=10`,null,null,transport);
     for(const session of sessions.data||[])if(session.livemode===(env.PAYMENTS_ENABLED==='live'))await first(env,"UPDATE payments SET state='refunded',reserved=0,intent=?,refund_amount=? WHERE id=? AND session=? AND amount<=? RETURNING id",charge.payment_intent,charge.amount_refunded,session.client_reference_id,session.id,charge.amount_refunded);
    }
   }
   return reply({received:true});
  }
  if(path==='/api/payments/status'&&request.method==='GET'){
   const owner=await paymentOwner(request);if(!owner)return reply({state:'none'});
   await reconcilePayments(env,transport,owner);
   let order=await first(env,'SELECT * FROM payments WHERE owner=? ORDER BY rowid DESC LIMIT 1',owner);
   if(order?.state==='pending'&&order.session){await confirmSession(env,await stripe(env,`checkout/sessions/${encodeURIComponent(order.session)}`,null,null,transport));order=await first(env,'SELECT * FROM payments WHERE owner=? ORDER BY rowid DESC LIMIT 1',owner)}
   if(order?.state==='refund_pending')order.state=await finishPayment(env,order,false,transport);
   return reply({state:order?.state||'none',...entitlement(order),measurement:await measurementReceipt(env,order)});
  }
  if(path!=='/api/payments/checkout')return reply({error:'not_found'},404);
  if(request.method!=='POST')return reply({error:'method'},405);
  if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return reply({error:'origin'},403);
  if(env.CHECKOUT_ENABLED==='false')return reply({error:'checkout_paused'},503);
  if(!privacyApproved(env))return reply({error:'privacy_pending'},503);
  if(env.AI_ENABLED!=='true'||!env.DEEPSEEK_API_KEY)return reply({error:'unavailable'},503);
  const acceptance=JSON.parse(await boundedText(request,2048));
  if(acceptance.termsAccepted!==true||acceptance.immediatePerformance!==true||acceptance.termsVersion!==SALES_TERMS_VERSION)return reply({error:'terms_required'},400);
  const cap=reviewLimit(env,request),budget=await first(env,"SELECT used FROM ai_budget WHERE id='pilot'");
  if(cap<1||(budget?.used||0)>=cap)return reply({error:'pilot_limit'},429);
  const oldOwner=await paymentOwner(request);
 if(!oldOwner)return reply({error:'owner_required'},409);
  await reconcilePayments(env,transport,oldOwner);
  const old=await first(env,'SELECT * FROM payments WHERE owner=? ORDER BY rowid DESC LIMIT 1',oldOwner);
  if(old&&['paid','processing','delivery_pending','refund_pending','refund_failed'].includes(old.state))return reply({error:'existing_order',state:old.state},409);
  if(old?.state==='pending'&&old.session){
   const session=await stripe(env,`checkout/sessions/${encodeURIComponent(old.session)}`,null,null,transport);await confirmSession(env,session);
   if(session.payment_status==='paid')return reply({error:'existing_order'},409);
   if(session.status==='open'&&session.url){
    if(old.currency===CURRENT_OFFER.currency&&old.amount===CURRENT_OFFER.amount&&old.review_count===CURRENT_OFFER.reviewCount)return reply({url:session.url});
    const expired=await stripe(env,`checkout/sessions/${encodeURIComponent(old.session)}/expire`,{},`currency-change-${old.id}`,transport);
    if(expired.status!=='expired'||expired.payment_status==='paid')throw Error('checkout_currency');
    await first(env,"UPDATE payments SET state='expired',reserved=0 WHERE id=? AND state='pending' RETURNING id",old.id);
   }
  }
  const id=crypto.randomUUID();
  if(old?.state!=='pending'&&!await allowCheckout(request,env))return reply({error:'checkout_limit'},429);
  await first(env,"INSERT INTO ai_budget(id,used) VALUES ('pilot',0) ON CONFLICT(id) DO NOTHING RETURNING id");
  // One atomic SQL statement reserves the final slot and deduplicates active orders.
  const inserted=await first(env,"INSERT INTO payments(id,owner,state,reserved,checkout_until,checkout_origin,checkout_language,terms_version,currency,amount,review_count,campaign) SELECT ?,?,'pending',?,?,?,?,?,?,?,?,? WHERE (SELECT used FROM ai_budget WHERE id='pilot')+(SELECT COALESCE(SUM(reserved),0) FROM payments)+?<=? ON CONFLICT DO NOTHING RETURNING *",id,oldOwner,CURRENT_OFFER.reviewCount,Date.now()+1830000,url.origin,url.searchParams.get('language')==='mk'?'mk':'en',SALES_TERMS_VERSION,CURRENT_OFFER.currency,CURRENT_OFFER.amount,CURRENT_OFFER.reviewCount,acceptance.analyticsConsent===true?campaignCode(acceptance.campaign):'none',CURRENT_OFFER.reviewCount,cap);
  const order=inserted||await first(env,"SELECT * FROM payments WHERE owner=? AND state='pending' ORDER BY rowid DESC LIMIT 1",oldOwner);
  if(!order)return reply({error:'pilot_limit'},429);
  const session=await checkoutSession(env,order,transport);
  if(!session.url||new URL(session.url).origin!=='https://checkout.stripe.com')throw Error('checkout_url');
  await first(env,'UPDATE payments SET session=? WHERE id=? AND session IS NULL RETURNING id',session.id,order.id);
  return reply({url:session.url});
 }catch{return reply({error:'payment_unavailable'},503)}
}
