if(matchMedia('(pointer:coarse)').matches){const sm=document.querySelector('.bpbar small');if(sm)sm.textContent='Toque nos botões da tela para jogar · use TELA CHEIA para jogar na horizontal'}
// ## 06. Efeitos: animação de entrada, menu ativo, leituras e partículas.
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.2}):null;
$$('.rv').forEach(e=>io?io.observe(e):e.classList.add('in'));
const navSecs=['ia','jogo','design','conquistas'],navBtns=navSecs.map(id=>$(`.nb[data-t="${id}"]`));
if('IntersectionObserver'in window){const navIo=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navBtns.forEach(b=>b.classList.toggle('cur',b.dataset.t==e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});navSecs.forEach(id=>navIo.observe($(`#${id}`)))}
setInterval(()=>{const on=document.body.classList.contains('on'),p=document.body.dataset.p,sc=S.turn?score():75,t=(id,x)=>$(id).textContent=x;
t('#nO',on?Math.round(30+sc*.6+Math.random()*8):'--');t('#nC',on?Math.round(25+sc*.55+Math.random()*8):'--');t('#nT',!on?'EM ESPERA':p=='bad'?'INSTÁVEL':p=='risk'?'ATENÇÃO':'CONTROLADA');t('#nF',on?'FLUXO ATIVO':'PARADO');t('#nB',!on?'SEM LEITURA':p=='bad'?'ATIVIDADE ANÔMALA':'ATIVIDADE DETECTADA')},1200);
let pi=0;setInterval(()=>{$$('#proto div').forEach((d,i)=>d.classList.toggle('act',i==pi));pi=(pi+1)%5},1200);
const cv=$('#fx'),cx=cv.getContext('2d');let W,H;const P=[];
function rs(){W=cv.width=innerWidth;H=cv.height=innerHeight}rs();addEventListener('resize',rs);
for(let i=0;i<26;i++)P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3+.4,v:Math.random()*.18+.05,o:Math.random()});
(function f(){cx.clearRect(0,0,W,H);const p=document.body.dataset.p,c=document.body.classList.contains('alert')?'240,105,74':p=='bad'?'240,105,74':p=='risk'?'232,176,76':'143,227,208';
P.forEach(q=>{q.y-=q.v;q.x+=Math.sin(q.y/60+q.o*6)*.2;if(q.y<-5){q.y=H+5;q.x=Math.random()*W}cx.fillStyle=`rgba(${c},${(.08+.14*q.o).toFixed(2)})`;cx.beginPath();cx.arc(q.x,q.y,q.r,0,7);cx.fill()});requestAnimationFrame(f)})();
addEventListener('scroll',()=>{const r=$('#rmain');if(r)r.style.transform=`translateY(${Math.min(scrollY,600)*.08}px)`},{passive:true});
/* camada de presença: progresso, luz responsiva e profundidade nos painéis */
(()=>{
 const boot=$('#boot');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const finishBoot=()=>boot?.classList.add('done');
 if(reduced) finishBoot(); else setTimeout(finishBoot,1250);
 const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--page-progress',`${max?Math.round(scrollY/max*100):0}%`)};
 updateProgress();addEventListener('scroll',updateProgress,{passive:true});
 if(!matchMedia('(pointer:coarse)').matches&&!reduced){
   addEventListener('pointermove',e=>{document.documentElement.style.setProperty('--mx',`${e.clientX}px`);document.documentElement.style.setProperty('--my',`${e.clientY}px`)},{passive:true});
   $$('.panel').forEach(panel=>{
     panel.dataset.tilt='';
     panel.addEventListener('pointermove',e=>{const r=panel.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;panel.style.transform=`perspective(850px) rotateX(${-y*3.5}deg) rotateY(${x*4}deg) translateY(-4px)`});
     panel.addEventListener('pointerleave',()=>panel.style.transform='');
   });
 }
})();

