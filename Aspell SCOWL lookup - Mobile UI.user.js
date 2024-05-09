// ==UserScript==
// @name	Aspell SCOWL English Speller Word Lookup - Mobile & Desktop
// @namespace	https://github.com/adamhotep/userscripts
// @author	Adam Katz
// @version	0.1.20240509.0
// @match	*://app.aspell.net/lookup*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// @grant	none
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

var style = nf.style$(`

  :root	{ --link: LinkText; }

  a:hover	{ text-decoration:none; }
  table, textarea { width:100%; }
  table 	{ border:none; border-spacing:0; }
  td, th	{ border:solid 1px #aaaa; }
  body, th	{ font-family:sans-serif; }
  textarea, td:first-child { font-family:monospace; }
  footnote	{ color:#755; font-size:80%; vertical-align:top; }
  #footnotes:not(.expanded) {
    height:1.15em; overflow-y:hidden; transition:height 1.5s;
  }
  #footnotes > b	{ color:var(--link); cursor:pointer; }
  #footnotes          > b::after { content:" +"; }
  #footnotes.expanded > b::after { content:" −"; }

  td[align]:nth-child(6) {
    color:#000; background-color:#fff;
    text-shadow:#fff 0 0 1ex, #fff 0 0 2ex;
  }

  /* Eh? I can't just say "mobile" here?
   * max-width doesn't seem to work right, and browsers seem to lie for @media
   */
  @media screen and (orientation:portrait) {
    body, td, th, textarea, input, select { font-size:1.5rem; }
    textarea	{ font-size:1.7rem; }
    button	{ font-size:2.5rem !important; margin:1vw 0.5vw; }
  }

  @media (prefers-color-scheme: dark) {
    body, td	{ background-color:#333; color:#fff; }
    footnote	{ color:#a99; }
    textarea, input { background-color:#fff3; color:#fff; }
    font[color="ff0000"], :active { color:#f66; font-weight:bold; }
    :root	{ --link:#aaf; }
    :link	{ color:var(--link); }
    :visited	{ color:#d9f; }
  }

`);

// Color footnotes
q$(`td`, 1).forEach(td => {
  td.innerHTML = td.innerHTML.replace(/(\[.\])/g, '<footnote>$1</footnote>');
});

// Color word frequency by rarity
q$(`td[align]:nth-child(6)`, 1).forEach(col => {
  let freq = parseFloat(col.innerText);
  let cell = col.parentElement.children;
  if (freq < 0.01 && cell[2].innerText == "") {	// rare
    let rgb = 128 + 12800 * freq;	// 0-128 out of 255
    col.style.backgroundColor = `rgb(${rgb}, ${rgb}, 255)`;
  } else if (freq >= 1) {	// common
    let rgb = 200 - 2 * freq;	// 0-200 out of 255, inverted
    col.style.backgroundColor = `rgb(255, ${rgb}, ${rgb})`;
  }
});

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

// Actually make the reset button work
var reset = q$(`form button[type="reset"]`);
var textarea = q$(`form textarea`);
if (reset && textarea) {
  reset.addEventListener("click", function() { textarea.value = ""; });
  textarea.autocapitalize = "off";	// no mobile browser auto-capitalization
}
