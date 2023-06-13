'use strict';

module.exports = {
    callService: function () {
        var Site = require('dw/system/Site');
        var customPreferences = Site.current.preferences.custom;
        var client_id = customPreferences.client_id;
        var client_secret = customPreferences.client_secret;
        var mid = customPreferences.MID_or_account_id;
        var requestData = {};
        requestData.client_id = client_id;
        requestData.client_secret = client_secret;
        requestData.mid = mid;
        requestData.grant_type = 'client_credentials';
        
        return getGenericServiceToken().call(requestData);
    },
    callServiceInsert: function (requestData) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var MKAccessTokenCustomObject = CustomObjectMgr.getCustomObject("MarketingCloudAccessToken", "AccessToken");
        var token = MKAccessTokenCustomObject.custom["accessTokenString"];
        return serviceInsertDataMKT().call(requestData, token);
    },
    callServiceCartInsert: function (requestData) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var MKAccessTokenCustomObject = CustomObjectMgr.getCustomObject("MarketingCloudAccessToken", "AccessToken");
        var token = MKAccessTokenCustomObject.custom["accessTokenString"];
        return serviceInsertDataMKT().call(requestData, token);
    },
    callServiceCartUpdate: function (requestData) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var MKAccessTokenCustomObject = CustomObjectMgr.getCustomObject("MarketingCloudAccessToken", "AccessToken");
        var token = MKAccessTokenCustomObject.custom["accessTokenString"];
        return serviceUpdateDataMKT().call(requestData, token);
    }
};

function getGenericServiceToken() {
    return require('dw/svc/LocalServiceRegistry').createService('mkt_Get_Token', {
        createRequest: function (service, requestData) {
            var credential = service.configuration.credential;
            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
            service.addHeader('Content-Type', 'application/json');

            // Set request method
            service.setRequestMethod('POST');

            // Set request endpoint
            service.setURL(credential.URL);

            return JSON.stringify(requestData);
        },
        parseResponse: function (service, httpClient) {
            return JSON.parse(httpClient.text);
        },
        filterLogMessage: function () {
            return;
        },
        getRequestLogMessage: function () {
            return;
        },
        getResponseLogMessage: function () {
            return;
        }
    });
}

function serviceInsertDataMKT() {
    return require('dw/svc/LocalServiceRegistry').createService('mkt_Insert_Data', {
        createRequest: function (service, requestData, token) {
            var Site = require('dw/system/Site');
            var credential = service.configuration.credential;
            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('Authorization', "Bearer " + token);

            // Set request method
            service.setRequestMethod('POST');

            // Set request endpoint
            service.setURL(credential.URL);

            return JSON.stringify(requestData);
        },
        parseResponse: function (service, httpClient) {
            return JSON.parse(httpClient.text);
        },
        filterLogMessage: function () {
            return;
        },
        getRequestLogMessage: function () {
            return;
        },
        getResponseLogMessage: function () {
            return;
        }
    });
}

function serviceUpdateDataMKT() {
    return require('dw/svc/LocalServiceRegistry').createService('mkt_Update_Data', {
        createRequest: function (service, requestData, token) {
            var Site = require('dw/system/Site');
            var credential = service.configuration.credential;
            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('Authorization', "Bearer " + token);

            // Set request method
            service.setRequestMethod('PUT');

            // Set request endpoint
            service.setURL(credential.URL + '/key:' + Site.current.getCustomPreferenceValue('external_key') +'/rows');

            return JSON.stringify(requestData);
        },
        parseResponse: function (service, httpClient) {
            return JSON.parse(httpClient.text);
        },
        filterLogMessage: function () {
            return;
        },
        getRequestLogMessage: function () {
            return;
        },
        getResponseLogMessage: function () {
            return;
        }
    });
}
