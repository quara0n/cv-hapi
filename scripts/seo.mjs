import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {guides,writeGuides} from './mk-guides.mjs';
const built=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',loader:{'.css':'empty'},define:{'import.meta.env.VITE_POSTHOG_KEY':'""','import.meta.env.VITE_POSTHOG_HOST':'"https://eu.i.posthog.com"'},logLevel:'silent'});
const html=await readFile('dist/client/index.html','utf8'),origin='https://www.cvhapi.com';
const live=process.env.PUBLIC_LAUNCH!=='false';
const routes=[['','mk'],['en/','en'],['mk/','mk'],['en/review/','en'],['mk/review/','mk']];
for(const [route,language] of routes){
 const dom=new JSDOM(html,{url:origin+'/'+route,runScripts:'outside-only'});dom.window.structuredClone=structuredClone;
 // Prerender documents without contacting production payment or AI services.
 dom.window.fetch=async()=>{throw new Error('Build-time network disabled')};
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 dom.window.eval(built.outputFiles[0].text);
 const review=route.includes('/review/'),doc=dom.window.document,canonicalURL=origin+'/'+language+'/'+(review?'review/':'');
 const description=review?(language==='mk'?'Увези го твоето CV. Добиј 3 AI-проверки и незадолжително мотивациско писмо за 150 MKD, еднократно. Избери ги измените. Без претплата.':'Import your CV. Get 3 AI reviews of your CV and optional cover letter for 150 MKD once. Choose your edits. No subscription. The builder and standard PDF are free.'):(language==='mk'?'Направи бесплатно CV на македонски и подготви мотивациско писмо за конкретна работа. Преземи PDF без регистрација.':'Create a free CV and prepare a cover letter for a specific job. Review your application and download a PDF without signing up.');
 if(review)doc.title=language==='mk'?'AI-проверка на CV · 150 MKD еднократно | CV Hapi':'AI CV review · 150 MKD once | CV Hapi';
 doc.querySelector('meta[name="robots"]').content=live?'index,follow':'noindex,nofollow';doc.querySelector('meta[name="description"]').content=description;
 const link=attributes=>{const element=doc.createElement('link');Object.assign(element,attributes);doc.head.append(element)};
 link({rel:'canonical',href:canonicalURL});for(const lang of ['en','mk'])link({rel:'alternate',hreflang:lang,href:origin+'/'+lang+'/'+(review?'review/':'')});link({rel:'alternate',hreflang:'x-default',href:origin+'/mk/'+(review?'review/':'')});
 for(const [property,content] of Object.entries({'og:title':doc.title,'og:description':description,'og:type':'website','og:url':canonicalURL,'og:locale':language==='mk'?'mk_MK':'en_GB'})){const meta=doc.createElement('meta');meta.setAttribute('property',property);meta.content=content;doc.head.append(meta)}
 doc.querySelector('#preview')?.setAttribute('data-nosnippet','');
 const ld=doc.createElement('script');ld.type='application/ld+json';ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:'CV Hapi',url:canonicalURL,applicationCategory:'BusinessApplication',operatingSystem:'Any',inLanguage:language,description});doc.head.append(ld);
 await mkdir('dist/client/'+route,{recursive:true});await writeFile('dist/client/'+route+'index.html',dom.serialize());dom.window.close();
}
await writeGuides(origin,live);
await writeFile('dist/client/robots.txt',live?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
const sitemapRoutes=[...routes.filter(([route])=>route).map(([route])=>route),...guides.map(guide=>`mk/${guide.slug}/`)];
await writeFile('dist/client/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${live?sitemapRoutes.map(route=>`<url><loc>${origin}/${route}</loc></url>`).join(''):''}</urlset>`);
console.log(`English and Macedonian pages prerendered; indexing ${live?'enabled':'disabled for private pilot'}.`);
