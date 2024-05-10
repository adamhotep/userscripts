// ==UserScript==
// @name	Aspell SCOWL English Speller Word Lookup - Mobile & Desktop
// @namespace	https://github.com/adamhotep/userscripts
// @author	Adam Katz
// @version	0.1.20240509.1
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

  td[align]:nth-child(6) { color:#000; background-color:#fff; }

  /* Eh? I can't just say "mobile" here?
   * max-width doesn't seem to work right, and browsers seem to lie for @media
   */
  @media screen and (orientation:portrait) {
    body, td, th, textarea, input, select { font-size:1.5rem; }
    textarea	{ font-size:1.7rem; }
    button	{ font-size:2.5rem !important; margin:1vw 0.5vw; }
  }

  @media (prefers-color-scheme: dark) {
    body, td, p	{ background-color:#333; color:#fff; }
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
  let rgb = 255;
  if (freq < 0.01 && cell[2].innerText == "") {	// rare
    rgb = 128 + 12800 * freq;	// 0-128 out of 255
    col.style.backgroundColor = `rgb(${rgb}, ${rgb}, 255)`;
  } else if (freq >= 1) {	// common
    rgb = 200 - 2 * freq;	// 0-200 out of 255, inverted
    col.style.backgroundColor = `rgb(255, ${rgb}, ${rgb})`;
  }
  if (rgb < 128) { col.style.color = "#fff"; }
});

// Collapse footnotes
var footnotes = q$('table + p');
if (footnotes && ! q$('#footnotes')) {
  footnotes.id = "footnotes";
  let entities = Array.from(new Set(footnotes.innerText.match(/\[[^\]]+\]/g)))
    .join(" ");
  let footnotes_intro = $html("b", { textContent:`Footnotes ${entities}` });
  footnotes.insertBefore($html("br"), footnotes.firstChild);
  footnotes.insertBefore($html("br"), footnotes.firstChild);
  footnotes.insertBefore(footnotes_intro, footnotes.firstChild);
  footnotes_intro.addEventListener("click", () => {
    footnotes.classList.toggle("expanded");
  });
}

var textarea = q$(`form > textarea`);
if (textarea) {
  textarea.autocapitalize = "off";	// no mobile browser auto-capitalization
  // The Reset button reverts to the last lookup.
  // If that's not blank, add a Clear button too.
  if (location.search.match(/\bwords=./)) {
    let clear = $html("button", { textContent:"Clear", type:"button" });
    clear.addEventListener("click", () => { textarea.value = ""; });
    textarea.parentElement.appendChild(clear);
  }
}
