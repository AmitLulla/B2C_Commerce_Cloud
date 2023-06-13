'use strict';

/**
 * @namespace CheckoutServices
 */

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.get(
    'SubmitSocial',
    server.middleware.https,
    consentTracking.consent,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var URLUtils = require('dw/web/URLUtils');
        var Transaction = require('dw/system/Transaction');
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var socialHelper = require('*/cartridge/scripts/helpers/socialSellingHelper');
        var code = req.httpParameterMap.code.value;
        var customObject = CustomObjectMgr.getCustomObject('socialSelling', code);
        if (customObject) {
            // AddToCart
            if (!session.custom.cartExist) {
                var currentBasket = BasketMgr.getCurrentOrNewBasket();
                var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
                var dataBasket = JSON.parse(customObject.custom.infBasket);
                var addToCart = socialHelper.addToCart(dataBasket);
                if (addToCart.error) {
                    res.json({ error: true })
                    return next();
                }
                session.custom.cartExist = true;
            }

            // Add Customer info
            var dataShipping = JSON.parse(customObject.custom.formShipping);
            var customer = JSON.parse(customObject.custom.formRegister);
            dataShipping.customer = customer;
            var addDataToShipping = socialHelper.submitShippingData(dataShipping, req);
            if (addDataToShipping.error) {
                res.json({ error: true });
                return next();
            }
            
        }
        session.custom.SocialSelling = code;
        var url = URLUtils.url('Checkout-Begin', 'stage', 'payment');
        res.redirect(url)
        next();
    })
module.exports = server.exports();
