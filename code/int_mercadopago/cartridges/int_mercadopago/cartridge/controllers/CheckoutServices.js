'use strict';

/* global session */

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

function getTotals(input) {
  var redond = Math.round(input);
  var num = redond;
  if (!isNaN(num)) {
      num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');
      num = num.split('').reverse().join('').replace(/^[\.]/, '');
      return num;
  }
}


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
    session.custom.hasCart = null;
    var viewData = { paymentInformation: { mercadoPago: null } };
    //  viewData = res.getViewData();
    var paymentForm = server.forms.getForm('billing');
    var customerNotRegisterForm = server.forms.getForm('customerNotRegisterForm');
    var shippingForm = server.forms.getForm('addressCustom');
    var identificateForm = server.forms.getForm('identificate');
    

    var mercadoPagoData = {
      cardType: {
        value: paymentForm.mercadoPagoCreditCard.cardType.value,
        htmlName: paymentForm.mercadoPagoCreditCard.cardType.htmlName
      },
      token: {
        value: paymentForm.mercadoPagoCreditCard.token.value,
        htmlName: paymentForm.mercadoPagoCreditCard.token.htmlName
      },
      identification: {
        docType: { value: paymentForm.mercadoPagoCreditCard.docType.value },
        docNumber: { value: paymentForm.mercadoPagoCreditCard.cedula.value }
      }
    };
    var paymentCedula;
    var AccountModel = require('*/cartridge/models/account');
    var accountModel = new AccountModel(req.currentCustomer);
    if (accountModel.registeredUser) {
      paymentCedula = accountModel.profile.documentoIdentidad;
    }
    if(paymentForm.mercadoPagoCreditCard.cedula.value) {
      paymentCedula = paymentForm.mercadoPagoCreditCard.cedula.value;
    }

    if(paymentForm.mercadoPagoCreditCard.apartment.value && 
      paymentForm.mercadoPagoCreditCard.city.value &&
      paymentForm.mercadoPagoCreditCard.via.value &&
      paymentForm.mercadoPagoCreditCard.n1.value){
         mercadoPagoData.otherAdress = {
          apartment: paymentForm.mercadoPagoCreditCard.apartment.value,
          city: paymentForm.mercadoPagoCreditCard.city.value,
          via: paymentForm.mercadoPagoCreditCard.via.value,
          n1: paymentForm.mercadoPagoCreditCard.n1.value,
          n2: paymentForm.mercadoPagoCreditCard.n2.value,
          n3: paymentForm.mercadoPagoCreditCard.n3.value,
          piso: paymentForm.mercadoPagoCreditCard.piso.value
         };
    }

    if (mercadoPagoData.cardType.value === 'pse') {
      mercadoPagoData.financialinstitution =
        paymentForm.mercadoPagoCreditCard.financialinstitution.value;
      session.custom.financial_institution = '';
      session.custom.financial_institution =
        paymentForm.mercadoPagoCreditCard.financialinstitution.value;
    }

    mercadoPagoData.paymentTypeId =
      paymentForm.mercadoPagoCreditCard.paymentTypeId.value;

    viewData.paymentInformation.mercadoPago = mercadoPagoData;
    // viewData.paymentInformation.mercadoPago.cardType.value = 'efecty';
    viewData.mercadoPago = {
      email: { value: paymentForm.mercadoPagoCreditCard.email.value },
      phone: { value: paymentForm.mercadoPagoCreditCard.phone.value }
    };

    // verify billing form data
    var billingFormErrors = COHelpers.validateBillingForm(
      paymentForm.addressFields
    );
    var contactInfoFormErrors = COHelpers.validateFields(
      paymentForm.contactInfoFields
    );

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

      if (
        Object.prototype.hasOwnProperty.call(
          paymentForm.addressFields,
          'states'
        )
      ) {
        viewData.address.stateCode = {
          value: paymentForm.addressFields.states.stateCode.value
        };
      }
    }

    if (Object.keys(contactInfoFormErrors).length) {
      formFieldErrors.push(contactInfoFormErrors);
    } else {
      viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
    }
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentMethodIdValue = paymentForm.paymentMethod.value;
    if (paymentMethodIdValue == 'GIFT_CERTIFICATE') {
      var BasketMgr = require('dw/order/BasketMgr');
      var currentBasket = BasketMgr.getCurrentBasket();
      var totalGiftCertificate = 0, totalGiftCertificate2= 0;
      for (var key in currentBasket.giftCertificatePaymentInstruments) {
        if (
          currentBasket.giftCertificatePaymentInstruments[key]
            .paymentTransaction
        ) {
          totalGiftCertificate +=
            currentBasket.giftCertificatePaymentInstruments[key]
              .paymentTransaction.amount.value;
              totalGiftCertificate2 = totalGiftCertificate2+ currentBasket.giftCertificatePaymentInstruments[key].paymentTransaction.amount.value;
        }
      }
      if (totalGiftCertificate < currentBasket.totalGrossPrice.value) {
          if (totalGiftCertificate != currentBasket.totalGrossPrice.value) {
            var amount = (
              currentBasket.totalGrossPrice.value - totalGiftCertificate
            ).toFixed();
            res.json({
              form: paymentForm,
              error: true,
              insuficientBalance: true,
              saldoPending: Resource.msgf(
                'saldo.pending',
                'checkout',
                null,
                getTotals(amount)
              )
            });
            return next();
          }
      }
    }
    // remove information forms
    customerNotRegisterForm.clear();
    identificateForm.clear();
    shippingForm.clear();
    
    if (
      !PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor
    ) {
      throw new Error(
        Resource.msg('error.payment.processor.missing', 'checkout', null)
      );
    }

    var paymentProcessor =
      PaymentManager.getPaymentMethod(
        paymentMethodIdValue
      ).getPaymentProcessor();

    var paymentFormResult;
    if (
      HookManager.hasHook(
        'app.payment.form.processor.' + paymentProcessor.ID.toLowerCase()
      )
    ) {
      paymentFormResult = HookManager.callHook(
        'app.payment.form.processor.' + paymentProcessor.ID.toLowerCase(),
        'processForm',
        req,
        paymentForm,
        viewData
      );
    } else {
      paymentFormResult = HookManager.callHook(
        'app.payment.form.processor.default_form_processor',
        'processForm'
      );
    }
    paymentFormResult.viewData.paymentInformation = mercadoPagoData;

    if (paymentFormResult.error && paymentFormResult.fieldErrors) {
      formFieldErrors.push(paymentFormResult.fieldErrors);
    }

    if (formFieldErrors.length || paymentFormResult.serverErrors) {
      // respond with form data and errors
      res.json({
        form: paymentForm,
        fieldErrors: formFieldErrors,
        serverErrors: paymentFormResult.serverErrors
          ? paymentFormResult.serverErrors
          : [],
        error: true
      });
      return next();
    }
    session.custom.direccionComplete = false;
    res.setViewData(paymentFormResult.viewData);

    this.on('route:BeforeComplete', function (req, res) {
      // eslint-disable-line no-shadow
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
      var CustomerMgr = require('dw/customer/CustomerMgr');
      var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');

      var currentBasket = BasketMgr.getCurrentBasket();

      var billingData = res.getViewData();

      var accountModel = new AccountModel(req.currentCustomer);

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

        noPaymentMethod[billingData.paymentMethod.htmlName] = Resource.msg(
          'error.no.selected.payment.method',
          'payment',
          null
        );

        delete billingData.paymentInformation;

        res.json({
          form: billingForm,
          fieldErrors: [noPaymentMethod],
          serverErrors: [],
          error: true
        });
        return;
      }

      var processor =
        PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();

      // check to make sure there is a payment processor
      if (!processor) {
        throw new Error(
          Resource.msg('error.payment.processor.missing', 'checkout', null)
        );
      }

      // Check to make sure there is a shipping address
      if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
          error: true,
          errorStage: {
            stage: 'shipping',
            step: 'address'
          },
          errorMessage: Resource.msg(
            'error.no.shipping.address',
            'checkout',
            null
          )
        });
        this.emit('route:Complete', req, res);
        return;
      }

      COHelpers.copyBillingAddressToBasket(
        currentBasket.defaultShipment.shippingAddress,
        currentBasket
      );
      if (req.currentCustomer.raw.authenticated) {
          Transaction.wrap(function () {
              currentBasket.billingAddress.custom.cedulaCiudadana = paymentCedula;
          })
      }
      // billing address filled in payment section
      if ('otherAdress' in billingData.paymentInformation && billingData.paymentInformation.otherAdress.apartment) {
        var newBillingAddress = billingData.paymentInformation.otherAdress;
        Transaction.wrap(function () {
          currentBasket.billingAddress.custom.departamento = newBillingAddress.apartment;
          currentBasket.billingAddress.custom.municipio = newBillingAddress.city;
          currentBasket.billingAddress.custom.tipo_de_via = newBillingAddress.via;
          currentBasket.billingAddress.custom.street = newBillingAddress.n1;
          currentBasket.billingAddress.custom.numberStreet = newBillingAddress.n2
          currentBasket.billingAddress.custom.numberStreetExtra = newBillingAddress.n3;
          currentBasket.billingAddress.custom.piso_o_apartamento = newBillingAddress.piso;
          currentBasket.billingAddress.city = newBillingAddress.city;
          currentBasket.billingAddress.address2 = newBillingAddress.via + ' ' + newBillingAddress.n1 + '#' + newBillingAddress.n2 + '- ' + newBillingAddress.n3;
          currentBasket.billingAddress.stateCode = newBillingAddress.apartment;
        })
      }

      // Check to make sure billing address exists
      if (!currentBasket.billingAddress) {
        res.json({
          error: true,
          errorStage: {
            stage: 'payment',
            step: 'billingAddress'
          },
          errorMessage: Resource.msg(
            'error.no.billing.address',
            'checkout',
            null
          )
        });
        this.emit('route:Complete', req, res);
        return;
      }

      if (
        HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())
      ) {

        var cc;
        if(paymentCedula){
          cc = paymentCedula;
        }
        result = HookMgr.callHook( 
          'app.payment.processor.' + processor.ID.toLowerCase(),
          'Handle',
          currentBasket,
          billingData.paymentInformation,
          cc,
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
          errorMessage: result.errorMessage,
          serverErrors: result.serverErrors,
          error: true
        });
        return;
      }

      if (
        HookMgr.hasHook(
          'app.payment.form.processor.' + processor.ID.toLowerCase()
        )
      ) {
        HookMgr.callHook(
          'app.payment.form.processor.' + processor.ID.toLowerCase(),
          'savePaymentInformation',
          req,
          currentBasket,
          billingData
        );
      } else {
        HookMgr.callHook(
          'app.payment.form.processor.default',
          'savePaymentInformation'
        );
      }

      // Calculate the basket
      Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
      });

      // Re-calculate the payments.
      var calculatedPaymentTransaction =
        COHelpers.calculatePaymentTransaction(currentBasket);

      if (calculatedPaymentTransaction.error) {
        res.json({
          form: paymentForm,
          fieldErrors: [],
          serverErrors: [Resource.msg('error.technical', 'checkout', null)],
          error: true
        });
        return;
      }

      var usingMultiShipping =
        req.session.privacyCache.get('usingMultiShipping');
      if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
      }

      hooksHelper(
        'app.customer.subscription',
        'subscribeTo',
        [paymentForm.subscribe.checked, currentBasket.customerEmail],
        function () {}
      );

      var currentLocale = Locale.getLocale(req.locale.id);

      var basketModel = new OrderModel(currentBasket, {
        usingMultiShipping: usingMultiShipping,
        countryCode: currentLocale.country,
        containerView: 'basket'
      });


      var renderedStoredPaymentInstrument =
        COHelpers.getRenderedPaymentInstruments(req, accountModel);

      if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
          error: true,
          cartError: true,
          redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
          errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
      }

      var validationOrderStatus = hooksHelper(
        'app.validate.order',
        'validateOrder',
        currentBasket,
        require('*/cartridge/scripts/hooks/validateOrder').validateOrder
      );
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
          errorMessage: Resource.msg(
            'error.payment.not.valid',
            'checkout',
            null
          )
        });
        return next();
      }

      // Re-calculate the payments.
      var calculatedPaymentTransactionTotal =
        COHelpers.calculatePaymentTransaction(currentBasket);
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

        // add payment codes
       var helperPaymentCode = require('*/cartridge/scripts/helpers/helperPaymentCode.js');
       helperPaymentCode.savePaymentCode(billingData, order);

      delete billingData.paymentInformation;
      var otherAdress;
      if(viewData.paymentInformation.otherAdress){
        otherAdress = viewData.paymentInformation.otherAdress;
      }
      // Handles payment authorization
      var cedc;
      if (paymentCedula){
        cedc = paymentCedula;
      }
      var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo, otherAdress, cedc);

      // Handle custom processing post authorization
      var options = {
        req: req,
        res: res
      };
      var postAuthCustomizations = hooksHelper(
        'app.post.auth',
        'postAuthorization',
        handlePaymentResult,
        order,
        options,
        require('*/cartridge/scripts/hooks/postAuthorizationHandling')
          .postAuthorization
      );
      if (
        postAuthCustomizations &&
        Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')
      ) {
        res.json(postAuthCustomizations);
        next();
      }
      if (handlePaymentResult.error && session.privacy.redirectURL) {
        // If redirectURL stored in session, send it via JSON to redirect User to MercadoPago payment page
        let Resource = require('dw/web/Resource');
        if (session.privacy.redirectURL) {
          // run fraud detection first
          let OrderMgr = require('dw/order/OrderMgr');
          let Transaction = require('dw/system/Transaction');
          let URLUtils = require('dw/web/URLUtils');
          let hooksHelper = require('*/cartridge/scripts/helpers/hooks');
          let order = OrderMgr.getOrder(session.privacy.orderNumber);
          let fraudDetectionStatus2 = hooksHelper(
            'app.fraud.detection',
            'fraudDetection',
            order,
            require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection
          );
          if (fraudDetectionStatus2.status === 'fail') {
            Transaction.wrap(function () {
              OrderMgr.failOrder(order, true);
            });
    
            // fraud detection failed
            req.session.privacyCache.set('fraudDetectionStatus', true);
    
            res.json({
              error: true,
              cartError: true,
              redirectUrl: URLUtils.url(
                'Error-ErrorCode',
                'err',
                fraudDetectionStatus2.errorCode
              ).toString(),
              errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
    
            return next();
          }
          // If fraud detection passed sucessfully redirect shopper to MercadoPago
          var continueUrl = session.privacy.redirectURL;
          delete viewData.error;
          delete viewData.errorMessage;
          res.json({ redirectUrl: continueUrl, 
                    continueUrl: continueUrl,
                    payment_type_id: session.privacy.payment_type_id });
          //res.redirect(continueUrl);
           return;
          
        }
        res.setViewData(viewData);
      }
      if (handlePaymentResult.error && session.privacy.status_detail) {
        // If there is additional error info from MercadoPago add it to error JSON
        viewData.status_detail = session.privacy.status_detail;
        if (session.privacy.resetMpToken) {
          viewData.resetMpToken = session.privacy.resetMpToken;
        }
        // If MercadoPago token must be reset add it to error JSON
        if (session.privacy.detailedError) {
          viewData.detailedError = session.privacy.detailedError;
        }
        if (session.privacy.status_detail) {
          viewData.errorMessage = Resource.msg(
            'response.' + session.privacy.status_detail,
            'mercadoPago',
            null
          );
        }
        res.json({
          error: true,
          errorMessage: Resource.msg(
            'response.' + session.privacy.status_detail,
            'mercadoPago',
            null
          ),
          detailedError: session.privacy.detailedError,
          resetMpToken: session.privacy.resetMpToken
        });
            return;
      }
      if (handlePaymentResult.error) {
        res.json({
          error: true,
          errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
      }

      var fraudDetectionStatus = hooksHelper(
        'app.fraud.detection',
        'fraudDetection',
        currentBasket,
        require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection
      );
      if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order, true);
        });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
          error: true,
          cartError: true,
          redirectUrl: URLUtils.url(
            'Error-ErrorCode',
            'err',
            fraudDetectionStatus.errorCode
          ).toString(),
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
          if (
            !addressHelpers.checkIfAddressStored(
              address,
              req.currentCustomer.addressBook.addresses
            )
          ) {
            var orderAddressObj = orderAddressCustom;
            address.orderAddressObj = orderAddressObj;
            addressHelpers.saveAddress(
              address,
              req.currentCustomer ? req.currentCustomer : customer_temp,
              order.shipments[0].shippingAddress.custom.aliasDireccion
            );
          }
        });
      }
       // Check if the user already is register
      var customer_temp = CustomerMgr.getCustomerByLogin(order.getCustomerEmail()) ?  CustomerMgr.getCustomerByLogin(order.getCustomerEmail()) : null;
      if (!customer_temp) {
        customer_temp = CustomerMgr.queryProfile('email = {0}', order.getCustomerEmail());
        customer_temp = CustomerMgr.getCustomerByCustomerNumber(customer_temp ? customer_temp.customerNo: '');
      }
      if (customer_temp && customer_temp.addressBook && !session.customer.isAuthenticated()) {
        // save all used shipping addresses to address book of the logged in customer
        var userNotLogin = true;
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
          if (
            !addressHelpers.checkIfAddressStored(
              address,
              customer_temp.addressBook.addresses
            )
          ) {
            var orderAddressObj = orderAddressCustom;
            address.orderAddressObj = orderAddressObj;
            addressHelpers.saveAddress(
              address,
              customer_temp,
              order.shipments[0].shippingAddress.custom.aliasDireccion,
              userNotLogin
            );
          }
        });
      }

      if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
      }

      // Reset usingMultiShip after successful Order placement
      req.session.privacyCache.set('usingMultiShipping', false);

      // referidos
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
        if (customer && customer.profile && misReferidosHelpers.esCustomerAhijadoPrimerCompra(customer.profile) && !cuponReferidos) {
          if (cuponAhijado) {
            misReferidosHelpers.setFechaCanjeCuponAhijado(customer.profile, cuponReferidos);
          }
          misReferidosHelpers.assignCouponCodeCustomerPadrino(customer.profile);
        } else if (customer && misReferidosHelpers.esCustomerPadrinoPrimerCompra(customer.profile) && !cuponAhijado) {
          if (cuponReferidos) {
            misReferidosHelpers.changeStatusCouponPadrinoCuponCanjeado(customer.profile);
          }
        }
        session.custom.removeCouponCart = false;
      }
      // social selling
      if (session.custom.SocialSelling) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var customObject = CustomObjectMgr.getCustomObject(
          'socialSelling',
          session.custom.SocialSelling
        );
        // remove custom object
        Transaction.wrap(function () {
          CustomObjectMgr.remove(customObject);
          order.custom.isSocialSelling = true;
        });
      }

      // session variable to Hide or Show payment methods when giftCard amount is complete
      session.custom.giftComplete = false;

      // Cart Abandoned
      if (session.custom.isAbandoned) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var customObject = CustomObjectMgr.getCustomObject(
          'cartAbandoned',
          JSON.parse(session.custom.isAbandoned).uuid
        );
        if (customObject) {
             // remove custom object
            Transaction.wrap(function () {
              CustomObjectMgr.remove(customObject);
            });
        } else {
            session.custom.isAbandoned= null;
        }
       
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

server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
  var viewData = res.getViewData();
  // if error status was set in checkoutHelpers, check whether it was a redirect or a real error with additional info and\or reset token directive
  if (viewData.error) {
    // If redirectURL stored in session, send it via JSON to redirect User to MercadoPago payment page
    var Resource = require('dw/web/Resource');
    if (session.privacy.redirectURL) {
      // run fraud detection first
      var OrderMgr = require('dw/order/OrderMgr');
      var Transaction = require('dw/system/Transaction');
      var URLUtils = require('dw/web/URLUtils');
      var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
      var order = OrderMgr.getOrder(session.privacy.orderNumber);
      var fraudDetectionStatus = hooksHelper(
        'app.fraud.detection',
        'fraudDetection',
        order,
        require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection
      );
      if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order, true);
        });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
          error: true,
          cartError: true,
          redirectUrl: URLUtils.url(
            'Error-ErrorCode',
            'err',
            fraudDetectionStatus.errorCode
          ).toString(),
          errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
      }
      // If fraud detection passed sucessfully redirect shopper to MercadoPago
      viewData.continueUrl = session.privacy.redirectURL;
      delete viewData.error;
      delete viewData.errorMessage;
      res.setViewData(viewData);
      return next();
    }
    // If there is additional error info from MercadoPago add it to error JSON
    viewData.status_detail = session.privacy.status_detail;
    if (session.privacy.resetMpToken) {
      viewData.resetMpToken = session.privacy.resetMpToken;
    }
    // If MercadoPago token must be reset add it to error JSON
    if (session.privacy.detailedError) {
      viewData.detailedError = session.privacy.detailedError;
    }
    if (session.privacy.status_detail) {
      viewData.errorMessage = Resource.msg(
        'response.' + session.privacy.status_detail,
        'mercadoPago',
        null
      );
    }
    res.setViewData(viewData);
  }

  return next();
});

module.exports = server.exports();
