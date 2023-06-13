'use strict';

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.append(
    'Show', 
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var customer = CustomerMgr.getCustomerByLogin(req.currentCustomer.profile ? req.currentCustomer.profile.email: 'test@.com');
        var valid = false;
        if (customer && customer.authenticated) {
            var customerGroups = customer.getCustomerGroups();
            for each (var customerGroup in customer.getCustomerGroups()) {
                var customerGroupID = customerGroup.getID().toLowerCase();
        
                if (customerGroupID === 'adminsocialselling') {
                    valid = true;
                    break;
                }
            }
        
        }

        res.setViewData({isAdminSocialSelling:valid})
        next();
    }
);

server.append('AddProduct', function (req, res, next) {
    session.custom.cartExist = false;
    session.custom.hasCart = true;
    next();
});

module.exports = server.exports();