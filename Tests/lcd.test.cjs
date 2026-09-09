const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../CaLSimulator/Resources/engine.js');
const natural=require('../Preview/natural.js');
const {Machine}=require('../Preview/lcd.js');
const keys=require('../Preview/keys.js').rows.flat();
const make=()=>new Machine(engine,natural);
const press=(m,...ids)=>ids.forEach(id=>m.press(keys.find(k=>k[0]===id)||[id,id]));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('inverse trig uses SHIFT, principal values, exact radians and recoverable domains',()=>{
 for(const [key,input,deg] of [['sin','0.5',30],['cos','0.5',60],['tan','1',45]]){
  for(const angle of ['DEG','RAD','GRA']){const m=make();m.angle=angle;press(m,'shift',key);assert.match(m.editor.html(),/sup class="inverse"/);m.insert(input);press(m,'exe');assert.equal(m.error,null);near(m.value.re,deg*(angle==='DEG'?1:angle==='RAD'?Math.PI/180:10/9));if(angle==='RAD')assert.match(m.result,/π/);}
 }
 const m=make();press(m,'shift','sin','2','exe');assert.match(m.error,/domain/);press(m,'ac','shift','cos','1','exe');assert.equal(m.result,'0');
 near(engine.dispatch({action:'evaluate',expression:'arc sin(0.5)',angle:'DEG'}).value.re,30);
});
test('MODE, SETUP and FUNCTION page order and nested EXIT',()=>{
 const m=make();press(m,'mode');assert.match(m.menuText(),/5:PROG  6:RECUR/);press(m,'down');assert.match(m.menuText(),/1:LINK  2:MEMORY/);press(m,'exit','shift','mode','down');assert.match(m.menuText(),/1:ab\/c  2:d\/c/);press(m,'5','1');assert.equal(m.frequency,true);press(m,'function');assert.match(m.menuText(),/1:MATH  2:COMPLX/);press(m,'1','down','down');assert.match(m.menuText(),/sinh⁻¹/);press(m,'exit');assert.equal(m.menu.kind,'functions');
});
test('all supported modes open LCD state without tool actions',()=>{
 for(let i=1;i<=8;i++){const m=make();press(m,'mode',String(i));assert.equal(m.error,null);assert.ok(i===1||m.menu||m.screen);}
});
test('TABLE accepts natural expression and range on LCD',()=>{
 const m=make();press(m,'mode','7','exe','1','exe','3','exe','1','exe');assert.equal(m.error,null);assert.deepEqual(m.screen.lines,['1  1','2  4','3  9']);press(m,'exit');assert.equal(m.screen.type,'wizard');
});
test('matrix coefficients, store and determinant through physical menus',()=>{
 const m=make();press(m,'function','8','1','1','exe','exe');for(const v of ['1','2','3','4'])press(m,v,'exe');assert.equal(m.error,null);assert.deepEqual(m.matrices.A,[[1,2],[3,4]]);press(m,'exit','exit','3','function','8','2','1','exe');assert.equal(m.result,'-2');
});
test('quadratic and simultaneous equation coefficient entry',()=>{
 const m=make();press(m,'mode','8','down','1','1','exe','negative','3','exe','2','exe');assert.equal(m.error,null);assert.deepEqual(m.screen.lines,['X1=2','X2=1']);
 const n=make();press(n,'mode','8','1');for(const v of [1,1,3,1,-1,1]){n.insert(String(v));press(n,'exe');}assert.equal(n.error,null);assert.deepEqual(n.screen.lines,['X1=2','X2=1']);
});
test('SD stores rows and excludes uncommitted empty row',()=>{
 const m=make();press(m,'mode','3','1','exe','2','exe','3','exe','calc');assert.equal(m.error,null);assert.ok(m.screen.lines.includes('n=3'));assert.ok(m.screen.lines.includes('mean=2'));
});
test('program sample runs and edits entirely within LCD',()=>{
 const m=make();press(m,'mode','5','2','exe');assert.equal(m.error,null);assert.ok(m.screen.lines.includes('1003'));press(m,'exit','exit','3','exe');assert.equal(m.screen.type,'program');press(m,'exe','1');assert.ok(m.screen.program.source.endsWith('\n1'));press(m,'exit');assert.equal(m.menu.kind,'program');assert.ok(new Machine(engine,natural,m.snapshot()).programs[0].source.endsWith('\n1'));
});
test('calculus and new MATH operations return finite results',()=>{
 const m=make();press(m,'function','1','3','exe','2','exe');assert.equal(m.error,null);near(Number(m.screen.lines[0]),2);
 for(const [expression,value] of [['Int(-2.3)',-2],['Intg(-2.3)',-3],['Frac(-2.3)',-.3],['logab(2,8)',3]])near(engine.dispatch({action:'evaluate',expression}).value.re,value);
});
test('SETUP choices persist and polar complex output changes',()=>{
 const m=make();press(m,'shift','mode','down','4','2');m.insert('1+i');press(m,'exe');assert.match(m.result,/∠45/);const n=new Machine(engine,natural,m.snapshot());assert.equal(n.complexFormat,'r∠θ');
});
test('LCD preview has no popup APIs or dialog markup',()=>{
 const fs=require('node:fs');assert.doesNotMatch(fs.readFileSync('Preview/index.html','utf8'),/<dialog/);assert.doesNotMatch(fs.readFileSync('Preview/preview.js','utf8'),/showModal|window\.prompt|window\.alert/);
});
test('regression models reproduce known curves and reject invalid domains',()=>{
 const m=make();for(const [model,fn,a,b] of [['Line',x=>2+3*x,2,3],['Log',x=>2+3*Math.log(x),2,3],['eExp',x=>2*Math.exp(.3*x),2,.3],['abExp',x=>2*3**x,2,3],['Power',x=>2*x**3,2,3],['Inv',x=>2+3/x,2,3]]){m.regModel=model;const r=m.regressionResult([1,2,3,4].map(x=>[x,fn(x)]));near(r.a,a);near(r.b,b);}
 m.regModel='Quad';const r=m.regressionResult([1,2,3,4].map(x=>[x,2+3*x+4*x*x]));near(r.a,2);near(r.b,3);near(r.c,4);
 m.regModel='Log';assert.throws(()=>m.regressionResult([[0,1],[1,2]]),/X > 0/);
});
test('statistics edits retain later rows and VAR inserts selected statistic',()=>{
 const m=make();press(m,'mode','3','1','exe','2','exe','3','exe','up','up','up','4','exe','function','2','2','exe');assert.equal(m.error,null);assert.equal(m.result,'3');assert.equal(m.statRows.length,3);
});
test('DISTR CDF and random menu evaluate instead of inserting unsupported tokens',()=>{
 const m=make();press(m,'function','7','3','1','0','exe');assert.equal(m.error,null);near(Number(m.screen.lines[0]),.5);
 const n=make();press(n,'function','1','6','exe');assert.equal(n.error,null);assert.ok(n.value.re>=0&&n.value.re<1);
});
test('base signed and unsigned settings affect conversion',()=>{
 assert.equal(engine.dispatch({action:'base',expression:'FFFFFFFF',from:16,to:10,signed:true}).text,'-1');
 assert.equal(engine.dispatch({action:'base',expression:'FFFFFFFF',from:16,to:10,signed:false}).text,'4294967295');
 assert.equal(engine.dispatch({action:'base',expression:'-1',from:10,to:16,signed:true}).text,'FFFFFFFF');
 assert.throws(()=>engine.dispatch({action:'base',expression:'-1',from:10,to:16,signed:false}),/range/);
});
test('engineering SETUP output is not overwritten by exact fraction rendering',()=>{
 const m=make();press(m,'shift','mode','down','3','1');m.insert('12345');press(m,'exe');assert.equal(m.result,'12.345×10^3');assert.equal(m.resultHTML,null);
});

test('DMS physical key enters components, carries seconds and toggles decimal',()=>{
 const m=make();press(m,'2','dms','2','0','dms','3','0','dms','plus','0','dms','3','9','dms','3','0','dms','exe');assert.equal(m.error,null);assert.equal(m.result,'3°0′0″');press(m,'dms');assert.equal(m.result,'3');press(m,'dms');assert.equal(m.result,'3°0′0″');
 press(m,'ac','2','dms','2','0','dms','multiply','3','dot','5','exe');assert.equal(m.result,'8°10′0″');
 press(m,'ac','2','dot','2','5','5','exe','dms');assert.equal(m.result,'2°15′18″');
 assert.equal(m.dmsText({re:1+59/60+59.9999999/3600,im:0}),'2°0′0″');
});
test('matrix expressions support inverse, multiplication, transpose and Mat Ans',()=>{
 const m=make();m.matrices.A=[[1,2],[3,4]];m.matrices.B=[[2,0],[0,2]];
 press(m,'function','8','2','1','shift','close','multiply','function','8','2','1','exe');assert.equal(m.error,null);m.matrices.Ans.flat().forEach((x,i)=>near(x,[1,0,0,1][i]));assert.equal(m.screen.readonly,true);
 press(m,'multiply','2','exe');assert.equal(m.error,null);m.matrices.Ans.flat().forEach((x,i)=>near(x,[2,0,0,2][i]));
 const r=engine.dispatch({action:'matrixExpression',expression:'Trn(MatA)+MatB',matrices:m.matrices}).result;assert.deepEqual(r,[[3,3],[2,6]]);
});
test('matrix saves each EXE and reopens at existing dimensions without a wizard',()=>{
 const m=make();m.editMatrix('A');press(m,'exe','exe','7','exe','exit');assert.equal(m.matrices.A[0][0],7);press(m,'exe');assert.equal(m.screen.type,'grid');assert.equal(m.screen.data[0][0],7);
});
test('program input occurs in execution order, repeats in loops, and display pauses',()=>{
 const m=make();m.runProgram({name:'INPUT',source:'For 1→N To 2\n?→A\nA*2◢\nNext'});
 assert.equal(m.screen.fields[0][0],'A');press(m,'3','exe');assert.equal(m.screen.type,'programPause');assert.equal(m.screen.lines[0],'6');press(m,'exe');assert.equal(m.screen.fields[0][0],'A');press(m,'4','exe');assert.equal(m.screen.lines[0],'8');press(m,'exe');assert.equal(m.running,null);assert.equal(m.variables.A.re,4);
 const n=make();n.runProgram({name:'BRANCH',source:'If 0\nThen\n?→A\nIfEnd\n7'});assert.equal(n.screen.type,'output');assert.deepEqual(n.screen.lines,['7']);
});
test('program physical arrows and DEL edit at cursor rather than append',()=>{
 const m=make(),program={name:'EDIT',source:'123'};m.screen={type:'program',title:'EDIT',program};press(m,'left','del','9');assert.equal(program.source,'193');press(m,'exe');assert.equal(program.source,'19\n3');
});
