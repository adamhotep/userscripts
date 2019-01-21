// ==UserScript==
// @name          xkcd - tweaks for text and navigation
// @namespace     https://github.com/adamhotep/userscripts
// @description   Hidden text below images, archive dates, keyboard navigation
// @author        Adam Katz
// @include       http://xkcd.com/*
// @include       http://www.xkcd.com/*
// @include       https://xkcd.com/*
// @include       https://www.xkcd.com/*
// @grant         GM_addStyle
// @version       1.4.1.20190121
// @license       AGPL
// ==/UserScript==

/* 
 * Copyright (C) 2009+  Adam Katz
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.  This program is distributed in the hope that
 * it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License at <http://www.gnu.org/licenses>.
 */ 

// This was inspired by riddle's "xkcd titles" script from way back in the day.
// https://userscripts-mirror.org/scripts/show/6080
// My version is a little safer, it'll cover multiple images (which may or may
// not create inappropriate spoilers...), and if your internet connection is
// congested (your tubes are clogged), it ensures the title isn't printed
// before the image is drawn (which is the main reason I rewrote it).

/// define GM_addStyle if necessary {{{
if (typeof GM_addStyle == 'undefined') {
  function GM_addStyle(css) {
    'use strict';
    let head = document.head;
    if (head) {
      let style = document.createElement("style");
      style.type = "text/css";
      style.textContent = css;
      head.appendChild(style);
      return style;
    }
    return null;
  }
} // end GM_addStyle }}}

var css = "";

var comic_imgs = document.querySelectorAll(`#comic img[title]`);
if (comic_imgs) {

  // add rollover text
  for (let i = 0, il = comic_imgs.length; i < il; i++) {
    let comicText = document.createElement("div");
    comicText.appendChild(document.createTextNode(comic_imgs[i].title))
    comicText.id = "comicText";
    comicText.classList.add("dont_display");

    comic_imgs[i].removeAttribute("title");

    comic_imgs[i].parentNode.insertBefore(comicText, comic_imgs[i].nextSibling);

    // roll over the image to get the text inserted below the image
    // no cheating:  can't be triggered until image loads (dude, nice modem!)
    comic_imgs[i].addEventListener("load", function() {
        this.onmouseover = function() {
          comicText.classList.remove("dont_display");
          this.onmouseover = null;
        };
      }, true);

  }

  let prev = document.querySelector(`a[rel="prev"][href]`);
  let next = document.querySelector(`a[rel="next"][href]`);
  if (prev && next) {

    function horizontal_scroll() {
      let wide;
      try { // using try-catch because this might become locked down for privacy
        wide = getComputedStyle(document.querySelector(`#comic`));
        if (wide) { wide = wide.width.match(/^[0-9]+/); }
        if (wide) { wide = (wide > window.innerWidth); }
      } catch(error) {
        // iirc, browsers merely lie about this now (hopefully it's good enough)
        console.log("xkcd tweaks: privacy protections may bar computing width. "
                  + "Exact error:\n" + error);
        wide = false;
      }
      return wide;
    }

    // keyboard navigation
    let onKeyDown = function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
      switch (event.key) {
        case "ArrowLeft":
          if (! horizontal_scroll() ) location.href = prev.href;
          break;
        case "ArrowRight":
          if (! horizontal_scroll() ) location.href = next.href;
          break;
        case "c":
        case "?":
        case "Enter":
        case "Escape":
          comicText.classList.toggle("dont_display");
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown, false);
  };

  css += /* syn=css */ `

    #comicText		{ color:gray; padding:1ex; letter-spacing:-0.01em;
    			  font:small-caps 1.4rem "Comic Sans MS",sans-serif; }
    .dont_display	{ display:none; }

  `;

}

// show release dates and color visited links in archive
if (location.pathname.indexOf("/archive/") == 0) {
  css += /* syn=css */ `

    a[title^="20"]::before { content:attr(title); float:left; margin-left:5em; }
    a[title^="20"]:visited		{ color:#b9c!important }
    a[title^="20"]:hover		{ color:#36c!important }
    a[title^="20"]:visited:hover	{ color:#63c!important }

  `;
}

if (css) {
  GM_addStyle(css);
}
