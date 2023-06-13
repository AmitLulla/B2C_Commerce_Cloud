'use strict';

/**
 * Creates an account model for the current customer
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function getAccountModel(req,email) {
    var AccountModel = require('*/cartridge/models/account');
    var AddressModel = require('*/cartridge/models/address');
    var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var preferredAddressModel;
    var customer;

    if (!req.currentCustomer.profile) {
        customer = CustomerMgr.queryProfile('email = {0}', email);
        customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo:'');
        if (!customer) {
            return null;
        }
    }

    var orderModel;
    if (!req.currentCustomer.profile) {
        orderModel = {};
    } else {
        orderHelpers.getLastOrder(req);
    }
   
    if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    if (!req.currentCustomer.profile) {
        return new AccountModel(customer, preferredAddressModel, orderModel);
    } else {
        return new AccountModel(req.currentCustomer, preferredAddressModel, orderModel);
    }
   
}

module.exports = {
    getAccountModel: getAccountModel
};

