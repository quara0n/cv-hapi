import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalDatabase,localTestEnvironment} from '../scripts/local-test-runtime.mjs';
import {handleAPI} from '../worker/index.js';
import {reviewLimit} from '../worker/ai-config.js';

test('upgrading an existing owner database preserves purchased review credits',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cvhapi-campaign-upgrade-')),path=join(dir,'test.sqlite');
 try{
  let db=createLocalDatabase(path);
  db.prepare("INSERT INTO payments(id,owner,state,currency,amount,review_count,reviews_delivered) VALUES ('existing','owner','paid','mkd',15000,3,1)").run();
  db.exec('ALTER TABLE payments DROP COLUMN campaign');db.close();
  db=createLocalDatabase(path);
  assert.deepEqual({...db.prepare('SELECT campaign,state,amount,review_count,reviews_delivered FROM payments').get()},{campaign:'none',state:'paid',amount:15000,review_count:3,reviews_delivered:1});
  db.close();db=createLocalDatabase(path);assert.equal(db.prepare('SELECT campaign FROM payments').get().campaign,'none');db.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('unlimited local owner reviews keep counting attempts and never unlock hosted or live usage',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'cvhapi-unlimited-'));
 try{
  const db=createLocalDatabase(join(dir,'test.sqlite'));db.prepare("UPDATE ai_budget SET used=15 WHERE id='pilot'").run();
  const env=localTestEnvironment({STRIPE_SECRET_KEY:'sk_test_fake',DEEPSEEK_API_KEY:'fake',LOCAL_TEST_REPAIR_ATTEMPT:'true',LOCAL_TEST_OWNER_CREDIT:'true',LOCAL_TEST_UNLIMITED_REVIEWS:'true'},db);
  assert.equal(reviewLimit(env,new Request('http://localhost:5174/api/review')),Infinity);
  assert.equal(reviewLimit(env,new Request('https://cvhapi.com/api/review')),10);
  assert.equal(reviewLimit({...env,PAYMENTS_ENABLED:'live',STRIPE_SECRET_KEY:'sk_live_fake'},new Request('http://localhost:5174/api/review')),10);
  assert.equal(reviewLimit({...env,LOCAL_TEST_OWNER_CREDIT:'false'},new Request('http://localhost:5174/api/review')),15);
  const provider=async()=>Response.json({choices:[{finish_reason:'stop',message:{content:'{"overview":"Reviewed","suggestions":[]}'}}]});
  for(let attempt=0;attempt<3;attempt++)assert.equal((await handleAPI(new Request('http://localhost:5174/api/review',{method:'POST',headers:{Origin:'http://localhost:5174','Content-Type':'application/json'},body:JSON.stringify({text:'An experienced assistant who helps customers find suitable products and communicates clearly with colleagues.',job:'',language:'en',consent:true})}),env,provider)).status,200);
  assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,18);
  assert.deepEqual(await (await handleAPI(new Request('http://localhost:5174/api/review/status'),env)).json(),{available:true,remaining:null,unlimited:true});
  assert.equal((await (await handleAPI(new Request('https://cvhapi.com/api/review/status'),env)).json()).available,false);db.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('complimentary owner review is bounded and cannot bypass hosted or live payments',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'cvhapi-credit-')),path=join(dir,'test.sqlite');
 try{
  const db=createLocalDatabase(path);db.prepare("UPDATE ai_budget SET used=14 WHERE id='pilot'").run();
  const env=localTestEnvironment({STRIPE_SECRET_KEY:'sk_test_fake',DEEPSEEK_API_KEY:'fake',DEEPSEEK_MODEL:'deepseek-v4-pro',LOCAL_TEST_REPAIR_ATTEMPT:'true',LOCAL_TEST_OWNER_CREDIT:'true'},db);
  const requestFor=origin=>new Request(`${origin}/api/review`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({text:'An experienced assistant who helps customers find suitable products and communicates clearly with colleagues.',job:'',language:'en',consent:true})});
  let calls=0;const provider=async(url,options)=>{calls++;assert.equal(JSON.parse(options.body).model,'deepseek-v4-pro');return Response.json({choices:[{finish_reason:'stop',message:{content:'{"overview":"Reviewed","suggestions":[]}'}}]})};
  assert.equal((await handleAPI(requestFor('https://cvhapi.com'),env,provider)).status,402);
  assert.equal((await handleAPI(requestFor('http://localhost:5174'),{...env,PAYMENTS_ENABLED:'live',STRIPE_SECRET_KEY:'sk_live_fake'},provider)).status,402);
  assert.equal(calls,0);
  const config=await (await handleAPI(new Request('http://localhost:5174/api/payments/config'),env)).json();assert.equal(config.ownerCredit,true);assert.equal(config.checkoutEnabled,false);
  const hosted=await (await handleAPI(new Request('https://cvhapi.com/api/payments/config'),env)).json();assert.equal(hosted.ownerCredit,undefined);
  assert.equal((await handleAPI(requestFor('http://localhost:5174'),env,provider)).status,200);
  assert.equal((await handleAPI(requestFor('http://localhost:5174'),env,provider)).status,429);assert.equal(calls,1);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,15);db.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('an additional owner attempt cannot expand the hosted or live-payment allowance',()=>{
 const env={AI_MAX_REVIEWS:'10',LOCAL_TEST_EXTRA_ATTEMPT:'true',PAYMENTS_ENABLED:'test',STRIPE_SECRET_KEY:'sk_test_fake'};
 assert.equal(reviewLimit(env,new Request('http://localhost:5174/api/review')),11);
 assert.equal(reviewLimit(env,new Request('https://cvhapi.com/api/review')),10);
 assert.equal(reviewLimit({...env,PAYMENTS_ENABLED:'live',STRIPE_SECRET_KEY:'sk_live_fake'},new Request('http://localhost:5174/api/review')),10);
 env.LOCAL_TEST_FINAL_ATTEMPT='true';
 assert.equal(reviewLimit(env,new Request('http://localhost:5174/api/review')),12);
 assert.equal(reviewLimit(env,new Request('https://cvhapi.com/api/review')),10);
 assert.equal(reviewLimit({...env,PAYMENTS_ENABLED:'live',STRIPE_SECRET_KEY:'sk_live_fake'},new Request('http://localhost:5174/api/review')),10);
});

test('local Stripe test rejects live credentials and does not unlock unpaid reviews',async()=>{
 const env=localTestEnvironment({STRIPE_SECRET_KEY:'sk_live_fake',DEEPSEEK_API_KEY:'fake'},{});
 assert.equal(env.AI_ENABLED,'false');assert.equal(env.STRIPE_SECRET_KEY,'');assert.equal(env.PAYMENTS_ENABLED,'test');
});
test('local review allowance persists across restarts and does not reset used attempts',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'cvhapi-local-')),path=join(dir,'test.sqlite');
 try{
  let db=createLocalDatabase(path);assert.equal(db.prepare("SELECT used FROM ai_budget WHERE id='pilot'").get().used,9);
  const env=localTestEnvironment({STRIPE_SECRET_KEY:'sk_test_fake',DEEPSEEK_API_KEY:'fake'},db);
  const req=new Request('http://localhost:5174/api/review',{method:'POST',headers:{Origin:'http://localhost:5174','Content-Type':'application/json'},body:JSON.stringify({text:'A'.repeat(100),job:'',language:'en',consent:true})});
  let calls=0;const response=await handleAPI(req,env,async()=>{calls++;throw Error('No provider call allowed')});
  assert.equal(response.status,402);assert.equal(calls,0);assert.equal(db.prepare("SELECT used FROM ai_budget WHERE id='pilot'").get().used,9);
  db.prepare("UPDATE ai_budget SET used=10 WHERE id='pilot'").run();db.close();
  db=createLocalDatabase(path);assert.equal(db.prepare("SELECT used FROM ai_budget WHERE id='pilot'").get().used,10);db.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
