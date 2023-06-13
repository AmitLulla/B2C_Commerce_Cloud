'use strict';

function getAddressCustomer (customer, uuid) {
    var result = {};
    var addresses = customer.addressBook.addresses;
    for (var key = 0 in addresses) {
        if (addresses[key].UUID === uuid) {

            result.address = {
                firstName: addresses[key].firstName,
                lastName: addresses[key].lastName,
                address1: addresses[key].address1,
                address2: addresses[key].address2,
                city: addresses[key].city ? addresses[key].city: addresses[key].custom.municipio,
                postalCode: addresses[key].postalCode,
                stateCode: addresses[key].stateCode,
                phone: addresses[key].phone,
                state: '',
                alias:addresses[key].ID,
                via: addresses[key].custom.tipo_de_via ? addresses[key].custom.tipo_de_via : '',
                street: addresses[key].custom.street ? addresses[key].custom.street : '',
                numberStreet : addresses[key].custom.numberStreet ? addresses[key].custom.numberStreet: '',
                numberStreetExtra : addresses[key].custom.numberStreetExtra ? addresses[key].custom.numberStreetExtra: '',
                departamento: addresses[key].custom.departamento ? addresses[key].custom.departamento : '',
                Municipio: addresses[key].custom.municipio ? addresses[key].custom.municipio : '',
                piso_o_apartamento: addresses[key].custom.piso_o_apartamento ? addresses[key].custom.piso_o_apartamento : '',
                recibe_name: addresses[key].custom.personaQueRecibe ? addresses[key].custom.personaQueRecibe : '',
                cedulaCiudadana: customer.profile.custom.documentoIdentidad ? customer.profile.custom.documentoIdentidad : ''
            };
        }
    }
    return result;
}

function setShipingMethod(basket, shippingID) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var shipping;
    var shipmentModel = ShippingMgr.getShipmentShippingModel(basket.getShipments()[0]);
    var applicableShippingMethods = shipmentModel.getApplicableShippingMethods();
    for (var i = 0 in applicableShippingMethods) {
        if (applicableShippingMethods[i].UUID === shippingID) {
            shipping = applicableShippingMethods[i];
        }
    }
    return shipping;
   
}

module.exports = { getAddressCustomer:getAddressCustomer,
                    setShipingMethod:setShipingMethod}