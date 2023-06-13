'use strict';

/* API Includes */
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var collections = require('*/cartridge/scripts/util/collections');

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
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
			var OrderMgr = require('dw/order/OrderMgr');
			var order = OrderMgr.getOrder(orderNo);
			if (order.paymentInstruments.length === 1) {
				order.setPaymentStatus(order.PAYMENT_STATUS_PAID);
			} else if (order.paymentInstruments.length === 2 && 
					order.paymentInstruments[0].paymentMethod === 'GIFT_CERTIFICATE') {
				order.setPaymentStatus(order.PAYMENT_STATUS_PAID);
			}

			if (paymentInstrument.paymentMethod === 'PAGO_CONTRA_ENTREGA') {
				paymentInstrument.creditCardType = 'pago_contra_entrega';
				order.custom.isContraEntrega= true;
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
function Handle(basket,paymentInformation, paymentMethodID, req) {
	var currentBasket = basket;
	var paymentInstrument;
	var { getGiftCertificateTotal } = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
	var giftCertificateOnly = getGiftCertificateTotal(basket);
	var cardErrors = {};
	var serverErrors = [];
	try {
		Transaction.wrap(function () {
			collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
				if (item.paymentMethod != "GIFT_CERTIFICATE") {
					currentBasket.removePaymentInstrument(item);
				}
			});
			
			if (giftCertificateOnly && giftCertificateOnly.value) {
				paymentInstrument = currentBasket.createPaymentInstrument(
					'PAGO_CONTRA_ENTREGA', currentBasket.totalGrossPrice.subtract(giftCertificateOnly)
				);
			} else {
				paymentInstrument = currentBasket.createPaymentInstrument(
					'PAGO_CONTRA_ENTREGA', currentBasket.totalGrossPrice
				);
			}
		});
	} catch (error) {
		var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);
		return { fieldErrors: [], serverErrors: [invalidPaymentMethod], error: true };
	}
	return { fieldErrors: {}, serverErrors: {}, error: false };
}

exports.Authorize = Authorize;
exports.Handle = Handle;
