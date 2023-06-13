'use strict';
var Status = require('dw/system/Status');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var serviceHelper = require('~/cartridge/scripts/helpers/restAPI');
var Transaction = require('dw/system/Transaction');
var ProductMgr = require('dw/catalog/ProductMgr');


function sendData() {
    // Get all Orders
    var ProductImageDIS = require('*/cartridge/scripts/helpers/ProductImageDIS');
    var query = "(custom.incompleto = true) and (custom.enviadoMarketing = false or custom.enviadoMarketing = null) and custom.nuevoTotalOrden > 0";
    var orders = OrderMgr.queryOrders(query, "orderNo asc", null);
    var Site = require('dw/system/Site');
    var requestData;
    try {
        while (orders.hasNext()) {
            var order = orders.next();
                // Create body API
                var addressComplete = order.shipments[0].shippingAddress;
                var shipping = order.shipments[0];
                var textHeader, discount = 0;
                var paymentInstrument = order.getPaymentInstruments()[0];
                var address = addressComplete.custom.tipo_de_via + ' ' + addressComplete.custom.street + 
                    ' #' +  addressComplete.custom.numberStreet + ' - ' + addressComplete.custom.numberStreetExtra +
                    ' - ' + addressComplete.custom.departamento + ' - ' + addressComplete.custom.municipio;
                switch (paymentInstrument.paymentMethod) {
                    case 'PAGO_CONTRA_ENTREGA':
                        textHeader =  Site.current.preferences.custom.header_text_contra_entrega;
                        break;
                    case 'GIFT_CERTIFICATE':
                        textHeader =  Site.current.preferences.custom.header_text_gift_card;
                        break;
                    case 'CREDICOL':
                        textHeader =  Site.current.preferences.custom.header_text_credicol;
                        break;
                    default:
                        textHeader =  Site.current.preferences.custom.header_text_otro_medio_pago;
                        break;
                }     
                
                var arrayItems = [];
                var arrayItemsRemoved = [];
                for (var index = 0 in order.allProductLineItems) {
                    var obj = {}, obj2 = {};
                    if (order.allProductLineItems[index].priceAdjustments.length > 0 || order.priceAdjustments.length > 0){
                        discount = order.getAdjustedMerchandizeTotalPrice().value;
                    }
                    if (!order.allProductLineItems[index].custom.productoIncompleto) {
                        var product = ProductMgr.getProduct(order.allProductLineItems[index].productID)
                        var images = ProductImageDIS.getImages(product, 'medium');
                        var urlImg = images[0].image.absURL.toString();
                        obj.img = urlImg;
                        obj.description = product.pageDescription;
                        obj.qty = order.allProductLineItems[index].quantityValue
                        obj.priceList = order.allProductLineItems[index].basePrice.value;
                        obj.salesPrice = (order.allProductLineItems[index].priceValue/order.allProductLineItems[index].quantityValue)
                        arrayItems.push(obj);
                    } else {
                        var productR = ProductMgr.getProduct(order.allProductLineItems[index].productID)
                        var imagesR = ProductImageDIS.getImages(productR, 'medium');
                        var urlImg2 = imagesR[0].image.absURL.toString();
                        obj2.img = urlImg2;
                        obj2.description = productR.pageDescription;
                        obj2.qty = order.allProductLineItems[index].quantityValue
                        obj2.priceList = order.allProductLineItems[index].basePrice.value;
                        obj2.salesPrice = (order.allProductLineItems[index].priceValue/order.allProductLineItems[index].quantityValue)
                        arrayItemsRemoved.push(obj2);
                    }
                }
                requestData = {
                    "ContactKey": order.billingAddress.custom.cedulaCiudadana,
                    "EventDefinitionKey":Site.current.preferences.custom.eventDefinitionKey,
                    'Data': {
                        'firstName': order.customerName,
                        'textHeader': textHeader,
                        'orderId': order.getOrderNo(),
                        'creationDateOrder': order.creationDate,
                        'address': address,
                        'ReceiverName': addressComplete.firstName,
                        'estimatedArrivalTime': shipping.shippingMethod.description,
                        'PaymentMethod': paymentInstrument.paymentMethod,
                        'TotalGlobal': order.getTotalGrossPrice().getValue().toString(),
                        'shippingName': shipping.shippingMethod.displayName,
                        'importantNote': '',
                        'totalOrderValorInicial': order.getTotalGrossPrice().getValue().toString(),
                        'shippingPrice': order.shippingTotalGrossPrice.getValue().toString(),
                        'discount': discount,
                        'totalOrdenUpdate': order.custom.nuevoTotalOrden.toString(),
                        'email': order.customerEmail.toString(),
                        'cedula':order.billingAddress.custom.cedulaCiudadana,
                        'items' :JSON.stringify(arrayItems),
                        'itemsRemoved': JSON.stringify(arrayItemsRemoved)
                    }
                }
                var serviceData = {};
                var serviceData = serviceHelper.callServiceInsert(requestData);
                if (serviceData.status === 'OK') {
                    Transaction.wrap(function () {
                        order.custom.enviadoMarketing = true;
                    });
                } else {
                    if (order.getNotes() != null && order.getNotes().length <= 500) {
                        Transaction.wrap(function () {
                            order.addNote('Error del Servicio', serviceData.errorMessage);
                        });
                    }
                }

        }
    } catch (e) {
        Logger.error('Ocurrio un error al enviar informacion a MKT, Error: ', e.message)
    }
}


module.exports = { sendData: sendData };