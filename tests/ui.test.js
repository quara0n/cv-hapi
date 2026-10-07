import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {JSDOM} from 'jsdom';import {build} from 'esbuild';
const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',loader:{'.css':'empty'},define:{'import.meta.env.VITE_POSTHOG_KEY':'""','import.meta.env.VITE_POSTHOG_HOST':'"https://eu.i.posthog.com"'},logLevel:'silent'});

test('Macedonian guide entry opens the free editor with a selected template and preserves saved content',()=>{
 const dom=boot(JSON.stringify({name:'Saved Person',summary:'Existing profile',template:'horizon',language:'en'}),'https://cv.test/mk/?start=builder&template=classic'),d=dom.window.document;
 assert.equal(d.documentElement.lang,'mk');assert.ok(d.querySelector('main').classList.contains('builder-started'));
 assert.equal(d.querySelector('#name').value,'Saved Person');assert.ok(d.querySelector('.paper.classic'));
 assert.equal(d.querySelector('#review-toggle').getAttribute('aria-expanded'),'false');assert.equal(d.activeElement.id,'step-heading');
 assert.equal(JSON.parse(dom.window.localStorage.getItem('cekor.cv.v1')).template,'horizon');dom.window.close();
});
test('invalid templates are ignored and builder entry cannot override the review route',()=>{
 const dom=boot(null,'https://cv.test/mk/?start=builder&template=unknown');assert.ok(dom.window.document.querySelector('.paper'));assert.ok(!dom.window.document.querySelector('.paper.unknown'));dom.window.close();
 const review=boot(null,'https://cv.test/mk/review/?start=builder');assert.equal(review.window.document.querySelector('#review-toggle').getAttribute('aria-expanded'),'true');review.window.close();
});

test('review landing URLs open the matching language and disclose the one-time price',()=>{
 for(const language of ['mk','en']){
  const dom=boot(null,`https://cv.test/${language}/review/`),d=dom.window.document;
  assert.equal(d.documentElement.lang,language);assert.equal(d.querySelector('#review-toggle').getAttribute('aria-expanded'),'true');
  assert.match(d.title,/150 MKD/);assert.match(d.querySelector('.review-price').textContent,/150 (MKD|денари)/);assert.ok(d.querySelector('#review-source'));
  dom.window.close();
 }
});
test('private CV-only backend explains its scope and prevents unsupported letter submissions',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.fetch=async()=>({ok:true,json:async()=>({available:true,testMode:'private_cv_only'})});
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();
 assert.match(d.querySelector('#review-ai-privacy').textContent,/private owner test/);assert.match(d.querySelector('#ai-availability').textContent,/CV-only/);assert.equal(d.querySelector('#review-consent').disabled,false);
 d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#review-ai').disabled,false);
 const letter=d.querySelector('#review-letter');letter.value='An optional cover letter';letter.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('#review-ai').disabled,true);
 letter.value='';letter.dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#review-ai').disabled,false);dom.window.close();
});
function boot(saved,url='https://cv.test'){const dom=new JSDOM('<div id="app"></div>',{url,runScripts:'outside-only'});dom.window.structuredClone=structuredClone;dom.window.navigator.locks={request:async(name,callback)=>callback()};dom.window.HTMLElement.prototype.scrollIntoView=function(options){dom.window.lastScroll={id:this.id,options}};dom.window.matchMedia=()=>({matches:false});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};if(saved)dom.window.localStorage.setItem('cekor.cv.v1',saved);dom.window.localStorage.setItem('cekor.ui-language','en');dom.window.eval(bundle.outputFiles[0].text);return dom}
test('start choices recommend import and preserve a saved CV when continuing the builder',()=>{
 const saved=JSON.stringify({name:'Alex Example',summary:'My existing profile',template:'horizon'}),dom=boot(saved),d=dom.window.document;
 d.querySelector('.hero-actions [data-action="start"]').click();assert.equal(d.querySelector('#modal').open,true);assert.ok(d.querySelector('[data-start-import]').classList.contains('recommended'));assert.match(d.querySelector('[data-start-build]').textContent,/Continue my CV/);
 d.querySelector('[data-start-build]').click();assert.ok(d.querySelector('main').classList.contains('builder-started'));assert.equal(d.querySelector('#name').value,'Alex Example');assert.ok(d.querySelector('.paper.horizon'));
 d.querySelector('[data-home]').click();d.querySelector('.hero-actions [data-action="start"]').click();d.querySelector('[data-start-import]').click();assert.ok(d.querySelector('.review-panel.import-mode'));assert.equal(d.querySelector('#review-source').value,'');assert.equal(d.querySelector('#review-consent').checked,false);dom.window.close();
});
test('dropping a document stages it until import and never submits it to AI',async()=>{
 const dom=boot(),w=dom.window,d=w.document;const requests=[];w.fetch=async url=>{requests.push(url);return{ok:true,json:async()=>({available:true})}};
 d.querySelector('.hero-actions [data-action="start"]').click();d.querySelector('[data-start-import]').click();await new Promise(r=>setTimeout(r,0));
 const text='Alex Example. I help residents with meals and daily activities and communicate with colleagues.';let reads=0;
 const drop=new w.Event('drop',{cancelable:true});Object.defineProperty(drop,'dataTransfer',{value:{files:[{name:'my-cv.txt',size:100,text:async()=>{reads++;return text}}]}});d.querySelector('#review-dropzone').dispatchEvent(drop);
 assert.equal(reads,0);assert.match(d.querySelector('#review-file-name').textContent,/my-cv.txt/);assert.equal(d.querySelector('#review-import-submit').disabled,false);
 d.querySelector('#review-import-submit').click();for(let i=0;i<20&&d.querySelector('#review-source').value!==text;i++)await new Promise(r=>setTimeout(r,0));
 assert.equal(reads,1);assert.equal(d.querySelector('#review-source').value,text);assert.equal(d.querySelector('.review-panel').classList.contains('import-mode'),false);assert.equal(d.querySelector('#review-consent').checked,false);assert.ok(!requests.includes('/api/review'));dom.window.close();
});
test('a staged replacement file can be imported and switching source clears its pending state',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.fetch=async()=>({ok:true,json:async()=>({available:true})});
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();
 const stage=()=>{const event=new w.Event('drop',{cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{files:[{name:'replacement.txt',size:100,text:async()=> 'Replacement CV text with sufficient experience and qualifications to review its contents safely.'}]}});d.querySelector('#review-dropzone').dispatchEvent(event)};
 stage();assert.ok(d.querySelector('.review-panel.import-mode'));assert.equal(d.querySelector('#review-import-submit').disabled,false);
 w.confirm=()=>true;d.querySelector('#review-from').click();assert.equal(d.querySelector('.review-panel').classList.contains('import-mode'),false);assert.equal(d.querySelector('#review-file-name').textContent,'');assert.equal(d.querySelector('#review-import-submit').disabled,true);
 stage();d.querySelector('#review-paste').click();assert.equal(d.querySelector('.review-panel').classList.contains('import-mode'),false);assert.equal(d.querySelector('#review-import-submit').disabled,true);assert.equal(d.querySelector('#review-consent').checked,false);dom.window.close();
});
test('the review choice keeps optional inputs collapsed and continues to free editing without an AI request',async()=>{
 const dom=boot(),w=dom.window,d=w.document;const requests=[];w.fetch=async url=>{requests.push(url);return{ok:true,json:async()=>({available:true})}};
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();
 assert.match(d.querySelector('#review-local').textContent,/Continue without AI/);assert.equal(d.querySelector('.review-extras').open,false);assert.equal(d.querySelector('.review-source-options').open,false);assert.equal(d.querySelector('#review-consent').checked,false);
 const original=d.querySelector('#review-source').value;d.querySelector('#review-local').click();assert.ok(d.querySelector('.review-panel.free-edit'));assert.equal(d.querySelector('#review-edited').value,original);assert.equal(d.querySelector('#review-consent').checked,false);assert.ok(!requests.includes('/api/review'));assert.equal(d.querySelector('#review-pdf').disabled,true);d.querySelector('#review-checked').click();assert.equal(d.querySelector('#review-pdf').disabled,false);
 d.querySelector('#review-edited').value=original+' My added detail.';d.querySelector('#review-edited').dispatchEvent(new w.Event('input'));d.querySelector('#review-choice-back').click();assert.equal(d.querySelector('.review-panel').classList.contains('free-edit'),false);assert.equal(d.querySelector('#review-source').value,original+' My added detail.');assert.equal(d.querySelector('#review-consent').checked,false);assert.ok(!requests.includes('/api/review'));dom.window.close();
});
test('owned bundle credits require an explicit review action after consent and payment refresh',async()=>{
 const dom=boot(),w=dom.window,d=w.document;let reviews=0;
 w.fetch=async url=>{if(url==='/api/review'){reviews++;return{ok:false,status:503,json:async()=>({error:'unavailable'})}}return{ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:true,test:false}:{state:'paid',remainingReviews:3}}};
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(reviews,0);assert.match(d.querySelector('#review-ai').textContent,/Use a review.*3 remaining/);
 w.dispatchEvent(new w.Event('focus'));await new Promise(r=>setTimeout(r,0));assert.equal(reviews,0);
 d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));assert.equal(reviews,1);dom.window.close();
});
test('paid delivery acknowledgement follows a valid review and its failure preserves the result',async()=>{
 for(const confirmed of [true,false]){
  const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;const calls=[];
  w.fetch=async(url,options)=>{
   if(url==='/api/review/status')return{ok:true,json:async()=>({available:true})};
   if(url==='/api/payments/config')return{ok:true,json:async()=>({enabled:false})};
   calls.push(url);
   if(url==='/api/payments/delivered'){assert.deepEqual(JSON.parse(options.body),{token:'a'.repeat(64)});return{ok:confirmed,json:async()=>({state:'used'})};}
   return{ok:true,headers:{get:()=> 'a'.repeat(64)},json:async()=>({overview:'Complete feedback.',sections:[{document:'cv',name:'Profile',assessment:'Clarify your duties.',actions:[]}],priorities:[{title:'Details',why:'Brief',action:'Add real duties.'}],suggestions:[]})};
  };
  d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
  assert.deepEqual(calls,['/api/review','/api/payments/delivered']);assert.ok(d.querySelector('#review-results-title'));assert.ok(d.querySelector('#review-edited'));
  if(!confirmed)assert.match(d.querySelector('#review-message').textContent,/Delivery confirmation failed/);
  dom.window.close();
 }
});
test('returning to an exhausted review refreshes restored availability without clearing the CV',async()=>{
 const dom=boot(),w=dom.window,d=w.document;let restored=false,posted=0;
 w.fetch=async url=>{if(url==='/api/review')posted++;return{ok:true,json:async()=>url==='/api/review/status'?{available:restored,remaining:restored?1:0}:{enabled:false}}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));
 const source='Alex Example\nPROFILE\nI help people with daily activities and communicate clearly with colleagues.';
 d.querySelector('#review-source').value=source;d.querySelector('#review-source').dispatchEvent(new w.Event('input'));
 assert.equal(d.querySelector('#review-consent').disabled,true);
 restored=true;w.dispatchEvent(new w.Event('focus'));await new Promise(r=>setTimeout(r,0));
 assert.equal(d.querySelector('#review-consent').disabled,false);assert.equal(d.querySelector('#review-source').value,source);
 d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#review-consent').checked,true);assert.equal(d.querySelector('#review-ai').disabled,false);assert.equal(posted,0);dom.window.close();
});
test('writing help adapts to the entered profession and examples never change the CV automatically',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let calls=0;
 const source='Alex Example\nCare assistant\nPROFILE\nI help people with daily activities and communicate clearly with colleagues.';
 w.fetch=async url=>{if(url==='/api/review')calls++;return{ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:false}:{overview:'Reviewed.',priorities:[{title:'Improve profile',why:'Needs details',action:'Add your focus.'}],sections:[{document:'cv',name:'Profile',assessment:'A clear starting point. Full assessment stays available.',actions:['Add your actual focus.','Describe your approach.']}],suggestions:[]}}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));const input=d.querySelector('#review-source');input.value=source;input.dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(d.querySelector('.report-details').open,false);assert.equal(d.querySelector('#section-advice-0').closest('details').open,false);
 d.querySelector('[data-build-section="0"]').click();d.querySelector('.workshop-details summary').click();const originalDraft=d.querySelector('[data-section-draft]').value;
 const role=d.querySelector('[data-detail="role"]');role.value='Chiropractor';role.dispatchEvent(new w.Event('input'));
 assert.match(d.querySelector('[data-field-help="focus"]').textContent,/Helping patients manage pain/);assert.equal(d.querySelector('#review-edited').value,source);assert.equal(d.querySelector('[data-section-draft]').value,originalDraft);
 const help=d.querySelector('[data-field-help="focus"] details'),trigger=help.querySelector('summary');trigger.dispatchEvent(new w.Event('mouseenter'));help.dispatchEvent(new w.Event('mouseenter'));assert.equal(help.open,true);help.dispatchEvent(new w.Event('mouseleave'));assert.equal(help.open,false);
 trigger.click();assert.equal(help.open,true);help.querySelector('[data-example-field]').click();assert.match(d.querySelector('[data-detail="focus"]').value,/Helping patients manage pain/);assert.equal(d.querySelector('#review-edited').value,source);
 const approach=d.querySelector('[data-example-field="approach"]');approach.click();d.querySelector('[data-compose]').click();assert.match(d.querySelector('[data-section-draft]').value,/Chiropractor focused on Helping patients/);assert.equal(d.querySelector('#review-source').value,source);assert.equal(calls,1);
 const summary=d.querySelector('[data-field-help="strengths"] summary');summary.focus();assert.equal(summary.closest('details').open,true);summary.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(summary.closest('details').open,false);
 dom.window.close();
});
test('review studio navigates sections without losing drafts and previews only the revised document',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let calls=0;
 const source='Alex Example\nPROFILE\nI help people with daily activities and communicate clearly with colleagues.\nSKILLS\nCommunication';
 w.fetch=async url=>{if(url==='/api/review')calls++;return{ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:false}:{overview:'Reviewed.',sections:[{document:'cv',name:'Profile',assessment:'Clarify your focus.',actions:[]},{document:'cv',name:'Skills',assessment:'List actual skills.',actions:[]}],suggestions:[]}}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-source').value=source;d.querySelector('#review-source').dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(d.querySelectorAll('[data-select-section]').length,2);
 for(const id of ['review-source','review-job','review-letter','review-file'])assert.ok(d.querySelector('.studio-source #'+id));
 assert.equal(d.querySelector('.review-studio').dataset.guided,'welcome');assert.equal(d.querySelector('.guide-full-feedback').open,false);
 d.querySelector('#review-guide-start').click();assert.equal(d.querySelector('.review-studio').dataset.guided,'editing');assert.equal(d.querySelector('.guide-writing-help').open,false);
 const draft=d.querySelector('[data-section-draft]');draft.value='My unsaved wording.';draft.dispatchEvent(new w.Event('input'));assert.doesNotMatch(d.querySelector('.studio-paper').textContent,/My unsaved wording/);
 d.querySelector('[data-select-section="1"]').click();assert.equal(d.querySelector('[data-select-section="1"]').getAttribute('aria-current'),'step');d.querySelector('[data-select-section="0"]').click();assert.equal(d.querySelector('[data-section-draft]').value,'My unsaved wording.');
 d.querySelector('[data-preview-section]').click();assert.equal(d.querySelector('[data-guide-step="check"]').getAttribute('aria-current'),'step');assert.equal(d.querySelector('[data-apply-section]').disabled,true);assert.doesNotMatch(d.querySelector('#review-edited').value,/My unsaved wording/);
 d.querySelector('[data-select-section="1"]').click();d.querySelector('[data-select-section="0"]').click();assert.equal(d.querySelector('.review-studio').dataset.guided,'editing');assert.equal(d.querySelector('.workshop-apply').hidden,true);assert.equal(d.querySelector('[data-section-draft]').value,'My unsaved wording.');
 d.querySelector('[data-preview-section]').click();d.querySelector('[data-ui-language="mk"]').click();assert.equal(d.querySelector('.review-studio').dataset.guided,'editing');assert.equal(d.querySelector('.workshop-apply').hidden,true);d.querySelector('[data-ui-language="en"]').click();
 d.querySelector('[data-preview-section]').click();d.querySelector('[data-confirm-section]').click();d.querySelector('[data-apply-section]').click();assert.match(d.querySelector('.guide-copy h4').textContent,/Profile saved/);assert.match(d.querySelector('#review-edited').value,/My unsaved wording/);
 d.querySelector('.guide-actions button').click();assert.equal(d.querySelector('[data-select-section="1"]').getAttribute('aria-current'),'step');assert.equal(d.querySelector('[data-section-draft]').value,'Communication');
 const edited=d.querySelector('#review-edited');edited.value=source.replace('Communication','Communication and teamwork');edited.dispatchEvent(new w.Event('input'));assert.match(d.querySelector('.studio-paper').textContent,/Communication and teamwork/);
 d.querySelector('[data-studio-view="preview"]').click();assert.equal(d.querySelector('[data-studio-view="preview"]').getAttribute('aria-pressed'),'true');assert.equal(d.querySelector('#review-source').value,source);assert.equal(calls,1);dom.window.close();
});
test('visible wording ideas open the editor, append optional phrases and block unfilled placeholders',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let calls=0;
 const source='Alex Example\nChiropractor\nPROFILE\nI explain treatment options and agree goals with my patients.\nSKILLS\nCommunication';
 w.fetch=async url=>{if(url==='/api/review')calls++;return{ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:false}:{overview:'Reviewed.',sections:[{document:'cv',name:'Profile',assessment:'Clarify it.',actions:[]}],suggestions:[{document:'cv',original:'I explain treatment options and agree goals with my patients.',revised:'I explain treatment options and set goals with my patients.',reason:'Concise wording.'}]}}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));const input=d.querySelector('#review-source');input.value=source;input.dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 assert.match(d.querySelector('.section-wording').textContent,/My focus is to help patients/);assert.equal(d.querySelector('.wording-details').open,true);assert.match(d.querySelector('.suggested-wording-heading').textContent,/Suggested wording/);
 d.querySelector('[data-wording-section="0"]').click();const draft=d.querySelector('[data-section-draft]').value;assert.equal(d.querySelectorAll('.inside-wording [data-add-phrase]').length,2);
 d.querySelector('[data-add-phrase="0"]').click();assert.ok(d.querySelector('[data-section-draft]').value.startsWith(draft));assert.match(d.querySelector('[data-section-draft]').value,/\[goal\]/);assert.equal(d.querySelector('#review-edited').value,source);assert.equal(d.querySelector('#review-source').value,source);
 d.querySelector('[data-preview-section]').click();assert.equal(d.querySelector('.workshop-apply').hidden,true);assert.match(d.querySelector('.workshop-status').textContent,/placeholder/);assert.equal(calls,1);dom.window.close();
});
test('section workshop adds real details locally, gates application, preserves originals and undoes without a new review',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let posted=0;
 const source='Alex Example\nCare assistant\nPROFILE\nI support people in daily activities.\nWORK EXPERIENCE\nAssistant | Example Home | 2020–2021\nSKILLS\nCommunication\nLANGUAGES\nEnglish';
 w.fetch=async url=>{if(url==='/api/review'){posted++;return{ok:true,json:async()=>({overview:'Add missing training details.',sections:[{document:'cv',name:'Education and qualifications',assessment:'Education is not stated.',actions:['Add your actual qualification.']}],suggestions:[]})}}return{ok:true,json:async()=>url==='/api/review/status'?{available:true}:{enabled:false}}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));
 const fill=(selector,value)=>{const field=d.querySelector(selector);field.value=value;field.dispatchEvent(new w.Event('input'))};
 fill('#review-source',source);d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 d.querySelector('[data-build-section="0"]').click();assert.equal(d.activeElement.id,'workshop-title-0');
 d.querySelector('[data-compose]').click();assert.match(d.querySelector('.workshop-status').textContent,/Fill in/);
 for(const [id,value] of [['qualification','Diploma in care'],['organization','Example College'],['dates','2024'],['details','A practical care project.']])fill(`[data-detail="${id}"]`,value);
 d.querySelector('[data-compose]').click();assert.match(d.querySelector('[data-section-draft]').value,/Diploma in care/);
 d.querySelector('[data-preview-section]').click();assert.equal(d.querySelector('[data-apply-section]').disabled,true);assert.match(d.querySelector('.workshop-preview').textContent,/New section to add/);
 d.querySelector('[data-confirm-section]').click();d.querySelector('[data-apply-section]').click();
 assert.match(d.querySelector('#review-edited').value,/EDUCATION\nDiploma in care\nExample College \| 2024\nA practical care project\.\n\nSKILLS/);assert.equal(d.querySelector('#review-source').value,source);assert.equal(d.querySelector('#review-checked').checked,false);assert.equal(posted,1);
 fill('#review-edited',d.querySelector('#review-edited').value.replace('Communication','Communication\nCooking'));
 d.querySelector('[data-undo-section]').click();assert.equal(d.querySelector('#review-edited').value,source.replace('Communication','Communication\nCooking'));assert.equal(d.querySelector('#review-source').value,source);assert.equal(posted,1);
 fill('[data-section-draft]','[Your qualification]');d.querySelector('[data-preview-section]').click();assert.equal(d.querySelector('.workshop-apply').hidden,true);assert.match(d.querySelector('.workshop-status').textContent,/placeholder/);dom.window.close();
});
test('section preview cannot overwrite an edited document and drafts survive section switching and language changes',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;
 const source='Alex Example\nPROFILE\nI help people with daily activities and work alongside colleagues.\nSKILLS\nCommunication';
 w.fetch=async url=>({ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:false}:{overview:'Reviewed.',sections:[{document:'cv',name:'Profile',assessment:'Clarify it.',actions:[]},{document:'cv',name:'Education',assessment:'Missing.',actions:[]}],suggestions:[]}});
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));const fill=(selector,value)=>{const x=d.querySelector(selector);x.value=value;x.dispatchEvent(new w.Event('input'))};fill('#review-source',source);d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 d.querySelector('[data-build-section="0"]').click();fill('[data-section-draft]','I assist people with daily activities and collaborate with colleagues.');d.querySelector('[data-preview-section]').click();d.querySelector('[data-confirm-section]').click();fill('#review-edited',source+'\nMy newer edit.');d.querySelector('[data-apply-section]').click();assert.equal(d.querySelector('#review-edited').value,source+'\nMy newer edit.');assert.match(d.querySelector('.workshop-status').textContent,/document changed/i);
 d.querySelector('[data-build-section="1"]').click();fill('[data-detail="qualification"]','My course');d.querySelector('[data-build-section="0"]').click();assert.match(d.querySelector('[data-section-draft]').value,/I assist people/);d.querySelector('[data-ui-language="mk"]').click();assert.match(d.querySelector('[data-build-section="0"]').textContent,/Подготви/);assert.match(d.querySelector('[data-section-draft]').value,/I assist people/);d.querySelector('[data-build-section="1"]').click();assert.equal(d.querySelector('[data-detail="qualification"]').value,'My course');dom.window.close();
});
test('extensive AI feedback displays priorities, section actions and anchored vacancy evidence safely',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;
 const source='I answer customer questions and help customers choose suitable products. I work together with colleagues.';
 w.fetch=async url=>({ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:false}:{overview:'Full assessment',priorities:[{title:'<img src=x>',why:'Experience lacks context.',action:'Describe a true responsibility.'}],sections:[{document:'cv',name:'Profile',assessment:'Clarify your focus.',actions:['Explain your relevant experience.']}],jobMatches:[{requirement:'answer customer questions',evidence:'I answer customer questions',advice:'Describe the questions you handled.'}],suggestions:[]}});
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));
 for(const [id,value] of [['review-source',source],['review-job','You will answer customer questions.']]){const field=d.getElementById(id);field.value=value;field.dispatchEvent(new w.Event('input'))}
 d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 const output=d.querySelector('.ai-results');assert.match(output.querySelector('.review-next').textContent,/1 section reviewed · 1 priority · 1 section recommendation · 0 suggested changes/);assert.match(output.textContent,/Your improvement plan/);assert.match(output.textContent,/Your CV sections/);assert.match(output.textContent,/Vacancy match/);assert.match(output.textContent,/Describe a true responsibility/);assert.match(output.textContent,/Explain your relevant experience/);assert.equal(output.querySelector('img'),null);assert.equal(d.querySelector('#review-source').value,source);dom.window.close();
});
test('AI checkout appears only after document preparation and consent, then verified payment unlocks review',async()=>{
 const dom=boot(),w=dom.window,d=w.document;let paid=false,posted=0,configCalls=0;w.AbortSignal=AbortSignal;
 w.fetch=async(url,options)=>{if(url==='/api/review/status')return{ok:true,json:async()=>({available:true})};if(url==='/api/payments/config'){configCalls++;return{ok:true,json:async()=>({enabled:true,test:true})}}if(url==='/api/payments/status')return{ok:true,json:async()=>({state:paid?'paid':'none'})};assert.equal(url,'/api/review');assert.equal(JSON.parse(options.body).consent,true);posted++;return{ok:true,json:async()=>({overview:'Reviewed',suggestions:[]})}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));assert.equal(configCalls,0);assert.equal(d.querySelector('.payment-choice'),null);
 assert.match(d.querySelector('.ai-disclosure').textContent,/DeepSeek/);assert.equal(d.querySelector('.ai-disclosure').open,false);assert.doesNotMatch(d.querySelector('.ai-choice h3').textContent,/DeepSeek/);
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-from').click();assert.equal(configCalls,0);d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));assert.equal(configCalls,1);assert.match(d.querySelector('[data-buy]').textContent,/150 MKD/);assert.equal(d.querySelector('#review-ai').disabled,false);
 const modal=d.querySelector('dialog.purchase-modal');assert.equal(modal.open,false);assert.equal(posted,0);d.querySelector('#review-ai').click();assert.equal(modal.open,true);assert.equal(posted,0);d.querySelector('[data-modal-close]').click();assert.equal(modal.open,false);d.querySelector('#review-ai').click();assert.equal(modal.open,true);
 paid=true;d.querySelector('[data-check]').click();await new Promise(r=>setTimeout(r,0));assert.equal(posted,0);d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));assert.equal(posted,1);assert.equal(d.querySelector('#review-ai').disabled,true);assert.ok(d.querySelector('.ai-results'));dom.window.close();
});
test('returning from paid checkout starts AI automatically and focuses completed feedback',async()=>{
 const dom=boot(),w=dom.window,d=w.document;let paid=false;w.AbortSignal=AbortSignal;
 w.fetch=async url=>({ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:true,test:false}:url==='/api/payments/status'?{state:paid?'paid':'none'}:url.startsWith('/api/payments/checkout')?{url:'https://checkout.stripe.com/c/pay/test'}:{overview:'Clearer wording.',suggestions:[{document:'cv',original:'Skilled at cooking',revised:'Cooking skills',reason:'More concise.'}]}});
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();const source=d.querySelector('#review-source');source.value='Skilled at cooking. Communicating clearly with colleagues. Experience preparing meals in a busy kitchen.';source.dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));
 d.querySelector('#review-ai').click();d.querySelector('[data-sales-consent]').click();d.querySelector('[data-buy]').click();await new Promise(r=>setTimeout(r,0));
 paid=true;w.dispatchEvent(new w.Event('focus'));await new Promise(r=>setTimeout(r,0));
 assert.equal(d.querySelector('#review-ai').disabled,true);
 w.dispatchEvent(new w.Event('focus'));await new Promise(r=>setTimeout(r,0));
 assert.equal(d.activeElement.id,'review-results-title');assert.equal(w.lastScroll.id,'review-results-title');assert.equal(d.querySelector('.payment-choice'),null);assert.equal(d.querySelector('#review-ai').disabled,true);
 assert.match(d.querySelector('.ai-results').textContent,/suggested change/i);assert.match(d.querySelector('.ai-results').textContent,/original.*unchanged/i);
 d.querySelector('[data-accept]').click();assert.match(d.querySelector('.rewrite-card').className,/applied/);assert.equal(d.activeElement.dataset.accept,'0');
 d.querySelector('[data-accept]').click();assert.match(d.querySelector('#review-show-edited').textContent,/1 suggestions applied/);
 d.querySelector('#review-show-edited').click();assert.equal(d.activeElement.id,'review-edited');assert.match(d.querySelector('#review-edited').value,/Cooking skills/);assert.match(d.querySelector('#review-source').value,/Skilled at cooking/);
 dom.window.close();
});
test('payment return verifies status and resumes the original tab without linking to a fresh homepage',async()=>{
 for(const state of ['paid','pending']){
  let notifications=0,closed=0;
  const dom=new JSDOM(readFileSync('public/payment-return.html','utf8'),{url:'https://cv.test/payment-return.html',runScripts:'dangerously',beforeParse(w){w.fetch=async()=>({ok:true,json:async()=>({state})});w.BroadcastChannel=class{postMessage(value){assert.deepEqual(JSON.parse(JSON.stringify(value)),{type:'payment-return'});notifications++}close(){}};w.close=()=>closed++}});
  await new Promise(r=>setTimeout(r,0));const d=dom.window.document;
  assert.equal(d.querySelector('a'),null);assert.match(d.querySelector('#payment-status').textContent,state==='paid'?/Payment verified/:/not been confirmed/);
  assert.doesNotMatch(d.querySelector('main').textContent,/[\u0400-\u04ff]/);assert.equal(d.documentElement.lang,'en');
  d.querySelector('#return').click();assert.equal(closed,1);assert.ok(notifications>=2);dom.window.close();
 }
});
test('Macedonian checkout return displays only the selected language',async()=>{
 const dom=new JSDOM(readFileSync('public/payment-return.html','utf8'),{url:'https://cv.test/payment-return.html?language=mk',runScripts:'dangerously',beforeParse(w){w.fetch=async()=>({ok:true,json:async()=>({state:'paid'})})}});
 await new Promise(r=>setTimeout(r,0));assert.equal(dom.window.document.documentElement.lang,'mk');assert.doesNotMatch(dom.window.document.querySelector('main').textContent,/Payment verified|Back to my CV review/);assert.match(dom.window.document.querySelector('#payment-status').textContent,/Плаќањето е потврдено/);dom.window.close();
});
test('complimentary local review requires consent and completes without another checkout',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let posted=0;
 w.fetch=async url=>{if(url==='/api/review'){posted++;return{ok:true,json:async()=>({overview:'Completed local review',suggestions:[]})}}return{ok:true,json:async()=>url==='/api/review/status'?{available:true,remaining:1}:{enabled:true,test:true,ownerCredit:true,checkoutEnabled:false}}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));const source=d.querySelector('#review-source');source.value='An experienced assistant who helps customers find suitable products and communicates clearly with colleagues.';source.dispatchEvent(new w.Event('input'));
 assert.equal(d.querySelector('#review-ai').disabled,true);d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));assert.match(d.querySelector('.payment-choice').textContent,/No Stripe payment is needed/);assert.equal(d.querySelector('[data-buy]'),null);
 d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));assert.equal(posted,1);assert.match(d.querySelector('.ai-results').textContent,/Completed local review/);assert.equal(d.activeElement.id,'review-results-title');dom.window.close();
});
test('exhausted reviews still show the refund and never offer another purchase',async()=>{
 const dom=boot(),w=dom.window,d=w.document;
 w.fetch=async url=>({ok:true,json:async()=>url==='/api/review/status'?{available:false,remaining:0}:url==='/api/payments/config'?{enabled:true,test:true}:{state:'refunded'}});
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));
 const source=d.querySelector('#review-source');source.value='My CV text';source.dispatchEvent(new w.Event('input'));await new Promise(r=>setTimeout(r,0));
 assert.match(d.querySelector('.payment-choice [role=status]').textContent,/Refund confirmed/);
 assert.equal(d.querySelector('[data-buy]').hidden,true);assert.equal(d.querySelector('[data-check]').hidden,false);assert.equal(d.querySelector('#review-ai').disabled,true);dom.window.close();
});
test('a failed paid AI review focuses the error and reports the refund without showing the builder',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let paid=false;
 let attempted=false;w.fetch=async url=>{if(url==='/api/review'){attempted=true;return{ok:false,status:502,json:async()=>({error:'review_failed',reason:'timeout',payment:'refunded'})}}return{ok:true,json:async()=>url==='/api/review/status'?{available:!attempted,remaining:attempted?0:1}:url==='/api/payments/config'?{enabled:true,test:true}:{state:paid?'paid':'none'}}};
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));const source=d.querySelector('#review-source');source.value='I communicate clearly with colleagues and help people understand their treatment and exercises.';source.dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));paid=true;d.querySelector('[data-check]').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(d.activeElement.id,'review-message');assert.equal(w.lastScroll.id,'review-message');assert.match(d.querySelector('#review-message').textContent,/timed out/i);assert.match(d.querySelector('#review-message').textContent,/refund/i);assert.equal(d.querySelector('.workspace').hidden,true);assert.equal(d.querySelector('#review-source').value,source.value);assert.match(d.querySelector('#ai-availability').textContent,/allowance has been used/);assert.equal(d.querySelector('[data-buy]').hidden,true);assert.equal(d.querySelector('#review-ai').disabled,true);dom.window.close();
});
test('CV flow edits, reorders, deletes, changes template and restores saved draft',()=>{const dom=boot(),w=dom.window,d=w.document;const click=s=>d.querySelector(s).click(),fill=(s,v)=>{const x=d.querySelector(s);x.value=v;x.dispatchEvent(new w.Event('input',{bubbles:true}))};fill('#name','Ѓорѓи Тест');click('[data-step="4"]');fill('#summary','<img src=x onerror=alert(1)>');assert.equal(d.querySelector('.paper h2').textContent,'Ѓорѓи Тест');assert.equal(d.querySelector('.paper img'),null);click('[data-step="1"]');click('[data-add="experience"]');fill('#experience-0-title','First');click('[data-add="experience"]');fill('#experience-1-title','Second');click('[data-move="experience:1:-1"]');assert.equal(d.querySelector('#experience-0-title').value,'Second');click('[data-remove="experience:0"]');click('#modal-action');assert.equal(d.querySelector('#experience-0-title').value,'First');click('[data-step="5"]');click('input[value="compact"]');assert.ok(d.querySelector('.paper.compact'));const r=d.querySelector('#remember');r.checked=true;r.dispatchEvent(new w.Event('change'));const saved=w.localStorage.getItem('cekor.cv.v1');const restored=boot(saved);assert.equal(restored.window.document.querySelector('#name').value,'Ѓорѓи Тест');restored.window.close();dom.window.close()});
test('export validates name without downloading fictional example; reset removes saved data',()=>{const dom=boot(),d=dom.window.document;d.querySelector('[data-action="export"]').click();assert.equal(d.querySelector('#name').getAttribute('aria-invalid'),'true');assert.ok(!d.querySelector('#modal').open);d.querySelector('[data-action="example"]').click();assert.equal(d.querySelector('#name').value,'Ana Stojanovska');d.querySelector('[data-action="reset"]').click();d.querySelector('#modal-action').click();assert.equal(d.querySelector('#name').value,'');assert.equal(dom.window.localStorage.getItem('cekor.cv.v1'),null);dom.window.close()});
test('application flow validates, preserves text through language switch and blocks stale drafts',()=>{const dom=boot(),w=dom.window,d=w.document;const click=s=>d.querySelector(s).click(),fill=(s,v)=>{const el=d.querySelector(s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};click('#pack-open');click('#pack-create');assert.match(d.querySelector('#pack-message').textContent,/Enter your name/);click('[data-action="example"]');fill('#pack-role','Sales assistant');fill('#pack-why','I help customers choose products.');fill('#pack-own','I worked on the till.');fill('#pack-ad','<img src=x onerror=alert(1)>');click('#pack-create');assert.match(d.querySelector('#pack-letter').value,/I worked on the till/);assert.equal(d.querySelector('#application img'),null);fill('#pack-letter','My reviewed custom letter');click('[data-ui-language="mk"]');assert.equal(d.querySelector('#pack-letter').value,'My reviewed custom letter');assert.match(d.querySelector('#pack-ad').value,/onerror/);click('#pack-reviewed');assert.equal(d.querySelector('#pack-download').disabled,false);fill('#pack-role','New role');click('#pack-reviewed');assert.equal(d.querySelector('#pack-download').disabled,true);click('[data-action="reset"]');click('#modal-action');click('#pack-open');assert.equal(d.querySelector('#pack-role').value,'');assert.equal(d.querySelector('#pack-letter'),null);dom.window.close()});
test('review requires consent, escapes AI text and applies only approved wording',async()=>{const dom=boot(),w=dom.window,d=w.document;let posted=0;w.AbortSignal=AbortSignal;w.fetch=async(url,options)=>{if(!options?.body)return{ok:true,json:async()=>({available:true})};posted++;assert.equal(JSON.parse(options.body).consent,true);return{ok:true,json:async()=>({overview:'<img src=x onerror=alert(1)>',strengths:[],questions:[],suggestions:[{original:'Plan and deliver digital marketing campaigns.',revised:'Plan digital campaigns and coordinate delivery.',reason:'Clear action.'}]})}};d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(resolve=>setTimeout(resolve,0));d.querySelector('#review-from').click();assert.equal(d.querySelector('#review-ai').disabled,true);d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(posted,1);assert.equal(d.querySelector('.ai-results img'),null);assert.match(d.querySelector('#review-edited').value,/Plan and deliver/);d.querySelector('[data-accept="0"]').click();assert.match(d.querySelector('#review-edited').value,/Plan digital campaigns/);assert.match(d.querySelector('#review-source').value,/Plan and deliver/);assert.equal(d.querySelector('#review-pdf').disabled,true);d.querySelector('#review-checked').click();assert.equal(d.querySelector('#review-pdf').disabled,false);const field=d.querySelector('#review-job');const revised=d.querySelector('#review-edited').value;w.confirm=()=>false;const sourceField=d.querySelector('#review-source'),originalSource=sourceField.value;sourceField.value+=' ';sourceField.dispatchEvent(new w.Event('input'));assert.equal(sourceField.value,originalSource);assert.equal(d.querySelector('#review-edited').value,revised);field.value='Another job';field.dispatchEvent(new w.Event('input'));assert.ok(d.querySelector('.ai-results'));assert.equal(field.value,'');assert.equal(d.querySelector('#review-edited').value,revised);w.confirm=()=>true;field.value='Another job';field.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('.ai-results'),null);assert.equal(d.querySelector('#review-consent').checked,false);dom.window.close()});

test('review inputs stay locked until an in-flight response is delivered',async()=>{const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let finish;w.fetch=async(url)=>{if(url==='/api/review/status')return{ok:true,json:async()=>({available:true})};if(url==='/api/payments/config')return{ok:true,json:async()=>({enabled:false})};return new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({overview:'Complete',strengths:[],questions:[],suggestions:[]})})})};d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();for(const id of ['review-source','review-job','review-clear'])assert.equal(d.getElementById(id).disabled,true);let confirmations=0;w.confirm=()=>{confirmations++;return true};d.querySelector('#review-clear').click();d.querySelectorAll('[data-action="reset"]').forEach(button=>{assert.equal(button.disabled,true);button.click()});assert.equal(confirmations,0);d.querySelector('#pack-open').click();const vacancy=d.getElementById('pack-ad');vacancy.value='Changed during review';vacancy.dispatchEvent(new w.Event('input'));assert.equal(vacancy.value,'');assert.equal(d.getElementById('review-job').value,'');finish();await new Promise(r=>setTimeout(r,0));assert.ok(d.querySelector('.ai-results'));assert.equal(d.getElementById('review-source').disabled,false);dom.window.close()});

test('cover-letter acceptance edits only the letter and source replacement needs confirmation',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;
 const letter='I enjoy helping customers find suitable products.',revision='I enjoy helping customers select suitable products.';
 w.fetch=async(url,options)=>{if(!options?.body)return{ok:true,json:async()=>({available:true})};assert.equal(JSON.parse(options.body).letter,letter);return{ok:true,json:async()=>({overview:'Review',suggestions:[{document:'letter',original:letter,revised:revision,reason:'Clarity'}]})}};
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();const field=d.querySelector('#review-letter');field.value=letter;field.dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();assert.equal(d.querySelector('#review-letter').disabled,true);await new Promise(r=>setTimeout(r,0));
 const cv=d.querySelector('#review-edited').value;d.querySelector('[data-accept="0"]').click();assert.equal(d.querySelector('#review-edited-letter').value,revision);assert.equal(d.querySelector('#review-edited').value,cv);assert.equal(d.querySelector('#review-letter').value,letter);
 w.confirm=()=>false;const original=d.querySelector('#review-letter');original.value='Replacement';original.dispatchEvent(new w.Event('input'));assert.equal(original.value,letter);assert.equal(d.querySelector('#review-edited-letter').value,revision);dom.window.close();
});

test('step changes focus and scroll the new heading; missing name stays visibly explained',()=>{
 const dom=boot(),w=dom.window,d=w.document;
 d.querySelector('[data-step="1"]').click();assert.equal(d.activeElement.id,'step-heading');assert.equal(w.lastScroll.id,'step-heading');assert.equal(w.lastScroll.options.block,'start');
 d.querySelector('[data-action="export"]').click();assert.equal(d.activeElement.id,'name');assert.equal(d.querySelector('#name-error').hidden,false);assert.match(d.querySelector('#name-error').textContent,/Enter your full name/);dom.window.close();
});
test('email and reversed-date warnings are nonblocking and clear when corrected',()=>{
 const dom=boot(),w=dom.window,d=w.document;const fill=(id,value)=>{const el=d.getElementById(id);el.value=value;el.dispatchEvent(new w.Event('input'))};
 fill('name','Candidate');fill('email','marko@');assert.equal(d.getElementById('email-warning').hidden,false);d.querySelector('[data-action="export"]').click();assert.match(d.querySelector('#modal').textContent,/Check the email/);d.querySelector('[data-close]').click();
 fill('email','marko@example.com');assert.equal(d.getElementById('email-warning').hidden,true);
 d.querySelector('[data-step="1"]').click();d.querySelector('[data-add="experience"]').click();fill('experience-0-start','2022');fill('experience-0-end','2019');assert.equal(d.getElementById('experience-0-end-warning').hidden,false);fill('experience-0-end','Present');assert.equal(d.getElementById('experience-0-end-warning').hidden,true);dom.window.close();
});
test('shared vacancy syncs both ways and prevents overwriting a finished or in-flight review',async()=>{
 const dom=boot(),w=dom.window,d=w.document;const fill=(id,value)=>{const el=d.getElementById(id);el.value=value;el.dispatchEvent(new w.Event('input'))};w.fetch=async()=>({ok:true,json:async()=>({available:false})});
 d.querySelector('#pack-open').click();fill('pack-ad','Friendly service');d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));assert.equal(d.getElementById('review-job').value,'Friendly service');assert.equal(d.getElementById('review-consent').disabled,true);
 fill('review-job','Accurate cash handling');assert.equal(d.getElementById('pack-ad').value,'Accurate cash handling');
 fill('review-source','Customer service assistant with experience helping customers choose products and handling checkout transactions.');d.querySelector('#review-local').click();w.confirm=()=>false;fill('pack-ad','Replacement');assert.equal(d.getElementById('pack-ad').value,'Accurate cash handling');assert.ok(d.getElementById('review-edited'));
 w.confirm=()=>true;fill('pack-ad','New vacancy');assert.equal(d.getElementById('review-job').value,'New vacancy');assert.equal(d.getElementById('review-edited'),null);assert.equal(d.querySelector('.review-panel.free-edit'),null);dom.window.close();
});
test('sample is marked on the paper and requirement changes invalidate a reviewed letter',()=>{
 const dom=boot(),w=dom.window,d=w.document;const fill=(id,value)=>{const el=d.getElementById(id);el.value=value;el.dispatchEvent(new w.Event('input'))};assert.match(d.querySelector('.paper .sample-badge').textContent,/Example/);
 d.querySelector('[data-action="example"]').click();assert.equal(d.querySelector('.sample-badge'),null);d.querySelector('#pack-open').click();fill('pack-role','Assistant');fill('pack-requirement','Friendly service');fill('pack-why','I enjoy helping people.');fill('pack-own','Served customers.\nTrained colleagues.');d.querySelector('#pack-create').click();assert.match(d.getElementById('pack-letter').value,/Friendly service/);assert.match(d.getElementById('pack-letter').value,/• Trained colleagues/);
 assert.ok(d.querySelector('#pack-reviewed').labels.length);assert.ok(d.querySelector('[data-evidence]').labels.length);d.querySelector('#pack-reviewed').click();assert.equal(d.getElementById('pack-download').disabled,false);fill('pack-requirement','Cash handling');d.querySelector('#pack-reviewed').click();assert.equal(d.getElementById('pack-download').disabled,true);dom.window.close();
});

test('footer keeps support and removes seller details and stale pilot payment claims',()=>{const dom=boot(),d=dom.window.document;assert.match(d.querySelector('footer').textContent,/support@cvhapi.com/);assert.doesNotMatch(d.querySelector('footer').textContent,/RUNE FINNE|915553346|Test version|Free pilot|Payments are not active/);d.querySelector('[data-step="5"]').click();assert.doesNotMatch(d.querySelector('.export-card').textContent,/Test version|Free pilot|Payments are not active/);dom.window.close()});

test('production custom domain offers analytics consent and shows AI price before consent',()=>{for(const host of ['cvhapi.com','www.cvhapi.com']){const dom=boot(undefined,'https://'+host),d=dom.window.document;assert.ok(d.querySelector('#consent').textContent.trim());assert.match(d.querySelector('.hero-actions [data-action="review"]').textContent,/import it/);assert.match(d.querySelector('.review-price').textContent,/150 MKD one-time/);assert.equal(d.querySelector('header .header-build').dataset.action,'start');assert.equal(d.querySelectorAll('script[src]').length,0);dom.window.close()}});

test('checkout stays single-flight when focus refreshes payment status',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;
 let checkouts=0,finish;
 w.fetch=async url=>{
  if(url==='/api/review/status')return{ok:true,json:async()=>({available:true})};
  if(url==='/api/payments/config')return{ok:true,json:async()=>({enabled:true,test:true,checkoutEnabled:true})};
  if(url==='/api/payments/status')return{ok:true,json:async()=>({state:'none'})};
  assert.match(url,/^\/api\/payments\/checkout/);checkouts++;
  return new Promise(resolve=>{finish=()=>resolve({ok:false,json:async()=>({error:'unavailable'})})});
 };
 d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-from').click();d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(d.querySelector('[data-buy]').disabled,true);d.querySelector('[data-sales-consent]').click();
 d.querySelector('[data-buy]').click();assert.equal(checkouts,1);
 w.dispatchEvent(new w.Event('focus'));await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('[data-buy]').disabled,true);
 d.querySelector('[data-buy]').click();assert.equal(checkouts,1);finish();await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('[data-buy]').disabled,false);dom.window.close();
});

test('checkout attribution survives URL cleanup and honors analytics privacy choices',async()=>{
 for(const [allow,privacySignal,expected] of [[true,false,'mk-search-cv'],[false,false,undefined],[true,'gpc',undefined],[true,'dnt',undefined]]){
  const dom=boot(null,'https://www.cvhapi.com/en/?utm_campaign=mk-search-cv&gclid=private-click'),w=dom.window,d=w.document;
  let submitted;
  w.fetch=async(url,options)=>{
   if(url==='/api/review/status')return{ok:true,json:async()=>({available:true})};
   if(url==='/api/payments/config')return{ok:true,json:async()=>({enabled:true,test:true})};
   if(url==='/api/payments/status')return{ok:true,json:async()=>({state:'none'})};
   submitted=JSON.parse(options.body);return{ok:false,json:async()=>({error:'unavailable'})};
  };
  if(allow)d.querySelector('#allow').click();
  if(privacySignal==='gpc')Object.defineProperty(w.navigator,'globalPrivacyControl',{value:true});
  if(privacySignal==='dnt')Object.defineProperty(w.navigator,'doNotTrack',{value:'1'});
  w.history.replaceState(null,'','/en/');
  d.querySelector('[data-action="example"]').click();d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));
  d.querySelector('#review-from').click();d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('[data-sales-consent]').click();d.querySelector('[data-buy]').click();await new Promise(r=>setTimeout(r,0));
  assert.equal(submitted.campaign,expected);assert.equal(submitted.analyticsConsent,expected?true:undefined);assert.ok(!JSON.stringify(submitted).includes('private-click'));dom.window.close();
 }
});

test('local file reading never advertises an AI request before consent',async()=>{
 const dom=boot(),w=dom.window,d=w.document;let finish;
 w.fetch=async()=>({ok:true,json:async()=>({available:true})});
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));
 const input=d.querySelector('#review-file');Object.defineProperty(input,'files',{value:[{name:'cv.txt',size:100,text:()=>new Promise(resolve=>finish=resolve)}]});input.dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('.import-reading'),null);d.querySelector('#review-import-submit').click();
 assert.equal(d.querySelector('#review-progress'),null);assert.match(d.querySelector('#review-ai').textContent,/Reading the document/);assert.equal(d.querySelector('#review-consent').checked,false);
 for(let i=0;i<20&&!finish;i++)await new Promise(r=>setTimeout(r,0));assert.ok(finish);finish('Alex Example. I help residents with meals and daily activities and communicate with colleagues.');await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#review-source').disabled,false);assert.equal(d.querySelector('#review-consent').checked,false);dom.window.close();
});

test('landing page leads into the builder with one price disclosure and honest saving state',()=>{
 const dom=boot(),w=dom.window,d=w.document;
 assert.equal(d.querySelectorAll('.hero-art,.career-steps').length,0);assert.ok(d.querySelector('.hero-description'));assert.equal(d.querySelectorAll('[data-template-start]').length,8);
 assert.equal(d.querySelector('.hero-copy .eyebrow'),null);assert.equal(d.querySelector('.review-intro .eyebrow'),null);assert.equal(d.querySelector('.offer .eyebrow'),null);
 assert.equal(d.querySelector('.preview-toolbar').textContent.trim(),'Your CV');assert.doesNotMatch(d.querySelector('#preview-caption').textContent,/Fictional example/);
 assert.ok(d.querySelector('.workspace').compareDocumentPosition(d.querySelector('#application'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.ok(d.querySelector('.workspace').compareDocumentPosition(d.querySelector('#review-workspace'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.equal(d.querySelectorAll('#how-it-works').length,1);d.querySelector('#review-toggle').click();assert.equal(d.querySelector('.builder-heading').hidden,true);d.querySelector('header a[href="#how-it-works"]').click();assert.equal(d.querySelector('#how-it-works').hidden,false);assert.equal(d.querySelector('#review-toggle').getAttribute('aria-expanded'),'false');assert.equal(d.querySelector('#builder-title').textContent,'Your CV, taking shape.');
 assert.equal(d.querySelector('.header-download').hidden,true);assert.equal(d.querySelector('#mobile-preview').hidden,false);
 for(const button of d.querySelectorAll('header button,.hero-actions button,#review-toggle'))assert.doesNotMatch(button.textContent,/150 MKD/);
 assert.equal(d.querySelectorAll('.review-price').length,1);assert.match(d.querySelector('.review-price').textContent,/150 MKD one-time/);
 const name=d.querySelector('#name');name.value='Alex Example';name.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('.header-download').hidden,false);
 assert.equal(d.querySelector('#save-status').textContent,'Not saved');d.querySelector('#remember').click();assert.equal(d.querySelector('#save-status').textContent,'Saved in this browser');
 d.querySelector('#remember').click();assert.equal(d.querySelector('#save-status').textContent,'Not saved');assert.equal(w.localStorage.getItem('cekor.cv.v1'),null);dom.window.close();
});

test('switching review language translates commentary once and preserves documents and section drafts',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;let reviews=0,translations=0;
 const source='Alex Example\nPROFILE\nI help residents with daily activities and communicate clearly with colleagues.';
 w.fetch=async(url,options)=>{
  if(url==='/api/review/status')return{ok:true,json:async()=>({available:true})};
  if(url==='/api/payments/config')return{ok:true,json:async()=>({enabled:false})};
  if(url==='/api/review/language'){translations++;const body=JSON.parse(options.body);assert.equal(body.language,'mk');assert.equal(body.consent,true);assert.equal(body.text,undefined);return{ok:true,json:async()=>({strings:body.strings.map(text=>({'Reviewed.':'Прегледано.','Profile':'Профил','Clarify your focus.':'Појасни го твојот фокус.','Add your actual focus.':'Додај го твојот вистински фокус.'}[text]||text))})}}
  assert.equal(url,'/api/review');reviews++;return{ok:true,json:async()=>({overview:'Reviewed.',sections:[{document:'cv',name:'Profile',assessment:'Clarify your focus.',actions:['Add your actual focus.']}],suggestions:[]})};
 };
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));const input=d.querySelector('#review-source');input.value=source;input.dispatchEvent(new w.Event('input'));d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-guide-start').click();
 const draft=d.querySelector('[data-section-draft]');draft.value='My own unsaved section draft.';draft.dispatchEvent(new w.Event('input'));
 d.querySelector('[data-ui-language="mk"]').click();await new Promise(r=>setTimeout(r,0));
 assert.match(d.querySelector('.guide-copy h4').textContent,/Профил/);assert.match(d.querySelector('.section-description').textContent,/Додај го твојот вистински фокус/);assert.equal(d.querySelector('[data-section-draft]').value,'My own unsaved section draft.');assert.equal(d.querySelector('#review-edited').value,source);assert.equal(d.querySelector('#review-source').value,source);assert.equal(d.querySelector('.translation-status'),null);
 d.querySelector('[data-ui-language="en"]').click();assert.match(d.querySelector('.guide-copy h4').textContent,/Profile/);d.querySelector('[data-ui-language="mk"]').click();assert.match(d.querySelector('.guide-copy h4').textContent,/Профил/);assert.equal(reviews,1);assert.equal(translations,1);dom.window.close();
});

 test('first visit follows supported browser language with route and saved-choice overrides',()=>{
 const bootLanguage=(url,preferred,languages)=>{const dom=new JSDOM('<div id="app"></div>',{url,runScripts:'outside-only'});dom.window.structuredClone=structuredClone;dom.window.matchMedia=()=>({matches:false});Object.defineProperty(dom.window.navigator,'languages',{value:languages});if(preferred)dom.window.localStorage.setItem('cekor.ui-language',preferred);dom.window.eval(bundle.outputFiles[0].text);return dom};
 for(const [url,preferred,languages,expected] of [['https://cv.test/',null,['mk-MK','en'],'mk'],['https://cv.test/',null,['en-GB'],'en'],['https://cv.test/',null,['nb-NO'],'mk'],['https://cv.test/en/',null,['mk'],'en'],['https://cv.test/mk/',null,['en'],'mk'],['https://cv.test/','en',['mk'],'en']]){const dom=bootLanguage(url,preferred,languages);assert.equal(dom.window.document.documentElement.lang,expected);assert.equal(dom.window.document.querySelector('#cv-language')?.value??dom.window.document.querySelector('[data-ui-language="'+expected+'"]').getAttribute('aria-pressed'),'true');dom.window.close()}
 });
test('CV language picker changes headings without translating writing or the interface',()=>{
 const dom=boot(JSON.stringify({name:'Alex Example',summary:'My original English profile',language:'en'})),d=dom.window.document;
 d.querySelector('[data-action="build"]').click();d.querySelector('[data-action="cv-language"]').click();assert.equal(d.querySelector('#modal').open,true);d.querySelector('#dialog-cv-language').value='mk';d.querySelector('[data-language-cancel]').click();assert.match(d.querySelector('.cv-language-trigger').textContent,/English/);
 d.querySelector('[data-action="cv-language"]').click();d.querySelector('#dialog-cv-language').value='mk';d.querySelector('[data-language-save]').click();assert.equal(d.documentElement.lang,'en');assert.match(d.querySelector('.cv-language-trigger').textContent,/Македонски/);assert.match(d.querySelector('#preview').textContent,/ПРОФИЛ/);assert.match(d.querySelector('#preview').textContent,/My original English profile/);assert.equal(d.querySelector('#name').value,'Alex Example');assert.equal(JSON.parse(dom.window.localStorage.getItem('cekor.cv.v1')).language,'mk');dom.window.close();
});

test('Macedonian review guidance and field-help labels stay localized after applying a section',async()=>{
 const dom=boot(),w=dom.window,d=w.document;w.AbortSignal=AbortSignal;
 d.querySelector('[data-ui-language="mk"]').click();
 w.fetch=async url=>({ok:true,json:async()=>url==='/api/review/status'?{available:true}:url==='/api/payments/config'?{enabled:false}:{overview:'Подобри го профилот.',sections:[{document:'cv',name:'Профил',assessment:'Додај конкретни задачи.',actions:['Опиши го твоето искуство.']}],suggestions:[]}});
 d.querySelector('#review-toggle').click();await new Promise(r=>setTimeout(r,0));
 const source='Александар Николов\nПРОФИЛ\nЈас сум вреден и одговорен. Работам во магацин. Сакам да напредувам и да најдам добра работа.';
 d.querySelector('#review-source').value=source;d.querySelector('#review-source').dispatchEvent(new w.Event('input'));
 d.querySelector('#review-consent').click();await new Promise(r=>setTimeout(r,0));d.querySelector('#review-ai').click();await new Promise(r=>setTimeout(r,0));
 assert.match(d.querySelector('.ai-results').textContent,/Користи ги советите и примерите/);
 d.querySelector('#review-guide-start').click();
 const help=d.querySelector('[data-field-help="role"] summary');assert.match(help.getAttribute('aria-label'),/Професија или улога/);assert.doesNotMatch(help.getAttribute('aria-label'),/role/);
 const draft=d.querySelector('[data-section-draft]');draft.value='Магационер со искуство во магацин. Сакам да напредувам и да најдам добра работа. Јас сум вреден и одговорен.';draft.dispatchEvent(new w.Event('input'));
 d.querySelector('[data-preview-section]').click();d.querySelector('[data-confirm-section]').click();d.querySelector('[data-apply-section]').click();
 assert.equal(d.querySelector('.guide-copy h4').textContent,'Измената е зачувана.');assert.equal(d.querySelector('#review-source').value,source);dom.window.close();
});
