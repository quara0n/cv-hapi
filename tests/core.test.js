import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,blank,escapeHtml,documentDefinition,example,cvWarnings} from '../src/model.js';
import {safeProperties,attribution} from '../src/telemetry-core.js';
test('restored drafts reject malformed records and bound content',()=>{const d=normalize({name:'a'.repeat(400),experience:[null,42,{title:'Real',description:100}],template:'<script>',accent:'url(evil)',language:'bad'});assert.equal(d.name.length,100);assert.equal(d.experience.length,1);assert.equal(d.experience[0].title,'Real');assert.equal(d.experience[0].description,'');assert.equal(d.template,'modern');assert.equal(d.accent,'#234bff');assert.deepEqual(normalize(null),blank())});
test('preview escapes untrusted HTML',()=>assert.equal(escapeHtml('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;'));
test('CV warnings flag malformed emails and reversed comparable dates without rejecting free-text dates',()=>{
 const cv={...blank(),email:'marko@',experience:[{start:'2022',end:'2019'}],education:[{start:'2020-09',end:'2020-06'}]};
 assert.deepEqual(cvWarnings(cv).map(x=>x.field),['email','experience-0-end','education-0-end']);
 assert.deepEqual(cvWarnings({...blank(),email:'marko@example.com',experience:[{start:'2022',end:'Present'},{start:'September 2020',end:'June 2021'},{start:'2020',end:'2020-01'}]}),[]);
});
test('PDF bullets multi-line descriptions and omits truly empty entries',()=>{
 const doc=documentDefinition({...blank(),name:'Candidate',language:'en',experience:[{title:'Assistant',description:'Served customers.\n• Trained colleagues.'}],education:[{title:' ',organization:' ',description:' '}]});
 const list=doc.content.find(x=>x.ul);assert.deepEqual(list.ul,['Served customers.','Trained colleagues.']);
 assert.ok(!doc.content.some(x=>x.text==='EDUCATION'));
});
test('PDF omits empty sections and preserves Macedonian content',()=>{const d=documentDefinition({...blank(),name:'Ѓорѓи Ќосев',summary:'Љубов, Њ, Џ, Ѕ'});assert.ok(JSON.stringify(d.content).includes('Ѓорѓи Ќосев'));assert.ok(!JSON.stringify(d.content).includes('РАБОТНО ИСКУСТВО'));const en=documentDefinition({...blank(),...example,language:'en'});assert.ok(JSON.stringify(en.content).includes('WORK EXPERIENCE'));assert.ok(JSON.stringify(en.content).includes('Ана Стојановска'))});
test('analytics strips all personal and arbitrary properties',()=>{assert.deepEqual(safeProperties({name:'Private',email:'private@example.com',step:3,template:'classic',message:'Secret CV',url:'https://example.com?email=x'}),{step:3,template:'classic'});assert.deepEqual(safeProperties({step:99,template:'evil'}),{})});
test('marketing attribution cannot leak arbitrary URLs or campaign text',()=>{assert.deepEqual(attribution('https://cv.test/?utm_source=google&utm_campaign=mk-search-cv',''),{channel:'google',medium:'cpc',campaign:'mk-search-cv'});assert.deepEqual(attribution('https://cv.test/?utm_source=private-email&utm_campaign=secret','https://some-company.test/private/path?email=secret'),{channel:'referral',medium:'referral',campaign:'none'})});

test('attribution distinguishes paid, organic, social and internal navigation',()=>{assert.equal(attribution('https://cv.test/?utm_source=google&utm_medium=organic&utm_campaign=mk-search-cv','').medium,'organic');assert.equal(attribution('https://cv.test/','https://www.bing.com/search?q=private').medium,'organic');assert.equal(attribution('https://cv.test/','https://cv.test/en/').channel,'direct');assert.equal(attribution('https://cv.test/?utm_source=facebook&utm_medium=private@example.com','').medium,'social')});
