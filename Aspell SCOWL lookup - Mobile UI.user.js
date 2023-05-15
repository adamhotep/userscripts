// ==UserScript==
// @name	Aspell SCOWL English Speller Word Lookup - Mobile UI
// @namespace	https://github.com/adamhotep/userscripts
// @author	Adam Katz
// @version	0.1.20230131.6
// @match	*://app.aspell.net/lookup*
// @grant	GM_addStyle
// ==/UserScript==

// Copyright 2023+ by Adam Katz, GPL v3+ {{{
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

if (typeof GM_addStyle == 'undefined') { // {{{
  function GM_addStyle(aCss) {
    'use strict';
    let head = document.head;
    if (head) {
      let style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.textContent = aCss;
      head.appendChild(style);
      return style;
    }
    return null;
  }
} // }}}

// Returns object(s) matched as queried via CSS
// q$(css)           =>  document.querySelector(css)
// q$(css, elem)     =>  elem.querySelector(css)
// q$(css, true)     =>  document.querySelectorAll(css)
// q$(css, elem, 1)  =>  elem.querySelectorAll(css)
function q$(css, up = document, all = 0) { // by Adam Katz, github.com/adamhotep
  if (all === 0 && typeof up != "object") { all = up; up = document; }
  if (all) { return up.querySelectorAll(css); }
  else     { return up.querySelector(css); }
}

GM_addStyle(`

  table, textarea { width:100%; }
  table { border:none; border-spacing:0; }
  td, th { border:solid 1px #aaaa; }
  body, th { font-family:sans-serif; }
  textarea, td:first-child { font-family:monospace; }
  #footnotes:not(.expanded) {
    height:1.15em; overflow-y:hidden; transition:height 1.5s;
  }
  #footnotes.expanded { background-color:Canvas; color:CanvasText; }
  #footnotes > b { color:LinkText; cursor:pointer; }
  #footnotes          > b::after { content:" +"; }
  #footnotes.expanded > b::after { content:" −"; }

  /* Eh? I can't just say "mobile" here?
   * max-width doesn't seem to work right, and browsers seem to lie for @media
   */
  @media screen and (orientation:portrait) {
    body, td, th, textarea, input, select { font-size:1.5rem; }
    textarea { font-size:1.7rem; }
    button { font-size:2.5rem !important; margin:1vw 0.5vw; }
  }

`);

// Collapse footnotes
var footnotes = q$('table + p');
if (footnotes) {
  footnotes.id = "footnotes";
  let entities = footnotes.innerText.match(/\[[^\]]+\]/g).join(" ");
  footnotes_intro = document.createElement("b");
  footnotes.insertBefore(document.createElement("br"), footnotes.firstChild);
  footnotes.insertBefore(document.createElement("br"), footnotes.firstChild);
  footnotes.insertBefore(footnotes_intro, footnotes.firstChild);
  footnotes_intro.textContent = "Footnotes " + entities;
  footnotes_intro.addEventListener("click", function() {
    footnotes.classList.toggle("expanded");
  }, false);
}
