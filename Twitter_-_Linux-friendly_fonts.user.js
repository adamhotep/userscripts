// ==UserScript==
// @name        Twitter - Linux-friendly fonts
// @namespace   https://github.com/adamhotep/userscripts
// @include     https://twitter.com/*
// @license     GPL
// @grant       none
// @version     0.3.20190121
// ==/UserScript==

'use strict';
var head = document.head;
if (head) {
  let style = document.createElement('style');
  style.setAttribute('type', 'text/css');

  // The Twitter fonts are all (mostly) metrically compatible
  // and only Macs have access to Helvetica or Helvetica Neue. 
  let twitter_fonts = `"Helvetica Neue", Helvetica, Arial, sans-serif`;

  // The fonts added below are all metric-compatible with Arial:
  //   https://en.wikipedia.org/wiki/Arial#Free_alternatives
  //   https://en.wikipedia.org/wiki/Arimo_(typeface)
  //   https://en.wikipedia.org/wiki/Liberation_fonts
  //   https://en.wikipedia.org/wiki/Nimbus_Sans#Nimbus_Sans_L
  style.textContent = /* syn=css */ `
    body {
      font-family:Arimo, "Liberation Sans", "Nimbus Sans L", ${twitter_fonts};
    }
  `;
  head.appendChild(style);
}
