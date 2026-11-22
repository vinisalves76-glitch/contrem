// Contract tests with an in-memory Supabase client double; no account/network access.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/assets/cloud-service.js',import.meta.url),'utf8');
const owner='vinicius.alves@irmen.com.br';
function fixture(options={}){
 const user={id:'auth-academia',email:options.email||'learner@example.invalid'};
 const member={id:'member-academia',user_id:user.id,role:options.role||'student',active:true,display_name:'QA',...options.member};
 const catalog={id:'main',revision:5,courses:[{id:'granted',name:'Granted',status:'published',lessons:[]}]};
 const state={member_id:member.id,revision:3,profile:{fullName:'QA'},progress:{},certificates:[],activity:{}};
 const calls=[],authCalls=[],rpcCalls=[],functions=[];
 const responses={member:options.noMember?null:member,state:options.noState?null:state,catalog,update:options.conflict?null:{...state,revision:4},...options.responses};
 const answer=(data,error=null)=>({data,error});
 const client={
  auth:{
   async signInWithPassword(credentials){authCalls.push(['signInWithPassword',credentials]);return options.authError?answer(null,options.authError):answer({user,session:{access_token:'fake-test-only'}});},
   async getUser(){authCalls.push(['getUser']);return options.getUserError?answer(null,options.getUserError):answer({user:options.signedOut?null:user});},
   async signOut(config){authCalls.push(['signOut',config]);return answer(null,options.signOutError);}
  },
  from(table){
   const call={table,filters:[],operation:'select'};calls.push(call);
   const chain={select(columns){call.columns=columns;return chain;},eq(key,value){call.filters.push([key,value]);return chain;},update(value){call.operation='update';call.value=value;return chain;},insert(value){call.operation='insert';call.value=value;return chain;},single(){return resolve();},maybeSingle(){return resolve();}};
   async function resolve(){
    if(options.dbError)return answer(null,options.dbError);
    if(call.operation==='update')return answer(responses.update);
    if(call.operation==='insert')return options.insertRace?answer(null,{code:'23505'}):answer({...state,...call.value});
    return answer(table==='academy_members'?responses.member:table==='academy_catalog'?responses.catalog:responses.state);
   }
   return chain;
  },
  async rpc(name,args){rpcCalls.push([name,args]);return answer(name==='academy_save_learning'?responses.update:responses.catalog,options.rpcError);},
  functions:{async invoke(name,config){functions.push([name,config]);return answer(options.functionResponse||{members:[{id:'student-1'}]},options.functionError);}}
 };
 const context={window:{CONTREM_ACADEMY_CONFIG:{mode:options.legacy?'legacy':'connected',preview:false,url:'https://contract-test.invalid',publishableKey:'public-test-only',playbackFunction:'academy-playback'}},console,URL,fetch:()=>{throw Error('Network access forbidden in contract test');}};vm.createContext(context);vm.runInContext(source,context);
 return {service:context.window.AcademyCloudService.create(client),client,user,member,catalog,state,calls,authCalls,rpcCalls,functions,responses};
}
test('student sign-in resolves Academy membership and uses granted-catalog RPC',async()=>{
 const f=fixture();const result=await f.service.signIn('learner@example.invalid','mock-password');
 assert.equal(result.member.id,f.member.id);assert.equal(result.catalog.courses[0].id,'granted');
 assert.deepEqual(f.calls[0].filters,[['user_id',f.user.id]]);assert.equal(f.rpcCalls[0][0],'academy_my_catalog');assert(!f.calls.some(c=>c.table==='academy_catalog'));
 assert.deepEqual(f.calls.find(c=>c.table==='academy_learning_state').filters,[['member_id',f.member.id]]);
});
test('restore validates Auth through getUser rather than trusting a local session',async()=>{
 const f=fixture();await f.service.restore();assert.equal(f.authCalls[0][0],'getUser');
});
test('restore without authenticated user performs no data queries',async()=>{
 const f=fixture({signedOut:true});assert.equal(await f.service.restore(),null);assert.equal(f.calls.length,0);
});
test('invalid credentials propagate without reading Academy data',async()=>{
 const f=fixture({authError:{message:'invalid credentials'}});await assert.rejects(f.service.signIn('x','x'));assert.equal(f.calls.length,0);
});
for(const [name,change] of [['another module user',{noMember:true}],['inactive member',{member:{active:false}}],['unknown member role',{role:'operator'}],['mismatched Auth ownership',{member:{user_id:'another-user'}}],['non-owner admin',{role:'admin',email:'other-admin@example.invalid'}]])test(name+' is denied before catalog/state access',async()=>{
 const f=fixture(change);await assert.rejects(f.service.signIn(f.user.email,'test-only'));
 assert.equal(f.calls.length,1);assert.equal(f.rpcCalls.length,0);assert(f.authCalls.some(c=>c[0]==='signOut'&&c[1].scope==='local'));
});
test('Academy owner admin reads shared catalog instead of student RPC',async()=>{
 const f=fixture({role:'admin',email:owner});await f.service.signIn(owner,'test-only');assert(f.calls.some(c=>c.table==='academy_catalog'));assert.equal(f.rpcCalls.length,0);
});
test('admin student management forwards explicit Edge actions and parameters',async()=>{
 const f=fixture({role:'admin',email:owner});await f.service.signIn(owner,'test-only');
 await f.service.listStudents();await f.service.createStudent('QA','new@example.invalid','test-only-password');await f.service.setCourseAccess('student-1','course-1',true);await f.service.setStudentActive('student-1',false);
 assert.deepEqual(JSON.parse(JSON.stringify(f.functions)),[
 ['academy-students',{body:{action:'list'}}],['academy-students',{body:{action:'create',name:'QA',email:'new@example.invalid',password:'test-only-password'}}],['academy-students',{body:{action:'access',memberId:'student-1',courseId:'course-1',enabled:true}}],['academy-students',{body:{action:'status',memberId:'student-1',active:false}}]]);
});
test('student and anonymous callers cannot invoke admin access actions',async()=>{
 const f=fixture();await assert.rejects(f.service.listStudents());await f.service.signIn(f.user.email,'test');
 for(const action of [()=>f.service.listStudents(),()=>f.service.createStudent('QA','x','x'),()=>f.service.setCourseAccess('x','y',true),()=>f.service.setStudentActive('x',false)])await assert.rejects(action());assert.equal(f.functions.length,0);
});
test('learning-state writes use member ownership and optimistic revision',async()=>{
 const f=fixture();await f.service.signIn(f.user.email,'test');await f.service.writeState({profile:{fullName:'Updated'},progress:{granted:['lesson']},activity:{},certificates:[]},3);
 const write=f.rpcCalls.find(c=>c[0]==='academy_save_learning');assert.ok(write);assert.equal(write[1].p_revision,3);assert.equal(write[1].member_id,undefined);assert.deepEqual(Object.keys(write[1]).sort(),['p_activity','p_profile','p_progress','p_revision']);assert(!f.calls.some(c=>c.operation==='update'));
});
test('stale learning-state revision raises AcademyConflict instead of overwriting',async()=>{
 const f=fixture({conflict:true});await f.service.signIn(f.user.email,'test');await assert.rejects(f.service.writeState({profile:{},progress:{},activity:{},certificates:[]},2),error=>error.name==='AcademyConflict');
});
test('connected owner admin saves courses through existing revision-guarded RLS table',async()=>{
 const f=fixture({role:'admin',email:owner});await f.service.signIn(owner,'test');
 const row=await f.service.writeCatalog([{id:'training-1',status:'draft',lessons:[]}],5);
 assert.equal(row.revision,4);
 assert(f.calls.some(c=>c.table==='academy_catalog'&&c.operation==='update'&&c.filters.some(f=>f[0]==='revision'&&f[1]===5)));
});
test('student cannot change the course catalog',async()=>{
 const f=fixture();await f.service.signIn(f.user.email,'test');
 await assert.rejects(f.service.writeCatalog([],5));
 assert(!f.calls.some(c=>c.table==='academy_catalog'&&c.operation==='update'));
});
test('revoked Academy membership clears previous administrative identity',async()=>{
 const f=fixture({role:'admin',email:owner});await f.service.signIn(owner,'test');f.responses.member={...f.member,active:false};await assert.rejects(f.service.reload());
 await assert.rejects(f.service.listStudents());await assert.rejects(f.service.writeState({profile:{},progress:{},activity:{},certificates:[]},3));assert.equal(f.functions.length,0);assert(!f.calls.some(c=>c.operation==='update'));
});
test('sign-out clears local identity and subsequent writes are denied',async()=>{
 const f=fixture({role:'admin',email:owner});await f.service.signIn(owner,'test');await f.service.signOut();await assert.rejects(f.service.listStudents());await assert.rejects(f.service.writeState({},3));assert(f.authCalls.some(c=>c[0]==='signOut'&&c[1].scope==='local'));
});
test('Edge errors preserve safe server error message instead of success',async()=>{
 const f=fixture({role:'admin',email:owner,functionError:{context:{json:async()=>({error:'Access denied by server'})}}});await f.service.signIn(owner,'test');await assert.rejects(f.service.setCourseAccess('student-1','course-1',true),/Access denied by server/);
});

test('connected state never writes sandbox certificate or assessment data',async()=>{
 const f=fixture();await f.service.signIn(f.user.email,'test');await f.service.writeState({profile:{fullName:'QA'},progress:{granted:['lesson']},certificates:[{id:'forged-certificate'}],activity:{'assessment:course-1':{passed:true},granted:{lastSeen:'2026-11-22',assessments:{final:{passed:true}}},'normal-day':{minutes:2}},assessment:{passed:true}},3);
 const write={value:f.rpcCalls.find(c=>c[0]==='academy_save_learning')[1]};assert(!('certificates' in write.value));assert(!('assessment' in write.value));assert(!JSON.stringify(write.value).includes('assessment:'));assert(!JSON.stringify(write.value).includes('forged-certificate'));assert(!JSON.stringify(write.value).includes('assessments'));
});
test('missing Auth user during restore removes previous admin authority',async()=>{
 const f=fixture({role:'admin',email:owner});await f.service.signIn(owner,'test');f.client.auth.getUser=async()=>({data:{user:null},error:null});assert.equal(await f.service.restore(),null);await assert.rejects(f.service.listStudents());assert.equal(f.functions.length,0);
});
test('failed second login cannot retain authority from a previous administrator',async()=>{
 const f=fixture({role:'admin',email:owner});await f.service.signIn(owner,'test');f.client.auth.signInWithPassword=async()=>({data:null,error:{message:'invalid credentials'}});await assert.rejects(f.service.signIn('someone@example.invalid','incorrect'));await assert.rejects(f.service.listStudents());assert.equal(f.functions.length,0);
});
test('reload obtains current Auth identity rather than reusing cached user',async()=>{
 const f=fixture();await f.service.signIn(f.user.email,'test');const count=f.authCalls.length;await f.service.reload();assert(f.authCalls.slice(count).some(c=>c[0]==='getUser'));
});

const privateVideo='d8e7309a-85cf-4189-b031-5f097739448c';
const signedPlayback=()=>({provider:'mux',policy:'signed',iframeUrl:'https://player.mux.com/PlaybackTestId?playback-token=aaa.bbb.ccc&thumbnail-token=ddd.eee.fff&storyboard-token=ggg.hhh.iii',expiresAt:Math.floor(Date.now()/1000)+600});
test('private playback invokes the configured Edge function with UUID only',async()=>{
 const response=signedPlayback(),f=fixture({functionResponse:response});await f.service.signIn(f.user.email,'test');const result=await f.service.playback(privateVideo);
 assert.equal(result.iframeUrl,response.iframeUrl);assert.deepEqual(JSON.parse(JSON.stringify(f.functions)),[['academy-playback',{body:{kind:'course',videoId:privateVideo}}]]);
});
for(const id of ['', 'public-mux-id','x&course=other','https://player.mux.com/PublicId'])test('malformed video id never invokes playback '+JSON.stringify(id),async()=>{const f=fixture();await f.service.signIn(f.user.email,'test');await assert.rejects(f.service.playback(id));assert.equal(f.functions.length,0);});
test('anonymous playback is rejected without invoking Edge',async()=>{const f=fixture();await assert.rejects(f.service.playback(privateVideo));assert.equal(f.functions.length,0);});
for(const [name,change] of [['public policy',{policy:'public'}],['unexpected provider',{provider:'cloudflare'}],['foreign player',{iframeUrl:'https://attacker.invalid/embed'}],['public URL without tokens',{iframeUrl:'https://player.mux.com/PlaybackTestId'}],['expired token',{expiresAt:1}],['missing expiry',{expiresAt:null}],['insecure URL',{iframeUrl:signedPlayback().iframeUrl.replace('https:','http:')}]])test('rejects unsafe playback response: '+name,async()=>{const f=fixture({functionResponse:{...signedPlayback(),...change}});await f.service.signIn(f.user.email,'test');await assert.rejects(f.service.playback(privateVideo));});
test('connected catalog excludes drafts even if remote response includes them',async()=>{const f=fixture({responses:{catalog:{revision:1,courses:[{id:'published',status:'published',lessons:[]},{id:'draft',status:'draft',lessons:[]}]}}});const result=await f.service.signIn(f.user.email,'test');assert.deepEqual(Array.from(result.catalog.courses,c=>c.id),['published']);});
test('connected progress drops ungranted courses, unknown lessons and assessment history',async()=>{const f=fixture({responses:{catalog:{revision:1,courses:[{id:'granted',status:'published',lessons:[{id:'lesson-1'}]}]}}});await f.service.signIn(f.user.email,'test');await f.service.writeState({profile:{},progress:{granted:['lesson-1','ungranted','lesson-1'],another:['secret'],'assessment:granted':[{passed:true}]},certificates:[],activity:{}},3);const write=f.rpcCalls.find(c=>c[0]==='academy_save_learning')[1];assert.deepEqual(JSON.parse(JSON.stringify(write.p_progress)),{granted:['lesson-1']});});

test('late restore cannot revive identity after clearIdentity',async()=>{const f=fixture({role:'admin',email:owner});let complete;f.client.auth.getUser=()=>new Promise(resolve=>complete=resolve);const restoring=f.service.restore();f.service.clearIdentity();complete({data:{user:f.user},error:null});await assert.rejects(restoring);await assert.rejects(f.service.listStudents());assert.equal(f.functions.length,0);assert.equal(f.calls.length,0);});

test('legacy state writes retain the prior table/revision contract',async()=>{const f=fixture({legacy:true});await f.service.signIn(f.user.email,'test');await f.service.writeState({profile:{fullName:'QA'},progress:{},certificates:[{id:'legacy'}],activity:{}},3);const write=f.calls.find(c=>c.operation==='update');assert.equal(write.table,'academy_learning_state');assert.deepEqual(write.filters,[['member_id',f.member.id],['revision',3]]);assert.deepEqual(JSON.parse(JSON.stringify(write.value.certificates)),[{id:'legacy'}]);assert(!f.rpcCalls.some(c=>c[0]==='academy_save_learning'));});
test('save-learning RPC denial never falls back to an unrestricted table write',async()=>{const f=fixture();await f.service.signIn(f.user.email,'test');f.client.rpc=async(name,args)=>({data:null,error:{message:'access revoked'}});await assert.rejects(f.service.writeState({profile:{},progress:{},activity:{}},3));assert(!f.calls.some(c=>c.operation==='update'));});
