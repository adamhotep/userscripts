// ==UserScript==
// @name        Github - UI Tweaks
// @namespace   https://github.com/adamhotep/userscripts
// @include     https://gist.github.com/*
// @include     https://github.com/*
// @grant       none
// @author      Adam Katz
// @version     1.1.20231202
// @license     GPL
// ==/UserScript==

/*
 * Copyright (C) 2016+ by Adam Katz
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of version 3 of the GNU General Public License as published
 * by the Free Software Foundation. This program is distributed in the hope
 * that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * included LICENSE file or else http://www.gnu.org/licenses for more details.
 *
 * Beerware: If you think this is worth it, you are welcome to buy me a beer.
 */

// Linkify commented web URLs
// This ignores .pl-s (strings) because it may be **constructing** a URL
var plc = document.querySelectorAll(".pl-c");
for (var c = 0, cl = plc.length; c < cl; c++) {
  plc[c].innerHTML = plc[c].innerHTML
    // avoids ampersands (escaped ampersands are okay) and trailing punctuation
    .replace(/\b(https?:\/\/(?:[^&\s]+(?:&amp;)*)+[^\s;?.!,<>()\[\]{}'"&*])/ig,
             '<a href="$1">$1</a>');
}

// Linux Firefox font tweak for fixed-width code segments
let style = document.createElement('style');
style.setAttribute('type', 'text/css');
document.head.appendChild(style);
style.textContent = /* syn=css */ `

  .CodeMirror-sizer pre { font-family:monospace !important; }

`;
