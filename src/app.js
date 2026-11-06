(function(){
  'use strict';
  const $=id=>document.getElementById(id),profile=JSON.parse($('fixed-profile').textContent),C=window.ECU9;
  const state={editor:null,id:'map_14ad08',anchor:0,end:0,dragging:false,view:'current',changedOnly:false,busy:false,savedRevision:0};
  let toastTimer,loadToken=0,editing=null;
  const groups=['Ignição','Combustível','Pedal','Torque / carga','Não classificadas'];
  const sortedMaps=profile.maps.slice().sort((a,b)=>groups.indexOf(a.group)-groups.indexOf(b.group)||a.name.localeCompare(b.name,'pt-BR'));
  $('map-total').textContent=profile.maps.length;
  function toast(message,error=false){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.toggle('error',error);$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},error?8500:4000);}
  function guard(action){try{return action();}catch(e){toast(e.message||String(e),true);return null;}}
  function normalize(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function format(n,precision=Number($('precision').value)){
    if(typeof n!=='number')return String(n);
    if(Object.is(n,-0))return '−0';
    const a=Math.abs(n);if(a!==0&&(a>=1e7||a<1e-5))return n.toExponential(3).replace('.',',');
    return n.toLocaleString('pt-BR',{useGrouping:false,maximumFractionDigits:precision});
  }
  function raw(n){return String(n).replace('.',',');}
  function selected(){const m=state.editor.map(state.id);return C.rectIndices(m.nx,Math.floor(state.anchor/m.nx),state.anchor%m.nx,Math.floor(state.end/m.nx),state.end%m.nx);}
  function columnName(i){let s='';do{s=String.fromCharCode(65+i%26)+s;i=Math.floor(i/26)-1;}while(i>=0);return s;}
  function cellLabel(i,m){return columnName(i%m.nx)+(Math.floor(i/m.nx)+1);}
  function unsaved(){return state.editor&&state.editor.revision!==state.savedRevision&&state.editor.sourceChanges().length>0;}
  function ensureCurrent(){if(!['current','compare'].includes(state.view))throw new Error('Selecione Atual / Modificada ou Antes/depois para editar.');}
  function download(bytes,name,type='application/octet-stream'){
    const blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'_');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function stem(){return state.editor.filename.replace(/\.[^.]+$/,'')||'9M55AD';}
  function renderList(){
    const query=normalize($('search').value),group=$('group-filter').value,list=$('map-list');list.replaceChildren();let lastGroup=null,totalChanged=0;
    const stats=new Map();if(state.editor)for(const m of profile.maps){const s=state.editor.mapStats(m.id);stats.set(m.id,s);if(s.changed)totalChanged++;}
    $('changed-map-count').textContent=totalChanged;
    for(const m of sortedMaps){
      const s=stats.get(m.id);
      if(group&&m.group!==group||state.changedOnly&&(!s||!s.changed)||query&&!normalize(m.name+' '+m.data.toString(16)+' '+(m.descriptor||0).toString(16)+' '+m.group).includes(query))continue;
      if(lastGroup!==m.group){const label=document.createElement('div');label.className='map-group-label';label.textContent=m.group;list.appendChild(label);lastGroup=m.group;}
      const button=document.createElement('button');button.className='map-item'+(state.id===m.id?' active':'');button.dataset.mapid=m.id;button.setAttribute('aria-current',state.id===m.id?'true':'false');
      const name=document.createElement('span');name.className='map-name';name.textContent=m.name;
      const sub=document.createElement('span');sub.className='map-sub';sub.textContent=m.ny+' × '+m.nx+'  ·  '+C.HEX(m.data).replace('0x00','0x');
      button.append(name,sub);if(s&&s.changed){const badge=document.createElement('span');badge.className='change-badge';badge.textContent=s.changed;button.appendChild(badge);}
      button.addEventListener('click',()=>{if(!state.editor){toast('Abra uma BIN para visualizar os valores deste mapa.');return;}if(state.id!==m.id)$('precision').value=String(m.defaultPrecision||3);state.id=m.id;state.anchor=state.end=0;render();});list.appendChild(button);
    }
    if(!list.children.length){const p=document.createElement('p');p.style.cssText='padding:15px;font-size:11px;color:#91a7c2';p.textContent='Nenhum mapa encontrado.';list.appendChild(p);}
  }
  function mix(a,b,t){return a.map((v,i)=>Math.round(v+(b[i]-v)*t));}
  function heat(v,min,max,delta){
    if(delta){const span=Math.max(Math.abs(min),Math.abs(max),1e-10),t=Math.min(1,Math.abs(v)/span);return 'rgb('+mix([245,247,251],v<0?[147,197,253]:[252,165,165],t).join(',')+')';}
    const stops=[[219,234,254],[167,243,208],[254,215,170],[252,165,165]],t=max===min?.5:Math.max(0,Math.min(1,(v-min)/(max-min)))*3,i=Math.min(2,Math.floor(t));return 'rgb('+mix(stops[i],stops[i+1],t-i).join(',')+')';
  }
  function displayValue(index){const e=state.editor,current=e.value(state.id,index),base=e.value(state.id,index,'base');return state.view==='base'?base:state.view==='delta'?current-base:current;}
  function renderGrid(){
    const e=state.editor,m=e.map(state.id),grid=$('grid');grid.replaceChildren();grid.className='grid'+(state.view==='compare'?' compare-grid':'');grid.style.minWidth=Math.max(420,111+65*m.nx)+'px';
    grid.setAttribute('aria-label',m.name);grid.setAttribute('aria-rowcount',m.ny);grid.setAttribute('aria-colcount',m.nx);
    const vals=m.addresses.map((a,i)=>displayValue(i)),bases=m.addresses.map((a,i)=>e.value(m.id,i,'base'));
    const min=state.view==='delta'?Math.min(0,...vals):Math.min(...vals,...bases),max=state.view==='delta'?Math.max(0,...vals):Math.max(...vals,...bases);
    const head=document.createElement('thead'),hr=document.createElement('tr'),corner=document.createElement('th');corner.textContent=(m.yUnit||'')+(m.yUnit&&m.xUnit?' / ':'')+(m.xUnit||'');hr.appendChild(corner);
    m.x.forEach((x,i)=>{const th=document.createElement('th');th.textContent=format(x,4);th.title=columnName(i)+' · '+m.xUnit;th.scope='col';hr.appendChild(th);});head.appendChild(hr);grid.appendChild(head);
    const body=document.createElement('tbody');
    for(let r=0;r<m.ny;r++){
      const tr=document.createElement('tr'),rh=document.createElement('th');rh.scope='row';rh.textContent=format(m.y[r],4);rh.title=m.yUnit;tr.appendChild(rh);
      for(let c=0;c<m.nx;c++){
        const i=r*m.nx+c,td=document.createElement('td'),changed=e.isChanged(m.id,i);td.dataset.index=i;td.tabIndex=-1;td.setAttribute('role','gridcell');
        if(state.view==='compare'){
          const before=document.createElement('span'),after=document.createElement('span');before.className='cell-original';after.className='cell-modified';
          before.textContent=format(e.value(m.id,i,'base'));after.textContent=format(e.value(m.id,i));
          before.title=e.comparisonMode?'Original':'Base carregada';after.title=e.comparisonMode?'Modificada':'Atual';td.append(before,after);
        }else td.textContent=format(vals[i]);
        td.classList.toggle('changed',changed);td.style.backgroundColor=heat(vals[i],min,max,state.view==='delta');
        td.title=cellLabel(i,m)+' · '+C.HEX(m.addresses[i])+'\n'+(e.comparisonMode?'Modificada':'Atual')+': '+e.value(m.id,i)+'\n'+(e.comparisonMode?'Original':'Base')+': '+e.value(m.id,i,'base')+'\nΔ: '+(e.value(m.id,i)-e.value(m.id,i,'base'));
        tr.appendChild(td);
      }body.appendChild(tr);
    }grid.appendChild(body);$('scale-min').textContent=format(min);$('scale-max').textContent=format(max);$('scale-bar').style.background=state.view==='delta'?'linear-gradient(90deg,#93c5fd,#f5f7fb,#fca5a5)':'';renderSelection();
  }
  function renderSelection(){
    if(!state.editor)return;const m=state.editor.map(state.id),set=new Set(selected());
    for(const td of $('grid').querySelectorAll('td[data-index]')){const i=Number(td.dataset.index);td.classList.toggle('selected',set.has(i));td.classList.toggle('anchor',i===state.anchor);td.setAttribute('aria-selected',String(set.has(i)));}
    const r0=Math.min(Math.floor(state.anchor/m.nx),Math.floor(state.end/m.nx)),r1=Math.max(Math.floor(state.anchor/m.nx),Math.floor(state.end/m.nx)),c0=Math.min(state.anchor%m.nx,state.end%m.nx),c1=Math.max(state.anchor%m.nx,state.end%m.nx);
    $('selection-label').textContent=cellLabel(r0*m.nx+c0,m)+' : '+cellLabel(r1*m.nx+c1,m)+'  ·  '+set.size+' célula'+(set.size===1?'':'s');
  }
  function checksumLabel(id,s,kind){const el=$(id);el.className=s.valid?'good':kind==='principal'?'pending':'bad';el.textContent=s.valid?'✓ Válido':kind==='principal'?'● Recalcular':'✕ Inválido';el.title='Calculado: '+C.HEX(s.actual)+' | Esperado: '+C.HEX(s.target);}
  function render(){
    renderList();const e=state.editor;$('empty').hidden=!!e;$('workspace').hidden=!e;
    for(const id of ['save-project','export-bin','calculate-checksum','download-report'])$(id).disabled=!e||state.busy;
    if(!e)return;
    const m=e.map(state.id),s=e.mapStats(m.id),checks=e.checksums();
    $('filename').textContent=e.filename;$('file-hash').textContent='SHA256 '+e.sourceSHA256.slice(0,16)+'…';$('file-hash').title='SHA256 da BIN carregada para edição: '+e.sourceSHA256;
    $('comparison-strip').hidden=!e.comparisonMode;
    const comparison=e.comparisonSummary();
    $('outside-differences').hidden=!e.comparisonMode||comparison.outsideEditableBytes===0;
    $('outside-differences').textContent=comparison.outsideEditableBytes.toLocaleString('pt-BR')+' bytes diferem fora das áreas de edição. Essas diferenças da modificada serão preservadas na exportação.';
    if(e.comparisonMode){
      $('reference-name').textContent=e.referenceFilename;$('reference-hash').textContent='SHA256 '+e.baseSHA256.slice(0,20)+'…';$('reference-hash').title=e.baseSHA256;
      $('reference-checks').textContent=C.checkImage(e.base).ok?'Checksums da referência válidos':'Referência com checksum pendente ou inválido';
      $('modified-name').textContent=e.filename;$('modified-hash').textContent='BIN carregada: '+e.sourceSHA256.slice(0,20)+'…';$('modified-hash').title=e.sourceSHA256;
    }
    document.querySelector('[data-view="base"]').textContent=e.comparisonMode?'Original':'Base';
    document.querySelector('[data-view="current"]').textContent=e.comparisonMode?'Modificada':'Atual';
    $('reference-legend').textContent=e.comparisonMode?'diferente da ECU original':'alterado em relação à base carregada';
    $('restore').textContent=e.comparisonMode?'Restaurar original':'Restaurar seleção';
    checksumLabel('checksum-principal',checks.principal,'principal');checksumLabel('checksum-boot',checks.boot,'boot');checksumLabel('checksum-vid',checks.vid,'vid');
    $('export-bin').disabled=state.busy||!checks.boot.valid||!checks.vid.valid;$('calculate-checksum').disabled=$('export-bin').disabled;
    $('map-group').textContent=m.group;$('map-title').textContent=m.name;$('map-address').textContent=C.HEX(m.data).replace('0x00','0x');$('map-size').textContent=m.ny+' linhas × '+m.nx+' colunas';$('map-unit').textContent=m.unit;
    $('identified').textContent=m.confidence==='confirmed'?'Função confirmada':m.confidence==='partial'?'Identificação parcial':m.identified?'Função documentada':'Função não confirmada';$('identified').className='tag '+(m.identified&&m.confidence!=='partial'?'valid':'unconfirmed');
    $('evidence-panel').hidden=!m.evidence;
    if(m.evidence){
      $('unit-status').textContent=m.unitConfidence==='confirmed'?'Unidades confirmadas':'Unidades parcialmente confirmadas';
      $('unit-status').className='tag '+(m.unitConfidence==='confirmed'?'valid':'unconfirmed');
      for(const key of ['facts','inferences','unknown']){
        const list=$('evidence-'+key);list.replaceChildren();
        for(const item of m.evidence[key].length?m.evidence[key]:['Nenhum item adicional documentado.']){const li=document.createElement('li');li.textContent=item;list.appendChild(li);}
      }
    }
    $('map-note').textContent=m.note;$('map-stats').textContent=s.changed+' / '+s.cells+' células alteradas';
    $('technical-info').textContent='Dados: '+C.HEX(m.data)+'\nDescritor: '+(m.descriptor?C.HEX(m.descriptor):'endereços fixos / parâmetros')+'\nFormato: IEEE 754 float32, big-endian\nReferências no código: '+(m.readers.length?m.readers.join(', '):'ver relatório de análise da estratégia')+(m.inputSignals?'\nEntradas: '+m.inputSignals.join(' / '):'')+(m.outputSignals?'\nSaídas / consumidores: '+m.outputSignals.join(', '):'');
    $('undo').disabled=!e.canUndo;$('redo').disabled=!e.canRedo;
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
    const count=comparison.totalBytes;
    $('global-status').textContent=e.comparisonMode?count.toLocaleString('pt-BR')+' bytes diferentes da original · '+e.sourceChanges().length.toLocaleString('pt-BR')+' bytes editados nesta sessão':count?count.toLocaleString('pt-BR')+' bytes diferentes da base · '+e.history.length+' operações no histórico':'Arquivo sem alterações em relação à base carregada.';
    renderGrid();
  }
  function acceptModel(model){
    state.editor=model;state.id='map_14ad08';state.anchor=state.end=0;state.view=model.comparisonMode?'compare':'current';state.changedOnly=false;state.savedRevision=model.revision;
    $('filter-all').classList.add('active');$('filter-changed').classList.remove('active');$('search').value='';$('group-filter').value='';
  }
  async function openFile(file,project){
    if(!file)return;
    if(unsaved()&&!confirm('Há alterações ainda não salvas. Abrir outro arquivo e descartá-las?'))return;
    const token=++loadToken;state.busy=true;toast('Lendo e conferindo o arquivo…');
    try{
      if(file.size>(project?12000000:0x200000))throw new Error('Arquivo maior que o permitido. BIN: 2 MiB; projeto: 12 MB.');
      const content=project?await file.text():new Uint8Array(await file.arrayBuffer());
      const model=project?C.Editor.fromProject(profile,content):new C.Editor(profile,content,file.name);
      if(token!==loadToken)return;
      acceptModel(model);
      toast(project?'Projeto aberto. Base e alterações recuperadas.':'BIN reconhecida. Selecione uma área da tabela para começar.');
    }catch(error){toast(error.message,true);}finally{if(token===loadToken){state.busy=false;render();}}
  }
  function openComparison(){
    $('original-file').value='';$('modified-file').value='';$('original-picked').textContent=$('modified-picked').textContent='Nenhum arquivo selecionado';$('comparison-load').disabled=true;$('comparison-dialog').showModal();
  }
  function comparisonSelection(){
    const original=$('original-file').files[0],modified=$('modified-file').files[0];
    $('original-picked').textContent=original?original.name:'Nenhum arquivo selecionado';$('modified-picked').textContent=modified?modified.name:'Nenhum arquivo selecionado';
    $('comparison-load').disabled=state.busy||!original||!modified||original.size!==profile.bytes||modified.size!==profile.bytes;
    if(original&&original.size!==profile.bytes||modified&&modified.size!==profile.bytes)toast('Cada BIN da comparação deve ter exatamente 2 MiB.',true);
  }
  async function loadComparison(){
    const original=$('original-file').files[0],modified=$('modified-file').files[0];if(!original||!modified)return;
    if(unsaved()&&!confirm('Há edições ainda não salvas. Abrir a comparação e descartá-las?'))return;
    const token=++loadToken;state.busy=true;$('comparison-load').disabled=true;
    try{
      if(original.size!==profile.bytes||modified.size!==profile.bytes)throw new Error('As duas BINs devem ter exatamente 2 MiB.');
      const [a,b]=await Promise.all([original.arrayBuffer(),modified.arrayBuffer()]);
      const model=C.Editor.compare(profile,new Uint8Array(a),new Uint8Array(b),original.name,modified.name);
      if(token!==loadToken)return;acceptModel(model);$('comparison-dialog').close();toast('Comparação carregada. Original acima, modificada abaixo; diferenças em negrito.');
    }catch(error){toast(error.message,true);}finally{if(token===loadToken){state.busy=false;comparisonSelection();render();}}
  }
  function applyCorrection(){if(!state.editor)return;guard(()=>{ensureCurrent();const count=selected().length;state.editor.apply(state.id,selected(),$('operation').value,$('operand').value);render();toast('Correção aplicada à seleção de '+count+' célula'+(count===1?'':'s')+'.');});}
  function editCell(index){
    if(editing||!state.editor)return;guard(()=>{
      ensureCurrent();const e=state.editor,mapId=state.id,td=$('grid').querySelector('[data-index="'+index+'"]'),input=document.createElement('input');
      input.className='cell-input';input.type='text';input.inputMode='decimal';input.setAttribute('aria-label','Editar valor '+cellLabel(index,e.map(mapId)));input.value=raw(e.value(mapId,index));td.replaceChildren(input);td.classList.add('editing');
      const local={done:false};editing=local;
      function finish(commit){if(local.done)return;local.done=true;editing=null;if(commit)guard(()=>e.setCells(mapId,[{index,value:input.value}],'Editar célula'));render();$('grid-wrap').focus({preventScroll:true});}
      input.addEventListener('blur',()=>finish(true));input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();finish(true);}else if(event.key==='Escape'){event.preventDefault();finish(false);}event.stopPropagation();});
      input.focus();input.select();
    });
  }
  function selectionText(){const e=state.editor,m=e.map(state.id),r0=Math.min(Math.floor(state.anchor/m.nx),Math.floor(state.end/m.nx)),r1=Math.max(Math.floor(state.anchor/m.nx),Math.floor(state.end/m.nx)),c0=Math.min(state.anchor%m.nx,state.end%m.nx),c1=Math.max(state.anchor%m.nx,state.end%m.nx),lines=[];
    for(let r=r0;r<=r1;r++){const row=[];for(let c=c0;c<=c1;c++)row.push(raw(displayValue(r*m.nx+c)));lines.push(row.join('\t'));}return lines.join('\n');}
  function clipboardDialog(copy=false,text=''){
    if(!state.editor)return;$('clipboard-title').textContent=copy?'Copiar seleção':'Colar bloco';$('clipboard-note').textContent=copy?'Copie os valores abaixo com Ctrl+C. A precisão armazenada foi preservada.':'Cole somente os valores, separados por tabulação ou ponto e vírgula. O bloco começa na célula de origem da seleção; uma entrada inválida cancela toda a operação.';
    $('clipboard-text').value=text;$('clipboard-text').readOnly=copy;$('clipboard-apply').hidden=copy;$('clipboard-dialog').showModal();$('clipboard-text').focus();if(copy)$('clipboard-text').select();
  }
  $('open-bin').onclick=$('empty-open').onclick=()=>{$('bin-file').value='';$('bin-file').click();};
  $('open-project').onclick=()=>{$('project-file').value='';$('project-file').click();};
  $('open-comparison').onclick=$('empty-compare').onclick=openComparison;
  $('original-file').onchange=$('modified-file').onchange=comparisonSelection;
  $('comparison-close').onclick=$('comparison-cancel').onclick=()=>$('comparison-dialog').close();
  $('comparison-load').onclick=loadComparison;
  $('bin-file').onchange=event=>openFile(event.target.files[0],false);$('project-file').onchange=event=>openFile(event.target.files[0],true);
  $('save-project').onclick=()=>guard(()=>{download(state.editor.project(),stem()+'.ecu9.json','application/json');state.savedRevision=state.editor.revision;toast('Projeto salvo com a base e todas as alterações.');});
  $('export-bin').onclick=()=>guard(()=>{const output=state.editor.exportBIN();download(output.bytes,stem()+'_mod.bin');state.savedRevision=state.editor.revision;render();toast('BIN exportada. Principal, boot e VID conferidos.');});
  $('calculate-checksum').onclick=()=>guard(()=>{state.editor.calculateChecksum();render();toast('Principal corrigido; principal, boot e VID válidos.');});
  $('download-report').onclick=()=>guard(()=>{download(JSON.stringify(state.editor.report(),null,2),stem()+'_alteracoes.json','application/json');toast('Relatório de alterações salvo.');});
  $('search').oninput=$('group-filter').onchange=renderList;
  $('filter-all').onclick=()=>{state.changedOnly=false;$('filter-all').classList.add('active');$('filter-changed').classList.remove('active');renderList();};
  $('filter-changed').onclick=()=>{state.changedOnly=true;$('filter-changed').classList.add('active');$('filter-all').classList.remove('active');renderList();};
  $('apply').onclick=applyCorrection;$('operand').onkeydown=e=>{if(e.key==='Enter')applyCorrection();};
  $('restore').onclick=()=>guard(()=>{ensureCurrent();state.editor.restore(state.id,selected());render();});
  $('select-all').onclick=()=>{state.anchor=0;state.end=state.editor.map(state.id).addresses.length-1;renderSelection();$('grid-wrap').focus();};
  $('undo').onclick=()=>{if(state.editor.undo())render();};$('redo').onclick=()=>{if(state.editor.redo())render();};
  $('precision').onchange=renderGrid;document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{state.view=button.dataset.view;render();});
  $('copy').onclick=async()=>{if(!state.editor)return;const text=selectionText();try{await navigator.clipboard.writeText(text);toast('Seleção copiada com a precisão armazenada.');}catch{clipboardDialog(true,text);}};
  $('paste').onclick=()=>guard(()=>{ensureCurrent();clipboardDialog(false);});
  $('clipboard-close').onclick=$('clipboard-cancel').onclick=()=>$('clipboard-dialog').close();
  $('clipboard-apply').onclick=()=>guard(()=>{ensureCurrent();state.editor.paste(state.id,state.anchor,$('clipboard-text').value);$('clipboard-dialog').close();render();toast('Bloco colado.');});
  $('grid').addEventListener('pointerdown',event=>{const cell=event.target.closest('td[data-index]');if(!cell||event.button!==0||editing)return;event.preventDefault();const index=Number(cell.dataset.index);if(!event.shiftKey)state.anchor=index;state.end=index;state.dragging=true;$('grid-wrap').focus({preventScroll:true});renderSelection();});
  $('grid').addEventListener('pointerover',event=>{if(!state.dragging)return;const cell=event.target.closest('td[data-index]');if(cell){state.end=Number(cell.dataset.index);renderSelection();}});
  document.addEventListener('pointerup',()=>{state.dragging=false;});
  $('grid').addEventListener('dblclick',event=>{const cell=event.target.closest('td[data-index]');if(cell)editCell(Number(cell.dataset.index));});
  $('grid-wrap').addEventListener('keydown',event=>{
    if(!state.editor||editing)return;const m=state.editor.map(state.id),key=event.key.toLowerCase(),mod=event.ctrlKey||event.metaKey;
    if(mod&&key==='a'){event.preventDefault();$('select-all').click();return;}
    if(mod&&key==='c'){event.preventDefault();$('copy').click();return;}
    if(key==='enter'||key==='f2'){event.preventDefault();editCell(state.end);return;}
    let index=state.end;
    if(key==='arrowleft')index=Math.max(0,index-1);else if(key==='arrowright')index=Math.min(m.addresses.length-1,index+1);else if(key==='arrowup')index=Math.max(0,index-m.nx);else if(key==='arrowdown')index=Math.min(m.addresses.length-1,index+m.nx);else if(key==='home')index=Math.floor(index/m.nx)*m.nx;else if(key==='end')index=Math.floor(index/m.nx)*m.nx+m.nx-1;else return;
    event.preventDefault();state.end=index;if(!event.shiftKey)state.anchor=index;renderSelection();const td=$('grid').querySelector('[data-index="'+index+'"]');if(td)td.scrollIntoView({block:'nearest',inline:'nearest'});
  });
  $('grid-wrap').addEventListener('paste',event=>{if(!state.editor||editing)return;event.preventDefault();guard(()=>{ensureCurrent();state.editor.paste(state.id,state.anchor,event.clipboardData.getData('text/plain'));render();toast('Bloco colado.');});});
  document.addEventListener('keydown',event=>{if(!state.editor||editing||event.target.matches('input,textarea,select')||$('clipboard-dialog').open)return;if(event.ctrlKey||event.metaKey){const k=event.key.toLowerCase();if(k==='z'){event.preventDefault();(event.shiftKey?$('redo'):$('undo')).click();}else if(k==='y'){event.preventDefault();$('redo').click();}else if(k==='s'){event.preventDefault();$('save-project').click();}}});
  document.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('Files'))event.preventDefault();});
  document.addEventListener('drop',event=>{if(event.dataTransfer.files.length){event.preventDefault();const file=event.dataTransfer.files[0];openFile(file,/\.json$/i.test(file.name));}});
  window.addEventListener('beforeunload',event=>{if(unsaved()){event.preventDefault();event.returnValue='';}});
  // Read-only diagnostic surface for reproducible UI verification.
  window.editorDiagnostics=()=>state.editor?{mapId:state.id,selection:selected(),revision:state.editor.revision,baseSHA256:state.editor.baseSHA256,sourceSHA256:state.editor.sourceSHA256,comparisonMode:state.editor.comparisonMode,referenceFilename:state.editor.referenceFilename,filename:state.editor.filename,sourceChanges:state.editor.sourceChanges().length,currentSHA256:C.sha256(state.editor.bytes()),checksums:state.editor.checksums(),mapStats:state.editor.mapStats(state.id),view:state.view}:null;
  render();
})();
