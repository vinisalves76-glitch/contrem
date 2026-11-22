// Composição da trilha no ADM preexistente (somente sandbox da prévia).
// Não cria um segundo editor de cursos nem acessa backend de produção.
(() => {
 'use strict';
 const adminView=document.getElementById('adminView');
 const bridge=window.CONTREM_TRILHA_ADMIN_BRIDGE;
 const blueprint=window.CONTREM_TRILHA_CATALOG;
 if(!adminView||!bridge||!blueprint||window.CONTREM_ACADEMY_CONFIG?.preview!==true)return;
 const panel=document.createElement('details');
 panel.id='admTrilhaPanel';panel.className='panel adm-trilha-panel';
 panel.innerHTML=`
  <summary class="adm-trilha-summary"><span class="adm-trilha-symbol" aria-hidden="true">▦</span><span><strong>Trilhas de formação</strong><small>Organizar os módulos da Formação de Mecânicos com o construtor de cursos existente</small></span></summary>
  <div class="adm-trilha-intro">
   <p>Os 12 módulos são cursos da CONTREM Academia agrupados em três etapas. Você pode alterar <b>nome, categoria, descrição, foto e carga horária</b> pelo mesmo editor de cursos. Na etapa <b>2. Aulas e materiais</b>, adicione ou edite aulas, links Mux, anexos e apostilas. Avaliações seguem o fluxo atual. Não existe um segundo cadastro.</p>
   <p class="adm-trilha-notice">Ambiente isolado: as alterações são de teste e ficam armazenadas neste navegador. A publicação do curso continua restrita ao ADM e não publica na produção.</p>
   <div class="adm-trilha-actions">
    <button type="button" id="trilhaPrepare" class="primary">Preparar 12 módulos como rascunhos</button>
    <a class="outline adm-trilha-preview-link" href="./trilha-formacao/" target="_blank" rel="noopener noreferrer">Visualizar trilha como aluno ↗</a>
   </div>
   <p id="trilhaStatus" aria-live="polite" role="status"></p>
  </div>
  <div class="adm-trilha-list" id="trilhaModuleList"></div>`;
 const target=adminView.querySelector('.adm-workspace')||adminView.querySelector('.admin');
 target.before(panel);
 const status=panel.querySelector('#trilhaStatus');
 function render(){
  const data=bridge.list(),registered=new Map(data.map(c=>[c.id,c]));
  const list=panel.querySelector('#trilhaModuleList');
  list.replaceChildren();
  let lastStage=0;
  for(const m of blueprint.modules){
   if(m.stage!==lastStage){
    lastStage=m.stage;const header=document.createElement('h3');
    header.className='adm-trilha-stage';
    header.textContent='ETAPA '+m.stage+' · '+({1:'Fundamentos',2:'Sistemas das máquinas',3:'Aplicação e diagnóstico'}[m.stage]);
    list.append(header);
   }
   const course=registered.get('trilha-formacao-'+m.id.toLowerCase());
   const row=document.createElement('div');row.className='adm-trilha-item';
   const info=document.createElement('div');info.className='adm-trilha-item-info';
   const badge=document.createElement('span');badge.className='adm-trilha-module-code';badge.textContent=m.id;
   const name=document.createElement('strong');name.textContent=course?.name||m.name;
   const meta=document.createElement('small');
   meta.textContent=course?(String(course.lessons)+' aulas · '+Number(course.hours)+'h · '+(course.status==='published'?'Publicado na prévia':'Rascunho')):'Não preparado · '+m.hours+'h previstas';
   info.append(badge,name,meta);
   const action=document.createElement('button');action.type='button';action.className='outline';
   action.textContent=course?'Gerenciar módulo →':'Preparar módulos primeiro';
   action.disabled=!course;
   if(course)action.addEventListener('click',()=>{
    const opened=bridge.edit(course.id);
    if(opened===false)status.textContent='Salve ou descarte as alterações pendentes antes de trocar de módulo.';
   });
   row.append(info,action);list.append(row);
  }
 }
 panel.querySelector('#trilhaPrepare').addEventListener('click',()=>{
  const result=bridge.prepare();
  status.textContent=result.message;
  status.classList.toggle('error',!result.ok);
  render();
 });
 const library=document.getElementById('adminCourses');
 if(library)new MutationObserver(()=>{if(panel.open)render();}).observe(library,{childList:true,subtree:true});
 panel.addEventListener('toggle',()=>{if(panel.open)render();});
 window.addEventListener('focus',()=>{if(panel.open)render();});
 // Deep link from the visual preview opens the existing login; admin enters through
 // the usual sandbox flow. Never bypass or auto-create an authenticated session.
 const params=new URLSearchParams(location.search);
 if(params.get('trilha')==='1'){
  panel.open=true;render();
  const hint=document.createElement('p');hint.className='adm-trilha-external-hint';
  hint.textContent='Após entrar no ADM de teste, abra “Trilhas de formação” para gerenciar os módulos no construtor atual.';
  document.getElementById('login')?.querySelector('.loginbox')?.prepend(hint);
 }
})();
