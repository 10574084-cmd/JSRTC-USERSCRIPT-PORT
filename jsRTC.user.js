// ==UserScript==
// @name         jsRTC - Real-Time Corruptor (Web)
// @namespace    https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT
// @version      1.0.0
// @description  Visual web-page corruptor with RANDOM and TILT modes, manual blasts and restore.
// @author       10574084-cmd
// @match        http://*/*
// @match        https://*/*
// @run-at       document-idle
// @noframes
// @grant        none
// @homepageURL  https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT
// @supportURL   https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT/issues
// ==/UserScript==

(() => {
    'use strict';

    const GLOBAL_KEY = '__JSRTC_WEB_PORT_100__';
    if (window[GLOBAL_KEY]) return;
    window[GLOBAL_KEY] = true;

    const MAX_SNAPSHOTS = 2500;
    const EXCLUDED_TAGS = new Set([
        'HTML', 'HEAD', 'BODY', 'SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE',
        'BASE', 'NOSCRIPT', 'IFRAME', 'FRAME', 'INPUT', 'TEXTAREA', 'SELECT',
        'OPTION', 'BUTTON', 'LABEL', 'FORM', 'DIALOG'
    ]);

    let host = null;
    let ui = null;
    let timer = null;
    let active = false;
    let mode = 'RANDOM';
    let intensity = 4;
    let delay = 250;
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Original attributes are stored once per element so RESTORE can put them back.
    const snapshots = new Map();

    function setStatus(message) {
        const status = ui && ui.querySelector('#status');
        if (status) status.textContent = message;
    }

    function capture(element, needsTransform) {
        if (!snapshots.has(element)) {
            if (snapshots.size >= MAX_SNAPSHOTS) return null;

            let baseTransform = null;
            if (needsTransform) {
                try {
                    baseTransform = getComputedStyle(element).transform;
                } catch (_) {
                    baseTransform = 'none';
                }
            }

            snapshots.set(element, {
                hadClass: element.hasAttribute('class'),
                classValue: element.getAttribute('class'),
                hadStyle: element.hasAttribute('style'),
                styleValue: element.getAttribute('style'),
                baseTransform: baseTransform
            });
        } else if (needsTransform) {
            const saved = snapshots.get(element);
            if (saved.baseTransform === null) {
                try {
                    saved.baseTransform = getComputedStyle(element).transform;
                } catch (_) {
                    saved.baseTransform = 'none';
                }
            }
        }

        return snapshots.get(element);
    }

    function isExcluded(element) {
        if (!element || element.nodeType !== 1) return true;
        if (EXCLUDED_TAGS.has(element.tagName)) return true;
        if (element.hasAttribute('data-jsrtc-ignore')) return true;
        if (element.isContentEditable) return true;
        if (host && (element === host || host.contains(element))) return true;
        return false;
    }

    function collectCandidates(requireClass) {
        const selector = requireClass ? 'body [class]' : 'body *';
        const nodes = document.querySelectorAll(selector);
        const candidates = [];
        const scanLimit = Math.min(nodes.length, 3000);

        for (let i = 0; i < scanLimit; i++) {
            const element = nodes[i];
            if (isExcluded(element)) continue;
            if (requireClass && (!element.classList || element.classList.length === 0)) continue;
            candidates.push(element);
        }

        return candidates;
    }

    function randomItem(items) {
        if (!items || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    }

    function randomClassBlast() {
        const pool = collectCandidates(true);
        if (pool.length < 2) {
            setStatus('No hay suficientes elementos con clases.');
            return 0;
        }

        let changes = 0;

        for (let i = 0; i < intensity; i++) {
            const donor = randomItem(pool);
            const target = randomItem(pool);
            if (!donor || !target || donor === target) continue;

            const donorClasses = Array.from(donor.classList);
            if (!donorClasses.length) continue;

            const chosenClass = randomItem(donorClasses);
            if (!chosenClass || target.classList.contains(chosenClass)) continue;

            if (!capture(target, false)) continue;
            if (target.classList.length >= 18) continue;

            target.classList.add(chosenClass);
            changes++;
        }

        return changes;
    }

    function tiltBlast() {
        const pool = collectCandidates(false);
        if (!pool.length) {
            setStatus('No hay elementos disponibles para TILT.');
            return 0;
        }

        let changes = 0;

        for (let i = 0; i < intensity; i++) {
            const target = randomItem(pool);
            if (!target) continue;

            const saved = capture(target, true);
            if (!saved) continue;

            const base = saved.baseTransform && saved.baseTransform !== 'none'
                ? saved.baseTransform + ' '
                : '';
            const degrees = Math.round((Math.random() * 28) - 14);

            target.style.setProperty(
                'transform',
                base + 'rotate(' + degrees + 'deg)',
                'important'
            );
            target.style.setProperty('transform-origin', 'center center', 'important');
            changes++;
        }

        return changes;
    }

    function blast() {
        if (!document.body) return;

        const changes = mode === 'TILT' ? tiltBlast() : randomClassBlast();
        if (changes > 0) {
            setStatus(mode + ': ' + changes + ' cambios en este golpe.');
        }
    }

    function restoreAll() {
        let restored = 0;

        for (const [element, saved] of snapshots.entries()) {
            if (!element || !element.isConnected) continue;

            if (saved.hadClass) {
                element.setAttribute('class', saved.classValue);
            } else {
                element.removeAttribute('class');
            }

            if (saved.hadStyle) {
                element.setAttribute('style', saved.styleValue);
            } else {
                element.removeAttribute('style');
            }

            restored++;
        }

        snapshots.clear();
        setStatus('Restaurado: ' + restored + ' elementos.');
        return restored;
    }

    function stop() {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
        active = false;

        const startButton = ui && ui.querySelector('#start');
        if (startButton) startButton.textContent = 'START AUTO';

        return true;
    }

    function start() {
        stop();
        active = true;

        const startButton = ui && ui.querySelector('#start');
        if (startButton) startButton.textContent = 'STOP AUTO';

        blast();
        timer = window.setInterval(blast, delay);
        setStatus('Auto-corruptor activo (' + delay + ' ms).');
    }

    function destroy() {
        stop();
        restoreAll();

        if (host && host.parentNode) host.parentNode.removeChild(host);
        host = null;
        ui = null;
        try {
            delete window[GLOBAL_KEY];
        } catch (_) {
            window[GLOBAL_KEY] = false;
        }
    }

    function buildPanel() {
        host = document.createElement('div');
        host.id = 'jsrtc-userscript-host';
        host.setAttribute('data-jsrtc-ignore', '');
        host.style.position = 'fixed';
        host.style.left = '16px';
        host.style.top = '16px';
        host.style.zIndex = '2147483647';
        host.style.width = '286px';
        host.style.maxWidth = 'calc(100vw - 24px)';
        host.style.pointerEvents = 'auto';

        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent =
            ':host{all:initial;color-scheme:dark;font-family:Arial,Helvetica,sans-serif}' +
            '*{box-sizing:border-box}' +
            '.panel{width:286px;max-width:calc(100vw - 24px);overflow:hidden;border:1px solid #596273;border-radius:12px;background:#171b24;color:#f4f6fb;box-shadow:0 10px 36px #0009;font:13px/1.4 Arial,Helvetica,sans-serif}' +
            '.head{display:flex;align-items:center;gap:8px;padding:10px 11px;background:#252c39;border-bottom:1px solid #3c4658;cursor:move;touch-action:none;user-select:none}' +
            '.brand{font-weight:800;letter-spacing:.4px;flex:1}' +
            '.version{font-size:10px;color:#aeb8ca}' +
            'button,select{font:inherit;color:inherit}' +
            'button{border:1px solid #566176;border-radius:7px;background:#30394a;padding:7px 9px;cursor:pointer}' +
            'button:hover{background:#414d63}' +
            'button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #8db8ff;outline-offset:2px}' +
            '.icon{padding:2px 7px;min-width:25px}' +
            '.body{padding:11px;display:grid;gap:10px}' +
            '.body.hidden{display:none}' +
            '.field{display:grid;gap:5px}' +
            '.fieldtop{display:flex;justify-content:space-between;gap:8px;color:#d8deea}' +
            '.value{color:#a9c9ff;font-variant-numeric:tabular-nums}' +
            'select{width:100%;padding:8px;border-radius:7px;border:1px solid #566176;background:#252c39}' +
            'input[type=range]{width:100%;accent-color:#8db8ff}' +
            '.buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}' +
            '.primary{background:#315c9e;border-color:#4d79bb}' +
            '.restore{grid-column:1/-1;background:#49343b;border-color:#79515d}' +
            '.status{min-height:32px;padding:7px 8px;border-radius:7px;background:#10141b;color:#bdc9dc;font-size:11px;overflow-wrap:anywhere}' +
            '.note{color:#9da9bc;font-size:10px}' +
            '@media(prefers-reduced-motion:no-preference){button{transition:background .12s ease}}';

        const markup =
            '<section class="panel" aria-label="jsRTC control panel">' +
                '<header class="head" id="drag">' +
                    '<span class="brand">jsRTC WEB</span>' +
                    '<span class="version">v1.0.0</span>' +
                    '<button class="icon" id="minimize" type="button" title="Minimizar" aria-label="Minimizar">−</button>' +
                    '<button class="icon" id="close" type="button" title="Cerrar" aria-label="Cerrar">×</button>' +
                '</header>' +
                '<div class="body" id="body">' +
                    '<label class="field"><span class="fieldtop">MODE</span>' +
                        '<select id="mode"><option value="RANDOM">RANDOM — mezclar clases CSS</option><option value="TILT">TILT — inclinar elementos</option></select>' +
                    '</label>' +
                    '<label class="field"><span class="fieldtop"><span>INTENSITY</span><span class="value" id="intensity-value">4</span></span>' +
                        '<input id="intensity" type="range" min="1" max="10" value="4">' +
                    '</label>' +
                    '<label class="field"><span class="fieldtop"><span>DELAY</span><span class="value" id="delay-value">250 ms</span></span>' +
                        '<input id="delay" type="range" min="100" max="2000" step="50" value="250">' +
                    '</label>' +
                    '<div class="buttons">' +
                        '<button class="primary" id="start" type="button">START AUTO</button>' +
                        '<button id="blast" type="button">BLAST ONCE</button>' +
                        '<button class="restore" id="restore" type="button">RESTORE ORIGINAL PAGE</button>' +
                    '</div>' +
                    '<div class="status" id="status" role="status" aria-live="polite">Listo. Elige un modo y pulsa BLAST ONCE.</div>' +
                    '<div class="note">Los cambios son temporales mientras esta página siga abierta. RESTORE revierte los atributos modificados.</div>' +
                '</div>' +
            '</section>';

        shadow.appendChild(style);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = markup;
        shadow.appendChild(wrapper);
        ui = shadow;

        const $ = (selector) => ui.querySelector(selector);
        const modeInput = $('#mode');
        const intensityInput = $('#intensity');
        const delayInput = $('#delay');
        const startButton = $('#start');
        const header = $('#drag');

        modeInput.addEventListener('change', () => {
            stop();
            restoreAll();
            mode = modeInput.value;
            setStatus('Modo cambiado a ' + mode + '. Página limpia.');
        });

        intensityInput.addEventListener('input', () => {
            intensity = Number(intensityInput.value);
            $('#intensity-value').textContent = String(intensity);
        });

        delayInput.addEventListener('input', () => {
            delay = Number(delayInput.value);
            $('#delay-value').textContent = delay + ' ms';
            if (active) start();
        });

        startButton.addEventListener('click', () => {
            if (active) {
                stop();
                setStatus('Auto-corruptor detenido.');
            } else {
                start();
            }
        });

        $('#blast').addEventListener('click', blast);

        $('#restore').addEventListener('click', () => {
            stop();
            restoreAll();
        });

        $('#minimize').addEventListener('click', () => {
            const body = $('#body');
            const hidden = body.classList.toggle('hidden');
            $('#minimize').textContent = hidden ? '+' : '−';
            $('#minimize').setAttribute('aria-label', hidden ? 'Expandir' : 'Minimizar');
        });

        $('#close').addEventListener('click', destroy);

        header.addEventListener('pointerdown', (event) => {
            if (event.target.closest('button')) return;
            dragging = true;

            const rect = host.getBoundingClientRect();
            dragOffsetX = event.clientX - rect.left;
            dragOffsetY = event.clientY - rect.top;

            header.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        header.addEventListener('pointermove', (event) => {
            if (!dragging) return;

            const maxLeft = Math.max(0, window.innerWidth - host.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - 42);

            const left = Math.min(maxLeft, Math.max(0, event.clientX - dragOffsetX));
            const top = Math.min(maxTop, Math.max(0, event.clientY - dragOffsetY));

            host.style.left = left + 'px';
            host.style.top = top + 'px';
            host.style.right = 'auto';
        });

        const stopDragging = () => { dragging = false; };
        header.addEventListener('pointerup', stopDragging);
        header.addEventListener('pointercancel', stopDragging);

        document.body.appendChild(host);
    }

    function mount() {
        if (host || !document.body) return;
        try {
            buildPanel();
        } catch (error) {
            console.error('[jsRTC] No se pudo crear el panel:', error);
            window[GLOBAL_KEY] = false;
        }
    }

    if (document.body) {
        mount();
    } else {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    }
})();
