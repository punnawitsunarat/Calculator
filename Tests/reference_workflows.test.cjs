const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../CaLSimulator/Resources/engine.js');
const natural=require('../Preview/natural.js');
const {Machine}=require('../Preview/lcd.js');
const keys=require('../Preview/keys.js').rows.flat();
const press=(m,...ids)=>ids.forEach(id=>m.press(keys.find(k=>k[0]===id)||[id,id]));

test('EQN EXIT and final EXE return to original coefficients for correction (manual E-72)',()=>{
 const m=new Machine(engine,natural);press(m,'mode','8','1');
 for(const v of [1,1,3,1,-1,1]){m.insert(String(v));press(m,'exe');}
 assert.deepEqual(m.screen.lines,['X1=2','X2=1']);
 press(m,'exit');assert.deepEqual(m.screen.data,[[1,1,3],[1,-1,1]]);
 m.insert('3');press(m,'exe');assert.deepEqual(m.screen.lines,['X1=3','X2=0']);
 press(m,'exe','exe');assert.equal(m.screen.equation,true);
 assert.deepEqual(m.screen.data,[[1,1,3],[1,-1,3]]);
 press(m,'up','ac');assert.deepEqual(m.screen.data,[[1,1,0],[1,-1,3]]);
});

test('CALC repeats manual E-91 variable substitution without changing the expression',()=>{
 const m=new Machine(engine,natural);m.insert('3*A+B');press(m,'calc','5','exe','3','exe','exe');
 assert.equal(m.value.re,18);press(m,'calc','down','1','0','exe','exe');
 assert.equal(m.value.re,25);assert.equal(m.variables.A.re,5);
});

test('SOLVE repeats with positive and negative initial guesses',()=>{
 const m=new Machine(engine,natural);m.insert('X^2=4');press(m,'solve');
 m.insert('3');press(m,'solve');assert.ok(Math.abs(m.value.re-2)<1e-7);
 press(m,'exe');m.insert('-3');press(m,'solve');assert.ok(Math.abs(m.value.re+2)<1e-7);
});

// Playlist contrast tutorial _uIl0xXlg_0, 1:10; manual E-9.
test('Contrast changes immediately with replay arrows, persists and leaves calculation intact',()=>{
 const m=new Machine(engine,natural);m.insert('12+3');
 press(m,'mode','down','3','1');assert.equal(m.screen.type,'contrast');
 const initial=m.contrast;press(m,'right','right');assert.equal(m.contrast,initial+2);
 press(m,'left');assert.equal(m.contrast,initial+1);
 press(m,'exit');assert.equal(m.screen,null);assert.equal(m.expression,'12+3');
 const saved=new Machine(engine,natural,m.snapshot());assert.equal(saved.contrast,m.contrast);
 press(m,'mode','left');assert.equal(m.contrast,initial);assert.equal(m.menu.kind,'mode');
 for(let i=0;i<30;i++)press(m,'left');assert.equal(m.contrast,0);
 for(let i=0;i<30;i++)press(m,'right');assert.equal(m.contrast,20);
 press(m,'exit','exe');assert.equal(m.value.re,15);
});

test('Pol and Rec store I/J without overwriting independent X/Y memories (manual E-48)',()=>{
 const vars={X:{re:17,im:0},Y:{re:23,im:0}};
 const p=engine.dispatch({action:'evaluate',expression:'Pol(3,4)',variables:vars,angle:'DEG'});
 assert.equal(p.variables.I.re,5);assert.ok(Math.abs(p.variables.J.re-53.130102354156)<1e-10);
 assert.equal(p.variables.X.re,17);assert.equal(p.variables.Y.re,23);
 const r=engine.dispatch({action:'evaluate',expression:'Rec(2,90)',angle:'DEG'});
 assert.ok(Math.abs(r.variables.I.re)<1e-10);assert.equal(r.variables.J.re,2);
});

test('Program angle changes reach the LCD during input and after completion',()=>{
 const m=new Machine(engine,natural);
 m.runProgram({name:'ANGLE',source:'Rad:?A:sin(A)'});
 assert.equal(m.angle,'RAD');m.insert('pi/2');press(m,'exe');
 assert.equal(m.running,null);assert.equal(m.angle,'RAD');assert.deepEqual(m.screen.lines,['1']);
});

// Manual E-95–97: compound interest and retained range on EXIT.
test('TABLE keeps expression and range when returning from read-only results',()=>{
 const m=new Machine(engine,natural);press(m,'mode','7');m.insert('100000*(1+0.03)^X');
 press(m,'exe','1','exe','5','exe','2','exe');
 assert.equal(m.screen.tableRows.length,3);
 assert.equal(m.screen.tableRows[2][1],'115927.4074');
 press(m,'right','down');assert.equal(m.screen.column,1);assert.equal(m.screen.index,1);
 press(m,'9');assert.equal(m.screen.tableRows.length,3);
 press(m,'exit');assert.equal(m.screen.fields[1][2],5);assert.equal(m.screen.fields[2][2],2);
 press(m,'exit');assert.equal(m.screen.fields[0][2],'100000*(1+0.03)^X');
});
