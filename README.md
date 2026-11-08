# jsRTC Web Port

A browser userscript inspired by **jsRTC (Real-Time Corruptor)** by [redscientistlabs](https://github.com/redscientistlabs/jsRTC). This repository contains an independent web-focused implementation; it is not a byte-for-byte copy of the original project.

## Features

- **RANDOM:** adds CSS classes found on other page elements to randomly selected elements.
- **TILT:** applies temporary rotation to randomly selected page elements.
- Adjustable intensity and automatic-corruption delay.
- Manual **BLAST ONCE** button.
- **RESTORE ORIGINAL PAGE** button.
- Floating, draggable control panel with minimize and close controls.
- Uses a Shadow DOM panel to keep the interface separate from the website's normal styles.
- No external libraries, remote scripts, or network requests.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/).
2. Open the [jsRTC.user.js raw file](https://raw.githubusercontent.com/10574084-cmd/JSRTC-USERSCRIPT-PORT/main/jsRTC.user.js).
3. Your userscript manager should offer to install it. Review the script and confirm.
4. Refresh a webpage. The **jsRTC WEB** panel should appear near the upper-left corner.

You can also create a new userscript in your manager and paste the contents of `jsRTC.user.js`.

## Use

1. Choose **RANDOM** or **TILT**.
2. Adjust **INTENSITY** to control the number of changes per blast.
3. Adjust **DELAY** to choose how often automatic mode runs.
4. Press **BLAST ONCE** for one burst, or **START AUTO** for continuous corruption.
5. Press **RESTORE ORIGINAL PAGE** to restore the class and style attributes recorded by the script.
6. Use the minus button to minimize the panel, or the × button to stop, restore, and close it.

## Modes and implementation notes

The webpage variant of the upstream project uses random CSS-class mixing. This port implements that idea independently in **RANDOM** mode. **TILT** is a web adaptation that applies temporary CSS rotations; it is not a direct port of the js-dosbox implementation.

The script only targets the current page's DOM. It does not edit website files or send page data to a server. It skips common interactive controls and elements marked with `data-jsrtc-ignore`.

## Restore limitations

Restore puts back the original `class` and `style` attributes saved when an element was first modified. A website may also change those attributes while jsRTC is running; restoring can overwrite those later changes on the same elements. For that reason, use it on pages where temporary visual changes are acceptable, and avoid running it while filling out important forms.

Some websites use complex dynamic layouts, Shadow DOM components, or strict browser policies. Results can vary between sites. The panel is injected after the page's initial document load.

## Credits

- Original project: [redscientistlabs/jsRTC](https://github.com/redscientistlabs/jsRTC)
- Web userscript port: [10574084-cmd/JSRTC-USERSCRIPT-PORT](https://github.com/10574084-cmd/JSRTC-USERSCRIPT-PORT)

## Project status

Version 1.0.0 is the first repository release. RANDOM, TILT, automatic mode, manual blasts, panel controls, and restore are included. Exact behavior may differ from the original jsRTC variants.
