// This route is the content surface of the Academy, never a second application menu.
(() => {
 const query=new URLSearchParams(location.search),embedded=window.parent!==window&&query.get('embedded')==='1';
 if(!embedded){const draft=query.get('draft');location.replace('/academia/?'+(draft&&/^[a-f0-9-]{36}$/i.test(draft)?'authoringDraft='+encodeURIComponent(draft):'criarComIA=1'));return;}
 const surface=document.querySelector('.main');
 const report=()=>window.parent.postMessage({type:'contrem:authoring-height',height:Math.ceil(surface.getBoundingClientRect().height)+32},location.origin);
 new ResizeObserver(report).observe(surface);report();
})();
