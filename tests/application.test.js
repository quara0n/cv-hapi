import test from 'node:test';
import assert from 'node:assert/strict';
import {blank} from '../src/model.js';
import {draftLetter,applicationDocument,evidenceOptions} from '../src/application.js';

test('application uses only supplied evidence and keeps original CV unchanged',()=>{
 const cv={...blank(),name:'Тест Кандидат',summary:'Original',experience:[{title:'Sales',organization:'Shop',start:'2022',end:'2024',description:'Served customers.'}]};
 const before=structuredClone(cv),pack={role:'Assistant',company:'Example',why:'I enjoy helping customers.',evidence:[evidenceOptions(cv)[0].text],language:'en',summary:'My edited profile'};
 pack.letter=draftLetter({...pack,name:cv.name});const doc=applicationDocument(cv,pack);
 assert.deepEqual(cv,before);assert.match(pack.letter,/Served customers\./);assert.doesNotMatch(pack.letter,/manager|increased|%/i);
 assert.ok(doc.content.some(x=>x.pageBreak==='before'));assert.ok(JSON.stringify(doc).includes('My edited profile'));assert.ok(JSON.stringify(doc).includes('Served customers.'));
});
test('Macedonian letter keeps user text rather than pretending to translate it',()=>{
 const letter=draftLetter({name:'Тест',role:'Продавач',company:'',why:'English user text',evidence:['Работа на каса'],language:'mk'});
 assert.match(letter,/Почитувани/);assert.match(letter,/English user text/);assert.match(letter,/Работа на каса/);assert.doesNotMatch(letter,/undefined/);
});
test('letter includes employer needs and bullets every evidence line',()=>{
 for(const language of ['en','mk']){
  const letter=draftLetter({name:'Candidate',role:'Assistant',company:'Shop',requirement:'Friendly service and accurate cash handling',why:'My reason.',evidence:['Served customers.\nTrained colleagues.\n\n• Handled cash.'],language});
  assert.match(letter,/Friendly service and accurate cash handling/);
  assert.match(letter,/• Served customers\.\n• Trained colleagues\.\n• Handled cash\./);
  assert.doesNotMatch(letter,/• •|undefined/);
 }
});
