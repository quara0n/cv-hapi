export function showCVLanguage(dialog,{ui,language,onSave}){
 const mk=ui==='mk';
 dialog.classList.add('cv-language-dialog');
 dialog.innerHTML=`<button type="button" class="choice-close" aria-label="${mk?'Затвори':'Close'}">×</button><h2 id="modal-title">${mk?'Јазик на твоето CV':'Your CV language'}</h2><p class="language-note">ⓘ ${mk?'Ова ги менува насловите на секциите. Твојот текст останува како што си го напишал/а.':'This changes the section headings. Your own text stays exactly as you wrote it.'}</p><label for="dialog-cv-language">${mk?'Избери јазик':'Choose a language'}</label><select id="dialog-cv-language"><option value="mk" ${language==='mk'?'selected':''}>Македонски</option><option value="en" ${language==='en'?'selected':''}>English</option></select><div class="language-dialog-actions"><button type="button" class="secondary" data-language-cancel>${mk?'Откажи':'Cancel'}</button><button type="button" class="primary" data-language-save>${mk?'Зачувај':'Save'}</button></div>`;
 dialog.querySelector('.choice-close').onclick=()=>dialog.close();
 dialog.querySelector('[data-language-cancel]').onclick=()=>dialog.close();
 dialog.querySelector('[data-language-save]').onclick=()=>{const value=dialog.querySelector('select').value;dialog.close();onSave(value)};
 dialog.addEventListener('close',()=>dialog.classList.remove('cv-language-dialog'),{once:true});
 dialog.showModal();
}
