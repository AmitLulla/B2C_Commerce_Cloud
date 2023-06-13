'use strict';

/**
 * @namespace GiftCard
 */

var server = require('server');


server.get(
    'Center',
    server.middleware.https,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
        var amount = req.querystring.amount || null;
        var merchantID = req.querystring.merchantID || null;
        var giftCertificate;
        if(amount) {
            var dataReturn;
            Transaction.wrap(function () {
                var giftCertificate = GiftCertificateMgr.createGiftCertificate(amount);
                dataReturn = {
                    merchantID: giftCertificate.merchantID,
                    giftCertificateCode:giftCertificate.giftCertificateCode,
                    enabled:giftCertificate.enabled,
                    amount:giftCertificate.amount.value,
                    balance:giftCertificate.balance.value
                }
            })
        } else if(merchantID) {
           giftCertificate = GiftCertificateMgr.getGiftCertificateByMerchantID(merchantID);
           dataReturn = {
                merchantID: giftCertificate.merchantID,
                giftCertificateCode:giftCertificate.giftCertificateCode,
                enabled:giftCertificate.enabled,
                amount:giftCertificate.amount.value,
                balance:giftCertificate.balance.value
           }
        } else {
            dataReturn = {empty:true}
        }

    res.json({data:dataReturn})
    next()
    })
module.exports = server.exports();