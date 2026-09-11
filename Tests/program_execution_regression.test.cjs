const {test} = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../CaLSimulator/Resources/engine.js');

const run = (source, extra = {}) => engine.dispatch({action:'program', source, ...extra});
const value = (result, name) => result.variables[name]?.re;

// CASIO fx-5800P User's Guide, E-114–119: these are executable
// calculator statements, including commands after Then/Else on the same line.
test('If accepts inline arithmetic and Else, with required Then and nested branches', () => {
  const yes = run('3→A:If A<10:Then 10A→A:Else 9A→A:IfEnd:A');
  assert.deepEqual(yes.output, ['30']);
  const no = run('12→A:If A<10:Then 10A→A:Else 9A→A:IfEnd:A');
  assert.deepEqual(no.output, ['108']);
  assert.deepEqual(run('If 1:Then:If 0:Then 11:Else 22:IfEnd:Else 33:IfEnd').output, ['22']);
  assert.throws(() => run('If 0:123:IfEnd'), /Syntax ERROR: If requires Then/);
  assert.throws(() => run('Then 2'), /Syntax ERROR: Then/);
});

test('Then Break leaves its loop, while Then Return leaves only its subroutine', () => {
  assert.deepEqual(run('For 1→ A To 10:If A=3:Then Break:IfEnd:Next:A').output, ['3']);
  const r = run('1→A:Prog "SUB":A', {programs:{SUB:'If A=1:Then 7→A:Return:Else 9→A:IfEnd:99→A'}});
  assert.equal(value(r, 'A'), 7);
  assert.deepEqual(r.output, ['7']);
  assert.deepEqual(run('If 0:Then 1:Else Return:IfEnd:99').output, []);
});

test('Stop in a nested subroutine terminates the main routine too', () => {
  const r = run('1→A:Prog "SUB":99→A', {programs:{SUB:'Prog "INNER":88→A', INNER:'7→A:Stop:77→A'}});
  assert.equal(value(r, 'A'), 7);
  assert.equal(r.stopped, true);
});

test('Subroutines share variable and list memories, angle and display without duplicate output', () => {
  const r = run('2→Dim List X:11→List X[1]:"MAIN":Prog "SUB":List X[2]:sin(pi/2)', {
    programs:{SUB:'List X[1]+1→List X[2]:Rad:"SUB":Return'}
  });
  assert.equal(r.lists.X[1].re, 12);
  assert.equal(r.angle, 'RAD');
  assert.deepEqual(r.output, ['MAIN', 'SUB', '12', '1']);
});

test('Subroutine calls permit ten levels and produce Ne ERROR at level eleven', () => {
  const programs = Array.from({length:10}, (_,i) => ({name:'S'+i, mode:'COMP', source:i===9?'42':'Prog "S'+(i+1)+'"'}));
  assert.deepEqual(run('Prog "S0"', {programs}).output, ['42']);
  programs[9].source = 'Prog "S10"';
  programs.push({name:'S10', mode:'COMP', source:'42'});
  assert.throws(() => run('Prog "S0"', {programs}), /Ne ERROR/);
  assert.throws(() => run('Prog "LOOP"', {programs:{LOOP:'Prog "LOOP"'}}), /Ne ERROR/);
});

test('Prog and Goto report missing targets, reject Formula and BASE-N subroutines, and allow an empty COMP file', () => {
  assert.throws(() => run('Prog "MISSING"'), /Go ERROR/);
  assert.throws(() => run('Goto 1'), /Go ERROR/);
  assert.throws(() => run('Prog "SUB"', {programs:{SUB:'Goto 1:Return'}}), /Go ERROR/);
  for (const mode of ['Formula', 'BASE-N']) {
    assert.throws(() => run('Prog "SUB"', {programs:[{name:'SUB', mode, source:'2+2'}]}), /Mode ERROR/);
  }
  assert.deepEqual(run('Prog "EMPTY":2+2', {programs:{EMPTY:''}}).output, ['4']);
});

test('Output pause following assignment displays the new value and updates Ans', () => {
  const program = engine.createProgram('99:3→A◢:Ans×2', {}, 'DEG');
  const pause = program.next();
  assert.equal(pause.value.type, 'display');
  assert.equal(pause.value.text, '3');
  assert.equal(pause.value.variables.Ans.re, 3);
  const result = program.next();
  assert.equal(result.done, true);
  assert.deepEqual(result.value.output, ['99', '3', '6']);
});

test('Interactive subroutine yields its input and pause, then resumes the caller', () => {
  const program = engine.createProgram('Prog "SUB":A+1', {}, 'DEG', {SUB:'"SIDE"?A:A×2◢:Return'});
  const input = program.next();
  assert.equal(input.value.type, 'input');
  assert.equal(input.value.prompt, 'SIDE?');
  assert.equal(input.value.keepCurrent, true);
  const pause = program.next('sqrt(9)');
  assert.equal(pause.value.type, 'display');
  assert.equal(pause.value.text, '6');
  assert.equal(pause.value.variables.A.re, 3);
  const result = program.next();
  assert.equal(result.done, true);
  assert.deepEqual(result.value.output, ['6', '4']);
});

test('?A keeps the current value on EXE while an assignment prompt requires a value', () => {
  const program = engine.createProgram('?A:A×2', {A:{re:7, im:0}}, 'DEG');
  const input = program.next();
  assert.equal(input.value.keepCurrent, true);
  assert.deepEqual(input.value.currentValue, {re:7, im:0});
  assert.deepEqual(program.next().value.output, ['14']);
  assert.deepEqual(run('?A:A', {variables:{A:{re:5, im:0}}}).output, ['5']);
  assert.throws(() => run('?→A'), /Input required/);
  assert.throws(() => run('?→A', {inputs:{A:'invalid'}}), /Statement/);
  assert.deepEqual(run('?→A:A', {inputs:{A:'1/2'}}).output, ['0.5']);
});

test('Isz and Dsz skip exactly the next statement when their result reaches zero', () => {
  assert.deepEqual(run('3→A:0→S:Lbl 1:S+A→S:Dsz A:Goto 1:S').output, ['6']);
  assert.deepEqual(run('-1→A:Isz A:999:7').output, ['7']);
  assert.deepEqual(run('1→A:Isz A:999:7').output, ['999', '7']);
  const skippedPause = engine.createProgram('1→A:Dsz A:999◢:7', {}, 'DEG');
  const result = skippedPause.next();
  assert.equal(result.done, true);
  assert.deepEqual(result.value.output, ['7']);
});

test('Conditional jump executes only its true branch, including its output pause', () => {
  assert.deepEqual(run('0⇒99:1⇒7:9').output, ['7', '9']);
  const falseBranch = engine.createProgram('0⇒999◢:7', {}, 'DEG');
  assert.equal(falseBranch.next().done, true);
  const trueBranch = engine.createProgram('2⇒7◢:9', {}, 'DEG');
  assert.equal(trueBranch.next().value.text, '7');
  assert.deepEqual(trueBranch.next().value.output, ['7', '9']);
});

test('Logical Not negates the following comparison before And and Or', () => {
  assert.equal(engine.evaluate('Not B<10', {B:3}).re, 0);
  assert.equal(engine.evaluate('Not B<10', {B:12}).re, 1);
  assert.equal(engine.evaluate('Not 0 And 0').re, 0);
  assert.deepEqual(run('If Not 3<10:Then 99:Else 7:IfEnd').output, ['7']);
});

test('Cls clears shared program output and ClrMemory resets A-Z and Ans', () => {
  assert.deepEqual(run('"OLD":Prog "SUB":7', {programs:{SUB:'Cls:"NEW"'}}).output, ['NEW', '7']);
  const r = run('5→A:6→Z:ClrMemory');
  assert.equal(value(r, 'A'), 0);
  assert.equal(value(r, 'Z'), 0);
  assert.equal(value(r, 'Ans'), 0);
});
