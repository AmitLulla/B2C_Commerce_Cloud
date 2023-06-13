'use strict';

/**
 * @namespace CheckoutShippingServices
 */

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

function toCamelCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
}


server.post('SelectShippingMethodDepartamento', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var Locale = require('dw/util/Locale');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shippingMethodID =  session.custom.selectedshipping;
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var viewData = res.getViewData();
    //shipping address from customer
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customer;
    if(req.currentCustomer.profile && req.currentCustomer.profile.customerNo){
        customer = CustomerMgr.getCustomerByCustomerNumber(
           req.currentCustomer.profile.customerNo
       );
    } else {
        customer = CustomerMgr.getCustomerByLogin(
            currentBasket.customerEmail
        );
    }
    var customerAddressBook = customer.getAddressBook();
    var selectedCustomerAddress;
    if (req.querystring.addressID){
        selectedCustomerAddress = customerAddressBook.getAddress(req.querystring.addressID);
    }

    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');
    var departamento = toCamelCase(selectedCustomerAddress.custom.departamento);
    session.custom.departamento = departamento;
    var municipio = toCamelCase(selectedCustomerAddress.city);
    session.custom.municipio = municipio;
    var costo = customShippingHelpers.getCustomShippingCostDepartamento(departamento, municipio, shippingMethodID)
    if(costo == 0) {
        session.custom.selectedshipping = 'envioNormal';
        res.json({
            error: true
        });
        return next();
    }
    viewData.address = selectedCustomerAddress;
    // viewData.isGift = req.form.isGift === 'true';
    // viewData.giftMessage = req.form.isGift ? req.form.giftMessage : null;
    res.setViewData(viewData);


    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var shippingData = res.getViewData();
        var address = shippingData.address;

        try {
            Transaction.wrap(function () {
                var shippingAddress = shipment.shippingAddress;

                if (!shippingAddress) {
                    shippingAddress = shipment.createShippingAddress();
                }

                shippingAddress.setFirstName(address.firstName || '');
                shippingAddress.setLastName(address.lastName || '');
                shippingAddress.setAddress1(address.address1 || '');
                shippingAddress.setAddress2(address.address2 || '');
                shippingAddress.setCity(address.city || '');
                shippingAddress.setPostalCode(address.postalCode || '');
                shippingAddress.setStateCode(address.stateCode || '');
                shippingAddress.setCountryCode(address.countryCode || '');
                shippingAddress.setPhone(address.phone || '');
                if(costo <= 0){
                    throw error;
                }
                session.custom.selectedshipping = shippingMethodID;
                session.custom.shippingCostDepartamento = costo;
                ShippingHelper.selectShippingMethod(shipment, shippingMethodID);
                
            });
        } catch (err) {
            res.setStatusCode(500);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
            });

            return;
        }
        var HookMgr = require('dw/system/HookMgr');
        HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', currentBasket);
        COHelpers.recalculateBasket(currentBasket);


        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);
        
        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var customApplicableShippingMethods = customShippingHelpers.getCustomApplicableShippingMethods(basketModel, currentBasket);
        basketModel.shipping[0].applicableShippingMethods = customApplicableShippingMethods; //shippingCost
        basketModel.shipping[0].selectedShippingMethod.shippingCost = session.custom.shippingCostDepartamento;
        res.json({
            customer: new AccountModel(req.currentCustomer),
            order: basketModel
        });
    });

    return next();
});

server.post('UpdateShippingCostDepartamento', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var Locale = require('dw/util/Locale');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shippingMethodID =  session.custom.selectedshipping;
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');
    var departamento = toCamelCase(req.querystring.departamento);
    session.custom.departamento = departamento;
    var municipio = null;
    if(req.querystring.city){
        municipio = toCamelCase(req.querystring.city);
    }
    session.custom.municipio = municipio;
    var costo = customShippingHelpers.getCustomShippingCostDepartamento(departamento, municipio, shippingMethodID)
    if(costo == 0) {
        session.custom.selectedshipping = 'envioNormal';
        res.json({
            error: true
        });
        return next();
    }
    session.custom.selectedshipping = shippingMethodID;
    session.custom.shippingCostDepartamento = costo;

        var HookMgr = require('dw/system/HookMgr');
        HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', currentBasket);
        COHelpers.recalculateBasket(currentBasket);


        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var customApplicableShippingMethods = customShippingHelpers.getCustomApplicableShippingMethods(basketModel, currentBasket);
        basketModel.shipping[0].applicableShippingMethods = customApplicableShippingMethods; //shippingCost
        basketModel.shipping[0].selectedShippingMethod.shippingCost = session.custom.shippingCostDepartamento;
        res.json({
            customer: new AccountModel(req.currentCustomer),
            order: basketModel
        });
    

    return next();
});

server.post('UpdateShippingCostDefault', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var Locale = require('dw/util/Locale');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shippingMethodID =  session.custom.selectedshipping;
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');
    var costo = customShippingHelpers.getCustomShippingCostDefault(shippingMethodID, req.querystring.defaultShippingAddress ? req.querystring.defaultShippingAddress : false);
    if(costo == 0) {
        session.custom.selectedshipping = 'envioNormal';
        res.json({
            error: true
        });
        return next();
    }
    session.custom.shippingCostDepartamento = costo;
        var HookMgr = require('dw/system/HookMgr');
        HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', currentBasket);
        COHelpers.recalculateBasket(currentBasket);


        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var customApplicableShippingMethods = customShippingHelpers.getCustomApplicableShippingMethods(basketModel, currentBasket, req.querystring.defaultShippingAddress ? req.querystring.defaultShippingAddress : false);
        basketModel.shipping[0].applicableShippingMethods = customApplicableShippingMethods; //shippingCost
        basketModel.shipping[0].selectedShippingMethod.shippingCost = session.custom.shippingCostDepartamento;
        res.json({
            customer: new AccountModel(req.currentCustomer),
            order: basketModel
        });
    

    return next();
});

/**
 * Handle Ajax shipping form submit
 */
/**
 * CheckoutShippingServices-SubmitShipping : The CheckoutShippingServices-SubmitShipping endpoint submits the shopper's shipping addresse(s) and shipping method(s) and saves them to the basket
 * @name Base/CheckoutShippingServices-SubmitShipping
 * @function
 * @memberof CheckoutShippingServices
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - shipmentUUID - The universally unique identifier of the shipment
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_shippingMethodID - The selected shipping method id
 * @param {httpparameter} - shipmentSelector - For Guest shopper: A shipment UUID that contains address that matches the selected address, For returning shopper: ab_<address-name-from-address-book>" of the selected address. For both type of shoppers: "new" if a brand new address is entered
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_firstName - shipping address input field, shopper's shipping first name
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_lastName - shipping address input field, shopper's last name
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_address1 - shipping address input field, address line 1
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_address2 - shipping address nput field address line 2
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_country - shipping address input field, country
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_states_stateCode - shipping address input field, state code (Not all locales have state code)
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_city - shipping address input field, city
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_postalCode - shipping address input field, postal code (or zipcode)
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_phone - shipping address input field, shopper's phone number
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_giftMessage - text area for gift message
 * @param {httpparameter} - csrf_token - Hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var URLUtils = require('dw/web/URLUtils');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var customerHelper = require('~/cartridge/scripts/helpers/customerHelper');
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var Locale = require('dw/util/Locale');
        var diviPola;

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var form = server.forms.getForm('addressCustom');
        var result = {};

        // verify shipping form data
        var shippingFormErrors = COHelpers.validateShippingForm(form);
        var UUIDAdress = req.form.dataCustom;
        var shippingID = req.form.shippingMethodID;
        if (shippingID) {
            var Transaction = require('dw/system/Transaction');
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            var shipping = customerHelper.setShipingMethod(currentBasket, shippingID);
            Transaction.wrap(function () {
                currentBasket.shipments[0].setShippingMethod(shipping);
            });
            COHelpers.recalculateBasket(currentBasket);
        }
        var isCheckoutCustom, resultAddress;
        var currentLocale = Locale.getLocale(req.locale.id);
        var email = currentBasket.customerEmail;
        if(!email) {
            email = currentBasket.customer.profile.credentials.login;
        }
        var customer = CustomerMgr.getCustomerByLogin(email);
        if (UUIDAdress) {
            if (!customer) {
                customer = CustomerMgr.queryProfile('email = {0}', email);
                customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo : '');
            }
            isCheckoutCustom = true;
            resultAddress = customerHelper.getAddressCustomer(customer, UUIDAdress);
        }
        var resultQuery = CustomObjectMgr.queryCustomObjects("departamento", "custom.municipio LIKE {0}", null,
            form.citySelect.value ? form.citySelect.value : resultAddress.address.city + '*');
        while (resultQuery.hasNext()) {
            var dataQuery = resultQuery.next();
            diviPola = dataQuery.custom.codigoDiviPola;
        }
        if (Object.keys(shippingFormErrors).length > 0 && !isCheckoutCustom) {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');

            res.json({
                form: form,
                fieldErrors: [shippingFormErrors],
                serverErrors: [],
                error: true
            });
        } else {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'valid');
            if (!empty(resultAddress) && resultAddress.address) {
                result = resultAddress;
                result.address.phone = customer.profile.phoneHome;
                result.address.postalCode = diviPola;
                result.address.countryCode = 'CO';
                result.address.state = result.address.departamento;
                result.address.stateCode = result.address.departamento;
                result.shippingBillingSame = true;
                result.isGift = true;
                result.giftMessage = null;
                result.shippingMethod = shipping ? shipping.ID: currentBasket.shipments[0].shippingMethodID;
                form.clear();
            } else {
                if (form.aliasDireccion.value) {
                    result.address = {
                        firstName: form.recibeName.value,
                        lastName: null,
                        state : form.depaSelect.value,
                        stateCode: form.depaSelect.value,
                        address1: form.tipoVia.value +' ' + form.street.value + ' # ' + form.numberStreet.value + '-' + form.numberStreetExtra.value,
                        address2: form.piso.value ? form.piso.value : '',
                        city: form.citySelect.value,
                        postalCode: diviPola ? diviPola : null,
                        countryCode: 'CO',
                        phone: customer ? customer.profile.phoneHome: currentBasket.billingAddress ? currentBasket.billingAddress.phone: null,
                        state: form.depaSelect.value,
                        alias:form.aliasDireccion.value,
                        via:form.tipoVia.value,
                        street: form.street.value,
                        numberStreet : form.numberStreet.value,
                        numberStreetExtra :form.numberStreetExtra.value,
                        departamento: form.depaSelect.value,
                        Municipio: form.citySelect.value,
                        piso_o_apartamento: form.piso.value,
                        recibe_name: form.recibeName.value
                    };

                    if (Object.prototype.hasOwnProperty
                        .call(form, 'states')) {
                        result.address.stateCode =
                            form.shippingAddress.addressFields.states.stateCode.value;
                    }

                    result.shippingBillingSame =
                        req.form.shippingIsBilling ? req.form.shippingIsBilling: false;

                    result.shippingMethod = currentBasket.getShipments()[0]
                        ? currentBasket.getShipments()[0].shippingMethodID.toString()
                        : null;

                    result.isGift = false;

                    result.giftMessage = result.isGift ? form.shippingAddress.giftMessage.value : null;
                }
            }
           
            res.setViewData(result);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var AccountModel = require('*/cartridge/models/account');
                var OrderModel = require('*/cartridge/models/order');
                var Locale = require('dw/util/Locale');

                var shippingData = res.getViewData();

                COHelpers.copyShippingAddressToShipment(
                    shippingData,
                    currentBasket.defaultShipment
                );

                var giftResult = COHelpers.setGift(
                    currentBasket.defaultShipment,
                    shippingData.isGift,
                    shippingData.giftMessage
                );

                if (giftResult.error) {
                    res.json({
                        error: giftResult.error,
                        fieldErrors: [],
                        serverErrors: [giftResult.errorMessage]
                    });
                    return;
                }
                session.custom.direccionComplete = req.form.direccionCompleta;
                if (shippingData.shippingBillingSame) {
                    if (req.currentCustomer.addressBook
                        && req.currentCustomer.addressBook.preferredAddress) {
                        // Copy over preferredAddress (use addressUUID for matching)
                        COHelpers.copyBillingAddressToBasket(
                            req.currentCustomer.addressBook.preferredAddress, currentBasket);
                    } else {
                        // Copy over first shipping address (use shipmentUUID for matching)
                        COHelpers.copyBillingAddressToBasket(
                            currentBasket.defaultShipment.shippingAddress, currentBasket);
                    }
                }
                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                COHelpers.recalculateBasket(currentBasket);

                var currentLocale = Locale.getLocale(req.locale.id);
                var basketModel = new OrderModel(
                    currentBasket,
                    {
                        usingMultiShipping: usingMultiShipping,
                        shippable: true,
                        countryCode: currentLocale.country,
                        containerView: 'basket'
                    }
                );
                // Info of GiftCard 
                var giftHelper = require('*/cartridge/scripts/helpers/giftCardAmount');
                var data = giftHelper.GetDiferenceGiftCertificate(currentBasket);
                if (data) {
                    basketModel.differenceGift = data.saldoPending;
                }

                res.json({
                    customer: new AccountModel(req.currentCustomer),
                    order: basketModel,
                    form: server.forms.getForm('shipping')
                });
            });
        }

        return next();
    }
);

server.replace('SelectShippingMethod', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var Locale = require('dw/util/Locale');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');

    // session.custom.selectedshipping = null;
    // session.custom.shippingCostDepartamento = null;

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shippingMethodID = req.querystring.methodID || req.form.methodID;
    var changePaymentMethod = req.querystring.changePaymentMethod || req.form.changePaymentMethod;
    if(!shippingMethodID){
        if(changePaymentMethod == 'true' ) {
            if(session.custom.recoverShippingMethod_payment) {
                shippingMethodID = session.custom.recoverShippingMethod_payment;
            } else {
                if(session.custom.selectedshipping) {
                    shippingMethodID = session.custom.selectedshipping;
                } else {
                    shippingMethodID = 'envioNormal';
                }
            }
        }
    }
    if(changePaymentMethod == 'false' && shippingMethodID == 'envioContraEntrega' && session.custom.selectedshipping){
        session.custom.recoverShippingMethod_payment = session.custom.selectedshipping;
    }
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var viewData = res.getViewData();
    viewData.address = ShippingHelper.getAddressFromRequest(req);
    viewData.isGift = req.form.isGift === 'true';
    viewData.giftMessage = req.form.isGift ? req.form.giftMessage : null;
    res.setViewData(viewData);


    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var shippingData = res.getViewData();
        var address = shippingData.address;
       

        try {
            Transaction.wrap(function () {
                if(address && address.address2) {
                    var shippingAddress = shipment.shippingAddress;
    
                    if (!shippingAddress) {
                        shippingAddress = shipment.createShippingAddress();
                    }
    
                    shippingAddress.setFirstName(address.firstName || '');
                    shippingAddress.setLastName(address.lastName || '');
                    shippingAddress.setAddress1(address.address1 || '');
                    shippingAddress.setAddress2(address.address2 || '');
                    shippingAddress.setCity(address.city || '');
                    shippingAddress.setPostalCode(address.postalCode || '');
                    shippingAddress.setStateCode(address.stateCode || '');
                    shippingAddress.setCountryCode(address.countryCode || '');
                    shippingAddress.setPhone(address.phone || '');
                }
                var costo;
                session.custom.selectedshipping = shippingMethodID;
                if(session.custom.departamento && session.custom.municipio) {
                    costo = customShippingHelpers.getCustomShippingCostDepartamento(session.custom.departamento, session.custom.municipio, session.custom.selectedshipping)
                } else if (session.custom.departamento && !session.custom.municipio) {
                    costo = customShippingHelpers.getCustomShippingCostDepartamento(session.custom.departamento, session.custom.municipio, session.custom.selectedshipping)
                } else {
                    costo = customShippingHelpers.getCustomShippingCostDefault(shippingMethodID);
                }

                session.custom.shippingCostDepartamento = costo;
              
                // if(costo <= 0){
                //     throw error;
                // }
                if(address && address.address2) {
                    ShippingHelper.selectShippingMethod(shipment, shippingMethodID);
                } else {
                    customShippingHelpers.selectShippingMethodNoAddress(shipment, shippingMethodID) ;
                }
            });
        } catch (err) {
            res.setStatusCode(500);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
            });

            return;
        }
       
        var HookMgr = require('dw/system/HookMgr');
        HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', currentBasket);
        COHelpers.recalculateBasket(currentBasket);

        COHelpers.setGift(shipment, shippingData.isGift, shippingData.giftMessage);

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var customApplicableShippingMethods = customShippingHelpers.getCustomApplicableShippingMethods(basketModel, currentBasket);
        basketModel.shipping[0].applicableShippingMethods = customApplicableShippingMethods; //shippingCost
        basketModel.shipping[0].selectedShippingMethod.shippingCost = session.custom.shippingCostDepartamento;
        res.json({
            customer: new AccountModel(req.currentCustomer),
            order: basketModel
        });
    });

    return next();
});

server.get('GetAmountGiftCertificate', function(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var currentBasket = BasketMgr.getCurrentBasket();
    var giftHelper = require('*/cartridge/scripts/helpers/giftCardAmount');
    var data = giftHelper.GetDiferenceGiftCertificate(currentBasket);
    res.json({data:data})
    next();
})

server.replace('UpdateShippingMethodsList', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var Locale = require('dw/util/Locale');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var address = ShippingHelper.getAddressFromRequest(req);

    var shippingMethodID;

    if (shipment.shippingMethod) {
        shippingMethodID = shipment.shippingMethod.ID;
    }

    Transaction.wrap(function () {
        var shippingAddress = shipment.shippingAddress;

        if (!shippingAddress) {
            shippingAddress = shipment.createShippingAddress();
        }

        Object.keys(address).forEach(function (key) {
            var value = address[key];
            if (value) {
                shippingAddress[key] = value;
            } else {
                shippingAddress[key] = null;
            }
        });

        ShippingHelper.selectShippingMethod(shipment, shippingMethodID);

        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);

    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );
    var customApplicableShippingMethods = customShippingHelpers.getCustomApplicableShippingMethods(basketModel, currentBasket);
    basketModel.shipping[0].applicableShippingMethods = customApplicableShippingMethods; //shippingCost
    basketModel.shipping[0].selectedShippingMethod.shippingCost = session.custom.shippingCostDepartamento;
    res.json({
        customer: new AccountModel(req.currentCustomer),
        order: basketModel,
        shippingForm: server.forms.getForm('shipping')
    });

    return next();
});

module.exports = server.exports();
