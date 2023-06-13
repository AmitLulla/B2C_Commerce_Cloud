'use strict';

var serviceHelper = require('~/cartridge/scripts/helpers/restAPI');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

function saveToken(accessToken) {
    var MKAccessTokenCustomObject = CustomObjectMgr.getCustomObject("MarketingCloudAccessToken", "AccessToken");
    var date = new Date();
    
    if (!MKAccessTokenCustomObject) {
        Transaction.wrap(function () {
            MKAccessTokenCustomObject = CustomObjectMgr.createCustomObject("MarketingCloudAccessToken", "AccessToken");
            MKAccessTokenCustomObject.custom["accessTokenString"] = accessToken;
            MKAccessTokenCustomObject.custom["updatedTime"] = date.toLocaleString();
        })
    } else {
        Transaction.wrap(function () {
            MKAccessTokenCustomObject.custom["accessTokenString"] = accessToken;
            MKAccessTokenCustomObject.custom["updatedTime"] = date.toLocaleString();
        });
    }
}

function getToken() {
    var ok = true;
    var serviceData = serviceHelper.callService();
    var token = serviceData.object.access_token;
    try {
        saveToken(token);
    } catch (error) {
        ok = false;
    }
   
    return ok;
}


module.exports = { getToken: getToken };


