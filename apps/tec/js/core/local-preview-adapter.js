// Independent browser-only preview. No network client, credentials or production data.
export function createLocalPreviewAdapter() {
  const KEY = 'contremtec-preview-data-v1';
  const MASTER_UID = 'contremtec-demo-admin';
  const now = () => new Date().toISOString();
  const clone = value => structuredClone(value);
  const initial = () => ({
    profiles: [{id:MASTER_UID,uid:MASTER_UID,email:'demo@contremtec.example',name:'Equipe CONTREM',role:'super_admin',roleLabel:'Administrador · demonstração',active:true,permissions:[],mustChangePassword:false}],
    operational_areas: [{id:'operacao-demo',name:'Operação de demonstração',active:true}]
  });
  let tables;
  try { tables = JSON.parse(localStorage.getItem(KEY)) || initial(); } catch { tables = initial(); }
  const rows = name => tables[name] || (tables[name] = []);
  const persist = () => localStorage.setItem(KEY,JSON.stringify(tables));
  let user = null;
  const listeners = new Set();
  const auth = {};
  Object.defineProperty(auth,'currentUser',{get:()=>user});
  const db = {provider:'local-preview'}, storage = {provider:'local-preview'};
  const ref = (table,id=null,ownerId=null,reportId=null) => ({__local:true,table,id,ownerId,reportId,parent:ownerId?{id:ownerId,parent:{id:ownerId}}:null});
  const profilesRef = ref('profiles');
  function collection(base,...parts) {
    if(base?.table==='reports' && parts[0]==='photos') return ref('report_photos',null,base.ownerId,base.id);
    if(parts[0]==='userProfiles') return ref('profiles');
    if(parts[0]==='contremtec-trainings') return ref('trainings');
    if(parts[0]==='users' && ['reports','agenda'].includes(parts[2])) return ref(parts[2],null,parts[1]);
    throw new Error('Coleção de demonstração desconhecida.');
  }
  function collectionGroup(_db,name) {
    if(!['reports','agenda'].includes(name)) throw new Error('Coleção global desconhecida.');
    return ref(name);
  }
  function doc(base,...parts) {
    if(base?.__local) return ref(base.table,parts[0]||crypto.randomUUID(),base.ownerId,base.reportId);
    if(parts[0]==='userProfiles') return ref('profiles',parts[1]);
    if(parts[0]==='contremtec-trainings') return ref('trainings',parts[1]);
    if(parts[0]==='users' && parts[2]==='settings') return ref('user_settings',parts[3],parts[1]);
    if(parts[0]==='users' && ['reports','agenda'].includes(parts[2])) return ref(parts[2],parts[3],parts[1]);
    throw new Error('Referência local desconhecida.');
  }
  const where = (field,op,value) => ({field,op,value});
  const query = (base,...filters) => ({...base,filters});
  const match = (r,f) => {
    const value = r[f.field];
    switch(f.op) {
      case '==': return value===f.value;
      case '!=': return value!==f.value;
      case 'in': return f.value.includes(value);
      case '>=': return value>=f.value;
      case '<=': return value<=f.value;
      case '>': return value>f.value;
      case '<': return value<f.value;
      default: throw new Error('Filtro não disponível na demonstração.');
    }
  };
  const matches = (row,r) => (!r.id || row.id===r.id) && (!r.ownerId || (row.ownerUid||row.owner_id)===r.ownerId) && (!r.reportId || row.report_id===r.reportId) && (r.filters||[]).every(f=>match(row,f));
  function snap(r,row) { return {id:row?.id||r.id,ref:{...r,id:row?.id||r.id},exists:()=>!!row,data:()=>row?clone(row):undefined}; }
  async function getDocs(r) {
    const docs = rows(r.table).filter(row=>matches(row,r)).map(row=>snap({...r,parent:{parent:{id:row.ownerUid||row.owner_id}}},row));
    return {docs,empty:!docs.length,size:docs.length};
  }
  async function getDoc(r) { return snap(r,rows(r.table).find(row=>matches(row,r))); }
  async function setDoc(r,data,options={}) {
    const list=rows(r.table),index=list.findIndex(row=>matches(row,r));
    const value={...(options.merge&&index>=0?list[index]:{}),...clone(data),id:r.id,ownerUid:r.ownerId||data.ownerUid,report_id:r.reportId||data.report_id};
    if(index>=0)list[index]=value;else list.push(value);
    persist();return {id:r.id};
  }
  async function updateDoc(r,data) { return setDoc(r,data,{merge:true}); }
  async function deleteDoc(r) { tables[r.table]=rows(r.table).filter(row=>!matches(row,r));persist(); }
  // Supports the read and simple CRUD vocabulary used by the retained operational UI.
  class LocalQuery {
    constructor(table) {this.table=table;this.filters=[];this.action='select';this.one=false;this.take=null;this.sort=[];}
    select(){return this;}
    eq(field,value){this.filters.push({field,op:'==',value});return this;}
    neq(field,value){this.filters.push({field,op:'!=',value});return this;}
    in(field,value){this.filters.push({field,op:'in',value});return this;}
    is(field,value){return this.eq(field,value);}
    gte(field,value){this.filters.push({field,op:'>=',value});return this;}
    lte(field,value){this.filters.push({field,op:'<=',value});return this;}
    gt(field,value){this.filters.push({field,op:'>',value});return this;}
    lt(field,value){this.filters.push({field,op:'<',value});return this;}
    order(field,options={}){this.sort.push([field,options.ascending!==false]);return this;}
    limit(value){this.take=value;return this;}
    range(start,end){this.start=start;this.take=end-start+1;return this;}
    maybeSingle(){this.one=true;return this;}
    single(){this.one=true;this.required=true;return this;}
    insert(data){this.action='insert';this.payload=data;return this;}
    upsert(data,options={}){this.action='upsert';this.payload=data;this.conflict=options.onConflict||'id';return this;}
    update(data){this.action='update';this.payload=data;return this;}
    delete(){this.action='delete';return this;}
    async run(){
      try {
        let selected=rows(this.table).filter(row=>this.filters.every(f=>match(row,f)));
        if(this.action==='insert'||this.action==='upsert'){
          selected=(Array.isArray(this.payload)?this.payload:[this.payload]).map(item=>{
            const value={id:crypto.randomUUID(),created_at:now(),updated_at:now(),...clone(item)};
            const keys=(this.conflict||'id').split(',');
            const old=this.action==='upsert'?rows(this.table).find(row=>keys.every(k=>row[k]===value[k])):null;
            if(old){Object.assign(old,value,{id:old.id});return old;}
            rows(this.table).push(value);return value;
          });persist();
        } else if(this.action==='update'){selected.forEach(row=>Object.assign(row,clone(this.payload),{updated_at:now()}));persist();}
        else if(this.action==='delete'){tables[this.table]=rows(this.table).filter(row=>!selected.includes(row));persist();}
        for(const [field,asc] of this.sort.slice().reverse()) selected.sort((a,b)=>String(a[field]??'').localeCompare(String(b[field]??''),undefined,{numeric:true})*(asc?1:-1));
        if(this.take!==null)selected=selected.slice(this.start||0,(this.start||0)+this.take);
        if(this.required&&selected.length!==1)throw new Error('Registro não encontrado na demonstração.');
        return {data:clone(this.one?selected[0]||null:selected),error:null,count:selected.length};
      } catch(error){return {data:null,error};}
    }
    then(resolve,reject){return this.run().then(resolve,reject);}
  }
  const unavailable = () => {throw new Error('Este serviço precisa de conexão corporativa. A demonstração usa apenas dados locais.');};
  // Attachments remain on this device in IndexedDB, never in the old cloud account.
  async function fileStore(mode,operation){
    const connection=await new Promise((resolve,reject)=>{const request=indexedDB.open('contremtec-preview-files',1);request.onupgradeneeded=()=>request.result.createObjectStore('files');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    try{return await new Promise((resolve,reject)=>{const tx=connection.transaction('files',mode),store=tx.objectStore('files');let result;const request=operation(store);request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);});}finally{connection.close();}
  }
  const storageApi={
    async upload(path,file){try{await fileStore('readwrite',s=>s.put(file,path));return {data:{path},error:null};}catch(error){return {data:null,error};}},
    async createSignedUrl(path){try{const file=await fileStore('readonly',s=>s.get(path));if(!file)throw new Error('Arquivo indisponível neste dispositivo.');return {data:{signedUrl:URL.createObjectURL(file)},error:null};}catch(error){return {data:null,error};}},
    async remove(paths){for(const path of paths)await fileStore('readwrite',s=>s.delete(path));return {error:null};}
  };
  const supabase={
    from:table=>new LocalQuery(table),
    auth:{async getSession(){return {data:{session:user?{user,access_token:null}:null},error:null};}},
    storage:{from:()=>storageApi},
    async rpc(name){
      if(name==='list_operational_area_mechanics')return {data:rows('profiles').filter(p=>p.role==='mecanico'),error:null};
      return {data:null,error:new Error('Esta operação exige as validações do servidor. Disponível após a configuração corporativa da ContremTec.')};
    }
  };
  async function signOut(){user=null;listeners.forEach(fn=>fn(null,'SIGNED_OUT'));}
  const backend={
    supabase,creatorClient:supabase,auth,db,storage,MASTER_UID,profilesRef,
    collection,collectionGroup,doc,where,query,serverTimestamp:now,getDocs,getDoc,setDoc,updateDoc,deleteDoc,
    createUserProfile:(uid,data)=>setDoc(ref('profiles',uid),data),
    signInWithEmailAndPassword:unavailable,signOut,updatePassword:unavailable,sendPasswordResetEmail:unavailable,createUserWithEmailAndPassword:unavailable,
    onAuthStateChanged(_auth,fn){listeners.add(fn);queueMicrotask(()=>fn(user,'INITIAL_SESSION'));return ()=>listeners.delete(fn);},
    storageRef:(_storage,path)=>({path}),
    async uploadBytes(r,file){const result=await storageApi.upload(r.path,file);if(result.error)throw result.error;return {ref:r};},
    async getDownloadURL(r){const result=await storageApi.createSignedUrl(r.path);if(result.error)throw result.error;return result.data.signedUrl;},
    startDemo(){user={id:MASTER_UID,uid:MASTER_UID,email:'demo@contremtec.example'};listeners.forEach(fn=>fn(user,'SIGNED_IN'));},
    get currentSupabaseUser(){return user;},set currentSupabaseUser(value){user=value;}
  };
  return backend;
}
