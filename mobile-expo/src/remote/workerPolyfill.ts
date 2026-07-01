/** Polyfill Worker para WebView de React Native (no soporta Web Workers nativos). */
export const WORKER_POLYFILL_SCRIPT = `
(function () {
  if (typeof globalThis.Worker !== 'undefined') return;
  class RNWorker {
    constructor(url, options) {
      this._listeners = {};
      this._terminated = false;
      this._url = new URL(url, window.location.href).href;
      this._options = options || {};
      queueMicrotask(() => this._boot());
    }
    _boot() {
      if (this._terminated) return;
      var self = this;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', this._url, true);
      xhr.onload = function () {
        if (self._terminated) return;
        try {
          var code = xhr.responseText;
          var fn = new Function(
            'self',
            'postMessage',
            'onmessage',
            'importScripts',
            code + '\\n//# sourceURL=' + self._url
          );
          var ctx = {
            onmessage: null,
            postMessage: function (data) {
              if (self.onmessage) self.onmessage({ data: data });
              (self._listeners.message || []).forEach(function (h) {
                try { h({ data: data }); } catch (e) {}
              });
            },
          };
          fn(ctx, ctx.postMessage.bind(ctx), null, function () {});
        } catch (e) {
          console.warn('[ATS Desk] Worker polyfill:', self._url, e);
        }
      };
      xhr.onerror = function () {
        console.warn('[ATS Desk] Worker polyfill: no se pudo cargar', self._url);
      };
      xhr.send();
    }
    postMessage(data) {
      if (this._terminated) return;
    }
    addEventListener(type, handler) {
      if (!this._listeners[type]) this._listeners[type] = [];
      this._listeners[type].push(handler);
      if (type === 'message') this.onmessage = handler;
    }
    removeEventListener(type, handler) {
      var list = this._listeners[type] || [];
      this._listeners[type] = list.filter(function (h) { return h !== handler; });
    }
    terminate() {
      this._terminated = true;
    }
  }
  globalThis.Worker = RNWorker;
})();
true;
`;
