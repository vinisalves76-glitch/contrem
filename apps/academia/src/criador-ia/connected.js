window.CONTREM_AUTHORING_BOOT=(async()=>{
 const root=document.getElementById('root');root.innerHTML='<div class="panel"><h2>Carregando sua conta</h2><p>Consultando as permissões da Academia…</p></div>';
 const config=window.CONTREM_ACADEMY_CONFIG;
 const client=window.supabase.createClient(config.url,config.publishableKey,{auth:{storageKey:'contrem-academia-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const {data,error}=await client.auth.getUser();
 const blocked=message=>{root.innerHTML='<section class="panel"><h1>Acesso ao criador</h1><p id="authoringAccessMessage"></p><a href="/academia/">Entrar na CONTREM Academia</a></section>';document.getElementById('authoringAccessMessage').textContent=message;return null};
 if(error||!data.user)return blocked('Entre com sua conta da Academia para abrir seus treinamentos.');
 const memberResult=await client.from('academy_members').select('id,role,active,display_name').eq('user_id',data.user.id).maybeSingle();
 const member=memberResult.data;
 if(memberResult.error||!member?.active||!['admin','content_admin'].includes(member.role)||(member.role==='admin'&&data.user.email?.toLowerCase()!=='vinicius.alves@irmen.com.br'))return blocked('O criador está disponível para a equipe de conteúdo autorizada.');
 const table='academy_authoring_drafts';let rows=[];
 const unwrap=r=>{if(r.error)throw Error('Não foi possível consultar ou salvar o rascunho. Confira sua conexão e tente novamente.');return r.data};
 const connection={client,userId:data.user.id,role:member.role,name:member.display_name,localKey:'contrem-authoring-pending:'+data.user.id,rows,
  async list(){rows=unwrap(await client.from(table).select('id,title,status,revision,updated_at').order('updated_at',{ascending:false}).limit(100));this.rows=rows;return rows},
  async load(id){return unwrap(await client.from(table).select('*').eq('id',id).single())},
  async save(project){
   // Preview learning activity is not an official student record.
   const value=structuredClone(project);delete value.draftId;delete value.draftRevision;value.done=[];value.answers={};value.attemptCount=0;value.finalScore=null;value.page='home';value.selected=0;
   if(!value.title?.trim()||!Array.isArray(value.modules)||value.modules.length>100)throw Error('Revise o título e a quantidade de módulos.');
   if(new TextEncoder().encode(JSON.stringify(value)).length>600000)throw Error('O rascunho excede 600 KB. Reduza os materiais em texto antes de salvar.');
   let row;
   if(project.draftId){row=unwrap(await client.from(table).update({title:value.title,project:value,status:value.reviewed?'reviewed':'draft'}).eq('id',project.draftId).eq('revision',project.draftRevision).select('*').maybeSingle());if(!row)throw Error('Este rascunho mudou em outra sessão. Baixe seu projeto editável e reabra a versão do banco antes de salvar.');}
   else row=unwrap(await client.from(table).insert({id:crypto.randomUUID(),title:value.title,project:value,created_by:data.user.id,status:'draft'}).select('*').single());
   this.rows=[{id:row.id,title:row.title,status:row.status,revision:row.revision,updated_at:row.updated_at},...this.rows.filter(r=>r.id!==row.id)];return row;
  }
 };
 client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(session?.user?.id&&session.user.id!==data.user.id))location.replace('/academia/')});
 try{await connection.list()}catch(e){return blocked(e.message)}
 document.querySelector('.avatar').textContent=(member.display_name||'CT').split(' ').slice(0,2).map(s=>s[0]).join('');
 return connection;
})();
