// ==UserScript==
// @name         jsRTC - JavaScript Lab (Sandbox)
// @namespace    https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT
// @version      1.0.0
// @description  Mix and test JavaScript snippets you own inside an isolated sandbox.
// @author       10574084-cmd
// @match        http://*/*
// @match        https://*/*
// @run-at       document-idle
// @noframes
// @grant        none
// @homepageURL  https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT
// ==/UserScript==

(() => {
  'use strict';
  const KEY = '__JSRTC_JS_LAB_100__';
  if (window[KEY]) return;
  window[KEY] = true;

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483647;';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box} .panel{width:min(430px,calc(100vw - 28px));background:#171b24;color:#f3f6fc;border:1px solid #566176;border-radius:12px;box-shadow:0 10px 36px #0009;font:13px/1.45 Arial,sans-serif;overflow:hidden}
      header{display:flex;align-items:center;padding:10px 12px;background:#252c39;gap:8px;font-weight:700}
      header span{flex:1} button{border:1px solid #566176;border-radius:7px;background:#30394a;color:inherit;padding:7px 9px;cursor:pointer}
      button:hover{background:#414d63} .body{padding:11px;display:grid;gap:8px}
      textarea{width:100%;height:180px;resize:vertical;background:#0e1219;color:#dce7f8;border:1px solid #46536a;border-radius:7px;padding:9px;font:12px/1.45 monospace}
      .row{display:flex;gap:7px;flex-wrap:wrap}.row button{flex:1}
      .primary{background:#315c9e;border-color:#4d79bb}.status{background:#0e1219;padding:8px;border-radius:7px;color:#b9c8df;min-height:34px;overflow-wrap:anywhere}
      .small{font-size:10px;color:#9da9bc}
    </style>
    <section class="panel">
      <header><span>jsRTC — JS LAB</span><button id="hide" title="Ocultar">−</button><button id="close" title="Cerrar">×</button></header>
      <div class="body" id="body">
        <div>Paste JavaScript that you own or have permission to test.</div>
        <textarea id="source" spellcheck="false" placeholder="// Paste your test JavaScript here\nconsole.log('Hello from JS Lab');"></textarea>
        <div class="row"><button id="mix">MIX LINES</button><button id="numbers">MUTATE NUMBERS</button></div>
        <div class="row"><button id="run" class="primary">RUN IN SANDBOX</button><button id="reset">RESET</button></div>
        <div class="status" id="status" role="status" aria-live="polite">Ready. The code runs in an isolated iframe, not in the current page.</div>
        <div class="small">This lab does not patch the website's JavaScript or game logic. Mixing lines can break syntax. Sandbox network access is blocked by its content policy; do not paste secrets or code you do not trust.</div>
      </div>
    </section>`;

  const $ = s => shadow.querySelector(s);
  const source = $('#source');
  const status = $('#status');
  let sandbox = null;

  function setStatus(s){ status.textContent = s; }
  function escapeForScript(code){
    return JSON.stringify(code).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  }
  function removeSandbox(){
    if(sandbox){ sandbox.remove(); sandbox = null; }
  }

  $('#mix').addEventListener('click', () => {
    const lines = source.value.split('\n');
    if(lines.length < 2){ setStatus('Add at least two lines first.'); return; }
    for(let i=lines.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [lines[i],lines[j]]=[lines[j],lines[i]];
    }
    source.value = lines.join('\n');
    setStatus('Lines mixed. Review the result; statement order may be important.');
  });

  $('#numbers').addEventListener('click', () => {
    let count = 0;
    source.value = source.value.replace(/\b\d+(?:\.\d+)?\b/g, token => {
      if(Math.random() > 0.45) return token;
      count++;
      const n = Number(token);
      const delta = Math.max(1, Math.round(Math.abs(n) * (0.1 + Math.random() * 0.8)));
      return String(Math.max(0, Math.round(n + (Math.random() < 0.5 ? -delta : delta))));
    });
    setStatus('Changed ' + count + ' numeric literal(s). Review before running.');
  });

  $('#run').addEventListener('click', () => {
    removeSandbox();
    const code = source.value;
    if(!code.trim()){ setStatus('Paste some JavaScript first.'); return; }

    sandbox = document.createElement('iframe');
    sandbox.setAttribute('sandbox','allow-scripts');
    sandbox.setAttribute('title','jsRTC isolated JavaScript sandbox');
    sandbox.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;';
    const safeCode = escapeForScript(code);
    sandbox.srcdoc = '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; connect-src \'none\'; img-src data:; style-src \'unsafe-inline\'; form-action \'none\'"><script>try{(0,eval)(' + safeCode + ')}catch(e){console.error(e)}<\\/script>';
    document.documentElement.appendChild(sandbox);
    setStatus('Code launched in a sandboxed iframe. It cannot access this page DOM or same-origin storage.');
  });

  $('#reset').addEventListener('click', () => {
    removeSandbox();
    source.value = '';
    setStatus('Editor cleared; sandbox removed.');
  });
  $('#hide').addEventListener('click', () => {
    const body = $('#body');
    body.hidden = !body.hidden;
    $('#hide').textContent = body.hidden ? '+' : '−';
  });
  $('#close').addEventListener('click', () => {
    removeSandbox();
    host.remove();
    try{delete window[KEY]}catch(_){window[KEY]=false}
  });

  (document.body || document.documentElement).appendChild(host);
})();