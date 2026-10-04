export const templates = [
 {id:'modern',en:'Modern',mk:'Современ',noteEn:'A clear everyday CV',noteMk:'Јасно CV за секоја прилика'},
 {id:'classic',en:'Classic',mk:'Класичен',noteEn:'Traditional and understated',noteMk:'Традиционален и едноставен'},
 {id:'compact',en:'Compact',mk:'Компактен',noteEn:'More room for experience',noteMk:'Повеќе простор за искуство'},
 {id:'executive',en:'Executive',mk:'Деловен',noteEn:'A confident centered header',noteMk:'Нагласен центриран наслов'},
 {id:'minimal',en:'Minimal',mk:'Минимален',noteEn:'Quiet type and generous space',noteMk:'Едноставност и простор'},
 {id:'banner',en:'Statement',mk:'Впечатлив',noteEn:'A bold color heading',noteMk:'Наслов со нагласена боја'},
 {id:'editorial',en:'Editorial',mk:'Уреднички',noteEn:'Strong section dividers',noteMk:'Јасно одделени секции'},
 {id:'horizon',en:'Horizon',mk:'Хоризонт',noteEn:'A clean two-column layout',noteMk:'Чист распоред во две колони'}
];
export const templateIds=templates.map(t=>t.id);
export function templateThumbnail(id){return `<img class="template-thumbnail" src="/templates/${id}.webp" alt="" width="420" height="594" loading="lazy">`}
