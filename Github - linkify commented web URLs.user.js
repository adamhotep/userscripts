// ==UserScript==
// @name        Github - linkify commented web URLs
// @namespace   https://github.com/adamhotep/userscripts
// @include     https://gist.github.com/*
// @include     https://github.com/*
// @grant       none
// @author      Adam Katz
// @version     1.0.20190209
// @license     GPL
// ==/UserScript==

// WARNING: This "shouldn't" run due to Github's Content Security Policy,
// but when it updates (from Github?), it no longer violates the policy
// and it then starts working. I don't fully understand it.
// See also https://github.com/greasemonkey/greasemonkey/issues/2046
// and https://bugzilla.mozilla.org/show_bug.cgi?id=1267027

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

// This ignores .pl-s (strings) because it may be **constructing** a URL
var plc = document.querySelectorAll(".pl-c");
for (var c = 0, cl = plc.length; c < cl; c++) {
  plc[c].innerHTML = plc[c].innerHTML
    // avoids ampersands (escaped ampersands are okay) and trailing punctuation
    .replace(/\b(https?:\/\/(?:[^&\s]+(?:&amp;)*)+[^\s;?.!,<>()\[\]{}'"&*])/ig,
             '<a href="$1">$1</a>');
}
