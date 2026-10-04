import {workshopKind} from './section-workshop.js';
const say=(ui,en,mk)=>ui==='mk'?mk:en;

// Keep guidance local to this review; drafts and application checks stay in the workshop.
export function mountReviewGuide(root,state,ui,repaint){
 const shell=root.querySelector('.review-studio'),results=root.querySelector('.ai-results');
 if(!shell)return;
 const active=state.workshops.active,sections=state.ai.sections;
 const guide=root.ownerDocument.createElement('section');guide.className='review-guide';guide.setAttribute('aria-label',say(ui,'Your next step','Твојот следен чекор'));
 guide.innerHTML=`<ol class="guide-steps"><li data-guide-step="edit">${say(ui,'1. Edit a section','1. Уреди секција')}</li><li data-guide-step="check">${say(ui,'2. Check the change','2. Провери ја измената')}</li><li data-guide-step="preview">${say(ui,'3. Download your CV','3. Преземи го CV-то')}</li></ol><div class="guide-copy" tabindex="-1"><h4></h4><p></p></div><div class="guide-actions"></div>`;
 shell.prepend(guide);
 const showGuide=()=>root.querySelector('.review-guide')?.scrollIntoView({block:'start',behavior:'instant'});
 const select=index=>{shell.querySelector(`[data-select-section="${index}"]`)?.click();showGuide()};
 const actions=guide.querySelector('.guide-actions');
 const action=(text,handler,primary=false)=>{const button=root.ownerDocument.createElement('button');button.type='button';button.className=primary?'primary':'secondary';button.textContent=text;button.onclick=handler;actions.append(button);return button};
 const update=()=>{
  const view=state.studioView||'edit',draft=state.workshops.drafts[active];
  const checking=!!draft?.preview&&view!=='preview',welcome=active===null&&view!=='preview';
  shell.dataset.guided=welcome?'welcome':view==='preview'?'preview':checking?'checking':'editing';
  const step=view==='preview'?'preview':checking?'check':'edit';
  guide.querySelectorAll('[data-guide-step]').forEach(item=>{if(item.dataset.guideStep===step)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current')});
  const title=guide.querySelector('h4'),copy=guide.querySelector('.guide-copy p');actions.replaceChildren();
  if(welcome){
   title.textContent=say(ui,'Your review is ready.','Проверката е готова. Уреди една по една секција.');
   copy.textContent=say(ui,'Start with one section. Check each change before saving. Your original stays unchanged.','Ќе ти помогнеме да ја уредиш, провериш и зачуваш секоја измена. Оригиналот останува непроменет.');
   action(say(ui,`Start with ${sections[0].name}`,`Започни со ${sections[0].name}`),()=>select(0),true).id='review-guide-start';
   action(say(ui,'Just view my CV','Само прегледај го CV-то'),()=>root.querySelector('[data-studio-view="preview"]').click());
  }else if(view==='preview'){
   title.textContent=say(ui,'Check your CV, then download.','Провери го CV-то, па преземи го.');
   copy.textContent=say(ui,'Read the saved version below. Confirm the facts to enable the PDF download.','Прочитај ја зачуваната верзија подолу. Потврди ги фактите за да го преземеш PDF-от.');
   action(say(ui,'Keep editing','Продолжи со уредување'),()=>active===null?select(0):root.querySelector('[data-studio-view="edit"]').click());
  }else if(checking){
   title.textContent=say(ui,'Does this change look right?','Дали измената е точна?');
   copy.textContent=say(ui,'Compare the two versions below. If every detail is true, tick the box and save the change.','Спореди ги двете верзии подолу. Ако сите детали се точни, означи го полето и зачувај ја измената.');
   action(say(ui,'Back to editing','Назад кон уредување'),()=>{const input=shell.querySelector('[data-section-draft]');input.dispatchEvent(new root.ownerDocument.defaultView.Event('input',{bubbles:true}));input.focus({preventScroll:true});showGuide()});
  }else if(draft?.lastApplied&&draft.body===draft.base){
   title.textContent=say(ui,`${sections[active].name} saved.`,'Измената е зачувана.');
   copy.textContent=say(ui,'You can move on, keep editing this section, or undo your change.','Продолжи, уреди ја секцијата повторно или врати ја измената.');
   if(active+1<sections.length)action(say(ui,`Next: ${sections[active+1].name}`,`Следно: ${sections[active+1].name}`),()=>select(active+1),true);
   else action(say(ui,'Check & download my CV','Провери и преземи го CV-то'),()=>root.querySelector('[data-studio-view="preview"]').click(),true);
  }else{
   title.textContent=say(ui,`Section ${active+1} of ${sections.length}: ${sections[active].name}`,`Секција ${active+1} од ${sections.length}: ${sections[active].name}`);
   copy.textContent=workshopKind(sections[active])?say(ui,'Edit your draft below, then choose “Check my change”.','Уреди го нацртот подолу. Потоа избери „Провери ја измената“.'):say(ui,'Read the advice below. You can edit this section in the full document.','Прочитај ги советите подолу. Оваа секција можеш да ја уредиш во целиот документ.');
   if(active+1<sections.length)action(say(ui,'Skip this section','Прескокни ја секцијата'),()=>select(active+1));
   else action(say(ui,'Check & download my CV','Провери и преземи го CV-то'),()=>root.querySelector('[data-studio-view="preview"]').click());
  }
 };
 const toolbar=shell.querySelector('.studio-toolbar');toolbar.querySelector('h3').textContent=say(ui,'Improve your CV','Подобри го CV-то');
 toolbar.querySelector('.eyebrow').hidden=true;
 shell.querySelectorAll('[data-studio-view]').forEach(button=>button.addEventListener('click',()=>{update();guide.querySelector('.guide-copy').focus({preventScroll:true});guide.scrollIntoView({block:'start',behavior:'instant'})}));
 root.querySelector('#review-show-edited').addEventListener('click',update);
 const panel=shell.querySelector('[data-workshop]');
 if(panel){
  const help=panel.querySelector('.studio-writing-help');
  if(help){const disclosure=root.ownerDocument.createElement('details');disclosure.className='guide-writing-help';disclosure.innerHTML=`<summary>${say(ui,'Need wording ideas?','Ти требаат идеи за текст?')}</summary>`;help.replaceWith(disclosure);disclosure.append(help)}
  const check=panel.querySelector('[data-preview-section]');check.textContent=say(ui,'Check my change','Провери ја измената');check.className='primary';check.addEventListener('click',()=>{update();if(state.workshops.drafts[active]?.preview)panel.querySelector('.workshop-preview').scrollIntoView({block:'center',behavior:'instant'})});
  panel.querySelector('[data-apply-section]').addEventListener('click',showGuide);
  panel.addEventListener('input',update);panel.addEventListener('click',event=>{if(event.target.closest('[data-compose],[data-add-phrase]'))update()});
  panel.querySelector('[data-close-workshop]').onclick=()=>{state.workshops.active=null;state.studioView='edit';repaint();root.querySelector('#review-guide-start')?.focus()};
 }
 const details=root.ownerDocument.createElement('details');details.className='guide-full-feedback';details.innerHTML=`<summary>${say(ui,'Read the full review','Прочитај ја целата проверка')}</summary>`;
 for(const node of [...results.children])if(node.matches('.review-next,.section-card-heading,.report-details,.rewrite-card,.suggested-wording-heading'))details.append(node);
 shell.after(details);root.querySelector('#review-show-edited').hidden=true;
 update();
}
