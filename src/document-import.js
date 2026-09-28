import {MAX_TEXT} from './review-core.js';
export async function readDocument(file){
 if(file.size>5*1024*1024)throw new Error('size');
 const extension=file.name.split('.').pop().toLowerCase();let text='';
 if(extension==='txt')text=await file.text();
 else if(extension==='pdf'){
  const pdfjs=await import('pdfjs-dist');const {default:worker}=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');pdfjs.GlobalWorkerOptions.workerSrc=worker;
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});
  try{const pdf=await task.promise;if(pdf.numPages>12)throw new Error('pages');for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent();text+=content.items.map(x=>('str'in x)?x.str+(x.hasEOL?'\n':' '):'').join('')+'\n\n';if(text.length>MAX_TEXT)throw new Error('length');}}finally{await task.destroy()}
 }else if(extension==='docx'){
  const bytes=new Uint8Array(await file.arrayBuffer());
  // Bound declared ZIP expansion before handing a document to the parser.
  const view=new DataView(bytes.buffer);let expanded=0,count=0;
  for(let i=0;i+46<=bytes.length;i++)if(view.getUint32(i,true)===0x02014b50){expanded+=view.getUint32(i+24,true);count++;if(expanded>20*1024*1024||count>1000)throw new Error('size')}
  const mammoth=await import('mammoth/mammoth.browser.js');const result=await (mammoth.default||mammoth).extractRawText({arrayBuffer:bytes.buffer});text=result.value;
 }else throw new Error('type');
 text=text.replace(/\u0000/g,'').trim();if(text.length>MAX_TEXT)throw new Error('length');if(text.length<40)throw new Error('scan');return text;
}
