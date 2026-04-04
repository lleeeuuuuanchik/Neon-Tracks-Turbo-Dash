/**
 * Система локализации.
 * Автоопределение языка через Yandex Games SDK (п. 2.14).
 */
var LANG = {
  _lang: 'ru',

  _strings: {
    ru: {
      // Название
      game_title: 'Неоновые Трассы: Турбо-Рывок',
      eyebrow_label: 'Нео-трассы · Аркада',

      // Меню
      car_alt: 'Машина',
      lvl: 'УР',
      exp: 'ОПЫТ',
      coins: 'Монеты',
      record: 'Рекорд',
      daily_quests: 'Задания дня',
      start_race: 'Старт заезда',
      garage: 'Гараж',
      how_to_play: 'Как играть',
      cars_tab: 'Машины',
      upgrades_tab: 'Улучшения',
      choose_mode: 'Выбери режим',
      meter: 'м',
      lanes_suffix: 'полосы',
      record_prefix: 'Рекорд',
      coins_suffix: 'монет',

      // HUD
      hud_speed: 'Скорость',
      hud_distance: 'Дистанция',
      hud_coins: 'Монеты',
      hud_overtakes: 'Обгоны',
      hud_combo: 'Комбо',
      hud_nitro: 'Нитро',
      hud_armor: 'Броня',
      hud_time: 'Время:',
      nitro_btn: 'Нитро',

      // Пауза
      pause: 'Пауза',
      resume: 'Продолжить',
      quit_menu: 'В меню',

      // Туториал
      tutorial_title: 'Быстрый старт',
      tutorial_text: 'Держи машину в потоке, объезжай трафик и препятствия.',
      tutorial_controls: 'A / ← — влево   D / → — вправо\nW / ▲ — газ   S / ▼ — тормоз\nSpace / Нитро — суперускорение',
      tutorial_ok: 'Понятно',
      help_line: 'A/← влево · D/→ вправо · W/▲ газ · S/▼ тормоз · Space нитро',

      // Game Over
      race_finished: 'Заезд завершён',
      rewarded_text: '+50% монет за просмотр видео',
      get_bonus: 'Получить бонус',
      race_again: 'Ещё заезд',
      to_garage: 'В гараж',
      continue_race: 'Продолжить гонку',
      continue_race_text: 'Восстановить броню и продолжить',
      free_upgrade: 'Бесплатный апгрейд',
      free_upgrade_text: '+1 уровень любого параметра',
      free_upgrade_btn: 'Смотреть',

      // Ориентация
      rotate_device: 'Поверните устройство горизонтально',

      // Магазин
      selected: 'Выбрано',
      select: 'Выбрать',
      level_prefix: 'Уровень',
      max_level: 'МАКС',
      cost_suffix: 'м.',

      // Статы (сокращения)
      stat_spd: 'СКР',
      stat_acc: 'РАЗ',
      stat_hnd: 'УПР',
      stat_arm: 'БРН',

      // Статы (полные)
      speed: 'Скорость',
      acceleration: 'Разгон',
      handling: 'Управление',
      armor: 'Броня',

      // Квесты
      quest_distance: 'Проехать {0} м',
      quest_nitro: 'Нитро {0} раз',
      quest_overtakes: 'Рискованных обгонов: {0}',

      // Fever
      fever_hud: 'ЖАРА x2 ({0}с)',
      fever_hud_short: 'ЖАРА x2',

      // Canvas (render.js)
      dmg_armor: 'брн',
      pickup_shield: '+Щит',
      pickup_nitro: '+Нитро',
      pickup_coins: '+Монеты',
      pickup_magnet: '+Магнит 8с',

      // Машины
      car_starter_black: 'Неоновая тень',
      car_green_racer: 'Зелёный гонщик',
      car_starter_blue: 'Синий импульс',
      car_starter_red: 'Красный рывок',
      car_starter_yellow: 'Солнечный штрих',
      car_blue_lightning: 'Синяя молния',
      car_black_phantom: 'Чёрный фантом',
      car_red_fury: 'Красная ярость',
      car_green_viper: 'Зелёная гадюка',
      car_yellow_storm: 'Жёлтый шторм',
      car_black_beast: 'Чёрный зверь',
      car_blue_demon: 'Синий демон',

      // Режимы
      mode_classic: 'Классический',
      mode_classic_desc: 'Бесконечная трасса. Покажи рекорд дистанции!',
      mode_highway: 'Шоссе',
      mode_highway_desc: '5 полос, плотный трафик. Хаос на шоссе!',
      mode_alley: 'Переулок',
      mode_alley_desc: 'Только 2 полосы. Экстремальная точность!',
      mode_timeAttack: 'На время',
      mode_timeAttack_desc: 'Максимум дистанции за 60 секунд!',
      mode_trafficRush: 'Трафик Раш',
      mode_trafficRush_desc: '4 полосы, максимальный трафик — обгоняй всех!',

      // How to play — секции
      howto_controls: 'Управление',
      howto_left: 'Влево',
      howto_left_desc: 'A / ← или кнопка ‹ на экране',
      howto_right: 'Вправо',
      howto_right_desc: 'D / → или кнопка › на экране',
      howto_gas: 'Газ',
      howto_gas_desc: 'W / ↑ или кнопка ▲ — ускорение',
      howto_brake: 'Тормоз',
      howto_brake_desc: 'S / ↓ или кнопка ▼ — замедление',
      howto_nitro: 'Нитро',
      howto_nitro_desc: 'Space или кнопка «Нитро» — ×1.6 скорость пока заряд не кончится',
      howto_obstacles: 'Препятствия',
      howto_light_name: 'Конус, бочка, барьер, шины',
      howto_light_desc: 'Лёгкое препятствие',
      howto_light_dmg: '−1 броня',
      howto_heavy_name: 'Масло, камень',
      howto_heavy_desc: 'Тяжёлое препятствие — опасно!',
      howto_heavy_dmg: '−3 броня',
      howto_pickups: 'Плюшки',
      howto_shield: 'Щит',
      howto_shield_desc: 'Восстанавливает броню до максимума',
      howto_shield_bonus: '+Щит',
      howto_nitro_pickup: 'Нитро',
      howto_nitro_pickup_desc: 'Полностью заполняет заряд нитро',
      howto_nitro_bonus: '+Нитро',
      howto_coins: 'Монеты',
      howto_coins_desc: 'Серия монет на дороге — собирай все подряд',
      howto_coins_bonus: '+Монеты',
      howto_magnet: 'Магнит',
      howto_magnet_desc: '8 секунд автоматически притягивает монеты в радиусе 100 пикселей',
      howto_magnet_bonus: '+Магнит 8с',
      howto_mechanics: 'Механики',
      howto_drift: 'Дрифт',
      howto_drift_desc: 'Смени полосу удерживая тормоз — машина пойдёт в занос',
      howto_drift_bonus: '+0.5 комбо-множитель',
      howto_fever: 'Режим Жара',
      howto_fever_desc: 'Совершай рискованные обгоны (пролетай рядом с машинами) 5 раз подряд',
      howto_fever_bonus: '×2 монеты на 12 секунд',
      howto_slip: 'Слипстрим',
      howto_slip_desc: 'Езди вплотную за машиной — получаешь небольшое ускорение в потоке',
      howto_slip_bonus: '×1.15 скорость',
      howto_combo: 'Комбо',
      howto_combo_desc: 'Обгоняй и дрифтуй без столкновений — растёт множитель монет',
      howto_combo_bonus: 'до ×5 монет',
      howto_modes: 'Режимы игры',
      howto_classic: 'Классический',
      howto_classic_desc: '3 полосы. Бесконечная трасса — покажи рекорд дистанции!',
      howto_highway: 'Шоссе',
      howto_highway_desc: '5 полос, плотный трафик. Хаос на шоссе!',
      howto_alley: 'Переулок',
      howto_alley_desc: 'Только 2 полосы. Экстремальная точность!',
      howto_time: 'На время',
      howto_time_desc: '3 полосы. Максимум дистанции за 60 секунд!',
      howto_rush: 'Трафик Раш',
      howto_rush_desc: '4 полосы, максимальный трафик — обгоняй всех!',
    },

    en: {
      game_title: 'Neon Tracks: Turbo Dash',
      eyebrow_label: 'Neon Tracks · Arcade',

      car_alt: 'Car',
      lvl: 'LVL',
      exp: 'EXP',
      coins: 'Coins',
      record: 'Record',
      daily_quests: 'Daily Quests',
      start_race: 'Start Race',
      garage: 'Garage',
      how_to_play: 'How to Play',
      cars_tab: 'Cars',
      upgrades_tab: 'Upgrades',
      choose_mode: 'Choose Mode',
      meter: 'm',
      lanes_suffix: 'lanes',
      record_prefix: 'Record',
      coins_suffix: 'coins',

      hud_speed: 'Speed',
      hud_distance: 'Distance',
      hud_coins: 'Coins',
      hud_overtakes: 'Overtakes',
      hud_combo: 'Combo',
      hud_nitro: 'Nitro',
      hud_armor: 'Armor',
      hud_time: 'Time:',
      nitro_btn: 'Nitro',

      pause: 'Pause',
      resume: 'Resume',
      quit_menu: 'Menu',

      tutorial_title: 'Quick Start',
      tutorial_text: 'Keep your car in the flow, dodge traffic and obstacles.',
      tutorial_controls: 'A / ← — left   D / → — right\nW / ▲ — gas   S / ▼ — brake\nSpace / Nitro — turbo boost',
      tutorial_ok: 'Got it',
      help_line: 'A/← left · D/→ right · W/▲ gas · S/▼ brake · Space nitro',

      race_finished: 'Race Finished',
      rewarded_text: '+50% coins for watching a video',
      get_bonus: 'Get Bonus',
      race_again: 'Race Again',
      to_garage: 'To Garage',
      continue_race: 'Continue Race',
      continue_race_text: 'Restore armor and keep going',
      free_upgrade: 'Free Upgrade',
      free_upgrade_text: '+1 level for any stat',
      free_upgrade_btn: 'Watch',

      rotate_device: 'Please rotate your device to landscape',

      selected: 'Selected',
      select: 'Select',
      level_prefix: 'Level',
      max_level: 'MAX',
      cost_suffix: 'c.',

      stat_spd: 'SPD',
      stat_acc: 'ACC',
      stat_hnd: 'HND',
      stat_arm: 'ARM',

      speed: 'Speed',
      acceleration: 'Acceleration',
      handling: 'Handling',
      armor: 'Armor',

      quest_distance: 'Drive {0} m',
      quest_nitro: 'Use Nitro {0} times',
      quest_overtakes: 'Close overtakes: {0}',

      fever_hud: 'FEVER x2 ({0}s)',
      fever_hud_short: 'FEVER x2',

      dmg_armor: 'arm',
      pickup_shield: '+Shield',
      pickup_nitro: '+Nitro',
      pickup_coins: '+Coins',
      pickup_magnet: '+Magnet 8s',

      car_starter_black: 'Neon Shadow',
      car_green_racer: 'Green Racer',
      car_starter_blue: 'Blue Impulse',
      car_starter_red: 'Red Dash',
      car_starter_yellow: 'Sunny Stroke',
      car_blue_lightning: 'Blue Lightning',
      car_black_phantom: 'Black Phantom',
      car_red_fury: 'Red Fury',
      car_green_viper: 'Green Viper',
      car_yellow_storm: 'Yellow Storm',
      car_black_beast: 'Black Beast',
      car_blue_demon: 'Blue Demon',

      mode_classic: 'Classic',
      mode_classic_desc: 'Endless track. Set a distance record!',
      mode_highway: 'Highway',
      mode_highway_desc: '5 lanes, heavy traffic. Highway chaos!',
      mode_alley: 'Alley',
      mode_alley_desc: 'Only 2 lanes. Extreme precision!',
      mode_timeAttack: 'Time Attack',
      mode_timeAttack_desc: 'Max distance in 60 seconds!',
      mode_trafficRush: 'Traffic Rush',
      mode_trafficRush_desc: '4 lanes, maximum traffic — overtake everyone!',

      howto_controls: 'Controls',
      howto_left: 'Left',
      howto_left_desc: 'A / ← or ‹ button on screen',
      howto_right: 'Right',
      howto_right_desc: 'D / → or › button on screen',
      howto_gas: 'Gas',
      howto_gas_desc: 'W / ↑ or ▲ button — accelerate',
      howto_brake: 'Brake',
      howto_brake_desc: 'S / ↓ or ▼ button — slow down',
      howto_nitro: 'Nitro',
      howto_nitro_desc: 'Space or "Nitro" button — ×1.6 speed while charge lasts',
      howto_obstacles: 'Obstacles',
      howto_light_name: 'Cone, barrel, barrier, tires',
      howto_light_desc: 'Light obstacle',
      howto_light_dmg: '−1 armor',
      howto_heavy_name: 'Oil, rock',
      howto_heavy_desc: 'Heavy obstacle — dangerous!',
      howto_heavy_dmg: '−3 armor',
      howto_pickups: 'Pickups',
      howto_shield: 'Shield',
      howto_shield_desc: 'Restores armor to max',
      howto_shield_bonus: '+Shield',
      howto_nitro_pickup: 'Nitro',
      howto_nitro_pickup_desc: 'Fully charges nitro',
      howto_nitro_bonus: '+Nitro',
      howto_coins: 'Coins',
      howto_coins_desc: 'Coin trail on the road — collect them all',
      howto_coins_bonus: '+Coins',
      howto_magnet: 'Magnet',
      howto_magnet_desc: '8 seconds auto-collects coins within 100px radius',
      howto_magnet_bonus: '+Magnet 8s',
      howto_mechanics: 'Mechanics',
      howto_drift: 'Drift',
      howto_drift_desc: 'Change lane while braking — car goes into a drift',
      howto_drift_bonus: '+0.5 combo multiplier',
      howto_fever: 'Fever Mode',
      howto_fever_desc: 'Do near-miss overtakes (fly past cars) 5 times in a row',
      howto_fever_bonus: '×2 coins for 12 seconds',
      howto_slip: 'Slipstream',
      howto_slip_desc: 'Drive close behind a car — get a small speed boost',
      howto_slip_bonus: '×1.15 speed',
      howto_combo: 'Combo',
      howto_combo_desc: 'Overtake and drift without crashing — coin multiplier grows',
      howto_combo_bonus: 'up to ×5 coins',
      howto_modes: 'Game Modes',
      howto_classic: 'Classic',
      howto_classic_desc: '3 lanes. Endless track — set a distance record!',
      howto_highway: 'Highway',
      howto_highway_desc: '5 lanes, heavy traffic. Highway chaos!',
      howto_alley: 'Alley',
      howto_alley_desc: 'Only 2 lanes. Extreme precision!',
      howto_time: 'Time Attack',
      howto_time_desc: '3 lanes. Max distance in 60 seconds!',
      howto_rush: 'Traffic Rush',
      howto_rush_desc: '4 lanes, maximum traffic — overtake everyone!',
    },
  },

  setLang: function (code) {
    this._lang = this._strings[code] ? code : 'ru';
  },

  t: function (key, args) {
    var str = (this._strings[this._lang] && this._strings[this._lang][key]) ||
              this._strings.ru[key] || key;
    if (args !== undefined) {
      str = str.replace('{0}', args);
    }
    return str;
  },

  /** Обновляет все DOM-элементы с атрибутом data-i18n */
  applyToDOM: function () {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (key) els[i].textContent = this.t(key);
    }
  },

  /** Получить локализованное имя машины по id */
  carName: function (carId) {
    return this.t('car_' + carId);
  },

  /** Получить локализованное имя режима */
  modeName: function (modeId) {
    return this.t('mode_' + modeId);
  },

  /** Получить локализованное описание режима */
  modeDesc: function (modeId) {
    return this.t('mode_' + modeId + '_desc');
  },
};
