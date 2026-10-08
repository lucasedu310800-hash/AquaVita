// ## 01. Funções auxiliares: selecionam elementos e normalizam números.
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],p2=n=>String(n).padStart(2,'0'),cl=v=>Math.max(0,Math.min(100,v));
let uid=0;
