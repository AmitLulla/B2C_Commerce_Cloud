'use strict';

var base = module.superModule;

var server = require('server');
var Transaction = require('dw/system/Transaction');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var BasketMgr = require('dw/order/BasketMgr');
// static functions needed for Checkout Controller logic

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function copyBillingAddressToBasket(address, currentBasket) {
    var billingAddress = currentBasket.billingAddress;

    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }
    
        if (!billingAddress.firstName || billingAddress.firstName === 'undefined') {
            billingAddress.setFirstName(address.firstName);
            billingAddress.setLastName(address.lastName);
        }
        billingAddress.setAddress1(address.address1);
        billingAddress.setAddress2(address.address2);
        billingAddress.setCity(address.city);
        billingAddress.setPostalCode(address.postalCode);
        billingAddress.setStateCode(address.stateCode);
        billingAddress.setCountryCode(address.countryCode.value);
        if (!billingAddress.phone || (billingAddress.phone === 'undefined')) {
            billingAddress.setPhone(address.phone);
        }
        if ('raw' in address) {
            billingAddress.custom.departamento = address.raw.custom.departamento;
            billingAddress.custom.municipio = address.raw.custom.municipio;
            billingAddress.custom.tipo_de_via = address.raw.custom.tipo_de_via;
            billingAddress.custom.street = address.raw.custom.street;
            billingAddress.custom.numberStreet = address.raw.custom.numberStreet;
            billingAddress.custom.numberStreetExtra = address.raw.custom.numberStreetExtra;
            billingAddress.custom.piso_o_apartamento = address.raw.custom.piso_o_apartamento ? address.raw.custom.piso_o_apartamento: '';
            billingAddress.custom.nombre_persona_receptora = address.raw.custom.personaQueRecibe;
            billingAddress.custom.aliasDireccion = address.raw.custom.nombreDireccion;
        }
        if (address.custom && address.custom.aliasDireccion) {
            billingAddress.custom.departamento = address.custom.departamento;
            billingAddress.custom.municipio = address.custom.municipio;
            billingAddress.custom.tipo_de_via = address.custom.tipo_de_via;
            billingAddress.custom.street = address.custom.street;
            billingAddress.custom.numberStreet = address.custom.numberStreet;
            billingAddress.custom.numberStreetExtra = address.custom.numberStreetExtra;
            billingAddress.custom.piso_o_apartamento = address.custom.piso_o_apartamento ? address.custom.piso_o_apartamento: '';
            billingAddress.custom.nombre_persona_receptora = address.custom.nombre_persona_receptora;
            billingAddress.custom.aliasDireccion = address.custom.aliasDireccion;
            billingAddress.custom.cedulaCiudadana = address.custom.cedulaCiudadana ? address.custom.cedulaCiudadana : null;
        }
        

    });
}

function copyShippingAddressToShipment(shippingData, shipmentOrNull) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;
    var shippingAddress = shipment.shippingAddress;
 
    Transaction.wrap(function () {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }
       
        shippingAddress.setFirstName(shippingData.address.firstName);
        shippingAddress.setLastName(shippingData.address.lastName);
        shippingAddress.setAddress1(shippingData.address.address1);
        shippingAddress.setAddress2(shippingData.address.address2);
        shippingAddress.setCity(shippingData.address.city);
        shippingAddress.setPostalCode(shippingData.address.postalCode);
        shippingAddress.setStateCode(shippingData.address.stateCode);
        shippingAddress.custom.departamento = shippingData.address.departamento;
        shippingAddress.custom.municipio = shippingData.address.Municipio;
        shippingAddress.custom.tipo_de_via = shippingData.address.via;
        shippingAddress.custom.piso_o_apartamento = shippingData.address.piso_o_apartamento;
        shippingAddress.custom.nombre_persona_receptora = shippingData.address.recibe_name;
        shippingAddress.custom.state = shippingData.address.state;
        shippingAddress.custom.street = shippingData.address.street;
        shippingAddress.custom.numberStreet = shippingData.address.numberStreet;
        shippingAddress.custom.numberStreetExtra = shippingData.address.numberStreetExtra;
        shippingAddress.custom.aliasDireccion = shippingData.address.alias;
        var countryCode = shippingData.address.countryCode ? shippingData.address.countryCode : '';
        shippingAddress.setCountryCode(countryCode);
        shippingAddress.setPhone(shippingData.address.phone ? shippingData.address.phone : currentBasket.billingAddress ? currentBasket.billingAddress.phone : '');
        if (!shippingAddress.custom.cedulaCiudadana || shippingAddress.custom.cedulaCiudadana === 'undefined') {
            shippingAddress.custom.cedulaCiudadana = shippingData.address.cedulaCiudadana ? shippingData.address.cedulaCiudadana : '';
        }

        ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
    });
}

function calculatePaymentTransaction(currentBasket) {
    var result = { error: false, total: '', gcBalance: '' };
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var Money = require('dw/value/Money');

    try {
        // TODO: This function will need to account for gift certificates at a later date
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.paymentInstruments;

            if (!paymentInstruments.length) {
                return;
            }

            // Assuming that there is only one payment instrument used for the total order amount.
            // TODO: Will have to rewrite this logic once we start supporting multiple payment instruments for same order
            var orderTotal = currentBasket.totalGrossPrice;

            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];

                if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
                    var orderVal = orderTotal.value;

                    var giftCert = GiftCertificateMgr.getGiftCertificateByCode(paymentInstrument.giftCertificateCode);
                    var balance = giftCert.getBalance();
                    result.gcBalance = balance.value;

                    if (orderVal > balance.value) {
                        paymentInstrument.paymentTransaction.setAmount(balance);
                        orderVal = orderVal - balance.value;
                    } else {
                        paymentInstrument.paymentTransaction.setAmount(orderTotal);
                        orderVal = orderVal - orderVal;
                    }

                    orderTotal = new Money(orderVal, currentBasket.currencyCode);
                } else {
                    paymentInstrument.paymentTransaction.setAmount(orderTotal);
                }
            }
            result.total = orderTotal.value;
        });
    } catch (e) {
        result.error = true;
    }

    return result;
}

function prepareShippingFormCustom() {
    var shippingForm = server.forms.getForm('addressCustom');

    return shippingForm;
}


base.copyBillingAddressToBasket = copyBillingAddressToBasket;
base.copyShippingAddressToShipment = copyShippingAddressToShipment;
base.calculatePaymentTransaction = calculatePaymentTransaction;
base.getFirstNonDefaultShipmentWithProductLineItems;
base.ensureNoEmptyShipments;
base.getProductLineItem;
base.isShippingAddressInitialized;
base.prepareCustomerForm;
base.prepareShippingForm;
base.prepareShippingFormCustom = prepareShippingFormCustom;
base.prepareBillingForm;
base.copyCustomerAddressToShipment;
base.copyCustomerAddressToBilling;
base.setGift;
base.validateFields;
base.validateCustomerForm;
base.validateShippingForm;
base.validateBillingForm;
base.validatePayment;
base.validateCreditCard;
base.recalculateBasket;
base.handlePayments;
base.createOrder;
base.placeOrder;
base.savePaymentInstrumentToWallet;
base.getRenderedPaymentInstruments;
base.sendConfirmationEmail;
base.ensureValidShipments;
module.exports = base;
