import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const app of ['academia','tec']){
 let pkg;try{pkg=JSON.parse(await readFile(`apps/${app}/package.json`,'utf8'));}catch{continue;}
 const task=pkg.scripts?.test?'test':pkg.scripts?.check?'check':null;
 if(!task)continue;
 const r=spawnSync('npm',['run',task],{cwd:`apps/${app}`,stdio:'inherit'});if(r.status)process.exit(r.status??1);
}
