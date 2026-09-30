// One vacancy per tab, shared by the application and review workspaces.
let text='',guard=()=>true;
const listeners=new Map();
export const getVacancy=()=>text;
export function watchVacancy(key,listener){listeners.set(key,listener)}
export function guardVacancy(check){guard=check}
export function setVacancy(value,origin){
 if(value===text)return true;
 if(!guard())return false;
 text=value;
 for(const listener of listeners.values())listener(text,origin);
 return true;
}
export function resetVacancy(){text='';for(const listener of listeners.values())listener(text,'reset')}
