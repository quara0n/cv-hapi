import test from 'node:test';
import assert from 'node:assert/strict';
import {verifySuggestions} from '../worker/factual-review.js';

const suggestions=[
 {document:'cv',original:'Helped customers choose products',revised:'Advised customers on product choices',reason:'Clarity'},
 {document:'cv',original:'Handled checkout transactions',revised:'Handled cash and card payments accurately',reason:'Detail'}
];
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
test('a quoted original does not permit unsupported facts in its revision',async()=>{
 let calls=0;
 const transport=async(url,options)=>{
  calls++;
  const body=JSON.parse(options.body),input=JSON.parse(body.messages[1].content);
  assert.deepEqual(input.suggestions.map(x=>x.original),suggestions.map(x=>x.original));
  assert.match(body.messages[0].content,/cash.*card/);
  return response({decisions:[{id:0,supported:true},{id:1,supported:false}]});
 };
 assert.deepEqual(await verifySuggestions(suggestions,{DEEPSEEK_API_KEY:'test'},transport),[suggestions[0]]);
 assert.equal(calls,1);
});
test('factual verification fails closed on missing, duplicate or malformed decisions',async()=>{
 for(const decisions of [[],[{id:0,supported:true}],[{id:0,supported:true},{id:0,supported:true}],[{id:0,supported:'true'},{id:1,supported:true}]]){
  await assert.rejects(verifySuggestions(suggestions,{DEEPSEEK_API_KEY:'test'},async()=>response({decisions})));
 }
 await assert.rejects(verifySuggestions(suggestions,{DEEPSEEK_API_KEY:'test'},async()=>new Response('',{status:503})));
 assert.deepEqual(await verifySuggestions([],{},async()=>{throw Error('must not call')}),[]);
});
test('invented numbers are rejected even when the verifier approves them',async()=>{
 const added={...suggestions[0],revised:'Helped 200 customers choose products'};
 assert.deepEqual(await verifySuggestions([added],{DEEPSEEK_API_KEY:'test'},async()=>response({decisions:[{id:0,supported:true}]})),[]);
});
