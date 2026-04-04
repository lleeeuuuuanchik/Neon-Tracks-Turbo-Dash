/**
 * Конфигурация игры «Неоновые трассы: Турбо-рывок».
 * Все константы, цены, размеры и настройки — здесь.
 */
var CONFIG = {
  // Общие настройки
  GAME_ID: 'neon_tracks_turbo_dash',
  TARGET_FPS: 60,

  // Внутренние размеры игрового поля (логические, до масштабирования) — 16:9 горизонталь
  WORLD_WIDTH: 640,
  WORLD_HEIGHT: 360,

  // Доля ширины мира, занятая дорогой (синхронизировано между game.js и render.js)
  ROAD_WIDTH_RATIO: 0.40,

  // Полосы движения
  LANE_COUNT: 3, // Базовое кол-во (для режимов без явного laneCount)

  // Скорости (в условных единицах в секунду)
  PLAYER_BASE_SPEED: 180,
  PLAYER_MAX_SPEED: 360,

  // Газ / тормоз
  GAS_BOOST: 1.3,
  BRAKE_FACTOR: 0.4,

  // Нитро
  NITRO_MAX: 100,
  NITRO_GAIN_PER_SECOND: 10,
  NITRO_GAIN_CLOSE_OVERTAKE: 15,
  NITRO_DRAIN_PER_SECOND: 40,
  NITRO_SPEED_MULTIPLIER: 1.6,
  NITRO_REWARD_MULTIPLIER: 1.5,

  // Экономика за заезд
  COINS_PER_METER: 0.02,
  COINS_PER_OVERTAKE: 1,
  COINS_BASE_PER_RUN: 5,

  // Опыт и уровни
  EXP_PER_METER: 0.03,
  EXP_PER_RUN: 10,
  LEVEL_EXP_BASE: 100,
  LEVEL_EXP_MULTIPLIER: 1.3,

  // Трафик и препятствия
  TRAFFIC_START_DENSITY: 0.42,
  TRAFFIC_MAX_DENSITY: 1.54,
  TRAFFIC_DENSITY_DISTANCE_FACTOR: 0.00025,
  OBSTACLE_SPAWN_BASE_INTERVAL: 1.4,
  OBSTACLE_SPAWN_MIN_INTERVAL: 0.5,

  // Урон и столкновения
  LIGHT_CRASH_ARMOR_DAMAGE: 1,
  HEAVY_CRASH_ARMOR_DAMAGE: 3,
  SPEED_RECOVERY_TIME: 1500,

  // Машины игрока (гараж)
  CARS: [
    { id: 'starter_black', name: 'Неоновая тень',   sprite: 'assets/unlucky/cars/car_starter.png',   speed: 1.0,  acceleration: 1.0,  handling: 1.0,  armor: 3, price: 0     },
    { id: 'green_racer',   name: 'Зелёный гонщик',  sprite: 'assets/unlucky/cars/car_taxi.png',       speed: 1.0,  acceleration: 1.1,  handling: 1.2,  armor: 2, price: 500   },
    { id: 'starter_blue',  name: 'Синий импульс',   sprite: 'assets/unlucky/cars/car_audi.png',       speed: 1.1,  acceleration: 1.0,  handling: 1.1,  armor: 2, price: 800   },
    { id: 'starter_red',   name: 'Красный рывок',   sprite: 'assets/unlucky/cars/car_viper.png',      speed: 1.15, acceleration: 1.1,  handling: 0.9,  armor: 2, price: 1500  },
    { id: 'starter_yellow',name: 'Солнечный штрих', sprite: 'assets/unlucky/cars/car_van.png',        speed: 1.05, acceleration: 1.2,  handling: 1.0,  armor: 1, price: 2000  },
    { id: 'blue_lightning', name: 'Синяя молния',   sprite: 'assets/unlucky/cars/car_police.png',     speed: 1.2,  acceleration: 1.0,  handling: 1.0,  armor: 3, price: 3000  },
    { id: 'black_phantom', name: 'Чёрный фантом',   sprite: 'assets/unlucky/cars/car_ambulance.png',  speed: 1.1,  acceleration: 1.3,  handling: 1.1,  armor: 2, price: 4000  },
    { id: 'red_fury',      name: 'Красная ярость',  sprite: 'assets/unlucky/cars/car_truck.png',      speed: 1.25, acceleration: 1.1,  handling: 0.85, armor: 3, price: 5500  },
    { id: 'green_viper',   name: 'Зелёная гадюка',  sprite: 'assets/unlucky/cars/car_truck.png',      speed: 1.15, acceleration: 1.2,  handling: 1.3,  armor: 1, price: 6500  },
    { id: 'yellow_storm',  name: 'Жёлтый шторм',    sprite: 'assets/unlucky/cars/car_big_truck.png',  speed: 1.3,  acceleration: 1.15, handling: 1.0,  armor: 2, price: 8000  },
    { id: 'black_beast',   name: 'Чёрный зверь',    sprite: 'assets/unlucky/cars/car_big_truck.png',  speed: 1.2,  acceleration: 1.3,  handling: 1.2,  armor: 4, price: 10000 },
    { id: 'blue_demon',    name: 'Синий демон',      sprite: 'assets/unlucky/cars/car_viper.png',      speed: 1.35, acceleration: 1.25, handling: 1.1,  armor: 2, price: 12000 },
  ],

  // Система прокачки
  UPGRADES: {
    stats: ['speed', 'acceleration', 'handling', 'armor'],
    statNames: { speed: 'Скорость', acceleration: 'Разгон', handling: 'Управление', armor: 'Броня' },
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 1.8,
    bonusPerLevel: { speed: 0.05, acceleration: 0.06, handling: 0.05, armor: 1 },
  },

  // Режимы игры (laneCount — кол-во полос)
  GAME_MODES: {
    classic: {
      id: 'classic',
      name: 'Классический',
      description: 'Бесконечная трасса. Покажи рекорд дистанции!',
      icon: '🛣️',
      laneCount: 3,
    },
    highway: {
      id: 'highway',
      name: 'Шоссе',
      description: '5 полос, плотный трафик. Хаос на шоссе!',
      icon: '🏎️',
      laneCount: 5,
      startDensity: 0.84,
      maxDensity: 2.1,
    },
    alley: {
      id: 'alley',
      name: 'Переулок',
      description: 'Только 2 полосы. Экстремальная точность!',
      icon: '🏙️',
      laneCount: 2,
    },
    timeAttack: {
      id: 'timeAttack',
      name: 'На время',
      description: 'Максимум дистанции за 60 секунд!',
      icon: '⏱️',
      laneCount: 3,
      timeLimit: 60,
    },
    trafficRush: {
      id: 'trafficRush',
      name: 'Трафик Раш',
      description: '4 полосы, максимальный трафик — обгоняй всех!',
      icon: '🚗',
      laneCount: 4,
      startDensity: 1.05,
      maxDensity: 2.45,
    },
  },

  // Спрайты трафика
  TRAFFIC_SPRITES: [
    'assets/kenney/PNG/Cars/car_black_2.png',
    'assets/kenney/PNG/Cars/car_blue_3.png',
    'assets/kenney/PNG/Cars/car_green_4.png',
    'assets/kenney/PNG/Cars/car_red_5.png',
    'assets/kenney/PNG/Cars/car_yellow_2.png',
    'assets/kenney/PNG/Cars/car_black_4.png',
    'assets/kenney/PNG/Cars/car_blue_4.png',
    'assets/kenney/PNG/Cars/car_green_2.png',
  ],

  // Спрайты мотоциклов (20% шанс в трафике)
  MOTORCYCLE_SPRITES: [
    'assets/kenney/PNG/Motorcycles/motorcycle_black.png',
    'assets/kenney/PNG/Motorcycles/motorcycle_blue.png',
    'assets/kenney/PNG/Motorcycles/motorcycle_green.png',
    'assets/kenney/PNG/Motorcycles/motorcycle_red.png',
    'assets/kenney/PNG/Motorcycles/motorcycle_yellow.png',
  ],
  MOTORCYCLE_CHANCE: 0.2,

  // Типы препятствий
  OBSTACLE_TYPES: [
    { type: 'barrel_red',    sprite: 'assets/kenney/PNG/Objects/barrel_red.png',         width: 28, height: 28, severe: false },
    { type: 'barrel_blue',   sprite: 'assets/kenney/PNG/Objects/barrel_blue.png',        width: 28, height: 28, severe: false },
    { type: 'cone',          sprite: 'assets/kenney/PNG/Objects/cone_straight.png',      width: 24, height: 24, severe: false },
    { type: 'oil',           sprite: 'assets/kenney/PNG/Objects/oil.png',                width: 36, height: 36, severe: true  },
    { type: 'barrier_red',   sprite: 'assets/kenney/PNG/Objects/barrier_red_race.png',   width: 48, height: 16, severe: false },
    { type: 'barrier_white', sprite: 'assets/kenney/PNG/Objects/barrier_white_race.png', width: 48, height: 16, severe: false },
    { type: 'rock',          sprite: 'assets/kenney/PNG/Objects/rock1.png',              width: 30, height: 30, severe: true  },
    { type: 'tires',         sprite: 'assets/kenney/PNG/Objects/tires_white.png',        width: 28, height: 28, severe: false },
  ],

  // Паттерны формаций препятствий (веса для случайного выбора)
  OBSTACLE_PATTERNS: [
    { type: 'random',   weight: 4 },
    { type: 'gauntlet', weight: 2 },
    { type: 'sides',    weight: 2 },
    { type: 'middle',   weight: 1 },
    { type: 'zigzag',   weight: 1 },
  ],

  DECORATION_SPAWN_INTERVAL: 1.2,
  MAX_DECORATIONS: 12,
  MAX_PARTICLES: 60,

  // Комбо-множитель
  COMBO_MAX: 5,
  COMBO_STEP: 0.5,

  // Пикапы
  PICKUP_SHIELD_INTERVAL: 12,
  PICKUP_NITRO_INTERVAL: 9,
  PICKUP_MAGNET_INTERVAL: 15,
  PICKUP_COIN_TRAIL_INTERVAL: 5,
  PICKUP_COIN_COUNT: 5,
  PICKUP_COIN_GAP: 60,

  // Магнит
  MAGNET_DURATION: 8,      // секунд
  MAGNET_RADIUS: 100,      // пикселей

  // Слипстрим
  SLIPSTREAM_DISTANCE_MIN: 20,
  SLIPSTREAM_DISTANCE_MAX: 100,
  SLIPSTREAM_BOOST: 1.15,

  // Дрифт
  DRIFT_DURATION: 0.5,     // секунд
  DRIFT_COMBO_BONUS: 0.5,

  // Fever Mode
  FEVER_NEARMISS_STREAK: 5,   // near-miss подряд для активации
  FEVER_DURATION: 12,         // секунд
  FEVER_COIN_MULTIPLIER: 2,
  FEVER_NEARMISS_RESET: 3,    // секунд без near-miss → сброс streak
  NEAR_MISS_X_THRESHOLD: 25,  // макс дистанция по X для near-miss (в px)

  // Ежедневные задания
  DAILY_QUESTS_POOL: [
    { id: 'run_distance_3000', type: 'distance',        target: 3000, rewardCoins: 150, rewardExp: 80 },
    { id: 'use_nitro_5',       type: 'nitro_uses',      target: 5,    rewardCoins: 120, rewardExp: 60 },
    { id: 'close_overtakes_10',type: 'close_overtakes', target: 10,   rewardCoins: 180, rewardExp: 90 },
  ],
  DAILY_QUESTS_PER_DAY: 3,

  // Цвета темы и UI
  COLORS: {
    background:  '#050518',
    surface:     'rgba(15, 23, 42, 0.85)',
    surfaceSoft: 'rgba(15, 23, 42, 0.6)',
    primary:     '#ff6b9d',
    secondary:   '#818cf8',
    accent:      '#67e8f9',
    text:        '#ffffff',
    textMuted:   'rgba(255, 255, 255, 0.6)',
    nitro:       '#67e8f9',
    crash:       '#ef4444',
    fever:       '#f59e0b',
  },
};
