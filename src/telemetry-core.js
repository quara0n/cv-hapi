import {templateIds} from './templates.js';
export const EVENTS=['review_imported','review_import_error','review_checked','ai_review_started','ai_review_completed','ai_review_error','review_suggestion_applied','review_pdf_generated','review_pdf_started','review_pdf_error','review_txt_generated','page_view','builder_started','step_view','step_continue','export_clicked','validation_error','pdf_started','pdf_generated','pdf_error','storage_error','design_changed','example_loaded','app_error','application_started','application_validation_error','application_drafted','application_pdf_generated','application_pdf_error','package_interest_yes','package_interest_no'];
import {CAMPAIGNS} from './campaigns.js';
export {CAMPAIGNS} from './campaigns.js';
export function safeProperties(input={}){const out={};if(Number.isInteger(input.step)&&input.step>=0&&input.step<=5)out.step=input.step;if(templateIds.includes(input.template))out.template=input.template;return out}
export function attribution(href,referrer){
 const u=new URL(href),source=u.searchParams.get('utm_source'),campaign=u.searchParams.get('utm_campaign');
 const requestedMedium=u.searchParams.get('utm_medium');
 let channel='direct',medium='none';
 if(['google','bing','facebook','instagram','linkedin','newsletter'].includes(source)){
  channel=source;
  medium=['cpc','organic','social','email','referral'].includes(requestedMedium)?requestedMedium:
   campaign==='mk-search-cv'&&['google','bing'].includes(source)?'cpc':source==='newsletter'?'email':
   ['facebook','instagram','linkedin'].includes(source)?'social':'none';
 }else if(referrer){
  try{
   const h=new URL(referrer).hostname;
   if(h!==u.hostname){
    if(/(^|\.)google\.[a-z.]+$/.test(h)){channel='google-organic';medium='organic'}
    else if(/(^|\.)bing\.com$/.test(h)){channel='bing';medium='organic'}
    else if(/(^|\.)(facebook\.com|instagram\.com|linkedin\.com)$/.test(h)){channel=h.split('.').slice(-2).join('.');medium='social'}
    else{channel='referral';medium='referral'}
   }
  }catch{channel='referral';medium='referral'}
 }
 return{channel,medium,campaign:CAMPAIGNS.includes(campaign)?campaign:'none'};
}
