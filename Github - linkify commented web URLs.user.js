// ==UserScript==
// @name        Github - linkify commented web URLs
// @namespace   https://github.com/adamhotep/userscripts
// @include     https://gist.github.com/*
// @include     https://github.com/*
// @grant       none
// @author      Adam Katz
// @version     1
// @copyright   2016+ by Adam Katz
// @license     GPL v3
// @licstart    The following is the entire license notice for this script.
/* 
 * Copyright (C) 2016  Adam Katz
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
// @licend      The above is the entire license notice for this script.
// ==/UserScript==

// This ignores .pl-s (strings) because it may be **constructing** a URL
var plc = document.querySelectorAll(".pl-c");
for (var c = 0, cl = plc.length; c < cl; c++) {
  plc[c].innerHTML = plc[c].innerHTML
    // avoids ampersands (escaped ampersands are okay) and trailing punctuation
    .replace(/\b(https?:\/\/(?:[^&\s]+(?:&amp;)*)+[^\s;?.!,<>()\[\]{}'"&])/ig,
             '<a href="$1">$1</a>');
}
