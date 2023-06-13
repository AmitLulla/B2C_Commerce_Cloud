'use strict';

/* global session */

var base = module.superModule;

var HookMgr = require('dw/system/HookMgr');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber, otherAdress, cc) {
  var result = {};

  if (order.totalNetPrice !== 0.0) {
    var paymentInstruments = order.paymentInstruments;

    if (paymentInstruments.length === 0) {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      result.error = true;
    }

    if (!result.error) {
      for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];
        var paymentProcessor = PaymentMgr.getPaymentMethod(
          paymentInstrument.paymentMethod
        ).paymentProcessor;
        var authorizationResult;
        if (paymentProcessor === null) {
          Transaction.begin();
          paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
          Transaction.commit();
        } else {
          if (
            HookMgr.hasHook(
              'app.payment.processor.' + paymentProcessor.ID.toLowerCase()
            )
          ) {
            authorizationResult = HookMgr.callHook(
              'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
              'Authorize',
              orderNumber,
              paymentInstrument,
              paymentProcessor,
              otherAdress,
              cc
            );
          } else {
            authorizationResult = HookMgr.callHook(
              'app.payment.processor.default',
              'Authorize'
            );
          }

          // Clean up previous session
          delete session.privacy.redirectURL;
          delete session.privacy.resetMpToken;
          delete session.privacy.detailedError;
          delete session.privacy.orderNumber;
          delete session.privacy.status_detail;
          delete session.privacy.payment_type_id;
          delete session.privacy.installments;
          delete session.privacy.installment_amount;

          if (authorizationResult.redirectURL) {
            session.privacy.redirectURL = authorizationResult.redirectURL;
            session.privacy.orderNumber = orderNumber;
            session.privacy.payment_type_id = authorizationResult.payment_type_id;
            result.error = true;
            break;
          }

          if (authorizationResult.resetMpToken) {
            session.privacy.resetMpToken = authorizationResult.resetMpToken;
          }

          if (authorizationResult.installmentsData) {
            if (authorizationResult.installmentsData.installments > 1) {
              session.privacy.installments = authorizationResult.installmentsData.installments;
              session.privacy.installment_amount = authorizationResult.installmentsData.installment_amount;
            }
          }

          if (authorizationResult.detailedError) {
            session.privacy.detailedError = authorizationResult.detailedError;
          }

          if (authorizationResult.error) {
            Transaction.wrap(function () {
              OrderMgr.failOrder(order, true);
            });
            session.privacy.status_detail = authorizationResult.serverErrors[0];
            result.error = true;
            break;
          }
        }
      }
    }
  }

  return result;
}

function validateCreditCard(form) {
  if (form.mercadoPagoCreditCard.cardType === 'pse') {
    base.validateCreditCard();
  } else {
    return {};
  }
}

/**
 * Sets the payment transaction amount
 * @returns {Object} an error object
 */
function calculatePaymentTransaction() {
  // overring logic because it doesn't support gift-certificates
  var result = { error: false };
  return result;
}

module.exports = {
  handlePayments: handlePayments,
  calculatePaymentTransaction: calculatePaymentTransaction,
  validateCreditCard: validateCreditCard
};

Object.keys(base).forEach(function (prop) {
  // eslint-disable-next-line no-prototype-builtins
  if (!module.exports.hasOwnProperty(prop)) {
    module.exports[prop] = base[prop];
  }
});
