'use strict';
var Transaction = require('dw/system/Transaction');
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');


function updategiftCard (basket) {
    var { find } = require('*/cartridge/scripts/util/collections');
    var { getGiftCertificateTotal } = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var totalGiftCertificate = 0, totalGiftCertificate2= 0;
    var arrayCodes = [];

    if (basket.giftCertificatePaymentInstruments.length > 0 && !session.custom.removeGift) {
        for (var key in basket.giftCertificatePaymentInstruments) {
            if (
                basket.giftCertificatePaymentInstruments[key]
                .paymentTransaction
            ) {
                totalGiftCertificate +=
                basket.giftCertificatePaymentInstruments[key]
                    .paymentTransaction.amount.value;
                    totalGiftCertificate2 = totalGiftCertificate2+ basket.giftCertificatePaymentInstruments[key].paymentTransaction.amount.value;
                    arrayCodes.push(basket.giftCertificatePaymentInstruments[key].giftCertificateCode + '-' + basket.giftCertificatePaymentInstruments[key].UUID);
            }
        }
        if (totalGiftCertificate != basket.totalGrossPrice.value) {
           if (arrayCodes.length > 0) {
                for (var key in arrayCodes) {
                    var giftCertificate = GiftCertificateMgr.getGiftCertificate(arrayCodes[key].split('-')[0] || '');
                    var paymentInstrument = find(basket.paymentInstruments, function (pI) {
                        return pI.giftCertificateCode && pI.UUID === arrayCodes[key].split('-')[1];
                      });
                    //   Remove giftCard
                    if (paymentInstrument) {
                        Transaction.wrap(function () {
                            basket.removePaymentInstrument(paymentInstrument);
                        });
                    }
                    var totalGC = getGiftCertificateTotal(basket);
                    var maximumApplicable = basket.totalGrossPrice.subtract(totalGC);
                    // Add giftCard again
                    paymentInstrument = Transaction.wrap(function () {
                        return basket.createGiftCertificatePaymentInstrument(
                            arrayCodes[key].split('-')[0],
                            (giftCertificate.balance < maximumApplicable ?
                                giftCertificate.balance :
                                maximumApplicable)
                        );
                      });
                }
           }
        }
    }
    session.custom.removeGift = null;
}

module.exports = {updategiftCard:updategiftCard }