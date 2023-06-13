'use strict';
/* global request empty */

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');

/** @constructs MercadoPagoHelper */
function MercadoPagoHelper() {}

/**
 * @description Helper function which returns current locale ID
 * @returns {string} - locale string
 */
function getCurrentLocaleID() {
  var Locale = require('dw/util/Locale');
  return Locale.getLocale(request.locale).ID || 'default';
}

/**
 * @description General wrapper for JSON.parse(...) with error catching
 * @param {string} stringified - the string object representation to parse
 * @param {Object} defaultObject - object that will be return in case of empty string or error during parsing
 * @returns {Object} - parsed JSON object
 */
MercadoPagoHelper.prototype.parseJson = function (stringified, defaultObject) {
  var parsed = {};

  if (empty(stringified)) return defaultObject;

  try {
    parsed = JSON.parse(stringified);
  } catch (e) {
    return defaultObject;
  }

  return parsed;
};

/**
 * @description Get grouped payment methods
 * @returns {Object} groupedPaymentMethods
 */
MercadoPagoHelper.prototype.getGroupedPaymentMethods = function () {
  var MercadoPago = require('*/cartridge/scripts/library/libMercadoPago');
  var MP = new MercadoPago();

  var availablePaymentMethods = MP.getPaymentMethods();
  var groupedPaymentMethods = MP.groupPaymentMethods(availablePaymentMethods);

  return groupedPaymentMethods;
};

/**
 * @description Get available payment methods
 * @returns {Object} availablePaymentMethods
 */
function getAvailablePaymentMethods() {
  var MercadoPago = require('*/cartridge/scripts/library/libMercadoPago');
  var MP = new MercadoPago();

  return MP.getPaymentMethods();
}

MercadoPagoHelper.prototype.getAvailablePaymentMethods =
  getAvailablePaymentMethods;

/**
 * @description Get name of the payment method
 * @param {string} paymentTypeID - payment type ID, i.e. visa
 * @returns {string} payment method name, i.e. Visa
 */
MercadoPagoHelper.prototype.getPaymentMethodName = function (paymentTypeID) {
  var availablePaymentMethods = getAvailablePaymentMethods();
  var paymentType = availablePaymentMethods.filter(function (paymentMethod) {
    return paymentMethod.id === paymentTypeID;
  });
  var paymentName = paymentType.length ? paymentType[0].name : paymentTypeID;
  return paymentName;
};

/**
 * @param {Array} paymentMethods - Array of vailable MercadoPago payment methods
 * @description Get available PSE financial institutions
 * @returns {Array<Object>} pseFinancialInstitutions
 */

/**
 * @description Get custom preferences
 * @returns {Object} - Object containing SitePrefs
 */
MercadoPagoHelper.prototype.getPreferences = function () {
  var currentSite = Site.getCurrent();

  var publicKey = currentSite.getCustomPreferenceValue('mercadoPagoPublicKey');

  return {
    publicKey: publicKey,
    enableInstallments: currentSite.getCustomPreferenceValue(
      'mercadoPagoEnableInstallments'
    ),
    enableDocTypeNumber: currentSite.getCustomPreferenceValue(
      'mercadoPagoEnableDocTypeNumber'
    ),
    otherPaymentMode: currentSite.getCustomPreferenceValue(
      'mercadoPagoOtherPaymentMode'
    ).value,
    enableSendTaxes: currentSite.getCustomPreferenceValue(
      'mercadoPagoEnableSendTaxes'
    )
  };
};

/**
 * @description Get error messages
 * @returns {Object} - Object with error messages
 */
MercadoPagoHelper.prototype.getErrorMessages = function () {
  return {
    205: Resource.msg('error.205', 'mercadoPago', null),
    208: Resource.msg('error.208', 'mercadoPago', null),
    209: Resource.msg('error.209', 'mercadoPago', null),
    212: Resource.msg('error.212', 'mercadoPago', null),
    213: Resource.msg('error.213', 'mercadoPago', null),
    214: Resource.msg('error.214', 'mercadoPago', null),
    220: Resource.msg('error.220', 'mercadoPago', null),
    221: Resource.msg('error.221', 'mercadoPago', null),
    224: Resource.msg('error.224', 'mercadoPago', null),
    E301: Resource.msg('error.E301', 'mercadoPago', null),
    E302: Resource.msg('error.E302', 'mercadoPago', null),
    316: Resource.msg('error.316', 'mercadoPago', null),
    322: Resource.msg('error.322', 'mercadoPago', null),
    323: Resource.msg('error.323', 'mercadoPago', null),
    324: Resource.msg('error.324', 'mercadoPago', null),
    325: Resource.msg('error.325', 'mercadoPago', null),
    326: Resource.msg('error.326', 'mercadoPago', null),
    2067: Resource.msg('error.2067', 'mercadoPago', null),
    E203: Resource.msg('error.E203', 'mercadoPago', null),
    default: Resource.msg('error.default', 'mercadoPago', null),
    email: Resource.msg('error.email', 'mercadoPago', null),
    cedcid: Resource.msg('error.cedcid', 'mercadoPago', null),
    phone: Resource.msg('error.phone', 'mercadoPago', null),
    installments: Resource.msg('error.installments', 'mercadoPago', null),
    issuer: Resource.msg('error.issuer', 'mercadoPago', null)
  };
};

/**
 * @description Get resource messages
 * @returns {Object} - Object with Resource messages
 */
MercadoPagoHelper.prototype.getResourceMessages = function () {
  return {
    defaultIssuer: Resource.msg('select.default.issuer', 'forms', null),
    defaultInstallments: Resource.msg(
      'select.default.installments',
      'forms',
      null
    ),
    docNumberLabel: Resource.msg(
      'label.input.payment.docNumber',
      'forms',
      null
    ),
    docNumberLabelDNI: Resource.msg(
      'label.input.payment.docNumber.DNI',
      'forms',
      null
    ),
    docNumberLabelOther: Resource.msg(
      'label.input.payment.docNumber.other',
      'forms',
      null
    ),
    docNumberTooltip: Resource.msg('tooltip.docNumber', 'creditCard', null)
  };
};

/**
 * @description Get customer cards
 * @param {Object} currentCustomer - current storefront customer
 * @returns {Array} - array of customer's saved cards
 */
MercadoPagoHelper.prototype.getCustomerCards = function (currentCustomer) {
  var MercadoPago = require('*/cartridge/scripts/library/libMercadoPago');
  var MP = new MercadoPago();

  return MP.getCustomerCards(currentCustomer);
};

/**
 * @description Get configuration resources
 * @returns {Object} - Object with Configuration Resources
 */
MercadoPagoHelper.prototype.getConfiguration = function () {
  return {
    paymentMethodId: Resource.msg(
      'payment.method.id',
      'mercadoPagoPreferences',
      null
    ),
    defaultCardType: Resource.msg(
      'default.card.type',
      'mercadoPagoPreferences',
      null
    ),
    otherPaymentMethod: Resource.msg(
      'other.payment.method',
      'mercadoPagoPreferences',
      null
    ),
    docTypeDNI: Resource.msg('DNI.docType', 'mercadoPagoPreferences', null),
    defaultIssuer: Resource.msg(
      'default.issuer',
      'mercadoPagoPreferences',
      null
    )
  };
};

/**
 * @description Check for mercado pago configuration and licensing
 * @returns {boolean} - Wheter the cartridge can be used or not
 */
MercadoPagoHelper.prototype.isMercadoPagoEnabled = function () {
  var mpEnabled = Site.getCurrent().getCustomPreferenceValue(
    'mercadoPagoEnableMercadoPago'
  );
  if (mpEnabled) {
    return true;
  }
  return false;
};

MercadoPagoHelper.prototype.getCurrentLocaleID = getCurrentLocaleID;

MercadoPagoHelper.prototype.getServiceCredentialID = function () {
  return null;
};

/**
 * @description General wrapper for JSON.parse(...) with error catching
 * @param {string} customerId - the string object representation to parse
 * @param {string} cardId - the string object representation to parse
 * @returns {Array} - parsed JSON object
 */
MercadoPagoHelper.prototype.removeCardMp = function (customerId, cardId) {
  var MercadoPago = require('*/cartridge/scripts/library/libMercadoPago');
  var MP = new MercadoPago();
  return MP.removeCardMp(customerId, cardId);
};
MercadoPagoHelper.prototype.saveCardMp = function (customerId, cardToken) {
  var MercadoPago = require('*/cartridge/scripts/library/libMercadoPago');
  var MP = new MercadoPago();
  return MP.createCustomerCard(customerId, cardToken);
};

MercadoPagoHelper.prototype.getPseFinancialInstitutions = function (
  paymentMethods
) {
  var psePaymentMethodID = 'pse';
  var pseFinancialInstitutions = [];

  if (paymentMethods && paymentMethods.length > 0) {
    var psePaymentMethod = paymentMethods.filter(function (method) {
      return method.id === psePaymentMethodID;
    });
    if (psePaymentMethod.length && psePaymentMethod[0]) {
      pseFinancialInstitutions = psePaymentMethod[0].financial_institutions.map(
        function (item) {
          return {
            name: item.description,
            id: item.id
          };
        }
      );
    }

    pseFinancialInstitutions = pseFinancialInstitutions.sort(function (a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }

  return pseFinancialInstitutions;
};

module.exports = new MercadoPagoHelper();
