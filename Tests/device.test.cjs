const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../CaLSimulator/Resources/engine.js');
const natural=require('../Preview/natural.js');
const {Machine}=require('../Preview/device.js');
const {rows}=require('../Preview/keys.js');
const keys=rows.flat();
const make=()=>new Machine(engine,natural);
const press=(m,...ids)=>ids.forEach(id=>m.press(keys.find(k=>k[0]===id)||[id,id]));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('EXE uses operator precedence and next operation chains Ans',()=>{
 const m=make();press(m,'2','plus','3','multiply','4','exe');assert.equal(m.result,'14');press(m,'multiply','2','exe');assert.equal(m.result,'28');press(m,'7','exe');assert.equal(m.result,'7');
});
test('blank fraction: numerator → Down → denominator → EXE, and decimal toggle',()=>{
 const m=make();press(m,'fraction','1','down','2','exe');assert.equal(m.error,null);assert.equal(m.result,'1/2');assert.match(m.resultHTML,/math-frac/);press(m,'sd');assert.equal(m.result,'0.5');press(m,'sd');assert.equal(m.result,'1/2');
});
test('fractions wrap existing number and navigate out with Right',()=>{
 const m=make();press(m,'1','fraction','2','right','plus','1','fraction','3','exe');assert.equal(m.error,null);assert.equal(m.result,'5/6');near(m.value.re,5/6);
});
test('fraction numerator can contain expression and vertical editing preserves slots',()=>{
 const m=make();press(m,'fraction','1','plus','2','down','2','multiply','3','exe');assert.equal(m.result,'1/2');press(m,'up','left','up','del','4','exe');assert.equal(m.error,null);assert.equal(m.result,'5/6');
});
test('sqrt needs no trailing closing parenthesis and simplifies square factors',()=>{
 const m=make();press(m,'sqrt','8','exe');assert.equal(m.result,'2√2');assert.match(m.resultHTML,/math-root/);press(m,'sd');near(Number(m.result),Math.sqrt(8));
});
test('sqrt containing fraction renders radical svg and evaluates exactly',()=>{
 const m=make();
 press(m,'sqrt','fraction','1','2','0','0','down','3','exe');
 assert.equal(m.error,null);
 assert.equal(m.result,'20');
 assert.match(m.editor.html(false),/<svg/);
 assert.match(m.editor.html(false),/math-frac/);

 const k=make();
 press(k,'sqrt','fraction','5','down','2','exe');
 assert.equal(k.error,null);
 assert.equal(k.result,'√10/2');
 assert.match(k.resultHTML,/<span class="math-frac">/);
 assert.match(k.resultHTML,/<span class="math-root">/);
 assert.match(k.resultHTML,/<svg/);
});
test('nested roots and powers can be evaluated before leaving the last slot',()=>{
 const m=make();press(m,'sqrt','sqrt','1','6','exe');near(m.value.re,2);
 const n=make();press(n,'2','power','3','right','plus','1','exe');assert.equal(n.result,'9');
});
test('power with empty base creates empty base and exp slots without error',()=>{
 const m=make();
 press(m,'power');
 assert.equal(m.error,null);
 assert.match(m.editor.html(true),/math-power/);
 assert.equal((m.editor.html(true).match(/math-empty/g)||[]).length,2);
 press(m,'2','up','3','exe');
 assert.equal(m.error,null);
 assert.equal(m.result,'8');
 const n=make();
 press(n,'power','del');
 assert.equal(n.expression,'');
});
test('square and general power preserve following operations',()=>{
 const m=make();press(m,'5','square','plus','1','exe');assert.equal(m.result,'26');assert.match(m.editor.html(false),/math-power/);
});
test('function input closes automatically at EXE; SHIFT inverse trig uses angle setup',()=>{
 const m=make();press(m,'shift','sin','0','dot','5','exe');near(m.value.re,30);press(m,'ac','shift','mode','4','sin');m.insert('pi');press(m,'divide','2','exe');near(m.value.re,1);
});
test('power root uses separate index and radicand slots',()=>{
 const m=make();press(m,'shift','power','3','down','2','7','exe');near(m.value.re,3);
});
test('mixed fraction and improper fraction display toggle',()=>{
 const m=make();press(m,'shift','fraction','2','right','1','down','3','exe');assert.equal(m.result,'7/3');press(m,'shift','sd');assert.equal(m.result,'2 1/3');
});
test('empty structural slots fail without losing the entered numerator',()=>{
 const m=make();press(m,'fraction','1','exe');assert.match(m.error,/empty input/);press(m,'right','down','2','exe');assert.equal(m.error,null);assert.equal(m.result,'1/2');
});
test('backspace at empty fraction removes the structure and returns to the parent',()=>{
 const m=make();press(m,'fraction','del','7','exe');assert.equal(m.result,'7');
});
test('CALC prompts variables in order, confirms them, then evaluates on LCD',()=>{
 const m=make();m.expression='3×A+B';press(m,'calc');assert.equal(m.assignment.vars.join(','),'A,B');press(m,'5','exe','3','exe');assert.equal(m.assignment.ready,true);press(m,'exe');assert.equal(m.result,'18');assert.equal(m.assignment,null);press(m,'calc','down','1','0','exe','exe');assert.equal(m.result,'25');
});
test('CALC formula equality assigns the left-side variable instead of comparing',()=>{
 const m=make();m.expression='Y=A×B';press(m,'calc','3','exe','4','exe','exe');assert.equal(m.result,'12');assert.equal(m.variables.Y.re,12);
});
test('ALPHA RCL enters equation equality; SOLVE uses keypad initial value',()=>{
 const m=make();press(m,'alpha','0','square','alpha','rcl','2','solve');assert.equal(m.assignment.source.includes('='),true);press(m,'1','solve');assert.equal(m.error,null);assert.equal(m.assignment.solved,true);near(m.variables.X.re,Math.sqrt(2));near(m.assignment.residual,0);press(m,'exe');assert.equal(m.assignment.solved,false);
});
test('SOLVE selects any variable via arrows, not only X',()=>{
 const m=make();m.expression='Y=A×X^2+B';press(m,'solve');assert.deepEqual(m.assignment.vars,['Y','A','X','B']);press(m,'0','exe','1','exe','1','exe','negative','2','exe','up','solve');assert.equal(m.error,null);near(m.variables.X.re,Math.sqrt(2));
 const n=make();n.expression='A×3=12';press(n,'solve','1','solve');assert.equal(n.assignment.solution,'A');near(n.variables.A.re,4);
});
test('failed SOLVE retains equation and all assigned values for another guess',()=>{
 const m=make();m.expression='X^2+1';press(m,'solve','0','solve');assert.match(m.error,/Cannot Solve/);assert.ok(m.assignment);press(m,'exit');assert.equal(m.error,null);assert.equal(m.assignment,null);assert.match(m.expression,/X/);
});
test('SETUP lives on LCD and persists display, angle and FIX/SCI/NORM',()=>{
 const m=make();press(m,'shift','mode','6','3');assert.equal(m.numberMode,'Fix');press(m,'1','divide','7','exe');assert.equal(m.result,'0.143');press(m,'shift','mode','7','4');assert.equal(m.result,'1.429×10^-1');press(m,'shift','mode','8','2');assert.equal(m.result,'1/7');const restored=new Machine(engine,natural,m.snapshot());assert.equal(restored.display,'MthIO');assert.equal(restored.norm,2);
 assert.match(natural.numericHTML('1.429×10^-1'),/<sup>−1<\/sup>/);
});
test('FUNCTION and FMLA use numeric LCD selections',()=>{
 const m=make();press(m,'function','1','2','5','comma','2','exe');assert.equal(m.result,'10');press(m,'ac','fmla','2','1','2','exe','exe');near(m.value.re,4*Math.PI);
});
test('STO/RCL, AC and M+ do not reuse a cleared value',()=>{
 const m=make();press(m,'8','exe','shift','rcl','i');assert.equal(m.variables.A.re,8);press(m,'ac','rcl','i','exe');assert.equal(m.value.re,8);press(m,'memory','ac','memory');assert.equal(m.variables.M.re,8);assert.equal(m.variables.Ans.re,8);
});
test('replay restores the structured expression; input persists across OFF/ON correctly',()=>{
 const m=make();press(m,'sqrt','2','exe','ac','up');assert.match(m.editor.html(false),/math-root/);press(m,'exe');assert.equal(m.result,'√2');press(m,'shift','ac');assert.equal(m.on,false);press(m,'9');assert.equal(m.on,false);press(m,'ac');assert.equal(m.on,true);assert.equal(m.result,'0');
});
test('imported expressions preserve precedence and natural structures',()=>{
 for(const s of ['X^2+2×X+1','sqrt(2)+sqrt(8)','pi×R^2×H','(2+3)^2','2^-3','1/2+1/3','sqrt((C-A)^2+(D-B)^2)','nCr(5,2)']){
  const e=new natural.Editor();e.load(s);const vars={X:3,R:2,H:4,A:1,B:2,C:4,D:6};near(engine.evaluate(e.complete(),vars).re,engine.evaluate(s,vars).re);
 }
});
test('exact arithmetic handles rationals, simplified radicals, rationalization and pi',()=>{
 for(const [s,expected]of [['sqrt(8)','2√2'],['sqrt(2)+sqrt(8)','3√2'],['1/sqrt(2)','√2/2'],['sqrt(2)^2','2'],['pi/3','π/3'],['1/2+1/3','5/6'],['1/(1+sqrt(2))','−1+√2']]){
  const r=natural.exactOutput(s,engine.evaluate(s));assert.ok(r,s);assert.equal(r.text,expected,s);
 }
});
test('exact display does not invent a surd/pi result from a nearby decimal',()=>{
 assert.equal(natural.exactOutput('sin(1)',engine.evaluate('sin(1)')),null);
 const r=natural.exactOutput('1.41421356237',engine.evaluate('1.41421356237'));assert.ok(!r||!r.text.includes('√'));
 assert.equal(natural.exactOutput('sqrt(-1)',engine.evaluate('sqrt(-1)')),null);
});
test('Ans retains an exact radical across a chained operation and AC',()=>{
 const m=make();press(m,'sqrt','2','exe','multiply','2','exe');assert.equal(m.result,'2√2');press(m,'ac','shift','negative','divide','2','exe');assert.equal(m.result,'√2');
});
test('negative mixed fractions use a negative sign for the entire number',()=>{
 const m=make();press(m,'shift','fraction','negative','2','right','1','down','3','exe');assert.equal(m.result,'−7/3');near(m.value.re,-7/3);
});
test('special trig angles get algebraic output in the configured unit',()=>{
 for(const [s,angle,expected]of [['sin(30)','DEG','1/2'],['cos(45)','DEG','√2/2'],['tan(60)','DEG','√3'],['sin(pi/3)','RAD','√3/2'],['cos(200)','GRA','−1'],['sin(270)','DEG','−1']])assert.equal(natural.exactOutput(s,engine.evaluate(s,{},angle),false,angle).text,expected);
});
test('typing after a SOLVE result begins a new calculation',()=>{
 const m=make();m.expression='X+1=3';press(m,'solve','solve','7','exe');assert.equal(m.assignment,null);assert.equal(m.result,'7');
});

test('Replay navigation: left/right on result enters editing at end/start; up/down navigates history',()=>{
  const m=make();
  press(m,'1','plus','2','exe');
  assert.equal(m.done,true);
  assert.equal(m.result,'3');

  // Pressing left on result jumps to the end for editing
  press(m,'left');
  assert.equal(m.done,false);
  assert.equal(m.editor.pos,m.editor.tree.length);

  // Re-calculate and test right arrow jumps to the beginning
  press(m,'exe');
  assert.equal(m.done,true);
  press(m,'right');
  assert.equal(m.done,false);
  assert.equal(m.editor.pos,0);

  // DEL on result enters editing from the end and removes last token
  press(m,'exe');
  assert.equal(m.done,true);
  press(m,'del');
  assert.equal(m.done,false);
  assert.equal(m.expression,'1+');

  // History scrolling across multiple calculations
  press(m,'ac');
  press(m,'2','multiply','3','exe');
  press(m,'4','plus','5','exe');
  assert.equal(m.result,'9');

  // First Up recalls history[2] (4+5=9)
  press(m,'up');
  assert.equal(m.expression,'4+5');
  assert.equal(m.result,'9');

  // Up again recalls history[1] (2×3=6)
  press(m,'up');
  assert.equal(m.expression,'2×3');
  assert.equal(m.result,'6');

  // Up again recalls earliest calculation history[0] (1+2)
  press(m,'up');
  assert.equal(m.expression,'1+2');

  // Down scrolls forward to 2×3=6
  press(m,'down');
  assert.equal(m.expression,'2×3');
  assert.equal(m.result,'6');

  // Down again scrolls forward to latest (4+5=9)
  press(m,'down');
  assert.equal(m.expression,'4+5');
  assert.equal(m.result,'9');
});
