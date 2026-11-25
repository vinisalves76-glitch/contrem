// CONTREM Academia — institucional carregado antes dos scripts de interface.
;(()=>{const video='hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500',view=document.getElementById('studentView'),entry=document.getElementById('enter');if(!view)return;
const css=document.createElement('style');
css.textContent='#contremIntro{display:grid;grid-template-columns:1fr 1fr;background:#102A43;border-radius:16px;overflow:hidden;margin:24px 0 27px;color:white;box-shadow:0 12px 28px #102a4322}#contremIntro .body{padding:30px;align-self:center}#contremIntro small{color:#ffb477;font-weight:800;letter-spacing:.1em}#contremIntro h2{color:#fff;font-size:clamp(24px,3vw,34px);margin:12px 0}#contremIntro p{color:#dce8ef;line-height:1.5}#contremIntro .thumb{background:linear-gradient(90deg,#102a4322,#102a4355),url(https://image.mux.com/'+video+'/thumbnail.jpg?time=1&width=960) center/cover;min-height:270px;display:grid;place-items:center;cursor:pointer}#contremIntro button,#contremIntroOverlay button{background:#F47B20;color:white;border:0;border-radius:9px;font-weight:800;padding:12px 18px;cursor:pointer}#contremIntro .thumb button{width:74px;height:74px;border-radius:50%;font-size:25px}#contremIntroOverlay{position:fixed;inset:0;z-index:999999;background:#07121cdb;backdrop-filter:blur(7px);padding:16px;display:flex;justify-content:center;align-items:center}#contremIntroOverlay .dialog{width:min(900px,100%);background:#fff;color:#102a43;border-radius:16px;overflow:hidden;box-shadow:0 25px 80px #0007}#contremIntroOverlay .head,#contremIntroOverlay .foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 23px}#contremIntroOverlay h2{font-size:clamp(19px,3vw,26px);margin:6px 0;color:#102a43}#contremIntroOverlay .video{aspect-ratio:16/9;background:#081824}#contremIntroOverlay iframe{height:100%;width:100%;border:0}#contremIntroOverlay button.skip{background:#e9eef2;color:#102a43}#contremIntroOverlay .buttons{display:flex;gap:9px;flex-wrap:wrap}#contremIntroOverlay .foot span{font-size:13px;color:#576b78}@media(max-width:720px){#contremIntro{grid-template-columns:1fr}#contremIntro .thumb{grid-row:1;min-height:215px}#contremIntro .body{padding:22px}#contremIntroOverlay .head,#contremIntroOverlay .foot{padding:14px;flex-wrap:wrap}#contremIntroOverlay .buttons{width:100%}#contremIntroOverlay .buttons button{flex:1}}';
document.head.appendChild(css);
const feature=document.createElement('section');feature.id='contremIntro';
feature.innerHTML='<div class="body"><small>★ APRESENTAÇÃO INSTITUCIONAL</small><h2>Conheça a CONTREM.</h2><p>Consultoria, treinamentos técnicos e inovação na manutenção de máquinas pesadas. Conheça a CONTREM Academia e a CONTREMTEC.</p><button type="button" data-intro-play>▶ Assistir à apresentação</button></div><div class="thumb" role="button" tabindex="0" data-intro-play aria-label="Reproduzir a apresentação"><button type="button" aria-label="Assistir ao vídeo">▶</button></div>';
const banner=view.querySelector('.learning-banner');if(banner)banner.before(feature);else view.prepend(feature);
let modal=null;function close(){if(modal)modal.remove();modal=null;document.body.style.overflow=''}
function open(){if(modal)return;modal=document.createElement('div');modal.id='contremIntroOverlay';
modal.innerHTML='<div class="dialog" role="dialog" aria-modal="true" aria-label="Apresentação CONTREM"><div class="head"><div><small>BEM-VINDO À CONTREM ACADEMIA</small><h2>Antes de começar, conheça a CONTREM.</h2></div><button type="button" class="skip" data-intro-close>✕</button></div><div class="video"><iframe title="Apresentação institucional da CONTREM" src="https://player.mux.com/'+video+'?autoplay=true&playsinline=true&accent-color=%23F47B20" allow="autoplay;encrypted-media;picture-in-picture;fullscreen" allowfullscreen></iframe></div><div class="foot"><span>Seu aprendizado é o nosso compromisso.</span><div class="buttons"><button type="button" class="skip" data-intro-close>Pular apresentação</button><button type="button" data-intro-close>Ir para a Academia →</button></div></div></div>';
document.body.appendChild(modal);document.body.style.overflow='hidden';modal.querySelectorAll('[data-intro-close]').forEach(x=>x.addEventListener('click',close))}
feature.querySelectorAll('[data-intro-play]').forEach(el=>{el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter')open()})});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal)close()});
// A demo é uma entrada nova a cada clique, independentemente do histórico local.
const app=document.getElementById('app');
let demoEntryPending=false;
function openOnDemoEntry(){
 if(!demoEntryPending || app.classList.contains('hidden'))return;
 demoEntryPending=false;
 // Um modal antigo nunca pode bloquear a nova apresentação.
 if(modal)close();
 if(view.classList.contains('hidden'))show('studentView');
 open();
}
entry?.addEventListener('click',()=>{
 demoEntryPending=true;
 queueMicrotask(openOnDemoEntry);
 setTimeout(openOnDemoEntry,160);
}, {capture:true});
new MutationObserver(openOnDemoEntry).observe(app,{attributes:true,attributeFilter:['class']});
document.getElementById('exit')?.addEventListener('click',()=>{demoEntryPending=false;if(modal)close()});
})();
// Presentation layer only. Keep storage and backup formats compatible with VA Academia.
document.querySelectorAll('[data-jump]').forEach(button => {
 button.addEventListener('click', () => {
  show('studentView'); refresh();
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(button.dataset.jump);
  document.querySelector('.nav [data-jump="'+button.dataset.jump+'"]').classList.add('active');
  document.getElementById('workspaceLabel').textContent = { 'my-courses':'Meus cursos','my-performance':'Meu desempenho','my-profile':'Meu perfil','my-certificates':'Certificados' }[button.dataset.jump] || 'Minha aprendizagem';
  if(target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
 });
});
const brandShow = show;
show = function(id) {
 brandShow(id);
 document.querySelectorAll('.nav [data-jump]').forEach(b => b.classList.remove('active'));
 document.getElementById('workspaceLabel').textContent = id === 'adminView' ? 'Administração' : id === 'classView' ? 'Sala de aula' : id === 'studioView' ? 'CONTREM Studio' : 'Minha aprendizagem';
};
document.getElementById('studentTab').addEventListener('click', () => window.scrollTo({top:0,behavior:'instant'}));
document.getElementById('adminTab').addEventListener('click', () => window.scrollTo({top:0,behavior:'instant'}));
document.getElementById('enter')?.addEventListener('click', () => {
 show('studentView'); window.scrollTo({top:0,behavior:'instant'});
});
document.getElementById('displayName')?.addEventListener('keydown', event => {
 if(event.key === 'Enter') { event.preventDefault(); document.getElementById('enter').click(); }
});
// Add the same exit action to the mobile shell, keeping the original exit behavior.
const mobileExit = document.createElement('button'); mobileExit.className='mobile-exit';
mobileExit.textContent='Sair'; mobileExit.type='button'; mobileExit.setAttribute('aria-label','Sair do ambiente');
mobileExit.addEventListener('click', () => { document.getElementById('exit').click(); window.scrollTo({top:0,behavior:'instant'}); });
document.querySelector('.workspace-header').append(mobileExit);
document.querySelector('#app > .muted:last-child').classList.add('app-footer');

