'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Regression: a for..of courseId must not shadow data(studentId), triggering a TDZ error.
test('Aluno de teste can enter, restore session, and ADM still enters',async()=>{
  const assets=path.resolve(__dirname,'../src/assets');
  const data=new Map(),session=new Map();
  const mockStore=map=>({
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key)
  });
  let sequence=0;
  const crypto={
    randomUUID:()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`,
    subtle:{importKey:async()=>({}),deriveBits:async()=>new Uint8Array(32).buffer}
  };
  const window={CONTREM_ACADEMY_CONFIG:{preview:true},AcademySession:null};
  const context=vm.createContext({
    window,crypto,TextEncoder,localStorage:mockStore(data),sessionStorage:mockStore(session),Uint8Array,Date,
    Set,Map,JSON,Number,String,Array,Object,Error,RegExp
  });
  for(const name of ['academy-program-core.js','academy-program-store.js','admin-preview-service.js']){
    vm.runInContext(fs.readFileSync(path.join(assets,name),'utf8'),context,{filename:name});
  }
  const service=window.AcademyAdminPreviewService.create();
  const learner=await service.startTestStudent();
  assert.equal(learner.member.role,'student');
  assert.equal(learner.catalog.courses.length,2);
  assert.equal((await service.restore()).user.id,learner.user.id);
  await service.signOut();
  const master=await service.startAdmin();
  assert.equal(master.member.role,'admin');
});
