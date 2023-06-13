'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var base = module.superModule;
/**
 * creates a plain object that contains address information
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @returns {Object} an object that contains information about the users address
 */

function createAddressObject(addressObject) {
    var result;
    if (addressObject) {
        result = {
            address1: addressObject.address1,
            address2: addressObject.address2,
            city: addressObject.city,
            dataGeneral: (addressObject.custom && 'dataGeneral' in addressObject.custom) ? addressObject.custom.dataGeneral:null,
            firstName: addressObject.firstName,
            lastName: addressObject.lastName,
            ID: Object.hasOwnProperty.call(addressObject, 'ID')
                ? addressObject.ID : null,
            addressId: (addressObject.custom && 'dataGeneral' in addressObject.custom) ? JSON.parse(addressObject.custom.dataGeneral).aliasDireccion:null,
            phone: addressObject.phone,
            postalCode: addressObject.postalCode,
            stateCode: addressObject.stateCode,
            jobTitle: addressObject.jobTitle,
            postBox: addressObject.postBox,
            salutation: addressObject.salutation,
            secondName: addressObject.secondName,
            companyName: addressObject.companyName,
            suffix: addressObject.suffix,
            suite: addressObject.suite,
            title: addressObject.title
        };

        if (result.stateCode === 'undefined') {
            result.stateCode = '';
        }

        if (Object.hasOwnProperty.call(addressObject, 'countryCode')) {
            result.countryCode = {
                displayValue: addressObject.countryCode.displayValue,
                value: addressObject.countryCode.value.toUpperCase()
            };
        }
    } else {
        result = null;
    }
    return result;
}

function createAddressObjectCustom(addressObject) {
    var result;
    var addressCustom;
    if (addressObject) {
        if(addressObject.custom.dataGeneral) {
            addressCustom = JSON.parse(addressObject.custom.dataGeneral);
            result = {
                address1: addressObject.address1,
                tipoVia: addressCustom.tipoVia ?  addressCustom.tipoVia :  addressCustom.tipo_de_via,
                numberStreet: addressCustom.numberStreet,
                numberStreetExtra:addressCustom.numberStreetExtra,
                recibeName: addressCustom.recibeName ? addressCustom.recibeName : addressCustom.nombre_persona_receptora,
                piso: addressCustom.piso ?  addressCustom.piso :  addressCustom.piso_o_apartamento,
                aliasDireccion:addressCustom.aliasDireccion,
                street: addressCustom.street,
                address2: addressCustom.address2,
                citySelect: addressCustom.citySelect ? addressCustom.citySelect : addressObject.city,
                firstName: addressObject.firstName,
                lastName: addressObject.lastName,
                ID: Object.hasOwnProperty.call(addressObject, 'ID')
                    ? addressObject.ID : null,
                addressId: Object.hasOwnProperty.call(addressObject, 'ID')
                    ? addressObject.ID : null,
                depaSelect: addressCustom.depaSelect ? addressCustom.depaSelect : addressCustom.departamento ,
                phone: addressObject.phone
            };
        }else{
            result = {
                address1: addressObject.address1,
                tipoVia: addressObject.custom.tipo_de_via,
                numberStreet: addressObject.custom.numberStreet,
                numberStreetExtra: addressObject.custom.numberStreetExtra,
                recibeName: addressObject.custom.personaQueRecibe,
                piso: addressObject.custom.piso_o_apartamento,
                aliasDireccion: addressObject.custom.nombreDireccion,
                street: addressObject.custom.street,
                address2: addressObject.address2,
                citySelect: addressObject.custom.municipio,
                firstName: addressObject.firstName,
                lastName: addressObject.lastName,
                ID: Object.hasOwnProperty.call(addressObject, 'ID')
                    ? addressObject.ID : null,
                addressId: Object.hasOwnProperty.call(addressObject, 'ID')
                    ? addressObject.ID : null,
                depaSelect: addressObject.custom.departamento,
                phone: addressObject.phone
            };
        }

        if (result.stateCode === 'undefined') {
            result.stateCode = '';
        }

        if (Object.hasOwnProperty.call(addressObject, 'countryCode')) {
            result.countryCode = {
                displayValue: addressObject.countryCode.displayValue,
                value: addressObject.countryCode.value.toUpperCase()
            };
        }
    } else {
        result = null;
    }
    return result;
}

/**
 * Address class that represents an orderAddress
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @constructor
 */
function address(addressObject,isCustom) {
    if (isCustom) {
        this.address = createAddressObjectCustom(addressObject);
    } else {
        this.address = createAddressObject(addressObject);
    }
}

module.exports = address;
