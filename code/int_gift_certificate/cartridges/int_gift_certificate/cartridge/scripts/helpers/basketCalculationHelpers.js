'use strict';

var base = module.superModule;

// eslint-disable-next-line valid-jsdoc
/**
 * @param {dw.order.Basket} currentBasket
 * @returns {dw.value.Money}
 */
function getGiftCertificateTotal(currentBasket) {
    var Money = require('dw/value/Money');
    return currentBasket
        .giftCertificatePaymentInstruments
        .toArray()
        .reduce(function (total, giftCertificate) {
            return total.add(giftCertificate.paymentTransaction.amount);
        }, new Money(0, currentBasket.currencyCode));
}

base.getGiftCertificateTotal = getGiftCertificateTotal;

module.exports = base;
