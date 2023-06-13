'use strict';
var Logger = require('dw/system/Logger');
var serviceHelper = require('~/cartridge/scripts/helpers/restAPI');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Calendar = require('dw/util/Calendar');


function sendData() {
    // Get all Custom objects
    var Site = require('dw/system/Site');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var requestData;
    var serviceData = {};
    var cartAbandonedObjects = CustomObjectMgr.queryCustomObjects("cartAbandoned", "custom.sendToMarketing = null Or custom.sendToMarketing = false", null,null);
    while (cartAbandonedObjects.hasNext()) {
        var customObject = cartAbandonedObjects.next();
        var isRegister = CustomerMgr.getCustomerByLogin(customObject.custom.email) ? CustomerMgr.getCustomerByLogin(customObject.custom.email).registered: false;
        var difTime;
        var today = new Date;
        var definiteTime;
        var array1 = [], array2 = [];

        // validate if the user have more than 1 cart abandoned
        var email = customObject.custom.email;
        var cartAbandonedObjectsUser = CustomObjectMgr.queryCustomObjects("cartAbandoned", "custom.sendToMarketing = null Or custom.sendToMarketing = false AND custom.email = {0}", 'creationDate desc',email);
        if (cartAbandonedObjectsUser.count > 1) {
            while (cartAbandonedObjectsUser.hasNext()) {
               var userCart =  cartAbandonedObjectsUser.next();
               if (array1.length === 0) {
                    array1.push(userCart);
                    customObject = userCart;
               } else {
                    if (userCart.custom.firstSend || userCart.custom.secondSend ||
                        userCart.custom.thirdSend || userCart.custom.fourthSend) {
                         // descartar basket antiguos
                         requestData = {
                            "items": [
                                {
                                    'proceso_concluido':true,
                                   'uuidCart':userCart.custom.UUID
                                }
                            ]
                        }
                        serviceData = serviceHelper.callServiceCartUpdate(requestData);
                        if (serviceData.status === 'OK') {
                            try {
                                Transaction.wrap(function () {
                                    customObject.custom.sendToMarketing = true;
                                }); 
                            } catch (error) {
                               
                            }
                            
                        } else {
                            Transaction.wrap(function () {
                                customObject.custom.logError = serviceData.errorMessage;
                            });
                        }
                    }
               }
               
            }
        }
       
        // second send check

        if (customObject.custom.firstSend &&
            !customObject.custom.secondSend &&
            !customObject.custom.thirdSend &&
            !customObject.custom.fourthSend
            ) {
            difTime = new Date(customObject.custom.firstSend);
            var diff =(today.getTime() - difTime.getTime()) / 1000;
            diff /= (60 * 60);
            var totaHours = Math.abs(Math.round(diff));
            definiteTime = Site.current.getCustomPreferenceValue('secondTimeEmail') ? parseFloat(Site.current.getCustomPreferenceValue('secondTimeEmail')): null;
            if (totaHours >= definiteTime) {
                requestData = {
                    "items": [
                        {
                            'segundoEnvio':true,
                           'uuidCart':customObject.custom.UUID
                        }
                    ]
                }
                serviceData = serviceHelper.callServiceCartUpdate(requestData);
                if (serviceData.status === 'OK') {
                    try {
                        Transaction.wrap(function () {
                            customObject.custom.secondSend = new Calendar(new Date()).getTime();
                        }); 
                    } catch (error) {
                       
                    }
                    
                } else {
                    Transaction.wrap(function () {
                        customObject.custom.logError = serviceData.errorMessage;
                    });
                }

            }

        } else if (customObject.custom.secondSend &&
                    customObject.custom.firstSend &&
                    !customObject.custom.thirdSend &&
                    !customObject.custom.fourthSend) {
            definiteTime = Site.current.getCustomPreferenceValue('thirdTimeEmail') ? parseFloat(Site.current.getCustomPreferenceValue('thirdTimeEmail')) : null;
            difTime = new Date(customObject.custom.secondSend);
            var diff =(today.getTime() - difTime.getTime()) / 1000;
            diff /= (60 * 60);
            var totaHours = Math.abs(Math.round(diff));
            if (totaHours >= definiteTime) {
                requestData = {
                    "items": [
                        {
                            'segundoEnvio':false,
                            'tercerEnvio':true,
                           'uuidCart':customObject.custom.UUID
                        }
                    ]
                }
                serviceData = serviceHelper.callServiceCartUpdate(requestData);
                if (serviceData.status === 'OK') {
                    try {
                        Transaction.wrap(function () {
                            customObject.custom.thirdSend = new Calendar(new Date()).getTime();
                        }); 
                    } catch (error) {
                       
                    }
                    
                } else {
                    Transaction.wrap(function () {
                        customObject.custom.logError = serviceData.errorMessage;
                    });
                }

            }

            
        } else if (customObject.custom.thirdSend &&
                    customObject.custom.firstSend &&
                    customObject.custom.thirdSend &&
                    !customObject.custom.fourthSend) {
            definiteTime = Site.current.getCustomPreferenceValue('fourthTimeEmail') ?  parseFloat(Site.current.getCustomPreferenceValue('fourthTimeEmail')) : null;

            difTime = new Date(customObject.custom.thirdSend);
            var diff =(today.getTime() - difTime.getTime()) / 1000;
            diff /= (60 * 60);
            var totaHours = Math.abs(Math.round(diff));
            if (totaHours >= definiteTime) {
                requestData = {
                    "items": [
                        {
                            'tercerEnvio':false,
                            'cuartoEnvio':true,
                            'uuidCart':customObject.custom.UUID
                        }
                    ]
                }
                serviceData = serviceHelper.callServiceCartUpdate(requestData);
                if (serviceData.status === 'OK') {
                    try {
                        Transaction.wrap(function () {
                            customObject.custom.fourthSend = new Calendar(new Date()).getTime();
                            customObject.custom.sendToMarketing = true;
                        }); 
                    } catch (error) {
                       
                    }
                    
                } else {
                    Transaction.wrap(function () {
                        customObject.custom.logError = serviceData.errorMessage;
                    });
                }

            }

        } else {
            requestData = {
                "ContactKey": customObject.custom.UUID,
                "EventDefinitionKey": Site.current.getCustomPreferenceValue('eventDefinitionKey_cart_abandoned'),
                'Data': {
                        'recibeName':customObject.custom.recibeName,
                        'items':customObject.custom.items,
                        'linkBackToCart': customObject.custom.linkBackToCart,
                        'uuidCart':customObject.custom.UUID,
                        'brand': customObject.custom.brand,
                        'Email':customObject.custom.email.toString(),
                        'isRegister':isRegister
                    }
            }
            serviceData = serviceHelper.callServiceCartInsert(requestData);
            if (serviceData.status === 'OK') {
                try {
                    Transaction.wrap(function () {
                        customObject.custom.firstSend = new Date();
                    });
                } catch (error) {
                  
                }
                
            } else {
                Transaction.wrap(function () {
                    customObject.custom.logError = serviceData.errorMessage;
                });
            }
        }
    }
  
}


module.exports = { sendData: sendData };