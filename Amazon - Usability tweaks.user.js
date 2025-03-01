// ==UserScript==
// @name	Amazon - Usability tweaks
// @icon	https://www.amazon.com/favicon.ico
// @match	https://*.amazon.com/*
// @match	https://amazon.com/*
// @description	Make sponsored items less visible unless hovered over
// @version	1.0.20220203.1
// @grant	none
// ==/UserScript==

function addStyle(css, doc=document) {
  let style = doc.createElement("style");
  style.type = "text/css";
  style.textContent = css;
  doc.head.appendChild(style);
  return style;
}

var sponsored_old = /* syn=css */
  `div[data-component-type="sp-sponsored-result"]`;
var sponsored_old_child = /* syn=css */
  `.a-section > .sg-row > div + div > .sg-col-inner`;
var sponsored= /* syn=css */ `div[data-component-props*="Sponsored"]`;

addStyle(`

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
