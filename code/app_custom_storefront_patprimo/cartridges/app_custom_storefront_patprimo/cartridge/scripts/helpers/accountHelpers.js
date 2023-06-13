"use strict";

var base = module.superModule;
var URLUtils = require("dw/web/URLUtils");
var endpoints = require("*/cartridge/config/oAuthRenentryRedirectEndpoints");

// Verificacion de correo
function loginVerify(email) {
  var Transaction = require("dw/system/Transaction");
  var CustomerMgr = require("dw/customer/CustomerMgr");
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");
  var Resource = require("dw/web/Resource");
  var code = "";
  var num = 6;
  const characters = "0123456789";
  const charactersLength = characters.length;
  

  return Transaction.wrap(function () {
    var authenticateCustomerResult = CustomerMgr.getCustomerByLogin(email);
    if (!authenticateCustomerResult) {
        authenticateCustomerResult = CustomerMgr.queryProfile('email = {0}', email);
    }
    var registered = true;
    if (!authenticateCustomerResult) {
      registered = false;
      return {
        registered: registered,
        email: email,
      };
    } else {
      //validacion de customer
      var searchCustomer = CustomObjectMgr.getCustomObject("codeAuth", email);

      //creacion de codigo random
      for (let i = 0; i < num; i++) {
        code += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      //creacion/actualizacion de customer en custom objects
      if (!searchCustomer) {
        var insert = CustomObjectMgr.createCustomObject("codeAuth", email);
        insert.custom.code = code;
      } else {
        searchCustomer.custom.code = code;
      }

      //envio de mail
      sendCodeEmail(email, code);

      return {
        registered: registered,
        email: email,
      };
    }
  });
}

// Envio de mail con codigo
function sendCodeEmail(email, code) {
  var emailHelpers = require("*/cartridge/scripts/helpers/codeEmail");
  var Site = require("dw/system/Site");
  var Resource = require("dw/web/Resource");

  var userObject = {
    code: code,
  };

  var emailObj = {
    to: email,
    subject: Resource.msg("text.send.mail", "login", null),
    from:
      Site.current.getCustomPreferenceValue("customerServiceEmail") ||
      "no-reply@testorganization.com",
  };

  emailHelpers.sendEmail(emailObj, "account/codeEmail", userObject);
}

function loginCustomerCustom(email, password, rememberMe) {
  var Transaction = require("dw/system/Transaction");
  var CustomerMgr = require("dw/customer/CustomerMgr");
  var Resource = require("dw/web/Resource");
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");
  var authenticatedCustomer;
  return Transaction.wrap(function () {
    var authenticateCustomerResult = CustomerMgr.authenticateCustomer(
      email,
      password
    );

    //recuperando codigo desde el custom objects
    var searchCustomer = CustomObjectMgr.getCustomObject("codeAuth", email);
    var codePass = searchCustomer.custom.code;
    var codeStatus = "ERROR";
    var useCode = false;
    //Validacion de codigo en mail
    if (codePass == password) {
      var codeStatus = "AUTH_OK";
      var useCode = true;
    }

    if (
      authenticateCustomerResult.status !== "AUTH_OK" &&
      codeStatus !== "AUTH_OK"
    ) {
      var errorCodes = {
        ERROR_CUSTOMER_DISABLED: "error.message.account.disabled",
        ERROR_CUSTOMER_LOCKED: "error.message.account.locked",
        ERROR_CUSTOMER_NOT_FOUND: "error.message.login.form.sp",
        ERROR_PASSWORD_EXPIRED: "error.message.password.expired",
        ERROR_PASSWORD_MISMATCH: "error.message.password.mismatch",
        ERROR_UNKNOWN: "error.message.error.unknown",
        default: "error.message.login.form.sp",
      };

      var errorMessageKey =
        errorCodes[authenticateCustomerResult.status] || errorCodes.default;
      var errorMessage = Resource.msg(errorMessageKey, "login", null);

      return {
        error: true,
        errorMessage: errorMessage,
        status: authenticateCustomerResult.status,
        authenticatedCustomer: null,
      };
    }
    //Login desde External Profiles
    if (useCode) {
      authenticatedCustomer = CustomerMgr.loginExternallyAuthenticatedCustomer(
        "AuthCode",
        email,
        rememberMe
      );
      if (!authenticatedCustomer) {
          authenticatedCustomer =  CustomerMgr.getExternallyAuthenticatedCustomerProfile(
          searchCustomer.custom.oauthProviderID,
          searchCustomer.custom.userID
          );
          var credentials = authenticatedCustomer.getCredentials();
          if (credentials.isEnabled()) {
            Transaction.wrap(function () {
                CustomerMgr.loginExternallyAuthenticatedCustomer(searchCustomer.custom.oauthProviderID, searchCustomer.custom.userID, false);
            });
        } else {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });
      
            return next();
        }
      }
  
    } else {
      //Login default
      authenticatedCustomer = CustomerMgr.loginCustomer(
        authenticateCustomerResult,
        rememberMe
      );
    }

    return {
      error: false,
      errorMessage: null,
      status: authenticateCustomerResult.status,
      authenticatedCustomer: authenticatedCustomer,
    };
  });
}

function createCustomer(email) {
  var Transaction = require("dw/system/Transaction");
  var CustomerMgr = require("dw/customer/CustomerMgr");
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");
  var Resource = require("dw/web/Resource");
  var code = "";
  var num = 6;
  const characters = "0123456789";
  const charactersLength = characters.length;
  

  return Transaction.wrap(function () {
    var authenticateCustomerResult = CustomerMgr.getCustomerByLogin(email);
    if (!authenticateCustomerResult) {
        authenticateCustomerResult = CustomerMgr.queryProfile('email = {0}', email);
    }
    var registered = true;
    if (!authenticateCustomerResult) {
      registered = false;
      return {
        registered: registered,
        email: email
      };
    } else {
      //validacion de customer
      var searchCustomer = CustomObjectMgr.getCustomObject("codeAuth", email);

      //creacion de codigo random
      for (let i = 0; i < num; i++) {
        code += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      //creacion/actualizacion de customer en custom objects
      if (!searchCustomer) {
        var insert = CustomObjectMgr.createCustomObject("codeAuth", email);
        insert.custom.code = code;
      } else {
        searchCustomer.custom.code = code;
      }

      //envio de mail
      sendCodeEmail(email, code);

      return {
        registered: registered,
        email: email,
      };
    }
  });
}

function sendCreateFastAccountEmail(registeredUser, tempPass) {
  var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
  var Site = require('dw/system/Site');
  var Resource = require('dw/web/Resource');

  var userObject = {
      email: registeredUser.email,
      firstName: registeredUser.firstName,
      lastName: registeredUser.lastName,
      passwordCode: tempPass,
      couponCode: 'pashNewUSer',
      url: URLUtils.https('Login-Show')
  };

  var emailObj = {
      to: registeredUser.email,
      subject: Resource.msg('email.subject.new.registration', 'registration', null),
      from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
      type: emailHelpers.emailTypes.registration
  };
 
  emailHelpers.sendEmail(emailObj, 'account/components/accountFastRegisteredEmail', userObject);
}

base.loginCustomerCustom = loginCustomerCustom;
base.sendCodeEmail = sendCodeEmail;
base.loginVerify = loginVerify;
base.createCustomer = createCustomer;
base.sendCreateFastAccountEmail = sendCreateFastAccountEmail;
module.exports = base;