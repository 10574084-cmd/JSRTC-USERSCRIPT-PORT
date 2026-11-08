# jsRTC Web Port

A browser userscript inspired by **jsRTC (Real-Time Corruptor)** by [redscientistlabs](https://github.com/redscientistlabs/jsRTC). This repository contains an independent, web-focused implementation; it is not a byte-for-byte copy of the original project.

## Features

- **RANDOM:** adds CSS classes found on other page elements to randomly selected elements.
- **TILT:** temporarily rotates random page elements.
- **IMAGE GLITCH:** applies temporary visual effects to `img` and SVG image elements.
- **VIDEO GLITCH:** applies temporary visual effects to HTML5 `video` elements without changing playback or video files.
- **GAME GLITCH:** applies temporary visual effects to `canvas` elements, including many HTML5 game render surfaces.
- **ALL / CHAOS:** runs every supported effect mode in one blast.
- Adjustable intensity and automatic-corruption delay.
- Manual **BLAST ONCE**, automatic mode, and **RESTORE ORIGINAL PAGE**.
- Floating, draggable control panel with minimize and close controls.
- Shadow DOM panel to keep the interface separate from the website's normal styles.
- No external libraries, remote scripts, or network requests.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/).
2. Open the [jsRTC.user.js raw file](https://raw.githubusercontent.com/10574084-cmd/JSRTC-USERSCRIPT-PORT/main/jsRTC.user.js).
3. Your userscript manager should offer to install it. Review the script and confirm.
4. Refresh a webpage. The **jsRTC WEB** panel should appear near the upper-left corner.

You can also create a new userscript in your manager and paste the contents of `jsRTC.user.js`.

## Modes

| Mode | What it affects |
|---|---|
| RANDOM | Page elements and their CSS classes |
| TILT | Random page elements |
| IMAGE GLITCH | `img` and SVG image elements |
| VIDEO GLITCH | HTML5 `video` elements |
| GAME GLITCH | `canvas` elements used by many browser games |
| ALL / CHAOS | All of the modes above |

**ALL / CHAOS** does not change the game's logic. It combines the available page, image, video, and canvas visual effects.

## Use

1. Choose a mode from **CORRUPTION MODE**.
2. Adjust **INTENSITY** to control how many elements may be changed per blast.
3. Adjust **DELAY** to choose how often automatic mode runs.
4. Press **BLAST ONCE** for one burst, or **START AUTO** for continuous effects.
5. Press **RESTORE ORIGINAL PAGE** to restore the class and style attributes recorded by the script.
6. Use the minus button to minimize the panel, or the × button to stop, restore, and close it.

## Important: visual effects, not file-byte damage

This is a local visual corruptor. It changes CSS presentation in the current page and records the original attributes so they can be restored. It does **not** rewrite image bytes, alter downloaded files, modify video data, patch a game's JavaScript, or change game memory.

That distinction is intentional: changing actual media bytes or game code inside a live page can break playback, corrupt the page state, or make the site unusable. The visual modes provide a reversible approximation without changing the original resources.

## Compatibility and limitations

- IMAGE GLITCH supports regular `img` and SVG `image` elements. CSS background images are not currently targeted.
- VIDEO GLITCH changes the visual styling of HTML5 `video` elements; it does not edit the video stream or audio.
- GAME GLITCH targets `canvas` elements. This works as a visual effect on many 2D and WebGL game surfaces, but does not alter game mechanics. Games rendered entirely through DOM elements or protected/embedded frames may not be affected.
- Websites using Shadow DOM, cross-origin frames, unusual rendering pipelines, or strict browser policies may behave differently.
- The page is scanned up to a fixed element limit per blast to keep the script from scanning an unlimited DOM.
- Automatic mode can make a busy page harder to use. Stop it or use RESTORE to return to the saved appearance.

## Restore limitations

Restore puts back the original `class` and `style` attributes saved when an element was first modified. A website may also change those attributes while jsRTC is running; restoring can overwrite those later changes on the same elements. Avoid using automatic mode while filling out important forms or performing work that must not be interrupted.

## Credits

- Original project: [redscientistlabs/jsRTC](https://github.com/redscientistlabs/jsRTC)
- Web userscript port: [10574084-cmd/JSRTC-USERSCRIPT-PORT](https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT)

## Project status

Version 1.1.0 adds IMAGE GLITCH, VIDEO GLITCH, GAME GLITCH, and ALL / CHAOS. These modes are reversible CSS presentation effects, not actual resource-byte or game-code corruption.


## JavaScript Lab (separate userscript)

The repository also includes [jsRTC-JS-LAB.user.js](https://raw.githubusercontent.com/10574084-cmd/JSRTC-USERSCRIPT-PORT/main/jsRTC-JS-LAB.user.js), a separate editor for JavaScript snippets that you own or have permission to test.

- **MIX LINES:** shuffles source lines as a deliberately destructive experiment; this can break syntax and statement order.
- **MUTATE NUMBERS:** changes selected numeric literals.
- **RUN IN SANDBOX:** executes the edited snippet in a sandboxed worker, isolated from the current page DOM and same-origin storage, with network connections blocked and a short execution limit.
- **RESET:** clears the editor and removes the sandbox.

This lab does not intercept, rewrite, or execute the live website's JavaScript. Paste only code you are authorized to modify. The main jsRTC userscript remains a visual page/media effect tool.
