/* Structured calculator entry and bounded exact arithmetic for natural output. */
(function(root){
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=s=>({type:'text',text:s});
  const fields=n=>n.type==='fraction'?['num','den']:n.type==='mixed'?['whole','num','den']:n.type==='power'?['base','exp']:n.type==='root'?['body']:n.type==='nthroot'?['index','body']:n.type==='function'||n.type==='group'?['body']:[];
  function source(seq){return seq.map(n=>{
    const s=key=>source(n[key]);
    switch(n.type){
      case'fraction':return `((${s('num')})/(${s('den')}))`;
      case'mixed':{const whole=s('whole'),negative=/^[−-]/.test(whole);return `${negative?'-':''}((${negative?whole.slice(1):whole})+((${s('num')})/(${s('den')})))`;}
      case'root':return `sqrt(${s('body')})`;
      case'nthroot':return `((${s('body')})^(1/(${s('index')})))`;
      case'power':return `((${s('base')})^(${s('exp')}))`;
      case'function':return `${n.name}(${s('body')})`;
      case'group':return `(${s('body')})`;
      default:return n.text;
    }
  }).join('');}
  const plainMarkup=s=>esc(s).replace(/pi/g,'π').replace(/\*/g,'×').replace(/-/g,'−');
  const fracHTML=(n,d)=>`<span class="math-frac"><span>${n}</span><span>${d}</span></span>`;
  const numericHTML=s=>{const m=/^(.+)×10\^([+-]?\d+)$/.exec(s);return m?`${esc(m[1])}×<span class="math-power"><span>10</span><sup>${plainMarkup(m[2])}</sup></span>`:esc(s);};
  const rootHTML=(s,index='')=>`<span class="math-root">${index?`<sup class="root-index">${index}</sup>`:''}<span class="radical"><svg viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M 0,55 L 2.5,50 L 5.5,95 L 9.5,0 L 10,0" vector-effect="non-scaling-stroke"/></svg></span><span class="radicand">${s}</span></span>`;
  class Editor {
    constructor(tree){this.tree=tree?JSON.parse(JSON.stringify(tree)):[];this.seq=this.tree;this.pos=this.tree.length;}
    clear(){this.tree=[];this.seq=this.tree;this.pos=0;}
    get source(){return source(this.tree);}
    snapshot(){return JSON.parse(JSON.stringify(this.tree));}
    restore(tree){this.tree=JSON.parse(JSON.stringify(tree));this.seq=this.tree;this.pos=this.tree.length;}
    toStart(){this.seq=this.tree;this.pos=0;}
    toEnd(){this.seq=this.tree;this.pos=this.tree.length;}
    load(s){
      this.clear();
      const tokens=s.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+(?=\()|and|or|xor|xnor|MatAns|Mat[A-F]|Ans|pi|[^\s]/g)||[];let p=0;
      const chars=s=>(s.match(/MatAns|Mat[A-F]|Ans|pi|./gs)||[]).map(text);
      function expr(min=0){
        const t=tokens[p++];let a;
        if(t==='('){a=[{type:'group',body:expr()}];if(tokens[p++]!==')')throw Error('syntax');}
        else if(t==='−'||t==='-'||t==='+'||t==='∠'){a=[text(t),...expr(30)];}
        else if(/^[A-Za-z]+$/.test(t||'')&&tokens[p]==='('){p++;const body=expr();if(tokens[p++]!==')')throw Error('syntax');a=[t==='sqrt'?{type:'root',body}:t==='cbrt'?{type:'nthroot',index:[text('3')],body}:{type:'function',name:t,body}];}
        else if(t&&!/^[)×*/÷^=,→∠:◢]$/.test(t)&&!/^(and|or|xor|xnor)$/.test(t))a=chars(t);else throw Error('syntax');
        while(p<tokens.length){
          const t=tokens[p];if((t==='!'||t==='%')&&50>=min){p++;a.push(text(t));continue;}
          const implicit=t==='('||/^[\dA-Za-z.]$/.test(t)||t==='pi'||t==='Ans'||/^[A-Za-z]+$/.test(t),op=implicit?'':t,bp=implicit?20:({':':1,'◢':1,'=':5,'→':4,',':3,'or':6,'xor':6,'xnor':6,'and':8,'+':10,'−':10,'-':10,'×':20,'*':20,'÷':20,'/':20,'∠':30,'^':40})[op];
          if(bp===undefined||bp<min)break;if(!implicit)p++;const b=expr(op==='^'?bp:bp+1);
          if(op==='^')a=[{type:'power',base:a,exp:b}];else if(op==='/')a=[{type:'fraction',num:a,den:b}];else a=a.concat(op?[text(op)]:[],b);
        }
        return a;
      }
      try{this.tree=tokens.length?expr():[];if(p!==tokens.length)throw Error('syntax');}catch{this.tree=chars(s);}
      this.seq=this.tree;this.pos=this.tree.length;
    }
    owners(){const map=new Map();const walk=seq=>seq.forEach((node,index)=>fields(node).forEach(field=>{map.set(node[field],{parent:seq,index,node,field});walk(node[field]);}));walk(this.tree);return map;}
    insert(s){
      if(this.source.length+s.length>2048)throw Error('Stack ERROR: expression too long');
      if(s==='sqrt('){this.template('root');return;}
      if(s==='cbrt('){const node={type:'nthroot',index:[text('3')],body:[]};this.seq.splice(this.pos++,0,node);this.seq=node.body;this.pos=0;return;}
      if(s==='^2'){this.power('2');return;}
      if(s==='^(-1)'){this.power('−1');return;}
      if(s==='^'){this.power();return;}
      if(s==='('){this.template('group');return;}
      if(s===')'){
        const owner=this.owners().get(this.seq);
        if(owner){this.seq=owner.parent;this.pos=owner.index+1;}else {this.seq.splice(this.pos++,0,text(')'));}
        return;
      }
      if(s==='10^('||s==='e^('){this.insert(s[0]==='1'?'10':'e');this.power();return;}
      if(s==='×10^'){this.insert('×10');this.power();return;}
      if(/^[A-Za-z]+\($/.test(s)){this.template('function',s.slice(0,-1));return;}
      if(s==='^(1/'){this.template('nthroot');return;}
      const tokens=s.match(/MatAns|Mat[A-F]|Ans|pi|./gs)||[];this.seq.splice(this.pos,0,...tokens.map(text));this.pos+=tokens.length;
    }
    takeAtom(){
      if(!this.pos)return [];
      let begin=this.pos-1,last=this.seq[begin];
      if(last.type==='text'){
        if(/^[+−\-×÷*/=,→:◢?]$/.test(last.text))return [];
        if(/^[\d.]$/.test(last.text)){while(begin>0&&this.seq[begin-1].type==='text'&&/^[\d.]$/.test(this.seq[begin-1].text))begin--;}
      }
      const nodes=this.seq.splice(begin,this.pos-begin);this.pos=begin;return nodes;
    }
    fraction(mixed=false){
      const atom=this.takeAtom();const node=mixed?{type:'mixed',whole:atom,num:[],den:[]}:{type:'fraction',num:atom,den:[]};
      this.seq.splice(this.pos++,0,node);
      this.seq=mixed?(atom.length?node.num:node.whole):(atom.length?node.den:node.num);this.pos=0;
    }
    power(exponent){
      const base=this.takeAtom();
      const node={type:'power',base,exp:exponent?Array.from(exponent).map(text):[]};
      this.seq.splice(this.pos++,0,node);
      if(base.length){
        if(!exponent){this.seq=node.exp;this.pos=0;}
      }else{
        this.seq=node.base;this.pos=0;
      }
    }
    template(type,name){
      const node=type==='nthroot'?{type,index:[],body:[]}:{type,body:[]};if(name)node.name=name;
      this.seq.splice(this.pos++,0,node);this.seq=type==='nthroot'?node.index:node.body;this.pos=0;
    }
    move(direction){
      const owner=this.owners().get(this.seq);
      if(direction==='up'||direction==='down'){
        let current=this.seq;
        const owners=this.owners();
        while(owners.has(current)){
          const o=owners.get(current);
          if(o.node.type==='power'){
            if(direction==='up'&&o.field==='base'){this.seq=o.node.exp;this.pos=Math.min(this.pos,this.seq.length);return true;}
            if(direction==='down'&&o.field==='exp'){this.seq=o.node.base;this.pos=Math.min(this.pos,this.seq.length);return true;}
          }else{
            const order=fields(o.node),i=order.indexOf(o.field),j=i+(direction==='down'?1:-1);
            if(j>=0&&j<order.length){this.seq=o.node[order[j]];this.pos=Math.min(this.pos,this.seq.length);return true;}
          }
          current=o.parent;
        }
        if(direction==='down'){
          const child=this.seq.slice(this.pos).find(n=>fields(n).length>1)||this.seq.slice(0,this.pos).reverse().find(n=>fields(n).length>1);
          if(child){
            const order=fields(child);
            const target=child.type==='power'?'base':order[order.length-1];
            this.seq=child[target];
            this.pos=0;
            return true;
          }
        }
        if(direction==='up'){
          const child=this.seq.slice(0,this.pos).reverse().find(n=>n.type==='power')||this.seq.slice(this.pos).find(n=>n.type==='power');
          if(child){
            this.seq=child.exp;
            this.pos=0;
            return true;
          }
        }
        return false;
      }
      const right=direction==='right',node=this.seq[right?this.pos:this.pos-1];
      if(node){const order=fields(node);if(order.length){this.seq=node[order[right?0:order.length-1]];this.pos=right?0:this.seq.length;}else this.pos+=right?1:-1;return true;}
      if(owner){const order=fields(owner.node),i=order.indexOf(owner.field),next=i+(right?1:-1);if(next>=0&&next<order.length){this.seq=owner.node[order[next]];this.pos=right?0:this.seq.length;}else {this.seq=owner.parent;this.pos=owner.index+(right?1:0);}return true;}
      return false;
    }
    backspace(){
      if(this.pos){this.seq.splice(--this.pos,1);return;}
      const owner=this.owners().get(this.seq);if(!owner)return;
      if(fields(owner.node).every(f=>!owner.node[f].length)){this.seq=owner.parent;this.pos=owner.index;this.seq.splice(this.pos,1);return;}
      this.move('left');
    }
    complete(){
      let empty=false;const walk=seq=>seq.forEach(n=>fields(n).forEach(f=>{if(!n[f].length)empty=true;walk(n[f]);}));walk(this.tree);
      if(empty)throw Error('Syntax ERROR: empty input field');return this.source;
    }
    html(showCursor=true){
      const render=seq=>{
        const cursor=i=>showCursor&&this.seq===seq&&this.pos===i?'<span class="math-cursor" aria-hidden="true"></span>':'';
        if(!seq.length)return seq===this.tree?cursor(0):`<span class="math-empty">${cursor(0)}<span class="math-slot" aria-hidden="true"></span></span>`;
        return `<span class="math-sequence">${seq.map((n,i)=>{
          const sub=f=>render(n[f]);let html;
          switch(n.type){
            case'fraction':html=fracHTML(sub('num'),sub('den'));break;
            case'mixed':html=sub('whole')+fracHTML(sub('num'),sub('den'));break;
            case'root':html=rootHTML(sub('body'));break;
            case'nthroot':html=rootHTML(sub('body'),sub('index'));break;
            case'power':html=`<span class="math-power"><span>${sub('base')}</span><sup>${sub('exp')}</sup></span>`;break;
            case'function':{const inverse={asin:'sin',acos:'cos',atan:'tan',asinh:'sinh',acosh:'cosh',atanh:'tanh'};const label=inverse[n.name]?`${inverse[n.name]}<sup class="inverse">−1</sup>`:esc(n.name);html=`<span class="math-function">${label}<span class="paren">(</span>${sub('body')}<span class="paren">)</span></span>`;break;}
            case'group':html=`<span class="math-group"><span class="paren">(</span>${sub('body')}<span class="paren">)</span></span>`;break;
            default:html=plainMarkup(n.text);
          }
          return cursor(i)+html;
        }).join('')}${cursor(seq.length)}</span>`;
      };
      return render(this.tree);
    }
  }

  // Exact outputs are derived algebraically, never guessed from floating point.
  const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
  const Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(!d)throw Error('zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;if(n.toString().length>80||d.toString().length>80)throw Error('exact limit');return {n,d};};
  const qa=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),qm=(a,b)=>Q(a.n*b.n,a.d*b.d),qn=a=>Q(-a.n,a.d),qd=(a,b)=>Q(a.n*b.d,a.d*b.n);
  const scalar=q=>new Map(q.n?[['1',q]]:[]);
  const add=(a,b)=>{const out=new Map(a);for(const[k,q]of b){const v=qa(out.get(k)||Q(0),q);if(v.n)out.set(k,v);else out.delete(k);}if(out.size>6)throw Error('exact limit');return out;};
  const negate=a=>new Map([...a].map(([k,q])=>[k,qn(q)]));
  function rad(n){if(!Number.isSafeInteger(n)||n<0||n>1e8)throw Error('radical limit');let outside=1;for(let p=2;p*p<=n;p++)while(n%(p*p)===0){outside*=p;n/=p*p;}return [n===1?'1':'r'+n,Q(outside)];}
  function multiply(a,b){let out=new Map();for(const[ka,va]of a)for(const[kb,vb]of b){let k,q=qm(va,vb);if(ka==='1')k=kb;else if(kb==='1')k=ka;else if(ka[0]==='r'&&kb[0]==='r'){const pair=rad(Number(ka.slice(1))*Number(kb.slice(1)));k=pair[0];q=qm(q,pair[1]);}else throw Error('unsupported exact product');out=add(out,new Map([[k,q]]));}return out;}
  function divide(a,b){
    if(b.size===1){const[k,q]=[...b][0];if(k==='1')return new Map([...a].map(([key,v])=>[key,qd(v,q)]));if(k[0]==='r'){const inverse=new Map([[k,qd(Q(1),qm(q,Q(Number(k.slice(1)))) )]]);return multiply(a,inverse);}if(k==='pi'&&a.size===1&&a.has('pi'))return scalar(qd(a.get('pi'),q));}
    if(b.size===2&&b.has('1')){const radical=[...b.keys()].find(k=>k[0]==='r');if(radical){const conjugate=new Map([['1',b.get('1')],[radical,qn(b.get(radical))]]);return divide(multiply(a,conjugate),multiply(b,conjugate));}}
    throw Error('unsupported exact division');
  }
  function exact(source,angle){
    const tokens=source.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/g,'pi').match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|sqrt|asin|acos|atan|sin|cos|tan|pi|[+\-*/^()%]|\S/g)||[];
    if(tokens.length>1000)throw Error('exact limit');let p=0,depth=0;
    function number(s){const [mantissa,exponent='0']=s.toLowerCase().split('e'),parts=mantissa.split('.'),d=(parts[1]||'').length-Number(exponent);if(Math.abs(d)>80)throw Error('exact limit');const n=BigInt(parts.join(''));return d>=0?Q(n,10n**BigInt(d)):Q(n*10n**BigInt(-d));}
    function expr(min=0){
      if(++depth>60)throw Error('exact limit');let t=tokens[p++],a;
      if(/^\d|^\./.test(t||''))a=scalar(number(t));
      else if(t==='pi')a=new Map([['pi',Q(1)]]);
      else if(t==='-')a=negate(expr(35));
      else if(t==='+')a=expr(35);
      else if(t==='('){a=expr();if(tokens[p++]!==')')throw Error('syntax');}
      else if(t==='sqrt'){
        if(tokens[p++]!=='(')throw Error('syntax');const inside=expr();if(tokens[p++]!==')'||inside.size>1||(inside.size&&!inside.has('1')))throw Error('unsupported root');
        const q=inside.get('1')||Q(0);if(q.n<0n)throw Error('complex');if(!q.n)a=new Map();else {const pair=rad(Number(q.n*q.d));a=new Map([[pair[0],qd(pair[1],Q(q.d))]]);}
      }else if(['asin','acos','atan'].includes(t)){
        if(tokens[p++]!=='(')throw Error('syntax');const argument=expr();if(tokens[p++]!==')')throw Error('syntax');
        const candidates=t==='acos'?[0,30,45,60,90,120,135,150,180]:t==='asin'?[-90,-60,-45,-30,0,30,45,60,90]:[-60,-45,-30,0,30,45,60];
        const degrees=candidates.find(d=>{try{return add(argument,negate(exact(`${t.slice(1)}(${d})`,'DEG'))).size===0;}catch{return false;}});
        if(degrees===undefined)throw Error('unsupported exact inverse angle');
        a=angle==='RAD'?(degrees?new Map([['pi',Q(degrees,180)]]):scalar(Q(0))):scalar(angle==='GRA'?Q(degrees*10,9):Q(degrees));
      }else if(['sin','cos','tan'].includes(t)){
        if(tokens[p++]!=='(')throw Error('syntax');const argument=expr();if(tokens[p++]!==')'||argument.size>1)throw Error('unsupported trig');
        const basis=angle==='RAD'?'pi':'1',q=argument.get(basis)||Q(0);if(argument.size&&!argument.has(basis))throw Error('unsupported trig');
        const turn=qd(q,Q(angle==='RAD'?2:angle==='GRA'?400:360)),steps=qm(turn,Q(24));if(steps.d!==1n)throw Error('unsupported trig');const k=Number((steps.n%24n+24n)%24n);
        const sine=index=>{const i=index%24,sign=i>12?-1:1,j=i>12?i-12:i,v=j>6?12-j:j;if(v===0)return scalar(Q(0));if(v===2)return scalar(Q(sign,2));if(v===3)return new Map([['r2',Q(sign,2)]]);if(v===4)return new Map([['r3',Q(sign,2)]]);if(v===6)return scalar(Q(sign));throw Error('unsupported trig angle');};
        a=t==='sin'?sine(k):t==='cos'?sine(k+6):divide(sine(k),sine(k+6));
      }else throw Error('unsupported exact input');
      while(p<tokens.length){
        if(tokens[p]==='%'&&50>=min){p++;a=divide(a,scalar(Q(100)));continue;}
        const implicit=tokens[p]==='pi'||tokens[p]==='sqrt'||tokens[p]==='(',op=implicit?'*':tokens[p],bp=({'+':10,'-':10,'*':20,'/':20,'^':40})[op];
        if(bp===undefined||bp<min)break;if(!implicit)p++;const b=expr(op==='^'?bp:bp+1);
        if(op==='+')a=add(a,b);else if(op==='-')a=add(a,negate(b));else if(op==='*')a=multiply(a,b);else if(op==='/')a=divide(a,b);
        else {const q=b.get('1')||Q(0);if(b.size>1||b.size&&!b.has('1')||q.d!==1n||q.n>20n||q.n< -20n)throw Error('unsupported exponent');let value=scalar(Q(1));for(let i=0;i<Number(q.n<0n?-q.n:q.n);i++)value=multiply(value,a);a=q.n<0n?divide(scalar(Q(1)),value):value;}
      }
      depth--;return a;
    }
    const out=expr();if(p!==tokens.length)throw Error('syntax');return out;
  }
  function exactOutput(input,value,mixed=false,angle='DEG'){
    if(value.im!==0||!Number.isFinite(value.re))return null;
    try{
      const terms=exact(input,angle),numeric=[...terms].reduce((s,[k,q])=>s+Number(q.n)/Number(q.d)*(k==='pi'?Math.PI:k==='1'?1:Math.sqrt(Number(k.slice(1)))),0);
      if(Math.abs(numeric-value.re)>1e-12*Math.max(1,Math.abs(value.re)))return null;
      if(!terms.size)return {html:'0',text:'0'};
      const html=[],text=[];let count=0;
      for(const[k,q]of terms){
        const negative=q.n<0n,n=negative?-q.n:q.n,sign=negative?'−':count?'+':'';
        const symbol=k==='pi'?'π':k==='1'?'':`√${k.slice(1)}`,symbolHTML=k==='pi'?'π':k==='1'?'':rootHTML(k.slice(1));
        let numerator=(n===1n&&symbol?'':n.toString())+symbolHTML;
        let t=(n===1n&&symbol?'':n.toString())+symbol;
        if(n.toString().length>12||q.d.toString().length>12)return null;
        if(mixed&&k==='1'&&q.d!==1n&&n>q.d){numerator=`${n/q.d}${fracHTML((n%q.d).toString(),q.d.toString())}`;t=`${n/q.d} ${n%q.d}/${q.d}`;}
        else if(q.d!==1n){numerator=fracHTML(numerator,q.d.toString());t=`${t}/${q.d}`;}
        html.push(sign+numerator);text.push(sign+t);count++;
      }
      return {html:html.join(''),text:text.join('')};
    }catch{return null;}
  }
  root.CalNatural={Editor,exactOutput,esc,source,numericHTML};
  if(typeof module!=='undefined')module.exports=root.CalNatural;
})(typeof globalThis!=='undefined'?globalThis:this);
