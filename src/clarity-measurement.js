import {EVENTS} from './telemetry-core.js';

export const CLARITY_ID='ypjcjxa0o9';
const preferenceKey='cvhapi.replay.consent.v1';
let allowed=false,loaded=false,stopped=false;
try{allowed=localStorage.getItem(preferenceKey)==='yes'}catch{}
const permitted=()=>allowed&&!navigator.globalPrivacyControl&&navigator.doNotTrack!=='1'&&location.hostname==='cv-hapi.quara0n.chatgpt.site';
export const getReplayConsent=()=>allowed;
export const replayNeedsReload=()=>stopped;

function clearCookies(){
 for(const name of ['_clck','_clsk']){
  document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
  const parts=location.hostname.split('.');
  for(let i=0;i<parts.length-1;i++)document.cookie=`${name}=; Max-Age=0; Path=/; Domain=.${parts.slice(i).join('.')}; SameSite=Lax; Secure`;
 }
}
export function setReplayConsent(value){
 allowed=value===true;
 try{localStorage.setItem(preferenceKey,allowed?'yes':'no')}catch{}
 if(!permitted()){
  if(loaded){
   window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});
   window.clarity('stop');
   stopped=true;
  }
  clearCookies();
  return;
 }
 startReplay();
}
function startReplay(){
 if(!permitted()||loaded||stopped)return;
 // Mask all content, including future re-renders, before the vendor can observe it.
 document.documentElement.setAttribute('data-clarity-mask','true');
 // Keep arbitrary query values and fragments out of session recordings.
 // GA4 captures its allowlisted attribution independently before this cleanup.
 if(location.search||location.hash)history.replaceState(history.state,'',location.pathname);
 window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
 window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});
 loaded=true;
 const script=document.createElement('script');
 script.async=true;script.src=`https://www.clarity.ms/tag/${CLARITY_ID}`;script.referrerPolicy='no-referrer';
 document.head.append(script);
}
export function clarityTrack(event){
 if(!permitted()||stopped||!EVENTS.includes(event))return;
 startReplay();
 if(loaded)window.clarity('event',event==='page_view'?'cvhapi_visit':`cekor_${event}`);
}
