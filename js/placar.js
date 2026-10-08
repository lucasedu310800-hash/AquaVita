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
