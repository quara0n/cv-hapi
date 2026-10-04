export function homepage(ui){
 const mk=ui==='mk';
 return `<section class="career-hero" aria-labelledby="hero-title"><div class="hero-copy"><h1 id="hero-title">${mk?'Направи CV.':'Create a CV.'}<br><em>${mk?'Преземи го бесплатно.':'Download it for free.'}</em></h1><div class="hero-actions"><button class="primary" data-action="build">${mk?'Направи CV':'Build my CV'} →</button><button class="secondary" data-action="review">${mk?'Провери го моето CV':'Review my CV'}</button></div><p class="hero-note">${mk?'Без регистрација. Без претплата.':'No signup. No subscription.'}</p><details class="intro-video"><summary>${mk?'Види како функционира · 20 секунди':'See how it works · 20 seconds'}</summary><div class="intro-video-content"><video controls playsinline preload="none" poster="/media/cvhapi-demo-poster.jpg" width="1080" height="1350" aria-label="${mk?'Кратко видео за CV Hapi':'CV Hapi introduction — Macedonian audio, English subtitles'}"><source src="/media/cvhapi-demo-mk.mp4" type="video/mp4"><track kind="captions" src="/media/cvhapi-demo-${mk?'mk':'en'}.vtt" srclang="${mk?'mk':'en'}" label="${mk?'Македонски':'English'}" default></video><p>${mk?'Направи CV и преземи PDF бесплатно. За постоечко CV, добиј AI-предлози за £2 еднократно. Спореди ги верзиите и избери ги измените. Без претплата.':'Create a CV and download a PDF for free. For an existing CV, get AI suggestions for £2 once. Compare versions and choose your edits. No subscription.'}</p></div></details></div></section>`;
}

export function bindHomepageVideo(root=document){
 const disclosure=root.querySelector('.intro-video');
 disclosure?.addEventListener('toggle',()=>{if(!disclosure.open)disclosure.querySelector('video')?.pause()});
}
