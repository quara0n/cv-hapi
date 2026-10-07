import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {guides} from './mk-guides.mjs';
const origin='https://www.cvhapi.com';
const sitemap=await readFile('dist/client/sitemap.xml','utf8');
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.equal(urls.length,12);assert.equal(new Set(urls).size,12);
const titles=new Set();let links=0;
for(const guide of guides){
 const url=`${origin}/mk/${guide.slug}/`;
 assert(urls.includes(url));
 const dom=new JSDOM(await readFile(`dist/client/mk/${guide.slug}/index.html`,'utf8'),{url});
 const doc=dom.window.document;
 assert.equal(doc.documentElement.lang,'mk');assert.equal(doc.querySelectorAll('h1').length,1);
 assert.equal(doc.querySelector('link[rel="canonical"]').href,url);
 assert.equal(doc.querySelector('meta[name="robots"]').content,'index,follow');
 assert(doc.querySelector('meta[property="og:image"]').content.startsWith(origin+'/images/'));
 assert(!titles.has(doc.title));titles.add(doc.title);
 const graph=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
 assert.equal(graph[0]['@type'],guide.kind);assert.equal(graph[0].dateModified,guide.modified);
 for(const el of doc.querySelectorAll('a[href],img[src]')){
  const target=new URL(el.href||el.src,url);if(target.origin!==origin)continue;
  const file='dist/client'+decodeURIComponent(target.pathname)+(target.pathname.endsWith('/')?'index.html':'');
  assert((await stat(file)).isFile(),file);links++;
 }
 assert.equal(doc.querySelectorAll('script:not([type="application/ld+json"])').length,0);
 dom.window.close();
}
const downloads=await readdir('dist/client/downloads');
assert.equal(downloads.filter(f=>f.endsWith('.pdf')).length,11);
assert.equal(downloads.filter(f=>f.endsWith('.txt')).length,2);
console.log(`Search output verified: ${urls.length} canonical URLs, ${guides.length} Macedonian guides, ${links} valid internal links/images, 11 PDFs and 2 worksheets.`);
