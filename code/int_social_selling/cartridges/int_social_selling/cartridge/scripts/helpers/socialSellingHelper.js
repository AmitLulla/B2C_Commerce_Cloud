'use strict';

var Transaction = require('dw/system/Transaction');

function getCode() {
    var code = '';
    var num = 6
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    //creacion de codigo random
    for (let i = 0; i < num; i++) {
        code += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return code
}

function getLineItems(basket) {
    var lineItemIt = basket.getAllProductLineItems().iterator();
    var array = [];
    while (lineItemIt.hasNext()) {
        var lineItem = lineItemIt.next();
        array.push({
            pid: lineItem.getProductID(),
            qty: lineItem.quantityValue
        })
    }
    return array;
}

function addToCart(dataBasket) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var BasketMgr = require('dw/order/BasketMgr');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    if (dataBasket) {
        var productId;
        var childProducts = [];
        var options = [];
        var quantity;
        var result;
        var pidsObj;
        var error = false;

        if (currentBasket) {
            for (var key = 0 in dataBasket) {
                Transaction.wrap(function () {
                    quantity = parseInt(dataBasket[key].qty, 10);
                    result = cartHelper.addProductToCart(
                        currentBasket,
                        dataBasket[key].pid,
                        quantity,
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

        }
    }
    return {error:error};
}

function submitShippingData (customerData,req) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(req.locale.id);
    var billingAddress = currentBasket.billingAddress;
    var issue = false;
    var shippingAddress = currentBasket.defaultShipment.shippingAddress;
    var address = {
        firstName: customerData.recibeName,
        lastName: null,
        address1: customerData.tipoVia +' ' + customerData.street,
        address2: 'Piso-' + customerData.piso +' N int-'+ customerData.numberStreet +' N Extra-'+ customerData.numberStreetExtra,
        city: customerData.citySelect,
        postalCode: null,
        countryCode: null,
        phone: customerData.customer ? customerData.customer.phoneMobile : currentBasket.billingAddress ? currentBasket.billingAddress.phone: null,
        state: customerData.depaSelect,
        alias:customerData.aliasDireccion,
        via:customerData.tipoVia,
        street: customerData.street,
        departamento: customerData.depaSelect,
        Municipio: customerData.citySelect,
        piso_o_apartamento: customerData.piso,
        recibe_name: customerData.recibeName
    };
    if(customerData.customer) {
        Transaction.wrap(function () {
            currentBasket.setCustomerEmail(customerData.customer.email);
        });
    }
    try {
        if (customerData.customer) {
            Transaction.wrap(function () {
                currentBasket.customerName = customerData.customer.firstName ? customerData.customer.firstName : null;
                if (!billingAddress) {
                    billingAddress = currentBasket.createBillingAddress();
                }
                if (!shippingAddress) {
                    shippingAddress = currentBasket.defaultShipment.createShippingAddress();
                }
                billingAddress.setFirstName(customerData.customer.firstName);
                billingAddress.setLastName(customerData.customer.lastName);
                billingAddress.setPhone(customerData.customer.phoneMobile);
                billingAddress.setCountryCode(currentLocale.country);
                billingAddress.custom.cedulaCiudadana = customerData.customer.cedula;
                shippingAddress.setFirstName(customerData.recibeName);
                shippingAddress.setPhone(customerData.customer.phoneMobile);
                shippingAddress.setPhone(customerData.customer.phoneMobile);

            
                shippingAddress.setAddress1(address.address1);
                shippingAddress.setAddress2(address.address2);
                shippingAddress.setCity(address.city);
                shippingAddress.setPostalCode(address.postalCode);
                // shippingAddress.setStateCode(address.stateCode);
                shippingAddress.custom.departamento = address.departamento;
                shippingAddress.custom.municipio = address.Municipio;
                shippingAddress.custom.tipo_de_via = address.via;
                shippingAddress.custom.piso_o_apartamento = address.piso_o_apartamento;
                shippingAddress.custom.nombre_persona_receptora =address.recibe_name;
                shippingAddress.custom.state = address.state;
                shippingAddress.custom.aliasDireccion = address.alias;
                var countryCode = address.countryCode ? address.countryCode : address.countryCode;
                shippingAddress.setCountryCode(countryCode);
                shippingAddress.setPhone(address.phone ? address.phone : currentBasket.billingAddress.phone);
        
                // ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
                
            });
        }
    } catch (error) {
        issue = true;  
    }
    return {error:issue}
}

module.exports = {
    getCode: getCode,
    getLineItems: getLineItems,
    addToCart: addToCart,
    submitShippingData: submitShippingData
}