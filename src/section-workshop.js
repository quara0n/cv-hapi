import {applySuggestion} from './review-core.js';

const aliases={
 profile:['profile','personal profile','professional summary','summary','профил','професионален профил','profil'],
 experience:['work experience','professional experience','experience','employment history','работно искуство','искуство','arbeidserfaring'],
 education:['education','education and qualifications','education & qualifications','qualifications','образование','образование и квалификации','utdanning'],
 skills:['skills','key skills','вештини','ferdigheter'],
 languages:['languages','јазици','språk'],
 certifications:['certifications','licenses & certifications','licenses and certifications','certificates','сертификати'],
 projects:['projects','проекти'],references:['references','препораки'],interests:['interests','hobbies','интереси'],
};
const order=['contact','profile','experience','education','skills','languages'];
const heading={en:{profile:'PROFILE',experience:'WORK EXPERIENCE',education:'EDUCATION',skills:'SKILLS',languages:'LANGUAGES'},mk:{profile:'ПРОФИЛ',experience:'РАБОТНО ИСКУСТВО',education:'ОБРАЗОВАНИЕ',skills:'ВЕШТИНИ',languages:'ЈАЗИЦИ'}};
const key=text=>text.replace(/[\s:]/gu,'').toLocaleLowerCase();
export function workshopKind(section){
 if(Object.hasOwn(section,'workshopKind'))return section.workshopKind;
 if(section.document==='letter')return 'letter';
 const name=section.name.toLocaleLowerCase();
 if(/contact|контакт/u.test(name))return 'contact';
 if(/education|qualification|образование|квалификац|utdanning/u.test(name))return 'education';
 if(/experience|employment|искуство|arbeidserfaring/u.test(name))return 'experience';
 if(/profile|summary|профил|profil/u.test(name))return 'profile';
 if(/skill|вештин|ferdigheter/u.test(name))return 'skills';
 if(/language|јазиц|språk/u.test(name))return 'languages';
 return null;
}
function boundaries(text){
 const found=[];let footer=text.length;
 for(const match of text.matchAll(/[^\r\n]+(?:\r\n|\n|\r|$)/gu)){
  const line=match[0].replace(/[\r\n]+$/u,'');
  if(/^\s*\d+\s*\/\s*\d+\s*$/u.test(line)){if(!text.slice(match.index+match[0].length).trim())footer=match.index;continue}
  const kind=Object.keys(aliases).find(kind=>aliases[kind].some(value=>key(value)===key(line)));
  if(kind)found.push({kind,start:match.index,bodyStart:match.index+match[0].length});
 }
 return {found,footer};
}
function current(text,kind){
 if(kind==='letter')return {start:0,bodyStart:0,end:text.length,body:text};
 const {found,footer}=boundaries(text);
 if(kind==='contact'){
  if(!found.length)throw Error('ambiguous_section');
  return {start:0,bodyStart:0,end:found[0].start,body:text.slice(0,found[0].start)};
 }
 const matches=found.filter(section=>section.kind===kind);
 if(matches.length>1)throw Error('ambiguous_section');
 if(!matches.length)return null;
 const section=matches[0],next=found.find(value=>value.start>section.start),end=Math.min(next?.start??text.length,footer);
 return {...section,end,body:text.slice(section.bodyStart,end)};
}
export function starterDraft(text,kind,suggestions=[],document='cv'){
 const section=current(text,kind);let body=section?.body.trim()||'',verified=false;
 for(const suggestion of suggestions){
  if(suggestion.document===document&&body.includes(suggestion.original)){body=applySuggestion(body,suggestion);verified=true}
 }
 return {body,existing:!!section,verified};
}
export function hasUnfilledDetails(text){return /\[[^\]\n]*\]|\{\{[^}]*\}\}|<(?:your|add|insert|enter)\b[^>]*>/iu.test(text)}
export function composeDetails(kind,values,existing='',language='en'){
 const read=id=>(values[id]||'').trim();
 const require=(...ids)=>{if(ids.some(id=>!read(id)))throw Error('missing_details')};
 const lines=text=>text.split(/\r?\n/u).map(value=>value.trim()).filter(Boolean);
 const retain=entry=>[entry,existing.trim()].filter(Boolean).join('\n\n');
 if(kind==='profile'){
  require('role','focus');return [language==='mk'?`${read('role')} со фокус на ${read('focus')}.`:`${read('role')} focused on ${read('focus')}.`,read('approach'),read('strengths')].filter(Boolean).join(' ');
 }
 if(kind==='experience'){
  require('role','organization','dates','duties');return retain(`${read('role')}\n${read('organization')} | ${read('dates')}\n${lines(read('duties')).map(line=>`• ${line.replace(/^[•*-]\s*/u,'')}`).join('\n')}${read('result')?`\n• ${read('result')}`:''}`);
 }
 if(kind==='education'){
  require('qualification','organization','dates');return retain([read('qualification'),`${read('organization')} | ${read('dates')}`,read('details')].filter(Boolean).join('\n'));
 }
 if(kind==='skills'){
  require('items');return [...new Set([...lines(existing),...lines(read('items'))])].join('\n');
 }
 if(kind==='languages'){
  require('items');const supplied=lines(read('items'));
  if(supplied.some(line=>!/^.+\s+[—–-]\s+.+$/u.test(line)))throw Error('language_levels');
  const language=line=>line.split(/\s+[—–-]\s+/u)[0].toLocaleLowerCase();
  const replaced=new Set(supplied.map(language));return [...supplied,...lines(existing).filter(line=>!replaced.has(language(line)))].join('\n');
 }
 if(kind==='contact'){
  require('name','contact');return [read('name'),read('role'),read('contact')].filter(Boolean).join('\n');
 }
 if(kind==='letter'){
  require('opening','evidence');return [read('opening'),read('motivation'),read('evidence'),read('closing')].filter(Boolean).join('\n\n');
 }
 throw Error('unsupported_section');
}
export function sectionChange(text,kind,draft,language='en'){
 draft=draft.trim();if(!draft||hasUnfilledDetails(draft))throw Error('missing_details');
 const section=current(text,kind);let start,end,oldFragment,newFragment,mode;
 if(section){
  if(section.body.trim()===draft)throw Error('no_change');
  start=section.bodyStart;end=section.end;oldFragment=text.slice(start,end);
  const trailing=oldFragment.match(/\s*$/u)[0]||(end<text.length?'\n\n':'');
  const separator=start>0&&!/[\r\n]/u.test(text[start-1])?'\n':'';
  newFragment=separator+draft+trailing;mode=section.body.trim()?'replace':'add';
 }else{
  if(!heading[language]?.[kind])throw Error('unsupported_section');
  const {found,footer}=boundaries(text),next=found.find(section=>order.indexOf(section.kind)>order.indexOf(kind));
  start=next?.start??footer;end=start;oldFragment='';
  const prefix=text.slice(0,start),separator=prefix&&!prefix.endsWith('\n\n')?(prefix.endsWith('\n')?'\n':'\n\n'):'';
  newFragment=`${separator}${heading[language][kind]}\n${draft}\n\n`;mode='add';
 }
 const after=text.slice(0,start)+newFragment+text.slice(end);
 if(after.length>(kind==='letter'?20000:30000))throw Error('too_long');
 return {before:text,after,oldFragment,newFragment,mode,original:section?.body.trim()||'',draft};
}
export function undoSectionChange(text,change){
 const index=text.indexOf(change.newFragment);
 if(index<0||text.indexOf(change.newFragment,index+1)>=0)throw Error('stale');
 return text.slice(0,index)+change.oldFragment+text.slice(index+change.newFragment.length);
}
