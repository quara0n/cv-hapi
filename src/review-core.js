export const MAX_TEXT=20000;
export function cvText(cv){return [cv.name,cv.role,[cv.email,cv.phone,cv.city,cv.website].filter(Boolean).join(' · '),cv.summary,...['experience','education'].flatMap(k=>cv[k].map(x=>[x.title,x.organization,[x.start,x.end].filter(Boolean).join('–'),x.description].filter(Boolean).join('\n'))),cv.skills,cv.languages].filter(Boolean).join('\n\n')}
const stop=new Set('with plus a is an as at be by or to of in on it its we us from this that your have will work team about their they them must should would experience skills role job company position working requirements and the for are you our has was can not but into also such more than како дека ова кои или што има при со на за од во и се да до е соработ соработка работа работно искуство вештини'.split(' '));
export function jobTerms(text){const counts=new Map();for(const token of text.toLocaleLowerCase().match(/[\p{L}][\p{L}\p{N}+#.-]{2,}/gu)||[]){const word=token.replace(/[.-]+$/,'');if(word.length>=3&&!stop.has(word))counts.set(word,(counts.get(word)||0)+1)}return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,18).map(x=>x[0])}
export function localReview(text,job){const words=text.trim().split(/\s+/).filter(Boolean).length;const tokens=new Set((text.toLocaleLowerCase().match(/[\p{L}\p{N}+#.-]+/gu)||[]).map(x=>x.replace(/[.-]+$/,'')));const terms=jobTerms(job);return {words,hasEmail:/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text),hasDates:/\b(?:19|20)\d{2}\b/.test(text),hasNumbers:/\b\d+(?:[.,]\d+)?\s*(?:%|customers|clients|projects|клиенти|проекти)/iu.test(text),matched:terms.filter(t=>tokens.has(t)),missing:terms.filter(t=>!tokens.has(t))}}
export function applySuggestion(text,suggestion){if(!suggestion.original||!text.includes(suggestion.original))throw new Error('stale');return text.replace(suggestion.original,()=>suggestion.revised)}
export function validateReview(value,source,letter=''){if(!value||typeof value.overview!=='string'||!Array.isArray(value.suggestions))throw new Error('Invalid review');return {overview:value.overview.slice(0,1800),strengths:(Array.isArray(value.strengths)?value.strengths:[]).filter(x=>typeof x==='string').slice(0,5).map(x=>x.slice(0,500)),questions:(Array.isArray(value.questions)?value.questions:[]).filter(x=>typeof x==='string').slice(0,5).map(x=>x.slice(0,500)),suggestions:value.suggestions.filter(x=>x&&typeof x.original==='string'&&x.original.length>=8&&['cv','letter'].includes(x.document??'cv')&&(x.document==='letter'?letter:source).includes(x.original)&&typeof x.revised==='string'&&x.revised.trim()&&x.revised.length<=2500&&typeof x.reason==='string').slice(0,6).map(x=>({document:x.document??'cv',original:x.original,revised:x.revised,reason:x.reason.slice(0,600)}))}}
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
