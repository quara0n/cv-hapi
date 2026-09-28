import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
const built=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',loader:{'.css':'empty'},define:{'import.meta.env.VITE_POSTHOG_KEY':'""','import.meta.env.VITE_POSTHOG_HOST':'"https://eu.i.posthog.com"'},logLevel:'silent'});
const html=await readFile('dist/index.html','utf8'),origin='https://cv-hapi.quara0n.chatgpt.site';
const live=process.env.PUBLIC_LAUNCH!=='false';
for(const [route,language] of [['','en'],['en/','en'],['mk/','mk']]){
 const dom=new JSDOM(html,{url:origin+'/'+route,runScripts:'outside-only'});dom.window.structuredClone=structuredClone;dom.window.eval(built.outputFiles[0].text);
 const doc=dom.window.document,canonicalURL=origin+'/'+language+'/';
 const description=language==='mk'?'Направи бесплатно CV на македонски и подготви мотивациско писмо за конкретна работа. Преземи PDF без регистрација.':'Create a free CV and prepare a cover letter for a specific job. Review your application and download a PDF without signing up.';
 doc.querySelector('meta[name="robots"]').content=live?'index,follow':'noindex,nofollow';doc.querySelector('meta[name="description"]').content=description;
 const link=attributes=>{const element=doc.createElement('link');Object.assign(element,attributes);doc.head.append(element)};
 link({rel:'canonical',href:canonicalURL});for(const lang of ['en','mk'])link({rel:'alternate',hreflang:lang,href:origin+'/'+lang+'/'});link({rel:'alternate',hreflang:'x-default',href:origin+'/en/'});
 for(const [property,content] of Object.entries({'og:title':doc.title,'og:description':description,'og:type':'website','og:url':canonicalURL,'og:locale':language==='mk'?'mk_MK':'en_GB'})){const meta=doc.createElement('meta');meta.setAttribute('property',property);meta.content=content;doc.head.append(meta)}
 doc.querySelector('#preview')?.setAttribute('data-nosnippet','');
 const ld=doc.createElement('script');ld.type='application/ld+json';ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:'Чекор',url:canonicalURL,applicationCategory:'BusinessApplication',operatingSystem:'Any',inLanguage:language,description});doc.head.append(ld);
 await mkdir('dist/'+route,{recursive:true});await writeFile('dist/'+route+'index.html',dom.serialize());dom.window.close();
}
await writeFile('dist/robots.txt',live?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${live?['mk','en'].map(lang=>`<url><loc>${origin}/${lang}/</loc></url>`).join(''):''}</urlset>`);
console.log(`English and Macedonian pages prerendered; indexing ${live?'enabled':'disabled for private pilot'}.`);
