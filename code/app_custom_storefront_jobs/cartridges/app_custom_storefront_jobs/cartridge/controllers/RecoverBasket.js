'use strict';

var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

server.get(
    'BackToBasket',
    server.middleware.https,
    function (req, res, next) {
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var BasketMgr = require('dw/order/BasketMgr');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var OrderMgr = require('dw/order/OrderMgr');
        var URLUtils = require('dw/web/URLUtils');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Site = require('dw/system/Site');
        var Logger = require('dw/system/Logger');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var UUID = req.httpParameterMap.UUID.value; // recuperamos el uuid del custom object
        session.custom.productNotStock = null;
        var cartInf, key = 0, qty, childProducts = [], options = [], result, error = false;
        var cartObject = CustomObjectMgr.getCustomObject("cartAbandoned", UUID);
        if (cartObject) {
            cartInf = JSON.parse(cartObject.custom.infoCart);
            try {
                if (currentBasket) {
                    for (key in cartInf) {
                        var product = ProductMgr.getProduct(cartInf[key].pid);
                        if (product.availabilityModel.inStock) {
                            Transaction.wrap(function () {  //create basket
                                qty = parseInt(cartInf[key].qty, 10);
                                result = cartHelper.addProductToCart(
                                    currentBasket,
                                    cartInf[key].pid,
                                    qty,
                                    childProducts,
                                    options
                                );
                                if (!result.error) {
                                    cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                                    basketCalculationHelpers.calculateTotals(currentBasket);
                                } else {
                                    error = true;
                                }
                            })
                        } else {
                            var productNotStock = [];
                            productNotStock.push({name:product.name})
                            session.custom.productNotStock =  JSON.stringify(productNotStock);
                        }  
                    }
                    if (!error) {
                        session.custom.isAbandoned = JSON.stringify({isAbandoned:true, uuid:UUID});
                        Transaction.wrap(function () {
                            currentBasket.custom.isAbandoned = true;
                        })
                        // review if the register user
                        var queryString = "(customerEmail={0})";
                        var history = OrderMgr.searchOrders(queryString, "orderNo ASC",cartObject.custom.email);
                        if (history.count == 0) {
                            var code = Site.current.getCustomPreferenceValue('promoCodeMC');
                            if (code) {
                                try {
                                    Transaction.wrap(function () {
                                        currentBasket.createCouponLineItem(code, true);
                                    })
                                } catch (e) {
                                    Logger.error('Ocurrio un error al aplicar la promocion: ', e.message)
                                }
                            }
                        }
                        res.redirect(URLUtils.url('Cart-Show'));
                        return next();
                    } else {
                        if (currentBasket.allProductLineItems.length > 0) {
                            res.redirect(URLUtils.url('Cart-Show'));
                            return next();
                        } else {
                            res.render('cart/abandonedCartEmpty');
                            next();  
                        }
                    }
                }
        } catch (error) {
            res.render('cart/abandonedCartEmpty');
            next();  
        }
        } else {
            res.render('cart/abandonedCartEmpty');
            next();
        }
    })
    module.exports = server.exports();