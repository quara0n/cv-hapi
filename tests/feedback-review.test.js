import test from 'node:test';
import assert from 'node:assert/strict';
import {auditFeedback,removeInventedMetrics} from '../worker/feedback-review.js';
import {limitedJSON} from '../worker/index.js';

const input={text:'Healthcare worker. I assisted a social educator at a children\'s home.',job:'Answer customer questions.',letter:'',language:'en'};
const suggestions=[{document:'cv',original:'I assisted a social educator',revised:'Assisted a social educator',reason:'Concise'}];
const review={overview:'This may cause immediate rejection.',priorities:[{title:'Qualifications',why:'Not listed.',action:'Remove the title.'}],sections:[{document:'cv',name:'Experience',assessment:'Limited duties described.',actions:['Describe actual duties.']}],jobMatches:[],strengths:[],questions:[],suggestions};
const feedback={...review,overview:'The CV does not state your qualifications.',priorities:[{title:'Clarify qualifications',why:'The CV does not list them.',action:'Add your actual education if applicable.'}],jobMatches:[{requirement:'Answer customer questions',evidence:'',advice:'Describe relevant experience if applicable.'},{requirement:'Use Excel',evidence:'',advice:'Not in the vacancy.'}]};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});

test('report audit corrects advice, anchors evidence and cannot add rewrites',async()=>{
 let calls=0;
 const transport=async(url,options)=>{
  calls++;const body=JSON.parse(options.body),payload=JSON.parse(body.messages[1].content);
  assert.equal(body.model,'deepseek-v4-pro');assert.equal(body.max_tokens,8000);
  assert.equal(payload.cv,input.text);assert.equal(payload.feedback.overview,review.overview);assert.equal(payload.feedback.suggestions,undefined);
  assert.match(body.messages[0].content,/Never predict rejection/);
  return response({feedback:{...feedback,suggestions:[{original:input.text,revised:'Invented replacement',reason:'Wrong'}]}});
 };
 const result=await auditFeedback(review,input,{DEEPSEEK_API_KEY:'test',DEEPSEEK_MODEL:'deepseek-v4-pro'},transport,limitedJSON,AbortSignal.timeout(1000));
 assert.equal(calls,1);assert.equal(result.overview,feedback.overview);assert.deepEqual(result.suggestions,suggestions);assert.deepEqual(result.jobMatches,[feedback.jobMatches[0]]);
});

test('incomplete or malformed editorial feedback fails closed',async()=>{
 for(const value of [{},{feedback:{overview:'Partial'}},{feedback:{...feedback,sections:[]}}])await assert.rejects(auditFeedback(review,input,{DEEPSEEK_API_KEY:'test'},async()=>response(value),limitedJSON,AbortSignal.timeout(1000)),/verification_feedback_invalid/);
 await assert.rejects(auditFeedback(review,input,{DEEPSEEK_API_KEY:'test'},async()=>new Response('',{status:503}),limitedJSON,AbortSignal.timeout(1000)),/verification_feedback_unavailable/);
});

test('feedback replaces ungrounded quantity examples while preserving real quantities, quotes and document rewrites',()=>{
 const report={...review,overview:'Use 2-3 sentences.',sections:[{document:'cv',name:'Работно искуство',assessment:'A useful starting point.',actions:['примам во просек 50 палети месечно (доколку е точно).','Работам со 4 клиенти.','Reduced errors by 20%.']}],jobMatches:[{requirement:'50 pallets',evidence:'4 clients',advice:'Describe 50 pallets if true.'}]};
 const result=removeInventedMetrics(report,{text:'I help 4 clients.',letter:'',language:'mk'});
 assert.match(result.sections[0].actions[0],/\[твојата вистинска бројка\] палети/);assert.equal(result.sections[0].actions[1],'Работам со 4 клиенти.');assert.match(result.sections[0].actions[2],/\[твојата вистинска бројка\]%/);
 assert.equal(result.overview,'Use 2-3 sentences.');assert.equal(result.jobMatches[0].requirement,'50 pallets');assert.equal(result.jobMatches[0].evidence,'4 clients');assert.deepEqual(result.suggestions,suggestions);assert.equal(report.sections[0].actions[0],'примам во просек 50 палети месечно (доколку е точно).');
 const english=removeInventedMetrics(report,{text:'',language:'en'});assert.match(english.jobMatches[0].advice,/\[your actual number\] pallets/);
});
