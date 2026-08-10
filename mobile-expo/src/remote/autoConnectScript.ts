/** Script inyectado en WebView RustDesk: auto-conectar y pintar canvas sin UI Flutter. */
export function buildAutoConnectInjectScript(peerId: string, password?: string): string {
  const safePeer = JSON.stringify(peerId);
  const safePass = JSON.stringify(password ?? '');
  return `
(function () {
  var PEER = ${safePeer};
  var PASS = ${safePass};
  var started = false;
  var canvas = document.getElementById('ats-canvas');
  var ctx = canvas && canvas.getContext('2d');
  var frameW = 0;
  var frameH = 0;

  function hideChrome() {
    try {
      var bg = document.getElementById('div-background');
      if (bg) bg.style.display = 'none';
      var root = document.getElementById('root');
      if (root) root.style.display = 'none';
      document.body.style.background = '#000';
      document.body.style.overflow = 'hidden';
      if (canvas) {
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
    } catch (e) {}
  }

  function paintRgba(display, data) {
    if (!ctx || !data) return;
    var len = data.length || (data.byteLength || 0);
    if (!len) return;
    if (!frameW || !frameH) {
      var guess = Math.round(Math.sqrt(len / 4));
      if (guess > 0) {
        frameW = guess;
        frameH = Math.floor(len / (4 * frameW));
      }
    }
    if (!frameW || !frameH) return;
    if (canvas.width !== frameW) canvas.width = frameW;
    if (canvas.height !== frameH) canvas.height = frameH;
    try {
      var u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
      var img = ctx.createImageData(frameW, frameH);
      img.data.set(u8.subarray(0, frameW * frameH * 4));
      ctx.putImageData(img, 0, 0);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'frame' }));
      }
    } catch (e) {
      console.warn('[ATS] paint', e);
    }
  }

  window.onRgba = function (display, rgba) {
    paintRgba(display, rgba);
  };

  function tryAutoConnect() {
    if (started) return;
    if (typeof window.setByName !== 'function') return;
    started = true;
    hideChrome();
  var session = {
      id: PEER,
      isFileTransfer: false,
      isViewCamera: false,
      isTerminal: false,
      password: PASS || '',
      is_shared_password: !!PASS,
    };
    try {
      window.setByName('session_add_sync', JSON.stringify(session));
      if (window.curConn && typeof window.curConn.setDraw === 'function') {
        window.curConn.setDraw(function (frame) {
          try {
            if (typeof window.onRgba === 'function') window.onRgba(0, frame);
          } catch (e) {}
        });
      }
      window.setByName('session_start', '');
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'connecting' }));
      }
    } catch (e) {
      started = false;
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(e) }));
      }
    }
  }

  function waitAndConnect() {
    hideChrome();
    if (typeof window.setByName === 'function') {
      tryAutoConnect();
      return;
    }
    setTimeout(waitAndConnect, 120);
  }

  var prevInit = window.onInitFinished;
  window.onInitFinished = function () {
    if (typeof prevInit === 'function') try { prevInit(); } catch (e) {}
    setTimeout(waitAndConnect, 50);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(waitAndConnect, 300);
  } else {
    window.addEventListener('load', function () { setTimeout(waitAndConnect, 300); });
  }
})();
true;
`;
}
