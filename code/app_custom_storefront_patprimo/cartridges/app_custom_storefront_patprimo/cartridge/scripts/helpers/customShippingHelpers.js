'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

function getCustomShippingCostDepartamentos() {
    var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0}", "custom.ciudad asc AND custom.municipio asc",'*');
    var departamentos_completo = [];
    var departamentos = [];
        while (result.hasNext()) {
            var departamento = result.next();
            departamentos_completo.push(departamento);
            if(departamentos.length > 0){
                if (departamentos.indexOf(departamento.custom.ciudad) === -1) {
                    departamentos.push(departamento.custom.ciudad);
                }
            }else {
                departamentos.push(departamento.custom.ciudad);
            }
        }

        return {
            departamentos: departamentos,
            departamentos_completo: departamentos_completo
        };
}

function getCustomShippingCostsDepartamento(departamento, municipio) {
    if(municipio) {
        var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0} AND custom.municipio LIKE {1}", null, departamento, municipio);
    } else {
        var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0} ", "custom.departamento-municipio asc", departamento);
    }
    var shippingCostDepartamento = {};
    var tiempoTransportadora = '';
    while (result.hasNext()) {
        departamento = result.next();
        shippingCostDepartamento = {
            costoEnvioExpress: departamento.custom.costoEnvioExpress,
            costoEnvioContraentrega: departamento.custom.costoEnvioContraentrega,
            costoEnvioNormal: departamento.custom.costoEnvioNormal
        };
        tiempoTransportadora = departamento.custom.tiempoTransportadora;

    }
        return {shippingCostDepartamento: shippingCostDepartamento, tiempoTransportadora: tiempoTransportadora };
}

function getCustomShippingCostDepartamento(departamento, municipio, shippingMethodID) {
    var costo = 0;
    if(municipio){
        var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0} AND custom.municipio LIKE {1}", null, departamento, municipio);
    } else {
        var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0} ", "custom.departamento-municipio asc", departamento);
    }
    while (result.hasNext()) {
        var departamentoObj = result.next();
        switch (shippingMethodID) {
            case 'envioExpress':
                costo =  departamentoObj.custom.costoEnvioExpress;
                break;
            case 'envioContraEntrega':
                costo = departamentoObj.custom.costoEnvioContraentrega;
                break;
            case 'envioNormal':
                costo = departamentoObj.custom.costoEnvioNormal;
                break;
        }
        if(!municipio){
            break;
        }
    }
    return costo;
}

function getCustomShippingCostDefault(shippingMethodID, defaultShippingAddress) {
    var costo = {};
    var departamento = '';
    var result = CustomObjectMgr.queryCustomObjects("departamento", "custom.ciudad LIKE {0}", "custom.ciudad asc AND custom.municipio asc", "*");
    while (result.hasNext()) {
        departamento = result.next();
        switch (shippingMethodID) {
            case 'envioNormal':
                costo = departamento.custom.costoEnvioNormal;
                break;
            case 'envioExpress':
                costo = departamento.custom.costoEnvioExpress;
                break;
            case 'envioContraEntrega':
                costo = departamento.custom.costoEnvioContraentrega;
                break;
            case 'bopis':
                break;
        }
        if(defaultShippingAddress) {
            session.custom.departamento = departamento.custom.ciudad;
            session.custom.municipio = departamento.custom.municipio;
        }
        break;
    }
    return costo;
}
 function getCustomApplicableShippingMethods(orderModel, currentBasket, defaultShippingAddress) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var shipmentModel = ShippingMgr.getShipmentShippingModel(currentBasket.getShipments()[0]);
    var applicableShippingMethods = shipmentModel.getApplicableShippingMethods();
    var shippingCostArray = [];
    var shipmentsUUID = {};
    for (var i = 0 in applicableShippingMethods) {
        var shippingCost = shipmentModel.getShippingCost(applicableShippingMethods[i]);
        shippingCostArray.push(shippingCost);
        switch (applicableShippingMethods[i].ID) {
            case 'envioNormal':
                shipmentsUUID['envioNormal'] = applicableShippingMethods[i].UUID
                break;
            case 'envioExpress':
                shipmentsUUID['envioExpress'] = applicableShippingMethods[i].UUID
                break;
            case 'envioContraEntrega':
                shipmentsUUID['envioContraEntrega'] = applicableShippingMethods[i].UUID
                break;
            default:
                shipmentsUUID[applicableShippingMethods[i].ID] = applicableShippingMethods[i].UUID
                break;
        }
    }
    var customShippingHelpers = require('*/cartridge/scripts/helpers/customShippingHelpers');
    var shippingCostDepartamento = {};
    if(session.custom.departamento && session.custom.municipio && !defaultShippingAddress) {
        shippingCostDepartamento = getCustomShippingCostsDepartamento(session.custom.departamento, session.custom.municipio);
        var estimatedArrivalTime = shippingCostDepartamento.tiempoTransportadora;
        shippingCostDepartamento = shippingCostDepartamento.shippingCostDepartamento;
    } else if (session.custom.departamento && !session.custom.municipio && !defaultShippingAddress) {
        shippingCostDepartamento = getCustomShippingCostsDepartamento(session.custom.departamento, session.custom.municipio);
        var estimatedArrivalTime = shippingCostDepartamento.tiempoTransportadora;
        shippingCostDepartamento = shippingCostDepartamento.shippingCostDepartamento;
    } else {
        var departamentosArrays = customShippingHelpers.getCustomShippingCostDepartamentos();
        var departamentos = departamentosArrays.departamentos;
        var departamentos_completo = departamentosArrays.departamentos_completo;
        shippingCostDepartamento = {
            costoEnvioExpress: departamentos_completo[0].custom.costoEnvioExpress,
            costoEnvioContraentrega: departamentos_completo[0].custom.costoEnvioContraentrega,
            costoEnvioNormal: departamentos_completo[0].custom.costoEnvioNormal
        };
        var estimatedArrivalTime =  departamentos_completo[0].custom.tiempoTransportadora;
    }
    var applicableShippingMethods_t = [];
    var applicableShippingMethods_Order = orderModel.shipping[0].applicableShippingMethods;
    var shipmentUUID, shippingMethodID;
    for (var i = 0 in applicableShippingMethods_Order) {
        var shippingMethodObj = '';
        switch (applicableShippingMethods_Order[i].ID) {
            case 'envioNormal':
                if (shippingCostDepartamento.costoEnvioNormal != 0) {
                    shippingMethodObj = {
                        default: true,
                        ID: applicableShippingMethods_Order[i].ID,
                        description: "",
                        displayName: applicableShippingMethods_Order[i].displayName,
                        online: true,
                        cost: shippingCostDepartamento.costoEnvioNormal,
                        shippingCost: shippingCostDepartamento.costoEnvioNormal,
                        selected: true,
                        estimatedArrivalTime: estimatedArrivalTime
                    };
                    shippingMethodID = applicableShippingMethods_Order[i].ID;
                }
                break;
            case 'envioExpress':
                if (shippingCostDepartamento.costoEnvioExpress != 0) {
                    shippingMethodObj = {
                        ID: applicableShippingMethods_Order[i].ID,
                        description: "",
                        displayName: applicableShippingMethods_Order[i].displayName,
                        online: true,
                        cost: shippingCostDepartamento.costoEnvioExpress,
                        shippingCost: shippingCostDepartamento.costoEnvioExpress,
                        selected: false,
                        estimatedArrivalTime: customShippingHelpers.setMensajeEnvioExpress()
                    };
                }
                break;
            case 'envioContraEntrega':
                break;
            default:
                shippingMethodObj = applicableShippingMethods_Order[i];
                break;
        }
        if (shippingMethodObj != '') {
            applicableShippingMethods_t.push(shippingMethodObj);
        }
        if (shippingMethodObj.default) {
            shipmentUUID = shipmentsUUID[shippingMethodObj.ID];
        }
    }
    return applicableShippingMethods_t;
 }

 function selectShippingMethodNoAddress(shipment, shippingMethodID) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var applicableShippingMethods;
    var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);
    applicableShippingMethods = shipmentModel.applicableShippingMethods;
    var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    var isShipmentSet = false;
   
    if (shippingMethodID) {
        var iterator = applicableShippingMethods.iterator();
        while (iterator.hasNext()) {
            var shippingMethod = iterator.next();
            if (shippingMethod.ID === shippingMethodID) {
                shipment.setShippingMethod(shippingMethod);
                isShipmentSet = true;
                break;
            }
        }
    }

    if (!isShipmentSet) {
        if (collections.find(applicableShippingMethods, function (sMethod) {
            return sMethod.ID === defaultShippingMethod.ID;
        })) {
            shipment.setShippingMethod(defaultShippingMethod);
        } else if (applicableShippingMethods.length > 0) {
            var firstMethod = getFirstApplicableShippingMethod(applicableShippingMethods, true);
            shipment.setShippingMethod(firstMethod);
        } else {
            shipment.setShippingMethod(null);
        }
    }
}
function setColombiaTime() {
    var Site = require('dw/system/Site');

    var timeHours = new Date();
    var hours = timeHours.getHours();
    var colombiaHorasDif = Site.current.getCustomPreferenceValue('setHoursCol');
    var dif = hours - colombiaHorasDif;
    timeHours.setHours(dif);
    return timeHours;
}
function setMensajeEnvioExpress() {
    var Resource = require('dw/web/Resource');
    var colombiaTime = setColombiaTime();
    var today = setColombiaTime();
    today = today.setHours(11,00,00);
    var fechaAcomparar = new Date(today);
    var mensaje = '';
    if(colombiaTime.getDay() != 0 && colombiaTime.getDay() != 6){
        if(fechaAcomparar > colombiaTime){
            mensaje = Resource.msg('label.envio.mensaje.envio.express.recibelo.hoy', 'checkout', null);
        } else {
            mensaje = Resource.msg('label.envio.mensaje.envio.express.recibelo.manana', 'checkout', null);
        }
    } else if (colombiaTime.getDay() == 6) {
        if(fechaAcomparar > colombiaTime){
            mensaje = Resource.msg('label.envio.mensaje.envio.express.recibelo.hoy', 'checkout', null);
        }
    }
    return mensaje;
    
}

module.exports = {
    getCustomShippingCostDepartamentos: getCustomShippingCostDepartamentos,
    getCustomShippingCostDepartamento: getCustomShippingCostDepartamento,
    getCustomShippingCostDefault:getCustomShippingCostDefault,
    getCustomApplicableShippingMethods: getCustomApplicableShippingMethods,
    selectShippingMethodNoAddress: selectShippingMethodNoAddress,
    setMensajeEnvioExpress: setMensajeEnvioExpress
};