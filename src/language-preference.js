export function browserLanguage(languages=[]){
 return languages.map(language=>language.toLowerCase().split('-')[0]).find(language=>language==='mk'||language==='en')||'mk';
}
