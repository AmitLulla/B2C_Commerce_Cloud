'use strict';

var server = require('server');

server.get(
    'Show',
    server.middleware.https,
    function (req, res, next) {
        var socialHelper = require('*/cartridge/scripts/helpers/addressHelpers');
        var departamentos = socialHelper.getDepartaments();
        var shippingForm = server.forms.getForm('addressCustom');
        shippingForm.clear()
        res.render('social/socialAdmin', { addressForm: shippingForm,
            departamentos:departamentos })
        next();
    })

server.post(
    'SubmitCustomer',
    server.middleware.https,
    function (req, res, next) {
        var form = req.form;
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var socialHelper = require('*/cartridge/scripts/helpers/socialSellingHelper');
        var Transaction = require('dw/system/Transaction');
        var issue = false;
        var key = socialHelper.getCode();
        try {
            Transaction.wrap(function () {
                var social = CustomObjectMgr.createCustomObject("socialSelling", key);
                social.custom.formRegister = JSON.stringify(form);  
            })
        } catch (error) {
            issue = true;
        }
        
        res.json({ error: issue,
                key:key })
        next();
    })

    server.post(
        'SubmitShipping',
        server.middleware.https,
        function (req, res, next) {
            var Transaction = require('dw/system/Transaction');
            var addressForm = server.forms.getForm('addressCustom');
            var CustomObjectMgr = require('dw/object/CustomObjectMgr');
            var URLUtils = require('dw/web/URLUtils');
            var BasketMgr = require('dw/order/BasketMgr');
            var socialHelper = require('*/cartridge/scripts/helpers/socialSellingHelper');
            var currentBasket = BasketMgr.getCurrentBasket();
            var form = req.form;
            var addressObject = addressForm.toObject();

            var infoBasket = socialHelper.getLineItems(currentBasket);
            addressObject.key = form.key;
            Transaction.wrap(function () {
                var customObject = CustomObjectMgr.getCustomObject('socialSelling', form.key);
                customObject.custom.formShipping = JSON.stringify(addressObject);
                customObject.custom.infBasket = JSON.stringify(infoBasket);
                customObject.custom.infVendedor = req.currentCustomer.profile ? req.currentCustomer.profile.email:null;
            })

            
            res.json({redirectUrl: URLUtils.abs('CheckoutServices-SubmitSocial','code',form.key).toString()})
            next();
        })

module.exports = server.exports();