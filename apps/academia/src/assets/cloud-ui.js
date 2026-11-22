// Entrada única da versão conectada: sem fallback local e sem autenticação simulada.
(() => {
 'use strict';
 const login=document.getElementById('login');
 const app=document.getElementById('app');
 const form=document.getElementById('cloudLoginForm');
 const status=document.getElementById('cloudLoginStatus');
 window.AcademySession=null;
 app.classList.add('hidden');login.classList.remove('hidden');
 const config=window.CONTREM_ACADEMY_CONFIG;
 if(!config||config.mode!=='connected'||config.preview!==false||!window.AcademyConnectedUI){
  status.textContent='A conexão segura da Academia não foi carregada. Atualize a página.';
  form.querySelector('button').disabled=true;
  return;
 }
 try{window.AcademyConnectedUI.initialize(config);}
 catch{
  app.classList.add('hidden');login.classList.remove('hidden');
  status.textContent='Não foi possível iniciar a Academia conectada. Atualize a página.';
  form.querySelector('button').disabled=true;
 }
})();
