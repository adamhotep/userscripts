// ==UserScript==
// @name	Adblock Plus - Suppress nag screen
// @namespace	https://github.com/adamhotep/userscripts
// @author	Adam Katz
// @version	0.1.20250812.0
// @grant	none
// @icon	https://adblockplus.org/favicon.ico
// @match	https://adblockplus.org/en/update*
// ==/UserScript==

if (document.title.includes("has been updated")) window.close();
