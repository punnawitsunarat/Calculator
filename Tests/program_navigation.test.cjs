const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../CaLSimulator/Resources/engine.js');
const natural=require('../Preview/natural.js');
const {Machine}=require('../Preview/lcd.js');
const keys=require('../Preview/keys.js').rows.flat();
const press=(m,...ids)=>ids.forEach(id=>m.press(keys.find(k=>k[0]===id)||[id,id]));

test('FILE separates Prog/Fmla and empty groups remain navigable',()=>{
 const m=new Machine(engine,natural);press(m,'file');
 assert.equal(m.screen.title,'Prog List');assert.ok(!m.screen.lines.some(l=>l.includes('CIRCLE-F')));
 press(m,'right');assert.equal(m.screen.title,'Fmla List');assert.match(m.screen.lines[0],/CIRCLE-F.*FM/);
 press(m,'left');assert.equal(m.screen.title,'Prog List');
 m.programs=m.programs.filter(p=>p.mode==='Formula');press(m,'right','left');
 assert.equal(m.screen.lines.length,0);press(m,'right','exe');assert.equal(m.assignment.formulaName,'CIRCLE-F');
});

test('editing returns to highlighted file and SHIFT arrows jump to program boundaries',()=>{
 const m=new Machine(engine,natural);press(m,'mode','5','3','2');
 assert.equal(m.screen.program.name,'HERON');const source=m.screen.program.source;
 press(m,'shift','up');assert.equal(m.screen.cursor,0);
 press(m,'shift','down');assert.equal(m.screen.cursor,source.length);
 press(m,'fmla');assert.equal(m.screen.program.source,source);
 press(m,'exit');assert.equal(m.screen.title,'Prog Edit');assert.equal(m.screen.index,1);
 press(m,'right','exe');assert.equal(m.screen.program.mode,'Formula');
 press(m,'exit');assert.equal(m.screen.title,'Fmla Edit');
});

test('Formula EXE after result restarts assignment, while typing starts a new calculation',()=>{
 const m=new Machine(engine,natural);m.runProgram({name:'AREA',mode:'Formula',source:'S=A*B/2'});
 press(m,'7','exe','8','exe','exe');assert.equal(m.value.re,28);
 press(m,'exe');assert.equal(m.assignment.formulaName,'AREA');
 press(m,'1','0','exe','exe','exe');assert.equal(m.value.re,40);
 press(m,'2','exe');assert.equal(m.value.re,2);assert.equal(m.completedFormula,null);
});
