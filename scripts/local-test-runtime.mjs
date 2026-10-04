import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';

// Nine prior production attempts were verified on 1 October 2026.
// The ignored local database records the remaining attempt across restarts.
export function createLocalDatabase(path){
 const db=new DatabaseSync(path);
 if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_budget'").get()){
  db.exec('BEGIN');
  try{
   for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(`drizzle/${file}`,'utf8'));
   db.prepare("INSERT INTO ai_budget(id,used) VALUES ('pilot',9)").run();db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');db.close();throw error}
 }
 return db;
}
export function localTestEnvironment(values,db){
 const key=values.STRIPE_SECRET_KEY||'',testKey=/^(sk|rk)_test_/.test(key);
 return {
  PAYMENTS_ENABLED:'test',CHECKOUT_ENABLED:values.LOCAL_TEST_OWNER_CREDIT==='true'?'false':'true',STRIPE_SECRET_KEY:testKey?key:'',
  // Status polling verifies directly with Stripe; no webhook forwarding needed.
  STRIPE_WEBHOOK_SECRET:randomBytes(32).toString('hex'),
  AI_ENABLED:testKey&&!!values.DEEPSEEK_API_KEY?'true':'false',
  AI_PRIVACY_APPROVED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:values.DEEPSEEK_API_KEY||'',LOCAL_TEST_EXTRA_ATTEMPT:values.LOCAL_TEST_EXTRA_ATTEMPT||'false',LOCAL_TEST_FINAL_ATTEMPT:values.LOCAL_TEST_FINAL_ATTEMPT||'false',
  DEEPSEEK_MODEL:values.DEEPSEEK_MODEL||'deepseek-flash',LOCAL_TEST_REPAIR_ATTEMPT:values.LOCAL_TEST_REPAIR_ATTEMPT||'false',LOCAL_TEST_OWNER_CREDIT:values.LOCAL_TEST_OWNER_CREDIT||'false',
  LOCAL_TEST_UNLIMITED_REVIEWS:values.LOCAL_TEST_UNLIMITED_REVIEWS||'false',
  DB:{prepare:sql=>({bind:(...args)=>({first:async()=>db.prepare(sql).get(...args)})})}
 };
}
