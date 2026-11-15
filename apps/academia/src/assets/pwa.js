(() => {
 'use strict';
 let installPrompt = null, registration = null, applyingUpdate = false, installedThisSession = false, installBusy = false;
 const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
 const android = !ios && /Android/i.test(navigator.userAgent);
 const standalone = () => installedThisSession || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
 const controls = [...document.querySelectorAll('[data-install-app]')];
 const dialog = document.getElementById('installDialog');
 const status = document.getElementById('pwaStatus');
 const updateBox = document.getElementById('pwaUpdate');
 // O aviso e o botão legados são eliminados da interface: atualizações são silenciosas.
 updateBox?.remove();
 const updateButton = document.getElementById('applyPwaUpdate');
 const silentStyle = document.createElement('style');
 silentStyle.textContent = '#pwaUpdate,#applyPwaUpdate{display:none!important;visibility:hidden!important}';
 document.head.appendChild(silentStyle);
 const nativeInstall = document.getElementById('nativeInstallButton');
 const nudge = document.getElementById('androidInstallOffer');
 const dismissKey = 'contrem-install-offer-dismissed';
 const wasDismissed = () => {try{return sessionStorage.getItem(dismissKey)==='true';}catch{return false;}};
 const dismissOffer = () => {nudge.hidden=true;try{sessionStorage.setItem(dismissKey,'true');}catch{}};
 const offerInstall = () => {nudge.hidden = !android || standalone() || wasDismissed();};
 document.documentElement.dataset.installPlatform = ios ? 'ios' : android ? 'android' : 'desktop';
 controls.forEach(button => {
  if(ios) button.firstChild.textContent = button.classList.contains('install-header') ? 'Como instalar ' : 'Adicionar à Tela de Início ';
 });
 const updateControls = () => {
  const installed = standalone();
  controls.forEach(button => { button.hidden = installed; });
  document.documentElement.classList.toggle('installed-app', installed);
  nativeInstall.hidden = installed || ios || !installPrompt;
  if(installed) nudge.hidden=true;
 };
 const openHelp = () => {
  document.getElementById('installIos').hidden = !ios;
  document.getElementById('installOther').hidden = ios;
  document.getElementById('installDialogIntro').textContent = ios ? 'No iPhone, adicione a CONTREM Academia à Tela de Início pelo Safari.' : android ? 'Instale a CONTREM Academia no seu Android para abrir pelo ícone.' : 'Instale a CONTREM Academia no computador para abrir em uma janela própria.';
  document.getElementById('installOtherTitle').textContent = android ? 'Instalar no Android' : 'Instalar no computador';
  document.getElementById('installNativeStatus').hidden = ios;
  document.getElementById('installNativeStatus').textContent = installPrompt ? 'A instalação está disponível. Toque no botão abaixo e confirme no navegador.' : 'O navegador ainda não liberou a confirmação automática. Abra no Chrome ou Edge atualizado e procure a opção Instalar aplicativo no menu. Se estiver dentro de outro aplicativo, abra este endereço no navegador.';
  updateControls();
  if(!dialog.open) dialog.showModal();
 };
 window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event;
  controls.forEach(button => button.setAttribute('data-install-ready', 'true'));
  updateControls(); offerInstall();
  if(dialog.open) openHelp();
 });
 const requestInstall = async () => {
  if(standalone() || installBusy) return;
  if(ios) {openHelp();return;}
  if(installPrompt) {
   const prompt = installPrompt; installPrompt = null;
   installBusy=true; nativeInstall.hidden=true;
   // Call the native prompt directly in the click handler, preserving user activation.
   try { await prompt.prompt(); await prompt.userChoice; dismissOffer(); if(dialog.open)dialog.close(); }
   catch { openHelp(); }
   finally {installBusy=false; controls.forEach(button=>button.removeAttribute('data-install-ready'));updateControls();}
  } else openHelp();
 };
 controls.forEach(button => button.addEventListener('click', requestInstall));
 nativeInstall.addEventListener('click', requestInstall);
 document.getElementById('dismissAndroidInstall').addEventListener('click',dismissOffer);
 window.addEventListener('load',offerInstall,{once:true});
 document.getElementById('closeInstallDialog').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {
  if(event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close();
 });
 window.addEventListener('appinstalled', () => {
  installedThisSession = true;
  installPrompt = null; controls.forEach(button => {button.hidden=true;});
  nativeInstall.hidden=true; nudge.hidden=true;
  if(dialog.open)dialog.close();
 });
 matchMedia('(display-mode: standalone)').addEventListener('change',updateControls);
 updateControls();
 function connectionState() {
  status.hidden = navigator.onLine;
  if(!navigator.onLine) status.textContent = 'Sem conexão. Você pode acessar o ambiente e os dados deste navegador. Os vídeos precisam de internet.';
 }
 connectionState();
 window.addEventListener('offline',connectionState);
 window.addEventListener('online', () => { connectionState(); registration?.update().catch(()=>{}); });
 // Atualização silenciosa: nenhuma confirmação ou banner ao abrir o aplicativo.
 updateBox.hidden = true;
 let reloadedForUpdate = false;
 function applyAutomaticUpdate() {
  updateBox.hidden = true;
  if(registration?.waiting) registration.waiting.postMessage({type:'SKIP_WAITING'});
 }
 // Não existe ação manual; o PWA assume a nova versão automaticamente.
 if('serviceWorker' in navigator && window.isSecureContext) {
  let hadServiceWorkerController=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
   document.documentElement.dataset.swReady = 'true';
   updateBox.hidden = true;
   if(!hadServiceWorkerController){hadServiceWorkerController=true;return;}
   if(reloadedForUpdate) return;
   reloadedForUpdate = true;
   location.reload();
  });
  window.addEventListener('load', async () => {
   try {
    registration = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI),{scope:new URL('./',document.baseURI).pathname,updateViaCache:'none'});
    if(navigator.serviceWorker.controller) document.documentElement.dataset.swReady='true';
    if(registration.waiting) applyAutomaticUpdate();
    registration.addEventListener('updatefound', () => {
     const worker=registration.installing;
     worker?.addEventListener('statechange', () => {
      if(worker.state==='installed') applyAutomaticUpdate();
     });
    });
    registration.update().catch(()=>{});
    navigator.serviceWorker.ready.then(() => {
     document.documentElement.dataset.pwaReady='true';
     document.getElementById('installOfflineNote').textContent='Ambiente preparado para abrir sem conexão neste navegador. Os vídeos precisam de internet. Seus dados continuam locais; faça backups.';
    });
   } catch {
    document.getElementById('installOfflineNote').textContent='Não foi possível preparar o acesso sem conexão neste navegador. Você ainda pode usar o site com internet.';
   }
  });
 }
})();
