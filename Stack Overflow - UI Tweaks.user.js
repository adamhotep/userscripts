// ==UserScript==
// @name	Stack Overflow - UI Tweaks
// @namespace	https://github.com/adamhotep/userscripts
// @description	Blue<->red user badges by reputation, wide code, hide flagged Qs
// @include	https://stackoverflow.com/*
// @include	https://serverfault.com/*
// @include	https://superuser.com/*
// @include	https://meta.stackoverflow.com/*
// @include	https://meta.serverfault.com/*
// @include	https://meta.superuser.com/*
// @include	https://*.stackexchange.com/*
// @include	https://askubuntu.com/*
// @include	https://meta.askubuntu.com/*
// @include	https://answers.onstartups.com/*
// @include	https://meta.answers.onstartups.com/*
// @include	https://mathoverflow.net/*
// @include	http://stackoverflow.com/*
// @include	http://serverfault.com/*
// @include	http://superuser.com/*
// @include	http://meta.stackoverflow.com/*
// @include	http://meta.serverfault.com/*
// @include	http://meta.superuser.com/*
// @include	http://*.stackexchange.com/*
// @include	http://askubuntu.com/*
// @include	http://meta.askubuntu.com/*
// @include	http://answers.onstartups.com/*
// @include	http://meta.answers.onstartups.com/*
// @include	http://mathoverflow.net/*
// @version	1.2.1.20210715
// @author	Adam Katz
// @downloadURL	https://github.com/adamhotep/userscripts/raw/master/Stack_Overflow_-_Widen_code_blocks_on_hover.user.js
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

// helpers {{{

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

// Stylesheet for tweaks
var style = document.createElement("style");
style.type = "text/css";
style.textContent = "";
document.head.appendChild(style);
function addStyle(css) { style.textContent += css; }

// end helpers }}}

// color user badges by how high their score is {{{
var user_info = q$(`.user-info`, 1);
if (user_info) {
  addStyle(`
    .reputation_color { text-shadow: 0 0 .1em white; border-radius:.6em; }
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
  if (isNaN(rep)) { continue; }

  let hue = Math.log2(rep);
  let saturation = 60;
  // 2^17 = 131k (top 469 all-time as of Jul 2019), so we'll make that 100% red
  // and then turn up saturation for top performers like Jon Skeet (#1).
  // Skeet's 1113k gets us 91%. Note 999% is treated as 100%, so no cap needed.
  // Superuser (2nd biggest SE site)'s #1 275k, Math.SE's #1 is 465k
  if (hue > 17) {
    saturation = Math.round(saturation + (hue - 17) * 10);
    hue = 17;
  }
  hue = Math.round(hue / 17 * 180 + 180);

  hsla = `hsla(${hue}, ${saturation}%, 50%, 0.2)`;
  box.style.backgroundColor = hsla;
  //console.log(`${u} rep=${rep}\t${hsla}\t${box.style.backgroundColor}`);

  box.classList.add("reputation_color");

  /* previous attempt used privilege tiers and then exponents
  let priv_tier = 0;

  // This uses https://stackoverflow.com/help/privileges and then powers of two
  // to determine the "privilege tier" which will dictate color.
  //
  // 2^15 = 32k, 2^16 = 66k, 2^17 = 131k, 2^18 = 262k.
  // At this time, the 500th best (all time) has 125k reputation.
  // The 100th best has 306k, the 148th has 263k, and the 469th has 131k.
  [ 1, 5, 10, 15, 20, 50, 75, 100, 125, 200, 250, 500, 1000,
    1500, 2000, 2500, 3000, 5000, 10000, 15000, 20000, 25000, // end of privs
    2**15, 2**16, 2**17, 2**18
  ].forEach( function(p) {
    if (rep >= p) priv_tier++;
  });

  // We're using a 26-point blue-to-black-to-red themometer here
  box.style.backgroundColor = `hsl(${priv_tier/26*180+180}, 60%, 50%)`;
  */

}
// done coloring user badges by score }}}

// code block hover-to-widen {{{
var code_blocks = q$(`div.post-text pre`, 1);
if (code_blocks) {

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

    /* Ensure links in code are only barely distinguishable until hovered.
     * Uses a CSS filter b/c StackExchange sites use different color schemes */
    ${noshift} .post-text pre a:not(:hover) {
      /* note to self: brightness() isn't very good at text colors */
      color:inherit; filter:brightness(1.5) sepia(50%);
    }
    ${noshift} .post-text pre a:not(:hover) .com { /* comments within links */
      filter:brightness(0.75) sepia(20%);
    }

    ${noshift} .post-text pre.wider:hover {
      background-color:#eeee;		/* a tiny bit of transparency */
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
    .post-text pre.wider.widest {
      position:relative;
    }
    ${noshift} .post-text pre.wider.widest:hover {
      left:0!important;	/* enable offset correction in js code */
      overflow-x:auto;	/* this MIGHT require scroll and/or !important */
      z-index:1001;	/* On top of .left-sidebar { z-index:1000 } */
    }
    body {
      /* added Linux-friendly fonts ahead of the defaults.
       * (a July 2021 SE change used a font whose spaces were too narrow) */
      --ff-mono: Panic Sans,Bitstream Vera Sans Mono,Inconsolata,Droid Sans Mono,ui-monospace,"Cascadia Mono","Segoe UI Mono","Liberation Mono",Menlo,Monaco,Consolas,monospace;
    }
  `);


  // Designate which code blocks need to grow and by how much
  for (var c = 0, cl = code_blocks.length; c < cl; c++) {

    // Make links clickable.
    code_blocks[c].innerHTML = code_blocks[c].innerHTML.replace(
      // avoid (non-HTML-escaped) ampersands as well as trailing punctuation
      /([^\w.-])(https?:\/\/[-.\w]+\.\w{2,9}\b(?:[^&\s]+(?:&amp;)*)+[^\s;?.!,<>()\[\]{}'"&])/ig,
      '$1<a href="$2">$2</a>');

    var width = code_blocks[c].scrollWidth;
    var offset = code_blocks[c].getBoundingClientRect().x;
    if (width && width > code_blocks[c].clientWidth) {
      code_blocks[c].classList.add("wider");
      if (offset + width > document.body.clientWidth) {
        code_blocks[c].classList.add("widest");
        // marginLeft and marginRight shift everything to the left edge
        // left moves it back to the right, except on :hover (see CSS)
        // therefore the element will be full window width
        code_blocks[c].style.marginRight = offset + "px";	// shifted
        code_blocks[c].style.marginLeft = -offset + "px";	// - offset
        code_blocks[c].style.left = + offset + "px";		// + offset
      }
    }
  }

} // Done with code blocks }}}

// collapse flagged questions when viewing > 15 questions {{{
// (closed, on hold, dupe, etc) https://meta.stackexchange.com/q/10582/259816
var questions = q$(`#questions a[href].question-hyperlink`, 1);
var add_question_css = false;
for (let q = 0, ql = questions.length; ql > 15 && q < ql; q++) {
  if (questions[q].innerText.match(
    /\[(?:duplicate|on hold|migrated|closed)\]$/
  )) {
    let expandor = document.createElement("a");
    add_question_css = true;
    expandor.href = questions[q].href;
    expandor.appendChild(document.createTextNode(" "));
    expandor.classList.add("expandor");

    // must be added *before* the text since the text might wrap
    questions[q].parentElement.insertBefore(expandor, questions[q]);
    questions[q].parentElement.parentElement.parentElement
      .classList.add("skip");

    expandor.onclick = function() {
      this.parentElement.parentElement.parentElement.classList.toggle("open");
      return false; // don't actually go anywhere
    };
  }
}
if (add_question_css) {
  let qs = "#questions .question-summary.skip";
  addStyle(`
    ${qs}:not(.open)			{ height:1.5em; }
    ${qs} .expandor::before		{ color:#59c; }
    ${qs}:not(.open) .expandor::before	{ content:"(expand)"; cursor:zoom-in; }
    ${qs}.open .expandor::before	{ content:"(shrink)"; cursor:zoom-out; }
  `);
}
// Done collapsing flagged questions }}}

// Misc CSS tweaks {{{
addStyle(`

  .deleted-answer pre, .deleted-answer pre code {
    background-color:var(--black-050);
  }

`); // Done with misc CSS tweaks }}}
