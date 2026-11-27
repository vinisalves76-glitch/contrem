// Keep the real SDK/session; only Edge Function transport is same-origin on Vercel previews.
(() => {
 const original=window.fetch.bind(window);
 window.contremAcademyFetch=async(input,init)=>{
  const raw=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  const url=new URL(raw,location.href);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  const signal=init?.signal||input instanceof Request&&input.signal;
  if(signal){if(signal.aborted)controller.abort();else signal.addEventListener('abort',()=>controller.abort(),{once:true});}
  try{
  if(location.hostname.endsWith('.vercel.app')&&url.origin==='https://vwvesygsudhbaqmayhsz.supabase.co'&&url.pathname.startsWith('/functions/v1/')){
   const fn=url.pathname.slice('/functions/v1/'.length);
   if(['academy-workspace','academy-students','academy-programs','academy-playback'].includes(fn)){
    const request=new Request(input,init);
    return await original('/api/academy-proxy?fn='+encodeURIComponent(fn),{method:request.method,headers:request.headers,body:await request.text(),signal:controller.signal});
   }
  }
  return await original(input,{...init,signal:controller.signal});
  }catch(error){if(controller.signal.aborted&&!signal?.aborted)throw Error('A conexão com a Academia demorou demais. Confira a internet e tente novamente.');throw error;}
  finally{clearTimeout(timeout);}
 };
})();
