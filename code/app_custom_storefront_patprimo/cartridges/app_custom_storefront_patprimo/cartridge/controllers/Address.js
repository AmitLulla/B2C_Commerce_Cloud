'use strict';

/**
 * @namespace Address
 */

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

var departamentos = []
//  var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0}", null,'*');
 var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0}", "custom.ciudad asc",'*');
 while (result.hasNext()) {
     var departamento = result.next();
     if(departamentos.length > 0){
         if (departamentos.indexOf(departamento.custom.ciudad) === -1) {
             departamentos.push(departamento.custom.ciudad)
         }
     }else {
         departamentos.push(departamento.custom.ciudad)
     }
 }

/**
 * Creates a list of address model for the logged in user
 * @param {string} customerNo - customer number of the current customer
 * @returns {List} a plain list of objects of the current customer's addresses
 */
function getList(customerNo) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var AddressModel = require('*/cartridge/models/address');
    var collections = require('*/cartridge/scripts/util/collections');

    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var rawAddressBook = customer.addressBook.getAddresses();
    var addressBook = collections.map(rawAddressBook, function (rawAddress) {
        var addressModel = new AddressModel(rawAddress);
        addressModel.address.UUID = rawAddress.UUID;
        return addressModel;
    });
    return addressBook;
}


/**
 * Address-AddAddress : A link to a page to create a new address
 * @name Base/Address-AddAddress
 * @function
 * @memberof Address
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace(
    'AddAddress',
    csrfProtection.generateToken,
    consentTracking.consent,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var addressForm = server.forms.getForm('addressCustom');
        addressForm.clear();
        res.render('account/editAddAddress', {
            addressForm: addressForm,
            departamentos:departamentos,
            addAddress:true,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                },
                {
                    htmlValue: Resource.msg('label.addressbook', 'account', null),
                    url: URLUtils.url('Address-List').toString()
                }
            ]
        });
        next();
    }
);

/**
 * Address-EditAddress : A link to edit and existing address
 * @name Base/Address-EditAddress
 * @function
 * @memberof Address
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - addressId - a string used to identify the address record
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 * 
 */
 
server.replace(
    'EditAddress',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var AddressModel = require('*/cartridge/models/address');

        var addressId = req.querystring.addressId;
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var addressBook = customer.getProfile().getAddressBook();
        var rawAddress = addressBook.getAddress(addressId);
        var addressModel = new AddressModel(rawAddress,true);
        var addressForm = server.forms.getForm('addressCustom');
        addressForm.clear();

        addressForm.copyFrom(addressModel.address);

        res.render('account/editAddAddress', {
            addressForm: addressForm,
            addAddress:true,
            addressId: addressId,
            departamentos:departamentos,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                },
                {
                    htmlValue: Resource.msg('label.addressbook', 'account', null),
                    url: URLUtils.url('Address-List').toString()
                }
            ]
        });

        next();
    }
);

/**
 * Address-SaveAddress : Save a new or existing address
 * @name Base/Address-SaveAddress
 * @function
 * @memberof Address
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - addressId - a string used to identify the address record
 * @param {httpparameter} - dwfrm_address_addressId - An existing address id (unless new record)
 * @param {httpparameter} - dwfrm_address_firstName - A person’s first name
 * @param {httpparameter} - dwfrm_address_lastName - A person’s last name
 * @param {httpparameter} - dwfrm_address_address1 - A person’s street name
 * @param {httpparameter} - dwfrm_address_address2 -  A person’s apartment number
 * @param {httpparameter} - dwfrm_address_country - A person’s country
 * @param {httpparameter} - dwfrm_address_states_stateCode - A person’s state
 * @param {httpparameter} - dwfrm_address_city - A person’s city
 * @param {httpparameter} - dwfrm_address_postalCode - A person’s united states postel code
 * @param {httpparameter} - dwfrm_address_phone - A person’s phone number
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('SaveAddress', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

    var addressForm = server.forms.getForm('addressCustom');
    var addressFormObj = addressForm.toObject();
    var generalData = {
        aliasDireccion: addressFormObj.aliasDireccion,
        citySelect: addressFormObj.citySelect,
        depaSelect: addressFormObj.depaSelect,
        numberStreet: addressFormObj.numberStreet,
        numberStreetExtra: addressFormObj.numberStreetExtra,
        piso: addressFormObj.piso,
        recibeName: addressFormObj.recibeName,
        street: addressFormObj.street,
        tipoVia: addressFormObj.tipoVia,
        address2: addressFormObj.street +' # '+ addressFormObj.numberStreet +'-'+ addressFormObj.numberStreetExtra }
    var jsonData = JSON.stringify(generalData);
    addressFormObj.addressForm = addressForm;
    addressFormObj.dataJson = jsonData;

    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var addressBook = customer.getProfile().getAddressBook();
    if (addressForm.valid) {
        res.setViewData(addressFormObj);
        this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
            var formInfo = res.getViewData();
            Transaction.wrap(function () {
                var address = null;
                if (formInfo.aliasDireccion.equals(req.querystring.addressId) || !addressBook.getAddress(formInfo.aliasDireccion)) {
                    address = req.querystring.addressId
                        ? addressBook.getAddress(req.querystring.addressId)
                        : addressBook.createAddress(formInfo.aliasDireccion);
                }

                if (address) {
                    if (req.querystring.addressId) {
                        address.setID(formInfo.aliasDireccion);
                    }

                    // Save form's address
                    addressHelpers.updateAddressFields(address, formInfo);

                    // Send account edited email
                    accountHelpers.sendAccountEditedEmail(customer.profile);

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Address-List').toString()
                    });
                } else {
                    formInfo.addressForm.valid = false;
                    formInfo.addressForm.addressId.valid = false;
                    formInfo.addressForm.addressId.error =
                        Resource.msg('error.message.idalreadyexists', 'forms', null);
                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(addressForm)
                    });
                }
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(addressForm)
        });
    }
    return next();
});

/**
 * Address-List : Used to show a list of address created by a registered shopper
 * @name Base/Address-List
 * @function
 * @memberof Address
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    var actionUrls = {
        deleteActionUrl: URLUtils.url('Address-DeleteAddress').toString(),
        listActionUrl: URLUtils.url('Address-List').toString(),
        setDefault: URLUtils.url('Address-SetDefault').toString()
    };
    var addressBook = getList(req.currentCustomer.profile.customerNo);
    if(addressBook){

        addressBook.forEach((currentElement, index) => {
            var objectInf = JSON.parse(addressBook[index].address.dataGeneral);
            if(objectInf === null){
                addressBook[index].address.address2 = addressBook[index].address.address2;
                addressBook[index].address.address1 = addressBook[index].address.address1;
            }else{
                addressBook[index].address.address2 =objectInf.address2 ? objectInf.address2 : objectInf.piso_o_apartamento + ' # ' + objectInf.numberStreet + ' - ' + objectInf.numberStreetExtra;
                addressBook[index].address.address1 = objectInf.tipoVia ? objectInf.tipoVia : objectInf.tipo_de_via;
            }
            })
    }

    res.render('account/addressBook', {
        addressBook: addressBook,
        actionUrls: actionUrls,
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
});



module.exports = server.exports();
