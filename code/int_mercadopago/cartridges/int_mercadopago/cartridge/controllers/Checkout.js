'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Populate viewData with additional data specific for MercadoPago
 */
server.append('Begin', function (req, res, next) {
  // Guard clause
  var MercadoPagoHelper = require('*/cartridge/scripts/helpers/MercadoPagoHelper');
  var isMercadoPagoEnabled = MercadoPagoHelper.isMercadoPagoEnabled();

  if (!isMercadoPagoEnabled) {
    return next();
  }

  var BasketMgr = require('dw/order/BasketMgr');

  var currentBasket = BasketMgr.getCurrentBasket();

  // Remove name attribute for card number and security code fields
  var form = server.forms.getForm('billing').mercadoPagoCreditCard;
  Object.keys(form).forEach(function (key) {
    if (key !== 'cardNumber' && key !== 'securityCode') {
      return;
    }

    Object.defineProperty(form[key], 'attributesWithoutName', {
      get: function () {
        // eslint-disable-next-line no-useless-escape
        return form[key].attributes.replace(
          /(name=\"){1}(\w)+(\"){1}(\s){1}/,
          ''
        );
      }
    });
  });

  var viewData = res.getViewData();

  if (req.currentCustomer.raw.authenticated && !viewData.order.orderEmail) {
    viewData.order.orderEmail = req.currentCustomer.profile.email;
  }

  var mpAvailablePaymentMethods =
    MercadoPagoHelper.getAvailablePaymentMethods();

  if (!mpAvailablePaymentMethods || !mpAvailablePaymentMethods.length > 0) {
    return next();
  }
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var customerCards;

  viewData.mercadoPago = {
    enable: isMercadoPagoEnabled,
    form: form,
    groupedPaymentMethods: MercadoPagoHelper.getGroupedPaymentMethods(),
    availablePaymentMethods: mpAvailablePaymentMethods,
    pseFinancialInstitutions: MercadoPagoHelper.getPseFinancialInstitutions(
      mpAvailablePaymentMethods
    ),
    customerCards:
      req.currentCustomer.raw.authenticated &&
      req.currentCustomer.raw.registered
        ? MercadoPagoHelper.getCustomerCards(req.currentCustomer)
        : [],
    preferences: MercadoPagoHelper.getPreferences(),
    errorMessages: MercadoPagoHelper.getErrorMessages(),
    resourceMessages: MercadoPagoHelper.getResourceMessages(),
    configuration: MercadoPagoHelper.getConfiguration(),
    orderTotal: currentBasket.totalGrossPrice.value
  };

  res.setViewData(viewData);
  
  return next();
});

server.get('getSavePayments', function (req, res, next) {
  // Guard clause
  var MercadoPagoHelper = require('*/cartridge/scripts/helpers/MercadoPagoHelper');
  var isMercadoPagoEnabled = MercadoPagoHelper.isMercadoPagoEnabled();
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var Template = require('dw/util/Template');
  var HashMap = require('dw/util/HashMap');
  var params = new HashMap();
  var customerCards = {};
  var mercadoPago = {};
  if (!isMercadoPagoEnabled) {
    return next();
  }

  var BasketMgr = require('dw/order/BasketMgr');

  var currentBasket = BasketMgr.getCurrentBasket();
  if (currentBasket && currentBasket.customerEmail && !session.customer.isAuthenticated()) {
    var user_temp = CustomerMgr.getCustomerByLogin(currentBasket.customerEmail);
    if (user_temp) {
      customerCards = MercadoPagoHelper.getCustomerCards(user_temp);
    }
    mercadoPago.customerCards = customerCards;
    
    params.put('mercadoPago',mercadoPago);
    if (customerCards && customerCards.length > 0) {
      session.custom.userHasSavePayment = true;
      session.custom.isUserGuess = currentBasket.customerEmail;
    }
    try {
        var savePaymentTemplate = new Template('/checkout/billing/mercadoPagoCustomerCards').render(params).text; 
    } catch (error) {
      res.json({error:true})
      return next()
    }
  
    res.json({htmlTemplate:savePaymentTemplate, customerCards: customerCards})
  } else {
    res.json({error:true})
    return next()
  }
 
  next();
})

module.exports = server.exports();
