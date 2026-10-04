import {escapeHtml as e} from './model.js';
import {starterDraft,workshopKind} from './section-workshop.js';
import {mountReviewGuide} from './review-guide.js';

const say=(ui,en,mk)=>ui==='mk'?mk:en;

// A text preview, not a reconstruction of the uploaded file's layout.
function documentPreview(text){
 const headings=/^(PROFILE|SUMMARY|PROFESSIONAL SUMMARY|WORK EXPERIENCE|EXPERIENCE|EDUCATION|SKILLS|LANGUAGES|L\s+ANGUAGES|CONTACT DETAILS|CERTIFICATIONS|PROJECTS|REFERENCES|ПРОФИЛ|ИСКУСТВО|РАБОТНО ИСКУСТВО|ОБРАЗОВАНИЕ|ВЕШТИНИ|ЈАЗИЦИ)$/iu;
 return text.split('\n').map((line,index)=>headings.test(line.trim())?`<h5>${e(line.trim())}</h5>`:index===0?`<h4>${e(line)}</h4>`:`<p${/^\s*[•*-]\s/u.test(line)?' class="preview-bullet"':''}>${e(line)||'&nbsp;'}</p>`).join('');
}

export function mountReviewStudio(root,state,ui,repaint){
 const results=root.querySelector('.ai-results'),list=results?.querySelector('.review-section-list'),document=root.querySelector('.revised-section');
 if(!results||!list||!document)return;
 const active=state.workshops.active,sections=state.ai.sections;
 const cards=[...list.children];
 const shell=root.ownerDocument.createElement('div');shell.className='review-studio';shell.dataset.view=state.studioView||'edit';
 shell.innerHTML=`<div class="studio-toolbar"><div><p class="eyebrow">${say(ui,'YOUR NEXT DRAFT','ТВОЈОТ СЛЕДЕН НАЦРТ')}</p><h3>${say(ui,'Make it yours.','Прилагоди го CV-то.')}</h3></div><div class="studio-view-switch" role="group" aria-label="${say(ui,'Workspace view','Приказ на работниот простор')}"><button type="button" data-studio-view="edit">${say(ui,'Edit sections','Уреди секции')}</button><button type="button" data-studio-view="preview">${say(ui,'Preview & export','Преглед и преземање')}</button></div></div><div class="studio-layout"><nav class="studio-nav" aria-label="${say(ui,'CV sections','Секции на CV')}"><p class="studio-nav-label">${say(ui,'Your CV sections','Секции на CV')}</p>${sections.map((section,index)=>`<button type="button" data-select-section="${index}" ${active===index?'aria-current="step"':''}><span class="studio-section-number">${state.workshops.drafts[index]?.lastApplied?'✓':String(index+1).padStart(2,'0')}</span><span>${e(section.name)}${section.document==='letter'?`<small>${say(ui,'Cover letter','Мотивациско писмо')}</small>`:''}</span><span class="studio-nav-arrow" aria-hidden="true">›</span></button>`).join('')}<p class="studio-nav-note">${say(ui,'Your original stays unchanged.','Оригиналот останува непроменет.')}</p></nav><div class="studio-edit-pane"></div><aside class="studio-document" aria-label="${say(ui,'Revised document preview','Преглед на подобрениот документ')}"><div class="studio-preview-heading"><span>${say(ui,'DOCUMENT PREVIEW','ПРЕГЛЕД НА ДОКУМЕНТОТ')}</span><span class="studio-preview-status">${say(ui,'Applied changes','Применети измени')}</span></div><div class="studio-paper"></div><p class="studio-preview-note">${say(ui,'Only applied changes appear here. Your draft stays separate until you approve it.','Тука се прикажуваат само применетите измени. Нацртот е одделен додека не го одобриш.')}</p></aside></div>`;
 list.closest('.review-depth').replaceWith(shell);
 const edit=shell.querySelector('.studio-edit-pane'),preview=shell.querySelector('.studio-document');
 edit.append(list);list.classList.add('studio-section-panels');
 for(const [index,card] of cards.entries()){
  card.hidden=active!==null&&active!==index;
  if(active===index){
   card.classList.add('studio-active-section');
   const tools=card.querySelector('.section-tools');if(tools)tools.hidden=true;
   const panel=card.querySelector('.section-workshop');
   if(panel){
    const oldTitle=panel.querySelector(`[id="workshop-title-${index}"]`),visibleTitle=card.querySelector('h5');
    if(oldTitle&&visibleTitle){oldTitle.removeAttribute('id');visibleTitle.id=`workshop-title-${index}`;visibleTitle.tabIndex=-1}
    const grid=root.ownerDocument.createElement('div');grid.className='studio-writing-layout';
    const writing=root.ownerDocument.createElement('div');writing.className='studio-writing-main';
    const help=root.ownerDocument.createElement('aside');help.className='studio-writing-help';help.setAttribute('aria-label',say(ui,'Writing suggestions','Предлози за пишување'));
    help.innerHTML=`<p class="studio-help-title">${say(ui,'A little writing help','Помош за пишување')}</p><p class="hint">${say(ui,'Adapt these ideas to your experience.','Прилагоди ги идеите на твоето искуство.')}</p>`;
    const phrases=panel.querySelector('.inside-wording');if(phrases)help.append(phrases);
    for(const child of [...panel.children])if(!child.matches('.workshop-heading,.hint'))writing.append(child);
    grid.append(writing,help);panel.append(grid);
    const kind=workshopKind(sections[index]);
    let originalSection='';try{originalSection=starterDraft(sections[index].document==='letter'?state.originalLetter:state.original,kind,[],sections[index].document).body}catch{/* Unrecognised sections keep their rewrites in the full review. */}
    const related=state.ai.suggestions.map((suggestion,i)=>({suggestion,i})).filter(({suggestion})=>suggestion.document===sections[index].document&&originalSection.includes(suggestion.original));
    if(related.length){
     const ai=root.ownerDocument.createElement('div');ai.className='studio-ai-wording';ai.innerHTML=`<strong>${say(ui,'AI suggested wording','Текст предложен од AI')}</strong>`;
     for(const {i} of related){const rewrite=results.querySelector(`[data-accept="${i}"]`)?.closest('.rewrite-card');if(rewrite)ai.append(rewrite)}
     help.prepend(ai);
    }
   }
  }
 }
 const wordingHeading=results.querySelector('.suggested-wording-heading');
 if(wordingHeading)wordingHeading.hidden=![...results.children].some(node=>node.matches('.rewrite-card'));
 const fullEditor=root.ownerDocument.createElement('details');fullEditor.className='studio-full-editor';
 fullEditor.innerHTML=`<summary>${say(ui,'Edit the full document','Уреди го целиот документ')}</summary>`;
 for(const label of [...document.children].filter(node=>node.tagName==='LABEL'&&node.querySelector('textarea')))fullEditor.append(label);
 const comparison=document.querySelector('details');if(comparison)fullEditor.append(comparison);
 document.prepend(fullEditor);preview.append(document);
 const refreshPreview=()=>{const letter=root.querySelector('#review-edited-letter')?.value;shell.querySelector('.studio-paper').innerHTML=documentPreview(root.querySelector('#review-edited').value)+(letter?`<div class="studio-letter-preview"><h5>${say(ui,'COVER LETTER','МОТИВАЦИСКО ПИСМО')}</h5>${documentPreview(letter)}</div>`:'')};
 refreshPreview();root.querySelector('#review-edited').addEventListener('input',refreshPreview);
 root.querySelector('#review-edited-letter')?.addEventListener('input',refreshPreview);
 const setView=view=>{
  state.studioView=view;shell.dataset.view=view;
  shell.querySelectorAll('[data-studio-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.studioView===view)));
 };
 setView(state.studioView||'edit');
 shell.querySelectorAll('[data-studio-view]').forEach(button=>button.onclick=()=>setView(button.dataset.studioView));
 shell.querySelectorAll('[data-select-section]').forEach(button=>button.onclick=()=>{
  state.studioView='edit';const target=root.querySelector(`[data-build-section="${button.dataset.selectSection}"]`);
  if(target)target.click();else {state.workshops.active=Number(button.dataset.selectSection);repaint()}
 });
 root.querySelector('#review-show-edited').onclick=()=>{setView('preview');preview.scrollIntoView({block:'start',behavior:'instant'})};
 const source=root.ownerDocument.createElement('details');source.className='studio-source';
 source.innerHTML=`<summary>${say(ui,'Uploaded documents · review another CV','Прикачени документи · нова AI-проверка')}</summary>`;
 const inputs=[...root.querySelector('.review-panel').children].filter(node=>node.matches('.review-source-options,.review-document,.review-extras,.ai-choice'));
 for(const node of inputs)source.append(node);
 results.after(source);
 mountReviewGuide(root,state,ui,repaint);
}
