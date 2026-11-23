/* CONTREM Academia: protótipo isolado, sem autenticação ou backend. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('integrated')==='1')return; // Parent session owns the live portal; this script stays as standalone visual demo.
  const modules = [
    {id:'M01',stage:1,name:'Segurança e rotina de oficina',hours:6,desc:'Riscos, EPIs, energia armazenada e boas práticas.',goal:'Reconhecer riscos e identificar decisões seguras antes de qualquer intervenção.',lessons:['O papel do mecânico de máquinas pesadas','Riscos mecânicos, térmicos e elétricos','EPIs, EPCs, isolamento e energia armazenada','Inspeção visual e comunicação de riscos','Organização e boas práticas da oficina'],quiz:{q:'Ao encontrar um equipamento com possível energia hidráulica acumulada, qual a decisão mais segura?',choices:['Abrir uma conexão para aliviar rapidamente a pressão','Impedir a intervenção e encaminhar para procedimento específico de bloqueio e despressurização, executado por pessoal autorizado','Acionar todos os comandos até os ruídos cessarem'],answer:1,why:'Pressão armazenada pode provocar ferimentos graves. A intervenção real requer procedimento aprovado e equipe autorizada.'}},
    {id:'M02',stage:1,name:'Mecânica básica e metrologia',hours:10,desc:'Torque, força, unidades, ferramentas e medições.',goal:'Interpretar cálculos e instrumentos de medição a partir de dados ilustrativos.',lessons:['Grandezas, unidades e conversões','Força, torque, potência e rendimento','Engrenagens, rolamentos e elementos de máquinas','Tolerâncias e ajustes','Leitura de paquímetro e micrômetro','Torque de aperto: conceito e documentação'],quiz:{q:'Qual grandeza representa o efeito de uma força aplicada a determinada distância de um eixo?',choices:['Torque','Temperatura','Tensão elétrica'],answer:0,why:'Torque relaciona força e braço de alavanca. Os valores reais de aperto vêm do manual do fabricante.'}},
    {id:'M03',stage:1,name:'Leitura e documentação técnica',hours:8,desc:'Manuais, símbolos e interpretação de diagramas.',goal:'Localizar parâmetros e interpretar desenhos com referência rastreável.',lessons:['Manuais de operação, serviço e peças','Desenhos e vistas explodidas','Símbolos mecânicos, elétricos e hidráulicos','Tabelas e limites de especificação','Fluxograma de diagnóstico e versões de manual'],quiz:{q:'Ao procurar o torque correto de um componente, qual fonte deve ser priorizada?',choices:['Qualquer valor encontrado em uma conversa online','O procedimento e a tabela do manual correspondente ao modelo e revisão','A memória de um valor usado em outra máquina'],answer:1,why:'Parâmetros mudam conforme fabricante, modelo e revisão; verifique a fonte técnica adequada.'}},
    {id:'M04',stage:2,name:'Motores diesel',hours:16,desc:'Princípios, injeção, turbo, arrefecimento e falhas.',goal:'Explicar o ciclo diesel e reconhecer o papel dos principais sistemas do motor.',lessons:['Aplicações do motor diesel','Ciclo de quatro tempos','Componentes internos','Admissão e turbocompressor','Combustão e injeção','Lubrificação e arrefecimento','Escape e emissões','Partida, sintomas e diagnóstico introdutório'],quiz:{q:'No motor diesel de quatro tempos, em qual tempo ocorre a compressão do ar antes da combustão?',choices:['Admissão','Compressão','Escape'],answer:1,why:'Após a admissão, o pistão comprime o ar, elevando sua temperatura antes da injeção do combustível.'}},
    {id:'M05',stage:2,name:'Fluidos, lubrificação e filtração',hours:8,desc:'Óleos, filtros, contaminantes e conservação.',goal:'Reconhecer os efeitos da contaminação e a importância de requisitos de fluidos.',lessons:['Funções dos lubrificantes e graxas','Viscosidade e especificações OEM','Tipos de filtros','Água e partículas contaminantes','Leitura de laudo fictício de óleo','Armazenagem e descarte'],quiz:{q:'O fluido adequado para um sistema de máquina pesada deve ser definido principalmente por:',choices:['Cor do produto','Especificação do fabricante e condições de aplicação','Preferência de outra oficina'],answer:1,why:'O fluido deve atender à especificação do fabricante para aquele sistema e condição operacional.'}},
    {id:'M06',stage:2,name:'Eletricidade básica aplicada',hours:12,desc:'Grandezas, circuitos, baterias e leitura simulada.',goal:'Ler circuitos e interpretar dados de medições elétricas simuladas.',lessons:['Tensão, corrente e resistência','Lei de Ohm','Série e paralelo','Baterias 12 V e 24 V','Fusíveis, relés e aterramento','Alternador e motor de partida','Multímetro em simulação','Riscos e limites de atuação'],quiz:{q:'Em um circuito resistivo ideal, ao dobrar a resistência com tensão constante, a corrente:',choices:['Dobra','Cai pela metade','Não se altera'],answer:1,why:'Pela Lei de Ohm, I = V/R; se a resistência dobra e a tensão permanece constante, a corrente cai pela metade.'}},
    {id:'M07',stage:2,name:'Eletroeletrônica das máquinas',hours:12,desc:'Sensores, atuadores, ECU e redes de comunicação.',goal:'Interpretar funções de sensores e sinais com dados simulados.',lessons:['Módulos de controle eletrônico','Sensores e transdutores','Atuadores e solenóides','Sinais PWM e digitais','Comunicação CAN introdutória','Códigos de falha e diagnóstico teórico','Árvore de causas de falhas'],quiz:{q:'O papel principal de um sensor em um sistema de controle é:',choices:['Fornecer informação sobre uma grandeza ao controlador','Executar toda a potência hidráulica','Armazenar energia mecânica'],answer:0,why:'Sensores convertem grandezas físicas em sinais utilizados pelo sistema de controle.'}},
    {id:'M08',stage:2,name:'Hidráulica de máquinas pesadas',hours:16,desc:'Pressão, vazão, bombas, válvulas e diagramas.',goal:'Interpretar circuitos hidráulicos e hipóteses de falhas em ambiente simulado.',lessons:['Princípio de Pascal e unidades','Pressão, vazão e força','Fluidos, reservatório e filtros','Bombas hidráulicas','Válvulas de controle','Cilindros e motores hidráulicos','Acumuladores e pressão residual','Circuitos em máquinas pesadas','Análise de sintomas simulados'],quiz:{q:'Em um cilindro hidráulico ideal, com área do pistão constante, aumentar a pressão tende a:',choices:['Aumentar a força disponível','Zerar a força','Reduzir a área do pistão'],answer:0,why:'A força teórica é o produto da pressão pela área do pistão (F = P × A).'}},
    {id:'M09',stage:2,name:'Transmissão e trem de força',hours:10,desc:'Conversor, transmissão, eixos e redutores finais.',goal:'Identificar a sequência de transmissão de potência entre os conjuntos.',lessons:['Fluxo de potência da máquina','Acoplamentos e conversor de torque','Transmissões powershift','Diferencial e eixos','Redutores finais','Rodas e esteiras','Sintomas fictícios de perda de tração'],quiz:{q:'Qual componente tem como função básica adaptar a rotação e transmitir torque às rodas em muitas máquinas?',choices:['Radiador','Transmissão','Filtro de cabine'],answer:1,why:'A transmissão adequa velocidade e torque conforme o projeto do trem de força.'}},
    {id:'M10',stage:2,name:'Freios, direção e material rodante',hours:8,desc:'Sistemas de segurança, direção e estruturas.',goal:'Reconhecer os principais conjuntos e riscos envolvidos em inspeções.',lessons:['Freios de serviço e estacionamento','Noções de pneumática','Direção e articulação','Pneus e rodas','Material rodante de esteiras','Estruturas, pinos e buchas'],quiz:{q:'Qual atitude é mais adequada diante de uma falha suspeita em um freio de estacionamento?',choices:['Continuar operando até a próxima preventiva','Comunicar e impedir a operação até avaliação por pessoal autorizado','Desativar o aviso sem verificar a causa'],answer:1,why:'Falhas de freio podem comprometer a segurança; a operação deve seguir critérios e procedimentos autorizados.'}},
    {id:'M11',stage:3,name:'Gestão da manutenção e diagnóstico',hours:8,desc:'Ordens de serviço, inspeções e análise de causas.',goal:'Registrar sintomas, hipóteses e evidências em uma ordem de serviço fictícia.',lessons:['Manutenção preventiva, corretiva e preditiva','Planos por horímetro específicos do OEM','Ordens de serviço e rastreabilidade','Sintomas, hipóteses e evidências','Segurança, criticidade e priorização','Comunicação e indicadores'],quiz:{q:'No diagnóstico técnico, o que diferencia um sintoma de uma causa comprovada?',choices:['Um sintoma é observado; a causa depende de evidências e validação','Sintoma e causa são exatamente iguais','A causa pode ser escolhida sem dados'],answer:0,why:'O registro deve separar observações de hipóteses e conclusões fundamentadas.'}},
    {id:'M12',stage:3,name:'Laboratório virtual e caso final',hours:6,desc:'Estudos integrados e relatório técnico simulado.',goal:'Construir um relatório de caso virtual com riscos, evidências, hipóteses e encaminhamento.',lessons:['Revisão integrada de sistemas','Caso virtual: escavadeira hidráulica','Caso virtual: caminhão fora de estrada','Escolhas de segurança e análise de evidências','Relatório técnico e avaliação integradora'],quiz:{q:'Qual relatório tem maior valor técnico em um caso de falha simulada?',choices:['Uma lista de peças substituídas sem justificativa','Sintomas observados, dados, hipóteses e encaminhamento justificado','Uma conclusão definitiva sem verificação'],answer:1,why:'Um relatório rastreável distingue dados reais de hipóteses e recomenda uma sequência segura de investigação.'}}
  ];
  // A prévia visual usa o catálogo fictício do MESMO ADM e da MESMA origem.
  // Não altera aulas nem substitui o player Mux real da Academia.
  function syncConfiguredCourses(){
    const definitions=window.CONTREM_TRILHA_CATALOG?.modules;
    if(!Array.isArray(definitions))return;
    let catalog=[];
    try{
      const db=JSON.parse(localStorage.getItem('contrem-adm-preview-db-v1')||'null');
      if(Array.isArray(db?.catalog?.courses))catalog=db.catalog.courses;
    }catch{}
    for(const module of modules){
      const base=definitions.find(item=>item.id===module.id);
      if(!base)continue;
      const configured=catalog.find(c=>c.id==='trilha-formacao-'+module.id.toLowerCase());
      module.name=typeof configured?.name==='string'&&configured.name.trim()?configured.name:base.name;
      module.hours=Number.isFinite(Number(configured?.hours))&&Number(configured.hours)>0?Number(configured.hours):base.hours;
      module.desc=typeof configured?.description==='string'&&configured.description.trim()?configured.description:base.description;
      module.lessons=Array.isArray(configured?.lessons)&&configured.lessons.length
        ?configured.lessons.filter(l=>typeof l?.name==='string'&&l.name.trim()).map(l=>l.name)
        :[...base.lessons];
      module.catalogStatus=configured?.status==='published'?'published':configured?'draft':'unprepared';
      module.materialCount=Array.isArray(configured?.previewMaterials)?configured.previewMaterials.length:0;
      module.linkCount=Array.isArray(configured?.supportLinks)?configured.supportLinks.length:0;
      if(Array.isArray(configured?.lessons))for(const lesson of configured.lessons){
        module.materialCount+=Array.isArray(lesson.previewMaterials)?lesson.previewMaterials.length:0;
        module.linkCount+=Array.isArray(lesson.supportLinks)?lesson.supportLinks.length:0;
      }
    }
  }
  const stageNames={1:'Fundamentos',2:'Sistemas das máquinas',3:'Aplicação e diagnóstico'};
  const stageDescs={1:'Construa a base técnica',2:'Conheça os principais sistemas',3:'Aplique o raciocínio técnico'};
  const KEY='contrem-trilha-preview-explorados-v1';
  let explored=new Set();
  let currentModule=modules[0],quizAnswered=false,labDone=false;
  try {const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved)) explored=new Set(saved.filter(v=>modules.some(m=>m.id===v)));}catch{}
  const $=id=>document.getElementById(id);
  function updateProgress(){
    const val=Math.round(explored.size/modules.length*100);
    $('overviewProgress').textContent=String(val);
    $('overviewBar').style.width=val+'%';
    $('trackProgressLabel').textContent=val+'% demonstrativo · '+explored.size+' módulos explorados';
    $('trackProgressBar').style.width=val+'%';
  }
  function saveExplored(id) {
    explored.add(id);
    try{localStorage.setItem(KEY,JSON.stringify([...explored]));}catch{}
    updateProgress();
  }
  function showView(name){
    ['overview','modules','detail','lab','about'].forEach(id=>{$('view-'+id).hidden=id!==name;});
    const active=name==='detail'?'modules':name;
    document.querySelectorAll('.side-nav-item').forEach(el=>el.classList.toggle('current',el.dataset.tab===active));
    document.querySelector('.sidebar').classList.remove('open');
    $('menuToggle').setAttribute('aria-expanded','false');
    window.scrollTo({top:0,behavior:'auto'});
    $('main').focus({preventScroll:true});
  }
  function renderModules(){
    const root=$('moduleList');root.replaceChildren();
    for(const stage of [1,2,3]){
      const section=document.createElement('section');section.className='module-group';
      const heading=document.createElement('div');heading.className='module-stage-head';
      const code=document.createElement('span');code.className='stage-number';code.textContent='ETAPA 0'+stage;
      const title=document.createElement('h2');title.textContent=stageNames[stage];
      const note=document.createElement('p');note.textContent=stageDescs[stage];
      heading.append(code,title,note);section.append(heading);
      const grid=document.createElement('div');grid.className='module-items';
      for(const module of modules.filter(m=>m.stage===stage)){
        const btn=document.createElement('button');btn.type='button';btn.className='module-card'+(module.id==='M01'?' first':'');btn.dataset.module=module.id;
        btn.innerHTML='<div class="module-card-top"><span class="module-card-id"></span><span class="module-chip"></span></div><h3></h3><p></p><div class="module-card-footer"><span></span><span aria-hidden="true">→</span></div>';
        btn.querySelector('.module-card-id').textContent=module.id;
        const chip=btn.querySelector('.module-chip');chip.textContent=module.catalogStatus==='published'?'PUBLICADO · TESTE':module.catalogStatus==='draft'?'RASCUNHO · ADM':explored.has(module.id)?'EXPLORADO':module.id==='M01'?'AULA DE EXEMPLO':'VISUALIZAR';
        if(module.id==='M01'||explored.has(module.id))chip.classList.add('sample');
        btn.querySelector('h3').textContent=module.name;
        btn.querySelector('p').textContent=module.desc;
        btn.querySelector('.module-card-footer span').textContent=module.hours+'h estimadas · '+module.lessons.length+' aulas';
        grid.append(btn);
      }
      section.append(grid);root.append(section);
    }
  }
  function openModule(id) {
    const module=modules.find(m=>m.id===id);if(!module)return;
    currentModule=module;quizAnswered=false;
    $('detail-stage').textContent='ETAPA 0'+module.stage+' / '+stageNames[module.stage].toUpperCase();
    $('detail-title').textContent=module.name;
    $('detail-summary').textContent=module.desc;
    $('detail-count').textContent=module.id.slice(1);
    $('lesson-title').textContent=module.lessons[0];
    $('lesson-goal').textContent=module.goal;
    $('detail-goal').textContent=module.goal;
    $('detail-tags').replaceChildren();
    for(const entry of ['MÓDULO '+module.id, module.hours+' HORAS ESTIMADAS',module.lessons.length+' AULAS PREVISTAS']){const span=document.createElement('span');span.textContent=entry;$('detail-tags').append(span);}
    const list=$('detail-lessons');list.replaceChildren();
    for(const lesson of module.lessons){const item=document.createElement('li');item.textContent=lesson;list.append(item);}
    if(module.catalogStatus!=='unprepared'&&(module.materialCount||module.linkCount)){$('detail-tags').append(Object.assign(document.createElement('span'),{textContent:module.materialCount+' arquivo(s) · '+module.linkCount+' link(s) no ADM'}));}
    renderQuiz();showView('detail');
  }
  function renderQuiz() {
    const root=$('sampleQuiz');root.replaceChildren();
    const q=currentModule.quiz;
    const wrap=document.createElement('div');wrap.className='question';
    const index=document.createElement('span');index.className='question-num';index.textContent='QUESTÃO DEMONSTRATIVA · 01 / 01';
    const title=document.createElement('h3');title.textContent=q.q;
    const answers=document.createElement('div');answers.className='answers';
    const feedback=document.createElement('div');feedback.className='feedback';feedback.hidden=true;feedback.setAttribute('aria-live','polite');
    const next=document.createElement('button');next.className='btn btn-navy quiz-next';next.type='button';next.textContent='Voltar ao mapa →';next.hidden=true;next.addEventListener('click',()=>{renderModules();showView('modules');});
    q.choices.forEach((choice,i)=>{
      const b=document.createElement('button');b.type='button';b.className='answer-option';
      const l=document.createElement('span');l.className='answer-letter';l.textContent=String.fromCharCode(65+i);
      const text=document.createElement('span');text.textContent=choice;b.append(l,text);
      b.addEventListener('click',()=>{
        if(quizAnswered)return;quizAnswered=true;
        const correct=i===q.answer;
        answers.querySelectorAll('button').forEach((el,j)=>{el.disabled=true;if(j===q.answer)el.classList.add('correct');else if(j===i)el.classList.add('wrong');});
        feedback.hidden=false;feedback.classList.toggle('warning',!correct);
        feedback.textContent=(correct?'✓ Boa análise! ':'↻ Vale revisar. ')+q.why;
        next.hidden=false;saveExplored(currentModule.id);
      });answers.append(b);
    });
    wrap.append(index,title,answers,feedback,next);root.append(wrap);
  }
  function renderLab(){
    const choices=[
      {title:'Abrir uma linha hidráulica para observar a pressão',correct:false,why:'Isso expõe a equipe a fluido sob pressão e não é uma primeira ação segura.'},
      {title:'Registrar a ocorrência, verificar informações disponíveis e encaminhar para avaliação segura',correct:true,why:'Correto: primeiro documente as condições, preserve a segurança e consulte os procedimentos do modelo e profissionais autorizados.'},
      {title:'Aumentar a rotação e insistir nos movimentos até a máquina responder',correct:false,why:'Pode aumentar o risco e piorar uma possível falha sem informação suficiente.'}
    ];
    $('labAnswers').replaceChildren();$('labFeedback').hidden=true;labDone=false;
    choices.forEach((choice,i)=>{
      const button=document.createElement('button');button.type='button';button.className='answer-option';
      const letter=document.createElement('span');letter.className='answer-letter';letter.textContent=String.fromCharCode(65+i);
      const text=document.createElement('span');text.textContent=choice.title;button.append(letter,text);
      button.addEventListener('click',()=>{
        if(labDone)return;labDone=true;
        $('labAnswers').querySelectorAll('button').forEach((el,j)=>{el.disabled=true;if(choices[j].correct)el.classList.add('correct');else if(j===i)el.classList.add('wrong');});
        const feedback=$('labFeedback');feedback.hidden=false;feedback.classList.toggle('warning',!choice.correct);feedback.textContent=(choice.correct?'✓ Decisão adequada. ':'⚠ Caminho inseguro. ')+choice.why;
      });
      $('labAnswers').append(button);
    });
  }
  document.addEventListener('click',event=>{
    const tab=event.target.closest('[data-tab]');if(tab){const target=tab.dataset.tab;if(['overview','modules','lab','about'].includes(target)){if(target==='modules')renderModules();showView(target);}return;}
    const stage=event.target.closest('[data-stage]');if(stage){renderModules();showView('modules');const group=$('moduleList').children[Number(stage.dataset.stage)-1];if(group)group.scrollIntoView({behavior:'smooth',block:'start'});return;}
    const mod=event.target.closest('[data-module]');if(mod){openModule(mod.dataset.module);}
  });
  $('menuToggle').addEventListener('click',()=>{const sidebar=$('sidebar');const open=!sidebar.classList.contains('open');sidebar.classList.toggle('open',open);$('menuToggle').setAttribute('aria-expanded',String(open));});
  $('startSample').addEventListener('click',()=>openModule('M01'));
  $('resetLab').addEventListener('click',renderLab);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('sidebar').classList.contains('open')){$('sidebar').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}});
  syncConfiguredCourses();updateProgress();renderModules();renderLab();showView('overview');
  window.addEventListener('focus',()=>{syncConfiguredCourses();if(!$('view-modules').hidden)renderModules();});
  window.addEventListener('storage',event=>{if(event.key==='contrem-adm-preview-db-v1'){syncConfiguredCourses();if(!$('view-modules').hidden)renderModules();}});
})();
