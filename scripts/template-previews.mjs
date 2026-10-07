import pdfMake from 'pdfmake/build/pdfmake.js';
import fonts from 'pdfmake/build/vfs_fonts.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {documentDefinition,example} from '../src/model.js';
import {templateIds} from '../src/templates.js';

pdfMake.addVirtualFileSystem(fonts);
await mkdir('test-output/template-pdfs',{recursive:true});
for(const template of templateIds){
 const cv=({...example,template});
 const buffer=await new Promise(resolve=>pdfMake.createPdf(documentDefinition(cv)).getBuffer(resolve));
 await writeFile(`test-output/template-pdfs/${template}.pdf`,buffer);
 console.log(`${template}: ${buffer.length} bytes`);
}
for(const template of ['horizon','banner']){
 const cv=({...example,template,summary:example.summary.repeat(10),experience:Array.from({length:20},(_,i)=>({...example.experience[0],title:`${i+1}. ${example.experience[0].title}`,description:example.experience[0].description.repeat(8)})),skills:example.skills.repeat(15),languages:example.languages.repeat(10)});
 const buffer=await new Promise(resolve=>pdfMake.createPdf(documentDefinition(cv)).getBuffer(resolve));
 await writeFile(`test-output/template-pdfs/${template}-long.pdf`,buffer);
 console.log(`${template}-long: ${buffer.length} bytes`);
}
