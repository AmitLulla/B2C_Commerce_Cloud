'use strict';

/**
 * @namespace CheckoutServices
 */

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

function getTotals(input) {
  var redond = Math.round(input);
  var num = redond;
  if (!isNaN(num)) {
      num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');
      num = num.split('').reverse().join('').replace(/^[\.]/, '');
      return num;
  }
}

function getTotalSummaryTemplate(lineItemContainer, totals) {
  var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
  var TotalsModel = require('*/cartridge/models/totals');

  return renderTemplateHelper.getRenderedHtml({
    locale: request.locale,
    order: {
      totals: totals || new TotalsModel(lineItemContainer)
    }
  }, 'checkout/orderTotalSummary');
}

server.get('AddGiftCertificate', function (req, res, next) {
  var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
  var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
  var Resource = require('dw/web/Resource');
  var Transaction = require('dw/system/Transaction');
  var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
  var { getGiftCertificateTotal } = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
  var amount = 0, saldoPending = '';

  var giftCertificate = GiftCertificateMgr.getGiftCertificate(req.querystring.code || '');

  if (!giftCertificate
    || !giftCertificate.isEnabled()
    || giftCertificate.status === giftCertificate.STATUS_PENDING) {

    res.setStatusCode(400);
    res.json({
      error: true,
      errorMessage: Resource.msg(
        'error.gift.certificate.invalid',
        'checkout',
        null
      )
    });
    return next();
  }

  if (giftCertificate.status === giftCertificate.STATUS_REDEEMED) {
    res.setStatusCode(400);
    res.json({
      error: true,
      errorMessage: Resource.msg(
        'error.gift.certificate.nofunds',
        'checkout',
        null
      )
    });
    return next();
  }

  if (giftCertificate.custom.expirationDate) {
    var todayDate = new Date(Date.now());
    var expirationDate = giftCertificate.custom.expirationDate;
    if (todayDate > expirationDate) {
      res.setStatusCode(400);
      res.json({
        error: true,
        errorMessage: Resource.msg(
          'error.gift.certificate.expire',
          'checkout',
          null
        )
      });
    return next();
    }
  }

  var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();

  if (!currentBasket) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Checkout-Begin'));
    return next();
  }

  if (currentBasket.getGiftCertificatePaymentInstruments(req.querystring.code).length) {
    res.setStatusCode(400);
    res.json({
      error: true,
      errorMessage: Resource.msg(
        'error.gift.certificate.applied',
        'checkout',
        null
      )
    });
    return next();
  }

  var totalGC = getGiftCertificateTotal(currentBasket);

  var maximumApplicable = currentBasket.totalGrossPrice.subtract(totalGC);

  if (!maximumApplicable.value) {
    res.setStatusCode(400);
    res.json({
      error: false,
      errorMessage: Resource.msg('error.gift.certificate.maximum.applied', 'checkout', null)
    });
    return next();
  }

  var paymentInstrument = Transaction.wrap(function () {
    return currentBasket.createGiftCertificatePaymentInstrument(
      req.querystring.code,
      (giftCertificate.balance < maximumApplicable ?
        giftCertificate.balance :
        maximumApplicable)
    );
  });

  var totalTest = COHelpers.calculatePaymentTransaction(currentBasket);

  var TotalsModel = require('*/cartridge/models/totals');
  var totals = new TotalsModel(currentBasket);
  if (giftCertificate.balance == maximumApplicable) {
    //maybe finish place order
  }

  //Adding tax to viewData
  var TaxMgr = require('dw/order/TaxMgr');
  var Locale = require('dw/util/Locale');
  var currentLocale = Locale.getLocale(req.locale.id);
  var country;
  if (currentLocale.country == '') {
    country = 'default';
  }
  var taxr = TaxMgr.getTaxRate("standard",currentLocale.country ? currentLocale.country: country );

  if (taxr) {
    var tax = taxr * 100;
    taxr = Resource.msgf('label.order.grand.total.ext', 'confirmation', null, parseFloat(tax).toFixed(1));
  }
  if (currentBasket.giftCertificatePaymentInstruments.length > 0) {
    var totalGiftCertificate = 0;
    for (var key in currentBasket.giftCertificatePaymentInstruments) {
      if (
        currentBasket.giftCertificatePaymentInstruments[key]
          .paymentTransaction
      ) {
        totalGiftCertificate +=
          currentBasket.giftCertificatePaymentInstruments[key]
            .paymentTransaction.amount.value;
      }
    }
    if (totalGiftCertificate != currentBasket.totalGrossPrice.value) {
      amount = (
        currentBasket.totalGrossPrice.value - totalGiftCertificate
      ).toFixed(2);
    }
  }
  if (parseFloat(amount) > 0) {
    amount = parseFloat(amount).toFixed();
      saldoPending = Resource.msgf(
      'saldo.pending',
      'checkout',
      null,
      getTotals(amount)
    )
    session.custom.giftComplete = false;
  } else {
    session.custom.giftComplete = true;
  }

  res.json({
    giftCertificateCard: renderTemplateHelper.getRenderedHtml({
      UUID: paymentInstrument.giftCertificateCode,
      maskedGiftCertificateCode: giftCertificate.maskedGiftCertificateCode,
      formattedAmount: getTotals(paymentInstrument.paymentTransaction.amount.value)
    }, 'checkout/billing/giftCertificateWrapper'),
    orderTotalSummary: getTotalSummaryTemplate(currentBasket, totals),// todo - should we show in order summary?
    basketTotal: totals.grandTotalValue,
    taxRateDefault: taxr ? taxr : '',
    amount : saldoPending,
    amountValue: amount,
    cuponCode:giftCertificate.giftCertificateCode,
    uuidGift: giftCertificate.UUID
  });
  next();
});

server.get('RemoveGiftCertificate', function (req, res, next) {
  var { find } = require('*/cartridge/scripts/util/collections');
  var Transaction = require('dw/system/Transaction');
  var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
  var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  var paymentUUID = req.querystring.uuid;

  var paymentInstrument = find(currentBasket.paymentInstruments, function (pI) {
    return pI.giftCertificateCode && pI.giftCertificateCode === paymentUUID;
  });

  if (paymentInstrument) {
    Transaction.wrap(function () {
      currentBasket.removePaymentInstrument(paymentInstrument);
    });
  }
  if (currentBasket.paymentInstruments.length > 0) {
    var totalGiftCertificate = 0;
    for (var key in currentBasket.giftCertificatePaymentInstruments) {
      var giftCertificate = GiftCertificateMgr.getGiftCertificate(currentBasket.giftCertificatePaymentInstruments[key].giftCertificateCode || '');
        if (giftCertificate.balance.value > 0) {
            totalGiftCertificate +=
              giftCertificate.balance.value;
        }
    }
    if (!(totalGiftCertificate > currentBasket.totalGrossPrice.value)) {
      session.custom.giftComplete = false;
    }
  } else {
    session.custom.giftComplete = false;
  }
  session.custom.removeGift = true;
  
  res.json({
    success: true
  });
  next();
});

module.exports = server.exports();