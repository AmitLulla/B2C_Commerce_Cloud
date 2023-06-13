'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get(
    'AddReferido',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var createAccountReferido = URLUtils.url('ReferidosAccount-SubmitRegistrationReferido').relative().toString();

        var profileForm = server.forms.getForm('profileReferido');
        profileForm.clear();

        var Site = require('dw/system/Site');
        var customPreferences = Site.current.preferences.custom;
        var gtm_id = customPreferences.gtm_id;

        res.render('account/components/formReferidos', {
            cuid: req.querystring.cuid,
            createAccountReferido: createAccountReferido,
            profileForm: profileForm,
            gtm_id: gtm_id
        });
        next();
    }
);

server.get(
    'MisReferidos',
    server.middleware.https,
    function (req, res, next) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var customersAhijados = [];
        var URLUtils = require('dw/web/URLUtils');

        if (session.customer.isAuthenticated()) {
            var coQuery = CustomObjectMgr.queryCustomObjects('mis-referidos', "custom.customerPadrino = {0}", null, session.customer.profile.customerNo.toString());
            while (coQuery.hasNext()) {
                var currentCO = coQuery.next();
                customersAhijados.push({
                    fechaReferido: currentCO.custom.fechaReferido,
                    referidoNombre: currentCO.custom.referidoNombre,
                    emailReferido: currentCO.custom.emailReferido,
                    estadoCupon: currentCO.custom.estadoCupon.displayValue,
                    cupon: currentCO.custom.cupon ? currentCO.custom.cupon : ''
                });
            }
            var URLUtils = require('dw/web/URLUtils');
            var urlReferido = URLUtils.https('ReferidosAccount-AddReferido', 'cuid', session.customer.profile.customerNo).toString();

            res.render('referidos/misReferidos', {
                customersAhijados: customersAhijados,
                urlReferido: urlReferido
            });
        } else {
            res.redirect(URLUtils.url('Login-Show'));
        }

        return next();
    }
);

server.get(
    'CheckCustomerEmail',
    server.middleware.https,
    function (req, res, next) {
        var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');
        var Resource = require('dw/web/Resource');

        var customer = misReferidosHelpers.checkCustomerEmail(req.querystring.customerEmail);
        if (!customer) {
            res.setStatusCode(500);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.email.validation.referidos', 'forms', null)
            });
        } else {
            res.json({
                cuid: customer.profile.customerNo
            });
        }
        return next();
    }
);

server.post(
    'SubmitRegistrationReferido',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var formErrors = require('*/cartridge/scripts/formErrors');

        /**
         * Password Info - Depends on Site Customer Lists
         *  Minimum password length: 8 Characters
         *  Minimum Password Special Characters: 1
         *  Password Must Contain Letters: Midex letter case
         *  Password Must Contain Numbers: true
         */

        var passwordCode = '';
        var codelength = 4;
        const uletter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const vletter = "abcdefghijklmnopqrstuvwxyz";
        const numberChar = "0123456789";
        const specialChar = '$%/()[]{}=?!.,-_*|+~#';
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        passwordCode = uletter.charAt(Math.floor(Math.random() * uletter.length));
        passwordCode += numberChar.charAt(Math.floor(Math.random() * numberChar.length));

        for (let index = 0; index < codelength; index++) {
            passwordCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        passwordCode += vletter.charAt(Math.floor(Math.random() * vletter.length));
        passwordCode += specialChar.charAt(Math.floor(Math.random() * specialChar.length));
        var registrationForm = server.forms.getForm('profileReferido');

        registrationForm.customerReferido.password.value = passwordCode;
        registrationForm.customerReferido.passwordconfirm.value = passwordCode;

        if (!CustomerMgr.isAcceptablePassword(registrationForm.customerReferido.password.value)) {
            registrationForm.customerReferido.password.valid = false;
            registrationForm.customerReferido.passwordconfirm.valid = false;
            registrationForm.customerReferido.passwordconfirm.error =
                Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
            registrationForm.valid = false;
        }

        var registrationFormObj = {
            firstName: registrationForm.customerReferido.firstname.value,
            lastName: registrationForm.customerReferido.lastname.value,
            phone: registrationForm.customerReferido.phone.value,
            email: registrationForm.customerReferido.email.value,
            gender: registrationForm.customerReferido.gender.value,
            birthday: registrationForm.customerReferido.birthday.value,
            tipoDocumentoIdentidad: registrationForm.customerReferido.tipoDocumentoIdentidad.value,
            documentoIdentidad: registrationForm.customerReferido.documentoIdentidad.value,
            password: registrationForm.customerReferido.password.value,
            passwordConfirm: registrationForm.customerReferido.passwordconfirm.value,
            validForm: registrationForm.valid,
            form: registrationForm,
            customerPadrino: registrationForm.customerReferido.customerPadrino.value
        };

        if (registrationForm.valid) {
            res.setViewData(registrationFormObj);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var Transaction = require('dw/system/Transaction');
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var authenticatedCustomer;
                var serverError;
                var misReferidosHelpers = require('*/cartridge/scripts/helpers/misReferidosHelpers');
                var newCustomerProfile_temp;

                // getting variables for the BeforeComplete function
                var registrationForm = res.getViewData(); // eslint-disable-line

                if (registrationForm.validForm) {
                    var login = registrationForm.email;
                    var password = registrationForm.password;

                    // attempt to create a new user and log that user in.
                    try {
                        Transaction.wrap(function () {
                            var error = {};

                            var queryC = CustomerMgr.queryProfile("custom.documentoIdentidad = {0} AND custom.tipoDocumentoIdentidad= {1}", registrationForm.documentoIdentidad, registrationForm.tipoDocumentoIdentidad);
                            if(queryC) {
                                error = {
                                    docIdentidadError: true
                                };
                                throw error;
                            }
                            var newCustomer = CustomerMgr.createCustomer(login, password);

                            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                                error = {
                                    authError: true,
                                    status: authenticateCustomerResult.status
                                };
                                throw error;
                            }

                            authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                            if (!authenticatedCustomer) {
                                error = {
                                    authError: true,
                                    status: authenticateCustomerResult.status
                                };
                                throw error;
                            } else {
                                // assign values to the profile
                                var newCustomerProfile = newCustomer.getProfile();
                                var date_birthday = new Date(registrationForm.birthday);
                                var dateRegistro = new Date();

                                newCustomerProfile.firstName = registrationForm.firstName;
                                newCustomerProfile.lastName = registrationForm.lastName;
                                newCustomerProfile.phoneHome = registrationForm.phone;
                                newCustomerProfile.email = registrationForm.email;
                                newCustomerProfile.gender = registrationForm.gender;
                                newCustomerProfile.birthday = date_birthday;
                                newCustomerProfile.custom.tipoDocumentoIdentidad = registrationForm.tipoDocumentoIdentidad,
                                newCustomerProfile.custom.documentoIdentidad = registrationForm.documentoIdentidad;
                                newCustomerProfile.custom.customerPadrino = registrationForm.customerPadrino;
                                newCustomerProfile.custom.fechaAltaClienteWeb = dateRegistro;
                                newCustomerProfile.custom.isNewsletterOptIn = true;
                                newCustomerProfile.custom.ip = req.httpHeaders.get('true-client-ip');
                                newCustomerProfile.custom.fechaTerminosCondiciones = dateRegistro;
                                newCustomerProfile_temp = newCustomerProfile;
                            }
                        });
                    } catch (e) {
                        if (e.authError) {
                            serverError = true;
                        }  else if(e.docIdentidadError){
                            registrationForm.validForm = false;
                            registrationForm.form.customerReferido.documentoIdentidad.valid = false;
                            registrationForm.form.customerReferido.documentoIdentidad.error =  Resource.msg('error.message.documentoIdentidad.invalid', 'forms', null);
                        } else {
                            registrationForm.validForm = false;
                            registrationForm.form.customerReferido.email.valid = false;
                            registrationForm.form.customerReferido.email.error =
                                Resource.msg('error.message.username.invalid', 'forms', null);
                        }
                    }
                }

                formErrors.removeFormValues(registrationForm.form);

                if (serverError) {
                    res.setStatusCode(500);
                    res.json({
                        success: false,
                        errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
                    });

                    return;
                }

                if (registrationForm.validForm) {
                    // send a registration email
                    misReferidosHelpers.assignAhijadoToCustomer(registrationForm.customerPadrino, newCustomerProfile_temp);
                    misReferidosHelpers.sendCreateAccountEmailReferido(authenticatedCustomer.profile, passwordCode);
                    misReferidosHelpers.sendEmailAvisoReferidoCustomerPadrino(registrationForm.customerPadrino, authenticatedCustomer.profile );

                    res.setViewData({
                        authenticatedCustomer: authenticatedCustomer
                    });
                    res.json({
                        success: true,
                        redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true),
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

module.exports = server.exports();