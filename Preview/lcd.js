(function(root){
  'use strict';
  const Base=typeof module!=='undefined'?require('./device.js').Machine:root.CalDevice.Machine;
  const pages={
    mode:['1:COMP  2:BASE-N\n3:SD    4:REG\n5:PROG  6:RECUR\n7:TABLE 8:EQN   ▼','1:LINK  2:MEMORY\n3:SYSTEM       ▲'],
    setup:['1:MthIO 2:LineIO\n3:Deg   4:Rad\n5:Gra   6:Fix\n7:Sci   8:Norm  ▼','1:ab/c  2:d/c\n3:ENG   4:COMPLX\n5:STAT  6:BASE-N ▲'],
    functions:['1:MATH  2:COMPLX\n3:PROG  4:CONST\n5:ANGLE 6:CLR\n7:STAT  8:MATRIX'],
    math:['1:∫dX   2:d/dX\n3:d²/dX² 4:Σ(\n5:x!    6:Ran#\n7:nPr   8:nCr   ▼','1:Abs   2:Int\n3:Frac  4:Intg\n5:Pol   6:Rec\n7:logab 8:RanInt ↕','1:sinh  2:cosh\n3:tanh  4:sinh⁻¹\n5:cosh⁻¹ 6:tanh⁻¹\n               ↕','1:m 2:μ 3:n 4:p\n5:f 6:k 7:M 8:G\n               ↕','1:T 2:P        ▲'],
    complex:['1:Abs   2:Arg\n3:Conjg 4:ReP\n5:ImP   6:→r∠θ\n7:→a+bi'],
    angle:['1:°  2:r  3:g\n4:→DMS'],eng:['1:EngOn 2:EngOff'],complexFormat:['1:a+bi  2:r∠θ'],frequency:['1:FreqOn\n2:FreqOff'],signed:['1:Signed\n2:Unsigned'],
    program:['1:NEW   2:RUN\n3:EDIT  4:DELETE'],commands:['1:?     2:→\n3:If    4:Then\n5:Else  6:IfEnd\n7:For   8:Next  ▼','1:While 2:WhileEnd\n3:Lbl   4:Goto\n5:Break 6:Stop   ▲'],
    stat:['1:LIST  2:VAR\n3:DISTR 4:Reg'],statVar:['1:n  2:x̄\n3:σx 4:sx     ▼','1:Σx² 2:Σx     ↕','1:minX 2:maxX  ▲'],regVar:['1:n  2:x̄\n3:σx 4:sx\n5:ȳ  6:σy\n7:sy           ▼','1:Σx² 2:Σx\n3:Σy² 4:Σy\n5:Σxy          ▲'],regCoefficients:['1:a 2:b 3:c\n4:r'],distribution:['1:P( 2:Q( 3:R(\n4:→t'],regression:['1:Line  2:Quad\n3:Log   4:eExp\n5:abExp 6:Power\n7:Inv'],
    matrix:['1:EDIT  2:Mat\n3:det   4:Trn\n5:Inverse\n6:+  7:−  8:×'],matrixName:['1:Mat A 2:Mat B\n3:Mat C 4:Mat D\n5:Mat E 6:Mat F'],
    equation:['1:aX+bY=c\n2:aX+bY+cZ=d\n3:4 Unknowns\n4:5 Unknowns   ▼','1:aX²+bX+c=0\n2:aX³+bX²+cX+d=0\n               ▲'],
    system:['1:Contrast\n2:Reset Setup\n3:Reset All'],clr:['1:Stat\n2:Memory'],base:['1:DEC  2:HEX\n3:BIN  4:OCT'],
    fix:['Fix 0~9?'],sci:['Sci 0~9?\n0 = 10 digits'],norm:['Norm 1~2?']
  };
  const constants=[['mp',1.67262192369e-27],['mn',1.67492749804e-27],['me',9.1093837015e-31],['mμ',1.883531627e-28],['a0',5.29177210903e-11],['h',6.62607015e-34],['μN',5.0507837461e-27],['μB',9.2740100783e-24],['ħ',1.054571817e-34],['α',7.2973525693e-3],['re',2.8179403262e-15],['λC',2.42631023867e-12],['γp',2.6752218744e8],['λCp',1.32140985539e-15],['λCn',1.31959090581e-15],['R∞',10973731.568160],['u',1.66053906660e-27],['μp',1.41060679736e-26],['μe',-9.2847647043e-24],['μn',-9.6623651e-27],['μμ',-4.49044830e-26],['F',96485.33212],['e',1.602176634e-19],['NA',6.02214076e23],['k',1.380649e-23],['Vm',0.02241396954],['R',8.314462618],['c0',299792458],['c1',3.741771852e-16],['c2',0.01438776877],['σ',5.670374419e-8],['ε0',8.8541878128e-12],['μ0',1.25663706212e-6],['Φ0',2.067833848e-15],['g',9.80665],['G0',7.748091729e-5],['Z0',376.730313668],['t',273.15],['G',6.67430e-11],['atm',101325]];
  pages.constants=Array.from({length:5},(_,p)=>Array.from({length:4},(_,r)=>{const i=p*8+r*2;return `${r*2+1}:${constants[i][0].padEnd(5)} ${r*2+2}:${constants[i+1][0]}`;}).join('\n'));
  class Machine extends Base{
    constructor(engine,natural,saved={}){super(engine,natural,saved);this.screen=null;this.mode='COMP';this.frequency=!!saved.frequency;this.signed=saved.signed!==false;this.eng=!!saved.eng;this.complexFormat=saved.complexFormat||'a+bi';this.mixed=!!saved.mixed;this.matrices=saved.matrices||{};this.statRows=saved.statRows||[];this.regModel=saved.regModel||'Line';this.programs=saved.programs||[{name:'FOR-LOOP',source:saved.program||'25→A\n100→Dim List X\nIf A=25\nThen "FOR-LOOP"\nFor 1→N To 100\n10×N+3→List X[N]\nNext\nIfEnd\nList X[100]'}];}
    snapshot(){return {...super.snapshot(),frequency:this.frequency,signed:this.signed,eng:this.eng,complexFormat:this.complexFormat,mixed:this.mixed,matrices:this.matrices,statRows:this.statRows,regModel:this.regModel,programs:this.programs};}
    get active(){return this.screen?.entry||super.active;}
    refreshResult(){super.refreshResult();if(this.eng){this.result=this.numericText();this.resultHTML=null;}}
    clear(){super.clear();this.screen=null;}
    startEntry(chain){if(!this.screen)super.startEntry(chain);}
    insert(s){if(this.screen?.entry){this.error=null;this.screen.entry.insert(s);return;}super.insert(s);}
    numericText(value=this.value){if(this.complexFormat==='r∠θ'&&value.im){const factor=this.angle==='RAD'?1:this.angle==='GRA'?200/Math.PI:180/Math.PI;return this.engine.format({re:Math.hypot(value.re,value.im),im:0})+'∠'+this.engine.format({re:Math.atan2(value.im,value.re)*factor,im:0});}if(this.eng&&value.re&&!value.im&&this.numberMode==='Norm'){const e=Math.floor(Math.log10(Math.abs(value.re))/3)*3;return Number((value.re/10**e).toPrecision(10))+'×10^'+e;}return super.numericText(value);}
    openMenu(kind,extra={}){this.menu={kind,page:0,parent:this.menu,...extra};}
    menuText(){if(pages[this.menu?.kind])return pages[this.menu.kind][this.menu.page||0];return super.menuText();}
    output(title,lines,back=null){this.menu=null;this.screen={type:'output',title,lines:lines.map(String),index:0,back};}
    wizard(title,fields,finish,back=null){this.menu=null;this.assignment=null;this.screen={type:'wizard',title,fields,index:0,values:{},entry:new this.natural.Editor(),finish,back};}
    real(source){const v=this.dispatch({action:'evaluate',expression:source}).value;if(v.im||!Number.isFinite(v.re))throw Error('Math ERROR: real value required');return v.re;}
    integer(n,min,max){if(!Number.isInteger(n)||n<min||n>max)throw Error(`Range ERROR: ${min}…${max}`);return n;}
    grid(title,data,labels,finish,back=null){this.menu=null;this.screen={type:'grid',title,data,labels,index:0,entry:new this.natural.Editor(),finish,back};}
    chooseProgram(action){const parent=()=>this.openTool('program');if(!this.programs.length){this.output('Prog List',['No programs'],parent);return;}this.menu=null;this.screen={type:'list',title:'Prog '+action,lines:this.programs.map(p=>p.name),index:0,back:parent,select:i=>{const p=this.programs[i];if(action==='EDIT')this.screen={type:'program',title:p.name,program:p,back:parent};else if(action==='DELETE')this.confirm('Delete '+p.name,()=>{this.programs.splice(i,1);this.chooseProgram(action);});else this.runProgram(p);}};}
    confirm(title,run){const previous=this.screen;this.menu=null;this.screen={type:'confirm',title,run,back:()=>{this.screen=previous;}};}
    runProgram(p){const names=[...new Set([...p.source.matchAll(/\?\s*→\s*([A-Z])/g)].map(m=>m[1]))];const run=inputs=>{const a=this.dispatch({action:'program',source:p.source,inputs});this.variables=a.variables;this.output(p.name,a.output.length?a.output:['Done'],()=>this.chooseProgram('RUN'));};if(names.length)this.wizard(p.name,names.map(n=>[n,n+'?',0]),run);else run({});}
    openTool(kind,operation){this.error=null;this.menu=null;this.assignment=null;this.screen=null;
      if(kind==='program'){this.openMenu('program');return;}
      if(kind==='history'){this.screen={type:'list',title:'REPLAY',lines:this.history.map(h=>h.expression+' = '+h.result),index:Math.max(0,this.history.length-1),select:i=>{this.screen=null;this.recall(this.history[i]);}};return;}
      if(kind==='help'){this.output('KEY GUIDE',['SHIFT sin → sin⁻¹','SHIFT cos → cos⁻¹','SHIFT tan → tan⁻¹','SHIFT MODE: SETUP','▲▼: Menu pages','Number: Select','EXE: Store / Next','EXIT: Back','Fraction: ▼ denominator','Root / power: ▶ exit','ALPHA RCL: =','SOLVE: Enter guesses','SOLVE again: Find root','FILE: Program list']);return;}
      if(kind==='memory'){this.openMenu('memory');return;}
      if(kind==='statistics'||kind==='regression'){this.mode=kind==='statistics'?'SD':'REG';if(kind==='regression'){this.openMenu('regression');return;}this.statGrid();return;}
      if(kind==='matrix'){this.openMenu('matrix');return;}
      if(kind==='equation'){this.mode='EQN';this.openMenu('equation');return;}
      if(kind==='base'){this.mode='BASE-N';this.wizard('BASE-N',[['expression','Integer','255','text'],['from','From: 2,8,10,16',10],['to','To: 2,8,10,16',16]],v=>{for(const k of ['from','to'])if(![2,8,10,16].includes(v[k]))throw Error('Base ERROR');const a=this.dispatch({action:'base',signed:this.signed,...v});this.output('BASE-N',[a.text],()=>this.openTool('base'));});return;}
      if(kind==='table'||kind==='recurrence'){this.mode=kind==='table'?'TABLE':'RECUR';const fields=[['expression',kind==='table'?'f(X) =':'a(n) = [A:previous] ',kind==='table'?'X^2':'2A','expr'],['start','Start',1],['end','End',10],['step','Step',1]];if(kind==='recurrence')fields.push(['initial','a(Start−1)',1]);this.wizard(this.mode,fields,v=>{const a=this.dispatch({action:kind,...v});this.output(this.mode,a.rows.map(r=>r.join('  ')),()=>this.openTool(kind));});return;}
      if(kind==='calculus'){operation=operation||'integral';const fields=[['expression','f(X) =',this.expression||'X^2','expr'],['start',operation.includes('Derivative')||operation==='derivative'?'X =':'Lower',0]];if(!['derivative','secondDerivative'].includes(operation))fields.push(['end','Upper',1]);this.wizard(operation,fields,v=>{const a=this.dispatch({action:'calculus',operation,end:0,...v});this.output(operation,[a.text??a.result],()=>this.openTool(kind,operation));});}
    }
    statGrid(){const reg=this.mode==='REG',labels=reg?['X','Y']:['X'];if(this.frequency)labels.push('Freq');const data=this.statRows.map(r=>labels.map((_,i)=>r[i]??(labels[i]==='Freq'?1:0)));if(!data.length)data.push(labels.map(l=>l==='Freq'?1:0));this.grid(this.mode+' DATA',data,labels,()=>this.statResults());this.screen.stat=true;this.screen.committed=this.statRows.length;}
    statResults(){let rows=this.statRows;if(!rows.length)throw Error('Data ERROR: no data');if(this.frequency){const ci=this.mode==='REG'?2:1;let total=0;rows=rows.flatMap(r=>{const n=this.integer(r[ci]??1,0,10000);total+=n;if(total>20000)throw Error('Capacity ERROR');return Array.from({length:n},()=>r.slice(0,ci));});}const a=this.dispatch({action:'statistics',rows});if(this.mode==='REG')Object.assign(a,this.regressionResult(rows));this.output('STAT '+(this.mode==='REG'?this.regModel:'SD'),Object.entries(a).map(([k,v])=>k+'='+ (typeof v==='number'?Number(v.toPrecision(10)):v)),()=>this.statGrid());}
    regressionResult(rows){
      if(rows.length<2)throw Error('Data ERROR: two pairs required');
      const model=this.regModel;
      if(model==='Quad'){
        if(rows.length<3)throw Error('Data ERROR: three pairs required');
        const sums=Array.from({length:5},(_,p)=>rows.reduce((s,r)=>s+r[0]**p,0));
        const rhs=Array.from({length:3},(_,p)=>rows.reduce((s,r)=>s+r[0]**p*r[1],0));
        const inv=this.dispatch({action:'matrix',operation:'inverse',a:Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>sums[i+j]))}).result;
        const [a,b,c]=inv.map(r=>r.reduce((s,v,j)=>s+v*rhs[j],0));return {intercept:a,slope:b,correlation:null,a,b,c};
      }
      const transformed=rows.map(([x,y])=>{
        if(['Log','Power'].includes(model)){if(x<=0)throw Error('Math ERROR: X > 0');x=Math.log(x);}
        if(['eExp','abExp','Power'].includes(model)){if(y<=0)throw Error('Math ERROR: Y > 0');y=Math.log(y);}
        if(model==='Inv'){if(!x)throw Error('Math ERROR: X ≠ 0');x=1/x;}return [x,y];
      });
      const result=this.dispatch({action:'statistics',rows:transformed});if(result.slope===null)throw Error('Math ERROR: constant X');
      let a=result.intercept,b=result.slope;if(['eExp','abExp','Power'].includes(model))a=Math.exp(a);if(model==='abExp')b=Math.exp(b);
      return {intercept:a,slope:b,correlation:result.correlation,a,b,r:result.correlation};
    }
    statValue(kind,page,n){
      let rows=this.statRows;if(this.frequency){const c=this.mode==='REG'?2:1;let total=0;rows=rows.flatMap(r=>{const count=this.integer(r[c]??1,0,10000);total+=count;if(total>20000)throw Error('Capacity ERROR');return Array.from({length:count},()=>r.slice(0,c));});}
      const x=this.dispatch({action:'statistics',rows:rows.map(r=>[r[0]])});let values;
      if(kind==='regCoefficients'){const r=this.regressionResult(rows);values=[r.a,r.b,r.c,r.r];}
      else if(kind==='statVar')values=[[x.n,x.mean,x.populationSD,x.sampleSD],[x.sumSquares,x.sum],[x.min,x.max]][page];
      else{const y=this.dispatch({action:'statistics',rows:rows.map(r=>[r[1]])});values=[[x.n,x.mean,x.populationSD,x.sampleSD,y.mean,y.populationSD,y.sampleSD],[x.sumSquares,x.sum,y.sumSquares,y.sum,rows.reduce((a,r)=>a+r[0]*r[1],0)]][page];}
      const value=values?.[n-1];if(value===null||value===undefined||!Number.isFinite(value))throw Error('Math ERROR: statistic unavailable');
      this.menu=null;this.screen=null;this.insert('('+value+')');
    }
    editMatrix(name){this.wizard('Mat '+name,[['rows','Rows (1–10)',this.matrices[name]?.length||2],['cols','Columns (1–10)',this.matrices[name]?.[0]?.length||2]],v=>{this.integer(v.rows,1,10);this.integer(v.cols,1,10);const a=Array.from({length:v.rows},(_,r)=>Array.from({length:v.cols},(_,c)=>this.matrices[name]?.[r]?.[c]||0));this.grid('Mat '+name,a,Array.from({length:v.cols},(_,c)=>String(c+1)),()=>{this.matrices[name]=a;this.output('Mat '+name,['Stored'],()=>this.openTool('matrix'));});});}
    matrixAction(name,operation){if(operation==='edit'){this.editMatrix(name);return;}const a=this.matrices[name];if(!a)throw Error('Dimension ERROR: define Mat '+name);if(operation==='view'){this.output('Mat '+name,a.map(r=>r.join(' ')),()=>this.openTool('matrix'));return;}if(['add','subtract','multiply'].includes(operation)){this.openMenu('matrixName',{operation:'binary',a,op:operation});return;}const answer=this.dispatch({action:'matrix',operation,a});this.output('Mat '+name,Array.isArray(answer.result)?answer.result.map(r=>r.join(' ')):[answer.result],()=>this.openTool('matrix'));}
    equation(type,size){const linear=type==='linear',data=Array.from({length:linear?size:1},()=>Array(linear?size+1:size+1).fill(0));this.grid('EQN coefficients',data,Array.from({length:size+1},(_,i)=>String.fromCharCode(97+i)),()=>{let roots;if(linear){const inv=this.dispatch({action:'matrix',operation:'inverse',a:data.map(r=>r.slice(0,-1))}).result;roots=inv.map(r=>r.reduce((sum,x,j)=>sum+x*data[j][size],0));}else roots=this.dispatch({action:'polynomial',coefficients:data[0]}).roots;this.output('EQN Result',roots.map((x,i)=>'X'+(i+1)+'='+x),()=>this.equation(type,size));});}
    menuKey(id){const m=this.menu;if(!m)return false;const n=Number(id),p=m.page||0,k=m.kind;
      if(id==='exit'){this.menu=m.parent||null;return true;}
      if((id==='down'||id==='up')&&pages[k]){const count=pages[k].length;m.page=(p+(id==='down'?1:-1)+count)%count;return true;}
      if(!/^\d$/.test(id))return super.menuKey(id);
      const sub=kind=>this.openMenu(kind),token=s=>{this.menu=null;this.insert(s);};
      if(k==='mode'){if(p){if(n===1)this.output('LINK',['Not emulated','EXIT:Back']);if(n===2)sub('memory');if(n===3)sub('system');}else{const kind=['','comp','base','statistics','regression','program','recurrence','table','equation'][n];if(kind==='comp'){this.screen=null;this.menu=null;this.mode='COMP';}else if(kind)this.openTool(kind);}return true;}
      if(k==='setup'&&p){if(n===1||n===2){this.mixed=n===1;this.menu=null;this.refreshResult();}else if(n>=3&&n<=6)sub(['eng','complexFormat','frequency','signed'][n-3]);return true;}
      if(['eng','complexFormat','frequency','signed'].includes(k)){if(n===1||n===2){if(k==='eng')this.eng=n===1;if(k==='complexFormat')this.complexFormat=n===1?'a+bi':'r∠θ';if(k==='frequency')this.frequency=n===1;if(k==='signed')this.signed=n===1;this.menu=null;this.refreshResult();}return true;}
      if(k==='functions'){const s=['','math','complex','commands','constants','angle','clr','stat','matrix'][n];if(s)sub(s);return true;}
      if(k==='math'){if(p===0&&n>=1&&n<=4){this.openTool('calculus',['integral','derivative','secondDerivative','sum'][n-1]);return true;}const items=[['','','','','!','Ran#','nPr(','nCr('],['abs(','Int(','Frac(','Intg(','Pol(','Rec(','logab(','RandInt('],['sinh(','cosh(','tanh(','asinh(','acosh(','atanh('],['×10^(-3)','×10^(-6)','×10^(-9)','×10^(-12)','×10^(-15)','×10^3','×10^6','×10^9'],['×10^12','×10^15']];if(items[p]?.[n-1])token(items[p][n-1]);return true;}
      if(k==='complex'){if(n===6||n===7){this.complexFormat=n===6?'r∠θ':'a+bi';this.menu=null;this.refreshResult();}else if(n>=1&&n<=5)token(['abs(','Arg(','Conjg(','ReP(','ImP('][n-1]);return true;}
      if(k==='constants'){if(n>=1&&n<=8)token('('+constants[p*8+n-1][1]+')');return true;}
      if(k==='angle'){if(n>=1&&n<=3){const source=this.screen?.entry?.complete()||this.editor.complete();const factor=[Math.PI/180,1,Math.PI/200][n-1]/(this.angle==='RAD'?1:this.angle==='GRA'?Math.PI/200:Math.PI/180);this.active.load('('+source+')×('+factor+')');this.menu=null;}else if(n===4){this.menu=null;this.calculate();const x=Math.abs(this.value.re),d=Math.floor(x),min=Math.floor((x-d)*60),sec=Number(((x-d-min/60)*3600).toFixed(6));this.result=(this.value.re<0?'−':'')+d+'°'+min+'′'+sec+'″';this.resultHTML=null;}return true;}
      if(k==='program'){if(n===1){this.wizard('NEW Program',[['name','Name (1–12)','PROGRAM','text']],v=>{if(!/^[A-Za-z0-9_-]{1,12}$/.test(v.name)||this.programs.some(p=>p.name===v.name))throw Error('Name ERROR');const program={name:v.name,source:''};this.programs.push(program);this.screen={type:'program',title:program.name,program,back:()=>this.openTool('program')};});}else if(n>=2&&n<=4)this.chooseProgram(['RUN','EDIT','DELETE'][n-2]);return true;}
      if(k==='commands'){const s=[['?','→','If ','Then ','Else','IfEnd','For ','Next'],['While ','WhileEnd','Lbl ','Goto ','Break','Stop']][p][n-1];if(s){this.menu=null;if(this.screen?.type==='program')this.screen.program.source+=s;else this.insert(s);}return true;}
      if(k==='matrix'){if(n>=1&&n<=8)sub('matrixName'),this.menu.operation=['edit','view','determinant','transpose','inverse','add','subtract','multiply'][n-1];return true;}
      if(k==='matrixName'){if(n>=1&&n<=6){const name=String.fromCharCode(64+n);if(m.operation==='binary'){const a=this.dispatch({action:'matrix',operation:m.op,a:m.a,b:this.matrices[name]}).result;this.output('Mat Result',a.map(r=>r.join(' ')),()=>this.openTool('matrix'));}else this.matrixAction(name,m.operation);}return true;}
      if(k==='equation'){if(p===0&&n>=1&&n<=4)this.equation('linear',n+1);else if(p===1&&n>=1&&n<=2)this.equation('polynomial',n+1);return true;}
      if(k==='stat'){if(n===1)this.statGrid();if(n===2)sub(this.mode==='REG'?'regVar':'statVar');if(n===4)sub('regCoefficients');if(n===3)sub('distribution');return true;}
      if(['statVar','regVar','regCoefficients'].includes(k)){if(n>=1&&n<=7)this.statValue(k,p,n);return true;}
      if(k==='regression'){if(n>=1&&n<=7){this.regModel=['Line','Quad','Log','eExp','abExp','Power','Inv'][n-1];this.statGrid();}return true;}
      if(k==='distribution'){if(n>=1&&n<=4)this.wizard('DISTR',[['x','t =',0]],v=>{let val;if(n===4){const s=this.dispatch({action:'statistics',rows:this.statRows});if(!s.populationSD)throw Error('Math ERROR');val=(v.x-s.mean)/s.populationSD;}else{const integral=Number(this.dispatch({action:'calculus',operation:'integral',expression:'e^(-X^2/2)/sqrt(2*pi)',start:0,end:Math.min(12,Math.abs(v.x))}).text)*Math.sign(v.x);val=n===1?.5+integral:n===2?integral:.5-integral;}this.output('DISTR',[val]);});return true;}
      if(k==='clr'){if(n===1||n===2)this.confirm('Clear '+(n===1?'Stat':'Memory'),()=>{if(n===1)this.statRows=[];else this.variables={};this.screen=null;});return true;}
      if(k==='system'){if(n===1)this.wizard('Contrast',[['contrast','Level (1–9)',5]],v=>{this.integer(v.contrast,1,9);this.contrast=v.contrast;this.screen=null;});if(n===2||n===3)this.confirm(n===2?'Reset Setup':'Reset All',()=>{this.angle='DEG';this.display='MthIO';this.numberMode='Norm';this.norm=1;this.mixed=false;this.eng=false;this.complexFormat='a+bi';this.frequency=false;this.signed=true;if(n===3){this.variables={};this.history=[];this.programs=[];this.matrices={};this.statRows=[];}this.clear();});return true;}
      return super.menuKey(id);
    }
    screenKey(key){const s=this.screen,[id,label,value,shiftValue,alpha]=key;if(!s)return false;
      if(id==='exit'){this.screen=null;if(s.back)s.back();return true;}
      if(s.type==='confirm'){if(id==='exe')s.run();return true;}
      if(s.type==='program'){if(['mode','function','shift','alpha'].includes(id))return false;if(id==='exe')s.program.source+='\n';else if(id==='del')s.program.source=s.program.source.slice(0,-1);else s.program.source+=this.alpha&&alpha?alpha:this.shift?(shiftValue||''):(value||label);this.shift=false;if(!this.lock)this.alpha=false;return true;}
      if(s.type==='output'||s.type==='list'){if(id==='up'||id==='down')s.index=Math.max(0,Math.min(s.lines.length-1,s.index+(id==='down'?1:-1)));else if(id==='exe'&&s.select&&s.lines.length)s.select(s.index);else if(id==='exe')s.index=Math.min(s.lines.length-1,s.index+1);else if(['function','mode'].includes(id))return false;return true;}
      if(id==='del'){s.entry.backspace();return true;}
      if(id==='left'||id==='right'||id==='up'||id==='down'){if(s.entry.source){s.entry.move(id);return true;}if(s.type==='wizard'){if(id==='up'||id==='down')s.index=Math.max(0,Math.min(s.fields.length-1,s.index+(id==='down'?1:-1)));}else{s.index=Math.max(0,Math.min(s.data.length*s.labels.length-1,s.index+(id==='left'?-1:id==='right'?1:id==='up'?-s.labels.length:s.labels.length)));}return true;}
      if(id==='exe'){
        if(s.type==='wizard'){const [name,,def,kind]=s.fields[s.index],source=s.entry.source||String(s.values[name]??def);s.values[name]=kind==='expr'||kind==='text'?source:this.real(s.entry.source?s.entry.complete():source);s.entry.clear();if(s.index<s.fields.length-1)s.index++;else s.finish(s.values);}
        else {const cols=s.labels.length,r=Math.floor(s.index/cols),c=s.index%cols;if(s.entry.source)s.data[r][c]=this.real(s.entry.complete());s.entry.clear();if(s.stat){s.committed=Math.max(s.committed,r+1);this.statRows=s.data.slice(0,s.committed).map(row=>row.slice());if(r===s.data.length-1){if(s.data.length>=199)throw Error('Memory ERROR: 199 rows');s.data.push(s.labels.map(l=>l==='Freq'?1:0));}s.index+=cols;}else if(s.index<s.data.length*cols-1)s.index++;else s.finish();}return true;
      }
      if(s.stat&&(id==='calc'||id==='function')){this.statRows=s.data.slice(0,s.committed).map(r=>r.slice());if(id==='calc')this.statResults();else this.openMenu('stat');return true;}
      return false;
    }
    press(key){try{const id=key[0];if(this.on&&!this.menu&&!this.screen&&!this.error&&id==='file'&&!this.shift&&!this.alpha){this.chooseProgram('RUN');return;}if(this.error&&id==='exit'){this.error=null;return;}if(this.screen&&id==='ac'&&!this.shift){if(this.screen.entry){this.screen.entry.clear();this.error=null;return;}this.screen=null;}if(this.on&&!this.error&&!this.menu&&this.screen&&!['shift','alpha'].includes(id)&&!(this.shift&&id==='mode')&&this.screenKey(key))return;const action=super.press(key);if(action?.tool)this.openTool(action.tool,action.operation);return;}catch(e){this.error=e.message||'Math ERROR';}}
  }
  root.CalLCD={Machine};if(typeof module!=='undefined')module.exports=root.CalLCD;
})(typeof globalThis!=='undefined'?globalThis:this);
