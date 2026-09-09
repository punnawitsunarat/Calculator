'use strict';
const $=id=>document.getElementById(id);
let saved={};try{saved=JSON.parse(localStorage.getItem('cal-preview-v1')||'{}')||{};}catch{}
const state=new CalLCD.Machine(CalEngine,CalNatural,saved);

const save=()=>{try{localStorage.setItem('cal-preview-v1',JSON.stringify(state.snapshot()));}catch{}};
const dispatch=r=>state.dispatch(r);
function render(){
  const lcd=document.querySelector('.lcd');lcd.classList.toggle('off',!state.on);lcd.classList.toggle('error',!!state.error);lcd.classList.toggle('assigning',!!state.assignment);lcd.classList.toggle('calculated',state.done);
  $('status').textContent=`${state.shift?'S':' '} ${state.alpha?(state.lock?'A-LOCK':'A'):' '} ${state.variables.M&&(state.variables.M.re||state.variables.M.im)?'M':' '}      ${state.mode==='COMP'?'':state.mode} ${state.display==='MthIO'?'Math':'Line'} ${state.numberMode==='Norm'?'':state.numberMode} ${state.angle}`;
  const active=state.active;
  $('expression').innerHTML=state.display==='MthIO'?active.html(!state.done):CalNatural.esc(active.source)+'<span class="math-cursor"></span>';
  $('expression').setAttribute('aria-label','นิพจน์ '+active.source);
  $('answer').innerHTML=state.resultHTML||CalNatural.numericHTML(state.result);
  $('answer').setAttribute('aria-label','ผลลัพธ์ '+state.result);
  let screen=state.menuText();
  if(state.memory)screen=state.memory+' → variable\nSelect A–Z';
  $('menu').hidden=!screen;$('menu').textContent=screen||'';
  let panel=document.getElementById('assignment');if(!panel){panel=document.createElement('div');panel.id='assignment';lcd.append(panel);}
  panel.hidden=!state.assignment||!!screen;
  if(state.assignment){
    const a=state.assignment,name=a.vars[a.index];
    if(a.solved)panel.innerHTML='<div class="assign-equation">'+state.editor.html(false)+'</div><div class="solve-result">'+CalNatural.esc(a.solution)+'='+CalNatural.esc(state.result)+'</div><div class="residual">L−R='+CalNatural.esc(Number(a.residual.toPrecision(4)))+'</div>';
    else {const value=state.engine.format(state.assignmentValue(name));panel.innerHTML='<div class="assign-equation">'+state.editor.html(false)+'</div><div class="assign-label">'+CalNatural.esc(name)+'? <span>'+ (a.index+1)+'/'+a.vars.length+'</span></div><div class="assign-value">'+(a.entry.source?a.entry.html(true):'<span class="stored-value">'+CalNatural.esc(value)+'</span><span class="math-cursor"></span>')+'</div><div class="assign-hint">'+(a.kind==='solve'?'▲▼ Select   SOLVE:Run':a.ready?'EXE:Calculate':'EXE:Store    ▲▼')+'</div>';}
  }
  renderWorkflow(lcd,!!screen);
  lcd.style.filter=state.contrast?'contrast('+(0.7+state.contrast*.06)+')':'';
  if(state.error){$('menu').hidden=false;$('menu').textContent=state.error+'\n◀▶:Edit  AC:Clear';}
  const cursor=document.querySelector('.math-cursor');if(cursor){const host=state.assignment?document.querySelector('.assign-value'):$('expression');if(host){const r=cursor.getBoundingClientRect(),h=host.getBoundingClientRect();if(r.right>h.right)host.scrollLeft+=r.right-h.right+8;if(r.left<h.left)host.scrollLeft-=h.left-r.left+8;}}
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
  const mapping={Enter:'exe','=':'exe',Backspace:'del',Escape:'exit','+':'plus','-':'minus','*':'multiply','/':'divide','.':'dot','(':'open',')':'close','^':'power',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
  const id=mapping[event.key]||(/^\d$/.test(event.key)?event.key:null);
  if(id){event.preventDefault();const key=keyRows.flat().find(k=>k[0]===id)||[id,event.key];press(key);}
  else if(/^[A-Za-z, ]$/.test(event.key)){event.preventDefault();state.insert(event.key);save();render();}
});
render();

function renderWorkflow(lcd,menuOpen){
  let host=$('workflow');if(!host){host=document.createElement('div');host.id='workflow';lcd.append(host);}
  const s=state.screen;host.hidden=!s||menuOpen;if(!s||menuOpen)return;
  const esc=CalNatural.esc;
  const naturalValue=v=>{if(state.display!=='MthIO')return esc(v);const e=new CalNatural.Editor();try{e.load(String(v));return e.html(false);}catch{return esc(v);}};
  if(s.type==='program'){
    if(!host.querySelector('textarea'))host.innerHTML='<div class="workflow-title"></div><textarea id="program-editor" aria-label="Program source" spellcheck="false"></textarea><div class="assign-hint">EXE:New line  EXIT:Save</div>';
    host.querySelector('.workflow-title').textContent=s.title;
    const area=host.querySelector('textarea');if(area.value!==s.program.source)area.value=s.program.source;
    if(s.cursor!==undefined)area.setSelectionRange(s.cursor,s.selectionEnd??s.cursor);
    const remember=()=>{s.cursor=area.selectionStart;s.selectionEnd=area.selectionEnd;};area.onselect=remember;area.onclick=remember;area.onkeyup=remember;
    area.oninput=()=>{s.program.source=area.value;remember();save();};return;
  }
  let body='',hint='EXIT:Back';
  if(s.type==='wizard'){const [name,label,def,kind]=s.fields[s.index];body='<div>'+esc(label)+'</div><div class="workflow-entry">'+(s.entry.source?s.entry.html(true):(kind==='text'?esc(s.values[name]??def):naturalValue(s.values[name]??def))+'<span class="math-cursor"></span>')+'</div>';hint='EXE:Next  '+(s.index+1)+'/'+s.fields.length;}
  else if(s.type==='grid'&&s.matrix){const cols=s.labels.length,r=Math.floor(s.index/cols),c=s.index%cols,rs=Math.max(0,r-1),cs=Math.max(0,c-2);body='<div class="matrix-cells" style="grid-template-columns:repeat('+Math.min(3,cols)+',1fr)">'+s.data.slice(rs,rs+2).map((row,ri)=>row.slice(cs,cs+3).map((v,ci)=>'<span class="'+(rs+ri===r&&cs+ci===c?'selected':'')+'">'+esc(Number(v.toPrecision(6)))+'</span>').join('')).join('')+'</div><div class="matrix-value">'+(r+1)+','+(c+1)+' '+(s.entry.source?s.entry.html(true):naturalValue(s.data[r][c]))+'</div>';hint=s.readonly?'Mat Ans    EXE:Back':'EXE:Store   EXIT:Back';}
  else if(s.type==='grid'){const cols=s.labels.length,r=Math.floor(s.index/cols),c=s.index%cols;body='<div>'+esc(s.labels[c])+'['+(r+1)+']</div><div class="workflow-entry">'+(s.entry.source?s.entry.html(true):naturalValue(s.data[r][c])+'<span class="math-cursor"></span>')+'</div>';hint=s.stat?'EXE:Store  FUNCTION:STAT':'EXE:Store  ◀▶▲▼';}
  else if(s.type==='programPause'){body='<pre>'+esc(s.lines[0])+'</pre>';hint='◢  EXE:Continue';}
  else if(s.type==='confirm'){body='<div>Are you sure?</div>';hint='EXE:Yes  EXIT:Cancel';}
  else {body='<pre>'+esc(s.lines.length?s.lines.slice(s.index,s.index+2).map((x,i)=>(s.type==='list'?(i===0?'▶':' '):'')+x).join('\n'):'Empty')+'</pre>';hint='▲▼ '+(s.lines.length?s.index+1:0)+'/'+s.lines.length+'  '+(s.select?'EXE:Select':'EXIT:Back');}
  host.innerHTML='<div class="workflow-title">'+esc(s.title)+'</div>'+body+'<div class="assign-hint">'+hint+'</div>';
}
