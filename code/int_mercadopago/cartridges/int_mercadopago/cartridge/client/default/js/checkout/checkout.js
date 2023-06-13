"use strict";

/* global $ */

var billingHelpers = require("./billing");
var base = require('custom/checkout');

Object.keys(billingHelpers).forEach(function (item) {
    if (typeof billingHelpers[item] === "object") {
        base[item] = $.extend({}, base[item], billingHelpers[item]);
    } else {
        base[item] = billingHelpers[item];
    }
});

module.exports = base;
