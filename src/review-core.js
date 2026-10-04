import {headings} from './model.js';
export const MAX_TEXT=20000;
export function cvText(cv){
 const h=headings[cv.language]||headings.en;
 const section=(key,body)=>body.trim()?`${h[key]}\n${body}`:'';
 return [cv.name,cv.role,[cv.email,cv.phone,cv.city,cv.website].filter(Boolean).join(' · '),section('profile',cv.summary),...['experience','education'].map(key=>section(key,cv[key].map(entry=>[entry.title,entry.organization,[entry.start,entry.end].filter(Boolean).join('–'),entry.description].filter(Boolean).join('\n')).filter(Boolean).join('\n\n'))),section('skills',cv.skills),section('languages',cv.languages)].filter(Boolean).join('\n\n');
}
const stop=new Set('with plus a is an as at be by or to of in on it its we us from this that your have will work team about their they them must should would experience skills role job company position working requirements and the for are you our has was can not but into also such more than како дека ова кои или што има при со на за од во и се да до е соработ соработка работа работно искуство вештини'.split(' '));
export function jobTerms(text){const counts=new Map();for(const token of text.toLocaleLowerCase().match(/[\p{L}][\p{L}\p{N}+#.-]{2,}/gu)||[]){const word=token.replace(/[.-]+$/,'');if(word.length>=3&&!stop.has(word))counts.set(word,(counts.get(word)||0)+1)}return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,18).map(x=>x[0])}
export function localReview(text,job){const words=text.trim().split(/\s+/).filter(Boolean).length;const tokens=new Set((text.toLocaleLowerCase().match(/[\p{L}\p{N}+#.-]+/gu)||[]).map(x=>x.replace(/[.-]+$/,'')));const terms=jobTerms(job);return {words,hasEmail:/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text),hasDates:/\b(?:19|20)\d{2}\b/.test(text),hasNumbers:/\b\d+(?:[.,]\d+)?\s*(?:%|customers|clients|projects|клиенти|проекти)/iu.test(text),matched:terms.filter(t=>tokens.has(t)),missing:terms.filter(t=>!tokens.has(t))}}
export function applySuggestion(text,suggestion){if(!suggestion.original||!text.includes(suggestion.original))throw new Error('stale');return text.replace(suggestion.original,()=>suggestion.revised)}
// Recover only whitespace differences introduced by PDF extraction or model quoting.
// The delivered original is always the exact source substring, never the model's version.
function anchoredQuote(source,quote){
 if(source.includes(quote))return quote;
 const tokens=quote.trim().split(/\s+/u);
 const pattern=tokens.map(token=>token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+');
 const matches=[...source.matchAll(new RegExp(pattern,'gu'))];
 return matches.length===1?matches[0][0]:null;
}
export function validateReview(value,source,letter='',job=''){
 if(!value||typeof value.overview!=='string'||!Array.isArray(value.suggestions))throw new Error('Invalid review');
 const suggestions=[],ranges={cv:[],letter:[]};
 for(const item of value.suggestions){
  if(!item||typeof item.original!=='string'||item.original.length<8||item.original.length>900||!['cv','letter'].includes(item.document??'cv')||typeof item.revised!=='string'||!item.revised.trim()||item.revised.length>2500||typeof item.reason!=='string')continue;
  const original=anchoredQuote(item.document==='letter'?letter:source,item.original);
  if(!original||original.length>900)continue;
  if(original.replace(/\s+/gu,' ').trim()===item.revised.replace(/\s+/gu,' ').trim())continue;
  const document=item.document??'cv',text=document==='letter'?letter:source,start=text.indexOf(original),end=start+original.length;
  if(ranges[document].some(range=>start<range.end&&end>range.start))continue;
  ranges[document].push({start,end});
  suggestions.push({document:item.document??'cv',original,revised:item.revised,reason:item.reason.slice(0,600)});
  if(suggestions.length===12)break;
 }
 const strings=(items,max,length)=>Array.isArray(items)?items.filter(x=>typeof x==='string'&&x.trim()).slice(0,max).map(x=>x.slice(0,length)):[];
 const records=items=>Array.isArray(items)?items.filter(x=>x&&typeof x==='object'):[];
 const priorities=records(value.priorities).filter(x=>['title','why','action'].every(key=>typeof x[key]==='string'&&x[key].trim())).slice(0,6).map(x=>({title:x.title.slice(0,160),why:x.why.slice(0,1000),action:x.action.slice(0,1000)}));
 const sections=records(value.sections).filter(x=>['cv','letter'].includes(x.document)&&!(x.document==='letter'&&!letter.trim())&&typeof x.name==='string'&&x.name.trim()&&typeof x.assessment==='string'&&Array.isArray(x.actions)).slice(0,10).map(x=>({document:x.document,name:x.name.slice(0,160),assessment:x.assessment.slice(0,1500),actions:strings(x.actions,4,1000)}));
 const jobMatches=[];
 if(job.trim())for(const item of records(value.jobMatches)){
  if(typeof item.requirement!=='string'||item.requirement.length<3||item.requirement.length>900||typeof item.evidence!=='string'||item.evidence.length>900||typeof item.advice!=='string')continue;
  const requirement=anchoredQuote(job,item.requirement);
  const evidence=item.evidence.trim()?(anchoredQuote(source,item.evidence)||anchoredQuote(letter,item.evidence)):'';
  if(!requirement||(item.evidence.trim()&&!evidence))continue;
  jobMatches.push({requirement,evidence,advice:item.advice.slice(0,1000)});
  if(jobMatches.length===10)break;
 }
 return {overview:value.overview.slice(0,3500),strengths:strings(value.strengths,6,700),questions:strings(value.questions,10,700),priorities,sections,jobMatches,suggestions};
}

export function reviewedDocument(text,letter=''){
 const headings='profile|personal profile|professional summary|summary|work experience|professional experience|experience|employment history|education|skills|key skills|languages|certifications|references|профил|работно искуство|искуство|образование|вештини|јазици|сертификати'.split('|');
 // PDF extraction can insert spaces inside headings, such as "L ANGUAGES".
 const headingText=line=>{const key=line.replace(/[\s:]/gu,'').toLocaleLowerCase();const match=headings.find(x=>x.replace(/\s/gu,'')===key);return match?(line===line.toLocaleUpperCase()?match.toLocaleUpperCase():match.replace(/^./u,x=>x.toLocaleUpperCase())):null};
 const lines=text.replace(/\r\n?/g,'\n').split('\n');
 const content=[];let inHeader=true,hasName=false;
 for(const raw of lines){
  const line=raw.trim();
  if(!line){if(content.length)content.at(-1).margin[3]=12;continue}
  const title=headingText(line);
  if(title){
   inHeader=false;content.push({text:title,style:'heading',margin:[0,20,0,8]});continue;
  }
  if(!content.length&&line.length<110&&line.split(/\s+/).length<=8){
   content.push({text:line,style:'name',margin:[0,0,0,8]});hasName=true;continue;
  }
  const contact=/@|https?:\/\/|www\.|\+?\d[\d ()-]{6,}/u.test(line);
  const style=inHeader&&hasName?(contact?'contact':content.length===1&&line.length<120?'role':null):null;
  content.push({text:line,...(style?{style}:{}),margin:[0,0,0,4]});
 }
 if(letter.trim())content.push({text:letter,pageBreak:'before'});
 return {pageSize:'A4',pageMargins:[48,42,48,42],info:{title:'Reviewed CV',creator:'CV Hapi'},defaultStyle:{font:'Roboto',fontSize:11,lineHeight:1.25,color:'#202735'},content,
  styles:{name:{fontSize:32,bold:true},role:{fontSize:12,bold:true,color:'#234bff'},contact:{fontSize:9,color:'#657084'},heading:{fontSize:10,bold:true,color:'#234bff',characterSpacing:1}},
  footer:(n,total)=>({text:`${n} / ${total}`,alignment:'right',fontSize:8,color:'#657084',margin:[48,10,48,0]}),
  pageBreakBefore:(node,following)=>node.style==='heading'&&following.length===0};
}

export function reviewedText(text,letter='',language='en'){return letter.trim()?`CV\n\n${text}\n\n${language==='mk'?'Мотивациско писмо':'Cover letter'}\n\n${letter}`:text}
