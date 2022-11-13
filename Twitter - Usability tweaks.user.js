// ==UserScript==
// @name	Twitter - Usability tweaks
// @description	Hover for image/video alt text
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @include	https://twitter.com/*
// @include	https://tweetdeck.twitter.com/*
// @version	0.2.20221112.0
// @grant	none
// @require	https://git.io/waitForKeyElements.js
// ==/UserScript==

// Copyright 2021+ by Adam Katz, GPL v3+ {{{
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


// inspired by https://twitter.com/q_aurelius/status/1423648101131333633
function foundImage(image) {

  let alt = image.alt;

  // ignore default alternate text or if we're already done
  if (!alt || alt == "Image" || alt == "Embedded video" || image.title == alt) {
    return;
  }

  // if there's already title text, add a space and a newline
  if (image.title && image.title.match(/\S$/)) {
    image.title += " \n";
  }

  // append alternate text to title to pop up as a tooltip on mouse rollover
  image.title += alt;

}

// hmm, I apparently can't use a comma here anymore
waitForKeyElements(`div[data-testid="tweetPhoto"] img[alt]`, foundImage);
waitForKeyElements(`div[data-testid^="preview"] img[alt]`, foundImage);

