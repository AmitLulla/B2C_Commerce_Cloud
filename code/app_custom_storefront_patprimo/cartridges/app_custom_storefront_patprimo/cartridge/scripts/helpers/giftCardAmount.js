"use strict";

function getTotals(input) {
    var redond = Math.round(input);
    var num = redond;
    if (!isNaN(num)) {
        num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');
        num = num.split('').reverse().join('').replace(/^[\.]/, '');
        return num;
    }
}

function GetDiferenceGiftCertificate (currentBasket) {
    var Resource = require('dw/web/Resource');
    if (currentBasket.giftCertificatePaymentInstruments.length > 0) {
        var totalGiftCertificate = 0;
        for (var key in currentBasket.giftCertificatePaymentInstruments) {
            if (currentBasket.giftCertificatePaymentInstruments[key].paymentTransaction) {
                totalGiftCertificate = totalGiftCertificate + currentBasket.giftCertificatePaymentInstruments[key].paymentTransaction.amount.value;
            }
        }
        if (totalGiftCertificate != currentBasket.totalGrossPrice.value) {
            var amount = (currentBasket.totalGrossPrice.value - totalGiftCertificate).toFixed();
            amount = getTotals(amount);
            
            return {error:false,
                insuficientBalance : true,
                saldoPending: Resource.msgf('saldo.pending', 'checkout', null,amount)
            }
          
        } else {
           return {error:false,
                insuficientBalance : false,
                saldoPending: Resource.msgf('saldo.pending', 'checkout', null,0)
            }
        }
    }
    return false;
}

module.exports = {GetDiferenceGiftCertificate:GetDiferenceGiftCertificate};