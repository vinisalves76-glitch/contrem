import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const name of ['index.html','offline.html','manifest.webmanifest','pwa-icon.svg','sw.js','css','js','assets'])await cp(name,'dist/'+name,{recursive:true});
console.log('ContremTec static preview built. Server APIs remain source-only.');
