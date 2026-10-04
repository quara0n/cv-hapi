import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['src/clarity-measurement.js'],bundle:true,write:false,format:'iife',globalName:'replay',logLevel:'silent'});
function boot(){
 const dom=new JSDOM('<div id="app">Private CV text</div>',{url:'https://cvhapi.com/en/?email=private@example.com#secret',runScripts:'outside-only'});
 dom.window.eval(bundle.outputFiles[0].text);return dom;
}
test('replay requires separate opt-in, masks dynamic content, cleans URLs and stops on withdrawal',()=>{
 const dom=boot(),w=dom.window;
 w.replay.clarityTrack('page_view');assert.equal(w.document.scripts.length,0);
 w.replay.setReplayConsent(true);
 assert.equal(w.document.scripts.length,1);
 assert.equal(w.document.documentElement.getAttribute('data-clarity-mask'),'true');
 assert.equal(w.location.href,'https://cvhapi.com/en/');
 w.document.getElementById('app').innerHTML='<p>New private CV</p>';
 assert.ok(w.document.querySelector('p').closest('[data-clarity-mask="true"]'));
 w.replay.clarityTrack('review_pdf_generated');w.replay.clarityTrack('Private CV text');
 assert.ok(!JSON.stringify(w.clarity.q).includes('Private CV'));
 w.replay.setReplayConsent(false);
 assert.deepEqual(Array.from(w.clarity.q.at(-1)),['stop']);
 const count=w.clarity.q.length;w.replay.clarityTrack('page_view');assert.equal(w.clarity.q.length,count);
 w.replay.setReplayConsent(true);assert.equal(w.document.scripts.length,1);assert.equal(w.replay.replayNeedsReload(),true);
 dom.window.close();
});
test('privacy signals override persisted recording consent',()=>{
 const dom=boot(),w=dom.window;
 Object.defineProperty(w.navigator,'globalPrivacyControl',{value:true});
 w.replay.setReplayConsent(true);w.replay.clarityTrack('page_view');
 assert.equal(w.document.scripts.length,0);dom.window.close();
});
