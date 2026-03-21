/**
 * Игровая логика гонки «Неоновые трассы».
 */
var Game = {
  // Состояние игры
  state: 'menu', // menu | running | paused | gameover

  // Режим
  mode: 'classic',
  timeRemaining: null,

  // Текущий заезд
  distance: 0,
  coinsRun: 0,
  overtakes: 0,
  closeOvertakes: 0,
  nitroCharge: 0,
  nitroActive: false,
  nitroUses: 0,
  gasHeld: false,
  brakeHeld: false,
  comboMultiplier: 1,
  pickups: [],
  _pickupTimer: 0,
  _magnetPickupTimer: 0,
  _coinTrailTimer: 0,

  // Fever Mode
  nearMissStreak: 0,
  _nearMissResetTimer: 0,

  // Визуал
  roadOffset: 0,
  particles: [],
  decorations: [],
  _decorationTimer: 0,
  _roadBounds: null, // кэш геометрии дороги

  // Время
  _lastTimestamp: 0,
  _speedRecoverAt: null,
  lastCrashTime: null,

  // Игрок
  player: {
    carId: null,
    sprite: null,
    lane: 1,
    x: 0,
    y: 0,
    speed: 0,
    targetSpeed: 0,
    baseSpeed: 0,
    maxSpeed: 0,
    handling: 1,
    armorMax: 3,
    armor: 3,
    width: 64,
    height: 112,
    targetX: 0,
    slipstream: false,
    drifting: false,
    driftTimer: 0,
    driftDir: 0,
    magnetActive: false,
    magnetTimer: 0,
    feverMode: false,
    feverTimer: 0,
  },

  // Трафик и препятствия
  traffic: [],
  obstacles: [],
  laneX: [],
  laneCountCurrent: 3,
  obstacleSpawnTimer: 0,

  // Сложность
  trafficDensity: 0,

  init: function () {
    this.state = 'menu';
    this._resetRunState();
    this._computeRoadBounds();
    this._initLanes();
    this._initPlayerFromConfig();
  },

  _resetRunState: function () {
    this.distance = 0;
    this.coinsRun = 0;
    this.overtakes = 0;
    this.closeOvertakes = 0;
    this.nitroCharge = 0;
    this.nitroActive = false;
    this.nitroUses = 0;
    this.gasHeld = false;
    this.brakeHeld = false;
    this.comboMultiplier = 1;
    this.pickups = [];
    this._pickupTimer = 4;
    this._magnetPickupTimer = 8;
    this._coinTrailTimer = 5;
    this.nearMissStreak = 0;
    this._nearMissResetTimer = 0;
    this._lastTimestamp = 0;
    this._speedRecoverAt = null;
    this.lastCrashTime = null;
    this.roadOffset = 0;
    this.particles = [];
    this.decorations = [];
    this._decorationTimer = 0;
    this.timeRemaining = null;
    this.traffic = [];
    this.obstacles = [];
    this.obstacleSpawnTimer = 0;
    this.trafficDensity = CONFIG.TRAFFIC_START_DENSITY;

    // Сброс полей игрока
    this.player.slipstream = false;
    this.player.drifting = false;
    this.player.driftTimer = 0;
    this.player.driftDir = 0;
    this.player.magnetActive = false;
    this.player.magnetTimer = 0;
    this.player.feverMode = false;
    this.player.feverTimer = 0;
  },

  _computeRoadBounds: function () {
    var roadWidth = CONFIG.WORLD_WIDTH * 0.72;
    var roadX = (CONFIG.WORLD_WIDTH - roadWidth) / 2;
    this._roadBounds = { roadX: roadX, roadWidth: roadWidth };
  },

  _initLanes: function () {
    this.laneX = [];
    if (!this._roadBounds) this._computeRoadBounds();
    var rb = this._roadBounds;
    var laneCount = this.laneCountCurrent;
    var laneWidth = rb.roadWidth / laneCount;
    for (var i = 0; i < laneCount; i++) {
      this.laneX.push(rb.roadX + laneWidth * i + laneWidth / 2);
    }
  },

  getLaneCount: function () {
    return this.laneCountCurrent;
  },

  _initPlayerFromConfig: function () {
    var selectedId = null;
    try { selectedId = Progress.get('selectedCarId'); } catch (e) {}
    var starter = null;
    for (var i = 0; i < CONFIG.CARS.length; i++) {
      if (CONFIG.CARS[i].id === selectedId) { starter = CONFIG.CARS[i]; break; }
    }
    if (!starter) starter = CONFIG.CARS[0];

    var stats = null;
    try { stats = Progress.getEffectiveCarStats(starter.id); } catch (e) {}
    if (!stats) {
      stats = { speed: starter.speed, acceleration: starter.acceleration, handling: starter.handling, armor: starter.armor };
    }

    this.player.carId = starter.id;
    this.player.sprite = starter.sprite;
    this.player.lane = Math.floor(this.laneCountCurrent / 2);
    this.player.y = CONFIG.WORLD_HEIGHT - 140;
    this.player.baseSpeed = CONFIG.PLAYER_BASE_SPEED * stats.speed;
    this.player.maxSpeed = CONFIG.PLAYER_MAX_SPEED * stats.speed;
    this.player.speed = this.player.baseSpeed;
    this.player.targetSpeed = this.player.baseSpeed;
    this.player.handling = stats.handling;
    this.player.armorMax = Math.round(stats.armor);
    this.player.armor = this.player.armorMax;
    this._updatePlayerX();
  },

  _updatePlayerX: function () {
    var laneIndex = this.player.lane;
    if (laneIndex < 0) laneIndex = 0;
    if (laneIndex >= this.laneX.length) laneIndex = this.laneX.length - 1;
    this.player.targetX = this.laneX[laneIndex];
    if (!this.player.x) this.player.x = this.player.targetX;
  },

  startRun: function (modeId) {
    this.mode = modeId || 'classic';
    this.state = 'running';
    this._resetRunState();

    var modeConfig = CONFIG.GAME_MODES[this.mode] || {};

    // Кол-во полос из настроек режима
    this.laneCountCurrent = modeConfig.laneCount || CONFIG.LANE_COUNT;

    // Плотность трафика
    if (modeConfig.startDensity) {
      this.trafficDensity = modeConfig.startDensity;
    } else {
      this.trafficDensity = CONFIG.TRAFFIC_START_DENSITY;
    }

    // Таймер режима
    if (modeConfig.timeLimit) {
      this.timeRemaining = modeConfig.timeLimit;
    }

    this._computeRoadBounds();
    this._initLanes();
    this._initPlayerFromConfig();
  },

  pause: function () {
    if (this.state !== 'running') return;
    this.state = 'paused';
  },

  resume: function () {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this._lastTimestamp = 0;
  },

  updateFrame: function (timestamp) {
    if (this.state !== 'running') {
      this._lastTimestamp = timestamp;
      return;
    }
    if (!this._lastTimestamp) {
      this._lastTimestamp = timestamp;
      return;
    }

    var dtMs = timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;
    var dt = Math.min(dtMs / 1000, 0.05);

    this._updatePlayer(dt);
    this._updateDistanceAndRewards(dt);
    this._updateTraffic(dt);
    this._updateObstacles(dt);
    this._updateDecorations(dt);
    this._updatePickups(dt);
    this._updateParticles(dt);
    this._updateFever(dt);
    this._checkCollisions();

    // Нитро-частицы
    if (this.nitroActive) {
      this._spawnParticles(this.player.x, this.player.y + this.player.height / 2, 2, CONFIG.COLORS.nitro, 3);
    }
    // Дрифт-частицы
    if (this.player.drifting) {
      this._spawnParticles(this.player.x - 12, this.player.y + 30, 1, 'rgba(180,180,200,0.7)', 3);
      this._spawnParticles(this.player.x + 12, this.player.y + 30, 1, 'rgba(180,180,200,0.7)', 3);
    }
  },

  _updatePlayer: function (dt) {
    // Восстановление скорости после столкновения
    if (this._speedRecoverAt && !this.nitroActive) {
      var now = performance.now ? performance.now() : Date.now();
      if (now >= this._speedRecoverAt) {
        this.player.targetSpeed = this.player.baseSpeed;
        this._speedRecoverAt = null;
      }
    }

    if (!this.nitroActive && !this._speedRecoverAt) {
      var effectiveBase = this.player.slipstream
        ? this.player.baseSpeed * CONFIG.SLIPSTREAM_BOOST
        : this.player.baseSpeed;

      if (this.gasHeld) {
        this.player.targetSpeed = Math.min(
          this.player.baseSpeed * CONFIG.GAS_BOOST,
          this.player.targetSpeed + 50 * dt
        );
      } else if (this.brakeHeld) {
        this.player.targetSpeed = Math.max(
          this.player.baseSpeed * CONFIG.BRAKE_FACTOR,
          this.player.targetSpeed - 100 * dt
        );
      } else {
        this.player.targetSpeed += (effectiveBase - this.player.targetSpeed) * Math.min(1, 2 * dt);
      }
    }

    // Плавное движение к целевой скорости
    var accel = 200;
    if (this.player.speed < this.player.targetSpeed) {
      this.player.speed = Math.min(this.player.targetSpeed, this.player.speed + accel * dt);
    } else if (this.player.speed > this.player.targetSpeed) {
      this.player.speed = Math.max(this.player.targetSpeed, this.player.speed - accel * dt);
    }

    // Горизонтальное движение к целевой X полосы
    if (typeof this.player.targetX === 'number') {
      var dx = this.player.targetX - this.player.x;
      var move = 10 * this.player.handling * dt * 60;
      if (Math.abs(dx) <= move) {
        this.player.x = this.player.targetX;
      } else {
        this.player.x += dx > 0 ? move : -move;
      }
    }

    // Нитро
    if (this.nitroActive) {
      this.nitroCharge -= CONFIG.NITRO_DRAIN_PER_SECOND * dt;
      if (this.nitroCharge <= 0) {
        this.nitroCharge = 0;
        this.deactivateNitro();
      }
    } else {
      this.nitroCharge = Math.min(CONFIG.NITRO_MAX, this.nitroCharge + CONFIG.NITRO_GAIN_PER_SECOND * dt);
    }

    // Дрифт-таймер
    if (this.player.driftTimer > 0) {
      this.player.driftTimer -= dt;
      if (this.player.driftTimer <= 0) {
        this.player.drifting = false;
        this.player.driftTimer = 0;
      }
    }

    // Магнит-таймер
    if (this.player.magnetActive) {
      this.player.magnetTimer -= dt;
      if (this.player.magnetTimer <= 0) {
        this.player.magnetActive = false;
        this.player.magnetTimer = 0;
      }
    }

    // Fever-таймер
    if (this.player.feverMode) {
      this.player.feverTimer -= dt;
      if (this.player.feverTimer <= 0) {
        this.player.feverMode = false;
        this.player.feverTimer = 0;
      }
    }
  },

  _updateDistanceAndRewards: function (dt) {
    if (this.timeRemaining !== null) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.finishRun();
        return;
      }
    }

    var speed = this.player.speed;
    if (this.nitroActive) speed *= CONFIG.NITRO_SPEED_MULTIPLIER;

    var meters = speed * dt;
    this.distance += meters;
    this.roadOffset = (this.roadOffset + speed * dt) % 10000;

    var coinsFromDistance = CONFIG.COINS_PER_METER * meters;
    if (this.player.feverMode) coinsFromDistance *= CONFIG.FEVER_COIN_MULTIPLIER;
    this.coinsRun += coinsFromDistance;

    // Плавное усложнение трафика
    var modeConf = CONFIG.GAME_MODES[this.mode] || {};
    if (modeConf.maxDensity) {
      this.trafficDensity = Math.min(
        modeConf.maxDensity,
        (modeConf.startDensity || CONFIG.TRAFFIC_START_DENSITY) +
          CONFIG.TRAFFIC_DENSITY_DISTANCE_FACTOR * this.distance * 2
      );
    } else {
      this.trafficDensity = Math.min(
        CONFIG.TRAFFIC_MAX_DENSITY,
        CONFIG.TRAFFIC_START_DENSITY + CONFIG.TRAFFIC_DENSITY_DISTANCE_FACTOR * this.distance
      );
    }

    this.obstacleSpawnTimer -= dt;
  },

  _updateTraffic: function (dt) {
    var slipstreaming = false;
    for (var i = this.traffic.length - 1; i >= 0; i--) {
      var car = this.traffic[i];
      car.y += (this.player.speed * car.speedFactor) * dt;

      // Обгон
      if (!car.overtaken && car.y > this.player.y + this.player.height / 2) {
        car.overtaken = true;
        this.overtakes += 1;

        var coinsPerOvertake = CONFIG.COINS_PER_OVERTAKE * this.comboMultiplier;
        if (this.player.feverMode) coinsPerOvertake *= CONFIG.FEVER_COIN_MULTIPLIER;
        this.coinsRun += coinsPerOvertake;

        // Рискованный / near-miss обгон
        var dxOvertake = Math.abs(car.x - this.player.x);
        if (dxOvertake < this.player.width * 1.5) {
          this.closeOvertakes += 1;
          this.nitroCharge = Math.min(CONFIG.NITRO_MAX, this.nitroCharge + CONFIG.NITRO_GAIN_CLOSE_OVERTAKE);
          this.comboMultiplier = Math.min(CONFIG.COMBO_MAX, this.comboMultiplier + CONFIG.COMBO_STEP);
        }

        // Near-miss: очень близко по X — fever streak
        if (dxOvertake < CONFIG.NEAR_MISS_X_THRESHOLD) {
          this.nearMissStreak += 1;
          this._nearMissResetTimer = CONFIG.FEVER_NEARMISS_RESET;
          if (this.nearMissStreak >= CONFIG.FEVER_NEARMISS_STREAK && !this.player.feverMode) {
            this.player.feverMode = true;
            this.player.feverTimer = CONFIG.FEVER_DURATION;
            this.nearMissStreak = 0;
            this._spawnParticles(this.player.x, this.player.y, 12, CONFIG.COLORS.fever, 8);
          }
        }
      }

      // Слипстрим
      var dy = this.player.y - car.y;
      if (
        dy >= CONFIG.SLIPSTREAM_DISTANCE_MIN &&
        dy <= CONFIG.SLIPSTREAM_DISTANCE_MAX &&
        Math.abs(car.x - this.player.x) < this.player.width * 0.7
      ) {
        slipstreaming = true;
      }

      if (car.y > CONFIG.WORLD_HEIGHT + 100) {
        this.traffic.splice(i, 1);
      }
    }
    this.player.slipstream = slipstreaming;

    var desiredCount = Math.floor(this.trafficDensity * this.getLaneCount());
    while (this.traffic.length < desiredCount) {
      this._spawnTrafficCar();
    }
  },

  _spawnTrafficCar: function () {
    if (!this.laneX.length) return;
    var lane = Math.floor(Math.random() * this.laneCountCurrent);
    var y = -Math.random() * 200 - 80;
    var isMoto = Math.random() < CONFIG.MOTORCYCLE_CHANCE;
    var sprite, w, h;

    if (isMoto) {
      sprite = CONFIG.MOTORCYCLE_SPRITES[Math.floor(Math.random() * CONFIG.MOTORCYCLE_SPRITES.length)];
      w = 24; h = 56;
    } else {
      sprite = CONFIG.TRAFFIC_SPRITES[Math.floor(Math.random() * CONFIG.TRAFFIC_SPRITES.length)];
      w = 40; h = 80;
    }

    this.traffic.push({
      lane: lane,
      x: this.laneX[lane],
      y: y,
      width: w,
      height: h,
      sprite: sprite,
      speedFactor: 0.6 + Math.random() * 0.5,
      overtaken: false,
    });
  },

  _updateObstacles: function (dt) {
    for (var i = this.obstacles.length - 1; i >= 0; i--) {
      var ob = this.obstacles[i];
      ob.y += this.player.speed * dt;
      if (ob.y > CONFIG.WORLD_HEIGHT + 80) {
        this.obstacles.splice(i, 1);
      }
    }

    if (this.obstacleSpawnTimer <= 0) {
      this._spawnObstacleFormation();
      var interval = CONFIG.OBSTACLE_SPAWN_BASE_INTERVAL -
        (this.trafficDensity - CONFIG.TRAFFIC_START_DENSITY) * 0.3;
      if (interval < CONFIG.OBSTACLE_SPAWN_MIN_INTERVAL) interval = CONFIG.OBSTACLE_SPAWN_MIN_INTERVAL;
      this.obstacleSpawnTimer = interval;
    }
  },

  // Выбор паттерна препятствий по весам
  _pickObstaclePattern: function () {
    var patterns = CONFIG.OBSTACLE_PATTERNS;
    var totalWeight = 0;
    for (var i = 0; i < patterns.length; i++) totalWeight += patterns[i].weight;
    var r = Math.random() * totalWeight;
    var acc = 0;
    for (var j = 0; j < patterns.length; j++) {
      acc += patterns[j].weight;
      if (r < acc) return patterns[j].type;
    }
    return 'random';
  },

  // Вернуть массив полос для формации
  _getFormationLanes: function (pattern, laneCount) {
    var lanes = [];
    var i;
    switch (pattern) {
      case 'gauntlet':
        // Все полосы кроме одной случайной
        var open = Math.floor(Math.random() * laneCount);
        for (i = 0; i < laneCount; i++) {
          if (i !== open) lanes.push(i);
        }
        break;
      case 'sides':
        // Только крайние полосы
        if (laneCount >= 2) {
          lanes.push(0);
          lanes.push(laneCount - 1);
        }
        break;
      case 'middle':
        // Только средние (не крайние)
        if (laneCount >= 3) {
          for (i = 1; i < laneCount - 1; i++) lanes.push(i);
        } else {
          lanes.push(0);
        }
        break;
      case 'zigzag':
        // Чётные и нечётные через ряд
        for (i = 0; i < laneCount; i++) {
          if (i % 2 === 0) lanes.push(i);
        }
        break;
      case 'random':
      default:
        // Одна случайная свободная полоса
        lanes.push(Math.floor(Math.random() * laneCount));
        break;
    }
    return lanes;
  },

  _spawnObstacleFormation: function () {
    var baseY = -60;
    var laneCount = this.laneCountCurrent;

    // Минимум 280px между любыми двумя препятствиями (по Y)
    for (var k = 0; k < this.obstacles.length; k++) {
      if (this.obstacles[k].y < 300 && Math.abs(this.obstacles[k].y - baseY) < 280) return;
    }

    var pattern = this._pickObstaclePattern();
    var lanes = this._getFormationLanes(pattern, laneCount);

    // Убедиться что хотя бы одна полоса остаётся свободной
    if (lanes.length >= laneCount) {
      var open = Math.floor(Math.random() * laneCount);
      lanes = lanes.filter(function (l) { return l !== open; });
    }
    if (!lanes.length) return;

    // Для zigzag — второй ряд со смещением
    var yOffsets = [];
    if (pattern === 'zigzag') {
      for (var z = 0; z < lanes.length; z++) {
        yOffsets.push(z % 2 === 0 ? 0 : -120);
      }
    }

    for (var i = 0; i < lanes.length; i++) {
      var lane = lanes[i];
      if (lane >= this.laneX.length) continue;
      var obType = CONFIG.OBSTACLE_TYPES[Math.floor(Math.random() * CONFIG.OBSTACLE_TYPES.length)];
      var yOff = yOffsets.length ? yOffsets[i] : 0;
      this.obstacles.push({
        type: obType.type,
        sprite: obType.sprite,
        severe: obType.severe,
        lane: lane,
        x: this.laneX[lane],
        y: baseY + yOff,
        width: obType.width,
        height: obType.height,
      });
    }
  },

  // Декорации обочины
  _updateDecorations: function (dt) {
    for (var i = this.decorations.length - 1; i >= 0; i--) {
      var d = this.decorations[i];
      d.y += this.player.speed * dt;
      if (d.y - d.height > CONFIG.WORLD_HEIGHT + 40) {
        this.decorations.splice(i, 1);
      }
    }

    this._decorationTimer -= dt;
    if (this._decorationTimer <= 0 && this.decorations.length < CONFIG.MAX_DECORATIONS) {
      this._spawnDecoration();
      this._decorationTimer = CONFIG.DECORATION_SPAWN_INTERVAL;
    }
  },

  _spawnDecoration: function () {
    if (!this._roadBounds) this._computeRoadBounds();
    var roadX = this._roadBounds.roadX;
    var side = Math.random() < 0.5 ? 'left' : 'right';
    var x;
    if (side === 'left') {
      x = roadX * 0.5 + (Math.random() - 0.5) * 20;
    } else {
      x = CONFIG.WORLD_WIDTH - roadX * 0.5 + (Math.random() - 0.5) * 20;
    }

    var rows = 6;
    var cols = 2;
    var windowMask = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        windowMask.push(Math.random() < (0.6 - r * 0.05));
      }
    }

    this.decorations.push({
      x: x,
      y: -40 - Math.random() * 40,
      width: 26 + Math.random() * 10,
      height: 120 + Math.random() * 80,
      colorVariant: Math.floor(Math.random() * 3),
      windowRows: rows,
      windowCols: cols,
      windowMask: windowMask,
    });
  },

  // Пикапы
  _updatePickups: function (dt) {
    for (var i = this.pickups.length - 1; i >= 0; i--) {
      var pk = this.pickups[i];

      // Магнит притягивает монеты
      if (this.player.magnetActive && pk.kind === 'coin') {
        var mdx = this.player.x - pk.x;
        var mdy = this.player.y - pk.y;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < CONFIG.MAGNET_RADIUS && mdist > 1) {
          pk.x += mdx * 0.12;
          pk.y += mdy * 0.12;
        }
      }

      pk.y += this.player.speed * dt;
      if (pk.y > CONFIG.WORLD_HEIGHT + 60) {
        this.pickups.splice(i, 1);
        continue;
      }

      var dx = Math.abs(pk.x - this.player.x);
      var dy = Math.abs(pk.y - this.player.y);
      var grabR = (pk.kind === 'coin') ? 22 : 30;
      if (dx < grabR && dy < grabR) {
        this._collectPickup(pk);
        this.pickups.splice(i, 1);
      }
    }

    // Спавн щита / нитро
    this._pickupTimer -= dt;
    if (this._pickupTimer <= 0) {
      var kind = Math.random() < 0.55 ? 'shield' : 'nitro';
      this._spawnPickup(kind);
      this._pickupTimer = (kind === 'nitro')
        ? CONFIG.PICKUP_NITRO_INTERVAL + Math.random() * 4
        : CONFIG.PICKUP_SHIELD_INTERVAL + Math.random() * 6;
    }

    // Спавн магнита
    this._magnetPickupTimer -= dt;
    if (this._magnetPickupTimer <= 0) {
      this._spawnPickup('magnet');
      this._magnetPickupTimer = CONFIG.PICKUP_MAGNET_INTERVAL + Math.random() * 8;
    }

    // Монетные дорожки
    this._coinTrailTimer -= dt;
    if (this._coinTrailTimer <= 0) {
      this._spawnCoinTrail();
      this._coinTrailTimer = CONFIG.PICKUP_COIN_TRAIL_INTERVAL + Math.random() * 4;
    }
  },

  _spawnPickup: function (kind) {
    if (!this.laneX.length) return;
    var lane = Math.floor(Math.random() * this.laneCountCurrent);
    this.pickups.push({ kind: kind, lane: lane, x: this.laneX[lane], y: -40 });
  },

  _spawnCoinTrail: function () {
    if (!this.laneX.length) return;
    var lane = Math.floor(Math.random() * this.laneCountCurrent);
    var x = this.laneX[lane];
    var startY = -40;
    for (var c = 0; c < CONFIG.PICKUP_COIN_COUNT; c++) {
      this.pickups.push({ kind: 'coin', lane: lane, x: x, y: startY - c * CONFIG.PICKUP_COIN_GAP });
    }
  },

  _collectPickup: function (pk) {
    if (pk.kind === 'shield') {
      this.player.armor = Math.min(this.player.armorMax, this.player.armor + 1);
      this._spawnParticles(pk.x, pk.y, 6, 'rgba(59,130,246,0.9)', 4);
    } else if (pk.kind === 'nitro') {
      this.nitroCharge = Math.min(CONFIG.NITRO_MAX, this.nitroCharge + CONFIG.NITRO_MAX * 0.4);
      this._spawnParticles(pk.x, pk.y, 6, CONFIG.COLORS.nitro, 4);
    } else if (pk.kind === 'coin') {
      var coinVal = 3 * this.comboMultiplier;
      if (this.player.feverMode) coinVal *= CONFIG.FEVER_COIN_MULTIPLIER;
      this.coinsRun += coinVal;
      this._spawnParticles(pk.x, pk.y, 3, '#fbbf24', 3);
    } else if (pk.kind === 'magnet') {
      this.player.magnetActive = true;
      this.player.magnetTimer = CONFIG.MAGNET_DURATION;
      this._spawnParticles(pk.x, pk.y, 8, '#fbbf24', 5);
    }
  },

  // Fever-таймер сброса streak
  _updateFever: function (dt) {
    if (this.nearMissStreak > 0) {
      this._nearMissResetTimer -= dt;
      if (this._nearMissResetTimer <= 0) {
        this.nearMissStreak = 0;
      }
    }
  },

  // Частицы
  _spawnParticles: function (x, y, count, color, spread) {
    for (var i = 0; i < count; i++) {
      if (this.particles.length >= CONFIG.MAX_PARTICLES) break;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y,
        vx: (Math.random() - 0.5) * spread,
        vy: Math.random() * spread * 0.5 + 1,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.7,
        color: color,
        size: 2 + Math.random() * 3,
      });
    }
  },

  _updateParticles: function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  _checkCollisions: function () {
    var p = this.player;
    var px = p.x;
    var py = p.y;
    var pw = p.width * 0.8;
    var ph = p.height * 0.8;
    var i;

    for (i = this.traffic.length - 1; i >= 0; i--) {
      var car = this.traffic[i];
      if (this._rectsOverlap(px, py, pw, ph, car.x, car.y, car.width, car.height)) {
        this._handleCrash(true);
        this.traffic.splice(i, 1);
        return;
      }
    }

    for (i = this.obstacles.length - 1; i >= 0; i--) {
      var ob = this.obstacles[i];
      if (this._rectsOverlap(px, py, pw, ph, ob.x, ob.y, ob.width, ob.height)) {
        this._handleCrash(ob.severe);
        this.obstacles.splice(i, 1);
        if (this.state !== 'running') return;
      }
    }
  },

  _rectsOverlap: function (x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(
      x1 + w1 / 2 < x2 - w2 / 2 ||
      x1 - w1 / 2 > x2 + w2 / 2 ||
      y1 + h1 / 2 < y2 - h2 / 2 ||
      y1 - h1 / 2 > y2 + h2 / 2
    );
  },

  _handleCrash: function (severe) {
    var damage = severe ? CONFIG.HEAVY_CRASH_ARMOR_DAMAGE : CONFIG.LIGHT_CRASH_ARMOR_DAMAGE;
    this.player.armor -= damage;
    this.lastCrashTime = performance.now ? performance.now() : Date.now();

    this._spawnParticles(this.player.x, this.player.y, 8, CONFIG.COLORS.crash, 6);

    // Сброс комбо, дрифта и fever streak при столкновении
    this.comboMultiplier = 1;
    this.player.drifting = false;
    this.player.driftTimer = 0;
    this.nearMissStreak = 0;

    if (this.player.armor <= 0) {
      this.player.armor = 0;
      this.finishRun();
    } else {
      this.player.targetSpeed = this.player.baseSpeed * 0.7;
      this._speedRecoverAt = (performance.now ? performance.now() : Date.now()) + CONFIG.SPEED_RECOVERY_TIME;
    }
  },

  activateNitro: function () {
    if (this.nitroActive) return;
    if (this.nitroCharge < CONFIG.NITRO_MAX * 0.2) return;
    this.nitroActive = true;
    this.nitroUses += 1;
    this.player.targetSpeed = this.player.maxSpeed;
    this._speedRecoverAt = null;
  },

  deactivateNitro: function () {
    if (!this.nitroActive) return;
    this.nitroActive = false;
    this.player.targetSpeed = this.player.baseSpeed;
  },

  toggleNitro: function () {
    if (this.nitroActive) this.deactivateNitro();
    else this.activateNitro();
  },

  setGas: function (on) {
    if (this.state !== 'running') return;
    this.gasHeld = !!on;
    if (on) this.brakeHeld = false;
  },

  setBrake: function (on) {
    if (this.state !== 'running') return;
    this.brakeHeld = !!on;
    if (on) this.gasHeld = false;
  },

  changeLane: function (direction) {
    if (this.state !== 'running') return;
    var prevLane = this.player.lane;
    if (direction === 'left') {
      this.player.lane -= 1;
    } else if (direction === 'right') {
      this.player.lane += 1;
    }
    var laneCount = this.laneCountCurrent;
    if (this.player.lane < 0) this.player.lane = 0;
    if (this.player.lane >= laneCount) this.player.lane = laneCount - 1;

    this._updatePlayerX();

    // Дрифт — при смене полосы + торможение
    if (this.player.lane !== prevLane && this.brakeHeld && !this.player.drifting) {
      this.player.drifting = true;
      this.player.driftTimer = CONFIG.DRIFT_DURATION;
      this.player.driftDir = direction === 'left' ? -1 : 1;
      this.comboMultiplier = Math.min(CONFIG.COMBO_MAX, this.comboMultiplier + CONFIG.DRIFT_COMBO_BONUS);
    }
  },

  finishRun: function () {
    if (this.state !== 'running') return;
    this.state = 'gameover';

    var finalCoins = Math.round(this.coinsRun + CONFIG.COINS_BASE_PER_RUN);
    var distanceMeters = Math.round(this.distance);
    var exp = distanceMeters * CONFIG.EXP_PER_METER + CONFIG.EXP_PER_RUN;

    Progress.applyRunResults({
      distance: distanceMeters,
      coins: finalCoins,
      exp: exp,
      overtakes: this.overtakes,
      nitroUses: this.nitroUses,
      closeOvertakes: this.closeOvertakes,
      mode: this.mode,
    });
    Progress.updateQuestsByRun({
      distance: distanceMeters,
      nitroUses: this.nitroUses,
      closeOvertakes: this.closeOvertakes,
    });
  },
};
