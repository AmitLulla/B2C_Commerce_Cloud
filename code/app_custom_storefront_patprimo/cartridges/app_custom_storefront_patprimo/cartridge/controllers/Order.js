'use strict';

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Logger = require('dw/system/Logger');
var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');


server.replace(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var getCode = require('*/cartridge/scripts/helpers/getCode');
        session.custom.hasCart = null;

        var order;
        var installments = {'installments':session.privacy.installments,
                            'installment_amount': session.privacy.installment_amount }

        if (!req.form.orderToken || !req.form.orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }

        order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        // if the user is not register, be create a account
        if (session.custom.showFormNotRegister && !req.currentCustomer.raw.authenticated) {
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Transaction = require("dw/system/Transaction");
            var pass = getCode.createCode();
            var registrationFormObj = {
                firstName: order.billingAddress.firstName,
                lastName: order.billingAddress.lastName,
                phone: order.billingAddress.phone,
                email: order.customerEmail,
                emailConfirm: order.customerEmail,
                password: pass,
                passwordConfirm: pass,
                validForm: true
              };

            //   company data
            if (order.billingAddress.custom.razon_social) {
                registrationFormObj.razon_social = order.billingAddress.custom.razon_social;
                registrationFormObj.isResponsableIVA = order.billingAddress.custom.isResponsableIVA;
                registrationFormObj.nit = order.billingAddress.custom.nit;
            }
              
              try {
                var orderAddressCustom = {
                    aliasDireccion: order.shipments[0].shippingAddress.custom.aliasDireccion,
                    departamento: order.shipments[0].shippingAddress.custom.departamento,
                    municipio: order.shipments[0].shippingAddress.custom.municipio,
                    nombre_persona_receptora: order.shipments[0].shippingAddress.custom.nombre_persona_receptora,
                    numberStreet: order.shipments[0].shippingAddress.custom.numberStreet,
                    numberStreetExtra: order.shipments[0].shippingAddress.custom.numberStreetExtra,
                    piso_o_apartamento: order.shipments[0].shippingAddress.custom.piso_o_apartamento,
                    state: order.shipments[0].shippingAddress.custom.state,
                    street: order.shipments[0].shippingAddress.custom.street,
                    tipo_de_via: order.shipments[0].shippingAddress.custom.tipo_de_via
                };
                Transaction.wrap(function () {
                  var error = {};
                  var newCustomer = CustomerMgr.createCustomer(registrationFormObj.email, registrationFormObj.password);
    
                  var authenticateCustomerResult = CustomerMgr.authenticateCustomer(registrationFormObj.email, registrationFormObj.password);
                  if (authenticateCustomerResult.status !== 'AUTH_OK') {
                    error = {
                      authError: true,
                      status: authenticateCustomerResult.status
                    };
                    throw error;
                  }
    
                  var authenticatedCustomer = CustomerMgr.loginCustomer(
                    authenticateCustomerResult,
                    false
                  );
                  if (authenticatedCustomer) {
                    CustomerMgr.logoutCustomer(false);
                    // save all used shipping addresses to address book of the logged in customer
                    var allAddresses = addressHelpers.gatherShippingAddresses(order);
                    allAddresses.forEach(function (address) {
                    if (
                        !addressHelpers.checkIfAddressStored(
                        address,
                        authenticatedCustomer.addressBook.addresses
                        )
                    ) {
                        var orderAddressObj = orderAddressCustom;
                        address.orderAddressObj = orderAddressObj;
                        addressHelpers.saveAddress(
                        address,
                        newCustomer,
                        order.shipments[0].shippingAddress.custom.aliasDireccion
                        );
                    }
                    });
                  }
    
                  if (!authenticatedCustomer) {
                    error = {
                      authError: true,
                      status: authenticateCustomerResult.status
                    };
                    throw error;
                  } else {
                    // assign values to the profile
                    var newCustomerProfile = newCustomer.getProfile();
    
                    newCustomerProfile.firstName = registrationFormObj.firstName;
                    newCustomerProfile.lastName = registrationFormObj.lastName;
                    //custom information 
                    newCustomerProfile.custom.documentoIdentidad= order.billingAddress.custom.cedulaCiudadana;
                    newCustomerProfile.phoneHome = registrationFormObj.phone;
                    newCustomerProfile.email = registrationFormObj.email;
                    newCustomerProfile.credentials.authenticationProviderID =
                      'AuthCode';
                    newCustomerProfile.credentials.externalID =
                    registrationFormObj.email;
                    if(registrationFormObj.razon_social) {
                        newCustomerProfile.custom.razon_social = registrationFormObj.razon_social;
                        newCustomerProfile.custom.corporateDocument = registrationFormObj.nit;
                        newCustomerProfile.custom.isResponsableIVA = registrationFormObj.isResponsableIVA;
                        newCustomerProfile.custom.isCorporate = true;
                    }
                  }
                });
                
              } catch (e) {
                Logger.error('Ocurrio un error al registrar un usuario: ', e.message)
              }
        }
        
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID === req.querystring.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);
        // Datos para datalayer evento checkout_payment
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    // var CartModel = require('*/cartridge/models/cart');
    // var basketModel = new CartModel(currentBasket);
    var productArray = [];
    var basketObj = {};
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

        var couponsString = '';
        var couponsArray = [];
        // var OrderMgr = require('dw/order/OrderMgr');
        // var order = OrderMgr.getOrder(orderModel.orderNumber);
        var couponLineItems = order.getCouponLineItems();
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
        customerEmail =  (order.customer.profile && order.customer.profile.email) ? order.customerEmail : null;
        if(!customerEmail) {
            customerEmail = order.customerEmail ? order.customerEmail : '';
        }
        basketObj.coupon = couponsString;
        basketObj.checkout_step = 3;
        basketObj.total_cart_amount = order.totalGrossPrice.value;
        basketObj.total_cart_size = order.productQuantityTotal;
        basketObj.cart_id = order.UUID;
        basketObj.shipping_type = order.shipments[0].shippingMethodID;
        basketObj.email_name = customerEmail;
        if(order.paymentInstruments.length > 1){
            var paymentMethodsString = '';
            var paymentMethodsArray = [];
            for (var i = 0; i < order.paymentInstruments.length; i++) {
                paymentMethodsArray.push(order.paymentInstruments[i].paymentMethod);
            }
            paymentMethodsString = couponsArray.toString();
        } else {
            paymentMethodsString = order.paymentInstruments[0].paymentMethod;
        }
        basketObj.payment_type = paymentMethodsString;
        // Datos para datalayer evento purchase",
        var Site = require('dw/system/Site');

       var orderObj = {};
       orderObj.transaction_id = orderModel.orderNumber;
       orderObj.affiliation = Site.current.name;//site
       orderObj.value = orderModel.totals.grandTotalValue;//total
       orderObj.shipping = order.shippingTotalPrice.value;//
       orderObj.currency = Site.current.currencyCode;

       var Site = require('dw/system/Site');
       var customPreferences = Site.current.preferences.custom;
       var gtm_id = customPreferences.gtm_id;

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs,
                installments: installments,
                orderUUID: order.getUUID(),
                basketObj: basketObj,
                orderObj: orderObj,
                gtm_id: gtm_id,
                productArray : productArray
                
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID(),
                customer: req.currentCustomer,
                installments: installments,
                basketObj: basketObj,
                orderObj: orderObj,
                gtm_id: gtm_id,
                productArray: productArray
            });
        }
        req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
        return next();
    }
);
server.get(
    'ConfirmPayment',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        session.custom.hasCart = null;
        var order;
        var token = req.querystring.token;
        var ID = req.querystring.ID;

        if (!token || !ID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }

        order = OrderMgr.getOrder( ID, token);
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (!lastOrderID === ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID(),
                customer: req.currentCustomer
            });
        }
        req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
        return next();
    }
);

/**
 * Order-Track : This endpoint is used to track a placed Order
 * @name Base/Order-Track
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateRequest
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - trackOrderNumber - Order Number to track
 * @param {querystringparameter} - trackOrderEmail - Email on the Order to track
 * @param {querystringparameter} - trackOrderPostal - Postal Code on the Order to track
 * @param {querystringparameter} - csrf_token - CSRF token
 * @param {querystringparameter} - submit - This is to submit the form
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - post
 */
server.replace(
    'Track',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var Template = require('dw/util/Template');
        var HashMap = require('dw/util/HashMap');
        var propsData = new HashMap();
        var order;
        var attrObj = [];
        var template;
        var validForm = true;
        var target = req.querystring.rurl || 1;
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();


        if (req.form.trackOrderNumber) {
            order = OrderMgr.getOrder(req.form.trackOrderNumber);
        } else {
            validForm = false;
        }

        if (!order) {
            attrObj.push({error:true,
                            msj:'order not found' });
            template = new Template('checkout/confirmation/confirmationDetailsLogin');
            propsData.put("error", true);
            var content = template.render(propsData);
            res.json({htmlTemplate:content,
                    msj : 'order not found',
                    error:true})
           
            next();
        } else {
            var config = {
                numberOfLineItems: '*'
            };

            var currentLocale = Locale.getLocale(req.locale.id);

            var orderModel = new OrderModel(
                order,
                { config: config, countryCode: currentLocale.country, containerView: 'order' }
            );

            if (validForm) {
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null);

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.url('Home-Show')
                    : URLUtils.https('Account-Show');
                // Status shipped
                var shipStatus = 'No Enviado';
                if (order.getShippingStatus().toString() === 'SHIPPED') {
                    shipStatus = 'Enviado';
                }
                //Aqui renderiza el Check / Por confirmar si necesita validacion Extra
                // res.render('checkout/confirmation/confirmationDetails'  
                template = new Template('checkout/confirmation/confirmationDetailsLogin');
                propsData.put("order", orderModel);
                propsData.put("exitLinkText", exitLinkText);
                propsData.put("exitLinkUrl", exitLinkUrl);
                propsData.put("numberGuia", order.custom.NoGuia);
                propsData.put("TrackingGuia", order.custom.TrackingGuia);
                propsData.put("status", shipStatus);

                var content = template.render(propsData).text;
                res.json({
                    error:false,
                    htmlTemplate:content
                })

            } else {
                res.render('/account/login', {
                    navTabValue: 'login',
                    profileForm: profileForm,
                    orderTrackFormError: !validForm,
                    userName: '',
                    actionUrl: actionUrl
                });
            }

            next();
        }
    }
);

server.append(
    'History',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/helpers/orderHistoryHelper');
        var OrderMgr = require('dw/order/OrderMgr');
        var viewData = res.getViewData();
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var Order = require('dw/order/Order');
        var customerOrders, orderModel, orders2 = [];
        var queryOrders = "customerEmail = {0} AND status != {1}";
        var allOrders = OrderMgr.queryOrders(queryOrders, "creationDate desc", req.currentCustomer.profile.email , Order.ORDER_STATUS_CANCELLED);        
        var currentLocale = Locale.getLocale(req.locale.id);
        var locale = req.locale.id;

        while (allOrders.hasNext()) {
            customerOrders = allOrders.next();
            var config = {
                numberOfLineItems: 'single'
            };
            try {
                orderModel = new OrderModel(
                    customerOrders,
                    { config: config, countryCode: currentLocale.country }
                );
               var avalible = AvalibleReturns(orderModel.orderNumber, orderModel, locale);
               orderModel.AvalibleReturns = avalible.AvalibleReturns;
               orderModel.newQuantity = avalible.quantity;
               orderModel.newTotal = avalible.newTotal;
            } catch (error) {
            }
            orders2.push(orderModel);
        }
        viewData.orders = orders2;
        OrderHelpers.getOrderData(orders2);
        res.setViewData(viewData);
               next();
    }
);

/**
 * Order-Details : This endpoint is called to get Order Details
 * @name Base/Order-Details
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {querystringparameter} - orderID - Order ID
 * @param {querystringparameter} - orderFilter - Order Filter ID
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'Details',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var orderModel = orderHelpers.getOrderDetails(req);

        var order = OrderMgr.getOrder(req.querystring.orderID);
        var orderCustomerNo = req.currentCustomer.profile.customerNo;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];

        var grossprice  = order.shipments[0].adjustedMerchandizeTotalGrossPrice.value;
        var totalPrice  = order.shipments[0].proratedMerchandizeTotalPrice.value;
        var orderDiscount = (totalPrice / grossprice);
        var itemsSelect = orderModel.items.items;
        var itemsOrder = order.shipments[0].productLineItems;
        var itemsCustom = [];

        for (let i = 0; i < itemsOrder.length; i++) {
            itemsCustom.push(itemsOrder[i]);
          }

        if (order && orderCustomerNo) {
            
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);

                itemsSelect.forEach((element, index) => {
                    var priceDiscount = formatCurrency(
                      element.priceTotal.priceUnitNumber
                    );
                    var priceDiscountTotal = formatCurrency((element.priceTotal.priceUnitNumber) * element.quantity);
          
                    orderModel.shipping[0].productLineItems.items[index].priceDiscount = priceDiscount;
                    orderModel.shipping[0].productLineItems.items[index].priceDiscountNumber = element.priceTotal.priceUnitNumber;
                    orderModel.shipping[0].productLineItems.items[index].priceDiscountTotal = priceDiscountTotal;
                    orderModel.shipping[0].productLineItems.items[index].priceDiscountTotalNumber = (element.priceTotal.priceUnitNumber) * element.quantity;
                    itemsCustom.forEach((custom, index) => {
                        if(custom.productID === element.id){
                            orderModel.shipping[0].productLineItems.items[index].cantidadDespachada = custom.quantity.value;
                            let totalCantidadDespachada = custom.quantity.value * (element.priceTotal.priceUnitNumber);
                            orderModel.shipping[0].productLineItems.items[index].totalCantidadDespachada = formatCurrency(totalCantidadDespachada);
                        }
                        if(custom.productID === element.id && custom.custom.productoIncompleto){
                            orderModel.shipping[0].productLineItems.items[index].cantidadDespachada = custom.custom.cantidadDespachada;
                            let totalCantidadDespachada2 = custom.custom.cantidadDespachada * (element.priceTotal.priceUnitNumber);
                            orderModel.shipping[0].productLineItems.items[index].totalCantidadDespachada = formatCurrency(totalCantidadDespachada2);
                        }
                    });
                  });

                 var Avalible = AvalibleReturns(req, [], []);
            res.render('account/orderDetails', {
                AvalibleReturns:Avalible.AvalibleReturns,
                estadoOrden:order.custom.estadoOrden.value,
                order: orderModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.get(
    'Return',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var returnHelpers = require('*/cartridge/scripts/helpers/returnsHelpers.js');

        var order = OrderMgr.getOrder(req.querystring.orderID);
        var returnType = req.querystring.returnType;
        var orderCustomerNo = req.currentCustomer.profile.customerNo;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];
        var itemsOrder = order.shipments[0].productLineItems;
        var itemsCustom = [];

        for (let i = 0; i < itemsOrder.length; i++) {
            itemsCustom.push(itemsOrder[i]);
          }

        if (order && orderCustomerNo) {
            var orderModel = orderHelpers.getOrderDetails(req);
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
                var CustomObjectMgr = require('dw/object/CustomObjectMgr');
                var departamentos = [];
                var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0}",null ,'*');
                while (result.hasNext()) {
                    var departamento = result.next();
                    if(departamentos.length > 0){
                        if (departamentos.indexOf(departamento.custom.ciudad) === -1) {
                            departamentos.push(departamento.custom.ciudad)
                        }
                    }else {
                        departamentos.push(departamento.custom.ciudad)
                    }
                }
                departamentos.sort();
                var itemsSelect = orderModel.items.items;
                var preferences = returnHelpers.getPreferences();
                var retutnServices = JSON.parse(preferences.retutnService);
                var categoryTree = JSON.parse(preferences.categoryTree);
                var service;

                retutnServices.forEach((retutnService) => {
                    if(retutnService.urlServicio == returnType){
                        service = retutnService.idServicio
                    }
                });

                var grossprice  = order.shipments[0].adjustedMerchandizeTotalGrossPrice.value;
                var totalPrice  = order.shipments[0].proratedMerchandizeTotalPrice.value;
                var orderDiscount = (totalPrice / grossprice);
                var itemsSelect = orderModel.items.items;


                itemsSelect.forEach((element, index) => {
                    var devoluciones = [];
                    var product = ProductMgr.getProduct(element.id);
                    var categories =  product.variationModel.master.categories[0].ID;
                    categoryTree.forEach((category) => {
                        if(category.categoria == categories){
                            switch (returnType) {
                            case 'retracto':
                            devoluciones.push({"categoria": category.categoria,
                                               "devolucion":category.retracto});
                            break;
                            case 'devolucion':
                            devoluciones.push({"categoria": category.categoria,
                                                "devolucion":category.devolucion});
                            break;
                            case 'garantia':
                            devoluciones.push({"categoria": category.categoria,
                                                "devolucion":category.garantia});
                            break;
                                default:
                                    break;
                            }
                        }
                    })
                    orderModel.shipping[0].productLineItems.items[index].devoluciones = devoluciones;
                    orderModel.shipping[0].productLineItems.items[index].quantityCount = [];
                    for (let i = 0; i < element.quantity; i++) {
                    orderModel.shipping[0].productLineItems.items[index].quantityCount.push({'value' :i + 1});

                  }

                  var priceDiscount = formatCurrency(
                    element.priceTotal.priceUnitNumber
                  );
                  var priceDiscountTotal = formatCurrency(element.priceTotal.priceUnitNumber * element.quantity);

                  orderModel.shipping[0].productLineItems.items[index].priceDiscount = priceDiscount;
                  orderModel.shipping[0].productLineItems.items[index].priceDiscountNumber = element.priceTotal.priceUnitNumber;
                  orderModel.shipping[0].productLineItems.items[index].priceDiscountTotal = priceDiscountTotal;
                  orderModel.shipping[0].productLineItems.items[index].priceDiscountTotalNumber = (element.priceTotal.priceUnitNumber) * element.quantity;
                  
                  itemsCustom.forEach((custom, index) => {
                    if(custom.productID === element.id){
                        orderModel.shipping[0].productLineItems.items[index].cantidadDespachada = custom.quantity.value;
                        let totalCantidadDespachada = custom.quantity.value * (element.priceTotal.priceUnitNumber);
                        orderModel.shipping[0].productLineItems.items[index].totalCantidadDespachada = formatCurrency(totalCantidadDespachada);

                        orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount = [];
                        for (let i = 0; i < custom.quantity.value; i++) {
                        orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount.push({'value' :i + 1});
    
                      }
                    }
                    if(custom.productID === element.id && custom.custom.productoIncompleto){
                        orderModel.shipping[0].productLineItems.items[index].cantidadDespachada = custom.custom.cantidadDespachada;
                        let totalCantidadDespachada2 = custom.custom.cantidadDespachada * (element.priceTotal.priceUnitNumber);
                        orderModel.shipping[0].productLineItems.items[index].totalCantidadDespachada = formatCurrency(totalCantidadDespachada2);

                        orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount = [];
                        for (let i = 0; i < custom.custom.cantidadDespachada; i++) {
                        orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount.push({'value' :i + 1});
    
                      }
                    }


                });

                });
                var today = new Date().getTime();
                var deliveryDate = new Date(order.custom.fechaEntrega).getTime();
                var diff = today - deliveryDate;
                var days = Math.trunc(diff/(1000*60*60*24));
                var addressBook = getList(req.currentCustomer.profile.customerNo);
                if(!orderModel.shipping[0].matchingAddressId){
                    orderModel.shipping[0].matchingAddressId = order.shipments[0].shippingAddress.custom.aliasDireccion;
                }
                var priceTotalOrder =  formatCurrency(order.totalNetPrice.value - order.adjustedShippingTotalPrice.value);
                var productLineItems = orderModel.shipping[0].productLineItems.items; 
                var quantity = 0;
                var newTotal = 0;  
                productLineItems.forEach((LineItems, index) => {
                if(LineItems.cantidadDespachada >= 0){
                        quantity = quantity + LineItems.cantidadDespachada;
                        newTotal = newTotal + LineItems.priceDiscountNumber * LineItems.cantidadDespachada;
                }else{
                    quantity = quantity + LineItems.quantity
                    newTotal = newTotal + LineItems.priceDiscountNumber * LineItems.quantity;
                }
                });


                res.render('/account/return', {
                newTotal:formatCurrency(newTotal),
                quantity:quantity,
                priceTotalOrder:priceTotalOrder,
                service: service,
                returnType: returnType,
                days: days,
                customerNo: req.currentCustomer.profile.customerNo,
                preferencesReturn: preferences,
                estadoOrden:order.custom.estadoOrden.value,
                departamentos:departamentos,
                order: orderModel,
                addressBook: getList(req.currentCustomer.profile.customerNo),
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

function getList(customerNo) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var AddressModel = require('*/cartridge/models/address');
    var collections = require('*/cartridge/scripts/util/collections');

    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var rawAddressBook = customer.addressBook.getAddresses();
    var addressBook = collections.map(rawAddressBook, function (rawAddress) {
        var addressModel = new AddressModel(rawAddress);
        addressModel.address.UUID = rawAddress.UUID;
        return addressModel;
    });
    return addressBook;
}

server.post(
    'SaveReturn',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var CustomerMgr = require("dw/customer/CustomerMgr");
        var CustomObjectMgr = require("dw/object/CustomObjectMgr");
        var returnHelpers = require('*/cartridge/scripts/helpers/returnsHelpers.js');


        var data = req.form;
        var idProducts = req.form.numberProducts;
        idProducts = idProducts.substring(0,idProducts.length - 1);
        idProducts = idProducts.split(",");
        var dataProducts = req.form.dataProducts;
        dataProducts = dataProducts.substring(1,dataProducts.length);
        dataProducts = dataProducts.split(",-");
        var returSucces = returnHelpers.createReturn(data, dataProducts);
        res.render('account/return/returnConfirm', {});
        return next();
    }
);

function AvalibleReturns (req ,orderModel, locale) {
    var OrderMgr = require('dw/order/OrderMgr');
    var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var returnHelpers = require('*/cartridge/scripts/helpers/returnsHelpers.js');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var preferences = returnHelpers.getPreferences();
if(orderModel != ''){
    var order = OrderMgr.getOrder(req);
    var orderModel = getOrderDetails2(req, locale);
}else{
    var order = OrderMgr.getOrder(req.querystring.orderID);
    var orderModel = orderHelpers.getOrderDetails(req);
}


    var itemsSelect = orderModel.items.items;
    var categoryTree = JSON.parse(preferences.categoryTree);

    var today = new Date().getTime();
    var deliveryDate = new Date(order.custom.fechaEntrega).getTime();
    var diff = today - deliveryDate;
    var days = Math.trunc(diff/(1000*60*60*24));

    var retractos = [];
    var devoluciones = [];
    var garantias = [];
    var retracto = [];
    var devolucion = [];
    var garantia = [];

    var grossprice  = order.shipments[0].adjustedMerchandizeTotalGrossPrice.value;
    var totalPrice  = order.shipments[0].proratedMerchandizeTotalPrice.value;
    var orderDiscount = (totalPrice / grossprice);
    var itemsOrder = order.shipments[0].productLineItems;
    var itemsCustom = [];

    for (let i = 0; i < itemsOrder.length; i++) {
        itemsCustom.push(itemsOrder[i]);
      }

    itemsSelect.forEach((element, index) => {
        
        var product = ProductMgr.getProduct(element.id);
        var categories =  product.variationModel.master.categories[0].ID;
        categoryTree.forEach((category) => {
          if (category.categoria == categories && category.retracto > days) {
            retracto.push({
              categoria: category.categoria,
              retracto: category.retracto,
            });
        }
        if (category.categoria == categories && category.devolucion > days) {
            devolucion.push({
              categoria: category.categoria,
              devolucion: category.devolucion,
            });
        }
        if (category.categoria == categories && category.garantia > days) {
            garantia.push({
              categoria: category.categoria,
              garantia: category.garantia,
            });
        }


        var priceDiscount = formatCurrency(
            element.priceTotal.priceUnitNumber
          );
          var priceDiscountTotal = formatCurrency((element.priceTotal.priceUnitNumber) * element.quantity);

          orderModel.shipping[0].productLineItems.items[index].priceDiscount = priceDiscount;
          orderModel.shipping[0].productLineItems.items[index].priceDiscountNumber = element.priceTotal.priceUnitNumber;
          orderModel.shipping[0].productLineItems.items[index].priceDiscountTotal = priceDiscountTotal;
          orderModel.shipping[0].productLineItems.items[index].priceDiscountTotalNumber = (element.priceTotal.priceUnitNumber) * element.quantity;
          

        itemsCustom.forEach((custom, index) => {
            if(custom.productID === element.id){
                orderModel.shipping[0].productLineItems.items[index].cantidadDespachada = custom.quantity.value;
                let totalCantidadDespachada = custom.quantity.value * (element.priceTotal.priceUnitNumber);
                orderModel.shipping[0].productLineItems.items[index].totalCantidadDespachada = formatCurrency(totalCantidadDespachada);

                orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount = [];
                for (let i = 0; i < custom.quantity.value; i++) {
                orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount.push({'value' :i + 1});

              }
            }
            if(custom.productID === element.id && custom.custom.productoIncompleto){
                orderModel.shipping[0].productLineItems.items[index].cantidadDespachada = custom.custom.cantidadDespachada;
                let totalCantidadDespachada2 = custom.custom.cantidadDespachada * (element.priceTotal.priceUnitNumber);
                orderModel.shipping[0].productLineItems.items[index].totalCantidadDespachada = formatCurrency(totalCantidadDespachada2);

                orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount = [];
                for (let i = 0; i < custom.custom.cantidadDespachada; i++) {
                orderModel.shipping[0].productLineItems.items[index].CantidadDespachadaQuantityCount.push({'value' :i + 1});

              }
            }


        });
        });
        retractos.push(retracto);
        devoluciones.push(devolucion);
        garantias.push(garantia);
    });
        retractos = retracto;
        devoluciones = devolucion;
        garantias = garantia;





        var productLineItems = orderModel.shipping[0].productLineItems.items; 
        var quantity = 0;
        var newTotal = 0;  
        productLineItems.forEach((LineItems, index) => {
        if(LineItems.cantidadDespachada >= 0){
                quantity = quantity + LineItems.cantidadDespachada;
                newTotal = newTotal + LineItems.priceDiscountNumber * LineItems.cantidadDespachada;
        }else{
            quantity = quantity + LineItems.quantity
            newTotal = newTotal + LineItems.priceDiscountNumber * LineItems.quantity;
        }
        });

        return {
            newTotal:formatCurrency(newTotal),
            quantity:quantity,
            AvalibleReturns:{
            retractos: retractos, 
            devoluciones: devoluciones,
            garantias: garantias}}
}

function getOrderDetails2(req, locale) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Locale = require('dw/util/Locale');
    var OrderModel = require('*/cartridge/models/order');
    var order = OrderMgr.getOrder(req);

    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale = Locale.getLocale(locale);

    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );

    return orderModel;
}

function formatCurrency(input) {
    var num = Math.round(input);
  
    if (!isNaN(num)) {
      num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');
  
      num = num.split('').reverse().join('').replace(/^[\.]/, '');
  
      return input = '$' + num;
    }
  }
module.exports = server.exports();
