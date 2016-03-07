// ==UserScript==
// @name        Confluence - Hide sidebar
// @namespace   https://github.com/adamhotep/userscripts
// @description Collapse the sidebar upon page load
// @include     https://confluence.*
// @include     http://confluence.*
// @version     1
// @grant       none
// @license     GPL
// ==/UserScript==

// more info at https://stackoverflow.com/a/35853814/519360
if (typeof AJS === 'function') {
  AJS.toInit(function(){
    if (AJS.$("div.ia-fixed-sidebar").width() > 55){
      AJS.Confluence.Sidebar.toggle();
    }
  });
}
