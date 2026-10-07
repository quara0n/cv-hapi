export function completedSections(cv){
 const entries=group=>cv[group].some(entry=>entry.title.trim()||entry.organization.trim());
 return [!!cv.name.trim(),entries('experience'),entries('education'),!!(cv.skills.trim()||cv.languages.trim()),!!cv.summary.trim(),false];
}
