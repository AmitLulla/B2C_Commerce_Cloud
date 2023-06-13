'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
server.extend(module.superModule);
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');


server.replace(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');
        var URLUtils = require('dw/web/URLUtils');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var Locale = require('dw/util/Locale');
        var collections = require('*/cartridge/scripts/util/collections');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');
        var ShippingMgr = require('dw/order/ShippingMgr');
        var openModalUpdate = false;
        session.custom.productNotStock = null;
        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        var requestStage = req.querystring.stage;
        var currentStage = requestStage || 'customer';
        var billingAddress = currentBasket.billingAddress;

        var currentCustomer = req.currentCustomer.raw;
        var currentLocale = Locale.getLocale(req.locale.id);
        var preferredAddress;

        // only true if customer is registered
        if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
            var shipments = currentBasket.shipments;
            preferredAddress = req.currentCustomer.addressBook.preferredAddress;

            collections.forEach(shipments, function (shipment) {
                if (!shipment.shippingAddress) {
                    COHelpers.copyCustomerAddressToShipment(preferredAddress, shipment);
                }
            });

            if (!billingAddress) {
                COHelpers.copyCustomerAddressToBilling(preferredAddress);
            }
        }

        // Calculate the basket
        Transaction.wrap(function () {
            COHelpers.ensureNoEmptyShipments(req);
        });

        if (currentBasket.shipments.length <= 1) {
            req.session.privacyCache.set('usingMultiShipping', false);
        }

        if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
            Transaction.wrap(function () {
                currentBasket.updateCurrency();
            });
        }

        COHelpers.recalculateBasket(currentBasket);

        var guestCustomerForm = COHelpers.prepareCustomerForm('coCustomer');
        var registeredCustomerForm = COHelpers.prepareCustomerForm('coRegisteredCustomer');
        var shippingForm = COHelpers.prepareShippingFormCustom();
        var billingForm = COHelpers.prepareBillingForm();
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var profileForm = server.forms.getForm('profile');
        var identificateForm = server.forms.getForm('identificate');
        var customerNotRegisterForm = server.forms.getForm('customerNotRegisterForm');
        // profileForm.clear();

        if (preferredAddress) {
            shippingForm.copyFrom(preferredAddress);
            billingForm.copyFrom(preferredAddress);
        }

        // Loop through all shipments and make sure all are valid
        var allValid = COHelpers.ensureValidShipments(currentBasket);


        var orderModel = new OrderModel(
            currentBasket, {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                shippable: allValid,
                countryCode: currentLocale.country,
                containerView: 'basket'
            }
        );

        // Get rid of this from top-level ... should be part of OrderModel???
        var currentYear = new Date().getFullYear();
        var creditCardExpirationYears = [];

        for (var j = 0; j < 10; j++) {
            creditCardExpirationYears.push(currentYear + j);
        }

        var accountModel = new AccountModel(req.currentCustomer);

        var reportingURLs;
        reportingURLs = reportingUrlsHelper.getCheckoutReportingURLs(
            currentBasket.UUID,
            2,
            'Shipping'
        );

        if (currentStage === 'customer') {
            if (accountModel.registeredUser) {
                // Since the shopper already login upon starting checkout, fast forward to shipping stage
                currentStage = 'customer';

                // Only need to update email address in basket if start checkout from other page like cart or mini-cart
                // and not on checkout page reload.
                if (!requestStage) {
                    Transaction.wrap(function () {
                        currentBasket.customerEmail = accountModel.profile.email;
                        orderModel.orderEmail = accountModel.profile.email;
                    });
                }
                if (!session.custom.removeCouponCart) {
                    misReferidosHelpers.assignCouponCart(req.currentCustomer.profile);
                    orderModel = new OrderModel(
                        currentBasket, {
                            customer: currentCustomer,
                            usingMultiShipping: usingMultiShipping,
                            shippable: allValid,
                            countryCode: currentLocale.country,
                            containerView: 'basket'
                        }
                    );
                }
                
                
            } else if (currentBasket.customerEmail) {
                // Email address has already collected so fast forward to shipping stage
                currentStage = 'customer';
                var CustomerMgr = require('dw/customer/CustomerMgr');
                var customer = CustomerMgr.getCustomerByLogin(currentBasket.customerEmail);
                if (!session.custom.removeCouponCart && session.customer.isAuthenticated()) {
                    misReferidosHelpers.assignCouponCart(customer.profile);
                }
            }
        }

        var shipmentModel = ShippingMgr.getShipmentShippingModel(currentBasket.getShipments()[0]);
        var applicableShippingMethods = shipmentModel.getApplicableShippingMethods();
        var shippingCostArray = [];
        for (var i = 0 in applicableShippingMethods) {
            var shippingCost = shipmentModel.getShippingCost(applicableShippingMethods[i]);
            shippingCostArray.push(shippingCost);
        }
        
        res.setViewData({
            applicableShippingMethods: applicableShippingMethods,
            shippingCost: shippingCostArray
        })

        var shipmentModel = ShippingMgr.getShipmentShippingModel(currentBasket.getShipments()[0]);
        var applicableShippingMethods = shipmentModel.getApplicableShippingMethods();
        var shippingCostArray = [];
        var shipmentsUUID = {};
        for (var i = 0 in applicableShippingMethods) {
            var shippingCost = shipmentModel.getShippingCost(applicableShippingMethods[i]);
            shippingCostArray.push(shippingCost);
            switch (applicableShippingMethods[i].ID) {
                case 'envioNormal':
                    shipmentsUUID['envioNormal'] = applicableShippingMethods[i].UUID
                    break;
                case 'envioExpress':
                    shipmentsUUID['envioExpress'] = applicableShippingMethods[i].UUID
                    break;
                case 'envioContraEntrega':
                    break;
                default:
                    shipmentsUUID[applicableShippingMethods[i].ID] = applicableShippingMethods[i].UUID
                    break;
            }
        }

        res.setViewData({
            applicableShippingMethods: applicableShippingMethods,
            shippingCost: shippingCostArray
        });

        var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');
        var departamentosArrays = customShippingHelpers.getCustomShippingCostDepartamentos();
        var departamentos = departamentosArrays.departamentos;
        var departamentos_completo = departamentosArrays.departamentos_completo;
        var shippingCostDepartamento = {};
        shippingCostDepartamento = {
            costoEnvioExpress: departamentos_completo[0].custom.costoEnvioExpress,
            costoEnvioContraentrega: departamentos_completo[0].custom.costoEnvioContraentrega,
            costoEnvioNormal: departamentos_completo[0].custom.costoEnvioNormal
        };
        if(!session.custom.shippingCostDepartamento) {
            session.custom.shippingCostDepartamento = shippingCostDepartamento.costoEnvioNormal;
        }

        if(!session.custom.selectedshipping) {
            session.custom.selectedshipping = 'envioNormal';
        }
        var applicableShippingMethods_t = [];
        var applicableShippingMethods_Order = orderModel.shipping[0].applicableShippingMethods;
        var shipmentUUID, shippingMethodID;
        var estimatedArrivalTime = departamentos_completo[0].custom.tiempoTransportadora;
        for (var i = 0 in applicableShippingMethods_Order) {
            var shippingMethodObj = '';
            switch (applicableShippingMethods_Order[i].ID) {
                case 'envioNormal':
                    if (shippingCostDepartamento.costoEnvioNormal != 0) {
                        shippingMethodObj = {
                            default: true,
                            ID: applicableShippingMethods_Order[i].ID,
                            description: "",
                            displayName: applicableShippingMethods_Order[i].displayName,
                            online: true,
                            cost: shippingCostDepartamento.costoEnvioNormal,
                            shippingCost: shippingCostDepartamento.costoEnvioNormal,
                            selected: true,
                            estimatedArrivalTime: estimatedArrivalTime
                        };
                        shippingMethodID = applicableShippingMethods_Order[i].ID;
                    }
                    break;
                case 'envioExpress':
                    if (shippingCostDepartamento.costoEnvioExpress != 0) {
                        shippingMethodObj = {
                            ID: applicableShippingMethods_Order[i].ID,
                            description: "",
                            displayName: applicableShippingMethods_Order[i].displayName,
                            online: true,
                            cost: shippingCostDepartamento.costoEnvioExpress,
                            shippingCost: shippingCostDepartamento.costoEnvioExpress,
                            selected: false,
                            estimatedArrivalTime: customShippingHelpers.setMensajeEnvioExpress()
                        };
                    }
                    break;
                case 'envioContraEntrega':
                    break;
                default:
                    shippingMethodObj = applicableShippingMethods_Order[i];
                    break;
            }
            if (shippingMethodObj != '') {
                applicableShippingMethods_t.push(shippingMethodObj);
            }
            if (shippingMethodObj.default) {
                shipmentUUID = shipmentsUUID[shippingMethodObj.ID];
            }
        }
        var HookMgr = require('dw/system/HookMgr');
        HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', currentBasket);
        COHelpers.recalculateBasket(currentBasket);

        orderModel = new OrderModel(
            currentBasket, {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                shippable: allValid,
                countryCode: currentLocale.country,
                containerView: 'basket'
            }
        );
        orderModel.shipping[0].applicableShippingMethods = applicableShippingMethods_t; //shippingCost
        res.setViewData({
            applicableShippingMethods: applicableShippingMethods,
            shippingCost: shippingCostArray
        });
        // pago contra entrega show or hide
        var isView = null;
        if (orderModel.shipping.length > 0 &&  orderModel.shipping[0].shippingAddress && orderModel.shipping[0].shippingAddress.city) {
            var pagoEntregaHelper = require('*/cartridge/scripts/helpers/pagoEntregaHelper');
            isView = pagoEntregaHelper.reviewCity(orderModel.shipping[0].shippingAddress.city)
        }
        var dataformpayment = {};

        if (accountModel.registeredUser) {
            if(accountModel.profile){
                dataformpayment = {cedulaCiudadana: accountModel.profile.documentoIdentidad,
                    phone: accountModel.profile.phone,
                    firstName: accountModel.profile.firstName,
                    lastName: accountModel.profile.lastName,
                    department: preferredAddress ? preferredAddress.city :null,
                    via: preferredAddress && preferredAddress.address1 ? preferredAddress.address1.substring(0, preferredAddress.address1.length - 2):null,
                    n1: preferredAddress && preferredAddress.address1 ? preferredAddress.address1.split("")[preferredAddress.address1.length - 1]:null,
                    n2: preferredAddress ? preferredAddress.address2:null,
                    n3: preferredAddress ? preferredAddress.address2:null,
                    piso: preferredAddress ? preferredAddress.address2:null,


            };
        } 
    }else{
        if (billingAddress) {
            dataformpayment = {cedulaCiudadana: billingAddress.custom.cedulaCiudadana,
            phone: billingAddress.phone}
        }
    }
    // valid identificate form to show or hide
    if (!customerNotRegisterForm.email.value) {
        session.custom.showFormNotRegister = false;
    }
    if (session.customer.isAuthenticated()) {
        if (!accountModel.profile.documentoIdentidad) {
            openModalUpdate = true;
        }
    } else {
        var collections = require('*/cartridge/scripts/util/collections');
        var couponLineItem;
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        couponLineItem = collections.find(currentBasket.couponLineItems, function (item) {
            if(item && item.couponCode && item.couponCode == 'PD20PAT') {
                Transaction.wrap(function () {
                    currentBasket.removeCouponLineItem(item);
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });
            }
        });
      
    }
    var totalGift = 0, newtotalGift= 0;
    if (currentBasket.giftCertificatePaymentInstruments.length > 0) {
        for (var key in currentBasket.giftCertificatePaymentInstruments) {
            totalGift += currentBasket.giftCertificatePaymentInstruments[key].paymentTransaction.amount.value;
            newtotalGift += currentBasket.totalGrossPrice.subtract(currentBasket.giftCertificatePaymentInstruments[key].paymentTransaction.amount);
            
        }
    }
    var CartModel = require('*/cartridge/models/cart');
    var basketModel = new CartModel(currentBasket);
    var Site = require('dw/system/Site');
    var customPreferences = Site.current.preferences.custom;
    var gtm_id = customPreferences.gtm_id;
    var productArray = [];
    orderModel.items.items.forEach(element => {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var ProductFactory = require('*/cartridge/scripts/factories/product');
        var productObj = ProductMgr.getProduct(element.id);
        var productTileParams = { pview: 'tile', 'pid': element.id};
        var product = ProductFactory.get(productTileParams);
        var price1 = (product.price.sales &&  product.price.sales.value) ?  product.price.sales.value : '';
        var price2 = (product.price.list && product.price.list.value) ? product.price.list.value :'';
        var cat1 = productObj.masterProduct ? productObj.masterProduct.categoryAssignments[0].category.ID : productObj.categoryAssignments[0].category.ID;
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
        var listObj = {
            item_name: productObj.name, //Requerido
            item_id: productObj.masterProduct ? productObj.masterProduct.ID : productObj.ID,
            item_sku_id: productObj.masterProduct ? productObj.ID : '',
            final_price: price1, //Precio del producto con descuento
            original_price: price2, //Precio original del producto
            item_category: cat1, //Categoría principal
            item_category2: cat2, //Categoría secundaria
            quantity: element.quantity
        };
        productArray.push(JSON.stringify(listObj));
    });
     var checkoutStep = 1;
     switch (currentStage) {
        case 'customer':
            checkoutStep = 1;
            break;
       case 'shipping':
        checkoutStep = 2;
            break;
      case 'payment':
        checkoutStep = 3;
            break;
     }
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
    }
        res.render('checkout/checkout', {
            order: orderModel,
            totals:basketModel.totals,
            viewPayment: isView,
            customer: accountModel,
            departamentos : departamentos,
            addressForm: shippingForm,
            forms: {
                guestCustomerForm: guestCustomerForm,
                registeredCustomerForm: registeredCustomerForm,
                addressForm: shippingForm,
                billingForm: billingForm,
                customerNotRegisterForm:customerNotRegisterForm,
                identificateForm : identificateForm
            },
            expirationYears: creditCardExpirationYears,
            currentStage: currentStage,
            reportingURLs: reportingURLs,
            oAuthReentryEndpoint: 2,
            dataformpayment:dataformpayment,
            totalGift : totalGift,
            openModalUpdate : openModalUpdate,
            newtotalGift:newtotalGift,
            gtm_id: gtm_id,
            productArray: productArray,
            checkout_step: checkoutStep,
            total_cart_amount: currentBasket.totalGrossPrice.value,
            total_cart_size: currentBasket.productQuantityTotal,
            coupon: couponsString
        });

        return next();
    }
);


server.get('BasketInfoDL', function( req, res, next){
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var CartModel = require('*/cartridge/models/cart');
    var basketModel = new CartModel(currentBasket);
    var productArray = [];
    var basketObj = {};
        basketModel.items.forEach(element => {
            var ProductMgr = require('dw/catalog/ProductMgr');
            var ProductFactory = require('*/cartridge/scripts/factories/product');
            var productObj = ProductMgr.getProduct(element.id);
            var productTileParams = { pview: 'tile', 'pid': element.id};
            var product = ProductFactory.get(productTileParams);
            var price1 = (product.price.sales &&  product.price.sales.value) ?  product.price.sales.value : '';
            var price2 = (product.price.list && product.price.list.value) ? product.price.list.value :'';
            var cat1 = productObj.masterProduct ? productObj.masterProduct.categoryAssignments[0].category.ID : productObj.categoryAssignments[0].category.ID;
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
            var listObj = {
                item_name: productObj.name, //Requerido
                item_id: productObj.masterProduct ? productObj.masterProduct.ID : productObj.ID,
                item_sku_id: productObj.masterProduct ? productObj.ID : '',
                final_price: price1, //Precio del producto con descuento
                original_price: price2, //Precio original del producto
                item_category: cat1, //Categoría principal
                item_category2: cat2, //Categoría secundaria
                quantity: element.quantity
            };
            productArray.push(JSON.stringify(listObj));
        });

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
        }
        var customerEmail = '';
        customerEmail =  (currentBasket.customer.profile && currentBasket.customer.profile.email) ? currentBasket.customerEmail : null;
        if(!customerEmail) {
            customerEmail = currentBasket.customerEmail ? currentBasket.customerEmail : '';
        }
        basketObj.productArray = productArray;
        basketObj.coupon = couponsString;
        basketObj.checkout_step = req.querystring.paso;
        basketObj.total_cart_amount = currentBasket.totalGrossPrice.value;
        basketObj.total_cart_size = currentBasket.productQuantityTotal;
        basketObj.cart_id = currentBasket.UUID;
        basketObj.shipping_type = currentBasket.shipments[0].shippingMethodID;
        basketObj.email_name = customerEmail;
        if(req.querystring.paso == 3) {
            if(currentBasket.paymentInstruments.length > 1){
                var paymentMethodsString = '';
                var paymentMethodsArray = [];
                for (var i = 0; i < currentBasket.paymentInstruments.length; i++) {
                    paymentMethodsArray.push(currentBasket.paymentInstruments[i].paymentMethod);
                }
                paymentMethodsString = couponsArray.toString();
            } else {
                paymentMethodsString = currentBasket.paymentInstruments[0].paymentMethod;
            }
            basketObj.payment_type = paymentMethodsString;
        }
    res.json({basketObj: basketObj });
    next();
  
});

module.exports = server.exports();