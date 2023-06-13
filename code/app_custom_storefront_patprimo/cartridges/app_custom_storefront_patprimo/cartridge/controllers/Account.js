'use strict';

/**
 * @namespace Account
 */

var server = require('server');
server.extend(module.superModule);
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.append(
  'Show',
  server.middleware.https,
  userLoggedIn.validateLoggedIn,
  consentTracking.consent,
  function (req, res, next) {
      var CustomerMgr = require('dw/customer/CustomerMgr');
      var Resource = require('dw/web/Resource');
      var URLUtils = require('dw/web/URLUtils');
      var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
      var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
      var reportingURLs;

      // Get reporting event Account Open url
      if (req.querystring.registration && req.querystring.registration === 'submitted') {
          reportingURLs = reportingUrlsHelper.getAccountOpenReportingURLs(
              CustomerMgr.registeredCustomerCount
          );
      }

      var accountModel = accountHelpers.getAccountModel(req);
      var currentCustomer = req.currentCustomer.raw.profile;
      var profileForm = server.forms.getForm('profile');
      profileForm.clear();
      profileForm.customer.firstname.value = accountModel.profile.firstName;
      profileForm.customer.lastname.value = accountModel.profile.lastName;
      profileForm.customer.phone.value = accountModel.profile.phone;
      profileForm.customer.email.value = accountModel.profile.email;
      profileForm.customer.documentoIdentidad.value = accountModel.profile.documentoIdentidad;
      profileForm.customer.genero.value = currentCustomer.gender.value === 1 ? 'Hombre': 'Mujer';
      profileForm.customer.birthday.value = currentCustomer.birthday;

      res.render('account/profile', {
          account: accountModel,
          accountlanding: true,
          profileForm: profileForm,
          breadcrumbs: [
              {
                  htmlValue: Resource.msg('global.home', 'common', null),
                  url: URLUtils.home().toString()
              }
          ],
          reportingURLs: reportingURLs,
          payment: accountModel.payment,
          viewSavedPaymentsUrl: URLUtils.url('PaymentInstruments-List').toString(),
          addPaymentUrl: URLUtils.url('PaymentInstruments-AddPayment').toString()
      });
      next();
  }
);

server.post(
  'Verify',
  server.middleware.https,
  csrfProtection.validateAjaxRequest,
  function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var email = req.form.loginEmail;

    // Verificacion de correo
    var customerLoginResult = accountHelpers.loginVerify(email);

    // Envio de pantalla de registro
    if (customerLoginResult.registered === false) {
      res.json({
        message: [Resource.msg('text.sesion.register', 'login', null)],
        user: email
      });

      return next();
    }

    // success pantalla de password o codigo
    if (customerLoginResult.registered === true) {
      res.json({
        success: true,
        user: email,
        message: [Resource.msg('text.sesion.confirm', 'login', null)]
      });
    } else {
      // Error
      res.json({
        error: [Resource.msg('error.message.login.form.sp', 'login', null)],
        user: email
      });
    }

    return next();
  }
);

server.post(
  'SendCode',
  server.middleware.https,
  function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var email = req.form.data;
    email = email;

    // Verificacion de correo
    var customerLoginResult = accountHelpers.loginVerify(email);

    // success pantalla de password o codigo
    if (customerLoginResult.registered === true) {
      
      res.json({
        success: true,
        user: email,
        message: [Resource.msg('text.sesion.confirm', 'login', null)]
      });
    } else {
      // Error
      res.json({
        error: [Resource.msg('error.message.login.form.sp', 'login', null)],
        user: email
      });
    }

    return next();
  }
);
server.post(
  'Confirm',
  server.middleware.https,
  csrfProtection.validateAjaxRequest,
  function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');

    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var email = req.form.formEmail;
    var password = req.form.loginPassword;
    var rememberMe = req.form.loginRememberMe
      ? !!req.form.loginRememberMe
      : false;
    // Validacion de logueo
    var customerLoginResult = accountHelpers.loginCustomerCustom(
      email,
      password,
      rememberMe
    );

    // Error de logueo
    if (customerLoginResult.error) {
      if (customerLoginResult.status === 'ERROR_CUSTOMER_LOCKED') {
        var context = {
          customer: CustomerMgr.getCustomerByLogin(email) || null
        };

        var emailObj = {
          to: email,
          subject: Resource.msg('subject.account.locked.email', 'login', null),
          from:
            Site.current.getCustomPreferenceValue('customerServiceEmail') ||
            'no-reply@testorganization.com',
          type: emailHelpers.emailTypes.accountLocked
        };

        hooksHelper(
          'app.customer.email',
          'sendEmail',
          [emailObj, 'account/accountLockedEmail', context],
          function () {}
        );
      }

      res.json({
        error: [
          customerLoginResult.errorMessage ||
            Resource.msg('error.message.login.form.sp', 'login', null)
        ]
      });

      return next();
    }

    // loguin exitoso
    if (customerLoginResult.authenticatedCustomer) {
      res.setViewData({
        authenticatedCustomer: customerLoginResult.authenticatedCustomer
      });
      res.json({
        success: true,
        redirectUrl: accountHelpers.getLoginRedirectURL(
          req.querystring.rurl,
          req.session.privacyCache,
          false
        ),
        customerNo: 'profile' in customerLoginResult.authenticatedCustomer ? customerLoginResult.authenticatedCustomer.profile.customerNo : customerLoginResult.authenticatedCustomer.customer.profile.customerNo
      });

      req.session.privacyCache.set('args', null);
    } else {
      res.json({
        error: [Resource.msg('error.message.login.form.sp', 'login', null)]
      });
    }

    return next();
  }
);

server.post(
  'SubmitRegistrationCustom',
  server.middleware.https,
  csrfProtection.validateAjaxRequest,
  function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');

    var formErrors = require('*/cartridge/scripts/formErrors');

    var registrationForm = server.forms.getForm('profile');

    // form validation
    if (
      registrationForm.customer.email.value.toLowerCase() !==
      registrationForm.customer.emailconfirm.value.toLowerCase()
    ) {
      registrationForm.customer.email.valid = false;
      registrationForm.customer.emailconfirm.valid = false;
      registrationForm.customer.emailconfirm.error = Resource.msg(
        'error.message.mismatch.email',
        'forms',
        null
      );
      registrationForm.valid = false;
    }

    if (
      registrationForm.login.password.value !==
      registrationForm.login.passwordconfirm.value
    ) {
      registrationForm.login.password.valid = false;
      registrationForm.login.passwordconfirm.valid = false;
      registrationForm.login.passwordconfirm.error = Resource.msg(
        'error.message.mismatch.password',
        'forms',
        null
      );
      registrationForm.valid = false;
    }

    if (
      !CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)
    ) {
      registrationForm.login.password.valid = false;
      registrationForm.login.passwordconfirm.valid = false;
      registrationForm.login.passwordconfirm.error = Resource.msg(
        'error.message.password.constraints.not.matched',
        'forms',
        null
      );
      registrationForm.valid = false;
    }

    // setting variables for the BeforeComplete function
    var registrationFormObj = {
      firstName: registrationForm.customer.firstname.value,
      lastName: registrationForm.customer.lastname.value,
      phone: registrationForm.customer.phone.value,
      email: registrationForm.customer.email.value,
      emailConfirm: registrationForm.customer.emailconfirm.value,
      password: registrationForm.login.password.value,
      passwordConfirm: registrationForm.login.passwordconfirm.value,
      validForm: registrationForm.valid,
      form: registrationForm,
      birthday: registrationForm.customer.birthday.value ? new Date(registrationForm.customer.birthday.htmlValue): null,
      genero: registrationForm.customer.gender.value ? registrationForm.customer.gender.value : null
    };

    if (registrationForm.valid) {
      res.setViewData(registrationFormObj);

      this.on('route:BeforeComplete', function (req, res) {
        // eslint-disable-line no-shadow
        var Transaction = require('dw/system/Transaction');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var authenticatedCustomer;
        var serverError;

        // getting variables for the BeforeComplete function
        var registrationForm = res.getViewData(); // eslint-disable-line

        if (registrationForm.validForm) {
          var login = registrationForm.email;
          var password = registrationForm.password;

          // attempt to create a new user and log that user in.
          try {
            Transaction.wrap(function () {
              var error = {};
              var newCustomer = CustomerMgr.createCustomer(login, password);

              var authenticateCustomerResult = CustomerMgr.authenticateCustomer(
                login,
                password
              );
              if (authenticateCustomerResult.status !== 'AUTH_OK') {
                error = {
                  authError: true,
                  status: authenticateCustomerResult.status
                };
                throw error;
              }

              authenticatedCustomer = CustomerMgr.loginCustomer(
                authenticateCustomerResult,
                false
              );

              if (!authenticatedCustomer) {
                error = {
                  authError: true,
                  status: authenticateCustomerResult.status
                };
                throw error;
              } else {
                // assign values to the profile
                var newCustomerProfile = newCustomer.getProfile();
                var dateRegistro = new Date();

                newCustomerProfile.firstName = registrationForm.firstName;
                newCustomerProfile.lastName = registrationForm.lastName;
                // information custom
                newCustomerProfile.custom.documentoIdentidad= registrationForm.form.customer.documentoIdentidad.value;
                newCustomerProfile.custom.tipoDocumentoIdentidad= registrationForm.form.customer.tipoDocumentoIdentidad.value;
                newCustomerProfile.custom.fechaAltaClienteWeb = dateRegistro;
                newCustomerProfile.custom.isNewsletterOptIn = true;
                newCustomerProfile.custom.ip = req.httpHeaders.get('true-client-ip');
                newCustomerProfile.custom.fechaTerminosCondiciones = dateRegistro;
                newCustomerProfile.phoneHome = registrationForm.phone;
                newCustomerProfile.email = registrationForm.email;
                newCustomerProfile.credentials.authenticationProviderID =
                  'AuthCode';
                newCustomerProfile.credentials.externalID =
                  registrationForm.email;
                newCustomerProfile.gender = registrationForm.genero;
                newCustomerProfile.birthday = registrationForm.birthday;
              }
            });
          } catch (e) {
            if (e.authError) {
              serverError = true;
            } else {
              registrationForm.validForm = false;
              registrationForm.form.customer.email.valid = false;
              registrationForm.form.customer.emailconfirm.valid = false;
              registrationForm.form.customer.email.error = Resource.msg(
                'error.message.username.invalid',
                'forms',
                null
              );
            }
          }
        }

        delete registrationForm.password;
        delete registrationForm.passwordConfirm;
        formErrors.removeFormValues(registrationForm.form);

        if (serverError) {
          res.setStatusCode(500);
          res.json({
            success: false,
            errorMessage: Resource.msg(
              'error.message.unable.to.create.account',
              'login',
              null
            )
          });

          return;
        }

        if (registrationForm.validForm) {
          // send a registration email
          accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);

          res.setViewData({ authenticatedCustomer: authenticatedCustomer });
          res.json({
            success: true,
            redirectUrl: accountHelpers.getLoginRedirectURL(
              req.querystring.rurl,
              req.session.privacyCache,
              true
            ),
            customerNo: authenticatedCustomer.profile.customerNo

          });

          req.session.privacyCache.set('args', null);
        } else {
          res.json({
            fields: formErrors.getFormErrors(registrationForm)
          });
        }
      });
    } else {
      res.json({
        fields: formErrors.getFormErrors(registrationForm)
      });
    }

    return next();
  }
);

server.get(
  'EditProfileCustom',
  server.middleware.https,
  csrfProtection.generateToken,
  consentTracking.consent,
  function (req, res, next) {
      var Template = require('dw/util/Template');
      var ContentMgr = require('dw/content/ContentMgr');
      var Resource = require('dw/web/Resource');
      var URLUtils = require('dw/web/URLUtils');
      var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
      var email = req.httpParameterMap.email.value;
      var accountModel = accountHelpers.getAccountModel(req,email);
      var content = ContentMgr.getContent('tracking_hint');
      var openModalUpdate = false;
  
      var profileForm = server.forms.getForm('profile');
      profileForm.clear();
     
      profileForm.customer.firstname.value = accountModel.profile.firstName;
      profileForm.customer.lastname.value = accountModel.profile.lastName;
      profileForm.customer.phone.value = accountModel.profile.phone;
      profileForm.customer.email.value = accountModel.profile.email;
      profileForm.customer.documentoIdentidad.value = accountModel.profile.documentoIdentidad;
      profileForm.customer.tipoDocumentoIdentidad.value = accountModel.profile.tipoDocumentoIdentidad;
      profileForm.customer.nameCompany.value =  accountModel.profile.nombre_empresa
      profileForm.customer.nit.value =  accountModel.profile.nit
      profileForm.customer.razonSocial.value =  accountModel.profile.razon_social;
      profileForm.customer.responsableIVA.value =  accountModel.profile.responsable_iva
     
      if (!accountModel.profile.documentoIdentidad) {
          openModalUpdate = true;
      }

    
      res.render('account/editProfileForm', {
            profileForm: profileForm,
            openModalUpdate : openModalUpdate})
     
      next();
  }
);

server.append(
  'EditProfile',
  server.middleware.https,
  csrfProtection.generateToken,
  userLoggedIn.validateLoggedIn,
  consentTracking.consent,
  function (req, res, next) {
      var ContentMgr = require('dw/content/ContentMgr');
      var Resource = require('dw/web/Resource');
      var URLUtils = require('dw/web/URLUtils');
      var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');

      var accountModel = accountHelpers.getAccountModel(req);
      var content = ContentMgr.getContent('tracking_hint');
      var profileForm = server.forms.getForm('profile');
      profileForm.clear();
      profileForm.customer.firstname.value = accountModel.profile.firstName;
      profileForm.customer.lastname.value = accountModel.profile.lastName;
      profileForm.customer.phone.value = accountModel.profile.phone;
      profileForm.customer.email.value = accountModel.profile.email;
      profileForm.customer.documentoIdentidad.value = accountModel.profile.documentoIdentidad;
      profileForm.customer.tipoDocumentoIdentidad.value = accountModel.profile.tipoDocumentoIdentidad;
      res.render('account/profile', {
          consentApi: Object.prototype.hasOwnProperty.call(req.session.raw, 'setTrackingAllowed'),
          caOnline: content ? content.online : false,
          profileForm: profileForm,
          breadcrumbs: [
              {
                  htmlValue: Resource.msg('global.home', 'common', null),
                  url: URLUtils.home().toString()
              },
              {
                  htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                  url: URLUtils.url('Account-Show').toString()
              }
          ]
      });
      next();
  }
);

server.replace(
  'SaveProfile',
  server.middleware.https,
  csrfProtection.validateAjaxRequest,
  function (req, res, next) {
      var Transaction = require('dw/system/Transaction');
      var CustomerMgr = require('dw/customer/CustomerMgr');
      var Resource = require('dw/web/Resource');
      var URLUtils = require('dw/web/URLUtils');
      var BasketMgr = require('dw/order/BasketMgr');
      var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
      var currentBasket = BasketMgr.getCurrentBasket();

      var formErrors = require('*/cartridge/scripts/formErrors');

      var profileForm = server.forms.getForm('profile');
      profileForm.valid=true;

      var result = {
          firstName: profileForm.customer.firstname.value,
          lastName: profileForm.customer.lastname.value,
          phone: profileForm.customer.phone.value,
          email: profileForm.customer.email.value,
          confirmEmail: profileForm.customer.emailconfirm.value,
          password: profileForm.login.password.value,
          profileForm: profileForm
      };
      if (profileForm.valid) {
          res.setViewData(result);
          this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
              var formInfo = res.getViewData();
              var customer;
              if (req.currentCustomer && req.currentCustomer.profile && req.currentCustomer.profile.customerNo) {
                  customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                  );
              } else {
                customer = CustomerMgr.queryProfile('email = {0}', formInfo.email);
                customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo:'');
              }
              
              var profile = customer.getProfile();
              var customerLogin;
              var status = {};

             
              customerLogin = true;
              delete formInfo.password;
              delete formInfo.confirmEmail;
              

              if (customerLogin) {
                if (!req.form.isCheckoutPage) {
                  Transaction.wrap(function () {
                      profile.setFirstName(formInfo.firstName);
                      profile.setLastName(formInfo.lastName);
                      profile.setEmail(formInfo.email);
                      profile.setPhoneHome(formInfo.phone);
                      profile.custom.documentoIdentidad = formInfo.profileForm.customer.documentoIdentidad.value;
                      profile.custom.tipoDocumentoIdentidad = formInfo.profileForm.customer.tipoDocumentoIdentidad.value;
                      profile.setGender(req.form.dwfrm_profile_customer_genero);
                      profile.birthday = new Date(formInfo.profileForm.customer.birthday.htmlValue);
                  });
                } else {
                  Transaction.wrap(function () {
                    profile.setFirstName(formInfo.firstName);
                    profile.setLastName(formInfo.lastName);
                    profile.setEmail(formInfo.email);
                    profile.setPhoneHome(formInfo.phone);
                    profile.custom.documentoIdentidad = formInfo.profileForm.customer.documentoIdentidad.value;
                    profile.custom.tipoDocumentoIdentidad = formInfo.profileForm.customer.tipoDocumentoIdentidad.value;
                    profile.custom.razon_social = formInfo.profileForm.customer.razonSocial.value;
                    profile.custom.corporateDocument = formInfo.profileForm.customer.nit.value;
                    profile.custom.corporateName = formInfo.profileForm.customer.nameCompany.value;
                    profile.custom.isResponsableIVA = formInfo.profileForm.customer.responsableIVA.value ? true: false;
                    profile.custom.isCorporate = formInfo.profileForm.customer.nameCompany.value ? true: false;
                   if (currentBasket && formInfo.profileForm.customer.razonSocial.value) {
                      if (!currentBasket.billingAddress) {
                          currentBasket.createBillingAddress();
                      }
                      currentBasket.billingAddress.custom.nit = formInfo.profileForm.customer.nit.value
                      currentBasket.billingAddress.custom.razon_social = formInfo.profileForm.customer.razonSocial.value;
                      currentBasket.billingAddress.custom.nombre_empresa = formInfo.profileForm.customer.nameCompany.value
                   }
                  });
                }

                  // Send account edited email
                  accountHelpers.sendAccountEditedEmail(customer.profile);

                  delete formInfo.profileForm;
                  delete formInfo.email;

                  res.json({
                      success: true,
                      redirectUrl: URLUtils.url('Account-Show').toString()
                  });
              } else {
                  if (!status.error) {
                      formInfo.profileForm.customer.email.valid = false;
                      formInfo.profileForm.customer.email.error =
                          Resource.msg('error.message.username.invalid', 'forms', null);
                  }

                  delete formInfo.profileForm;
                  delete formInfo.email;

                  res.json({
                      success: false,
                      fields: formErrors.getFormErrors(profileForm)
                  });
              }
          });
      } else {
          res.json({
              success: false,
              fields: formErrors.getFormErrors(profileForm)
          });
      }
      return next();
  }
);

server.replace(
  'Login',
  server.middleware.https,
  csrfProtection.validateAjaxRequest,
  function (req, res, next) {
      var CustomerMgr = require('dw/customer/CustomerMgr');
      var Resource = require('dw/web/Resource');
      var Site = require('dw/system/Site');

      var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
      var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
      var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

      var email = req.form.loginEmail;
      var password = req.form.loginPassword;
      var rememberMe = req.form.loginRememberMe
          ? (!!req.form.loginRememberMe)
          : false;

      var customerLoginResult = accountHelpers.loginCustomer(email, password, rememberMe);

      if (customerLoginResult.error) {
          if (customerLoginResult.status === 'ERROR_CUSTOMER_LOCKED') {
              var context = {
                  customer: CustomerMgr.getCustomerByLogin(email) || null
              };

              var emailObj = {
                  to: email,
                  subject: Resource.msg('subject.account.locked.email', 'login', null),
                  from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
                  type: emailHelpers.emailTypes.accountLocked
              };

              hooksHelper('app.customer.email', 'sendEmail', [emailObj, 'account/accountLockedEmail', context], function () {});
          }

          res.json({
              error: [customerLoginResult.errorMessage || Resource.msg('error.message.login.form', 'login', null)]
          });

          return next();
      }

      if (customerLoginResult.authenticatedCustomer) {
          var Site = require('dw/system/Site');
          var customPreferences = Site.current.preferences.custom;
          var gtm_id = customPreferences.gtm_id;
          res.setViewData({ 
              authenticatedCustomer: customerLoginResult.authenticatedCustomer,
              gtm_id: gtm_id
           });
          res.json({
              success: true,
              redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, false)
          });

          req.session.privacyCache.set('args', null);
      } else {
          res.json({ error: [Resource.msg('error.message.login.form', 'login', null)] });
      }

      return next();
  }
);

server.get(
  'FastReg',
  server.middleware.https,
  function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var Transaction = require('dw/system/Transaction');
    var authenticatedCustomer;
    var serverError;
    var email = req.querystring.email;
    var tempPass = "";
    var num = 8;
    const characters = "0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < num; i++) {
      tempPass += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    var authenticateCustomerResult = CustomerMgr.getCustomerByLogin(email);
    if (!authenticateCustomerResult) {
        authenticateCustomerResult = CustomerMgr.queryProfile('email = {0}', email);
    }
    if (!authenticateCustomerResult) {
      try {
        Transaction.wrap(function () {
          var error = {};
          var newCustomer = CustomerMgr.createCustomer(email, tempPass);
  
          var authenticateCustomerResult = CustomerMgr.authenticateCustomer(
            email,
            tempPass
          );
          if (authenticateCustomerResult.status !== 'AUTH_OK') {
            error = {
              authError: true,
              status: authenticateCustomerResult.status
            };
            throw error;
          }
  
          authenticatedCustomer = CustomerMgr.loginCustomer(
            authenticateCustomerResult,
            false
          );
  
          if (!authenticatedCustomer) {
            error = {
              authError: true,
              status: authenticateCustomerResult.status
            };
            throw error;
          } else {
            // assign values to the profile
            var newCustomerProfile = newCustomer.getProfile();
            var dateRegistro = new Date();
  
            newCustomerProfile.custom.fechaAltaClienteWeb = dateRegistro;
            newCustomerProfile.custom.isNewsletterOptIn = true;
            newCustomerProfile.custom.ip = req.httpHeaders.get('true-client-ip');
            newCustomerProfile.custom.fechaTerminosCondiciones = dateRegistro;
            newCustomerProfile.email = email;
            newCustomerProfile.credentials.authenticationProviderID = 'AuthCode';
            newCustomerProfile.credentials.externalID = email;
          }
        });
        
        accountHelpers.sendCreateFastAccountEmail(authenticatedCustomer.profile, tempPass);
        CustomerMgr.logoutCustomer(false);

        res.json({
        success: true,
        user: email,
        message: Resource.msg('email.register','account',null),
        redirectUrl: URLUtils.url('Account-ConfirmReg').toString()
      });

      } catch (e) {
        if (e.authError) {
          serverError = true;
        } else {
          res.json({
            error:e,
            error2:e.authError
          });
        }
      }

    }else{
      res.json({
        success: false,
        user: email,
        message: Resource.msg('email.error','account',null)
      });
    }
    return next();
  });

  server.get(
    'ConfirmReg',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        res.render('account/confirmreg', {});
        return next();
    }
);

module.exports = server.exports();