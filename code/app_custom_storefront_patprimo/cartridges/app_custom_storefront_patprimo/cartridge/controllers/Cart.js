'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

function getDiferenciaEnvioGratis(total) {
    var Site = require('dw/system/Site');
    var cantidadEnvioGratis = Site.current.getCustomPreferenceValue('cantidadEnvioGratis');
    return cantidadEnvioGratis - total;
}

server.replace(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var CartModel = require('*/cartridge/models/cart');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();
        var reportingURLs;

        if (currentBasket) {
            var totalSinEnvio = currentBasket.adjustedMerchandizeTotalNetPrice.value.toFixed().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            Transaction.wrap(function () {
                if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                    currentBasket.updateCurrency();
                }
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);

                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        }

        if (currentBasket && currentBasket.allLineItems.length) {
            reportingURLs = reportingUrlsHelper.getBasketOpenReportingURLs(currentBasket);
        }
        if (!session.custom.removeCouponCart && session.customer.isAuthenticated()) {
            misReferidosHelpers.assignCouponCart(req.currentCustomer.profile);
        }

        var basketModel = new CartModel(currentBasket);
        var diferenciaTotal = 0;
        if(basketModel.numItems > 0){
            var total = currentBasket.getAdjustedMerchandizeTotalPrice(false);
            diferenciaTotal = getDiferenciaEnvioGratis(total.value);
        }
        var hayDiferencia = false;       
        if(diferenciaTotal > 0){
            hayDiferencia = true;
            res.setViewData({
                reportingURLs: reportingURLs,
                hayDiferencia: hayDiferencia,
                diferenciaTotal: diferenciaTotal,
                totalSinEnvio : totalSinEnvio 
            });
        } else {
            res.setViewData({
                reportingURLs: reportingURLs,
                totalSinEnvio : totalSinEnvio 
            });
        }
        
        var viewData = res.getViewData();
        var Site = require('dw/system/Site');
        var customPreferences = Site.current.preferences.custom;
        var gtm_id = customPreferences.gtm_id;
        viewData.gtm_id = gtm_id;
        res.setViewData(viewData);

        res.render('cart/cart', basketModel);
        next();
    }
);

server.replace('RemoveCouponLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var couponLineItem;

    if (currentBasket && req.querystring.uuid) {
        couponLineItem = collections.find(currentBasket.couponLineItems, function (item) {
            return item.UUID === req.querystring.uuid;
        });

        if (couponLineItem) {
            Transaction.wrap(function () {
                currentBasket.removeCouponLineItem(couponLineItem);
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            var basketModel = new CartModel(currentBasket);
            if (session.customer.isAuthenticated() && misReferidosHelpers.checkCouponRemove(req.currentCustomer.profile, couponLineItem)) {
                session.custom.removeCouponCart = true;
            }

            res.json(basketModel);
            return next();
        }
    }

    res.setStatusCode(500);
    res.json({
        errorMessage: Resource.msg('error.cannot.remove.coupon', 'cart', null)
    });
    return next();
});

server.replace('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var Site = require('dw/system/Site');
    
    var cantidadEnvioGratis = Site.current.getCustomPreferenceValue('cantidadEnvioGratis');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }
    if (currentBasket.getAllProductLineItems().length == 1) {
        session.custom.hasCart = null;
    }

    var isProductLineItemFound = false;
    var bonusProductsUUIDs = [];
    var quantity = 1;
    Transaction.wrap(function () {
        if (req.querystring.pid && req.querystring.uuid) {
            var productLineItems = currentBasket.getAllProductLineItems(req.querystring.pid);
            var bonusProductLineItems = currentBasket.bonusLineItems;
            var mainProdItem;
            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                if ((item.UUID === req.querystring.uuid)) {
                    quantity = item.quantity.value;
                    if (bonusProductLineItems && bonusProductLineItems.length > 0) {
                        for (var j = 0; j < bonusProductLineItems.length; j++) {
                            var bonusItem = bonusProductLineItems[j];
                            mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
                            if (mainProdItem !== null
                                && (mainProdItem.productID === item.productID)) {
                                bonusProductsUUIDs.push(bonusItem.UUID);
                            }
                        }
                    }

                    var shipmentToRemove = item.shipment;
                    currentBasket.removeProductLineItem(item);
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                    isProductLineItemFound = true;
                    break;
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (isProductLineItemFound) {        
        var basketModel = new CartModel(currentBasket);
        var total = currentBasket.getAdjustedMerchandizeTotalPrice(false);
        var diferenciaTotal = getDiferenciaEnvioGratis(total.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
        var mensajeEnvioGratis =  '<strong>' + Resource.msg('label.barra.envio.gratis.felicidades','cart', null) + ' </strong>' + Resource.msg('label.barra.envio.gratis.ya.tienes','cart', null) + ' <strong>' + Resource.msg('label.barra.envio.gratis.envio.gratis','cart', null) + '</strong>';

        if(diferenciaTotal > 0){
            mensajeEnvioGratis = '<strong>' + Resource.msg('label.barra.envio.gratis.faltante.faltan','cart', diferenciaTotal) + diferenciaTotal.toFixed().toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.") + '</strong> ' + Resource.msg('label.barra.envio.gratis.faltante.para.tu','cart', null) + ' <strong>' + Resource.msg('label.barra.envio.gratis.envio.gratis','cart', null) + '</strong>';
        }

        var ProductMgr = require('dw/catalog/ProductMgr');
        var productObj = ProductMgr.getProduct(req.querystring.pid);
        var ProductFactory = require('*/cartridge/scripts/factories/product');
        var productTileParams = { pview: 'tile', 'pid': req.querystring.pid};
        var product = ProductFactory.get(productTileParams);
        var price1 = ( product.price.sales && product.price.sales.value) ? product.price.sales.value : '';
        var price2 = (product.price.list && product.price.list.value) ? product.price.list.value :'';
        var cat1 = productObj.masterProduct ? "'"+productObj.masterProduct.categoryAssignments[0].category.ID+"'" : "'"+productObj.categoryAssignments[0].category.ID+"'";
        var cat2 = '';
        if(productObj.masterProduct) {
          if(productObj.masterProduct.categoryAssignments.length > 1){
            cat2 =  productObj.masterProduct.categoryAssignments[1].category.ID;
          }
        } else {
          if( productObj.categoryAssignments.length > 1) {
            cat2 = productObj.categoryAssignments[1].category.ID
          }
        }
        var arraySizes = [];
        product.variationAttributesCustom.forEach(function (item, index) {
          if(item.attributeId == 'size') { 
            item.values.forEach(function(value, i){
              arraySizes.push(value.value);
            });
          }
        });
       
        var prodObj = {
            item_name: productObj.name ? productObj.name : '',
            item_id: productObj.masterProduct ? productObj.masterProduct.ID : productObj.ID,
            item_sku_id: productObj.masterProduct ? productObj.ID : '',
            final_price: price1,
            original_price: price2,
            item_category:cat1 , //Categoría del producto
            item_category2: cat2, //Subcategoría del producto
            size: productObj.custom.size ? productObj.custom.size :'',
            color: productObj.custom.color ? productObj.custom.color : '',
            available_size: '['+arraySizes.toString()+']',
            quantity: quantity
          };

        var basketModelPlus = {
            basket: basketModel,
            toBeDeletedUUIDs: bonusProductsUUIDs,
            mensajeEnvioGratis: mensajeEnvioGratis,
            cantidadEnvioGratis : cantidadEnvioGratis,
            prodObj: prodObj
        };

        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    return next();
});

server.replace('UpdateQuantity', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var Site = require('dw/system/Site');
    
    var cantidadEnvioGratis = Site.current.getCustomPreferenceValue('cantidadEnvioGratis');
    
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var productId = req.querystring.pid;
    var updateQuantity = parseInt(req.querystring.quantity, 10);
    var uuid = req.querystring.uuid;
    var productLineItems = currentBasket.productLineItems;
    var matchingLineItem = collections.find(productLineItems, function (item) {
        return item.productID === productId && item.UUID === uuid;
    });
    var availableToSell = 0;

    var totalQtyRequested = 0;
    var qtyAlreadyInCart = 0;
    var minOrderQuantity = 0;
    var perpetual = false;
    var canBeUpdated = false;
    var bundleItems;
    var bonusDiscountLineItemCount = currentBasket.bonusDiscountLineItems.length;

    if (matchingLineItem) {
        if (matchingLineItem.product.bundle) {
            bundleItems = matchingLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                var quantityToUpdate = updateQuantity *
                    matchingLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell || perpetual) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            availableToSell = matchingLineItem.product.availabilityModel.inventoryRecord.ATS.value;
            perpetual = matchingLineItem.product.availabilityModel.inventoryRecord.perpetual;
            qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                matchingLineItem.UUID
            );
            totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            minOrderQuantity = matchingLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell || perpetual) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    if (canBeUpdated) {
        Transaction.wrap(function () {
            matchingLineItem.setQuantityValue(updateQuantity);

            var previousBounsDiscountLineItems = collections.map(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                return bonusDiscountLineItem.UUID;
            });

            basketCalculationHelpers.calculateTotals(currentBasket);
            if (currentBasket.bonusDiscountLineItems.length > bonusDiscountLineItemCount) {
                var prevItems = JSON.stringify(previousBounsDiscountLineItems);

                collections.forEach(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                    if (prevItems.indexOf(bonusDiscountLineItem.UUID) < 0) {
                        bonusDiscountLineItem.custom.bonusProductLineItemUUID = matchingLineItem.UUID; // eslint-disable-line no-param-reassign
                        matchingLineItem.custom.bonusProductLineItemUUID = 'bonus';
                        matchingLineItem.custom.preOrderUUID = matchingLineItem.UUID;
                    }
                });
            }
        });
    }

    if (matchingLineItem && canBeUpdated) {
        var basketModel = new CartModel(currentBasket);
        var total = currentBasket.getAdjustedMerchandizeTotalPrice(false);
        var diferenciaTotal = getDiferenciaEnvioGratis(total.value);
        var mensajeEnvioGratis =  '<strong>' + Resource.msg('label.barra.envio.gratis.felicidades','cart', null) + ' </strong>' + Resource.msg('label.barra.envio.gratis.ya.tienes','cart', null) + ' <strong>' + Resource.msg('label.barra.envio.gratis.envio.gratis','cart', null) + '</strong>';

        if(diferenciaTotal > 0){
            mensajeEnvioGratis =  '<strong>' + Resource.msg('label.barra.envio.gratis.faltante.faltan','cart', diferenciaTotal) + '$' + diferenciaTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' </strong>' + Resource.msg('label.barra.envio.gratis.faltante.para.tu','cart', null) + ' <strong>' + Resource.msg('label.barra.envio.gratis.envio.gratis','cart', null) + '</strong>';
        }

        var basketModelPlus = {
            basket: basketModel,
            cantidadEnvioGratis : cantidadEnvioGratis,
            mensajeEnvioGratis: mensajeEnvioGratis
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product.quantity', 'cart', null)
        });
    }

    return next();
});

server.replace('MiniCartShow', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var reportingURLs;

    if (currentBasket) {
        Transaction.wrap(function () {
            if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                currentBasket.updateCurrency();
            }
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
    }

    if (currentBasket && currentBasket.allLineItems.length) {
        reportingURLs = reportingUrlsHelper.getBasketOpenReportingURLs(currentBasket);
    }

    var basketModel = new CartModel(currentBasket); 
    var Site = require('dw/system/Site');
    var cantidadEnvioGratis = Site.current.getCustomPreferenceValue('cantidadEnvioGratis');
    var cantidadEnvioGratisCOP = cantidadEnvioGratis.toFixed().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    if (currentBasket !== null ) {
        var total = currentBasket.getAdjustedMerchandizeTotalPrice(false);
        var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
        var diferenciaTotal = getDiferenciaEnvioGratis(total.value);
        var hayDiferencia = false; 
    } else {
        var total;
        var quantityTotal = 0;
        var diferenciaTotal = cantidadEnvioGratisCOP;
        var hayDiferencia = true; 
    }
    if(diferenciaTotal > 0){
        hayDiferencia = true;
        res.setViewData({
            reportingURLs: reportingURLs,
            hayDiferencia: hayDiferencia,
            diferenciaTotal: diferenciaTotal,
            cantidadEnvioGratis : cantidadEnvioGratis,
            cantidadEnvioGratisCOP : cantidadEnvioGratisCOP,
            quantityTotal : quantityTotal.toFixed()
        });
    } else {
        res.setViewData({
            reportingURLs: reportingURLs,
            cantidadEnvioGratisCOP : cantidadEnvioGratisCOP,
            cantidadEnvioGratis :cantidadEnvioGratis
        });
    }

    res.render('checkout/cart/miniCart', basketModel);    
    next();
});

server.replace(
    'AddCoupon',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var CartModel = require('*/cartridge/models/cart');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({ errorMessage: Resource.msg('error.add.coupon', 'cart', null) });
            return next();
        }

        var error = false;
        var errorMessage;

        var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');
        if(req.querystring.couponCode == misReferidosHelpers.getCouponCodeMisReferidos() || req.querystring.couponCode == misReferidosHelpers.getCouponCodeMisReferidosAhijados()) {
            if(req.currentCustomer.profile) {
                var cuponDisponible = misReferidosHelpers.getCouponDisponiblePadrino(req.currentCustomer.profile);
        
                if(!cuponDisponible){
                    cuponDisponible = misReferidosHelpers.getCouponDisponibleAhijado(req.currentCustomer.profile);
                }
        
                if(!cuponDisponible) {
                    error = true;
                    errorMessage = Resource.msg('error.unable.to.add.coupon', 'cart', null);
                }
        
            } else {
                if(req.querystring.couponCode ==  misReferidosHelpers.getCouponCodeMisReferidos()){
                    error = true;
                    errorMessage = Resource.msg('error.unable.to.add.coupon', 'cart', null);
                }
                if(req.querystring.couponCode ==  misReferidosHelpers.getCouponCodeMisReferidosAhijados()){
                    error = true;
                    errorMessage = Resource.msg('error.unable.to.add.coupon', 'cart', null);
                }
            }
        }

        if(!error) {
            try {
                Transaction.wrap(function () {
                    return currentBasket.createCouponLineItem(req.querystring.couponCode, true);
                });
            } catch (e) {
                error = true;
                var errorCodes = {
                    COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                    COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
                    COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
                    COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon',
                    COUPON_DISABLED: 'error.unable.to.add.coupon',
                    REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                    TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                    NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon',
                    default: 'error.unable.to.add.coupon'
                };

                var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
                errorMessage = Resource.msg(errorMessageKey, 'cart', null);
            }
        }

        if (error) {
            res.json({
                error: error,
                errorMessage: errorMessage
            });
            return next();
        }

        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var basketModel = new CartModel(currentBasket);

        res.json(basketModel);
        return next();
    }
);

server.get('Abandoned', server.middleware.https, function (req, res, next) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var socialHelper = require('*/cartridge/scripts/helpers/socialSellingHelper');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var ProductImageDIS = require('*/cartridge/scripts/helpers/ProductImageDIS');
        var URLUtils = require('dw/web/URLUtils');
        var Site = require('dw/system/Site');
        var result, insert, arrayItems = [];
        var currentBasket = BasketMgr.getCurrentBasket();
        var obj = {}
        
        if (currentBasket) {
            if (currentBasket.customerEmail === null ) {
                res.json({error:true, msj: 'not email'})
                return next();
            }

            if (currentBasket.custom.isAbandoned) {
                var infoBasket = socialHelper.getLineItems(currentBasket);
                for (var index = 0 in currentBasket.allProductLineItems) {
                    var product = ProductMgr.getProduct(currentBasket.allProductLineItems[index].productID)
                    var images = ProductImageDIS.getImages(product, 'medium');
                    var urlImg = images[0].image.absURL.toString();
                    obj.urlImg = urlImg;
                    obj.description =  product.pageDescription;
                    obj.price = (currentBasket.allProductLineItems[index].priceValue/currentBasket.allProductLineItems[index].quantityValue)
                    arrayItems.push(obj);
                }
                Transaction.wrap(function () {
                    insert = CustomObjectMgr.getCustomObject("cartAbandoned", currentBasket.UUID);
                    insert.custom.infoCart = JSON.stringify(infoBasket);
                    insert.custom.items = JSON.stringify(arrayItems)
                    insert.custom.recibeName = currentBasket.customerName;
                    insert.custom.email = currentBasket.customerEmail;
                    currentBasket.custom.isAbandoned = true;
                })
                res.json({error:false,
                    msj: 'create abandoned cart'});
                return next();
            }

            var lastUpdateBasket = new Date(currentBasket.lastModified);
            var today = new Date()
            var timerCartAbandoned = Site.current.getCustomPreferenceValue('timerCartAbandoned');
            var diferenceTimeLastUpdate = (today-lastUpdateBasket);
            var newDate = new Date(diferenceTimeLastUpdate).getMinutes()+1;
            if (newDate >= timerCartAbandoned) {
                result = CustomObjectMgr.queryCustomObjects("cartAbandoned", "custom.UUID = {0}", null,currentBasket.UUID);
                if (result.count === 0) {
                    var infoBasket = socialHelper.getLineItems(currentBasket);
                    for (var index = 0 in currentBasket.allProductLineItems) {
                        var product = ProductMgr.getProduct(currentBasket.allProductLineItems[index].productID)
                        var images = ProductImageDIS.getImages(product, 'medium');
                        var urlImg = images[0].image.absURL.toString();
                        obj.urlImg = urlImg;
                        obj.description =  product.pageDescription;
                        obj.price = (currentBasket.allProductLineItems[index].priceValue/currentBasket.allProductLineItems[index].quantityValue)
                        arrayItems.push(obj);
                    }
                    Transaction.wrap(function () {
                        insert = CustomObjectMgr.createCustomObject("cartAbandoned", currentBasket.UUID);
                        insert.custom.infoCart = JSON.stringify(infoBasket);
                        insert.custom.items = JSON.stringify(arrayItems)
                        insert.custom.recibeName = currentBasket.customerName;
                        insert.custom.brand = 'PatPrimo';
                        insert.custom.linkBackToCart = URLUtils.abs('RecoverBasket-BackToBasket', 'UUID',insert.custom.UUID).toString()+ '&';
                        insert.custom.email = currentBasket.customerEmail;
                        currentBasket.custom.isAbandoned = true;
                    })
                } else {
                    res.json({error:true,
                        msj: 'already exist cart'});
                    return next();
                }
            } else {
                res.json({error:true,
                    msj: 'time in range'});
                return next();
            }
        }
        res.json({error:false,
            msj: 'create abandoned cart'});
    next()
});

server.append('AddProduct', function (req, res, next) {
    var viewData = res.getViewData();
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productObj = ProductMgr.getProduct(req.form.pid);
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productTileParams = { pview: 'tile', 'pid': req.form.pid};
    var product = ProductFactory.get(productTileParams);
    var price1 = ( product.price.sales && product.price.sales.value) ? product.price.sales.value : '';
    var price2 = (product.price.list && product.price.list.value) ? product.price.list.value :'';
    var cat1 = 'masterProduct' in productObj ? "'"+productObj.masterProduct.categoryAssignments[0].category.ID+"'" : "'"+productObj.categoryAssignments[0].category.ID+"'";
    var cat2 = '';
    if('masterProduct' in productObj) {
      if(productObj.masterProduct.categoryAssignments.length > 1){
        cat2 =  productObj.masterProduct.categoryAssignments[1].category.ID;
      }
    } else {
      if( productObj.categoryAssignments.length > 1) {
        cat2 = productObj.categoryAssignments[1].category.ID
      }
    }
    var arraySizes = [];
    product.variationAttributesCustom.forEach(function (item, index) {
      if(item.attributeId == 'size') { 
        item.values.forEach(function(value, i){
          arraySizes.push(value.value);
        });
      }
    });
   
    var prodObj = {
        item_name: productObj.name ? productObj.name : '',
        item_id: 'masterProduct' in productObj ? productObj.masterProduct.ID :  productObj.ID,
        item_sku_id: 'masterProduct' in productObj ? productObj.ID : '',
        final_price: price1,
        original_price: price2,
        item_category:cat1 , //Categoría del producto
        item_category2: cat2, //Subcategoría del producto
        size: productObj.custom.size ? productObj.custom.size :'',
        color: productObj.custom.color ? productObj.custom.color : '',
        available_size: '['+arraySizes.toString()+']',
        quantity: req.form.quantity
      };
      if(req.form.slot) {
          prodObj.item_list_name = form.slot;
        }
    viewData.prodObj = prodObj ;
    res.setViewData(viewData);
    next();
});

server.append('GetProduct', function (req, res, next) {
    var viewData = res.getViewData();
    var pid = viewData.product.id;
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productObj = ProductMgr.getProduct(pid);
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productTileParams = { pview: 'tile', 'pid': pid};
    var product = ProductFactory.get(productTileParams);
    var price1 = ( product.price.sales && product.price.sales.value) ? product.price.sales.value : '';
    var price2 = (product.price.list && product.price.list.value) ? product.price.list.value :'';
    var cat1 = productObj.masterProduct ? "'"+productObj.masterProduct.categoryAssignments[0].category.ID+"'" : "'"+productObj.categoryAssignments[0].category.ID+"'";
    var cat2 = '';
    if(productObj.masterProduct) {
      if(productObj.masterProduct.categoryAssignments.length > 1){
        cat2 =  productObj.masterProduct.categoryAssignments[1].category.ID;
      }
    } else {
      if( productObj.categoryAssignments.length > 1) {
        cat2 = productObj.categoryAssignments[1].category.ID
      }
    }

    var prodObj = {
        item_name: productObj.name ? productObj.name : '',
        item_id: productObj.masterProduct ? productObj.masterProduct.ID : productObj.ID,
        item_sku_id: productObj.masterProduct ? productObj.ID : '',
        final_price: price1,
        original_price: price2,
        item_category:cat1 , //Categoría del producto
        item_category2: cat2, //Subcategoría del producto
        size: productObj.custom.size ? productObj.custom.size :'',
        color: productObj.custom.color ? productObj.custom.color : '',
        quantity: viewData.selectedQuantity
      };
    viewData.prodObj = prodObj ;
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    viewData.total = currentBasket.totalGrossPrice.value;
    viewData.cartSize = currentBasket.productQuantityTotal;
    var couponsString = '';
    var couponsArray = [];
    var couponLineItems = currentBasket.getCouponLineItems();
    if(!couponLineItems.isEmpty()){
        if(couponLineItems.length > 1){
            for (var i = 0; i < couponLineItems.length; i++) {
                couponsArray.push(couponLineItems[i].couponCode);
            }
            couponsString = couponsArray.toString();
        } else {
            couponsString = couponLineItems[0].couponCode;
        }
        viewData.coupon =couponsString;
    }
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
