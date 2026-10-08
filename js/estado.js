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
