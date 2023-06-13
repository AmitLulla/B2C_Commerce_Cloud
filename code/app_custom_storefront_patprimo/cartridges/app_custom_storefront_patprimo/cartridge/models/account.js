'use strict';

var AddressModel = require('*/cartridge/models/address');
var URLUtils = require('dw/web/URLUtils');
var Customer = require('dw/customer/Customer');

/**
 * Creates a plain object that contains profile information
 * @param {Object} profile - current customer's profile
 * @returns {Object} an object that contains information about the current customer's profile
 */
function getProfile(profile) {
    var result;
    if (profile) {
        result = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: Object.prototype.hasOwnProperty.call(profile, 'phone') ? profile.phone : profile.phoneHome,
            password: '********'
        };
    } else {
        result = null;
    }
    return result;
}

/**
 * Creates an array of plain object that contains address book addresses, if any exist
 * @param {Object} addressBook - target customer
 * @returns {Array<Object>} an array of customer addresses
 */
function getAddresses(addressBook) {
    var result = [];
    if (addressBook) {
        for (var i = 0, ii = addressBook.addresses.length; i < ii; i++) {
            result.push(new AddressModel(addressBook.addresses[i]).address);
        }
    }

    return result;
}

/**
 * Creates a plain object that contains the customer's preferred address
 * @param {Object} addressBook - target customer
 * @returns {Object} an object that contains information about current customer's preferred address
 */
function getPreferredAddress(addressBook) {
    var result = null;
    if (addressBook && addressBook.preferredAddress) {
        result = new AddressModel(addressBook.preferredAddress).address;
    }

    return result;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} wallet - current customer's wallet
 * @returns {Object} object that contains info about the current customer's payment instrument
 */
function getPayment(wallet) {
    if (wallet) {
        var paymentInstruments = wallet.paymentInstruments;
        if (paymentInstruments && paymentInstruments.length > 0) {
            var paymentInstrument = paymentInstruments[0];
            return {
                maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
                creditCardType: paymentInstrument.creditCardType,
                creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
                creditCardHolder : paymentInstrument.creditCardHolder
            };
        }
    }
    return null;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstruments(userPaymentInstruments) {
    var paymentInstruments;

    paymentInstruments = userPaymentInstruments.map(function (paymentInstrument) {
        var result = {
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
            maskedCreditCardNumberGr: generedCardNumber(paymentInstrument.maskedCreditCardNumber),
            creditCardType: paymentInstrument.creditCardType,
            creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
            creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
            UUID: paymentInstrument.UUID
        };

        result.cardTypeImage = {
            src: URLUtils.staticURL('/images/' +
                paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                '-dark.svg'),
            alt: paymentInstrument.creditCardType
        };

        return result;
    });

    return paymentInstruments;
}

function generedCardNumber(card){
    var index = 0;
    var cardGenered = "";
    for (var i = 0; i< card.length; i++) {
        cardGenered = cardGenered + card.charAt(i);
        if(index == 3){
            if( (i+1) != card.length){
                cardGenered = cardGenered + " ";
            }
            index = 0;
        }else{
            index++;
        }
    }
    return cardGenered;
}

/**
 * Account class that represents the current customer's profile dashboard
 * @param {Object} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    this.profile = getProfile(currentCustomer.profile);
    var t = this.profile;
    if ('raw' in currentCustomer && currentCustomer.raw.profile) {
        this.profile.documentoIdentidad = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.documentoIdentidad: null;
        this.profile.tipoDocumentoIdentidad = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.tipoDocumentoIdentidad.value: null;
        this.profile.razon_social = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.razon_social: null;
        this.profile.nit = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.corporateDocument: null;
        this.profile.nombre_empresa = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.corporateName: null;
        this.profile.responsable_iva = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.isResponsableIVA: null;
    } else if (currentCustomer && currentCustomer.profile && currentCustomer.profile.custom) {

        this.profile.documentoIdentidad = currentCustomer.profile ? currentCustomer.profile.custom.documentoIdentidad: null;
        this.profile.tipoDocumentoIdentidad = currentCustomer.profile ? currentCustomer.profile.custom.tipoDocumentoIdentidad.value: null;
        this.profile.razon_social = currentCustomer.profile ? currentCustomer.profile.custom.razon_social: null;
        this.profile.nit = currentCustomer.profile ? currentCustomer.profile.custom.corporateDocument: null;
        this.profile.nombre_empresa = currentCustomer.profile ? currentCustomer.profile.custom.corporateName: null;
        this.profile.responsable_iva = currentCustomer.profile ? currentCustomer.profile.custom.isResponsableIVA: null;
    }
    this.addresses = getAddresses(currentCustomer.addressBook);
    this.preferredAddress = addressModel || getPreferredAddress(currentCustomer.addressBook);
    this.orderHistory = orderModel;
    this.payment = getPayment(currentCustomer instanceof Customer ? currentCustomer.profile.wallet : currentCustomer.wallet);
    this.registeredUser = currentCustomer instanceof Customer ? (currentCustomer.authenticated && currentCustomer.registered) : (currentCustomer.raw.authenticated && currentCustomer.raw.registered);
    this.isExternallyAuthenticated = currentCustomer instanceof Customer ? currentCustomer.externallyAuthenticated : currentCustomer.raw.externallyAuthenticated;

    if (currentCustomer instanceof Customer) {
        this.customerPaymentInstruments = currentCustomer.profile.wallet
        && currentCustomer.profile.wallet.paymentInstruments
        ? getCustomerPaymentInstruments(currentCustomer.profile.wallet.paymentInstruments.toArray())
        : null;
    } else {
        this.customerPaymentInstruments = currentCustomer.wallet
        && currentCustomer.wallet.paymentInstruments
        ? getCustomerPaymentInstruments(currentCustomer.wallet.paymentInstruments)
        : null;
    }
}

account.getCustomerPaymentInstruments = getCustomerPaymentInstruments;

module.exports = account;
