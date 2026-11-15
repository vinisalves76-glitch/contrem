const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../src/index.html'),'utf8');
const functions=html.split('\n').filter(line=>/^(function (safeHttps|legacyVideoId|videoId)\()/.test(line)).join('\n');
const validation=html.slice(html.indexOf('function validateBackup(data){'),html.indexOf('function restoreBackup(data){'));
const context=vm.createContext({URL});vm.runInContext(functions+'\n'+validation,context);
const id='hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
for(const input of [id,'https://player.mux.com/'+id,'https://player.mux.com/watch/'+id,'https://stream.mux.com/'+id+'.m3u8'])assert.equal(context.videoId(input),id);
for(const input of ['https://www.youtube.com/watch?v=nBE8JrByOf0','nBE8JrByOf0','https://player.mux.com.attacker.test/'+id,'https://attacker.test/'+id,'javascript:alert(1)','https://user:pass@player.mux.com/'+id,'https://stream.mux.com/'+id+'.m3u8?token=secret','https://player.mux.com/'+id+'?playback-token=secret'])assert.equal(context.videoId(input),'');
for(const version of [1,2,3,4])for(const url of ['https://www.youtube.com/watch?v=nBE8JrByOf0','https://player.mux.com/'+id,'']){
 const data={app:'VA Academia',schemaVersion:version,courses:[{id:'course-1',name:'Teste',lessons:[{id:'lesson-1',name:'Aula',url}]}],progress:{'course-1':['lesson-1']}};
 const before=JSON.stringify(data);assert.equal(context.validateBackup(data),true);assert.equal(JSON.stringify(data),before);
}
assert(!html.includes('id="ytLink"'));assert(!html.includes('youtube-nocookie.com/embed/'));assert(!html.includes("url:'https://www.youtube.com/watch?v=nBE8JrByOf0'"));
assert(html.includes("$('markDone').disabled=!id"));
console.log('PASS: Mux source parsing, external/token URL rejection, backup v1-v4 preservation, removal of active YouTube playback and completion gate.');
