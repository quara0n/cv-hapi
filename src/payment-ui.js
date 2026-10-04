const labels={en:{buy:'Pay €2 for one AI review (test)',check:'Check payment',note:'TEST MODE: one AI review of your CV and optional cover letter against a vacancy. Use a Stripe test card only. Keep this CV tab open; checkout opens separately. The CV builder and ordinary PDF remain free. Failed reviews request a refund.',paid:'Test payment verified. You can now run one AI review.',pending:'Payment is not confirmed. Complete checkout, then check again.',used:'This purchase has been used.',refunded:'Refund confirmed.',refund_pending:'Refund requested but not confirmed. Contact the site owner before trying again.',processing:'Your review is processing. Do not pay again.',error:'Payment could not be checked. Your CV is still here. Try checking again.'},mk:{buy:'Плати 2 € за една AI-проверка (тест)',check:'Провери плаќање',note:'ТЕСТ: една AI-проверка на CV и незадолжително мотивациско писмо според оглас. Користи само тест-картичка од Stripe. Остави го ова јазиче отворено; плаќањето се отвора одделно. Уредувачот и обичниот PDF остануваат бесплатни. Неуспешна проверка бара враќање на уплатата.',paid:'Тест-плаќањето е потврдено. Можеш да направиш една AI-проверка.',pending:'Плаќањето не е потврдено. Заврши го и провери повторно.',used:'Ова купување е искористено.',refunded:'Враќањето на уплатата е потврдено.',refund_pending:'Враќањето е побарано, но не е потврдено. Контактирај го сопственикот пред нов обид.',processing:'Проверката е во тек. Не плаќај повторно.',error:'Не може да се провери плаќањето. Твоето CV е тука. Провери повторно.'}};
import {SALES_TERMS_VERSION} from './sales-terms.js';
export async function mountPayment(root,ui,onState,{isReady=()=>true,allowPurchase=true}={}){
 const t={...labels[ui]},container=document.createElement('div');container.className='payment-choice';container.setAttribute('data-clarity-mask','true');root.insertBefore(container,root.querySelector('#review-ai'));
 Object.assign(t,ui==='mk'?{
  delivery_pending:'Плаќањето е потврдено, но приемот на проверката сè уште не е потврден. Не плаќај повторно. Ако не стигне потврда во 10 минути, ќе побараме враќање на уплатата.',
  refund_failed:'Stripe не го заврши враќањето на уплатата. Не плаќај повторно. Контактирај support@cvhapi.com за помош.'
 }:{
  delivery_pending:'Payment is confirmed, but receipt of your review is not confirmed yet. Do not pay again. After 10 minutes without confirmation, we request a refund.',
  refund_failed:'Stripe could not complete your refund. Do not pay again. Contact support@cvhapi.com for help.'
 });
 try{
  const loadConfig=()=>fetch('/api/payments/config',{cache:'no-store'}).then(r=>r.json());
  // Serialize initial cookie creation across tabs before any tab creates a purchase.
  const locks=window.navigator?.locks;
  const config=await (locks?locks.request('cvhapi-payment-owner',loadConfig):loadConfig());if(!container.isConnected)return;if(!config.enabled){container.innerHTML=`<p>${ui==='mk'?'AI-проверка: еднократно 2 € при пуштање. Приватниот тест е бесплатен; плаќањата не се активни.':'AI review: €2 once at launch. Private testing is free; payments are not active.'}</p>`;onState(true);return}
  if(config.ownerCredit&&allowPurchase){container.innerHTML=`<p>${ui==='mk'?'ЛОКАЛЕН ТЕСТ: бесплатна AI-проверка. За овој повторен обид не е потребна уплата преку Stripe.':'LOCAL TEST: complimentary AI review. No Stripe payment is needed for this retry.'}</p>`;onState(true);return}
  if(config.test===false)Object.assign(t,ui==='mk'?{buy:'Плати 2 € за една AI-проверка',note:'Еднократно 2 € за една AI-проверка на CV и незадолжително мотивациско писмо. Без претплата. Остави го ова јазиче отворено. Уредувачот и обичниот PDF се бесплатни. За неуспешна проверка бараме враќање на уплатата. Поддршка: support@cvhapi.com.',paid:'Плаќањето е потврдено. Можеш да направиш една AI-проверка.'}:{buy:'Pay €2 for one AI review',note:'€2 once for one AI review of your CV and optional cover letter. No subscription. Keep this tab open. The builder and standard PDF are free. Failed reviews request a refund. Support: support@cvhapi.com.',paid:'Payment verified. You can now run one AI review.'});
  if(!locks)t.note=ui==='mk'?'За безбедно купување користи ажуриран Chrome, Edge, Firefox или Safari. Провери претходна уплата тука.':'To purchase safely, use an up-to-date Chrome, Edge, Firefox or Safari. Check an existing payment here.';
  onState(false);
  if(!allowPurchase)t.note=ui==='mk'?'Статус на претходната уплата. Новите купувања се недостапни додека нема слободни AI-проверки.':'Previous payment status. New purchases are unavailable while there are no AI reviews remaining.';
  container.innerHTML=`<p>${t.note}</p><button type="button" class="secondary" data-buy>${t.buy}</button> <button type="button" class="secondary" data-check>${t.check}</button><p role="status"></p>`;
  if(allowPurchase&&config.checkoutEnabled!==false){
   const terms=document.createElement('label');terms.className='review-check';
   terms.innerHTML=`<input type="checkbox" data-sales-consent> ${ui==='mk'?'Ги прифаќам':'I accept the'} <a href="/terms.html" target="_blank" rel="noopener">${ui==='mk'?'условите за продажба':'sales terms'}</a>. ${ui==='mk'?'Барам проверката да започне веднаш. Разбирам дека правото на повлекување завршува откако услугата е целосно извршена.':'I request the review to start immediately. I understand that the withdrawal right ends once the service has been fully performed.'}`;
   container.insertBefore(terms,container.querySelector('[data-buy]'));
  }
  const message=container.querySelector('[role=status]'),buy=container.querySelector('[data-buy]'),check=container.querySelector('[data-check]');
  buy.hidden=!allowPurchase||!locks;
  let checking=false,purchasing=false,paymentState='none';
  const salesConsent=container.querySelector('[data-sales-consent]');
  const purchaseBlocked=()=>!locks||purchasing||!salesConsent?.checked||['paid','processing','delivery_pending','refund_pending','refund_failed'].includes(paymentState);
  if(salesConsent)salesConsent.onchange=()=>{buy.disabled=purchaseBlocked()};
  const refresh=async(returned=false)=>{if(checking||!container.isConnected)return;checking=true;try{const response=await fetch('/api/payments/status',{cache:'no-store'});if(!response.ok)throw Error();const result=await response.json();if(!container.isConnected)return;paymentState=result.state;onState(result.state==='paid',{returned,state:result.state});message.textContent=result.state==='none'?(config.checkoutEnabled===false?(ui==='mk'?'Новите плаќања се паузирани. Веќе платена проверка може да продолжи.':'New purchases are paused. An already-paid review can still continue.'):''):t[result.state]||t.pending;buy.disabled=purchaseBlocked();buy.hidden=!locks||!allowPurchase||result.state==='paid'||config.checkoutEnabled===false;check.hidden=result.state==='paid'}catch{if(container.isConnected)message.textContent=t.error}finally{checking=false}};
  check.onclick=()=>refresh(true);
  const events=new window.AbortController();
  window.addEventListener('focus',()=>refresh(true),{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(true)},{signal:events.signal});
  const channel=typeof window.BroadcastChannel==='function'?new window.BroadcastChannel('cvhapi-payment-return'):null;
  if(channel)channel.onmessage=event=>{if(event.data?.type==='payment-return')refresh(true)};
  const observer=new MutationObserver(()=>{if(!container.isConnected){events.abort();channel?.close();observer.disconnect()}});
  observer.observe(document.body,{childList:true,subtree:true});
  buy.onclick=async()=>{if(purchaseBlocked()||!allowPurchase||!isReady()||config.checkoutEnabled===false)return;purchasing=true;buy.disabled=true;try{const response=await fetch(`/api/payments/checkout?language=${ui==='mk'?'mk':'en'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({termsAccepted:true,immediatePerformance:true,termsVersion:SALES_TERMS_VERSION})}),result=await response.json();if(!response.ok)throw Error();const url=new URL(result.url);if(url.origin!=='https://checkout.stripe.com')throw Error();const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=t.buy;container.append(link);link.click();message.textContent=t.pending}catch{message.textContent=t.error}finally{purchasing=false;buy.disabled=purchaseBlocked()}};
  await refresh();
 }catch{/* Payments unavailable: no checkout is advertised. The API fails closed when enabled. */}
}
