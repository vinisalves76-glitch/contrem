import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('src','dist',{recursive:true,filter:path=>!path.endsWith('/AGENTS.md')&&!path.endsWith('/README.md')&&!path.includes('/docs')});
console.log('Build estático pronto em dist/. Nenhum deploy realizado.');
