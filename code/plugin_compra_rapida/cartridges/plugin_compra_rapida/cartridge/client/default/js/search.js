'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('base/search'));
    processInclude(require('./product/base'));
});
