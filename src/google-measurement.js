import {EVENTS,safeProperties,attribution} from './telemetry-core.js';
export const MEASUREMENT_ID='G-JYTW6J3BRZ';
const productionHosts=['cvhapi.com','www.cvhapi.com'];
let initialized=false;
const initialAttribution=attribution(location.href,document.referrer);
export const checkoutCampaign=()=>initialAttribution.campaign;
export const googleEnabled=()=>productionHosts.includes(location.hostname);
function gtag(){window.dataLayer=window.dataLayer||[];window.dataLayer.push(arguments)}
export function googleConsent(allowed){
 if(!googleEnabled())return;
 window[`ga-disable-${MEASUREMENT_ID}`]=!allowed;
 if(!allowed){
   if(initialized)gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
   for(const cookie of document.cookie.split(';')){const name=cookie.split('=')[0].trim();if(name==='_ga'||name==='_ga_JYTW6J3BRZ')document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`}
   return;
 }
 if(initialized){gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});return}
 initialized=true;
 gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 gtag('js',new Date());
 gtag('config',MEASUREMENT_ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'none',cookie_expires:86400,cookie_update:false,page_location:cleanLocation(),page_referrer:'',page_title:'CV Hapi CV'});
 const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;script.referrerPolicy='no-referrer';document.head.append(script);
}
function cleanLocation(){const route=location.pathname.match(/^\/(mk|en)(?:\/|$)/)?.[1];const language=route||(['mk','en'].includes(document.documentElement.lang)?document.documentElement.lang:'mk');const review=/^\/(mk|en)\/review\/?$/.test(location.pathname);return `https://${location.hostname}/${language}/${review?'review/':''}`}
export function googleTrack(event,properties={}){
 if(!googleEnabled()||!initialized||window[`ga-disable-${MEASUREMENT_ID}`]||!EVENTS.includes(event))return;
 const source=initialAttribution;
 gtag('event',event==='page_view'?'page_view':`cekor_${event}`,{...safeProperties(properties),...source,page_location:cleanLocation(),page_referrer:'',page_title:'CV Hapi CV',send_to:MEASUREMENT_ID,campaign_source:source.channel,campaign_name:source.campaign,campaign_medium:source.medium,ui_language:['en','mk'].includes(document.documentElement.lang)?document.documentElement.lang:'en'});
}
