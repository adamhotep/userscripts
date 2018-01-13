// ==UserScript==
// @name        Confluence - Minor cosmetic improvements
// @describe    Collapse sidebar by default, gray calendar weekends
// @namespace   https://github.com/adamhotep/userscripts
// @include     https://wiki.*/display/*
// @include     https://wiki.*/pages/viewpage.action?pageId=*
// @include     http://wiki.*/display/*
// @include     http://wiki.*/pages/viewpage.action?pageId=*
// @include     https://confluence.*/display/*
// @include     https://confluence.*/pages/viewpage.action?pageId=*
// @include     http://confluence.*/display/*
// @include     http://confluence.*/pages/viewpage.action?pageId=*
// @grant       none
// @author      Adam Katz
// @version     2.0.0.20180113
// @copyright   2016+ by Adam Katz
// @license     GPL
// @licstart    The following is the entire license notice for this script.
/* 
 * Copyright (C) 2016  Adam Katz
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
// @licend      The above is the entire license notice for this script.
// ==/UserScript==

if (document.body.id.indexOf("com-atlassian-confluence") >= 0) {

  // Collapse sidebar by default
  // More info at https://stackoverflow.com/a/35853814/519360
  if (typeof AJS === 'function') {
    AJS.toInit(function(){
      if (AJS.$("div.ia-fixed-sidebar").width() > 55){
        AJS.Confluence.Sidebar.toggle();
      }
    });
  }

  // Add extra CSS
  var style = document.createElement("style");
  style.type = "text/css";
  style.textContent = /* syn=css */ `

    /* Slightly gray weekends on calendar views */
    tr.fc-week .fc-sat, tr.fc-week .fc-sun { background-color: #fafafa; }

  `;
  document.head.appendChild(style);

}

