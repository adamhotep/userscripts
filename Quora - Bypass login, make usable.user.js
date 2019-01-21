// ==UserScript==
// @name	Quora - Bypass login, make usable
// @vim_syntax	/* vim:syn=css: comment for CSS syntax
// @namespace	https://github.com/adamhotep/userscripts
// @description	Bypass login, hold "Still have a question?" below answers
// @include	https://www.quora.com/*
// @version	0.2.20181015
// @grant	GM_addStyle
// ==/UserScript==

// Greasemonkey 4 removed GM_addStyle here it is again. {{{
if (typeof GM_addStyle == 'undefined') {
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
}
// }}}

GM_addStyle(` /* this clears the previous CSS comment set for vim_syntax */

  /* remove login dialog, enable scrolling, un-blur page */
  div[id$="_signup_wall_wrapper"] {
    display:none;
  }
  .signup_wall_prevent_scroll {
    overflow:initial;
  }
  .signup_wall_prevent_scroll .SiteHeader,
  .signup_wall_prevent_scroll .LoggedOutFooter,
  .signup_wall_prevent_scroll .ContentWrapper {
    filter:none;
  }

  /* Push "Still have a question" prompt below answers */
  div.BelowQuestionAddPrompt[id$="_question_prompt"] {
    position:initial!important;
  }

  /* In the event you want to float the "Still have a question" dialog:
  div.BelowQuestionAddPrompt[id$="_question_prompt"]:not(:hover) {
    display:inherit;
    max-height:5ex;
    left:0;
    max-width:21.5ex;
    white-space:nowrap;
    overflow-x:hidden;
  }
  */

`);
