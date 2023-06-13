'use strict';
/* global request empty */
var Logger = require('dw/system/Logger');

function savePaymentCode (billingData, order) {
    try {
        var returnHelpers = require('*/cartridge/scripts/helpers/returnsHelpers.js');
        var Transaction = require('dw/system/Transaction');
        var preferences = returnHelpers.getPreferences().paymentCodes ? returnHelpers.getPreferences().paymentCodes[0]: [];
        switch (billingData.paymentMethod.value) {
            case 'PAGO_CONTRA_ENTREGA':
                var paymentInstrument = order.getPaymentInstruments()[0];
                Transaction.wrap(function () {
                    paymentInstrument.custom.mercadoPagoFinancialInstitution = preferences[billingData.paymentMethod.value]; 
                })
                break;
            case 'GIFT_CERTIFICATE':
                var paymentInstrument = order.getPaymentInstruments()[0];
                Transaction.wrap(function () {
                    paymentInstrument.custom.mercadoPagoFinancialInstitution = preferences['GIFT_CARD']; 
                })
                break;

            case 'MercadoPago':
                var paymentInstrument = order.getPaymentInstruments()[0];
                if (billingData.paymentInformation.paymentTypeId === 'credit_card') {
                    if (billingData.paymentInformation.cardType.value === 'visa') {
                        Transaction.wrap(function () {
                            paymentInstrument.custom.mercadoPagoFinancialInstitution = preferences['C_VISA']; 
                        })
                    } else if (billingData.paymentInformation.cardType.value === 'master') {
                        Transaction.wrap(function () {
                            paymentInstrument.custom.mercadoPagoFinancialInstitution = preferences['C_MASTERCARD']; 
                        })
                    } else if (billingData.paymentInformation.cardType.value === 'amex') {
                        Transaction.wrap(function () {
                            paymentInstrument.custom.mercadoPagoFinancialInstitution = preferences['AMERICAN_EXPRESS']; 
                        })
                    }
                    
                }
                
                break;
        
            default:

                break;
        }   
    } catch (error) {
        Logger.error('Ocurrio un error al guardar el id del metodo de pago: ', error.message);
    }

}


module.exports = {savePaymentCode:savePaymentCode}