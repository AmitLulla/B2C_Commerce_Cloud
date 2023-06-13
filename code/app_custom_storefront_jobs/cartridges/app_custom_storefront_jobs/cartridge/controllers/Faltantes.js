'use strict';

var server = require('server');

server.post(
    'ItemsRefund',
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Order = require('dw/order/Order');
        var orderId = req.querystring.orderId || null;
        var productId = req.querystring.productId || null;
        var email = req.querystring.email || null;
        var qty = req.querystring.qty || 1;
        var totalProductosDespachar, totalProductosDevueltos,nuevoTotalOrder;
        var userValid = false;
        var porcentaje;
        if (!email) {
            res.json({error: 'Email requerido'})
            return next();
        }

        if (!orderId || !productId) {
            res.json({error: 'Faltan Parametros'})
            return next();
        }

        var customer = CustomerMgr.getCustomerByLogin(email);
        if (!customer) {
            res.json({error: 'Usuario no Registrado'})
            return next();
        }
        var customerGroups = customer.getCustomerGroups();
        for each (var customerGroup in customer.getCustomerGroups()) {
            var customerGroupID = customerGroup.getID().toLowerCase();
            if (customerGroupID === 'admindevolucion') {
                userValid = true;
            }
        }
        if(!userValid) {
            res.json({error:'Usuario Invalido'})
            return next();
        }

        var order = OrderMgr.getOrder(orderId);
        if (!order) {
            res.json({error:'Orden no encontrada'});
            return next();
        }
        var productLineItemValid = false;
        for (var index = 0 in order.productLineItems) {
            if (order.productLineItems[index].productID === productId) {
                productLineItemValid = true;
            }
        }
        if (!productLineItemValid) {
            res.json({error:'Producto no encontrado en la orden'});
            return next();
        }
        var allProductAreRemoved = false;
        for (var i = 0 in order.productLineItems) {
            if (order.productLineItems[i].custom.cantidadDespachada === 0) {
                allProductAreRemoved = true;
            } else {
                allProductAreRemoved = false;
                break;
            }
        }
        if (allProductAreRemoved) {
            Transaction.wrap(function () {
                order.custom.incompleto = true; 
                order.setStatus(Order.ORDER_STATUS_CANCELLED);
                order.custom.estadoOrden = 'cancelado';
            })
        }

        for (var i = 0 in order.productLineItems) {
            if (order.productLineItems[i].productID === productId) {
                // if the order just has 1 product the status is cancelled
                if (order.productLineItems.length === 1 && order.productLineItems[i].quantityValue == qty) {
                    totalProductosDespachar = 0;
                    totalProductosDevueltos = 1;
                    Transaction.wrap(function () {
                        order.productLineItems[i].custom.productoIncompleto = true;  
                        order.productLineItems[i].custom.cantidadDespachada = totalProductosDespachar;
                        order.custom.incompleto = true; 
                        order.custom.estadoOrden = 'cancelado';
                        order.setStatus(Order.ORDER_STATUS_CANCELLED);
                    })
                    res.json({success: true,
                        msj: 'orden procesada correctamente'});
                  return  next();
                }
                
                if (order.productLineItems[i].custom.cantidadDespachada) {
                    totalProductosDespachar = (order.productLineItems[i].custom.cantidadDespachada - qty)
                } else if(order.productLineItems[i].custom.cantidadDespachada === 0) {
                    totalProductosDespachar = (order.productLineItems[i].custom.cantidadDespachada - qty)
                } else {
                    totalProductosDespachar = (order.productLineItems[i].quantityValue - qty);
                }
                
                if (Math.sign(totalProductosDespachar) === -1) {
                    res.json({error:'la cantidad ingresada es mayor a la que existe'});
                    return next();
                }

                    
                Transaction.wrap(function () {
                    order.productLineItems[i].custom.productoIncompleto = true;  
                    order.productLineItems[i].custom.cantidadDespachada = totalProductosDespachar;
                    order.custom.incompleto = true; 
                    order.custom.estadoOrden = 'modificado';
                })
            }
        }
        res.json({success: true,
                msj: 'orden procesada correctamente'})

        next();
    })


server.post(
    'SendOrder',
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Order = require('dw/order/Order');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var Logger = require('dw/system/Logger');
        var serviceHelper = require('~/cartridge/scripts/helpers/restAPI');
        var ProductImageDIS = require('*/cartridge/scripts/helpers/ProductImageDIS');
        var orderId = req.querystring.orderId || null;
        var email = req.querystring.email || null;
        var Site = require('dw/system/Site');
        var requestData;
        var userValid = false;
        if (!orderId) {
            res.json({error: 'Faltan Parametros'})
            return next();
        }

        var customer = CustomerMgr.getCustomerByLogin(email);
        if (!customer) {
            res.json({error: 'Usuario no Registrado'})
            return next();
        }
        var customerGroups = customer.getCustomerGroups();
        for each (var customerGroup in customer.getCustomerGroups()) {
            var customerGroupID = customerGroup.getID().toLowerCase();
            if (customerGroupID === 'admindevolucion') {
                userValid = true;
            }
        }
        if(!userValid) {
            res.json({error:'Usuario Invalido'})
            return next();
        }

        var order = OrderMgr.getOrder(orderId);
        if (order) {
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
                res.json({error: false,
                        msj:'Orden enviada a MC correctamente'})
                return next()
            } else if (serviceData.error === 401) {
                var serviceHelper = require('app_custom_storefront_jobs/cartridge/scripts/jobsteps/generateTokenMkt.js');
                var token = serviceHelper.getToken();
                if (token) {
                    var serviceData = serviceHelper.callServiceInsert(requestData);
                    if (serviceData.status === 'OK') {
                        Transaction.wrap(function () {
                            order.custom.enviadoMarketing = true;
                        });
                        res.json({error: false,
                            msj:'Orden enviada a MC correctamente'})
                        return next()
                    } else {
                        if (order.getNotes() != null && order.getNotes().length <= 500) {
                            Transaction.wrap(function () {
                                order.addNote('Error del Servicio', serviceData.errorMessage);
                            });
                            res.json({error: true,
                                msj:'Error al enviar la informacion a MC, error : ' + serviceData.errorMessage})
                            return next()
                        }
                    }
                }

            } else {
                if (order.getNotes() != null && order.getNotes().length <= 500) {
                    Transaction.wrap(function () {
                        order.addNote('Error del Servicio', serviceData.errorMessage);
                    });
                    res.json({error: true,
                        msj:'Error al enviar la informacion a MC, error: ' + serviceData.errorMessage})
                    return next()
                }
            }
        } else {
            res.json({error: true,
                msj:'Orden no encontrada'})
        }
        next()
    })

    module.exports = server.exports();
