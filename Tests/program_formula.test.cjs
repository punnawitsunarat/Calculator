const {test} = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../CaLSimulator/Resources/engine.js');
const natural = require('../Preview/natural.js');
const {Machine} = require('../Preview/lcd.js');
const keys = require('../Preview/keys.js').rows.flat();

const make = () => new Machine(engine, natural);
const press = (m, ...ids) => ids.forEach(id => {
  const k = keys.find(item => item[0] === id) || [id, id];
  m.press(k);
});
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('Formula Mode has 8 pages, authentic equations, and formula tag metadata', () => {
  const m = make();
  // Open FMLA menu
  press(m, 'fmla');
  assert.equal(m.menu.kind, 'formula');
  assert.equal(m.menu.page, 0);
  assert.match(m.menuText(), /1:Circle 2:Circum/);

  // Navigate forward through all 8 pages
  for (let page = 1; page <= 7; page++) {
    press(m, 'down');
    assert.equal(m.menu.page, page);
  }
  // Check Page 7 contents
  assert.match(m.menuText(), /1:Frict  2:Buoyanc/);
  // Wraparound back to Page 0
  press(m, 'down');
  assert.equal(m.menu.page, 0);
  // Wraparound backward to Page 7
  press(m, 'up');
  assert.equal(m.menu.page, 7);

  // Close FMLA with EXIT
  press(m, 'exit');
  assert.equal(m.menu, null);

  // Select Circle Area (Page 0, Item 1)
  press(m, 'fmla', '1');
  assert.ok(m.assignment);
  assert.equal(m.assignment.formulaName, 'Circle Area');
  assert.equal(m.assignment.formulaEq, 'S=pi×R^2');
  assert.equal(m.assignment.vars[0], 'R');
  // Enter R = 5
  press(m, '5', 'exe', 'exe');
  near(m.value.re, 25 * Math.PI);

  // Select Heron Formula (Page 4, Item 1)
  press(m, 'ac', 'fmla');
  // Go to page 4
  press(m, 'down', 'down', 'down', 'down');
  assert.equal(m.menu.page, 4);
  assert.match(m.menuText(), /1:Heron/);
  press(m, '1');
  assert.ok(m.assignment);
  assert.equal(m.assignment.formulaName, 'Heron Formula');
  assert.equal(m.assignment.vars.join(','), 'A,B,C');
  // Enter triangle sides 3, 4, 5
  press(m, '3', 'exe', '4', 'exe', '5', 'exe', 'exe');
  near(m.value.re, 6);
});

test('Program Mode 1:NEW authentic prompt, name entry, mode select and editor entry', () => {
  const m = make();
  // MODE 5 -> 1:NEW
  press(m, 'mode', '5', '1');
  assert.equal(m.screen.type, 'progName');
  assert.equal(m.screen.step, 'name');
  assert.equal(m.screen.title, 'Program Name?');
  assert.equal(m.alpha, true); // Automatic ALPHA engaged

  // Type program name 'AB1'
  // 'i' key has ALPHA 'A', 'fraction' has ALPHA 'B', 'alpha' toggles to digits, '1' enters '1'
  press(m, 'i', 'fraction', 'alpha', '1');
  assert.equal(m.screen.name, 'AB1');

  // Test left/right cursor and delete
  press(m, 'left', 'del');
  assert.equal(m.screen.name, 'A1');

  // Finish name with EXE -> transitions to mode select
  press(m, 'exe');
  assert.equal(m.screen.step, 'mode');
  assert.equal(m.screen.title, 'Select Mode');

  // Select 1:COMP mode
  press(m, '1');
  assert.equal(m.screen.type, 'program');
  assert.equal(m.screen.title, 'A1');
  assert.equal(m.screen.program.name, 'A1');
  assert.equal(m.screen.program.source, '');
  assert.ok(m.programs.some(p => p.name === 'A1'));

  // Test duplicate name validation
  press(m, 'exit', '1'); // Back to menu, press 1:NEW again
  press(m, 'i', 'alpha', '1', 'exe'); // Type 'A1' and press EXE
  assert.equal(m.error, 'Already Exists');
});

test('Program Mode 3:Formula selection, navigation, and execution via CALC', () => {
  const m = make();
  // MODE 5 -> 1:NEW
  press(m, 'mode', '5', '1');
  // Type 'CYL'
  press(m, 'dms', 'dot', '8', 'exe'); // C, Y, L -> EXE
  assert.equal(m.screen.step, 'mode');
  assert.equal(m.screen.title, 'Select Mode');
  assert.equal(m.screen.modeIndex, 0);

  // Arrow down to 2:BASE-N, then 3:Formula
  press(m, 'down');
  assert.equal(m.screen.modeIndex, 1);
  press(m, 'down');
  assert.equal(m.screen.modeIndex, 2);

  // Press EXE to select 3:Formula
  press(m, 'exe');
  assert.equal(m.screen.type, 'program');
  assert.equal(m.screen.program.name, 'CYL');
  assert.equal(m.screen.program.mode, 'Formula');

  // Input formula equation: V=pi×R^2×H
  m.screen.program.source = 'V=pi×R^2×H';
  // Exit back to menu
  press(m, 'exit');

  // Run CYL from Prog RUN
  press(m, '2'); // 2:RUN
  assert.equal(m.screen.type, 'list');
  // Select CYL (last item in programs)
  const cylIndex = m.programs.findIndex(p => p.name === 'CYL');
  press(m, String(cylIndex + 1));

  // Automatically enters CALC mode for formula
  assert.ok(m.assignment);
  assert.equal(m.assignment.formulaName, 'CYL');
  assert.equal(m.assignment.vars[0], 'R');
  // Enter R = 3
  press(m, '3', 'exe');
  assert.equal(m.assignment.vars[1], 'H');
  // Enter H = 4 and calculate -> 36*pi
  press(m, '4', 'exe', 'exe');
  near(m.value.re, 36 * Math.PI);
});

test('Program Editor authentic FUNCTION menu (COMP vs Formula) and dedicated shortcuts', () => {
  const m = make();
  const progComp = {name: 'TESTCOMP', mode: 'COMP', source: ''};
  m.screen = {type: 'program', title: 'TESTCOMP', program: progComp, cursor: 0, back: () => m.openTool('program')};

  // 1. In COMP mode: FUNCTION opens authentic functions menu (MATH, COMPLX, PROG...)
  press(m, 'function');
  assert.equal(m.menu.kind, 'functions');
  assert.match(m.menuText(), /1:MATH  2:COMPLX\n3:PROG  4:CONST/);

  // Press 3 (PROG) to open commands
  press(m, '3');
  assert.equal(m.menu.kind, 'commands');
  assert.equal(m.menu.page, 0);
  assert.match(m.menuText(), /1:\?     2:→/);

  // Navigate commands pages
  press(m, 'down');
  assert.equal(m.menu.page, 1);
  assert.match(m.menuText(), /1:For   2:To/);

  press(m, 'down');
  assert.equal(m.menu.page, 2);
  assert.match(m.menuText(), /1:Prog  2:Return/);

  press(m, 'down');
  assert.equal(m.menu.page, 3);
  assert.match(m.menuText(), /1:=     2:≠/);

  // Select '≠' (Page 3, Item 2)
  press(m, '2');
  assert.equal(m.menu, null);
  assert.equal(m.screen.type, 'program');
  assert.equal(progComp.source, '≠');

  // Test EXIT from commands returns to parent functions menu, then editor
  press(m, 'function');
  assert.equal(m.menu.kind, 'functions');
  press(m, '3'); // open commands
  assert.equal(m.menu.kind, 'commands');
  press(m, 'exit');
  assert.equal(m.menu.kind, 'functions');
  press(m, 'exit');
  assert.equal(m.menu, null);
  assert.equal(m.screen.type, 'program');

  // Test direct key shortcuts in editor: SHIFT FILE inserts 'Prog "'
  press(m, 'shift', 'file');
  assert.equal(progComp.source, '≠Prog "');

  // Test SHIFT sqrt inserts ':'
  press(m, 'shift', 'sqrt');
  assert.equal(progComp.source, '≠Prog ":');

  // Test SHIFT square inserts '◢'
  press(m, 'shift', 'square');
  assert.equal(progComp.source, '≠Prog ":◢');

  // 2. In Formula mode: FUNCTION opens authentic functionsFormula menu (MATH, COMPLX, CONST, ALPHA, ANGLE)
  const progFmla = {name: 'TESTFMLA', mode: 'Formula', source: ''};
  m.screen = {type: 'program', title: 'TESTFMLA', program: progFmla, cursor: 0, back: () => m.openTool('program')};

  press(m, 'function');
  assert.equal(m.menu.kind, 'functionsFormula');
  assert.match(m.menuText(), /1:MATH   2:COMPLX\n3:CONST  4:ALPHA\n5:ANGLE/);

  // Select 4:ALPHA
  press(m, '4');
  assert.equal(m.menu.kind, 'alphaChars');
  assert.match(m.menuText(), /1:abc   2:ΑΒΓ\n3:αβγ   4:123/);

  // Select 3:αβγ (Greek lowercase)
  press(m, '3');
  assert.equal(m.menu.kind, 'alphaGreekLower');
  assert.match(m.menuText(), /1:α 2:β 3:γ 4:δ/);

  // Select 1:α -> inserts 'α' into formula source and closes menu
  press(m, '1');
  assert.equal(m.menu, null);
  assert.equal(progFmla.source, 'α');

  // Test nested EXIT navigation in Formula menu
  press(m, 'function', '4'); // into alphaChars
  assert.equal(m.menu.kind, 'alphaChars');
  press(m, 'exit');
  assert.equal(m.menu.kind, 'functionsFormula');
  press(m, 'exit');
  assert.equal(m.menu, null);
  assert.equal(m.screen.type, 'program');
});

test('Prog RUN and built-in HERON program execution', () => {
  const m = make();
  // Open via physical FILE key in COMP mode
  press(m, 'file');
  assert.equal(m.screen.type, 'list');
  assert.equal(m.screen.programList, true);
  assert.equal(m.screen.title, 'Prog RUN');

  // Select Item 2: HERON
  press(m, '2');
  // Enters wizard for A
  assert.equal(m.screen.type, 'wizard');
  assert.equal(m.screen.fields[0][0], 'A');
  // Input sides 3, 4, 5
  press(m, '3', 'exe'); // A=3
  assert.equal(m.screen.fields[0][0], 'B');
  press(m, '4', 'exe'); // B=4
  assert.equal(m.screen.fields[0][0], 'C');
  press(m, '5', 'exe'); // C=5
  // Pauses at ◢ with Ans = 6
  assert.equal(m.screen.type, 'programPause');
  assert.equal(m.screen.lines[0], '6');
  // Resume program to completion
  press(m, 'exe');
  assert.equal(m.screen.type, 'output');
  assert.deepEqual(m.screen.lines, ['HERON', '6']);
});

test('Program Mode 4:DELETE submenus (One File and All Files)', () => {
  const m = make();
  assert.ok(m.programs.length >= 3);
  const initialCount = m.programs.length;
  const firstName = m.programs[0].name;

  // MODE 5 -> 4:DELETE
  press(m, 'mode', '5', '4');
  assert.equal(m.menu.kind, 'progDelete');
  assert.match(m.menuText(), /1:One File\n2:All Files/);

  // 1:One File
  press(m, '1');
  assert.equal(m.screen.type, 'list');
  assert.equal(m.screen.title, 'Prog DELETE');
  assert.equal(m.screen.programList, true);

  // Select 1 (deletes first file)
  press(m, '1');
  assert.equal(m.screen.type, 'confirm');
  assert.match(m.screen.title, new RegExp(firstName));
  // Cancel with EXIT
  press(m, 'exit');
  assert.equal(m.screen.type, 'list');
  assert.equal(m.programs.length, initialCount);

  // Confirm delete with EXE
  press(m, '1', 'exe');
  assert.equal(m.programs.length, initialCount - 1);
  assert.ok(!m.programs.some(p => p.name === firstName));

  // Exit back to progDelete menu
  press(m, 'exit');
  assert.equal(m.menu.kind, 'progDelete');

  // 2:All Files
  press(m, '2');
  assert.equal(m.screen.type, 'confirm');
  assert.match(m.screen.title, /Delete All\?/);
  press(m, 'exe');
  assert.equal(m.programs.length, 0);
  assert.equal(m.screen.type, 'output');
  assert.deepEqual(m.screen.lines, ['No programs']);
});

test('Program Formula mode uses Natural Display editor instead of raw strings', () => {
  const m = make();
  // Create a new Formula program: MODE 5 -> 1:NEW -> name "TESTF" -> 3:Formula
  press(m, 'mode', '5', '1');
  assert.equal(m.screen.type, 'progName');
  assert.equal(m.screen.step, 'name');
  for (const c of 'TESTF') m.insert(c);
  press(m, 'exe'); // advance to mode select
  press(m, '3'); // select 3:Formula
  assert.equal(m.screen.type, 'program');
  assert.equal(m.screen.program.mode, 'Formula');
  assert.ok(m.screen.entry, 'Formula program must have natural editor');

  // Press ALPHA CALC to insert '='
  press(m, 'alpha', 'calc');
  assert.equal(m.screen.entry.source, '=');

  // Press sqrt
  press(m, 'sqrt');
  // Tree should contain a root node, not raw 'sqrt('
  const rootNode = m.screen.entry.tree.find(n => n.type === 'root');
  assert.ok(rootNode, 'sqrt key must create a natural root AST node');

  // Insert '9' inside root, then move right
  press(m, '9', 'right');

  // Press square (x²)
  press(m, 'square');
  const powerNode = m.screen.entry.tree.find(n => n.type === 'power');
  assert.ok(powerNode, 'square key must create a natural power node');

  // Press fraction
  press(m, 'fraction');
  const fracNode = m.screen.entry.tree.find(n => n.type === 'fraction');
  assert.ok(fracNode, 'fraction key must create a natural fraction node');

  // Verify HTML contains natural SVG radical and frac
  const html = m.screen.entry.html(true);
  assert.ok(html.includes('radical'), 'Formula display HTML must contain SVG radical');
  assert.ok(html.includes('math-frac'), 'Formula display HTML must contain math-frac');
  assert.ok(!html.includes('sqrt('), 'Formula display must not contain raw sqrt(');
  assert.ok(!html.includes('^2'), 'Formula display must not contain raw ^2');

  // Press EXIT saves program source
  press(m, 'exit');
  assert.equal(m.screen, null);
  const prog = m.programs.find(p => p.name === 'TESTF');
  assert.ok(prog);
  assert.equal(prog.mode, 'Formula');
  assert.ok(prog.source.includes('sqrt'));
});

test('Program COMP mode inserts authentic Casio mathematical symbols and executes accurately', () => {
  const m = make();
  // Create a COMP program
  press(m, 'mode', '5', '1');
  for (const c of 'TESTC') m.insert(c);
  press(m, 'exe');
  press(m, '1'); // 1:COMP
  assert.equal(m.screen.type, 'program');
  assert.equal(m.screen.program.mode, 'COMP');
  assert.equal(m.screen.entry, null); // COMP uses text editor

  // Press sqrt, square, dms, shift+open (³√), shift+sin (sin⁻¹), shift+power (⁻¹)
  press(m, 'sqrt', '4', ')', 'plus', '3', 'square');
  assert.equal(m.screen.program.source, '√(4)+3²');

  // Clear and test other authentic symbols
  m.screen.program.source = '';
  m.screen.cursor = 0;
  m.screen.selectionEnd = 0;
  press(m, 'shift', 'open', '8', ')'); // ³√(8)
  assert.equal(m.screen.program.source, '³√(8)');

  // Test execution of program with authentic symbols
  m.screen.program.source = '√(16)+³√(27)+2²';
  // Press EXIT to save and return to Prog menu
  press(m, 'exit');
  assert.equal(m.menu.kind, 'program');

  // 2:RUN from Prog menu
  press(m, '2');
  assert.equal(m.screen.type, 'list');
  assert.equal(m.screen.title, 'Prog RUN');

  // Select TESTC (index 4)
  const testcIdx = m.programs.findIndex(p => p.name === 'TESTC') + 1;
  press(m, String(testcIdx));

  // Should output √(16) [4] + ³√(27) [3] + 2² [4] = 11
  assert.equal(m.screen.type, 'output');
  assert.deepEqual(m.screen.lines, ['11']);
});


