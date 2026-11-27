(() => {
 const button=document.createElement('button');button.type='button';button.hidden=true;button.id='scormAuthoringTab';button.innerHTML='<span aria-hidden="true">✦</span> Criar treinamento interativo';
 document.getElementById('adminNav').append(button);
 button.onclick=()=>{location.href='/academia/criador-ia/'};
 window.addEventListener('contrem:academy-session-ready',event=>{button.hidden=!['admin','content_admin'].includes(event.detail.role)});
 window.addEventListener('contrem:academy-session-ended',()=>{button.hidden=true});
})();
