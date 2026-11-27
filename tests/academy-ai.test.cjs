const {test}=require('node:test'),assert=require('node:assert/strict');
const handler=require('../api/academy-ai');
const response=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(v){this.body=v;return this}});
const request=(auth='Bearer valid')=>({method:'POST',headers:{origin:'https://preview.test',host:'preview.test','content-type':'application/json',authorization:auth},body:{title:'Energia perigosa',audience:'Mecânicos',modules:[{title:'Fontes',goal:'Identificar'}]}});
test('rejects unauthenticated callers before provider',async()=>{const res=response();await handler(request(''),res);assert.equal(res.statusCode,401)});
test('verifies team membership and returns reviewed modules without exposing secret',async()=>{
 const original=global.fetch,secret=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='private-test-secret';const requests=[];
 global.fetch=async(url,options)=>{requests.push({url,options});if(url.includes('/auth/v1/user'))return{ok:true,json:async()=>({id:'user-1'})};if(url.includes('/rest/v1/academy_members'))return{ok:true,json:async()=>[{role:'content_admin',active:true}]};return{ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({modules:[{title:'Fontes',goal:'Identificar',body:'Explicação',question:'Qual fonte?',options:['A','B','C'],correct:1}]})}]}]})}};
 try{const res=response();await handler(request(),res);assert.equal(res.statusCode,200);assert.equal(res.body.modules[0].correct,1);assert(!JSON.stringify(res.body).includes('private-test-secret'));assert.equal(requests.length,3);assert(requests[2].options.headers.Authorization.includes('private-test-secret'));}
 finally{global.fetch=original;if(secret===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=secret}
});
