import {getConsent} from './telemetry.js';
import {googleEnabled,googleConsent,MEASUREMENT_ID} from './google-measurement.js';

// Server-issued accounting receipts only. Never forward document text, payment
// session identifiers, entitlement tokens or arbitrary object properties.
export function trackCommercial(receipt){
 if(!googleEnabled()||getConsent()!==true||navigator.globalPrivacyControl||navigator.doNotTrack==='1')return false;
 if(!receipt||receipt.live!==true||!['used','refunded'].includes(receipt.state)||!/^cvhapi_[a-f0-9]{64}$/.test(receipt.transaction_id)||!((receipt.currency==='mkd'&&receipt.amount===15000)||(['gbp','eur'].includes(receipt.currency)&&receipt.amount===200)))return false;
 const event=receipt.state==='used'?'purchase':'refund',key=`cvhapi.measurement.${event}.${receipt.transaction_id}`;
 try{if(localStorage.getItem(key)==='sent')return false;if(event==='refund'&&localStorage.getItem(`cvhapi.measurement.purchase.${receipt.transaction_id}`)!=='sent')return false}catch{if(event==='refund')return false}
 googleConsent(true);
 window.dataLayer=window.dataLayer||[];
 const measuredAmount=event==='refund'?(receipt.refund_amount??receipt.amount):receipt.amount;if(!Number.isInteger(measuredAmount)||measuredAmount<=0||measuredAmount>receipt.amount)return false;
 const payload={transaction_id:receipt.transaction_id,value:measuredAmount/100,currency:receipt.currency.toUpperCase(),send_to:MEASUREMENT_ID,
  items:[{item_id:receipt.currency==='mkd'?'ai-review-bundle-3':'ai-review',item_name:receipt.currency==='mkd'?'3 AI CV reviews':'AI CV review',price:measuredAmount/100,quantity:1}]};
 // Do not attach a receipt to Clarity or the generic event tracker.
 function gtag(){window.dataLayer.push(arguments)}
 gtag('event',event,payload);
 try{localStorage.setItem(key,'sent')}catch{}
 return true;
}
