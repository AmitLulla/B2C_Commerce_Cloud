/**
 * libMercadoPago.js
 *
 * A library file for Mercado Pago communication.
 */

/* eslint-disable no-restricted-syntax */
/* global request empty dw session */

var collections = require('*/cartridge/scripts/util/collections');
var array = require('*/cartridge/scripts/util/array');
var MercadoPagoHelper = require('*/cartridge/scripts/helpers/MercadoPagoHelper');

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var System = require('dw/system/System');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
/**
 * Mercadopago service and base functions definions
 */
function MercadoPago() {
  // Initialize HTTP services for a cartridge
  var serviceID = Resource.msg('service.name', 'mercadoPagoPreferences', null);
  var sandboxEnabled = true;

  this.service = LocalServiceRegistry.createService(serviceID, {
    createRequest: function (svc, args) {
      var svcRef = svc;
      svcRef.addHeader('Content-Type', args.contentType);
      svcRef.setRequestMethod(args.req);
      svcRef.URL = svc.getConfiguration().credential.URL + args.urlPart;

      if (!empty(args.data)) {
        return JSON.stringify(args.data);
      }
      return null;
    },
    parseResponse: function (svc, client) {
      if (client.statusCode === 200 || client.statusCode === 201) {
        return MercadoPagoHelper.parseJson(client.getText(), null);
      }
      return {};
    },
    mockCall: function (svc) {
      return {
        statusCode: 200,
        statusMessage: 'Success',
        text: 'MOCK RESPONSE (' + svc.URL + ')'
      };
    },
    filterLogMessage: function (msg) {
      return msg;
    }
  });

  if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
    sandboxEnabled = false;
  }

  // overwrite sandboxEnabled if jsonData has enableSandbox set to true
  this.credentialsConfig = MercadoPagoHelper.parseJson(
    this.service.getConfiguration().credential.custom.jsonData,
    null
  );

  if (
    !empty(this.credentialsConfig) &&
    'enableSandbox' in this.credentialsConfig &&
    this.credentialsConfig.enableSandbox === true
  ) {
    sandboxEnabled = true;
  }

  this.sandboxEnabled = sandboxEnabled;

  this.exec = function (args) {
    var result = this.service.call(args);
    if (result && args.data && args.data.external_reference) {
      var request = JSON.stringify(args.data);
      var response = JSON.stringify(result.object);
      var order = OrderMgr.getOrder(args.data.external_reference);
      Transaction.wrap(function () {
        order.custom.requestMP = request; 
        order.custom.responseMP = response; 
      })
    }

    if (!result.object && result.errorMessage) {
      session.privacy.mercadoPagoErrorMessage = result.errorMessage;
    }
    return result.object;
  };

  this.get = function (urlPart, contentType) {
    return this.exec({
      urlPart: urlPart,
      req: 'GET',
      contentType: contentType
    });
  };

  this.post = function (urlPart, data, contentType) {
    return this.exec({
      urlPart: urlPart,
      req: 'POST',
      data: data,
      contentType: contentType
    });
  };

  this.put = function (urlPart, data, contentType) {
    return this.exec({
      urlPart: urlPart,
      req: 'PUT',
      data: data,
      contentType: contentType
    });
  };

  this.del = function (urlPart, contentType) {
    return this.exec({
      urlPart: urlPart,
      req: 'DELETE',
      contentType: contentType
    });
  };
}

/**
 * Builds query for requested data to use in request URL
 * @param  {Object} data - object from which to build the query
 * @return {string} - query
 */
MercadoPago.prototype.buildquery = function (data) {
  var elements = [];

  for (var key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      elements.push(key + '=' + encodeURI(data[key]));
    }
  }

  return elements.join('&');
};

/**
 * Gets stored access token which is kept in service credentials password field.
 * @return {string} access token
 */
MercadoPago.prototype.getAccessToken = function () {
  // always return token
  var credentialId = MercadoPagoHelper.getServiceCredentialID();
  if (credentialId) {
    try {
      this.service.setCredentialID(credentialId);
    } catch (error) {
      return null;
    }
  }
  return this.service.getConfiguration().credential.password;
};

/**
 * @description Get available payment methods
 * @return {Array} available payment methods
 */
MercadoPago.prototype.getPaymentMethods = function () {
  var accessToken = this.getAccessToken();

  if (!accessToken) {
    return [];
  }

  var responseCollection = this.get(
    '/v1/payment_methods?access_token=' + encodeURI(accessToken),
    'application/json'
  );
  if (!responseCollection || !responseCollection.length > 0) {
    return null;
  }

  var responseArray = collections.map(
    responseCollection,
    function (responseItem) {
      return responseItem;
    }
  );
  var paymentArray = [];

  if (this.credentialsConfig && this.credentialsConfig.includedPaymentIds) {
    try {
      var includedPaymentIds = this.credentialsConfig.includedPaymentIds;
      responseArray.forEach(function (responseItem) {
        for (var includedPaymentId in includedPaymentIds) {
          if (includedPaymentId === responseItem.id) {
            paymentArray.push(responseItem);
          }
        }
      });
    } catch (e) {}
  }
  return paymentArray.length ? paymentArray : responseArray;
};

/**
 * Checks that basic checkout enabled from Json data in service credentials
 * @return {boolean} boolean value of basic checkout enabled or not
 */
MercadoPago.prototype.isBasicCheckoutEnabled = function () {
  var credential = this.service.getConfiguration().getCredential();
  var isBasicCheckoutEnabled = MercadoPagoHelper.parseJson(
    credential.custom.jsonData,
    {}
  ).basicCheckoutEnabled;

  return !!isBasicCheckoutEnabled;
};

/**
 * @description Get group payment methods by payment type
 * @param {Array} paymentMethods - array of MercadoPago payment methods
 * @return {Object} grouped payment types as two different arrays in an object
 */
MercadoPago.prototype.groupPaymentMethods = function (paymentMethods) {
  var other = [];
  var creditCards = [];
  var debitCards = [];
  var efecty = [];
  var pse = [];

  if (paymentMethods && paymentMethods.length > 0) {
    paymentMethods.forEach(function (paymentMethod) {
      if (paymentMethod.payment_type_id.indexOf('credit') >= 0) {
        creditCards.push(paymentMethod);
      } else if (paymentMethod.payment_type_id.indexOf('debit') >= 0) {
        debitCards.push(paymentMethod);
      } else if (paymentMethod.payment_type_id.indexOf('ticket') >= 0) {
        efecty.push(paymentMethod);
      } else if (paymentMethod.payment_type_id.indexOf('bank_transfer') >= 0) {
        pse.push(paymentMethod);
      } else {
        other.push(paymentMethod);
      }
    });

    if (this.isBasicCheckoutEnabled()) {
      other.push({
        id: 'basiccheckout',
        payment_type_id: 'basiccheckout',
        name: 'Basic Checkout',
        thumbnail: null,
        additional_info_needed: 'no'
      });
    }
  }

  return {
    creditCards: creditCards,
    debitCards: debitCards,
    efecty: efecty,
    pse: pse,
    other: other
  };
};

/**
 * Creates payment on billing page to be a Mercadopago Payment
 * @param {Object} paymentData - Object containing information on customer, order, norification URL, etc.
 * @return {Object} payment creation response from Mercadopago
 */
MercadoPago.prototype.createPayment = function (paymentData) {
  var accessToken = this.getAccessToken();

  if (!empty(accessToken)) {
    return this.post(
      '/v1/payments?access_token=' + encodeURI(accessToken),
      paymentData,
      'application/json'
    );
  }

  return null;
};

/**
 * Creates an authenticated customer on Mercadopago side.
 * @param {Object} customerData - Object containing customer's email
 * @return {Object} create customer event result from Mercadopago
 */
MercadoPago.prototype.createCustomer = function (customerData) {
  var accessToken = this.getAccessToken();

  if (!empty(accessToken)) {
    return this.post(
      '/v1/customers?access_token=' + encodeURI(accessToken),
      customerData,
      'application/json'
    );
  }

  return null;
};

/**
 * Creates an authenticated customer on Mercadopago side.
 * @param {Object} filter - Object containing customer's email
 * @return {Object} customer on Mercadopago with matched email
 */
MercadoPago.prototype.searchCustomer = function (filter) {
  var accessToken = this.getAccessToken();
  var filters = this.buildquery(filter);

  if (!empty(accessToken)) {
    return this.get(
      '/v1/customers/search?' +
        filters +
        '&access_token=' +
        encodeURI(accessToken),
      'application/json'
    );
  }

  return null;
};

/**
 * Creates an authenticated customer on Mercadopago side.
 * @param {Object} customerID - Object containing customer's email
 * @param {Object} cardToken - Object containing credit card token
 * @return {Object} customer on Mercadopago with matched email
 */
MercadoPago.prototype.createCustomerCard = function (customerID, cardToken) {
  var accessToken = this.getAccessToken();

  if (!empty(accessToken)) {
    return this.post(
      '/v1/customers/' +
        customerID +
        '/cards?access_token=' +
        encodeURI(accessToken),
      cardToken,
      'application/json'
    );
  }

  return null;
};

/**
 * Gets notifications for payment from Mercadopago
 * @param {string} id - id of payment
 * @return {Object} notification for requested payment.
 */
MercadoPago.prototype.getPaymentInfo = function (id) {
  var accessToken = this.getAccessToken();

  if (!empty(accessToken)) {
    return this.get(
      '/v1/payments/' + id + '?access_token=' + encodeURI(accessToken),
      'application/json'
    );
  }

  return null;
};

/**
 * Gets removeCardMp for payment from Mercadopago
 * @param {string} customerId - id of customer
 * * @param {string} cardId - id of card
 * @return {Object} notification for requested payment.
 */
MercadoPago.prototype.removeCardMp = function (customerId, cardId) {
  var accessToken = this.getAccessToken();
  if (!empty(accessToken)) {
    return this.del(
     '/v1/customers/' + customerId + '/cards/' + cardId + '?access_token=' + encodeURI(accessToken),
     'application/json'
    );
  }
  return null;
};

/**
 * Gets paymentInstrument from order
 * @param {Order} order - order of payment
 * @return {PaymentInstrument} the payment instrument
 */
MercadoPago.prototype.getPaymentInstrument = function (order) {
  return order
    .getPaymentInstruments()
    .toArray()
    .filter(function (payInstrument) {
      return (
        payInstrument.paymentMethod ===
        Resource.msg('payment.method.id', 'mercadoPagoPreferences', null)
      );
    })[0];
};

/**
 * Gets total amount for Line Item
 * @param {Object} lineItemCtnr - Line item container for which total amount will be retrieved
 * @returns {number} - total amount of the item
 */
function getTotalAmount(lineItemCtnr) {
  var totalAmount = lineItemCtnr.getTotalGrossPrice();

  lineItemCtnr
    .getGiftCertificatePaymentInstruments()
    .toArray()
    .forEach(function (item) {
      if (item.paymentTransaction && item.paymentTransaction.amount) {
        totalAmount = totalAmount.subtract(item.paymentTransaction.amount);
      }
    });

  return totalAmount;
}

MercadoPago.prototype.getTotalAmount = getTotalAmount;

/**
 * Constructs payment data object to verify the payment on Mercadopago
 * @param {Order} order - Order Object
 * @param {Object} customer - Customer Object
 * @param {Object} installments - Number of installments
 * @param {string} issuerId - ID of the issuer
 * @param {string} customerID - ID of the customer
 * @return {Object} generated payment data to use in payment call
 */
MercadoPago.prototype.createPaymentData = function (
  order,
  customer,
  installments,
  issuerId,
  customerID,
  otherAdress,
  cc
) {
  // Construct product line items
  var items = collections.map(
    order.allProductLineItems,
    function (prodLineItem) {
      var item = {};

      item.id = prodLineItem.productID;
      item.title = prodLineItem.product.name;

      if (prodLineItem.product.longDescription) {
        item.description = prodLineItem.product.longDescription.markup;
      }

      if (prodLineItem.product.classificationCategory) {
        item.category_id = prodLineItem.product.classificationCategory.ID;
      }

      item.quantity = prodLineItem.quantityValue;
      item.unit_price = prodLineItem.adjustedGrossPrice.value;

      return item;
    }
  );
  var payer;

  if (otherAdress === 'undefined') {
    payer = {
      address: {
        street_name:
          order.billingAddress.address1 +
          '-' +
          order.billingAddress.city +
          '-' +
          order.billingAddress.countryCode,
        street_number: '0',
        zip_code: order.billingAddress.postalCode
      },
      first_name: order.billingAddress.firstName,
      last_name: order.billingAddress.lastName,
      phone: {
        area_code: '-',
        number: order.billingAddress.phone
      }
    };

  } else {
  // Payer billing information for payer
  payer = {
    address: {
      street_name:
      otherAdress.apartment +
        "-" +
        otherAdress.city,
      street_number: otherAdress.via +
      "-" + otherAdress.n1 +"-" + otherAdress.n2 +"-" + otherAdress.n3 +"-" + otherAdress.piso
    },
    first_name: order.billingAddress.firstName,
    last_name: order.billingAddress.lastName,
    phone: {
      area_code: "-",
      number: order.billingAddress.phone,
    }
  };

  }

  // Customer information
  var paymentPayer = {};
  if (customerID) {
    paymentPayer.id = customerID; // Required for registered customer
    paymentPayer.type = 'customer';
  }

  paymentPayer.email = order.customerEmail;


  if (customer.isAuthenticated()) {
    payer.registration_date = customer.profile.getCreationDate();
  }

  // Payment method id and token
  var paymentMethodId;
  var token;
  var docType;
  var docNumber;
  var paymentTypeId;
  var financialInstitution;

  collections.forEach(order.getPaymentInstruments(), function (payInstrument) {
    if (
      payInstrument.paymentMethod !==
      Resource.msg('payment.method.id', 'mercadoPagoPreferences', null)
    ) {
      return;
    }

    paymentMethodId = payInstrument.creditCardType;
    token = payInstrument.creditCardToken;
    docType = 'CC';
    if (cc === 'undefined') {
      docNumber = order.billingAddress.custom.cedulaCiudadana ? order.billingAddress.custom.cedulaCiudadana.substring(0, 10): null;
    } else {
      docNumber = cc;
    }
    financialInstitution = payInstrument.custom.mercadoPagoFinancialInstitution;
    paymentTypeId = payInstrument.custom.mercadoPagoPaymentTypeId;
  });

  if (!token) {
    paymentPayer.first_name = order.billingAddress.firstName;
    paymentPayer.last_name = order.billingAddress.lastName;

    if (docType && docNumber) {
      paymentPayer.identification = {
        type: docType,
        number: docNumber
      };
    }
  }

  var transactionAmount = getTotalAmount(order);

  var payDataObj = {
    payer: paymentPayer,
    external_reference: order.orderNo,
    additional_info: {
      items: items,
      payer: payer,
      shipments: {
        receiver_address: {
          apartment: '-',
          floor: '-',
          street_name:
            order.defaultShipment.shippingAddress.address1 +
            '-' +
            order.defaultShipment.shippingAddress.city +
            '-' +
            order.defaultShipment.shippingAddress.countryCode,
          street_number: '0',
          zip_code: order.defaultShipment.shippingAddress.postalCode
        }
      }
    },
    installments: 1,
    payment_method_id: paymentMethodId, // Required
    token: token, // Required only for credit card payments
    transaction_amount: transactionAmount.value,
    notification_url: URLUtils.https(
      'MercadoPago-MercadoPagoPaymentNotification'
    ).toString()
  };

  // Set issuer id
  if (issuerId !== 0) {
    payDataObj.issuer_id = issuerId;
  }

  // Set installments if they are greater than 1
  if (installments !== 1) {
    payDataObj.installments = installments;
  }

  if (paymentTypeId === 'bank_transfer' || paymentTypeId === 'ticket') {
    payDataObj.callback_url = URLUtils.https(
      'MercadoPago-MercadoPagoReturnURL',
      'ID',
      order.orderNo,
      'token',
      order.orderToken
    ).toString();
    payDataObj.payer.entity_type = 'individual';
    payDataObj.additional_info.ip_address =
      request.httpHeaders['x-is-remote_addr'];
  }

  if (paymentMethodId === 'pse') {
    payDataObj.transaction_details = {
      financial_institution: financialInstitution
    };
  }

  if (paymentMethodId === 'webpay') {
    payDataObj.transaction_details = {
      financial_institution: 1234 // harcoded by documentation
    };
  }
  var localeID = order.customerLocaleID;
  var siteDefaultLocaleID = Site.getCurrent().getDefaultLocale();
  if (
    MercadoPagoHelper.getPreferences().enableSendTaxes &&
    (localeID === 'es_CO' ||
      (localeID === 'default' && siteDefaultLocaleID === 'es_CO'))
  ) {
    payDataObj.net_amount = order.getTotalNetPrice().getValue();
    payDataObj.taxes = [
      {
        value: order.getTotalTax().getValue(),
        type: 'IVA'
      }
    ];
  }

  return payDataObj;
};

/**
 * @description Parse and returns the status of Order
 * @param {string} status - Response status from Mercado Pago
 * @returns {string} returnStatus classified status as string result
 */
MercadoPago.prototype.parseOrderStatus = function (status,paymentId) {
  var pendingStatuses = {
    pending: Resource.msg('status.pending', 'mercadoPago', null),
    in_process: Resource.msg('status.in_process', 'mercadoPago', null),
    in_mediation: Resource.msg('status.in_mediation', 'mercadoPago', null)
  };
  var approvedStatuses = {
    approved: Resource.msg('status.approved', 'mercadoPago', null)
  };
  var rejectedStatuses = {
    rejected: Resource.msg('status.rejected', 'mercadoPago', null),
    cancelled: Resource.msg('status.cancelled', 'mercadoPago', null)
  };
  var returnStatus = pendingStatuses[status] ? 'declined' : '';

  if (!returnStatus) {
    returnStatus = approvedStatuses[status] ? 'authorized' : '';
  }

  if (!returnStatus) {
    returnStatus = rejectedStatuses[status] ? 'declined' : '';
  }

  if (paymentId === 'efecty' && status === 'pending') {
    returnStatus = 'pending';
  }

  return returnStatus;
};

/**
 * @description Get stored cards on Mercadopago side with current authenticated customer
 * @param {Object} currentCustomer - current authenticated customer
 * @returns {Array} array of objects which holds customer cards data
 */
MercadoPago.prototype.getCustomerCards = function (currentCustomer) {
  // if (!currentCustomer.raw.authenticated || !currentCustomer.raw.registered) {
  //   return null;
  // }

  var customerSearch = this.searchCustomer({
    email: currentCustomer.profile.email
  });

  if (!customerSearch) {
    return null;
  }

  var foundCustomer = array.find(customerSearch.results, function (customer) {
    return customer.email === currentCustomer.profile.email;
  });

  if (!foundCustomer || !foundCustomer.cards.length) {
    return null;
  }

  return foundCustomer.cards;
};

MercadoPago.prototype.getOtherPaymentMode = function () {
  return MercadoPagoHelper.getPreferences().otherPaymentMode;
};

module.exports = MercadoPago;
