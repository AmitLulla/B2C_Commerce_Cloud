'use strict';

var base = module.superModule;
/**
 * Generate address name based on the full address object
 * @param {dw.order.OrderAddress} address - Object that contains shipping address
 * @returns {string} - String with the generated address name
 */
function generateAddressName(address) {
    return [(address.address1 || ''), (address.city || ''), (address.postalCode || '')].join(' - ');
}

/**
 * Verify if the address already exists as a stored user address
 * @param {dw.order.OrderAddress} address - Object that contains shipping address
 * @param {Object[]} storedAddresses - List of stored user addresses
 * @returns {boolean} - Boolean indicating if the address already exists
 */
function checkIfAddressStored(address, storedAddresses) {
    for (var i = 0, l = storedAddresses.length; i < l; i++) {
        if (storedAddresses[i].address1 === address.address1
            && storedAddresses[i].postalCode === address.postalCode
            && storedAddresses[i].firstName === address.firstName
            && storedAddresses[i].lastName === address.lastName 
            || storedAddresses[i].ID === address.id) {
            return true;
        }
    }
    return false;
}

/**
 * Copy information from address object and save it in the system
 * @param {dw.customer.CustomerAddress} newAddress - newAddress to save information into
 * @param {*} address - Address to copy from
 */

function updateAddressFields(newAddress, address) {
    newAddress.setCity(address.citySelect || '');
    if (address.city){
        newAddress.setCity(address.city || '');  
    }
    newAddress.setFirstName(address.recibeName || '');
    newAddress.setLastName(address.lastName || '');
    newAddress.setPhone(address.phone || '');
    newAddress.setPostalCode(address.postalCode || '');
    newAddress.custom.dataGeneral = (JSON.stringify(address.orderAddressObj) || '');
    if (!address.orderAddressObj && address.dataJson) {
        newAddress.custom.dataGeneral = address.dataJson;
    }
    newAddress.custom.departamento = (address.depaSelect || '');
    if (address.states && address.states.stateCode) {
        newAddress.setStateCode(address.states.stateCode);
    }

    if (!address.states && address.depaSelect) {
        newAddress.setStateCode(address.depaSelect);
    }
    
    if (address.country) {
        newAddress.setCountryCode(address.country.value ? address.country.value : '');
    }
    
    newAddress.setJobTitle(address.jobTitle || '');
    newAddress.setPostBox(address.postBox || '');
    newAddress.setSalutation(address.salutation || '');
    newAddress.setSecondName(address.secondName || '');
    newAddress.setCompanyName(address.companyName || '');
    newAddress.setSuffix(address.suffix || '');
    newAddress.setSuite(address.suite || '');
    newAddress.setTitle(address.title || '');
    newAddress.setAddress1(address.tipoVia || '');
    newAddress.setAddress2(address.street + ' # ' + address.numberStreet + '-' + address.numberStreetExtra || '');
    if(address.orderAddressObj){
        newAddress.setAddress1(address.address1 || '');
        newAddress.setAddress2(address.address2 || '');
        newAddress.custom.state = address.orderAddressObj.state ? address.orderAddressObj.state : '';
        newAddress.custom.nombreDireccion = address.orderAddressObj.aliasDireccion ? address.orderAddressObj.aliasDireccion : '';
        newAddress.custom.departamento = address.orderAddressObj.departamento ? address.orderAddressObj.departamento : '';
        newAddress.custom.municipio = address.orderAddressObj.municipio ? address.orderAddressObj.municipio : '';
        newAddress.custom.personaQueRecibe =  address.orderAddressObj.nombre_persona_receptora ? address.orderAddressObj.nombre_persona_receptora : '';
        newAddress.custom.numberStreet = address.orderAddressObj.numberStreet ? address.orderAddressObj.numberStreet : '';
        newAddress.custom.numberStreetExtra = address.orderAddressObj.numberStreetExtra ? address.orderAddressObj.numberStreetExtra : '';
        newAddress.custom.piso_o_apartamento = address.orderAddressObj.piso_o_apartamento ? address.orderAddressObj.piso_o_apartamento : '';
        newAddress.custom.street = address.orderAddressObj.street ? address.orderAddressObj.street : '';
        newAddress.custom.tipo_de_via = address.orderAddressObj.tipo_de_via ? address.orderAddressObj.tipo_de_via : '';
    }


}

function updateAddressFieldsFromConfirmation(newAddress, address) {
    newAddress.setAddress1(address.address1|| '');
    newAddress.setAddress2(address.address2|| '');
    newAddress.setCity(address.city || '');
    newAddress.setFirstName(address.firstName || '');
    newAddress.setLastName(address.lastName || '');
    newAddress.setPhone(address.phone || '');
    newAddress.setPostalCode(address.postalCode || '');
    newAddress.custom.state = (address.depaSelect ? address.depaSelect : address.orderAddressObj.departamento || '');
    newAddress.custom.departamento = (address.depaSelect ? address.depaSelect : address.orderAddressObj.departamento || '');
    newAddress.custom.dataGeneral = (address.dataJson ? address.dataJson : JSON.stringify(address.orderAddressObj) || '');
    if (address.states && address.states.stateCode) {
        newAddress.setStateCode(address.states.stateCode);
    }

    if (address.country) {
        newAddress.setCountryCode(address.country.value ? address.country.value : address.country);
    }

    newAddress.setJobTitle(address.jobTitle || '');
    newAddress.setPostBox(address.postBox || '');
    newAddress.setSalutation(address.salutation || '');
    newAddress.setSecondName(address.secondName || '');
    newAddress.setCompanyName(address.companyName || '');
    newAddress.setSuffix(address.suffix || '');
    newAddress.setSuite(address.suite || '');
    newAddress.setTitle(address.title || '');

    if(address.orderAddressObj){
        newAddress.setAddress1(address.address1 || '');
        newAddress.setAddress2(address.address2 || '');
        newAddress.custom.state = address.orderAddressObj.state ? address.orderAddressObj.state : '';
        newAddress.custom.nombreDireccion = address.orderAddressObj.aliasDireccion ? address.orderAddressObj.aliasDireccion : '';
        newAddress.custom.departamento = address.orderAddressObj.departamento ? address.orderAddressObj.departamento : '';
        newAddress.custom.municipio = address.orderAddressObj.municipio ? address.orderAddressObj.municipio : '';
        newAddress.custom.personaQueRecibe =  address.orderAddressObj.nombre_persona_receptora ? address.orderAddressObj.nombre_persona_receptora : '';
        newAddress.custom.numberStreet = address.orderAddressObj.numberStreet ? address.orderAddressObj.numberStreet : '';
        newAddress.custom.numberStreetExtra = address.orderAddressObj.numberStreetExtra ? address.orderAddressObj.numberStreetExtra : '';
        newAddress.custom.piso_o_apartamento = address.orderAddressObj.piso_o_apartamento ? address.orderAddressObj.piso_o_apartamento : '';
        newAddress.custom.street = address.orderAddressObj.street ? address.orderAddressObj.street : '';
        newAddress.custom.tipo_de_via = address.orderAddressObj.tipo_de_via ? address.orderAddressObj.tipo_de_via : '';
    }
}

/**
 * Stores a new address for a given customer
 * @param {Object} address - New address to be saved
 * @param {Object} customer - Current customer
 * @param {string} addressId - Id of a new address to be created
 * @returns {void}
 */
function saveAddress(address, customer, addressId,userNotLogin) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var isCustom = false;
    var addressBook;
    var email = customer.profile ? customer.profile.email: null;
    if(!email) {
        var customer_temp = CustomerMgr.getCustomerByCustomerNumber(customer.profile.customerNo);
        email = customer_temp.getProfile().credentials.login;
    }
    if (customer_temp) {
        addressBook = customer_temp.getProfile().getAddressBook();
        isCustom = true;
    } else if (userNotLogin) {
        addressBook = customer.getProfile().getAddressBook();
        isCustom = true;
    } else {
        addressBook = customer.raw.getProfile().getAddressBook();
    }
    addressId = addressId.trim();
    Transaction.wrap(function () {
        var newAddress = addressBook.createAddress(addressId);
        if (!isCustom) {
            updateAddressFields(newAddress, address);
        } else {
            updateAddressFieldsFromConfirmation(newAddress, address);
        }
    });
}

/**
 * Copy dwscript address object into JavaScript object
 * @param {dw.order.OrderAddress} address - Address to be copied
 * @returns {Object} - Plain object that represents an address
 */
function copyShippingAddress(address) {
    return {
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        postalCode: address.postalCode,
        states: {
            stateCode: address.stateCode
        },
        country: address.countryCode,
        jobTitle: address.jobTitle,
        postBox: address.postBox,
        salutation: address.salutation,
        secondName: address.secondName,
        companyName: address.companyName,
        suffix: address.suffix,
        suite: address.suite,
        title: address.title,
        id: address.custom.aliasDireccion ? address.custom.aliasDireccion: null
    };
}

/**
 * Gather all addresses from shipments and return as an array
 * @param {dw.order.Basket} order - current order
 * @returns {Array} - Array of shipping addresses
 */
function gatherShippingAddresses(order) {
    var collections = require('*/cartridge/scripts/util/collections');
    var allAddresses = [];

    if (order.shipments) {
        collections.forEach(order.shipments, function (shipment) {
            if (shipment.shippingAddress) {
                allAddresses.push(copyShippingAddress(shipment.shippingAddress));
            }
        });
    } else {
        allAddresses.push(order.defaultShipment.shippingAddress);
    }
    return allAddresses;
}

function getDepartaments() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var departamentos = []
    var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0}", null, '*');
    while (result.hasNext()) {
        var departamento = result.next();
        if (departamentos.length > 0) {
            if (departamentos.indexOf(departamento.custom.ciudad) === -1) {
                departamentos.push(departamento.custom.ciudad)
            }
        } else {
            departamentos.push(departamento.custom.ciudad)
        }
    }
    return departamentos;
}

base.generateAddressName;
base.checkIfAddressStored = checkIfAddressStored;
base.saveAddress = saveAddress;
base.copyShippingAddress = copyShippingAddress;
base.updateAddressFields = updateAddressFields;
base.gatherShippingAddresses =gatherShippingAddresses;
base.getDepartaments = getDepartaments;

module.exports = base;
