// ==UserScript==
// @name           Generic - Green SSL Password Fields
// @namespace      https://github.com/adamhotep/userscripts
// @description    Colors the passwd field green if secure, red if not
// @include        *
// @grant          GM_addStyle
// @icon           https://raw.githubusercontent.com/adamhotep/userscripts/master/icons/Generic%20-%20Green%20SSL%20Password%20Fields.png
// @author         Adam Katz
// @version        0.7.1.20190720
// @license        GPL
// ==/UserScript==
/* 
 * Copyright (C) 2010+ by Adam Katz, Licensed under the GPL 3+
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of version 3 of the GNU General Public License as published
 * by the Free Software Foundation. This program is distributed in the hope
 * that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * included LICENSE file or else http://www.gnu.org/licenses for more details.
 *
 * Beerware: If you think this is worth it, you are welcome to buy me a beer.
 */ 

const ssl_bg   = "#afb";  // green background for password fields with SSL
const plain_bg = "#fcb";  // red background for password fields without SSL

const pw_field = 'input[type="password"]';
var rel_ssl = rel_plain = '';

/// define GM_addStyle if necessary {{{
if (typeof GM_addStyle == 'undefined') {
  function GM_addStyle(css) {
    'use strict';
    let head = document.head;
    if (head) {
      let style = document.createElement("style");
      style.type = "text/css";
      style.textContent = css;
      head.appendChild(style);
      return style;
    }
    return null;
  }
} // end GM_addStyle }}}

function pwcss(sel, rgb) {
  return `${sel} ${pw_field} { color:#000; background:${rgb}!important; }\n`;
}

if (location.protocol == "https:") { rel_ssl   = pw_field + ", "; }
else                               { rel_plain = pw_field + ", "; }

GM_addStyle(
  pwcss(rel_ssl   + `form[action^="https://"]`,  ssl_bg) +
  pwcss(rel_plain + `form[action^="http://"]`, plain_bg)
);

var forms = document.getElementsByTagName("form");

// some sites somehow blow up given this part, so exclude them
if (! location.host.match(/(?:^|\.)(?:delta\.com)$/)) {
  // For each form, on each password field, note the domain it submits to
  // (unless it's the same domain as the current page).  TODO: strip subdomains?
  for (let f=0, fl=forms.length; f < fl; f++) {
    let target;
    if (!forms[f].action || !forms[f].action.match) {
      // defaults for forms without actions -> assume JavaScript
      target = [ (location.protocol == "https:") , "javascript" ];
    } else {
      target = forms[f].action.match(/^http(s?):..([^\/]+)/i);
    }

    let pws = forms[f].querySelectorAll('input[type="password"]');

    if (pws.length < 1 || !target || !target[2]) { continue; }

    // Report when domain doesn't match
    let is_secure = " will be sent to <" + target[2] + ">";
    if (location.host == target[2]) { is_secure = ""; }

    if ( target[2].match(/^javascript(?![^:])/) ) {
      is_secure = "UNKNOWN SECURITY, password to be sent via " + target[2];
    } else if (target[1]) {
      is_secure = "SSL secured password" + is_secure;
    } else {
      is_secure = "INSECURE password" + is_secure;
    }

    for (let p=0, pl=pws.length; p < pl; p++) {
      let field = pws[p];

      // target is SSL, same host, & already has a rollover title -> never mind
      if (target[1] && target[2] == location.host && field.title) {
        continue;
      }

      // rollover text gets security notice plus previous title on newline
      field.title = is_secure + (field.title ? "\n" + field.title : "")
    }
  }
}
