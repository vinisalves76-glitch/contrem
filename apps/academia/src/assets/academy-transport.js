// Keep the real SDK/session; only Edge Function transport is same-origin on Vercel previews.
(() => {
 const original=window.fetch.bind(window);
 window.contremAcademyFetch=async(input,init)=>{
  const raw=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  const url=new URL(raw,location.href);
  if(location.hostname.endsWith('.vercel.app')&&url.origin==='https://vwvesygsudhbaqmayhsz.supabase.co'&&url.pathname.startsWith('/functions/v1/')){
   const fn=url.pathname.slice('/functions/v1/'.length);
   if(['academy-workspace','academy-students','academy-programs','academy-playback'].includes(fn)){
    const request=new Request(input,init);
    return original('/api/academy-proxy?fn='+encodeURIComponent(fn),{method:request.method,headers:request.headers,body:await request.text(),signal:request.signal});
   }
  }
  return original(input,init);
 };
})();
