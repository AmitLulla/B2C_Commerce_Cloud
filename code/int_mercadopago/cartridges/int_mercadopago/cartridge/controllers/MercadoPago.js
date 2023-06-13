'use strict';

/* global request empty response session */
/* eslint-disable no-param-reassign */

var server = require('server');
var Logger = require('dw/system/Logger').getLogger('MercadoPago', 'MercadoPago');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var MercadoPago = require('*/cartridge/scripts/library/libMercadoPago');

/**
 * @param  {Object} order - Order object
 * @param  {Object} paymentInfo - Object containing payment status
 */
function updatePaymentInfo(order, paymentInfo) {
  Transaction.wrap(function () {
    order.custom.transactionStatus =
      paymentInfo.status +
      ' - ' +
      Resource.msg('status.' + paymentInfo.status, 'mercadoPago', null);
    order.custom.transactionReport = paymentInfo.status_detail
      ? paymentInfo.status_detail
      : '';
  });
}

/**
 * @description This function executes when MercadoPago notifies us about declined payments
 * @param  {Object} order - Order object
 * @param  {boolean} failOrder - boolen which shows whether other payment method was accessed via the link
 */
function handleDeclinedResponse(order, failOrder) {
  if (order.status.value === Order.ORDER_STATUS_FAILED) {
    // Mercado pago can fire the same event more than once or not immediately
    // In the case the change was already done, like order is already failed, don't change anything again
    return;
  }

  try {
    if (order.status.value === Order.ORDER_STATUS_CREATED && failOrder) {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
    } else if (
      order.status.value === Order.ORDER_STATUS_NEW ||
      order.status.value === Order.ORDER_STATUS_OPEN
    ) {
      Transaction.wrap(function () {
        OrderMgr.cancelOrder(order);
      });
    }
    // inform the client in some way (like a payment failed e-mail)
  } catch (e) {
  }
}

/**
 * @description This function executes when MercadoPago notifies us about approved payments
 * @param  {Object} order - Order object
 * @param  {string} localeID - Id of current locale
 */
function handleAuthorizedResponse(order, localeID) {
  if (order.status.value !== Order.ORDER_STATUS_CREATED) {
    // Mercado pago can fire the same event more than once
    // In the case the change was already done, like order is already placed or failed, don't change anything again
    return;
  }

  try {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    // possible orderStatus are "authorized", "declined" and "pending"
    // if we have "declined" or "pending", we will not do anything here
    // for "authorized", we will place the order and depending of the result, send a confirmation
    var placeOrderResult = COHelpers.placeOrder(order, { status: true });

    if (placeOrderResult.error) {
      // inform the client in some way (like a payment failed e-mail)
    } else {
      COHelpers.sendConfirmationEmail(order, localeID);
    }
  } catch (e) {
  }
}

server.post('MercadoPagoPaymentNotification', function (req, res, next) {
  var paymentInfo;
  var orderNo;
  var order;
  var orderStatus;
  var localeID = req.locale.id;

  // In case any problem occur during this steps the catch should return a invalid response for subsequent retries from mercado pago
  // For success cases the script will return a 200 request as it completes
  try {
    var notificationData = JSON.parse(
      request.httpParameterMap.requestBodyAsString
    );

    if (
      notificationData.action === 'payment.updated' ||
      notificationData.action === 'payment.created'
    ) {
      Transaction.wrap(function () {
        var MP = new MercadoPago();
        var failOrder = MP.getOtherPaymentMode() === 'Link';

        // Get current payment info for updated status
        paymentInfo = MP.getPaymentInfo(notificationData.data.id);
        // removing sensitive information
        paymentInfo.payer = {};
        paymentInfo.additional_info = {};

        if (!empty(paymentInfo)) {
          orderNo = paymentInfo.external_reference;
          order = OrderMgr.getOrder(orderNo);

          if (!empty(order)) {
            var paymentWasPending =
              order.custom.transactionStatus.indexOf('pending') === 0;
            order.addNote(
              'MercadoPago Webhook event received',
              JSON.stringify(notificationData)
            );

            if (notificationData.action === 'payment.updated') {
              // Check the status with defined conditions
              orderStatus = MP.parseOrderStatus(paymentInfo.status);

              // Updates transaction statuses to be seen in BM
              updatePaymentInfo(order, paymentInfo);

              order.addNote(
                'MercadoPago Webhook new status',
                JSON.stringify(paymentInfo)
              );
              // If previous status was pending and now is authorized, place the order and display order confirmation page
              if (paymentWasPending && orderStatus === 'authorized') {
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                handleAuthorizedResponse(order, localeID);
              } else if (paymentWasPending && orderStatus === 'declined') {
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                handleDeclinedResponse(order, failOrder);
              }
            }
          }
        }
      });
    }
  } catch (error) {
    Logger.error("MercadoPago.js - MercadoPagoPaymentNotification : An error occurred with this method: " + error.message);
    response.setStatus(500);
  }

  res.render('checkout/moNotification.isml');

  next();
});

server.get('FailedPayment', function (req, res, next) {
  res.render('checkout/mpPaymentFailed.isml', {
    message: Resource.msg('status.rejectcancelled', 'mercadoPago', null)
  });
  return next();
});

// This function handles the response once it returns from mercadopago
server.get('MercadoPagoReturnURL', function (req, res, next) {
  var order = OrderMgr.getOrder(req.querystring.ID);
  var token = req.querystring.token ? req.querystring.token : null;
  var localeID = req.locale.id;

  if (
    !order ||
    !token ||
    token !== order.orderToken ||
    order.customer.ID !== req.currentCustomer.raw.ID
  ) {
    res.render('/error', {
      message: Resource.msg('error.confirmation.error', 'confirmation', null)
    });
    return next();
  }

  // Get current payment info for updated status
  var MP = new MercadoPago();
  var paymentInstrument = MP.getPaymentInstrument(order);
  var paymentInfo = MP.getPaymentInfo(
    paymentInstrument.paymentTransaction.transactionID
  );
  var paymentStatus = MP.parseOrderStatus(paymentInfo.status);

  // the following verification are necessary if the webhook failed
  if (
    paymentStatus === 'declined' &&
    (order.status.value === Order.ORDER_STATUS_NEW ||
      order.status.value === Order.ORDER_STATUS_OPEN)
  ) {
    updatePaymentInfo(order, paymentInfo);
    // if the payment was declined after the order was placed (when we use Link mode instead of Redirect), we need to cancel the order
    Transaction.wrap(function () {
      OrderMgr.cancelOrder(order);
    });
    // needs to inform the customer that the order was failed/cancelled
    res.redirect(
      URLUtils.https(
        'MercadoPago-FailedPayment',
        'ID',
        order.orderNo,
        'token',
        order.orderToken
      )
    );
  } else if (
    paymentStatus === 'declined' &&
    order.status.value === Order.ORDER_STATUS_CREATED
  ) {
    updatePaymentInfo(order, paymentInfo);
    // if the payment here is still created and was declined, fail the order and redirect back to Checkout
    handleDeclinedResponse(order, true);
    session.privacy.mercadoPagoPaymentError = true;
    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment'));
  } else if (
    order.status.value === Order.ORDER_STATUS_CREATED &&
    paymentStatus === 'authorized'
  ) {
    // payment was already authorized by MercadoPago, but order was not placed yet
    updatePaymentInfo(order, paymentInfo);
    handleAuthorizedResponse(order, localeID);
    res.redirect(
      URLUtils.https(
        'Order-Confirm',
        'ID',
        order.orderNo,
        'token',
        order.orderToken
      )
    );
  } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
    // order was already failed, show checkout again
    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment'));
  } else if (order.status.value === Order.ORDER_STATUS_CANCELLED) {
    res.redirect(
      URLUtils.https(
        'MercadoPago-FailedPayment',
        'ID',
        order.orderNo,
        'token',
        order.orderToken
      )
    );
  } else {
    // authorized, pending or other unhandled status
    res.redirect(
      URLUtils.https(
        'Order-ConfirmPayment',
        'ID',
        order.orderNo,
        'token',
        order.orderToken
      )
    );
  }
  return next();
});

module.exports = server.exports();
