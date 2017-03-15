// ==UserScript==
// @name         Cisco Spark - Compact UI
// @namespace    https://github.com/adamhotep/userscripts
// @version      0.1+20170315
// @description  A compact user interface for Cisco Spark
// @author       Adam Katz
// @match        https://web.ciscospark.com/rooms/*/chat
// @grant        none
// @lisence      GPL
// ==/UserScript==

// This is a TamperMonkey script.  I assume it also works in GreaseMonkey
// but Spark doesn't work well in Firefox at the moment.

(function() {
  'use strict';

  var css = document.createElement("style");
  css.type = "text/css";
  css.appendChild(document.createTextNode(/* syn=css */ `

/* activities */
#activities :not([class*="icon"])	{ font-size:inherit!important; }
.activity-text p			{ margin:0; }
#activities .activity-item		{ margin-top:0!important; padding-top:1ex; }
#activities .activity-item:nth-child(2n):not(.system-message):not(:hover) { background:hsla(240,5%,96%,.3); }
body.roskilde #activities .activity-item.system-message { padding-top:0!important; }
#activities .activity-item .content .activity-text, #activities .activity-item .content p.meta { line-height: 1.2em; }

/* conversation list */
#conversation-list .roomListItem	{ padding:0.15em 0; }
#conversation-list .roomListItem:nth-child(2n+1):not(:hover):not(.isActive) { background-color:#fbfbfb; }
#conversation-list div:not(.avatar)	{ font-size:80%; }
#conversation-list .roomListItem-title	{ font-size:175%; }

  `));
  var head = document.getElementsByTagName("head");
  if (head && head[0]) { head = head[0]; } else { head = document.body; }
  head.appendChild(css);

})();
