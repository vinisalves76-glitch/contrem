// Local demonstration data is preserved; authenticated caches use a per-account namespace.
(() => {
 let scope=null,muted=0;
 const listeners=new Set();
 const scoped=key=>scope?'contrem-academia:'+scope+':'+key:key;
 window.academyStorage={
  getItem:key=>localStorage.getItem(scoped(key)),
  setItem(key,value){localStorage.setItem(scoped(key),value);if(!muted)listeners.forEach(fn=>fn(key));},
  removeItem(key){localStorage.removeItem(scoped(key));if(!muted)listeners.forEach(fn=>fn(key));},
  setScope(id){if(id!==null&&!/^[a-f0-9-]{36}$/i.test(id))throw Error('Conta inválida.');scope=id;},
  getScope:()=>scope,
  getLegacy:key=>localStorage.getItem(key),
  quiet(fn){muted++;try{return fn();}finally{muted--; }},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 };
})();
