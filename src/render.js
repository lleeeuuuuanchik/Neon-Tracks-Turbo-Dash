/**
 * Отрисовка гонки на Canvas.
 * Top-down flat вид: дорога — прямоугольник, объекты — без перспективной проекции.
 * Мягкое уменьшение объектов у верха экрана через _sizeScale(y).
 */
var Render = {
  canvas: null,
  ctx: null,
  scale: 1,

  // Кэш геометрии (заполняется в resizeToWindow)
  _geo: null,
  // Кэш градиентов (создаются один раз)
  _gradients: null,

  images: {
    playerCars: {},
    obstacles: {},
    trafficCars: {},
  },

  init: function (canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this._loadImages();
    this.resizeToWindow();
  },

  _loadImages: function () {
    var i;
    for (i = 0; i < CONFIG.CARS.length; i++) {
      var car = CONFIG.CARS[i];
      this._loadImage(this.images.playerCars, car.id, car.sprite);
    }
    for (i = 0; i < CONFIG.OBSTACLE_TYPES.length; i++) {
      var ob = CONFIG.OBSTACLE_TYPES[i];
      this._loadImage(this.images.obstacles, ob.type, ob.sprite);
    }
    for (i = 0; i < CONFIG.TRAFFIC_SPRITES.length; i++) {
      var src = CONFIG.TRAFFIC_SPRITES[i];
      this._loadImage(this.images.trafficCars, src, src);
    }
    for (i = 0; i < CONFIG.MOTORCYCLE_SPRITES.length; i++) {
      var msrc = CONFIG.MOTORCYCLE_SPRITES[i];
      this._loadImage(this.images.trafficCars, msrc, msrc);
    }
  },

  _loadImage: function (collection, key, src) {
    var img = new Image();
    img.src = src;
    collection[key] = img;
  },

  resizeToWindow: function () {
    if (!this.canvas) return;
    var parent = this.canvas.parentElement;
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (parent) {
      var rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
    }
    var targetRatio = CONFIG.WORLD_WIDTH / CONFIG.WORLD_HEIGHT;
    var screenRatio = w / h;

    if (screenRatio > targetRatio) {
      this.canvas.height = h;
      this.canvas.width = h * targetRatio;
    } else {
      this.canvas.width = w;
      this.canvas.height = w / targetRatio;
    }

    this.scale = this.canvas.width / CONFIG.WORLD_WIDTH;
    this._rebuildGeo();
    this._rebuildGradients();
  },

  // Геометрия плоской дороги
  _rebuildGeo: function () {
    var WW = CONFIG.WORLD_WIDTH;
    var WH = CONFIG.WORLD_HEIGHT;
    var roadWidth = WW * (CONFIG.ROAD_WIDTH_RATIO || 0.40);
    var roadX = (WW - roadWidth) / 2;   // широкая обочина для сценери

    this._geo = {
      WW: WW,
      WH: WH,
      roadWidth: roadWidth,
      roadX: roadX,
      roadRightX: roadX + roadWidth,
    };
  },

  // Кэшированные градиенты
  _rebuildGradients: function () {
    if (!this.ctx || !this._geo) return;
    var ctx = this.ctx;
    var g = this._geo;

    // Фоновый градиент неба / горизонта
    var bgGrad = ctx.createLinearGradient(0, 0, 0, g.WH);
    bgGrad.addColorStop(0,    '#050518');
    bgGrad.addColorStop(0.35, '#0a1030');
    bgGrad.addColorStop(1,    '#020210');

    // Обочина — зелёный градиент
    var shoulderGrad = ctx.createLinearGradient(0, 0, 0, g.WH);
    shoulderGrad.addColorStop(0,   '#061206');
    shoulderGrad.addColorStop(0.5, '#0a1a0a');
    shoulderGrad.addColorStop(1,   '#061206');

    // Асфальт — тёмно-серый с лёгким синим отливом
    var roadGrad = ctx.createLinearGradient(g.roadX, 0, g.roadRightX, 0);
    roadGrad.addColorStop(0,    '#0d1117');
    roadGrad.addColorStop(0.15, '#111620');
    roadGrad.addColorStop(0.5,  '#141920');
    roadGrad.addColorStop(0.85, '#111620');
    roadGrad.addColorStop(1,    '#0d1117');

    this._gradients = {
      bg: bgGrad,
      shoulder: shoulderGrad,
      road: roadGrad,
    };
  },

  // Мягкое уменьшение: объекты у верха чуть меньше (0.72 вверху → 1.0 внизу)
  _sizeScale: function (gameY) {
    var t = Math.max(0, Math.min(1, gameY / CONFIG.WORLD_HEIGHT));
    return 0.72 + 0.28 * t;
  },

  clear: function () {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  drawAll: function () {
    if (!this.ctx || !this.canvas) return;
    this.clear();
    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);
    this._drawBackground();
    this._drawRoad();
    this._drawDecorations();
    this._drawObstacles();
    this._drawTraffic();
    this._drawPickups();
    this._drawPlayer();
    this._drawParticles();
    this._drawFeverOverlay();
    this.ctx.restore();
  },

  _drawBackground: function () {
    var g = this._geo;
    if (!g || !this._gradients) return;
    this.ctx.fillStyle = this._gradients.bg;
    this.ctx.fillRect(0, 0, g.WW, g.WH);
  },

  _drawRoad: function () {
    var ctx = this.ctx;
    var g = this._geo;
    if (!g || !this._gradients) return;
    var offset = Game.roadOffset || 0;
    var laneCount = Game.laneCountCurrent || CONFIG.LANE_COUNT;

    // Обочины
    ctx.fillStyle = this._gradients.shoulder;
    ctx.fillRect(0,          0, g.roadX,            g.WH);
    ctx.fillRect(g.roadRightX, 0, g.WW - g.roadRightX, g.WH);

    // Декоративная трава (точки на обочине)
    ctx.fillStyle = 'rgba(34,197,94,0.08)';
    for (var gy = -(offset % 40); gy < g.WH + 40; gy += 40) {
      ctx.fillRect(0,          gy, g.roadX,            2);
      ctx.fillRect(g.roadRightX, gy, g.WW - g.roadRightX, 2);
    }

    // Асфальт
    ctx.fillStyle = this._gradients.road;
    ctx.fillRect(g.roadX, 0, g.roadWidth, g.WH);

    // Блик на асфальте
    ctx.fillStyle = 'rgba(148,163,253,0.04)';
    ctx.fillRect(g.roadX + g.roadWidth * 0.4, 0, g.roadWidth * 0.2, g.WH);

    // Неоновые края дороги
    ctx.save();
    ctx.shadowColor = 'rgba(103,232,249,0.8)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(103,232,249,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.roadX, 0);
    ctx.lineTo(g.roadX, g.WH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.roadRightX, 0);
    ctx.lineTo(g.roadRightX, g.WH);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Разметка полос (пунктир, скроллится)
    var laneW = g.roadWidth / laneCount;
    ctx.save();
    ctx.setLineDash([26, 22]);
    ctx.lineDashOffset = -(offset % 48);
    ctx.strokeStyle = 'rgba(148,163,253,0.55)';
    ctx.lineWidth = 1.5;
    for (var i = 1; i < laneCount; i++) {
      var lx = g.roadX + laneW * i;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, g.WH);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  },

  _drawDecorations: function () {
    var ctx = this.ctx;
    var g = this._geo;
    if (!g) return;
    ctx.save();
    for (var i = 0; i < Game.decorations.length; i++) {
      var d = Game.decorations[i];
      var s = this._sizeScale(d.y);
      var w = d.width * s;
      var h = d.height * s;
      var vx = d.x;
      var vy = d.y;
      var topY = vy - h;

      // Здание: градиент снизу вверх
      var r, gr;
      if (d.colorVariant === 1) {
        r = ctx.createLinearGradient(vx, topY, vx, vy);
        r.addColorStop(0, 'rgba(15,23,42,0.95)');
        r.addColorStop(1, 'rgba(37,99,235,0.55)');
        gr = r;
      } else if (d.colorVariant === 2) {
        r = ctx.createLinearGradient(vx, topY, vx, vy);
        r.addColorStop(0, 'rgba(15,23,42,0.95)');
        r.addColorStop(1, 'rgba(236,72,153,0.5)');
        gr = r;
      } else {
        r = ctx.createLinearGradient(vx, topY, vx, vy);
        r.addColorStop(0, 'rgba(15,23,42,0.95)');
        r.addColorStop(1, 'rgba(129,140,248,0.5)');
        gr = r;
      }
      ctx.fillStyle = gr;
      ctx.fillRect(vx - w / 2, topY, w, h);
      ctx.strokeStyle = 'rgba(148,163,253,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx - w / 2 + 0.5, topY + 0.5, w - 1, h - 1);

      // Окна
      var rows = d.windowRows || 6;
      var cols = d.windowCols || 2;
      var mask = d.windowMask || [];
      var winW = 4 * s;
      var winH = 6 * s;
      var innerH = h - 14 * s;
      ctx.fillStyle = 'rgba(248,250,252,0.85)';
      for (var rr = 0; rr < rows; rr++) {
        for (var cc = 0; cc < cols; cc++) {
          var idx = rr * cols + cc;
          if (!mask[idx]) continue;
          var wx = vx - w / 2 + 5 * s + cc * (w - 10 * s - winW);
          var wy = topY + 8 * s + rr * (innerH / rows);
          ctx.fillRect(wx, wy, winW, winH);
        }
      }
    }
    ctx.restore();
  },

  _drawPlayer: function () {
    if (!Game.player) return;
    var p = Game.player;
    var img = this.images.playerCars[p.carId] || null;
    var ctx = this.ctx;
    ctx.save();

    var shakeX = 0, shakeY = 0;
    if (Game.lastCrashTime) {
      var now = performance.now ? performance.now() : Date.now();
      var t = (now - Game.lastCrashTime) / 200;
      if (t < 1) {
        var intensity = (1 - t) * 6;
        shakeX = (Math.random() - 0.5) * intensity;
        shakeY = (Math.random() - 0.5) * intensity;
      }
    }

    ctx.translate(p.x + shakeX, p.y + shakeY);

    // Дрифт — лёгкий наклон
    if (p.drifting && p.driftDir) {
      ctx.rotate(p.driftDir * 0.14);
    }

    // Свечение
    if (p.feverMode) {
      ctx.shadowColor = CONFIG.COLORS.fever;
      ctx.shadowBlur = 28;
    } else if (p.slipstream) {
      ctx.shadowColor = 'rgba(103,232,249,0.9)';
      ctx.shadowBlur = 22;
    } else if (Game.nitroActive) {
      ctx.shadowColor = CONFIG.COLORS.accent;
      ctx.shadowBlur = 32;
      ctx.scale(1.02, 1.06);
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(148,163,253,0.6)';
    }

    var maxW = p.width;
    var maxH = p.height;

    if (img && img.complete && img.naturalWidth) {
      var iw = img.width;
      var ih = img.height;
      var sc = Math.min(maxW / iw, maxH / ih);
      var dw = iw * sc;
      var dh = ih * sc;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      ctx.fillStyle = CONFIG.COLORS.primary;
      ctx.fillRect(-maxW / 2, -maxH / 2, maxW, maxH);
    }

    // Магнит-кольцо
    if (p.magnetActive) {
      var now2 = performance.now ? performance.now() : Date.now();
      var angle = (now2 * 0.003) % (Math.PI * 2);
      var mr = CONFIG.MAGNET_RADIUS * 0.5;
      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = 'rgba(251,191,36,0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, mr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore();
  },

  _drawTraffic: function () {
    var ctx = this.ctx;
    ctx.save();
    for (var i = 0; i < Game.traffic.length; i++) {
      var car = Game.traffic[i];
      var img = car.sprite ? this.images.trafficCars[car.sprite] : null;
      var s = this._sizeScale(car.y);
      var maxW = car.width * s;
      var maxH = car.height * s;

      ctx.shadowColor = 'rgba(255,107,157,0.25)';
      ctx.shadowBlur = 5 * s;

      if (img && img.complete && img.naturalWidth) {
        var iw = img.width;
        var ih = img.height;
        var sc = Math.min(maxW / iw, maxH / ih);
        var dw = iw * sc;
        var dh = ih * sc;
        ctx.drawImage(img, car.x - dw / 2, car.y - dh / 2, dw, dh);
      } else {
        ctx.fillStyle = 'rgba(100,100,120,0.9)';
        ctx.fillRect(car.x - maxW / 2, car.y - maxH / 2, maxW, maxH);
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  _drawObstacles: function () {
    var ctx = this.ctx;
    ctx.save();
    for (var i = 0; i < Game.obstacles.length; i++) {
      var ob = Game.obstacles[i];
      var img = this.images.obstacles[ob.type];
      var s = this._sizeScale(ob.y);
      var w = ob.width * s;
      var h = ob.height * s;

      // Красный эффект свечения
      ctx.shadowColor = ob.severe ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,0.7)';
      ctx.shadowBlur = (ob.severe ? 18 : 12) * s;

      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, ob.x - w / 2, ob.y - h / 2, w, h);
      } else {
        ctx.fillStyle = ob.severe ? CONFIG.COLORS.crash : CONFIG.COLORS.secondary;
        ctx.fillRect(ob.x - w / 2, ob.y - h / 2, w, h);
      }

      // Урон броне
      var dmg = ob.severe ? CONFIG.HEAVY_CRASH_ARMOR_DAMAGE : CONFIG.LIGHT_CRASH_ARMOR_DAMAGE;
      ctx.shadowBlur = 0;
      ctx.fillStyle = ob.severe ? 'rgba(248,113,113,1)' : 'rgba(248,113,113,0.9)';
      ctx.font = 'bold ' + Math.round(9 * s) + 'px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('-' + dmg + ' ' + LANG.t('dmg_armor'), ob.x, ob.y + h / 2 + 2 * s);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  _drawPickups: function () {
    if (!Game.pickups || !Game.pickups.length) return;
    var ctx = this.ctx;
    ctx.save();
    var now = performance.now ? performance.now() : Date.now();
    for (var i = 0; i < Game.pickups.length; i++) {
      var pk = Game.pickups[i];
      var s = this._sizeScale(pk.y);
      var pulse = 0.85 + 0.15 * Math.sin(now * 0.004 + i * 1.3);
      var vx = pk.x;
      var vy = pk.y;

      var pkLabel = '';
      var pkLabelY = 0;

      if (pk.kind === 'shield') {
        // Синий щит — восьмиугольник
        ctx.shadowColor = 'rgba(103,232,249,0.8)';
        ctx.shadowBlur = 14 * s;
        ctx.fillStyle = 'rgba(59,130,246,' + (0.7 * pulse) + ')';
        ctx.strokeStyle = 'rgba(147,197,253,0.9)';
        ctx.lineWidth = 2 * s;
        var r = 14 * s * pulse;
        ctx.beginPath();
        for (var a = 0; a < 8; a++) {
          var ang = (Math.PI / 4) * a - Math.PI / 8;
          if (a === 0) ctx.moveTo(vx + Math.cos(ang) * r, vy + Math.sin(ang) * r);
          else          ctx.lineTo(vx + Math.cos(ang) * r, vy + Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.round(13 * s) + 'px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', vx, vy);
        pkLabel = LANG.t('pickup_shield');
        pkLabelY = vy + r + 5 * s;

      } else if (pk.kind === 'nitro') {
        // Голубой ромб
        ctx.shadowColor = 'rgba(103,232,249,0.9)';
        ctx.shadowBlur = 14 * s;
        ctx.fillStyle = 'rgba(103,232,249,' + (0.75 * pulse) + ')';
        ctx.strokeStyle = 'rgba(207,250,254,0.9)';
        ctx.lineWidth = 2 * s;
        var rn = 14 * s * pulse;
        ctx.beginPath();
        ctx.moveTo(vx, vy - rn);
        ctx.lineTo(vx + rn * 0.6, vy);
        ctx.lineTo(vx, vy + rn);
        ctx.lineTo(vx - rn * 0.6, vy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.round(11 * s) + 'px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', vx, vy);
        pkLabel = LANG.t('pickup_nitro');
        pkLabelY = vy + rn + 5 * s;

      } else if (pk.kind === 'coin') {
        // Золотая монета
        ctx.shadowColor = 'rgba(103,232,249,0.6)';
        ctx.shadowBlur = 10 * s;
        ctx.fillStyle = 'rgba(251,191,36,' + (0.9 * pulse) + ')';
        var rc = 9 * s * pulse;
        ctx.beginPath();
        ctx.arc(vx, vy, rc, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.round(8 * s) + 'px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', vx, vy);
        pkLabel = LANG.t('pickup_coins');
        pkLabelY = vy + rc + 5 * s;

      } else if (pk.kind === 'magnet') {
        // Жёлтый магнит — круг с иконкой
        ctx.shadowColor = 'rgba(103,232,249,0.8)';
        ctx.shadowBlur = 16 * s;
        ctx.fillStyle = 'rgba(251,191,36,' + (0.8 * pulse) + ')';
        ctx.strokeStyle = 'rgba(255,236,153,0.9)';
        ctx.lineWidth = 2 * s;
        var rm = 14 * s * pulse;
        ctx.beginPath();
        ctx.arc(vx, vy, rm, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Вращающееся кольцо вокруг
        var mAngle = (now * 0.002) % (Math.PI * 2);
        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(mAngle);
        ctx.strokeStyle = 'rgba(103,232,249,0.6)';
        ctx.lineWidth = 1.5 * s;
        ctx.setLineDash([5 * s, 5 * s]);
        ctx.beginPath();
        ctx.arc(0, 0, rm + 6 * s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.round(13 * s) + 'px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', vx, vy);
        pkLabel = LANG.t('pickup_magnet');
        pkLabelY = vy + rm + 11 * s;
      }

      // Подпись под пикапом
      if (pkLabel) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(147,197,253,0.9)';
        ctx.font = 'bold ' + Math.round(8 * s) + 'px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(pkLabel, vx, pkLabelY);
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  _drawParticles: function () {
    if (!Game.particles.length) return;
    var ctx = this.ctx;
    ctx.save();
    ctx.shadowBlur = 0;
    for (var i = 0; i < Game.particles.length; i++) {
      var p = Game.particles[i];
      var alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // Fever-оверлей: пульсирующая рамка экрана
  _drawFeverOverlay: function () {
    if (!Game.player || !Game.player.feverMode) return;
    var ctx = this.ctx;
    var g = this._geo;
    if (!g) return;
    var now = performance.now ? performance.now() : Date.now();
    var pulse = 0.4 + 0.35 * Math.abs(Math.sin(now * 0.006));

    ctx.save();
    ctx.strokeStyle = 'rgba(245,158,11,' + pulse + ')';
    ctx.lineWidth = 8;
    ctx.shadowColor = CONFIG.COLORS.fever;
    ctx.shadowBlur = 20;
    ctx.strokeRect(4, 4, g.WW - 8, g.WH - 8);
    ctx.shadowBlur = 0;
    ctx.restore();
  },
};
