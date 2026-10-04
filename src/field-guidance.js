import {escapeHtml as e} from './model.js';

export function sectionWording(kind,context='',language='en'){
 const mk=language==='mk',clinical=/chiropract|kiroprakt|киропракт/iu.test(context);
 const phrases=mk?{
  profile:['[Твојата професија] со фокус на [луѓе или област]. Користам [вистински методи] за [цел].','Им помагам на [луѓе] со [потреба], со акцент на [твојот пристап].'],
  experience:['Работев на [вистинска задача] за [луѓе или тим], користејќи [метод или алатка].','Соработував со [тим] за [задача]. Мојот придонес беше [твојот придонес].'],
  education:['[Квалификација]\n[Установа] | [Датуми]\nРелевантна обука: [предмети или практична работа].','Во проектот [назив], работев на [твојата задача] користејќи [метод].'],
  skills:['[Вештина] — ја користам за [вистинска задача].','[Алатка или метод] — искуство со [вистинска употреба].'],
  languages:['[Јазик] — [твоето ниво]','[Јазик] — го користам за [вистински контекст].'],
  contact:['[Име]\n[Професија]\n[Е-пошта] · [Телефон]','[Име]\n[Е-пошта] · [Професионален профил, ако го имаш]'],
  letter:['Се пријавувам за [работното место] бидејќи [твојата причина]. Моето искуство со [вистинска работа] е релевантно за [барање од огласот].','Во [вистинска улога], работев на [задача]. Би сакал/а да го применам ова искуство во [работното место].'],
 }:{
  profile:['[Your role] focused on [people or area]. I use [methods you actually use] to support [goal].','I help [people] with [need], with an emphasis on [your approach].'],
  experience:['Supported [people or team] with [actual task], using [method or tool].','Worked with [team] to [task]. My contribution was [your actual contribution].'],
  education:['[Qualification]\n[Institution] | [Dates]\nRelevant training: [subjects or practical work].','For [project], I worked on [your task] using [method].'],
  skills:['[Skill] — used for [actual task].','[Tool or method] — experience with [actual use].'],
  languages:['[Language] — [your actual level]','[Language] — used for [actual context].'],
  contact:['[Name]\n[Profession]\n[Email] · [Phone]','[Name]\n[Email] · [Professional profile, if you have one]'],
  letter:['I am applying for [role] because [your reason]. My experience in [actual work] is relevant to [vacancy requirement].','In [actual role], I worked on [task]. I would welcome the opportunity to bring this experience to [target role].'],
 };
 if(clinical&&kind==='profile')return mk?['Мојот фокус е да им помогнам на пациентите со [цел], користејќи [методи што навистина ги користиш].','Работам со [група пациенти] на [нивните цели], со акцент на [твојот пристап].']:['My focus is to help patients with [goal], using [methods you actually use].','I work with [patient group] on [their goals], with an emphasis on [your approach].'];
 return phrases[kind]||[];
}

export function infoHelp(id,label,content){
 return `<details class="info-help"><summary tabindex="0" aria-label="${e(label)}" aria-controls="${id}"><span aria-hidden="true">i</span></summary><div class="help-panel" id="${id}">${content}</div></details>`;
}
export function bindInfoHelp(root){
 root.querySelectorAll('.info-help').forEach(help=>{
  if(help.dataset.helpBound)return;
  help.dataset.helpBound='true';
  let pinned=false;
  const trigger=help.querySelector('summary');
  help.onmouseenter=()=>{help.open=true};
  help.onmouseleave=()=>{if(!pinned&&!help.contains(document.activeElement))help.open=false};
  help.addEventListener('focusin',()=>{help.open=true});
  help.addEventListener('focusout',event=>{if(!pinned&&!help.contains(event.relatedTarget))help.open=false});
  trigger.onclick=event=>{event.preventDefault();pinned=!pinned;help.open=pinned};
  help.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();pinned=false;trigger.focus();help.open=false}};
 });
}

// Examples are optional writing prompts, never inferred facts about the applicant.
export function fieldGuidance(kind,id,role='',language='en'){
 const mk=language==='mk',clinical=/chiropract|kiroprakt|киропракт/iu.test(role);
 const general={
  role:['Use your actual profession or job title.',['Customer service assistant','Project coordinator']],
  focus:['Describe who you help and the purpose of your work.',['Helping customers find suitable products','Supporting a team to deliver projects on time']],
  approach:['Name methods or tasks you actually use.',['I explain options clearly and listen to customer needs.','I plan tasks with colleagues and follow up on progress.']],
  strengths:['Choose a relevant strength you can support with experience.',['Clear communication with customers and colleagues','Organising tasks and keeping accurate records']],
  organization:['Use the real employer, institution or training provider.',['Example Company']],
  dates:['Use accurate dates, or state that the role or course is ongoing.',['2022–present','September 2020–June 2022']],
  duties:['Describe your own tasks, one per line.',['Answered customer questions and explained product options.','Organised daily tasks with colleagues.']],
  result:['Add a real result only if you can support it. Leave this blank otherwise.',['Describe what improved because of your work, without guessing a number.']],
  qualification:['Use the exact qualification or course name.',['Bachelor of Business Administration','First aid course']],
  details:['Add relevant training or a project you actually completed.',['Describe a relevant course topic or project and your contribution.']],
  items:['List relevant skills you actually use, one per line.',['Customer communication','Task planning','Microsoft Excel']],
  name:['Use the name you want employers to see.',[]],
  contact:['Include the contact details you want to share. A street address is unnecessary.',[]],
  opening:['Name the role and explain why you are applying.',['I am applying for the customer service assistant position.']],
  motivation:['Explain what interests you about this specific role or organisation.',['The opportunity to help customers make informed choices interests me.']],
  evidence:['Connect a real example from your experience to the role.',['In my previous role, I answered customer questions and explained their options.']],
  closing:['Close briefly and invite a conversation.',['I would welcome the opportunity to discuss my experience.']],
 };
 const translated={
  role:['Наведи ја вистинската професија или работно место.',['Асистент за корисничка поддршка','Координатор на проекти']],
  focus:['Опиши кому помагаш и која е целта на твојата работа.',['Помагање на клиентите да изберат соодветни производи','Поддршка на тимот за навремено завршување на проектите']],
  approach:['Наведи методи или задачи што навистина ги користиш.',['Јасно ги објаснувам опциите и ги слушам потребите на клиентите.','Ги планирам задачите со колегите и го следам напредокот.']],
  strengths:['Избери релевантна вештина што можеш да ја поткрепиш со искуство.',['Јасна комуникација со клиенти и колеги','Организирање задачи и точна евиденција']],
  organization:['Наведи го вистинскиот работодавец, установа или организатор на обука.',['Пример компанија']],
  dates:['Користи точни датуми или наведи дека работата или курсот е во тек.',['2022–денес','Септември 2020–јуни 2022']],
  duties:['Опиши ги твоите задачи, една по ред.',['Одговарав на прашања на клиентите и ги објаснував производите.','Ги организирав дневните задачи со колегите.']],
  result:['Додај вистински резултат само ако можеш да го поткрепиш. Инаку остави празно.',['Опиши што се подобрило поради твојата работа, без измислени бројки.']],
  qualification:['Користи го точниот назив на квалификацијата или курсот.',['Диплома по деловна администрација','Курс за прва помош']],
  details:['Додај релевантна обука или проект што навистина го заврши.',['Опиши релевантна тема или проект и твојот придонес.']],
  items:['Наведи релевантни вештини што навистина ги користиш, една по ред.',['Комуникација со клиенти','Планирање задачи','Microsoft Excel']],
  name:['Наведи го името што сакаш да го видат работодавците.',[]],
  contact:['Наведи контакти што сакаш да ги споделиш. Улична адреса не е потребна.',[]],
  opening:['Наведи го работното место и зошто се пријавуваш.',['Се пријавувам за работното место асистент за корисничка поддршка.']],
  motivation:['Објасни што те интересира во оваа улога или организација.',['Ме интересира можноста да им помогнам на клиентите да донесат информирани одлуки.']],
  evidence:['Поврзи вистински пример од твоето искуство со улогата.',['Во претходната улога одговарав на прашања на клиентите и ги објаснував опциите.']],
  closing:['Заврши кратко и предложи разговор.',['Би сакал/а да разговараме за моето искуство.']],
 };
 let [description,examples]=(mk?translated:general)[id]||['',[]];
 if(kind==='languages'){
  description=mk?'Користи „Јазик — ниво“ во секој ред. Избери го твоето вистинско ниво.':'Use “Language — level” on each line. Choose your actual level.';
  examples=mk?['Англиски — B2','Македонски — мајчин јазик']:['English — B2','Norwegian — native'];
 }
 if(clinical){
  const specific=mk?{
   role:['Киропрактичар'],focus:['Помагање на пациентите да управуваат со болката и да се вратат на секојдневните активности','Поддршка на активни лица при враќање на спорт'],
   approach:['Објаснувам опции за третман и со пациентите поставувам цели.','Спортска масажа','Спинална манипулација','Совети за вежби и рехабилитација'],
   strengths:['Јасно објаснување на третманот и вежбите','Соработка со други здравствени работници'],
   items:['Спортска масажа','Спинална манипулација','Совети за вежби и рехабилитација'],
  }:{
   role:['Chiropractor'],focus:['Helping patients manage pain and return to everyday activities','Supporting active people in returning to sport'],
   approach:['I explain treatment options and agree goals with my patients.','Sports massage','Spinal manipulation','Exercise and rehabilitation advice'],
   strengths:['Explaining treatment and exercises clearly','Working with other healthcare professionals'],
   items:['Sports massage','Spinal manipulation','Exercise and rehabilitation advice'],
  };
  if(specific[id])examples=specific[id];
 }
 // Dates, organisations and credentials are examples to read, not one-click claims.
 const insertable=['role','focus','approach','strengths','duties','items','opening','motivation','evidence','closing'].includes(id);
 return {description,examples,insertable};
}
