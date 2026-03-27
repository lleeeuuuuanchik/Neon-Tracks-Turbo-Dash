/**
 * Точка входа — управление экранами, магазин, режимы, игровой цикл.
 * Этот файл загружается ПОСЛЕДНИМ.
 */
(function () {
  var _animFrameId = null;
  var _runCount = 0;
  var _lastArmorMax = -1;
  var _lastArmor = -1;
  var _currentModeId = null;
  // Кэш DOM-элементов HUD (заполняется при старте игры)
  var _hudEls = null;

  // === Управление экранами ===
  function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    var target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(target, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
      }
    }
  }

  // === Пауза ===
  function pauseGame() {
    if (Game.state !== 'running') return;
    Game.pause();
    YandexSDK.gameplayStop();
    var overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function resumeGame() {
    if (Game.state !== 'paused') return;
    var overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';
    Game.resume();
    YandexSDK.gameplayStart();
    if (_animFrameId) cancelAnimationFrame(_animFrameId);
    _animFrameId = requestAnimationFrame(_gameLoop);
  }

  function quitToMenu() {
    if (Game.state === 'paused') {
      Game.resume();
      Game.finishRun();
    }
    YandexSDK.gameplayStop();
    var overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';
    if (_animFrameId) {
      cancelAnimationFrame(_animFrameId);
      _animFrameId = null;
    }
    showScreen('screen-menu');
    updateMenuUI();
  }

  // === Язык ===
  function updateLangToggleUI() {
    var flag = document.getElementById('lang-flag');
    var code = document.getElementById('lang-code');
    if (flag) flag.textContent = LANG._lang === 'ru' ? '🇷🇺' : '🇬🇧';
    if (code) code.textContent = LANG._lang === 'ru' ? 'RU' : 'EN';
    document.title = LANG.t('game_title');
  }

  // === Меню ===
  function updateMenuUI() {
    var coins = Progress.get('coins');
    var level = Progress.get('level');
    var bestDistance = Progress.get('bestDistance');

    var elCoins = document.getElementById('player-coins');
    var elLevel = document.getElementById('player-level');
    var elBest = document.getElementById('best-distance');
    if (elCoins) elCoins.textContent = coins;
    if (elLevel) elLevel.textContent = level;
    if (elBest) elBest.textContent = bestDistance + ' ' + LANG.t('meter');

    var selectedId = Progress.get('selectedCarId');
    var car = null;
    for (var i = 0; i < CONFIG.CARS.length; i++) {
      if (CONFIG.CARS[i].id === selectedId) {
        car = CONFIG.CARS[i];
        break;
      }
    }
    if (!car) car = CONFIG.CARS[0];

    var img = document.getElementById('menu-car-image');
    var nameEl = document.getElementById('menu-car-name');
    if (img) img.src = car.sprite;
    if (nameEl) nameEl.textContent = LANG.carName(car.id);

    // Анимация машины на превью
    if (typeof gsap !== 'undefined' && img) {
      gsap.killTweensOf(img);
      gsap.to(img, { y: -8, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }

    animateMenuEntrance();

    // Полоска опыта
    var exp = Progress.get('exp');
    var levelVal = level;
    var need = CONFIG.LEVEL_EXP_BASE;
    var expRemaining = exp;
    for (var lv = 1; lv < levelVal; lv++) {
      expRemaining -= need;
      need = Math.round(need * CONFIG.LEVEL_EXP_MULTIPLIER);
    }
    if (expRemaining < 0) expRemaining = 0;
    var bar = document.getElementById('exp-bar');
    if (bar) {
      var width = Math.max(5, Math.min(100, (expRemaining / need) * 100));
      bar.style.width = width + '%';
    }

    // Квесты дня
    var quests = Progress.getDailyQuests();
    var listEl = document.getElementById('daily-quests-list');
    if (listEl) {
      listEl.innerHTML = '';
      for (var j = 0; j < quests.length; j++) {
        var q = quests[j];
        var item = document.createElement('div');
        item.className = 'quest-item' + (q.completed ? ' quest-done' : '');

        var label = '';
        if (q.type === 'distance') label = LANG.t('quest_distance', q.target);
        else if (q.type === 'nitro_uses') label = LANG.t('quest_nitro', q.target);
        else if (q.type === 'close_overtakes') label = LANG.t('quest_overtakes', q.target);

        var prog = Math.min(q.progress, q.target);
        var pct = Math.round((prog / q.target) * 100);

        var top = document.createElement('div');
        top.className = 'quest-item-top';

        var titleEl = document.createElement('div');
        titleEl.className = 'quest-title';
        titleEl.textContent = label;
        top.appendChild(titleEl);

        if (q.completed) {
          var check = document.createElement('span');
          check.className = 'quest-check';
          check.textContent = '✓';
          top.appendChild(check);
        } else {
          var progEl = document.createElement('div');
          progEl.className = 'quest-progress';
          progEl.textContent = prog + ' / ' + q.target;
          top.appendChild(progEl);
        }

        item.appendChild(top);

        var barWrap = document.createElement('div');
        barWrap.className = 'quest-bar';
        var barFill = document.createElement('div');
        barFill.className = 'quest-bar-fill';
        barFill.style.width = pct + '%';
        barWrap.appendChild(barFill);
        item.appendChild(barWrap);

        listEl.appendChild(item);
      }
    }
  }

  // GSAP вход для главного меню
  function animateMenuEntrance() {
    if (typeof gsap === 'undefined') return;
    var els = ['#menu-header', '#menu-main-card', '#menu-quests-card', '#menu-buttons'];
    gsap.fromTo(els, { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: 'power2.out',
      clearProps: 'transform'
    });
    // Отдельная анимация машины
    var wrap = document.getElementById('menu-car-wrap');
    if (wrap) {
      gsap.fromTo(wrap, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.5)', delay: 0.1 });
    }
  }

  // === HUD ===
  function cacheHudElements() {
    _hudEls = {
      speed: document.getElementById('hud-speed'),
      dist: document.getElementById('hud-distance'),
      coins: document.getElementById('hud-coins'),
      nitroFill: document.getElementById('hud-nitro-fill'),
      overtakes: document.getElementById('hud-overtakes'),
      combo: document.getElementById('hud-combo'),
      armor: document.getElementById('hud-armor'),
      timerRow: document.getElementById('hud-timer-row'),
      timer: document.getElementById('hud-timer'),
      fever: document.getElementById('hud-fever'),
    };
  }

  function updateHudUI() {
    var h = _hudEls;
    if (!h) return;

    if (h.speed) h.speed.textContent = Math.round(Game.player.speed);
    if (h.dist) h.dist.textContent = Math.round(Game.distance) + ' ' + LANG.t('meter');
    if (h.coins) h.coins.textContent = Math.round(Game.coinsRun);
    if (h.overtakes) h.overtakes.textContent = Game.overtakes;
    if (h.combo) {
      h.combo.textContent = 'x' + (Game.comboMultiplier % 1 === 0 ? Game.comboMultiplier : Game.comboMultiplier.toFixed(1));
      h.combo.className = 'hud-value hud-combo' + (Game.comboMultiplier > 1 ? ' combo-active' : '');
    }

    if (h.nitroFill) {
      var pct = (Game.nitroCharge / CONFIG.NITRO_MAX) * 100;
      h.nitroFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      if (pct >= 99) {
        h.nitroFill.classList.add('full');
      } else {
        h.nitroFill.classList.remove('full');
      }
    }

    // Броня — пересоздаём DOM только при изменении
    if (h.armor && (_lastArmorMax !== Game.player.armorMax || _lastArmor !== Game.player.armor)) {
      _lastArmorMax = Game.player.armorMax;
      _lastArmor = Game.player.armor;
      h.armor.innerHTML = '';
      for (var i = 0; i < Game.player.armorMax; i++) {
        var pip = document.createElement('div');
        pip.className = 'armor-pip' + (i >= Game.player.armor ? ' empty' : '');
        h.armor.appendChild(pip);
      }
    }

    // Таймер (режим «На время»)
    if (h.timerRow && h.timer) {
      if (Game.timeRemaining !== null) {
        h.timerRow.style.display = '';
        h.timer.textContent = Math.ceil(Game.timeRemaining);
      } else {
        h.timerRow.style.display = 'none';
      }
    }

    // Fever Mode
    if (h.fever) {
      if (Game.player && Game.player.feverMode) {
        h.fever.style.display = '';
        h.fever.textContent = LANG.t('fever_hud', Math.ceil(Game.player.feverTimer));
      } else {
        h.fever.style.display = 'none';
      }
    }
  }

  function updateGameOverUI(result) {
    var distEl = document.getElementById('final-distance');
    var coinsEl = document.getElementById('final-coins');
    var overtakesEl = document.getElementById('final-overtakes');
    if (distEl) distEl.textContent = result.distance;
    if (coinsEl) coinsEl.textContent = result.coins;
    if (overtakesEl) overtakesEl.textContent = result.overtakes || 0;

    if (typeof gsap !== 'undefined') {
      var statsEl = document.querySelectorAll('.gameover-stat');
      if (statsEl.length) {
        gsap.fromTo(statsEl,
          { opacity: 0, scale: 0.7 },
          { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(1.4)', delay: 0.2, clearProps: 'transform' }
        );
      }
    }
  }

  // === Магазин ===
  function updateShopUI() {
    var coinsEl = document.getElementById('shop-coins');
    if (coinsEl) coinsEl.textContent = Progress.get('coins');
    updateCarGrid();
    updateUpgradesPanel();
  }

  function updateCarGrid() {
    var grid = document.getElementById('car-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var unlocked = Progress.get('unlockedCars') || [];
    var selected = Progress.get('selectedCarId');

    for (var i = 0; i < CONFIG.CARS.length; i++) {
      var car = CONFIG.CARS[i];
      var isUnlocked = unlocked.indexOf(car.id) !== -1;
      var isSelected = car.id === selected;

      var card = document.createElement('div');
      card.className = 'car-card' + (isSelected ? ' selected' : '') + (!isUnlocked ? ' locked' : '');

      // Изображение
      var img = document.createElement('img');
      img.className = 'car-card-img';
      img.src = car.sprite;
      img.alt = LANG.carName(car.id);
      card.appendChild(img);

      // Имя
      var name = document.createElement('div');
      name.className = 'car-card-name';
      name.textContent = LANG.carName(car.id);
      card.appendChild(name);

      // Статы-бары
      var statsDiv = document.createElement('div');
      statsDiv.className = 'car-card-stats';
      var statKeys = [
        { key: 'speed', labelKey: 'stat_spd', cls: 'stat-speed', max: 1.5 },
        { key: 'acceleration', labelKey: 'stat_acc', cls: 'stat-accel', max: 1.5 },
        { key: 'handling', labelKey: 'stat_hnd', cls: 'stat-handling', max: 1.5 },
        { key: 'armor', labelKey: 'stat_arm', cls: 'stat-armor', max: 5 },
      ];
      for (var s = 0; s < statKeys.length; s++) {
        var sk = statKeys[s];
        var barRow = document.createElement('div');
        barRow.className = 'car-stat-bar';
        var lbl = document.createElement('span');
        lbl.className = 'car-stat-label';
        lbl.textContent = LANG.t(sk.labelKey);
        var track = document.createElement('div');
        track.className = 'car-stat-track';
        var fill = document.createElement('div');
        fill.className = 'car-stat-fill ' + sk.cls;
        fill.style.width = Math.min(100, (car[sk.key] / sk.max) * 100) + '%';
        track.appendChild(fill);
        barRow.appendChild(lbl);
        barRow.appendChild(track);
        statsDiv.appendChild(barRow);
      }
      card.appendChild(statsDiv);

      // Кнопка действия
      var btn = document.createElement('button');
      btn.className = 'car-card-action';
      if (isSelected) {
        btn.className += ' action-selected';
        btn.textContent = LANG.t('selected');
      } else if (isUnlocked) {
        btn.className += ' action-select';
        btn.textContent = LANG.t('select');
        btn.setAttribute('data-car-id', car.id);
        btn.addEventListener('click', (function (carId) {
          return function (e) {
            e.stopPropagation();
            Progress.selectCar(carId);
            updateShopUI();
          };
        })(car.id));
      } else if (Progress.get('coins') >= car.price) {
        btn.className += ' action-buy';
        btn.textContent = car.price + ' ' + LANG.t('coins_suffix');
        btn.addEventListener('click', (function (carId) {
          return function (e) {
            e.stopPropagation();
            if (Progress.buyCar(carId)) {
              Progress.selectCar(carId);
              updateShopUI();
            }
          };
        })(car.id));
      } else {
        btn.className += ' action-locked';
        btn.textContent = car.price + ' ' + LANG.t('coins_suffix');
      }
      card.appendChild(btn);
      grid.appendChild(card);
    }
  }

  function updateUpgradesPanel() {
    var selectedId = Progress.get('selectedCarId');
    var car = null;
    for (var i = 0; i < CONFIG.CARS.length; i++) {
      if (CONFIG.CARS[i].id === selectedId) { car = CONFIG.CARS[i]; break; }
    }
    if (!car) car = CONFIG.CARS[0];

    var imgEl = document.getElementById('upgrade-car-img');
    var nameEl = document.getElementById('upgrade-car-name');
    if (imgEl) imgEl.src = car.sprite;
    if (nameEl) nameEl.textContent = LANG.carName(car.id);

    var container = document.getElementById('upgrade-stats');
    if (!container) return;
    container.innerHTML = '';

    var stats = CONFIG.UPGRADES.stats;
    var maxLevel = CONFIG.UPGRADES.maxLevel;

    for (var s = 0; s < stats.length; s++) {
      var stat = stats[s];
      var level = Progress.getCarUpgradeLevel(car.id, stat);
      var cost = Progress.getUpgradeCost(car.id, stat);
      var coins = Progress.get('coins');

      var row = document.createElement('div');
      row.className = 'upgrade-row';

      // Инфо
      var info = document.createElement('div');
      info.className = 'upgrade-stat-info';
      var nameDiv = document.createElement('div');
      nameDiv.className = 'upgrade-stat-name';
      nameDiv.textContent = LANG.t(stat);
      var levelDiv = document.createElement('div');
      levelDiv.className = 'upgrade-stat-level';
      levelDiv.textContent = LANG.t('level_prefix') + ' ' + level + ' / ' + maxLevel;
      info.appendChild(nameDiv);
      info.appendChild(levelDiv);

      // Бар
      var barWrap = document.createElement('div');
      barWrap.className = 'upgrade-bar';
      var barFill = document.createElement('div');
      barFill.className = 'upgrade-bar-fill';
      barFill.style.width = (level / maxLevel * 100) + '%';
      barWrap.appendChild(barFill);

      // Кнопка
      var btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      if (level >= maxLevel) {
        btn.className += ' maxed';
        btn.textContent = LANG.t('max_level');
      } else if (coins < cost) {
        btn.className += ' too-expensive';
        btn.textContent = cost + ' ' + LANG.t('cost_suffix');
      } else {
        btn.textContent = cost + ' ' + LANG.t('cost_suffix');
        btn.addEventListener('click', (function (carId, statKey) {
          return function () {
            if (Progress.upgradeCarStat(carId, statKey)) {
              updateShopUI();
            }
          };
        })(car.id, stat));
      }

      row.appendChild(info);
      row.appendChild(barWrap);
      row.appendChild(btn);
      container.appendChild(row);
    }
  }

  // === Табы магазина ===
  function setupShopTabs() {
    var tabCars = document.getElementById('tab-cars');
    var tabUpgrades = document.getElementById('tab-upgrades');
    var contentCars = document.getElementById('shop-tab-cars');
    var contentUpgrades = document.getElementById('shop-tab-upgrades');

    function activateTab(tabName) {
      if (tabCars) tabCars.classList.toggle('active', tabName === 'cars');
      if (tabUpgrades) tabUpgrades.classList.toggle('active', tabName === 'upgrades');
      if (contentCars) contentCars.classList.toggle('active', tabName === 'cars');
      if (contentUpgrades) contentUpgrades.classList.toggle('active', tabName === 'upgrades');
    }

    if (tabCars) tabCars.addEventListener('click', function () { activateTab('cars'); });
    if (tabUpgrades) tabUpgrades.addEventListener('click', function () { activateTab('upgrades'); });
  }

  // === Выбор режима ===
  function updateModesUI() {
    var container = document.getElementById('mode-cards');
    if (!container) return;
    container.innerHTML = '';

    var modes = CONFIG.GAME_MODES;
    var bestByMode = Progress.get('bestDistanceByMode') || {};

    for (var key in modes) {
      var mode = modes[key];
      var card = document.createElement('div');
      card.className = 'mode-card';

      var icon = document.createElement('div');
      icon.className = 'mode-card-icon';
      icon.textContent = mode.icon || '';

      var info = document.createElement('div');
      info.className = 'mode-card-info';
      var nameDiv = document.createElement('div');
      nameDiv.className = 'mode-card-name';
      nameDiv.textContent = LANG.modeName(key);
      var descDiv = document.createElement('div');
      descDiv.className = 'mode-card-desc';
      descDiv.textContent = LANG.modeDesc(key);
      var lanesDiv = document.createElement('div');
      lanesDiv.className = 'mode-card-lanes';
      lanesDiv.textContent = (mode.laneCount || CONFIG.LANE_COUNT) + ' ' + LANG.t('lanes_suffix');
      info.appendChild(nameDiv);
      info.appendChild(descDiv);
      info.appendChild(lanesDiv);

      var best = bestByMode[key];
      if (best) {
        var bestDiv = document.createElement('div');
        bestDiv.className = 'mode-card-best';
        bestDiv.textContent = LANG.t('record_prefix') + ': ' + best + ' ' + LANG.t('meter');
        info.appendChild(bestDiv);
      }

      card.appendChild(icon);
      card.appendChild(info);

      card.addEventListener('click', (function (modeId) {
        return function () { startGame(modeId); };
      })(key));

      // GSAP hover-эффект на карточках режимов
      if (typeof gsap !== 'undefined') {
        card.addEventListener('mouseenter', function () {
          gsap.to(this, { scale: 0.97, duration: 0.18, ease: 'power1.out' });
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(this, { scale: 1, duration: 0.2, ease: 'power1.out' });
        });
      }

      container.appendChild(card);
    }

    // Анимация появления карточек
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(container.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.09, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }

  // === Инициализация ===
  function init() {
    Progress.load();

    // Показываем экран загрузки, меню скрыто
    showScreen('screen-loading');

    // Флаги готовности: SDK инициализирован + все ресурсы загружены
    var _sdkReady = false;
    var _assetsReady = false;

    function onFullyReady() {
      // Язык уже определён через SDK — применяем локализацию
      LANG.applyToDOM();
      updateLangToggleUI();
      updateMenuUI();

      // Переключаемся с загрузки на меню
      showScreen('screen-menu');

      // Сообщаем платформе: игра загружена и готова к взаимодействию
      YandexSDK.notifyReady();
    }

    function tryReady() {
      if (_sdkReady && _assetsReady) {
        onFullyReady();
      }
    }

    YandexSDK.init(function () {
      // Автоопределение языка через SDK (п. 2.14) — до показа меню
      LANG.setLang(YandexSDK.lang);
      _sdkReady = true;
      tryReady();
    });

    // Ждём загрузки всех ресурсов (изображения, шрифты)
    if (document.readyState === 'complete') {
      _assetsReady = true;
    } else {
      window.addEventListener('load', function () {
        _assetsReady = true;
        tryReady();
      });
    }

    // Переключатель языка
    var btnLang = document.getElementById('btn-lang');
    if (btnLang) {
      btnLang.addEventListener('click', function () {
        var next = LANG._lang === 'ru' ? 'en' : 'ru';
        LANG.setLang(next);
        LANG.applyToDOM();
        updateLangToggleUI();
        updateMenuUI();
      });
    }

    // Предотвращение контекстного меню (требование Яндекс Игр)
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });

    // Предотвращение выделения при долгом нажатии на мобильных
    document.addEventListener('selectstart', function (e) {
      e.preventDefault();
    });

    // Блокировка pull-to-refresh и браузерной прокрутки (п. 1.10.2)
    document.addEventListener('touchmove', function (e) {
      // Разрешаем скролл только внутри элементов с собственной прокруткой
      var t = e.target;
      while (t && t !== document.body) {
        var s = window.getComputedStyle(t);
        if (s.overflowY === 'auto' || s.overflowY === 'scroll') {
          return; // Разрешить — это внутренний скролл контента
        }
        t = t.parentElement;
      }
      e.preventDefault();
    }, { passive: false });

    // Пауза при сворачивании вкладки / переключении приложения (требование Яндекс Игр)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && Game.state === 'running') {
        pauseGame();
      }
    });

    // Кнопка «Старт» → выбор режима
    var btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', function () {
        showScreen('screen-modes');
        updateModesUI();
      });
    }

    // Кнопка «Как играть»
    var btnHowto = document.getElementById('btn-howto');
    var btnHowtoClose = document.getElementById('btn-howto-close');
    var howtoOverlay = document.getElementById('howto-overlay');
    if (btnHowto) {
      btnHowto.addEventListener('click', function () {
        if (howtoOverlay) howtoOverlay.style.display = 'flex';
      });
    }
    if (btnHowtoClose) {
      btnHowtoClose.addEventListener('click', function () {
        if (howtoOverlay) howtoOverlay.style.display = 'none';
      });
    }
    if (howtoOverlay) {
      howtoOverlay.addEventListener('click', function (e) {
        if (e.target === howtoOverlay) howtoOverlay.style.display = 'none';
      });
    }

    // Кнопка «Гараж»
    var btnShop = document.getElementById('btn-shop');
    if (btnShop) {
      btnShop.addEventListener('click', function () {
        showScreen('screen-shop');
        updateShopUI();
      });
    }

    // Назад из магазина
    var btnShopBack = document.getElementById('btn-shop-back');
    if (btnShopBack) {
      btnShopBack.addEventListener('click', function () {
        showScreen('screen-menu');
        updateMenuUI();
      });
    }

    // Назад из режимов
    var btnModesBack = document.getElementById('btn-modes-back');
    if (btnModesBack) {
      btnModesBack.addEventListener('click', function () {
        showScreen('screen-menu');
        updateMenuUI();
      });
    }

    // Game Over кнопки
    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', function () {
        showScreen('screen-modes');
        updateModesUI();
      });
    }

    var btnMenu = document.getElementById('btn-menu');
    if (btnMenu) {
      btnMenu.addEventListener('click', function () {
        showScreen('screen-menu');
        updateMenuUI();
      });
    }

    // Кнопка паузы
    var btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', function () {
        pauseGame();
      });
      btnPause.addEventListener('touchstart', function (e) {
        e.preventDefault();
        pauseGame();
      });
    }

    // Кнопки в меню паузы
    var btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', function () {
        resumeGame();
      });
    }

    var btnQuit = document.getElementById('btn-quit');
    if (btnQuit) {
      btnQuit.addEventListener('click', function () {
        quitToMenu();
      });
    }

    // Кнопки управления
    var btnLeft = document.getElementById('btn-left');
    var btnRight = document.getElementById('btn-right');
    var btnNitro = document.getElementById('btn-nitro');

    if (btnLeft) {
      btnLeft.addEventListener('touchstart', function (e) {
        e.preventDefault();
        Game.changeLane('left');
      });
      btnLeft.addEventListener('click', function () {
        Game.changeLane('left');
      });
    }
    if (btnRight) {
      btnRight.addEventListener('touchstart', function (e) {
        e.preventDefault();
        Game.changeLane('right');
      });
      btnRight.addEventListener('click', function () {
        Game.changeLane('right');
      });
    }
    if (btnNitro) {
      btnNitro.addEventListener('touchstart', function (e) {
        e.preventDefault();
        Game.toggleNitro();
      });
      btnNitro.addEventListener('click', function () {
        Game.toggleNitro();
      });
    }

    var btnGas = document.getElementById('btn-gas');
    var btnBrake = document.getElementById('btn-brake');

    if (btnGas) {
      btnGas.addEventListener('touchstart', function (e) { e.preventDefault(); Game.setGas(true); });
      btnGas.addEventListener('touchend',   function (e) { e.preventDefault(); Game.setGas(false); });
      btnGas.addEventListener('mousedown',  function () { Game.setGas(true); });
      btnGas.addEventListener('mouseup',    function () { Game.setGas(false); });
      btnGas.addEventListener('mouseleave', function () { Game.setGas(false); });
    }
    if (btnBrake) {
      btnBrake.addEventListener('touchstart', function (e) { e.preventDefault(); Game.setBrake(true); });
      btnBrake.addEventListener('touchend',   function (e) { e.preventDefault(); Game.setBrake(false); });
      btnBrake.addEventListener('mousedown',  function () { Game.setBrake(true); });
      btnBrake.addEventListener('mouseup',    function () { Game.setBrake(false); });
      btnBrake.addEventListener('mouseleave', function () { Game.setBrake(false); });
    }

    // Rewarded video (с паузой при показе рекламы — требование Яндекс Игр)
    var btnRewarded = document.getElementById('btn-rewarded');
    if (btnRewarded) {
      btnRewarded.addEventListener('click', function () {
        YandexSDK.showRewarded(
          function () {
            var baseCoins = Game._lastRewardCoins || 0;
            var bonus = Math.round(baseCoins * 0.5);
            Progress.addCoins(bonus);
            var block = document.getElementById('rewarded-block');
            if (block) block.style.display = 'none';
            updateMenuUI();
          },
          function () {},
          function () { YandexSDK.gameplayStop(); },
          function () { YandexSDK.gameplayStart(); }
        );
      });
    }

    // Туториал
    var btnCloseTutorial = document.getElementById('btn-close-tutorial');
    if (btnCloseTutorial) {
      btnCloseTutorial.addEventListener('click', function () {
        var overlay = document.getElementById('hud-help');
        if (overlay) overlay.style.display = 'none';
        Progress.set('seenTutorial', true);
      });
    }

    // Клавиатура
    window.addEventListener('keydown', function (e) {
      // Escape — пауза/возобновление
      if (e.code === 'Escape') {
        if (Game.state === 'running') {
          pauseGame();
        } else if (Game.state === 'paused') {
          resumeGame();
        }
        return;
      }

      if (Game.state !== 'running') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        Game.changeLane('left');
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        Game.changeLane('right');
      }
      if (e.code === 'Space') {
        e.preventDefault();
        Game.toggleNitro();
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        Game.setGas(true);
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        e.preventDefault();
        Game.setBrake(true);
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        Game.setGas(false);
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        Game.setBrake(false);
      }
    });

    // Resize
    window.addEventListener('resize', function () {
      if (Render && Render.canvas) {
        Render.resizeToWindow();
      }
    });

    // Табы магазина
    setupShopTabs();
  }

  // Глобальная ссылка на игровой цикл для возобновления после паузы
  var _gameLoop = null;

  function startGame(modeId) {
    _currentModeId = modeId;

    showScreen('screen-game');
    Game.init();
    if (!Render.canvas) {
      Render.init('game-canvas');
    } else {
      Render.resizeToWindow();
    }
    var overlay = document.getElementById('hud-help');
    if (overlay) {
      overlay.style.display = Progress.get('seenTutorial') ? 'none' : 'flex';
      var tutText = document.getElementById('tutorial-text');
      if (tutText) {
        tutText.textContent = LANG.t('tutorial_text') + '\n' + LANG.t('tutorial_controls');
        tutText.style.whiteSpace = 'pre-line';
      }
    }
    var pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.style.display = 'none';

    if (_animFrameId) {
      cancelAnimationFrame(_animFrameId);
    }

    _lastArmorMax = -1;
    _lastArmor = -1;
    cacheHudElements();
    Game.startRun(modeId);

    // GameplayAPI.start() — обязательно для Яндекс Игр
    YandexSDK.gameplayStart();

    _gameLoop = function loop(timestamp) {
      Game.updateFrame(timestamp);
      Render.drawAll();
      updateHudUI();

      if (Game.state === 'running') {
        _animFrameId = requestAnimationFrame(loop);
      } else if (Game.state === 'paused') {
        // Пауза — не запрашиваем следующий кадр, цикл остановлен
        return;
      } else if (Game.state === 'gameover') {
        // GameplayAPI.stop() — обязательно для Яндекс Игр
        YandexSDK.gameplayStop();

        var distance = Math.round(Game.distance);
        var coins = Math.round(Game.coinsRun + CONFIG.COINS_BASE_PER_RUN);
        Game._lastRewardCoins = coins;
        updateGameOverUI({ distance: distance, coins: coins, overtakes: Game.overtakes });

        _runCount += 1;
        showScreen('screen-gameover');

        var block = document.getElementById('rewarded-block');
        if (block) block.style.display = 'block';
        updateMenuUI();
      }
    };
    _animFrameId = requestAnimationFrame(_gameLoop);
  }

  // Запуск
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
