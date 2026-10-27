const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],p2=n=>String(n).padStart(2,'0'),cl=v=>Math.max(0,Math.min(100,v));
let uid=0;
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
const mains=()=>$$('.reactor.main');
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
function go(id){document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'})}
function flash(cls,ms){mains().forEach(r=>r.classList.add(cls));setTimeout(()=>mains().forEach(r=>r.classList.remove(cls)),ms)}
const PST={ok:'PLANETA SAUDÁVEL',risk:'PLANETA EM RISCO',bad:'PLANETA EM COLAPSO'};
function setP(p){document.body.dataset.p=p;$('#pstat').textContent=PST[p]}
window.BIOFILITA={setPlanet:setP,flash};
/* nav */
$$('[data-t]').forEach(b=>b.onclick=()=>{b.classList.add('press');setTimeout(()=>b.classList.remove('press'),350);const w=$('#wipe');w.classList.remove('go');void w.offsetWidth;w.classList.add('go');go(b.dataset.t)});
/* power */
$('#power').onclick=function(){const on=document.body.classList.toggle('on');mains().forEach(r=>r.classList.toggle('on',on));this.textContent=on?'DESLIGAR O REATOR':'LIGAR O REATOR';toast(on?'SISTEMA ATIVO':'SISTEMA EM ESPERA');};
/* intervention */
$('#intv').onclick=()=>{unlock('intv');const a=$('#alert');document.body.classList.add('alert');a.classList.remove('show');void a.offsetWidth;a.classList.add('show');if(!document.body.classList.contains('on'))$('#power').click();flash('super',6000);setTimeout(()=>{go('design')},2200);setTimeout(()=>{a.classList.remove('show');document.body.classList.remove('alert')},3400)};
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
let achMem=null,boardMem=null; /* conquistas e placar em memória (carregados do navegador sob demanda) */
let bpResult=null,simResult=null; /* resultado da última partida de cada jogo (para salvar só uma vez) */
const score=()=>(S.v[0]+(100-S.v[1])+S.v[2]+S.v[4])/4;
$('#inds').innerHTML=LBL.map((l,i)=>`<div class="ind ${i==1?'p':''}"><span>${l}</span><div class="bar"><i id="b${i}"></i></div><em><span id="n${i}"></span><span class="dl" id="d${i}"></span></em></div>`).join('');
const lerp=(a,b,t)=>a+(b-a)*t;
function paint(){S.v.forEach((x,i)=>{$('#b'+i).style.width=x+'%';$('#n'+i).textContent=Math.round(x);const d=S.d[i],e=$('#d'+i);e.textContent=d?(d>0?'+':'')+d:'';e.className='dl '+((d>0)==(i!=1)?'up':'dn')});
const q=cl((S.v[0]+100-S.v[1])/2)/100,s=$('#scene');
s.style.setProperty('--sky',`hsl(${lerp(22,205,q)},${lerp(30,42,q)}%,${lerp(15,38,q)}%)`);s.style.setProperty('--water',`hsl(${lerp(32,172,q)},${lerp(38,52,q)}%,${lerp(12,30,q)}%)`);
s.style.setProperty('--smoke',(.08+S.v[1]/100*.85).toFixed(2));s.style.setProperty('--veg',(S.v[0]/100).toFixed(2));s.style.setProperty('--alg',(.15+S.v[1]/100*.8).toFixed(2));
if(S.turn>0||S.over){const sc=score();setP(sc>=55?'ok':sc>=38?'risk':'bad')}}
function showEvent(){const e=EV[S.turn];$('#turn').textContent=`EVENTO ${p2(S.turn+1)}/06`;$('#evt').innerHTML=`<small>Evento ${p2(S.turn+1)}</small><p class="q">${e.q}</p>`+e.o.map((o,i)=>`<button class="opt" data-i="${i}"><b>${o.n}</b><small>${o.d}</small></button>`).join('')}
function apply(dl){dl.forEach((x,i)=>{const n=cl(S.v[i]+x);S.d[i]+=n-S.v[i];S.v[i]=n})}
function log(t){const l=$('#log');l.insertAdjacentHTML('afterbegin',`<div>&gt; ${t}</div>`);while(l.children.length>4)l.lastChild.remove()}
$('#evt').onclick=e=>{const b=e.target.closest('.opt');if(!b||S.over)return;const o=EV[S.turn].o[+b.dataset.i];S.d=[0,0,0,0,0,0];
const dl=o.v.map((d,k)=>{const g=k==1?-1:1;return Math.round(S.vil?(d*g>0?d*.6:d*1.4):d)});if(S.vil)dl[5]-=3;apply(dl);log(`${o.n}: ${o.d}`);
if(S.vil&&Math.random()<.8){const s=SAB[Math.random()*SAB.length|0];apply(s.v);log(`⚠ SABOTAGEM · ${s.n}`);const m=$('#vmsg');m.hidden=false;m.style.animation='none';void m.offsetWidth;m.style.animation='';m.textContent=`⚠ ${s.n} — ${VQ[Math.random()*VQ.length|0]}`;if(s.fx)flash('super',2500);unlock('sabotagem')}
S.turn++;paint();if(S.v[0]<=0||S.v[1]>=100||S.turn>=6)end();else showEvent()};
function end(){S.over=true;const ok=score()>=50&&S.v[0]>0&&S.v[1]<100;paint();setP(ok?'ok':'bad');const e=$('#end');e.hidden=false;e.className='end '+(ok?'ok':'bad');$('#eT').textContent=ok?'PLANETA RECUPERADO':'PLANETA EM COLAPSO';$('#eM').textContent=ok?'“O futuro não foi resolvido com uma única decisão. Foi construído com equilíbrio.”':'“Uma solução rápida pode acelerar o problema que pretendia resolver.”';$('#turn').textContent='FIM';simResult={score:Math.round(score()),villain:S.vil,saved:false};freeSave('sim');unlock('sim_done');if(ok){unlock('sim_win');if(S.vil)unlock('pressa')}checkDupla()}
function reset(){S.v=[55,45,35,50,40,60];S.turn=0;S.d=[0,0,0,0,0,0];S.over=false;simResult=null;$('#end').hidden=true;$('#log').innerHTML='';setP('ok');paint();showEvent()}
$('#retry').onclick=reset;
function setVil(on){S.vil=on;['#vil','#bpvil'].forEach(k=>{const e=$(k);e.setAttribute('aria-pressed',on);e.textContent='VILÃOIA // '+(on?'ON':'OFF')});document.body.classList.toggle('vil-on',on);const m=$('#vmsg');m.hidden=!on;if(on){m.textContent=VQ[0];toast('VILÃOIA ATIVA')}if(window.BioPulse)BioPulse.setVillain(on)}
$('#vil').onclick=()=>setVil(!S.vil);$('#bpvil').onclick=()=>setVil(!S.vil);
reset();
$$('[data-g]').forEach(b=>b.onclick=()=>{$$('[data-g]').forEach(x=>x.classList.toggle('on',x==b));$('#bp').hidden=b.dataset.g!='bp';$('#game-mount').hidden=b.dataset.g!='sim';if(b.dataset.g=='sim'){if(S.turn||S.over)paint();else setP('ok')}});
function togglePfs(on){const f=$('#bpmount');f.classList.toggle('pfs',on);document.body.classList.toggle('pfs-on',on);let x=$('#pfsExit');if(on&&!x){x=document.createElement('button');x.id='pfsExit';x.className='btn';x.textContent='✕ SAIR DA TELA CHEIA';x.onclick=()=>togglePfs(false);document.body.appendChild(x)}if(x)x.hidden=!on}
$('#bpfs').onclick=()=>{const f=$('#bpmount'),rq=f.requestFullscreen||f.webkitRequestFullscreen;if(document.fullscreenElement||f.classList.contains('pfs')){if(document.fullscreenElement)document.exitFullscreen();else togglePfs(false);return}if(rq){try{const r=rq.call(f);if(r&&r.catch)r.catch(()=>togglePfs(true))}catch(e){togglePfs(true)}}else togglePfs(true)};
let bpAuto=0;const bpOpts={onState:s=>{setP(s.phase);if(!bpAuto){bpAuto=1;if(!document.body.classList.contains('on'))$('#power').click()}},onStart:()=>{bpResult=null;$('#bpScore').hidden=true},onEnd:r=>{toast(r.won?'PLANETA RECUPERADO':'PLANETA EM COLAPSO');bpResult={score:r.tree,villain:r.villain,saved:false};freeSave('bp');$('#bpScoreMsg').textContent=`Resultado: ${r.won?'planeta recuperado':'planeta em colapso'} · Saúde final da árvore: ${r.tree}`;$('#bpScore').hidden=false;$('#bpSaveMsg').textContent='';
 unlock('bp_done');if(r.won){unlock('bp_win');if(r.hits===0)unlock('bp_perfect');if(r.villain)unlock('pressa')}if(r.maxCombo>=15)unlock('bp_combo');if(r.tree>=80)unlock('bp_tree');checkDupla()},onSabotage:s=>{flash('super',1800);toast(s.name);unlock('sabotagem')}};function mountBp(){BioPulse.mount($('#bpmount'),bpOpts)}mountBp();
/* salvar pontuação: cada partida só pode ser salva UMA vez */
const SV={bp:{res:()=>bpResult,name:'#bpName',btn:'#bpSaveScore',msg:'#bpSaveMsg',mode:'BioPulse'},sim:{res:()=>simResult,name:'#simName',btn:'#simSaveScore',msg:'#simSaveMsg',mode:'Simulação'}};
function freeSave(k){const c=SV[k];$(c.name).disabled=false;$(c.btn).disabled=false;$(c.btn).textContent='Salvar pontuação';$(c.msg).textContent=''}
function saveOnce(k){const c=SV[k],r=c.res(),m=$(c.msg);
 if(!r){m.textContent='Termine uma partida para salvar a pontuação.';return}
 if(r.saved){m.textContent='Esta pontuação já foi salva. Jogue de novo para salvar outra.';return}
 r.saved=true;$(c.btn).disabled=true;$(c.name).disabled=true;$(c.btn).textContent='Pontuação salva ✔';
 addScore($(c.name).value,r.score,c.mode,r.villain);m.textContent='Pontuação salva no placar!';unlock('placar')}
$('#bpSaveScore').onclick=()=>saveOnce('bp');$('#simSaveScore').onclick=()=>saveOnce('sim');
$('#bpName').onkeydown=e=>{if(e.key==='Enter')saveOnce('bp')};$('#simName').onkeydown=e=>{if(e.key==='Enter')saveOnce('sim')};
/* ambientes */
/* placar (fica no navegador de cada aparelho) */
function getBoard(){if(boardMem)return boardMem;try{boardMem=JSON.parse(localStorage.getItem('bf_board')||'[]')}catch(e){boardMem=[]}return boardMem}
function renderBoard(){const body=$('#boardBody');if(!body)return;const b=getBoard();if(!b.length){$('#board').hidden=true;$('#boardEmpty').hidden=false;return}$('#board').hidden=false;$('#boardEmpty').hidden=true;body.innerHTML=b.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.score)}</td><td>${esc(r.mode)}${r.villain?' · VilãoIA':''}</td></tr>`).join('')}
function addScore(name,score,mode,villain){name=(name||'').trim().slice(0,18)||'Anônimo';try{localStorage.setItem('bf_name',name)}catch(e){}const b=getBoard();b.push({name,score,mode,villain:!!villain});b.sort((x,y)=>y.score-x.score);boardMem=b.slice(0,10);try{localStorage.setItem('bf_board',JSON.stringify(boardMem))}catch(e){}renderBoard()}
/* conquistas (ficam no navegador; a lista está em js/data.js) */
function getAch(){if(achMem)return achMem;try{achMem=JSON.parse(localStorage.getItem('bf_ach')||'[]')}catch(e){achMem=[]}if(!Array.isArray(achMem))achMem=[];return achMem}
function unlock(id){const a=getAch();if(a.includes(id))return;const def=ACH.find(x=>x.id===id);if(!def)return;a.push(id);try{localStorage.setItem('bf_ach',JSON.stringify(a))}catch(e){}renderAch();achToast(def)}
function achToast(def){const box=$('#achToasts');if(!box)return;const el=document.createElement('div');el.className='achtoast';el.innerHTML=`<span class="ico">${def.ico}</span><span><small>Conquista desbloqueada</small><b>${esc(def.t)}</b></span>`;box.appendChild(el);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>el.remove(),4200)}
function renderAch(){const g=$('#achgrid');if(!g)return;const have=getAch();g.innerHTML=ACH.map(a=>{const on=have.includes(a.id);return `<div class="ach ${on?'on':''}"><span class="ico">${on?a.ico:'🔒'}</span><h4>${a.t}</h4><p>${a.d}</p></div>`}).join('');$('#achCount').textContent=`${have.length} de ${ACH.length} desbloqueadas`}
function checkDupla(){const a=getAch();if(a.includes('bp_done')&&a.includes('sim_done'))unlock('dupla')}
$('#achReset').onclick=()=>{if(!confirm('Apagar as conquistas deste navegador?'))return;achMem=[];try{localStorage.setItem('bf_ach','[]')}catch(e){}renderAch()};
renderAch();renderBoard();
if($('#lexBtn'))$('#lexBtn').onclick=()=>{const b=$('#lexBody');const open=!b.hidden;b.hidden=open;$('#lexBtn').textContent=open?'ACESSAR ARQUIVOS LEXCORP':'OCULTAR ARQUIVOS';$('#lexBtn').classList.toggle('press',!open);if(!open)unlock('lex')};
(function(){let n='';try{n=localStorage.getItem('bf_name')||''}catch(e){}if($('#bpName'))$('#bpName').value=n;if($('#simName'))$('#simName').value=n})();
/* recortes reais */
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
(function(){const w=$('#clipwall');if(!w)return;const rot=[-1.6,1.3,-.9,1.7,-1.2],edges=['e1','e2','e3','e2','e1'],tones=['p1','p3','p2','p1','p3'];
 w.innerHTML=CLIPS.map((c,i)=>{const links=c.links.map(k=>`<a class="newslink" href="${esc(k.u)}" target="_blank" rel="noopener noreferrer">${esc(k.l)} ↗</a>`).join('');
  const deco=i%2?'<span class="pin"></span>':'<span class="tape t1"></span><span class="tape t2"></span>';
  return `<div class="clip rv ${edges[i%5]} ${tones[i%5]}" style="--r:${rot[i%5]}deg">${deco}<article class="paper"><div class="newshead"><b>${esc(c.outlet)}</b><small>${esc(c.tag)} · ${esc(c.date)}</small></div><h4>${esc(c.h)}</h4><p>${esc(c.t)}</p><p class="why"><i>✎ Por que está aqui:</i> ${esc(c.why)}</p><div class="newslinks">${links}</div><small class="newsfoot">Resumo da equipe BIOFILITA — a matéria completa está na fonte original.</small></article></div>`}).join('');
 w.addEventListener('click',e=>{if(e.target.closest('.newslink'))unlock('leitor')});const s=$('#sources');if(s){const seen=[];CLIPS.forEach(c=>c.links.forEach(k=>{if(!seen.some(a=>a.u==k.u))seen.push(k)}));s.innerHTML='<h3>Fontes e referências</h3><ol>'+seen.map(k=>`<li><a href="${esc(k.u)}" target="_blank" rel="noopener noreferrer">${esc(k.d)}</a> · ${esc(k.l)}</li>`).join('')+'</ol>'}})();
if(matchMedia('(pointer:coarse)').matches){const sm=document.querySelector('.bpbar small');if(sm)sm.textContent='Toque nos botões da tela para jogar · use TELA CHEIA para jogar na horizontal'}
/* efeitos */
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

/* ---- Painel ADM (a senha fica no navegador; serve para o estande, não é segurança de verdade) ---- */
(function(){
const OK='bGVn';/* base64 da senha */
const ov=$('#adm');if(!ov)return;
const logged=()=>{try{return sessionStorage.getItem('bf_adm')==='1'}catch(e){return admMem}};let admMem=false;
const setLogged=v=>{admMem=v;try{v?sessionStorage.setItem('bf_adm','1'):sessionStorage.removeItem('bf_adm')}catch(e){}};
function show(){const on=logged();$('#admLogin').hidden=on;$('#admPanel').hidden=!on;if(on)draw();else{$('#admErr').hidden=true;$('#admPass').value='';setTimeout(()=>$('#admPass').focus(),30)}}
function draw(){const b=getBoard();$('#admN').textContent=b.length;$('#admBest').textContent=b.length?Math.max(...b.map(r=>r.score)):'–';$('#admA').textContent=getAch().length+'/'+ACH.length;
$('#admEmpty').hidden=b.length>0;$('#admBody').innerHTML=b.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.score)}</td><td>${esc(r.mode)}${r.villain?' · VilãoIA':''}</td><td class="admbtns"><button class="admedit" data-i="${i}" aria-label="Renomear ${esc(r.name)}">✎</button><button class="admdel" data-i="${i}" aria-label="Apagar ${esc(r.name)}">🗑</button></td></tr>`).join('')}
function open_(){try{BioPulse.pause()}catch(e){}ov.hidden=false;document.body.classList.add('adm-on');show()}
function close_(){ov.hidden=true;document.body.classList.remove('adm-on')}
$('#admOpen').onclick=open_;addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&(e.key==='A'||e.key==='a')){e.preventDefault();ov.hidden?open_():close_()}});$('#admClose').onclick=close_;
addEventListener('keydown',e=>{if(e.key==='Escape'&&!ov.hidden)close_()});
const tryLogin=()=>{if(btoa($('#admPass').value.replace(/[^a-zA-Z]/g,'').toLowerCase())===OK){setLogged(true);show()}else{$('#admErr').hidden=false;$('#admPass').select()}};$('#admEnter').onclick=tryLogin;$('#admPass').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();tryLogin()}};
$('#admOut').onclick=()=>{setLogged(false);undo=null;$('#admUndo').hidden=true;show()};
const save=()=>{try{localStorage.setItem('bf_board',JSON.stringify(boardMem))}catch(e){}renderBoard();draw()};
const two=(id,fn)=>{const b=$(id),t=b.textContent;let on=0,h;b.onclick=()=>{if(!on){on=1;b.textContent='Clique de novo para confirmar';h=setTimeout(()=>{on=0;b.textContent=t},4000);return}clearTimeout(h);on=0;b.textContent=t;fn()}};
let undo=null;const setUndo=()=>{undo=JSON.parse(JSON.stringify(getBoard()));$('#admUndo').hidden=false};
$('#admBody').onclick=e=>{const d=e.target.closest('.admdel'),ed=e.target.closest('.admedit');
if(d){setUndo();getBoard().splice(+d.dataset.i,1);save()}
else if(ed){const i=+ed.dataset.i,r=getBoard()[i],td=ed.closest('tr').children[1];td.innerHTML='<input class="admren" maxlength="18" value="'+esc(r.name)+'">';const inp=td.firstChild;inp.focus();inp.select();let done=0;const fin=ok=>{if(done)return;done=1;if(ok){setUndo();r.name=inp.value.trim().slice(0,18)||'Anônimo';save()}else draw()};inp.onkeydown=e=>{if(e.key==='Enter')fin(1);else if(e.key==='Escape')fin(0)};inp.onblur=()=>fin(1)}};
$('#admUndo').onclick=()=>{if(!undo)return;boardMem=undo;undo=null;$('#admUndo').hidden=true;save()};
const addManual=()=>{const raw=$('#admAddScore').value.trim(),v=Math.round(+raw);if(raw===''||isNaN(v)){$('#admAddErr').hidden=false;return}$('#admAddErr').hidden=true;const s=Math.max(0,Math.min(999,v));setUndo();addScore($('#admAddName').value,s,$('#admAddMode').value,false);$('#admAddName').value='';$('#admAddScore').value='';draw();tg('Pontuação adicionada.')};
$('#admAddBtn').onclick=addManual;['#admAddName','#admAddScore'].forEach(k=>$(k).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addManual()}});
const tg=m=>{const t=$('#admMsg');t.textContent=m;t.hidden=false;clearTimeout(tg.t);tg.t=setTimeout(()=>t.hidden=true,3500)};
$('#admFixBp').onclick=()=>{try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}if(document.body.classList.contains('pfs-on'))togglePfs(false);bpResult=null;$('#bpScore').hidden=true;mountBp();tg('BioPulse reiniciado.')};
$('#admVic').onclick=()=>{close_();try{BioPulse.resume()}catch(e){}const bm=$('#bpmount');if(bm&&bm.scrollIntoView)bm.scrollIntoView({block:'center'});try{BioPulse.previewVictory($('#admVicChar').value)}catch(e){}};
$('#admPoses').onclick=()=>{close_();try{BioPulse.resume()}catch(e){}const bm=$('#bpmount');if(bm&&bm.scrollIntoView)bm.scrollIntoView({block:'center'});try{BioPulse.previewPoses($('#admVicChar').value)}catch(e){}};
$('#admFixSim').onclick=()=>{reset();tg('Simulação reiniciada.')};
$('#admFixVil').onclick=()=>{setVil(false);tg('VilãoIA desligada.')};
$('#admFixFs').onclick=()=>{try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}if(document.body.classList.contains('pfs-on'))togglePfs(false);tg('Tela cheia desligada.')};
$('#admTop').onclick=()=>{close_();scrollTo({top:0})};
$('#admReload').onclick=()=>location.reload();
two('#admClear',()=>{if(!getBoard().length)return;setUndo();boardMem=[];save()});
$('#admCsv').onclick=()=>{const q=v=>'"'+String(v).replace(/"/g,'""').replace(/^([=+\-@])/,"'$1")+'"';const rows=[['posicao','nome','pontuacao','modo','vilaoia'],...getBoard().map((r,i)=>[i+1,r.name,r.score,r.mode,r.villain?'sim':'nao'])];
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(q).join(';')).join('\n')],{type:'text/csv'}));a.download='placar-biofilita.csv';document.body.appendChild(a);a.click();a.remove()};
$('#admUnlock').onclick=()=>{achMem=ACH.map(a=>a.id);try{localStorage.setItem('bf_ach',JSON.stringify(achMem))}catch(e){}renderAch();draw()};
two('#admAchReset',()=>{achMem=[];try{localStorage.setItem('bf_ach','[]')}catch(e){}renderAch();draw()});
})();
