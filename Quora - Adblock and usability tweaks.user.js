// ==UserScript==
// @name	Quora - Adblock and usability tweaks
// @namespace	https://github.com/adamhotep/userscripts
// @description	Bypass login, hold "Still have a question?" below answers
// @include	https://www.quora.com/*
// @version	0.3.20221019
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

gray_light = document.querySelectorAll(`.q-box > .qu-color--gray_light`);
if (gray_light) {
  gray_light.forEach(ad => {
    if (ad?.innerText.match(/^Ad\sby\s/)) {
      let prev = null, prev2 = null;
      while (ad?.id != "mainContent") {
        prev2 = prev;
        prev = ad;
        ad = ad.parentElement;
        if (ad == document.body) { prev2 = null; break; } // too far
      }
      if (typeof prev2?.style.display == "string") {
        prev2.style.display = "none";
      }
    }
  });
}

// disabled older bypass for login
//GM_addStyle(`
void(`

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
