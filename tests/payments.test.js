import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {verifySignature,handlePayments,hash,claimPayment,finishPayment,paymentsEnabled} from '../worker/payments.js';
import {handleAPI} from '../worker/index.js';
function setup(){const db=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(`drizzle/${file}`,'utf8'));return{db,env:{PAYMENTS_ENABLED:'test',STRIPE_SECRET_KEY:'sk_test_fake',STRIPE_WEBHOOK_SECRET:'whsec_fake',AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',DEEPSEEK_API_KEY:'fake',AI_MAX_REVIEWS:'10',DB:{prepare:sql=>({bind:(...args)=>({first:async()=>db.prepare(sql).get(...args)})})}}}}
const req=(path,method='GET',cookie)=>new Request(`https://cv.example/api/payments/${path}`,{method,headers:{Origin:'https://cv.example',...(cookie?{Cookie:cookie}:{})}});

test('paid reviews fail closed and persist confirmed refunds for provider failures and empty reports',async()=>{
 for(const failure of ['empty','overview_only','provider','verification','timeout']){
  const {db,env}=setup(),token='d'.repeat(64);let aiCalls=0;const stripeCalls=[];
  db.prepare("INSERT INTO payments VALUES ('failed-review',?,'cs','pi','paid')").run(await hash(token));
  const text='Care assistant. Helped residents with meals and daily activities. Worked with colleagues at Example Home.';
  const upstream=async(url,options)=>{
   if(new URL(url).hostname==='api.stripe.com'){stripeCalls.push([new URL(url).pathname,options.method]);return Response.json(options.method==='POST'?{id:'re_test',status:'pending'}:{id:'re_test',status:'succeeded'})}
   aiCalls++;
   if(failure==='timeout')throw new DOMException('Timed out','TimeoutError');
   if(failure==='provider'||(failure==='verification'&&aiCalls===2))return new Response('',{status:503});
   return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(failure==='empty'?{overview:'',suggestions:[]}:failure==='overview_only'?{overview:'Reviewed.',suggestions:[]}:{overview:'Clearer wording.',sections:[{document:'cv',name:'Experience',assessment:'Brief duties.',actions:['Add an actual example.']}],priorities:[{title:'Add detail',why:'Duties are brief.',action:'Describe your actual responsibilities.'}],suggestions:[{original:'Helped residents with meals',revised:'Assisted residents with meals',reason:'Clarity'}]})}}]});
  };
  const request=new Request('https://cv.example/api/review',{method:'POST',headers:{Origin:'https://cv.example',Cookie:`__Host-cvhapi-payment=${token}`,'Content-Type':'application/json'},body:JSON.stringify({text,job:'',language:'en',consent:true})});
  const response=await handleAPI(request,env,upstream),body=await response.json();
  assert.equal(response.status,502,failure);assert.equal(body.payment,'refunded');assert.equal(db.prepare('SELECT state FROM payments').get().state,'refunded');
  assert.deepEqual(stripeCalls,[['/v1/refunds','POST'],['/v1/refunds/re_test','GET']]);assert.equal(aiCalls,failure==='verification'?2:1);db.close();
 }
});
test('checkout pause blocks new charges while preserving an already-paid entitlement',async()=>{
 const {db,env}=setup();env.CHECKOUT_ENABLED='false';let calls=0;const upstream=async()=>{calls++;throw Error('No new Stripe request permitted')};
 const response=await handlePayments(req('checkout','POST'),env,upstream);assert.equal(response.status,503);assert.equal((await response.json()).error,'checkout_paused');assert.equal(calls,0);
 const config=await (await handlePayments(req('config'),env)).json();assert.equal(config.enabled,true);assert.equal(config.checkoutEnabled,false);
 const token='c'.repeat(64);db.prepare("INSERT INTO payments VALUES ('paused-order',?,'cs','pi','paid')").run(await hash(token));
 assert.deepEqual(await (await handlePayments(req('status','GET',`__Host-cvhapi-payment=${token}`),env,upstream)).json(),{state:'paid'});
 assert.ok(await claimPayment(req('status','GET',`__Host-cvhapi-payment=${token}`),env));assert.equal(calls,0);db.close();
});
test('privacy pause prevents new checkout without blocking existing payment status',async()=>{const {db,env}=setup();delete env.AI_PRIVACY_APPROVED;let calls=0;const transport=async()=>{calls++;throw Error()};const config=await (await handlePayments(req('config'),env)).json();assert.equal(config.enabled,false);assert.equal(config.amount,200);assert.equal(config.currency,'eur');assert.equal((await handlePayments(req('checkout','POST'),env,transport)).status,503);assert.deepEqual(await (await handlePayments(req('status'),env,transport)).json(),{state:'none'});assert.equal(calls,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM payments').get().n,0);db.close()});
async function sign(raw,time=Math.floor(Date.now()/1000)){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('whsec_fake'),{name:'HMAC',hash:'SHA-256'},false,['sign']);return `t=${time},v1=${Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${time}.${raw}`))).toString('hex')}`}
test('webhook rejects tampering and stale signatures',async()=>{const raw='{"test":true}',signature=await sign(raw);assert.equal(await verifySignature(raw,signature,'whsec_fake'),true);assert.equal(await verifySignature(raw+' ',signature,'whsec_fake'),false);assert.equal(await verifySignature(raw,await sign(raw,1),'whsec_fake'),false)});
test('payments are disabled by default and cannot accept live keys',async()=>{assert.equal((await handlePayments(req('checkout','POST'),{})).status,503);assert.equal((await handlePayments(req('checkout','POST'),{PAYMENTS_ENABLED:'test',STRIPE_SECRET_KEY:'sk_live_example',STRIPE_WEBHOOK_SECRET:'test',DB:{}})).status,503)});
test('restricted keys enable only their matching payment mode',async()=>{
 const {db,env}=setup();
 for(const mode of ['test','live']){
  env.PAYMENTS_ENABLED=mode;
  for(const type of ['sk','rk']){
   env.STRIPE_SECRET_KEY=`${type}_${mode}_fake`;assert.equal(paymentsEnabled(env),true);
   env.STRIPE_SECRET_KEY=`${type}_${mode==='test'?'live':'test'}_fake`;assert.equal(paymentsEnabled(env),false);
  }
 }
 for(const key of ['pk_live_fake','rk_unknown_fake','prefix_rk_live_fake','']){env.STRIPE_SECRET_KEY=key;assert.equal(paymentsEnabled(env),false)}
 env.STRIPE_SECRET_KEY='rk_live_fake';
 const response=await handlePayments(req('checkout','POST'),env,async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer rk_live_fake');
  return Response.json({id:'cs_live_restricted',url:'https://checkout.stripe.com/c/pay/live_restricted'});
 });
 assert.equal(response.status,200);db.close();
});
test('live checkout requires matching live credentials and preserves the EUR2 total',async()=>{
 const {db,env}=setup();env.PAYMENTS_ENABLED='live';
 assert.equal(paymentsEnabled(env),false);env.STRIPE_SECRET_KEY='sk_live_fake';assert.equal(paymentsEnabled(env),true);
 assert.deepEqual(await (await handlePayments(req('config'),env)).json(),{enabled:true,test:false,amount:200,currency:'eur'});
 const response=await handlePayments(req('checkout','POST'),env,async(url,options)=>{
  assert.equal(options.body.get('line_items[0][price_data][unit_amount]'),'200');
  assert.equal(options.body.get('line_items[0][price_data][product_data][name]'),'CV Hapi — one AI review');
  return Response.json({id:'cs_live',url:'https://checkout.stripe.com/c/pay/live'});
 });
 assert.equal(response.status,200);db.close();
});
test('live entitlement rejects sandbox completion and refund-before-completion cannot unlock an order',async()=>{
 const {db,env}=setup();env.PAYMENTS_ENABLED='live';env.STRIPE_SECRET_KEY='sk_live_fake';
 db.prepare("INSERT INTO payments VALUES ('o','owner','cs_live',NULL,'pending')").run();
 const session={id:'cs_live',client_reference_id:'o',mode:'payment',payment_status:'paid',livemode:true,amount_total:200,currency:'eur',payment_intent:'pi_live'};
 const webhook=async(type,object)=>{
  const raw=JSON.stringify({type,data:{object}});
  return handlePayments(new Request('https://cv.example/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':await sign(raw)},body:raw}),env,async url=>{
   assert.match(url,/checkout\/sessions\?payment_intent=pi_live/);return Response.json({data:[session]});
  });
 };
 await webhook('checkout.session.completed',{...session,livemode:false});assert.equal(db.prepare('SELECT state FROM payments').get().state,'pending');
 await webhook('charge.refunded',{payment_intent:'pi_live',amount_refunded:100,livemode:true});
 assert.equal(db.prepare('SELECT state FROM payments').get().state,'refunded');
 await webhook('checkout.session.completed',session);assert.equal(db.prepare('SELECT state FROM payments').get().state,'refunded');
 db.prepare("UPDATE payments SET state='pending',intent=NULL").run();
 await webhook('checkout.session.completed',session);assert.equal(db.prepare('SELECT state FROM payments').get().state,'paid');db.close();
});
test('checkout fixes price, uses secure cookie and never sends CV content',async()=>{const {db,env}=setup();let call;const response=await handlePayments(req('checkout','POST'),env,async(url,options)=>{call={url,options};return Response.json({id:'cs_test_a',url:'https://checkout.stripe.com/c/pay/test_a'})});assert.equal(response.status,200);assert.match(response.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Lax/);assert.equal(call.options.body.get('line_items[0][price_data][unit_amount]'),'200');assert.equal(call.options.body.get('line_items[0][price_data][currency]'),'eur');assert.equal(call.options.body.get('mode'),'payment');assert.equal(db.prepare('SELECT count(*) n FROM payments').get().n,1);assert.equal(db.prepare('SELECT count(*) n FROM ai_budget').get().n,0);db.close()});
test('signed paid webhook unlocks one use, replay cannot restore used purchase',async()=>{const {db,env}=setup(),token='a'.repeat(64),owner=await hash(token);db.prepare("INSERT INTO payments VALUES (?,?,?,NULL,'pending')").run('order',owner,'cs_test_a');const session={id:'cs_test_a',client_reference_id:'order',mode:'payment',payment_status:'paid',livemode:false,amount_total:200,currency:'eur',payment_intent:'pi_test_a'};const webhook=async object=>{const raw=JSON.stringify({type:'checkout.session.completed',data:{object}});return handlePayments(new Request('https://cv.example/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':await sign(raw)},body:raw}),env)};await webhook({...session,amount_total:1});assert.equal(db.prepare('SELECT state FROM payments').get().state,'pending');await webhook(session);const request=req('status','GET',`__Host-cvhapi-payment=${token}`);const claims=await Promise.all([claimPayment(request,env),claimPayment(request,env)]);assert.equal(claims.filter(Boolean).length,1);await finishPayment(env,claims.find(Boolean),true);await webhook(session);assert.equal(db.prepare('SELECT state FROM payments').get().state,'used');db.close()});
test('refund retries use same idempotency key and distinguish pending from succeeded',async()=>{const {db,env}=setup();db.prepare("INSERT INTO payments VALUES ('o','owner','cs','pi','processing')").run();const order=db.prepare('SELECT * FROM payments').get();let keys=[];const transport=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return Response.json({status:keys.length===1?'pending':'succeeded'})};assert.equal(await finishPayment(env,order,false,transport),'refund_pending');assert.equal(await finishPayment(env,order,false,transport),'refunded');assert.deepEqual(keys,['refund-o','refund-o']);db.close()});
test('paid-mode AI rejects missing entitlement before quota or provider use',async()=>{const {db,env}=setup();let calls=0;const response=await handleAPI(new Request('https://cv.example/api/review',{method:'POST',headers:{Origin:'https://cv.example','Content-Type':'application/json'},body:JSON.stringify({text:'Customer service assistant. '.repeat(10),job:'',language:'en',consent:true})}),env,async()=>{calls++;throw Error()});assert.equal(response.status,402);assert.equal(calls,0);assert.equal(db.prepare('SELECT count(*) n FROM ai_budget').get().n,0);db.close()});
test('quota exhaustion refunds a verified payment without calling AI or resetting quota',async()=>{const {db,env}=setup(),token='b'.repeat(64);db.prepare("INSERT INTO ai_budget VALUES ('pilot',10)").run();db.prepare("INSERT INTO payments VALUES ('o',?,'cs','pi','paid')").run(await hash(token));let calls=[];const response=await handleAPI(new Request('https://cv.example/api/review',{method:'POST',headers:{Origin:'https://cv.example','Content-Type':'application/json',Cookie:`__Host-cvhapi-payment=${token}`},body:JSON.stringify({text:'Customer service assistant. '.repeat(10),job:'',language:'en',consent:true})}),env,async url=>{calls.push(url);return Response.json({status:'succeeded'})});assert.equal(response.status,429);assert.equal((await response.json()).payment,'refunded');assert.deepEqual(calls,['https://api.stripe.com/v1/refunds']);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,10);db.close()});
