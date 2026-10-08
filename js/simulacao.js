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
