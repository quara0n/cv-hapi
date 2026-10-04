import {workshopKind} from './section-workshop.js';
// Translate commentary only. Source quotes, proposed edits and user drafts stay exact.
export function feedbackStrings(review){
 const strings=[review.overview,...review.strengths,...review.questions];
 for(const item of review.priorities)strings.push(item.title,item.why,item.action);
 for(const item of review.sections)strings.push(item.name,item.assessment,...item.actions);
 for(const item of review.jobMatches)strings.push(item.advice);
 for(const item of review.suggestions)strings.push(item.reason);
 return strings;
}
export function translatedFeedback(review,strings){
 const expected=feedbackStrings(review);
 if(!Array.isArray(strings)||strings.length!==expected.length||strings.some((text,i)=>typeof text!=='string'||text.length>7000||(expected[i].trim()&&!text.trim())))throw Error('translation_invalid');
 let index=0;const take=()=>strings[index++];
 const result={...review,overview:take(),strengths:review.strengths.map(take),questions:review.questions.map(take)};
 result.priorities=review.priorities.map(item=>({...item,title:take(),why:take(),action:take()}));
 result.sections=review.sections.map(item=>({...item,workshopKind:workshopKind(item),name:take(),assessment:take(),actions:item.actions.map(take)}));
 result.jobMatches=review.jobMatches.map(item=>({...item,advice:take()}));
 result.suggestions=review.suggestions.map(item=>({...item,reason:take()}));
 return result;
}
