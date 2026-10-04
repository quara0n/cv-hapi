import {escapeHtml as e} from './model.js';
import {infoHelp} from './field-guidance.js';

export function conciseDescription(text,limit=170){
 const first=text.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim()||text;
 return first.length<=limit?first:first.slice(0,limit-1).replace(/\s+\S*$/u,'')+'…';
}

export function reviewSummary(review,language){
 const actions=review.sections.reduce((sum,section)=>sum+section.actions.length,0);
 const counted=(count,singular,plural)=>`${count} ${count===1?singular:plural}`;
 const parts=language==='mk'
  ?[review.sections.length&&`${review.sections.length} разгледани секции`,review.priorities.length&&`${review.priorities.length} приоритети`,actions&&`${actions} препораки`,`${review.suggestions.length} предложени измени`]
  :[review.sections.length&&counted(review.sections.length,'section reviewed','sections reviewed'),review.priorities.length&&counted(review.priorities.length,'priority','priorities'),actions&&counted(actions,'section recommendation','section recommendations'),counted(review.suggestions.length,'suggested change','suggested changes')];
 return parts.filter(Boolean).join(' · ');
}

// Advice is separate from applicable rewrites: it may ask for facts only the owner knows.
export function extensiveFeedback(review,language,sectionTools=()=> ''){
 const mk=language==='mk';
 const list=items=>`<ul>${items.map(text=>`<li>${e(text)}</li>`).join('')}</ul>`;
 return `${review.priorities.length?`<details class="review-depth report-details"><summary>${mk?'Најважни подобрувања':'Your improvement plan'} <span class="detail-count">${review.priorities.length}</span></summary><ol>${review.priorities.map(x=>`<li><h5>${e(x.title)}</h5><p>${e(x.why)}</p><p><strong>${mk?'Следен чекор':'Next step'}:</strong> ${e(x.action)}</p></li>`).join('')}</ol></details>`:''}
 ${review.sections.length?`<section class="review-depth"><h4>${mk?'Секции на CV':'Your CV sections'}</h4><p class="hint">${mk?'Избери секција за уредување.':'Choose a section to improve.'}</p><div class="review-section-list">${review.sections.map((x,index)=>`<article class="review-section"><div class="section-card-heading"><h5>${e(x.name)}${x.document==='letter'?` · ${mk?'Мотивациско писмо':'Cover letter'}`:''}</h5>${infoHelp(`section-advice-${index}`,mk?`Мислење: ${x.name}`:`Full feedback: ${x.name}`,`<strong>${mk?'Мислење за секцијата':'Section feedback'}</strong><p>${e(x.assessment)}</p>${list(x.actions)}`)}</div><p class="section-description">${e(conciseDescription(x.actions[0]||x.assessment))}</p>${sectionTools(x,index)}</article>`).join('')}</div></section>`:''}
 ${review.jobMatches.length?`<details class="review-depth report-details"><summary>${mk?'Споредба со огласот':'Vacancy match'} <span class="detail-count">${review.jobMatches.length}</span></summary>${review.jobMatches.map(x=>`<article class="review-section"><h5>${e(x.requirement)}</h5><p><strong>${mk?'Во твојот документ':'In your document'}:</strong> ${x.evidence?e(x.evidence):mk?'Не е наведено во доставените документи.':'Not stated in the supplied documents.'}</p><p>${e(x.advice)}</p></article>`).join('')}</details>`:''}`;
}
