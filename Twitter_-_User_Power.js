// ==UserScript==
// @name        Twitter - User "power" and other stats
// @author      Adam Katz
// @namespace   https://github.com/adamhotep/userscripts
// @description User pages: Stats over time, power (tweets/follower)
// @include     https://twitter.com/*
// @version     1.1.0.20190720
// @installURL  https://github.com/adamhotep/userscripts/raw/master/Twitter_-_User_tweets_per_day.user.js
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

function round_units(num) {
  if      (num < 1)     { num = round(num, 3); }
  else if (num < 10)    { num = round(num, 2); }
  else if (num < 100)   { num = round(num, 1); }
  else if (num < 1000)  { num = round(num); }
  else if (num > 10**11){ num = round(num/10**9)    + "B"; }
  else if (num > 10**10){ num = round(num/10**9, 1) + "B"; }
  else if (num > 10**9) { num = round(num/10**9, 2) + "B"; }
  else if (num > 10**8) { num = round(num/10**6)    + "M"; }
  else if (num > 10**7) { num = round(num/10**6, 1) + "M"; }
  else if (num > 10**6) { num = round(num/10**6, 2) + "M"; }
  else if (num > 10**5) { num = round(num/1000)     + "K"; }
  else if (num > 10**4) { num = round(num/1000, 1)  + "K"; }
  else if (num > 10**3) { num = round(num/1000, 2)  + "K"; }
  return num;
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

function make_stat(name, proper_name, desc, value) {
  var full_value = value;
  value = round_units(value);
  //console.log(`${name} = ${value} (from ${full_value})`);
  var node = document.createElement("li");

  node.className = "ProfileNav-item ProfileNav-item--" + name;
      var link = document.createElement("a");
      link.appendChild(document.createTextNode(proper_name));
      link.className = "ProfileNav-stat ProfileNav-stat--link gm "
        + "u-borderUserColor u-textCenter js-tooltip js-nav u-textUserColor";
      link.title = round(full_value, 3) + " " + desc;
      link.setAttribute("data-nav", name);
      var is_compact = false;
      if (full_value == value) { is_compact = true; }
      link.innerHTML = `
        <span class="ProfileNav-label" aria-hidden="true">${proper_name}</span>
        <span class="u-hiddenVisually">${proper_name}</span>
        <span class="ProfileNav-value" data-count="${value}"
          data-is-compact="${is_compact}">
          ${value}
          <p class="rate">${rate(full_value, age)}</p>
        </span>`;
      node.appendChild(link);

      var after = stats[stats.length-1].parentNode.parentNode;
      if (after.nextElementSibling) {
        after.parentNode.insertBefore(node,
          after.nextElementSibling);
      } else {
        after.parentNode.appendChild(node);
      }

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


    // influence is the ratio of followers to following
    var influence = fans;
    if (friends > 1) { influence /= friends; }
    if (influence) {
      make_stat("influence", "Influence", "Followers/Following", influence);
    }

    // power is log-linear fans to tweets (with alternates for zero counts):
    //   if (tweets > 0 && fans > 0)       power = log(fans) * fans / tweets
    //   else if (fans > 0 && likes > 10)  power = log(fans) * fans * 10 / likes
    //   else if (fans > 0)                power = log(fans)
    //   else if (tweets == fans == 0)     power = 0
    //   else if (tweets > 0)              power = log(1 / tweets)
    var power = 0;
    if (fans > 0) {
      power = Math.log(fans);
      if (tweets > 0) { power *= fans / tweets; }
      else if (likes > 10) { power *= fans * 10 / likes; } // 10 likes ~ 1 tweet
    } else if (tweets > 0) {
      power = Math.log(1 / tweets);	// more tweets w/out fans? more negative
    }
    make_stat("power", "Power", "log(Fans)×Fans/Tweet", power);

  }

  GM_addStyle(`
    .ProfileNav-item { vertical-align:top; margin-top:-1.2ex; }
    .ProfileNav-item p.rate { font-size:67%; font-weight:normal; }
    .ProfileNav-stat--link.gm:hover { cursor:pointer; }
  `);

}

