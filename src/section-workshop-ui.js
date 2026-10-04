import {escapeHtml as e} from './model.js';
import {workshopKind,starterDraft,composeDetails,sectionChange,undoSectionChange} from './section-workshop.js';
import {fieldGuidance,infoHelp,bindInfoHelp,sectionWording} from './field-guidance.js';

const fields={
 profile:[['role','Profession or role','Професија или улога'],['focus','Your focus or the people you help','Твојот фокус или луѓето на кои им помагаш'],['approach','How you work (optional)','Како работиш (незадолжително)',true],['strengths','A relevant strength or fact (optional)','Релевантна вештина или факт (незадолжително)',true]],
 experience:[['role','Job title','Работно место'],['organization','Employer or organization','Работодавец или организација'],['dates','Dates or current status','Датуми или тековен статус'],['duties','What you actually did — one task per line','Што навистина правеше — една задача по ред',true],['result','A true outcome (optional)','Вистински резултат (незадолжително)',true]],
 education:[['qualification','Your qualification or course','Твојата квалификација или курс'],['organization','Institution or training provider','Установа или организатор'],['dates','Year, dates or in-progress status','Година, датуми или статус на студии'],['details','Relevant training or project (optional)','Релевантна обука или проект (незадолжително)',true]],
 skills:[['items','Skills you actually have — one per line','Вештини што навистина ги имаш — една по ред',true]],
 languages:[['items','Language — your actual level, one per line','Јазик — твоето вистинско ниво, еден по ред',true]],
 contact:[['name','Your name','Твоето име'],['role','Profession or title (optional)','Професија или титула (незадолжително)'],['contact','Contact details you want to share','Контакти што сакаш да ги споделиш',true]],
 letter:[['opening','Your opening and target role','Твојот вовед и работното место',true],['motivation','Your reason for applying (optional)','Причината за пријавување (незадолжително)',true],['evidence','Your actual relevant experience','Твоето вистинско релевантно искуство',true],['closing','Your closing (optional)','Твојот завршеток (незадолжително)',true]],
};
const say=(language,en,mk)=>language==='mk'?mk:en;
const phraseOptions=(ideas,language)=>ideas.map((phrase,i)=>`<div class="wording-option"><p>${e(phrase)}</p><button type="button" class="text-button" data-add-phrase="${i}" data-phrase="${e(phrase)}">${say(language,'Add to draft','Додај во нацртот')}</button></div>`).join('');
function fieldHelp(kind,id,index,draft,language){
 const guide=fieldGuidance(kind,id,draft.values.role||draft.context||'',language);
 const content=`<p>${e(guide.description)}</p>${guide.examples.length?`<strong>${say(language,'Examples to adapt','Примери за прилагодување')}</strong><p class="hint">${say(language,'Use only what matches your experience.','Користи само што одговара на твоето искуство.')}</p><ul class="writing-examples">${guide.examples.map(value=>`<li><span>${e(value)}</span>${guide.insertable?`<button type="button" class="text-button" data-example-field="${id}" data-example-value="${e(value)}">${say(language,'Use example','Користи пример')}</button>`:''}</li>`).join('')}</ul>`:''}`;
 const field=fields[kind]?.find(item=>item[0]===id);
 const label=field?(language==='mk'?field[2]:field[1]):id;
 return infoHelp(`field-help-${index}-${id}`,say(language,`Writing help: ${label}`,`Помош за пишување: ${label}`),content);
}
function fieldHTML(field,kind,index,draft,language){
 const [id,en,mk,multiline]=field,optional=en.includes('(optional)');
 const label=(language==='mk'?mk:en).replace(' — one task per line','').replace(' — one per line','');
 return `<div class="workshop-field ${multiline?'wide':''}"><div class="field-heading"><label for="section-${index}-${id}">${e(label)}${!optional?' <span aria-hidden="true">*</span>':''}</label><span data-field-help="${id}">${fieldHelp(kind,id,index,draft,language)}</span></div><${multiline?'textarea':'input'} id="section-${index}-${id}" data-detail="${id}" aria-required="${!optional}" maxlength="1500" ${multiline?'rows="3"':`type="text" value="${e(draft.values[id]||'')}"`}>${multiline?`${e(draft.values[id]||'')}</textarea>`:''}</div>`;
}
function errorText(error,language){
 const messages={missing_details:['Fill in the required details and replace every bracketed placeholder before adding this section.','Пополнете ги задолжителните детали и заменете ги сите полиња во загради пред додавање.'],language_levels:['Use “Language — your level” on each line. Choose levels that describe your actual ability.','Користи „Јазик — твоето ниво“ во секој ред. Наведи го вистинското ниво.'],ambiguous_section:['This section could not be located uniquely. Copy your draft into the revised document editor where you want it.','Оваа секција не може точно да се лоцира. Копирај го нацртот на соодветното место во уредувачот.'],no_change:['This draft already matches the revised document. Edit it or add details first.','Овој нацрт веќе е во подобрениот документ. Прво уреди го или додај детали.'],stale:['The document changed after this preview. Preview again. Undo is unavailable if you have edited this section since adding it.','Документот се промени по прегледот. Прегледај повторно. Враќање не е достапно ако оваа секција е уредена потоа.'],too_long:['This would exceed the revised document limit. Shorten the draft.','Ова го надминува лимитот на документот. Скратете го нацртот.']};
 return (messages[error.message]||messages.stale)[language==='mk'?1:0];
}
export function workshopHTML(section,index,state,language,context=''){
 const kind=workshopKind(section);if(!kind)return '';
 const mk=language==='mk',draft=state.drafts[index],active=state.active===index;
 // A remounted editor must recheck its comparison and fact confirmation.
 if(active&&draft)draft.preview=null;
 const ideas=sectionWording(kind,draft?.values.role||draft?.context||context,language);
 const wording=active?`<div class="section-wording inside-wording"><strong>${say(language,'Phrases to adapt','Фрази за прилагодување')}</strong><p class="hint">${say(language,'Replace the brackets with your facts.','Замени ги заградите со твоите факти.')}</p><div data-phrase-options>${phraseOptions(ideas,language)}</div></div>`:`<div class="section-wording"><strong>${say(language,'Wording idea','Идеја за текст')}</strong><p>${e(ideas[0]||'')}</p><button type="button" class="text-button" data-wording-section="${index}">${say(language,'Explore wording','Разгледај фрази')}</button></div>`;
 return `${!active?wording:""}<div class="section-tools"><button type="button" class="${draft?.lastApplied?'secondary':'primary'}" data-build-section="${index}" aria-expanded="${active}">${draft?.lastApplied?say(language,'Edit this section','Уреди ја секцијата'):say(language,'Build this section','Подготви ја секцијата')}</button>${draft?.lastApplied?`<span class="section-done">${say(language,'Added to revised document','Додадено во подобрениот документ')}</span>`:''}</div>${active&&draft?`<div class="section-workshop" data-workshop="${index}"><div class="workshop-heading"><div><p class="eyebrow">${say(language,'BUILD YOUR SECTION','ПОДГОТВИ ЈА СЕКЦИЈАТА')}</p><h6 tabindex="-1" id="workshop-title-${index}">${e(section.name)}</h6></div><button type="button" class="text-button" data-close-workshop>${say(language,'Close editor','Затвори уредувач')}</button></div><p class="hint">${draft.verified?say(language,'Starts with verified wording from your review.','Започнува со проверен текст од мислењето.'):draft.existing?say(language,'Edit your current section or build a new draft.','Започнува со твојата тековна секција. Додај корисни и точни детали.'):say(language,'Add your details to create this section.','Оваа секција недостасува. Внеси вистински детали за почетен нацрт.')}</p><details class="workshop-details" ${!draft.body?'open':''}><summary>${say(language,kind==='experience'?'Add a role':kind==='education'?'Add a qualification':'Build from your details',kind==='experience'?'Додај работно место':kind==='education'?'Додај квалификација':'Подготви од твоите детали')}</summary><p class="hint">${say(language,'Add your details. Use the info buttons for writing examples.','Внеси ги твоите детали. Користи ги копчињата за информации за примери.')}</p><div class="workshop-fields">${fields[kind].map(field=>fieldHTML(field,kind,index,draft,language)).join('')}</div><button type="button" class="secondary" data-compose>${say(language,'Create my draft','Подготви го нацртот')}</button></details>${wording}<label for="section-${index}-draft">${say(language,'Your draft','Нацрт на секцијата — уреди го текстот')}<textarea id="section-${index}-draft" data-section-draft rows="5" maxlength="10000">${e(draft.body)}</textarea></label><div class="workshop-preview" aria-live="polite"></div><div class="workshop-actions"><button type="button" class="secondary" data-preview-section>${say(language,'Preview in my CV','Прегледај во моето CV')}</button>${draft.lastApplied?`<button type="button" class="text-button" data-undo-section>${say(language,'Undo last section change','Врати ја последната измена')}</button>`:''}</div><p class="workshop-status" role="status">${e(draft.message||'')}</p><div class="workshop-apply" hidden><label class="review-check"><input type="checkbox" data-confirm-section>${say(language,'I checked this draft. Every detail is true and no placeholders remain.','Го проверив нацртот. Сите детали се точни и нема непополнети полиња.')}</label><button type="button" class="primary" data-apply-section disabled>${say(language,'Add to revised CV','Додај во подобреното CV')}</button><p class="hint">${say(language,'Your uploaded original stays unchanged. You can undo this section change.','Прикачениот оригинал останува непроменет. Можеш да ја вратиш оваа измена.')}</p></div></div>`:''}`;
}
export function bindWorkshops(root,{review,state,language,getDocument,onDocumentChange,repaint}){
 const focus=index=>{const title=root.querySelector(`#workshop-title-${index}`);title?.focus({preventScroll:true});title?.scrollIntoView({block:'start',behavior:'instant'})};
 root.querySelectorAll('[data-build-section],[data-wording-section]').forEach(button=>button.onclick=()=>{
  const index=Number(button.dataset.buildSection??button.dataset.wordingSection),section=review.sections[index],kind=workshopKind(section);
  if(!state.drafts[index]){try{const starting=starterDraft(getDocument(section.document),kind,review.suggestions,section.document);state.drafts[index]={...starting,context:getDocument(section.document).slice(0,2000),body:starting.body,base:starting.body,values:{},kind,message:'',lastApplied:null}}catch(error){state.drafts[index]={context:getDocument(section.document).slice(0,2000),body:'',base:'',values:{},kind,existing:false,verified:false,message:errorText(error,language),lastApplied:null}}}
  state.active=index;repaint();focus(index);
 });
 const panel=root.querySelector('[data-workshop]');if(!panel)return;
 const index=Number(panel.dataset.workshop),section=review.sections[index],draft=state.drafts[index];
 const q=selector=>panel.querySelector(selector),status=text=>{draft.message=text;q('.workshop-status').textContent=text};
 const invalidate=()=>{draft.preview=null;q('.workshop-preview').innerHTML='';q('.workshop-apply').hidden=true;status('')};
 q('[data-close-workshop]').onclick=()=>{state.active=null;repaint();root.querySelector(`[data-build-section="${index}"]`)?.focus({preventScroll:true})};
 q('[data-section-draft]').oninput=event=>{draft.body=event.target.value;invalidate()};
 const bindPhrases=()=>panel.querySelectorAll('[data-add-phrase]').forEach(button=>button.onclick=()=>{draft.body=[draft.body.trim(),button.dataset.phrase].filter(Boolean).join('\n\n');q('[data-section-draft]').value=draft.body;invalidate();q('[data-section-draft]').focus();status(say(language,'Phrase added to your draft. Replace every bracket with your own facts.','Фразата е додадена во нацртот. Замени ги заградите со твоите факти.'))});
 bindPhrases();
 const bindExamples=()=>panel.querySelectorAll('[data-example-field]').forEach(button=>button.onclick=()=>{
  const field=q(`[data-detail="${button.dataset.exampleField}"]`),value=button.dataset.exampleValue;
  field.value=field.tagName==='TEXTAREA'&&field.value.trim()?`${field.value.trim()}\n${value}`:value;
  field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();
 });
 panel.querySelectorAll('[data-detail]').forEach(field=>field.oninput=event=>{
  draft.values[field.dataset.detail]=event.target.value;field.removeAttribute('aria-invalid');
  if(field.dataset.detail==='role'){
   q('[data-phrase-options]').innerHTML=phraseOptions(sectionWording(draft.kind,field.value||draft.context,language),language);bindPhrases();
   panel.querySelectorAll('[data-field-help]').forEach(container=>{container.innerHTML=fieldHelp(draft.kind,container.dataset.fieldHelp,index,draft,language)});
   bindInfoHelp(panel);bindExamples();
  }
 });
 bindInfoHelp(panel);bindExamples();
 q('[data-compose]').onclick=()=>{try{draft.body=composeDetails(draft.kind,draft.values,draft.base,language);q('[data-section-draft]').value=draft.body;invalidate();status(say(language,'Draft created from your details. Edit it, then preview the change.','Нацртот е подготвен од твоите детали. Уреди го и прегледај ја измената.'));q('[data-section-draft]').focus()}catch(error){status(errorText(error,language));if(error.message==='missing_details'){const missing=[...panel.querySelectorAll('[data-detail][aria-required="true"]')].filter(field=>!field.value.trim());missing.forEach(field=>field.setAttribute('aria-invalid','true'));missing[0]?.focus()}}};
 q('[data-preview-section]').onclick=()=>{
  invalidate();try{
   draft.preview=sectionChange(getDocument(section.document),draft.kind,draft.body,language);
   const change=draft.preview;
   q('.workshop-preview').innerHTML=`<h6>${say(language,change.mode==='add'?'New section to add':'Replace this section',change.mode==='add'?'Нова секција за додавање':'Замени ја оваа секција')}</h6><div class="rewrite-pair"><div><strong>${say(language,'Currently in your revised document','Сега во подобрениот документ')}</strong><pre>${e(change.original||say(language,'This section is not present.','Оваа секција недостасува.'))}</pre></div><div><strong>${say(language,'Your draft','Твојот нацрт')}</strong><pre>${e(change.draft)}</pre></div></div>`;
   q('.workshop-apply').hidden=false;q('[data-confirm-section]').checked=false;q('[data-apply-section]').disabled=true;
   q('[data-apply-section]').textContent=say(language,section.document==='letter'?'Update revised cover letter':change.mode==='add'?'Add section to revised CV':'Replace section in revised CV',section.document==='letter'?'Обнови го подобреното писмо':change.mode==='add'?'Додај секција во подобреното CV':'Замени секција во подобреното CV');
  }catch(error){status(errorText(error,language))}
 };
 q('[data-confirm-section]').onchange=event=>{q('[data-apply-section]').disabled=!event.target.checked||!draft.preview};
 q('[data-apply-section]').onclick=()=>{
  if(!q('[data-confirm-section]').checked||!draft.preview)return;
  if(getDocument(section.document)!==draft.preview.before){invalidate();status(errorText(Error('stale'),language));return}
  draft.lastApplied=draft.preview;draft.preview=null;draft.base=draft.body;draft.values={};draft.verified=false;draft.existing=true;draft.message=say(language,'Section added to your revised document.','Секцијата е додадена во подобрениот документ.');
  onDocumentChange(section.document,draft.lastApplied.after);repaint();focus(index);
 };
 if(q('[data-undo-section]'))q('[data-undo-section]').onclick=()=>{try{const text=undoSectionChange(getDocument(section.document),draft.lastApplied);draft.lastApplied=null;draft.body=starterDraft(text,draft.kind,[],section.document).body;draft.base=draft.body;draft.values={};draft.preview=null;draft.message=say(language,'Last section change undone.','Последната измена е вратена.');onDocumentChange(section.document,text);repaint();focus(index)}catch(error){status(errorText(error,language))}};
}
