import pdfMake from 'pdfmake/build/pdfmake';
import fonts from 'pdfmake/build/vfs_fonts';
import {documentDefinition} from './model.js';
pdfMake.addVirtualFileSystem(fonts);
export async function downloadPdf(data){const blob=await new Promise((resolve,reject)=>{try{pdfMake.createPdf(documentDefinition(data)).getBlob(resolve)}catch(err){reject(err)}});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CV-${data.name.replace(/[^\p{L}\p{N} _-]/gu,'').trim()||'cekor'}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
