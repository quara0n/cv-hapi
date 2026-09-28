import {EVENTS,safeProperties,attribution} from './telemetry-core.js';
import {googleEnabled,googleConsent,googleTrack} from './google-measurement.js';
const key=import.meta.env.VITE_POSTHOG_KEY||'',host=import.meta.env.VITE_POSTHOG_HOST||'https://eu.i.posthog.com';
const validHost=['https://eu.i.posthog.com','https://us.i.posthog.com'].includes(host);
const consentKey='cekor.analytics.consent.v2';let consent=null,session=null,count=0;
try{const v=localStorage.getItem(consentKey);consent=v==='yes'?true:v==='no'?false:null;if(consent)session=sessionStorage.getItem('cekor.analytics.session')}catch{}
export const analyticsEnabled=()=>googleEnabled()||(!!key&&validHost);
export const getConsent=()=>consent;
export function setConsent(value){consent=value;googleConsent(value&&!navigator.globalPrivacyControl&&navigator.doNotTrack!=='1');try{localStorage.setItem(consentKey,value?'yes':'no');if(!value){sessionStorage.removeItem('cekor.analytics.session');session=null}}catch{}}
export function track(event,properties={}){if(!analyticsEnabled()||!consent||!EVENTS.includes(event)||navigator.globalPrivacyControl||navigator.doNotTrack==='1'||count>=150)return;googleConsent(true);googleTrack(event,properties);if(!key||!validHost){count++;return}if(!session){session=crypto.randomUUID();try{sessionStorage.setItem('cekor.analytics.session',session)}catch{}}count++;const p={...safeProperties(properties),...attribution(location.href,document.referrer),device:matchMedia('(max-width: 760px)').matches?'mobile':'desktop',distinct_id:session,$process_person_profile:false,$geoip_disable:true,$ip:null};fetch(`${host}/capture/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:key,event:`cekor_${event}`,properties:p}),keepalive:true,credentials:'omit',referrerPolicy:'no-referrer'}).catch(()=>{});}
// Coarse error category only: never send exception messages, URLs or CV text.
window.addEventListener('error',()=>track('app_error'));
window.addEventListener('unhandledrejection',()=>track('app_error'));
