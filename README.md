# BIOFILITA · Aqua Vita · Future Fest

Site interativo do projeto BIOFILITA: biorreator de algas, IA, jogo BioPulse,
simulação com a VilãoIA, conquistas, placar e recortes de notícias reais.

## Como abrir

**Mais simples:** dê dois cliques em `index.html`.

**No VS Code (recomendado):**
1. `Arquivo > Abrir Pasta...` e escolha a pasta `biofilita`.
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito em `index.html` > **Open with Live Server**.
   A página recarrega sozinha toda vez que você salvar.

## Estrutura

```
biofilita/
├── index.html          estrutura da página (textos, seções)
├── css/
│   └── style.css       todo o visual (cores, layout, CRT, recortes)
├── js/
│   ├── biopulse.js     o jogo BioPulse (canvas)
│   ├── data.js         ✏️ DADOS EDITÁVEIS: conquistas e recortes de notícias
│   └── main.js         lógica do site: reator, simulação, conquistas, placar, menu
├── img/
│   ├── rio-poluido.jpg foto do Cenário A
│   ├── rio-limpo.jpg   foto do Cenário B
│   └── favicon.svg     ícone da aba
└── README.md
```

A ordem dos scripts no `index.html` importa: `biopulse.js` → `data.js` → `main.js`.

## O que você mais vai querer editar

| Quero…                                   | Onde                                             |
|------------------------------------------|--------------------------------------------------|
| Trocar/criar conquistas                   | `js/data.js` → `ACH` (copie um bloco)            |
| Adicionar ou trocar recortes de notícias | `js/data.js` → `CLIPS` (copie um bloco)          |
| Trocar as fotos dos rios                 | substitua os arquivos em `img/` (mesmo nome)     |
| Mudar cores                              | `css/style.css` → `:root{ --neon: ...; }`        |
| Mudar textos das seções                  | `index.html`                                     |
| Ajustar a dificuldade do jogo            | `js/biopulse.js`                                 |

## Conquistas

Substituem o antigo sistema de prêmios. São 14, definidas em `ACH` (`js/data.js`) e
desbloqueadas por `unlock('id')` no `js/main.js`:

| Conquista | Como desbloquear |
|-----------|------------------|
| Intervenção Ativada | apertar o botão INTERVENÇÃO |
| Guardião da Árvore | chegar ao fim de uma partida do BioPulse |
| Titã Derrotado | vencer o BioPulse |
| Sem Arranhões | vencer o BioPulse sem levar nenhum golpe |
| Mestre do Combo | combo de 15 ou mais no BioPulse |
| Árvore Viçosa | terminar o BioPulse com a árvore em 80 ou mais |
| Alvo da VilãoIA | sofrer uma sabotagem (BioPulse ou Simulação) |
| Contra a Pressa | recuperar o planeta com a VilãoIA ligada |
| Analista Ambiental | completar uma rodada da Simulação |
| Decisão Sustentável | recuperar o planeta na Simulação |
| Dupla Experiência | terminar o BioPulse e a Simulação |
| Investigador | abrir os arquivos da LexCorp |
| Leitor de Recortes | abrir um link dos recortes |
| Nome no Placar | salvar uma pontuação |

Aparecem na seção "Conquistas & placar" (bloqueadas ficam apagadas com 🔒) e num aviso no
canto da tela ao desbloquear. O botão **Zerar conquistas** limpa tudo (útil no computador
do estande entre um visitante e outro). A pontuação não depende mais de bônus nem de faixa
de prêmio: o placar mostra só nome, pontuação e modo.

## Salvar pontuação só uma vez

Cada partida (BioPulse ou Simulação) só pode ser salva **uma vez**. Ao clicar em
"Salvar pontuação" (ou apertar Enter no campo de nome) o botão e o campo travam e o botão
vira "Pontuação salva ✔". Jogar de novo libera o salvamento da nova partida. Ao começar uma
nova partida do BioPulse, a caixa de salvar some (antes ela ficava aberta e dava para
salvar a mesma pontuação várias vezes). Para isso, o `js/biopulse.js` ganhou o aviso
`onStart` (uma linha em `startGame`).

## Versão para celular

- Menu compacto: o cabeçalho ocupa uma linha só e o menu desliza com o dedo; a barra de aviso
  rola junto com a página e só o menu fica grudado no topo.
- Botões e campos com no mínimo 44 px de altura em telas de toque; campos de nome com 16 px
  (o iPhone não dá zoom ao digitar).
- **TELA CHEIA** funciona também no iPhone (que não tem a API de tela cheia): o jogo ocupa a
  tela inteira e aparece o botão "✕ SAIR DA TELA CHEIA". Gire o celular para jogar na horizontal.
- Conquistas em 2 colunas, placar sem rolagem lateral, tela final da Simulação com rolagem
  quando o conteúdo não cabe.

## Menu inicial e personagens (BioPulse)

O menu do BioPulse agora tem cenário em pixel art (lago, cachoeira, cidade ao fundo), logo
BIOPULSE e três botões: **JOGAR**, **PERSONAGENS** e **COMO JOGAR**. Em PERSONAGENS dá para
escolher entre **Zezze** (cabelo castanho de lado, olhos verdes, bochechas rosadas, corrente dourada, moletom preto; faz pose de força ao vencer), **Capivara** e **Guardião** (herói original); setas
← → trocam, Enter joga. A escolha fica salva no navegador (`bf_char`). O personagem é só
visual: o jogo e a pontuação são iguais. Para criar outro, veja `CHARS` e `altParts` em
`js/biopulse.js`. O cenário do menu é desenhado por código em `_buildMenuBg`.

## Pastas de personagens (Estudantes e Heróis)

A tela de personagens tem duas pastas: **Estudantes** (Zezze e os próximos) e **Heróis**
(Capivara e Guardião). Cada página mostra 3 cartas; com mais de 3 aparecem as setas `<` `>`.
Vagas livres de Estudantes aparecem como "EM BREVE".

**Para adicionar um estudante**, em `js/biopulse.js`, na lista `CHARS`, copie a linha do Zezze e troque:

    { id: 'maria', group: 'estudantes', name: 'MARIA', desc: 'Frase curta.', secret: true,
      look: { hair: '#2b1d17', hairL: '#4a3428', hairD: '#150e0b', skin: '#e3a47c', skinD: '#c07f5c',
              eye: '#6b4a2b', hood: '#8a2230', glasses: true, chain: false, blush: false } }

Todas as chaves de `look` são opcionais (`hair`, `hairL`, `hairD`, `skin`, `skinD`, `eye`, `eyeL`,
`eyeD`, `hood`, `hoodL`, `hoodD`, `pants`, `pantsL`, `shoe`, `glasses`, `chain`, `blush`).

Armas e esquivas por personagem (visual): no `look` do estudante, `weapon: 'tuba'` ou `'book'` troca o soco
e o golpe para cima por uma tubada ou uma livrada, e quem usa `weapon: 'book'` (Davi) comemora a vitória lendo o
livro e lançando magia, com páginas girando. A esquiva (tecla S) é a bolha d'água para todos. O Gois usa `weapon: 'tools'`: martelo no ataque lateral, chave de fenda para cima, comemoração desmontando um robozinho e uma aura de mecânico (brilho laranja, engrenagens e faíscas) o tempo todo. O jogo funciona igual para todos.

## Segredo dos estudantes (código secreto)

Com um estudante escolhido, no menu inicial ou na tela de personagens, digite
**↑ ↑ ↓ ↓ ← → ← →** (setas ou W/S/A/D; no celular, deslize o dedo nessa ordem numa área vazia).
Os movimentos digitados aparecem no topo da tela. Ao completar, surge "CÓDIGO CERTO! APERTE ENTER" (ou toque no botão ENTER no celular); só então abre uma tela que pixeliza a foto aos poucos, troca pela versão em pixel art (quando existe) e termina revelando o personagem do jogo.
Fotos: Pedro e Davi já vêm em `img/estudantes/` (`pedro.jpg` e `pedro-pixel.jpg`, `davi.jpg` e `davi-pixel.jpg`). O Gois usa a arte `gois-pixel.jpg` (troque por `gois.jpg` + `photo` em `CHARS` se tiver a foto). O Zezze também vem em `img/estudantes/` (`zezze.jpg` e `zezze-pixel.jpg`). Para outros estudantes use `img/estudantes/<id>.jpg` (foto) e `<id>-pixel.jpg` (arte opcional); o `id` é o que está em `CHARS`. Use fotos com o consentimento da
pessoa e, de preferência, só o rosto ou com roupa. Sem o arquivo, a tela mostra o aviso e a
revelação em pixel art funciona do mesmo jeito. Abra o site por hospedagem ou servidor; com o
arquivo aberto direto do disco alguns navegadores bloqueiam a imagem.

## Cenário do jogo

O fundo tem camadas (serra ao fundo, montanhas com neve e pinheiros, colina com arbustos e cerca,
capim balançando, rio com reflexo, juncos e vitórias-régias, pássaros, raios de sol, estrelas à
noite e vagalumes). Tudo muda com o estado do mundo: saudável fica verde e luminoso, poluído
fica cinza com fábricas. As camadas pesadas ficam em cache (`layer()` em `js/biopulse.js`).

## Painel ADM

Botão discreto **ADM** no rodapé, ou o atalho **Ctrl + Shift + A** em qualquer ponto da página
(abre o painel e pausa o BioPulse). Senha: `leg` (sem diferenciar maiúsculas).

- **Placar:** apagar uma pontuação (🗑), renomear (✎), adicionar uma manualmente, limpar tudo,
  baixar em CSV e **desfazer** a última alteração.
- **Conquistas:** liberar todas ou zerar.
- **Se der erro na apresentação:** reiniciar o BioPulse, reiniciar a Simulação, desligar a
  VilãoIA, sair da tela cheia, voltar ao topo e recarregar a página.

Aviso: como o site é estático, a senha fica no código (`js/main.js`) e só protege contra
curiosos. O painel mexe apenas nos dados do navegador em que está aberto.

## Observações

- O placar e as conquistas ficam salvos **no navegador de cada aparelho**
  (`localStorage`). Não existe ranking compartilhado entre computadores.
- As fontes (Space Grotesk e JetBrains Mono) vêm do Google Fonts e precisam de
  internet; sem ela o site usa fontes do sistema e continua funcionando.
- Os recortes de notícias são resumos feitos pela equipe; cada um tem o link
  da fonte original. Confira as datas antes de apresentar.

## Cena de vitória

Inspirada nas telas de vitória do Street Fighter: aparece "NOME VENCE" em letras grandes, a etiqueta RESULTADO no canto e uma legenda com a fala do personagem. Ao derrotar a poluição, o personagem corre para o lado esquerdo e cresce, com raios de luz atrás. Aí toca a animação dele: o Gois monta o robô inteiro (pés, corpo, braços, cabeça e antena) a marteladas, os outros comemoram com confete (o Pedro com notas musicais, o Davi com a magia do livro). Só depois o painel de pontuação sobe pela direita. Enter ou um toque pulam a animação.

No painel ADM (senha `leg`) há o botão **▶ Ver animação de vitória**: escolha o personagem na lista e a cena roda no jogo, sem registrar pontuação nem conquistas.

Cada personagem tem a sua animação: Gois monta o robô chamando as peças com a mão, dá o choque final (cai um raio e o robô acorda), dá um mortal, monta nos ombros dele e os dois saem voando inclinados, com propulsores, Zezze arranca uma indústria do chão, levanta com uma mão, joga longe e mostra os músculos com uma onda de choque, Pedro toca a tuba com a capivara dançando e ondas sonoras, Davi abre um círculo de runas e faz nascer uma árvore, e a Capivara e o Guardião soltam corações e brilhos.

Todas as cenas de vitória seguem o estilo de montagem dos jogos LEGO: uma pilha de tijolos coloridos, o personagem chamando as peças com a mão, os tijolos voando em arco e encaixando um a um com um clique e uma faísca. O Gois monta o robô, o Zezze uma fábrica, o Pedro um palco com alto-falantes, o Davi uma árvore e a Capivara/Guardião um troféu. Para mudar o que cada um monta, edite os desenhos em `ART` (letras = cores dos tijolos) no `biopulse.js`.

Detalhe da montagem (igual ao LEGO Batman): os tijolos ficam espalhados pelo chão, pulam e voam de todos os lados até a peça, que cresce de baixo para cima; o personagem fica sobre um anel azul de construção e, quando termina, saem estrelinhas e studs prateados.

## Animações de vitória (atualização)
- Nenhuma animação usa mais o estilo LEGO (sem tijolos, anel ou studs; robô do Gois com visual liso).
- Zezze, Davi, Pedro e Capy/Hero voltaram às animações anteriores, sem peças.
- Pedro já começa com a **pista de dança** acesa no chão.
- Robô do Gois: maior, com peitoral, ombreiras, reator e braços articulados que balançam e acenam.

## Matheus (novo estudante)
`id: 'matheus'`, `weapon: 'dj'`: cabelo cacheado, moletom preto, fone no pescoço (vai para a cabeça na vitória), sinal de paz, aura de streamer e onda sonora no ataque. Vitória: estúdio com equalizador, ON AIR e selfie com a foto pixelada. Código secreto (↑ ↑ ↓ ↓ ← → ← →) mostra `img/estudantes/matheus-pixel.png`; a foto real é `matheus.png`.
- Auras em volta do Gois e do Matheus foram removidas.

## Kauan (novo estudante)
`id: 'kauan'`, `weapon: 'fish'`: camisa azul, ataca com um peixe, ergue o peixe como troféu. Vitória: pesca no lago (lança a linha, a boia balança, o peixe morre na isca e ele puxa). Fotos: `img/estudantes/kauan.png` e `kauan-pixel.png`.

## Felipe (novo estudante)
`id: 'felipe'`, `weapon: 'lettuce'`: ataca com alface (alfacada), ergue a alface. Vitória: come alface (mordidas e pedacinhos voando) e depois desenha num cavalete (sol, árvore, gota d'água e a assinatura) mordendo a alface com a outra mão. Fotos: `img/estudantes/felipe.png` e `felipe-pixel.png`.

## Capivara melhorada
Em todo lugar onde ela aparece (jogo, menu, seleção, vitória do Pedro e dela mesma): pisca, mexe a orelha e o rabinho, mastiga, tem bochecha e bigodes. Nova pose `dance` (pula, balança e levanta as patas, com notinhas). Em pé acena com as duas patas na vitória. A cabeçada ganhou linhas de velocidade e estrelinhas de impacto. Na vitória dela alterna dança, pose em pé e cabeçada.

## Heroína
`id: 'heroina'` (grupo Heróis): a mesma do Guardião (mesmo traje, capa e poderes), com cabelo ruivo comprido e rabo de cavalo, cílios e batom. Vitória: "A água é vida. E eu protejo a água!".

## Esquiva, dano e derrota por personagem
- **Esquiva** (S / botão BOLHA): cada um tem a sua, com a mesma invencibilidade e recarga de antes. Gois rola, Zezze dá uma finta com sombras, Pedro se protege com a tuba dourada, Matheus dança de lado com ondas sonoras, Kauan levanta a vara, Felipe se esconde numa folha de alface, Capivara mergulha na água, Guardião e Heroína se enrolam na capa. Davi mantém a esquiva do livro.
- **Dano**: o personagem se inclina para trás, leva um empurrão, aparecem estrelinhas e peças características voando (o Gois chega a deixar cair a chave de fenda).
- **Derrota**: cai para trás e fica tonto, com um objeto do estilo dele no chão (tuba, vara quebrada, alface murcha, fone, livro, peças do robô, capa). A capivara fica de barriga para cima.
- **Painel de adm**: botão "Ver esquiva, dano e derrota" mostra as três poses do personagem escolhido (ENTER ou toque para sair).

## Gois: esquiva Electric Thunder (estilo Blanka)
A esquiva do Gois (tecla S) agora é o "Electric Thunder": ele se agacha inclinado, com brilho amarelo, juba de espetos e 12 raios amarelos saindo do corpo. A vitória dele ficou como antes, sem esse efeito.
- Toda esquiva agora também abre uma bolha em volta do personagem, na cor dele (amarela no Gois, dourada no Pedro, rosa no Matheus, verde no Felipe etc.).
- Na tela do código secreto, se uma foto não existir, não aparece mais o aviso 'Coloque a foto em...': o quadro mostra o personagem em pixel art.
- Removida da seção do protótipo a galeria de 4 quadros 'Registro 01–04' (espaços para fotos).
