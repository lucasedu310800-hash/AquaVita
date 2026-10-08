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
