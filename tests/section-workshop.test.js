import test from 'node:test';
import assert from 'node:assert/strict';
import {workshopKind,starterDraft,composeDetails,sectionChange,undoSectionChange} from '../src/section-workshop.js';
import {cvText} from '../src/review-core.js';
import {blank} from '../src/model.js';

test('builder review text preserves section boundaries in both document languages',()=>{
 for(const language of ['en','mk']){
  const data={...blank(),language,name:'Alex Example',summary:'Original profile.',skills:'Communication',languages:'English — B2',experience:[{title:'Assistant',organization:'Example Home',start:'2020',end:'2021',description:'Supported colleagues.'}],education:[{title:'Diploma',organization:'Example College',start:'2018',end:'2020',description:''}]};
  const source=cvText(data);
  for(const kind of ['profile','experience','education','skills','languages'])assert.equal(starterDraft(source,kind).existing,true,`${language}: ${kind}`);
  const change=sectionChange(source,'profile','A revised profile.',language);
  assert.equal(change.mode,'replace');assert.doesNotMatch(change.after,/Original profile/);assert.match(change.after,/Supported colleagues/);assert.equal(undoSectionChange(change.after,change),source);
 }
});

const cv='Alex Example\nSupport worker\nPROFILE\nI help people.\n\nWORK EXPERIENCE\nAssistant\nExample Home | 2020–2021\nSupported colleagues.\n\nSKILLS\nCommunication\n\nL ANGUAGES\nEnglish\nNorwegian\n1 / 1';
test('adding a missing education section preserves all existing content and can be undone',()=>{
 const change=sectionChange(cv,'education','Diploma in care\nExample College | 2024','en');
 assert.equal(change.mode,'add');assert.match(change.after,/Supported colleagues\.\n\nEDUCATION\nDiploma in care\nExample College \| 2024\n\nSKILLS/);
 assert.match(change.after,/English\nNorwegian\n1 \/ 1$/);assert.equal(undoSectionChange(change.after,change),cv);
});
test('a section replacement uses verified wording and preserves the rest of the CV',()=>{
 const suggestion={document:'cv',original:'I help people.',revised:'I support people.',reason:'Clearer'};
 const draft=starterDraft(cv,'profile',[suggestion],'cv');assert.equal(draft.body,'I support people.');assert.equal(draft.verified,true);
 const change=sectionChange(cv,'profile',draft.body,'en');assert.equal(change.mode,'replace');assert.equal(change.after.replace('I support people.','I help people.'),cv);
});
test('placeholders, ambiguous sections and unchanged drafts cannot be applied',()=>{
 assert.throws(()=>sectionChange(cv,'education','[Your qualification]\n[Institution]','en'),/missing_details/);
 assert.throws(()=>sectionChange(cv,'profile','I help people.','en'),/no_change/);
 assert.throws(()=>sectionChange(cv+'\nPROFILE\nSecond profile.','profile','New profile.','en'),/ambiguous_section/);
});
test('undo preserves unrelated edits and refuses to overwrite subsequent edits to the same section',()=>{
 const change=sectionChange(cv,'profile','I support people.','en');
 assert.equal(undoSectionChange(change.after.replace('Communication','Communication\nCooking'),change),cv.replace('Communication','Communication\nCooking'));
 assert.throws(()=>undoSectionChange(change.after.replace('I support people.','My own later edit.'),change),/stale/);
});
test('guided experience includes only entered facts and keeps existing experience',()=>{
 const body=composeDetails('experience',{role:'Care assistant',organization:'Example Centre',dates:'2024–present',duties:'Prepared meals\nSupported colleagues',result:''},'Earlier role.');
 assert.equal(body,'Care assistant\nExample Centre | 2024–present\n• Prepared meals\n• Supported colleagues\n\nEarlier role.');
 assert.throws(()=>composeDetails('education',{qualification:'Diploma',organization:'',dates:''},''),/missing_details/);
});
test('language levels update only matching languages and cover letters target only the letter',()=>{
 const body=composeDetails('languages',{items:'English — fluent'},'English\nNorwegian');assert.equal(body,'English — fluent\nNorwegian');
 const change=sectionChange('Dear team,\nMy evidence.','letter','Dear team,\nMy fuller evidence.','en');assert.equal(change.after,'Dear team,\nMy fuller evidence.');
 assert.equal(workshopKind({document:'cv',name:'Образование и квалификации'}),'education');assert.equal(workshopKind({document:'cv',name:'Overall structure and readability'}),null);
});
test('page footers and other standard sections cannot truncate later section replacements',()=>{
 const text=cv.replace('SKILLS','1 / 2\nCERTIFICATIONS\nFirst aid\n\nSKILLS');
 const change=sectionChange(text,'skills','Communication\nMeal preparation','en');
 assert.equal(change.after.replace('Communication\nMeal preparation','Communication'),text);
 const experience=sectionChange(text,'experience','A fuller role description.','en');assert.match(experience.after,/CERTIFICATIONS\nFirst aid/);
});
test('empty sections and a CV starting with a heading receive proper separators',()=>{
 const profile=sectionChange('PROFILE','profile','A truthful profile.','en');assert.equal(profile.after,'PROFILE\nA truthful profile.');assert.equal(undoSectionChange(profile.after,profile),'PROFILE');
 const contact=sectionChange('PROFILE\nMy profile.','contact','Alex Example\nCare assistant','en');assert.equal(contact.after,'Alex Example\nCare assistant\n\nPROFILE\nMy profile.');
});
