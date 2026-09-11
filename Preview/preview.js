'use strict';
const $=id=>document.getElementById(id);
let saved={};try{saved=JSON.parse(localStorage.getItem('cal-preview-v1')||'{}')||{};}catch{}
const state=new CalLCD.Machine(CalEngine,CalNatural,saved);

const save=()=>{try{localStorage.setItem('cal-preview-v1',JSON.stringify(state.snapshot()));}catch{}};
const dispatch=r=>state.dispatch(r);
function render(){
  const lcd=document.querySelector('.lcd');lcd.classList.toggle('off',!state.on);lcd.classList.toggle('error',!!state.error);lcd.classList.toggle('assigning',!!state.assignment);lcd.classList.toggle('calculated',state.done);lcd.classList.toggle('cursor-shift',!state.done&&!!state.shift);lcd.classList.toggle('cursor-alpha',!state.done&&!!state.alpha);
  const left=[state.shift?'S':'',state.alpha?(state.lock?'A-LOCK':'A'):'',state.memory==='STO'?'STO':(state.memory==='RCL'?'RCL':''),(state.variables.M&&(state.variables.M.re||state.variables.M.im))?'M':'',(state.mode&&state.mode!=='COMP')?state.mode:''].filter(Boolean).join(' ');
  let replay='';if(!state.menu&&!state.screen&&!state.assignment&&!state.inputPrompt&&state.history&&state.history.length>0&&(state.done||!state.expression)){const canUp=state.historyIndex>0,maxReplay=state.historyFromClear?state.history.length:state.history.length-1,canDown=state.historyIndex<maxReplay;if(canUp&&canDown)replay='▲▼';else if(canUp)replay='▲';else if(canDown)replay='▼';}
  const isBase=state.mode==='BASE-N';
  const baseTag=isBase?(state.base==='HEX'?'Hex':state.base==='BIN'?'Bin':state.base==='OCT'?'Oct':'Dec'):'';
  const angleTag=isBase?'':(state.angle==='RAD'?'R':(state.angle==='GRA'?'G':'D'));
  const right=[baseTag,angleTag,isBase?'':(state.numberMode==='Norm'?'':state.numberMode),isBase?'':(state.display==='MthIO'?'Math':''),state.dispPause?'◢':'',replay].filter(Boolean).join(' ');
  $('status').innerHTML=`<span>${CalNatural.esc(left)}</span><span>${CalNatural.esc(right)}</span>`;
  if(state.inputPrompt){
    $('expression').innerHTML=`<span class="prompt-label">${CalNatural.esc(state.inputPrompt.prompt)}</span>`;
    $('expression').setAttribute('aria-label','Prompt '+state.inputPrompt.prompt);
    const curVal=state.engine.format(state.variables[state.inputPrompt.variable]||{re:0,im:0});
    if(state.inputPrompt.entry.source){
      $('answer').innerHTML=(state.display==='MthIO'?state.inputPrompt.entry.html(true):CalNatural.esc(state.inputPrompt.entry.source))+'<span class="math-cursor"></span>';
    }else{
      $('answer').innerHTML='<span class="stored-value">'+CalNatural.esc(curVal)+'</span><span class="math-cursor"></span>';
    }
    $('answer').classList.remove('has-frac');
    $('answer').setAttribute('aria-label',state.inputPrompt.entry.source||curVal);
  } else {
    const active=state.active;
    $('expression').innerHTML=state.display==='MthIO'?active.html(!state.done):CalNatural.esc(active.source)+'<span class="math-cursor"></span>';
    $('expression').setAttribute('aria-label','นิพจน์ '+active.source);
    $('answer').innerHTML=(!state.done&&state.expression)?'':(state.resultHTML||CalNatural.numericHTML(state.result));
    $('answer').classList.toggle('has-frac',!!(state.resultHTML&&state.resultHTML.includes('math-frac')));
    $('answer').setAttribute('aria-label','ผลลัพธ์ '+state.result);
  }
  let screen=state.menuText();
  $('menu').hidden=!screen;$('menu').textContent=screen||'';
  let panel=document.getElementById('assignment');if(!panel){panel=document.createElement('div');panel.id='assignment';lcd.append(panel);}
  panel.hidden=!state.assignment||!!screen||!!state.inputPrompt;
  if(state.assignment){
    const a=state.assignment,name=a.vars[a.index];
    const formulaTag=a.formulaName?`<span class="fmla-eq-tag">[${CalNatural.esc(a.formulaName)}] </span>`:'';
    if(a.solved)panel.innerHTML='<div class="assign-equation">'+formulaTag+state.editor.html(false)+'</div><div class="solve-result">'+CalNatural.esc(a.solution)+'='+CalNatural.esc(state.result)+'</div><div class="residual">L−R='+CalNatural.esc(Number(a.residual.toPrecision(4)))+'</div>';
    else {const value=state.engine.format(state.assignmentValue(name));panel.innerHTML='<div class="assign-equation">'+formulaTag+state.editor.html(false)+'</div><div class="assign-label">'+CalNatural.esc(name)+'? <span>'+ (a.index+1)+'/'+a.vars.length+'</span></div><div class="assign-value">'+(a.entry.source?a.entry.html(true):'<span class="stored-value">'+CalNatural.esc(value)+'</span><span class="math-cursor"></span>')+'</div><div class="assign-hint">'+(a.kind==='solve'?'▲▼ Select   SOLVE:Run':a.ready?'CALC:Run  ◀▶ Edit':'EXE:Store  CALC:Run')+'</div>';}
  }
  $('expression').style.visibility=state.screen||state.assignment||screen?'hidden':'';
  $('answer').style.visibility=state.screen||state.assignment||screen?'hidden':'';
  renderWorkflow(lcd,!!screen);
  lcd.style.filter='contrast('+(0.6+(state.contrast??10)*.04)+')';
  if(state.error){$('menu').hidden=false;$('menu').textContent=state.error+'\n◀▶:Edit  AC:Clear';}
  const cursor=document.querySelector('.math-cursor');if(cursor){const host=state.assignment?document.querySelector('.assign-value'):(state.inputPrompt?$('answer'):(state.screen?.type==='program'&&state.screen?.entry?document.querySelector('.formula-editor'):$('expression')));if(host){const r=cursor.getBoundingClientRect(),h=host.getBoundingClientRect();if(r.right>h.right)host.scrollLeft+=r.right-h.right+8;if(r.left<h.left)host.scrollLeft-=h.left-r.left+8;if(r.bottom>h.bottom)host.scrollTop+=r.bottom-h.bottom+8;if(r.top<h.top)host.scrollTop-=h.top-r.top+8;}}
}
function clear(){state.clear();}
function insert(text){state.insert(text);}
function accept(answer,expression=state.expression){state.accept(answer,expression);save();}
function calculate(){state.calculate();save();}
function recall(item){state.recall(item);}
function mem(subtract){state.memoryUpdate(subtract);save();}
const keyRows=CalKeys.rows;
function addKey(key,x,y,w,h){const button=document.createElement('button');button.className='key';button.style.cssText=`left:${x/377*100}%;top:${y/733*100}%;width:${w/377*100}%;height:${h/733*100}%`;button.setAttribute('aria-label',key[1]);button.title=key[1]+(key[4]?` · ALPHA ${key[4]}`:'');button.dataset.key=key[0];button.addEventListener('click',()=>press(key));$('keys').append(button);}
const tops=[346,387,429,470,514,564,614,664];
keyRows.forEach((row,r)=>row.forEach((key,c)=>addKey(key,49+c*(r<4?48.5:58.5),tops[r],r<4?42:51,r<4?27:36)));
[['mode','MODE',49,263,44,43],['function','FUNCTION',105,283,41,42],['left','◁',169,264,43,51],['up','△',216,253,67,26],['right','▷',286,264,44,51],['down','▽',216,302,68,24]].forEach(([id,label,x,y,w,h])=>addKey([id,label],x,y,w,h));
function press(key){state.press(key);save();render();}
function openTool(kind){state.openTool(kind);save();render();}
document.addEventListener('keydown',event=>{
  if(event.target.id==='program-editor'||event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.key==='='&&state.alpha){event.preventDefault();press(['rcl','RCL',null,null,'=']);return;}
  if(event.key==='='&&state.screen?.type==='program'&&state.screen?.program?.mode==='Formula'){event.preventDefault();state.insert('=');save();render();return;}
  const mapping={Enter:'exe','=':'exe',Backspace:'del',Escape:'exit','+':'plus','-':'minus','*':'multiply','/':'divide','.':'dot','(':'open',')':'close','^':'power',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
  const id=mapping[event.key]||(/^\d$/.test(event.key)?event.key:null);
  if(id){event.preventDefault();const key=keyRows.flat().find(k=>k[0]===id)||[id,event.key];press(key);}
  else if(/^[A-Za-z, ?:"]$/.test(event.key)){event.preventDefault();state.insert(event.key);save();render();}
});
render();

function renderWorkflow(lcd,menuOpen){
  let host=$('workflow');if(!host){host=document.createElement('div');host.id='workflow';lcd.append(host);}
  const s=state.screen;host.hidden=!s||menuOpen;if(!s||menuOpen)return;
  const esc=CalNatural.esc;
  const naturalValue=v=>{if(state.display!=='MthIO')return esc(v);const e=new CalNatural.Editor();try{e.load(String(v));return e.html(false);}catch{return esc(v);}};
  if(s.tableRows){
    const start=Math.max(0,Math.min(s.index-1,s.tableRows.length-3));
    const rows=s.tableRows.slice(start,start+3).map((r,i)=>'<div class="table-row">'+r.map((v,c)=>'<span class="'+(start+i===s.index&&c===s.column?'selected':'')+'">'+esc(Number(Number(v).toPrecision(6)))+'</span>').join('')+'</div>').join('');
    host.innerHTML='<div class="table-row"><span>X</span><span>F(X)</span></div>'+rows+'<div class="matrix-grid-bottom">'+naturalValue(s.tableRows[s.index][s.column])+'</div>';return;
  }
  if(s.equationResult){const line=s.lines[s.index],at=line.indexOf('=');host.innerHTML='<div class="workflow-title">'+esc(line.slice(0,at))+'</div><div class="workflow-entry">'+naturalValue(line.slice(at+1))+'</div><div class="assign-hint">'+(s.index>0?'▲ ':'')+(s.index<s.lines.length-1?'▼':'')+'</div>';return;}
  if(s.type==='contrast'){host.innerHTML='<div class="contrast-screen"><div>CONTRAST</div><div class="contrast-controls"><span>LIGHT<br>[◀]</span><span>DARK<br>[▶]</span></div></div>';return;}
  if(s.type==='program'){
    if(s.program?.mode==='Formula'&&s.entry){
      host.innerHTML=`<div class="workflow-title">${esc(s.title)}</div>`+
        `<div class="workflow-entry formula-editor">`+
        (state.display==='MthIO'?s.entry.html(true):esc(s.entry.source)+'<span class="math-cursor"></span>')+
        `</div>`+
        `<div class="assign-hint">◀▶▲▼ Move  CALC:Run  EXIT:Save</div>`;
      return;
    }
    if(!host.querySelector('textarea'))host.innerHTML='<div class="workflow-title"></div><textarea id="program-editor" aria-label="Program source" spellcheck="false"></textarea><div class="assign-hint">EXE:New line  EXIT:Save</div>';
    host.querySelector('.workflow-title').textContent=s.title;
    const area=host.querySelector('textarea');if(area.value!==s.program.source)area.value=s.program.source;
    if(s.cursor!==undefined)area.setSelectionRange(s.cursor,s.selectionEnd??s.cursor);
    const remember=()=>{s.cursor=area.selectionStart;s.selectionEnd=area.selectionEnd;};area.onselect=remember;area.onclick=remember;area.onkeyup=remember;
    area.oninput=()=>{s.program.source=area.value;remember();save();};return;
  }
  if(s.type==='progName'){
    if(s.step==='name'){
      const before=esc(s.name.slice(0,s.cursor));
      const cursorChar=s.cursor<s.name.length?esc(s.name[s.cursor]):' ';
      const after=esc(s.name.slice(s.cursor+1));
      host.innerHTML=`<div class="prog-prompt"><div class="prog-prompt-title">Program Name?</div><div class="prog-prompt-input"><span>${before}</span><span class="math-cursor">${cursorChar}</span><span>${after}</span></div><div class="prog-prompt-hint">EXE:Next  [A]:Upper alpha  EXIT:Back</div></div>`;
      return;
    }
    if(s.step==='mode'){
      const cur=s.modeIndex||0;
      host.innerHTML=`<div class="workflow-title">Select Mode</div><div class="prog-list-content">`+
        `<div class="prog-list-row ${cur===0?'selected':''}"><span class="prog-list-cursor">${cur===0?'▶':' '}</span><span>1:COMP</span></div>`+
        `<div class="prog-list-row ${cur===1?'selected':''}"><span class="prog-list-cursor">${cur===1?'▶':' '}</span><span>2:BASE-N</span></div>`+
        `<div class="prog-list-row ${cur===2?'selected':''}"><span class="prog-list-cursor">${cur===2?'▶':' '}</span><span>3:Formula</span></div>`+
        `</div><div class="assign-hint">1-3, ▲▼ or EXE:Select  EXIT:Back</div>`;
      return;
    }
  }
  if(s.type==='list'&&(s.programList||s.formulaList)){
    const start=Math.max(0,Math.min(s.index-1,s.lines.length-3));
    const visible=s.lines.slice(start,start+3);
    const linesHtml=visible.map((line,offset)=>{
      const i=start+offset;
      const isSel=(i===s.index);
      return `<div class="prog-list-row ${isSel?'selected':''}"><span class="prog-list-cursor">${isSel?'▶':' '}</span><span>${esc(line)}</span></div>`;
    }).join('');
    const posHint=(s.lines.length?(s.index+1)+'/'+s.lines.length:'0/0');
    host.innerHTML=`<div class="workflow-title">${esc(s.title)}</div><div class="prog-list-content">${linesHtml}</div><div class="assign-hint">▲▼ ${posHint}  EXE:${s.action==='DELETE'?'Del':s.action==='EDIT'?'Edit':'Run'}  EXIT:Back</div>`;
    return;
  }
  if(s.type==='list'&&s.matrixList){
    const start=Math.max(0,Math.min(s.index-1,s.lines.length-3));
    const visible=s.lines.slice(start,start+3);
    const linesHtml=visible.map((line,offset)=>{
      const i=start+offset;
      return `<div class="matrix-list-row ${i===s.index?'selected':''}">${esc(line)}</div>`;
    }).join('');
    host.innerHTML=`<div class="workflow-title">${esc(s.title)}</div><div class="matrix-list-content">${linesHtml}</div>`;
    return;
  }
  if(s.type==='dimension'){
    const mVal=(s.index===0&&s.entry.source)?(s.entry.html(true)+'<span class="math-cursor"></span>'):esc(s.values.m);
    const nVal=(s.index===1&&s.entry.source)?(s.entry.html(true)+'<span class="math-cursor"></span>'):esc(s.values.n);
    host.innerHTML=`<div class="workflow-title">${esc(s.title)}</div><div class="matrix-dim-rows"><div class="matrix-dim-row ${s.index===0?'selected':''}"><span class="matrix-dim-label">      m :</span><span class="matrix-dim-val">${mVal}</span></div><div class="matrix-dim-row ${s.index===1?'selected':''}"><span class="matrix-dim-label">      n :</span><span class="matrix-dim-val">${nVal}</span></div></div>`;
    return;
  }
  if(s.type==='grid'&&(s.matrix||s.title?.includes('EQN'))){
    const cols=s.labels.length,rows=s.data.length;
    const r=Math.floor(s.index/cols),c=s.index%cols;
    const numCols=Math.min(3,cols);
    const numRows=Math.min(3,rows);
    const cs=Math.max(0,Math.min(c-1,cols-numCols));
    const rs=Math.max(0,Math.min(r-1,rows-numRows));
    const visibleCols=Array.from({length:numCols},(_,i)=>cs+i);
    const visibleRows=Array.from({length:numRows},(_,i)=>rs+i);
    const isEqn=!!s.title?.includes('EQN');
    const name=s.matrixName||(isEqn?'EQN':'A');
    const colsHeader=visibleCols.map(ci=>`<span>${esc(s.labels[ci]||String(ci+1))}</span>`).join('');
    const rowsHtml=visibleRows.map(ri=>{
      const cellsHtml=visibleCols.map(ci=>{
        const isSel=(ri===r&&ci===c);
        const v=s.data[ri][ci];
        return `<span class="${isSel?'selected':''}">${esc(Number(Number(v).toPrecision(6)))}</span>`;
      }).join('');
      return `<div class="matrix-grid-row"><span class="matrix-row-num">${ri+1}</span><span class="matrix-row-bracket left">[</span><div class="matrix-row-cells" style="grid-template-columns:repeat(${numCols},1fr)">${cellsHtml}</div><span class="matrix-row-bracket right">]</span></div>`;
    }).join('');
    const bottomLabel=isEqn?`${esc(s.labels[c]||'')}= `:'' ;
    const bottomValue=s.entry.source?s.entry.html(true):naturalValue(s.data[r][c]);
    host.innerHTML=`<div class="matrix-grid"><div class="matrix-grid-top"><span class="matrix-grid-name">${esc(name)}</span><div class="matrix-grid-cols" style="grid-template-columns:repeat(${numCols},1fr)">${colsHeader}</div></div><div class="matrix-grid-body">${rowsHtml}</div><div class="matrix-grid-bottom">${bottomLabel}${bottomValue}</div></div>`;
    return;
  }
  let body='',hint='EXIT:Back';
  if(s.type==='wizard'){const [name,label,def,kind]=s.fields[s.index];body='<div>'+esc(label)+'</div><div class="workflow-entry">'+(s.entry.source?s.entry.html(true):(kind==='text'?esc(s.values[name]??def):naturalValue(s.values[name]??def))+'<span class="math-cursor"></span>')+'</div>';hint='EXE:Next  '+(s.index+1)+'/'+s.fields.length;}
  else if(s.type==='grid'){const cols=s.labels.length,r=Math.floor(s.index/cols),c=s.index%cols;body='<div>'+esc(s.labels[c])+'['+(r+1)+']</div><div class="workflow-entry">'+(s.entry.source?s.entry.html(true):naturalValue(s.data[r][c])+'<span class="math-cursor"></span>')+'</div>';hint=s.stat?'EXE:Store  FUNCTION:STAT':'EXE:Store  ◀▶▲▼';}
  else if(s.type==='programPause'){body='<div class="workflow-entry" style="font-size:6.7cqw;min-height:9cqw;line-height:1.2">'+(state.display==='MthIO'?naturalValue(s.lines[0]):esc(s.lines[0]))+'</div>';hint='◢  EXE:Next';}
  else if(s.type==='confirm'){body='<div>Are you sure?</div>';hint='EXE:Yes  EXIT:Cancel';}
  else if(s.type==='list'){
    const start=Math.max(0,Math.min(s.index-1,s.lines.length-3));
    const visible=s.lines.slice(start,start+3);
    const content=visible.map((x,offset)=>{const i=start+offset;return (i===s.index?'▶':' ')+x;}).join('\n');
    body='<pre>'+esc(content||'Empty')+'</pre>';
    hint='▲▼ '+(s.lines.length?s.index+1:0)+'/'+s.lines.length+'  '+(s.select?'EXE:Select':'EXIT:Back');
  }
  else {
    const start=Math.max(0,Math.min(s.index,s.lines.length-3));
    body='<pre>'+esc(s.lines.length?s.lines.slice(start,start+3).join('\n'):'Empty')+'</pre>';
    hint='▲▼ '+(s.lines.length?s.index+1:0)+'/'+s.lines.length+'  '+(s.back?'EXIT:Back':'');
  }
  host.innerHTML='<div class="workflow-title">'+esc(s.title)+'</div>'+body+'<div class="assign-hint">'+hint+'</div>';
}
