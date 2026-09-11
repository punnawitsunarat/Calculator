/* Offline numeric engine shared by JavaScriptCore and Node tests. No eval/Function. */
(function (root) {
  'use strict';
  const fail = message => { throw new Error(message); };
  const complex = (re, im = 0) => ({ re: re === 0 ? 0 : re, im: im === 0 ? 0 : im });
  const C = x => typeof x === 'number' ? complex(x) : x;
  const clean = x => Math.abs(x) < 1e-14 ? 0 : x;
  const real = x => { x = C(x); if (Math.abs(x.im) > 1e-12) fail('Real value required'); return x.re; };
  const add = (a,b) => { a=C(a); b=C(b); return complex(a.re+b.re,a.im+b.im); };
  const neg = a => { a=C(a); return complex(-a.re,-a.im); };
  const sub = (a,b) => add(a,neg(b));
  const mul = (a,b) => { a=C(a); b=C(b); return complex(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re); };
  const div = (a,b) => { a=C(a); b=C(b); const d=b.re*b.re+b.im*b.im; if (!d) fail('Math ERROR: division by zero'); return complex((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d); };
  const abs = a => { a=C(a); return Math.hypot(a.re,a.im); };
  const logC = a => { a=C(a); if (!abs(a)) fail('Math ERROR: log(0)'); return complex(Math.log(abs(a)),Math.atan2(a.im,a.re)); };
  const expC = a => { a=C(a); return complex(Math.exp(a.re)*Math.cos(a.im),Math.exp(a.re)*Math.sin(a.im)); };
  const pow = (a,b) => {
    a=C(a); b=C(b);
    if (!a.im && !b.im && a.re < 0 && b.re === .5) return complex(0, Math.sqrt(-a.re));
    if (!a.im && !b.im && (a.re>=0 || Number.isInteger(b.re))) {
      if (!a.re && b.re<=0) fail('Math ERROR: undefined power');
      return complex(Math.pow(a.re,b.re));
    }
    return expC(mul(b,logC(a)));
  };
  const fact = n => { n=real(n); if (!Number.isInteger(n)||n<0||n>69) fail('Math ERROR: factorial range 0…69'); let r=1; for(let i=2;i<=n;i++)r*=i; return r; };
  const numberText = n => {
    if (Object.is(n,-0)) n=0;
    if (!Number.isFinite(n)) fail('Math ERROR: overflow');
    return Number(n.toPrecision(10)).toString();
  };
  function format(z) {
    z=C(z);
    let re=z.re, im=z.im;
    if (im !== 0 && Math.abs(re) < 1e-12 * Math.abs(im)) re = 0;
    if (re !== 0 && Math.abs(im) < 1e-12 * Math.abs(re)) im = 0;
    if (Math.abs(re) < 1e-14 && im !== 0) re = 0;
    if (Math.abs(im) < 1e-14 && re !== 0) im = 0;
    z = complex(re, im);
    const r=numberText(z.re), i=numberText(z.im);
    if (z.im===0) return r;
    return (z.re===0?'':r+(z.im<0?'−':'+'))+(Math.abs(z.im)===1?'':numberText(z.re===0?z.im:Math.abs(z.im)))+(z.re===0&&z.im===-1?'−':'')+'i';
  }
  function checked(z) {
    z=C(z);
    if (!Number.isFinite(z.re)||!Number.isFinite(z.im)||abs(z)>=1e100) fail('Math ERROR: overflow');
    return z;
  }
  function tokenize(source) {
    source=source.replace(/(\d+(?:\.\d*)?|\.\d+)°(?:(\d+(?:\.\d*)?|\.\d+)′)?(?:(\d+(?:\.\d*)?|\.\d+)″)?/g,(_,d,m,s)=>`(${Number(d)+Number(m||0)/60+Number(s||0)/3600})`);
    source=source.replace(/arc\s*(sin|cos|tan)/gi,(_,f)=>'a'+f.toLowerCase()).replace(/(sin|cos|tan)⁻¹/g,(_,f)=>'a'+f);
    source=source.replace(/×/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/π/g,'pi').replace(/³√/g,'cbrt').replace(/√/g,'sqrt').replace(/²/g,'^2').replace(/⁻¹/g,'^(-1)').replace(/≠/g,'!=').replace(/≤/g,'<=').replace(/≥/g,'>=');
    if(source.length>4096) fail('Expression too long');
    const out=[]; let p=0;
    const names=['asinh','acosh','atanh','Conjg','sqrt','cbrt','sinh','cosh','tanh','asin','acos','atan','floor','round','logab','RandInt','Frac','Intg','Int','log','sin','cos','tan','abs','exp','int','ln','ReP','ImP','Arg','Ans','pi','nCr','nPr','mod','dms','min','max','gcd','lcm','Pol','Rec','Rnd','Not','not','NOT'];
    while(p<source.length) {
      const rest=source.slice(p); let m;
      if((m=/^\s+/.exec(rest))) {p+=m[0].length;continue;}
      if(rest.startsWith('Ran#')){out.push({t:'num',v:Math.floor(Math.random()*1e9)/1e9});p+=4;continue;}
      if((m=/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest))) {
        if(rest[m[0].length]==='.'||(out.length&&out[out.length-1].t==='num'))fail('Syntax ERROR: malformed number');
        out.push({t:'num',v:Number(m[0])});p+=m[0].length;continue;
      }
      if((m=/^(?:And|Or)\b/i.exec(rest))){out.push({t:'op',v:m[0]});p+=m[0].length;continue;}
      const name=names.find(n=>rest.startsWith(n));
      if(name){out.push({t:'name',v:name});p+=name.length;continue;}
      if((m=/^"[^"]*"/.exec(rest))){out.push({t:'str',v:m[0]});p+=m[0].length;continue;}
      if((m=/^(?:!=|<=|>=|==|[+*/^!%(),\-<>=∠:◢?]|[A-Za-z\u0370-\u03ff])/.exec(rest))) {
        out.push({t:/^[A-Za-z\u0370-\u03ff]$/.test(m[0])?'name':'op',v:m[0]});p+=m[0].length;continue;
      }
      fail('Syntax ERROR near '+rest.slice(0,12));
    }
    out.push({t:'end',v:''}); return out;
  }
  function evaluate(source, variables={}, angle='DEG') {
    const tokens=tokenize(source); let p=0, depth=0;
    const scale=angle==='RAD'?1:angle==='GRA'?Math.PI/200:Math.PI/180;
    const unary={
      sqrt:x=>pow(x,.5), cbrt:x=>Math.cbrt(real(x)), abs:x=>abs(x), ln:logC, log:x=>div(logC(x),Math.LN10), exp:expC,
      sin:x=>clean(Math.sin(real(x)*scale)), cos:x=>clean(Math.cos(real(x)*scale)), tan:x=>{const v=real(x)*scale;if(Math.abs(Math.cos(v))<1e-14)fail('Math ERROR: tan');return Math.tan(v);},
      asin:x=>{const v=real(x);if(v< -1||v>1)fail('Math ERROR: sin⁻¹ domain −1…1');return Math.asin(v)/scale;}, acos:x=>{const v=real(x);if(v< -1||v>1)fail('Math ERROR: cos⁻¹ domain −1…1');return Math.acos(v)/scale;}, atan:x=>Math.atan(real(x))/scale,
      sinh:x=>Math.sinh(real(x)), cosh:x=>Math.cosh(real(x)), tanh:x=>Math.tanh(real(x)),
      asinh:x=>Math.asinh(real(x)), acosh:x=>Math.acosh(real(x)), atanh:x=>Math.atanh(real(x)),
      int:x=>Math.trunc(real(x)), floor:x=>Math.floor(real(x)), round:x=>Math.round(real(x)), Rnd:x=>Number(real(x).toPrecision(10)),
      Int:x=>Math.trunc(real(x)),Intg:x=>Math.floor(real(x)),Frac:x=>real(x)-Math.trunc(real(x)),
      Conjg:x=>complex(C(x).re,-C(x).im), ReP:x=>C(x).re, ImP:x=>C(x).im, Arg:x=>Math.atan2(C(x).im,C(x).re)/scale
    };
    const accept=v=>tokens[p].v===v?(p++,true):false;
    function expression(min=0) {
      if(++depth>80)fail('Stack ERROR');
      let t=tokens[p++], a;
      if(t.t==='num')a=C(t.v);
      else if(t.v==='+'||t.v==='-'){a=expression(35);if(t.v==='-')a=neg(a);}
      else if(t.v==='∠'){const b=expression(30);const th=real(b)*scale;let c=Math.cos(th),s=Math.sin(th);if(Math.abs(c)<1e-15)c=0;if(Math.abs(s)<1e-15)s=0;a=complex(c,s);}
      else if(t.v==='('){a=expression();if(!accept(')'))fail('Syntax ERROR: missing )');}
      else if(t.t==='name') {
        if(unary[t.v]||['nCr','nPr','mod','min','max','gcd','lcm','dms','Pol','Rec','logab','RandInt'].includes(t.v)) {
          const args=[];
          if(accept('(')){args.push(expression());while(accept(','))args.push(expression());if(!accept(')'))fail('Syntax ERROR: missing )');}
          else args.push(expression(35));
          if(unary[t.v]){if(args.length!==1)fail('Argument ERROR');a=C(unary[t.v](args[0]));}
          else {
            const v=args.map(real), n=v[0],r=v[1];
            if(t.v==='dms'){if(v.length!==3||v[1]<0||v[1]>=60||v[2]<0||v[2]>=60)fail('Argument ERROR');a=C((n<0?-1:1)*(Math.abs(n)+r/60+v[2]/3600));}
            else {if(v.length!==2)fail('Argument ERROR');
              if(t.v==='nCr'||t.v==='nPr'){if(!Number.isInteger(n)||!Number.isInteger(r)||r<0||n<r||n>1e4)fail('Argument ERROR');let q=1;for(let k=0;k<r;k++)q*=t.v==='nCr'?(n-k)/(k+1):n-k;a=C(q);}
              else if(t.v==='Pol'||t.v==='Rec'){
                const x=t.v==='Pol'?Math.hypot(n,r):n*Math.cos(r*scale),y=t.v==='Pol'?Math.atan2(r,n)/scale:n*Math.sin(r*scale);
                variables.I=C(x);variables.J=C(y);a=C(x);
              }
              else if(t.v==='logab'){if(n<=0||n===1||r<=0)fail('Math ERROR: logarithm domain');a=C(Math.log(r)/Math.log(n));}
              else if(t.v==='RandInt'){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r)||r<n)fail('Argument ERROR');a=C(n+Math.floor(Math.random()*(r-n+1)));}
              else if(t.v==='mod'){if(!r)fail('Math ERROR: division by zero');a=C(n%r);}
              else if(t.v==='min')a=C(Math.min(n,r));
              else if(t.v==='max')a=C(Math.max(n,r));
              else {if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))fail('Integer required');let x=Math.abs(n),y=Math.abs(r);while(y){const v=x%y;x=y;y=v;}a=C(t.v==='gcd'?x:x?Math.abs(n*r)/x:0);}
            }
          }
        } else if(t.v==='pi')a=C(Math.PI);
        else if(t.v==='e')a=C(Math.E);
        else if(t.v==='i')a=complex(0,1);
        else if(/^not$/i.test(t.v))a=C(Number(real(expression(5))===0));
        else if(t.v==='Ans'||/^[A-Z]$/.test(t.v))a=C(variables[t.v]===undefined?0:variables[t.v]);
        else fail('Unknown name: '+t.v);
      } else fail('Syntax ERROR: expected a value');
      while(true) {
        const t=tokens[p];
        if((t.v==='!'||t.v==='%')&&50>=min){p++;a=t.v==='!'?C(fact(a)):div(a,100);continue;}
        const implicit=t.t==='num'||t.t==='name'||t.v==='(';
        const op=implicit?'*':t.v;
        const bp=implicit?20:({'=':5,'==':5,'!=':5,'<':5,'>':5,'<=':5,'>=':5,'And':4,'and':4,'AND':4,'Or':3,'or':3,'OR':3,'+':10,'-':10,'*':20,'/':20,'∠':30,'^':40}[op]);
        if(bp===undefined||bp<min)break;
        if(!implicit)p++;
        const b=expression(op==='^'?bp:bp+1);
        if(op==='+')a=add(a,b);else if(op==='-')a=sub(a,b);else if(op==='*')a=mul(a,b);else if(op==='/')a=div(a,b);else if(op==='^')a=pow(a,b);
        else if(op==='∠'){const th=real(b)*scale;let c=Math.cos(th),s=Math.sin(th);if(Math.abs(c)<1e-15)c=0;if(Math.abs(s)<1e-15)s=0;a=mul(a,complex(c,s));}
        else if(/^and$/i.test(op)){a=C(Number(real(a)!==0&&real(b)!==0));}
        else if(/^or$/i.test(op)){a=C(Number(real(a)!==0||real(b)!==0));}
        else {const x=real(a),y=real(b);a=C(Number(op==='='||op==='=='?x===y:op==='!='?x!==y:op==='<'?x<y:op==='>'?x>y:op==='<='?x<=y:x>=y));}
        a=checked(a);
      }
      depth--;return checked(a);
    }
    const result=expression();if(tokens[p].t!=='end')fail('Syntax ERROR: unexpected '+tokens[p].v);return result;
  }
  function fraction(value) {
    const n=real(value); if(!Number.isFinite(n))fail('Math ERROR');
    const sign=n<0?-1:1; let x=Math.abs(n),h0=0,h1=1,k0=1,k1=0;
    for(let i=0;i<30;i++){const a=Math.floor(x),h=a*h1+h0,k=a*k1+k0;if(k>1000000||!Number.isSafeInteger(h))break;h0=h1;h1=h;k0=k1;k1=k;if(Math.abs(n-sign*h/k)<1e-12)break;if(x===a)break;x=1/(x-a);}
    return k1===1?String(sign*h1):`${sign*h1}/${k1}`;
  }
  function solve(source, guess, vars, angle, variable='X') {
    if(!/^[A-Z]$/.test(variable))fail('Invalid solve variable');
    const parts=source.split(/=(?!=)/);if(parts.length>2)fail('One equation required');
    const f=x=>real(evaluate(parts.length===2?`(${parts[0]})-(${parts[1]})`:source,Object.assign({},vars,{[variable]:x}),angle));
    let x=guess;
    for(let i=0;i<100;i++){const y=f(x);if(Math.abs(y)<1e-10)return {x,residual:y};const h=1e-5*Math.max(1,Math.abs(x));const d=(f(x+h)-f(x-h))/(2*h);if(Math.abs(d)<1e-15)fail('Cannot Solve: try another initial X');x-=y/d;if(!Number.isFinite(x)||Math.abs(x)>1e50)break;}
    fail('Cannot Solve: no convergence');
  }
  function statistics(rows) {
    if(!rows.length||rows.some(r=>!Number.isFinite(r[0])||(r.length>1&&!Number.isFinite(r[1]))))fail('Data ERROR');
    const xs=rows.map(r=>r[0]),n=xs.length,mean=xs.reduce((a,b)=>a+b,0)/n,ss=xs.reduce((a,x)=>a+(x-mean)**2,0);
    const result={n, sum:xs.reduce((a,b)=>a+b,0),sumSquares:xs.reduce((a,b)=>a+b*b,0),mean,populationSD:Math.sqrt(ss/n),sampleSD:n>1?Math.sqrt(ss/(n-1)):null,min:Math.min(...xs),max:Math.max(...xs)};
    if(rows.every(r=>r.length===2)) {
      const ys=rows.map(r=>r[1]),ym=ys.reduce((a,b)=>a+b,0)/n,sy=ys.reduce((a,y)=>a+(y-ym)**2,0),cov=xs.reduce((a,x,i)=>a+(x-mean)*(ys[i]-ym),0);
      result.intercept=ss?ym-cov/ss*mean:null;result.slope=ss?cov/ss:null;result.correlation=ss&&sy?cov/Math.sqrt(ss*sy):null;
    }
    return result;
  }
  function matrix(a,b,op) {
    const validate=m=>{if(!Array.isArray(m)||!m.length||m.length>10||!Array.isArray(m[0])||!m[0].length||m[0].length>10||m.some(r=>r.length!==m[0].length||r.some(x=>!Number.isFinite(x))))fail('Dimension ERROR');};
    validate(a);const n=a.length,m=a[0].length;
    if(op==='transpose')return a[0].map((_,i)=>a.map(r=>r[i]));
    if(['add','subtract','multiply'].includes(op)){
      validate(b);
      if(op==='multiply'){if(m!==b.length)fail('Dimension ERROR');return a.map(r=>b[0].map((_,j)=>r.reduce((s,x,k)=>s+x*b[k][j],0)));}
      if(n!==b.length||m!==b[0].length)fail('Dimension ERROR');return a.map((r,i)=>r.map((x,j)=>op==='add'?x+b[i][j]:x-b[i][j]));
    }
    if(n!==m)fail('Square matrix required');
    let mat=a.map((r,i)=>r.concat(Array.from({length:n},(_,j)=>Number(i===j)))),det=1;
    for(let k=0;k<n;k++){
      let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(mat[i][k])>Math.abs(mat[pivot][k]))pivot=i;
      if(Math.abs(mat[pivot][k])<1e-14){if(op==='determinant')return 0;fail('Math ERROR: singular matrix');}
      if(pivot!==k){[mat[k],mat[pivot]]=[mat[pivot],mat[k]];det=-det;}
      const d=mat[k][k];det*=d;mat[k]=mat[k].map(x=>x/d);
      for(let i=0;i<n;i++){if(i===k)continue;const f=mat[i][k];mat[i]=mat[i].map((x,j)=>x-f*mat[k][j]);}
    }
    if(op==='determinant')return det;if(op==='inverse')return mat.map(r=>r.slice(n));fail('Unknown matrix operation');
  }
  function matrixExpression(source,memories,variables,angle){
    const tokens=source.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').match(/Mat\s*(?:Ans|[A-F])|det|Trn|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[A-Z]|\S/g)||[];
    let p=0;const isMatrix=Array.isArray;
    const scalar=x=>{if(isMatrix(x))fail('Math ERROR: scalar required');return x;};
    function expr(min=0){let t=tokens[p++],a;
      if(t==='-'||t==='+'){a=expr(35);if(t==='-')a=isMatrix(a)?a.map(r=>r.map(x=>-x)):-a;}
      else if(t==='('){a=expr();if(tokens[p++]!==')')fail('Syntax ERROR');}
      else if(t==='det'||t==='Trn'){if(tokens[p++]!=='(')fail('Syntax ERROR');a=expr();if(tokens[p++]!==')'||!isMatrix(a))fail('Argument ERROR');a=matrix(a,null,t==='det'?'determinant':'transpose');}
      else if(/^Mat/.test(t||'')){a=memories[t.replace(/Mat\s*/,'')];if(!a)fail('Dimension ERROR: '+t);a=a.map(r=>r.slice());}
      else if(/^(?:\d|\.)/.test(t||''))a=Number(t);
      else if(/^[A-Z]$/.test(t||''))a=real(variables[t]||C(0));
      else fail('Syntax ERROR: matrix expression');
      while(p<tokens.length){const op=tokens[p],bp={'+':10,'-':10,'*':20,'/':20,'^':40}[op];if(bp===undefined||bp<min)break;p++;const b=expr(op==='^'?bp:bp+1);
        if(op==='^'&&isMatrix(a)){const n=scalar(b);if(!Number.isInteger(n)||n< -1||n>10)fail('Math ERROR: matrix power');if(n===-1)a=matrix(a,null,'inverse');else{if(a.length!==a[0].length)fail('Dimension ERROR');let result=a.map((r,i)=>r.map((_,j)=>Number(i===j)));for(let i=0;i<n;i++)result=matrix(result,a,'multiply');a=result;}}
        else if(isMatrix(a)&&isMatrix(b)){if(!['+','-','*'].includes(op))fail('Math ERROR');a=matrix(a,b,{'+':'add','-':'subtract','*':'multiply'}[op]);}
        else if(isMatrix(a)||isMatrix(b)){if(op==='*'){const m=isMatrix(a)?a:b,n=isMatrix(a)?b:a;a=m.map(r=>r.map(v=>v*n));}else if(op==='/'&&isMatrix(a)&&b!==0)a=a.map(r=>r.map(v=>v/b));else fail('Math ERROR: matrix/scalar operation');}
        else {if(op==='/'&&!b)fail('Math ERROR: division by zero');a=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:a**b;}
      }return a;
    }
    const result=expr();if(p!==tokens.length)fail('Syntax ERROR');const values=isMatrix(result)?result.flat():[result];if(values.some(v=>!Number.isFinite(v)))fail('Math ERROR');return result;
  }
  function polynomial(coefficients) {
    const c=coefficients; if(c.length<3||c.length>4||!c[0]||c.some(x=>!Number.isFinite(x)))fail('Enter 3 or 4 coefficients; leading coefficient must be nonzero');
    if(c.length===3){const d=pow(C(c[1]*c[1]-4*c[0]*c[2]),.5);return [div(add(-c[1],d),2*c[0]),div(sub(-c[1],d),2*c[0])];}
    const a=c[1]/c[0],b=c[2]/c[0],d=c[3]/c[0],p=b-a*a/3,q=2*a*a*a/27-a*b/3+d,disc=q*q/4+p*p*p/27;
    if(disc>=0){const u=Math.cbrt(-q/2+Math.sqrt(disc)),v=Math.cbrt(-q/2-Math.sqrt(disc));return [C(u+v-a/3),complex(-(u+v)/2-a/3,Math.sqrt(3)*(u-v)/2),complex(-(u+v)/2-a/3,-Math.sqrt(3)*(u-v)/2)];}
    const r=2*Math.sqrt(-p/3),theta=Math.acos(Math.max(-1,Math.min(1,3*q/(p*r))));return [0,1,2].map(k=>C(r*Math.cos((theta-2*k*Math.PI)/3)-a/3));
  }
  function calculus(op, source,a,b,vars,angle) {
    const f=x=>real(evaluate(source,Object.assign({},vars,{X:x}),angle));
    if(op==='derivative'){const h=1e-4*Math.max(1,Math.abs(a));return (f(a-2*h)-8*f(a-h)+8*f(a+h)-f(a+2*h))/(12*h);}
    if(op==='secondDerivative'){const h=1e-3*Math.max(1,Math.abs(a));return (-f(a+2*h)+16*f(a+h)-30*f(a)+16*f(a-h)-f(a-2*h))/(12*h*h);}
    if(op==='sum'){if(!Number.isInteger(a)||!Number.isInteger(b)||b<a||b-a>10000)fail('Range ERROR');let v=0;for(let i=a;i<=b;i++)v+=f(i);return v;}
    if(op!=='integral')fail('Unknown calculus operation');
    const sim=(a,b,fa,fm,fb)=>(b-a)*(fa+4*fm+fb)/6;
    const recurse=(a,b,fa,fm,fb,s,tol,depth)=>{const m=(a+b)/2,l=f((a+m)/2),r=f((m+b)/2),sl=sim(a,m,fa,l,fm),sr=sim(m,b,fm,r,fb),err=sl+sr-s;if(Math.abs(err)<=15*tol)return sl+sr+err/15;if(!depth)fail('Integration did not converge');return recurse(a,m,fa,l,fm,sl,tol/2,depth-1)+recurse(m,b,fm,r,fb,sr,tol/2,depth-1);};
    const fa=f(a),fm=f((a+b)/2),fb=f(b);return recurse(a,b,fa,fm,fb,sim(a,b,fa,fm,fb),1e-8,16);
  }
  function* programSteps(source,initial={},angle='DEG',inputs={},interactive=false,programs={},shared=null,level=0) {
    if(level>10)fail('Ne ERROR: subroutine nesting exceeds 10 levels');
    // A subroutine uses the caller's memories, display and execution budget.
    const state=shared||{vars:Object.assign({},initial),lists:{},output:[],angle,steps:0,stopped:false,lastDisplay:null,pendingDisplay:false};
    const {vars,lists,output}=state,stack=[],pairs={},elses={},labels={},thens={},lines=[],origins=[];
    const statements=source.replace(/->/g,'→').replace(/◢(?=(?:[^"]*"[^"]*")*[^"]*$)/g,'\n◢\n').split(/\r?\n|:(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(s=>s.trim()).filter(s=>s&&!s.startsWith("'"));
    // Then/Else can carry a statement on the same line (manual E-116).
    statements.forEach((s,i)=>{
      const append=text=>{lines.push(text);origins.push(i+1);};
      let match;
      if((match=/^(Then|Else)\s+(.+)$/i.exec(s))){append(match[1]);append(match[2]);}
      else if((match=/^(If\s+.+)\s+Then$/i.exec(s))){append(match[1]);append('Then');}
      else append(s);
    });
    if(lines.length>4000)fail('Program too long');
    const emit=s=>{if(output.length>=2000)fail('Output limit exceeded');output.push(s);state.lastDisplay=s;state.pendingDisplay=false;};
    const result=z=>{vars.Ans=checked(z);state.lastDisplay=format(z);state.pendingDisplay=true;return z;};
    lines.forEach((s,i)=>{
      if(/^(If\s|For\s|While\s|Do$)/i.test(s))stack.push({i,type:s.split(/\s/)[0].toLowerCase()});
      else if(/^Then$/i.test(s)){const top=stack[stack.length-1];if(!top||top.type!=='if'||thens[top.i]!==undefined||elses[top.i]!==undefined)fail('Syntax ERROR: Then');thens[top.i]=i;}
      else if(/^Else$/i.test(s)){const top=stack[stack.length-1];if(!top||top.type!=='if'||thens[top.i]===undefined||elses[top.i]!==undefined)fail('Syntax ERROR: Else');elses[top.i]=i;}
      else if(/^(IfEnd|Next|WhileEnd|LpWhile\s.+)$/i.test(s)){
        const top=stack.pop(),type=/^IfEnd/i.test(s)?'if':/^Next/i.test(s)?'for':/^WhileEnd/i.test(s)?'while':'do';
        if(!top||top.type!==type)fail('Syntax ERROR: unmatched '+s);
        if(type==='if'&&thens[top.i]===undefined)fail('Syntax ERROR: If requires Then');
        pairs[top.i]=i;pairs[i]=top.i;if(elses[top.i]!==undefined)pairs[elses[top.i]]=i;
      } else if(/^Lbl\s/i.test(s)){const name=s.slice(4).trim();if(!/^[0-9A-Z]$/.test(name))fail('Syntax ERROR: label');if(labels[name]!==undefined)fail('Duplicate label');labels[name]=i;}
    });
    if(stack.length)fail('Syntax ERROR: unclosed block');
    const ev=s=>evaluate(s.replace(/List\s+([A-Z])\[([^\]]+)\]/g,(_,name,index)=>{const i=real(evaluate(index,vars,state.angle));if(!Number.isInteger(i)||i<1||!lists[name]||i>lists[name].length)fail('List index ERROR');return '('+format(lists[name][i-1])+')';}),vars,state.angle);
    const loops={};let pc=0;
    const skip=()=>{pc++;if(lines[pc]==='◢')pc++;};
    while(pc<lines.length&&!state.stopped){
      if(++state.steps>20000)fail('Execution limit: possible infinite loop');
      let s=lines[pc],m;const here=pc;pc++;
      try {
        if((m=/^([^"\n]+?)⇒\s*(.+)$/.exec(s))){if(!real(ev(m[1]))){if(lines[pc]==='◢')pc++;continue;}s=m[2].trim();}
        if(/^If\s/i.test(s)){if(!real(ev(s.slice(3))))pc=(elses[here]===undefined?pairs[here]:elses[here])+1;}
        else if(/^Then$/i.test(s)){}
        else if(/^Else$/i.test(s))pc=pairs[here]+1;
        else if(/^IfEnd$/i.test(s)){}
        else if(/^(Deg|Rad|Gra)$/i.test(s))state.angle=s.toUpperCase();
        else if(/^(Cls|ClrText)$/i.test(s)){output.length=0;state.lastDisplay=null;state.pendingDisplay=false;}
        else if(/^ClrMemory$/i.test(s)){for(const name of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')vars[name]=C(0);vars.Ans=C(0);}
        else if((m=/^Prog\s+(?:"([^"]+)"|([A-Za-z0-9_-]+))$/i.exec(s))){
          const subName=m[1]||m[2];
          const sub=Array.isArray(programs)?programs.find(p=>p.name===subName):(Object.prototype.hasOwnProperty.call(programs,subName)?programs[subName]:undefined);
          const subSource=typeof sub==='string'?sub:sub?.source;
          if(typeof subSource!=='string')fail('Go ERROR: program '+subName+' not found');
          if(sub?.mode&&sub.mode!=='COMP')fail('Mode ERROR: subroutine must use COMP mode');
          yield* programSteps(subSource,vars,state.angle,inputs,interactive,programs,state,level+1);
        }
        else if((m=/^For\s+(.+?)→\s*([A-Z])\s+To\s+(.+?)(?:\s+Step\s+(.+))?$/i.exec(s))){const start=real(ev(m[1])),end=real(ev(m[3])),step=m[4]?real(ev(m[4])):1;if(!step)fail('Step must not be zero');vars[m[2]]=C(start);loops[here]={variable:m[2],end,step};if(step>0?start>end:start<end)pc=pairs[here]+1;}
        else if(/^Next$/i.test(s)){const start=pairs[here],loop=loops[start];if(!loop)fail('Next without active For');const v=real(vars[loop.variable])+loop.step;vars[loop.variable]=C(v);if(loop.step>0?v<=loop.end:v>=loop.end)pc=start+1;else delete loops[start];}
        else if(/^While /i.test(s)){if(!real(ev(s.slice(6))))pc=pairs[here]+1;}
        else if(/^WhileEnd$/i.test(s))pc=pairs[here];
        else if(/^Do$/i.test(s)){}
        else if(/^LpWhile /i.test(s)){if(real(ev(s.slice(8))))pc=pairs[here]+1;}
        else if(/^Break$/i.test(s)){let target=-1;for(let i=here-1;i>=0;i--)if(/^(For |While |Do$)/i.test(lines[i])&&pairs[i]>here){target=i;break;}if(target<0)fail('Break outside loop');delete loops[target];pc=pairs[target]+1;}
        else if(/^Return$/i.test(s))break;
        else if(/^Stop$/i.test(s)){state.stopped=true;break;}
        else if((m=/^(Isz|Dsz)\s+([A-Z])$/i.exec(s))){const name=m[2].toUpperCase(),value=checked(add(vars[name]||C(0),/^Isz$/i.test(m[1])?1:-1));vars[name]=value;if(real(value)===0)skip();}
        else if(/^Lbl /i.test(s)){}
        else if(/^Goto /i.test(s)){const i=labels[s.slice(5).trim()];if(i===undefined)fail('Go ERROR: label not found');pc=i+1;}
        else if((m=/^(.+)→Dim\s+List\s+([A-Z])$/i.exec(s))){const n=real(ev(m[1]));if(!Number.isInteger(n)||n<1||n>1000)fail('List dimension 1…1000');lists[m[2]]=Array.from({length:n},()=>C(0));}
        else if(s==='◢'){const text=state.lastDisplay??format(vars.Ans||C(0));if(state.pendingDisplay)emit(text);if(interactive)yield {type:'display',text,variables:vars,angle:state.angle,statement:origins[here]};}
        else if((m=/^(?:"([^"]*)")?\s*\?\s*(→\s*)?([A-Z])$/.exec(s))){
          const promptText=m[1]!==undefined?m[1]+'?':m[3]+'?',varName=m[3],keepCurrent=!m[2],currentValue=vars[varName]||C(0);
          let value = inputs[varName];
          if(interactive)value=yield {type:'input',variable:varName,prompt:promptText,variables:vars,angle:state.angle,keepCurrent,currentValue,statement:origins[here]};
          if(keepCurrent&&(value===undefined||value===''))value=currentValue;
          if(value === undefined) fail('Input required: ' + varName + ' (enter it in Inputs)');
          vars[varName]=result(typeof value==='string'?ev(value):checked(C(value)));
        }
        else if((m=/^(.+)→\s*List\s+([A-Z])\[([^\]]+)\]$/i.exec(s))){const i=real(ev(m[3]));if(!Number.isInteger(i)||!lists[m[2]]||i<1||i>lists[m[2]].length)fail('List index ERROR');lists[m[2]][i-1]=ev(m[1]);}
        else if((m=/^(.+)→\s*([A-Z])$/.exec(s)))vars[m[2]]=result(ev(m[1]));
        else if((m=/^([A-Z])\s*=\s*(.+)$/.exec(s))){const val=ev(m[2]);vars[m[1]]=val;vars.Ans=val;emit(format(val));}
        else if(/^".*"$/.test(s))emit(s.slice(1,-1));
        else {const z=ev(s.replace(/◢$/,''));vars.Ans=z;emit(format(z));}
      } catch(e){fail('Statement '+origins[here]+': '+e.message);}
    }
    return {variables:vars,lists,output,steps:state.steps,angle:state.angle,stopped:state.stopped};
  }
  function runProgram(source,initial={},angle='DEG',inputs={},programs={}){return programSteps(source,initial,angle,inputs,false,programs).next().value;}
  function evaluateBase(source, defaultBase = 10, signed = true, vars = {}) {
    const baseMap = { BIN: 2, OCT: 8, DEC: 10, HEX: 16, '2': 2, '8': 8, '10': 10, '16': 16 };
    const currentBase = baseMap[defaultBase] || 10;
    source = source.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').trim();
    if (!source) fail('Syntax ERROR');

    const tokens = [];
    let p = 0;
    while (p < source.length) {
      const rest = source.slice(p);
      if (/^\s+/.test(rest)) { p += rest.match(/^\s+/)[0].length; continue; }
      let m = /^(and|or|xor|xnor|not|neg)/i.exec(rest);
      if (m) {
        tokens.push({ t: 'op', v: m[1].toLowerCase() });
        p += m[0].length;
        continue;
      }
      if (/^[+\-*/()]/.test(rest)) {
        tokens.push({ t: 'op', v: rest[0] });
        p += 1;
        continue;
      }
      if (rest.startsWith('Ans')) {
        const val = vars.Ans ? (vars.Ans.re | 0) : 0;
        tokens.push({ t: 'num', v: val });
        p += 3;
        continue;
      }
      m = /^([dhbo])\s*([0-9a-f]+)/i.exec(rest);
      if (m) {
        const pfx = m[1].toLowerCase(), numStr = m[2];
        const pfxBase = { d: 10, h: 16, b: 2, o: 8 }[pfx];
        const valids = { 10: /^[0-9]+$/, 16: /^[0-9a-f]+$/i, 2: /^[01]+$/, 8: /^[0-7]+$/ };
        if (!valids[pfxBase].test(numStr)) fail('Syntax ERROR');
        tokens.push({ t: 'num', v: parseInt(numStr, pfxBase) | 0 });
        p += m[0].length;
        continue;
      }
      if (currentBase === 16) {
        m = /^[0-9a-f]+/i.exec(rest);
        if (m) {
          tokens.push({ t: 'num', v: parseInt(m[0], 16) | 0 });
          p += m[0].length;
          continue;
        }
      } else {
        m = /^[0-9a-f]+/i.exec(rest);
        if (m) {
          const valids = { 10: /^[0-9]+$/, 2: /^[01]+$/, 8: /^[0-7]+$/ };
          if (!valids[currentBase].test(m[0])) fail('Syntax ERROR: invalid digit for base');
          tokens.push({ t: 'num', v: parseInt(m[0], currentBase) | 0 });
          p += m[0].length;
          continue;
        }
      }
      fail('Syntax ERROR near ' + rest.slice(0, 10));
    }
    tokens.push({ t: 'end', v: '' });

    let tp = 0;
    function expr(min = 0) {
      let t = tokens[tp++];
      let a;
      if (!t) fail('Syntax ERROR');
      if (t.t === 'num') {
        a = t.v;
      } else if (t.v === '+') {
        a = expr(30);
      } else if (t.v === '-') {
        a = (-expr(30)) | 0;
      } else if (t.v === 'not') {
        if (tokens[tp]?.v === '(') {
          tp++;
          a = (~expr(0)) | 0;
          if (tokens[tp++]?.v !== ')') fail('Syntax ERROR: missing )');
        } else {
          a = (~expr(30)) | 0;
        }
      } else if (t.v === 'neg') {
        if (tokens[tp]?.v === '(') {
          tp++;
          a = (-expr(0)) | 0;
          if (tokens[tp++]?.v !== ')') fail('Syntax ERROR: missing )');
        } else {
          a = (-expr(30)) | 0;
        }
      } else if (t.v === '(') {
        a = expr(0);
        if (tokens[tp++]?.v !== ')') fail('Syntax ERROR: missing )');
      } else {
        fail('Syntax ERROR');
      }

      while (true) {
        const nt = tokens[tp];
        if (!nt || nt.t === 'end') break;
        const op = nt.v;
        const bp = {
          'or': 6, 'xor': 6, 'xnor': 6,
          'and': 8,
          '+': 10, '-': 10,
          '*': 20, '/': 20
        }[op];
        if (bp === undefined || bp < min) break;
        tp++;
        const b = expr(bp + 1);
        if (op === '+') a = (a + b) | 0;
        else if (op === '-') a = (a - b) | 0;
        else if (op === '*') a = Math.imul(a, b);
        else if (op === '/') {
          if (b === 0) fail('Math ERROR: division by zero');
          a = Math.trunc(a / b) | 0;
        }
        else if (op === 'and') a = (a & b) | 0;
        else if (op === 'or') a = (a | b) | 0;
        else if (op === 'xor') a = (a ^ b) | 0;
        else if (op === 'xnor') a = (~(a ^ b)) | 0;
      }
      return a;
    }

    const value = expr(0);
    if (tokens[tp].t !== 'end') fail('Syntax ERROR: unexpected ' + tokens[tp].v);

    function formatVal(n, base, isSigned) {
      n = n | 0;
      if (base === 10) {
        if (!isSigned && n < 0) return (n >>> 0).toString(10);
        return n.toString(10).replace('-', '−');
      }
      return (n >>> 0).toString(base).toUpperCase();
    }

    return {
      value,
      text: formatVal(value, currentBase, signed)
    };
  }
  function dispatch(request) {
    const r=request,vars=r.variables||{},angle=r.angle||'DEG';
    switch(r.action) {
      case 'baseEvaluate': return evaluateBase(r.expression, r.base, r.signed, vars);
      case 'evaluate':{
        let s=r.expression;
        if(s.includes(':')||s.includes('◢')||s.includes('?')){
          const prog=runProgram(s,vars,angle);
          Object.assign(vars, prog.variables);
          const out=prog.output.at(-1);
          const val=vars.Ans||(out!==undefined?C(Number(out)||0):C(0));
          return {value:val,text:out!==undefined?out:format(val),variables:vars};
        }
        const m=/^(.*?)\s*(?:→|->)\s*([A-Za-z\u0370-\u03ff])$/.exec(s);
        if(m)s=m[1];
        const value=evaluate(s,vars,angle);
        return {value,text:format(value),store:m?m[2]:null,variables:vars};
      }
      case 'fraction':return {text:fraction(r.value)};
      case 'format':return {text:format(r.value)};
      case 'solve':return solve(r.expression,Number(r.guess||0),vars,angle,r.variable||'X');
      case 'variables':return {names:[...new Set(tokenize(r.expression).filter(t=>t.t==='name'&&/^[A-Za-z\u0370-\u03ff]$/.test(t.v)).map(t=>t.v))]};
      case 'statistics':return statistics(r.rows);
      case 'matrix':return {result:matrix(r.a,r.b,r.operation)};
      case 'matrixExpression':return {result:matrixExpression(r.expression,r.matrices||{},vars,angle)};
      case 'polynomial':{
        const c=r.coefficients,roots=polynomial(c).map(format);
        let vertex=null;
        if(c.length===3&&c[0]){
          const xv=-c[1]/(2*c[0]),yv=c[2]-(c[1]*c[1])/(4*c[0]);
          vertex={type:c[0]>0?'Minimum':'Maximum',x:format(C(xv)),y:format(C(yv))};
        }
        return {roots,vertex};
      }
      case 'linear':{const inverse=matrix(r.a,null,'inverse');return {roots:matrix(inverse,r.b,'multiply').map(row=>numberText(row[0]))};}
      case 'calculus':return {text:numberText(calculus(r.operation,r.expression,r.start,r.end,vars,angle))};
      case 'table':case 'recurrence':{
        const {start,end,step}=r;if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isFinite(step)||step===0||(end-start)/step<0||(end-start)/step>199)fail('Range ERROR: maximum 200 rows');
        const rows=[];let previous=r.initial||0;for(let i=0;i<=Math.floor((end-start)/step+1e-10);i++){const x=start+i*step,value=evaluate(r.expression,Object.assign({},vars,{X:x,N:x,A:previous}),angle);rows.push([numberText(x),format(value)]);previous=value;}return {rows};
      }
      case 'base':{
        if(![2,8,10,16].includes(r.from)||![2,8,10,16].includes(r.to))fail('Base ERROR');
        const s=r.expression.trim(),valid={2:/^-?[01]+$/,8:/^-?[0-7]+$/,10:/^-?\d+$/,16:/^-?[0-9a-f]+$/i};if(!valid[r.from].test(s))fail('Invalid digit for base');
        let n=parseInt(s,r.from);
        if(r.signed===undefined){if(!Number.isSafeInteger(n)||n< -2147483648||n>2147483647)fail('32-bit signed integer range exceeded');return {text:n.toString(r.to).toUpperCase()};}
        if(r.signed&&r.from!==10&&n>=2147483648&&n<=4294967295)n-=4294967296;
        if(!Number.isSafeInteger(n)||n<(r.signed?-2147483648:0)||n>(r.signed?2147483647:4294967295))fail('32-bit integer range exceeded');
        if(n<0&&r.to!==10)n+=4294967296;return {text:n.toString(r.to).toUpperCase()};
      }
      case 'program':return runProgram(r.source,vars,angle,r.inputs||{},r.programs||{});
      default:fail('Unknown action');
    }
  }
  root.CalEngine={evaluate,format,fraction,dispatch,createProgram:(source,variables,angle,programs)=>programSteps(source,variables,angle,{},true,programs)};
  root.calculateJSON=function(json){try{return JSON.stringify({ok:true,result:dispatch(JSON.parse(json))},(_,v)=>{if(typeof v==='number'&&!Number.isFinite(v))fail('Math ERROR: non-finite result');return v;});}catch(e){return JSON.stringify({ok:false,error:e.message||String(e)});}};
  if(typeof module!=='undefined')module.exports=root.CalEngine;
})(typeof globalThis!=='undefined'?globalThis:this);
