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
