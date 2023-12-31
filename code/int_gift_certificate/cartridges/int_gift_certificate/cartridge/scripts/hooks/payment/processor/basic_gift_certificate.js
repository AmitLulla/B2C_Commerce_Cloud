'use strict';

/* API Includes */
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

/**
 * Authorizes a payment using a gift certificate. The payment is authorized by redeeming the gift certificate and
 * simply setting the order no as transaction ID.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} pmntInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} pmntProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, pmntInstrument, pmntProcessor) {
	var orderNo = orderNumber;
	var paymentInstrument = pmntInstrument;
	var paymentProcessor = pmntProcessor;
	var serverErrors = [];
	var fieldErrors = {};
	var error = false;

	try {
		Transaction.wrap(function () {
			paymentInstrument.paymentTransaction.transactionID = orderNo;
			paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
			paymentInstrument.creditCardType = 'gift_certificate';
			var status = GiftCertificateMgr.redeemGiftCertificate(paymentInstrument);

			if (status.isError()) {
				error = true;
				serverErrors.push(
					Resource.msg('error.technical', 'checkout', null)
				);
			} else {
				var OrderMgr = require('dw/order/OrderMgr');
				var order = OrderMgr.getOrder(orderNo);
				for (var key = 0 in order.paymentInstruments) {
					if (order.paymentInstruments[key].paymentMethod === 'GIFT_CERTIFICATE') {
						try {
							var giftCard = GiftCertificateMgr.getGiftCertificateByCode(order.paymentInstruments[key].giftCertificateCode);
							giftCard.custom.saldoActual = giftCard.balance.value;
						} catch (error) {
							
						}
					}
				}
				if (order.paymentInstruments.length === 1) {
					order.setPaymentStatus(order.PAYMENT_STATUS_PAID);
				}
			}
		});
	} catch (e) {
		error = true;
		serverErrors.push(
			Resource.msg('error.technical', 'checkout', null)
		);
	}

	return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
	var collections = require('*/cartridge/scripts/util/collections');
	var { getGiftCertificateTotal } = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
	var cardErrors = {};
	var serverErrors = [];

	var giftCertificateOnly = getGiftCertificateTotal(basket).equals(basket.totalGrossPrice);
	if (giftCertificateOnly) {
		Transaction.wrap(function () {
			collections.forEach(basket.getPaymentInstruments(), function (item) {
				if (item.paymentMethod !== 'GIFT_CERTIFICATE') {
					return basket.removePaymentInstrument(item);
				}
			});
		});
	}

	return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

exports.Authorize = Authorize;
exports.Handle = Handle;
