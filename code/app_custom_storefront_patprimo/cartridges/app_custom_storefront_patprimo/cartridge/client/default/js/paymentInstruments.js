'use strict';

var processInclude = require('./util');

$(document).ready(function () {
    processInclude(require('./checkout/mercadoPago'));
    processInclude(require('./paymentInstruments/paymentInstruments'));
});
