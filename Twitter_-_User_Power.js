// ==UserScript==
// @name        Twitter - Stats over time, tweet power
// @author      Adam Katz
// @namespace   https://github.com/adamhotep/userscripts
// @description User pages: Stats over time, power (tweets/follower)
// @include     https://twitter.com/*
// @version     0.2
// @installURL https://github.com/adamhotep/userscripts/raw/master/Twitter_-_User_tweets_per_day.user.js
// @downloadURL https://github.com/adamhotep/userscripts/raw/master/Twitter_-_User_tweets_per_day.user.js
// @grant       GM_addStyle
// ==/UserScript==
// Copyright 2016+ by Adam Katz, GPL v3+

// This GM_addStyle implementation is slightly modified from the GM 3->4 shim at
// https://arantius.com/misc/greasemonkey/imports/greasemonkey4-polyfill.js
if (typeof GM_addStyle == 'undefined') {
  function GM_addStyle(aCss) {
    'use strict';
    let head = document.querySelector(`head, body`);
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

function round(num, decimals=0) {
  return Math.round(num * 10**decimals) / 10**decimals;
}

function rate(count, age) {
  var r = count / age,			units = "/d";	// daily
  if   (r < 12/365)	{ r *= 365;	units = "/y" }	// annually
  else if (r < 1/7)	{ r *= 365/12;	units = "/mo" }	// monthly
  else if (r < 1)	{ r *= 7;	units = "/w" }	// weekly
  else if (r > 24)	{ r /= 24;	units = "/h" }	// hourly

  // the above round() function truncates and I don't want that here
  r = "" + Math.round(r * 100); // 12.345 -> 1235, to become 12.35
  if      (r.length == 1) { r = "0.0" + r; }
  else if (r.length == 2) { r = "0." + r; }
  else { r = r.substr(0, r.length-2) + "." + r.substr(-2); }

  return r + units;
}

function parse_stat(title, age) {
  var item = document.querySelector(".ProfileNav-item--"+title);
  if (!item) { return 0; }
  var container = item.querySelector(".ProfileNav-value");
  if (!container) { return 0; }
  var count = container.getAttribute("data-count");
  //console.log(title+": count="+count+", container="+container);
  if (!count) { return 0; } // no-op on zero or missing data

  var elem = document.createElement("p");
  elem.className = "rate";
  elem.appendChild( document.createTextNode( rate(count, age) ) );
  container.appendChild(elem);

  return count;
}

var join = document.querySelector(".ProfileHeaderCard-joinDateText");
if (join) {
  var then;
  if (join.title) then = join.title;
  else then = join.getAttribute("data-original-title");
  then = new Date(then);	// "1:23 AM - 01 Feb 2012"
  var now = Date.now();
  var stats = document.querySelectorAll(".ProfileNav-value[data-count]");
  var power = 0;

  if (stats && now && then && now > then) {

    var age = (now-then) / 86400000; // ms -> days

    // get counts and populate ratios into the page
    var tweets = parse_stat("tweets", age);
    var friends = parse_stat("following", age);
    var fans = parse_stat("followers", age);
    var likes = parse_stat("favorites", age);
    var lists = parse_stat("lists", age);
    var moments = parse_stat("moments", age);

    // power is fans per tweet (with zero tweets, power = fans).
    var power = fans;
    if (tweets > 0) { power /= tweets; }
    var power_value = power;
    if      (power < 1)     { power = round(power, 3); }
    else if (power < 10)    { power = round(power, 2); }
    else if (power < 100)   { power = round(power, 1); }
    else if (power < 1000)  { power = round(power); }
    else if (power > 10**11){ power = round(power/10**9)    + "B"; }
    else if (power > 10**10){ power = round(power/10**9, 1) + "B"; }
    else if (power > 10**9) { power = round(power/10**9, 2) + "B"; }
    else if (power > 10**8) { power = round(power/10**6)    + "M"; }
    else if (power > 10**7) { power = round(power/10**6, 1) + "M"; }
    else if (power > 10**6) { power = round(power/10**6, 2) + "M"; }
    else if (power > 10**5) { power = round(power/1000)     + "K"; }
    else if (power > 10**4) { power = round(power/1000, 1)  + "K"; }
    else if (power > 10**3) { power = round(power/1000, 2)  + "K"; }

    if (power) {
      //console.log("power = " + power);
      var power_node = document.createElement("li");
      power_node.className = "ProfileNav-item ProfileNav-item--power";
      var power_link = document.createElement("a");
      power_link.appendChild(document.createTextNode("Power"));
      power_link.className = "ProfileNav-stat ProfileNav-stat--power "
        + "u-borderUserColor u-textCenter js-tooltip js-nav u-textUserColor";
      power_link.title = round(power_value, 3) + " Followers/Tweet";
      power_link.setAttribute("data-nav", "power");
      var is_compact = false;
      if (power_value == power) { is_compact = true; }
      power_link.innerHTML = `
        <span class="ProfileNav-label" aria-hidden="true">Power</span>
        <span class="u-hiddenVisually">Power</span>
        <span class="ProfileNav-value" data-count="$power"
          data-is-compact="$is_compact">
          $power
          <p class="rate">$rate</p>
        </span>
      `.replace(/\$power/g, power)
       .replace(/\$rate/g, rate(power_value, age))
       .replace(/\$is_compact/g, is_compact)
      ;
      power_node.appendChild(power_link);

      var after_power = stats[stats.length-1].parentNode.parentNode;
      if (after_power.nextElementSibling) {
        after_power.parentNode.insertBefore(power_node,
          after_power.nextElementSibling);
      } else {
        after_power.parentNode.appendChild(power_node);
      }
    }

  }

  GM_addStyle(`
    .ProfileNav-item { vertical-align:top; margin-top:-1.2ex; }
    .ProfileNav-item p.rate { font-size:67%; font-weight:normal; }
    .ProfileNav-stat--power:hover,
    .ProfileNav-stat--power:focus { text-decoration:none; }
  `);

}

