/**
 * Обёртка Yandex Games SDK v2.
 * Graceful degradation: если SDK недоступен, колбэки вызываются без рекламы.
 */
var YandexSDK = {
  ysdk: null,
  _ready: false,
  _pendingNotifyReady: false,
  lang: 'ru',

  init: function (cb) {
    if (typeof YaGames === 'undefined') {
      if (cb) cb(false);
      return;
    }
    var self = this;
    YaGames.init().then(function (ysdk) {
      self.ysdk = ysdk;
      self._ready = true;
      // Определение языка через SDK
      try {
        var envLang = ysdk.environment && ysdk.environment.i18n && ysdk.environment.i18n.lang;
        if (envLang) self.lang = envLang;
      } catch (e) {}
      if (cb) cb(true);
      if (self._pendingNotifyReady) self.notifyReady();
    }).catch(function () {
      if (cb) cb(false);
    });
  },

  /**
   * Сообщить платформе, что игра загружена и готова к игре (обязательно для модерации).
   * Вызывать один раз после отображения главного меню / готовности к взаимодействию.
   */
  notifyReady: function () {
    if (this.ysdk && this.ysdk.features && this.ysdk.features.LoadingAPI) {
      this.ysdk.features.LoadingAPI.ready();
    } else {
      this._pendingNotifyReady = true;
    }
  },

  /**
   * Сообщить платформе о начале активного геймплея.
   * Вызывать при старте заезда / возобновлении после паузы.
   */
  gameplayStart: function () {
    if (this.ysdk && this.ysdk.features && this.ysdk.features.GameplayAPI) {
      this.ysdk.features.GameplayAPI.start();
    }
  },

  /**
   * Сообщить платформе об остановке геймплея.
   * Вызывать при паузе, рекламе, переходе в меню, game over.
   */
  gameplayStop: function () {
    if (this.ysdk && this.ysdk.features && this.ysdk.features.GameplayAPI) {
      this.ysdk.features.GameplayAPI.stop();
    }
  },

  /**
   * Показать rewarded-рекламу.
   * @param {function} onSuccess — вызывается после просмотра (onRewarded)
   * @param {function} [onError] — вызывается при ошибке или если SDK нет
   * @param {function} [onOpen] — вызывается при открытии рекламы
   * @param {function} [onClose] — вызывается при закрытии рекламы
   */
  showRewarded: function (onSuccess, onError, onOpen, onClose) {
    if (!this.ysdk) {
      if (onSuccess) onSuccess();
      return;
    }
    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: function () {
          if (onOpen) onOpen();
        },
        onRewarded: function () {
          if (onSuccess) onSuccess();
        },
        onClose: function () {
          if (onClose) onClose();
        },
        onError: function () {
          if (onClose) onClose();
          if (onError) onError();
        },
      },
    });
  },

  /**
   * Показать межстраничную рекламу (между уровнями и т.д.).
   * @param {function} [onOpen] — вызывается при открытии рекламы
   * @param {function} [onClose] — вызывается при закрытии рекламы
   */
  showInterstitial: function (onOpen, onClose) {
    if (!this.ysdk) {
      if (onClose) onClose();
      return;
    }
    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: function () {
          if (onOpen) onOpen();
        },
        onClose: function (wasShown) {
          if (onClose) onClose(wasShown);
        },
        onError: function () {
          if (onClose) onClose();
        },
      },
    });
  },
};
