export function homepage(ui){
 const mk=ui==='mk';
 return `<section class="career-hero" aria-labelledby="hero-title"><div class="hero-copy"><h1 id="hero-title">${mk?'Направи CV.':'Create a CV.'}<br><em>${mk?'Преземи го бесплатно.':'Download it for free.'}</em></h1><div class="hero-actions"><button class="primary" data-action="build">${mk?'Направи CV':'Build my CV'} →</button><button class="secondary" data-action="review">${mk?'Провери го моето CV':'Review my CV'}</button></div><p class="hero-note">${mk?'Без регистрација. Без претплата.':'No signup. No subscription.'}</p></div></section>`;
}
