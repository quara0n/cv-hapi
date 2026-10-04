import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {readDocument} from '../src/document-import.js';
const text='Alex Example\nPROFILE\nI help residents with daily activities and communicate clearly with colleagues.';
test('TXT import preserves Unicode, removes null bytes and rejects short or oversized input',async()=>{
 assert.equal(await readDocument({name:'cv.txt',size:200,text:async()=>text+'\u0000\nЃорѓи Ќосев'}),text+'\nЃорѓи Ќосев');
 await assert.rejects(readDocument({name:'cv.txt',size:6*1024*1024}),/size/);
 await assert.rejects(readDocument({name:'cv.txt',size:5,text:async()=>'short'}),/scan/);
 await assert.rejects(readDocument({name:'cv.txt',size:21000,text:async()=>'a'.repeat(20001)}),/length/);
 await assert.rejects(readDocument({name:'cv.exe',size:100}),/type/);
});
test('DOCX import reads document paragraphs without treating embedded text as markup',async()=>{
 const content='Alex Example — Ѓорѓи Ќосев. I help residents with meals and daily activities.';
 const bytes=zipSync({'[Content_Types].xml':strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),'word/document.xml':strToU8(`<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${content}</w:t></w:r></w:p></w:body></w:document>`)});
 assert.equal(await readDocument({name:'cv.docx',size:bytes.length,arrayBuffer:async()=>bytes.buffer}),content);
 await assert.rejects(readDocument({name:'broken.docx',size:3,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}));
});
