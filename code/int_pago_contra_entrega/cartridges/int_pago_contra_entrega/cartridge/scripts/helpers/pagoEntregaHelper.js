'use strict';

function reviewCity (city) {
    var showPayment = false;
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var preferences = require('*/cartridge/config/preferences');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var queryResult = CustomObjectMgr.queryCustomObjects("departamento", "custom.municipio ILIKE {0}", null,city);
    while (queryResult.hasNext()) {
        var data = queryResult.next();
        if (data.custom.coberturaContraEntrega) {
            showPayment = true;
        }
    }
    if (showPayment === true) {
        var shippingCurrentName = currentBasket.shipments[0].shippingMethod ? currentBasket.shipments[0].shippingMethod.displayName: '';
        var shippingsNotApply = preferences.shippingMethodNotApply;
        if(shippingsNotApply.indexOf(shippingCurrentName) != -1) {
            showPayment = false;
        }
    }
    return showPayment
}

module.exports = { reviewCity:reviewCity}