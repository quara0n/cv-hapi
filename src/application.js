import {normalize,documentDefinition,descriptionLines} from './model.js';

// A transparent template, not an AI writer or an ATS score.
export function evidenceOptions(cv){
  return [...cv.experience,...cv.education].flatMap((item,index)=>
    item.description.trim()?[{id:String(index),label:[item.title,item.organization].filter(Boolean).join(' · '),text:item.description.trim()}]:[]);
}
export function draftLetter({name,role,company,requirement='',why,evidence,language}){
  const points=evidence.flatMap(descriptionLines).map(x=>`• ${x}`).join('\n');
  const needs=requirement.trim()?`${language==='mk'?'Во огласот ги истакнувате следниве барања':'Your vacancy highlights these requirements'}: ${requirement.trim()}\n\n`:'';
  return language==='mk'
    ? `Почитувани,\n\nАплицирам за работната позиција ${role.trim()}${company.trim()?` во ${company.trim()}`:''}.\n\n${needs}${why.trim()}\n\nРелевантно искуство:\n${points}\n\nВи благодарам за разгледувањето на мојата пријава. Би ми било драго да разговараме за позицијата.\n\nСо почит,\n${name.trim()}`
    : `Dear hiring team,\n\nI am applying for the ${role.trim()} position${company.trim()?` at ${company.trim()}`:''}.\n\n${needs}${why.trim()}\n\nRelevant experience:\n${points}\n\nThank you for considering my application. I would welcome the opportunity to discuss the role.\n\nKind regards,\n${name.trim()}`;
}
export function applicationDocument(cv,pack){
  const d=normalize({...cv,summary:pack.summary,language:pack.language});
  const doc=documentDefinition(d);
  doc.info.title=`${pack.language==='mk'?'Пријава':'Application'} — ${d.name}`;
  doc.content.push({text:pack.language==='mk'?'МОТИВАЦИСКО ПИСМО':'COVER LETTER',pageBreak:'before',style:'heading'},
    {text:[pack.role,pack.company].filter(Boolean).join(' · '),bold:true,margin:[0,12,0,16]},
    {text:pack.letter,margin:[0,0,0,12]});
  return doc;
}
