const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('../CaLSimulator/Resources/engine.js');
const run = engine.dispatch;
const near = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual-expected) <= epsilon*Math.max(1,Math.abs(expected)), `${actual} != ${expected}`);
const ev = (s, vars = {}, angle = 'DEG') => engine.evaluate(s, vars, angle);

test('operator priority, right associative powers, unary negation and parentheses', () => {
  for (const [s,n] of [['2+3×4',14],['(2+3)×4',20],['2^3^2',512],['-2^2',-4],['(-2)^2',4],['2^-3',.125],['7×8−4×5',36],['1/2i',0]]) near(ev(s).re,n);
  near(ev('1/2i').im,.5);
});
test('implicit multiplication and scientific notation', () => {
  near(ev('2(3+4)').re,14); near(ev('2pi').re,2*Math.PI); near(ev('1.5e-3×10^3').re,1.5); near(ev('2AB',{A:3,B:4}).re,24);
});
test('DEG RAD GRA and inverse trig', () => {
  near(ev('sin(30)').re,.5); near(ev('cos(pi)',{},'RAD').re,-1); near(ev('sin(100)',{},'GRA').re,1);
  near(ev('asin(0.5)').re,30); near(ev('atan(1)',{},'RAD').re,Math.PI/4); assert.throws(()=>ev('tan(90)'),/Math ERROR/);
});
test('logarithms roots and very small nonzero values', () => {
  near(ev('log(1000)+ln(e)').re,4); near(ev('sqrt(81)+cbrt(-8)').re,7); assert.equal(ev('1e-20').re,1e-20);
});
test('complex arithmetic, conjugate, magnitude and phase', () => {
  const z=ev('(2+3i)(4-5i)');near(z.re,23);near(z.im,2);
  const q=ev('(1+i)/(1-i)');near(q.re,0);near(q.im,1);
  near(ev('sqrt(-1)').im,1); near(ev('Conjg(3+4i)').im,-4); near(ev('abs(3+4i)').re,5);near(ev('Arg(1+i)').re,45);
});
test('factorial, combinatorics, percentages and DMS', () => {
  near(ev('5!').re,120); near(ev('nCr(52,5)').re,2598960);near(ev('nPr(10,3)').re,720);near(ev('200×15%').re,30);near(ev('dms(30,15,30)').re,30.2583333333333);
  assert.throws(()=>ev('nCr(3,5)'),/Argument/);assert.throws(()=>ev('70!'),/range/);
});
test('Ans, assignment bridge and fractions', () => {
  const a=run({action:'evaluate',expression:'3+5→A'});assert.equal(a.store,'A');near(a.value.re,8);
  near(ev('Ans+2',{Ans:a.value}).re,10);assert.equal(engine.fraction(ev('1/3')),'1/3');assert.equal(engine.fraction(ev('-1.25')),'-5/4');
});
test('coordinate conversion stores both coordinates and respects angle unit', () => {
  const p=run({action:'evaluate',expression:'Pol(3,4)',angle:'DEG'});near(p.value.re,5);near(p.variables.Y.re,53.130102354156);
  const r=run({action:'evaluate',expression:'Rec(2,pi/2)',angle:'RAD'});near(r.value.re,0);near(r.variables.Y.re,2);
  near(ev('Rnd(1/3)').re,.3333333333,1e-12);
});
test('malformed expressions, domains, stack and overflow fail explicitly', () => {
  for(const s of ['1/0','0^0','log(0)','1e100','2+','sin(1,2)','2..3','foo(1)','process.exit()','(2+3','asin(2)']) assert.throws(()=>ev(s),undefined,s);
  assert.throws(()=>ev('('.repeat(100)+'1'+')'.repeat(100)),/Stack/);
});
test('solver residual and failure at zero derivative', () => {
  const r=run({action:'solve',expression:'X^2=2',guess:1});near(r.x,Math.sqrt(2));near(r.residual,0);
  assert.throws(()=>run({action:'solve',expression:'X^2+1',guess:0}),/Cannot Solve/);
});
test('single variable statistics and linear regression', () => {
  const r=run({action:'statistics',rows:[[1],[2],[3],[4],[5]]});near(r.mean,3);near(r.populationSD,Math.sqrt(2));near(r.sampleSD,Math.sqrt(2.5));
  const q=run({action:'statistics',rows:[[1,3],[2,5],[3,7]]});near(q.slope,2);near(q.intercept,1);near(q.correlation,1);
  assert.equal(run({action:'statistics',rows:[[2]]}).sampleSD,null);assert.throws(()=>run({action:'statistics',rows:[]}),/Data/);
});
test('matrix inverse, determinant, rectangular product and singular errors', () => {
  const a=[[1,2],[3,4]],inverse=run({action:'matrix',a,operation:'inverse'}).result;
  const identity=run({action:'matrix',a,b:inverse,operation:'multiply'}).result;
  near(identity[0][0],1);near(identity[0][1],0);near(identity[1][0],0);near(identity[1][1],1);
  near(run({action:'matrix',a,operation:'determinant'}).result,-2);
  assert.deepEqual(run({action:'matrix',a:[[1,2,3]],b:[[1],[2],[3]],operation:'multiply'}).result,[[14]]);
  assert.throws(()=>run({action:'matrix',a:[[1,2],[2,4]],operation:'inverse'}),/singular/);
  assert.throws(()=>run({action:'matrix',a:[[1],[2,3]],operation:'transpose'}),/Dimension/);
});
test('quadratic, cubic real/complex/repeated roots and linear systems', () => {
  assert.deepEqual(run({action:'polynomial',coefficients:[1,-3,2]}).roots,['2','1']);
  for(const coeffs of [[1,-6,11,-6],[1,0,0,1],[1,-3,3,-1],[1,0,-3,2]]) {
    const roots=run({action:'polynomial',coefficients:coeffs}).roots;
    for(const r of roots){const z=ev(`${coeffs[0]}*(${r})^3+${coeffs[1]}*(${r})^2+${coeffs[2]}*(${r})+${coeffs[3]}`);near(z.re,0,1e-7);near(z.im,0,1e-7);}
  }
  assert.deepEqual(run({action:'linear',a:[[2,1],[1,-1]],b:[[5],[1]]}).roots,['2','1']);
});
test('calculus integral, derivative and summation', () => {
  near(Number(run({action:'calculus',operation:'integral',expression:'X^2',start:0,end:1}).text),1/3);
  near(Number(run({action:'calculus',operation:'integral',expression:'sin(X)',start:0,end:Math.PI,angle:'RAD'}).text),2);
  near(Number(run({action:'calculus',operation:'derivative',expression:'X^3',start:2}).text),12);
  near(Number(run({action:'calculus',operation:'sum',expression:'X',start:1,end:100}).text),5050);
});
test('table floating steps, reverse intervals, recurrence and range guard', () => {
  assert.equal(run({action:'table',expression:'X^2',start:0,end:.3,step:.1}).rows.length,4);
  assert.deepEqual(run({action:'table',expression:'X',start:2,end:0,step:-1}).rows,[['2','2'],['1','1'],['0','0']]);
  assert.deepEqual(run({action:'recurrence',expression:'2A',start:1,end:3,step:1,initial:1}).rows,[['1','2'],['2','4'],['3','8']]);
  assert.throws(()=>run({action:'table',expression:'X',start:0,end:10,step:0}),/Range/);
});
test('base conversion rejects partial parse and out of range', () => {
  assert.equal(run({action:'base',expression:'255',from:10,to:16}).text,'FF');
  assert.equal(run({action:'base',expression:'-128',from:10,to:2}).text,'-10000000');
  assert.throws(()=>run({action:'base',expression:'102',from:2,to:10}),/Invalid/);
  assert.throws(()=>run({action:'base',expression:'2147483648',from:10,to:2}),/range/);
});
test('program matching reference loop stores 100 values and outputs 1003', () => {
  const source='25→A\n100→Dim List X\nIf A=25\nThen "FOR-LOOP"\nFor 1→N To 100\n10×N+3→List X[N]\nNext\nIfEnd\nList X[100]';
  const r=run({action:'program',source});assert.deepEqual(r.output,['FOR-LOOP','1003']);assert.equal(r.lists.X.length,100);near(r.lists.X[0].re,13);
});
test('program nested loops, conditional else and descending Step', () => {
  const r=run({action:'program',source:'0→S\nFor 3→A To 1 Step -1\nFor 1→B To 2\nS+A→S\nNext\nNext\nIf S=12\nThen\n"OK"\nElse\n"FAIL"\nIfEnd\nS'});
  assert.deepEqual(r.output,['OK','12']);
  assert.deepEqual(run({action:'program',source:'If 0\nThen\n"NO"\nElse\n"YES"\nIfEnd'}).output,['YES']);
});
test('program While, Do, Break and labels', () => {
  const r=run({action:'program',source:'0→A\nWhile A<3\nA+1→A\nWhileEnd\nDo\nA-1→A\nLpWhile A>1\nA\nGoto 1\n"NO"\nLbl 1\nFor 1→B To 10\nBreak\nNext\nB'});
  assert.deepEqual(r.output,['1','1']);
});
test('program input, persistence and explicit unsupported commands', () => {
  const r=run({action:'program',source:'?→A\nA×2→B\nB',inputs:{A:6},variables:{M:{re:9,im:0}}});assert.deepEqual(r.output,['12']);near(r.variables.M.re,9);
  assert.throws(()=>run({action:'program',source:'?→A'}),/Input required/);
  assert.throws(()=>run({action:'program',source:'Locate 1,1,"A"'}),/Statement/);
  assert.throws(()=>run({action:'program',source:'For 1→A To 3'}),/unclosed/);
  assert.throws(()=>run({action:'program',source:'While 1\nWhileEnd'}),/Execution limit/);
});
test('JSON bridge operates without Node, isolates requests and returns recoverable errors', () => {
  const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../CaLSimulator/Resources/engine.js'),'utf8'),context);
  const bad=JSON.parse(context.calculateJSON(JSON.stringify({action:'evaluate',expression:'1/0'})));assert.equal(bad.ok,false);
  const good=JSON.parse(context.calculateJSON(JSON.stringify({action:'evaluate',expression:'6×7'})));assert.equal(good.ok,true);assert.equal(good.result.text,'42');
  assert.equal(JSON.parse(context.calculateJSON('{bad')).ok,false);
});
