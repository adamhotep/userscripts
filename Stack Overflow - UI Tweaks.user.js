// ==UserScript==
// @name	Stack Overflow - UI Tweaks
// @namespace	https://github.com/adamhotep/userscripts
// @description	Widen code blocks on mouse hover, shrink duplicate questions
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
// @version	1.0+20161007
// @author	Adam Katz
// @copyright	2016, Adam Katz <https://stackexchange.com/users/674651>
// @license	ISC; http://opensource.org/licenses/ISC
// @downloadURL	https://github.com/adamhotep/userscripts/raw/master/Stack_Overflow_-_Widen_code_blocks_on_hover.user.js
// @grant	none
// ==/UserScript==

// Copyright (C) 2016 by Adam Katz
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

// Beerware: If you think this is worth it, you are welcome to buy me a beer.

// In addition to the licenses granted above, the authors, to the extent we
// are authorized to do so, and subject to the disclaimer stated above, hereby
// grant Stack Exchange, Inc. permission to make use of this software in any
// way they see fit, including but not limited to incorporating all or parts of
// it within the Stack Exchange codebase, with or without credit to the authors.
// This permission grant does not extend to any code written by third parties,
// unless said parties also agree to it.

var css = "";

// code block hover-to-widen {{{
var code_blocks = document.querySelectorAll("div.post-text pre");
if (code_blocks) {

  css += /* syn=css */ `

    /* Ensure links in code are only barely distinguishable until hovered.
     * Uses a CSS filter b/c StackExchange sites use different color schemes */
    .post-text pre a:not(:hover) {
      /* note to self: brightness() isn't very good at text colors */
      color:inherit; filter:brightness(1.5) sepia(50%);
    }
    .post-text pre a:not(:hover) .com { /* comments within links */
      filter:brightness(0.75) sepia(20%);
    }

    .post-text pre.wider:hover {
      background-color:rgba(236,236,236,0.92); /* a tiny bit of transparency */
      position:relative; z-index:9; /* don't disrupt later elements */
      /* This previously used overflow-x:scroll but box-sizing:border-box fails
       * to account for the scrollbar even though it was previously present,
       * so we use overflow-x:hidden instead. This "shouldn't" matter */
      overflow-x:hidden; /* don't move later elements up by scrollbar height */
      box-sizing: border-box; /* fails to count scroll bar.  Firefox BUG? */
      width:-moz-fit-content; width:-webkit-fit-content; width:fit-content;

      /* BUG: this breaks the window resizes */
      max-width:` + document.body.clientWidth + `px;
    }
    .post-text pre.wider.widest {
      position:relative;
    }
    .post-text pre.wider.widest:hover {
      left:0!important; /* enable offset correction in js code */
      overflow-x:auto;  /* this MIGHT require scroll and/or !important */
    }
    code {
      font-family: Panic Sans,Bitstream Vera Sans Mono,Inconsolata,Droid Sans Mono,Consolas,Menlo,Liberation Mono,monospace;
    }
  `;


  ///// Designate which code blocks need to grow and by how much
  for (var c = 0, cl = code_blocks.length; c < cl; c++) {

    // Make links clickable.
    code_blocks[c].innerHTML = code_blocks[c].innerHTML.replace(
      // avoid ampersands (escaped ampersands are okay) + trailing punctuation
      /([^\w.-])(https?:\/\/[-.\w]+\.\w{2,9}\b(?:[^&\s]+(?:&amp;)*)+[^\s;?.!,<>()\[\]{}'"&])/ig,
      '$1<a href="$2">$2</a>');

    var width = code_blocks[c].scrollWidth;
    var offset = code_blocks[c].getBoundingClientRect().x;
    if (width && width > code_blocks[c].clientWidth) {
      code_blocks[c].className += " wider";
      if (offset + width > document.body.clientWidth) {
        code_blocks[c].className += " widest";
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
var questions = document.querySelectorAll(
  `#questions a[href].question-hyperlink`);
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
  css += /* syn=css */ `
    ${qs}:not(.open)			{ height:1.5em; }
    ${qs} .expandor::before		{ color:#59c; }
    ${qs}:not(.open) .expandor::before	{ content:"(expand)"; cursor:zoom-in; }
    ${qs}.open .expandor::before	{ content:"(shrink)"; cursor:zoom-out; }
  `;
}
// Done collapsing flagged questions }}}


// Add CSS
var stylesheet = document.createElement("style");
stylesheet.type = "text/css";
stylesheet.appendChild(document.createTextNode(css));
document.head.appendChild(stylesheet);

