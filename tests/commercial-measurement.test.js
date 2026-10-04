import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {build} from 'esbuild';
test('commercial analytics requires consent and a live receipt, deduplicates and forwards no private fields',async()=>{
 const code=await build({entryPoints:['src/commercial-measurement.js'],bundle:true,write:false,format:'iife',globalName:'commercial',define:{'import.meta.env.VITE_POSTHOG_KEY':'""','import.meta.env.VITE_POSTHOG_HOST':'"https://eu.i.posthog.com"'},logLevel:'silent'});
 const dom=new JSDOM('',{url:'https://www.cvhapi.com/mk/review/',runScripts:'outside-only'}),w=dom.window;
 const receipt={state:'used',transaction_id:`cvhapi_${'a'.repeat(64)}`,amount:200,currency:'gbp',live:true,text:'PRIVATE CV',token:'SECRET',email:'private@example.com'};
 w.eval(code.outputFiles[0].text);assert.equal(w.commercial.trackCommercial(receipt),false);assert.equal(w.dataLayer,undefined);
 dom.window.close();
 const consented=new JSDOM('',{url:'https://www.cvhapi.com/mk/review/',runScripts:'outside-only'}),c=consented.window;c.localStorage.setItem('cekor.analytics.consent.v2','yes');c.eval(code.outputFiles[0].text);
 assert.equal(c.commercial.trackCommercial({...receipt,live:false}),false);assert.equal(c.commercial.trackCommercial({...receipt,amount:999}),false);
 assert.equal(c.commercial.trackCommercial({...receipt,state:'refunded'}),false);
 assert.equal(c.commercial.trackCommercial(receipt),true);assert.equal(c.commercial.trackCommercial(receipt),false);
 assert.equal(c.commercial.trackCommercial({...receipt,state:'refunded'}),true);assert.equal(c.commercial.trackCommercial({...receipt,state:'refunded'}),false);
 const events=c.dataLayer.filter(x=>x[0]==='event');assert.deepEqual(Array.from(events,x=>x[1]),['purchase','refund']);assert.equal(events[0][2].value,2);assert.equal(events[0][2].currency,'GBP');
 const output=JSON.stringify(c.dataLayer);for(const privateValue of ['PRIVATE CV','SECRET','private@example.com'])assert.ok(!output.includes(privateValue));
 c.navigator.globalPrivacyControl=true;assert.equal(c.commercial.trackCommercial({...receipt,transaction_id:`cvhapi_${'b'.repeat(64)}`}),false);
 consented.window.close();
});
