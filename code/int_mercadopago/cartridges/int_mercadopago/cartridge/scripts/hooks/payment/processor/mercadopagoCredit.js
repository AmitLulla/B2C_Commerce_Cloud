'use strict';

/* global customer empty session */
/* eslint-disable no-param-reassign */

var collections = require('*/cartridge/scripts/util/collections');
var array = require('*/cartridge/scripts/util/array');
var MercadoPago = require('*/cartridge/scripts/library/libMercadoPago');

var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * @description Create payment instrument
 * @param {dw.order.Basket} basket Current basket
 * @param {Object} paymentInformation - the payment information
 * @returns {Object} - Object containing error description
 */
function Handle(basket, paymentInformation, cc) {
  var serverErrors = [];
  var errorMessage = [];
  var currentBasket = basket;
  
  if (!paymentInformation.cardType.value) { 
    errorMessage.push(Resource.msg('payment.error', 'mercadoPagoPreferences', null));
    return { fieldErrors: {}, serverErrors: serverErrors, errorMessage: errorMessage, error: true };
  }
  var paymentTypeId = paymentInformation.paymentTypeId;
  var cardType = paymentInformation.cardType.value;
  var creditCardToken = paymentInformation ? paymentInformation.token.value:null;
  var docType = 'CC';
  var docNumber;

  if (cc === 'undefined') {
    docNumber = basket.billingAddress.custom.cedulaCiudadana;
  } else {
    docNumber = cc;
  }
  var MP = new MercadoPago();

  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      if (!item.giftCertificateCode) {
        currentBasket.removePaymentInstrument(item);
      }
    });

    var amount = MP.getTotalAmount(currentBasket);
    var paymentInstrument = currentBasket.createPaymentInstrument(
      Resource.msg('payment.method.id', 'mercadoPagoPreferences', null),
      amount
    );

    /**
     * Credit card data isn't saved
     * It's saved on MercadoPago side
     * Instead token is obtained
     */
    paymentInstrument.setCreditCardType(cardType); // Required always
    if (creditCardToken && paymentInstrument.setCreditCardToken) {
      paymentInstrument.setCreditCardToken(creditCardToken); // Required only for credit card payments
    }

    if (docType && docNumber) {
      paymentInstrument.custom.customerDocType = docType;
      paymentInstrument.custom.customerDocNumber = docNumber;
    }
    if (cardType === 'pse') {
      paymentInstrument.custom.mercadoPagoFinancialInstitution =
        paymentInformation.financialinstitution;
    }

    paymentInstrument.custom.mercadoPagoPaymentTypeId = paymentTypeId;
  });

  return { fieldErrors: {}, serverErrors: serverErrors, errorMessage: errorMessage, error: false };
}

/**
 * @description Create payment data and make call to API
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @returns {Object} - Object containing errors or redirect token and URL
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor, otherAdress, cc) {
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var order = OrderMgr.getOrder(orderNumber);
  var MP = new MercadoPago();
  var creditCardForm = session.forms.billing;
  var serverErrors = [];
  var error = false;
  var resetToken = false;

  // Default values
  var installments = 1;
  var issuerId = 0;
  var redirectURL = null;
  var redirectPaymentMethod = false;
  var detailedError = null;

  var customerSearch;
  var customerResult;
  var newCustomer;
  var customerID = '';

  var cardData = '';
  var parsedResponse;
  var saveCard = creditCardForm.mercadoPagoCreditCard.saveCard.value;

  // Set installment option
  if (creditCardForm.mercadoPagoCreditCard.installments.value) {
    installments = parseInt(
      creditCardForm.mercadoPagoCreditCard.installments.value,
      10
    );
  }

  // Set issuer option
  if (creditCardForm.mercadoPagoCreditCard.issuer.value) {
    issuerId = parseInt(creditCardForm.mercadoPagoCreditCard.issuer.value, 10);
  }

  // Get customer ID
  if (customer.authenticated && customer.registered) {
    customerSearch = MP.searchCustomer({ email: customer.profile.email });
    if (customerSearch) {
      customerResult = array.find(customerSearch.results, function (result) {
        return result.email === customer.profile.email;
      });
    }

    customerID = customerResult ? customerResult.id : '';
    if (!customerID) {
      newCustomer = MP.createCustomer({ email: customer.profile.email });
      customerID = newCustomer ? newCustomer.id : '';
    }
  }
  
  if (!customer.authenticated && session.custom.isUserGuess) {
    customerSearch = MP.searchCustomer({ email: session.custom.isUserGuess });
    if (customerSearch) {
      customerResult = array.find(customerSearch.results, function (result) {
        return result.email === session.custom.isUserGuess;
      });
    }

    customerID = customerResult ? customerResult.id : '';
    if (!customerID) {
      newCustomer = MP.createCustomer({ email: customer.profile.email });
      customerID = newCustomer ? newCustomer.id : '';
    }
  }
  session.custom.isUserGuess = null;
  session.custom.userHasSavePayment = null;
  try {
    // Create payment data
    var paymentData = MP.createPaymentData(
      order,
      customer,
      installments,
      issuerId,
      customerID,
      otherAdress,
      cc
    );

    // Do payment request
    var paymentResponse = MP.createPayment(paymentData);

    Transaction.wrap(function () {
      if (paymentData) {
        order.addNote(
          'MercadoPago Request',
          JSON.stringify(paymentData)
        );
      }
      paymentInstrument.paymentTransaction.setPaymentProcessor(
        paymentProcessor
      );

      if (paymentInstrument.creditCardType) {
        cardData = paymentInstrument.creditCardType;
      }

      if (cardData) {
        paymentInstrument.paymentTransaction.custom.cardType = cardData;
      }

      if (paymentResponse && paymentResponse.status) {
        parsedResponse = MP.parseOrderStatus(paymentResponse.status,paymentResponse.payment_method_id);
        redirectPaymentMethod =
          paymentResponse.payment_type_id === 'ticket' ||
          paymentResponse.payment_type_id === 'bank_transfer';

        var isValidPaymentStatus =
          parsedResponse === 'authorized' || parsedResponse === 'pending';

        error = empty(parsedResponse) || !isValidPaymentStatus;

        // If response is successful, create customer card based on the token
        var customer_temp = CustomerMgr.getCustomerByLogin(order.customerEmail);
        if (
          customer.authenticated ||
          customer_temp &&
          parsedResponse === 'authorized' &&
          saveCard
        ) {
          MP.createCustomerCard(customerID, {
            token: paymentInstrument.creditCardToken
          });
        }

        // Updates transaction statuses to be seen in BM
        order.custom.transactionStatus =
          paymentResponse.status +
          ' - ' +
          Resource.msg('status.' + paymentResponse.status, 'mercadoPago', null);
        order.custom.transactionReport = paymentResponse.status_detail;

        // Set transaction id
        if (paymentResponse.id) {
          paymentInstrument.paymentTransaction.transactionID =
            paymentResponse.id;

          if (paymentResponse.transaction_details.external_resource_url) {
            order.custom.transactionNote =
              paymentResponse.transaction_details.external_resource_url;
            // send mail notification external resource payment
            //   var MercadoPagoHelper = require("*/cartridge/scripts/helpers/MercadoPagoHelper");
            // MercadoPagoHelper.sendEmailPayment(paymentResponse, paymentData.payer.email);
          }
        }

        // Set order payment status to paid if order is authorized
        if (parsedResponse === 'authorized') {
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        } else if (parsedResponse === 'declined') {
          order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
          resetToken = true;
          error = true;
          serverErrors.push(paymentResponse.status_detail);
          // serverErrors.push(Resource.msg('error.technical', 'checkout', null));
        } else {
          // can be pending-payment or transfer depending on payment option chosen
          order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        }
        if (parsedResponse && paymentResponse.status_detail) {
          order.addNote(
            'MercadoPago response',
            parsedResponse + ' - ' + paymentResponse.status_detail
          );
        }
      } else {
        try {
          var mpError = JSON.parse(session.privacy.mercadoPagoErrorMessage);
          if (
            mpError &&
            mpError.cause &&
            mpError.cause[0] &&
            mpError.cause[0].code
          ) {
            detailedError = mpError.cause[0].code.toString();
          }
        } catch (ex) {
          // do nothing
        } finally {
          delete session.privacy.mercadoPagoErrorMessage;
        }
        error = true;
        resetToken = true;
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
      }
    });
  } catch (e) {
    error = true;
    serverErrors.push(Resource.msg('error.technical', 'checkout', null));
  }

  if (redirectPaymentMethod && MP.getOtherPaymentMode() === 'Redirect' && paymentResponse.payment_type_id === 'bank_transfer') {
    redirectURL = order.custom.transactionNote;
  }

  return {
    serverErrors: serverErrors,
    error: error,
    redirectURL: redirectURL,
    resetMpToken: resetToken,
    detailedError: detailedError,
    payment_type_id: paymentResponse.payment_type_id,
    installmentsData: {
      'installments': paymentResponse.installments,
      'installment_amount':
        paymentResponse.transaction_details.installment_amount
    }
  };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
