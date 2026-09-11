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
 for(let i=1;i<=8;i++){const m=make();press(m,'mode',String(i));assert.equal(m.error,null);assert.ok(i===1||i===2||m.menu||m.screen);if(i===2)assert.equal(m.mode,'BASE-N');}
});
test('TABLE accepts natural expression and range on LCD',()=>{
 const m=make();press(m,'mode','7','exe','1','exe','3','exe','1','exe');assert.equal(m.error,null);assert.deepEqual(m.screen.lines,['1  1','2  4','3  9']);press(m,'exit');assert.equal(m.screen.type,'wizard');
});
test('matrix coefficients, store and determinant through physical menus',()=>{
 const m=make();press(m,'function','8','1','1','exe','exe');for(const v of ['1','2','3','4'])press(m,v,'exe');assert.equal(m.error,null);assert.deepEqual(m.matrices.A,[[1,2],[3,4]]);press(m,'exit','exit','3','function','8','2','1','exe');assert.equal(m.result,'-2');
});
test('quadratic and simultaneous equation coefficient entry',()=>{
 const m=make();press(m,'mode','8','down','1','1','exe','negative','3','exe','2','exe');assert.equal(m.error,null);assert.deepEqual(m.screen.lines,['X1=2','X2=1','X-Value Minimum=1.5','Y-Value Minimum=-0.25']);
 const n=make();press(n,'mode','8','1');for(const v of [1,1,3,1,-1,1]){n.insert(String(v));press(n,'exe');}assert.equal(n.error,null);assert.deepEqual(n.screen.lines,['X1=2','X2=1']);
});
test('SD stores rows and excludes uncommitted empty row',()=>{
 const m=make();press(m,'mode','3','1','exe','2','exe','3','exe','calc');assert.equal(m.error,null);assert.ok(m.screen.lines.includes('n=3'));assert.ok(m.screen.lines.includes('mean=2'));
});
test('program sample runs and edits entirely within LCD',()=>{
 const m=make();press(m,'mode','5','2','exe');assert.equal(m.error,null);assert.ok(m.screen.lines.includes('1003'));press(m,'exit','exit','3','exe');assert.equal(m.screen.type,'program');press(m,'exe','1');assert.ok(m.screen.program.source.endsWith('\n1'));press(m,'exit');assert.equal(m.screen.title,'Prog Edit');assert.ok(new Machine(engine,natural,m.snapshot()).programs[0].source.endsWith('\n1'));
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

test('matrix list, dimension screen and grid editor match Casio fx-5800P flow',()=>{
 const m=make();
 press(m,'function','8','1');
 assert.equal(m.screen.title,'Matrix');
 assert.equal(m.screen.matrixList,true);
 assert.equal(m.screen.lines[0],'Mat A   :None');
 press(m,'right');
 assert.equal(m.screen.type,'dimension');
 assert.equal(m.screen.title,'Dimension  mXn');
 assert.equal(m.screen.index,0);
 press(m,'down');
 assert.equal(m.screen.index,1);
 press(m,'up');
 assert.equal(m.screen.index,0);
 press(m,'3','exe','3','exe');
 assert.equal(m.screen.type,'grid');
 assert.equal(m.screen.matrixName,'A');
 assert.equal(m.screen.data.length,3);
 assert.equal(m.screen.data[0].length,3);
 press(m,'9','exe');
 assert.equal(m.matrices.A[0][0],9);
 assert.equal(m.screen.index,1);
 press(m,'exit');
 assert.equal(m.screen.title,'Matrix');
 assert.equal(m.screen.lines[0],'Mat A   :  3X 3');
  press(m,'exe');
  assert.equal(m.screen.type,'grid');
  assert.equal(m.screen.data[0][0],9);
});

test('status bar format, contextual cursor states and replay indicators',()=>{
  const m=make();
  assert.equal(m.shift,false);
  assert.equal(m.alpha,false);
  press(m,'shift');
  assert.equal(m.shift,true);
  press(m,'shift');
  assert.equal(m.shift,false);
  press(m,'alpha');
  assert.equal(m.alpha,true);
  press(m,'alpha');
  assert.equal(m.alpha,false);

  assert.equal(m.angle,'DEG');
  press(m,'1','plus','2','exe');
  assert.equal(m.history.length,1);
  assert.equal(m.historyIndex,1);
  assert.ok(m.historyIndex>0);
  press(m,'up');
  assert.equal(m.historyIndex,0);
  assert.ok(m.historyIndex<m.history.length);
});

test('Step 3: Physical fx-5800P Menu, FMLA pages, SETUP and nested EXIT navigation',()=>{
  const m=make();

  // 1. FMLA 4-page navigation and execution
  press(m,'fmla');
  assert.equal(m.menu.kind,'formulaChoice');
  assert.match(m.menuText(),/1:Original\n2:Built-in/);
  // Press 2 to open Built-in catalog
  press(m,'2');
  assert.equal(m.menu.kind,'formula');
  assert.match(m.menuText(),/1:Circle 2:Circum/);
  // Down to Page 2
  press(m,'down');
  assert.match(m.menuText(),/1:Speed  2:Force/);
  // Down to Page 3
  press(m,'down');
  assert.match(m.menuText(),/1:Power  2:Joule/);
  // Down to Page 4
  press(m,'down');
  assert.match(m.menuText(),/1:Cone   2:SphArea/);
  // Up back to Page 3
  press(m,'up');
  assert.match(m.menuText(),/1:Power  2:Joule/);
  // EXIT returns to formulaChoice
  press(m,'exit');
  assert.equal(m.menu.kind,'formulaChoice');
  // EXIT again closes FMLA cleanly
  press(m,'exit');
  assert.equal(m.menu,null);

  // 2. Select formula from Page 1 and run CALC
  press(m,'fmla','2','3'); // Built-in -> Triangle: B×H/2
  assert.ok(m.assignment);
  assert.equal(m.assignment.vars[0],'B');
  press(m,'1','0','exe'); // B = 10
  assert.equal(m.assignment.vars[1],'H');
  press(m,'6','exe','exe'); // H = 6, execute -> 30
  assert.equal(m.result,'30');
  press(m,'ac');

  // 3. SETUP nested menu and EXIT hierarchy
  press(m,'shift','mode'); // SETUP page 0
  assert.equal(m.menu.kind,'setup');
  assert.match(m.menuText(),/1:MthIO 2:LineIO/);
  press(m,'down'); // SETUP page 1
  assert.match(m.menuText(),/3:ENG   4:COMPLX/);
  press(m,'3'); // ENG submenu
  assert.equal(m.menu.kind,'eng');
  assert.match(m.menuText(),/1:EngOn 2:EngOff/);
  press(m,'exit'); // returns to SETUP
  assert.equal(m.menu.kind,'setup');
  press(m,'exit'); // returns to calculation screen
  assert.equal(m.menu,null);
});

test('Step 4: SHIFT i inputs ∠, polar phasor evaluation, and quadratic vertex navigation',()=>{
  const m=make();
  // SHIFT i inputs ∠
  press(m,'5','shift','i','9','0','exe');
  assert.equal(m.error,null);
  assert.equal(m.result,'5i');

  // Phasor arithmetic: (2∠60) × (3∠30) = 6i
  press(m,'ac','open','2','shift','i','6','0','close','multiply','open','3','shift','i','3','0','close','exe');
  assert.equal(m.error,null);
  assert.equal(m.result,'6i');

  // Quadratic vertex: -X^2 + 4X - 3 = 0 (Maximum at X=2, Y=1)
  press(m,'ac','mode','8','down','1','negative','1','exe','4','exe','negative','3','exe');
  assert.equal(m.error,null);
  assert.deepEqual(m.screen.lines,['X1=1','X2=3','X-Value Maximum=2','Y-Value Maximum=1']);
});

test('Step 5: Physical Base-N Mode direct keys, base switching, bitwise logic, and hex entry',()=>{
  const m=make();
  // Enter BASE-N mode via MODE 2
  press(m,'mode','2');
  assert.equal(m.error,null);
  assert.equal(m.mode,'BASE-N');
  assert.equal(m.base,'DEC');

  // Calculate 25 + 7 = 32 in DEC
  press(m,'2','5','plus','7','exe');
  assert.equal(m.error,null);
  assert.equal(m.result,'32');

  // Instant base switching on result:
  // Press log -> HEX
  press(m,'log');
  assert.equal(m.base,'HEX');
  assert.equal(m.result,'20');

  // Press ln -> BIN
  press(m,'ln');
  assert.equal(m.base,'BIN');
  assert.equal(m.result,'100000');

  // Press power (xⁿ) -> OCT
  press(m,'power');
  assert.equal(m.base,'OCT');
  assert.equal(m.result,'40');

  // Press square (x²) -> DEC
  press(m,'square');
  assert.equal(m.base,'DEC');
  assert.equal(m.result,'32');

  // Switch to HEX and type direct hex letters without ALPHA
  press(m,'log');
  assert.equal(m.base,'HEX');
  press(m,'ac');
  // i -> A, fraction -> B, dms -> C, sin -> D, cos -> E, tan -> F
  // Enter 1B + 1
  press(m,'1','fraction','plus','1','exe');
  assert.equal(m.error,null);
  assert.equal(m.result,'1C');

  // Bitwise FUNCTION menu
  press(m,'ac');
  press(m,'function');
  assert.equal(m.menu.kind,'baseLogic');
  assert.match(m.menuText(),/1:and   2:or/);
  press(m,'down');
  assert.match(m.menuText(),/1:d     2:h/);
  // Select 3: b (binary prefix)
  press(m,'3');
  assert.equal(m.editor.source,'b');
});

test('Step 6: RCL variable inspection, Multi-Statement (:), and display pause (◢)',()=>{
  const m=make();

  // 1. RCL Variable inspection
  m.variables.A = {re:42, im:0};
  press(m,'rcl','i'); // key 'i' has alpha 'A'
  assert.equal(m.editor.source,'A');
  assert.equal(m.result,'42');
  assert.equal(m.done,true);

  // Operation chaining right from RCL result
  press(m,'plus','8','exe');
  assert.equal(m.result,'50');

  // 2. Multi-Statement execution with colon (:)
  press(m,'ac');
  // 5→A : A×3→B : B+4
  m.editor.load('5→A : A×3→B : B+4');
  press(m,'exe');
  assert.equal(m.error,null);
  assert.equal(m.result,'19');
  assert.equal(m.variables.A.re,5);
  assert.equal(m.variables.B.re,15);

  // 3. Multi-Statement with display pause ◢
  press(m,'ac');
  m.editor.load('10→A : A+2◢ : A×5');
  press(m,'exe');
  assert.equal(m.error,null);
  assert.equal(m.dispPause,true);
  assert.equal(m.result,'12');

  // Press EXE to resume from ◢
  press(m,'exe');
  assert.equal(m.dispPause,false);
  assert.equal(m.result,'50');
  assert.equal(m.variables.A.re,10);
});

test('Step 7: Interactive Variable Input Prompt (? → Variable) in COMP Mode and Programs', () => {
  const m = make();

  // 1. Engineering routine ?→A : ?→B : √(A²+B²)→C : C◢
  m.editor.load('?→A : ?→B : √(A^2+B^2)→C : C◢');
  press(m, 'exe');
  assert.equal(m.error, null);
  assert.ok(m.inputPrompt, 'Prompt A should be active');
  assert.equal(m.inputPrompt.variable, 'A');
  assert.equal(m.inputPrompt.prompt, 'A?');

  // Input 3 for A
  press(m, '3', 'exe');
  assert.equal(m.variables.A.re, 3);
  assert.ok(m.inputPrompt, 'Prompt B should be active');
  assert.equal(m.inputPrompt.variable, 'B');
  assert.equal(m.inputPrompt.prompt, 'B?');

  // Input 4 for B
  press(m, '4', 'exe');
  assert.equal(m.variables.B.re, 4);
  assert.equal(m.variables.C.re, 5);
  assert.equal(m.dispPause, true);
  assert.equal(m.result, '5');

  // Resume from ◢
  press(m, 'exe');
  assert.equal(m.dispPause, false);
  assert.equal(m.result, '5');

  // 2. Custom prompt text: "WIDTH"?→W : "LEN"?→L : W×L
  press(m, 'ac');
  m.editor.load('"WIDTH"?→W : "LEN"?→L : W×L');
  press(m, 'exe');
  assert.ok(m.inputPrompt);
  assert.equal(m.inputPrompt.prompt, 'WIDTH?');
  assert.equal(m.inputPrompt.variable, 'W');
  press(m, '6', 'exe');

  assert.ok(m.inputPrompt);
  assert.equal(m.inputPrompt.prompt, 'LEN?');
  assert.equal(m.inputPrompt.variable, 'L');
  press(m, '7', 'exe');

  assert.equal(m.inputPrompt, null);
  assert.equal(m.result, '42');
  assert.equal(m.variables.W.re, 6);
  assert.equal(m.variables.L.re, 7);

  // 3. Expression evaluation at input prompt: ?→A : A×10
  press(m, 'ac');
  m.editor.load('?→A : A×10');
  press(m, 'exe');
  assert.ok(m.inputPrompt);
  press(m, '2', 'plus', '5', 'exe'); // enters 2+5 = 7
  assert.equal(m.variables.A.re, 7);
  assert.equal(m.result, '70');

  // 4. Retaining default/existing value on blank EXE
  m.variables.A = {re: 10, im: 0};
  press(m, 'ac');
  m.editor.load('?→A : A×3');
  press(m, 'exe');
  assert.ok(m.inputPrompt);
  press(m, 'exe'); // press EXE without entering value -> keeps 10
  assert.equal(m.variables.A.re, 10);
  assert.equal(m.result, '30');

  // 5. Cancel prompt with EXIT or AC
  press(m, 'ac');
  m.editor.load('?→A : A×5');
  press(m, 'exe');
  assert.ok(m.inputPrompt);
  press(m, 'exit');
  assert.equal(m.inputPrompt, null);
  assert.equal(m.multiStatement, null);
});

test('Step 8: Program Mode (MODE 5 / FILE) flow, subprograms, logic operators and multi-line editor', () => {
  const m = make();

  // 1. FILE key opens Prog RUN directly
  press(m, 'file');
  assert.equal(m.screen.type, 'list');
  assert.equal(m.screen.title, 'Prog List');

  // Numeric selection '1' selects FOR-LOOP and runs it
  press(m, '1');
  assert.equal(m.screen.type, 'output');
  assert.equal(m.screen.title, 'FOR-LOOP');
  assert.ok(m.screen.lines.includes('1003'));

  // 2. Subprogram call: Prog "SUB"
  const progA = { name: 'MAIN', source: '3→A\n4→B\nProg "HYPOT"\nC' };
  const progB = { name: 'HYPOT', source: '√(A^2+B^2)→C' };
  m.programs.push(progA, progB);
  m.runProgram(progA);
  assert.equal(m.screen.type, 'output');
  assert.equal(m.variables.C.re, 5);
  assert.equal(m.screen.lines.at(-1), '5');

  // 3. Logic operators And, Or, Not and Casio relational ≠, ≤, ≥ in programs
  const progLogic = {
    name: 'LOGIC',
    source: 'If 10>5 And 3≤7\nThen\n"PASS_AND"\nIfEnd\nIf 4≠0 Or 5<2\nThen\n"PASS_OR"\nIfEnd'
  };
  m.runProgram(progLogic);
  assert.deepEqual(m.screen.lines, ['PASS_AND', 'PASS_OR']);

  // 4. Multi-line editing, newline on EXE, AC clearing current line, and EXIT
  const progEdit = { name: 'TEST', source: 'LINE1\nLINE2' };
  m.screen = { type: 'program', title: 'TEST', program: progEdit, cursor: 5, back: () => m.openTool('program') };
  // Press exe inserts \n
  press(m, 'exe', 'A');
  assert.equal(progEdit.source, 'LINE1\nA\nLINE2');

  // AC clears current line safely without closing editor
  press(m, 'ac');
  assert.equal(m.screen.type, 'program');
  assert.equal(progEdit.source, 'LINE1\n\nLINE2');

  // EXIT returns to program menu
  press(m, 'exit');
  assert.equal(m.menu.kind, 'program');
});

test('Step 9: Direct Formula Editing and Recalculation Flow in FMLA Mode', () => {
  const m = make();

  // 1. Select formula Circle (pi×R^2) from FMLA menu (2:Built-in -> 1:Circle)
  press(m, 'fmla', '2', '1');
  assert.ok(m.assignment);
  assert.equal(m.assignment.vars[0], 'R');
  assert.ok(m.editor.complete().includes('pi') && m.editor.complete().includes('R'));

  // 2. Safe AC clearing inside variable prompt
  press(m, '9', '9');
  assert.equal(m.assignment.entry.source, '99');
  press(m, 'ac'); // Clears current entry, stays in prompt
  assert.ok(m.assignment);
  assert.equal(m.assignment.entry.source, '');

  // 3. Enter R = 5 and calculate
  press(m, '5', 'exe', 'exe');
  assert.equal(m.assignment, null);
  assert.equal(m.done, true);
  near(m.value.re, Math.PI * 25);

  // 4. Rapid Recalculation: pressing CALC re-prompts R with stored value 5
  press(m, 'calc');
  assert.ok(m.assignment);
  assert.equal(m.assignment.vars[0], 'R');
  assert.equal(m.assignmentValue('R').re, 5);
  // Change R to 10 and recalculate
  press(m, '1', '0', 'exe', 'exe');
  assert.equal(m.assignment, null);
  assert.equal(m.done, true);
  near(m.value.re, Math.PI * 100);

  // 5. Direct Formula Editing from assignment prompt using left arrow
  press(m, 'fmla', '2', '3'); // Built-in -> Triangle: B×H/2
  assert.ok(m.assignment);
  assert.equal(m.assignment.entry.source, '');
  // Press left arrow drops into editor with formula loaded
  press(m, 'left');
  assert.equal(m.assignment, null);
  assert.ok(m.editor.complete().includes('B×H') && m.editor.complete().includes('2'));

  // 6. Edit formula: append +10 and run CALC
  press(m, 'plus', '1', '0');
  assert.ok(m.editor.complete().includes('+10'));
  press(m, 'calc');
  assert.ok(m.assignment);
  assert.deepEqual(m.assignment.vars, ['B', 'H']);
  press(m, '6', 'exe', '4', 'exe', 'exe'); // 6*4/2 + 10 = 22
  assert.equal(m.result, '22');

  // 7. Direct Formula Editing from calculation result
  press(m, 'left');
  assert.equal(m.done, false);
  assert.ok(m.editor.complete().includes('+10'));
});

test('Step 11: Deeply nested natural math navigation, overflow editing, and boundaries',()=>{
  const m=make();
  // Build nested continued fraction inside radical: sqrt(1/(2+1/(2+1/(2))))
  press(m, 'sqrt', 'fraction', '1', 'down', '2', 'plus', 'fraction', '1', 'down', '2', 'plus', 'fraction', '1', 'down', '2');
  assert.equal(m.error, null);
  assert.ok(m.expression.includes('sqrt'));

  // Press down repeatedly at the deepest denominator boundary: must not wipe expression or trigger history
  press(m, 'down', 'down', 'down');
  assert.equal(m.done, false);
  assert.ok(m.expression.includes('sqrt'));

  // Edit deepest denominator: insert 5 -> makes 25
  press(m, '5');
  assert.ok(m.expression.includes('25'));

  // Press up repeatedly to top numerator
  press(m, 'up', 'up', 'up', 'up', 'up', 'up');
  assert.equal(m.done, false);

  // Press up at top boundary: must not wipe expression or trigger history
  press(m, 'up', 'up');
  assert.equal(m.done, false);
  assert.ok(m.expression.includes('25'));

  // Evaluate
  press(m, 'exe');
  assert.equal(m.done, true);
  assert.equal(m.error, null);
  assert.equal(m.result, '√6477/127');
});



