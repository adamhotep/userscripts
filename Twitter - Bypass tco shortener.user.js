// ==UserScript==
// @name	Twitter - Bypass t.co shortener
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @include	https://twitter.com/*
// @include	https://tweetdeck.twitter.com/*
// @version	1.1.2.20210727
// @grant	none
// @require	https://git.io/waitForKeyElements.js
// ==/UserScript==

// Copyright 2019+ by Adam Katz, GPL v3+ {{{
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>. }}}

// This solely bypasses t.co links whose rollover text has their full targets.
// I don't know how to get the targets of placecard links (with the preview),
// so those aren't bypassed. The only way to do that afaict is to actually
// visit the links and I'm not interested in messing with Twitter's engagement
// metrics.

// remove the 'utm_source' trackers
function clean(link) {
  return link.replace(/([&?])utm_[^&]+&?/, "$1").replace(/[…?]{1,2}$/, "");
}

function linkFound(link) {
  if (link.href == link.innerText.replace(/…$/, "")) { return; }
  let tco = link.href;
  link.href = clean(link.title);
  //link.title = tco.replace(/\?.*/, "");
  link.title = tco;
}

waitForKeyElements(/* syn=css */
  `a[href^="https://t.co/"][title^="http"]:not([title^="https://t.co/"])`,
  linkFound);

function probableLink(link) {
  if (link.href == link.innerText) { return; } // already done?
  if (link.innerText.match(/^https?:\/\/\w[^.\s]+\.\S+$/)) {
    link.title = link.href;
    link.href = clean(link.innerText);
  // link text must be a host with optional path (ASCII printable except < or >)
  } else if (link.innerHTML.match(
      /^[\w.]{1,20}\.[a-z]{2,9}\b(?:\/[!-;=?-~]*)?$/)
  ) {
    link.title = link.href;
    link.href = clean("https://" + link.innerText); // guess the protocol
  }
}

waitForKeyElements(/* syn=css */
  `a[href^="https://t.co/"]:not([title])`,
  probableLink);
