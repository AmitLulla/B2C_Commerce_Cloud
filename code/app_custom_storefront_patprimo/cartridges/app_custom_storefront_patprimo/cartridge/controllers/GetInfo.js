'use strict';

var server = require('server');
server.get(
    'GetAddress',
    function (req, res, next) {
        var email = req.querystring.email
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customer = CustomerMgr.getCustomerByLogin(email);
        if (!customer && session.customer.isAuthenticated()) {
            var user = req.currentCustomer;
            customer = CustomerMgr.getCustomerByCustomerNumber(user.profile.customerNo);
        }
        if (!customer) {
            customer = CustomerMgr.queryProfile('email = {0}', email);
            customer = CustomerMgr.getCustomerByCustomerNumber(customer ? customer.customerNo : '');
        }
        var address = customer.addressBook.addresses;
        var inf = [];
        var infEncrypt = [];
        var limit;
        for (var i in address) {
            var addressInfo = address[i];
            var objectInf = JSON.parse(addressInfo.custom.dataGeneral);
            inf.push({
                ID: objectInf ? objectInf.aliasDireccion:addressInfo.ID,
                address2: (objectInf && 'piso_o_apartamento' in objectInf) ? objectInf.piso_o_apartamento : addressInfo.address2,
                address1: objectInf ? ('tipo_de_via' in objectInf ? objectInf.tipo_de_via : objectInf.tipoVia)  + ' ' + objectInf.street +' # ' + objectInf.numberStreet + ' - ' + objectInf.numberStreetExtra || addressInfo.address1 : addressInfo.address1 || addressInfo.address2,
                city: addressInfo.city,
                uuid: addressInfo.UUID
            });
        }
        if (inf.length > 0 && !session.customer.isAuthenticated()) {
            for (var key in inf) {
                var mask = '';
                var addres1Mask;
                if (inf[key].address1) {
                    for (var i = 0; i < (inf[key].address1.length -4); i++) {
                        mask += '*';
                    }
                    addres1Mask = inf[key].address1.substring((0), (5)) + mask + inf[key].address1.substring((inf[key].address1.length), (inf[key].address1.length -4));
                    delete inf[key].address1;
                    inf[key].address1 = addres1Mask;

                    for (var i = 0; i < (inf[key].address2.length - 3); i++) {
                        mask += '*';
                    }
                    var addres2Mask = inf[key].address2.substring((inf[key].address2.length - 3), (inf[key].address2.length - 3)) + mask + inf[key].address2.substring((inf[key].address2.length - 3), (inf[key].address2.length));
                    delete inf[key].address2;
                    inf[key].address2 = addres2Mask;
                }
            }
        }

        res.json({
            error: false,
            address: inf,
            isAuthenticated: req.currentCustomer.raw.authenticated
        })
        next()
    })

server.get('GetShippingMethods', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var shippingMethods = [];
    var data = {};
    var currentBasket = BasketMgr.getCurrentBasket();
    var ShippingMgr = require('dw/order/ShippingMgr');
    var shipmentModel = ShippingMgr.getShipmentShippingModel(currentBasket.getShipments()[0]);
    var applicableShippingMethods = shipmentModel.getApplicableShippingMethods();

    for (var key = 0 in applicableShippingMethods) {
        data = {
            name: applicableShippingMethods[key].displayName,
            description: applicableShippingMethods[key].description,
            uuid: applicableShippingMethods[key].UUID,
            id: applicableShippingMethods[key].ID
        }
        shippingMethods.push(data)
    }
    res.json({ applicableShippingMethods: shippingMethods })
    next()
})


module.exports = server.exports();