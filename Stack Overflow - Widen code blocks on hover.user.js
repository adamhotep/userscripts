// ==UserScript==
// @name	Stack Overflow - Widen code blocks on hover
// @namespace	https://github.com/adamhotep/userscripts
// @description	Widen code blocks when your mouse hovers over them
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
// @version	1
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

// In addition to the license granted above, the authors, to the extent we
// are authorized to do so, and subject to the disclaimer stated above, hereby
// grant Stack Exchange, Inc. permission to make use of this software in any
// way they see fit, including but not limited to incorporating all or parts of
// it within the Stack Exchange codebase, with or without credit to the authors.
// This permission grant does not extend to any code written by third parties,
// unless said parties also agree to it.

var code_blocks = document.querySelectorAll("div.post-text pre");
if (code_blocks) {

  ///// Create stylesheet
  var stylesheet = document.createElement("style");
  stylesheet.type = "text/css";

  var css = /* syn=css */ `
    .post-text pre.wider:hover {
      background-color:rgba(236,236,236,0.92); /* a tiny bit of transparency */
      position:relative; z-index:9; /* don't disrupt later elements */
      overflow-x:scroll; /* don't move later elements up by scrollbar height */
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
    }
    code {
      font-family: Panic Sans,Bitstream Vera Sans Mono,Inconsolata,Droid Sans Mono,Consolas,Menlo,Liberation Mono,monospace;
    }
  `;

  stylesheet.appendChild(document.createTextNode(css));
  var head = document.getElementsByTagName("head");
  if (head && head[0]) {
    head[0].appendChild(stylesheet);
  } else {
    document.body.insertBefore(stylesheet, document.body.firstChild);
  }
  ///// Done with stylesheet


  ///// Designate which code blocks need to grow and by how much
  for (var c = 0, cl = code_blocks.length; c < cl; c++) {
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
  ///// Done with code blocks

}
