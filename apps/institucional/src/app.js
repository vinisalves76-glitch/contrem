const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navegacao');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); toggle.setAttribute('aria-label', 'Abrir menu'); }
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
 tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; document.getElementById(t.getAttribute('aria-controls')).hidden = !selected; });
 if(focus) tab.focus();
}
tabs.forEach((tab, i) => {
 tab.addEventListener('click', () => selectTab(tab));
 tab.addEventListener('keydown', e => { let target; if(e.key === 'ArrowRight' || e.key === 'ArrowLeft') target = tabs[(i + 1) % tabs.length]; if(e.key === 'Home') target = tabs[0]; if(e.key === 'End') target = tabs[tabs.length - 1]; if(target) { e.preventDefault(); selectTab(target, true); } });
});
document.querySelectorAll('[data-interest]').forEach(button => button.addEventListener('click', () => {
 document.querySelector('#interest').value = button.dataset.interest;
 document.querySelector('#contato').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 document.querySelector('[name="nome"]').focus({preventScroll: true});
}));
const dialog = document.querySelector('#proposal-dialog');
let proposal = '';
document.querySelector('#proposal-form').addEventListener('submit', e => {
 e.preventDefault(); const d = new FormData(e.currentTarget);
 proposal = `SOLICITAÇÃO DE PROPOSTA — CONTREM\n\nNome: ${d.get('nome').trim()}\nEmpresa: ${d.get('empresa').trim()}\nE-mail: ${d.get('email').trim()}\nInteresse: ${d.get('interesse')}\n\nNecessidade:\n${d.get('mensagem').trim()}`;
 document.querySelector('#proposal-summary').textContent = proposal;
 document.querySelector('#copy-status').textContent = '';
 dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if(e.target === dialog) {const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();} });
document.querySelector('#copy-proposal').addEventListener('click', async () => {
 try { await navigator.clipboard.writeText(proposal); document.querySelector('#copy-status').textContent = 'Texto copiado. Pronto para compartilhar.'; }
 catch { document.querySelector('#copy-status').textContent = 'Não foi possível copiar automaticamente. Selecione o texto acima ou baixe a solicitação.'; }
});
document.querySelector('#download-proposal').addEventListener('click', () => {
 const url = URL.createObjectURL(new Blob([proposal], {type:'text/plain;charset=utf-8'}));
 const a = document.createElement('a'); a.href = url; a.download = 'solicitacao-contrem.txt'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
 document.querySelector('#copy-status').textContent = 'Solicitação preparada para download.';
});
document.querySelector('#year').textContent = new Date().getFullYear();
