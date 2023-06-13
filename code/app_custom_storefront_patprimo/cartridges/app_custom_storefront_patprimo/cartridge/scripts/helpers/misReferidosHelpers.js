'use strict';
var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');


function assignAhijadoToCustomer(customerNoPadrino, customerAhijadoProfile) {
    var customerP = CustomerMgr.getCustomerByCustomerNumber(customerNoPadrino);
    var profilePadrino = customerP.getProfile();
    var configObj = CustomObjectMgr.getCustomObject('mis-referidos', customerAhijadoProfile.customerNo);
    if (!configObj) {
        Transaction.wrap(function () {
            configObj = CustomObjectMgr.createCustomObject('mis-referidos', customerAhijadoProfile.customerNo);
        });
    }
    Transaction.wrap(function () {
        configObj.custom.customerPadrino = customerNoPadrino;
        configObj.custom.fechaReferido = new Date();
        configObj.custom.referidoNombre = customerAhijadoProfile.firstName + ' ' + customerAhijadoProfile.lastName;
        configObj.custom.emailReferido = customerAhijadoProfile.email;
        configObj.custom.estadoCupon = 'esperandoCompra';
        configObj.custom.cedulaPadrino = profilePadrino.custom.documentoIdentidad;
        configObj.custom.cedulaAhijado = customerAhijadoProfile.custom.documentoIdentidad;
        configObj.custom.nombrePadrino = profilePadrino.firstName + ' ' + profilePadrino.lastName
        profilePadrino.custom.esCustomerPadrino = true;
        customerAhijadoProfile.custom.esCustomerAhijado = true;
    });
}

function esCustomerAhijadoPrimerCompra(customerProfile) {
    var customerProfileA = CustomerMgr.getCustomerByCustomerNumber(customerProfile.customerNo).profile;

    var configObj = CustomObjectMgr.getCustomObject('mis-referidos', customerProfileA.customerNo);
    if (configObj && (configObj.custom.estadoCupon == 'esperandoCompra' || customerProfileA.custom.cuponAhijado != '') && customerProfileA.custom.esCustomerAhijado) {
        return true;
    }
    return false;
}

function getCouponDisponibleAhijado(customerProfile) {
    var customerProfileA = CustomerMgr.getCustomerByCustomerNumber(customerProfile.customerNo).profile;
    var configObj = CustomObjectMgr.getCustomObject('mis-referidos', customerProfileA.customerNo);
    if (configObj && (configObj.custom.estadoCupon == 'esperandoCompra' || customerProfileA.custom.cuponAhijado != '') && customerProfileA.custom.esCustomerAhijado ) {
        return customerProfileA.custom.cuponAhijado;
    }
    return false;

}

function esCustomerPadrinoPrimerCompra(customerProfile) {
    var customerProfileP = CustomerMgr.getCustomerByCustomerNumber(customerProfile.customerNo).profile;

    var coQuery = CustomObjectMgr.queryCustomObjects('mis-referidos', "custom.customerPadrino = {0}", null, customerProfile.customerNo);
    while (coQuery.hasNext()) {
        var currentCO = coQuery.next();
        if (currentCO.custom.estadoCupon == 'cuponDisponible' && customerProfileP.custom.esCustomerPadrino) {
            return true;
        }
    }

    return false;
}

function getCouponDisponiblePadrino(customerProfile) {
    var customerProfileP = CustomerMgr.getCustomerByCustomerNumber(customerProfile.customerNo).profile;

    var coQuery = CustomObjectMgr.queryCustomObjects('mis-referidos', "custom.customerPadrino = {0}", null, customerProfile.customerNo);
    while (coQuery.hasNext()) {
        var currentCO = coQuery.next();
        if (currentCO.custom.estadoCupon == 'cuponDisponible' && customerProfileP.custom.esCustomerPadrino) {
            return currentCO.custom.cupon;
        }
    }

    return false;
}

function changeStatusCouponPadrinoCuponCanjeado(customerProfile) {
    // cuponCanjeado
    var customerP = CustomerMgr.getCustomerByCustomerNumber(customerProfile.customerNo);

    var couponCode = getCouponDisponiblePadrino(customerProfile);
    var customerAhijado;

    var coQuery = CustomObjectMgr.queryCustomObjects('mis-referidos', "custom.customerPadrino = {0} AND custom.cupon = {1}", null, customerP.profile.customerNo, couponCode);
    while (coQuery.hasNext()) {
        var currentCO = coQuery.next();
        if (currentCO.custom.estadoCupon == 'cuponDisponible' && customerP.profile.custom.esCustomerPadrino) {
            customerAhijado = currentCO.custom.customerNumber;
        }
    }
    var configObj = CustomObjectMgr.getCustomObject('mis-referidos', customerAhijado);
    if (configObj) {
        var date = new Date();
        Transaction.wrap(function () {
            configObj.custom.estadoCupon = 'cuponCanjeado';
            configObj.custom.cupon = 'Canjeado';
            configObj.custom.fechaCanjePadrino = date;
        });
    }
}

function assignCouponCodeCustomerPadrino(customerProfile) {

    var coupon = getCouponCodeMisReferidos();
    if (coupon) {
        var configObj = CustomObjectMgr.getCustomObject('mis-referidos', customerProfile.customerNo);
        if(configObj.custom.estadoCupon == 'esperandoCompra') {
            Transaction.wrap(function () {
                configObj.custom.cupon = coupon;
                configObj.custom.estadoCupon = 'cuponDisponible';
            });
            var customerProfileA = CustomerMgr.getCustomerByCustomerNumber(customerProfile.customerNo).profile;

            var customerPadrinoProfile = CustomerMgr.getCustomerByCustomerNumber(customerProfileA.custom.customerPadrino).profile;

            sendCouponCodeEmailCustomerPadrino(customerPadrinoProfile, coupon);
            return true;
        }
    }
    return false;
}


function getCouponCodeMisReferidos() {
    var Site = require('dw/system/Site');
    var coupon = Site.current.getCustomPreferenceValue('couponCodeReferidos');
    return coupon;
}

function getCouponCodeMisReferidosAhijados() {
    var Site = require('dw/system/Site');
    var coupon = Site.current.getCustomPreferenceValue('couponCodeReferidosAhijados');
    return coupon;
}

function checkCustomerEmail(customerEmail) {
    var customer = CustomerMgr.getCustomerByLogin(customerEmail);
    if(!customer) {
        customer = CustomerMgr.queryProfile('email = {0}', customerEmail);
        customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo : '');
    }
    return customer;
}

function sendCouponCodeEmailCustomerPadrino(user, couponCode) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    //Ajustar con la info necesaria para el mail
    // var userObject = {
    //     email: user.email,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     url: URLUtils.https('Login-Show'),
    //     couponCode: getCouponCodeMisReferidos()
    // };
    var userObject = {
        couponCode: couponCode
    };
    //hacer el cambio de informacion del mail
    // var emailObj = {
    //     to: user.email,
    //     subject: Resource.msg('email.subject.new.registration', 'registration', null),
    //     from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
    //     type: emailHelpers.emailTypes.registration
    // };

    //Ajustar para este email
    var email = '';
    if(!user.email) {
        email = user.credentials.login;
    } else {
        email = user.email;
    }

    var emailObj = {
        to: email,
        subject: 'Referidos', // Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };
    emailHelpers.sendEmail(emailObj, 'referidos/emailCustomerPadrino', userObject);
}

function sendCreateAccountEmailReferido(registeredUser, passwordCode) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var cupon = getCouponCodeMisReferidosAhijados();

    var userObject = {
        email: registeredUser.email,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        url: URLUtils.https('Login-Show'),
        passwordCode: passwordCode,
        couponCode: cupon
    };

    //assign coupon ahijado
    var customerA = CustomerMgr.getCustomerByCustomerNumber(registeredUser.customerNo);
    Transaction.wrap(function () {
        customerA.profile.custom.cuponAhijado = cupon;
    });

    var emailObj = {
        to: registeredUser.email,
        subject: Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountRegisteredEmail', userObject);
}


function assignCouponCart(customerProfile) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();

    var esPadrino = esCustomerPadrinoPrimerCompra(customerProfile);
    var esAhijado;
    var couponCode;
    if (esPadrino) {
        couponCode = getCouponDisponiblePadrino(customerProfile);
    } else {
        esAhijado = esCustomerAhijadoPrimerCompra(customerProfile);
        if (esAhijado) {
            couponCode = getCouponDisponibleAhijado(customerProfile);
        }
    }
    if (!currentBasket) {
        return false;
    } else {
            if (couponCode) {
                if (!currentBasket.getCouponLineItem(getCouponCodeMisReferidos()) && !currentBasket.getCouponLineItem(getCouponCodeMisReferidosAhijados()) ) {
                    try {
                        Transaction.wrap(function () {
                            currentBasket.createCouponLineItem(couponCode, true);
                            return true;
                        });
                    } catch (e) {
                        return false;
                    }
    
                    Transaction.wrap(function () {
                        basketCalculationHelpers.calculateTotals(currentBasket);
                    });
                }
            }
    }
}

function checkCouponRemove(customerProfile, couponLineItem) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();

    var esPadrino = esCustomerPadrinoPrimerCompra(customerProfile);
    var esAhijado;
    var couponCode;
    if (esPadrino) {
        couponCode = getCouponDisponiblePadrino(customerProfile);
    } else {
        esAhijado = esCustomerAhijadoPrimerCompra(customerProfile);
        if (esAhijado) {
            couponCode = getCouponDisponibleAhijado(customerProfile);
        }
    }

    if (couponCode == couponLineItem.couponCode) {
        return true;
    } else {
        return false;
    }
}

function setFechaCanjeCuponAhijado(customerProfile, cuponReferidos) {
    var customer = CustomerMgr.getCustomerByCustomerNumber(customerProfile.customerNo);
    customerProfile = customer.profile;
    var couponCode = getCouponDisponibleAhijado(customerProfile);
    var customerAhijado;
    var configObj = CustomObjectMgr.getCustomObject('mis-referidos', customerProfile.customerNo);
    if (configObj) {
        var date = new Date();
        Transaction.wrap(function () {
            configObj.custom.fechaCanjeCupon = date;
            customerProfile.custom.cuponAhijado = '';
        });
    }
}

function sendEmailAvisoReferidoCustomerPadrino(customerPadrino, customerAhijado) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    //Ajustar con la info necesaria para el mail
    // var userObject = {
    //     email: user.email,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     url: URLUtils.https('Login-Show'),
    //     couponCode: getCouponCodeMisReferidos()
    // };
    var userObject = {
        customerAhijado: customerAhijado.email
    };
    //hacer el cambio de informacion del mail
    // var emailObj = {
    //     to: user.email,
    //     subject: Resource.msg('email.subject.new.registration', 'registration', null),
    //     from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
    //     type: emailHelpers.emailTypes.registration
    // };
    var CustomerMgr = require('dw/customer/CustomerMgr');

    customer = CustomerMgr.getCustomerByCustomerNumber(
        customerPadrino
    );
    
    var customerPadrinoEmail = customer.profile.email;

    var emailObj = {
        to: customerPadrinoEmail,
        subject: 'Referidos', // Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };
    emailHelpers.sendEmail(emailObj, 'referidos/emailAvisoCustomerPadrino', userObject);
}
module.exports = {
    assignAhijadoToCustomer: assignAhijadoToCustomer,
    checkCustomerEmail: checkCustomerEmail,
    sendCreateAccountEmailReferido: sendCreateAccountEmailReferido,
    getCouponCodeMisReferidos: getCouponCodeMisReferidos,
    getCouponCodeMisReferidosAhijados: getCouponCodeMisReferidosAhijados,
    assignCouponCodeCustomerPadrino: assignCouponCodeCustomerPadrino,
    esCustomerAhijadoPrimerCompra: esCustomerAhijadoPrimerCompra,
    assignCouponCart: assignCouponCart,
    checkCouponRemove: checkCouponRemove,
    changeStatusCouponPadrinoCuponCanjeado: changeStatusCouponPadrinoCuponCanjeado,
    esCustomerPadrinoPrimerCompra: esCustomerPadrinoPrimerCompra,
    getCouponDisponiblePadrino: getCouponDisponiblePadrino,
    getCouponDisponibleAhijado:getCouponDisponibleAhijado,
    setFechaCanjeCuponAhijado: setFechaCanjeCuponAhijado,
    sendEmailAvisoReferidoCustomerPadrino: sendEmailAvisoReferidoCustomerPadrino
};