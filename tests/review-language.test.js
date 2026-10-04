import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackStrings,translatedFeedback} from '../src/review-language.js';
import {translateFeedback} from '../worker/review-language.js';
import {limitedJSON,handleAPI} from '../worker/index.js';
import {workshopKind} from '../src/section-workshop.js';
const review={overview:'Review',strengths:['Clear dates'],questions:['Which tools?'],priorities:[{title:'Details',why:'Brief',action:'Add duties'}],sections:[{document:'cv',name:'Profile',assessment:'Brief',actions:['Clarify focus']}],jobMatches:[{requirement:'Use Excel',evidence:'Excel',advice:'Add context'}],suggestions:[{document:'cv',original:'I help residents daily.',revised:'I assist residents daily.',reason:'Clearer'}]};
test('feedback translation preserves exact quotes and rewrites, validates complete ordered output',()=>{
 const strings=feedbackStrings(review),result=translatedFeedback(review,strings.map(text=>'МК '+text));
 assert.equal(result.sections[0].name,'МК Profile');assert.equal(result.suggestions[0].original,review.suggestions[0].original);assert.equal(result.suggestions[0].revised,review.suggestions[0].revised);assert.equal(result.jobMatches[0].evidence,'Excel');assert.equal(result.jobMatches[0].requirement,'Use Excel');assert.equal(review.sections[0].name,'Profile');
 assert.equal(workshopKind({...result.sections[0],name:'Позиционирање'}),'profile');
 assert.throws(()=>translatedFeedback(review,['Incomplete']),/translation_invalid/);assert.throws(()=>translatedFeedback(review,strings.map(()=>'')),/translation_invalid/);
});
test('provider translates commentary into the requested language and rejects incomplete output',async()=>{
 const transport=async(url,options)=>{const body=JSON.parse(options.body);assert.match(body.messages[0].content,/Macedonian/);assert.deepEqual(JSON.parse(body.messages[1].content),{strings:['Profile']});return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({strings:['Профил']})}}]})};
 assert.deepEqual(await translateFeedback(['Profile'],'mk',{DEEPSEEK_API_KEY:'fake'},transport,limitedJSON),['Профил']);
 await assert.rejects(translateFeedback(['Profile'],'mk',{DEEPSEEK_API_KEY:'fake'},async()=>Response.json({choices:[{finish_reason:'stop',message:{content:'{"strings":[]}'}}]}),limitedJSON),/translation_invalid/);
});
test('translation endpoint rejects cross-origin and unowned public requests before a provider call',async()=>{
 const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:'fake',DB:{}};let calls=0;
 const request=origin=>new Request('https://cv.example/api/review/language',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({consent:true,language:'mk',strings:['Profile']})});
 assert.equal((await handleAPI(request('https://other.example'),env,()=>calls++)).status,403);assert.equal((await handleAPI(request('https://cv.example'),env,()=>calls++)).status,402);assert.equal(calls,0);
});

test('guarded local translation reserves an attempt and delivers provider output without a payment',async()=>{
 let reservations=0,calls=0;
 const env={AI_PRIVACY_APPROVED:'true',AI_ENABLED:'true',AI_MAX_REVIEWS:'10',DEEPSEEK_API_KEY:'fake',PAYMENTS_ENABLED:'test',STRIPE_SECRET_KEY:'sk_test_fake',LOCAL_TEST_REPAIR_ATTEMPT:'true',LOCAL_TEST_OWNER_CREDIT:'true',LOCAL_TEST_UNLIMITED_REVIEWS:'true',DB:{prepare:()=>({bind:()=>({first:async()=>{reservations++;return{used:11}}})})}};
 const request=new Request('http://localhost:5174/api/review/language',{method:'POST',headers:{Origin:'http://localhost:5174','Content-Type':'application/json'},body:JSON.stringify({language:'mk',consent:true,strings:['Profile']})});
 const result=await handleAPI(request,env,async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:'{"strings":["Профил"]}'}}]})});
 assert.equal(result.status,200);assert.deepEqual(await result.json(),{strings:['Профил']});assert.equal(reservations,1);assert.equal(calls,1);
});
