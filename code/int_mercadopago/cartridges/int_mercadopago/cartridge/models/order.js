"use strict";

var base = module.superModule;

var Resource = require("dw/web/Resource");

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users"s basket/order
 * @param {Object} options - The current order"s line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    this.resources.giftCertificate = Resource.msg("field.giftcertificate.name", "creditCard", null);

    this.orderTransactionNote = Object.hasOwnProperty.call(lineItemContainer.custom, "transactionNote")
        ? lineItemContainer.custom.transactionNote
        : null;
    if (lineItemContainer.giftCertificatePaymentInstruments.length > 0) {
        var giftCardTotals = [];
        for (var index in lineItemContainer.giftCertificatePaymentInstruments) {
            giftCardTotals.push(lineItemContainer.giftCertificatePaymentInstruments[index].giftCertificateCode +
                '-' + lineItemContainer.giftCertificatePaymentInstruments[index].paymentTransaction.amount.value)
        }

        if(options.config && options.config.numberOfLineItems !== 'single'|| this.totals) {
            this.totals.giftCardTotals= giftCardTotals;
        }
    }
    
}

module.exports = OrderModel;
