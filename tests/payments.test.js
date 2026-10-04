import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {verifySignature,handlePayments,hash,claimPayment,finishPayment,paymentsEnabled} from '../worker/payments.js';
import {handleAPI} from '../worker/index.js';
import {SALES_TERMS_VERSION} from '../src/sales-terms.js';
import {sqliteBinding} from '../scripts/local-test-runtime.mjs';
function setup(){const db=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(`drizzle/${file}`,'utf8'));return{db,env:{PAYMENTS_ENABLED:'test',STRIPE_SECRET_KEY:'sk_test_fake',STRIPE_WEBHOOK_SECRET:'whsec_fake',AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',DEEPSEEK_API_KEY:'fake',AI_MAX_REVIEWS:'10',DB:sqliteBinding(db)}}}
const req=(path,method='GET',cookie='__Host-cvhapi-payment='+ '9'.repeat(64))=>new Request(`https://cv.example/api/payments/${path}`,{method,headers:{Origin:'https://cv.example',...(cookie?{Cookie:cookie}:{})},...(path==='checkout'&&method==='POST'?{body:JSON.stringify({termsAccepted:true,immediatePerformance:true,termsVersion:SALES_TERMS_VERSION})}:{})});

test('new checkout identities cannot bypass the hourly per-address reservation limit',async()=>{
 const {db,env}=setup();env.AI_MAX_REVIEWS='100';let sessions=0;
 for(let i=1;i<=6;i++){
  const request=req('checkout','POST',`__Host-cvhapi-payment=${String(i).repeat(64)}`);request.headers.set('CF-Connecting-IP','192.0.2.17');
  const response=await handlePayments(request,env,async()=>{sessions++;return Response.json({id:`cs_${sessions}`,url:`https://checkout.stripe.com/c/pay/${sessions}`})});
  assert.equal(response.status,i<=5?200:429);
  if(i===6)assert.equal((await response.json()).error,'checkout_limit');
 }
 assert.equal(sessions,5);assert.equal(db.prepare('SELECT COUNT(*) n FROM payments').get().n,5);
 assert.ok(!JSON.stringify(db.prepare('SELECT * FROM checkout_limits').all()).includes('192.0.2.17'));db.close();
});

test('legacy unpaid checkout with no expiry is reconciled against Stripe',async()=>{
 const {db,env}=setup();db.prepare("INSERT INTO payments(id,owner,session,state,reserved) VALUES ('legacy','owner','cs_legacy','pending',1)").run();
 const {reconcilePayments}=await import('../worker/payments.js');
 await reconcilePayments(env,async()=>Response.json({id:'cs_legacy',client_reference_id:'legacy',mode:'payment',livemode:false,currency:'eur',amount_total:200,status:'expired',payment_status:'unpaid'}));
 assert.deepEqual({...db.prepare('SELECT state,reserved FROM payments').get()},{state:'expired',reserved:0});db.close();
});

test('new MKD bundles reject mismatched currency and amount webhooks',async()=>{
 const {db,env}=setup();
 const checkout=await handlePayments(req('checkout','POST'),env,async(url,options)=>{assert.equal(options.body.get('line_items[0][price_data][currency]'),'mkd');return Response.json({id:'cs_pounds',url:'https://checkout.stripe.com/c/pay/pounds'})});
 assert.equal(checkout.status,200);const order=db.prepare('SELECT * FROM payments').get();assert.equal(order.currency,'mkd');
 for(const [currency,amount] of [['eur',15000],['mkd',200],['mkd',15000]]){
  const raw=JSON.stringify({type:'checkout.session.completed',data:{object:{id:'cs_pounds',client_reference_id:order.id,mode:'payment',payment_status:'paid',livemode:false,amount_total:amount,currency,payment_intent:'pi_pounds'}}});
  await handlePayments(new Request('https://cv.example/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':await sign(raw)},body:raw}),env);
  assert.equal(db.prepare('SELECT state FROM payments').get().state,currency==='mkd'&&amount===15000?'paid':'pending');
 }
 db.close();
});

test('an expired processing lease is refunded without browser polling',async()=>{
 const {db,env}=setup();
 db.prepare("INSERT INTO payments(id,owner,session,intent,state,attempt,lease_until) VALUES ('interrupted','owner','cs','pi','processing','attempt',?)").run(Date.now()-1);
 const {reconcilePayments}=await import('../worker/payments.js');let refunds=0;
 await reconcilePayments(env,async()=>{refunds++;return Response.json({id:'re_interrupted',status:'succeeded'})});
 assert.equal(db.prepare("SELECT state FROM payments WHERE id='interrupted'").get().state,'refunded');assert.equal(refunds,1);db.close();
});

test('checkout reserves the final three slots before two customers can pay and retry reuses its session',async()=>{
 const {db,env}=setup();db.prepare("INSERT INTO ai_budget VALUES ('pilot',7)").run();const keys=[];
 const transport=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return Response.json({id:'cs_last',status:'open',payment_status:'unpaid',url:'https://checkout.stripe.com/c/pay/last'})};
 const [firstBuyer,secondBuyer]=await Promise.all([handlePayments(req('checkout','POST',`__Host-cvhapi-payment=${'1'.repeat(64)}`),env,transport),handlePayments(req('checkout','POST',`__Host-cvhapi-payment=${'2'.repeat(64)}`),env,transport)]);
 assert.equal([firstBuyer.status,secondBuyer.status].filter(status=>status===200).length,1);
 assert.equal([firstBuyer.status,secondBuyer.status].filter(status=>status===429).length,1);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM payments WHERE reserved=3').get().n,1);assert.equal(keys.length,1);
 const buyer=firstBuyer.status===200?'1':'2';
 const retry=await handlePayments(req('checkout','POST',`__Host-cvhapi-payment=${buyer.repeat(64)}`),env,async()=>Response.json({status:'open',payment_status:'unpaid',url:'https://checkout.stripe.com/c/pay/last'}));
 assert.equal(retry.status,200);assert.equal(db.prepare('SELECT COUNT(*) n FROM payments').get().n,1);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,7);db.close();
});

test('checkout rejects missing sales acceptance and cannot create an anonymous orphaned order',async()=>{
 const {db,env}=setup();let calls=0;const transport=async()=>{calls++;throw Error()};
 const missing=await handlePayments(new Request('https://cv.example/api/payments/checkout',{method:'POST',headers:{Origin:'https://cv.example',Cookie:`__Host-cvhapi-payment=${'3'.repeat(64)}`},body:'{}'}),env,transport);
 assert.equal(missing.status,400);
 const anonymous=await handlePayments(req('checkout','POST',''),env,transport);assert.equal(anonymous.status,409);assert.equal(calls,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM payments').get().n,0);db.close();
});

test('a recovered orphaned checkout uses its original order key and preserves the reservation',async()=>{
 const {db,env}=setup(),cookie=`__Host-cvhapi-payment=${'4'.repeat(64)}`;let firstKey;
 const lost=await handlePayments(req('checkout','POST',cookie),env,async(url,options)=>{firstKey=options.headers['Idempotency-Key'];throw Error('response lost after Stripe accepted')});assert.equal(lost.status,503);
 const recovered=await handlePayments(req('checkout','POST',cookie),env,async(url,options)=>{assert.equal(options.headers['Idempotency-Key'],firstKey);return Response.json({id:'cs_recovered',url:'https://checkout.stripe.com/c/pay/recovered'})});
 assert.equal(recovered.status,200);assert.equal(db.prepare('SELECT COUNT(*) n FROM payments').get().n,1);assert.equal(db.prepare('SELECT reserved FROM payments').get().reserved,3);db.close();
});

test('a paid result requires the right owner and delivery token before consuming payment',async()=>{
 const {db,env}=setup(),token='e'.repeat(64);
 db.prepare("INSERT INTO payments(id,owner,session,intent,state) VALUES ('delivery',?,'cs','pi','paid')").run(await hash(token));
 const payment=await claimPayment(req('status','GET',`__Host-cvhapi-payment=${token}`),env);
 const {prepareDelivery}=await import('../worker/payments.js');const delivery=await prepareDelivery(env,payment);
 assert.equal(db.prepare("SELECT state FROM payments WHERE id='delivery'").get().state,'delivery_pending');
 const acknowledge=(cookie,key)=>handlePayments(new Request('https://cv.example/api/payments/delivered',{method:'POST',headers:{Origin:'https://cv.example',Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({token:key})}),env);
 assert.equal((await acknowledge(`__Host-cvhapi-payment=${'f'.repeat(64)}`,delivery)).status,409);
 assert.equal((await acknowledge(`__Host-cvhapi-payment=${token}`,'wrong')).status,409);
 const firstAck=await acknowledge(`__Host-cvhapi-payment=${token}`,delivery);assert.equal(firstAck.status,200);
 const receipt=(await firstAck.json()).measurement;
 assert.match(receipt.transaction_id,/^cvhapi_[a-f0-9]{64}$/);assert.equal(receipt.amount,200);assert.equal(receipt.currency,'eur');assert.equal(receipt.state,'used');assert.equal(receipt.live,false);
 const repeatAck=await acknowledge(`__Host-cvhapi-payment=${token}`,delivery);assert.equal(repeatAck.status,200);assert.deepEqual((await repeatAck.json()).measurement,receipt);
 assert.ok(!JSON.stringify(receipt).includes(token));assert.ok(!JSON.stringify(receipt).includes(delivery));
 let calls=0;assert.equal(await finishPayment(env,payment,false,async()=>{calls++;throw Error()}),'used');assert.equal(calls,0);db.close();
});

test('lost result delivery expires to a refund and late acknowledgement cannot consume it',async()=>{
 const {db,env}=setup(),token='8'.repeat(64);
 db.prepare("INSERT INTO payments(id,owner,session,intent,state) VALUES ('lost',?,'cs','pi','paid')").run(await hash(token));
 const payment=await claimPayment(req('status','GET',`__Host-cvhapi-payment=${token}`),env);
 const {prepareDelivery,reconcilePayments}=await import('../worker/payments.js');const delivery=await prepareDelivery(env,payment);
 db.prepare("UPDATE payments SET lease_until=? WHERE id='lost'").run(Date.now()-1);
 await reconcilePayments(env,async()=>Response.json({id:'re_lost',status:'succeeded'}));
 const ack=await handlePayments(new Request('https://cv.example/api/payments/delivered',{method:'POST',headers:{Origin:'https://cv.example',Cookie:`__Host-cvhapi-payment=${token}`,'Content-Type':'application/json'},body:JSON.stringify({token:delivery})}),env);
 assert.equal(ack.status,409);assert.equal(db.prepare("SELECT state FROM payments WHERE id='lost'").get().state,'refunded');db.close();
});

test('paid reviews fail closed and persist confirmed refunds for provider failures and empty reports',async()=>{
 for(const failure of ['empty','overview_only','provider','verification','timeout']){
  const {db,env}=setup(),token='d'.repeat(64);let aiCalls=0;const stripeCalls=[];
  db.prepare("INSERT INTO payments(id,owner,session,intent,state) VALUES ('failed-review',?,'cs','pi','paid')").run(await hash(token));
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
 const token='c'.repeat(64);db.prepare("INSERT INTO payments(id,owner,session,intent,state,lease_until) VALUES ('paused-order',?,'cs','pi','paid',?)").run(await hash(token),Date.now()+86400000);
 assert.deepEqual(await (await handlePayments(req('status','GET',`__Host-cvhapi-payment=${token}`),env,upstream)).json(),{state:'paid',totalReviews:1,remainingReviews:1});
 assert.ok(await claimPayment(req('status','GET',`__Host-cvhapi-payment=${token}`),env));assert.equal(calls,0);db.close();
});
test('privacy pause prevents new checkout without blocking existing payment status',async()=>{const {db,env}=setup();delete env.AI_PRIVACY_APPROVED;let calls=0;const transport=async()=>{calls++;throw Error()};const config=await (await handlePayments(req('config'),env)).json();assert.equal(config.enabled,false);assert.equal(config.amount,15000);assert.equal(config.currency,'mkd');assert.equal((await handlePayments(req('checkout','POST'),env,transport)).status,503);assert.deepEqual(await (await handlePayments(req('status'),env,transport)).json(),{state:'none'});assert.equal(calls,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM payments').get().n,0);db.close()});
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
test('live checkout requires matching live credentials and charges the 150 MKD bundle total',async()=>{
 const {db,env}=setup();env.PAYMENTS_ENABLED='live';
 assert.equal(paymentsEnabled(env),false);env.STRIPE_SECRET_KEY='sk_live_fake';assert.equal(paymentsEnabled(env),true);
 assert.deepEqual(await (await handlePayments(req('config'),env)).json(),{enabled:true,test:false,amount:15000,currency:'mkd',reviewCount:3});
 const response=await handlePayments(req('checkout','POST'),env,async(url,options)=>{
  assert.equal(options.body.get('line_items[0][price_data][unit_amount]'),'15000');
  assert.equal(options.body.get('line_items[0][price_data][product_data][name]'),'CV Hapi — three AI reviews');
  return Response.json({id:'cs_live',url:'https://checkout.stripe.com/c/pay/live'});
 });
 assert.equal(response.status,200);db.close();
});
test('live entitlement rejects sandbox completion and refund-before-completion cannot unlock an order',async()=>{
 const {db,env}=setup();env.PAYMENTS_ENABLED='live';env.STRIPE_SECRET_KEY='sk_live_fake';
 db.prepare("INSERT INTO payments(id,owner,session,intent,state) VALUES ('o','owner','cs_live',NULL,'pending')").run();
 const session={id:'cs_live',client_reference_id:'o',mode:'payment',payment_status:'paid',livemode:true,amount_total:200,currency:'eur',payment_intent:'pi_live'};
 const webhook=async(type,object)=>{
  const raw=JSON.stringify({type,data:{object}});
  return handlePayments(new Request('https://cv.example/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':await sign(raw)},body:raw}),env,async url=>{
   assert.match(url,/checkout\/sessions\?payment_intent=pi_live/);return Response.json({data:[session]});
  });
 };
 await webhook('checkout.session.completed',{...session,livemode:false});assert.equal(db.prepare('SELECT state FROM payments').get().state,'pending');
 await webhook('charge.refunded',{payment_intent:'pi_live',amount_refunded:200,livemode:true});
 assert.equal(db.prepare('SELECT state FROM payments').get().state,'refunded');
 await webhook('checkout.session.completed',session);assert.equal(db.prepare('SELECT state FROM payments').get().state,'refunded');
 db.prepare("UPDATE payments SET state='pending',intent=NULL").run();
 await webhook('checkout.session.completed',session);assert.equal(db.prepare('SELECT state FROM payments').get().state,'paid');db.close();
});
test('checkout fixes price, uses secure cookie and never sends CV content',async()=>{const {db,env}=setup();let call;const response=await handlePayments(req('checkout','POST'),env,async(url,options)=>{call={url,options};return Response.json({id:'cs_test_a',url:'https://checkout.stripe.com/c/pay/test_a'})});assert.equal(response.status,200);assert.match((await handlePayments(req('config','GET',''),env)).headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Lax/);assert.equal(call.options.body.get('line_items[0][price_data][unit_amount]'),'15000');assert.equal(call.options.body.get('line_items[0][price_data][currency]'),'mkd');assert.equal(call.options.body.get('mode'),'payment');assert.equal(db.prepare('SELECT count(*) n FROM payments').get().n,1);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,0);db.close()});
test('signed paid webhook unlocks one use, replay cannot restore used purchase',async()=>{const {db,env}=setup(),token='a'.repeat(64),owner=await hash(token);db.prepare("INSERT INTO payments(id,owner,session,intent,state) VALUES (?,?,?,NULL,'pending')").run('order',owner,'cs_test_a');const session={id:'cs_test_a',client_reference_id:'order',mode:'payment',payment_status:'paid',livemode:false,amount_total:200,currency:'eur',payment_intent:'pi_test_a'};const webhook=async object=>{const raw=JSON.stringify({type:'checkout.session.completed',data:{object}});return handlePayments(new Request('https://cv.example/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':await sign(raw)},body:raw}),env)};await webhook({...session,amount_total:1});assert.equal(db.prepare('SELECT state FROM payments').get().state,'pending');await webhook(session);const request=req('status','GET',`__Host-cvhapi-payment=${token}`);const claims=await Promise.all([claimPayment(request,env),claimPayment(request,env)]);assert.equal(claims.filter(Boolean).length,1);const delivery=await finishPayment(env,claims.find(Boolean),true);await handlePayments(new Request('https://cv.example/api/payments/delivered',{method:'POST',headers:{Origin:'https://cv.example',Cookie:'__Host-cvhapi-payment='+token},body:JSON.stringify({token:delivery})}),env);await webhook(session);assert.equal(db.prepare('SELECT state FROM payments').get().state,'used');db.close()});
test('refund retries use same idempotency key and distinguish pending from succeeded',async()=>{const {db,env}=setup();db.prepare("INSERT INTO payments(id,owner,session,intent,state) VALUES ('o','owner','cs','pi','processing')").run();const order=db.prepare('SELECT * FROM payments').get();let keys=[];const transport=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return Response.json({status:keys.length===1?'pending':'succeeded'})};assert.equal(await finishPayment(env,order,false,transport),'refund_pending');db.prepare('UPDATE payments SET refund_retry_at=0').run();assert.equal(await finishPayment(env,order,false,transport),'refunded');assert.deepEqual(keys,['refund-o','refund-o']);db.close()});
test('paid-mode AI rejects missing entitlement before quota or provider use',async()=>{const {db,env}=setup();let calls=0;const response=await handleAPI(new Request('https://cv.example/api/review',{method:'POST',headers:{Origin:'https://cv.example','Content-Type':'application/json'},body:JSON.stringify({text:'Customer service assistant. '.repeat(10),job:'',language:'en',consent:true})}),env,async()=>{calls++;throw Error()});assert.equal(response.status,402);assert.equal(calls,0);assert.equal(db.prepare('SELECT count(*) n FROM ai_budget').get().n,0);db.close()});
test('quota exhaustion refunds a verified payment without calling AI or resetting quota',async()=>{const {db,env}=setup(),token='b'.repeat(64);db.prepare("INSERT INTO ai_budget VALUES ('pilot',10)").run();db.prepare("INSERT INTO payments(id,owner,session,intent,state) VALUES ('o',?,'cs','pi','paid')").run(await hash(token));let calls=[];const response=await handleAPI(new Request('https://cv.example/api/review',{method:'POST',headers:{Origin:'https://cv.example','Content-Type':'application/json',Cookie:`__Host-cvhapi-payment=${token}`},body:JSON.stringify({text:'Customer service assistant. '.repeat(10),job:'',language:'en',consent:true})}),env,async url=>{calls.push(url);return Response.json({status:'succeeded'})});assert.equal(response.status,429);assert.equal((await response.json()).payment,'refunded');assert.deepEqual(calls,['https://api.stripe.com/v1/refunds']);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,10);db.close()});

const paidReviewRequest=token=>new Request('https://cv.example/api/review',{method:'POST',headers:{Origin:'https://cv.example','Content-Type':'application/json',Cookie:`__Host-cvhapi-payment=${token}`},body:JSON.stringify({text:'Care assistant. Helped residents with meals and daily activities. Worked with colleagues at Example Home.',job:'',language:'en',consent:true})});

const acknowledgeBundle=(env,token,delivery)=>handlePayments(new Request('https://cv.example/api/payments/delivered',{method:'POST',headers:{Origin:'https://cv.example',Cookie:`__Host-cvhapi-payment=${token}`},body:JSON.stringify({token:delivery})}),env);
const bundleProvider=async(url,options)=>{
 assert.equal(new URL(url).hostname,'api.deepseek.com');
 const feedback={overview:'Your care duties are stated.',sections:[{document:'cv',name:'Experience',assessment:'Duties are brief.',actions:['Add actual details.']}],priorities:[{title:'Add details',why:'Duties are brief.',action:'Describe an actual responsibility.'}],strengths:[],questions:[],jobMatches:[]};
 const system=JSON.parse(options.body).messages[0].content;
 return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(system.startsWith('Audit and correct')?{feedback}:{...feedback,suggestions:[]})}}]});
};

test('one MKD purchase delivers exactly three reviews, survives ACK replay, and records one purchase identity',async()=>{
 const {db,env}=setup(),token='7'.repeat(64),owner=await hash(token);
 try{
  db.prepare("INSERT INTO ai_budget VALUES ('pilot',7)").run();
  db.prepare("INSERT INTO payments(id,owner,state,currency,amount,review_count,reserved) VALUES ('bundle',?,'paid','mkd',15000,3,3)").run(owner);
  let firstDelivery,receipt;
  for(let index=0;index<3;index++){
   const response=await handleAPI(paidReviewRequest(token),env,bundleProvider);assert.equal(response.status,200);
   const delivery=response.headers.get('X-Review-Delivery-Token');
   if(index===0)firstDelivery=delivery;
   if(index>0){const replay=await (await acknowledgeBundle(env,token,firstDelivery)).json();assert.equal(replay.remainingReviews,3-index);assert.equal(db.prepare('SELECT state FROM payments').get().state,'delivery_pending')}
   const acks=await Promise.all([acknowledgeBundle(env,token,delivery),acknowledgeBundle(env,token,delivery)]);
   for(const ack of acks){const body=await ack.json();assert.equal(body.state,'used');assert.equal(body.remainingReviews,2-index);assert.equal(body.totalReviews,3);assert.equal(body.measurement.amount,15000);assert.equal(body.measurement.currency,'mkd');if(receipt)assert.deepEqual(body.measurement,receipt);else receipt=body.measurement}
   assert.equal(db.prepare('SELECT reviews_delivered FROM payments').get().reviews_delivered,index+1);
  }
  assert.equal(db.prepare('SELECT state FROM payments').get().state,'used');assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,10);
  assert.equal((await handleAPI(paidReviewRequest(token),env,bundleProvider)).status,402);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM payment_deliveries').get().n,3);
 }finally{db.close()}
});

test('bundle claim is exclusive and idle paid credits do not expire after a day',async()=>{
 const {db,env}=setup(),token='a'.repeat(64);
 try{
  db.prepare("INSERT INTO payments(id,owner,state,currency,amount,review_count,reserved) VALUES ('idle-bundle',?,'paid','mkd',15000,3,3)").run(await hash(token));
  const {reconcilePayments}=await import('../worker/payments.js');let calls=0;
  await reconcilePayments(env,async()=>{calls++;throw Error('idle entitlement must not be refunded')});assert.equal(calls,0);
  const claims=await Promise.all([claimPayment(req('status','GET',`__Host-cvhapi-payment=${token}`),env),claimPayment(req('status','GET',`__Host-cvhapi-payment=${token}`),env)]);
  assert.equal(claims.filter(Boolean).length,1);
 }finally{db.close()}
});

test('only owned credits remain available when fewer than three global slots are left',async()=>{
 const {db,env}=setup(),token='c'.repeat(64);
 try{
  db.prepare("INSERT INTO ai_budget VALUES ('pilot',9)").run();
  const statusRequest=cookie=>new Request('https://cv.example/api/review/status',{headers:cookie?{Cookie:cookie}:{}});
  assert.equal((await (await handleAPI(statusRequest(),env)).json()).available,false);
  db.prepare("INSERT INTO payments(id,owner,state,currency,amount,review_count,reviews_delivered,reserved) VALUES ('last-owned',?,'paid','mkd',15000,3,2,1)").run(await hash(token));
  const owned=await (await handleAPI(statusRequest(`__Host-cvhapi-payment=${token}`),env)).json();assert.equal(owned.available,true);assert.equal(owned.remaining,1);
  assert.equal((await (await handleAPI(statusRequest(),env)).json()).available,false);
 }finally{db.close()}
});

test('failure after one delivered review refunds only the two undelivered credits and never refunds twice',async()=>{
 const {db,env}=setup(),token='b'.repeat(64);
 try{
  db.prepare("INSERT INTO ai_budget VALUES ('pilot',1)").run();
  db.prepare("INSERT INTO payments(id,owner,intent,state,currency,amount,review_count,reviews_delivered,reserved) VALUES ('partial-bundle',?,'pi_bundle','paid','mkd',15000,3,1,2)").run(await hash(token));
  let refunds=0;
  const transport=async(url,options)=>{if(new URL(url).hostname==='api.deepseek.com')return new Response('',{status:503});refunds++;assert.equal(options.body.get('amount'),'10000');return Response.json({id:'re_partial',status:'succeeded'})};
  const response=await handleAPI(paidReviewRequest(token),env,transport);assert.equal(response.status,502);assert.equal((await response.json()).payment,'refunded');assert.equal(refunds,1);
  const status=await (await handlePayments(req('status','GET',`__Host-cvhapi-payment=${token}`),env,transport)).json();assert.equal(status.remainingReviews,0);assert.equal(status.measurement.amount,15000);assert.equal(status.measurement.refund_amount,10000);
  assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,2);assert.equal(db.prepare('SELECT reserved FROM payments').get().reserved,0);
  assert.equal((await handleAPI(paidReviewRequest(token),env,transport)).status,402);assert.equal(refunds,1);
 }finally{db.close()}
});

test('two paid customers can concurrently spend the final two reserved review slots',async()=>{
 const {db,env}=setup();
 try{
  db.prepare("INSERT INTO ai_budget VALUES ('pilot',8)").run();
  const tokens=['1'.repeat(64),'2'.repeat(64)];
  for(const [index,token] of tokens.entries())db.prepare("INSERT INTO payments(id,owner,session,intent,state,reserved) VALUES (?,?,?,?,'paid',1)").run(`concurrent-${index}`,await hash(token),`cs_${index}`,`pi_${index}`);
  let providerCalls=0,refunds=0;
  const transport=async url=>{
   if(new URL(url).hostname==='api.deepseek.com'){providerCalls++;return new Response('',{status:503})}
   refunds++;return Response.json({id:`re_${refunds}`,status:'succeeded'});
  };
  const responses=await Promise.all(tokens.map(token=>handleAPI(paidReviewRequest(token),env,transport)));
  assert.deepEqual(responses.map(response=>response.status),[502,502]);
  for(const response of responses)assert.equal((await response.json()).payment,'refunded');
  assert.equal(providerCalls,2);assert.equal(refunds,2);
  assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,10);
  assert.deepEqual(db.prepare('SELECT state,reserved FROM payments ORDER BY id').all().map(row=>({...row})),[{state:'refunded',reserved:0},{state:'refunded',reserved:0}]);
 }finally{db.close()}
});

test('an orphaned checkout that never reached Stripe expires and releases its reservation',async()=>{
 const {db,env}=setup(),cookie=`__Host-cvhapi-payment=${'3'.repeat(64)}`;
 try{
  const lost=await handlePayments(req('checkout','POST',cookie),env,async()=>{throw Error('connection failed before Stripe accepted')});
  assert.equal(lost.status,503);
  const order=db.prepare('SELECT * FROM payments').get();
  assert.equal(order.session,null);
  db.prepare('UPDATE payments SET checkout_until=? WHERE id=?').run(Date.now()-1000,order.id);
  const {reconcilePayments}=await import('../worker/payments.js');const calls=[];
  await reconcilePayments(env,async(url,options)=>{
   calls.push(new URL(url).pathname);
   if(new URL(url).pathname==='/v1/checkout/sessions'){
    const expiry=options.body.get('expires_at');
    if(expiry&&Number(expiry)<=Date.now()/1000)return Response.json({error:{type:'invalid_request_error',param:'expires_at'}},{status:400});
    assert.equal(options.headers['Idempotency-Key'],`checkout-${order.id}`);
    return Response.json({id:'cs_orphan_expired',status:'open',payment_status:'unpaid'});
   }
   assert.equal(new URL(url).pathname,'/v1/checkout/sessions/cs_orphan_expired/expire');
   return Response.json({id:'cs_orphan_expired',status:'expired',payment_status:'unpaid'});
  });
  assert.deepEqual(calls,['/v1/checkout/sessions','/v1/checkout/sessions/cs_orphan_expired/expire']);
  assert.deepEqual({...db.prepare('SELECT state,reserved FROM payments').get()},{state:'expired',reserved:0});
  const replacement=await handlePayments(req('checkout','POST',cookie),env,async()=>Response.json({id:'cs_replacement',url:'https://checkout.stripe.com/c/pay/replacement'}));
  assert.equal(replacement.status,200);
 }finally{db.close()}
});

test('refund webhooks release capacity before or after checkout completion',async()=>{
 for(const beforeCompletion of [false,true]){
  const {db,env}=setup();
  try{
   env.AI_MAX_REVIEWS='3';
   db.prepare("INSERT INTO payments(id,owner,session,intent,state,reserved) VALUES ('dashboard-refund','owner','cs_dashboard',?,?,1)").run(beforeCompletion?null:'pi_dashboard',beforeCompletion?'pending':'paid');
   const raw=JSON.stringify({type:'charge.refunded',data:{object:{payment_intent:'pi_dashboard',amount_refunded:200,livemode:false}}});
   const response=await handlePayments(new Request('https://cv.example/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':await sign(raw)},body:raw}),env,async()=>Response.json({data:[{id:'cs_dashboard',client_reference_id:'dashboard-refund',livemode:false}]}));
   assert.equal(response.status,200);
   assert.deepEqual({...db.prepare("SELECT state,reserved FROM payments WHERE id='dashboard-refund'").get()},{state:'refunded',reserved:0});
   const checkout=await handlePayments(req('checkout','POST'),env,async()=>Response.json({id:'cs_after_refund',url:'https://checkout.stripe.com/c/pay/after-refund'}));
   assert.equal(checkout.status,200);
  }finally{db.close()}
 }
});

test('terminal refund failure becomes actionable and is not polled forever',async()=>{
 const {db,env}=setup(),token='5'.repeat(64);
 try{
  db.prepare("INSERT INTO payments(id,owner,session,intent,state,reserved) VALUES ('terminal-refund',?,'cs_terminal','pi_terminal','processing',1)").run(await hash(token));
  const order=db.prepare('SELECT * FROM payments').get();
  assert.equal(await finishPayment(env,order,false,async()=>Response.json({id:'re_failed',status:'failed'})),'refund_failed');
  assert.deepEqual({...db.prepare('SELECT state,reserved,refund_id FROM payments').get()},{state:'refund_failed',reserved:0,refund_id:'re_failed'});
  let calls=0;
  const status=await handlePayments(req('status','GET',`__Host-cvhapi-payment=${token}`),env,async()=>{calls++;throw Error('terminal refund must not be retried as pending')});
  assert.equal((await status.json()).state,'refund_failed');assert.equal(calls,0);
 }finally{db.close()}
});

test('a complete paid API review is delivered once and consumed only after browser acknowledgement',async()=>{
 const {db,env}=setup(),token='6'.repeat(64);
 try{
  db.prepare("INSERT INTO ai_budget VALUES ('pilot',0)").run();
  db.prepare("INSERT INTO payments(id,owner,session,intent,state,reserved) VALUES ('complete-review',?,'cs_complete','pi_complete','paid',1)").run(await hash(token));
  const feedback={overview:'Describe your actual care responsibilities more specifically.',sections:[{document:'cv',name:'Experience',assessment:'Your care duties are present but brief.',actions:['Describe a responsibility you actually had.']}],priorities:[{title:'Make care duties specific',why:'The current account is brief.',action:'Add an actual example of your responsibilities.'}],jobMatches:[],strengths:['The care role is stated clearly.'],questions:['What other daily tasks did you perform?']};
  const suggestion={document:'cv',original:'Helped residents with meals',revised:'Assisted residents with meals',reason:'Equivalent, clearer wording.'};
  const stages=[];
  const provider=async(url,options)=>{
   assert.equal(new URL(url).hostname,'api.deepseek.com');
   const system=JSON.parse(options.body).messages[0].content;
   let output;
   if(system.startsWith('Audit and correct')){stages.push('audit');output={feedback}}
   else if(system.startsWith('Verify proposed')){stages.push('verify');output={decisions:[{id:0,supported:true,sameLanguage:true}]}}
   else{stages.push('generate');output={...feedback,suggestions:[suggestion]}}
   return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]});
  };
  const response=await handleAPI(paidReviewRequest(token),env,provider);
  assert.equal(response.status,200);
  const report=await response.json();assert.ok(report.overview);assert.equal(report.sections.length,1);assert.equal(report.priorities.length,1);assert.equal(report.suggestions[0].revised,suggestion.revised);
  assert.deepEqual(stages,['generate','audit','verify']);
  const delivery=response.headers.get('X-Review-Delivery-Token');assert.match(delivery,/^[a-f0-9]{64}$/);
  assert.deepEqual({...db.prepare('SELECT state,reserved FROM payments').get()},{state:'delivery_pending',reserved:0});
  assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,1);
  const acknowledgement=await handlePayments(new Request('https://cv.example/api/payments/delivered',{method:'POST',headers:{Origin:'https://cv.example',Cookie:`__Host-cvhapi-payment=${token}`,'Content-Type':'application/json'},body:JSON.stringify({token:delivery})}),env);
  assert.equal(acknowledgement.status,200);assert.equal(db.prepare('SELECT state FROM payments').get().state,'used');
  const replay=await handleAPI(paidReviewRequest(token),env,provider);assert.equal(replay.status,402);assert.equal(stages.length,3);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,1);
  assert.ok(!JSON.stringify(db.prepare('SELECT * FROM payments').get()).includes(suggestion.original));
 }finally{db.close()}
});
