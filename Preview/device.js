(function(root){
  'use strict';
  class Machine {
    constructor(engine,natural,saved={}){
      this.engine=engine;this.natural=natural;this.editor=new natural.Editor();
      this.variables=saved.variables||{};this.angle=saved.angle||'DEG';this.history=Array.isArray(saved.history)?saved.history:[];this.historyIndex=this.history.length;
      this.display=saved.display||'MthIO';this.numberMode=saved.numberMode||'Norm';this.digits=saved.digits??10;this.norm=saved.norm||2;
      this.ansExactSource=typeof saved.ansExactSource==='string'&&saved.ansExactSource.length<=4096?saved.ansExactSource:null;
      this.on=true;this.shift=false;this.alpha=false;this.lock=false;this.done=false;this.result='0';this.value={re:0,im:0};this.menu=null;this.memory=null;this.assignment=null;this.error=null;this.decimal=false;this.mixed=false;this.resultSource='0';this.resultHTML=null;
    }
    get expression(){return this.editor.source;}
    set expression(s){this.editor.load(s);}
    get cursor(){return this.editor.pos;}
    set cursor(p){this.editor.pos=Math.min(p,this.editor.seq.length);}
    get active(){return this.assignment&&!this.assignment.solved?this.assignment.entry:this.editor;}
    dispatch(r){return this.engine.dispatch({...r,variables:JSON.parse(JSON.stringify(r.variables||this.variables)),angle:this.angle});}
    snapshot(){return {variables:this.variables,angle:this.angle,history:this.history,display:this.display,numberMode:this.numberMode,digits:this.digits,norm:this.norm,ansExactSource:this.ansExactSource};}
    clear(){this.editor.clear();this.value={re:0,im:0};this.result='0';this.resultSource='0';this.resultHTML=null;this.error=null;this.done=false;this.shift=false;this.alpha=false;this.lock=false;this.assignment=null;this.menu=null;this.memory=null;this.decimal=false;}
    startEntry(chain=false){if(this.done){this.editor.clear();if(chain)this.editor.insert('Ans');this.done=false;this.resultHTML=null;this.result='';}}
    insert(s){
      this.error=null;
      if(this.assignment){if(this.assignment.solved){this.assignment=null;this.startEntry();}else {this.assignment.entry.insert(s);this.assignment.ready=false;return;}}
      this.startEntry(['+','−','×','÷','^','^2','^(-1)','!','%'].includes(s));this.menu=null;this.editor.insert(s);
    }
    numericText(value=this.value){
      if(value.im)return this.engine.format(value);const n=value.re;
      if(this.numberMode==='Fix')return n.toFixed(this.digits);
      if(this.numberMode==='Sci')return n.toExponential(this.digits-1).replace('e','×10^');
      if(n!==0&&(Math.abs(n)<(this.norm===1?.01:1e-9)||Math.abs(n)>=1e10))return Number(n.toPrecision(10)).toExponential().replace('e','×10^');
      return this.engine.format(value);
    }
    refreshResult(){
      this.result=this.numericText();this.resultHTML=null;
      if(this.display==='MthIO'&&this.numberMode==='Norm'&&!this.decimal){
        const exact=this.natural.exactOutput(this.resultSource,this.value,this.mixed,this.angle);
        if(exact){this.result=exact.text;this.resultHTML=exact.html;}
      }
    }
    accept(answer,expression=this.expression,tree=null){
      if(expression!==this.expression){if(tree)this.editor.restore(tree);else this.editor.load(expression);}
      this.value=answer.value;this.variables=answer.variables||this.variables;this.variables.Ans={...answer.value};if(answer.store)this.variables[answer.store]={...answer.value};
      this.done=true;this.decimal=false;this.error=null;
      const expanded=this.ansExactSource?expression.replace(/\bAns\b/g,()=>`(${this.ansExactSource})`):expression;
      this.resultSource=expanded.length<=4096?expanded:expression;this.ansExactSource=this.resultSource;this.engExponent=undefined;this.refreshResult();
      this.history.push({expression,result:this.result,tree:this.editor.snapshot()});this.history=this.history.slice(-100);this.historyIndex=this.history.length;
    }
    calculate(){
      if(!this.expression)return;
      const source=this.editor.complete();
      this.accept(this.dispatch({action:'evaluate',expression:source}),source);
    }
    recall(item){if(item.tree)this.editor.restore(item.tree);else this.editor.load(item.expression);this.done=false;this.result=item.result;this.resultHTML=null;this.menu=null;this.error=null;}
    memoryUpdate(subtract){if(!this.done&&this.expression)this.calculate();const m=this.variables.M||{re:0,im:0},sign=subtract?-1:1;this.variables.M={re:m.re+sign*this.value.re,im:m.im+sign*this.value.im};}
    beginAssignment(kind){
      this.error=null;const source=this.editor.complete();if(!source)throw Error('Syntax ERROR: enter an expression');
      let evaluation=source;
      if(kind==='calc'){const eq=/^([A-Z])=(.+)$/.exec(source);if(eq)evaluation=eq[2]+'→'+eq[1];}
      const vars=this.dispatch({action:'variables',expression:evaluation.replace(/→[A-Z]$/,'')}).names;
      if(kind==='solve'&&!vars.length)throw Error('Variable ERROR: enter A–Z');
      if(kind==='calc'&&!vars.length){this.accept(this.dispatch({action:'evaluate',expression:evaluation}),source);return;}
      this.assignment={kind,source,evaluation,vars,index:0,entry:new this.natural.Editor(),ready:false,solved:false};this.menu=null;this.done=false;
    }
    assignmentValue(name){return this.variables[name]||{re:this.assignment.kind==='solve'&&name==='X'?1:0,im:0};}
    commitAssignment(){
      const a=this.assignment,name=a.vars[a.index];
      if(a.entry.source){const answer=this.dispatch({action:'evaluate',expression:a.entry.complete()});if(answer.value.im)throw Error('Math ERROR: real value required');this.variables[name]=answer.value;a.entry.clear();}
      else if(!this.variables[name])this.variables[name]=this.assignmentValue(name);
    }
    assignmentKey(id,value){
      const a=this.assignment;
      if(a.solved){if(id==='exe'||id==='solve'){a.solved=false;a.entry.clear();a.ready=false;this.done=false;return true;}this.assignment=null;this.done=true;return false;}
      if(id==='exit'){this.assignment=null;return true;}
      if(id==='up'||id==='down'){this.commitAssignment();a.index=(a.index+(id==='up'?-1:1)+a.vars.length)%a.vars.length;a.ready=false;return true;}
      if(id==='left'||id==='right'){a.entry.move(id);return true;}
      if(id==='del'){a.entry.backspace();return true;}
      if(id==='exe'){
        if(a.kind==='calc'&&a.ready&&!a.entry.source){this.finishCalc();return true;}
        this.commitAssignment();
        if(a.index<a.vars.length-1)a.index++;else a.ready=true;
        return true;
      }
      if(id==='calc'&&a.kind==='calc'){this.commitAssignment();this.finishCalc();return true;}
      if(id==='solve'&&a.kind==='solve'){
        this.commitAssignment();const name=a.vars[a.index];
        const answer=this.dispatch({action:'solve',expression:a.source,variable:name,guess:this.variables[name].re});
        this.variables[name]={re:answer.x,im:0};this.value={re:answer.x,im:0};this.variables.Ans={...this.value};this.result=this.numericText();this.resultHTML=null;
        a.solved=true;a.solution=name;a.residual=answer.residual;this.done=true;this.ansExactSource=String(answer.x);return true;
      }
      return false;
    }
    finishCalc(){const a=this.assignment;const answer=this.dispatch({action:'evaluate',expression:a.evaluation});this.assignment=null;this.accept(answer,a.source);}
    menuText(){
      if(!this.menu)return null;const {kind,page=0}=this.menu;
      const menus={
        mode:['1:COMP  2:BASE-N\n3:SD    4:REG\n5:PROG  6:RECUR\n7:TABLE 8:EQN','1:LINK\n2:MEMORY\n3:SYSTEM'],
        setup:['1:MthIO 2:LineIO\n3:Deg 4:Rad 5:Gra\n6:Fix 7:Sci\n8:Norm     ▼'],
        functions:['1:MATH  2:TRIG\n3:COMPLX 4:PROG\n5:MATRIX 6:MEMORY'],
        math:['1:Abs  2:nCr\n3:nPr  4:x!\n5:∫dx  6:d/dx\n7:Σ    8:Rnd'],
        trig:['1:sinh 2:cosh\n3:tanh 4:asinh\n5:acosh 6:atanh'],
        complex:['1:Conjg 2:Abs\n3:Arg   4:ReP\n5:ImP   6:i'],
        fix:['Fix 0~9?'],sci:['Sci 0~9?\n0 = 10 digits'],norm:['Norm 1~2?'],
        formula:['1:πR²   2:2πR\n3:BH/2  4:√(A²+B²)\n5:4πR³/3 6:πR²H\n              ▼','1:D/T   2:MA\n3:MV²/2 4:IR\n5:Compound interest\n6:Distance    ▲'],
        memory:[Object.keys(this.variables).length?Object.entries(this.variables).slice(page*3,page*3+3).map(([k,v])=>`${k}=${this.engine.format(v)}`).join('\n')+'\n          ▲ ▼':'MEMORY\nAll variables = 0'],
        system:['1:Clear variables\n2:Clear history\nEXIT:Cancel'],confirm:['Reset?\nEXE:Yes EXIT:No'],link:['LINK\nNot supported\nEXIT:Back']
      };
      return menus[kind]?.[Math.min(page,(menus[kind]?.length||1)-1)]||'';
    }
    menuKey(id){
      if(!this.menu)return false;const {kind}=this.menu,digit=Number(id);
      if(id==='exit'||id==='mode'){this.menu=null;return true;}
      if(id==='up'||id==='down'){if(['mode','formula'].includes(kind))this.menu.page=(this.menu.page||0)?0:1;else if(kind==='memory')this.menu.page=Math.max(0,Math.min(Math.ceil(Object.keys(this.variables).length/3)-1,(this.menu.page||0)+(id==='down'?1:-1)));return true;}
      if(kind==='confirm'&&id==='exe'){if(this.menu.target===1)this.variables={};else this.history=[];this.menu=null;return true;}
      if(!/^\d$/.test(id))return true;
      if(kind==='mode'){
        if(this.menu.page){if(digit===1)this.menu={kind:'link'};if(digit===2)this.menu={kind:'memory'};if(digit===3)this.menu={kind:'system'};return true;}
        const tool=['','comp','base','statistics','regression','program','recurrence','table','equation'][digit];if(tool){this.menu=null;return tool==='comp'?true:{tool};}
      }else if(kind==='setup'){
        if(digit===1||digit===2){this.display=digit===1?'MthIO':'LineIO';this.menu=null;this.refreshResult();}
        else if(digit>=3&&digit<=5){this.angle=['DEG','RAD','GRA'][digit-3];this.menu=null;}
        else if(digit>=6&&digit<=8)this.menu={kind:['fix','sci','norm'][digit-6]};
      }else if(kind==='fix'||kind==='sci'){this.numberMode=kind==='fix'?'Fix':'Sci';this.digits=kind==='fix'?digit:digit||10;this.menu=null;this.refreshResult();}
      else if(kind==='norm'&&(digit===1||digit===2)){this.numberMode='Norm';this.norm=digit;this.menu=null;this.refreshResult();}
      else if(kind==='functions'){
        const next=['','math','trig','complex','program','matrix','memory'][digit];if(next){if(next==='program'||next==='matrix'){this.menu=null;return {tool:next};}this.menu={kind:next};}
      }else if(['math','trig','complex'].includes(kind)){
        const choices={math:['','abs(','nCr(','nPr(','!','integral','derivative','sum','Rnd('],trig:['','sinh(','cosh(','tanh(','asinh(','acosh(','atanh('],complex:['','Conjg(','abs(','Arg(','ReP(','ImP(','i']};
        const s=choices[kind][digit];if(s){this.menu=null;if(['integral','derivative','sum'].includes(s))return {tool:'calculus',operation:s};this.insert(s);}
      }else if(kind==='formula'){
        const formula=['pi×R^2','2×pi×R','B×H/2','sqrt(A^2+B^2)','4×pi×R^3/3','pi×R^2×H','D/T','M×A','M×V^2/2','I×R','P×(1+R/100)^N','sqrt((C-A)^2+(D-B)^2)'][(this.menu.page||0)*6+digit-1];
        if(digit>=1&&digit<=6&&formula){this.clear();this.editor.load(formula);this.beginAssignment('calc');}
      }else if(kind==='system'&&(digit===1||digit===2))this.menu={kind:'confirm',target:digit};
      return true;
    }
    press(key){
      const [id,label,value,shiftValue,alpha]=key;
      try{
        if(!this.on){if(id==='ac'){this.on=true;this.clear();}return;}
        if(id==='ac'&&!this.shift){this.clear();return;}
        if(this.error){if(['left','right','del','exit'].includes(id)){this.error=null;}else if(id!=='shift')return;}
        if(id==='shift'){this.shift=!this.shift;this.alpha=false;return;}
        if(id==='alpha'){if(this.shift){this.lock=!this.lock;this.alpha=this.lock;this.shift=false;}else{this.alpha=!this.alpha;this.lock=false;}return;}
        if(this.memory&&alpha&&/^[A-Z]$/.test(alpha)){
          if(this.memory==='STO'){if(!this.done&&this.expression)this.calculate();this.variables[alpha]={...this.value};}else this.insert(alpha);
          this.memory=null;this.alpha=false;return;
        }
        if(this.alpha&&(id==='rcl'||id==='calc')){this.insert('=');if(!this.lock)this.alpha=false;return;}
        if(this.alpha&&alpha){this.insert(alpha);if(!this.lock)this.alpha=false;return;}
        if(this.shift){
          this.shift=false;
          switch(id){
            case'mode':this.assignment=null;this.menu={kind:'setup'};return;
            case'ac':this.on=false;return;
            case'rcl':this.memory='STO';return;
            case'memory':this.memoryUpdate(true);return;
            case'file':return {tool:'program'};
            case'fraction':this.startEntry();this.active.fraction(true);return;
            case'sd':this.mixed=!this.mixed;this.decimal=false;this.refreshResult();return;
            case'power':this.startEntry();this.active.template('nthroot');return;
            case'dot':return {tool:'matrix'};
            case'del':return;
            case'multiply':case'divide':{const n=this.value.re;if(n&&this.value.im===0){const previous=this.engExponent??Math.floor(Math.log10(Math.abs(n))/3)*3;this.engExponent=previous+(id==='multiply'?-3:3);this.result=`${Number((n/10**this.engExponent).toPrecision(10))}×10^${this.engExponent}`;this.resultHTML=null;}return;}
            default:if(shiftValue)this.insert(shiftValue);return;
          }
        }
        if(this.menu)return this.menuKey(id);
        if(this.assignment&&this.assignmentKey(id,value))return;
        switch(id){
          case'exit':this.menu=null;this.assignment=null;this.memory=null;this.shift=false;this.alpha=false;return;
          case'exe':this.calculate();return;
          case'del':this.done=false;this.editor.backspace();return;
          case'mode':this.menu={kind:'mode',page:0};this.assignment=null;return;
          case'function':this.menu={kind:'functions'};return;
          case'fmla':this.menu={kind:'formula',page:0};return;
          case'file':return {tool:'program'};
          case'calc':case'solve':this.beginAssignment(id);return;
          case'rcl':this.memory='RCL';return;
          case'memory':this.memoryUpdate(false);return;
          case'sd':this.decimal=!this.decimal;this.refreshResult();return;
          case'fraction':this.startEntry(true);this.active.fraction();return;
          case'left':case'right':this.done=false;this.editor.move(id);return;
          case'up':case'down':if(!this.done&&this.editor.move(id))return;if(this.history.length){this.historyIndex=Math.max(0,Math.min(this.history.length-1,this.historyIndex+(id==='up'?-1:1)));this.recall(this.history[this.historyIndex]);}return;
          default:this.insert(value||label);return;
        }
      }catch(error){this.error=error.message||'Math ERROR';}
    }
  }
  root.CalDevice={Machine};if(typeof module!=='undefined')module.exports=root.CalDevice;
})(typeof globalThis!=='undefined'?globalThis:this);
