/**
 * Прогресс игрока — сохранение/загрузка из localStorage.
 */
var Progress = {
  _key: CONFIG.GAME_ID + '_progress',
  _data: null,

  _defaults: function () {
    return {
      coins: 0,
      level: 1,
      exp: 0,
      bestDistance: 0,
      totalDistance: 0,
      runs: 0,
      unlockedCars: ['starter_black'],
      selectedCarId: 'starter_black',
      carUpgrades: {},
      selectedMode: 'classic',
      bestDistanceByMode: {},
      totalOvertakes: 0,
      dailyQuests: [],
      lastDailyDate: null,
      seenTutorial: false,
    };
  },

  load: function () {
    try {
      var raw = localStorage.getItem(this._key);
      this._data = raw ? JSON.parse(raw) : this._defaults();
    } catch (e) {
      this._data = this._defaults();
    }
    var defs = this._defaults();
    for (var k in defs) {
      if (!(k in this._data)) {
        this._data[k] = defs[k];
      }
    }
  },

  save: function () {
    try {
      localStorage.setItem(this._key, JSON.stringify(this._data));
    } catch (e) {
    }
  },

  get: function (key) {
    if (!this._data) this.load();
    return this._data[key];
  },

  set: function (key, value) {
    if (!this._data) this.load();
    this._data[key] = value;
    this.save();
  },

  addCoins: function (amount) {
    if (!this._data) this.load();
    this._data.coins += Math.max(0, Math.round(amount));
    this.save();
  },

  addExperience: function (amount) {
    if (!this._data) this.load();
    this._data.exp += Math.max(0, Math.round(amount));
    this._recalcLevel();
    this.save();
  },

  _recalcLevel: function () {
    var exp = this._data.exp;
    var level = 1;
    var need = CONFIG.LEVEL_EXP_BASE;
    while (exp >= need) {
      level += 1;
      exp -= need;
      need = Math.round(need * CONFIG.LEVEL_EXP_MULTIPLIER);
    }
    this._data.level = level;
  },

  // --- Система прокачки ---

  getCarUpgradeLevel: function (carId, stat) {
    if (!this._data) this.load();
    var upgrades = this._data.carUpgrades[carId];
    if (!upgrades) return 0;
    return upgrades[stat] || 0;
  },

  getUpgradeCost: function (carId, stat) {
    var level = this.getCarUpgradeLevel(carId, stat);
    if (level >= CONFIG.UPGRADES.maxLevel) return -1;
    return Math.round(
      CONFIG.UPGRADES.baseCost * Math.pow(CONFIG.UPGRADES.costMultiplier, level)
    );
  },

  upgradeCarStat: function (carId, stat) {
    if (!this._data) this.load();
    if (!this._data.carUpgrades[carId]) {
      this._data.carUpgrades[carId] = { speed: 0, acceleration: 0, handling: 0, armor: 0 };
    }
    var currentLevel = this._data.carUpgrades[carId][stat] || 0;
    if (currentLevel >= CONFIG.UPGRADES.maxLevel) return false;
    var cost = this.getUpgradeCost(carId, stat);
    if (cost < 0 || this._data.coins < cost) return false;
    this._data.coins -= cost;
    this._data.carUpgrades[carId][stat] = currentLevel + 1;
    this.save();
    return true;
  },

  getEffectiveCarStats: function (carId) {
    if (!this._data) this.load();
    var baseCar = null;
    for (var i = 0; i < CONFIG.CARS.length; i++) {
      if (CONFIG.CARS[i].id === carId) {
        baseCar = CONFIG.CARS[i];
        break;
      }
    }
    if (!baseCar) return null;
    var upgrades = this._data.carUpgrades[carId] || {};
    return {
      speed: baseCar.speed + (upgrades.speed || 0) * CONFIG.UPGRADES.bonusPerLevel.speed,
      acceleration: baseCar.acceleration + (upgrades.acceleration || 0) * CONFIG.UPGRADES.bonusPerLevel.acceleration,
      handling: baseCar.handling + (upgrades.handling || 0) * CONFIG.UPGRADES.bonusPerLevel.handling,
      armor: baseCar.armor + (upgrades.armor || 0) * CONFIG.UPGRADES.bonusPerLevel.armor,
    };
  },

  // --- Покупка машин ---

  buyCar: function (carId) {
    if (!this._data) this.load();
    var car = null;
    for (var i = 0; i < CONFIG.CARS.length; i++) {
      if (CONFIG.CARS[i].id === carId) {
        car = CONFIG.CARS[i];
        break;
      }
    }
    if (!car) return false;
    if (this._data.unlockedCars.indexOf(carId) !== -1) return false;
    if (this._data.coins < car.price) return false;
    this._data.coins -= car.price;
    this._data.unlockedCars.push(carId);
    this.save();
    return true;
  },

  unlockCar: function (carId) {
    if (!this._data) this.load();
    if (this._data.unlockedCars.indexOf(carId) === -1) {
      this._data.unlockedCars.push(carId);
      this.save();
    }
  },

  selectCar: function (carId) {
    if (!this._data) this.load();
    if (this._data.unlockedCars.indexOf(carId) !== -1) {
      this._data.selectedCarId = carId;
      this.save();
    }
  },

  // --- Ежедневные задания ---

  _ensureDailyQuests: function () {
    var today = new Date();
    var key =
      today.getFullYear() +
      '-' +
      (today.getMonth() + 1) +
      '-' +
      today.getDate();
    if (this._data.lastDailyDate === key && this._data.dailyQuests.length) {
      return;
    }
    this._data.lastDailyDate = key;
    this._data.dailyQuests = [];
    var pool = CONFIG.DAILY_QUESTS_POOL;
    var count = Math.min(CONFIG.DAILY_QUESTS_PER_DAY, pool.length);
    for (var i = 0; i < count; i++) {
      var q = pool[i];
      this._data.dailyQuests.push({
        id: q.id,
        type: q.type,
        target: q.target,
        progress: 0,
        completed: false,
        rewardCoins: q.rewardCoins,
        rewardExp: q.rewardExp,
      });
    }
  },

  getDailyQuests: function () {
    if (!this._data) this.load();
    this._ensureDailyQuests();
    return this._data.dailyQuests.slice();
  },

  updateQuestsByRun: function (run) {
    if (!this._data) this.load();
    this._ensureDailyQuests();
    var list = this._data.dailyQuests;
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (q.completed) {
        continue;
      }
      if (q.type === 'distance') {
        q.progress += run.distance;
      } else if (q.type === 'nitro_uses') {
        q.progress += run.nitroUses || 0;
      } else if (q.type === 'close_overtakes') {
        q.progress += run.closeOvertakes || 0;
      }
      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        this._data.coins += q.rewardCoins;
        this._data.exp += q.rewardExp;
      }
    }
    this._recalcLevel();
    this.save();
  },

  // --- Результаты заезда ---

  applyRunResults: function (result) {
    if (!this._data) this.load();
    var distance = result.distance || 0;
    var coins = result.coins || 0;
    var exp = result.exp || 0;
    var mode = result.mode || 'classic';

    this._data.runs += 1;
    this._data.totalDistance += distance;
    this._data.totalOvertakes += (result.overtakes || 0);

    if (distance > this._data.bestDistance) {
      this._data.bestDistance = distance;
    }

    if (!this._data.bestDistanceByMode[mode] || distance > this._data.bestDistanceByMode[mode]) {
      this._data.bestDistanceByMode[mode] = distance;
    }

    this.addCoins(coins);
    this.addExperience(exp);
  },
};
