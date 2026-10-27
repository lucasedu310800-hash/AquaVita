/*!
 * BioPulse · Guardião da Árvore Líquida — AquaVita
 * Jogo 2D em JavaScript puro. Sem dependências, sem arquivos externos, sem rede.
 * Arte desenhada em código no canvas (pixel art procedural) e som sintetizado com WebAudio.
 *
 * API:
 *   BioPulse.mount(el, opts)   opts = { onState(s), onEnd(r), onStart(), onSabotage(s), villain, autoStart, muted, character: 'boy'|'capy'|'hero' }
 *   BioPulse.setVillain(true|false)   liga/desliga o modo VilãoIA (tecnologia sem ética)
 *   BioPulse.destroy()
 *   BioPulse.pause() / BioPulse.resume()
 *
 * onState({ health, pollution, phase })  health = saúde da Árvore Líquida (0-100)
 *                                        pollution = nível de poluição (0-100)
 *                                        phase = 'ok' | 'risk' | 'bad'
 * onEnd({ won })                         won = true se o Titã foi derrotado
 */
(function () {
  'use strict';

  /* ======================================================================
     1. CONSTANTES
     ====================================================================== */

  var UW = 640, UH = 360;              // espaço lógico da interface
  var W = 320, H = 180;                // espaço lógico do mundo (2x menor)
  var GY = 150, CX = 160, REACH = 44;  // chão, centro, alcance do soco
  var OUT = '#0d1424';
  var MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

  var INK = '#e8fbff', SOFT = '#9cc3d3', AQUA = '#5fe0ff', DEEP = '#1d8fd0',
      LEAF = '#4ee39a', DANGER = '#ff5d6c', GOLD = '#ffd166', PANEL = 'rgba(8,18,31,0.93)';

  /* ---------- balanceamento (equivalente ao game_data.gd) ---------- */

  var ENEMIES = {
    trash:  { role: 'comum',      hp: 1, speed: 36,  y: 0,   hw: 10, dmg: 8,  color: '#3e5043' },
    smog:   { role: 'comum',      hp: 1, speed: 26,  y: -40, hw: 13, dmg: 8,  color: '#8a8c96' },
    bottle: { role: 'rapido',     hp: 1, speed: 95,  y: -44, hw: 11, dmg: 7,  color: '#a6e3f5' },
    barrel: { role: 'resistente', hp: 2, speed: 58,  y: 0,   hw: 14, dmg: 12, color: '#c8b23a' },
    car:    { role: 'resistente', hp: 3, speed: 30,  y: 0,   hw: 20, dmg: 14, color: '#7e6b58' },
    drone:  { role: 'distancia',  hp: 2, speed: 40,  y: -60, hw: 12, dmg: 10, color: '#5b606d' },
    mist:   { role: 'especial',   hp: 1, speed: 32,  y: -36, hw: 12, dmg: 10, color: '#8e6cb8' },
    oil:    { role: 'especial',   hp: 1, speed: 46,  top: true, hw: 10, dmg: 8, color: '#3a2f4f' },
    sludge: { role: 'projetil',   hp: 1, speed: 84,  y: -40, hw: 7,  dmg: 8,  color: '#6a7c34' }
  };

  var WAVES = [
    { count: 8,  mix: { trash: 4, smog: 4 }, gap: [1.7, 2.3], speed: 0.80, cap: 2, pairs: 0.00, volley: 0.00, sub: 'Aprenda o ritmo' },
    { count: 12, mix: { trash: 3, smog: 2, bottle: 4, oil: 3 }, gap: [1.15, 1.65], speed: 0.95, cap: 3, pairs: 0.10, volley: 0.00, sub: 'Plástico e óleo' },
    { count: 15, mix: { trash: 2, bottle: 3, barrel: 3, car: 2, drone: 2, mist: 1, oil: 2 }, gap: [0.95, 1.35], speed: 1.05, cap: 4, pairs: 0.18, volley: 0.06, sub: 'Resíduos industriais' },
    { count: 18, mix: { trash: 2, bottle: 4, barrel: 2, car: 2, drone: 2, mist: 3, oil: 3 }, gap: [0.75, 1.10], speed: 1.15, cap: 5, pairs: 0.25, volley: 0.15, sub: 'Tempestade de poluição' }
  ];

  /* ---------- personagens jogáveis (só visual: o jogo é igual para todos) ---------- */
  var GROUPS = [
    { id: 'estudantes', name: 'ESTUDANTES' },
    { id: 'herois',     name: 'HERÓIS' }
  ];
  /* Para adicionar um estudante: copie um bloco com group 'estudantes' e troque id, name, desc e as cores em look.
     A foto do código secreto fica em img/estudantes/<id>.jpg (o Zezze também fica em img/estudantes/zezze.jpg). */
  var CHARS = [
    { id: 'boy',  group: 'estudantes', name: 'ZEZZE', desc: 'Loiro, de olhos azuis e muita coragem.', secret: true, photo: 'img/estudantes/zezze.jpg', art: 'img/estudantes/zezze-pixel.jpg', look: { hair: '#f0cc55', hairL: '#fff0a0', hairD: '#d1a432', eye: '#3f8fe6', eyeL: '#a8d8ff', eyeD: '#1f5aa8', hood: '#a7b6bf', hoodL: '#c5d2d8', hoodD: '#7f9099', pants: '#16161c', pantsL: '#292933', chain: false, short: true } },
    { id: 'pedro', group: 'estudantes', name: 'PEDRO', desc: 'Faz música com a tuba.', secret: true, photo: 'img/estudantes/pedro.jpg', art: 'img/estudantes/pedro-pixel.jpg', look: {
        hair: '#1c120d', hairL: '#3a281d', hairD: '#0c0705', skin: '#cf9468', skinD: '#ad7549', eye: '#3a2415', eyeL: '#7a5232', eyeD: '#1d1008',
        hood: '#5c6689', hoodL: '#7d88ad', hoodD: '#3d4767', pants: '#4a5068', pantsL: '#5e657e', shoe: '#2c2c34',
        curly: true, suit: true, prop: 'tuba', weapon: 'tuba', chain: false, blush: false } },
    { id: 'davi', group: 'estudantes', name: 'DAVI', desc: 'De óculos e mochila nas costas.', secret: true, photo: 'img/estudantes/davi.jpg', art: 'img/estudantes/davi-pixel.jpg', look: {
        hair: '#17100c', hairL: '#33241a', hairD: '#0a0605', skin: '#c58a5e', skinD: '#a56c45', eye: '#3a2415', eyeL: '#7a5232', eyeD: '#1d1008',
        hood: '#b9c6d6', hoodL: '#d6e0ea', hoodD: '#8799b0', pants: '#16161c', pantsL: '#292933', shoe: '#2c2c34',
        curly: true, glasses: true, bag: '#d9cba2', weapon: 'book', chain: false, blush: false } },
    { id: 'gois', group: 'estudantes', name: 'GOIS', desc: 'Desmonta tudo: chave de fenda e martelo.', secret: true, photo: 'img/estudantes/gois-pixel.jpg', art: 'img/estudantes/gois-pixel.jpg', look: {
        hair: '#2b1c14', hairL: '#4a3326', hairD: '#150d09', skin: '#efbea0', skinD: '#cf9a7a', eye: '#3a2415', eyeL: '#7a5232', eyeD: '#1d1008',
        hood: '#a58b74', hoodL: '#c4ab93', hoodD: '#7d6753', pants: '#262533', pantsL: '#383748', shoe: '#2c2c34',
        bag: '#1f1f27', weapon: 'tools', chain: false, blush: false } },
    { id: 'matheus', group: 'estudantes', name: 'MATHEUS', desc: 'Streamer: fone no pescoço e o sinal de paz.', secret: true, photo: 'img/estudantes/matheus.png', art: 'img/estudantes/matheus-pixel.png', look: {
        hair: '#3b2517', hairL: '#5c3d28', hairD: '#1f130c', skin: '#e6ad86', skinD: '#c48a64', eye: '#3a2415', eyeL: '#7a5232', eyeD: '#1d1008',
        hood: '#1d1d26', hoodL: '#33333f', hoodD: '#0d0d12', pants: '#1a1a22', pantsL: '#2b2b36', shoe: '#2c2c34',
        curly: true, phones: true, weapon: 'dj', chain: false, blush: false } },
    { id: 'kauan', group: 'estudantes', name: 'KAUAN', desc: 'Pescador: bate com peixe e pesca na vitória.', secret: true, photo: 'img/estudantes/kauan.png', art: 'img/estudantes/kauan-pixel.png', look: {
        hair: '#17100c', hairL: '#33241a', hairD: '#0a0605', skin: '#c98c62', skinD: '#a56c45', eye: '#3a2415', eyeL: '#7a5232', eyeD: '#1d1008',
        hood: '#2a6fd0', hoodL: '#5a9cf2', hoodD: '#1a4a9a', pants: '#24262e', pantsL: '#363a46', shoe: '#f2f2f2',
        short: true, weapon: 'fish', chain: false, blush: false } },
    { id: 'felipe', group: 'estudantes', name: 'FELIPE', desc: 'Come alface e desenha o futuro.', secret: true, photo: 'img/estudantes/felipe.png', art: 'img/estudantes/felipe-pixel.png', look: {
        hair: '#2a1a12', hairL: '#4a3224', hairD: '#150c08', skin: '#e6ae88', skinD: '#c48a64', eye: '#3a2415', eyeL: '#7a5232', eyeD: '#1d1008',
        hood: '#1f2a44', hoodL: '#35476e', hoodD: '#111a2c', pants: '#1a1a22', pantsL: '#2b2b36', shoe: '#2c2c34',
        curly: true, bag: '#1c1c24', weapon: 'lettuce', chain: false, blush: false } },
    { id: 'capy', group: 'herois', name: 'CAPIVARA', desc: 'Calma e forte. Ataca de cabeçada.' },
    { id: 'hero', group: 'herois', name: 'GUARDIÃO', desc: 'O herói da AquaVita, de capa.' },
    { id: 'heroina', group: 'herois', name: 'HEROÍNA', desc: 'A heroína da AquaVita, de capa. Mesmos poderes.' }
  ];
  var PER_PAGE = 3;
  function groupOf(id) { for (var i = 0; i < CHARS.length; i++) if (CHARS[i].id === id) return CHARS[i].group; return GROUPS[0].id; }
  function inGroup(gid) { var r = [], i; for (i = 0; i < CHARS.length; i++) if (CHARS[i].group === gid) r.push(CHARS[i]); return r; }

  var KONAMI = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  function charIndex(id) { for (var i = 0; i < CHARS.length; i++) if (CHARS[i].id === id) return i; return 0; }

  var FX_LABEL = { air: 'AR', water: 'ÁGUA', green: 'VERDE', carbon: 'CARBONO', pollution: 'POLUIÇÃO', tree: 'ÁRVORE' };

  var EVENTS = [
    { tag: 'AR', title: 'Carbono em alta', text: 'Os níveis de carbono estão aumentando. O que fazer?',
      good: { label: 'Investir em energia e transporte limpos', short: 'Energia limpa', fx: { carbon: -18, air: 12, pollution: -6, tree: 6 }, msg: 'O céu começa a clarear e a Árvore Líquida respira melhor.' },
      bad: { label: 'Criar novas indústrias', short: 'Novas indústrias', fx: { carbon: 16, pollution: 12, air: -10, tree: -6 }, msg: 'A economia acelera… e as chaminés também.' } },
    { tag: 'ÁGUA', title: 'Rio contaminado', text: 'Uma fábrica está despejando resíduos no rio da cidade.',
      good: { label: 'Instalar uma estação de tratamento', short: 'Tratamento do rio', fx: { water: 20, pollution: -6, tree: 8 }, msg: 'A água volta a correr limpa até a Árvore Líquida.' },
      bad: { label: 'Manter a produção e ignorar o problema', short: 'Ignorar o rio', fx: { water: -20, pollution: 8, tree: -8 }, msg: 'O rio escurece. A Árvore Líquida bebe água suja.' } },
    { tag: 'PLÁSTICO', title: 'Mar de plástico', text: 'Ruas, rios e praias estão cheios de plástico descartável.',
      good: { label: 'Proibir descartáveis e investir em reciclagem', short: 'Reciclagem', fx: { pollution: -12, water: 10, green: 4 }, msg: 'Menos plástico circulando, mais vida na água.' },
      bad: { label: 'Produzir mais embalagens baratas', short: 'Mais embalagens', fx: { pollution: 14, water: -10 }, msg: 'Montanhas de plástico se acumulam pelo caminho.' } },
    { tag: 'FLORESTA', title: 'Desmatamento', text: 'Uma empresa quer derrubar uma floresta inteira para abrir pasto.',
      good: { label: 'Criar uma reserva ambiental', short: 'Reserva ambiental', fx: { green: 20, carbon: -8, air: 6 }, msg: 'A floresta fica de pé e volta a crescer.' },
      bad: { label: 'Liberar o desmatamento', short: 'Desmatamento liberado', fx: { green: -22, carbon: 10, air: -6, tree: -6 }, msg: 'As árvores caem e o solo fica exposto.' } },
    { tag: 'TRÂNSITO', title: 'Cidade congestionada', text: 'O número de carros triplicou e o ar ficou pesado.',
      good: { label: 'Construir ciclovias e usar ônibus elétricos', short: 'Ciclovias e ônibus elétricos', fx: { air: 16, carbon: -12, pollution: -4 }, msg: 'Menos escapamentos, ar mais leve.' },
      bad: { label: 'Abrir novas avenidas para mais carros', short: 'Mais avenidas', fx: { air: -14, carbon: 12, green: -6 }, msg: 'O asfalto avança sobre o verde e a fumaça aumenta.' } },
    { tag: 'LIXO', title: 'Lixo a céu aberto', text: 'O lixo da cidade está sendo jogado em terrenos abertos.',
      good: { label: 'Implantar coleta seletiva e compostagem', short: 'Coleta seletiva', fx: { pollution: -14, green: 6, water: 4 }, msg: 'O lixo vira adubo e matéria-prima.' },
      bad: { label: 'Ampliar o lixão', short: 'Lixão maior', fx: { pollution: 14, water: -8, air: -4 }, msg: 'O chorume escorre em direção ao rio.' } },
    { tag: 'INDÚSTRIA', title: 'Novo polo industrial', text: 'Um grande polo industrial quer se instalar perto da cidade.',
      good: { label: 'Aprovar só com filtros e tecnologia limpa', short: 'Indústria com filtros', fx: { pollution: -6, air: 8, carbon: -4 }, msg: 'Empregos chegam sem sufocar o céu.' },
      bad: { label: 'Aprovar sem nenhuma exigência', short: 'Indústria sem regras', fx: { pollution: 16, air: -12, carbon: 10 }, msg: 'Novas chaminés tomam o horizonte.' } },
    { tag: 'ENERGIA', title: 'Falta de energia', text: 'A cidade está ficando sem energia elétrica.',
      good: { label: 'Instalar painéis solares e turbinas eólicas', short: 'Energia solar e eólica', fx: { carbon: -14, air: 10, pollution: -4 }, msg: 'Energia do sol e do vento, sem fumaça.' },
      bad: { label: 'Ligar usinas a carvão', short: 'Usinas a carvão', fx: { carbon: 18, air: -14, pollution: 8 }, msg: 'As luzes voltam, mas o céu escurece.' } },
    { tag: 'ÁGUA', title: 'Água envenenada', text: 'Agrotóxicos estão contaminando a água do subsolo.',
      good: { label: 'Incentivar a agricultura orgânica', short: 'Agricultura orgânica', fx: { water: 16, green: 8, tree: 6 }, msg: 'O solo se recupera e a água fica mais pura.' },
      bad: { label: 'Aumentar o uso de pesticidas', short: 'Mais pesticidas', fx: { water: -18, green: -6, tree: -6 }, msg: 'A contaminação chega às raízes da Árvore Líquida.' } },
    { tag: 'CIDADE', title: 'Áreas verdes sumindo', text: 'As praças da cidade estão virando estacionamentos.',
      good: { label: 'Criar parques e telhados verdes', short: 'Parques e telhados verdes', fx: { green: 18, air: 8 }, msg: 'O verde volta a tomar conta da cidade.' },
      bad: { label: 'Construir mais estacionamentos', short: 'Mais estacionamentos', fx: { green: -16, air: -6, carbon: 6 }, msg: 'Concreto no lugar das árvores.' } },
    { tag: 'FUMAÇA', title: 'Queimadas', text: 'Queimadas estão enchendo o céu de fumaça.',
      good: { label: 'Enviar brigadas e fiscalizar', short: 'Combate às queimadas', fx: { air: 16, green: 8, carbon: -8 }, msg: 'O fogo é controlado e o céu se abre.' },
      bad: { label: 'Deixar o fogo abrir espaço para plantações', short: 'Deixar queimar', fx: { air: -18, green: -12, carbon: 12 }, msg: 'Uma cortina de fumaça cobre tudo.' } },
    { tag: 'RECURSOS', title: 'Desperdício', text: 'Água e recursos naturais estão sendo desperdiçados sem controle.',
      good: { label: 'Adotar reúso de água e economia circular', short: 'Economia circular', fx: { water: 12, pollution: -8, tree: 6 }, msg: 'Cada recurso ganha uma segunda vida.' },
      bad: { label: 'Consumir sem limites', short: 'Consumo sem limites', fx: { water: -12, pollution: 10, tree: -6 }, msg: 'As reservas naturais começam a secar.' } },
    { tag: 'NASCENTES', title: 'Nascentes secando', text: 'As nascentes que alimentam a Árvore Líquida estão secando.',
      good: { label: 'Reflorestar as margens das nascentes', short: 'Nascentes reflorestadas', fx: { water: 12, green: 10, tree: 12 }, msg: 'A água volta a brotar e a Árvore Líquida pulsa mais forte.' },
      bad: { label: 'Usar toda a água para irrigação intensiva', short: 'Irrigação intensiva', fx: { water: -14, tree: -14 }, msg: 'A Árvore Líquida perde força.' } },
    { tag: 'MINERAÇÃO', title: 'Mineradora no rio', text: 'Uma mineradora quer explorar a região às margens do rio.',
      good: { label: 'Negar a licença e proteger o rio', short: 'Rio protegido', fx: { water: 10, green: 8, pollution: -4 }, msg: 'O rio segue livre e cheio de vida.' },
      bad: { label: 'Liberar a mineração', short: 'Mineração liberada', fx: { water: -16, green: -8, pollution: 10 }, msg: 'Lama e rejeitos descem pelo rio.' } }
  ];

  var START = { air: 50, water: 48, green: 45, carbon: 55, pollution: 55, tree: 62 };
  var PLAN = ['w1', 'dec', 'w2', 'dec', 'w3', 'dec', 'w4', 'boss'];
  var COMBAT_STATES = ['intro', 'prewave', 'wave', 'clear', 'preboss', 'boss'];
  var ENEMY_STATES = ['prewave', 'wave', 'clear', 'preboss', 'boss', 'ending', 'dying'];

  /* ======================================================================
     2. UTILIDADES
     ====================================================================== */

  function hs(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function hex(h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  function mix(a, b, t) {
    t = clamp(t, 0, 1);
    var A = hex(a), B = hex(b), s = '#', i, v;
    for (i = 0; i < 3; i++) { v = Math.round(A[i] + (B[i] - A[i]) * t); s += (v < 16 ? '0' : '') + v.toString(16); }
    return s;
  }

  /* ======================================================================
     3. JOGO
     ====================================================================== */

  function Game(el, opts) {
    this.host = el;
    this.opts = opts || {};
    this.villain = !!(opts && opts.villain);
    this.destroyed = false;
    var saved = null;
    try { saved = localStorage.getItem('bf_char'); } catch (err) {}
    this.charId = CHARS[charIndex((opts && opts.character) || saved || 'boy')].id;
    this.kIdx = 0; this.kT = 0; this.kReady = false; this.kSeq = []; this.secret = null;
    this.charGroup = groupOf(this.charId); this.charPage = 0;
    this._build();
    this._initWorldLayout();
    this.reset(true);
    this.setState('menu');
    this._loop = this._frame.bind(this);
    this.raf = requestAnimationFrame(this._loop);
    if (this.opts.autoStart) this.startGame();
  }

  /* ---------------- montagem, canvas, eventos ---------------- */

  Game.prototype._build = function () {
    var self = this;
    var cv = document.createElement('canvas');
    cv.setAttribute('tabindex', '0');
    cv.setAttribute('role', 'application');
    cv.setAttribute('aria-label', 'BioPulse, jogo da Árvore Líquida');
    cv.style.display = 'block';
    cv.style.width = '100%';
    cv.style.height = 'auto';
    cv.style.maxWidth = '100%';
    cv.style.margin = '0 auto';
    cv.style.touchAction = 'none';
    cv.style.outline = 'none';
    cv.style.background = '#060b14';
    cv.style.imageRendering = '-webkit-optimize-contrast';   // Safari antigo
    cv.style.imageRendering = 'pixelated';
    cv.style.cursor = 'default';
    this.canvas = cv;
    this.host.appendChild(cv);
    this.ctx = cv.getContext('2d');

    this.scale = 1;
    this.focused = false;
    this.pointer = { x: -1, y: -1, down: false };
    this.buttons = [];
    this.touchBtns = [];
    this.hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this._onResize = function () { self._resize(); };
    this._onKeyDown = function (e) { self._keydown(e); };
    this._onPointerDown = function (e) { self._pointer(e, 'down'); };
    this._onPointerMove = function (e) { self._pointer(e, 'move'); };
    this._onPointerUp = function (e) { self._pointer(e, 'up'); };
    this._onDocDown = function (e) { if (e.target !== cv) self.focused = false; };
    this._onFocus = function () { self.focused = true; };
    this._onBlur = function () { self.focused = false; };
    this._onVisible = function () {
      if (document.hidden) self._autoPause(true); else self._autoPause(false);
    };

    cv.addEventListener('pointerdown', this._onPointerDown);
    cv.addEventListener('pointermove', this._onPointerMove);
    cv.addEventListener('pointerup', this._onPointerUp);
    cv.addEventListener('pointercancel', this._onPointerUp);
    cv.addEventListener('focus', this._onFocus);
    cv.addEventListener('blur', this._onBlur);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('resize', this._onResize);
    document.addEventListener('pointerdown', this._onDocDown, true);
    document.addEventListener('visibilitychange', this._onVisible);

    if (typeof IntersectionObserver === 'function') {
      this.io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) self._autoPause(entries[i].intersectionRatio < 0.35);
      }, { threshold: [0, 0.35, 1] });
      this.io.observe(cv);
    }
    if (typeof ResizeObserver === 'function') {
      this.ro = new ResizeObserver(function () { self._resize(); });
      this.ro.observe(this.host);
    }
    this._resize();
  };

  Game.prototype._resize = function () {
    if (this.destroyed) return;
    var box = this.host.getBoundingClientRect();
    var cssW = Math.max(160, box.width || this.host.clientWidth || UW);
    var dpr = window.devicePixelRatio || 1;
    var k = (cssW * dpr) / UW;
    if (k >= 2) k = Math.floor(k);
    k = Math.max(0.5, Math.min(k, 6));
    this.scale = k;
    this.canvas.width = Math.round(UW * k);
    this.canvas.height = Math.round(UH * k);
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.aspectRatio = '16 / 9';
    if (this.ctx) this.ctx.imageSmoothingEnabled = false;
  };

  Game.prototype._autoPause = function (on) {
    if (this.destroyed) return;
    if (on) {
      if (!this.paused) { this.paused = true; this.autoPaused = true; this._syncPauseUI(); }
    } else if (this.autoPaused) {
      this.paused = false; this.autoPaused = false; this._syncPauseUI();
    }
  };

  Game.prototype._syncPauseUI = function () {
    // a tela de pausa é desenhada a partir de this.paused; nada a fazer além disso
  };

  Game.prototype.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerUp);
    this.canvas.removeEventListener('focus', this._onFocus);
    this.canvas.removeEventListener('blur', this._onBlur);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('pointerdown', this._onDocDown, true);
    document.removeEventListener('visibilitychange', this._onVisible);
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    if (this.ac && this.ac.close) { try { this.ac.close(); } catch (e) {} }
    this.ac = null;
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null; this.ctx = null;
  };

  /* ---------------- áudio sintetizado ---------------- */

  Game.prototype._audio = function () {
    if (this.muted || this.destroyed) return null;
    if (!this.ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        this.ac = new AC();
        this.master = this.ac.createGain();
        this.master.gain.value = 0.3;
        this.master.connect(this.ac.destination);
      } catch (e) { this.ac = null; return null; }
    }
    if (this.ac.state === 'suspended') { try { this.ac.resume(); } catch (e) {} }
    return this.ac;
  };

  Game.prototype._tone = function (f, dur, type, vol, f2, delay) {
    var ac = this._audio(); if (!ac) return;
    var t = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.03);
  };

  Game.prototype._noise = function (dur, vol, hp, delay) {
    var ac = this._audio(); if (!ac) return;
    if (!this.noiseBuf) {
      this.noiseBuf = ac.createBuffer(1, (ac.sampleRate * 0.6) | 0, ac.sampleRate);
      var d = this.noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var t = ac.currentTime + (delay || 0);
    var s = ac.createBufferSource(); s.buffer = this.noiseBuf;
    var f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
    var g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 0.03);
  };

  Game.prototype.sfx = function (id) {
    if (this.muted) return;
    var T = this._tone.bind(this), N = this._noise.bind(this), i;
    switch (id) {
      case 'whiff': N(0.07, 0.12, 2600); break;
      case 'hit': N(0.07, 0.32, 600); T(190, 0.08, 'square', 0.2, 90); break;
      case 'kill': T(520, 0.07, 'square', 0.12, 780); T(880, 0.09, 'triangle', 0.13, 1150, 0.05); break;
      case 'hurt': T(230, 0.25, 'sawtooth', 0.22, 70); N(0.15, 0.2, 300); break;
      case 'bubble': T(300, 0.22, 'sine', 0.26, 900); break;
      case 'tree': T(170, 0.3, 'triangle', 0.26, 80); break;
      case 'reflect': T(700, 0.08, 'square', 0.14, 1400); T(1400, 0.12, 'triangle', 0.13, 1800, 0.05); break;
      case 'shoot': T(140, 0.12, 'square', 0.14, 70); break;
      case 'stagger': T(200, 0.2, 'square', 0.16, 90); N(0.15, 0.18, 400); break;
      case 'teleport': T(900, 0.2, 'sine', 0.2, 300); break;
      case 'good': [523, 659, 784, 1047].forEach(function (f, k) { T(f, 0.18, 'triangle', 0.15, 0, k * 0.08); }); break;
      case 'bad': [311, 277, 233].forEach(function (f, k) { T(f, 0.25, 'sawtooth', 0.11, 0, k * 0.12); }); break;
      case 'wave': T(392, 0.12, 'square', 0.14); T(523, 0.2, 'square', 0.14, 0, 0.1); break;
      case 'warn': T(880, 0.07, 'square', 0.13); T(880, 0.07, 'square', 0.13, 0, 0.13); break;
      case 'boss': T(90, 0.8, 'sawtooth', 0.28, 45); N(0.6, 0.2, 200); break;
      case 'boom': N(0.9, 0.4, 100); T(120, 0.9, 'sawtooth', 0.28, 30); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach(function (f, k) { T(f, 0.3, 'triangle', 0.15, 0, k * 0.11); }); break;
      case 'lose': [392, 330, 262, 196].forEach(function (f, k) { T(f, 0.35, 'triangle', 0.15, 0, k * 0.18); }); break;
      case 'click': T(660, 0.05, 'square', 0.09); break;
    }
  };

  /* ---------------- estado do mundo ---------------- */

  Game.prototype.reset = function (full) {
    this.world = { air: START.air, water: START.water, green: START.green, carbon: START.carbon, pollution: START.pollution, tree: START.tree };
    this.stats = { kills: 0, hits: 0, passes: 0, combo: 0, maxCombo: 0, choices: [], bossWin: false };
    this.hero = { hp: 100, face: 1, act: '', dir: 1, actT: 0, cd: 0, dodge: 0, dodgeCd: 0, hurt: 0, inv: 0, win: false, down: false };
    this.enemies = [];
    this.queue = [];
    this.boss = null;
    this.fx = [];
    this.bgFx = [];
    this.texts = [];
    this.planIdx = -1;
    this.curPip = -1;
    this.waveT = 0;
    this.speedMult = 1;
    this.cap = 3;
    this.waveActive = false;
    this.shake = 0;
    this.flash = 0;
    this.hitstop = 0;
    this.slow = 1;
    this.paused = false;
    this.autoPaused = false;
    this.pendingWave = 1;
    this.curEvent = null;
    this.conseq = null;
    this.banner = null;
    this.result = null;
    this.overSub = '';
    this.sabT = 9;
    this.netDown = 0;
    this.events = shuffle(EVENTS.slice());
    if (full) {
      this.time = 0;
      this.muted = !!this.opts.muted;
      this.visRate = 1.2;
      this.vis = { sky: 0.5, water: 0.5, green: 0.45, ind: 0.55, tree: 0.62 };
      this._snapVis();
    } else {
      this.visRate = 1.2;
    }
    this._lastReport = null;
    this._report();
  };

  Game.prototype.eco = function () {
    var w = this.world;
    return (w.air + w.water + w.green + (100 - w.carbon) + (100 - w.pollution)) / 5;
  };

  // Ameaça (0-1): define o quanto as próximas ondas ficam mais pesadas.
  Game.prototype.threat = function () {
    var w = this.world;
    return clamp((w.pollution * 0.4 + w.carbon * 0.2 + (100 - w.green) * 0.2 + (100 - w.tree) * 0.2) / 100, 0, 1);
  };

  Game.prototype.nudge = function (k, v) {
    this.world[k] = clamp(this.world[k] + v, 0, 100);
    this._report();
  };

  Game.prototype.applyFx = function (fx) {
    for (var k in fx) if (this.world.hasOwnProperty(k)) {
      var v = fx[k];
      if (this.villain) {   // VilãoIA: efeitos bons valem menos, efeitos ruins valem mais
        var good = (k === 'carbon' || k === 'pollution') ? v < 0 : v > 0;
        v = Math.round(v * (good ? 0.6 : 1.4));
      }
      this.world[k] = clamp(this.world[k] + v, 0, 100);
    }
    this._report();
  };

  Game.prototype._report = function () {
    if (!this.opts.onState) return;
    var e = this.eco();
    var phase = e >= 65 ? 'ok' : (e >= 45 ? 'risk' : 'bad');
    var s = { health: Math.round(this.world.tree), pollution: Math.round(this.world.pollution), phase: phase, villain: !!this.villain };
    var key = s.health + '|' + s.pollution + '|' + s.phase + '|' + s.villain;
    if (key === this._lastReport) return;
    this._lastReport = key;
    try { this.opts.onState(s); } catch (err) {}
  };

  Game.prototype._end = function (won) {
    if (!this.opts.onEnd) return;
    try { this.opts.onEnd({ won: !!won, hp: Math.round(this.hero.hp), tree: Math.round(this.world.tree), villain: !!this.villain, kills: this.stats.kills, hits: this.stats.hits, maxCombo: this.stats.maxCombo, bossWin: !!this.stats.bossWin }); } catch (err) {}
  };

  /* ---------------- cenário: layout fixo ---------------- */

  Game.prototype._initWorldLayout = function () {
    var seed = 11;
    function srnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var i, x;
    this.mtnFar = []; this.mtnNear = [];
    for (x = 0; x <= W; x++) {
      this.mtnFar.push(64 + Math.sin(x * 0.021) * 14 + Math.sin(x * 0.057 + 1) * 7 + Math.sin(x * 0.13) * 2);
      this.mtnNear.push(98 + Math.sin(x * 0.03 + 2) * 9 + Math.sin(x * 0.08) * 5);
    }
    this.slots = [];
    for (i = 0; i < 15; i++) {
      this.slots.push({ x: (10 + i * 21 + srnd() * 8) | 0, facTh: 0.3 + srnd() * 0.6, treeTh: 0.12 + srnd() * 0.7,
        h: (20 + srnd() * 24) | 0, w: (14 + srnd() * 8) | 0, kind: srnd() < 0.5 ? 0 : 1, fac: 0, grow: 0, cx: -1, cy: 0 });
    }
    this.clouds = [];
    for (i = 0; i < 7; i++) this.clouds.push({ x: srnd() * W, y: 12 + srnd() * 36, s: 5 + srnd() * 7, v: 3 + srnd() * 4 });
    var FL = ['#ffe066', '#ff8fab', '#ffffff', '#b28dff'];
    var JK = ['#c9c9c9', '#d05a4a', '#4a6ad0', '#e0d060', '#8a8a8a'];
    this.flowers = []; this.junk = []; this.riverJunk = [];
    for (i = 0; i < 26; i++) {
      this.flowers.push({ x: (srnd() * W) | 0, th: 0.3 + srnd() * 0.65, c: FL[(srnd() * 4) | 0] });
      this.junk.push({ x: (srnd() * W) | 0, th: 0.35 + srnd() * 0.6, w: 2 + ((srnd() * 3) | 0), c: JK[(srnd() * 5) | 0] });
    }
    for (i = 0; i < 9; i++) {
      this.riverJunk.push({ x: srnd() * W, y: (srnd() * 10) | 0, v: (srnd() < 0.5 ? -1 : 1) * (3 + srnd() * 5),
        th: 0.2 + srnd() * 0.4, w: 3 + ((srnd() * 3) | 0), c: JK[(srnd() * 5) | 0], oil: srnd() < 0.35 });
    }
    this.blobs = [[0, -6, 20, 0], [0, 8, 14, 0.05], [-20, 2, 14, 0.15], [20, 2, 14, 0.15], [-12, -14, 13, 0.25],
      [12, -14, 13, 0.25], [0, -22, 12, 0.35], [-24, -6, 10, 0.45], [24, -6, 10, 0.45], [-31, 10, 9, 0.55], [31, 10, 9, 0.55]];
    this.branches = [[GY - 40, -1, 18], [GY - 46, 1, 20], [GY - 56, -1, 14], [GY - 60, 1, 12]];
  };

  Game.prototype._targets = function () {
    var w = this.world;
    return { sky: (w.air + 100 - w.carbon) / 200, water: w.water / 100, green: w.green / 100, ind: w.pollution / 100, tree: w.tree / 100 };
  };

  Game.prototype._snapVis = function () {
    var t = this._targets(), k, s, i;
    for (k in t) this.vis[k] = t[k];
    for (i = 0; i < this.slots.length; i++) {
      s = this.slots[i];
      s.fac = this.vis.ind > s.facTh ? 1 : 0;
      s.grow = (s.fac < 0.4 && this.vis.green > s.treeTh) ? 1 : 0;
    }
  };

  /* ---------------- partículas ---------------- */

  Game.prototype.addP = function (arr, x, y, vx, vy, life, s, c, g, grow) {
    if (arr.length > 700) return;
    arr.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, s: s, c: c, g: g || 0, grow: grow || 0 });
  };

  Game.prototype.burst = function (x, y, c, n, sp, g) {
    sp = sp === undefined ? 70 : sp;
    g = g === undefined ? 160 : g;
    for (var i = 0; i < (n || 10); i++) this.addP(this.fx, x, y, rnd(-sp, sp), rnd(-sp * 1.1, sp * 0.3), rnd(0.3, 0.6), rnd(2, 3), c, g);
  };

  Game.prototype.popText = function (s, x, y, c) {
    this.texts.push({ s: s, x: x, y: y, c: c, life: 0.9, max: 0.9 });
  };

  /* ---------------- fluxo da partida ---------------- */

  Game.prototype.setState = function (s) { this.state = s; this.stateT = 0; };
  Game.prototype.combatActive = function () { return COMBAT_STATES.indexOf(this.state) >= 0 && !this.paused; };

  Game.prototype.showBanner = function (t, sub, dur) {
    this.banner = { t: t, sub: sub || '', life: dur || 1.6, max: dur || 1.6 };
  };

  Game.prototype.startGame = function () {
    this.reset(false);
    this.hero.hp = 100;
    this._audio();
    this.showBanner('PROTEJA A ÁRVORE LÍQUIDA', 'A poluição está chegando', 2.4);
    this.setState('intro');
    if (this.opts.onStart) { try { this.opts.onStart(); } catch (err) {} }
  };

  Game.prototype.goMenu = function () {
    this.reset(false);
    this.setState('menu');
  };

  Game.prototype.advance = function () {
    this.planIdx++;
    var s = PLAN[this.planIdx];
    if (!s) return;
    if (s.charAt(0) === 'w') {
      this.pendingWave = parseInt(s.substr(1), 10);
      this.curPip = this.pendingWave - 1;
      this.showBanner('ONDA ' + this.pendingWave, WAVES[this.pendingWave - 1].sub, 1.6);
      this.sfx('wave');
      this.setState('prewave');
    } else if (s === 'dec') {
      this.showDecision();
    } else if (s === 'boss') {
      this.curPip = 4;
      this.showBanner('FASE FINAL', 'O Sr. Fuligem chegou no seu Titã', 2.2);
      this.sfx('boss');
      this.setState('preboss');
    }
  };

  Game.prototype.startWave = function (n) {
    var def = WAVES[n - 1], th = this.threat(), i, j, k;
    var count = Math.round(def.count * (0.85 + th * 0.4));
    this.speedMult = def.speed * (0.9 + th * 0.25);
    this.cap = def.cap + (th > 0.65 ? 1 : 0);
    var bag = [];
    for (k in def.mix) for (i = 0; i < def.mix[k]; i++) bag.push(k);
    this.queue = [];
    var tt = 0.8;
    for (i = 0; i < count; i++) {
      var kind = pick(bag);
      var side = Math.random() < 0.5 ? -1 : 1;
      if (n === 1 && i < 4) side = i % 2 === 0 ? -1 : 1;   // tutorial: lados alternados
      this.queue.push({ t: tt, type: kind, side: side });
      if (Math.random() < def.pairs) this.queue.push({ t: tt + 0.05, type: pick(['trash', 'smog', 'bottle']), side: -side });
      if (Math.random() < def.volley) for (j = 0; j < 3; j++) this.queue.push({ t: tt + 0.45 + j * 0.38, type: 'bottle', side: j % 2 === 0 ? side : -side });
      tt += rnd(def.gap[0], def.gap[1]) / (0.85 + th * 0.35);
    }
    this.queue.sort(function (a, b) { return a.t - b.t; });
    this.waveT = 0;
    this.waveActive = true;
    this.setState('wave');
  };

  Game.prototype.onWaveClear = function () {
    var heal = Math.round(10 + this.eco() / 100 * 14);
    this.hero.hp = Math.min(100, this.hero.hp + heal);
    this.nudge('pollution', -2);
    this.showBanner('ONDA LIMPA!', '+' + heal + ' de energia para o herói', 1.7);
    this.sfx('good');
    this.setState('clear');
  };

  Game.prototype.showDecision = function () {
    if (!this.events.length) this.events = shuffle(EVENTS.slice());
    var ev = this.events.pop();
    var good = JSON.parse(JSON.stringify(ev.good)); good.good = true;
    var bad = JSON.parse(JSON.stringify(ev.bad)); bad.good = false;
    var opts = Math.random() < 0.5 ? [good, bad] : [bad, good];
    this.curEvent = { tag: ev.tag, title: ev.title, text: ev.text, options: opts, picked: -1 };
    this.sfx('warn');
    this.setState('decision');
  };

  Game.prototype.choose = function (i) {
    if (this.state !== 'decision' || this.stateT < 0.45) return;
    var opt = this.curEvent.options[i];
    this.curEvent.picked = i;
    this.applyFx(opt.fx);
    if (this.villain) this.hero.hp = Math.max(1, this.hero.hp - 8);
    var chips = [], k, v, positive;
    for (k in opt.fx) {
      v = opt.fx[k];
      positive = (k === 'carbon' || k === 'pollution') ? v < 0 : v > 0;
      chips.push({ text: FX_LABEL[k] + (v > 0 ? ' +' : ' -'), kind: positive ? 'good' : 'bad' });
    }
    if (this.villain) chips.push({ text: 'VILÃOIA: HERÓI -8', kind: 'bad' });
    if (opt.good) {
      chips.push({ text: 'PRÓXIMA ONDA MAIS FRACA', kind: 'info' });
      this.sfx('good');
      for (var p = 0; p < 60; p++) this.addP(this.fx, rnd(0, W), rnd(140, 180), rnd(-10, 10), rnd(-60, -25), rnd(1.2, 2.2), 2, pick(['#8ff0ff', '#4ee39a', '#c8fbd9', '#ffffff']), -6);
    } else {
      this.hero.hp = Math.min(100, this.hero.hp + 20);
      chips.push({ text: 'HERÓI +20', kind: 'hero' });
      chips.push({ text: 'PRÓXIMA ONDA MAIS FORTE', kind: 'bad' });
      this.sfx('bad');
      for (var q = 0; q < 40; q++) this.addP(this.fx, rnd(0, W), rnd(130, 160), rnd(-8, 8), rnd(-30, -10), rnd(1.5, 2.5), 4, pick(['#5a5650', '#6e6a60', '#48443e']), 0, 6);
    }
    this.stats.choices.push({ label: opt.short, good: opt.good });
    this.conseq = { msg: opt.msg, chips: chips };
    this.visRate = 1.6;
    this.setState('conseq');
  };

  Game.prototype.startBoss = function () {
    var th = this.threat();
    this.speedMult = 0.95 + th * 0.25;
    this.boss = { x: 372, y: GY, side: 1, hw: 30, maxHp: Math.round(14 + th * 8), hp: 0, mode: 'enter',
      t: 0, flash: 0, kv: 0, shots: 0, hitsCharge: 0, hittable: false, phase: 1 };
    this.boss.hp = this.boss.maxHp;
    this.setState('boss');
  };

  Game.prototype.bossDefeated = function () {
    var self = this;
    this.boss.mode = 'dead';
    this.boss.hittable = false;
    this.boss.t = 0;
    this.slow = 0.3;
    this.shake = 8;
    this.sfx('boom');
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.dead) { e.dead = true; this.burst(e.x, this.ecy(e), ENEMIES[e.type].color, 8); }
    }
    this.queue = [];
    this.waveActive = false;
    this.applyFx({ pollution: -12, carbon: -6, air: 4, tree: 6 });
    this.stats.bossWin = true;
    this.hero.win = true;
    this.showBanner('POLUIÇÃO DERROTADA!', 'A Árvore Líquida pulsa de novo', 2.6);
    this.setState('ending');
  };

  Game.prototype.gameOver = function (cause) {
    if (this.state === 'dying' || this.state === 'over') return;
    this.hero.down = true;
    this.hero.downAt = this.time;
    this.hero.dodge = 0;
    this.shake = 8;
    this.sfx('lose');
    this.overSub = cause === 'tree' ? 'A Árvore Líquida secou. A poluição tomou conta.' : 'Você não conseguiu proteger o planeta.';
    this.setState('dying');
  };

  /* prévia da cena de vitória (painel ADM): não registra pontuação nem conquistas */
  Game.prototype.previewVictory = function (id) {
    var o = this.opts, sv = { s: o.onStart, e: o.onEnd };
    o.onStart = null; o.onEnd = null;
    this.startGame();
    this.showResult();
    this.result.char = id;
    o.onStart = sv.s; o.onEnd = sv.e;
  };

  /* prévia das poses de esquiva, dano e derrota (painel ADM) */
  Game.prototype.previewPoses = function (id) {
    var o = this.opts, sv = { s: o.onStart, e: o.onEnd };
    o.onStart = null; o.onEnd = null;
    this.startGame();
    o.onStart = sv.s; o.onEnd = sv.e;
    this.pp = { id: id };
    this.setState('poseprev');
  };

  Game.prototype.drawPosePrev = function () {
    var g = this.ctx, t = this.stateT, k = (t % 9.2), kind = k < 3.2 ? 'dodge' : (k < 5.6 ? 'hurt' : 'down'), nm = ['ESQUIVA', 'DANO', 'DERROTA'][k < 3.2 ? 0 : (k < 5.6 ? 1 : 2)];
    this.banner = null; g.fillStyle = 'rgba(4,10,20,0.78)'; g.fillRect(0, 0, UW, UH);
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 300, UW, UH - 300);
    this.drawPreview(this.pp.id, 160, 150, kind, 2.2);
    this.txt(nm, UW / 2, 40, 30, '#ffffff', { outline: 7 });
    this.txt(CHARS[charIndex(this.pp.id)].name, UW / 2, 74, 16, '#7dff3a', { outline: 5 });
    this.txt('toque ou ENTER para sair', UW / 2, UH - 18, 11, '#ffffff', { weight: '400', outline: 3 });
  };

  Game.prototype.showResult = function () {
    var w = this.world, s = this.stats;
    var e = this.eco();
    var perf = s.kills / Math.max(1, s.kills + s.hits + s.passes) * 100;
    var score = Math.round(clamp(e * 0.75 + perf * 0.25, 0, 100));
    var rank = score >= 80 ? 'Guardião da Árvore Líquida' : (score >= 65 ? 'Protetor ambiental' : (score >= 45 ? 'Aprendiz do equilíbrio' : 'Planeta em alerta'));
    var msg = score >= 65 ? 'Você ajudou a restaurar o equilíbrio do planeta.'
      : (score >= 45 ? 'O planeta resistiu, mas o equilíbrio ainda é frágil.' : 'A poluição avançou. A Árvore Líquida precisa de mais proteção.');
    this.result = {
      score: score, shown: 0, rank: rank, msg: msg,
      treeLabel: w.tree >= 65 ? 'saudável' : (w.tree >= 40 ? 'em recuperação' : 'ameaçada'),
      polLabel: w.pollution <= 35 ? 'controlada' : (w.pollution <= 60 ? 'moderada' : 'crítica'),
      bars: [['Ar', (w.air + 100 - w.carbon) / 2, '#bfe9ff'], ['Água', w.water, AQUA], ['Verde', w.green, LEAF], ['Árvore', w.tree, '#8ff0ff']],
      choices: s.choices.slice(), kills: s.kills, maxCombo: s.maxCombo,
      char: this.charId, tp: this.charId === 'gois' ? 10.2 : ((this.charId === 'matheus' || this.charId === 'kauan' || this.charId === 'felipe') ? 7.4 : (this.charId === 'boy' ? 7.8 : 6.2)), snd: false
    };
    this.sfx('good');
    this.setState('result');
    this._end(true);
  };

  /* ---------------- combate ---------------- */

  Game.prototype.ecy = function (e) {
    var d = ENEMIES[e.type];
    return (d.top || d.y < 0) ? e.y : e.y - 12;
  };

  Game.prototype.edist = function (e) { return Math.abs(e.x - CX) - e.hw; };

  Game.prototype.spawn = function (type, side, x, y) {
    var d = ENEMIES[type];
    var e = { type: type, side: side, hp: d.hp, hw: d.hw, dmg: d.dmg, speed: d.speed * this.speedMult,
      isTop: !!d.top, t: Math.random() * 9, flash: 0, kv: 0, dead: false, reflected: false,
      mode: 'move', modeT: 0, shots: 0, teleported: false, fire: 1.9 / Math.max(0.5, this.speedMult) };
    if (d.top) { e.x = CX + rnd(-4, 4); e.y = -14; }
    else { e.x = x === undefined || x === null ? (side < 0 ? -26 : W + 26) : x; e.y = y === undefined || y === null ? GY + d.y : y; }
    this.enemies.push(e);
    return e;
  };

  Game.prototype.attack = function (dir) {
    var h = this.hero;
    if (!this.combatActive() || h.down || h.cd > 0 || h.dodge > 0) return;
    h.act = dir === 0 ? 'up' : 'punch';
    h.dir = dir;
    h.actT = 0.16;
    if (dir) h.face = dir;
    var best = null, bd = 1e9, i, e, dd;
    for (i = 0; i < this.enemies.length; i++) {
      e = this.enemies[i];
      if (e.dead) continue;
      if (dir === 0) {
        if (e.isTop && e.y > GY - 128) { dd = (GY - 70) - e.y; if (dd < bd) { bd = dd; best = e; } }
      } else if (!e.isTop && !e.reflected && (e.x - CX) * dir > 0) {
        dd = this.edist(e);
        if (dd <= REACH && dd < bd) { bd = dd; best = e; }
      }
    }
    var b = this.boss;
    if (dir !== 0 && b && b.hittable && (b.x - CX) * dir > 0) {
      var db = Math.abs(b.x - CX) - b.hw;
      if (db <= REACH && db < bd) { this.hitBoss(true); h.cd = 0.09; return; }
    }
    if (best) { this.hitEnemy(best); h.cd = 0.08; }
    else { h.cd = 0.26; this.sfx('whiff'); }
  };

  Game.prototype.dodge = function () {
    var h = this.hero;
    if (this.villain && this.netDown > 0 && this.combatActive() && !h.down) {   // FALHA NA REDE
      this.popText('SEM REDE', CX, GY - 70, '#ff9aa5');
      return;
    }
    if (!this.combatActive() || h.down || h.dodge > 0 || h.dodgeCd > 0) return;
    h.dodge = 0.42;
    h.dodgeCd = 0.8;
    this.sfx('bubble');
  };

  Game.prototype.addCombo = function () {
    var s = this.stats;
    s.combo++;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    if (s.combo >= 5 && s.combo % 5 === 0) this.popText('COMBO x' + s.combo, CX, GY - 92, GOLD);
  };

  Game.prototype.hitEnemy = function (e) {
    this.hitstop = 0.045;
    this.shake = Math.max(this.shake, 2);
    if (e.type === 'sludge') {          // rebater o lodo: volta purificado
      e.reflected = true;
      e.speed = 170;
      e.kv = 0;
      e.flash = 0.08;
      this.addCombo();
      this.sfx('reflect');
      this.burst(e.x, e.y, '#8ff0ff', 8, 60, 0);
      return;
    }
    this.sfx('hit');
    this.damageEnemy(e, true);
  };

  Game.prototype.damageEnemy = function (e, knock) {
    e.hp--;
    e.flash = 0.1;
    var cy = this.ecy(e), i;
    for (i = 0; i < 5; i++) this.addP(this.fx, e.x, cy, rnd(-50, 50), rnd(-50, 30), 0.2, 2, '#ffffff');
    if (e.hp <= 0) {
      e.dead = true;
      this.addCombo();
      this.stats.kills++;
      this.nudge('pollution', -0.15);
      this.burst(e.x, cy, ENEMIES[e.type].color, 10);
      for (i = 0; i < 3; i++) this.addP(this.fx, e.x + rnd(-6, 6), cy, rnd(-8, 8), rnd(-45, -25), 1.3, 2, '#8ff0ff', -12);
      this.sfx('kill');
    } else if (knock) {
      if (e.isTop) e.kv = -170; else e.kv = e.side * 200;
    }
  };

  Game.prototype.hitBoss = function (knock) {
    var b = this.boss;
    if (!b || b.mode === 'dead') return;
    b.hp--;
    b.flash = 0.1;
    if (knock) { b.kv = b.side * 230; b.hitsCharge++; }
    this.addCombo();
    this.hitstop = 0.06;
    this.shake = Math.max(this.shake, 3);
    this.sfx('hit');
    var sx = b.side < 0 ? 1 : -1;
    this.burst(b.x + sx * 24, GY - 36, '#9aa0ad', 8);
    if (b.phase === 1 && b.hp <= b.maxHp / 2) {
      b.phase = 2;
      this.showBanner('O SR. FULIGEM ENFURECEU!', 'Ataques mais rápidos', 1.6);
      this.sfx('boss');
    }
    if (b.hp <= 0) this.bossDefeated();
  };

  Game.prototype.treeHit = function (n) {
    this.nudge('tree', -n);
    this.nudge('pollution', 1);
    this.stats.passes++;
    this.sfx('tree');
    this.burst(CX, GY - 84, '#8a7a55', 8, 50);
    this.popText('-' + n, CX + rnd(-10, 10), GY - 108, '#ff9aa5');
  };

  Game.prototype.contact = function (e) {
    if (e.dead) return;
    e.dead = true;
    if (e.reflected || this.state === 'dying') return;
    if (this.hero.dodge > 0) this.treeHit(3);
    else this.damageHero(e.dmg, e.x, this.ecy(e));
  };

  Game.prototype.damageHero = function (n, x, y) {
    var h = this.hero;
    if (h.inv > 0 || this.state === 'dying') return;
    h.hp = Math.max(0, h.hp - n);
    h.hurt = 0.35;
    h.inv = 0.5;
    this.shake = 5;
    this.flash = 0.25;
    this.stats.hits++;
    this.stats.combo = 0;
    this.sfx('hurt');
    this.burst(x === undefined ? CX : x, y === undefined ? GY - 34 : y, '#ff6a7a', 10);
    if (h.hp <= 0) this.gameOver('hero');
  };

  /* ---------------- atualização ---------------- */

  Game.prototype._frame = function (now) {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this._loop);
    if (!this.last) this.last = now;
    var real = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    var dt = this.paused ? 0 : real;
    if (!this.paused) this.slow += (1 - this.slow) * Math.min(1, real * 1.5);
    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.08; }
    dt *= this.slow;
    this.update(dt);
    this.render();
  };

  /* ---------------- VilãoIA: tecnologia sem ética ---------------- */

  var VILLAIN_QUOTE = 'Resultado imediato detectado. Consequência ambiental ignorada.';

  var SABOTAGES = [
    { name: 'INJEÇÃO DE SUPER-ALGAS', run: function (g) { g.nudge('water', -6); g.nudge('pollution', 6); g._more('trash', 2, 0.4); } },
    { name: 'DESCARTE ILEGAL', run: function (g) { g.nudge('pollution', 10); g.nudge('air', -4); g._more('trash', 3, 0.35); } },
    { name: 'FALHA NA REDE', run: function (g) { g.netDown = 6; } },
    { name: 'SOBRECARGA DO REATOR', run: function (g) { g.hero.hp = Math.max(1, g.hero.hp - 12); g.flash = 0.3; g.shake = 6; } },
    { name: 'CRESCIMENTO DESCONTROLADO', run: function (g) { g.nudge('green', -5); g.nudge('tree', -3); g._more('bottle', 4, 0.35); } }
  ];

  Game.prototype.setVillain = function (on) {
    on = !!on;
    if (on === this.villain) return;
    this.villain = on;
    this.sabT = 9;
    this.netDown = 0;
    this._lastReport = null;
    this._report();
    this.showBanner('VILÃOIA // ' + (on ? 'ON' : 'OFF'), on ? 'Consequência ambiental ignorada' : 'Sistema estabilizado', 2);
    this.sfx(on ? 'bad' : 'good');
  };

  Game.prototype.villainTick = function (dt) {
    if (this.netDown > 0) this.netDown = Math.max(0, this.netDown - dt);
    if (this.state !== 'wave' && this.state !== 'boss') return;
    this.sabT -= dt;
    if (this.sabT > 0) return;
    this.sabT = rnd(9, 14);
    var s = pick(SABOTAGES);
    s.run(this);
    this.showBanner(s.name, 'SABOTAGEM DA VILÃOIA', 1.9);
    this.sfx('warn');
    this.sfx('bad');
    this.shake = Math.max(this.shake, 4);
    this.flash = Math.max(this.flash, 0.2);
    if (this.opts.onSabotage) { try { this.opts.onSabotage({ name: s.name }); } catch (err) {} }
  };

  // acrescenta inimigos à onda atual (só durante ondas normais)
  Game.prototype._more = function (type, n, gap) {
    if (this.state !== 'wave' || !this.waveActive) return;
    for (var i = 0; i < n; i++) this.queue.push({ t: this.waveT + 0.3 + i * gap, type: type, side: Math.random() < 0.5 ? -1 : 1 });
    this.queue.sort(function (a, b) { return a.t - b.t; });
  };

  Game.prototype.drawVillain = function () {
    var g = this.ctx, t = this.time, st = this.state, m = 6, L = 18;
    g.fillStyle = 'rgba(255,30,80,0.08)';
    g.fillRect(0, 0, UW, UH);
    if (!this._vigR) {
      var gr = g.createRadialGradient(UW / 2, UH / 2, UH * 0.3, UW / 2, UH / 2, UH * 0.95);
      gr.addColorStop(0, 'rgba(255,0,60,0)'); gr.addColorStop(1, 'rgba(255,0,60,0.32)');
      this._vigR = gr;
    }
    g.fillStyle = this._vigR;
    g.fillRect(0, 0, UW, UH);
    g.fillStyle = 'rgba(255,90,110,0.12)';
    g.fillRect(0, (t * 70) % UH, UW, 3);
    if (((t * 8) | 0) % 29 === 0) { g.fillStyle = 'rgba(255,60,80,0.2)'; g.fillRect(0, (t * 397) % UH, UW, 9); }
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5);
    g.fillStyle = '#ff3b5c';
    [[m, m, 1, 1], [UW - m, m, -1, 1], [m, UH - m, 1, -1], [UW - m, UH - m, -1, -1]].forEach(function (c) {
      g.fillRect(c[2] > 0 ? c[0] : c[0] - L, c[3] > 0 ? c[1] : c[1] - 2, L, 2);
      g.fillRect(c[2] > 0 ? c[0] : c[0] - 2, c[3] > 0 ? c[1] : c[1] - L, 2, L);
    });
    g.globalAlpha = 1;
    if (st === 'menu' || st === 'howto') return;
    // o olho da VilãoIA vigia a partida
    var ex = UW - 50, ey = 38, open = ((t * 0.9) % 3) < 0.15 ? 2 : 10, px = Math.round(Math.sin(t * 1.7) * 5), cy = ey + 7 - open / 2;
    g.fillStyle = '#12060a'; g.fillRect(ex, ey, 32, 14);
    g.fillStyle = '#ff2f55'; g.fillRect(ex + 2, cy, 28, open);
    g.fillStyle = '#12060a'; g.fillRect(ex + 13 + px, cy, 6, open);
    g.fillStyle = '#ffd0d8'; g.fillRect(ex + 14 + px, cy, 2, Math.min(2, open));
    this.txt('VILÃOIA', ex + 16, ey + 22, 8, '#ff8a97', { outline: 3 });
    if (this.netDown > 0) this.txt('REDE OFF ' + Math.ceil(this.netDown) + 's', 16, 42, 10, GOLD, { align: 'left', outline: 4 });
    // terminal da VilãoIA
    g.fillStyle = 'rgba(20,4,10,0.78)';
    g.fillRect(0, UH - 13, UW, 13);
    g.fillStyle = '#ff3b5c';
    g.fillRect(0, UH - 13, UW, 1);
    var n = Math.min(VILLAIN_QUOTE.length, ((t % 11) * 22) | 0);
    this.txt('> ' + VILLAIN_QUOTE.substr(0, n) + (((t * 3) | 0) % 2 ? '_' : ''), 8, UH - 6, 9, '#ff8a97', { align: 'left' });
  };

  Game.prototype.update = function (dt) {
    this.time += dt;
    this.stateT += dt;
    this.updateWorldVis(dt);
    this.updateHero(dt);
    this.updateParticles(dt);
    if (this.villain && dt > 0) this.villainTick(dt);

    switch (this.state) {
      case 'intro': if (this.stateT > 2.6) this.advance(); break;
      case 'prewave': if (this.stateT > 1.5) this.startWave(this.pendingWave); break;
      case 'clear': if (this.stateT > 1.9) this.advance(); break;
      case 'conseq': if (this.stateT > 3.6) { this.conseq = null; this.advance(); } break;
      case 'preboss': if (this.stateT > 2.3) this.startBoss(); break;
      case 'ending': if (this.stateT > 3.2) this.showResult(); break;
      case 'dying':
        if (this.stateT > 1.5) { this.setState('over'); this._end(false); }
        break;
    }
    if (ENEMY_STATES.indexOf(this.state) >= 0) {
      this.updateEnemies(dt);
      if (this.boss) this.updateBoss(dt);
    }
    if ((COMBAT_STATES.indexOf(this.state) >= 0 || this.state === 'conseq') && this.world.tree <= 0) this.gameOver('tree');

    if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }
    if (this.result && this.state === 'result' && this.stateT >= this.result.tp) {
      if (!this.result.snd) { this.result.snd = true; this.sfx(this.result.score >= 50 ? 'win' : 'lose'); }
      if (this.result.shown < this.result.score) this.result.shown = Math.min(this.result.score, this.result.shown + dt * 90);
    }
    this.shake = Math.max(0, this.shake - dt * 22);
    this.flash = Math.max(0, this.flash - dt * 1.6);
  };

  Game.prototype.updateHero = function (dt) {
    var h = this.hero;
    h.cd = Math.max(0, h.cd - dt);
    h.actT = Math.max(0, h.actT - dt);
    h.dodge = Math.max(0, h.dodge - dt);
    h.dodgeCd = Math.max(0, h.dodgeCd - dt);
    h.hurt = Math.max(0, h.hurt - dt);
    h.inv = Math.max(0, h.inv - dt);
  };

  Game.prototype.updateWorldVis = function (dt) {
    var t = this._targets(), k, i, s;
    for (k in t) this.vis[k] += (t[k] - this.vis[k]) * Math.min(1, dt * this.visRate);
    if (this.visRate > 1.2) this.visRate = Math.max(1.2, this.visRate - dt * 0.15);
    for (i = 0; i < this.slots.length; i++) {
      s = this.slots[i];
      s.fac += ((this.vis.ind > s.facTh ? 1 : 0) - s.fac) * Math.min(1, dt * 1.6);
      s.grow += (((s.fac < 0.4 && this.vis.green > s.treeTh) ? 1 : 0) - s.grow) * Math.min(1, dt * 1.6);
      if (s.fac > 0.85 && s.cx >= 0 && Math.random() < dt * 1.8) {
        this.addP(this.bgFx, s.cx, s.cy, rnd(2, 8), rnd(-14, -8), 2, 3, pick(['#5c5a58', '#6e6a64', '#4e4c4a']), 0, 5);
      }
    }
    for (i = 0; i < this.clouds.length; i++) {
      this.clouds[i].x += this.clouds[i].v * dt;
      if (this.clouds[i].x > W + 30) this.clouds[i].x = -30;
    }
    this.ambient(dt);
  };

  Game.prototype.ambient = function (dt) {
    var hc = this.vis.tree;
    if (Math.random() < dt * hc * 7) this.addP(this.fx, CX + rnd(-34, 34), GY - rnd(60, 110), rnd(-4, 4), rnd(-14, -6), rnd(1, 1.8), 1, pick(['#bff6ff', '#8ff0ff', '#ffffff']));
    if (hc < 0.45 && Math.random() < dt * 3) this.addP(this.fx, CX + rnd(-24, 24), GY - rnd(70, 95), 0, 10, 1.2, 2, '#4a4632', 60);
    if (Math.random() < dt * this.vis.green * 1.4) this.addP(this.fx, rnd(0, W), GY - rnd(4, 34), rnd(-4, 4), rnd(-5, 1), rnd(1.6, 3), 1, pick(['#fff6a8', '#ffffff', '#c8ffb0']));
    if (Math.random() < dt * this.vis.green * 2.5) this.addP(this.fx, rnd(0, W), -4, rnd(6, 16), rnd(10, 16), rnd(5, 8), 2, pick(['#6be38a', '#4ee39a', '#b8f5c2']));
    if (Math.random() < dt * this.vis.ind * 9) this.addP(this.fx, rnd(0, W), -4, rnd(-3, 3), rnd(10, 22), rnd(4, 7), 1, pick(['#8a8478', '#6e695f', '#a39d90']));
    if (this.vis.water > 0.62 && Math.random() < dt * 0.35) {
      var fx = rnd(30, W - 30);
      for (var i = 0; i < 5; i++) this.addP(this.fx, fx + i * 2, GY + 14, rnd(-6, 6), rnd(-30, -20), 0.5, 1, '#e8fbff', 90);
    }
  };

  Game.prototype.updateParticles = function (dt) {
    var arrs = [this.fx, this.bgFx], a, i, j, p;
    for (j = 0; j < 2; j++) {
      a = arrs[j];
      for (i = a.length - 1; i >= 0; i--) {
        p = a[i];
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.s += p.grow * dt;
        if (p.life <= 0) a.splice(i, 1);
      }
    }
    for (i = this.texts.length - 1; i >= 0; i--) {
      this.texts[i].life -= dt;
      this.texts[i].y -= 18 * dt;
      if (this.texts[i].life <= 0) this.texts.splice(i, 1);
    }
  };

  Game.prototype.updateEnemies = function (dt) {
    var i, e;
    if (this.waveActive) {
      var live = 0;
      for (i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) live++;
      if (live < this.cap) this.waveT += dt;      // segura a fila quando a tela está cheia
      while (this.queue.length && this.queue[0].t <= this.waveT) {
        var q = this.queue.shift();
        this.spawn(q.type, q.side);
      }
    }
    for (i = 0; i < this.enemies.length; i++) {
      e = this.enemies[i];
      if (e.dead) continue;
      this.stepEnemy(e, dt);
    }
    for (i = this.enemies.length - 1; i >= 0; i--) {
      e = this.enemies[i];
      if (e.dead || e.x < -90 || e.x > W + 90 || e.y > H + 40) this.enemies.splice(i, 1);
    }
    if (this.waveActive && !this.queue.length && !this.enemies.length) {
      this.waveActive = false;
      if (this.state === 'wave') this.onWaveClear();
    }
  };

  Game.prototype.moveEnemy = function (e, dt, spd) {
    var d = e.reflected ? e.side : -e.side;
    e.x += (d * spd + e.kv) * dt;
    e.kv *= Math.exp(-9 * dt);
  };

  Game.prototype.stepEnemy = function (e, dt) {
    e.t += dt;
    e.modeT += dt;
    e.flash = Math.max(0, e.flash - dt);
    var d = ENEMIES[e.type];

    if (e.isTop) {
      e.y += (e.speed + e.kv) * dt;
      e.kv *= Math.exp(-6 * dt);
      if (e.y >= GY - 70) this.contact(e);
      return;
    }
    if (e.type === 'drone') {
      if (e.mode === 'move') {
        this.moveEnemy(e, dt, e.speed);
        if (Math.abs(e.x - CX) <= 96) { e.mode = 'hover'; e.modeT = 0; }
      } else if (e.mode === 'hover') {
        e.x += e.kv * dt; e.kv *= Math.exp(-9 * dt);
        e.y = GY + d.y + Math.sin(e.t * 3) * 3;
        if (e.modeT >= e.fire) {
          e.modeT = 0; e.shots++;
          this.spawn('sludge', e.side, e.x - e.side * 14, e.y + 4);
          this.sfx('shoot');
          if (e.shots >= 3) e.mode = 'dive';
        }
      } else {
        e.y += (GY - 42 - e.y) * Math.min(1, dt * 3);
        this.moveEnemy(e, dt, e.speed * 1.8);
      }
    } else if (e.type === 'mist') {
      if (e.mode === 'move') {
        this.moveEnemy(e, dt, e.speed);
        if (!e.teleported && Math.abs(e.x - CX) <= 78) { e.mode = 'blink'; e.modeT = 0; }
      } else if (e.mode === 'blink' && e.modeT > 0.35) {
        this.burst(e.x, e.y, '#8e6cb8', 10, 50, 0);
        e.side = -e.side;
        e.x = CX + e.side * 78;
        e.teleported = true;
        e.speed *= 1.35;
        e.mode = 'move';
        this.sfx('teleport');
        this.burst(e.x, e.y, '#b89be0', 10, 50, 0);
      }
    } else {
      this.moveEnemy(e, dt, e.speed);
    }
    this.enemyTrail(e, dt);

    if (e.reflected) { this.checkReflect(e); return; }
    if (e.x < -80 || e.x > W + 80) { e.dead = true; return; }
    if (this.edist(e) <= 6) this.contact(e);
  };

  Game.prototype.enemyTrail = function (e, dt) {
    if (e.type === 'car' && Math.random() < dt * 12) this.addP(this.fx, e.x + e.side * 21, GY - 6, e.side * rnd(5, 15), rnd(-10, -3), 0.9, 3, '#6b665c', 0, 5);
    else if (e.type === 'smog' && Math.random() < dt * 6) this.addP(this.fx, e.x + e.side * 12, e.y + rnd(-4, 4), e.side * 8, rnd(-4, 4), 0.7, 3, '#7c7e88', 0, 3);
    else if (e.type === 'barrel' && Math.random() < dt * 5) this.addP(this.fx, e.x, GY - 2, 0, 0, 0.8, 2, '#8cf03c');
    else if (e.type === 'mist' && Math.random() < dt * 8) this.addP(this.fx, e.x + rnd(-8, 8), e.y + rnd(-6, 6), 0, -6, 0.6, 2, '#9cf06a');
    else if (e.type === 'drone' && Math.random() < dt * 5) this.addP(this.fx, e.x - 4 * (e.side < 0 ? 1 : -1), e.y - 8, 0, -12, 0.8, 3, '#55595f', 0, 4);
  };

  // O lodo rebatido acerta o primeiro inimigo (ou o chefe) no caminho.
  Game.prototype.checkReflect = function (e) {
    var i, o;
    for (i = 0; i < this.enemies.length; i++) {
      o = this.enemies[i];
      if (o === e || o.dead || o.isTop || o.reflected || o.type === 'sludge') continue;
      if (Math.abs(o.x - e.x) < o.hw + 4 && Math.abs(this.ecy(o) - e.y) < 24) {
        e.dead = true;
        this.sfx('hit');
        this.burst(e.x, e.y, '#8ff0ff', 8, 60);
        this.damageEnemy(o, true);
        return;
      }
    }
    var b = this.boss;
    if (b && b.mode !== 'dead' && Math.abs(b.x - e.x) < b.hw) {
      e.dead = true;
      this.burst(e.x, e.y, '#8ff0ff', 10, 60);
      this.hitBoss(false);
      return;
    }
    if (e.x < -40 || e.x > W + 40) e.dead = true;
  };

  Game.prototype.updateBoss = function (dt) {
    var b = this.boss;
    if (!b) return;
    b.t += dt;
    b.flash = Math.max(0, b.flash - dt);
    var enr = b.phase === 2;
    var sx = b.side < 0 ? 1 : -1;
    var homeX = b.side < 0 ? 44 : W - 44;
    if (b.mode !== 'dead' && Math.random() < dt * (enr ? 9 : 5)) {
      this.addP(this.bgFx, b.x - sx * 23 + rnd(-2, 2), GY - 86, rnd(-6, 6), rnd(-24, -12), 1.4, 4, enr ? '#7a3a2a' : '#555a60', 0, 6);
    }
    switch (b.mode) {
      case 'enter':
        b.hittable = false;
        b.x += (homeX - b.x) * Math.min(1, dt * 2.5);
        if (Math.abs(b.x - homeX) < 1.5) {
          b.t = 0; b.shots = 0;
          if (enr && Math.random() < 0.45) { b.mode = 'windup'; this.sfx('warn'); }
          else b.mode = 'shoot';
        }
        break;
      case 'shoot':
        var n = enr ? 5 : 3, gap = enr ? 0.55 : 0.85;
        if (b.shots < n && b.t > 0.6 + b.shots * gap) {
          this.spawn('sludge', b.side, b.x - b.side * 34, GY - 40 + (enr ? rnd(-8, 8) : 0));
          b.shots++;
          this.sfx('shoot');
          if (b.shots === 2 && Math.random() < 0.7) this.spawn('oil', 1);
          if (enr && b.shots === 4) this.spawn(pick(['trash', 'bottle', 'smog']), -b.side);
        }
        if (b.t > 0.6 + n * gap + 0.4) { b.mode = 'windup'; b.t = 0; this.sfx('warn'); }
        break;
      case 'windup':
        if (b.t > (enr ? 0.5 : 0.75)) { b.mode = 'charge'; b.t = 0; b.hitsCharge = 0; }
        break;
      case 'charge':
        b.hittable = true;
        b.x += (-b.side * (enr ? 140 : 108) + b.kv) * dt;
        b.kv *= Math.exp(-8 * dt);
        if (b.hitsCharge >= (enr ? 4 : 3)) {
          b.mode = 'retreat'; b.t = 0; b.kv = b.side * 300; this.sfx('stagger');
        } else if (Math.abs(b.x - CX) - b.hw <= 6) {
          if (this.hero.dodge > 0) this.treeHit(8);
          else this.damageHero(18, CX + b.side * 14, GY - 34);
          b.mode = 'retreat'; b.t = 0; b.kv = b.side * 260;
        }
        break;
      case 'retreat':
        b.hittable = b.t < 0.35;
        b.x += (b.side * 150 + b.kv) * dt;
        b.kv *= Math.exp(-6 * dt);
        if (b.x < -60 || b.x > W + 60) {
          if (Math.random() < 0.6) b.side = -b.side;
          b.x = b.side < 0 ? -60 : W + 60;
          b.mode = 'enter'; b.t = 0;
        }
        break;
      case 'dead':
        if (b.t < 1.6 && Math.random() < dt * 14) {
          this.burst(b.x + rnd(-26, 26), GY - rnd(10, 70), pick([GOLD, '#ff8a5b', '#8a8c96']), 6, 80);
        }
        break;
    }
  };

  /* ======================================================================
     4. DESENHO — utilidades de pixel art
     ====================================================================== */

  Game.prototype.R = function (x, y, w, h, c) {
    var g = this.ctx;
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  Game.prototype.disc = function (cx, cy, r, c) {
    if (r <= 0) return;
    var g = this.ctx, ri = Math.ceil(r), dy, w;
    g.fillStyle = c;
    for (dy = -ri; dy <= ri; dy++) {
      w = Math.sqrt(Math.max(0, r * r - dy * dy));
      if (w < 0.5) continue;
      g.fillRect(Math.round(cx - w), Math.round(cy + dy), Math.round(w * 2), 1);
    }
  };

  // parts/details: [x, y, w, h, cor] em "unidades" (1 unidade = 2 px do mundo)
  Game.prototype.sprite = function (x, y, sx, parts, details, flash, alpha) {
    var g = this.ctx, i, p;
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.scale(2 * sx, 2);
    if (alpha !== undefined && alpha < 1) g.globalAlpha = alpha;
    g.fillStyle = OUT;
    for (i = 0; i < parts.length; i++) { p = parts[i]; g.fillRect(p[0] - 0.5, p[1] - 0.5, p[2] + 1, p[3] + 1); }
    for (i = 0; i < parts.length; i++) { p = parts[i]; g.fillStyle = flash ? '#ffffff' : p[4]; g.fillRect(p[0], p[1], p[2], p[3]); }
    if (!flash && details) for (i = 0; i < details.length; i++) { p = details[i]; g.fillStyle = p[4]; g.fillRect(p[0], p[1], p[2], p[3]); }
    g.restore();
  };

  Game.prototype.wtext = function (s, x, y, c, size) {
    var g = this.ctx;
    size = size || 8;
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.scale(0.5, 0.5);
    g.font = '700 ' + (size * 2) + 'px ' + MONO;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 6;
    g.strokeStyle = OUT;
    g.strokeText(s, 0, 0);
    g.fillStyle = c;
    g.fillText(s, 0, 0);
    g.restore();
  };

  /* ---------------- cenário ---------------- */

  /* camada em cache: só é redesenhada quando a chave muda (o cenário muda devagar) */
  Game.prototype.layer = function (name, key, fn) {
    var L = this._lc || (this._lc = {}), o = L[name];
    if (!o) { var cv = document.createElement('canvas'); cv.width = W; cv.height = H; o = L[name] = { cv: cv, key: null }; }
    if (o.key !== key) {
      var c = o.cv.getContext('2d'), sv = this.ctx;
      c.clearRect(0, 0, W, H);
      this.ctx = c;
      try { fn.call(this); } finally { this.ctx = sv; }
      o.key = key;
    }
    this.ctx.drawImage(o.cv, 0, 0);
  };

  Game.prototype.drawSky = function () {
    var s = this.vis.sky, g = this.ctx, t = this.time, i, ang;
    this.layer('sky', Math.round(s * 60), function () {
      var cg = this.ctx, y, k, c1, c2, x;
      function col(kk) { return mix(mix('#35363f', '#a08a68', kk), mix('#2e7ed8', '#b5f0ff', kk), s); }
      for (y = 0; y < GY; y += 4) {
        k = y / GY;
        this.R(0, y, W, 4, col(k));
        c2 = col((y + 4) / GY);
        for (x = (y >> 2) & 1; x < W; x += 2) this.R(x, y + 3, 1, 1, c2);
      }
      if (s < 0.5) {                                          // estrelas no céu escuro
        cg.globalAlpha = Math.min(1, (0.5 - s) * 2.2);
        for (i = 0; i < 46; i++) {
          x = hs(i + 1) * W; y = hs(i + 77) * 62;
          this.R(x, y, 1, 1, '#ffffff');
          if (i % 7 === 0) { this.R(x - 1, y, 3, 1, '#dfe8ff'); this.R(x, y - 1, 1, 3, '#dfe8ff'); }
        }
        cg.globalAlpha = 1;
      }
      cg.globalAlpha = 0.22;                                   // neblina no horizonte
      this.R(0, 70, W, 8, mix('#8a8478', '#e9fbff', s));
      cg.globalAlpha = 0.16;
      this.R(0, 62, W, 8, mix('#8a8478', '#e9fbff', s));
      cg.globalAlpha = 1;
    });
    if (s > 0.5) {                                             // raios de sol
      g.save();
      g.globalAlpha = 0.07 * (s - 0.5) * 2;
      g.fillStyle = '#fffbd0';
      for (i = 0; i < 5; i++) {
        ang = 0.5 + i * 0.24 + Math.sin(t * 0.35 + i) * 0.03;
        g.beginPath();
        g.moveTo(62, 36);
        g.lineTo(62 + Math.cos(ang) * 320, 36 + Math.sin(ang) * 320);
        g.lineTo(62 + Math.cos(ang + 0.08) * 320, 36 + Math.sin(ang + 0.08) * 320);
        g.closePath();
        g.fill();
      }
      g.restore();
    }
    g.globalAlpha = 0.12 + s * 0.3;
    this.disc(62, 36, 19 + Math.sin(t * 1.6) * 0.7, '#fff3c4');
    g.globalAlpha = 1;
    this.disc(62, 36, 10, mix('#b09062', '#fff6c9', s));
    this.R(57, 31, 4, 3, mix('#c2a578', '#ffffff', s));
  };

  Game.prototype.drawClouds = function () {
    var s = this.vis.sky, c = mix('#6e6658', '#ffffff', s), c2 = mix('#5a5348', '#d3f1ff', s), i, k, g = this.ctx;
    for (i = 0; i < this.clouds.length; i++) {
      k = this.clouds[i];
      this.disc(k.x, k.y + 2, k.s, c2);
      this.disc(k.x + k.s * 0.9, k.y + 3, k.s * 0.75, c2);
      this.disc(k.x - k.s * 0.9, k.y + 3, k.s * 0.7, c2);
      this.disc(k.x, k.y, k.s * 0.85, c);
      this.disc(k.x + k.s * 0.8, k.y + 2, k.s * 0.55, c);
      this.disc(k.x - k.s * 0.8, k.y + 2, k.s * 0.5, c);
    }
    if (s > 0.55) {                                            // bando de pássaros
      var t = this.time, n, bx, by, fr;
      for (n = 0; n < 5; n++) {
        bx = ((t * 11 + n * 29) % (W + 60)) - 30;
        by = 26 + n * 6 + Math.sin(t * 1.3 + n) * 3 + (n % 2) * 8;
        fr = (((t * 5 + n) | 0) % 2);
        g.globalAlpha = Math.min(1, (s - 0.55) * 4);
        if (fr) { this.R(bx - 3, by, 2, 1, '#26344f'); this.R(bx - 1, by + 1, 2, 1, '#26344f'); this.R(bx + 1, by, 2, 1, '#26344f'); }
        else { this.R(bx - 3, by + 1, 2, 1, '#26344f'); this.R(bx - 1, by, 2, 1, '#26344f'); this.R(bx + 1, by + 1, 2, 1, '#26344f'); }
        g.globalAlpha = 1;
      }
    }
    if (s < 0.55) {
      g.globalAlpha = (0.55 - s) * 1.2;
      this.R(0, 0, W, 24, '#4a443a');
      g.globalAlpha *= 0.5;
      this.R(0, 24, W, 12, '#4a443a');
      g.globalAlpha = 1;
    }
  };

  Game.prototype.drawMountains = function () {
    var sk = this.vis.sky, gr = this.vis.green;
    this.layer('mtn', Math.round(sk * 30) + '_' + Math.round(gr * 30), function () {
      var cg = this.ctx, x, y, yy, n, hh, k;
      var far2 = mix('#625c54', '#a9cde6', sk), far2L = mix('#77706a', '#cfeaf8', sk);
      var far = mix('#5d5850', '#5b9fc4', sk), farL = mix('#6d685e', '#9ad8ee', sk), farD = mix('#514c45', '#4a88ad', sk);
      var near = mix('#4e4a3c', '#35925f', gr), nearL = mix('#615b48', '#5ccc84', gr), nearD = mix('#3f3b30', '#27774b', gr);
      var pine = mix('#38352a', '#1d6a40', gr), pineL = mix('#4a4636', '#2b8a55', gr);
      for (x = 0; x < W; x++) {                                // serra bem ao fundo, esmaecida
        y = (54 + Math.sin(x * 0.017 + 3) * 12 + Math.sin(x * 0.05) * 5) | 0;
        this.R(x, y, 1, 40, far2); this.R(x, y, 1, 1, far2L);
      }
      for (x = 0; x < W; x++) {                                // serra do meio, com encosta iluminada
        y = this.mtnFar[x] | 0;
        this.R(x, y, 1, GY - y, far); this.R(x, y, 1, 1, farL);
        if (x > 0 && this.mtnFar[x - 1] > this.mtnFar[x]) { this.R(x, y + 1, 1, 3, farL); }
        for (yy = y + 8; yy < y + 40; yy += 6) if (hs(x * 0.37 + yy) > 0.5) this.R(x, yy, 1, 1, farD);
        if (y < 52) { this.R(x, y, 1, 3, '#ffffff'); this.R(x, y + 3, 1, 1, '#d7ecf8'); }   // picos com neve
      }
      cg.globalAlpha = 0.28;                                   // névoa entre as camadas
      this.R(0, 76, W, 16, mix('#8a8478', '#e9fbff', sk));
      cg.globalAlpha = 1;
      for (x = 0; x < W; x++) {                                // serra da frente, com textura e pinheiros
        y = this.mtnNear[x] | 0;
        this.R(x, y, 1, GY - y, near); this.R(x, y, 1, 1, nearL);
        if (x > 0 && this.mtnNear[x - 1] > this.mtnNear[x]) this.R(x, y + 1, 1, 2, nearL);
        for (yy = y + 5; yy < y + 40; yy += 4) if (hs(x * 0.71 + yy * 1.3) > 0.62) this.R(x, yy, 1 + ((hs(x + yy) * 2) | 0), 1, nearD);
      }
      for (x = 2; x < W; x += 3) {
        if (hs(x * 1.7) < 0.42) continue;
        y = this.mtnNear[x] | 0; hh = 4 + ((hs(x * 3.1) * 5) | 0);
        for (k = 0; k < hh; k++) { n = ((hh - k) / 3) | 0; this.R(x - n, y - k + 1, n * 2 + 1, 1, k % 2 ? pine : pineL); }
        this.R(x, y + 1, 1, 2, '#3a2a1c');
      }
    });
  };

  /* colina do meio: preenche o espaço entre as montanhas e o chão */
  Game.prototype.drawMeadow = function () {
    var gr = this.vis.green;
    this.layer('meadow', Math.round(gr * 30), function () {
      var x, y, yy, i, a = mix('#6a6845', '#58c466', gr), b = mix('#5a5838', '#46ad58', gr), c = mix('#4a4a30', '#2f8f45', gr),
          hl = mix('#837f58', '#86e08a', gr);
      for (x = 0; x < W; x++) {
        y = (121 + Math.sin(x * 0.027 + 1) * 6 + Math.sin(x * 0.075) * 2.5) | 0;
        this.R(x, y, 1, GY - y, a);
        this.R(x, y, 1, 1, hl);
        this.R(x, y + 14, 1, GY - y - 14, b);
        for (yy = y + 3; yy < GY; yy += 3) if (hs(x * 0.9 + yy * 2.1) > 0.7) this.R(x, yy, 1, 2, c);
        if (hs(x * 5.3) > 0.9 && gr > 0.25) this.R(x, y + 4 + ((hs(x) * 12) | 0), 1, 1, hs(x * 2) > 0.5 ? '#ffe066' : '#ffffff');
      }
      for (i = 0; i < 9; i++) {                                 // arbustos
        x = 14 + i * 36 + ((hs(i * 9) * 14) | 0);
        y = (121 + Math.sin(x * 0.027 + 1) * 6 + Math.sin(x * 0.075) * 2.5 + 6) | 0;
        this.disc(x, y, 5, mix('#3e3c28', '#1f7a3c', gr)); this.disc(x - 1, y - 1, 4, mix('#55523a', '#2f9a4e', gr));
        this.disc(x - 2, y - 2, 2, mix('#6d6a4a', '#58c870', gr));
      }
      for (x = 6; x < W; x += 10) {                             // cerca de madeira
        if (hs(x * 0.3) < 0.55) continue;
        y = (121 + Math.sin(x * 0.027 + 1) * 6 + Math.sin(x * 0.075) * 2.5 + 14) | 0;
        this.R(x, y, 1, 5, '#5a3d2a'); this.R(x - 1, y + 1, 4, 1, '#7a5638');
      }
    });
  };

  Game.prototype.drawSlots = function () {
    var leaf = mix('#6b6a3a', '#2fae5c', this.vis.green), leafL = mix('#8a8a55', '#6be38a', this.vis.green),
        leafD = mix('#4a4a2a', '#1f7a44', this.vis.green), i, s, e, h, x, y, wx, wy, ch, chx, g, tr, r, hh, k, ww;
    for (i = 0; i < this.slots.length; i++) {
      s = this.slots[i];
      if (s.fac > 0.02) {
        e = 1 - (1 - s.fac) * (1 - s.fac);
        h = Math.round(s.h * e);
        x = s.x - (s.w >> 1);
        y = GY - h;
        this.R(x, y, s.w, h, '#3a3d47');
        this.R(x, y, s.w, 2, '#2a2c34');
        this.R(x + s.w - 1, y, 1, h, '#2a2c34');
        for (wy = y + 4; wy < GY - 3; wy += 5) {
          for (wx = x + 2; wx < x + s.w - 3; wx += 4) {
            this.R(wx, wy, 2, 2, ((wx * 7 + wy * 3) % 5 === 0) ? '#ffcf5a' : '#26282f');
          }
        }
        ch = Math.round(14 * e);
        chx = x + s.w - 5;
        this.R(chx - 1, y - ch, 5, 1, '#2a2c34');
        this.R(chx, y - ch + 1, 3, ch - 1, '#555965');
        this.R(chx, y - ch + 3, 3, 1, '#a3473c');
        this.R(chx, y - ch + 7, 3, 1, '#a3473c');
        s.cx = chx + 1; s.cy = y - ch;
      }
      if (s.grow > 0.02) {
        g = 1 - (1 - s.grow) * (1 - s.grow);
        if (s.kind === 0) {
          tr = Math.round(8 * g);
          r = 6 * g + 1;
          this.R(s.x - 1, GY - tr, 2, tr, '#5a3d2a');
          this.disc(s.x, GY - tr - r * 0.6, r + 1, leafD);
          this.disc(s.x, GY - tr - r * 0.6, r, leaf);
          this.disc(s.x - r * 0.3, GY - tr - r * 0.95, r * 0.45, leafL);
        } else {
          hh = Math.round(22 * g);
          this.R(s.x - 1, GY - 4, 2, 4, '#5a3d2a');
          for (k = 0; k < hh; k++) {
            ww = Math.round((hh - k) * 0.42) + 1;
            this.R(s.x - ww, GY - 4 - k, ww * 2, 1, k % 4 === 0 ? leafD : leaf);
          }
        }
      } else if (s.fac < 0.1 && this.vis.green < s.treeTh - 0.05) {
        this.R(s.x - 2, GY - 3, 4, 3, '#4d3526');
        this.R(s.x - 2, GY - 3, 4, 1, '#6b4a34');
      }
    }
  };

  Game.prototype.drawTree = function () {
    var hc = clamp(this.vis.tree, 0, 1), t = this.time, g = this.ctx;
    var core = mix('#77714f', '#9af3ff', hc), mid = mix('#5a5739', '#36bfe9', hc),
        deep = mix('#3b3a2a', '#1672b0', hc), hi = mix('#908b6a', '#effeff', hc);
    if (hc > 0.4) {
      g.globalAlpha = (hc - 0.4) * 0.3;
      this.disc(CX, GY - 80, 56, '#7fe8ff');
      g.globalAlpha = 1;
    }
    if (hc > 0.45) {
      var ph = (t % 3) / 3;
      g.globalAlpha = (1 - ph) * 0.55 * hc;
      g.strokeStyle = '#c8f8ff';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(CX, GY - 80, 10 + ph * 80, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }
    this.R(CX - 16, GY - 3, 32, 3, deep);
    this.R(CX - 12, GY - 4, 24, 2, mid);
    this.R(CX - 20, GY - 1, 40, 1, deep);
    var top = GY - 72, y, k, w, xo;
    for (y = GY - 3; y > top; y--) {
      k = (GY - y) / 72;
      w = Math.round(12 - k * 6);
      xo = Math.sin(y * 0.11 + t * 2.2) * 1.6 * (0.4 + k);
      this.R(CX - w / 2 + xo, y, w, 1, deep);
      this.R(CX - w / 2 + 1 + xo, y, w - 2, 1, mid);
      this.R(CX - 1 + xo + Math.sin(y * 0.2 + t * 3), y, 2, 1, core);
      if (((y + t * 28) % 11 + 11) % 11 < 1.5) this.R(CX - w / 2 + 2 + xo, y, 2, 1, hi);
    }
    var droop = (1 - hc) * 0.7, i, b, s, bx, by;
    for (i = 0; i < this.branches.length; i++) {
      b = this.branches[i];
      for (s = 0; s < b[2]; s++) {
        bx = CX + b[1] * (4 + s);
        by = b[0] - s * 0.7 + droop * s + Math.sin(s * 0.3 + t * 2) * 0.8;
        this.R(bx, by, 1, s < b[2] * 0.5 ? 3 : 2, mid);
        if (s % 3 === 0) this.R(bx, by, 1, 1, core);
      }
    }
    var cy = GY - 88 + (1 - hc) * 6, shown = [], bl, ap, r, x2, y2;
    for (i = 0; i < this.blobs.length; i++) {
      bl = this.blobs[i];
      if (hc < bl[3] * 0.9) continue;
      ap = clamp((hc - bl[3] * 0.9) / 0.1, 0, 1);
      r = bl[2] * (0.55 + 0.45 * hc) * ap;
      x2 = CX + bl[0];
      y2 = cy + bl[1] + Math.sin(t * 1.5 + bl[0] * 0.2) * 1.2 + (Math.abs(bl[0]) > 15 ? (1 - hc) * 8 : 0);
      shown.push([x2, y2, r]);
    }
    for (i = 0; i < shown.length; i++) this.disc(shown[i][0], shown[i][1], shown[i][2] + 1, deep);
    for (i = 0; i < shown.length; i++) this.disc(shown[i][0], shown[i][1], shown[i][2], mid);
    for (i = 0; i < shown.length; i++) this.disc(shown[i][0] - shown[i][2] * 0.22, shown[i][1] - shown[i][2] * 0.28, shown[i][2] * 0.55, core);
    for (i = 0; i < shown.length; i++) this.disc(shown[i][0] - shown[i][2] * 0.42, shown[i][1] - shown[i][2] * 0.46, Math.max(1, shown[i][2] * 0.18), hi);
  };

  Game.prototype.drawGround = function () {
    var g = this.vis.green;
    var g1 = mix('#7c6c46', '#63d46e', g), g2 = mix('#5e5236', '#3ea556', g),
        d1 = mix('#4a3e30', '#6a4b31', g), d2 = mix('#3a3026', '#553b27', g), x, i, f, j;
    this.R(0, GY, W, 3, g1);
    this.R(0, GY + 3, W, 1, g2);
    this.R(0, GY + 4, W, 8, d1);
    for (x = 0; x < W; x += 6) this.R(x + (x * 13) % 4, GY + 6 + (x * 7) % 4, 2, 1, d2);
    for (x = 0; x < W; x += 5) {
      if ((x * 31) % 7 < 3) this.R(x, GY - 1, 1, 1, g1);
      if ((x * 17) % 11 < 2 && g > 0.35) this.R(x + 2, GY - 2, 1, 2, g2);
    }
    for (x = 0; x < W; x += 3) {                                // capim balançando
      var bh = 1 + ((hs(x * 1.9) * 3) | 0), sw = Math.round(Math.sin(this.time * 2 + x * 0.35) * (bh > 2 ? 1 : 0.5));
      this.R(x + sw, GY - bh, 1, bh, hs(x) > 0.5 ? g1 : g2);
    }
    for (i = 0; i < this.flowers.length; i++) {
      f = this.flowers[i];
      if (g > f.th) { this.R(f.x, GY - 2, 1, 2, g2); this.R(f.x, GY - 3, 1, 1, f.c); }
    }
    for (i = 0; i < this.junk.length; i++) {
      j = this.junk[i];
      if (this.vis.ind > j.th) { this.R(j.x, GY - 1, j.w, 2, j.c); this.R(j.x, GY - 1, 1, 1, '#222222'); }
    }
  };

  Game.prototype.drawRiver = function () {
    var wq = this.vis.water, y0 = GY + 12, t = this.time, g = this.ctx;
    var w1 = mix('#4d4a2a', '#2cc0ea', wq), w2 = mix('#3a3820', '#1987c4', wq), wl = mix('#6f6b40', '#b2f4ff', wq);
    this.R(0, y0, W, H - y0, w1);
    this.R(0, y0 + 8, W, H - y0 - 8, w2);
    this.R(0, y0, W, 1, wl);
    var span = W + 20, i, d, x, r, y;
    for (i = 0; i < 18; i++) {
      d = i % 2 ? 1 : -1;
      x = ((i * 47 + t * 10 * d) % span + span) % span - 10;
      this.R(x, y0 + 3 + (i % 4) * 4, 5 + (i % 3) * 2, 1, wl);
    }
    if (wq > 0.55) {
      g.globalAlpha = Math.min(1, (wq - 0.55) * 2.4);
      for (i = 0; i < 12; i++) if ((t * 3 + i * 1.7) % 3 < 0.5) this.R((i * 61 + 13) % W, y0 + 2 + (i * 5) % 15, 1, 1, '#ffffff');
      g.globalAlpha = 1;
    }
    var hc = clamp(this.vis.tree, 0, 1), yy2, ww2;                // reflexo da árvore
    g.globalAlpha = 0.28;
    for (yy2 = 1; yy2 < 15; yy2++) {
      ww2 = 14 - yy2 * 0.6;
      this.R(CX - ww2 / 2 + Math.sin(yy2 * 0.8 + t * 3) * 2, y0 + yy2, ww2, 1, mix('#6b6740', '#9af3ff', hc));
    }
    g.globalAlpha = 1;
    if (wq > 0.3) {                                              // juncos na margem
      for (i = 0; i < 22; i++) {
        x = (i * 15 + hs(i) * 9) | 0; var rh = 4 + ((hs(i * 3) * 4) | 0), rs = Math.round(Math.sin(t * 1.8 + i) * 1);
        this.R(x + rs, y0 - rh, 1, rh, mix('#5a5a38', '#3f9a4a', wq));
        if (i % 3 === 0) this.R(x + rs, y0 - rh - 2, 1, 2, '#6b4a2b');
      }
    }
    if (wq > 0.6) {                                              // vitórias-régias
      for (i = 0; i < 7; i++) {
        x = (i * 47 + 20 + Math.sin(t * 0.6 + i) * 2) | 0; y = y0 + 5 + ((hs(i * 7) * 9) | 0);
        this.R(x, y, 5, 1, '#2f9a55'); this.R(x + 1, y - 1, 3, 1, '#45c06d');
        if (i % 2 === 0) this.R(x + 2, y - 2, 1, 1, '#ff8fab');
      }
    }
    for (i = 0; i < this.riverJunk.length; i++) {
      r = this.riverJunk[i];
      if (wq >= r.th) continue;
      x = ((r.x + t * r.v) % span + span) % span - 10;
      y = y0 + 3 + r.y;
      this.R(x, y, r.w, 2, r.c);
      if (r.oil) { this.R(x - 3, y + 2, 10, 1, '#7a4ad0'); this.R(x + 1, y + 2, 4, 1, '#3ad6c5'); }
    }
  };

  /* ---------------- herói ---------------- */

  Game.prototype.drawHero = function () {
    var h = this.hero, t = this.time, P = [], D = [], g = this.ctx;
    function p(a, b, c, d, e) { P.push([a, b, c, d, e]); }
    function q(a, b, c, d, e) { D.push([a, b, c, d, e]); }
    var SUIT = '#1fa86b', SUITD = '#137a4c', SUITL = '#48d892', CAPE = '#22b8e6', CAPED = '#0f6f9e',
        CAPEL = '#9af3ff', ARMOR = '#e2f6f4', ARMORD = '#8fb8c0', GLOW = '#5fe0ff', SKIN = '#e3a47c',
        SKIND = '#c07f5c', HAIR = '#2b1d17', HAIRL = '#4a3428', MASK = '#1d8fd0', BELT = '#d9e4ea',
        BELTD = '#8fa3ad', EMB = '#f2fbff';
    var CHd = CHARS[charIndex(this.charId)], bookDodge = h.dodge > 0 && !!(CHd.look && CHd.look.dodge === 'book');
    var crouch = (h.dodge > 0 && !bookDodge) || h.down || !!h.crouchPose;
    var punch = h.actT > 0 && h.act === 'punch';
    var up = (h.actT > 0 && h.act === 'up') || h.win;
    var lx = punch ? h.dir * (this.charId === 'capy' ? 6 : 3) : 0;
    var by = crouch ? 6 : (Math.sin(t * 4) > 0.2 ? 1 : 0);
    var hy = by, i, wv, top, ln;

    this.R(CX + lx - 15, GY - 1, 30, 2, 'rgba(0,0,0,0.28)');

    if (this.charId === 'hero' || this.charId === 'heroina') {
    var FEM = this.charId === 'heroina';
    if (FEM) { HAIR = '#7a3320'; HAIRL = '#b5532f'; }
    for (i = 0; i < 11; i++) {                     // capa
      wv = Math.sin(t * 9 - i * 0.7) * 1.2;
      top = -24 + by + ((i * 0.35) | 0);
      ln = (crouch ? 12 : 20) + Math.round(wv + i * 0.3);
      p(-6 - i, top, 1, ln, CAPE);
      q(-6 - i, top + ln - 4, 1, 4, CAPED);
      if (i % 3 === 1) q(-6 - i, top + ln - 1, 1, 1, CAPEL);
    }
    p(-9, -23 + by, 3, 7, SUITD); p(-9, -16 + by, 3, 3, ARMOR); q(-9, -16 + by, 3, 1, GLOW);

    if (crouch) { p(-6, -8, 4, 4, SUITD); p(1, -8, 4, 4, SUIT); }
    else { p(-5, -12, 3, 8, SUITD); p(1, -12, 3, 8, SUIT); q(1, -10, 1, 3, SUITL); }
    p(-6, -4, 4, 4, ARMOR); p(1, -4, 4, 4, ARMOR);
    q(-6, -4, 4, 1, GLOW); q(1, -4, 4, 1, GLOW);
    q(-6, -1, 4, 1, ARMORD); q(1, -1, 4, 1, ARMORD);

    p(-5, -20 + by, 10, 6, SUIT);                  // tronco em V
    p(-7, -24 + by, 14, 4, SUIT);
    q(-6, -24 + by, 12, 1, SUITL);
    q(-5, -20 + by, 1, 6, SUITD);
    q(-1, -16 + by, 2, 1, SUITD);
    p(-5, -14 + by, 10, 2, BELT);
    q(-5, -13 + by, 10, 1, BELTD);
    q(-1, -14 + by, 2, 2, GLOW);
    q(-2, -23 + by, 5, 5, EMB);                    // emblema: gota com folha
    q(0, -22 + by, 1, 1, CAPE);
    q(-1, -21 + by, 3, 2, CAPE);
    q(-1, -21 + by, 1, 1, CAPEL);
    q(1, -23 + by, 2, 1, LEAF);
    q(2, -22 + by, 1, 1, LEAF);
    q(-7, -24 + by, 2, 2, GLOW);
    q(5, -24 + by, 2, 2, GLOW);

    if (FEM) {                                     // cabelo comprido e rabo de cavalo balançando
      var sw2 = Math.round(Math.sin(t * 6) * 1);
      p(-6, -32 + hy, 4, 11, HAIR); q(-6, -32 + hy, 1, 11, HAIRL); p(-9 - sw2, -28 + hy, 3, 9, HAIR); q(-9 - sw2, -28 + hy, 1, 9, HAIRL); p(-8, -31 + hy, 3, 2, '#ff4fa3');
    }
    p(-1, -25 + hy, 3, 1, SKIN);                   // cabeça
    p(-3, -31 + hy, 6, 6, SKIN);
    p(3, -29 + hy, 1, 2, SKIN);
    q(-3, -26 + hy, 6, 1, SKIND);
    p(-4, -33 + hy, 7, 3, HAIR);
    p(-4, -31 + hy, 2, 3, HAIR);
    p(-2, -34 + hy, 2, 1, HAIR);
    p(1, -34 + hy, 2, 1, HAIR);
    q(-2, -33 + hy, 3, 1, HAIRL);
    q(-2, -29 + hy, 5, 2, MASK);                   // máscara com fita
    q(1, -29 + hy, 1, 1, '#ffffff');
    if (FEM) { q(2, -30 + hy, 1, 1, '#14141a'); q(1, -26 + hy, 2, 1, '#e8737f'); }   // cílios e batom
    p(-5, -29 + hy, 2, 1, MASK);
    p(-7 - (((t * 6) | 0) % 2), -28 + hy, 2, 1, MASK);
    q(1, -27 + hy, 1, 1, SKIND);

    if (punch) {
      p(5, -23 + by, 10, 3, SUIT); q(12, -23 + by, 1, 3, GLOW);
      p(15, -24 + by, 5, 5, ARMOR); q(15, -20 + by, 5, 1, ARMORD); q(19, -23 + by, 1, 3, GLOW);
    } else if (up) {
      p(3, -41 + hy, 3, 18, SUIT); p(2, -46 + hy, 5, 5, ARMOR);
      q(2, -42 + hy, 5, 1, ARMORD); q(3, -41 + hy, 3, 1, GLOW);
    } else if (crouch) {
      p(4, -23 + by, 3, 4, SUIT); p(6, -22 + by, 4, 4, ARMOR); q(6, -19 + by, 4, 1, ARMORD);
    } else {
      p(5, -23 + by, 3, 5, SUIT); p(7, -20 + by, 4, 3, SUIT);
      p(10, -23 + by, 4, 4, ARMOR); q(10, -20 + by, 4, 1, ARMORD); q(9, -20 + by, 1, 3, GLOW);
    }

    } else {
      this.altParts(this.charId, p, q, { crouch: crouch, punch: punch, up: up, win: !!h.win, bookDodge: bookDodge, build: !!h.build, lego: !!h.lego, dance: !!h.dance, by: by, hy: hy, t: t });
    }

    var fl = h.hurt > 0 && (((t * 20) | 0) % 2 === 0);
    var id0 = this.charId, fc = h.face || 1;
    var DSTY = { gois: 'thunder', boy: 'dash', pedro: 'shield', matheus: 'dance', kauan: 'rod', felipe: 'leaf', capy: 'dive', hero: 'cape', heroina: 'cape' };
    var dprog = h.dodge > 0 ? clamp(1 - h.dodge / 0.42, 0, 1) : 0, hprog = h.hurt > 0 ? clamp(1 - h.hurt / 0.35, 0, 1) : 0;
    var dying = h.down && h.downAt !== undefined, dpe = dying ? clamp((t - h.downAt) / 0.45, 0, 1) : 0; dpe = 1 - Math.pow(1 - dpe, 3);
    var mode = dying ? 'down' : (h.dodge > 0 && !bookDodge ? 'dodge' : (h.hurt > 0 ? 'hurt' : ''));
    var dst = DSTY[id0] || 'bubble', rot = 0, ddx = 0, ddy = 0, dsy = 1, pvy = GY - 16, sa = Math.sin(Math.PI * (mode === 'dodge' ? dprog : hprog));
    if (mode === 'dodge') {
      if (dst === 'thunder') { rot = 0.2 * fc; pvy = GY; }
      else if (dst === 'dash') ddx = -12 * sa * fc;
      else if (dst === 'dance') ddx = Math.sin(dprog * 12.57) * 6;
      else if (dst === 'dive') ddy = 12 * sa;
    } else if (mode === 'hurt') { rot = -0.38 * sa * fc; ddx = -6 * sa * fc; pvy = GY; }
    else if (mode === 'down') { if (id0 === 'capy') { dsy = 1 - 2 * dpe; pvy = GY - 9; } else { rot = -1.4 * dpe * fc; } }
    if (mode === 'dodge' && dst === 'dash') { this.sprite(CX + lx + ddx + fc * 10, GY, h.face, P, D, false, 0.22); this.sprite(CX + lx + ddx + fc * 20, GY, h.face, P, D, false, 0.12); }
    g.save(); g.translate(CX + lx + ddx, pvy + ddy); g.rotate(rot); g.scale(1, dsy); g.translate(-(CX + lx), -pvy);
    this.sprite(CX + lx, GY, h.face, P, D, fl, dying ? 1 : (h.down ? 0.75 : 1));
    g.restore();
    if (mode) this.heroFx(mode, id0, dst, mode === 'dodge' ? dprog : hprog, fc, CX + lx + ddx, dpe, t);

    if (punch) {
      var a = h.actT / 0.16;
      g.globalAlpha = a;
      for (i = 0; i < 4; i++) {
        this.R(CX + lx + h.dir * (42 + i * 5) - (h.dir < 0 ? 4 : 0), GY - 44 + by * 2 + (i % 2) * 3, 4, 1, i % 2 ? '#ffffff' : '#8ff0ff');
      }
      g.globalAlpha = 1;
    }
    if (up && h.actT > 0) {
      g.globalAlpha = h.actT / 0.16;
      for (i = 0; i < 3; i++) this.R(CX - 4 + i * 4 + h.face, GY - 108 - i * 5, 1, 5, '#8ff0ff');
      g.globalAlpha = 1;
    }
    if (false && CHd.look && CHd.look.weapon === 'tools' && !h.dead) {   // aura de mecânico: brilho laranja, engrenagens e faíscas
      var tw = t * 3, ap = 0.5 + 0.5 * Math.sin(t * 5);
      g.globalAlpha = 0.10 + 0.07 * ap; this.disc(CX, GY - 30, 38 + ap * 3, '#ff9a2e');
      g.globalAlpha = 0.12 + 0.06 * ap; this.disc(CX, GY - 30, 26, '#ffd34d');
      g.globalAlpha = 1;
      for (i = 0; i < 4; i++) {                     // engrenagens girando em volta
        var ga = tw + i * 1.571, gx = CX + Math.cos(ga) * 30, gy = GY - 30 + Math.sin(ga) * 24, gs = (i % 2 ? 4 : 6);
        this.R(gx - 1, gy, gs + 2, gs, '#aeb6c4'); this.R(gx, gy - 1, gs, gs + 2, '#aeb6c4'); this.R(gx + 1, gy + 1, gs - 2, gs - 2, '#2a2f3a');
        if (((t * 8 + i) | 0) % 2) this.R(gx + gs / 2 - 1, gy - 2, 2, 1, '#ffd34d');
      }
      for (i = 0; i < 6; i++) {                     // faíscas subindo
        var sp = (t * 0.9 + i * 0.37) % 1;
        g.globalAlpha = 1 - sp;
        this.R(CX - 20 + ((i * 53) % 40) + Math.sin(t * 4 + i) * 3, GY - 8 - sp * 70, 2, 2, i % 2 ? '#ffd34d' : '#ff8a2e');
      }
      g.globalAlpha = 1;
      if (h.win) {                                   // parafusos e peças voando do aparelho
        for (i = 0; i < 5; i++) {
          var fp = (t * 1.4 + i * 0.2) % 1, fx2 = CX + 22 + fp * (14 + i * 6) * (i % 2 ? 1 : -0.4), fy2 = GY - 50 - Math.sin(fp * Math.PI) * 26 + fp * 22;
          this.R(fx2, fy2, 3, 3, i % 3 === 0 ? '#e0482f' : '#c0c4cc'); this.R(fx2 + 1, fy2 + 1, 1, 1, '#2a2f3a');
        }
      }
    }
    if (false && CHd.look && CHd.look.weapon === 'dj' && !h.dead) {    // aura de streamer: ondas sonoras roxas e rosas e notas
      var dp = 0.5 + 0.5 * Math.sin(t * 6);
      g.globalAlpha = 0.10 + 0.06 * dp; this.disc(CX, GY - 30, 36 + dp * 3, '#b04fff'); g.globalAlpha = 1;
      for (i = 0; i < 3; i++) { var wa = (t * 0.8 + i / 3) % 1; g.globalAlpha = (1 - wa) * 0.5; g.strokeStyle = i % 2 ? '#ff4fd8' : '#58d6ff'; g.lineWidth = 2; g.beginPath(); g.arc(CX, GY - 30, 16 + wa * 26, 0, 6.283); g.stroke(); }
      g.globalAlpha = 1;
      for (i = 0; i < 5; i++) { var nb = (t * 0.7 + i * 0.2) % 1; g.globalAlpha = 1 - nb; this.R(CX - 24 + ((i * 41) % 48), GY - 12 - nb * 64, 2, 2, i % 2 ? '#ff4fd8' : '#9a5cff'); }
      g.globalAlpha = 1;
    }
    if (h.win && CHd.look && CHd.look.weapon === 'book') {   // magia do livro: páginas girando em volta
      g.globalAlpha = 0.18;
      this.disc(CX + 6, GY - 28, 30, '#ffe9a8');
      g.globalAlpha = 1;
      for (i = 0; i < 7; i++) {
        var pa = t * 5 + i * 0.9, px2 = CX + 6 + Math.cos(pa) * 28, py2 = GY - 28 + Math.sin(pa) * 20;
        this.R(px2, py2, 4, 5, '#f6f0d8'); this.R(px2, py2 + 4, 4, 1, '#c9bf94'); this.R(px2 + 1, py2 + 1, 2, 1, '#9a9480');
      }
    }
    if (h.dodge > 0) {                              // bolha em volta, na cor de cada personagem (escudo ativado)
      var BC = { gois: ['#ffe45a', '#fff7b0'], boy: ['#cfe2ee', '#ffffff'], pedro: ['#ffd34d', '#fff0b0'], matheus: ['#ff7ae0', '#ffd0f4'], kauan: ['#4fa8ff', '#bfe0ff'], felipe: ['#7be063', '#d6ffc4'],
                 capy: ['#7fe8ff', '#c8f8ff'], hero: ['#7fe8ff', '#c8f8ff'], heroina: ['#ff9ad0', '#ffd6ec'], davi: ['#b9a0ff', '#e6dcff'] }, bc = BC[this.charId] || ['#7fe8ff', '#c8f8ff'];
      var bp = clamp(1 - h.dodge / 0.42, 0, 1), bx = CX + (this.charId === 'capy' ? 7 : 0), br = (this.charId === 'capy' ? 40 : 34) * Math.min(1, bp * 5 + 0.25) * (1 + 0.04 * Math.sin(t * 30));
      g.globalAlpha = 0.20;
      this.disc(bx, GY - 30, br, bc[0]);
      g.globalAlpha = 0.9;
      g.strokeStyle = bc[1];
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(bx, GY - 30, br, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 0.35; g.beginPath(); g.arc(bx, GY - 30, br - 3, 0.3, 1.3); g.stroke();
      g.globalAlpha = 0.8;
      this.disc(bx - 14, GY - 46, 3, '#ffffff'); this.disc(bx - 9, GY - 50, 1.5, '#ffffff');
      g.globalAlpha = 1;
    }
  };

  /* efeitos por personagem: esquiva própria, reação ao dano e derrota */
  Game.prototype.heroFx = function (mode, id, dst, pr, fc, cx, dpe, t) {
    var g = this.ctx, i, a, x, y, a2 = Math.sin(Math.PI * clamp(pr, 0, 1));
    var PAL = { gois: ['#c0c4cc', '#e0482f'], kauan: ['#ff8a2e', '#e8edf3'], felipe: ['#4fae3f', '#9be37a'], matheus: ['#ff4fd8', '#58d6ff'], pedro: ['#ffd34d', '#ffffff'],
                davi: ['#f6f0d8', '#ffe9a8'], boy: ['#7fd3ff', '#ffffff'], capy: ['#9ff0ff', '#ffffff'], hero: ['#9ff0ff', '#ffffff'], heroina: ['#ff9ad0', '#ffffff'] };
    var pc = PAL[id] || ['#ffffff', '#ffe9a8'];
    if (mode === 'dodge') {
      if (dst === 'thunder') {                      // Electric Thunder (estilo Blanka): agachado, juba de espetos e raios amarelos
        var jt2 = Math.floor(t * 24), ex = cx, ey = GY - 22, hx2 = cx + fc * 4, hy3 = GY - 36;
        g.globalAlpha = 0.10 + 0.04 * Math.sin(t * 22); this.disc(ex, ey, 40, '#ffd23a'); g.globalAlpha = 0.08; this.disc(ex, ey, 22, '#fff7b0'); g.globalAlpha = 1;
        for (i = 0; i < 9; i++) {
          var sp0 = -2.9 + i * 0.36 + Math.sin(t * 18 + i) * 0.05, sl = 17 + (i % 3) * 7 + Math.sin(t * 25 + i * 2) * 3;
          g.globalAlpha = 0.6; g.fillStyle = i % 2 ? '#ffd23a' : '#ffb020';
          g.beginPath(); g.moveTo(hx2 + Math.cos(sp0 - 0.18) * 6, hy3 + Math.sin(sp0 - 0.18) * 6); g.lineTo(hx2 + Math.cos(sp0) * sl, hy3 + Math.sin(sp0) * sl); g.lineTo(hx2 + Math.cos(sp0 + 0.18) * 6, hy3 + Math.sin(sp0 + 0.18) * 6); g.closePath(); g.fill();
        }
        g.globalAlpha = 1;
        for (i = 0; i < 12; i++) {
          var ba = i * 0.524 + jt2 * 0.37, r1 = 34 + ((i * 37 + jt2 * 11) % 26), x0 = ex + Math.cos(ba) * 8, y0 = ey + Math.sin(ba) * 10, x1 = ex + Math.cos(ba) * r1, y1 = ey + Math.sin(ba) * r1 * 0.9, pts = [[x0, y0]], j;
          for (j = 1; j < 5; j++) pts.push([x0 + (x1 - x0) * j / 5 + Math.sin((jt2 + i * 3) * 7.1 + j * 12.9) * 4, y0 + (y1 - y0) * j / 5 + Math.cos((jt2 + i * 3) * 5.3 + j * 9.7) * 4]);
          pts.push([x1, y1]);
          var cols = [['rgba(255,210,40,0.35)', 3.5], [i % 2 ? '#ffe45a' : '#fff7b0', 1.6], ['#ffffff', 0.6]], c2;
          for (c2 = 0; c2 < 3; c2++) { g.strokeStyle = cols[c2][0]; g.lineWidth = cols[c2][1]; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (j = 1; j < pts.length; j++) g.lineTo(pts[j][0], pts[j][1]); g.stroke(); }
        }
        for (i = 0; i < 8; i++) { g.globalAlpha = 1 - ((t * 1.6 + i * 0.12) % 1); this.R(cx - 30 + ((i * 17) % 60), GY - 2 - ((t * 1.6 + i * 0.12) % 1) * 14, 2, 2, i % 2 ? '#ffe45a' : '#ffffff'); }
        g.globalAlpha = 1;
      } else if (dst === 'roll') {
        for (i = 0; i < 7; i++) { a = (1 - pr) * 0.9; g.globalAlpha = a; this.R(cx - fc * (8 + i * 4) - 2, GY - 3 - ((i * 5) % 7), 3, 3, i % 2 ? '#ffd34d' : '#ff8a2e'); }
        g.globalAlpha = 0.5 * (1 - pr); this.R(cx - fc * 18 - 6, GY - 5, 12, 4, '#d6dbe4'); g.globalAlpha = 1;
      } else if (dst === 'shield') {
        g.globalAlpha = 0.95; this.disc(cx + fc * 16, GY - 22, 17, '#14181f'); this.disc(cx + fc * 16, GY - 22, 15.5, '#d9a93f'); this.disc(cx + fc * 16, GY - 22, 10, '#b98a2a'); this.disc(cx + fc * 16, GY - 22, 4, '#fff0b0');
        this.R(cx + fc * 8 - 1, GY - 34, 3, 2, '#fff0b0'); g.globalAlpha = 1;
      } else if (dst === 'dance') {
        for (i = 0; i < 3; i++) { g.globalAlpha = (1 - ((pr + i * 0.3) % 1)) * 0.8; g.strokeStyle = i % 2 ? '#ff4fd8' : '#58d6ff'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, GY - 26, 14 + ((pr + i * 0.3) % 1) * 22, 0, 6.283); g.stroke(); }
        g.globalAlpha = 1; for (i = 0; i < 4; i++) this.R(cx - 18 + i * 12, GY - 50 - ((t * 20 + i * 5) % 10), 2, 4, i % 2 ? '#ff4fd8' : '#9a5cff');
      } else if (dst === 'rod') {
        for (i = 0; i < 6; i++) { this.R(cx + fc * (3 + i * 5) - (fc < 0 ? 8 : 0), GY - 10 - i * 6, 9, 5, '#14181f'); this.R(cx + fc * (3 + i * 5) - (fc < 0 ? 8 : 0) + 1, GY - 10 - i * 6 + 1, 7, 3, i % 2 ? '#c4905a' : '#9a6a36'); }
        for (i = 0; i < 6; i++) { g.globalAlpha = 1 - pr; this.R(cx - 14 + i * 6, GY - 8 - Math.sin(pr * 3.14 + i) * 14, 2, 2, '#9fe0ff'); } g.globalAlpha = 1;
      } else if (dst === 'leaf') {
        g.save(); g.translate(cx + fc * 12, GY - 24); g.rotate(0.18 * fc); g.globalAlpha = 0.95;
        g.fillStyle = '#14181f'; g.beginPath(); g.ellipse(0, 0, 14, 25, 0, 0, 6.283); g.fill();
        g.fillStyle = '#4fae3f'; g.beginPath(); g.ellipse(0, 0, 12.5, 23.5, 0, 0, 6.283); g.fill();
        g.fillStyle = '#9be37a'; g.beginPath(); g.ellipse(-3, -4, 5, 13, 0, 0, 6.283); g.fill();
        g.fillStyle = '#2f7a2a'; g.fillRect(-0.5, -22, 1, 44); for (i = 0; i < 4; i++) { g.fillRect(0, -14 + i * 9, 7, 1); g.fillRect(-7, -10 + i * 9, 7, 1); }
        g.restore(); g.globalAlpha = 1;
      } else if (dst === 'dive') {
        g.globalAlpha = 0.85; this.R(cx - 26, GY - 9 + (1 - a2) * 5, 52, 12, '#2f7fc0'); this.R(cx - 26, GY - 9 + (1 - a2) * 5, 52, 2, '#9fe0ff'); g.globalAlpha = 1;
        for (i = 0; i < 2; i++) { g.globalAlpha = (1 - ((pr + i * 0.4) % 1)); g.strokeStyle = '#d6f6ff'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, GY - 7, 14 + ((pr + i * 0.4) % 1) * 18, 3 + ((pr + i * 0.4) % 1) * 3, 0, 0, 6.283); g.stroke(); }
        g.globalAlpha = 1; for (i = 0; i < 6; i++) this.R(cx - 14 + i * 6, GY - 10 - a2 * 22 * ((i % 3) + 1) / 3, 2, 2, '#ffffff');
      } else if (dst === 'cape') {
        var cw = 7 + a2 * 5, ch = 13 + a2 * 10;
        g.save(); g.globalAlpha = 0.97; g.fillStyle = '#0f6f9e'; g.beginPath(); g.ellipse(cx, GY - 22, cw + 1.5, ch + 1.5, 0, 0, 6.283); g.fill();
        g.fillStyle = id === 'heroina' ? '#2cc4ee' : '#22b8e6'; g.beginPath(); g.ellipse(cx, GY - 22, cw, ch, 0, 0, 6.283); g.fill();
        g.fillStyle = '#9af3ff'; g.beginPath(); g.ellipse(cx - cw * 0.35, GY - 26, cw * 0.25, ch * 0.6, 0, 0, 6.283); g.fill();
        g.restore(); g.globalAlpha = 1; for (i = 0; i < 4; i++) this.R(cx - 10 + i * 7, GY - 44 + ((t * 30 + i * 7) % 14), 2, 2, '#ffffff');
      }
    } else if (mode === 'hurt') {
      for (i = 0; i < 3; i++) {                     // estrelinhas rodando acima da cabeça
        a = t * 14 + i * 2.1; g.globalAlpha = 1 - pr * 0.6;
        this.R(cx - 10 * 0 + Math.cos(a) * 10 - 1, GY - 56 + Math.sin(a) * 3, 3, 3, '#ffe48a'); this.R(cx + Math.cos(a) * 10, GY - 57 + Math.sin(a) * 3, 1, 1, '#ffffff');
      }
      for (i = 0; i < 6; i++) {                     // peças/gotas características voando para trás
        g.globalAlpha = 1 - pr; x = cx - fc * (6 + pr * (14 + i * 4)); y = GY - 34 - Math.sin(pr * 3.14) * (8 + i * 3) + pr * pr * 30;
        this.R(x, y, id === 'felipe' || id === 'davi' ? 4 : 2, id === 'felipe' || id === 'davi' ? 3 : 4, i % 2 ? pc[0] : pc[1]);
      }
      if (id === 'gois') { this.R(cx + fc * (8 + pr * 6), GY - 30 + pr * pr * 40, 2, 9, '#c0c4cc'); this.R(cx + fc * (8 + pr * 6) - 1, GY - 22 + pr * pr * 40, 4, 3, '#e0482f'); }
      g.globalAlpha = 1;
    } else if (mode === 'down') {
      g.globalAlpha = dpe;
      var hx = id === 'capy' ? cx + fc * 22 : cx - fc * 30, hy2 = id === 'capy' ? GY - 24 : GY - 28;
      for (i = 0; i < 3; i++) { a = t * 4 + i * 2.1; this.R(hx + Math.cos(a) * 11, hy2 - 10 + Math.sin(a) * 3, 3, 3, '#ffe48a'); }    // tontura
      if (id === 'gois') { for (i = 0; i < 4; i++) this.R(cx + fc * (12 + i * 7), GY - 3, 5, 3, ['#e0382f', '#2f7fe0', '#ffd23a', '#c0c4cc'][i]); this.R(cx + fc * 34, GY - 7, 6, 6, '#e8edf3'); }
      else if (id === 'kauan') { this.R(cx + fc * 12, GY - 4, 14, 2, '#9a6a36'); this.R(cx + fc * 30, GY - 7, 12, 2, '#9a6a36'); this.R(cx + fc * 18, GY - 12, 11, 5, '#ff8a2e'); this.R(cx + fc * 28, GY - 11, 3, 4, '#e8761a'); }
      else if (id === 'felipe') { this.R(cx + fc * 12, GY - 5, 12, 4, '#7a8a3a'); this.R(cx + fc * 15, GY - 8, 8, 3, '#8a9a46'); this.R(cx + fc * 22, GY - 3, 5, 2, '#6a5a2a'); }
      else if (id === 'matheus') { this.R(cx + fc * 12, GY - 6, 12, 2, '#2a2a33'); this.R(cx + fc * 12, GY - 6, 3, 5, '#ff4fd8'); this.R(cx + fc * 22, GY - 6, 3, 5, '#ff4fd8'); }
      else if (id === 'pedro') { this.R(cx + fc * 12, GY - 7, 16, 5, '#d9a93f'); this.R(cx + fc * 26, GY - 11, 8, 12, '#e6bb55'); this.R(cx + fc * 28, GY - 9, 2, 8, '#5a3d10'); }
      else if (id === 'davi') { this.R(cx + fc * 12, GY - 5, 18, 4, '#5a2d24'); this.R(cx + fc * 14, GY - 7, 6, 3, '#f4efdc'); this.R(cx + fc * 21, GY - 7, 6, 3, '#f4efdc'); }
      else if (id === 'boy') { g.globalAlpha = dpe * 0.7; this.R(cx + fc * 10, GY - 6, 18, 5, '#c9ced6'); this.R(cx + fc * 16, GY - 10, 10, 4, '#d6dbe4'); }
      else if (id === 'hero' || id === 'heroina') { g.fillStyle = '#22b8e6'; g.fillRect(cx - 30, GY - 6, 60, 5); g.fillStyle = '#9af3ff'; g.fillRect(cx - 30, GY - 6, 60, 1); }
      else if (id === 'capy') { this.R(cx - 6, GY - 3, 3, 2, '#3d9a4a'); this.R(cx + 4, GY - 4, 3, 2, '#3d9a4a'); }
      g.globalAlpha = 1;
    }
  };

  /* ---------------- inimigos ---------------- */

  /* partes dos personagens extras (frente para a direita; origem = pés) */
  Game.prototype.altParts = function (id, p, q, o) {
    var by = o.by, hy = o.hy, cr = o.crouch;
    var CH = CHARS[charIndex(id)];
    if (CH.group === 'estudantes') {
      var LK = CH.look || {};
      var HAIR = LK.hair || '#6f4a2c', HAIRL = LK.hairL || '#9a6c42', HAIRD = LK.hairD || '#47301e', SKIN = LK.skin || '#f8d6c0', SKIND = LK.skinD || '#e0b29a',
          HOOD = LK.hood || '#222633', HOODL = LK.hoodL || '#363d52', HOODD = LK.hoodD || '#12141c', PANTS = LK.pants || '#2d3245', PANTSL = LK.pantsL || '#414860',
          SHOE = LK.shoe || '#f6f6f6', SHOED = '#a3a8b3', SOLE = '#2b2b33',
          EYE = LK.eye || '#46bd72', EYEL = LK.eyeL || '#a8f0c0', EYED = LK.eyeD || '#25774a', STR = '#d5d9e2', GOLD2 = '#f0cb5e',
          CHAIN = LK.chain !== false, BLUSH = LK.blush !== false, GLASSES = !!LK.glasses, SUIT = !!LK.suit, CURLY = !!LK.curly;
      if (cr) { p(-5, -8, 4, 5, PANTS); p(1, -8, 4, 5, PANTS); }
      else { p(-4, -12, 3, 9, PANTS); p(1, -12, 3, 9, PANTS); q(-4, -12, 1, 8, PANTSL); q(1, -12, 1, 8, PANTSL); }
      p(-5, -3, 5, 3, SHOE); p(0, -3, 5, 3, SHOE);
      q(-5, -1, 5, 1, SOLE); q(0, -1, 5, 1, SOLE); q(-4, -3, 2, 1, SHOED); q(1, -3, 2, 1, SHOED);
      if (LK.bag) { p(-10, -25 + by, 5, 12, LK.bag); q(-10, -25 + by, 5, 2, '#f1e6c4'); q(-9, -19 + by, 3, 2, '#9c8d63'); q(-10, -14 + by, 5, 1, '#16161c'); }
      p(-5, -24 + by, 10, 11, HOOD);                 // moletom
      q(-5, -24 + by, 1, 11, HOODL); q(-5, -14 + by, 10, 1, HOODD); if (!SUIT) q(-3, -18 + by, 6, 3, HOODD);
      p(-5, -26 + by, 10, 3, HOOD); q(-4, -26 + by, 8, 1, HOODL);
      if (SUIT) { q(-1, -24 + by, 2, 4, '#f6f6fa'); q(-2, -23 + by, 1, 7, HOODL); q(1, -23 + by, 1, 7, HOODL); q(0, -19 + by, 1, 1, '#e9e9f2'); q(0, -16 + by, 1, 1, '#e9e9f2'); }
      else { q(-1, -23 + by, 1, 5, STR); q(1, -23 + by, 1, 4, STR); }
      if (LK.bag) { q(-3, -24 + by, 1, 10, '#16161c'); q(-2, -15 + by, 1, 1, '#16161c'); }
      if (!o.win) { p(-8, -23 + by, 3, 10, HOOD); p(-8, -13 + by, 3, 2, SKIN); q(-8, -23 + by, 1, 9, HOODL); }
      if (o.win && LK.weapon === 'book') {            // comemoração: lendo o livro e lançando magia
        p(5, -23 + by, 7, 3, HOOD); p(11, -24 + by, 3, 3, SKIN);
        p(7, -28 + by, 14, 8, '#5a2d24'); q(8, -27 + by, 6, 6, '#f4efdc'); q(14, -27 + by, 6, 6, '#f4efdc'); q(13, -27 + by, 1, 6, '#8a7a55');
        q(9, -26 + by, 4, 1, '#9a9480'); q(9, -24 + by, 3, 1, '#9a9480'); q(15, -26 + by, 4, 1, '#9a9480'); q(15, -24 + by, 4, 1, '#9a9480');
        p(-9, -32 + by, 3, 9, HOOD); p(-10, -35 + by, 5, 4, SKIN); q(-11, -39 + by, 1, 1, '#ffe9a8'); q(-8, -41 + by, 1, 2, '#ffe9a8'); q(-5, -39 + by, 1, 1, '#ffe9a8');
      }
      else if (o.win && LK.weapon === 'tools') {      // comemoração: desmontando um aparelho com a chave de fenda
        var wig = Math.sin((o.t || 0) * 14) > 0 ? 1 : 0;      // desmontando um robozinho
        p(15, -43 + by, 2, 6, '#8a93a3'); p(14, -46 + by, 4, 4, '#e0482f'); q(14, -46 + by, 2, 1, '#ff9a8a');     // antena
        p(10, -37 + by, 14, 13, '#9aa5b5'); q(10, -37 + by, 14, 1, '#d3dbe6'); q(10, -37 + by, 1, 13, '#c0c9d6'); q(23, -37 + by, 1, 13, '#6b7587');
        q(12, -34 + by, 4, 4, '#58d6ff'); q(18, -34 + by, 4, 4, '#58d6ff'); q(13, -33 + by, 2, 2, '#ffffff'); q(19, -33 + by, 2, 2, '#ffffff');     // olhos
        q(13, -28 + by, 8, 1, '#2f3642'); q(14, -27 + by, 1, 1, '#2f3642'); q(16, -27 + by, 1, 1, '#2f3642'); q(18, -27 + by, 1, 1, '#2f3642');    // boca
        p(24, -35 + by, 3, 6, '#7d8795'); q(25, -33 + by, 1, 4, '#e0482f'); q(24, -31 + by, 2, 1, '#f0cb5e');                                       // placa solta com fios
        q(11, -26 + by, 3, 2, '#2f3642'); q(12, -26 + by, 1, 2, '#f0cb5e');                                                                           // parafuso na barriga
        p(5, -23 + by, 6, 3, HOOD); p(10, -24 + by, 4, 3, SKIN);
        p(-9, -25 + by + wig, 19, 2, '#c0c4cc'); q(-9, -25 + by + wig, 19, 1, '#eef1f6'); p(-16, -29 + by + wig, 7, 8, '#e0482f'); q(-16, -29 + by + wig, 7, 1, '#ff8a70'); q(-14, -26 + by + wig, 4, 1, '#a8281a');
        p(-9, -24 + by, 3, 3, HOOD); p(-12, -31 + by + wig, 4, 3, SKIN);
      }
      else if (o.lego) {                              // braço reto estendido à frente, chamando as peças
        p(5, -25 + by, 11, 3, HOOD); q(5, -25 + by, 11, 1, HOODL);
        p(15, -26 + by, 4, 5, SKIN); q(15, -26 + by, 4, 1, '#f6d2b3');
      }
      else if ((o.win || o.up) && LK.weapon === 'dj') {   // sinal de paz (V) na testa, como na foto
        p(4, -25 + by, 8, 3, HOOD); p(10, -34 + by, 3, 11, HOOD); p(9, -38 + by, 5, 4, SKIN); q(9, -38 + by, 5, 1, '#f6d2b3');
        p(9, -44 + by, 2, 6, SKIN); p(12, -45 + by, 2, 7, SKIN); q(9, -44 + by, 1, 6, '#f6d2b3'); q(12, -45 + by, 1, 7, '#f6d2b3'); q(10, -40 + by, 3, 1, SKIND);
        if (o.win) { p(-8, -23 + by, 3, 10, HOOD); p(-8, -13 + by, 3, 2, SKIN); }
      }
      else if (o.punch && LK.weapon === 'dj') {       // onda sonora do fone
        p(4, -23 + by, 9, 3, HOOD); p(12, -25 + by, 4, 4, SKIN);
        p(15, -27 + by, 2, 8, '#2a2a33'); q(16, -26 + by, 1, 6, '#ff4fd8'); q(19, -29 + by, 1, 12, '#ff4fd8'); q(22, -31 + by, 1, 16, '#9a5cff'); q(25, -33 + by, 1, 20, '#58d6ff');
      }
      else if (o.win && LK.weapon === 'fish') {        // pescando: vara na mão, linha cai no lago
        p(4, -24 + by, 9, 3, HOOD); p(12, -26 + by, 4, 4, SKIN);
        for (var rd = 0; rd < 5; rd++) { p(13 + rd * 4, -27 - rd * 3 + by, 5, 2, '#9a6a36'); q(13 + rd * 4, -27 - rd * 3 + by, 5, 1, '#c4905a'); }
        p(10, -25 + by, 3, 3, '#4a4a55'); q(11, -24 + by, 1, 1, '#c0c4cc');           // carretel
        p(-8, -23 + by, 3, 10, HOOD); p(-8, -13 + by, 3, 2, SKIN);
      }
      else if (o.up && LK.weapon === 'fish') {          // peixe erguido, troféu
        p(4, -24 + by, 8, 3, HOOD); p(11, -29 + by, 3, 6, HOOD); p(10, -33 + by, 5, 4, SKIN);
        p(9, -43 + by, 6, 10, '#ff8a2e'); q(9, -43 + by, 6, 1, '#ffc27a'); q(12, -42 + by, 1, 9, '#e8edf3'); p(8, -47 + by, 8, 4, '#e8761a'); q(10, -41 + by, 2, 2, '#14181f'); q(10, -41 + by, 1, 1, '#ffffff');
        p(-8, -23 + by, 3, 10, HOOD); p(-8, -13 + by, 3, 2, SKIN);
      }
      else if (o.punch && LK.weapon === 'fish') {       // peixada
        p(4, -23 + by, 8, 3, HOOD); p(11, -25 + by, 3, 4, SKIN);
        p(13, -29 + by, 14, 9, '#ff8a2e'); q(13, -29 + by, 14, 1, '#ffc27a'); q(13, -22 + by, 14, 1, '#e8edf3'); p(26, -29 + by, 4, 9, '#e8761a'); p(10, -28 + by, 3, 7, '#e8761a');
        q(14, -27 + by, 2, 2, '#14181f'); q(14, -27 + by, 1, 1, '#ffffff'); q(30, -31 + by, 3, 1, '#7fd3ff'); q(31, -19 + by, 3, 1, '#7fd3ff');
      }
      else if (o.win && LK.weapon === 'lettuce') {      // comendo: braço dobrado leva a alface à boca
        var mo = Math.sin((o.t || 0) * 9) > 0 ? 1 : 0;
        p(4, -24 + by, 7, 3, HOOD); p(8, -28 + by, 3, 6, HOOD); p(7, -31 + by, 5, 4, SKIN);
        p(5, -38 + by + mo, 10, 9, '#4fae3f'); q(5, -38 + by + mo, 10, 2, '#9be37a'); q(9, -36 + by + mo, 1, 7, '#2f7a2a'); q(6, -33 + by + mo, 2, 2, '#9be37a'); p(14, -36 + by + mo, 2, 4, '#4fae3f');
        p(-8, -23 + by, 3, 10, HOOD); p(-8, -13 + by, 3, 2, SKIN);
      }
      else if (o.build && LK.weapon === 'lettuce') {    // desenhando com o lápis, e dá mordidas na alface com a outra mão
        var dw = Math.sin((o.t || 0) * 12) > 0 ? 1 : 0, eat = Math.sin((o.t || 0) * 2.6) > 0.55;
        p(4, -23 + by, 8, 3, HOOD); p(11, -25 + by + dw, 3, 4, SKIN);
        p(13, -24 + by + dw, 14, 2, '#f0cb5e'); q(13, -24 + by + dw, 14, 1, '#ffe48a'); p(27, -24 + by + dw, 2, 2, '#3a2a20');
        p(-8, -24 + by, 3, 9, HOOD); p(-9, -16 + by, 4, 3, SKIN);
        p(-14, -22 + by - (eat ? 4 : 0), 8, 8, '#4fae3f'); q(-14, -22 + by - (eat ? 4 : 0), 8, 2, '#9be37a'); q(-10, -20 + by - (eat ? 4 : 0), 1, 5, '#2f7a2a');
      }
      else if (o.up && LK.weapon === 'lettuce') {       // alface erguida
        p(4, -24 + by, 8, 3, HOOD); p(11, -29 + by, 3, 6, HOOD); p(10, -33 + by, 5, 4, SKIN);
        p(7, -45 + by, 11, 12, '#4fae3f'); q(7, -45 + by, 11, 2, '#9be37a'); q(12, -43 + by, 1, 9, '#2f7a2a'); q(9, -40 + by, 2, 2, '#9be37a'); q(14, -38 + by, 2, 2, '#9be37a'); p(6, -42 + by, 2, 5, '#4fae3f'); p(17, -42 + by, 2, 5, '#4fae3f');
        p(-8, -23 + by, 3, 10, HOOD); p(-8, -13 + by, 3, 2, SKIN);
      }
      else if (o.punch && LK.weapon === 'lettuce') {    // alfacada
        p(4, -23 + by, 8, 3, HOOD); p(11, -25 + by, 3, 4, SKIN);
        p(12, -33 + by, 15, 13, '#4fae3f'); q(12, -33 + by, 15, 2, '#9be37a'); q(19, -31 + by, 1, 10, '#2f7a2a'); q(15, -28 + by, 2, 2, '#9be37a'); q(22, -26 + by, 2, 2, '#9be37a'); p(10, -30 + by, 2, 6, '#4fae3f'); p(27, -30 + by, 2, 6, '#4fae3f');
        q(30, -34 + by, 2, 2, '#9be37a'); q(31, -22 + by, 2, 2, '#9be37a');
      }
      else if (o.build && LK.weapon === 'tools') {    // apertando parafusos à frente
        var bw = Math.sin((o.t || 0) * 22) > 0 ? 1 : 0;
        p(4, -23 + by, 8, 3, HOOD); p(11, -25 + by, 3, 4, SKIN);
        p(10, -29 + by + bw, 5, 7, '#e0482f'); q(10, -29 + by + bw, 5, 1, '#ff8a70');
        p(15, -27 + by + bw, 12, 2, '#c0c4cc'); q(15, -27 + by + bw, 12, 1, '#eef1f6'); q(27, -27 + by + bw, 2, 2, '#6b7280');
        q(30, -29 + by, 2, 1, '#ffd34d'); q(31, -25 + by, 2, 1, '#ffd34d');
      }
      else if (o.up && LK.prop === 'tuba') {          // tuba levantada (golpe para cima e vitória)
        p(5, -24 + by, 6, 3, HOOD); p(5, -30 + by, 3, 7, HOOD); p(-8, -23 + by, 3, 7, HOOD);
        p(7, -31 + by, 5, 13, '#d9a93f'); q(7, -31 + by, 1, 13, '#f5d77a'); q(11, -28 + by, 1, 9, '#a67a1f');     // corpo da tuba
        p(10, -36 + by, 4, 6, '#d9a93f'); p(9, -40 + by, 7, 5, '#d9a93f'); p(8, -44 + by, 10, 5, '#e6bb55');   // campânula em funil
        q(9, -44 + by, 8, 2, '#5a3d10'); q(8, -44 + by, 10, 1, '#fff0b0'); q(10, -38 + by, 1, 6, '#f5d77a');
        q(12, -26 + by, 4, 1, '#a67a1f'); q(13, -25 + by, 2, 5, '#a67a1f');
        p(5, -33 + by, 3, 1, '#c0c4cc');
      }
      else if (o.win) {                               // pose de força (vitória)
        p(-13, -24 + by, 8, 3, HOOD); p(-13, -31 + by, 3, 8, HOOD); p(-14, -35 + by, 5, 4, SKIN); q(-14, -35 + by, 5, 1, '#fde5d2'); q(-13, -33 + by, 1, 2, SKIND);
        p(5, -24 + by, 8, 3, HOOD); p(10, -31 + by, 3, 8, HOOD); p(9, -35 + by, 5, 4, SKIN); q(9, -35 + by, 5, 1, '#fde5d2'); q(12, -33 + by, 1, 2, SKIND);
        q(-10, -26 + by, 3, 1, HOODL); q(7, -26 + by, 3, 1, HOODL);
      }
      else if (o.punch && LK.weapon === 'tuba') {      // golpe de tuba
        p(4, -23 + by, 8, 3, HOOD); p(11, -26 + by, 14, 5, '#d9a93f'); q(11, -26 + by, 14, 1, '#f5d77a'); q(13, -22 + by, 10, 1, '#a67a1f');
        p(24, -29 + by, 3, 11, '#e6bb55'); p(26, -31 + by, 3, 15, '#e6bb55'); q(27, -29 + by, 1, 11, '#5a3d10'); q(24, -29 + by, 1, 11, '#fff0b0');
        q(14, -29 + by, 1, 3, '#c0c4cc'); q(17, -29 + by, 1, 3, '#c0c4cc'); q(20, -29 + by, 1, 3, '#c0c4cc');
      }
      else if (o.punch && LK.weapon === 'book') {      // livrada
        p(4, -23 + by, 7, 3, HOOD); p(10, -25 + by, 3, 4, SKIN);
        p(12, -31 + by, 11, 14, '#7a3b2e'); q(12, -31 + by, 1, 14, '#4a1f17'); q(13, -30 + by, 9, 1, '#f1ead2'); q(13, -17 + by, 9, 1, '#f1ead2');
        q(15, -27 + by, 5, 1, '#d9b05a'); q(15, -24 + by, 5, 1, '#d9b05a'); q(21, -29 + by, 1, 11, '#d8cfb0');
        q(25, -33 + by, 3, 2, '#f6f0d8'); q(27, -26 + by, 3, 2, '#f6f0d8');
      }
      else if (o.up && LK.weapon === 'book') {         // livro para cima
        p(5, -39 + by, 3, 16, HOOD); p(4, -42 + by, 5, 3, SKIN);
        p(0, -53 + by, 13, 11, '#7a3b2e'); q(0, -53 + by, 13, 1, '#f1ead2'); q(1, -52 + by, 1, 9, '#4a1f17'); q(4, -49 + by, 6, 1, '#d9b05a'); q(4, -46 + by, 6, 1, '#d9b05a'); q(12, -51 + by, 1, 8, '#d8cfb0');
      }
      else if (o.punch && LK.weapon === 'tools') {     // marretada
        p(4, -23 + by, 8, 3, HOOD); p(11, -25 + by, 3, 4, SKIN);
        p(13, -24 + by, 13, 2, '#9a6a36'); q(13, -24 + by, 13, 1, '#c4905a');
        p(24, -30 + by, 6, 11, '#6b7280'); q(24, -30 + by, 6, 2, '#c0c4cc'); q(29, -29 + by, 1, 9, '#2d3138'); q(25, -27 + by, 1, 5, '#a3acba');
        q(32, -27 + by, 3, 1, '#ffd34d'); q(33, -23 + by, 3, 1, '#ffd34d'); q(31, -31 + by, 2, 2, '#ff8a2e');
      }
      else if (o.up && LK.weapon === 'tools') {        // chave de fenda para o alto
        p(5, -39 + by, 3, 16, HOOD); p(4, -42 + by, 5, 3, SKIN);
        p(4, -50 + by, 5, 8, '#e0482f'); q(4, -50 + by, 1, 8, '#ff8a70'); q(8, -48 + by, 1, 5, '#a8281a');
        p(5, -64 + by, 3, 14, '#c0c4cc'); q(5, -64 + by, 1, 14, '#eef1f6'); q(5, -65 + by, 3, 2, '#6b7280');
        q(1, -60 + by, 2, 1, '#ffd34d'); q(10, -57 + by, 2, 1, '#ffd34d');
      }
      else if (o.punch) { p(5, -22 + by, 9, 3, HOOD); p(14, -23 + by, 4, 4, SKIN); q(14, -23 + by, 4, 1, '#f6d2b3'); q(17, -22 + by, 1, 3, SKIND); }
      else if (o.up) { p(5, -39 + by, 3, 16, HOOD); p(4, -43 + by, 5, 4, SKIN); q(4, -43 + by, 5, 1, '#f6d2b3'); }
      else { p(5, -23 + by, 3, 10, HOOD); p(5, -13 + by, 3, 2, SKIN); }
      p(-4, -33 + hy, 8, 8, SKIN);                   // cabeça
      q(-4, -26 + hy, 8, 1, SKIND);
      if (LK.short) { p(-5, -36 + hy, 10, 4, HAIR); p(-4, -37 + hy, 8, 1, HAIR); }            // cabelo curto
      else { p(-5, -37 + hy, 10, 5, HAIR); p(-3, -39 + hy, 7, 2, HAIR); p(3, -39 + hy, 3, 1, HAIR); }   // volume no topo, ponta para a frente
      q(-4, -33 + hy, 7, 2, HAIR); q(3, -32 + hy, 1, 1, HAIR); q(-5, -33 + hy, 1, 4, HAIR); q(4, -33 + hy, 1, 2, HAIR);  // franja de lado
      if (LK.short) { q(-3, -36 + hy, 5, 1, HAIRL); } else { q(-2, -37 + hy, 4, 1, HAIRL); q(0, -39 + hy, 3, 1, HAIRL); }
      q(-4, -32 + hy, 3, 1, HAIRD);
      if (CURLY) { p(-6, -38 + hy, 4, 4, HAIR); p(2, -38 + hy, 5, 4, HAIR); p(-3, -41 + hy, 7, 3, HAIR); q(-5, -37 + hy, 2, 1, HAIRL); q(-1, -40 + hy, 3, 1, HAIRL); q(3, -37 + hy, 2, 1, HAIRL); q(-6, -34 + hy, 2, 3, HAIR); q(4, -34 + hy, 2, 3, HAIR); }
      if (LK.weapon === 'lettuce') { q(-2, -25 + by, 4, 1, '#f4f4f8'); }   // gola branca
      if (LK.weapon === 'fish') { q(-3, -22 + by, 2, 2, '#f0cb5e'); q(-3, -22 + by, 2, 1, '#3da34a'); q(-2, -25 + by, 4, 1, '#f0cb5e'); }   // distintivo e gola amarela
      if (LK.phones) {
        if (o.win || o.up) { p(-5, -40 + hy, 11, 2, '#2a2a33'); p(-7, -35 + hy, 3, 6, '#2a2a33'); q(-7, -33 + hy, 1, 2, '#ff4fd8'); p(5, -35 + hy, 3, 6, '#2a2a33'); q(7, -33 + hy, 1, 2, '#ff4fd8'); }   // fone na cabeça
        else { p(-6, -26 + by, 3, 5, '#2a2a33'); q(-6, -24 + by, 3, 2, '#ff4fd8'); p(3, -26 + by, 3, 5, '#2a2a33'); q(3, -24 + by, 3, 2, '#ff4fd8'); q(-3, -26 + by, 6, 1, '#2a2a33'); }   // fone no pescoço
        q(-3, -20 + by, 6, 1, '#e9e9f2'); q(-3, -18 + by, 6, 1, '#e9e9f2');   // estampa
      }
      q(-3, -31 + hy, 2, 1, HAIRD); q(1, -31 + hy, 2, 1, HAIRD);                              // sobrancelhas
      q(-3, -30 + hy, 2, 2, EYE); q(1, -30 + hy, 2, 2, EYE); q(-3, -29 + hy, 2, 1, EYED); q(1, -29 + hy, 2, 1, EYED);   // olhos verdes
      q(-3, -30 + hy, 1, 1, '#ffffff'); q(1, -30 + hy, 1, 1, '#ffffff'); q(-2, -30 + hy, 1, 1, EYEL); q(2, -30 + hy, 1, 1, EYEL);
      if (BLUSH) { q(-4, -28 + hy, 2, 1, '#f29a9e'); q(2, -28 + hy, 2, 1, '#f29a9e'); }
      if (GLASSES) { q(-4, -31 + hy, 4, 1, '#14141a'); q(0, -31 + hy, 4, 1, '#14141a'); q(-4, -28 + hy, 4, 1, '#14141a'); q(0, -28 + hy, 4, 1, '#14141a'); q(-4, -30 + hy, 1, 2, '#14141a'); q(3, -30 + hy, 1, 2, '#14141a'); q(-5, -30 + hy, 1, 1, '#14141a'); q(4, -30 + hy, 1, 1, '#14141a'); }                          // bochechas rosadas
      q(0, -28 + hy, 1, 1, SKIND); q(-1, -26 + hy, 2, 1, '#e08f8c');
      if (CHAIN) { q(-2, -25 + by, 1, 1, GOLD2); q(-1, -24 + by, 1, 1, GOLD2); q(0, -23 + by, 1, 2, GOLD2); q(1, -24 + by, 1, 1, GOLD2); q(2, -25 + by, 1, 1, GOLD2); }   // corrente dourada
      return;
    }
    // capivara
    var FUR = '#a8693a', FURL = '#c98a52', FURD = '#7b4826', BELLY = '#e0ad74', NOSE = '#3a2314', CEYE = '#17100c', EAR = '#8c552d';
    var bob = by > 0 && !cr ? 1 : 0, low = cr ? 4 : 0, sh = o.punch ? 4 : 0;
    var T = o.t || 0, blink = (T % 3.3) < 0.14, ear = (Math.sin(T * 11) > 0.7 && (T % 2.4) < 0.7) ? 1 : 0, chew = !o.punch && Math.sin(T * 9) > 0.2 ? 1 : 0;
    var dance = !!o.dance, hop = (o.win || dance) ? -Math.round(Math.abs(Math.sin(T * 7)) * 3) : 0, swy = (o.win || dance) ? Math.round(Math.sin(T * 3.5) * 2) : 0;
    var ox = swy, oy = hop;
    function P(x, y, w, h, c) { p(x + ox, y + oy, w, h, c); }
    function Q(x, y, w, h, c) { q(x + ox, y + oy, w, h, c); }
    if (o.up) {                                      // em pé nas patas de trás
      var wv = Math.sin(T * 10) > 0 ? 0 : 2, wv2 = Math.sin(T * 10 + 3) > 0 ? 0 : 2, hb = o.win ? Math.round(Math.sin(T * 7)) : 0;
      P(-7, -8, 5, 8, FURD); P(1, -8, 5, 8, FUR); Q(-7, -1, 5, 1, NOSE); Q(1, -1, 5, 1, NOSE); Q(-5, -4, 1, 3, FURD); Q(3, -4, 1, 3, FURL);
      P(-10, -13, 3, 3, FURD); Q(-10, -13, 2, 1, FURL);                                              // rabinho
      P(7, -41 + wv, 4, 10, FURL); Q(7, -41 + wv, 4, 2, BELLY); Q(8, -40 + wv, 1, 1, NOSE);           // pata direita acenando
      if (o.win) { P(-12, -37 + wv2, 4, 10, FURD); Q(-12, -37 + wv2, 4, 2, BELLY); }                  // pata esquerda também, na vitória
      P(-8, -27, 15, 20, FUR); Q(-8, -27, 15, 2, FURL); Q(-1, -24, 6, 14, BELLY); Q(-6, -18, 2, 1, FURD); Q(-4, -12, 2, 1, FURD); Q(-7, -22, 1, 10, FURD);
      P(-5, -38 + hb, 13, 11, FUR); P(7, -35 + hb, 7, 7, FUR); Q(12, -35 + hb, 2, 3, NOSE); Q(8, -30 + hb + chew, 4, 1, FURD); Q(8, -33 + hb, 5, 1, FURL);
      if (blink) Q(4, -33 + hb, 2, 1, CEYE); else { Q(4, -34 + hb, 2, 2, CEYE); Q(4, -34 + hb, 1, 1, '#ffffff'); }
      Q(7, -31 + hb, 1, 1, '#e8968a'); Q(14, -33 + hb, 3, 1, FURD); Q(14, -31 + hb, 3, 1, FURD);       // bochecha e bigodes
      P(-4, -41 + hb - ear, 4, 3, EAR); Q(-3, -40 + hb - ear, 2, 1, FURD);
      if (o.win) { Q(-14, -42, 1, 1, '#ffe48a'); Q(15, -44 + (hb ? 1 : 0), 1, 1, '#ffffff'); }
      return;
    }
    var st = dance ? Math.sin(T * 7) : 0, l1 = dance && st > 0 ? -2 : 0, l2 = dance && st <= 0 ? -2 : 0, hb2 = dance ? Math.round(Math.sin(T * 7 + 1) * 1.5) : 0;
    if (cr) { P(-10, -3, 4, 3, FURD); P(-6, -3, 4, 3, FUR); P(4, -3, 4, 3, FURD); P(8, -3, 4, 3, FUR); }
    else { P(-10, -5 + l1, 4, 5 - l1, FURD); P(-6, -5 + l2, 4, 5 - l2, FUR); P(4, -5 + l2, 4, 5 - l2, FURD); P(8, -5 + l1, 4, 5 - l1, FUR); }
    Q(-10, -1, 4, 1, NOSE); Q(-6, -1, 4, 1, NOSE); Q(4, -1, 4, 1, NOSE); Q(8, -1, 4, 1, NOSE);
    Q(-9, -4 + l1, 1, 2, FURL); Q(5, -4 + l2, 1, 2, FURL);
    var tw = Math.sin(T * 8) > 0 ? 1 : 0;
    P(-14, -14 + low + tw, 3, 3, FURD); Q(-14, -14 + low + tw, 2, 1, FURL);                          // rabinho balançando
    if (o.punch) { Q(-20, -13 + low, 5, 1, 'rgba(255,255,255,0.7)'); Q(-23, -9 + low, 6, 1, 'rgba(255,255,255,0.5)'); Q(-18, -5 + low, 4, 1, 'rgba(255,255,255,0.4)'); }   // linhas de velocidade
    P(-12, -17 + low, 24, 13, FUR);                  // corpo
    Q(-11, -17 + low, 22, 2, FURL); Q(-8, -8 + low, 17, 3, BELLY); Q(-12, -5 + low, 24, 1, FURD);
    Q(-8, -13 + low, 3, 1, FURD); Q(-2, -11 + low, 3, 1, FURD); Q(3, -14 + low, 2, 1, FURD); Q(-10, -10 + low, 2, 1, FURD);
    var hy2 = bob + hb2;
    P(8 + sh, -25 + low + hy2, 13, 13, FUR);         // cabeça grande e quadrada
    Q(9 + sh, -25 + low + hy2, 11, 1, FURL); Q(16 + sh, -19 + low + hy2, 5, 5, FURL);
    Q(19 + sh, -22 + low + hy2, 2, 4, NOSE); Q(15 + sh, -15 + low + hy2 + chew, 4, 1, FURD); Q(16 + sh, -18 + low + hy2, 1, 1, NOSE);
    if (blink) Q(13 + sh, -21 + low + hy2, 2, 1, CEYE); else { Q(13 + sh, -22 + low + hy2, 2, 2, CEYE); Q(13 + sh, -22 + low + hy2, 1, 1, '#ffffff'); }
    Q(11 + sh, -18 + low + hy2, 2, 1, '#e8968a'); Q(21 + sh, -19 + low + hy2, 3, 1, FURD); Q(21 + sh, -17 + low + hy2, 3, 1, FURD);   // bochecha e bigodes
    P(9 + sh, -28 + low + hy2 - ear, 4, 3, EAR); Q(10 + sh, -27 + low + hy2 - ear, 2, 1, FURD);
    if (o.punch) { Q(24 + sh, -27 + low, 1, 3, '#ffe48a'); Q(22 + sh, -29 + low, 3, 1, '#ffe48a'); Q(26 + sh, -23 + low, 3, 1, '#ffffff'); Q(25 + sh, -17 + low, 2, 2, '#ffe48a'); }   // estrelinhas do impacto
    if (dance) { var nn = ((T * 3) | 0) % 3; Q(14 + nn * 4, -34 - nn * 2, 1, 4, '#ffd34d'); Q(14 + nn * 4, -34 - nn * 2, 3, 1, '#ffd34d'); }   // notinha
  };

  /* desenha um personagem fora do jogo (menu e seleção). x,y = pés, em coordenadas do mundo (320x180) */
  Game.prototype.drawPreview = function (id, x, y, pose, sc2, rot) {
    var g = this.ctx, sv = this.hero, sc = this.charId;
    this.hero = { hp: 100, face: 1, act: pose === 'punch' ? 'punch' : (pose === 'up' ? 'up' : ''), dir: 1, wonPose: pose === 'flex', build: pose === 'build', lego: pose === 'lego', dance: pose === 'dance',
                  actT: pose ? 0.16 : 0, cd: 0, dodge: pose === 'dodge' ? 0.42 * (1 - ((this.time * 1.6) % 1)) : 0, dodgeCd: 0, hurt: pose === 'hurt' ? 0.35 * (1 - ((this.time * 1.6) % 1)) : 0, inv: 0, win: pose === 'flex', down: pose === 'sit' || pose === 'down', crouchPose: pose === 'crouch' };
    if (pose === 'down') this.hero.downAt = this.time - (this.time % 3);
    this.charId = id;
    g.save();
    g.scale(2, 2);
    g.translate(x, y);
    g.scale(sc2 || 1, sc2 || 1);
    if (rot) { g.translate(0, -40); g.rotate(rot); g.translate(0, 40); }
    g.translate(-CX, -GY);
    this.drawHero();
    g.restore();
    this.hero = sv;
    this.charId = sc;
  };

  Game.prototype.pickChar = function (i) {
    i = (i + CHARS.length) % CHARS.length;
    this.charId = CHARS[i].id;
    this.charGroup = CHARS[i].group;
    this.charPage = (inGroup(this.charGroup).indexOf(CHARS[i]) / PER_PAGE) | 0;
    try { localStorage.setItem('bf_char', this.charId); } catch (err) {}
    this.sfx('click');
  };

  /* ---------------- cenário do menu (pixel art, desenhado uma vez) ---------------- */

  Game.prototype._buildMenuBg = function () {
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c = cv.getContext('2d'), seed = 11, x, y, i;
    function rn() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function r(col, rx, ry, rw, rh) { c.fillStyle = col; c.fillRect(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh)); }
    function disc(col, cx, cy, rad) {
      var dy, w; c.fillStyle = col;
      for (dy = -rad; dy <= rad; dy++) { w = Math.sqrt(rad * rad - dy * dy); c.fillRect(Math.round(cx - w), Math.round(cy + dy), Math.round(w * 2), 1); }
    }
    function ridge(col, hi, base, bottom, fn) {              // morro: altura por coluna
      for (var cx = 0; cx < W; cx++) { var top = Math.round(fn(cx)); r(col, cx, top, 1, bottom - top); if (hi) r(hi, cx, top, 1, 1); }
    }
    function speckle(col, x0, y0, x1, y1, n) { for (var k = 0; k < n; k++) r(col, x0 + rn() * (x1 - x0), y0 + rn() * (y1 - y0), 1 + (rn() * 2 | 0), 1); }

    var sky = ['#3d97fb', '#47a1fd', '#55adff', '#65b9ff', '#77c4ff', '#8acfff', '#9dd9ff', '#b2e3ff'];
    for (i = 0; i < sky.length; i++) r(sky[i], 0, i * 12, W, 13);
    c.globalAlpha = 0.14;
    for (x = 0; x < W; x += 16) r('#e8f7ff', x, 0, 1, 112);
    for (y = 0; y < 112; y += 16) r('#e8f7ff', 0, y, W, 1);
    c.globalAlpha = 1;

    // cidade ao longe (direita)
    var bl = [[206, 22], [214, 34], [222, 26], [230, 40], [239, 30], [247, 46], [255, 28], [262, 54], [270, 32], [278, 24], [286, 36], [296, 20]];
    for (i = 0; i < bl.length; i++) {
      r('#5d84b3', bl[i][0], 92 - bl[i][1], 7, bl[i][1] + 8); r('#7ea6cf', bl[i][0], 92 - bl[i][1], 2, bl[i][1] + 8);
      for (y = 92 - bl[i][1] + 3; y < 90; y += 4) r('#a9cbe8', bl[i][0] + 3, y, 2, 1);
    }
    r('#5d84b3', 261, 30, 2, 12); r('#7ea6cf', 260, 40, 4, 3);   // antena
    // morros ao fundo
    ridge('#7ec1a6', '#a6dcc2', 0, 140, function (cx) { return 86 - 7 * Math.sin(cx / 23) - 5 * Math.sin(cx / 9 + 1); });
    ridge('#4fa77a', '#7fcf9c', 0, 140, function (cx) { return 92 - 12 * Math.sin(cx / 47 + 0.5) - 4 * Math.sin(cx / 13); });
    // morro grande da esquerda
    ridge('#2f8f3c', '#61c356', 0, 140, function (cx) { return cx < 150 ? 108 - 36 * Math.sin(Math.min(1, cx / 150) * Math.PI * 0.62 + 0.25) + 4 * Math.sin(cx / 6) : 300; });
    speckle('#256f30', 0, 74, 150, 112, 140); speckle('#4eb04a', 0, 74, 150, 112, 110);
    // morro da direita + cachoeira
    ridge('#2f8f3c', '#61c356', 0, 140, function (cx) { return cx > 178 ? 96 - 22 * Math.sin((cx - 178) / 142 * Math.PI * 0.7) + 3 * Math.sin(cx / 7) : 300; });
    speckle('#256f30', 180, 76, 320, 112, 140); speckle('#4eb04a', 180, 76, 320, 112, 110);
    r('#6f7b7c', 233, 98, 20, 20); r('#8b9898', 233, 98, 20, 2); r('#566061', 250, 100, 3, 18);
    // lago
    r('#2f7fd6', 0, 108, W, 20);
    for (y = 109; y < 127; y += 3) r('#4e9ff0', 0, y, W, 1);
    speckle('#7cc0ff', 0, 109, W, 127, 70); speckle('#256bbf', 0, 109, W, 127, 40);
    // margem de grama
    r('#3ca843', 0, 122, W, 30);
    for (x = 0; x < W; x++) { var gy = 120 + Math.round(2 * Math.sin(x / 5) + rn() * 2); r('#3ca843', x, gy, 1, 6); r('#6fd35c', x, gy, 1, 1); }
    speckle('#58c24b', 0, 124, W, 150, 260); speckle('#2c8a35', 0, 124, W, 150, 200); speckle('#8be06a', 0, 124, W, 150, 60);
    // solo
    r('#4a3426', 0, 150, W, 30);
    for (x = 0; x < W; x++) { var dy2 = 148 + Math.round(2 * Math.sin(x / 4 + 1) + rn() * 2); r('#3ca843', x, dy2, 1, 3); r('#2c8a35', x, dy2 + 2, 1, 1); }
    speckle('#5f4533', 0, 153, W, 180, 120); speckle('#33231a', 0, 153, W, 180, 120); speckle('#7a5a42', 0, 153, W, 180, 40);
    // pedras
    function rock(rx, ry, rw, rh) { r('#3b3e46', rx - 1, ry - 1, rw + 2, rh + 2); r('#5d626c', rx, ry, rw, rh); r('#7f8591', rx, ry, rw, 3); r('#8e95a3', rx + 3, ry + 1, rw / 3, 1); r('#464a53', rx + rw / 2, ry + rh / 2, rw / 2, rh / 2); }
    rock(6, 110, 30, 22); rock(22, 122, 20, 12); rock(268, 124, 28, 16); rock(284, 118, 20, 14);
    // árvore grande (canto superior esquerdo)
    r('#3e2a18', 0, 14, 16, 80); r('#6b4a2b', 0, 14, 12, 80); r('#8a6238', 2, 14, 2, 80); r('#2f1f12', 12, 14, 4, 80);
    for (i = 0; i < 46; i++) disc(i % 3 ? '#1f6b2c' : '#2a8a35', 6 + rn() * 70, 2 + rn() * 26, 5 + rn() * 7);
    for (i = 0; i < 26; i++) disc('#43b24a', 4 + rn() * 66, 0 + rn() * 22, 3 + rn() * 4);
    speckle('#7be061', 0, 0, 80, 30, 40);
    // samambaias nos cantos
    function fern(fx, fy, n, dir) {
      for (var k = 0; k < n; k++) {
        var ang = -1.5 + dir * (k / n) * 2.6, len = 18 + rn() * 12, px = fx, py = fy, st;
        for (st = 0; st < len; st++) { px += Math.cos(ang) * 1.0 * dir; py += Math.sin(ang) * 1.0 + st * 0.03; r(st % 5 ? '#1f7a31' : '#3fae48', px, py, 2, 2); }
      }
    }
    fern(18, 176, 7, 1); fern(34, 178, 6, 1); fern(300, 176, 7, -1); fern(284, 178, 6, -1);
    for (i = 0; i < 20; i++) disc(i % 2 ? '#1c6a2b' : '#2e9b3a', rn() * 40, 162 + rn() * 22, 3 + rn() * 5);
    for (i = 0; i < 20; i++) disc(i % 2 ? '#1c6a2b' : '#2e9b3a', 280 + rn() * 40, 162 + rn() * 22, 3 + rn() * 5);
    this.menuBg = cv;
    this.menuSpark = [];
    for (i = 0; i < 18; i++) this.menuSpark.push([12 + rn() * 296, 110 + rn() * 14, rn() * 6]);
  };

  Game.prototype.menuLike = function () {
    var s = this.state;
    return s === 'menu' || s === 'howto' || s === 'chars' || s === 'secret';
  };

  Game.prototype.drawMenuScene = function () {
    var g = this.ctx, t = this.time, i;
    if (!this.menuBg) this._buildMenuBg();
    g.save();
    g.scale(2, 2);
    g.drawImage(this.menuBg, 0, 0);
    // nuvens
    var cl = [[18, 22, 1], [150, 14, 0.8], [226, 10, 1.1], [90, 36, 0.7]];
    for (i = 0; i < cl.length; i++) {
      var cx = ((cl[i][0] + t * (3 + i * 1.3)) % (W + 80)) - 40, cy = cl[i][1], s = cl[i][2];
      this.R(cx + 6 * s, cy + 4 * s, 22 * s, 6 * s, '#ffffff'); this.R(cx + 11 * s, cy, 12 * s, 6 * s, '#ffffff');
      this.R(cx, cy + 8 * s, 36 * s, 5 * s, '#ffffff'); this.R(cx + 2 * s, cy + 12 * s, 32 * s, 2 * s, '#c9d4f6');
      this.R(cx + 14 * s, cy + 1 * s, 4 * s, 2 * s, '#eef6ff');
    }
    // cachoeira animada
    for (i = 0; i < 6; i++) {
      var wx = 235 + i * 3, off = ((t * 24 + i * 7) % 18);
      this.R(wx, 100, 3, 18, '#bfe6ff');
      this.R(wx, 100 + off, 2, 5, '#ffffff');
    }
    this.R(232, 117, 20, 2, '#e8f7ff');
    this.R(230 + ((t * 10) | 0) % 3, 119, 24, 1, 'rgba(255,255,255,0.7)');
    // brilhos no lago
    for (i = 0; i < this.menuSpark.length; i++) {
      var sp = this.menuSpark[i];
      if (Math.sin(t * 2.2 + sp[2] * 3) > 0.55) this.R(sp[0], sp[1], 3, 1, '#ffffff');
    }
    g.restore();
  };

  /* letras do logo (6x7) */
  var GLYPH = {
    B: ['111110', '110011', '110011', '111110', '110011', '110011', '111110'],
    I: ['111111', '001100', '001100', '001100', '001100', '001100', '111111'],
    O: ['011110', '110011', '110011', '110011', '110011', '110011', '011110'],
    P: ['111110', '110011', '110011', '111110', '110000', '110000', '110000'],
    U: ['110011', '110011', '110011', '110011', '110011', '110011', '011110'],
    L: ['110000', '110000', '110000', '110000', '110000', '110000', '111111'],
    S: ['011111', '110000', '110000', '011110', '000011', '000011', '111110'],
    E: ['111111', '110000', '110000', '111110', '110000', '110000', '111111']
  };

  Game.prototype.drawLogo = function () {
    var g = this.ctx, word = 'BIOPULSE', px = 3, gap = 3, lw = 6 * px, tot = word.length * lw + (word.length - 1) * gap;
    var x0 = Math.round((W - tot) / 2), y0 = 20, n, rr, cc, G, lx, light, dark, pass;
    g.save();
    g.scale(2, 2);
    for (pass = 0; pass < 2; pass++) {
      for (n = 0; n < word.length; n++) {
        G = GLYPH[word.charAt(n)];
        lx = x0 + n * (lw + gap);
        light = n < 3 ? '#ffffff' : '#7dff3a';
        dark = n < 3 ? '#c4d0ee' : '#35b82a';
        for (rr = 0; rr < 7; rr++) for (cc = 0; cc < 6; cc++) {
          if (G[rr].charAt(cc) !== '1') continue;
          if (pass === 0) this.R(lx + cc * px - 1, y0 + rr * px - 1, px + 2, px + 2, OUT);
          else this.R(lx + cc * px, y0 + rr * px, px, px, rr >= 5 ? dark : light);
        }
      }
    }
    // folha dentro do O
    var ox = x0 + 2 * (lw + gap) + 2 * px, oy = y0 + 1 * px;
    this.R(ox + 2, oy, 3, 2, '#2fbf3f'); this.R(ox, oy + 2, 5, 3, '#43d14f'); this.R(ox + 1, oy + 5, 3, 2, '#2fbf3f');
    this.R(ox + 1, oy + 7, 1, 5, '#1a7a2a'); this.R(ox + 3, oy + 3, 1, 1, '#b5ffb0');
    // colchetes neon
    var bx0 = x0 - 10, bx1 = x0 + tot + 10, by0 = y0 - 8, by1 = y0 + 29;
    var gc = '#7dff3a';
    this.R(bx0, by0, 12, 1, gc); this.R(bx0, by0, 1, 8, gc); this.R(bx1 - 12, by0, 12, 1, gc); this.R(bx1, by0, 1, 8, gc);
    this.R(bx0, by1, 30, 1, gc); this.R(bx0, by1 - 7, 1, 8, gc); this.R(bx1 - 30, by1, 30, 1, gc); this.R(bx1, by1 - 7, 1, 8, gc);
    // linha de pulso
    var ex = 130, ey = y0 + 26, pts = [[0, 0], [14, 0], [18, -3], [22, 5], [27, -8], [32, 4], [36, 0], [60, 0]], k;
    for (k = 0; k < pts.length - 1; k++) {
      var ax = pts[k][0], ay = pts[k][1], bxx = pts[k + 1][0], byy = pts[k + 1][1], stp = Math.max(Math.abs(bxx - ax), Math.abs(byy - ay)), u;
      for (u = 0; u <= stp; u++) { var qx = ex + ax + (bxx - ax) * u / stp, qy = ey + ay + (byy - ay) * u / stp; this.R(qx - 1, qy - 1, 3, 3, OUT); }
    }
    for (k = 0; k < pts.length - 1; k++) {
      var ax2 = pts[k][0], ay2 = pts[k][1], bx2 = pts[k + 1][0], by2 = pts[k + 1][1], stp2 = Math.max(Math.abs(bx2 - ax2), Math.abs(by2 - ay2)), v;
      for (v = 0; v <= stp2; v++) this.R(ex + ax2 + (bx2 - ax2) * v / stp2, ey + ay2 + (by2 - ay2) * v / stp2, 1, 1, '#7dff3a');
    }
    g.restore();
  };

  /* botão de pixel art do menu */
  Game.prototype.menuBtn = function (label, x, y, w, h, action, kind, icon) {
    var g = this.ctx;
    var hot = this.pointer.x >= x && this.pointer.x <= x + w && this.pointer.y >= y && this.pointer.y <= y + h;
    var green = kind === 'green';
    var edge = green ? '#8dff4a' : '#6fc4e8', fill = green ? (hot ? '#23903f' : '#16692e') : (hot ? '#1f4a6b' : '#15324b');
    function notch(col, nx, ny, nw, nh, cut) { g.fillStyle = col; g.fillRect(nx + cut, ny, nw - cut * 2, nh); g.fillRect(nx, ny + cut, nw, nh - cut * 2); }
    notch(OUT, x - 2, y - 2, w + 4, h + 4, 5);
    notch(hot ? '#ffffff' : edge, x, y, w, h, 4);
    notch(fill, x + 3, y + 3, w - 6, h - 6, 3);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(x + 6, y + 4, w - 12, 3);
    var tw = this.measure(label, 15), ix = x + w / 2 - (tw + 26) / 2, cy = y + h / 2;
    g.fillStyle = '#ffffff';
    if (icon === 'play') { g.fillRect(ix, cy - 8, 4, 16); g.fillRect(ix + 4, cy - 6, 4, 12); g.fillRect(ix + 8, cy - 4, 4, 8); g.fillRect(ix + 12, cy - 2, 3, 4); }
    else if (icon === 'book') { g.fillRect(ix, cy - 7, 7, 14); g.fillRect(ix + 8, cy - 7, 7, 14); g.fillStyle = fill; g.fillRect(ix + 2, cy - 4, 3, 1); g.fillRect(ix + 2, cy - 1, 3, 1); g.fillRect(ix + 10, cy - 4, 3, 1); g.fillRect(ix + 10, cy - 1, 3, 1); }
    else if (icon === 'user') { g.fillRect(ix + 4, cy - 8, 7, 7); g.fillRect(ix, cy, 15, 8); }
    else if (icon === 'back') { g.fillRect(ix + 6, cy - 1, 9, 3); g.fillRect(ix + 3, cy - 4, 3, 9); g.fillRect(ix, cy - 2, 3, 5); }
    this.txt(label, ix + 22 + tw / 2, cy + 1, 15, '#ffffff', { outline: 0 });
    this.buttons.push({ x: x, y: y, w: w, h: h, action: action });
  };

  /* ---------------- segredo do Zezze: cima, cima, baixo, baixo, esquerda, direita, esquerda, direita ---------------- */

  Game.prototype.feedSecret = function (dir) {
    if ((this.state !== 'menu' && this.state !== 'chars') || !CHARS[charIndex(this.charId)].secret) { this.kIdx = 0; this.kReady = false; this.kSeq = []; return false; }
    if (this.kReady) { this.kReady = false; this.kIdx = 0; this.kSeq = []; }
    if (this.time - this.kT > 6) { this.kIdx = 0; this.kSeq = []; }
    this.kT = this.time;
    if (dir === KONAMI[this.kIdx]) {
      this.kIdx++;
      this.kSeq.push(dir);
      if (this.kIdx === KONAMI.length) { this.kReady = true; this.sfx('click'); return true; }   // agora é só apertar ENTER
      return this.kIdx >= 5;                       // não troca de personagem enquanto digita esquerda/direita
    }
    this.kIdx = dir === KONAMI[0] ? 1 : 0;
    this.kSeq = this.kIdx ? [dir] : [];
    return false;
  };

  function arrowCells(dir) {
    var up = [[2, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [2, 3], [2, 4]], out = [], i, x, y;
    for (i = 0; i < up.length; i++) {
      x = up[i][0]; y = up[i][1];
      if (dir === 'down') out.push([x, 4 - y]);
      else if (dir === 'left') out.push([y, 4 - x]);
      else if (dir === 'right') out.push([4 - y, x]);
      else out.push([x, y]);
    }
    return out;
  }

  /* mostra no topo os movimentos já digitados do código secreto */
  Game.prototype.drawSecretHud = function () {
    var g = this.ctx, i, j, n = KONAMI.length, sw = 26, gap = 4, tot = n * sw + (n - 1) * gap, x0 = Math.round((UW - tot) / 2), y = 5;
    if (!CHARS[charIndex(this.charId)].secret) { this.kIdx = 0; this.kReady = false; this.kSeq = []; return; }
    if (!this.kReady && this.kIdx === 0) return;
    if (!this.kReady && this.time - this.kT > 6) { this.kIdx = 0; this.kSeq = []; return; }
    var pulse = this.kReady ? 0.6 + 0.4 * Math.sin(this.time * 8) : 1;
    g.fillStyle = 'rgba(2,6,12,0.88)';
    g.fillRect(x0 - 10, y - 4, tot + 20, this.kReady ? 74 : 36);
    g.strokeStyle = this.kReady ? '#7dff3a' : 'rgba(125,255,58,0.5)';
    g.lineWidth = 2;
    g.strokeRect(x0 - 9, y - 3, tot + 18, (this.kReady ? 74 : 36) - 2);
    for (i = 0; i < n; i++) {
      var sx = x0 + i * (sw + gap), done = i < this.kSeq.length, cells;
      g.fillStyle = done ? (this.kReady ? 'rgba(40,160,60,' + pulse.toFixed(2) + ')' : '#16692e') : '#0e1b2b';
      g.fillRect(sx, y, sw, 26);
      g.strokeStyle = done ? '#7dff3a' : '#2c4a63';
      g.lineWidth = 1;
      g.strokeRect(sx + 0.5, y + 0.5, sw - 1, 25);
      if (done) {
        g.save(); g.translate(sx + sw / 2, y + 13);
        g.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[this.kSeq[i]]);
        g.fillStyle = '#ffffff';
        g.beginPath(); g.moveTo(0, -9); g.lineTo(9, 1); g.lineTo(4, 1); g.lineTo(4, 9); g.lineTo(-4, 9); g.lineTo(-4, 1); g.lineTo(-9, 1); g.closePath(); g.fill();
        g.restore();
      } else this.txt(String(i + 1), sx + sw / 2, y + 14, 10, '#4b6a85', { outline: 0 });
    }
    if (this.kReady) {
      this.txt('CÓDIGO CERTO!  APERTE ENTER', UW / 2, y + 40, 14, '#7dff3a', { outline: 4 });
      this.menuBtn('ENTER', UW / 2 - 55, y + 50, 110, 22, 'secretGo', 'green', null);
    }
  };

  Game.prototype.startSecret = function () {
    var self = this, im = new Image();
    var C = CHARS[charIndex(this.charId)];
    this.secret = { t0: this.time, back: this.state, ok: false, err: false, img: im, char: C.id, name: C.name };
    im.onload = function () { if (self.secret && self.secret.img === im) self.secret.ok = true; };
    im.onerror = function () { if (self.secret && self.secret.img === im) self.secret.err = true; };
    im.src = this.opts.secretPhoto || C.photo || ('img/estudantes/' + C.id + '.jpg');
    var art = new Image(), SS = this.secret;
    art.onload = function () { SS.ok2 = true; };
    art.onerror = function () {};
    art.src = C.art || ('img/estudantes/' + C.id + '-pixel.jpg');
    SS.art = art; SS.ok2 = false;
    this._audio();
    this.sfx('boss');
    this.setState('secret');
  };

  Game.prototype._swipe = function (x, y) {
    var s0 = this._sw;
    this._sw = null;
    if (!s0 || (this.state !== 'menu' && this.state !== 'chars')) return;
    var dx = x - s0.x, dy = y - s0.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 36) return;
    this.feedSecret(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };

  /* desenha a imagem inteira dentro do quadrado (sem cortar), centralizada */
  function fitImg(c, img, x, y, size) {
    var w = img.naturalWidth, h = img.naturalHeight, r = Math.min(size / w, size / h), dw = w * r, dh = h * r;
    c.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  }

  Game.prototype.drawSecret = function () {
    var g = this.ctx, S = this.secret, t = this.time - S.t0, fx = 62, fy = 34, fs = 240, i, k, n, steps, cv, c2, im = S.img, sq, ph;
    if (!S) return;
    g.fillStyle = 'rgba(2,6,12,0.86)';
    g.fillRect(0, 0, UW, UH);
    var tRev = S.ok2 ? 5.8 : 4.6;
    this.txt(t < tRev ? 'TRANSFORMANDO…' : S.name + ' DESBLOQUEADO', UW / 2, 18, 16, '#7dff3a', { outline: 5 });
    this.panel(fx - 8, fy - 8, fs + 16, fs + 16, '#7dff3a');
    g.save();
    g.beginPath(); g.rect(fx, fy, fs, fs); g.clip();
    if (S.ok && im.naturalWidth) {
      sq = Math.min(im.naturalWidth, im.naturalHeight);
      var sx0 = (im.naturalWidth - sq) / 2;
      k = clamp((t - 1.1) / 3.4, 0, 1); k = k * k * (3 - 2 * k);
      steps = [240, 128, 96, 72, 56, 44, 36, 30, 26, 22];
      n = steps[Math.min(steps.length - 1, Math.floor(k * steps.length))];
      cv = this._secCv || (this._secCv = document.createElement('canvas'));
      cv.width = n; cv.height = n;
      c2 = cv.getContext('2d');
      c2.imageSmoothingEnabled = true;
      c2.fillStyle = '#0b1522'; c2.fillRect(0, 0, n, n);
      fitImg(c2, im, 0, 0, n);                       // foto inteira, sem cortar
      g.imageSmoothingEnabled = false;
      try { g.filter = 'contrast(' + (1 + k * 0.3).toFixed(2) + ') saturate(' + (1 + k * 0.45).toFixed(2) + ')'; } catch (err) {}
      if (t > 0.5 && t < 1.2) {                         // falha de sinal antes de começar
        for (i = 0; i < 9; i++) {
          var sy = fy + i * (fs / 9), off = (Math.sin(t * 40 + i * 3.1) * 14) | 0;
          g.drawImage(cv, 0, i * (n / 9), n, n / 9 + 0.5, fx + off, sy, fs, fs / 9 + 1);
        }
      } else g.drawImage(cv, 0, 0, n, n, fx, fy, fs, fs);
      try { g.filter = 'none'; } catch (err) {}
      if (S.ok2 && t > 4.6 && S.art.naturalWidth) {          // troca pela versão em pixel art
        var aq = Math.min(S.art.naturalWidth, S.art.naturalHeight), ax0 = (S.art.naturalWidth - aq) / 2;
        g.globalAlpha = clamp((t - 4.6) / 1.0, 0, 1);
        g.imageSmoothingEnabled = false;
        g.fillStyle = '#0b1522'; g.fillRect(fx, fy, fs, fs);
        fitImg(g, S.art, fx, fy, fs);
        g.globalAlpha = 1;
      }
    } else {
      g.fillStyle = '#0b1522';
      g.fillRect(fx, fy, fs, fs);
      if (S.err) {
        this.txt('Coloque a foto em', fx + fs / 2, fy + fs / 2 - 14, 13, INK, { outline: 3 });
        this.txt(CHARS[charIndex(S.char)].photo || ('img/estudantes/' + S.char + '.jpg'), fx + fs / 2, fy + fs / 2 + 6, 13, '#7dff3a', { outline: 3 });
      } else this.txt('carregando…', fx + fs / 2, fy + fs / 2, 13, INK, { outline: 3 });
    }
    g.fillStyle = 'rgba(0,0,0,0.12)';                   // linhas de varredura
    for (i = 0; i < fs; i += 4) g.fillRect(fx, fy + i, fs, 1);
    g.restore();
    this.bar(fx, fy + fs + 14, fs, 12, clamp(t / 4.6, 0, 1) * 100, '#7dff3a');
    if (t > tRev) {                                     // revelação do personagem em pixel art
      var a = clamp((t - tRev) / 0.4, 0, 1);
      g.globalAlpha = a;
      g.fillStyle = 'rgba(40,120,50,0.25)';
      g.fillRect(340, fy, 240, fs);
      ph = this.time % 3;
      this.drawPreview(S.char, 230, 133, ph > 1.5 ? 'flex' : '', 1.2);
      g.globalAlpha = 1;
      this.txt(S.name, 460, fy + fs + 6, 20, '#ffffff', { outline: 6 });
      var fl = clamp(1 - (t - tRev) / 0.35, 0, 1);
      if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + fl.toFixed(2) + ')'; g.fillRect(0, 0, UW, UH); }
    }
    this.menuBtn('FECHAR', UW / 2 - 85, 312, 170, 36, 'closeSecret', 'blue', 'back');
  };

  Game.prototype.drawEnemy = function (e) {
    var P = [], D = [], t = e.t, offY = 0, alpha = 1, roll, k, xx, b, blade, warn, main;
    function p(a, bb, c, d, f) { P.push([a, bb, c, d, f]); }
    function q(a, bb, c, d, f) { D.push([a, bb, c, d, f]); }
    var sx = e.side < 0 ? 1 : -1;
    if (e.reflected) sx = -sx;

    switch (e.type) {
      case 'smog':
        p(-7, -3, 14, 6, '#6f717b'); p(-5, -6, 10, 11, '#6f717b');
        p(-2, -8 + Math.round(Math.sin(t * 3)), 7, 4, '#7c7e88'); p(-9, -1, 4, 4, '#6f717b');
        q(-5, -5, 3, 2, '#9c9ea8'); q(-6, 2, 12, 1, '#50525b');
        q(-4, -1, 2, 1, '#ff5a4e'); q(1, -1, 2, 1, '#ff5a4e');
        q(-5, -2, 2, 1, '#2a2b31'); q(2, -2, 2, 1, '#2a2b31');
        offY = Math.sin(t * 2.5) * 3;
        break;
      case 'trash':
        p(-5, -9, 10, 9, '#2e3b33'); p(-4, -11, 8, 2, '#2e3b33');
        p(-1, -13, 2, 2, '#e3c24c'); p(-3, -14, 2, 1, '#e3c24c'); p(1, -14, 2, 1, '#e3c24c');
        p(4, -8, 3, 2, '#f0d24a');
        q(-4, -8, 1, 4, '#4d5f53'); q(-5, -1, 10, 1, '#1f2923');
        q(-2, -6, 2, 2, '#ffd23a'); q(2, -6, 2, 2, '#ffd23a');
        q(-1, -6, 1, 1, OUT); q(3, -6, 1, 1, OUT);
        q(-2, -7, 2, 1, '#1a211c'); q(2, -7, 2, 1, '#1a211c');
        offY = -Math.abs(Math.sin(t * 7)) * 6;
        break;
      case 'bottle':
        if (((t * 10) | 0) % 2 === 0) {
          p(-6, -2, 9, 4, '#a6e3f5'); p(3, -1, 2, 2, '#a6e3f5'); p(5, -1, 2, 2, '#2b7de0');
          q(-3, -2, 3, 4, '#e8505b'); q(-5, -2, 1, 1, '#e9fbff');
        } else {
          p(-2, -6, 4, 9, '#a6e3f5'); p(-1, 3, 2, 2, '#a6e3f5'); p(-1, 5, 2, 2, '#2b7de0');
          q(-2, -3, 4, 3, '#e8505b'); q(-2, -5, 1, 1, '#e9fbff');
        }
        break;
      case 'barrel':
        p(-7, -10, 14, 10, '#c8b23a');
        q(-7, -10, 1, 10, '#8a7a22'); q(6, -10, 1, 10, '#8a7a22');
        roll = (t * e.speed * 0.35) % 12;
        for (k = 0; k < 2; k++) {
          xx = Math.round(-6 + (roll + k * 6) % 12);
          if (xx > -7 && xx < 5) q(xx, -10, 2, 10, '#9c8a2a');
        }
        q(-2, -7, 4, 4, '#1e1e10'); q(-1, -6, 2, 2, '#c8f03c');
        q(-6, -1, 12, 1, '#7fd02a'); q(-5, -9, 3, 1, '#efe07a'); q(3, -9, 2, 1, '#ff5a4e');
        break;
      case 'car':
        b = Math.round(Math.sin(t * 14) * 0.5);
        p(-10, -8 + b, 20, 5, '#7e6b58'); p(-5, -12 + b, 10, 4, '#6a594a');
        p(-8, -3, 5, 3, '#1b1b1f'); p(4, -3, 5, 3, '#1b1b1f');
        q(-4, -11 + b, 3, 2, '#ffc043'); q(1, -11 + b, 3, 2, '#ffc043');
        q(-2, -11 + b, 1, 1, OUT); q(3, -11 + b, 1, 1, OUT);
        q(-4, -12 + b, 3, 1, OUT); q(1, -12 + b, 3, 1, OUT);
        q(9, -7 + b, 1, 2, '#ffe98a'); q(-10, -5 + b, 20, 1, '#5a4a3c');
        q(-7, -2, 1, 1, '#777777'); q(5, -2, 1, 1, '#777777');
        break;
      case 'drone':
        blade = ((t * 20) | 0) % 2;
        p(-6, -3, 12, 5, '#5b606d'); p(-3, -6, 3, 3, '#5b606d');
        p(-9, -5, 4, 1, '#2a2d35'); p(5, -5, 4, 1, '#2a2d35'); p(6, -1, 3, 2, '#2a2d35');
        q(-11 + blade * 2, -6, 5 - blade * 2, 1, '#c0c6d0');
        q(5, -6, 5 - blade * 2, 1, '#c0c6d0');
        q(-3, -5, 3, 1, '#b0453a'); q(-5, -2, 10, 1, '#6e7482');
        warn = e.mode === 'hover' && e.modeT > e.fire - 0.4 && ((t * 16) | 0) % 2 === 0;
        q(3, -2, 3, 2, warn ? '#ffffff' : '#ff3b3b');
        q(-2, 2, 1, 1, '#8cf03c');
        offY = Math.sin(t * 5);
        break;
      case 'mist':
        p(-7, -3, 14, 6, '#7a5aa0'); p(-5, -6, 10, 11, '#7a5aa0');
        p(-2, -8, 6, 4, '#8e6cb8'); p(-9, 0, 4, 3, '#7a5aa0');
        q(-4, -5, 3, 2, '#b89be0'); q(-5, 3, 10, 1, '#5c4280');
        q(-3, -1, 2, 1, '#9cf06a'); q(1, -1, 2, 1, '#9cf06a');
        q(-6, 1, 1, 1, '#9cf06a'); q(4, -5, 1, 1, '#9cf06a');
        offY = Math.sin(t * 3) * 2;
        if (e.mode === 'blink') alpha = ((t * 20) | 0) % 2 === 0 ? 0.25 : 0.8;
        break;
      case 'oil':
        p(-1, -8, 2, 2, '#221c30'); p(-2, -6, 4, 2, '#221c30'); p(-4, -4, 8, 4, '#221c30');
        p(-5, 0, 10, 4, '#221c30'); p(-4, 4, 8, 2, '#221c30');
        q(-3, -3, 1, 3, '#6b4aa0'); q(-2, -5, 1, 1, '#6b4aa0'); q(1, 4, 3, 1, '#3ad6c5');
        q(-3, 1, 2, 2, '#ffffff'); q(1, 1, 2, 2, '#ffffff');
        q(-2, 2, 1, 1, '#ff4a4a'); q(2, 2, 1, 1, '#ff4a4a');
        sx = 1;
        break;
      case 'sludge':
        main = e.reflected ? '#5fe0ff' : '#56682c';
        p(-3, -3, 6, 6, main); p(-4, -2, 8, 4, main);
        q(-2, -2, 2, 1, e.reflected ? '#e8fbff' : '#9ab24a');
        q(-3, 2, 6, 1, e.reflected ? '#1d8fd0' : '#3b4a1c');
        break;
    }
    this.sprite(e.x, e.y + offY, sx, P, D, e.flash > 0, alpha);
    if (e.type === 'oil' && e.y < 26 && ((t * 8) | 0) % 2 === 0) this.wtext('!', e.x, 8, GOLD, 8);
  };

  /* ---------------- chefe ---------------- */

  Game.prototype.drawBoss = function () {
    var b = this.boss, P = [], D = [], t = this.time, i, k, eye;
    if (b.mode === 'dead' && b.t > 1.6) return;
    function p(x, y, w, h, c) { P.push([x, y, w, h, c]); }
    function q(x, y, w, h, c) { D.push([x, y, w, h, c]); }
    var enr = b.phase === 2, wind = b.mode === 'windup';
    var sx = b.side < 0 ? 1 : -1;
    var jit = wind ? rnd(-1.5, 1.5) : 0;
    eye = wind ? (((t * 16) | 0) % 2 === 0 ? '#ffffff' : '#ff3030') : '#ff3b3b';
    // esteiras
    p(-18, -7, 38, 7, '#26262c');
    for (i = 0; i < 9; i++) q(-17 + ((i * 4 + ((t * 20) | 0)) % 36), -5, 2, 3, '#44444c');
    // casco sujo, faixa de perigo e caveira
    p(-16, -20, 34, 13, '#4f5546');
    q(-14, -19, 30, 3, '#3d4237');
    q(-16, -10, 34, 2, '#e0c040');
    for (i = 0; i < 9; i++) q(-16 + i * 4, -10, 2, 2, '#1a1a1a');
    q(-4, -17, 6, 5, '#1a1b22'); q(-3, -16, 1, 1, '#e8e8e8'); q(-1, -16, 1, 1, '#e8e8e8'); q(-2, -14, 2, 1, '#e8e8e8');
    q(-12, -8, 2, 3, '#6a8a2a'); q(9, -8, 1, 2, '#6a8a2a');
    // barris tóxicos e chaminés
    p(-16, -28, 8, 9, '#c8b23a'); q(-16, -25, 8, 1, '#5a4a10'); q(-14, -27, 1, 1, '#1a1a1a');
    p(-8, -26, 7, 7, '#3f8a3a'); q(-8, -23, 7, 1, '#1f4a1c');
    p(-14, -46, 4, 18, '#5b606d'); p(-9, -40, 4, 14, '#5b606d');
    q(-14, -46, 4, 1, '#2a2d35'); q(-9, -40, 4, 1, '#2a2d35'); q(-14, -40, 4, 1, '#b0453a'); q(-9, -34, 4, 1, '#b0453a');
    // cabine de vidro com o piloto: Sr. Fuligem
    p(2, -36, 16, 16, '#3a4a55');
    q(3, -35, 14, 12, '#8fd8e8'); q(3, -35, 14, 2, '#b8ecf6');
    q(6, -30, 6, 6, '#e8b58a');
    q(5, -32, 8, 3, '#e0c040'); q(4, -30, 10, 1, '#e0c040');
    q(7, -28, 2, 1, eye); q(10, -28, 2, 1, eye);
    q(6, -26, 6, 1, '#3a2a1a');
    q(12, -25, 3, 1, '#f4f4f4'); q(15, -25, 1, 1, ((t * 8) | 0) % 2 === 0 ? '#ff6a3d' : '#ffb03a');
    q(5, -23, 8, 3, '#b0453a');
    // canhão e pá frontal
    p(18, -26, 7, 4, '#3a3e49'); q(24, -26, 1, 4, '#1a1b22'); q(23, -25, 1, 2, wind ? '#ffffff' : '#ff6a3d');
    p(18, -18, 5, 10, '#6a707e'); q(18, -18, 5, 1, '#8a8f9a');
    if (enr) {
      var fl = ((t * 10) | 0) % 2 === 0;
      q(-8, -18, 1, 6, '#ff5a3a'); q(-7, -13, 3, 1, '#ff5a3a'); q(12, -18, 1, 3, '#ff5a3a');
      q(-14, -48, 4, 2, fl ? '#ffb03a' : '#ff5a3a'); q(-9, -42, 4, 2, fl ? '#ff5a3a' : '#ffb03a');
      q(7, -27, 4, 1, '#ff3b3b');
    }
    var alpha = 1, dy = 0;
    if (b.mode === 'dead') { alpha = clamp(1 - b.t / 1.6, 0, 1); dy = b.t * 10; }
    this.sprite(b.x + jit, GY + dy, sx, P, D, b.flash > 0, alpha);
    // fumaça das chaminés e do charuto
    var g = this.ctx, stacks = [[-12, -46], [-7, -40]], age, s2;
    g.save();
    for (k = 0; k < 6; k++) {
      s2 = stacks[k % 2];
      age = (t * (enr ? 1.3 : 0.8) + k * 0.17) % 1;
      g.globalAlpha = (1 - age) * 0.7 * alpha;
      this.disc(b.x + jit + sx * (s2[0] * 2 - age * 16), GY + dy + s2[1] * 2 - age * 46, 3 + age * 7, enr ? '#3a3038' : '#55545c');
    }
    age = (t * 1.4) % 1;
    g.globalAlpha = (1 - age) * 0.6 * alpha;
    this.disc(b.x + jit + sx * (32 + age * 6), GY + dy - 50 - age * 18, 1.5 + age * 3, '#cfcfd6');
    g.restore();
    if (wind && ((t * 10) | 0) % 2 === 0) this.wtext('!', b.x, GY - 106, '#ff4a4a', 16);
  };

  /* ======================================================================
     5. RENDER
     ====================================================================== */

  Game.prototype.render = function () {
    var g = this.ctx;
    if (!g) return;
    var k = this.scale;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.imageSmoothingEnabled = false;

    // --- mundo (320x180, escala 2 dentro do espaço da interface) ---
    var sh = this.shake;
    var ox = sh > 0 ? Math.round(rnd(-sh, sh)) : 0;
    var oy = sh > 0 ? Math.round(rnd(-sh, sh)) : 0;
    g.setTransform(k * 2, 0, 0, k * 2, ox * k * 2, oy * k * 2);
    var i;
    if (this.menuLike()) {
      g.setTransform(k, 0, 0, k, 0, 0);
      this.drawMenuScene();
      g.setTransform(k * 2, 0, 0, k * 2, ox * k * 2, oy * k * 2);
    } else {
    this.drawSky();
    this.drawClouds();
    this.drawMountains();
    this.drawMeadow();
    this.drawSlots();
    this.drawParticles(this.bgFx);
    this.drawTree();
    this.drawGround();
    this.drawRiver();
    for (i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) this.drawEnemy(this.enemies[i]);
    if (this.boss) this.drawBoss();
    if (this.state !== 'result' && this.state !== 'poseprev') this.drawHero();
    this.drawParticles(this.fx);
    }
    for (i = 0; i < this.texts.length; i++) {
      var tx = this.texts[i];
      g.globalAlpha = clamp(tx.life / tx.max * 2, 0, 1);
      this.wtext(tx.s, tx.x, tx.y, tx.c, 8);
      g.globalAlpha = 1;
    }
    if (!this.menuLike()) {
      g.fillStyle = 'rgba(62,52,34,' + (this.vis.ind * 0.17).toFixed(3) + ')';
      g.fillRect(-20, -20, W + 40, H + 40);
    }

    // --- interface (640x360) ---
    g.setTransform(k, 0, 0, k, 0, 0);
    this.drawVignette();
    if (this.flash > 0) {
      g.fillStyle = 'rgba(255,70,80,' + (this.flash * 0.55).toFixed(3) + ')';
      g.fillRect(0, 0, UW, UH);
    }
    this.buttons = [];
    this.touchBtns = [];
    this.drawUI();
    g.setTransform(1, 0, 0, 1, 0, 0);
  };

  Game.prototype.drawParticles = function (arr) {
    var g = this.ctx, i, p, s;
    for (i = 0; i < arr.length; i++) {
      p = arr[i];
      g.globalAlpha = clamp(p.life / p.max * 1.6, 0, 1);
      s = Math.max(1, Math.round(p.s));
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
    g.globalAlpha = 1;
  };

  Game.prototype.drawVignette = function () {
    var g = this.ctx;
    if (!this._vig) {
      var grd = g.createRadialGradient(UW / 2, UH / 2, UH * 0.38, UW / 2, UH / 2, UH * 1.0);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(0,0,0,0.4)');
      this._vig = grd;
    }
    g.fillStyle = this._vig;
    g.fillRect(0, 0, UW, UH);
  };

  /* ---------------- helpers de interface ---------------- */

  Game.prototype.txt = function (s, x, y, size, color, o) {
    var g = this.ctx;
    o = o || {};
    g.font = (o.weight || '700') + ' ' + size + 'px ' + (o.font || MONO);
    g.textAlign = o.align || 'center';
    g.textBaseline = o.baseline || 'middle';
    if (o.outline) {
      g.lineJoin = 'round';
      g.lineWidth = o.outline;
      g.strokeStyle = o.outlineColor || OUT;
      g.strokeText(s, x, y);
    }
    g.fillStyle = color;
    g.fillText(s, x, y);
  };

  Game.prototype.measure = function (s, size, weight, font) {
    var g = this.ctx;
    g.font = (weight || '700') + ' ' + size + 'px ' + (font || MONO);
    return g.measureText(s).width;
  };

  Game.prototype.wrap = function (s, size, weight, maxW) {
    var words = String(s).split(' '), lines = [], cur = '', i, test;
    for (i = 0; i < words.length; i++) {
      test = cur ? cur + ' ' + words[i] : words[i];
      if (this.measure(test, size, weight) > maxW && cur) { lines.push(cur); cur = words[i]; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  Game.prototype.panel = function (x, y, w, h, border) {
    var g = this.ctx;
    g.fillStyle = PANEL;
    g.fillRect(x, y, w, h);
    g.strokeStyle = border || 'rgba(95,224,255,0.5)';
    g.lineWidth = 2;
    g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    g.strokeStyle = OUT;
    g.lineWidth = 2;
    g.strokeRect(x - 1, y - 1, w + 2, h + 2);
  };

  Game.prototype.btn = function (label, x, y, w, h, action, primary) {
    var g = this.ctx;
    var hot = this.pointer.x >= x && this.pointer.x <= x + w && this.pointer.y >= y && this.pointer.y <= y + h;
    var bg = primary ? (hot ? '#86e8ff' : '#3fd3ff') : (hot ? '#17395a' : '#10263b');
    g.fillStyle = bg;
    g.fillRect(x, y, w, h);
    g.strokeStyle = hot ? '#ffffff' : OUT;
    g.lineWidth = 2;
    g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    this.txt(label, x + w / 2, y + h / 2 + 1, 14, primary ? '#062033' : INK, { outline: primary ? 0 : 3 });
    this.buttons.push({ x: x, y: y, w: w, h: h, action: action });
  };

  Game.prototype.keycap = function (s, x, y) {
    var g = this.ctx, w = Math.max(26, this.measure(s, 13) + 12);
    g.fillStyle = INK;
    g.fillRect(x, y, w, 20);
    this.txt(s, x + w / 2, y + 11, 13, OUT, { outline: 0 });
    return w;
  };

  Game.prototype.bar = function (x, y, w, h, value, fill) {
    var g = this.ctx;
    g.fillStyle = OUT;
    g.fillRect(x, y, w, h);
    g.fillStyle = fill;
    g.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * clamp(value, 0, 100) / 100), h - 4);
    g.strokeStyle = 'rgba(232,251,255,0.3)';
    g.lineWidth = 2;
    g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  };

  /* ---------------- telas ---------------- */

  Game.prototype.drawUI = function () {
    var st = this.state;
    if (this.villain) this.drawVillain();
    if (st === 'menu') { this.drawMenu(); this.drawSecretHud(); return; }
    if (st === 'howto') { this.drawHowto(); return; }
    if (st === 'chars') { this.drawChars(); this.drawSecretHud(); return; }
    if (st === 'secret') { this.drawSecret(); return; }
    this.drawHUD();
    if (st === 'decision') this.drawDecision();
    if (st === 'conseq' && this.conseq) this.drawConseq();
    if (st === 'over') this.drawOver();
    if (st === 'result') this.drawResult();
    if (st === 'poseprev') this.drawPosePrev();
    if (this.banner && st !== 'result') this.drawBanner();
    if (COMBAT_STATES.indexOf(st) >= 0 && this.hasTouch && !this.paused) this.drawTouch();
    if (this.paused && st !== 'over' && st !== 'result') this.drawPause();
  };

  Game.prototype.drawBanner = function () {
    var b = this.banner, g = this.ctx;
    var k = b.life / b.max;
    var a = clamp(Math.min((b.max - b.life) / 0.18, k / 0.25), 0, 1);
    g.globalAlpha = a;
    this.txt(b.t, UW / 2, 118, 34, '#ffffff', { outline: 8 });
    if (b.sub) this.txt(b.sub, UW / 2, 150, 18, AQUA, { outline: 6 });
    g.globalAlpha = 1;
  };

  Game.prototype.drawHUD = function () {
    var g = this.ctx, i, x;
    // vida do herói
    this.drawHeartIcon(16, 14);
    var hpBlink = this.hero.hp < 30 && (((this.time * 4) | 0) % 2 === 0);
    g.globalAlpha = hpBlink ? 0.5 : 1;
    this.bar(40, 14, 120, 14, this.hero.hp, '#e8425a');
    g.globalAlpha = 1;
    // fases
    for (i = 0; i < 5; i++) {
      var sz = i === 4 ? 14 : 10;
      x = UW / 2 - 42 + i * 18;
      var col = '#1a2a3a';
      if (i < this.curPip) col = LEAF;
      else if (i === this.curPip) col = i === 4 ? DANGER : AQUA;
      else if (i === 4) col = '#4a1f2a';
      g.fillStyle = col;
      g.fillRect(x, 20 - sz / 2, sz, sz);
      g.strokeStyle = 'rgba(232,251,255,0.3)';
      g.lineWidth = 1;
      g.strokeRect(x + 0.5, 20 - sz / 2 + 0.5, sz - 1, sz - 1);
    }
    // saúde da Árvore Líquida
    var treeBlink = this.world.tree < 25 && (((this.time * 4) | 0) % 2 === 0);
    g.globalAlpha = treeBlink ? 0.5 : 1;
    this.bar(UW - 16 - 104, 14, 84, 14, this.world.tree, '#2bb3e6');
    g.globalAlpha = 1;
    this.drawDropIcon(UW - 30, 14);
    // chefe
    if (this.boss && this.boss.mode !== 'dead') {
      this.txt('SR. FULIGEM NO TITÃ', UW / 2, 44, 11, '#ffb3ba', { outline: 4 });
      this.bar(UW / 2 - 110, 52, 220, 10, this.boss.hp / this.boss.maxHp * 100, '#9aa0ad');
    }
  };

  Game.prototype.drawHeartIcon = function (x, y) {
    var rows = ['.KK...KK.', 'KRRK.KRRK', 'KRWRKRRRK', 'KRRRRRRRK', '.KRRRRRK.', '..KRRRK..', '...KRK...', '....K....'];
    this.pixIcon(rows, { K: OUT, R: DANGER, W: '#ffd0d6' }, x, y, 2);
  };

  Game.prototype.drawDropIcon = function (x, y) {
    var rows = ['...K...', '..KAK..', '..KAK..', '.KAAAK.', 'KAWAAAK', 'KAWAAAK', 'KAAAADK', '.KAADK.', '..KKK..'];
    this.pixIcon(rows, { K: OUT, A: AQUA, W: INK, D: DEEP }, x, y, 2);
  };

  Game.prototype.pixIcon = function (rows, pal, x, y, s) {
    var g = this.ctx, r, c, ch;
    for (r = 0; r < rows.length; r++) {
      for (c = 0; c < rows[r].length; c++) {
        ch = rows[r].charAt(c);
        if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + c * s, y + r * s, s, s); }
      }
    }
  };

  Game.prototype.drawPulseLine = function (x, y, w, h) {
    var g = this.ctx;
    var m = y + h * 0.62;
    var pts = [[x, m], [x + w * 0.38, m], [x + w * 0.41, y + h * 0.08], [x + w * 0.45, y + h * 0.98],
      [x + w * 0.49, y + h * 0.25], [x + w * 0.52, m], [x + w * 0.62, m], [x + w * 0.645, y + h * 0.4],
      [x + w * 0.67, m], [x + w, m]];
    var i;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(95,224,255,0.3)';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
    g.strokeStyle = AQUA;
    g.lineWidth = 2;
    g.stroke();
    var px = x + ((this.time * 0.35) % 1) * w, py = m;
    for (i = 0; i < pts.length - 1; i++) {
      if (px >= pts[i][0] && px <= pts[i + 1][0] && pts[i + 1][0] > pts[i][0]) {
        py = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (px - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
        break;
      }
    }
    g.fillStyle = '#e8fbff';
    g.fillRect(px - 3, py - 3, 6, 6);
  };

  Game.prototype.drawMenu = function () {
    var g = this.ctx, t = this.time, sel = this.charId;
    this.drawLogo();
    this.txt('AQUAVITA  ·  GUARDIÃO DA ÁRVORE LÍQUIDA', UW / 2, 109, 12, '#ffffff', { outline: 5 });
    // personagem escolhido + companheiro
    var sx = sel === 'capy' ? 126 : 142, comp = sel === 'capy' ? 'boy' : 'capy';
    this.drawPreview(sel, sx, 128, (t % 5 > 3.2 && t % 5 < 3.5) ? 'punch' : '', 0.8);
    this.drawPreview(comp, sx + (sel === 'capy' ? 58 : 40), 129, '', 0.8);
    this.menuBtn('JOGAR', 47, 286, 170, 38, 'play', 'green', 'play');
    this.menuBtn('PERSONAGENS', 235, 286, 170, 38, 'chars', 'blue', 'user');
    this.menuBtn('COMO JOGAR', 423, 286, 170, 38, 'howto', 'blue', 'book');
    this.txt('Personagem: ' + CHARS[charIndex(sel)].name, UW / 2, 340, 11, '#ffffff', { outline: 4 });
  };

  Game.prototype.drawChars = function () {
    var g = this.ctx, t = this.time, i, x, y = 82, w = 170, h = 186, cx, c, list = inGroup(this.charGroup), pages, slice, n, x0, gx;
    g.fillStyle = 'rgba(4,10,20,0.5)';
    g.fillRect(0, 0, UW, UH);
    this.txt('ESCOLHA SEU PERSONAGEM', UW / 2, 20, 20, '#ffffff', { outline: 6 });
    // pastas
    for (i = 0; i < GROUPS.length; i++) {
      var on0 = GROUPS[i].id === this.charGroup, tx = UW / 2 - 168 + i * 172, tw = 164, ty = 40;
      var hotT = this.pointer.x >= tx && this.pointer.x <= tx + tw && this.pointer.y >= ty && this.pointer.y <= ty + 30;
      g.fillStyle = OUT; g.fillRect(tx - 2, ty - 2, tw + 4, 36);
      g.fillStyle = on0 ? '#7dff3a' : (hotT ? '#6fc4e8' : '#3b6f8c'); g.fillRect(tx, ty, tw, 32);
      g.fillStyle = on0 ? '#16692e' : '#15324b'; g.fillRect(tx + 3, ty + 3, tw - 6, 26);
      g.fillStyle = on0 ? '#7dff3a' : '#8fd4f2';                                   // ícone de pasta
      g.fillRect(tx + 12, ty + 11, 8, 3); g.fillRect(tx + 12, ty + 14, 18, 11);
      this.txt(GROUPS[i].name + ' (' + inGroup(GROUPS[i].id).length + ')', tx + 36 + (tw - 40) / 2, ty + 17, 13, '#ffffff', { outline: 0 });
      this.buttons.push({ x: tx, y: ty, w: tw, h: 32, action: 'grp' + i });
    }
    g.fillStyle = '#7dff3a'; g.fillRect(UW / 2 - 168, 73, 336, 2);
    pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    this.charPage = clamp(this.charPage, 0, pages - 1);
    slice = list.slice(this.charPage * PER_PAGE, this.charPage * PER_PAGE + PER_PAGE);
    var slots = slice.length + (GROUPS[0].id === this.charGroup ? Math.min(PER_PAGE - slice.length, 2) : 0);   // vagas "em breve" nos estudantes
    n = slots;
    x0 = Math.round((UW - (n * w + (n - 1) * 18)) / 2);
    for (i = 0; i < n; i++) {
      x = x0 + i * (w + 18);
      cx = x + w / 2;
      if (i >= slice.length) {                                                       // vaga vazia
        this.panel(x, y, w, h, 'rgba(95,224,255,0.25)');
        this.txt('?', cx, y + 70, 54, 'rgba(255,255,255,0.18)', { outline: 0 });
        this.txt('EM BREVE', cx, y + 130, 15, SOFT, { outline: 4 });
        continue;
      }
      c = slice[i];
      var on = c.id === this.charId;
      var hot = this.pointer.x >= x && this.pointer.x <= x + w && this.pointer.y >= y && this.pointer.y <= y + h;
      this.panel(x, y, w, h, on ? '#7dff3a' : (hot ? '#ffffff' : 'rgba(95,224,255,0.5)'));
      g.fillStyle = on ? 'rgba(40,120,50,0.35)' : 'rgba(255,255,255,0.05)';
      g.fillRect(x + 4, y + 4, w - 8, 104);
      var ph = t % 4, pose = '';
      if (on) pose = ph > 0.9 && ph < 1.25 ? 'punch' : (ph > 1.7 && ph < 2.05 ? 'up' : (ph > 2.5 && ph < 3.1 ? (c.group === 'estudantes' ? 'flex' : 'up') : (ph > 3.2 ? 'dodge' : '')));
      this.drawPreview(c.id, cx / 2 - (c.id === 'capy' ? 5 : 0), (y + 104) / 2, pose, 0.6);
      this.txt(c.name, cx, y + 126, 16, on ? '#7dff3a' : '#ffffff', { outline: 5 });
      var lines = this.wrap(c.desc, 11, '400', w - 22);
      for (var j = 0; j < lines.length; j++) this.txt(lines[j], cx, y + 144 + j * 13, 11, INK, { weight: '400', outline: 3 });
      this.txt(on ? '✔ SELECIONADO' : 'TOQUE PARA ESCOLHER', cx, y + h - 11, 10, on ? '#7dff3a' : SOFT, { outline: 3 });
      this.buttons.push({ x: x, y: y, w: w, h: h, action: 'pick:' + c.id });
    }
    if (pages > 1) {
      if (this.charPage > 0) this.menuBtn('<', 8, 150, 34, 40, 'pgPrev', 'blue', null);
      if (this.charPage < pages - 1) this.menuBtn('>', UW - 42, 150, 34, 40, 'pgNext', 'blue', null);
    }
    this.menuBtn('VOLTAR', 141, 290, 170, 38, 'back', 'blue', 'back');
    this.menuBtn('JOGAR', 329, 290, 170, 38, 'play', 'green', 'play');
    this.txt('← → trocam de personagem', UW / 2, 345, 11, '#ffffff', { outline: 4 });
  };

  Game.prototype.drawHowto = function () {
    var g = this.ctx, x = 50, y = 30, w = UW - 100, h = UH - 60, i, ry;
    g.fillStyle = 'rgba(4,10,20,0.6)';
    g.fillRect(0, 0, UW, UH);
    this.panel(x, y, w, h);
    this.txt('Como jogar', UW / 2, y + 26, 22, '#ffffff', { outline: 6 });
    var rows = [
      ['A', 'Soco à esquerda', 'Acerte a poluição que vem pela esquerda (ou seta esquerda).'],
      ['D', 'Soco à direita', 'Acerte a poluição que vem pela direita (ou seta direita).'],
      ['W', 'Golpe para cima', 'Destrói o óleo que cai do céu (ou seta para cima).'],
      ['S', 'Bolha d\u2019água', 'Protege o herói, mas o que passar atinge a Árvore.']
    ];
    for (i = 0; i < rows.length; i++) {
      var col = i % 2;
      ry = y + 52 + ((i / 2) | 0) * 58;
      var rx = x + 24 + col * (w / 2 - 10);
      this.keycap(rows[i][0], rx, ry);
      this.txt(rows[i][1], rx + 36, ry + 8, 15, AQUA, { align: 'left', outline: 3 });
      var lines = this.wrap(rows[i][2], 12, '400', w / 2 - 80);
      for (var j = 0; j < lines.length; j++) this.txt(lines[j], rx + 36, ry + 26 + j * 14, 12, INK, { align: 'left', weight: '400', outline: 3 });
    }
    var tips = [
      'Soque no tempo certo: golpes no vazio deixam o herói lento por um instante.',
      'Projéteis de lodo podem ser rebatidos com um soco e voltam contra quem atirou.',
      'Escolhas sustentáveis limpam o mundo e enfraquecem as próximas ondas. Escolhas poluentes dão energia ao herói, mas fortalecem a poluição.',
      'P ou Esc pausa. M liga e desliga o som.'
    ];
    var ty = y + 178;
    for (i = 0; i < tips.length; i++) {
      var tl = this.wrap(tips[i], 13, '400', w - 48);
      for (var m = 0; m < tl.length; m++) { this.txt(tl[m], x + 24, ty, 13, SOFT, { align: 'left', weight: '400', outline: 3 }); ty += 16; }
    }
    this.btn('VOLTAR', UW / 2 - 186, y + h - 52, 180, 40, 'back', false);
    this.btn('JOGAR', UW / 2 + 6, y + h - 52, 180, 40, 'play', true);
  };

  Game.prototype.drawDecision = function () {
    var g = this.ctx, ev = this.curEvent;
    if (!ev) return;
    g.fillStyle = 'rgba(4,10,20,0.5)';
    g.fillRect(0, 0, UW, UH);
    var w = 540, h = 250, x = (UW - w) / 2, y = (UH - h) / 2;
    this.panel(x, y, w, h);
    var tag = 'ALERTA  ·  ' + ev.tag;
    var tw = this.measure(tag, 12) + 16;
    g.fillStyle = GOLD;
    g.fillRect(UW / 2 - tw / 2, y + 14, tw, 20);
    this.txt(tag, UW / 2, y + 25, 12, '#2a1a00', { outline: 0 });
    this.txt(ev.title, UW / 2, y + 56, 24, '#ffffff', { outline: 6 });
    var lines = this.wrap(ev.text, 16, '400', w - 60), i;
    for (i = 0; i < lines.length; i++) this.txt(lines[i], UW / 2, y + 84 + i * 20, 16, SOFT, { weight: '400', outline: 3 });
    var ow = 240, oh = 96, oy = y + h - oh - 20;
    for (i = 0; i < 2; i++) {
      var ox = UW / 2 + (i === 0 ? -ow - 7 : 7);
      var hot = this.pointer.x >= ox && this.pointer.x <= ox + ow && this.pointer.y >= oy && this.pointer.y <= oy + oh;
      var picked = ev.picked === i;
      g.fillStyle = picked ? '#1d5a86' : (hot ? '#17395a' : '#10263b');
      g.fillRect(ox, oy, ow, oh);
      g.strokeStyle = picked || hot ? AQUA : OUT;
      g.lineWidth = 2;
      g.strokeRect(ox + 1, oy + 1, ow - 2, oh - 2);
      this.keycap(i === 0 ? 'A' : 'D', ox + 10, oy + 10);
      var ll = this.wrap(ev.options[i].label, 15, '400', ow - 24);
      for (var j = 0; j < ll.length; j++) this.txt(ll[j], ox + 12, oy + 46 + j * 17, 15, INK, { align: 'left', weight: '400', outline: 3 });
      this.buttons.push({ x: ox, y: oy, w: ow, h: oh, action: 'opt' + i });
    }
  };

  Game.prototype.drawConseq = function () {
    var g = this.ctx, c = this.conseq, i;
    var lines = this.wrap(c.msg, 18, '700', 460);
    var chipsW = 0, chipW = [];
    for (i = 0; i < c.chips.length; i++) { chipW[i] = this.measure(c.chips[i].text, 11) + 14; chipsW += chipW[i] + 6; }
    var rows = Math.ceil(chipsW / 470);
    var h = 22 + lines.length * 22 + rows * 22;
    var w = 500, x = (UW - w) / 2, y = UH - h - 46;
    this.panel(x, y, w, h);
    for (i = 0; i < lines.length; i++) this.txt(lines[i], UW / 2, y + 22 + i * 22, 18, INK, { outline: 4 });
    var cx = x + 20, cy = y + 16 + lines.length * 22;
    for (i = 0; i < c.chips.length; i++) {
      if (cx + chipW[i] > x + w - 16) { cx = x + 20; cy += 22; }
      var col = c.chips[i].kind === 'good' ? LEAF : (c.chips[i].kind === 'bad' ? DANGER : (c.chips[i].kind === 'hero' ? GOLD : AQUA));
      g.fillStyle = OUT;
      g.fillRect(cx, cy, chipW[i], 18);
      this.txt(c.chips[i].text, cx + chipW[i] / 2, cy + 9, 11, col, { outline: 0 });
      cx += chipW[i] + 6;
    }
  };

  Game.prototype.drawPause = function () {
    var g = this.ctx;
    g.fillStyle = 'rgba(4,10,20,0.65)';
    g.fillRect(0, 0, UW, UH);
    this.txt('PAUSA', UW / 2, 120, 34, '#ffffff', { outline: 10 });
    this.txt(this.autoPaused ? 'O jogo pausou sozinho. Toque para continuar.' : 'P ou Esc para continuar.', UW / 2, 156, 15, SOFT, { weight: '400', outline: 4 });
    this.btn('CONTINUAR', UW / 2 - 90, 186, 180, 40, 'resume', true);
    this.btn('MENU PRINCIPAL', UW / 2 - 90, 236, 180, 40, 'menu', false);
  };

  Game.prototype.drawOver = function () {
    var g = this.ctx;
    g.fillStyle = 'rgba(30,4,10,0.82)';
    g.fillRect(0, 0, UW, UH);
    this.txt('ÁRVORE LÍQUIDA', UW / 2, 106, 34, '#ffb3ba', { outline: 10 });
    this.txt('EM PERIGO', UW / 2, 146, 34, '#ffb3ba', { outline: 10 });
    this.txt(this.overSub, UW / 2, 188, 17, INK, { weight: '400', outline: 4 });
    this.btn('REINICIAR', UW / 2 - 186, 232, 180, 40, 'play', true);
    this.btn('MENU PRINCIPAL', UW / 2 + 6, 232, 180, 40, 'menu', false);
  };

  /* ---------- cena de vitória (estilo jogo de luta) ---------- */

  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }

  /* ---- montagem estilo LEGO: tijolos voam da pilha, encaixam um a um com um clique ---- */
  var BP = { R: '#e0382f', B: '#2f7fe0', Y: '#ffd23a', G: '#3da34a', L: '#62c46a', g: '#9aa5b5', D: '#5b6578', W: '#eef2f7', N: '#8a5a35', O: '#ff8a2e', C: '#58d6ff', K: '#2a2f3a' };
  var brickMem = {};
  var ART = {
    fabrica: ['..R....R....', '..W....W....', '..R....R....', '..gggggggg..', 'gggggggggggg', 'gYgYgYgYgYgg', 'ggggggDDgggg', 'NNNNNNNNNNNN'],
    arvore: ['...GGGG...', '.GLGGLGGLG.', 'GGGLGGGGLG', 'GLGGGLGGGL', '.GGLGGGLGG.', '....NN....', '....NN....', '....NN....'],
    palco: ['KK........KK', 'KDK......KDK', 'KKK......KKK', 'KDK......KDK', 'KKK......KKK', 'RRRRRRRRRRRR', 'BBBBBBBBBBBB'],
    trofeu: ['YYYYYYYY', 'YWYYYYYY', '.YYYYYY.', '..YYYY..', '...YY...', '...YY...', '.NNNNNN.', 'NNNNNNNN']
  };
  function brickList(key, art, cw, ch) {
    if (brickMem[key]) return brickMem[key];
    var out = [], r, c, run, col;
    for (r = art.length - 1; r >= 0; r--) {
      c = 0;
      while (c < art[r].length) {
        col = art[r].charAt(c);
        if (col === '.' || col === ' ') { c++; continue; }
        run = 1;
        while (c + run < art[r].length && art[r].charAt(c + run) === col && run < 4) run++;
        out.push({ x: c * cw, y: r * ch, w: run * cw, h: ch, c: BP[col] || '#ccc' });
        c += run;
      }
    }
    brickMem[key] = out;
    return out;
  }
  /* chuva de studs prateados e brilho, como no fim de uma montagem LEGO */
  Game.prototype.studBurst = function (cx, cy, age) {
    var g = this.ctx, i, a, d;
    if (age < 0 || age > 1.4) return;
    g.save(); g.scale(2, 2);
    for (i = 0; i < 16; i++) {
      a = i * 0.61 + 0.3; d = age * (22 + (i % 4) * 8);
      var x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7 - age * 14 + age * age * 40;
      g.globalAlpha = clamp(1.4 - age, 0, 1);
      g.fillStyle = '#14181f'; g.fillRect(x - 2, y - 2, 4, 4);
      g.fillStyle = i % 3 === 0 ? '#ffd34d' : '#d6dbe4'; g.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
      g.fillStyle = '#ffffff'; g.fillRect(x - 1.3, y - 1.3, 1.2, 1.2);
    }
    if (age < 0.4) { g.globalAlpha = 1 - age / 0.4; g.fillStyle = '#ffffff'; g.fillRect(cx - 1, cy - 14, 2, 28); g.fillRect(cx - 14, cy - 1, 28, 2); g.fillRect(cx - 6, cy - 6, 12, 12); }
    g.globalAlpha = 1; g.restore();
  };

  /* anel azul de construção sob o personagem, com brilhos subindo */
  Game.prototype.buildRing = function (cxu, sc, k, t) {
    var g = this.ctx, i, a, age;
    if (k <= 0) return;
    g.save(); g.globalAlpha = k;
    g.strokeStyle = 'rgba(120,220,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(cxu, 304, 52 * sc, 10 * sc, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cxu, 304, 40 * sc + Math.sin(t * 8) * 3, 7 * sc, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(120,220,255,0.16)'; g.beginPath(); g.ellipse(cxu, 304, 52 * sc, 10 * sc, 0, 0, Math.PI * 2); g.fill();
    for (i = 0; i < 12; i++) {
      age = (t * 0.9 + i * 0.083) % 1; a = i * 1.1 + t;
      g.globalAlpha = k * (1 - age); g.fillStyle = i % 2 ? '#ffffff' : '#8fe8ff';
      g.fillRect(cxu + Math.cos(a) * 46 * sc, 304 + Math.sin(a) * 8 * sc - age * 90, 3, 3);
      g.fillRect(cxu + Math.cos(a) * 46 * sc - 1, 304 + Math.sin(a) * 8 * sc - age * 90 + 1, 5, 1);
    }
    g.restore();
  };

  Game.prototype.drawBricks = function (key, cw, ch, ox, oy, ts, t0, dur, px, py) {
    var g = this.ctx, L = brickList(key, ART[key], cw, ch), n = L.length, i, b, u, k, x, y, sx0, sy0, landed = 0, fl = 0.55, e, s2, r = this.result;
    function brick(x, y, w, h, c) {
      g.fillStyle = '#14181f'; g.fillRect(x - 0.7, y - 0.7, w + 1.4, h + 1.4);
      g.fillStyle = c; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, w, 0.8);
      for (var sx = x + 0.5; sx < x + w - 1; sx += cw) { g.fillStyle = '#14181f'; g.fillRect(sx - 0.4, y - 1.7, 2.3, 1.7); g.fillStyle = c; g.fillRect(sx, y - 1.4, 1.5, 1.4); }
    }
    g.save(); g.scale(2, 2);
    for (i = 0; i < n; i++) {
      b = L[i]; k = t0 + i * dur / n; u = (ts - k) / fl;
      sx0 = 128 + ((i * 61 + key.length * 29) % 178); sy0 = 149 - ((i * 13) % 6) * 0.7;
      if (u <= 0) { brick(sx0, sy0 - (u > -0.7 ? Math.abs(Math.sin(u * Math.PI * 2.2)) * 6 : 0), b.w, b.h, b.c); continue; }
      if (u < 1) {
        e = ease(u); x = sx0 + (ox + b.x - sx0) * e; y = sy0 + (oy + b.y - sy0) * e - Math.sin(u * Math.PI) * 46;
        g.globalAlpha = 0.45 * (1 - u); g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 2, b.w + 4, b.h + 4); g.globalAlpha = 1;
        brick(x, y, b.w, b.h, b.c); continue;
      }
      landed++;
      s2 = ts - k - fl;
      brick(ox + b.x, oy + b.y + (s2 < 0.14 ? -(1 - s2 / 0.14) * 1.3 : 0), b.w, b.h, b.c);
      if (s2 < 0.22) { g.globalAlpha = 1 - s2 / 0.22; g.fillStyle = '#ffffff'; x = ox + b.x + b.w / 2; y = oy + b.y - 2; g.fillRect(x - 1, y - 3, 2, 6); g.fillRect(x - 3, y - 1, 6, 2); g.globalAlpha = 1; }
    }
    g.restore();
    if (r) { var kk = 'bk' + key; if ((r[kk] || 0) < landed) { r[kk] = landed; this.sfx('click'); } }
    var tc = t0 + (n - 1) * dur / n + fl, ar = ART[key], wd = ar[0].length * cw, hh = ar.length * ch;
    if (ts > tc) { this.studBurst(ox + wd / 2, oy + hh / 2, ts - tc); if (r && !r['bd' + key]) { r['bd' + key] = 1; this.sfx('good'); } }
    return tc;
  };

  /* robô que o Gois monta peça por peça (coordenadas do mundo, origem nos pés) */
  Game.prototype.drawBuiltRobot = function (wx, wy, s, ts, rot) {
    var g = this.ctx, i, j, parts, u, ox, oy, ready = ts > 4.6, k = this.time, shk = (ts > 4.6 && ts < 5.3) ? Math.sin(ts * 90) * 0.6 : 0;
    function rp(x, y, w, h, c) { g.fillStyle = '#14181f'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = c; g.fillRect(x, y, w, h); if (false) for (var sx = x + 1; sx < x + w - 1; sx += 3) { g.fillStyle = '#14181f'; g.fillRect(sx - 0.5, y - 2, 2.6, 2); g.fillStyle = c; g.fillRect(sx, y - 1.5, 1.6, 1.5); } }
    function sh(x, y, w, h, c, l) { rp(x, y, w, h, c); g.fillStyle = l; g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y + h - 1, w, 1); }
    function arm(sx, dx, dy, ang, flip) {
      g.save(); g.translate(sx + dx, -33 + dy); g.rotate(ang);
      sh(-3, -3, 6, 6, '#8a93a3', '#c5ccd8');                       // ombro
      sh(-2.5, 2, 5, 9, '#d6dbe4', '#ffffff');                      // braço
      sh(-3.2, 10, 6.4, 3, '#5b6578', '#8a93a3');                   // cotovelo
      g.translate(0, 12); g.rotate(flip * (0.25 + Math.max(0, Math.sin(ang * 2)) * 0.5));
      sh(-2.5, 2, 5, 8, '#ffb02e', '#ffe08a');                      // antebraço
      sh(-3, 10, 2.4, 4, '#4a5468', '#7a859b'); sh(0.6, 10, 2.4, 4, '#4a5468', '#7a859b');   // garra
      g.restore();
    }
    parts = [
      [0.0, function (dx, dy) {
        sh(-12 + dx, -3 + dy, 9, 4, '#3a4252', '#7a859b'); sh(3 + dx, -3 + dy, 9, 4, '#3a4252', '#7a859b');
        sh(-10 + dx, -14 + dy, 6, 11, '#aeb7c6', '#e4e9f0'); sh(4 + dx, -14 + dy, 6, 11, '#aeb7c6', '#e4e9f0');
        sh(-11 + dx, -18 + dy, 8, 5, '#5b6578', '#8a93a3'); sh(3 + dx, -18 + dy, 8, 5, '#5b6578', '#8a93a3'); }],
      [0.8, function (dx, dy) {
        sh(-6 + dx, -22 + dy, 12, 5, '#3a4252', '#7a859b');                                   // cintura
        sh(-13 + dx, -36 + dy, 26, 15, '#2f7fe0', '#8fc0ff');                                 // peitoral
        sh(-15 + dx, -39 + dy, 8, 6, '#ffb02e', '#ffe08a'); sh(7 + dx, -39 + dy, 8, 6, '#ffb02e', '#ffe08a');   // ombreiras
        rp(-6 + dx, -33 + dy, 12, 9, '#1c222c');
        var pl = ready ? 0.6 + 0.4 * Math.sin(k * 8) : 0.3;
        g.fillStyle = 'rgba(88,214,255,' + pl.toFixed(2) + ')'; g.fillRect(-3 + dx, -31 + dy, 6, 5);                 // reator
        g.fillStyle = '#ffffff'; g.fillRect(-1 + dx, -30 + dy, 2, 3);
        g.fillStyle = '#e0482f'; g.fillRect(-11 + dx, -20 + dy, 3, 1); g.fillStyle = '#f0cb5e'; g.fillRect(8 + dx, -20 + dy, 3, 1);
        g.fillStyle = '#1a4f9c'; g.fillRect(-13 + dx, -23 + dy, 26, 2); }],
      [1.6, function (dx, dy) {
        var wv = ts > 5.3 ? 1 : 0, sw = ready ? Math.sin(k * 5) * 0.55 : 0;
        arm(-15, dx, dy, 0.18 + sw + (wv ? 0 : 0), 1);
        arm(15, dx, dy, wv ? -2.4 + Math.sin(k * 9) * 0.35 : -0.18 - sw, -1); }],
      [2.4, function (dx, dy) {
        sh(-3 + dx, -41 + dy, 6, 5, '#5b6578', '#8a93a3');                                    // pescoço
        sh(-10 + dx, -55 + dy, 20, 15, '#e8edf3', '#ffffff');                                 // cabeça
        rp(-8 + dx, -51 + dy, 16, 6, '#10151d');                                              // visor
        g.fillStyle = ready ? '#58d6ff' : '#2a3340'; g.fillRect(-6 + dx, -50 + dy, 4, 4); g.fillRect(2 + dx, -50 + dy, 4, 4);
        if (ready) { g.fillStyle = '#ffffff'; g.fillRect(-5 + dx, -49 + dy, 2, 2); g.fillRect(3 + dx, -49 + dy, 2, 2); }
        g.fillStyle = '#8a93a3'; g.fillRect(-4 + dx, -43 + dy, 8, 1); g.fillRect(-12 + dx, -50 + dy, 2, 6); g.fillRect(10 + dx, -50 + dy, 2, 6); }],
      [3.2, function (dx, dy) {
        rp(-1 + dx, -62 + dy, 2, 7, '#8a93a3');
        rp(-2.5 + dx, -66 + dy, 5, 5, ready && ((k * 6) | 0) % 2 ? '#ff8a70' : '#e0482f'); }]
    ];
    g.save(); g.scale(2, 2); g.translate(wx + shk, wy); if (rot) g.rotate(rot); g.scale(s, s);
    for (i = 0; i < parts.length; i++) {
      u = (ts - parts[i][0]) / 0.6;
      if (u <= 0) continue;
      oy = u < 1 ? -4 * (1 - u) - Math.sin(u * Math.PI) * 55 : 0; ox = u < 1 ? ([42, 120, 80, 150, 100][i] + 0) * (1 - u) : 0;
      g.globalAlpha = clamp(u * 1.6, 0, 1);
      parts[i][1](Math.round(ox), Math.round(oy));
      g.globalAlpha = 1;
      var sp = ts - parts[i][0] - 0.6;
      if (sp > 0 && sp < 0.4) {                       // faíscas da pancada
        g.globalAlpha = 1 - sp / 0.4;
        for (j = 0; j < 7; j++) {
          g.fillStyle = j % 2 ? '#ffd34d' : '#ff8a2e';
          g.fillRect(Math.round(Math.cos(j * 0.9) * sp * 44), Math.round(-14 - i * 6 - Math.abs(Math.sin(j * 0.9)) * sp * 40 + sp * sp * 60), 2, 2);
        }
        g.globalAlpha = 1;
      }
    }
    g.restore();
    if (ts > 5.4) {
      var bl = this.txt ? 1 : 0;
      if (bl && ((ts * 3) | 0) % 2 === 0) this.txt('BIP BOP!', wx * 2, (wy - 72 * s) * 2, 13, '#58d6ff', { outline: 4 });
    }
  };

  Game.prototype.drawVictory = function (t) {
    var g = this.ctx, r = this.result, ch = r.char, i, mv = ease(t / 1.0), wx = 160 + (46 - 160) * mv, sc = 1 + 0.45 * mv + clamp((t - 1) / 6, 0, 1) * 0.07, pose = '', ts = t - 1.0, gwx = wx, gwy = 150, gcy = 235, grot = 0;
    if (ch === 'boy') sc = 1 + 0.22 * mv;
    g.fillStyle = 'rgba(3,8,18,' + (0.62 * clamp(t / 0.6, 0, 1)).toFixed(2) + ')';
    g.fillRect(0, 0, UW, UH);
    var cxu = wx * 2, cyu = 230;                     // raios de luz atrás do personagem
    g.save(); g.translate(cxu, cyu);
    for (i = 0; i < 10; i++) {
      var an = t * 0.22 + i * 0.6283;
      g.fillStyle = 'rgba(255,226,140,' + (0.075 * clamp(t / 1.0, 0, 1)).toFixed(3) + ')';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(an - 0.09) * 520, Math.sin(an - 0.09) * 520); g.lineTo(Math.cos(an + 0.09) * 520, Math.sin(an + 0.09) * 520); g.closePath(); g.fill();
    }
    g.restore();
    g.fillStyle = 'rgba(255,214,120,' + (0.16 * mv).toFixed(2) + ')';
    g.beginPath(); g.ellipse(cxu, 304, 90 * sc, 14 * sc, 0, 0, Math.PI * 2); g.fill();
    if (ch === 'gois') {
      var starts = [0.0, 0.8, 1.6, 2.4, 3.2], hit = false;
      if (ts > 0) for (i = 0; i < starts.length; i++) if (ts - starts[i] > 0.28 && ts - starts[i] < 0.5) hit = true;
      pose = ts <= 0 ? '' : (ts < 3.9 ? 'lego' : (ts < 4.7 ? 'build' : ''));
      var fl0 = clamp((ts - 6.4) / 0.9, 0, 1), hop = (ts > 5.4 && ts < 6.3) ? Math.abs(Math.sin((ts - 5.4) * 6)) * 7 : 0;
      var rbx = 106, rby = 150 - hop, phi = 0, grot = 0;
      if (ts > 7.3 && ts < 7.5) rby += 2;                                      // o robô se agacha com o peso
      if (ts > 7.4) { phi = 0.32 * ease((ts - 7.4) / 0.6); var dd = Math.pow(ts - 7.4, 2) * 60; rbx += dd * Math.sin(phi); rby -= dd * Math.cos(phi); }
      if (ts > 6.4 && ts <= 7.3) {                                              // pulo mortal em arco até montar no robô
        gwx = 46 + 60 * ease(fl0); gwy = 150 - 55 * ease(fl0) - Math.sin(fl0 * Math.PI) * 18; grot = 6.283 * ease(fl0);
        pose = '';
      } else if (ts > 7.3) {                                                    // sentado nos ombros do robô, os dois inclinados
        gwx = rbx + 62 * Math.sin(phi); gwy = rby - 62 * Math.cos(phi) + 3; grot = phi; pose = 'sit';
      }
      if (ts < 4.6) {                                // quando monta, ele se move perto do robô, em pulinhos, como o Batman do jogo
        var bm = ts < 3.9 ? ease(ts / 0.5) : 1 - ease((ts - 3.9) / 0.6);
        gwx = 46 + bm * (12 + Math.sin(ts * 3.6) * 7); gwy = 150 - bm * Math.abs(Math.sin(ts * 7)) * 3;
      }
      gcy = gwy * 2 - 65;
      if (false) {                               // tijolos espalhados pelo chão esperando para virar robô
        g.save(); g.scale(2, 2);
        var pc = ['#e0382f', '#2f7fe0', '#ffd23a', '#eef2f7', '#5b6578', '#3da34a'], pj, vis = Math.max(0, 18 - Math.floor(ts * 5));
        for (pj = 0; pj < vis; pj++) { var pxx = 128 + ((pj * 61 + 11) % 178), pyy = 148 - (pj % 3) * 1.4 - (ts < 0.2 ? 0 : (ts % 0.9 > 0.8 && pj % 4 === 0 ? 4 : 0)); g.fillStyle = '#14181f'; g.fillRect(pxx - 0.7, pyy - 0.7, 6.4, 4.4); g.fillStyle = pc[pj % 6]; g.fillRect(pxx, pyy, 5, 3); g.fillRect(pxx + 1, pyy - 1.3, 3, 1.3); }
        g.restore();
      }
      
      if (ts > 0) this.drawBuiltRobot(rbx, rby, 1.25, ts, phi);
      if (ts > 7.4) {                                                           // propulsores e fumaça no pé do robô
        g.save(); g.scale(2, 2); g.translate(rbx, rby); g.rotate(phi);
        for (i = 0; i < 2; i++) { var fh2 = 8 + Math.abs(Math.sin(t * 40 + i)) * 7; g.fillStyle = '#ffd34d'; g.fillRect(-7 + i * 10, 1, 4, fh2); g.fillStyle = '#ff8a2e'; g.fillRect(-7 + i * 10, 1 + fh2 * 0.4, 4, fh2 * 0.6); g.fillStyle = '#ffffff'; g.fillRect(-6 + i * 10, 1, 2, 4); }
        for (i = 0; i < 8; i++) { age = ((ts - 7.4) * 1.5 + i * 0.125) % 1; g.globalAlpha = (1 - age) * 0.6; g.fillStyle = '#d6dbe4'; g.beginPath(); g.arc(Math.sin(i * 2.1) * 6, 8 + age * 28, 3 + age * 6, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1; g.restore();
      }
      if (ts > 3.6) {                                // REATOR LIGADO: carga, raio e aura elétrica
        var el = ts - 4.5, rcx = 212, rcy = 224, jt = Math.floor(t * 24);
        function jag(x0, y0, x1, y1, n, amp, seed) { var pts = [[x0, y0]], j; for (j = 1; j < n; j++) pts.push([x0 + (x1 - x0) * j / n + Math.sin(seed * 7.1 + j * 12.9) * amp, y0 + (y1 - y0) * j / n]); pts.push([x1, y1]); return pts; }
        function bolt(pts, w, col) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var j = 1; j < pts.length; j++) g.lineTo(pts[j][0], pts[j][1]); g.stroke(); }
        if (ts < 4.5) {                              // escurece e junta energia no peito do robô
          g.fillStyle = 'rgba(0,4,22,' + (0.35 * clamp((ts - 3.6) / 0.5, 0, 1)).toFixed(2) + ')'; g.fillRect(0, 0, UW, UH);
          for (i = 0; i < 10; i++) { ang = i * 0.63 + ts * 5; rr = (1 - ((ts * 1.6 + i * 0.1) % 1)) * 60; g.fillStyle = i % 2 ? '#8fe8ff' : '#ffffff'; g.fillRect(rcx + Math.cos(ang) * rr, rcy + Math.sin(ang) * rr, 3, 3); }
        }
        if (el >= 0 && el < 0.4) {                   // o raio cai do céu no robô
          var bp2 = jag(rcx + Math.sin(jt) * 6, 0, rcx, rcy, 9, 16, jt);
          bolt(bp2, 12, 'rgba(120,220,255,0.35)'); bolt(bp2, 6, '#8fe8ff'); bolt(bp2, 3, '#ffffff');
          g.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - el / 0.4)).toFixed(2) + ')'; g.fillRect(0, 0, UW, UH);
          if (this.shake < 6) this.shake = 7;
        }
        if (el >= 0 && el < 1.4) for (i = 0; i < 6; i++) {   // arcos elétricos em volta do robô
          var aa = i * 1.05 + jt * 0.7, a1 = [rcx + Math.cos(aa) * 14, rcy - 4 + Math.sin(aa) * 26], a2 = [rcx + Math.cos(aa + 0.5) * 48, rcy - 4 + Math.sin(aa + 0.5) * 56];
          g.globalAlpha = 1 - el / 1.4; bolt(jag(a1[0], a1[1], a2[0], a2[1], 4, 7, jt + i), 2, i % 2 ? '#ffffff' : '#8fe8ff'); g.globalAlpha = 1;
        }
        if (false) {                  // ELECTRIC THUNDER (agora é a esquiva) (estilo Blanka): agachado, juba elétrica e raios amarelos por todo o corpo
          var ek = ts < 7.3 ? 1 : 0.55, ex = gwx * 2, ey = gcy + (ts < 6.3 ? 14 : 0), hxh = ex + 8 * sc, hyh = ey - 44 * sc;
          g.save();
          g.globalAlpha = (0.20 + 0.08 * Math.sin(t * 22)) * ek; g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(ex, ey, 100 * sc, 0, 6.283); g.fill();
          g.globalAlpha = 0.28 * ek; g.fillStyle = '#fff7b0'; g.beginPath(); g.arc(ex, ey, 62 * sc, 0, 6.283); g.fill();
          for (i = 0; i < 9; i++) {                  // juba de espetos amarelos em volta da cabeça
            var sp0 = -2.9 + i * 0.36 + Math.sin(t * 18 + i) * 0.05, sl = (34 + (i % 3) * 14 + Math.sin(t * 25 + i * 2) * 6) * sc;
            g.globalAlpha = 0.75 * ek; g.fillStyle = i % 2 ? '#ffd23a' : '#ffb020';
            g.beginPath(); g.moveTo(hxh + Math.cos(sp0 - 0.16) * 12 * sc, hyh + Math.sin(sp0 - 0.16) * 12 * sc); g.lineTo(hxh + Math.cos(sp0) * sl, hyh + Math.sin(sp0) * sl); g.lineTo(hxh + Math.cos(sp0 + 0.16) * 12 * sc, hyh + Math.sin(sp0 + 0.16) * 12 * sc); g.closePath(); g.fill();
          }
          g.globalAlpha = ek;
          for (i = 0; i < 12; i++) {                 // raios saindo do corpo
            var ba = i * 0.524 + jt * 0.37, r0 = 18 * sc, r1 = (80 + ((i * 37 + jt * 11) % 60)) * sc, bx0 = ex + Math.cos(ba) * r0, by0 = ey + Math.sin(ba) * r0 * 1.4, bx1 = ex + Math.cos(ba) * r1, by1 = ey + Math.sin(ba) * r1 * 1.1;
            var bp = jag(bx0, by0, bx1, by1, 5, 10 * sc, jt + i * 3);
            bolt(bp, 7, 'rgba(255,210,40,0.35)'); bolt(bp, 3, i % 2 ? '#ffe45a' : '#fff7b0'); bolt(bp, 1.2, '#ffffff');
          }
          for (i = 0; i < 14; i++) {                 // faíscas no chão
            var gq = (t * 1.6 + i * 0.07) % 1; g.globalAlpha = (1 - gq) * ek; g.fillStyle = i % 2 ? '#ffe45a' : '#ffffff';
            g.fillRect(ex - 90 + ((i * 53) % 180) + (i % 2 ? 1 : -1) * gq * 20, 296 - gq * 36 * ((i % 3) + 1) / 2, 3, 3);
          }
          g.restore(); g.globalAlpha = 1;
        }
      }
      if (ts > 0 && ts < 4.2) for (i = 0; i < starts.length; i++) if (Math.abs(ts - starts[i] - 0.6) < 0.02 && !r['k' + i]) { r['k' + i] = 1; this.sfx('click'); }
    } else {
      pose = mv >= 1 ? 'flex' : '';
      var tsx = t - 1.0, rr, age, ang, k2, gx;
      function ringU(cx0, cy0, rad, al, col) { g.globalAlpha = clamp(al, 0, 1); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.ellipse(cx0, cy0, rad, rad * 0.2, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
      if (ch === 'boy' && tsx > 0) {                 // Zezze: arranca uma indústria do chão, levanta com uma mão e mostra os músculos
        var fx0 = 112, fy0 = 150, fh = 0, lift = ease((tsx - 1.2) / 1.1), thr = clamp((tsx - 3.6) / 0.7, 0, 1), trem = 0;
        pose = tsx < 0.6 ? '' : (tsx < 1.2 ? 'punch' : (tsx < 4.3 ? 'up' : 'flex'));
        var hx = wx + 13 * sc, hy = 150 - 86 * sc;
        var fxp = fx0 + (hx - fx0) * lift, fyp = fy0 + (hy - fy0) * lift;
        if (tsx >= 2.3 && tsx < 3.6) { trem = Math.sin(tsx * 50) * 0.8; if (this.shake < 2) this.shake = 2; }
        if (thr > 0) { fxp += thr * 150; fyp -= thr * 130 - thr * thr * 20; }
        if (tsx < 4.7) {
          g.save(); g.scale(2, 2); g.translate(fxp + trem, fyp); g.scale(0.8, 0.8);
          if (lift < 0.3 && tsx < 1.8) {              // terra arrancada com raízes
            g.fillStyle = '#14181f'; g.fillRect(-21, -1, 42, 7); g.fillStyle = '#5a3d26'; g.fillRect(-20, 0, 40, 5);
            g.fillStyle = '#3d9a4a'; g.fillRect(-20, -2, 40, 2); g.fillStyle = '#3a2716'; for (i = 0; i < 6; i++) g.fillRect(-16 + i * 6, 5, 2, 3 + (i % 3));
          } else if (lift > 0.01) {
            g.fillStyle = '#5a3d26'; g.fillRect(-18, -1, 36, 4); g.fillStyle = '#3a2716'; for (i = 0; i < 6; i++) g.fillRect(-14 + i * 6, 3, 2, 3 + (i % 3));
          }
          function fr(x, y, w, h, c) { g.fillStyle = '#14181f'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = c; g.fillRect(x, y, w, h); }
          fr(-18, -18, 36, 16, '#7b8494'); fr(-18, -18, 36, 3, '#a3acba'); fr(-10, -28, 20, 10, '#6b7280');
          fr(-14, -36, 5, 18, '#8a4a3a'); fr(7, -34, 5, 16, '#8a4a3a'); fr(-14, -36, 5, 3, '#cfd5de'); fr(7, -34, 5, 3, '#cfd5de');
          g.fillStyle = '#f0cb5e'; for (i = 0; i < 4; i++) g.fillRect(-15 + i * 9, -14, 4, 4);
          g.fillStyle = '#2f3642'; g.fillRect(-4, -10, 8, 8); g.fillStyle = '#9fe8ff'; g.fillRect(-8, -26, 4, 3); g.fillRect(4, -26, 4, 3);
          for (i = 0; i < 6; i++) {                   // fumaça preta saindo das chaminés
            age = (t * 0.7 + i * 0.17) % 1; g.globalAlpha = (1 - age) * 0.7; g.fillStyle = i % 2 ? '#3a3f4a' : '#555b68';
            g.beginPath(); g.arc((i % 2 ? -11.5 : 9.5) + Math.sin(age * 5 + i) * 3, -38 - age * 26, 3 + age * 5, 0, Math.PI * 2); g.fill();
          }
          g.globalAlpha = 1; g.restore();
        }
        if (tsx > 0.6 && tsx < 1.6) for (i = 0; i < 10; i++) {   // poeira do chão
          age = (tsx - 0.6) / 1.0; g.globalAlpha = (1 - age) * 0.6; g.fillStyle = '#9a8666';
          g.beginPath(); g.arc((fx0 + (i - 5) * 4 + (i % 2 ? 1 : -1) * age * 12) * 2, (148 - age * 10 - (i % 3) * 3) * 2, 4 + age * 8, 0, Math.PI * 2); g.fill();
        }
        g.globalAlpha = 1;
        if (tsx > 1.2 && tsx < 1.3 && this.shake < 5) this.shake = 6;
        if (tsx >= 4.3) {
          for (k2 = 0; k2 < 3; k2++) { age = tsx - 4.3 - k2 * 0.2; if (age > 0 && age < 1.3) ringU(cxu, 304, age * 240, 1 - age / 1.3, k2 % 2 ? '#ffd34d' : '#ffffff'); }
          if (tsx < 4.55) { g.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - (tsx - 4.3) / 0.25)).toFixed(2) + ')'; g.fillRect(0, 0, UW, UH); if (this.shake < 5) this.shake = 6; }
          g.globalAlpha = 0.14 + 0.08 * Math.sin(t * 6); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(cxu, 235, 74 * sc, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
          for (i = 0; i < 12; i++) {
            age = (t * 0.8 + i * 0.083) % 1; g.globalAlpha = 1 - age; g.fillStyle = i % 2 ? '#ffd34d' : '#ffffff';
            g.fillRect(cxu - 60 + ((i * 37) % 120), 300 - age * 190, 3, 3);
          }
          g.globalAlpha = 1;
        }
      }
      if (ch === 'kauan') {                           // lago: pesca de verdade, o peixe morde e ele puxa
        var wt0 = 276, wbx = 318, wby = wt0 + 4, tipx = wx * 2 + 4 * 34 * sc, tipy = 300 - 4 * 39 * sc;
        g.fillStyle = '#1b3f66'; g.fillRect(230, wt0, UW - 230, UH - wt0); g.fillStyle = '#2f7fc0'; g.fillRect(230, wt0, UW - 230, 4);
        for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(160,220,255,0.35)'; g.fillRect(240 + i * 44 + Math.sin(t * 2 + i) * 6, wt0 + 10 + (i % 3) * 8, 18, 2); }
        pose = tsx < 0.5 ? '' : (tsx < 4.9 ? 'flex' : 'up');
        var bite = tsx > 3.0 && tsx < 4.2, bob = bite ? Math.abs(Math.sin(tsx * 18)) * 9 : Math.sin(t * 3) * 1.5, cast = clamp((tsx - 0.7) / 0.7, 0, 1);
        if (tsx > 0.7 && tsx < 4.2) {                // linha e boia
          var bx2 = tipx + (wbx - tipx) * ease(cast), by2 = tipy + (wby + bob - tipy) * ease(cast) - Math.sin(cast * Math.PI) * 60;
          g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tipx, tipy); g.quadraticCurveTo((tipx + bx2) / 2, Math.min(tipy, by2) + 10, bx2, by2); g.stroke();
          g.fillStyle = '#ffffff'; g.fillRect(bx2 - 4, by2 - 6, 8, 6); g.fillStyle = '#e0382f'; g.fillRect(bx2 - 4, by2 - 12, 8, 6);
          if (bite) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(bx2, wt0 + 3, 12 + (tsx * 30) % 14, 3, 0, 0, 6.283); g.stroke(); }
        }
        if (tsx >= 4.2 && tsx < 5.2) {               // peixe pulando da água até a mão
          var fu = (tsx - 4.2) / 1.0, fx3 = wbx + ((wx * 2 + 4 * 12 * sc) - wbx) * ease(fu), fy3 = wby - 10 + ((300 - 4 * 38 * sc) - wby + 10) * ease(fu) - Math.sin(fu * Math.PI) * 90;
          g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tipx, tipy); g.lineTo(fx3, fy3); g.stroke();
          g.save(); g.translate(fx3, fy3); g.rotate(-0.6 + fu * 1.2); g.fillStyle = '#14181f'; g.fillRect(-19, -9, 38, 18); g.fillStyle = '#ff8a2e'; g.fillRect(-17, -7, 30, 14); g.fillRect(12, -9, 10, 18);
          g.fillStyle = '#e8edf3'; g.fillRect(-17, 3, 30, 3); g.fillStyle = '#14181f'; g.fillRect(-13, -4, 4, 4); g.restore();
          for (i = 0; i < 6; i++) { g.fillStyle = '#9fe0ff'; g.globalAlpha = 1 - fu; g.fillRect(wbx - 12 + i * 5 + Math.sin(i * 3) * 8, wt0 - Math.sin(fu * Math.PI) * 40 - i * 3, 3, 3); g.globalAlpha = 1; }
        }
      }
      if (ch === 'felipe') {                         // come alface e desenha num cavalete
        pose = tsx < 0.5 ? '' : (tsx < 2.6 ? 'flex' : 'build');
        var pxl = 215, pyt = 160, pw = 175, ph = 130, dr = clamp((tsx - 2.8) / 2.6, 0, 1), pa = clamp((tsx - 0.4) / 0.5, 0, 1);
        g.globalAlpha = pa; g.strokeStyle = '#14181f'; g.lineWidth = 4; g.beginPath(); g.moveTo(pxl + 30, pyt + ph); g.lineTo(pxl + 6, 296); g.moveTo(pxl + pw - 30, pyt + ph); g.lineTo(pxl + pw - 6, 296); g.stroke();
        g.fillStyle = '#14181f'; g.fillRect(pxl - 4, pyt - 4, pw + 8, ph + 8); g.fillStyle = '#f7f4ea'; g.fillRect(pxl, pyt, pw, ph); g.globalAlpha = 1;
        g.save(); g.beginPath(); g.rect(pxl, pyt, pw, ph); g.clip(); g.lineWidth = 3; g.lineCap = 'round';
        g.strokeStyle = '#f0a020'; g.beginPath(); g.arc(pxl + 36, pyt + 34, 16, 0, 6.283 * clamp(dr / 0.2, 0, 1)); g.stroke();                       // sol
        if (dr > 0.2) { g.strokeStyle = '#7a4a26'; g.beginPath(); g.moveTo(pxl + 100, pyt + ph - 8); g.lineTo(pxl + 100, pyt + ph - 8 - 54 * clamp((dr - 0.2) / 0.2, 0, 1)); g.stroke(); }   // tronco
        if (dr > 0.4) { g.strokeStyle = '#2f9a3a'; g.beginPath(); g.arc(pxl + 100, pyt + 40, 28, 0, 6.283 * clamp((dr - 0.4) / 0.25, 0, 1)); g.stroke(); }  // copa
        if (dr > 0.65) { g.strokeStyle = '#2f7fe0'; g.beginPath(); g.moveTo(pxl + 150, pyt + 70); g.quadraticCurveTo(pxl + 140, pyt + 92, pxl + 150, pyt + 94 * clamp((dr - 0.65) / 0.2, 0.4, 1)); g.quadraticCurveTo(pxl + 160, pyt + 92, pxl + 150, pyt + 70); g.stroke(); }  // gota
        if (dr > 0.85) { g.fillStyle = '#14181f'; g.font = '700 14px monospace'; g.textAlign = 'left'; g.fillText('Felipe', pxl + 10, pyt + ph - 10); }
        g.restore();
        if (tsx > 0.5 && tsx < 2.6) for (i = 0; i < 5; i++) {   // pedacinhos de alface voando enquanto come
          age = (tsx * 1.4 + i * 0.2) % 1; g.globalAlpha = 1 - age; g.fillStyle = i % 2 ? '#9be37a' : '#4fae3f';
          g.fillRect((wx + 10 * sc) * 2 + age * 40 + i * 3, (150 - 28 * sc) * 2 + age * age * 90, 5, 4); g.globalAlpha = 1;
        }
      }
      if (ch === 'matheus') {                        // estúdio de streamer: equalizador, ON AIR, microfone e selfie
        var mf = clamp((t - 0.2) / 0.6, 0, 1), eqc = ['#9a5cff', '#ff4fd8', '#58d6ff'], eb;
        g.save(); g.scale(2, 2); g.globalAlpha = mf;
        for (eb = 0; eb < 16; eb++) {
          var eh = 4 + Math.abs(Math.sin(t * 5 + eb * 1.3)) * 16 + Math.abs(Math.sin(t * 9 + eb)) * 6;
          g.fillStyle = '#14181f'; g.fillRect(64 + eb * 6.6 - 0.5, 150 - eh - 0.5, 5.6, eh + 1);
          g.fillStyle = eqc[eb % 3]; g.fillRect(64 + eb * 6.6, 150 - eh, 4.6, eh); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(64 + eb * 6.6, 150 - eh, 4.6, 1.5);
        }
        g.restore();
        var ol = ((t * 2) | 0) % 2;                  // letreiro ON AIR piscando
        g.fillStyle = '#14181f'; g.fillRect(UW - 128, 20, 100, 34); g.fillStyle = ol ? '#ff2e4d' : '#7a1a28'; g.fillRect(UW - 125, 23, 94, 28);
        this.txt('ON AIR', UW - 78, 38, 14, '#ffffff', { outline: 2 });
        pose = tsx < 0.8 ? '' : 'up';
        if (tsx > 0.8) {                             // microfone na haste
          g.fillStyle = '#2a2a33'; g.fillRect(wx * 2 + 56, 40, 4, 120); g.fillRect(wx * 2 + 30, 40, 30, 4);
          g.fillStyle = '#14181f'; g.fillRect(wx * 2 + 22, 40, 14, 26); g.fillStyle = '#58d6ff'; g.fillRect(wx * 2 + 24, 44, 10, 18);
        }
        for (i = 0; i < 2; i++) {                    // luzes neon
          g.fillStyle = i ? 'rgba(255,79,216,0.10)' : 'rgba(154,92,255,0.12)'; g.beginPath(); g.moveTo(i ? UW - 60 : 60, 0); g.lineTo(cxu - 80 + i * 160 + Math.sin(t * 2 + i) * 20, 310); g.lineTo(cxu + 60 + i * 160 + Math.sin(t * 2 + i) * 20, 310); g.closePath(); g.fill();
        }
        if (tsx > 2.6) {                             // flash da câmera e a foto pixelada aparece como selfie
          var pf = clamp((tsx - 2.6) / 0.7, 0, 1);
          if (!this._mImg) { this._mImg = new Image(); this._mImg.src = (CHARS[charIndex('matheus')] || {}).art || 'img/estudantes/matheus-pixel.png'; }
          g.save(); g.translate(540, 170 + (1 - ease(pf)) * 80); g.rotate(0.07); g.globalAlpha = ease(pf);
          g.fillStyle = '#14181f'; g.fillRect(-62, -100, 124, 180); g.fillStyle = '#f6f2e8'; g.fillRect(-58, -96, 116, 172);
          if (this._mImg.complete && this._mImg.naturalWidth) { var iw = this._mImg.naturalWidth, ih = this._mImg.naturalHeight, ss = 108 / iw; g.drawImage(this._mImg, 0, 0, iw, 108 / 108 * 140 / ss, -54, -92, 108, 140); }
          this.txt('MATHEUS', 0, 64, 11, '#14181f', { weight: '700' });
          g.restore();
          if (tsx < 3.1) { g.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - (tsx - 2.6) / 0.5)).toFixed(2) + ')'; g.fillRect(0, 0, UW, UH); }
        }
      }
      if (ch === 'pedro') {                          // pista de dança já pronta no chão, piscando no ritmo
        var df = clamp((t - 0.2) / 0.6, 0, 1), dc = ['#2f7fe0', '#ff4fa3', '#58d6ff', '#ffd23a'], dk;
        g.save(); g.scale(2, 2); g.globalAlpha = df;
        for (dk = 0; dk < 14; dk++) {
          var lit = ((t * 3 + dk) | 0) % 4;
          g.fillStyle = '#14181f'; g.fillRect(70 + dk * 7 - 0.5, 146.5, 7.4, 8);
          g.fillStyle = dc[(dk + lit) % 4]; g.fillRect(70 + dk * 7, 147, 6.4, 7);
          g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(70 + dk * 7, 147, 6.4, 1.5);
          g.globalAlpha = df * 0.18; g.fillStyle = dc[(dk + lit) % 4]; g.fillRect(70 + dk * 7, 139, 6.4, 8); g.globalAlpha = df;
        }
        g.restore();
      }
      if (ch === 'pedro' && tsx > 0) {               // Pedro: toca a tuba, a capivara dança
        pose = tsx < 0.7 ? '' : 'up';
        var cp = clamp(tsx / 0.9, 0, 1), cwx = 190 + (108 - 190) * ease(cp), bt = Math.abs(Math.sin(tsx * 7)) * 6;
        this.drawPreview('capy', cwx, 150, tsx < 0.9 ? '' : (((tsx / 2) | 0) % 2 ? 'flex' : 'dance'), 1.15);
        if (tsx > 0.7) {
          var bx0 = (wx + 13 * sc) * 2, by0 = (150 - 42 * sc) * 2;
          for (k2 = 0; k2 < 4; k2++) {               // ondas sonoras saindo da tuba
            age = (tsx * 0.9 + k2 * 0.25) % 1; g.globalAlpha = (1 - age) * 0.8; g.strokeStyle = k2 % 2 ? '#ffd34d' : '#ffffff'; g.lineWidth = 3;
            g.beginPath(); g.arc(bx0, by0, 12 + age * 110, -0.8, 0.8); g.stroke(); g.globalAlpha = 1;
          }
        }
        for (i = 0; i < 2; i++) {                    // holofotes coloridos
          g.fillStyle = i ? 'rgba(255,90,140,0.10)' : 'rgba(90,200,255,0.10)'; g.beginPath(); g.moveTo(i ? UW - 250 : 250, 0); g.lineTo(cxu - 70 + i * 140 + Math.sin(t * 2 + i) * 20, 310); g.lineTo(cxu + 70 + i * 140 + Math.sin(t * 2 + i) * 20, 310); g.closePath(); g.fill();
        }
      }
      if (ch === 'davi' && tsx > 0) {                // Davi: círculo de runas e uma árvore que cresce do livro
        pose = 'flex';
        var gu = ease((tsx - 0.4) / 3.6);
        g.globalAlpha = 0.10 + 0.05 * Math.sin(t * 4); g.fillStyle = '#9ff0ff'; g.fillRect(cxu - 34, 0, 68, 304); g.globalAlpha = 1;
        for (i = 0; i < 22; i++) {
          ang = i * 0.2856 + tsx * 1.2; g.fillStyle = i % 3 === 0 ? '#ffd34d' : '#7fe8ff';
          g.fillRect(cxu + Math.cos(ang) * 78 * sc, 304 + Math.sin(ang) * 15 * sc, i % 3 === 0 ? 5 : 3, i % 3 === 0 ? 5 : 3);
        }
        if (gu > 0) {
          g.save(); g.scale(2, 2);
          g.fillStyle = '#4a3220'; g.fillRect(106, 150 - 30 * gu, 5, 30 * gu);
          g.fillStyle = '#3d9a4a'; for (k2 = 0; k2 < 5; k2++) { g.beginPath(); g.arc(108.5 + [0, -9, 9, -5, 6][k2] * gu, 150 - 32 * gu - [0, 4, 4, 11, 11][k2] * gu, (10 - (k2 > 2 ? 2 : 0)) * gu, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = '#62c46a'; g.beginPath(); g.arc(106 * 1 + 4 * gu, 150 - 40 * gu, 5 * gu, 0, Math.PI * 2); g.fill();
          if (gu > 0.95) { g.fillStyle = '#9ff0ff'; for (k2 = 0; k2 < 5; k2++) g.fillRect(100 + k2 * 4, 150 - 38 - ((k2 * 5) % 9), 2, 2); }
          g.restore();
        }
      }
      if (ch === 'capy' && tsx > 0) {                // capivara: dança, pula, dá cabeçada e espirra água
        var cph = (tsx % 4.5);
        pose = cph < 1.6 ? 'dance' : (cph < 3.0 ? 'flex' : (cph < 3.5 ? 'punch' : 'dance'));
        for (i = 0; i < 8; i++) {                    // gotas de água do lago
          age = (t * 0.9 + i * 0.125) % 1; g.globalAlpha = 1 - age; g.fillStyle = i % 2 ? '#9ff0ff' : '#ffffff';
          g.fillRect(wx * 2 - 40 + i * 14 + Math.sin(i) * 6, 292 - Math.sin(age * Math.PI) * 50, 4, 4);
        }
        g.globalAlpha = 1;
      }
      if (ch === 'capy' || ch === 'hero' || ch === 'heroina') {
        for (i = 0; i < 7; i++) {                    // corações e brilhos subindo
          age = (t * 0.5 + i * 0.14) % 1; g.globalAlpha = 1 - age; g.fillStyle = ch === 'capy' ? '#ff6a8a' : '#9ff0ff';
          g.fillRect(cxu - 50 + ((i * 41) % 100), 280 - age * 160, 6, 5); g.fillRect(cxu - 48 + ((i * 41) % 100), 276 - age * 160, 2, 2);
        }
        g.globalAlpha = 1;
      }
      if (mv > 0.9) {
        for (i = 0; i < 26; i++) {                  // confete
          var cx = ((i * 97) % 211) * 1.0 + 6, cy = ((t - 0.9) * (60 + (i % 5) * 14) + i * 41) % 380 - 10;
          g.fillStyle = ['#7dff3a', '#ffd34d', '#58d6ff', '#ff6a8a', '#ffffff'][i % 5];
          g.fillRect(cx + Math.sin(t * 3 + i) * 6, cy, 3, 5);
        }
        if (ch === 'pedro' || ch === 'matheus') for (i = 0; i < 6; i++) {   // notas musicais
          var nu = (t * 0.6 + i * 0.17) % 1, nx = 120 + i * 20 + Math.sin(nu * 6 + i) * 8, ny = 200 - nu * 130;
          g.globalAlpha = 1 - nu; g.fillStyle = '#ffd34d'; g.fillRect(nx, ny + 6, 6, 4); g.fillRect(nx + 5, ny - 6, 2, 14); g.fillRect(nx + 5, ny - 6, 6, 2); g.globalAlpha = 1;
        }
      }
    }
    var RW = null;
    if (RW && t > RW[0] - 0.3 && t < RW[1] + 0.4) this.buildRing(gwx * 2, sc, clamp(Math.min((t - RW[0] + 0.3) / 0.3, (RW[1] + 0.4 - t) / 0.4), 0, 1), t);
    this.drawPreview(ch, gwx, gwy, pose, ch === 'gois' && ts > 6.2 ? sc * (1 - 0.45 * ease((ts - 6.2) / 0.6)) : sc, grot);
    var nm = CHARS[charIndex(ch)].name, kp = ease((t - r.tp) / 0.9);
    if (t > 0.25 && t < 3.0) {                       // "NOME VENCE" gigante, como nas telas de vitória do Street Fighter
      var na = t < 0.7 ? (t - 0.25) / 0.45 : (t > 2.6 ? (3.0 - t) / 0.4 : 1), nk = ease((t - 0.25) / 0.45);
      g.globalAlpha = clamp(na, 0, 1) * (1 - kp);
      this.txt(nm, 410 + (1 - nk) * 120, 112, 54, '#ffffff', { outline: 10 });
      this.txt('VENCE', 410 + (1 - nk) * 160, 160, 54, '#ffd34d', { outline: 10 });
      g.globalAlpha = 1;
    }
    var ga = clamp(1 - kp, 0, 1);                    // etiqueta de resultado no canto
    if (t > 0.5 && ga > 0) {
      g.globalAlpha = ga * clamp((t - 0.5) / 0.3, 0, 1);
      g.fillStyle = 'rgba(8,16,30,0.78)'; g.fillRect(8, 30, 118, 44);
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(8, 30); g.lineTo(126, 30); g.lineTo(67, 74); g.closePath(); g.fill();
      this.txt('RESULTADO', 67, 42, 14, '#ffffff', { outline: 3 });
      this.txt('JOGADOR 1', 67, 58, 9, SOFT, { weight: '400', outline: 2 });
      this.txt('VITÓRIA', 67, 68, 11, '#ffd34d', { outline: 3 });
      g.globalAlpha = 1;
    }
    var QU = { felipe: 'Comer bem e desenhar o futuro. Tudo junto!', kauan: 'Hoje o peixe não escapa. A água limpa dá peixe!', matheus: 'Fechou! Deixa o like e a água limpa.', gois: 'Desmontei, montei de novo. Problema resolvido.', pedro: 'A poluição não aguenta um bom solo de tuba!', davi: 'Está tudo escrito: a natureza sempre vence.', boy: 'Nada me para quando eu tenho coragem!', capy: 'Calma e força. É assim que se protege a água.', hero: 'A Árvore Líquida está a salvo.', heroina: 'A água é vida. E eu protejo a água!' };
    var qs = QU[ch] || 'A Árvore Líquida está a salvo.';
    if (t > 1.2 && ga > 0) {                         // legenda digitando na parte de baixo
      var nc = Math.min(qs.length, Math.floor((t - 1.2) * 24));
      g.globalAlpha = ga;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, UH - 38, UW, 24);
      this.txt(qs.substr(0, nc), UW / 2, UH - 26, 13, '#ffffff', { outline: 3, weight: '400' });
      g.globalAlpha = 1;
    }
    if (t < 0.18) { g.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - t / 0.18)).toFixed(2) + ')'; g.fillRect(0, 0, UW, UH); }
  };

  Game.prototype.drawResult = function () {
    var g = this.ctx, r = this.result, i, t = this.stateT;
    if (!r) return;
    this.drawVictory(t);
    var kk = ease((t - r.tp) / 0.9);
    if (kk <= 0) {
      this.txt('toque ou ENTER para pular', UW / 2, UH - 8, 10, SOFT, { weight: '400', outline: 3 });
      return;
    }
    var w = 380, h = 338, x = UW - w - 8, y = 11 + Math.round((1 - kk) * (UH + 20));
    this.panel(x, y, w, h);
    var lx = x + 22;
    this.txt('Resultado do planeta', lx, y + 22, 12, SOFT, { align: 'left', weight: '400', outline: 3 });
    this.txt(Math.round(r.shown) + '%', lx, y + 56, 40, '#ffffff', { align: 'left', outline: 8 });
    var mc = r.score >= 65 ? LEAF : (r.score >= 45 ? GOLD : DANGER);
    this.bar(lx, y + 76, w - 44, 10, r.shown, mc);
    var rk = this.wrap(r.rank, 14, '700', 195);
    for (i = 0; i < rk.length; i++) this.txt(rk[i], lx + 140, y + 46 + i * 16, 14, GOLD, { align: 'left', outline: 3 });
    for (i = 0; i < r.bars.length; i++) {
      var bx = lx + (i % 2) * 180, by = y + 98 + ((i / 2) | 0) * 16;
      this.txt(r.bars[i][0], bx, by + 5, 12, SOFT, { align: 'left', weight: '400', outline: 3 });
      this.bar(bx + 48, by, 112, 8, r.bars[i][1], r.bars[i][2]);
    }
    this.txt('Árvore Líquida: ', lx, y + 138, 13, INK, { align: 'left', weight: '400', outline: 3 });
    this.txt(r.treeLabel, lx + this.measure('Árvore Líquida: ', 13, '400'), y + 138, 13, AQUA, { align: 'left', outline: 3 });
    this.txt('Poluição: ', lx, y + 155, 13, INK, { align: 'left', weight: '400', outline: 3 });
    this.txt(r.polLabel, lx + this.measure('Poluição: ', 13, '400'), y + 155, 13, AQUA, { align: 'left', outline: 3 });
    this.txt('Derrotados: ' + r.kills + '   Combo máx: ' + r.maxCombo, lx, y + 172, 11, SOFT, { align: 'left', weight: '400', outline: 3 });
    var ml = this.wrap(r.msg, 14, '700', w - 44);
    for (i = 0; i < ml.length; i++) this.txt(ml[i], lx, y + 194 + i * 17, 14, '#ffffff', { align: 'left', outline: 4 });
    var dy = y + 194 + ml.length * 17 + 12;
    this.txt('Suas decisões', lx, dy, 12, SOFT, { align: 'left', weight: '400', outline: 3 });
    dy += 17;
    for (i = 0; i < r.choices.length; i++) {
      this.txt((r.choices[i].good ? '+ ' : '- ') + r.choices[i].label, lx, dy, 13, r.choices[i].good ? LEAF : DANGER, { align: 'left', weight: '400', outline: 3 });
      dy += 15;
    }
    this.btn('JOGAR DE NOVO', lx, y + h - 46, 160, 36, 'play', true);
    this.btn('MENU PRINCIPAL', x + w - 22 - 160, y + h - 46, 160, 36, 'menu', false);
  };

  Game.prototype.drawTouch = function () {
    var defs = [['ESQ', 'hit_left', 12], ['BOLHA', 'dodge', 92], ['CIMA', 'hit_up', UW - 172], ['DIR', 'hit_right', UW - 92]];
    var g = this.ctx, i, d, y = UH - 78;
    for (i = 0; i < defs.length; i++) {
      d = defs[i];
      g.globalAlpha = 0.75;
      g.fillStyle = '#10263b';
      g.fillRect(d[2], y, 80, 64);
      g.strokeStyle = 'rgba(232,251,255,0.35)';
      g.lineWidth = 2;
      g.strokeRect(d[2] + 1, y + 1, 78, 62);
      this.txt(d[0], d[2] + 40, y + 33, 13, INK, { outline: 3 });
      g.globalAlpha = 1;
      this.touchBtns.push({ x: d[2], y: y, w: 80, h: 64, action: d[1] });
    }
  };

  /* ======================================================================
     6. ENTRADA
     ====================================================================== */

  Game.prototype.act = function (a) {
    if (this.state === 'decision') {
      if (a === 'hit_left') this.choose(0);
      else if (a === 'hit_right') this.choose(1);
      return;
    }
    if (a === 'hit_left') this.attack(-1);
    else if (a === 'hit_right') this.attack(1);
    else if (a === 'hit_up') this.attack(0);
    else if (a === 'dodge') this.dodge();
  };

  Game.prototype.doAction = function (action) {
    if (action.indexOf('pick:') === 0) { this.pickChar(charIndex(action.substr(5))); return; }
    switch (action) {
      case 'play': this.sfx('click'); this.startGame(); break;
      case 'howto': this.sfx('click'); this.setState('howto'); break;
      case 'chars': this.sfx('click'); this.setState('chars'); break;
      case 'secretGo': if (this.kReady) { this.kReady = false; this.kSeq = []; this.startSecret(); } break;
      case 'closeSecret': this.sfx('click'); this.setState((this.secret && this.secret.back) || 'menu'); this.secret = null; break;
      case 'grp0': case 'grp1': this.sfx('click'); this.charGroup = GROUPS[+action.charAt(3)].id; this.charPage = 0; break;
      case 'pgPrev': this.sfx('click'); this.charPage = Math.max(0, this.charPage - 1); break;
      case 'pgNext': this.sfx('click'); this.charPage++; break;
      case 'back': this.sfx('click'); this.setState('menu'); break;
      case 'menu': this.sfx('click'); this.goMenu(); break;
      case 'resume': this.sfx('click'); this.resume(); break;
      case 'opt0': this.choose(0); break;
      case 'opt1': this.choose(1); break;
      default: this.act(action);
    }
  };

  Game.prototype.togglePause = function () {
    if (COMBAT_STATES.indexOf(this.state) < 0) return;
    if (this.paused) this.resume(); else this.pause();
  };

  Game.prototype.pause = function () { this.paused = true; this.autoPaused = false; };
  Game.prototype.resume = function () { this.paused = false; this.autoPaused = false; this._audio(); };

  Game.prototype._keydown = function (e) {
    if (this.destroyed || !this.focused) return;
    var code = e.code || '';
    var key = (e.key || '').toLowerCase();
    var a = null, dir = null;
    if (code === 'ArrowUp' || code === 'KeyW') dir = 'up';
    else if (code === 'ArrowDown' || code === 'KeyS') dir = 'down';
    else if (code === 'ArrowLeft' || code === 'KeyA') dir = 'left';
    else if (code === 'ArrowRight' || code === 'KeyD') dir = 'right';
    if (this.state === 'secret') {
      if (code === 'Escape' || code === 'Enter' || code === 'Space') this.doAction('closeSecret');
      e.preventDefault();
      return;
    }
    if (this.kReady && (code === 'Enter' || code === 'NumpadEnter')) { e.preventDefault(); this.kReady = false; this.kSeq = []; this.startSecret(); return; }
    if (this.kReady && code === 'Escape') { e.preventDefault(); this.kReady = false; this.kSeq = []; this.kIdx = 0; return; }
    if (dir && !e.repeat && this.feedSecret(dir)) { e.preventDefault(); return; }
    if (this.state === 'secret') { e.preventDefault(); return; }
    if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') a = 'hit_left';
    else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') a = 'hit_right';
    else if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') a = 'hit_up';
    else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') a = 'dodge';

    if (code === 'KeyM' || key === 'm') {
      this.muted = !this.muted;
      this.showBanner(this.muted ? 'SOM DESLIGADO' : 'SOM LIGADO', '', 1.0);
      e.preventDefault();
      return;
    }
    if (code === 'Escape' || code === 'KeyP' || key === 'escape' || key === 'p') {
      if (this.state === 'howto' || this.state === 'chars') this.setState('menu');
      else this.togglePause();
      e.preventDefault();
      return;
    }
    if (code === 'Enter' || code === 'Space' || key === 'enter' || key === ' ') {
      if (this.state === 'poseprev') { this.setState('menu'); e.preventDefault(); return; }
      if (this.state === 'result' && this.result && this.stateT < this.result.tp) { this.stateT = this.result.tp; e.preventDefault(); return; }
      if (this.state === 'menu' || this.state === 'over' || this.state === 'result') { this.startGame(); this.sfx('click'); }
      else if (this.state === 'howto' || this.state === 'chars') this.startGame();
      e.preventDefault();
      return;
    }
    if (this.state === 'chars' && (a === 'hit_left' || a === 'hit_right')) {
      e.preventDefault();
      this.pickChar(charIndex(this.charId) + (a === 'hit_left' ? -1 : 1));
      return;
    }
    if (!a) return;
    e.preventDefault();          // impede o scroll da página com as setas
    if (e.repeat) return;
    if (this.state === 'decision' || this.combatActive()) this.act(a);
  };

  Game.prototype._pointer = function (e, kind) {
    if (this.destroyed) return;
    var rect = this.canvas.getBoundingClientRect();
    if (!rect.width) return;
    var x = (e.clientX - rect.left) * (UW / rect.width);
    var y = (e.clientY - rect.top) * (UH / rect.height);
    this.pointer.x = x;
    this.pointer.y = y;
    if (kind === 'up') { this.pointer.down = false; this._swipe(x, y); return; }
    if (kind === 'move') return;

    // pointerdown
    this.focused = true;
    if (this.canvas.focus) this.canvas.focus();
    this._audio();
    e.preventDefault();
    this.pointer.down = true;
    this._sw = { x: x, y: y };
    var i, b;
    if (this.state === 'poseprev') { this.setState('menu'); return; }
    if (this.state === 'result' && this.result && this.stateT < this.result.tp) { this.stateT = this.result.tp; return; }
    for (i = 0; i < this.touchBtns.length; i++) {
      b = this.touchBtns[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { this.act(b.action); return; }
    }
    for (i = 0; i < this.buttons.length; i++) {
      b = this.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { this.doAction(b.action); return; }
    }
    if (this.paused && this.autoPaused) this.resume();
  };

  /* ======================================================================
     7. API PÚBLICA
     ====================================================================== */

  var instance = null;

  var api = {
    mount: function (el, opts) {
      if (typeof el === 'string') el = document.querySelector(el);
      if (!el) throw new Error('BioPulse.mount: elemento não encontrado.');
      if (instance) api.destroy();
      instance = new Game(el, opts || {});
      return api;
    },
    destroy: function () {
      if (instance) { instance.destroy(); instance = null; }
      return api;
    },
    previewVictory: function (id) { if (instance) instance.previewVictory(id); return api; },
    previewPoses: function (id) { if (instance) instance.previewPoses(id); return api; },
    pause: function () { if (instance) instance.pause(); return api; },
    resume: function () { if (instance) instance.resume(); return api; },
    setVillain: function (on) { if (instance) instance.setVillain(on); return api; },
    get running() { return !!instance; }
  };

  window.BioPulse = api;
})();

