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
