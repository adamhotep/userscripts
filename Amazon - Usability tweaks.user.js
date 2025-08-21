// ==UserScript==
// @name	Amazon - Usability tweaks
// @description	Make sponsored items less visible unless hovered over
// @author	Adam Katz
// @version	1.0.20250820.0
// @namespace	https://github.com/adamhotep/userscripts
// @match	https://*.amazon.com/*
// @match	https://amazon.com/*
// @icon	https://www.amazon.com/favicon.ico
// @grant	none
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// ==/UserScript==

var sponsored_old = /* syn=css */
  `div[data-component-type="sp-sponsored-result"]`;
var sponsored_old_child = /* syn=css */
  `.a-section > .sg-row > div + div > .sg-col-inner`;
var sponsored= /* syn=css */ `div[data-component-props*="Sponsored"]`;

nf.style$(`

#bbop_feature_div, #hqpWrapper, ${sponsored}
  { transition: opacity 1s ease-out; }
${sponsored_old} ${sponsored_old_child}, ${sponsored}
  { transition: background-color: 1s ease-out; }

#bbop_feature_div:not(:hover), #hqpWrapper:not(:hover),
/* migrate above to display:none? */
${sponsored_old}:not(:hover),
${sponsored}:not(:hover)
  { opacity:0.5; }
${sponsored_old}:not(:hover) ${sponsored_old_child}, ${sponsored}:not(:hover)
  { background-color:#aaa4; }

`);

// Click "No thanks" when asked about joining Amazon Prime (after 1s delay)
nf.wait$('a#prime-decline-button', no_thanks => {
  nf.sleep(999, () => no_thanks.click());
});

