/*!
 * BioPulse · Guardião da Árvore Líquida — AquaVita
 * Jogo 2D em JavaScript puro. Sem dependências, sem arquivos externos, sem rede.
 * Arte desenhada em código no canvas (pixel art procedural) e som sintetizado com WebAudio.
 *
 * API:
 *   BioPulse.mount(el, opts)   opts = { onState(s), onEnd(r), onSabotage(s), villain, autoStart, muted }
 *   BioPulse.setVillain(true|false)   liga/desliga o modo VilãoIA (tecnologia sem ética)
 *   BioPulse.destroy()
 *   BioPulse.pause() / BioPulse.resume()
 *
 * onState({ health, pollution, phase })  health = saúde da Árvore Líquida (0-100)
 *                                        pollution = nível de poluição (0-100)
 *                                        phase = 'ok' | 'risk' | 'bad'
 * onEnd({ won })                         won = true se o Titã foi derrotado
 *
 * ## MAPA DIDÁTICO DO JOGO
 * - Game(): cria a instância principal, prepara o canvas e inicia o ciclo.
 * - _build() / _resize(): montam e adaptam a área do jogo à tela.
 * - update*(): calculam movimento, colisões, inimigos e estado ambiental.
 * - draw*(): desenham cenário, personagens, interface e efeitos no canvas.
 * - startWave(), choose() e attack(): respondem às decisões e ações do jogador.
 * - _end() e showResult(): finalizam a partida e enviam o resultado ao site.
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

  /* ## Função Game: "construtor" que reúne estado, canvas, eventos e animação. */
  function Game(el, opts) {
    this.host = el;
    this.opts = opts || {};
    this.villain = !!(opts && opts.villain);
    this.destroyed = false;
    this._build();
    this._initWorldLayout();
    this.reset(true);
    this.setState('menu');
    this._loop = this._frame.bind(this);
    this.raf = requestAnimationFrame(this._loop);
    if (this.opts.autoStart) this.startGame();
  }

  /* ---------------- montagem, canvas, eventos ---------------- */

  /* ## _build: cria o canvas, registra teclado/toque e prepara controles. */
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
    this.hero.dodge = 0;
    this.shake = 8;
    this.sfx('lose');
    this.overSub = cause === 'tree' ? 'A Árvore Líquida secou. A poluição tomou conta.' : 'Você não conseguiu proteger o planeta.';
    this.setState('dying');
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
      choices: s.choices.slice(), kills: s.kills, maxCombo: s.maxCombo
    };
    this.sfx(score >= 50 ? 'win' : 'lose');
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
    if (this.result && this.result.shown < this.result.score) {
      this.result.shown = Math.min(this.result.score, this.result.shown + dt * 90);
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

  Game.prototype.drawSky = function () {
    var s = this.vis.sky, y, k;
    for (y = 0; y < GY; y += 5) {
      k = y / GY;
      this.R(0, y, W, 5, mix(mix('#35363f', '#a08a68', k), mix('#2e7ed8', '#b5f0ff', k), s));
    }
    var g = this.ctx;
    g.globalAlpha = 0.12 + s * 0.3;
    this.disc(62, 36, 17, '#fff3c4');
    g.globalAlpha = 1;
    this.disc(62, 36, 10, mix('#b09062', '#fff6c9', s));
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
    if (s < 0.55) {
      g.globalAlpha = (0.55 - s) * 1.2;
      this.R(0, 0, W, 24, '#4a443a');
      g.globalAlpha *= 0.5;
      this.R(0, 24, W, 12, '#4a443a');
      g.globalAlpha = 1;
    }
  };

  Game.prototype.drawMountains = function () {
    var far = mix('#5d5850', '#5b9fc4', this.vis.sky), farL = mix('#6d685e', '#9ad8ee', this.vis.sky);
    var near = mix('#4e4a3c', '#35925f', this.vis.green), nearL = mix('#615b48', '#5ccc84', this.vis.green);
    var x, y;
    for (x = 0; x < W; x++) { y = this.mtnFar[x] | 0; this.R(x, y, 1, GY - y, far); this.R(x, y, 1, 1, farL); }
    for (x = 0; x < W; x++) { y = this.mtnNear[x] | 0; this.R(x, y, 1, GY - y, near); this.R(x, y, 1, 1, nearL); }
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
    var crouch = h.dodge > 0 || h.down;
    var punch = h.actT > 0 && h.act === 'punch';
    var up = (h.actT > 0 && h.act === 'up') || h.win;
    var lx = punch ? h.dir * 3 : 0;
    var by = crouch ? 6 : (Math.sin(t * 4) > 0.2 ? 1 : 0);
    var hy = by, i, wv, top, ln;

    this.R(CX + lx - 15, GY - 1, 30, 2, 'rgba(0,0,0,0.28)');

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

    var fl = h.hurt > 0 && (((t * 20) | 0) % 2 === 0);
    this.sprite(CX + lx, GY, h.face, P, D, fl, h.down ? 0.75 : 1);

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
    if (h.dodge > 0) {                              // bolha d'água
      g.globalAlpha = 0.22;
      this.disc(CX, GY - 30, 34, '#7fe8ff');
      g.globalAlpha = 0.9;
      g.strokeStyle = '#c8f8ff';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(CX, GY - 30, 34, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 0.8;
      this.disc(CX - 14, GY - 46, 3, '#ffffff');
      g.globalAlpha = 1;
    }
  };

  /* ---------------- inimigos ---------------- */

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
    this.drawSky();
    this.drawClouds();
    this.drawMountains();
    this.drawSlots();
    this.drawParticles(this.bgFx);
    this.drawTree();
    this.drawGround();
    this.drawRiver();
    var i;
    for (i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) this.drawEnemy(this.enemies[i]);
    if (this.boss) this.drawBoss();
    this.drawHero();
    this.drawParticles(this.fx);
    for (i = 0; i < this.texts.length; i++) {
      var tx = this.texts[i];
      g.globalAlpha = clamp(tx.life / tx.max * 2, 0, 1);
      this.wtext(tx.s, tx.x, tx.y, tx.c, 8);
      g.globalAlpha = 1;
    }
    g.fillStyle = 'rgba(62,52,34,' + (this.vis.ind * 0.17).toFixed(3) + ')';
    g.fillRect(-20, -20, W + 40, H + 40);

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
    if (st === 'menu') { this.drawMenu(); return; }
    if (st === 'howto') { this.drawHowto(); return; }
    this.drawHUD();
    if (st === 'decision') this.drawDecision();
    if (st === 'conseq' && this.conseq) this.drawConseq();
    if (st === 'over') this.drawOver();
    if (st === 'result') this.drawResult();
    if (this.banner) this.drawBanner();
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
    var g = this.ctx;
    var grd = g.createLinearGradient(0, 0, 0, UH);
    grd.addColorStop(0, 'rgba(4,10,20,0.8)');
    grd.addColorStop(0.45, 'rgba(4,10,20,0)');
    grd.addColorStop(0.72, 'rgba(4,10,20,0)');
    grd.addColorStop(1, 'rgba(4,10,20,0.7)');
    g.fillStyle = grd;
    g.fillRect(0, 0, UW, UH);
    this.txt('BIOPULSE', UW / 2, 62, 56, INK, { outline: 12 });
    g.globalAlpha = 0.9;
    this.drawPulseLine(UW / 2 - 160, 88, 320, 24);
    g.globalAlpha = 1;
    this.drawDropIcon(UW / 2 - 78, 118);
    this.txt('AQUAVITA', UW / 2 + 10, 128, 20, AQUA, { outline: 6 });
    this.txt('Proteger. Escolher. Transformar.', UW / 2, 258, 20, INK, { outline: 6 });
    this.btn('JOGAR', UW / 2 - 186, 288, 180, 40, 'play', true);
    this.btn('COMO JOGAR', UW / 2 + 6, 288, 180, 40, 'howto', false);
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

  Game.prototype.drawResult = function () {
    var g = this.ctx, r = this.result, i;
    if (!r) return;
    g.fillStyle = 'rgba(4,10,20,0.55)';
    g.fillRect(0, 0, UW, UH);
    var w = 590, h = 300, x = (UW - w) / 2, y = (UH - h) / 2;
    this.panel(x, y, w, h);
    var lx = x + 26, rx = x + 250;
    this.txt('Resultado do planeta', lx, y + 26, 13, SOFT, { align: 'left', weight: '400', outline: 3 });
    this.txt(Math.round(r.shown) + '%', lx, y + 62, 44, '#ffffff', { align: 'left', outline: 8 });
    var mc = r.score >= 65 ? LEAF : (r.score >= 45 ? GOLD : DANGER);
    this.bar(lx, y + 88, 190, 10, r.shown, mc);
    var rk = this.wrap(r.rank, 14, '700', 190);
    for (i = 0; i < rk.length; i++) this.txt(rk[i], lx, y + 112 + i * 16, 14, GOLD, { align: 'left', outline: 3 });
    var by = y + 148;
    for (i = 0; i < r.bars.length; i++) {
      this.txt(r.bars[i][0], lx, by + 5, 13, SOFT, { align: 'left', weight: '400', outline: 3 });
      this.bar(lx + 56, by, 134, 8, r.bars[i][1], r.bars[i][2]);
      by += 16;
    }
    this.txt('Árvore Líquida: ', rx, y + 30, 16, INK, { align: 'left', weight: '400', outline: 3 });
    this.txt(r.treeLabel, rx + this.measure('Árvore Líquida: ', 16, '400'), y + 30, 16, AQUA, { align: 'left', outline: 3 });
    this.txt('Poluição: ', rx, y + 52, 16, INK, { align: 'left', weight: '400', outline: 3 });
    this.txt(r.polLabel, rx + this.measure('Poluição: ', 16, '400'), y + 52, 16, AQUA, { align: 'left', outline: 3 });
    var ml = this.wrap(r.msg, 17, '700', 300);
    for (i = 0; i < ml.length; i++) this.txt(ml[i], rx, y + 82 + i * 20, 17, '#ffffff', { align: 'left', outline: 4 });
    this.txt('Suas decisões', rx, y + 82 + ml.length * 20 + 14, 13, SOFT, { align: 'left', weight: '400', outline: 3 });
    var dy = y + 82 + ml.length * 20 + 34;
    for (i = 0; i < r.choices.length; i++) {
      this.txt((r.choices[i].good ? '+ ' : '- ') + r.choices[i].label, rx, dy, 14, r.choices[i].good ? LEAF : DANGER, { align: 'left', weight: '400', outline: 3 });
      dy += 17;
    }
    this.txt('Poluentes derrotados: ' + r.kills + '     Combo máximo: ' + r.maxCombo, rx, dy + 8, 12, SOFT, { align: 'left', weight: '400', outline: 3 });
    this.btn('JOGAR DE NOVO', UW / 2 - 186, y + h - 50, 180, 40, 'play', true);
    this.btn('MENU PRINCIPAL', UW / 2 + 6, y + h - 50, 180, 40, 'menu', false);
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
    switch (action) {
      case 'play': this.sfx('click'); this.startGame(); break;
      case 'howto': this.sfx('click'); this.setState('howto'); break;
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
    var a = null;
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
      if (this.state === 'howto') this.setState('menu');
      else this.togglePause();
      e.preventDefault();
      return;
    }
    if (code === 'Enter' || code === 'Space' || key === 'enter' || key === ' ') {
      if (this.state === 'menu' || this.state === 'over' || this.state === 'result') { this.startGame(); this.sfx('click'); }
      else if (this.state === 'howto') this.startGame();
      e.preventDefault();
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
    if (kind === 'up') { this.pointer.down = false; return; }
    if (kind === 'move') return;

    // pointerdown
    this.focused = true;
    if (this.canvas.focus) this.canvas.focus();
    this._audio();
    e.preventDefault();
    this.pointer.down = true;
    var i, b;
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
    pause: function () { if (instance) instance.pause(); return api; },
    resume: function () { if (instance) instance.resume(); return api; },
    setVillain: function (on) { if (instance) instance.setVillain(on); return api; },
    get running() { return !!instance; }
  };

  window.BioPulse = api;
})();

