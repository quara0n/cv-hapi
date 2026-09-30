import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {localReview,applySuggestion,validateReview,cvText} from '../src/review-core.js';
import {handleAPI,budgetSQL} from '../worker/index.js';
import {blank} from '../src/model.js';
const source='Customer service assistant. Helped customers choose products and handled checkout transactions. Worked at Example Shop from 2022 to 2024.';
test('API filters added cash handling and does not deliver unchecked revisions when verification fails',async()=>{
 for(const verificationFails of [false,true]){
  const {db,binding}=database();let calls=0;
  const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'1',DEEPSEEK_API_KEY:'test',DB:binding};
  const provider=async(url,options)=>{
   calls++;const body=JSON.parse(options.body);
   if(body.messages[0].content.startsWith('Verify proposed')){
    if(verificationFails)return new Response('',{status:503});
    return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({decisions:[{id:0,supported:false}]})}}]});
   }
   return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({overview:'Check your wording.',suggestions:[{original:'handled checkout transactions',revised:'Handled cash and card payments accurately',reason:'Specificity'}]})}}]});
  };
  const result=await handleAPI(request(),env,provider);
  assert.equal(result.status,verificationFails?502:200);
  const body=await result.json();if(verificationFails)assert.equal(body.error,'review_failed');else assert.deepEqual(body.suggestions,[]);
  assert.equal(calls,2);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,1);db.close();
 }
});
test('reviewed PDF styles a single-line-break imported CV without losing revised wording',async()=>{
 const {reviewedDocument}=await import('../src/review-core.js');
 const lines=['Rune Example','Chiropractor','Kopervik · example@example.com','PROFILE','I focus on the whole person and help people tolerate physical loads.','WORK EXPERIENCE','Health worker','Example Municipality | 2010 – 2011',"Assistant at a children’s home.",'SKILLS','Communication','LANGUAGES','English','Norwegian'];
 const revised=applySuggestion(lines.join('\n'),{original:'Communication',revised:'Communicating with people'});
 const doc=reviewedDocument(revised,'My checked cover letter.');
 assert.equal(doc.content[0].text,'Rune Example');
 assert.equal(doc.content[0].style,'name');
 assert.ok(doc.styles.name.fontSize>=28);
 assert.deepEqual(doc.content.filter(x=>x.style==='heading').map(x=>x.text),['PROFILE','WORK EXPERIENCE','SKILLS','LANGUAGES']);
 assert.deepEqual(doc.content.filter(x=>typeof x.text==='string').map(x=>x.text),[...revised.split('\n'),'My checked cover letter.']);
 assert.equal(doc.content.at(-1).pageBreak,'before');
 assert.equal(doc.pageBreakBefore({style:'heading'},[]),true);
});
test('reviewed PDF handles CRLF, blank paragraphs and Macedonian headings',async()=>{
 const {reviewedDocument}=await import('../src/review-core.js');
 const doc=reviewedDocument('Ана Пример\r\n\r\nПРОФИЛ\r\nМојот профил.\r\n\r\nОБРАЗОВАНИЕ\r\nУниверзитет');
 assert.deepEqual(doc.content.filter(x=>x.style==='heading').map(x=>x.text),['ПРОФИЛ','ОБРАЗОВАНИЕ']);
 assert.equal(doc.content[0].text,'Ана Пример');
 assert.equal(doc.content.filter(x=>x.text==='Мојот профил.').length,1);
});

test('reviewed PDF repairs spacing within recognized imported headings only',async()=>{
 const {reviewedDocument}=await import('../src/review-core.js');
 const doc=reviewedDocument('Rune Example\nSKILLS\nUnderstanding people\nL ANGUAGES\nEnglish\nNorwegian\nSpanish\nРАБОТНО И СКУСТВО\nA custom line');
 assert.deepEqual(doc.content.filter(x=>x.style==='heading').map(x=>x.text),['SKILLS','LANGUAGES','РАБОТНО ИСКУСТВО']);
 assert.ok(doc.content.some(x=>x.text==='Understanding people'));assert.ok(doc.content.some(x=>x.text==='A custom line'));
});
test('unverified API privacy blocks submission before quota and provider access',async()=>{const {db,binding}=database();const env={AI_ENABLED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:'test',DB:binding};let calls=0;assert.equal((await handleAPI(request(),env,async()=>{calls++})).status,503);assert.deepEqual(await (await handleAPI(new Request('https://cv.example/api/review/status'),env)).json(),{available:false,remaining:null,reason:'privacy_pending'});assert.equal(calls,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM ai_budget').get().n,0);db.close()});
test('status reflects remaining lifetime capacity and fails closed on database errors',async()=>{const {db,binding}=database();const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:'test-only',DB:binding};const status=()=>handleAPI(new Request('https://cv.example/api/review/status'),env);assert.deepEqual(await (await status()).json(),{available:true,remaining:10});db.prepare("INSERT INTO ai_budget VALUES ('pilot',10)").run();assert.deepEqual(await (await status()).json(),{available:false,remaining:0});db.close();assert.equal((await status()).status,503)});
test('false payment setting permits free reviews while unknown modes fail closed',async()=>{const {db,binding}=database();const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:'test-only',DB:binding,PAYMENTS_ENABLED:'false'};let calls=0;const provider=async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({overview:'Reviewed',strengths:[],questions:[],suggestions:[]})}}]})};assert.equal((await handleAPI(request(),env,provider)).status,200);assert.equal(calls,1);env.PAYMENTS_ENABLED='typo';assert.equal((await handleAPI(request(),env,provider)).status,503);assert.equal(calls,1);db.close()});
const request=(body={},headers={})=>new Request('https://cv.example/api/review',{method:'POST',headers:{Origin:'https://cv.example','Content-Type':'application/json',...headers},body:JSON.stringify({text:source,job:'Customer service and Excel',language:'en',consent:true,...body})});
function database(){const db=new DatabaseSync(':memory:');db.exec(readFileSync('drizzle/0000_sad_george_stacy.sql','utf8'));return{db,binding:{prepare:sql=>({bind:(...args)=>({first:async()=>db.prepare(sql).get(...args)})})}}}
test('review matches whole words and only applies a quoted suggestion',()=>{const result=localReview('Excel and customer service. Test@example.com 2024','Excel sales');assert.deepEqual(result.matched,['excel']);assert.deepEqual(result.missing,['sales']);assert.deepEqual(localReview('Excel','Excel plus experience').missing,[]);assert.equal(result.hasEmail,true);assert.throws(()=>applySuggestion(source,{original:'invented',revised:'Other'}));assert.equal(applySuggestion('Original text',{original:'Original text',revised:'Keep $& literally'}),'Keep $& literally');assert.equal(validateReview({overview:'OK',suggestions:[{original:'not in source',revised:'Made up',reason:'x'}]},source).suggestions.length,0);assert.equal(cvText(blank()),'')});
test('AI never calls provider without configuration, consent and same origin',async()=>{let calls=0;const provider=async()=>{calls++;throw Error()};const {db,binding}=database();const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:'test-only',DB:binding};assert.equal((await handleAPI(request(),{},provider)).status,503);assert.equal((await handleAPI(request({consent:false}),env,provider)).status,400);assert.equal((await handleAPI(request({}, {Origin:'https://evil.example'}),env,provider)).status,403);assert.equal((await handleAPI(request({text:'a'.repeat(20001)}),env,provider)).status,400);assert.equal(calls,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ai_budget').get().n,0);db.close()});
test('durable lifetime cap permits ten concurrent reservations and never stores CV data',async()=>{const {db,binding}=database();const results=await Promise.all(Array.from({length:30},()=>binding.prepare(budgetSQL).bind(10).first()));assert.equal(results.filter(Boolean).length,10);assert.deepEqual({...db.prepare('SELECT * FROM ai_budget').get()},{id:'pilot',used:10});db.close()});
test('provider output is validated and quota is enforced before provider call',async()=>{const {db,binding}=database();const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'1',DEEPSEEK_API_KEY:'test-only',DB:binding};let calls=0;const provider=async(url,options)=>{calls++;assert.equal(url,'https://api.deepseek.com/chat/completions');const body=JSON.parse(options.body);assert.equal(body.model,'deepseek-flash');assert.equal(body.max_tokens,2200);if(body.messages[0].content.startsWith('Verify proposed'))return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({decisions:[{id:0,supported:true}]})}}]});return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({overview:'Make the work specific.',strengths:['Dates are clear'],questions:['What did you achieve?'],suggestions:[{original:'Helped customers choose products',revised:'Advised customers on product choices',reason:'Use a precise action verb.'},{original:'Managed 50 people',revised:'Led 50 people',reason:'Unsupported'}]})}}]})};const response=await handleAPI(request(),env,provider);assert.equal(response.status,200);assert.equal((await response.json()).suggestions.length,1);assert.equal((await handleAPI(request(),env,provider)).status,429);assert.equal(calls,2);db.close()});

test('letter suggestions are anchored to their own document and exported together',async()=>{
 const {reviewedDocument,reviewedText}=await import('../src/review-core.js');
 const letter='I enjoy helping customers find suitable products.';
 const suggestion={document:'letter',original:letter,revised:'I enjoy helping customers select suitable products.',reason:'Clarity'};
 const value={overview:'Review',suggestions:[suggestion,{...suggestion,document:'cv'},{...suggestion,document:'other'}]};
 assert.deepEqual(validateReview(value,source,letter).suggestions,[suggestion]);
 assert.equal(validateReview(value,source).suggestions.length,0);
 assert.match(reviewedText(source,letter),/Cover letter/);
 assert.equal(reviewedDocument(source,letter).content.at(-1).text,letter);
 const {db,binding}=database();let calls=0;
 const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:'test',DB:binding};
 const provider=async(url,options)=>{calls++;const body=JSON.parse(options.body);if(body.messages[0].content.startsWith('Verify proposed'))return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({decisions:[{id:0,supported:true}]})}}]});assert.equal(JSON.parse(body.messages[1].content).coverLetter,letter);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]})};
 for(const invalid of [42,null,'x'.repeat(10001)])assert.equal((await handleAPI(request({letter:invalid}),env,provider)).status,400);
 const result=await handleAPI(request({letter}),env,provider);assert.equal(result.status,200);assert.equal((await result.json()).suggestions.length,1);assert.equal(calls,2);assert.equal(db.prepare('SELECT used FROM ai_budget').get().used,1);db.close();
});
