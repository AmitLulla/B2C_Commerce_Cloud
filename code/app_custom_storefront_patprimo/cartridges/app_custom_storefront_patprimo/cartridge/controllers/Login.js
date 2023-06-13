'use strict';

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Resource = require('dw/web/Resource');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

server.replace(
    'Show',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
      var URLUtils = require('dw/web/URLUtils');
      var Resource = require('dw/web/Resource');
  
      var target = req.querystring.rurl || 1;
  
      var userName = '';
      var actionUrl = URLUtils.url('Account-Verify', 'rurl', target);
      var actionUrlConfirm = URLUtils.url('Account-Confirm', 'rurl', target);
      var createAccountUrl = URLUtils.url('Account-SubmitRegistrationCustom', 'rurl', target).relative().toString();
      var sendCode = URLUtils.url('Account-SendCode', 'rurl', target);
  
      if (req.currentCustomer.credentials) {
        userName = req.currentCustomer.credentials.username;
      }
  
      var breadcrumbs = [
        {
          htmlValue: Resource.msg('global.home', 'common', null),
          url: URLUtils.home().toString()
        }
      ];
  
      var profileForm = server.forms.getForm('profile');
      profileForm.clear();
      var Site = require('dw/system/Site');
      var customPreferences = Site.current.preferences.custom;
      var gtm_id = customPreferences.gtm_id;
      
  
      res.render('/account/login', {
        navTabValue: 'login',
        actionUrlConfirm: actionUrlConfirm,
        userName: userName,
        actionUrl: actionUrl,
        profileForm: profileForm,
        breadcrumbs: breadcrumbs,
        oAuthReentryEndpoint: 1,
        createAccountUrl: createAccountUrl,
        sendCode: sendCode,
        gtm_id: gtm_id
      });
  
      next();
    }
  );

server.post(
    'Identificate',
    function (req, res, next) {
        var forData = req.form;
        var CustomerMgr = require("dw/customer/CustomerMgr");
        var identificateForm = server.forms.getForm('identificate');
        var openModalUpdate = false;
        var customer = req.currentCustomer ? req.currentCustomer : false;
        var isUser;
        if (customer.raw.authenticated ) {
            identificateForm.clear()
            if(customer.profile.email) {
                isUser = CustomerMgr.getCustomerByLogin(customer.profile.email)
            }

            if (!isUser && customer.profile.customerNo) {
                isUser = CustomerMgr.getCustomerByCustomerNumber(customer.profile.customerNo)
            }
        } else {
            isUser = CustomerMgr.getCustomerByLogin(identificateForm.email.value)
            if (!isUser) {
                isUser = CustomerMgr.queryProfile('email = {0}', identificateForm.email.value);
                isUser = CustomerMgr.getCustomerByCustomerNumber(isUser ? isUser.customerNo : '');
                
            }
        }
        
        var msj = Resource.msgf('msj.register.modal.succes', 'checkout', null, '@'); 
        var params = new HashMap();
        if (isUser) {
            var data = {email: isUser.profile.email,
                name:isUser.profile.firstName,
                lastName:isUser.profile.lastName,
                email:isUser.profile.email,
                tel:isUser.profile.phoneHome,
                isRegister:isUser.registered,
                msj : msj,
                customerNo: isUser.profile.customerNo
            }
           if (!isUser.profile.custom.documentoIdentidad || !isUser.profile.phoneHome) {
                openModalUpdate = true;
           }
           var lastNameMask = maskString(data, 'lastName');
           session.custom.lastNameMask = lastNameMask;
           var emailMask = maskString(data, 'email');
           session.custom.emailMask = emailMask;
           var telMask = maskString(data, 'tel');
           session.custom.telMask = telMask;
           data.emailMask = req.currentCustomer.raw.authenticated ? data.email :emailMask;
           data.lastNameMask = req.currentCustomer.raw.authenticated ? data.lastName : lastNameMask;
           data.telMask = req.currentCustomer.raw.authenticated ? data.tel : telMask;
            for(var key in data) {
                params.put(key, data[key])
            }
            var infoStage = new Template('checkout/components/infoStage').render(params).text;
            data.infoStage = infoStage;
            data.url = URLUtils.url('GetInfo-GetAddress').toString();
            session.custom.showFormNotRegister = false;
            data.openModalUpdate = openModalUpdate;
            res.json(data)
        } else {
          session.custom.showFormNotRegister = true;
          res.json({isRegister: false})
        }
        next(); 
    }
);

server.replace('Logout', function (req, res, next) {
  var URLUtils = require('dw/web/URLUtils');
  var BasketMgr = require('dw/order/BasketMgr');
  var Transaction = require('dw/system/Transaction');
  var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
  var socialHelper = require('*/cartridge/scripts/helpers/socialSellingHelper');
  var currentBasket = BasketMgr.getCurrentBasket();
  var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var pageID =  req.httpParameterMap;
  if (currentBasket) {
    var infoBasket = socialHelper.getLineItems(currentBasket);
    CustomerMgr.logoutCustomer(false);
    var key = 0, qty, childProducts = [], options = [], result, error = false;
    currentBasket = BasketMgr.getCurrentOrNewBasket();
    for (key in infoBasket) {
      Transaction.wrap(function () {  //create basket
          qty = parseInt(infoBasket[key].qty, 10);
          result = cartHelper.addProductToCart(
              currentBasket,
              infoBasket[key].pid,
              qty,
              childProducts,
              options
          );
          if (!result.error) {
              cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
              basketCalculationHelpers.calculateTotals(currentBasket);
          } else {
              error = true;
          }
      })
    }
  } else {
    CustomerMgr.logoutCustomer(false);
  }
  if ('checkoutPage' in pageID) {
    if (pageID.checkoutPage.value === 'true') {
        res.redirect(URLUtils.url('Checkout-Begin'));
        return next();
    }
  }
  res.redirect(URLUtils.url('Home-Show'));
  next();
});

server.replace('OAuthReentry', server.middleware.https, consentTracking.consent, function (req, res, next) {
  var URLUtils = require('dw/web/URLUtils');
  var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var Transaction = require('dw/system/Transaction');
  var Resource = require('dw/web/Resource');

  var destination = req.session.privacyCache.store.oauthLoginTargetEndPoint;

  var finalizeOAuthLoginResult = oauthLoginFlowMgr.finalizeOAuthLogin();
  if (!finalizeOAuthLoginResult) {
      res.redirect(URLUtils.url('Login-Show'));
      return next();
  }

  var response = finalizeOAuthLoginResult.userInfoResponse.userInfo;
  var oauthProviderID = finalizeOAuthLoginResult.accessTokenResponse.oauthProviderId;

  if (!oauthProviderID) {
      res.render('/error', {
          message: Resource.msg('error.oauth.login.failure', 'login', null)
      });

      return next();
  }

  if (!response) {
      res.render('/error', {
          message: Resource.msg('error.oauth.login.failure', 'login', null)
      });

      return next();
  }

  var externalProfile = JSON.parse(response);
  if (!externalProfile) {
      res.render('/error', {
          message: Resource.msg('error.oauth.login.failure', 'login', null)
      });

      return next();
  }

  var userID = externalProfile.id || externalProfile.uid;
  if (!userID) {
      res.render('/error', {
          message: Resource.msg('error.oauth.login.failure', 'login', null)
      });

      return next();
  }

  var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
      oauthProviderID,
      userID
  );

  var searchCustomer = CustomObjectMgr.getCustomObject("codeAuth", externalProfile.email);
  if (!searchCustomer) {
      Transaction.wrap(function () {
        var insert = CustomObjectMgr.createCustomObject("codeAuth", externalProfile.email);
        insert.custom.oauthProviderID = oauthProviderID;
        insert.custom.userID = userID;
      })
  } else {
      Transaction.wrap(function () {
          searchCustomer.custom.oauthProviderID = oauthProviderID;
          searchCustomer.custom.userID = userID;
      })
  }

  if (!authenticatedCustomerProfile) {
        authenticatedCustomerProfile = CustomerMgr.getCustomerByLogin(externalProfile.email) ? CustomerMgr.getCustomerByLogin(externalProfile.email).getProfile(): null;
        if (authenticatedCustomerProfile && authenticatedCustomerProfile.customer.externallyAuthenticated) {
            oauthProviderID = authenticatedCustomerProfile.customer.externalProfiles[0].authenticationProviderID;
            userID = authenticatedCustomerProfile.customer.externalProfiles[0].externalID;
        }
  }
  
  if (!authenticatedCustomerProfile) {
      // Create new profile
      Transaction.wrap(function () {
          var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
              oauthProviderID,
              userID
          );

          authenticatedCustomerProfile = newCustomer.getProfile();
          var firstName;
          var lastName;
          var email;

          // Google comes with a 'name' property that holds first and last name.
          if (typeof externalProfile.name === 'object') {
              firstName = externalProfile.name.givenName;
              lastName = externalProfile.name.familyName;
          } else {
              // The other providers use one of these, GitHub has just a 'name'.
              firstName = externalProfile['given_name']
                  || externalProfile.first_name
                  || externalProfile.name;

              lastName = externalProfile['family_name']
                  || externalProfile.last_name
                  || externalProfile.name;
          }

          email = externalProfile['email-address'] || externalProfile.email;

          if (!email) {
              var emails = externalProfile.emails;

              if (emails && emails.length) {
                  email = externalProfile.emails[0].value;
              }
          }

          authenticatedCustomerProfile.setFirstName(firstName);
          authenticatedCustomerProfile.setLastName(lastName);
          authenticatedCustomerProfile.setEmail(email);
      });
  }

  var credentials = authenticatedCustomerProfile.getCredentials();
  if (credentials.isEnabled()) {
      Transaction.wrap(function () {
          CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderID, userID, false);
      });
  } else {
      res.render('/error', {
          message: Resource.msg('error.oauth.login.failure', 'login', null)
      });

      return next();
  }

  req.session.privacyCache.clear();
  res.redirect(URLUtils.url(destination));

  return next();
});

function maskString(data, name) {
    var partsEmail = data[name].split('');
    var partsName = data[name].split("");
    var pName = partsName[0] + partsName[1] + partsName[2] + partsName[3];
    var mask = '', limite;
    var sName =  partsName[partsName.length - 1];
    if (name === 'email') {
        limite = (partsEmail.length -4)
        var email = data.email;
        for (var i = 0; i < limite; i++) {
            mask+= '*';
        }
        return email.substring(0,4) + mask + email.substring((email.length -3),(email.length));
    }
    if (name === 'lastName') {
        limite = (partsName.length -2)
        for (var i = 0; i < limite; i++) {
            mask+= '*';
        }
        return pName + mask + sName;
    }
    if (name === 'tel') {
        limite = (partsName.length -4)
        var tel = data.tel;
        for (var i = 0; i < limite; i++) {
            mask+= '*';
        }
        return tel.substring(0,4) + mask + tel.substring((tel.length -3),(tel.length));
    }
}


module.exports = server.exports();