import test from 'node:test';
import assert from 'node:assert/strict';
import {verifySuggestions} from '../worker/factual-review.js';

const suggestions=[
 {document:'cv',original:'Helped customers choose products',revised:'Advised customers on product choices',reason:'Clarity'},
 {document:'cv',original:'Handled checkout transactions',revised:'Handled cash and card payments accurately',reason:'Detail'}
];
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
test('a factually equivalent translation is rejected independently of factual support',async()=>{
 const translated={document:'cv',original:'God til å lage mat',revised:'Skilled at cooking',reason:'Translation'};
 const grammar={document:'cv',original:'I read fast',revised:'Fast reader',reason:'Parallel phrasing'};
 const transport=async()=>response({decisions:[{id:0,supported:true,sameLanguage:false},{id:1,supported:true,sameLanguage:true}]});
 assert.deepEqual(await verifySuggestions([translated,grammar],{DEEPSEEK_API_KEY:'test'},transport),[grammar]);
});
test('a quoted original does not permit unsupported facts in its revision',async()=>{
 let calls=0;
 const transport=async(url,options)=>{
  calls++;
  const body=JSON.parse(options.body),input=JSON.parse(body.messages[1].content);
  assert.deepEqual(input.suggestions.map(x=>x.original),suggestions.map(x=>x.original));
  assert.match(body.messages[0].content,/cash.*card/);
  return response({decisions:[{id:0,supported:true,sameLanguage:true},{id:1,supported:false,sameLanguage:true}]});
 };
 assert.deepEqual(await verifySuggestions(suggestions,{DEEPSEEK_API_KEY:'test'},transport),[suggestions[0]]);
 assert.equal(calls,1);
});
test('factual verification fails closed on missing, duplicate or malformed decisions',async()=>{
 await assert.rejects(verifySuggestions([suggestions[0]],{DEEPSEEK_API_KEY:'test'},async()=>response({decisions:[{id:0,supported:true}]})),/verification_invalid/);
 await assert.rejects(verifySuggestions([suggestions[0]],{DEEPSEEK_API_KEY:'test'},async()=>response({decisions:[{id:0,supported:true,sameLanguage:'true'}]})),/verification_invalid/);
 for(const decisions of [[],[{id:0,supported:true,sameLanguage:true}],[{id:0,supported:true,sameLanguage:true},{id:0,supported:true,sameLanguage:true}],[{id:0,supported:'true'},{id:1,supported:true,sameLanguage:true}]]){
  await assert.rejects(verifySuggestions(suggestions,{DEEPSEEK_API_KEY:'test'},async()=>response({decisions})));
 }
 await assert.rejects(verifySuggestions(suggestions,{DEEPSEEK_API_KEY:'test'},async()=>new Response('',{status:503})));
 assert.deepEqual(await verifySuggestions([],{},async()=>{throw Error('must not call')}),[]);
});
test('invented numbers are rejected even when the verifier approves them',async()=>{
 const added={...suggestions[0],revised:'Helped 200 customers choose products'};
 assert.deepEqual(await verifySuggestions([added],{DEEPSEEK_API_KEY:'test'},async()=>response({decisions:[{id:0,supported:true,sameLanguage:true}]})),[]);
});

test('new explanatory duty expansions are rejected even when the verifier approves them',async()=>{
 const expanded={document:'cv',original:'Водам евиденција на залихи во Excel.',revised:'Водам евиденција на залихи во Excel, вклучувајќи ажурирање на податоците за приеми и издавања.',reason:'Detail'};
 const contact={document:'cv',original:'Скопје | aleksandar@example.com',revised:'Скопје | Е-пошта: aleksandar@example.com',reason:'Contact labels'};
 assert.deepEqual(await verifySuggestions([expanded,contact],{DEEPSEEK_API_KEY:'test'},async()=>response({decisions:[{id:0,supported:true,sameLanguage:true},{id:1,supported:true,sameLanguage:true}]})),[contact]);
});
