'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get(
    'GetCity',
    server.middleware.https,
    function (req, res, next) {
        var apt =  req.httpParameterMap.apt.value;
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        
        var municipiosArray = [];
        var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0}", null,apt+'*');
        while (result.hasNext()) {
            var data = result.next();
            if(municipiosArray.length > 0){
                if (municipiosArray.indexOf(data.custom.municipio) === -1) {
                    municipiosArray.push(data.custom.municipio)
                }
            }else {
                municipiosArray.push(data.custom.municipio)
            }
        }
        res.json({municipiosArray:municipiosArray})
        next();
    }
);

server.post('ApplyPaymentMethod',
    server.middleware.https,function (req, res, next) {
        var preferences = require('*/cartridge/config/preferences');
        var city =  req.httpParameterMap.city.value;
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var currentLocale = Locale.getLocale(req.locale.id);
        var orderModel = new OrderModel(
            currentBasket, {
                countryCode: currentLocale.country,
                containerView: 'basket'
            }
        );
        var pagoEntregaHelper = require('*/cartridge/scripts/helpers/pagoEntregaHelper');
        var isView = pagoEntregaHelper.reviewCity(city);
        if (isView) {
            var shippingsNotApply = preferences.shippingMethodNotApply;
            var shippingCurrent = orderModel.shipping[0].selectedShippingMethod.displayName;
            if (shippingsNotApply.length > 0 && shippingsNotApply.indexOf(shippingCurrent) != -1) {
                isView = false;
            }
        }
        res.json({showPayment:  isView});
        
    next();
})


module.exports = server.exports();