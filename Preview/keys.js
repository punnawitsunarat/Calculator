(function(root){
const rows=[
  [['shift','SHIFT'],['alpha','ALPHA'],['exit','EXIT'],['fmla','FMLA'],['calc','CALC',null,null,'='],['solve','SOLVE']],
  [['file','FILE'],['sqrt','√','sqrt(',null,':'],['square','x²','^2',null,'"'],['log','log','log(','10^('],['ln','ln','ln(','e^('],['power','xⁿ','^','^(-1)']],
  [['i','i','i','Arg(','A'],['fraction','fraction','/','/','B'],['dms','°′″','dms(','dms(','C'],['sin','sin','sin(','asin(','D'],['cos','cos','cos(','acos(','E'],['tan','tan','tan(','atan(','F']],
  [['rcl','RCL',null,null,'='],['sd','S⇔D'],['open','(','(','cbrt(','G'],['close',')',')','^(-1)','H'],['comma',',',',','%','I'],['memory','M+',null,null,'J']],
  [['7','7','7',null,'K'],['8','8','8',null,'L'],['9','9','9',null,'M'],['del','DEL'],['ac','AC/ON']],
  [['4','4','4',null,'N'],['5','5','5',null,'O'],['6','6','6',null,'P'],['multiply','×','×',null,'Q'],['divide','÷','÷',null,'R']],
  [['1','1','1',null,'S'],['2','2','2',null,'T'],['3','3','3',null,'U'],['plus','+','+','Pol(','V'],['minus','−','−','Rec(','W']],
  [['0','0','0','Rnd(','X'],['dot','.','. ',null,'Y'],['exp','×10ˣ','×10^','pi','Z'],['negative','(−)','−','Ans',' '],['exe','EXE']]
];
rows[7][1][2]='.';
root.CalKeys={rows};if(typeof module!=="undefined")module.exports=root.CalKeys;
})(typeof globalThis!=="undefined"?globalThis:this);
