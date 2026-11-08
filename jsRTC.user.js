// ==UserScript==
// @name         jsRTC - Real-Time Corruptor (Web)
// @namespace    https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT
// @version      1.4.0
// @description  Reversible visual effects for webpages, media and canvas games, plus page growth.
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

    const GLOBAL_KEY = '__JSRTC_WEB_PORT_140__';
    if (window[GLOBAL_KEY]) return;
    window[GLOBAL_KEY] = true;

    const MAX_SNAPSHOTS = 3000;
    const MAX_SCAN = 2500;
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
    let delay = 350;
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Store original attributes before the first change to each element.
    const snapshots = new Map();
    const imageSources = new Map();
    const MAX_IMAGE_PIXELS = 900000;

    function setStatus(message) {
        const status = ui && ui.querySelector('#status');
        if (status) status.textContent = message;
    }

    function capture(element, needsVisual = false) {
        if (!snapshots.has(element)) {
            if (snapshots.size >= MAX_SNAPSHOTS) return null;

            let baseTransform = null;
            let baseFilter = null;

            if (needsVisual) {
                try {
                    const computed = getComputedStyle(element);
                    baseTransform = computed.transform;
                    baseFilter = computed.filter;
                } catch (_) {
                    baseTransform = 'none';
                    baseFilter = 'none';
                }
            }

            snapshots.set(element, {
                hadClass: element.hasAttribute('class'),
                classValue: element.getAttribute('class'),
                hadStyle: element.hasAttribute('style'),
                styleValue: element.getAttribute('style'),
                baseTransform,
                baseFilter
            });
        } else if (needsVisual) {
            const saved = snapshots.get(element);
            if (saved.baseTransform === null || saved.baseFilter === null) {
                try {
                    const computed = getComputedStyle(element);
                    if (saved.baseTransform === null) saved.baseTransform = computed.transform;
                    if (saved.baseFilter === null) saved.baseFilter = computed.filter;
                } catch (_) {
                    if (saved.baseTransform === null) saved.baseTransform = 'none';
                    if (saved.baseFilter === null) saved.baseFilter = 'none';
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
        const scanLimit = Math.min(nodes.length, MAX_SCAN);

        for (let i = 0; i < scanLimit; i++) {
            const element = nodes[i];
            if (isExcluded(element)) continue;
            if (requireClass && (!element.classList || element.classList.length === 0)) continue;
            candidates.push(element);
        }

        return candidates;
    }

    function collectMedia(selector) {
        const nodes = document.querySelectorAll(selector);
        const candidates = [];
        const scanLimit = Math.min(nodes.length, MAX_SCAN);

        for (let i = 0; i < scanLimit; i++) {
            const element = nodes[i];
            if (!isExcluded(element)) candidates.push(element);
        }

        return candidates;
    }

    function randomItem(items) {
        if (!items || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    }

    function randomClassBlast() {
        const pool = collectCandidates(true);
        if (pool.length < 2) return 0;

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
        if (!pool.length) return 0;

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

    function visualFilter(saved, extraHue = 360) {
        const base = saved.baseFilter && saved.baseFilter !== 'none'
            ? saved.baseFilter + ' '
            : '';
        const hue = Math.round(Math.random() * extraHue);
        const saturation = Math.round(100 + Math.random() * 500);
        const contrast = Math.round(100 + Math.random() * 220);
        const brightness = (0.55 + Math.random() * 1.2).toFixed(2);

        return base +
            'hue-rotate(' + hue + 'deg) ' +
            'saturate(' + saturation + '%) ' +
            'contrast(' + contrast + '%) ' +
            'brightness(' + brightness + ')';
    }

    function applyVisualEffect(element, kind) {
        const saved = capture(element, true);
        if (!saved) return false;

        element.style.setProperty('filter', visualFilter(saved), 'important');

        if (kind === 'image') {
            const rotate = Math.round(Math.random() * 10 - 5);
            const scaleX = Math.random() > 0.82 ? -1 : 1;
            const base = saved.baseTransform && saved.baseTransform !== 'none'
                ? saved.baseTransform + ' '
                : '';
            element.style.setProperty(
                'transform',
                base + 'rotate(' + rotate + 'deg) scaleX(' + scaleX + ')',
                'important'
            );
            element.style.setProperty('transform-origin', 'center center', 'important');
            element.style.setProperty('image-rendering', 'pixelated', 'important');
        } else if (kind === 'video') {
            const rotate = Math.round(Math.random() * 6 - 3);
            const base = saved.baseTransform && saved.baseTransform !== 'none'
                ? saved.baseTransform + ' '
                : '';
            element.style.setProperty(
                'transform',
                base + 'rotate(' + rotate + 'deg)',
                'important'
            );
            element.style.setProperty('transform-origin', 'center center', 'important');
        } else if (kind === 'game') {
            // Keep the canvas geometry unchanged: only apply a temporary filter.
        }

        return true;
    }

    function mediaBlast(kind) {
        let selector = 'img, svg image';
        if (kind === 'video') selector = 'video';
        if (kind === 'game') selector = 'canvas';

        const pool = collectMedia(selector);
        if (!pool.length) return 0;

        let changes = 0;
        const amount = Math.min(intensity, pool.length);

        for (let i = 0; i < amount; i++) {
            const target = randomItem(pool);
            if (target && applyVisualEffect(target, kind)) changes++;
        }

        return changes;
    }

    function corruptImagePixels(image, algorithm) {
        if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) return false;
        if (!imageSources.has(image)) {
            imageSources.set(image, {
                src: image.getAttribute('src'),
                srcset: image.getAttribute('srcset'),
                sizes: image.getAttribute('sizes')
            });
        }
        const w = image.naturalWidth;
        const h = image.naturalHeight;
        if (w * h > MAX_IMAGE_PIXELS) return false;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return false;

        try {
            ctx.drawImage(image, 0, 0, w, h);
            const frame = ctx.getImageData(0, 0, w, h);
            const data = frame.data;
            const original = new Uint8ClampedArray(data);
            const rand = max => Math.floor(Math.random() * max);

            if (algorithm === 'PIXEL' || algorithm === 'IMAGE_ALL') {
                const block = algorithm === 'PIXEL' ? 12 : 22;
                for (let y = 0; y < h; y += block) {
                    for (let x = 0; x < w; x += block) {
                        const sx = Math.min(w - 1, x + rand(Math.min(block, w - x)));
                        const sy = Math.min(h - 1, y + rand(Math.min(block, h - y)));
                        const si = (sy * w + sx) * 4;
                        for (let yy = y; yy < Math.min(h, y + block); yy++) {
                            for (let xx = x; xx < Math.min(w, x + block); xx++) {
                                const di = (yy * w + xx) * 4;
                                data[di] = original[si];
                                data[di + 1] = original[si + 1];
                                data[di + 2] = original[si + 2];
                            }
                        }
                    }
                }
            }

            if (algorithm === 'BLOCKS' || algorithm === 'IMAGE_ALL') {
                const size = 16;
                for (let y = 0; y < h - size; y += size) {
                    for (let x = 0; x < w - size; x += size) {
                        if (Math.random() > 0.35) continue;
                        const dx = rand(Math.max(1, w - size));
                        const dy = rand(Math.max(1, h - size));
                        for (let yy = 0; yy < size; yy++) {
                            for (let xx = 0; xx < size; xx++) {
                                const from = ((y + yy) * w + (x + xx)) * 4;
                                const to = ((dy + yy) * w + (dx + xx)) * 4;
                                data[to] = original[from];
                                data[to + 1] = original[from + 1];
                                data[to + 2] = original[from + 2];
                                data[to + 3] = original[from + 3];
                            }
                        }
                    }
                }
            }

            if (algorithm === 'RGB' || algorithm === 'IMAGE_ALL') {
                const shift = Math.max(2, Math.floor(w * 0.035));
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const i = (y * w + x) * 4;
                        const rx = Math.min(w - 1, x + shift);
                        const bx = Math.max(0, x - shift);
                        data[i] = original[(y * w + rx) * 4];
                        data[i + 2] = original[(y * w + bx) * 4 + 2];
                    }
                }
            }

            if (algorithm === 'ROWS' || algorithm === 'IMAGE_ALL') {
                const rowHeight = 3;
                for (let y = 0; y < h; y += rowHeight) {
                    const offset = rand(Math.max(1, Math.floor(w * 0.35)));
                    for (let yy = y; yy < Math.min(h, y + rowHeight); yy++) {
                        for (let x = 0; x < w; x++) {
                            const sx = (x + offset) % w;
                            const to = (yy * w + x) * 4;
                            const from = (yy * w + sx) * 4;
                            data[to] = original[from];
                            data[to + 1] = original[from + 1];
                            data[to + 2] = original[from + 2];
                        }
                    }
                }
            }

            if (algorithm === 'NOISE' || algorithm === 'IMAGE_ALL') {
                const amount = algorithm === 'NOISE' ? 95 : 145;
                for (let i = 0; i < data.length; i += 4) {
                    if (Math.random() > 0.28) continue;
                    const n = rand(amount * 2 + 1) - amount;
                    data[i] = original[i] + n;
                    data[i + 1] = original[i + 1] - n;
                    data[i + 2] = original[i + 2] + rand(amount) - amount / 2;
                }
            }

            if (algorithm === 'PALETTE' || algorithm === 'IMAGE_ALL') {
                const levels = algorithm === 'PALETTE' ? 3 : 2;
                const step = 255 / (levels - 1);
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.round(data[i] / step) * step;
                    data[i + 1] = Math.round(data[i + 1] / step) * step;
                    data[i + 2] = Math.round(data[i + 2] / step) * step;
                }
            }

            if (algorithm === 'ALPHA' || algorithm === 'IMAGE_ALL') {
                for (let i = 0; i < data.length; i += 4) {
                    if (Math.random() < (algorithm === 'ALPHA' ? 0.32 : 0.48)) data[i + 3] = 0;
                }
            }

            ctx.putImageData(frame, 0, 0);
            const corrupted = canvas.toDataURL('image/png');
            image.removeAttribute('srcset');
            image.removeAttribute('sizes');
            image.src = corrupted;
            return true;
        } catch (error) {
            console.warn('[jsRTC] Image pixel corruption skipped (possibly cross-origin):', error);
            return false;
        }
    }

    function imagePixelBlast(algorithm) {
        const pool = collectMedia('img');
        if (!pool.length) return 0;
        let changed = 0;
        const targets = new Set();
        const tries = Math.min(pool.length, intensity * 3);
        for (let i = 0; i < tries && targets.size < intensity; i++) {
            const item = randomItem(pool);
            if (item) targets.add(item);
        }
        for (const image of targets) {
            if (corruptImagePixels(image, algorithm)) changed++;
        }
        return changed;
    }

    function growBlast() {
        const pool = collectCandidates(false);
        if (!pool.length) return 0;
        let changes = 0;
        for (let i = 0; i < Math.min(intensity, pool.length); i++) {
            const target = randomItem(pool);
            if (!target) continue;
            const rect = target.getBoundingClientRect();
            if (rect.height < 8 || rect.height > 1800) continue;
            if (!capture(target, false)) continue;
            const nextHeight = Math.min(2400, Math.ceil(rect.height * (1.12 + Math.random() * 0.25)));
            target.style.setProperty('min-height', nextHeight + 'px', 'important');
            target.style.setProperty('padding-bottom', Math.min(48, 8 + Math.round(Math.random() * 32)) + 'px', 'important');
            changes++;
        }
        return changes;
    }

    function blast() {
        if (!document.body) return;

        let changes = 0;
        const reports = [];

        if (mode === 'PIXEL' || mode === 'BLOCKS' || mode === 'RGB' || mode === 'ROWS' || mode === 'NOISE' || mode === 'PALETTE' || mode === 'ALPHA' || mode === 'IMAGE_ALL' || mode === 'ALL') {
            const algo = mode === 'ALL' ? 'IMAGE_ALL' : mode;
            const count = imagePixelBlast(algo);
            changes += count;
            reports.push('pixel assets ' + count);
        }

        if (mode === 'GROW' || mode === 'ALL') {
            const count = growBlast();
            changes += count;
            reports.push('grow ' + count);
        }

        if (mode === 'RANDOM' || mode === 'ALL') {
            const count = randomClassBlast();
            changes += count;
            reports.push('web ' + count);
        }

        if (mode === 'TILT' || mode === 'ALL') {
            const count = tiltBlast();
            changes += count;
            reports.push('tilt ' + count);
        }

        if (mode === 'IMAGES' || mode === 'ALL') {
            const count = mediaBlast('image');
            changes += count;
            reports.push('img ' + count);
        }

        if (mode === 'VIDEOS' || mode === 'ALL') {
            const count = mediaBlast('video');
            changes += count;
            reports.push('video ' + count);
        }

        if (mode === 'GAMES' || mode === 'ALL') {
            const count = mediaBlast('game');
            changes += count;
            reports.push('canvas ' + count);
        }

        if (changes > 0) {
            setStatus((mode === 'ALL' ? 'CHAOS' : mode) + ' — ' + reports.join(' · '));
        } else {
            setStatus('No se encontraron elementos compatibles para ' + mode + '.');
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

        for (const [image, saved] of imageSources.entries()) {
            if (!image || !image.isConnected) continue;
            if (saved.src === null) image.removeAttribute('src'); else image.setAttribute('src', saved.src);
            if (saved.srcset === null) image.removeAttribute('srcset'); else image.setAttribute('srcset', saved.srcset);
            if (saved.sizes === null) image.removeAttribute('sizes'); else image.setAttribute('sizes', saved.sizes);
            restored++;
        }
        imageSources.clear();
        snapshots.clear();
        setStatus('RESTORE: ' + restored + ' elementos devueltos a sus atributos guardados.');
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
        setStatus('Auto-corruptor activo (' + delay + ' ms) — modo ' + mode + '.');
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
        host.style.width = '310px';
        host.style.maxWidth = 'calc(100vw - 24px)';
        host.style.pointerEvents = 'auto';

        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent =
            ':host{all:initial;color-scheme:dark;font-family:Arial,Helvetica,sans-serif}' +
            '*{box-sizing:border-box}' +
            '.panel{width:310px;max-width:calc(100vw - 24px);overflow:hidden;border:1px solid #596273;border-radius:12px;background:#171b24;color:#f4f6fb;box-shadow:0 10px 36px #0009;font:13px/1.4 Arial,Helvetica,sans-serif}' +
            '.head{display:flex;align-items:center;gap:8px;padding:10px 11px;background:#252c39;border-bottom:1px solid #3c4658;cursor:move;touch-action:none;user-select:none}' +
            '.brand{font-weight:800;letter-spacing:.4px;flex:1}' +
            '.version{font-size:10px;color:#aeb8ca}' +
            'button,select{font:inherit;color:inherit}' +
            'button{border:1px solid #566176;border-radius:7px;background:#30394a;padding:7px 9px;cursor:pointer}' +
            'button:hover{background:#414d63}' +
            'button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #8db8ff;outline-offset:2px}' +
            '.icon{padding:2px 7px;min-width:25px}' +
            '.body{padding:11px;display:grid;gap:9px;max-height:calc(100vh - 80px);overflow:auto}' +
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
                    '<span class="version">v1.4.0</span>' +
                    '<button class="icon" id="minimize" type="button" title="Minimizar" aria-label="Minimizar">−</button>' +
                    '<button class="icon" id="close" type="button" title="Cerrar" aria-label="Cerrar">×</button>' +
                '</header>' +
                '<div class="body" id="body">' +
                    '<label class="field"><span class="fieldtop">CORRUPTION MODE</span>' +
                        '<select id="mode">' +
                            '<option value="RANDOM">RANDOM — página y clases CSS</option>' +
                            '<option value="TILT">TILT — inclinar elementos</option>' +
                            '<option value="GROW">PAGE GROW — expandir bloques</option>' +
                            '<option value="IMAGES">IMAGE GLITCH — filtros</option>' +
                            '<option value="PIXEL">PIXEL DESTROY — bloques pixelados</option>' +
                            '<option value="BLOCKS">ASSET BLOCK SWAP — bloques mezclados</option>' +
                            '<option value="RGB">RGB SPLIT — canales desplazados</option>' +
                            '<option value="ROWS">SCANLINE SHIFT — filas desordenadas</option>' +
                            '<option value="NOISE">PIXEL NOISE — ruido fuerte</option>' +
                            '<option value="PALETTE">PALETTE CRUSH — pocos colores</option>' +
                            '<option value="ALPHA">ALPHA EATER — transparencia</option>' +
                            '<option value="IMAGE_ALL">IMAGE CHAOS — combinar daños</option>' +
                            '<option value="VIDEOS">VIDEO GLITCH — videos HTML5</option>' +
                            '<option value="GAMES">GAME GLITCH — juegos canvas</option>' +
                            '<option value="ALL">ALL / CHAOS — habilitar todo</option>' +
                        '</select>' +
                    '</label>' +
                    '<label class="field"><span class="fieldtop"><span>INTENSITY</span><span class="value" id="intensity-value">4</span></span>' +
                        '<input id="intensity" type="range" min="1" max="10" value="4">' +
                    '</label>' +
                    '<label class="field"><span class="fieldtop"><span>DELAY</span><span class="value" id="delay-value">350 ms</span></span>' +
                        '<input id="delay" type="range" min="150" max="2500" step="50" value="350">' +
                    '</label>' +
                    '<div class="buttons">' +
                        '<button class="primary" id="start" type="button">START AUTO</button>' +
                        '<button id="blast" type="button">BLAST ONCE</button>' +
                        '<button class="restore" id="restore" type="button">RESTORE ORIGINAL PAGE</button>' +
                    '</div>' +
                    '<div class="status" id="status" role="status" aria-live="polite">Listo. Elige un modo y pulsa BLAST ONCE.</div>' +
                    '<div class="note">Efectos locales: altera píxeles de imágenes en pantalla y guarda sus direcciones originales para RESTORE. No sobrescribe archivos del servidor. Algunas imágenes externas bloquean la lectura por CORS.</div>' +
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
            setStatus('Modo cambiado a ' + mode + '. Página restaurada antes del nuevo modo.');
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
