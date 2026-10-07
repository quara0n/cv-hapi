import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {build} from 'esbuild';
test('Google measurement loads only after consent, strips CV text and stops on withdrawal',async()=>{
 const code=await build({entryPoints:['src/telemetry.js'],bundle:true,write:false,format:'iife',globalName:'telemetry',define:{'import.meta.env.VITE_POSTHOG_KEY':'""','import.meta.env.VITE_POSTHOG_HOST':'"https://eu.i.posthog.com"'},logLevel:'silent'});
 const dom=new JSDOM('',{url:'https://cvhapi.com/mk/?email=private@example.com&utm_source=google&utm_campaign=mk-search-cv',runScripts:'outside-only'}),w=dom.window;
 w.eval(code.outputFiles[0].text);w.telemetry.track('page_view');assert.equal(w.document.querySelectorAll('script[src]').length,0);
 w.telemetry.setConsent(true);w.telemetry.track('builder_started',{name:'PRIVATE CV',email:'private@example.com',step:0});
 assert.equal(w.document.querySelectorAll('script[src]').length,1);const events=()=>w.dataLayer.filter(x=>x[0]==='event');assert.equal(events().length,1);
 assert.equal(events()[0][2].page_location,'https://cvhapi.com/mk/');
 const payload=JSON.stringify(w.dataLayer);assert.ok(!payload.includes('PRIVATE CV'));assert.ok(!payload.includes('private@example.com'));assert.ok(payload.includes('mk-search-cv'));
 w.telemetry.setConsent(false);w.telemetry.track('pdf_generated');assert.equal(events().length,1);assert.equal(w['ga-disable-G-JYTW6J3BRZ'],true);dom.window.close();
});

test('www root visits use the selected Macedonian interface in sanitized analytics locations',async()=>{
 const code=await build({entryPoints:['src/telemetry.js'],bundle:true,write:false,format:'iife',globalName:'telemetry',define:{'import.meta.env.VITE_POSTHOG_KEY':'""','import.meta.env.VITE_POSTHOG_HOST':'"https://eu.i.posthog.com"'},logLevel:'silent'});
 const dom=new JSDOM('<html lang="mk"></html>',{url:'https://www.cvhapi.com/?email=private@example.com#cv',runScripts:'outside-only'}),w=dom.window;
 w.eval(code.outputFiles[0].text);w.telemetry.setConsent(true);w.telemetry.track('page_view');
 const event=w.dataLayer.find(x=>x[0]==='event');assert.equal(event[2].page_location,'https://www.cvhapi.com/mk/');assert.equal(event[2].ui_language,'mk');assert.ok(!JSON.stringify(w.dataLayer).includes('private@example.com'));dom.window.close();
});

test('review landing attribution keeps its route and removes private query and fragment data',async()=>{
 const code=await build({entryPoints:['src/telemetry.js'],bundle:true,write:false,format:'iife',globalName:'telemetry',define:{'import.meta.env.VITE_POSTHOG_KEY':'""','import.meta.env.VITE_POSTHOG_HOST':'"https://eu.i.posthog.com"'},logLevel:'silent'});
 const dom=new JSDOM('<html lang="en"></html>',{url:'https://www.cvhapi.com/en/review/?email=private@example.com#document',runScripts:'outside-only'}),w=dom.window;
 w.eval(code.outputFiles[0].text);w.telemetry.setConsent(true);w.telemetry.track('page_view');
 const event=w.dataLayer.find(x=>x[0]==='event');assert.equal(event[2].page_location,'https://www.cvhapi.com/en/review/');assert.ok(!JSON.stringify(w.dataLayer).includes('private@example.com'));assert.ok(!JSON.stringify(w.dataLayer).includes('#document'));dom.window.close();
});
