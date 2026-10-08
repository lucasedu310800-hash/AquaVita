// ## 01. Funções auxiliares: selecionam elementos e normalizam números.
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],p2=n=>String(n).padStart(2,'0'),cl=v=>Math.max(0,Math.min(100,v));
let uid=0;
// ## 02. Componentes visuais: gera SVGs de reatores e cenários em código.
function reactor(cls){const k='r'+uid++;let b='';for(let i=0;i<9;i++)b+=`<circle class="bub" cx="${62+Math.random()*76|0}" cy="345" r="${(1.5+Math.random()*2.5).toFixed(1)}" style="--d:${(Math.random()*4).toFixed(1)}s;--t:${(3+Math.random()*3).toFixed(1)}s"/>`;
return `<div class="reactor ${cls}"><svg viewBox="0 0 200 420" role="img" aria-label="Biorreator de algas"><defs><clipPath id="${k}"><rect x="52" y="76" width="96" height="284" rx="10"/></clipPath>
<linearGradient id="${k}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#37423b"/><stop offset="1" stop-color="#0d100d"/></linearGradient>
<linearGradient id="${k}l" x1="0" y1="0" x2="0" y2="1"><stop class="liqTop" offset="0"/><stop class="liqBot" offset="1"/></linearGradient>
<radialGradient id="${k}c" cx=".35" cy=".3" r=".8"><stop class="coreA" offset="0"/><stop class="coreB" offset="1"/></radialGradient>
<filter id="${k}f" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter></defs>
<polygon points="14,384 36,356 62,400 88,360 100,404 122,358 150,398 178,360 186,384 168,410 32,410" fill="url(#${k}s)" stroke="#3a463d"/><path class="vein" d="M40 388L64 374L80 392M146 386L124 372L112 394M100 402L92 380L108 366"/>
<g class="shards"><path d="M46 384L54 344L67 380Z"/><path d="M96 380L105 330L116 377Z"/><path d="M140 384L151 349L161 381Z"/></g>
<g clip-path="url(#${k})"><rect class="liq" x="52" y="150" width="96" height="212" fill="url(#${k}l)"/><path class="wave" d="M40 150q12-8 24 0t24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0v12H40z"/><g class="algae"><path d="M70 360q-10-40 4-70t-4-60"/><path d="M100 360q12-50-4-90t6-80"/><path d="M128 360q-8-36 6-64t-2-56"/></g><circle class="halo" cx="100" cy="330" r="46" filter="url(#${k}f)"/>${b}</g>
<rect x="52" y="76" width="96" height="284" rx="10" fill="#d2ffe10d" stroke="#d2ffe166"/><rect x="63" y="92" width="4" height="230" rx="2" fill="#fff" opacity=".13"/><rect x="118" y="98" width="2" height="200" rx="1" fill="#000" opacity=".18"/>
<circle class="core" cx="100" cy="338" r="14" fill="url(#${k}c)"/>
<rect x="46" y="62" width="108" height="18" rx="4" fill="#2b322d" stroke="#46554a"/><circle class="hole" cx="66" cy="71" r="3"/><circle class="hole" cx="100" cy="71" r="3"/><circle class="hole" cx="134" cy="71" r="3"/>
<rect x="90" y="22" width="20" height="42" fill="#c9cfc9" opacity=".8"/><rect x="90" y="22" width="52" height="14" rx="3" fill="#c9cfc9" opacity=".8"/>
<circle class="led" cx="72" cy="384" r="3"/><circle class="led" cx="100" cy="392" r="3"/><circle class="led" cx="128" cy="384" r="3"/></svg></div>`}
$('#rmain').innerHTML=reactor('main');$('#rmini').innerHTML=reactor('main');$('#rA').innerHTML=reactor('super on');$('#rB').innerHTML=reactor('native on');
function crystal(){const k='k'+uid++;
const shard=(cx,baseY,topY,halfW)=>{const midY=baseY-(baseY-topY)*.32;return `M${cx} ${topY} L${cx-halfW} ${midY} L${cx-halfW*.55} ${baseY} L${cx+halfW*.55} ${baseY} L${cx+halfW} ${midY} Z`};
let sp='';for(let i=0;i<9;i++)sp+=`<circle class="spark" cx="${40+Math.random()*160|0}" cy="${30+Math.random()*150|0}" r="${(.8+Math.random()*1.6).toFixed(1)}" style="animation-delay:-${(Math.random()*3).toFixed(1)}s"/>`;
return `<div class="krypto"><svg viewBox="0 0 240 260" role="img" aria-label="Cristal de kryptonita"><defs>
<linearGradient id="${k}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaffd8"/><stop offset=".35" stop-color="#8dff5a"/><stop offset="1" stop-color="#1c7a2e"/></linearGradient>
<linearGradient id="${k}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a8a3e"/><stop offset="1" stop-color="#123018"/></linearGradient>
<radialGradient id="${k}r" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#16321f"/><stop offset="1" stop-color="#050a06"/></radialGradient>
<filter id="${k}g" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter></defs>
<ellipse cx="120" cy="242" rx="98" ry="20" fill="url(#${k}r)"/>
<path d="M18 250q30-22 70-10t70-4 64 10v14H18z" fill="#0b100c" stroke="#1c261f"/>
<path d="${shard(70,236,86,52)}" fill="url(#${k}b)" opacity=".85" filter="url(#${k}g)"/>
<path d="${shard(172,236,104,48)}" fill="url(#${k}b)" opacity=".85" filter="url(#${k}g)"/>
<path d="${shard(80,234,130,34)}" fill="url(#${k}f)" stroke="#eaffd8" stroke-width=".6" opacity=".92"/>
<path d="${shard(158,234,140,32)}" fill="url(#${k}f)" stroke="#eaffd8" stroke-width=".6" opacity=".92"/>
<path d="${shard(120,238,34,64)}" fill="url(#${k}f)" stroke="#eaffd8" stroke-width="1" opacity=".98"/>
<path d="M120 34L104 96M120 34L138 92" stroke="#fff" stroke-width="1.4" opacity=".55"/>
${sp}
</svg></div>`}
$('#krypto').innerHTML=crystal();
(function(){const ch='[]{}()<>'.split('');function line(n){let s='';for(let i=0;i<n;i++){const g=1+Math.floor(Math.random()*3);for(let j=0;j<g;j++)s+=ch[Math.floor(Math.random()*ch.length)];s+=' ';}return s}
const a=line(60),b=line(60);$('#acL').textContent=a+' '+a;$('#acR').textContent=b+' '+b;
$$('.codeband').forEach(el=>{const t=line(90);const s=document.createElement('span');s.textContent=t+' '+t;el.appendChild(s)});})();
/* ## Funções de navegação e feedback: localizam reatores, exibem avisos e rolam a página. */
const mains=()=>$$('.reactor.main'); // Retorna todos os reatores que devem reagir juntos.
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)} // Mostra uma mensagem temporária na tela.
function go(id){document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'})} // Navega suavemente até uma seção pelo id.
// ## 03. Estado do planeta: sincroniza a cor e os alertas dos reatores.
function flash(cls,ms){mains().forEach(r=>r.classList.add(cls));setTimeout(()=>mains().forEach(r=>r.classList.remove(cls)),ms)}
const PST={ok:'PLANETA SAUDÁVEL',risk:'PLANETA EM RISCO',bad:'PLANETA EM COLAPSO'};
function setP(p){document.body.dataset.p=p;$('#pstat').textContent=PST[p]} // Atualiza o estado visual global: saudável, risco ou colapso.
window.BIOPULSE={setPlanet:setP,flash};
/* nav */
$$('[data-t]').forEach(b=>b.onclick=()=>{b.classList.add('press');setTimeout(()=>b.classList.remove('press'),350);const w=$('#wipe');w.classList.remove('go');void w.offsetWidth;w.classList.add('go');go(b.dataset.t)});
/* power */
$('#power').onclick=function(){const on=document.body.classList.toggle('on');mains().forEach(r=>r.classList.toggle('on',on));this.textContent=on?'DESLIGAR O REATOR':'LIGAR O REATOR';toast(on?'SISTEMA ATIVO':'SISTEMA EM ESPERA')};
/* intervention */
$('#intv').onclick=()=>{const a=$('#alert');document.body.classList.add('alert');a.classList.remove('show');void a.offsetWidth;a.classList.add('show');if(!document.body.classList.contains('on'))$('#power').click();flash('super',6000);setTimeout(()=>{go('design')},2200);setTimeout(()=>{a.classList.remove('show');document.body.classList.remove('alert')},3400)};
/* game */
const LBL=['SAÚDE DO PLANETA','POLUIÇÃO','ENERGIA LIMPA','PRODUÇÃO','SUSTENTABILIDADE','RECURSOS'];
const EV=[
{q:'A produção aumentou, mas a poluição também.',o:[{n:'INVESTIR',d:'Reduz produção agora, melhora a sustentabilidade.',v:[6,-12,2,-10,12,-8]},{n:'EQUILIBRAR',d:'Mantém a produção e reduz parte dos impactos.',v:[2,-5,0,-2,5,-3]},{n:'IGNORAR',d:'Produção alta, poluição sobe.',v:[-6,14,0,12,-8,4]}]},
{q:'Uma seca reduz o fluxo do rio. As algas nativas crescem devagar.',o:[{n:'RESTAURAR',d:'Replantar margens com algas nativas.',v:[8,-6,0,-6,10,-10]},{n:'RACIONAR',d:'Reduzir o uso de água da fábrica.',v:[3,-3,-2,-4,4,2]},{n:'IGNORAR',d:'Manter a operação como está.',v:[-7,8,2,8,-6,-6]}]},
{q:'Chega uma oferta: super-algas que prometem limpar tudo em semanas.',o:[{n:'TESTAR',d:'Pequena escala, com monitoramento.',v:[3,-4,0,-3,6,-6]},{n:'COMPARAR',d:'Aplicar pouco e comparar com as nativas.',v:[2,-2,2,2,2,-3]},{n:'APLICAR TUDO',d:'Efeito imediato, risco de desequilíbrio.',v:[8,-8,6,14,-14,-8]}]},
{q:'Energia limpa disponível, mas cara.',o:[{n:'INVESTIR',d:'Custo alto, ganho de longo prazo.',v:[3,-6,16,-6,8,-14]},{n:'EQUILIBRAR',d:'Migrar só parte da operação.',v:[1,-3,8,-2,4,-6]},{n:'IGNORAR',d:'Seguir com o modelo antigo.',v:[-3,6,-4,6,-4,4]}]},
{q:'Descarte irregular detectado no rio.',o:[{n:'FISCALIZAR',d:'Rastrear e interromper a fonte.',v:[6,-10,0,-4,6,-8]},{n:'MULTAR',d:'Multar e monitorar.',v:[3,-5,0,-1,3,-2]},{n:'IGNORAR',d:'Não interferir.',v:[-8,14,0,6,-8,2]}]},
{q:'O reator bate a meta. Aumentar a escala?',o:[{n:'CRESCER COM CUIDADO',d:'Expandir aos poucos.',v:[4,-4,6,4,8,-8]},{n:'MANTER',d:'Consolidar o que funciona.',v:[2,-2,3,2,4,-3]},{n:'DOBRAR TUDO',d:'Produção máxima já.',v:[-8,10,2,16,-10,-4]}]}];
const SAB=[{n:'INJEÇÃO DE SUPER-ALGAS',v:[-3,6,0,6,-8,0],fx:1},{n:'DESCARTE ILEGAL',v:[-5,12,0,0,-2,0]},{n:'FALHA NA REDE',v:[0,0,-14,-6,0,0]},{n:'SOBRECARGA DO REATOR',v:[-3,0,-6,0,0,-10],fx:1},{n:'CRESCIMENTO DESCONTROLADO',v:[-6,5,0,0,-5,0]}];
const VQ=['Resultado imediato detectado. Consequência ambiental ignorada.','Velocidade acima de equilíbrio. Ajuste aceito.','Ética removida do sistema. Eficiência aumentada.'];
const S={v:[55,45,35,50,40,60],turn:0,vil:false,d:[0,0,0,0,0,0],over:false};
/* ## Motor da simulação: calcula pontos, atualiza indicadores e apresenta escolhas. */
const score=()=>(S.v[0]+(100-S.v[1])+S.v[2]+S.v[4])/4; // Calcula a média ambiental usada no resultado final.
$('#inds').innerHTML=LBL.map((l,i)=>`<div class="ind ${i==1?'p':''}"><span>${l}</span><div class="bar"><i id="b${i}"></i></div><em><span id="n${i}"></span><span class="dl" id="d${i}"></span></em></div>`).join('');
const lerp=(a,b,t)=>a+(b-a)*t;
function paint(){S.v.forEach((x,i)=>{$('#b'+i).style.width=x+'%';$('#n'+i).textContent=Math.round(x);const d=S.d[i],e=$('#d'+i);e.textContent=d?(d>0?'+':'')+d:'';e.className='dl '+((d>0)==(i!=1)?'up':'dn')}); // Desenha os números, barras e cores do cenário atual.
const q=cl((S.v[0]+100-S.v[1])/2)/100,s=$('#scene');
s.style.setProperty('--sky',`hsl(${lerp(22,205,q)},${lerp(30,42,q)}%,${lerp(15,38,q)}%)`);s.style.setProperty('--water',`hsl(${lerp(32,172,q)},${lerp(38,52,q)}%,${lerp(12,30,q)}%)`);
s.style.setProperty('--smoke',(.08+S.v[1]/100*.85).toFixed(2));s.style.setProperty('--veg',(S.v[0]/100).toFixed(2));s.style.setProperty('--alg',(.15+S.v[1]/100*.8).toFixed(2));
if(S.turn>0||S.over){const sc=score();setP(sc>=55?'ok':sc>=38?'risk':'bad')}}
function showEvent(){const e=EV[S.turn];$('#turn').textContent=`EVENTO ${p2(S.turn+1)}/06`;$('#evt').innerHTML=`<small>Evento ${p2(S.turn+1)}</small><p class="q">${e.q}</p>`+e.o.map((o,i)=>`<button class="opt" data-i="${i}"><b>${o.n}</b><small>${o.d}</small></button>`).join('')} // Mostra o próximo problema e as três alternativas de decisão.
function apply(dl){dl.forEach((x,i)=>{const n=cl(S.v[i]+x);S.d[i]+=n-S.v[i];S.v[i]=n})} // Aplica as consequências escolhidas, limitando cada indicador entre 0 e 100.
function log(t){const l=$('#log');l.insertAdjacentHTML('afterbegin',`<div>&gt; ${t}</div>`);while(l.children.length>4)l.lastChild.remove()}
$('#evt').onclick=e=>{const b=e.target.closest('.opt');if(!b||S.over)return;const o=EV[S.turn].o[+b.dataset.i];S.d=[0,0,0,0,0,0];
const dl=o.v.map((d,k)=>{const g=k==1?-1:1;return Math.round(S.vil?(d*g>0?d*.6:d*1.4):d)});if(S.vil)dl[5]-=3;apply(dl);log(`${o.n}: ${o.d}`);
if(S.vil&&Math.random()<.8){const s=SAB[Math.random()*SAB.length|0];apply(s.v);log(`⚠ SABOTAGEM · ${s.n}`);const m=$('#vmsg');m.hidden=false;m.style.animation='none';void m.offsetWidth;m.style.animation='';m.textContent=`⚠ ${s.n} — ${VQ[Math.random()*VQ.length|0]}`;if(s.fx)flash('super',2500)}
S.turn++;paint();if(S.v[0]<=0||S.v[1]>=100||S.turn>=6)end();else showEvent()};
function end(){S.over=true;const ok=score()>=50&&S.v[0]>0&&S.v[1]<100;paint();setP(ok?'ok':'bad');const e=$('#end');e.hidden=false;e.className='end '+(ok?'ok':'bad');$('#eT').textContent=ok?'PLANETA RECUPERADO':'PLANETA EM COLAPSO';$('#eM').textContent=ok?'“O futuro não foi resolvido com uma única decisão. Foi construído com equilíbrio.”':'“Uma solução rápida pode acelerar o problema que pretendia resolver.”';$('#turn').textContent='FIM';const sc=Math.round(score());e.dataset.score=sc;e.dataset.villain=S.vil?'1':'0';const pz=prizeFor(sc,S.vil);$('#simSaveMsg').textContent=`Prêmio: ${pz.ico} ${pz.name}`} // Fecha a simulação, define o final e prepara a pontuação.
function reset(){S.v=[55,45,35,50,40,60];S.turn=0;S.d=[0,0,0,0,0,0];S.over=false;$('#end').hidden=true;$('#log').innerHTML='';setP('ok');paint();showEvent()} // Restaura todos os indicadores para iniciar outra rodada.
$('#retry').onclick=reset;
function setVil(on){S.vil=on;['#vil','#bpvil'].forEach(k=>{const e=$(k);e.setAttribute('aria-pressed',on);e.textContent='VILÃOIA // '+(on?'ON':'OFF')});document.body.classList.toggle('vil-on',on);const m=$('#vmsg');m.hidden=!on;if(on){m.textContent=VQ[0];toast('VILÃOIA ATIVA')}if(window.BioPulse)BioPulse.setVillain(on)} // Liga o modo difícil e sincroniza jogo, simulação e botões.
$('#vil').onclick=()=>setVil(!S.vil);$('#bpvil').onclick=()=>setVil(!S.vil);
reset();
$$('[data-g]').forEach(b=>b.onclick=()=>{$$('[data-g]').forEach(x=>x.classList.toggle('on',x==b));$('#bp').hidden=b.dataset.g!='bp';$('#game-mount').hidden=b.dataset.g!='sim';if(b.dataset.g=='sim'){if(S.turn||S.over)paint();else setP('ok')}});
$('#bpfs').onclick=()=>{const f=$('#bpmount');(f.requestFullscreen||f.webkitRequestFullscreen||(()=>{})).call(f)};
let bpAuto=0;BioPulse.mount($('#bpmount'),{onState:s=>{setP(s.phase);if(!bpAuto){bpAuto=1;if(!document.body.classList.contains('on'))$('#power').click()}},onEnd:r=>{toast(r.won?'PLANETA RECUPERADO':'PLANETA EM COLAPSO');const p=prizeFor(r.tree,r.villain);$('#bpScoreMsg').textContent=`Resultado: ${r.won?'planeta recuperado':'planeta em colapso'} · Saúde final da árvore: ${r.tree} · Prêmio: ${p.ico} ${p.name}`;$('#bpScore').hidden=false;$('#bpScore').dataset.score=r.tree;$('#bpScore').dataset.villain=r.villain?'1':'0';$('#bpSaveMsg').textContent=''},onSabotage:s=>{flash('super',1800);toast(s.name)}});
$('#bpSaveScore').onclick=()=>{const sc=+$('#bpScore').dataset.score||0;const vil=$('#bpScore').dataset.villain==='1';const p=addScore($('#bpName').value,sc,'BioPulse',vil);$('#bpSaveMsg').textContent=`Pontuação salva! Prêmio: ${p.ico} ${p.name}`};
$('#simSaveScore').onclick=()=>{const sc=+$('#end').dataset.score||0;const vil=$('#end').dataset.villain==='1';const p=addScore($('#simName').value,sc,'Simulação',vil);$('#simSaveMsg').textContent=`Pontuação salva! Prêmio: ${p.ico} ${p.name}`};
/* ambientes */
// ## 04. Cenários ambientais: ilustra visualmente invasão e convivência.
function env(bad){const k='e'+uid++;
let s=`<svg viewBox="0 0 400 180"><defs><linearGradient id="${k}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bad?'#3a2a1c':'#3a92ad'}"/><stop offset="1" stop-color="${bad?'#241a12':'#256f85'}"/></linearGradient><linearGradient id="${k}wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bad?'#2a3a15':'#1fa08f'}"/><stop offset="1" stop-color="${bad?'#141d0c':'#124f47'}"/></linearGradient><filter id="${k}bl"><feGaussianBlur stdDeviation="3.5"/></filter></defs>`;
s+=`<rect width="400" height="94" fill="url(#${k}sk)"/><rect y="92" width="400" height="88" fill="url(#${k}wt)"/>`;
if(bad){for(let i=0;i<3;i++)s+=`<circle cx="${80+i*110}" cy="${38-i*8}" r="${20+i*6}" fill="#4a4a44" opacity=".45" filter="url(#${k}bl)"/>`;
for(let i=0;i<16;i++)s+=`<circle class="blob" cx="${Math.random()*400|0}" cy="${104+Math.random()*68|0}" r="${10+Math.random()*15|0}" opacity=".5" filter="url(#${k}bl)" style="animation-delay:-${(Math.random()*3).toFixed(1)}s"/>`;
for(let i=0;i<10;i++)s+=`<circle class="blob" cx="${Math.random()*400|0}" cy="${100+Math.random()*72|0}" r="${3+Math.random()*4|0}" opacity=".65" style="animation-delay:-${(Math.random()*3).toFixed(1)}s"/>`;}
else{for(let i=0;i<7;i++)s+=`<rect x="${20+i*58}" y="64" width="3" height="28" fill="#2e2015" opacity=".9"/><circle cx="${21+i*58}" cy="60" r="12" fill="#37a04a"/><circle cx="${17+i*58}" cy="56" r="7" fill="#4dc264" opacity=".8"/>`;
for(let i=0;i<5;i++)s+=`<path d="M${40+i*80} 178q-6-22 2-38" stroke="#7de8ff" stroke-width="2.6" fill="none" opacity=".8"/>`;
s+=`<ellipse class="fish" cx="60" cy="128" rx="9" ry="4" fill="#eafff2"/><ellipse class="fish" cx="120" cy="152" rx="7" ry="3" fill="#c9f7e2" style="animation-duration:9s"/><ellipse class="fish" cx="260" cy="140" rx="8" ry="3.5" fill="#eafff2" style="animation-duration:11s;animation-delay:-3s"/>`;}
return s+'</svg>'}
$('#eA').innerHTML='<img class="envph" alt="Rio poluido, com lixo plastico flutuando na superficie" src="img/rio-poluido.jpg">';$('#eB').innerHTML='<img class="envph" alt="Rio limpo, agua transparente e vegetacao nas margens" src="img/rio-limpo.jpg">';
/* ## Prêmios e placar: regras, salvamento local e renderização da classificação. */
/* EDITE AQUI os brindes reais do seu estande: nome, ícone e a pontuação mínima (min) para cada um. */
const VILLAIN_BONUS=15; /* pontos de bônus por ter jogado com a VilãoIA ligada — mais difícil, vale mais */
const PRIZES=[
 {min:85, ico:'🏆', name:'Brinde Ouro',         note:'Desempenho excelente — o prêmio mais alto do estande.'},
 {min:65, ico:'🥈', name:'Brinde Prata',        note:'Ótimo resultado, a um passo do topo.'},
 {min:45, ico:'🥉', name:'Brinde Bronze',       note:'Bom resultado — já garante um brinde.'},
 {min:0,  ico:'🎖️', name:'Brinde Participação', note:'Por ter jogado até o fim.'}
];
function prizeFor(score,villain){const adj=(+score||0)+(villain?VILLAIN_BONUS:0);for(const p of PRIZES)if(adj>=p.min)return p;return PRIZES[PRIZES.length-1]} // Escolhe o prêmio segundo a pontuação e o bônus do modo difícil.
function renderPrizes(){const g=$('#prizegrid');if(!g)return;const cls=['tier-gold','tier-silver','tier-bronze',''];g.innerHTML=PRIZES.map((p,i)=>{const nextMin=i>0?PRIZES[i-1].min:null;const range=nextMin!=null?`${p.min}–${nextMin-1} pontos`:`${p.min}+ pontos`;const withVil=Math.max(p.min-VILLAIN_BONUS,0);return `<div class="prize ${cls[i]||''}"><span class="ico">${p.ico}</span><h4>${p.name}</h4><p class="thresh">${range}${p.min>0?` · ${withVil}+ com a VilãoIA`:''}</p><p>${p.note}</p></div>`}).join('')} // Constrói visualmente os cards de premiação.
function getBoard(){try{return JSON.parse(localStorage.getItem('bf_board')||'[]')}catch(e){return[]}} // Lê o ranking salvo no navegador, sem usar banco de dados.
function renderBoard(){const body=$('#boardBody');if(!body)return;const b=getBoard();if(!b.length){$('#board').hidden=true;$('#boardEmpty').hidden=false;return}$('#board').hidden=false;$('#boardEmpty').hidden=true;body.innerHTML=b.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.score)}</td><td>${esc(r.mode)}${r.villain?' · VilãoIA':''}</td><td>${esc(r.ico)} ${esc(r.prize)}</td></tr>`).join('')} // Atualiza a tabela exibida para o visitante.
function addScore(name,score,mode,villain){name=(name||'').trim().slice(0,18)||'Anônimo';try{localStorage.setItem('bf_name',name)}catch(e){}const prize=prizeFor(score,villain);const b=getBoard();b.push({name,score,mode,villain:!!villain,prize:prize.name,ico:prize.ico});b.sort((x,y)=>y.score-x.score);const top=b.slice(0,10);try{localStorage.setItem('bf_board',JSON.stringify(top))}catch(e){}renderBoard();return prize} // Salva somente os dez melhores resultados no localStorage.
renderPrizes();renderBoard();
if($('#lexBtn'))$('#lexBtn').onclick=()=>{const b=$('#lexBody');const open=!b.hidden;b.hidden=open;$('#lexBtn').textContent=open?'ACESSAR ARQUIVOS LEXCORP':'OCULTAR ARQUIVOS';$('#lexBtn').classList.toggle('press',!open)};
(function(){let n='';try{n=localStorage.getItem('bf_name')||''}catch(e){}if($('#bpName'))$('#bpName').value=n;if($('#simName'))$('#simName').value=n})();
/* recortes reais */
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
/* Resumos escritos pela equipe (não são cópias dos textos originais). Para adicionar outro recorte, copie um bloco e preencha. */
// ## 05. Conteúdo dinâmico: dados dos recortes e respectivas fontes.
const CLIPS=[
 {tag:'Notícia',outlet:'Diário do Grande ABC',date:'11/05/2026',
  h:'Rio Pinheiros: mais de 134 mil toneladas de lixo retiradas desde 2023',
  t:'O programa Integra Tietê, do governo de São Paulo, já tirou mais de 134 mil toneladas de resíduos flutuantes do Rio Pinheiros. Só nos quatro primeiros meses de 2026 foram 16,2 mil toneladas, 19,4% a mais que no mesmo período de 2025. Entre os itens mais comuns estão garrafas PET, marmitas de isopor e brinquedos, e boa parte da poluição é difusa: vem do descarte irregular e da chuva que arrasta o lixo.',
  why:'É o Cenário A na vida real: a poluição visível começa no plástico jogado fora — e limpar o rio é um trabalho contínuo.',
  links:[{l:'Diário do Grande ABC',u:'https://www.dgabc.com.br/Noticia/4318614/operacao-retira-134-mil-toneladas-de-lixo-do-rio-pinheiros',d:'Operação retira 134 mil toneladas de lixo do Rio Pinheiros (11/05/2026)'},
         {l:'ABC do ABC',u:'https://abcdoabc.com.br/investimento-rio-pinheiros-208-milhoes/',d:'Investimento no Rio Pinheiros chega a R$ 208 milhões (15/04/2026)'}]},
 {tag:'Notícia',outlet:'Olhar Digital',date:'11/09/2024',
  h:'Rio Pinheiros fica verde com a proliferação de algas',
  t:'Em setembro de 2024, a água do Rio Pinheiros ficou verde. Segundo a Cetesb, a seca reduziu a vazão do rio e favoreceu a proliferação de algas, com os nutrientes concentrados em pouca água. A reportagem explica que o fenômeno pode ser natural, mas é agravado por esgoto, fertilizantes e dejetos, que estimulam cianobactérias prejudiciais à saúde. O governo fez uma operação de bombeamento para movimentar a água entre os canais.',
  why:'Alga demais também é problema. O que importa é o equilíbrio do sistema — a mesma lição do Cenário A contra o Cenário B.',
  links:[{l:'Olhar Digital',u:'https://olhardigital.com.br/2024/09/11/ciencia-e-espaco/por-que-a-seca-deixou-verde-a-agua-do-rio-pinheiros/',d:'Água do Rio Pinheiros ficou verde – entenda o que causou isso (11/09/2024)'}]},
 {tag:'Estudo',outlet:'Universidade de Swansea',date:'2026',
  h:'Microalgas saem do laboratório: teste em escala comercial',
  t:'Pesquisadores da Universidade de Swansea (Reino Unido) publicaram, na revista Chemistry, uma demonstração em escala comercial de captura e uso de CO₂ com microalgas, usando os gases de uma refinaria de níquel e um fotobiorreator de tubos verticais fechado. O estudo parte de um ponto fraco da área: a maioria das pesquisas acontece em laboratório controlado, o que deixa pouca confiança sobre o desempenho em escala industrial.',
  why:'O protótipo do BIOPULSE é um biorreator em miniatura — e este estudo mostra por que testar em escala real faz diferença.',
  links:[{l:'Universidade de Swansea',u:'https://cronfa-dev.swansea.ac.uk/Record/cronfa72375/Details',d:'Commercial-Scale Demonstration of Carbon Capture and Utilisation (CCU) from a Nickel Refinery Off-Gas Using Microalgae in a Closed Vertical Tube Photobioreactor — Chemistry, 2026'}]},
 {tag:'Estudo',outlet:'Revisão científica · Jain et al.',date:'2026',
  h:'Algas "turbinadas" por biologia sintética: o que a ciência estuda',
  t:'Uma revisão científica de 2026 reúne estratégias de biologia sintética para aumentar a captura de carbono em microalgas, como produzir mais da enzima RuBisCO e modificar enzimas do mecanismo de concentração de CO₂. O artigo também avalia os obstáculos financeiros e tecnológicos para levar essas soluções à escala industrial.',
  why:'A "super-alga" do projeto é ficção, mas a pesquisa real caminha para algas mais eficientes — e traz de volta a pergunta da LexCorp: até onde ir?',
  links:[{l:'Springer',u:'https://link.springer.com/article/10.1007/s41742-026-01196-0',d:'From Carbon Sinks to Biofactories: Next-Generation Microalgae Platforms for Sustainable Climate Mitigation — Jain et al., 2026'}]},
 {tag:'Estudo',outlet:'Frontiers in Plant Science',date:'2022',
  h:'E se uma alga modificada escapar do reator?',
  t:'Uma revisão de 2022 alerta que algas geneticamente modificadas, cultivadas em escala industrial, exigem atenção ao risco de escaparem para o ambiente. Uma avaliação citada no texto concluiu que os riscos à saúde, ao ambiente e à economia são, em geral, baixos, mas não nulos. Nos EUA e no México, órgãos reguladores já exigem contenção secundária, como diques de terra, em volta de tanques ao ar livre.',
  why:'É a dúvida central do BIOPULSE: velocidade contra segurança. A solução rápida precisa provar que sabe parar.',
  links:[{l:'PubMed Central',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8924478',d:'Biocontainment of Genetically Engineered Algae — Sebesta et al., Frontiers in Plant Science, 2022'}]}
];
(function(){const w=$('#clipwall');if(!w)return;const rot=[-1.6,1.3,-.9,1.7,-1.2],edges=['e1','e2','e3','e2','e1'],tones=['p1','p3','p2','p1','p3'];
 w.innerHTML=CLIPS.map((c,i)=>{const links=c.links.map(k=>`<a class="newslink" href="${esc(k.u)}" target="_blank" rel="noopener noreferrer">${esc(k.l)} ↗</a>`).join('');
  const deco=i%2?'<span class="pin"></span>':'<span class="tape t1"></span><span class="tape t2"></span>';
  return `<div class="clip rv ${edges[i%5]} ${tones[i%5]}" style="--r:${rot[i%5]}deg">${deco}<article class="paper"><div class="newshead"><b>${esc(c.outlet)}</b><small>${esc(c.tag)} · ${esc(c.date)}</small></div><h4>${esc(c.h)}</h4><p>${esc(c.t)}</p><p class="why"><i>✎ Por que está aqui:</i> ${esc(c.why)}</p><div class="newslinks">${links}</div><small class="newsfoot">Resumo da equipe BIOPULSE — a matéria completa está na fonte original.</small></article></div>`}).join('');
 const s=$('#sources');if(s){const seen=[];CLIPS.forEach(c=>c.links.forEach(k=>{if(!seen.some(a=>a.u==k.u))seen.push(k)}));s.innerHTML='<h3>Fontes e referências</h3><ol>'+seen.map(k=>`<li><a href="${esc(k.u)}" target="_blank" rel="noopener noreferrer">${esc(k.d)}</a> · ${esc(k.l)}</li>`).join('')+'</ol>'}})();
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

