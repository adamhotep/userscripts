// ==UserScript==
// @name	Stack Overflow - UI Tweaks
// @namespace	https://github.com/adamhotep/userscripts
// @description	Blue<->red user badges by reputation, wide code, hide flagged Qs
// @match	https://stackoverflow.com/*
// @match	https://serverfault.com/*
// @match	https://superuser.com/*
// @match	https://meta.stackoverflow.com/*
// @match	https://meta.serverfault.com/*
// @match	https://meta.superuser.com/*
// @match	https://*.stackexchange.com/*
// @match	https://askubuntu.com/*
// @match	https://meta.askubuntu.com/*
// @match	https://answers.onstartups.com/*
// @match	https://meta.answers.onstartups.com/*
// @match	https://mathoverflow.net/*
// @match	http://stackoverflow.com/*
// @match	http://serverfault.com/*
// @match	http://superuser.com/*
// @match	http://meta.stackoverflow.com/*
// @match	http://meta.serverfault.com/*
// @match	http://meta.superuser.com/*
// @match	http://*.stackexchange.com/*
// @match	http://askubuntu.com/*
// @match	http://meta.askubuntu.com/*
// @match	http://answers.onstartups.com/*
// @match	http://meta.answers.onstartups.com/*
// @match	http://mathoverflow.net/*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// @version	1.4.20250124.0
// @author	Adam Katz
// @grant	none
// ==/UserScript==

// Copyright (C) 2016+ by Adam Katz, https://stackexchange.com/users/674651
// Licensed under the GPL v3+ {{{
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
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
// Beerware: If you think this is worth it, you are welcome to buy me a beer.

// The author of this script is also open to different licensing models in
// order to facilitate incorporation into StackExchange properties.
// }}}

// Stylesheet for tweaks
var style = nf.style$('/* Stack Overflow - UI Tweaks */\n');
function addStyle(css) { style.textContent += css; }

// color user badges by how high their score is {{{
function rep2color(rep) {
  let hue = Math.log2(rep);
  let saturation = 60;
  // 2^17 = 131k (top 711 all-time as of Jun 2022), so we'll make that 100% red
  // and then turn up saturation for top performers like Jon Skeet (#1).
  // Skeet's 1336k gets us 93%. Note 999% is treated as 100%, so no cap needed.
  // Math.SE (2nd biggest SE site)'s #1 is 588k, Superuser (3rd)'s #1 is 404k
  if (hue > 17) {
    saturation = Math.round(saturation + (hue - 17) * 10);
    hue = 17;
  }
  hue = Math.round(hue / 17 * 180 + 180);

  return `hsla(${hue}, ${saturation}%, 50%, 0.2)`;
}

// questions and answers
var user_info = qa$(`.user-info`);
if (user_info) {
  addStyle(`
    .reputation_color { text-shadow: 0 0 .1em Canvas; border-radius:.6em; }
    .reputation_color:hover {
      background-color:transparent!important;
      transition:background-color 1s;
    }
    .post-signature { border:2px solid transparent; }
    .owner { border-radius:.6em; border-color:#88f; }
  `);
}
for (let u = 0, ul = user_info.length; u < ul; u++) {
  let box = user_info[u].parentElement;
  // badge pages shouldn't go to the parent
  if (box.classList.contains("single-badge-count")) {
    box = user_info[u];
  }
  let rep = q$(`.reputation-score`, box);
  if (! rep) { continue; }
  if (rep.title && rep.title.match(/score\s[0-9][0-9,]+/))
       rep = rep.title;
  else rep = rep.innerText;
  rep = rep.replace(/[^0-9]+/g, "");
  box.style.backgroundColor = rep2color(rep);

  box.classList.add("reputation_color");
}

// indexes and search results
var usrcmin = "s-user-card__minimal";
var user_rep = qa$(`.${usrcmin} [title^="reputation score"]`);
if (user_rep) {
  addStyle(`
    .${usrcmin} {
      /* can't yet do 'background-color:attr(data-bgcolor, color, transparent)'
         (as of 2025-01-22, requested in 2018 at https://bugzil.la/1448251)
         https://developer.mozilla.org/en-US/docs/Web/CSS/attr notes <color>
         isn't yet supported and using this outside 'content' is experimental.
       */
      padding:0.3em 0.5em !important; border-radius:0.6em;
      text-shadow: 0 0 0.1em Canvas;
    }
    .${usrcmin}:hover {
      background-color: transparent!important; transition:background-color 1s;
    }
  `);
}
for (let u = 0, ul = user_rep.length; u < ul; u++) {
  let rep = user_rep[u].innerText / 1;
  if (isNaN(rep)) { continue; }
  let card = user_rep[u].parentElement;
  while (!card.classList.contains(usrcmin)) { card = card.parentElement; }

  // browsers don't yet implement attr(foo, color): https://bugzil.la/1448251
  // card.dataset.bgcolor = rep2color(rep);
  card.style.backgroundColor = rep2color(rep);
}
// done coloring user badges by score }}}

// code blocks: hover to widen, clickable comments links {{{
if(q$('#question, .answer, pre')) {

  // Denote whether shift is being held
  let onKeyDown = function(event) {
    if (event.key == "Shift") { document.body.classList.add("shift_key"); }
  };
  let onKeyUp = function(event) {
    if (event.key == "Shift") { document.body.classList.remove("shift_key"); }
  };
  window.addEventListener("keydown", onKeyDown, false);
  window.addEventListener("keyup", onKeyUp, false);
  let noshift = /* syn=css */ `body:not(.shift_key)`;	// CSS matcher

  // CSS to widen on hover
  addStyle(`

    /* comments in links */
    ${noshift} pre.s-code-block > code a:not(:hover) .hljs-comment {
      color:rgb(from var(--highlight-comment, light-dark(#667, #999))
        r g calc(b + 60)) !important;
    }
    ${noshift} pre.s-code-block > code a:hover .hljs-comment {
      color:rgb(from var(--highlight-comment, light-dark(#667, #999))
        calc(r - 60) calc(g - 60) calc(b + 180)) !important;
    }

    ${noshift} pre.code_block.wider:hover {
      /* Explicit use of Dark Reader var is needed here (race condition?) */
      background:rgb(from var(--darkreader-bg--highlight-bg,
        var(--highlight-bg, light-dark(#f6f6f6, #1d1b1b)))
        r g b / calc(alpha - .1));
      position:relative; z-index:9;	/* don't disrupt later elements */
      /* This previously used overflow-x:scroll but box-sizing:border-box fails
       * to account for the scrollbar even though it was previously present,
       * so we use overflow-x:hidden instead. This "shouldn't" matter */
      overflow-x:hidden; /* don't move later elements up by scrollbar height */
      box-sizing: border-box;
      width:-moz-fit-content; width:-webkit-fit-content; width:fit-content;

      /* BUG: this breaks on window resizes, wontfix */
      max-width:${document.body.clientWidth}px;
    }
    pre.code_block.wider.widest {
      position:relative;
    }
    ${noshift} pre.code_block.wider.widest:hover {
      left:0!important;	/* enable offset correction in js code */
      overflow-x:auto;	/* this MIGHT require scroll and/or !important */
      z-index:1001;	/* On top of .left-sidebar { z-index:1000 } */
    }
    body {
      /* added Linux-friendly fonts ahead of the defaults.
       * (a July 2021 SE change used a font whose spaces were too narrow) */
      --ff-mono: Hack,"Panic Sans","Bitstream Vera Sans Mono",Inconsolata,
        "Droid Sans Mono",ui-monospace,"Cascadia Mono","Segoe UI Mono",
        "Liberation Mono",Menlo,Monaco,Consolas,monospace;
    }
  `); // fix syntax highlighting: `


  // Designate which code blocks need to grow and by how much
  nf.wait$('div.post-text pre, div.s-prose pre', code_block => {
    code_block.classList.add("code_block");

    let width = code_block.scrollWidth;
    let offset = code_block.getBoundingClientRect().x;
    if (width && width > code_block.clientWidth) {
      code_block.classList.add("wider");
      if (offset + width > document.body.clientWidth) {
        code_block.classList.add("widest");
        // marginLeft and marginRight shift everything to the left edge
        // left moves it back to the right, except on :hover (see CSS)
        // therefore the element will be full window width
        code_block.style.marginRight = offset + "px";	// shifted
        code_block.style.marginLeft = -offset + "px";	// - offset
        code_block.style.left = + offset + "px";	// + offset
      }
    }

    // Make links clickable.
    code_block.innerHTML = code_block.innerHTML.replace(
      // avoid (non-HTML-escaped) ampersands, tags, and trailing punctuation
      /(?!<[\w.-])https?:\/\/[-.\w]+\.\w{2,9}\b(?:[^&\s<>]+(?:&amp;)*)+[^\s;?.!,<>()\[\]{}'"&]/ig,
      '<a href="$&">$&</a>');
  });
}

// Done with code blocks }}}

// collapse flagged questions when viewing > 15 questions {{{
// (closed, on hold, dupe, etc) https://meta.stackexchange.com/q/10582/259816
var questions = qa$(`#questions h3 a[href^="/questions"]`);
var add_question_css = false;
for (let q = 0, ql = questions.length; ql > 15 && q < ql; q++) {
  if (questions[q].innerText.match(
    /\[(?:duplicate|on hold|migrated|closed)\]$/
  )) {
    let expander = document.createElement("a");
    add_question_css = true;
    expander.href = questions[q].href;
    expander.appendChild(document.createTextNode(" "));
    expander.classList.add("expander");

    // must be added *before* the text since the text might wrap
    questions[q].parentElement.insertBefore(expander, questions[q]);
    questions[q].parentElement.parentElement.parentElement
      .classList.add("skip");

    expander.onclick = function() {
      this.parentElement.parentElement.parentElement.classList.toggle("open");
      return false; // don't actually go anywhere
    };
  }
}
if (add_question_css) {
  let qs = "#questions .skip";
  let closed_link = `${qs}:not(.open) a.question-hyperlink`;
  addStyle(`
    ${qs}:not(.open)	{ height:3.5rem; white-space:nowrap; overflow:clip; }
    ${qs}:not(.open) [class*="-stats"]	{ overflow-x:clip; }
    ${qs} .expander::before		{ color:#59c; }
    ${closed_link}:not(:hover)		{ color:#abc; }
    ${closed_link}			{ letter-spacing:-0.02em;
      font-family:Arial Narrow,Carlito,Calibri; }
    ${qs}:not(.open) .expander::before	{ content:"(expand)"; cursor:zoom-in; }
    ${qs}.open .expander::before	{ content:"(shrink)"; cursor:zoom-out; }
  `);
}
// Done collapsing flagged questions }}}

// adblock {{{
var sponsored = qa$(`div.site-header--sponsored`);
for (let s=0, sl=sponsored.length; s < sl; s++) {
  sponsored[s].parentElement.style.setProperty('display', 'none', 'important');
}
// }}}

// Misc CSS tweaks {{{
addStyle(`

  :root { color-scheme:light dark; }	/* make Canvas and CanvasText work */

  .deleted-answer pre, .deleted-answer pre code {
    background-color:var(--black-050, light-dark(#fff, #252627));
  }
  .s-table-container .s-table td { padding:1px 1ex; }

  textarea.wmd-input {
    /* we have to guess the scrollbar width :-(  FF w/ GTK = 24px for me */
    width:calc(80ch + 24px);	/* 80 monospace chars + scrollbar */
    scrollbar-gutter:stable;	/* always allocate space for scrollbar */
    /* that widening has overlap issues with the sidebar. render atop: */
    position:relative; z-index:5;
  }

`); // Done with misc CSS tweaks }}}
