const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../CaLSimulator/Resources/engine.js');
const natural=require('../Preview/natural.js');
const {Machine}=require('../Preview/lcd.js');
const keys=require('../Preview/keys.js').rows.flat();
const press=(m,...ids)=>ids.forEach(id=>m.press(keys.find(k=>k[0]===id)||[id,id]));

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
