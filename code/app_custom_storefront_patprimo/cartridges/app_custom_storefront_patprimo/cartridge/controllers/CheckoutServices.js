/* eslint-disable no-undef */

'use strict';

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

function handleCustomerRouteBeforeComplete(req, res, accountModel, redirectUrl) {
    var URLUtils = require('dw/web/URLUtils');
    var BasketMgr = require('dw/order/BasketMgr');
    var Locale = require('dw/util/Locale');
    var Transaction = require('dw/system/Transaction');
    var OrderModel = require('*/cartridge/models/order');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var currentLocale = Locale.getLocale(req.locale.id);
    

    var customerData = res.getViewData();
    var customer = CustomerMgr.getCustomerByLogin(customerData.customer.email.value);
    if(!customer) {
        customer = CustomerMgr.queryProfile('email = {0}', customerData.customer.email.value);
        customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo : '');
    }
    if (customer && customer.profile.custom.corporateDocument) {
        customerData.form.dwfrm_customerNotRegisterForm_nit = customer.profile.custom.corporateDocument;
        customerData.form.dwfrm_customerNotRegisterForm_razonSocial = customer.profile.custom.razon_social;
        customerData.form.dwfrm_customerNotRegisterForm_responsableIVA = customer.profile.custom.isResponsableIVA;
      }

    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return;
    }
    var shippingAddress = currentBasket.defaultShipment.shippingAddress;
    var billingAddress = currentBasket.billingAddress;
    if(customerData.customer) {
        Transaction.wrap(function () {
            currentBasket.setCustomerEmail(customerData.customer.email.value);
        });
    }
    if (customerData.form) {
        Transaction.wrap(function () {
            currentBasket.customerName = (customerData.form.dwfrm_customerNotRegisterForm_firstName +' '+customerData.form.dwfrm_customerNotRegisterForm_lastName);
            if (!shippingAddress) {
                shippingAddress = currentBasket.defaultShipment.createShippingAddress();
            }
            if (!billingAddress) {
                billingAddress = currentBasket.createBillingAddress();
            }
            billingAddress.setFirstName(customerData.form.dwfrm_customerNotRegisterForm_firstName);
            billingAddress.setLastName(customerData.form.dwfrm_customerNotRegisterForm_lastName);
            billingAddress.setPhone(customerData.form.dwfrm_customerNotRegisterForm_phoneMobile);
            billingAddress.setCountryCode(currentLocale.country);
            billingAddress.custom.cedulaCiudadana = customerData.form.dwfrm_customerNotRegisterForm_cedula;
            shippingAddress.custom.cedulaCiudadana = customerData.form.dwfrm_customerNotRegisterForm_cedula;
            if (customerData.form.dwfrm_customerNotRegisterForm_nit) {
                billingAddress.setCompanyName(customerData.form.dwfrm_customerNotRegisterForm_nameCompany ? customerData.form.dwfrm_customerNotRegisterForm_nameCompany: null);
                billingAddress.custom.nit = customerData.form.dwfrm_customerNotRegisterForm_nit ? customerData.form.dwfrm_customerNotRegisterForm_nit: null;
                billingAddress.custom.razon_social = customerData.form.dwfrm_customerNotRegisterForm_razonSocial ? customerData.form.dwfrm_customerNotRegisterForm_razonSocial: null;
                billingAddress.custom.nombre_empresa = customerData.form.dwfrm_customerNotRegisterForm_nameCompany;
                billingAddress.custom.isResponsableIVA  = customerData.form.dwfrm_customerNotRegisterForm_responsableIVA && 
                customerData.form.dwfrm_customerNotRegisterForm_responsableIVA === 'true' || customerData.form.dwfrm_customerNotRegisterForm_responsableIVA === true ? true: false;
                // shipping company address
                shippingAddress.custom.nit = customerData.form.dwfrm_customerNotRegisterForm_nit ? customerData.form.dwfrm_customerNotRegisterForm_nit: null;
                shippingAddress.custom.razon_social = customerData.form.dwfrm_customerNotRegisterForm_razonSocial ? customerData.form.dwfrm_customerNotRegisterForm_razonSocial: null;
                shippingAddress.custom.nombre_empresa = customerData.form.dwfrm_customerNotRegisterForm_nameCompany;
                shippingAddress.custom.isResponsableIVA  = customerData.form.dwfrm_customerNotRegisterForm_responsableIVA && 
                customerData.form.dwfrm_customerNotRegisterForm_responsableIVA === 'true' || customerData.form.dwfrm_customerNotRegisterForm_responsableIVA === true ? true: false;
            }
        });
    }
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
    }

    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );

    res.json({
        customer: accountModel,
        error: false,
        order: basketModel,
        csrfToken: customerData.csrfToken,
        redirectUrl: redirectUrl,
        recibeName:currentBasket.customerName
    });
}

server.prepend(
    'SubmitCustomer',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        // validate guest customer form
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var collections = require('*/cartridge/scripts/util/collections');
        var customerData = res.getViewData();
        var coCustomerForm = server.forms.getForm('coCustomer');
        var customerNotRegisterForm = server.forms.getForm('customerNotRegisterForm');
        var form = req.form;
        if (!session.custom.showFormNotRegister) {
            var customerRegister = CustomerMgr.getCustomerByLogin(form.dwfrm_coCustomer_email);
            if (!customerRegister) {
                customerRegister = CustomerMgr.queryProfile('email = {0}', form.dwfrm_coCustomer_email);
                customerRegister = CustomerMgr.getCustomerByCustomerNumber(customerRegister ? customerRegister.customerNo:'');
            }
            form.dwfrm_customerNotRegisterForm_firstName = customerRegister.profile.firstName;
            form.dwfrm_customerNotRegisterForm_lastName = customerRegister.profile.lastName;
            customerNotRegisterForm.clear();
        }
        coCustomerForm.email.value = customerNotRegisterForm.email.value ? customerNotRegisterForm.email.value : form.dwfrm_coCustomer_email;
        customerData.customer = {};
        customerData.customer.email = coCustomerForm.email;
        customerData.form = form;
        var AccountModel = require('*/cartridge/models/account');
        var accountModel = new AccountModel(req.currentCustomer);

        var customer = CustomerMgr.getCustomerByLogin(coCustomerForm.email.value);
        var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');
        if (!session.custom.removeCouponCart && !session.customer.isAuthenticated() && customer) {
            misReferidosHelpers.assignCouponCart(customer.profile);
            var BasketMgr = require('dw/order/BasketMgr');
            var CartModel = require('*/cartridge/models/cart');
            var currentBasket = BasketMgr.getCurrentBasket();
            var couponLineItem;
            couponLineItem = collections.find(currentBasket.couponLineItems, function (item) {
                if(item && item.couponCode && (item.couponCode == misReferidosHelpers.getCouponCodeMisReferidos() || item.couponCode == misReferidosHelpers.getCouponCodeMisReferidosAhijados())) {
                    customerData.basket = currentBasket;
                    var basketModel = new CartModel(currentBasket);
                    customerData.basketModel = basketModel;     
                }
            });
        }
        res.setViewData(customerData);
        handleCustomerRouteBeforeComplete(req, res, accountModel, null);

        next()
    });

/**
 *  Handle Ajax payment (and billing) form submit
 */
/**
 * CheckoutServices-SubmitPayment : The CheckoutServices-SubmitPayment endpoint will submit the payment information and render the checkout place order page allowing the shopper to confirm and place the order
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - addressSelector - For Guest shopper: A shipment UUID that contains address that matches the selected address. For returning shopper: ab_<address-name-from-address-book>" of the selected address. For both type of shoppers:  "new" if a brand new address is entered
 * @param {httpparameter} - dwfrm_billing_addressFields_firstName - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_billing_addressFields_lastName - Input field for the shoppers's last name
 * @param {httpparameter} - dwfrm_billing_addressFields_address1 - Input field for the shoppers's address 1 - street
 * @param {httpparameter} - dwfrm_billing_addressFields_address2 - Input field for the shoppers's address 2 - street
 * @param {httpparameter} - dwfrm_billing_addressFields_country - Input field for the shoppers's address - country
 * @param {httpparameter} - dwfrm_billing_addressFields_states_stateCode - Input field for the shoppers's address - state code
 * @param {httpparameter} - dwfrm_billing_addressFields_city - Input field for the shoppers's address - city
 * @param {httpparameter} - dwfrm_billing_addressFields_postalCode - Input field for the shoppers's address - postal code
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {httpparameter} - localizedNewAddressTitle - label for new address
 * @param {httpparameter} - dwfrm_billing_contactInfoFields_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_billing_contactInfoFields_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_billing_paymentMethod - Input field for the shopper's payment method
 * @param {httpparameter} - dwfrm_billing_creditCardFields_cardType - Input field for the shopper's credit card type
 * @param {httpparameter} - dwfrm_billing_creditCardFields_cardNumber - Input field for the shopper's credit card number
 * @param {httpparameter} - dwfrm_billing_creditCardFields_expirationMonth - Input field for the shopper's credit card expiration month
 * @param {httpparameter} - dwfrm_billing_creditCardFields_expirationYear - Input field for the shopper's credit card expiration year
 * @param {httpparameter} - dwfrm_billing_creditCardFields_securityCode - Input field for the shopper's credit card security code
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var PaymentManager = require('dw/order/PaymentMgr');
        var HookManager = require('dw/system/HookMgr');
        var Resource = require('dw/web/Resource');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');
        

        var viewData = {};
        var paymentForm = server.forms.getForm('billing');
        var customerNotRegisterForm = server.forms.getForm('customerNotRegisterForm');
        var shippingForm = server.forms.getForm('addressCustom');
        customerNotRegisterForm.clear();
        shippingForm.clear();

        // verify billing form data
        var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);

        var formFieldErrors = [];
        if (Object.keys(billingFormErrors).length) {
            formFieldErrors.push(billingFormErrors);
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value };
            }
        }

        if (Object.keys(contactInfoFormErrors).length) {
            formFieldErrors.push(contactInfoFormErrors);
        } else {
            viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
        }

        var paymentMethodIdValue = paymentForm.paymentMethod.value;
        if (paymentMethodIdValue == 'GIFT_CERTIFICATE') {
            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();
            var totalGiftCertificate = 0;
            for (var key in currentBasket.giftCertificatePaymentInstruments) {
                if (currentBasket.giftCertificatePaymentInstruments[key].paymentTransaction) {
                    totalGiftCertificate = totalGiftCertificate + currentBasket.giftCertificatePaymentInstruments[key].paymentTransaction.amount.value;
                }
            }
            if (totalGiftCertificate != currentBasket.totalGrossPrice.value) {
                var amount = (currentBasket.totalGrossPrice.value - totalGiftCertificate).toFixed(2);
                res.json({
                    form: paymentForm,
                    error: true,
                    insuficientBalance : true,
                    saldoPending: Resource.msgf('saldo.pending', 'checkout', null,amount)
                });
                return next();
            }
        }
        if (!PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor) {
            throw new Error(Resource.msg(
                'error.payment.processor.missing',
                'checkout',
                null
            ));
        }

        var paymentProcessor = PaymentManager.getPaymentMethod(paymentMethodIdValue).getPaymentProcessor();

        var paymentFormResult;
        if (HookManager.hasHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase())) {
            paymentFormResult = HookManager.callHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase(),
                'processForm',
                req,
                paymentForm,
                viewData
            );
        } else {
            paymentFormResult = HookManager.callHook('app.payment.form.processor.default_form_processor', 'processForm');
        }

        if (paymentFormResult.error && paymentFormResult.fieldErrors) {
            formFieldErrors.push(paymentFormResult.fieldErrors);
        }

        if (formFieldErrors.length || paymentFormResult.serverErrors) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: paymentFormResult.serverErrors ? paymentFormResult.serverErrors : [],
                error: true
            });
            return next();
        }

        res.setViewData(paymentFormResult.viewData);

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var BasketMgr = require('dw/order/BasketMgr');
            var HookMgr = require('dw/system/HookMgr');
            var PaymentMgr = require('dw/order/PaymentMgr');
            var Transaction = require('dw/system/Transaction');
            var AccountModel = require('*/cartridge/models/account');
            var OrderModel = require('*/cartridge/models/order');
            var URLUtils = require('dw/web/URLUtils');
            var Locale = require('dw/util/Locale');
            var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
            var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

            var currentBasket = BasketMgr.getCurrentBasket();

            var billingData = res.getViewData();

            if (!currentBasket) {
                delete billingData.paymentInformation;

                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show').toString()
                });
                return;
            }

            var validatedProducts = validationHelpers.validateProducts(currentBasket);
            if (validatedProducts.error) {
                delete billingData.paymentInformation;

                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show').toString()
                });
                return;
            }

            var billingAddress = currentBasket.billingAddress;
            var billingForm = server.forms.getForm('billing');
            var paymentMethodID = billingData.paymentMethod.value;
            var result;

            billingForm.creditCardFields.cardNumber.htmlValue = '';
            billingForm.creditCardFields.securityCode.htmlValue = '';

            // if there is no selected payment option and balance is greater than zero
            if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
                var noPaymentMethod = {};

                noPaymentMethod[billingData.paymentMethod.htmlName] =
                    Resource.msg('error.no.selected.payment.method', 'payment', null);

                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: [noPaymentMethod],
                    serverErrors: [],
                    error: true
                });
                return;
            }

            var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();

            // check to make sure there is a payment processor
            if (!processor) {
                throw new Error(Resource.msg(
                    'error.payment.processor.missing',
                    'checkout',
                    null
                ));
            }

            // Check to make sure there is a shipping address
            if (currentBasket.defaultShipment.shippingAddress === null) {
                res.json({
                    error: true,
                    errorStage: {
                        stage: 'shipping',
                        step: 'address'
                    },
                    errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }

            COHelpers.copyBillingAddressToBasket(
                currentBasket.defaultShipment.shippingAddress, currentBasket);
        
            // Check to make sure billing address exists
            if (!currentBasket.billingAddress) {
                res.json({
                    error: true,
                    errorStage: {
                        stage: 'payment',
                        step: 'billingAddress'
                    },
                    errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
                });
                this.emit('route:Complete', req, res);
                return;
            } 

            if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                    'Handle',
                    currentBasket,
                    billingData.paymentInformation,
                    paymentMethodID,
                    req
                );
            } else {
                result = HookMgr.callHook('app.payment.processor.default', 'Handle');
            }

            // need to invalidate credit card fields
            if (result.error) {
                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: result.fieldErrors,
                    serverErrors: result.serverErrors,
                    error: true
                });
                return;
            }

            if (HookMgr.hasHook('app.payment.form.processor.' + processor.ID.toLowerCase())) {
                HookMgr.callHook('app.payment.form.processor.' + processor.ID.toLowerCase(),
                    'savePaymentInformation',
                    req,
                    currentBasket,
                    billingData
                );
            } else {
                HookMgr.callHook('app.payment.form.processor.default', 'savePaymentInformation');
            }

            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            // Re-calculate the payments.
            var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
                currentBasket
            );

            if (calculatedPaymentTransaction.error) {
                res.json({
                    form: paymentForm,
                    fieldErrors: [],
                    serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                    error: true
                });
                return;
            }

            var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
            if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                usingMultiShipping = false;
            }

            hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, currentBasket.customerEmail], function () {});

            var currentLocale = Locale.getLocale(req.locale.id);

            var basketModel = new OrderModel(
                currentBasket,
                { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
            );

            var accountModel = new AccountModel(req.currentCustomer);
            var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
                req,
                accountModel
            );

            delete billingData.paymentInformation;

            if (req.session.privacyCache.get('fraudDetectionStatus')) {
                res.json({
                    error: true,
                    cartError: true,
                    redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
        
                return next();
            }
        
            var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
            if (validationOrderStatus.error) {
                res.json({
                    error: true,
                    errorMessage: validationOrderStatus.message
                });
                return next();
            }
        
            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        
            // Re-validates existing payment instruments
            var validPayment = COHelpers.validatePayment(req, currentBasket);
            if (validPayment.error) {
                res.json({
                    error: true,
                    errorStage: {
                        stage: 'payment',
                        step: 'paymentInstrument'
                    },
                    errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
                });
                return next();
            }
        
            // Re-calculate the payments.
            var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
            if (calculatedPaymentTransactionTotal.error) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }
        
            // Creates a new order.
            var order = COHelpers.createOrder(currentBasket);
            if (!order) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                next();
            }
        
            // Handles payment authorization
            var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
        
            // Handle custom processing post authorization
            var options = {
                req: req,
                res: res
            };
            var postAuthCustomizations = hooksHelper('app.post.auth', 'postAuthorization', handlePaymentResult, order, options, require('*/cartridge/scripts/hooks/postAuthorizationHandling').postAuthorization);
            if (postAuthCustomizations && Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')) {
                res.json(postAuthCustomizations);
                next();
            }
        
            if (handlePaymentResult.error) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
        
            var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
            if (fraudDetectionStatus.status === 'fail') {
                Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        
                // fraud detection failed
                req.session.privacyCache.set('fraudDetectionStatus', true);
        
                res.json({
                    error: true,
                    cartError: true,
                    redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
        
                return next();
            }
        
            // Places the order
            var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrderResult.error) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }
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
            if (req.currentCustomer.addressBook) {
                // save all used shipping addresses to address book of the logged in customer
                var allAddresses = addressHelpers.gatherShippingAddresses(order);
                allAddresses.forEach(function (address) {
                    if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                        var orderAddressObj = orderAddressCustom;
                        address.orderAddressObj = orderAddressObj;
                        addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
                    }
                });
            }
        
            if (order.getCustomerEmail()) {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
            }
        
            // Reset usingMultiShip after successful Order placement
            req.session.privacyCache.set('usingMultiShipping', false);
            
            //referidos
            if (session.customer.isAuthenticated()) {
                var cuponReferidos = false;
                var cuponAhijado = false;
                var collections = require('*/cartridge/scripts/util/collections');
                var couponLineItem;
              
                couponLineItem = collections.find(currentBasket.couponLineItems, function (item) {
                    if (item && item.couponCode && (item.couponCode == misReferidosHelpers.getCouponCodeMisReferidos() || item.couponCode == misReferidosHelpers.getCouponCodeMisReferidosAhijados())) {
                      for (var i = 0; i < currentBasket.priceAdjustments.length; i++) {
                        if (
                          currentBasket.priceAdjustments[i].couponLineItem &&
                          currentBasket.priceAdjustments[i].couponLineItem.applied &&
                          (currentBasket.priceAdjustments[i].couponLineItem.couponCode ==
                            misReferidosHelpers.getCouponCodeMisReferidos())
                        ) {
                          cuponReferidos = true;
                          break;
                        }
                        if (
                          currentBasket.priceAdjustments[i].couponLineItem &&
                          currentBasket.priceAdjustments[i].couponLineItem.applied &&
                          (currentBasket.priceAdjustments[i].couponLineItem.couponCode ==
                            misReferidosHelpers.getCouponCodeMisReferidosAhijados())
                        ) {
                          cuponAhijado = true;
                          break;
                        }
                      }
                    }
                  });
                    var customer = CustomerMgr.getCustomerByLogin(currentBasket.customerEmail);
                    if(!customer) {
                      customer = CustomerMgr.queryProfile('email = {0}', currentBasket.customerEmail);
                      customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo : '');
                    }
                    if (misReferidosHelpers.esCustomerAhijadoPrimerCompra(customer.profile) && !cuponReferidos) {
                      if (cuponAhijado) {
                        misReferidosHelpers.setFechaCanjeCuponAhijado(customer.profile, cuponReferidos);
                      }
                      misReferidosHelpers.assignCouponCodeCustomerPadrino(customer.profile);
                    } else if (misReferidosHelpers.esCustomerPadrinoPrimerCompra(customer.profile) && !cuponAhijado) {
                      if (cuponReferidos) {
                        misReferidosHelpers.changeStatusCouponPadrinoCuponCanjeado(customer.profile);
                      }
                    }
                  
                session.custom.removeCouponCart = false;
              } else {
                var collections = require('*/cartridge/scripts/util/collections');
                var couponLineItem;
                var cuponReferidos = false;
                var cuponAhijado = false;
              
                couponLineItem = collections.find(currentBasket.couponLineItems, function (item) {
                  if (item && item.couponCode && (item.couponCode == misReferidosHelpers.getCouponCodeMisReferidos() || item.couponCode == misReferidosHelpers.getCouponCodeMisReferidosAhijados())) {
                    for (var i = 0; i < currentBasket.priceAdjustments.length; i++) {
                      if (
                        currentBasket.priceAdjustments[i].couponLineItem &&
                        currentBasket.priceAdjustments[i].couponLineItem.applied &&
                        (currentBasket.priceAdjustments[i].couponLineItem.couponCode ==
                          misReferidosHelpers.getCouponCodeMisReferidos())
                      ) {
                        cuponReferidos = true;
                        break;
                      }
                      if (
                        currentBasket.priceAdjustments[i].couponLineItem &&
                        currentBasket.priceAdjustments[i].couponLineItem.applied &&
                        (currentBasket.priceAdjustments[i].couponLineItem.couponCode ==
                          misReferidosHelpers.getCouponCodeMisReferidosAhijados())
                      ) {
                        cuponAhijado = true;
                        break;
                      }
                    }
                  }
                });
                var customer = CustomerMgr.getCustomerByLogin(currentBasket.customerEmail);
                if(!customer) {
                  customer = CustomerMgr.queryProfile('email = {0}', currentBasket.customerEmail);
                  customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo : '');
                }
                if (misReferidosHelpers.esCustomerAhijadoPrimerCompra(customer.profile) && !cuponReferidos) {
                  if (cuponAhijado) {
                    misReferidosHelpers.setFechaCanjeCuponAhijado(customer.profile, cuponReferidos);
                  }
                  misReferidosHelpers.assignCouponCodeCustomerPadrino(customer.profile);
                } else if (misReferidosHelpers.esCustomerPadrinoPrimerCompra(customer.profile) && !cuponAhijado) {
                  if (cuponReferidos) {
                    misReferidosHelpers.changeStatusCouponPadrinoCuponCanjeado(customer.profile);
                  }
                }
                session.custom.removeCouponCart = false;
              }

            // social selling
            if (session.custom.SocialSelling) {
                var CustomObjectMgr = require('dw/object/CustomObjectMgr');
                var customObject = CustomObjectMgr.getCustomObject('socialSelling', session.custom.SocialSelling);
                // remove custom object
                Transaction.wrap(function () {
                    order.custom.isSocialSelling = true;
                    order.custom.socialSellingVendedor = customObject.custom.infVendedor;
                    CustomObjectMgr.remove(customObject);
                   
                })
            }

             // Cart Abandoned
      if (session.custom.isAbandoned) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var customObject = CustomObjectMgr.getCustomObject(
          'cartAbandoned',
          JSON.parse(session.custom.isAbandoned).uuid
        );
        // remove custom object
        Transaction.wrap(function () {
          CustomObjectMgr.remove(customObject);
          // order.custom.isSocialSelling = true;
        });
      }
        
            // TODO: Exposing a direct route to an Order, without at least encoding the orderID
            //  is a serious PII violation.  It enables looking up every customers orders, one at a
            //  time.
            res.json({
                error: false,
                orderID: order.orderNo,
                orderToken: order.orderToken,
                continueUrl: URLUtils.url('Order-Confirm').toString()
            });
        
        });

        return next();
    }
);

module.exports = server.exports();
