(function(root){
  'use strict';
  const Base=typeof module!=='undefined'?require('./device.js').Machine:root.CalDevice.Machine;
  const pages={
    mode:['1:COMP  2:BASE-N\n3:SD    4:REG\n5:PROG  6:RECUR\n7:TABLE 8:EQN   ▼','1:LINK  2:MEMORY\n3:SYSTEM       ▲'],
    setup:['1:MthIO 2:LineIO\n3:Deg   4:Rad\n5:Gra   6:Fix\n7:Sci   8:Norm  ▼','1:ab/c  2:d/c\n3:ENG   4:COMPLX\n5:STAT  6:BASE-N ▲'],
    functions:['1:MATH  2:COMPLX\n3:PROG  4:CONST\n5:ANGLE 6:CLR\n7:STAT  8:MATRIX'],
    functionsFormula:['1:MATH   2:COMPLX\n3:CONST  4:ALPHA\n5:ANGLE'],
    functionsBase:['1:PROG   2:LOGIC'],
    alphaChars:['1:abc   2:ΑΒΓ\n3:αβγ   4:123\n5:ABC   6:abc'],
    alphaLower:[
      '1:a 2:b 3:c 4:d\n5:e 6:f 7:g 8:h ▼',
      '1:i 2:j 3:k 4:l\n5:m 6:n 7:o 8:p ↕',
      '1:q 2:r 3:s 4:t\n5:u 6:v 7:w 8:x ↕',
      '1:y 2:z         ▲'
    ],
    alphaUpper:[
      '1:A 2:B 3:C 4:D\n5:E 6:F 7:G 8:H ▼',
      '1:I 2:J 3:K 4:L\n5:M 6:N 7:O 8:P ↕',
      '1:Q 2:R 3:S 4:T\n5:U 6:V 7:W 8:X ↕',
      '1:Y 2:Z         ▲'
    ],
    alphaGreekUpper:[
      '1:Α 2:Β 3:Γ 4:Δ\n5:Ε 6:Ζ 7:Η 8:Θ ▼',
      '1:Ι 2:Κ 3:Λ 4:Μ\n5:Ν 6:Ξ 7:Ο 8:Π ↕',
      '1:Ρ 2:Σ 3:Τ 4:Υ\n5:Φ 6:Χ 7:Ψ 8:Ω ▲'
    ],
    alphaGreekLower:[
      '1:α 2:β 3:γ 4:δ\n5:ε 6:ζ 7:η 8:θ ▼',
      '1:ι 2:κ 3:λ 4:μ\n5:ν 6:ξ 7:ο 8:π ↕',
      '1:ρ 2:σ 3:τ 4:υ\n5:φ 6:χ 7:ψ 8:ω ▲'
    ],
    alphaSubNum:[
      '1:₀ 2:₁ 3:₂ 4:₃\n5:₄ 6:₅ 7:₆ 8:₇ ▼',
      '1:₈ 2:₉         ▲'
    ],
    math:['1:∫dX   2:d/dX\n3:d²/dX² 4:Σ(\n5:x!    6:Ran#\n7:nPr   8:nCr   ▼','1:Abs   2:Int\n3:Frac  4:Intg\n5:Pol   6:Rec\n7:logab 8:RanInt ↕','1:sinh  2:cosh\n3:tanh  4:sinh⁻¹\n5:cosh⁻¹ 6:tanh⁻¹\n               ↕','1:m 2:μ 3:n 4:p\n5:f 6:k 7:M 8:G\n               ↕','1:T 2:P        ▲'],
    complex:['1:Abs   2:Arg\n3:Conjg 4:ReP\n5:ImP   6:→r∠θ\n7:→a+bi'],
    angle:['1:°  2:r  3:g\n4:→DMS'],eng:['1:EngOn 2:EngOff'],complexFormat:['1:a+bi  2:r∠θ'],frequency:['1:FreqOn\n2:FreqOff'],signed:['1:Signed\n2:Unsigned'],
    program:['1:NEW   2:RUN\n3:EDIT  4:DELETE'],
    progDelete:['1:One File\n2:All Files'],
    commands:[
      '1:?     2:→\n3::     4:◢\n5:If    6:Then\n7:Else  8:IfEnd ▼',
      '1:For   2:To\n3:Step  4:Next\n5:While 6:WhileEnd\n7:Do    8:LpWhile ↕',
      '1:Prog  2:Return\n3:Break 4:Stop\n5:Lbl   6:Goto\n7:⇒     8:ClearMat ↕',
      '1:=     2:≠\n3:>     4:<\n5:≥     6:≤\n7:And   8:Or      ▲'
    ],
    stat:['1:LIST  2:VAR\n3:DISTR 4:Reg'],statVar:['1:n  2:x̄\n3:σx 4:sx     ▼','1:Σx² 2:Σx     ↕','1:minX 2:maxX  ▲'],regVar:['1:n  2:x̄\n3:σx 4:sx\n5:ȳ  6:σy\n7:sy           ▼','1:Σx² 2:Σx\n3:Σy² 4:Σy\n5:Σxy          ▲'],regCoefficients:['1:a 2:b 3:c\n4:r'],distribution:['1:P( 2:Q( 3:R(\n4:→t'],regression:['1:Line  2:Quad\n3:Log   4:eExp\n5:abExp 6:Power\n7:Inv'],
    matrix:['1:EDIT  2:Mat\n3:det   4:Trn'],matrixName:['1:Mat A 2:Mat B\n3:Mat C 4:Mat D\n5:Mat E 6:Mat F'],
    equation:['1:aX+bY=c\n2:aX+bY+cZ=d\n3:4 Unknowns\n4:5 Unknowns   ▼','1:aX²+bX+c=0\n2:aX³+bX²+cX+d=0\n               ▲'],
    system:['1:Contrast\n2:Reset Setup\n3:Reset All'],clr:['1:Stat\n2:Memory'],base:['1:DEC  2:HEX\n3:BIN  4:OCT'],
    baseLogic:['1:and   2:or\n3:xor   4:xnor\n5:Not   6:Neg   ▼','1:d     2:h\n3:b     4:o     ▲'],
    fix:['Fix 0~9?'],sci:['Sci 0~9?\n0 = 10 digits'],norm:['Norm 1~2?'],
    formula:[
      '1:Circle 2:Circum\n3:Triangle 4:Hypot\n5:Sphere 6:Cylind ▼',
      '1:Speed  2:Force\n3:Kinetic 4:Ohm\n5:Interst 6:Dist   ↕',
      '1:Power  2:Joule\n3:ParallR 4:Accel\n5:Potent  6:Work   ↕',
      '1:Cone   2:SphArea\n3:Press   4:Gas\n5:Freq   6:Capac  ↕',
      '1:Heron  2:SeriesR\n3:Density 4:Pendulm\n5:ResonF 6:Hooke   ↕',
      '1:Moment 2:FreeFall\n3:Centrif 4:Gravit\n5:Coulomb 6:HeatCap  ↕',
      '1:Wave   2:CosLaw\n3:SinLaw 4:Sector\n5:V-Gain 6:Bernou   ↕',
      '1:Frict  2:Buoyanc\n3:Carnot 4:Photon\n5:Snell  6:Stadia   ▲'
    ]
  };
  const constants=[['mp',1.67262192369e-27],['mn',1.67492749804e-27],['me',9.1093837015e-31],['mμ',1.883531627e-28],['a0',5.29177210903e-11],['h',6.62607015e-34],['μN',5.0507837461e-27],['μB',9.2740100783e-24],['ħ',1.054571817e-34],['α',7.2973525693e-3],['re',2.8179403262e-15],['λC',2.42631023867e-12],['γp',2.6752218744e8],['λCp',1.32140985539e-15],['λCn',1.31959090581e-15],['R∞',10973731.568160],['u',1.66053906660e-27],['μp',1.41060679736e-26],['μe',-9.2847647043e-24],['μn',-9.6623651e-27],['μμ',-4.49044830e-26],['F',96485.33212],['e',1.602176634e-19],['NA',6.02214076e23],['k',1.380649e-23],['Vm',0.02241396954],['R',8.314462618],['c0',299792458],['c1',3.741771852e-16],['c2',0.01438776877],['σ',5.670374419e-8],['ε0',8.8541878128e-12],['μ0',1.25663706212e-6],['Φ0',2.067833848e-15],['g',9.80665],['G0',7.748091729e-5],['Z0',376.730313668],['t',273.15],['G',6.67430e-11],['atm',101325]];
  pages.constants=Array.from({length:5},(_,p)=>Array.from({length:4},(_,r)=>{const i=p*8+r*2;return `${r*2+1}:${constants[i][0].padEnd(5)} ${r*2+2}:${constants[i+1][0]}`;}).join('\n'));
  class Machine extends Base{
    constructor(engine,natural,saved={}){
      super(engine,natural,saved);
      this.screen=null;this.mode='COMP';this.base=saved.base||'DEC';this.frequency=!!saved.frequency;this.signed=saved.signed!==false;this.eng=!!saved.eng;this.complexFormat=saved.complexFormat||'a+bi';this.mixed=!!saved.mixed;this.matrices=saved.matrices||{};this.statRows=saved.statRows||[];this.regModel=saved.regModel||'Line';
      this.programs=saved.programs||[
        {name:'FOR-LOOP',source:saved.program||'25→A\n100→Dim List X\nIf A=25\nThen "FOR-LOOP"\nFor 1→N To 100\n10×N+3→List X[N]\nNext\nIfEnd\nList X[100]'},
        {name:'HERON',source:'"HERON"\n?→A:?→B:?→C\n(A+B+C)/2→S\n√(S(S-A)(S-B)(S-C))◢'},
        {name:'QUADRATIC',source:'"QUADRATIC"\n?→A:?→B:?→C\nB^2-4AC→D\n(-B+√(D))/(2A)◢\n(-B-√(D))/(2A)'}
      ];
    }
    snapshot(){return {...super.snapshot(),base:this.base,frequency:this.frequency,signed:this.signed,eng:this.eng,complexFormat:this.complexFormat,mixed:this.mixed,matrices:this.matrices,statRows:this.statRows,regModel:this.regModel,programs:this.programs};}
    get active(){return this.screen?.entry||super.active;}
    refreshResult(){
      if(this.mode==='BASE-N'){
        this.result=this.baseResultText(this.value||{re:0},this.base);
        this.resultHTML=null;
        return;
      }
      super.refreshResult();
      if(this.eng){this.result=this.numericText();this.resultHTML=null;}
    }
    clear(){super.clear();this.screen=null;this.running=null;this.dmsDisplay=false;}
    insert(s){
      if(this.screen?.type==='program'){this.programInsert(s);return;}
      if(this.screen?.type==='progName'&&this.screen.step==='name'){
        const sn=this.screen;
        if(s&&sn.name.length<12){
          sn.name=sn.name.slice(0,sn.cursor)+s+sn.name.slice(sn.cursor);
          sn.cursor+=s.length;
        }
        return;
      }
      if(this.screen?.entry){this.error=null;this.screen.entry.insert(s);if(this.screen.program)this.screen.program.source=this.screen.entry.source;return;}
      super.insert(s);
    }
    numericText(value=this.value){if(this.complexFormat==='r∠θ'&&value.im){const factor=this.angle==='RAD'?1:this.angle==='GRA'?200/Math.PI:180/Math.PI;return this.engine.format({re:Math.hypot(value.re,value.im),im:0})+'∠'+this.engine.format({re:Math.atan2(value.im,value.re)*factor,im:0});}if(this.eng&&value.re&&!value.im&&this.numberMode==='Norm'){const e=Math.floor(Math.log10(Math.abs(value.re))/3)*3;return Number((value.re/10**e).toPrecision(10))+'×10^'+e;}return super.numericText(value);}
    openMenu(kind,extra={}){this.menu={kind,page:0,parent:this.menu,...extra};}
    menuText(){if(pages[this.menu?.kind])return pages[this.menu.kind][this.menu.page||0];return super.menuText();}
    output(title,lines,back=null){this.menu=null;this.screen={type:'output',title,lines:lines.map(String),index:0,back};}
    wizard(title,fields,finish,back=null){this.menu=null;this.assignment=null;this.screen={type:'wizard',title,fields,index:0,values:{},entry:new this.natural.Editor(),finish,back};}
    real(source){const v=this.dispatch({action:'evaluate',expression:source}).value;if(v.im||!Number.isFinite(v.re))throw Error('Math ERROR: real value required');return v.re;}
    integer(n,min,max){if(!Number.isInteger(n)||n<min||n>max)throw Error(`Range ERROR: ${min}…${max}`);return n;}
    grid(title,data,labels,finish,back=null){this.menu=null;this.screen={type:'grid',title,data,labels,index:0,entry:new this.natural.Editor(),finish,back};}
    chooseProgram(action, backAction=null){
      const parent=backAction || (()=>this.openTool('program'));
      if(!this.programs.length){this.output('Prog List',['No programs'],parent);return;}
      this.menu=null;
      this.screen={
        type:'list',
        title:'Prog '+action,
        lines:this.programs.map((p,i)=>`${i+1}:${p.name}`),
        index:0,
        back:parent,
        programList:true,
        action,
        select:i=>{
          const p=this.programs[i];
          if(action==='EDIT'){
            let entry=null;
            if(p.mode==='Formula'){
              entry=new this.natural.Editor();
              if(p.source)try{entry.load(p.source);}catch{}
            }
            this.screen={type:'program',title:p.name,program:p,entry,cursor:p.source.length,selectionEnd:p.source.length,back:parent};
          }
          else if(action==='DELETE')this.confirm('Delete '+p.name+'?\nEXE:Yes EXIT:No',()=>{this.programs.splice(i,1);if(this.programs.length)this.chooseProgram(action,parent);else this.output('Prog List',['No programs'],parent);});
          else this.runProgram(p);
        }
      };
    }
    confirm(title,run){const previous=this.screen;this.menu=null;this.screen={type:'confirm',title,run,back:()=>{this.screen=previous;}};}
    runProgram(p){
      if(p.mode==='Formula'){
        this.screen=null;
        this.clear();
        this.editor.load(p.source);
        this.beginAssignment('calc');
        if(this.assignment){
          this.assignment.formulaName=p.name;
          this.assignment.formulaEq=p.source;
        }
        return;
      }
      this.running={program:p,iterator:this.engine.createProgram(p.source,JSON.parse(JSON.stringify(this.variables)),this.angle,this.programs)};
      this.resumeProgram();
    }
    resumeProgram(value){
      const run=this.running;if(!run)return;
      const next=run.iterator.next(value);
      if(next.done){this.variables=next.value.variables;this.running=null;this.output(run.program.name,next.value.output.length?next.value.output:['Done'],()=>this.chooseProgram('RUN'));return;}
      this.variables=next.value.variables;
      if(next.value.type==='input')this.wizard(run.program.name,[[next.value.variable,next.value.prompt||(next.value.variable+'?'),this.variables[next.value.variable]?.re||0]],v=>this.resumeProgram(v[next.value.variable]),()=>{this.running=null;this.chooseProgram('RUN');});
      else this.screen={type:'programPause',title:run.program.name,lines:[next.value.text],index:0};
    }
    programInsert(text){const s=this.screen;if(s?.type!=='program')return;const at=s.cursor??s.program.source.length,end=s.selectionEnd??at;s.program.source=s.program.source.slice(0,at)+text+s.program.source.slice(end);s.cursor=at+text.length;s.selectionEnd=s.cursor;}
    dmsText(value){if(value.im)throw Error('Math ERROR: real DMS required');const scale=1e6,total=Math.round(Math.abs(value.re)*3600*scale);if(!Number.isSafeInteger(total))throw Error('Math ERROR: DMS range');const d=Math.floor(total/(3600*scale)),m=Math.floor(total/(60*scale))%60,sec=(total%(60*scale))/scale;return (value.re<0?'−':'')+d+'°'+m+'′'+sec+'″';}
    baseResultText(val, targetBase){
      const n = (val?.re || 0) | 0;
      const baseMap = { BIN: 2, OCT: 8, DEC: 10, HEX: 16 };
      const b = baseMap[targetBase] || 10;
      if (b === 10) {
        if (!this.signed && n < 0) return (n >>> 0).toString(10);
        return n.toString(10).replace('-', '−');
      }
      return (n >>> 0).toString(b).toUpperCase();
    }
    calculate(){
      if(this.inputPrompt){
        let enteredVal;
        if(this.inputPrompt.entry.source){
          const valSource=this.inputPrompt.entry.complete();
          const evaluated=this.dispatch({action:'evaluate',expression:valSource,variables:this.variables,angle:this.angle});
          enteredVal=evaluated.value.re!==undefined?evaluated.value.re:(Number(evaluated.text)||0);
        }else{
          enteredVal=this.variables[this.inputPrompt.variable]?.re||0;
        }
        const varName=this.inputPrompt.variable;
        this.variables[varName]={re:enteredVal,im:0};
        this.inputPrompt=null;
        this.continueMultiStatement(enteredVal);
        return;
      }
      if(this.dispPause&&this.multiStatement){
        this.continueMultiStatement();
        return;
      }
      if(this.mode==='BASE-N'){
        const source=this.editor.complete();
        try {
          const res=this.dispatch({action:'baseEvaluate',expression:source,base:this.base||'DEC',signed:this.signed});
          this.accept({value:{re:res.value,im:0}},source);
          this.result=res.text;
          this.resultHTML=null;
        } catch(e) {
          this.error=e.message||'Math ERROR';
        }
        return;
      }
      const source=this.editor.complete();
      if(source.includes(':')||source.includes('◢')||source.includes('?')){
        this.multiStatement=this.engine.createProgram(source,JSON.parse(JSON.stringify(this.variables)),this.angle);
        this.continueMultiStatement();
        return;
      }
      if(/Mat(?:\s*[A-F]|Ans)/.test(source)){
        const answer=this.dispatch({action:'matrixExpression',expression:source,matrices:this.matrices});
        if(Array.isArray(answer.result)){this.matrices.Ans=answer.result;this.grid('Mat Ans',answer.result,answer.result[0].map((_,i)=>String(i+1)),()=>{this.screen=null;});this.screen.matrix=true;this.screen.matrixName='Ans';this.screen.readonly=true;this.done=true;}
        else this.accept({value:{re:answer.result,im:0}},source);return;
      }
      super.calculate();this.dmsDisplay=/°/.test(source)&&!/[A-Za-z^]/.test(source);if(this.dmsDisplay){this.result=this.dmsText(this.value);this.resultHTML=null;}
    }
    matrixList(){this.menu=null;this.screen={type:'list',title:'Matrix',lines:['A','B','C','D','E','F'].map(n=>{const m=this.matrices[n];return 'Mat '+n+'   :'+(m?`  ${m.length}X ${m[0].length}`:'None');}),index:0,matrixList:true,select:i=>this.editMatrix(String.fromCharCode(65+i)),back:()=>this.openTool('matrix')};}
    openTool(kind,operation){this.error=null;this.menu=null;this.assignment=null;this.screen=null;
      if(kind==='program'){this.openMenu('program');return;}
      if(kind==='history'){this.screen={type:'list',title:'REPLAY',lines:this.history.map(h=>h.expression+' = '+h.result),index:Math.max(0,this.history.length-1),select:i=>{this.screen=null;this.recall(this.history[i]);}};return;}
      if(kind==='help'){this.output('KEY GUIDE',['SHIFT sin → sin⁻¹','SHIFT cos → cos⁻¹','SHIFT tan → tan⁻¹','SHIFT MODE: SETUP','▲▼: Menu pages','Number: Select','EXE: Store / Next','EXIT: Back','Fraction: ▼ denominator','Root / power: ▶ exit','ALPHA RCL: =','SOLVE: Enter guesses','SOLVE again: Find root','FILE: Program list']);return;}
      if(kind==='memory'){this.openMenu('memory');return;}
      if(kind==='statistics'||kind==='regression'){this.mode=kind==='statistics'?'SD':'REG';if(kind==='regression'){this.openMenu('regression');return;}this.statGrid();return;}
      if(kind==='matrix'){this.openMenu('matrix');return;}
      if(kind==='equation'){this.mode='EQN';this.openMenu('equation');return;}
      if(kind==='base'){this.mode='BASE-N';this.base='DEC';this.screen=null;this.menu=null;this.clear();this.result='0';this.resultHTML=null;return;}
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
    editMatrix(name,resize=false){
      const edit=a=>{this.matrices[name]=a;this.grid('Mat '+name,a,a[0].map((_,c)=>String(c+1)),()=>{},()=>this.matrixList());this.screen.matrix=true;this.screen.matrixName=name;};
      if(this.matrices[name]&&!resize){edit(this.matrices[name]);return;}
      this.dimensionMatrix(name,edit);
    }
    dimensionMatrix(name,edit){
      this.menu=null;this.assignment=null;
      const current=this.matrices[name],mDef=current?current.length:2,nDef=current?current[0].length:2;
      this.screen={type:'dimension',title:'Dimension  mXn',matrixName:name,fields:[['m','m',mDef],['n','n',nDef]],values:{m:mDef,n:nDef},index:0,entry:new this.natural.Editor(),finish:v=>{const r=this.integer(Number(v.m),1,10),c=this.integer(Number(v.n),1,10);const data=Array.from({length:r},(_,ri)=>Array.from({length:c},(_,ci)=>(current&&current[ri]&&current[ri][ci]!==undefined?current[ri][ci]:0)));edit(data);},back:()=>this.matrixList()};
    }
    matrixAction(name,operation){if(operation==='edit'){this.editMatrix(name);return;}const a=this.matrices[name];if(!a)throw Error('Dimension ERROR: define Mat '+name);if(operation==='view'){this.output('Mat '+name,a.map(r=>r.join(' ')),()=>this.openTool('matrix'));return;}if(['add','subtract','multiply'].includes(operation)){this.openMenu('matrixName',{operation:'binary',a,op:operation});return;}const answer=this.dispatch({action:'matrix',operation,a});this.output('Mat '+name,Array.isArray(answer.result)?answer.result.map(r=>r.join(' ')):[answer.result],()=>this.openTool('matrix'));}
    equation(type,size){const linear=type==='linear',data=Array.from({length:linear?size:1},()=>Array(linear?size+1:size+1).fill(0));this.grid('EQN coefficients',data,Array.from({length:size+1},(_,i)=>String.fromCharCode(97+i)),()=>{let lines;if(linear){const inv=this.dispatch({action:'matrix',operation:'inverse',a:data.map(r=>r.slice(0,-1))}).result;lines=inv.map((r,i)=>'X'+(i+1)+'='+r.reduce((sum,x,j)=>sum+x*data[j][size],0));}else{const poly=this.dispatch({action:'polynomial',coefficients:data[0]});lines=poly.roots.map((x,i)=>'X'+(i+1)+'='+x);if(poly.vertex){lines.push('X-Value '+poly.vertex.type+'='+poly.vertex.x);lines.push('Y-Value '+poly.vertex.type+'='+poly.vertex.y);}}this.output('EQN Result',lines,()=>this.equation(type,size));});}
    menuKey(id){const m=this.menu;if(!m)return false;const n=Number(id),p=m.page||0,k=m.kind;
      if(id==='exit'){this.menu=m.parent||null;return true;}
      if((id==='down'||id==='up')&&pages[k]){const count=pages[k].length;m.page=(p+(id==='down'?1:-1)+count)%count;return true;}
      if(!/^\d$/.test(id))return super.menuKey(id);
      const sub=kind=>this.openMenu(kind),token=s=>{this.menu=null;this.insert(s);};
      if(k==='mode'){if(p){if(n===1)this.output('LINK',['Not emulated','EXIT:Back']);if(n===2)sub('memory');if(n===3)sub('system');}else{const kind=['','comp','base','statistics','regression','program','recurrence','table','equation'][n];if(kind==='comp'){this.screen=null;this.menu=null;this.mode='COMP';}else if(kind)this.openTool(kind);}return true;}
      if(k==='setup'&&p){if(n===1||n===2){this.mixed=n===1;this.menu=null;this.refreshResult();}else if(n>=3&&n<=6)sub(['eng','complexFormat','frequency','signed'][n-3]);return true;}
      if(['eng','complexFormat','frequency','signed'].includes(k)){if(n===1||n===2){if(k==='eng')this.eng=n===1;if(k==='complexFormat')this.complexFormat=n===1?'a+bi':'r∠θ';if(k==='frequency')this.frequency=n===1;if(k==='signed')this.signed=n===1;this.menu=null;this.refreshResult();}return true;}
      if(k==='functions'){const s=['','math','complex','commands','constants','angle','clr','stat','matrix'][n];if(s)sub(s);return true;}
      if(k==='functionsFormula'){const s=['','math','complex','constants','alphaChars','angle'][n];if(s)sub(s);return true;}
      if(k==='functionsBase'){const s=['','commands','baseLogic'][n];if(s)sub(s);return true;}
      if(k==='alphaChars'){const s=['','alphaLower','alphaGreekUpper','alphaGreekLower','alphaSubNum','alphaUpper','alphaLower'][n];if(s)sub(s);return true;}
      if(k==='alphaLower'){const ch=['abcdefgh','ijklmnop','qrstuvwx','yz'][p]?.[n-1];if(ch)token(ch);return true;}
      if(k==='alphaUpper'){const ch=['ABCDEFGH','IJKLMNOP','QRSTUVWX','YZ'][p]?.[n-1];if(ch)token(ch);return true;}
      if(k==='alphaGreekUpper'){const ch=['ΑΒΓΔΕΖΗΘ','ΙΚΛΜΝΞΟΠ','ΡΣΤΥΦΧΨΩ'][p]?.[n-1];if(ch)token(ch);return true;}
      if(k==='alphaGreekLower'){const ch=['αβγδεζηθ','ικλμνξοπ','ρστυφχψω'][p]?.[n-1];if(ch)token(ch);return true;}
      if(k==='alphaSubNum'){const ch=['₀₁₂₃₄₅₆₇','₈₉'][p]?.[n-1];if(ch)token(ch);return true;}
      if(k==='math'){
        if(p===0&&n>=1&&n<=4){
          if(this.screen?.type==='program'){
            token(['∫(','d/dx(','d²/dx²(','Σ('][n-1]);
            return true;
          }
          this.openTool('calculus',['integral','derivative','secondDerivative','sum'][n-1]);
          return true;
        }
        const items=[['','','','','!','Ran#','nPr(','nCr('],['abs(','Int(','Frac(','Intg(','Pol(','Rec(','logab(','RandInt('],['sinh(','cosh(','tanh(','asinh(','acosh(','atanh('],['×10^(-3)','×10^(-6)','×10^(-9)','×10^(-12)','×10^(-15)','×10^3','×10^6','×10^9'],['×10^12','×10^15']];
        if(items[p]?.[n-1])token(items[p][n-1]);
        return true;
      }
      if(k==='complex'){if(n===6||n===7){this.complexFormat=n===6?'r∠θ':'a+bi';this.menu=null;this.refreshResult();}else if(n>=1&&n<=5)token(['abs(','Arg(','Conjg(','ReP(','ImP('][n-1]);return true;}
      if(k==='constants'){if(n>=1&&n<=8)token('('+constants[p*8+n-1][1]+')');return true;}
      if(k==='angle'){if(n>=1&&n<=3){const source=this.screen?.entry?.complete()||this.editor.complete();const factor=[Math.PI/180,1,Math.PI/200][n-1]/(this.angle==='RAD'?1:this.angle==='GRA'?Math.PI/200:Math.PI/180);this.active.load('('+source+')×('+factor+')');this.menu=null;}else if(n===4){this.menu=null;this.calculate();this.dmsDisplay=true;this.result=this.dmsText(this.value);this.resultHTML=null;}return true;}
      if(k==='program'){
        if(n===1){
          this.menu=null;this.alpha=true;
          this.screen={type:'progName',title:'Program Name?',name:'',cursor:0,step:'name',back:()=>this.openTool('program')};
        }else if(n>=2&&n<=3)this.chooseProgram(['RUN','EDIT'][n-2]);
        else if(n===4)this.openMenu('progDelete');
        return true;
      }
      if(k==='progDelete'){
        if(n===1)this.chooseProgram('DELETE',()=>this.openMenu('progDelete'));
        else if(n===2)this.confirm('Delete All?\nEXE:Yes EXIT:No',()=>{this.programs=[];this.output('Prog List',['No programs'],()=>this.openTool('program'));});
        return true;
      }
      if(k==='commands'){
        const s=[
          ['?','→',':','◢','If ','Then ','Else ','IfEnd '],
          ['For ',' To ',' Step ','Next','While ','WhileEnd','Do','LpWhile '],
          ['Prog "','Return','Break','Stop','Lbl ','Goto ','⇒','ClearMat'],
          ['=','≠','>','<','≥','≤',' And ',' Or ']
        ][p]?.[n-1];
        if(s){this.menu=null;if(this.screen?.type==='program')this.programInsert(s);else this.insert(s);}
        return true;
      }
      if(k==='matrix'){if(n===1)this.matrixList();if(n===2){sub('matrixName');this.menu.operation='insert';}if(n===3)token('det(');if(n===4)token('Trn(');return true;}
      if(k==='matrixName'){if(n>=1&&n<=6){const name=String.fromCharCode(64+n);if(m.operation==='insert'){token('Mat'+name);return true;}if(m.operation==='binary'){const a=this.dispatch({action:'matrix',operation:m.op,a:m.a,b:this.matrices[name]}).result;this.output('Mat Result',a.map(r=>r.join(' ')),()=>this.openTool('matrix'));}else this.matrixAction(name,m.operation);}return true;}
      if(k==='equation'){if(p===0&&n>=1&&n<=4)this.equation('linear',n+1);else if(p===1&&n>=1&&n<=2)this.equation('polynomial',n+1);return true;}
      if(k==='stat'){if(n===1)this.statGrid();if(n===2)sub(this.mode==='REG'?'regVar':'statVar');if(n===4)sub('regCoefficients');if(n===3)sub('distribution');return true;}
      if(['statVar','regVar','regCoefficients'].includes(k)){if(n>=1&&n<=7)this.statValue(k,p,n);return true;}
      if(k==='regression'){if(n>=1&&n<=7){this.regModel=['Line','Quad','Log','eExp','abExp','Power','Inv'][n-1];this.statGrid();}return true;}
      if(k==='distribution'){if(n>=1&&n<=4)this.wizard('DISTR',[['x','t =',0]],v=>{let val;if(n===4){const s=this.dispatch({action:'statistics',rows:this.statRows});if(!s.populationSD)throw Error('Math ERROR');val=(v.x-s.mean)/s.populationSD;}else{const integral=Number(this.dispatch({action:'calculus',operation:'integral',expression:'e^(-X^2/2)/sqrt(2*pi)',start:0,end:Math.min(12,Math.abs(v.x))}).text)*Math.sign(v.x);val=n===1?.5+integral:n===2?integral:.5-integral;}this.output('DISTR',[val]);});return true;}
      if(k==='clr'){if(n===1||n===2)this.confirm('Clear '+(n===1?'Stat':'Memory'),()=>{if(n===1)this.statRows=[];else this.variables={};this.screen=null;});return true;}
      if(k==='baseLogic'){
        if(p===0){const ops=[' and ',' or ',' xor ',' xnor ','Not(','Neg('];if(ops[n-1])token(ops[n-1]);}
        else if(p===1){const pfx=['d','h','b','o'];if(pfx[n-1])token(pfx[n-1]);}
        return true;
      }
      if(k==='system'){if(n===1)this.wizard('Contrast',[['contrast','Level (1–9)',5]],v=>{this.integer(v.contrast,1,9);this.contrast=v.contrast;this.screen=null;});if(n===2||n===3)this.confirm(n===2?'Reset Setup':'Reset All',()=>{this.angle='DEG';this.display='MthIO';this.numberMode='Norm';this.norm=1;this.mixed=false;this.eng=false;this.complexFormat='a+bi';this.frequency=false;this.signed=true;if(n===3){this.variables={};this.history=[];this.programs=[];this.matrices={};this.statRows=[];}this.clear();});return true;}
      return super.menuKey(id);
    }
    screenKey(key){const s=this.screen,[id,label,value,shiftValue,alpha]=key;if(!s)return false;
      if(id==='exit'){if(s.type==='programPause')this.running=null;this.screen=null;if(s.back)s.back();return true;}
      if(s.type==='confirm'){if(id==='exe')s.run();return true;}
      if(s.type==='programPause'){if(id==='exe')this.resumeProgram();return true;}
      if(s.matrixList){if(id==='right'){this.editMatrix(String.fromCharCode(65+s.index),true);return true;}if(id==='del'){const name=String.fromCharCode(65+s.index);this.confirm('Delete Mat '+name,()=>{delete this.matrices[name];this.matrixList();});return true;}}
      if(s.type==='progName'){
        if(id==='exit'){this.alpha=false;this.screen=null;if(s.back)s.back();return true;}
        if(s.step==='name'){
          if(id==='function'){this.openMenu('alphaChars');return true;}
          if(id==='exe'){
            const name=s.name.trim();
            if(!name)return true;
            if(this.programs.some(p=>p.name===name)){this.error='Already Exists';return true;}
            if(!/^[A-Za-z0-9_ -]{1,12}$/.test(name)){this.error='Name ERROR';return true;}
            s.step='mode';s.title='Select Mode';s.modeIndex=0;this.alpha=false;return true;
          }
          if(id==='del'||id==='ac'){
            if(id==='ac'){s.name='';s.cursor=0;}
            else if(s.cursor>0){s.name=s.name.slice(0,s.cursor-1)+s.name.slice(s.cursor);s.cursor--;}
            return true;
          }
          if(id==='left'){s.cursor=Math.max(0,s.cursor-1);return true;}
          if(id==='right'){s.cursor=Math.min(s.name.length,s.cursor+1);return true;}
          const ch=(this.alpha&&alpha)?alpha:(this.shift&&shiftValue)?shiftValue:(value||label);
          if(ch&&ch.length===1&&s.name.length<12){s.name=s.name.slice(0,s.cursor)+ch+s.name.slice(s.cursor);s.cursor++;}
          this.shift=false;return true;
        }
        if(s.step==='mode'){
          if(id==='exit'){s.step='name';s.title='Program Name?';this.alpha=true;return true;}
          if(id==='up'||id==='down'){
            s.modeIndex=((s.modeIndex||0)+(id==='down'?1:-1)+3)%3;
            return true;
          }
          let progMode='COMP';
          if(id==='1')progMode='COMP';
          else if(id==='2')progMode='BASE-N';
          else if(id==='3')progMode='Formula';
          else if(id==='exe'){
            const modes=['COMP','BASE-N','Formula'];
            progMode=modes[s.modeIndex||0];
          }else return true;
          const program={name:s.name,mode:progMode,source:''};
          this.programs.push(program);
          let entry=null;
          if(progMode==='Formula'){
            entry=new this.natural.Editor();
          }
          this.screen={type:'program',title:program.name,program,entry,cursor:0,selectionEnd:0,back:()=>this.openTool('program')};
          return true;
        }
        return true;
      }
      if(s.type==='program'){
        if(id==='function'){
          if(s.program.mode==='Formula')this.openMenu('functionsFormula');
          else if(s.program.mode==='BASE-N')this.openMenu('functionsBase');
          else this.openMenu('functions');
          return true;
        }
        if(this.shift&&id==='file'){
          this.shift=false;
          if(s.program.mode!=='Formula')this.programInsert('Prog "');
          return true;
        }
        if(['mode','shift','alpha'].includes(id))return false;

        // Formula mode: Natural Textbook Display interactive formula editor
        if(s.program.mode==='Formula'&&s.entry){
          if(id==='exit'){
            s.program.source=s.entry.source;
            this.screen=null;
            if(s.back)s.back();
            return true;
          }
          if(this.alpha&&(id==='calc'||id==='rcl')){
            s.entry.insert('=');
            if(!this.lock)this.alpha=false;
            s.program.source=s.entry.source;
            return true;
          }
          if(id==='calc'||id==='exe'){
            try{
              const completeSrc=s.entry.complete();
              s.program.source=completeSrc;
              this.runProgram(s.program);
            }catch(e){
              if(id==='calc')this.error=e.message||'Syntax ERROR';
            }
            return true;
          }
          if(id==='del'){
            s.entry.backspace();
            s.program.source=s.entry.source;
            return true;
          }
          if(id==='ac'){
            s.entry.clear();
            s.program.source='';
            return true;
          }
          if(id==='left'||id==='right'||id==='up'||id==='down'){
            s.entry.move(id);
            return true;
          }
          if(id==='fraction'){
            s.entry.fraction(this.shift);
            this.shift=false;
            s.program.source=s.entry.source;
            return true;
          }
          if(id==='dms'){
            const tail=s.entry.source.split(/[+−×÷=,]/).at(-1);
            const marker=/°[^′]*′[^″]*$/.test(tail)?'″':/°[^′]*$/.test(tail)?'′':'°';
            s.entry.insert(marker);
            this.shift=false;
            s.program.source=s.entry.source;
            return true;
          }
          let tokenToInsert=(this.alpha&&alpha)?alpha:(this.shift?(shiftValue||''):(value||label));
          if(this.shift&&id==='power'){s.entry.template('nthroot');this.shift=false;s.program.source=s.entry.source;return true;}
          if(this.shift&&id==='open'){tokenToInsert='cbrt(';}
          if(tokenToInsert)s.entry.insert(tokenToInsert);
          this.shift=false;if(!this.lock)this.alpha=false;
          s.program.source=s.entry.source;
          return true;
        }

        // COMP / BASE-N mode multi-line code editor:
        const source=s.program.source,at=s.cursor??source.length;
        if(id==='left'||id==='right')s.cursor=Math.max(0,Math.min(source.length,at+(id==='left'?-1:1)));
        else if(id==='up'||id==='down'){const start=source.lastIndexOf('\n',at-1)+1,col=at-start;if(id==='up'){const prev=source.lastIndexOf('\n',start-2)+1;s.cursor=Math.max(0,Math.min(start-1,prev+col));}else{const next=source.indexOf('\n',at);const end=source.indexOf('\n',next+1);s.cursor=next<0?source.length:Math.min(end<0?source.length:end,next+1+col);}}
        else if(id==='exe')this.programInsert('\n');
        else if(id==='del'){if((s.selectionEnd??at)>at)this.programInsert('');else if(at){s.cursor=at-1;s.selectionEnd=at;this.programInsert('');}}
        else {
          let tokenStr='';
          if(this.alpha&&alpha)tokenStr=alpha;
          else if(this.shift){
            if(id==='sin')tokenStr='sin⁻¹(';
            else if(id==='cos')tokenStr='cos⁻¹(';
            else if(id==='tan')tokenStr='tan⁻¹(';
            else if(id==='open')tokenStr='³√(';
            else if(id==='power')tokenStr='⁻¹';
            else if(id==='sqrt')tokenStr=':';
            else if(id==='square')tokenStr='◢';
            else if(id==='ln')tokenStr='e^(';
            else if(id==='log')tokenStr='10^(';
            else tokenStr=shiftValue||'';
          }else{
            if(id==='sqrt')tokenStr='√(';
            else if(id==='square')tokenStr='²';
            else if(id==='dms'){
              const tail=source.slice(0,at).split(/[+−×÷=,:\n]/).at(-1);
              tokenStr=/°[^′]*′[^″]*$/.test(tail)?'″':/°[^′]*$/.test(tail)?'′':'°';
            }
            else if(id==='exp')tokenStr='×10^';
            else if(id==='fraction')tokenStr='/';
            else if(id==='multiply')tokenStr='×';
            else if(id==='divide')tokenStr='÷';
            else if(id==='minus'||id==='negative')tokenStr='−';
            else tokenStr=value||label;
          }
          if(tokenStr)this.programInsert(tokenStr);
        }
        s.selectionEnd=s.cursor;this.shift=false;if(!this.lock)this.alpha=false;return true;
      }
      if(s.type==='output'||s.type==='list'){if(s.select&&/^[1-9]$/.test(id)&&Number(id)<=s.lines.length){s.select(Number(id)-1);return true;}if(id==='up'||id==='down')s.index=Math.max(0,Math.min(s.lines.length-1,s.index+(id==='down'?1:-1)));else if(id==='exe'&&s.select&&s.lines.length)s.select(s.index);else if(id==='exe')s.index=Math.min(s.lines.length-1,s.index+1);else if(['function','mode'].includes(id))return false;return true;}
      if(s.readonly){if(id==='exe'){this.screen=null;return true;}if(['plus','minus','multiply','divide','power','square'].includes(id)){this.screen=null;this.editor.load('MatAns');this.done=false;return false;}if(!['left','right','up','down','exit'].includes(id))return true;}
      if(id==='del'){s.entry.backspace();return true;}
      if(id==='left'||id==='right'||id==='up'||id==='down'){if(s.entry.source){s.entry.move(id);return true;}if(s.type==='dimension'){if(id==='up'||id==='down')s.index=s.index===0?1:0;return true;}if(s.type==='wizard'){if(id==='up'||id==='down')s.index=Math.max(0,Math.min(s.fields.length-1,s.index+(id==='down'?1:-1)));}else{s.index=Math.max(0,Math.min(s.data.length*s.labels.length-1,s.index+(id==='left'?-1:id==='right'?1:id==='up'?-s.labels.length:s.labels.length)));}return true;}
      if(id==='exe'){
        if(s.type==='dimension'){const [name,,def]=s.fields[s.index],source=s.entry.source||String(s.values[name]??def);s.values[name]=this.real(s.entry.source?s.entry.complete():source);s.entry.clear();if(s.index===0)s.index=1;else s.finish(s.values);return true;}
        if(s.type==='wizard'){const [name,,def,kind]=s.fields[s.index],source=s.entry.source||String(s.values[name]??def);s.values[name]=kind==='expr'||kind==='text'?source:this.real(s.entry.source?s.entry.complete():source);s.entry.clear();if(s.index<s.fields.length-1)s.index++;else s.finish(s.values);}
        else {const cols=s.labels.length,r=Math.floor(s.index/cols),c=s.index%cols;if(s.entry.source)s.data[r][c]=this.real(s.entry.complete());s.entry.clear();if(s.stat){s.committed=Math.max(s.committed,r+1);this.statRows=s.data.slice(0,s.committed).map(row=>row.slice());if(r===s.data.length-1){if(s.data.length>=199)throw Error('Memory ERROR: 199 rows');s.data.push(s.labels.map(l=>l==='Freq'?1:0));}s.index+=cols;}else if(s.matrix){s.index=(s.index+1)%(s.data.length*cols);}else if(s.index<s.data.length*cols-1)s.index++;else s.finish();}return true;
      }
      if(s.stat&&(id==='calc'||id==='function')){this.statRows=s.data.slice(0,s.committed).map(r=>r.slice());if(id==='calc')this.statResults();else this.openMenu('stat');return true;}
      return false;
    }
    press(key){try{const id=key[0];if(this.on&&!this.error&&!this.menu&&!this.alpha&&id==='dms'){this.shift=false;if(this.done&&!this.screen&&!this.assignment){this.dmsDisplay=!this.dmsDisplay;this.result=this.dmsDisplay?this.dmsText(this.value):this.numericText();this.resultHTML=null;}else{const tail=this.active.source.split(/[+−×÷=,]/).at(-1);const marker=/°[^′]*′[^″]*$/.test(tail)?'″':/°[^′]*$/.test(tail)?'′':'°';this.insert(marker);}return;}if(this.on&&!this.menu&&!this.screen&&!this.error&&id==='file'&&!this.shift&&!this.alpha){this.chooseProgram('RUN',()=>{this.screen=null;});return;}if(this.error&&id==='exit'){this.error=null;return;}if(this.screen&&id==='ac'&&!this.shift){if(this.screen.entry){this.screen.entry.clear();this.error=null;return;}if(this.screen.type==='program'){const at=this.screen.cursor??this.screen.program.source.length;const lineStart=this.screen.program.source.lastIndexOf('\n',at-1)+1;const lineEnd=this.screen.program.source.indexOf('\n',at);const end=lineEnd<0?this.screen.program.source.length:lineEnd;this.screen.cursor=lineStart;this.screen.selectionEnd=end;this.programInsert('');return;}this.screen=null;}if(this.on&&!this.error&&!this.menu&&!this.screen&&this.mode==='BASE-N'){if(!this.shift&&!this.alpha){if(id==='function'){this.openMenu('baseLogic');return;}const baseMap={square:'DEC',log:'HEX',ln:'BIN',power:'OCT'};if(baseMap[id]){this.base=baseMap[id];this.refreshResult();return;}if(this.base==='HEX'){const hexMap={i:'A',fraction:'B',dms:'C',sin:'D',cos:'E',tan:'F'};if(hexMap[id]){this.insert(hexMap[id]);return;}}}}if(this.on&&!this.error&&!this.menu&&this.screen&&!['shift','alpha'].includes(id)&&!(this.shift&&id==='mode')&&this.screenKey(key))return;const action=super.press(key);if(action?.tool)this.openTool(action.tool,action.operation);return;}catch(e){this.error=e.message||'Math ERROR';}}
  }
  root.CalLCD={Machine};if(typeof module!=='undefined')module.exports=root.CalLCD;
})(typeof globalThis!=='undefined'?globalThis:this);
