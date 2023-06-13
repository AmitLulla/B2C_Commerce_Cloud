/* eslint-disable */
'use strict';

function applyErrorMessage(errorMessage) {
  $('#giftCertInvalidMessage').html(errorMessage);
  $('#giftCert').addClass('is-invalid');
}
function applyPaymentMethodErrorMessage(errorMessage) {
    $('.giftcert-invalid-paymentmethod').html(errorMessage);
    $('.giftcert-invalid-paymentmethod').css('display', 'block');
}
function validateGiftCertificate() {
  const elm = $('#giftCert');
  const code = elm.val();
  if (!code) {
    const errorMessage = $('.gift-cert-wrapper').data('missing-error');
    applyErrorMessage(errorMessage);
    return false;
  }

  $('#giftCertInvalidMessage').html('');
  elm.removeClass('is-invalid');
  return true;
}

function getTotals(input) {
  var redond = Math.round(input);
  var num = redond;
  if (!isNaN(num)) {
      num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');
      num = num.split('').reverse().join('').replace(/^[\.]/, '');
      return num;
  }
}

function submitGiftCertificate() {
  $('.submit-giftCert').on('click', () => {
    if (!validateGiftCertificate()) {
      return false;
    }

    const $giftCertificate = $('#giftCert');
    const code = $giftCertificate.val();
    $.spinner().start();
    $.ajax({
      url: 'CheckoutServices-AddGiftCertificate',
      data: {
        code: code
      },
      success: (data) => {
        $('.applied-gift-certificates').append(data.giftCertificateCard);
        $('.gift-certificate-card').removeClass('d-none')
        $('.order-total-summary').html(data.orderTotalSummary);
        $('.card-installments').html(data.installments);
        $('.giftcert-invalid-paymentmethod').css('display', 'none');
        $('.tax-total-checkout').html(data.taxRateDefault);
        $('.btn-block ,submit-payment').removeClass('d-none');
        $('#giftCert').val('');
        $('#giftCode').addClass('gift-'+data.cuponCode);
        if (data.amount.length > 0) {
          $("#saldoPending").html(data.amount);
          $('.grand-total-value').val(data.amountValue);
          var amountReplace = getTotals(data.amountValue);
          $('#totalEntregaReplace').html(app.resources.contraEntregaReplace.replace('$$','$ ' + amountReplace));
        } else {
          var paymentsList = $('.payment-information ul.payment-options li');
          if (paymentsList.length > 0) {
              for (var i = 0; i < paymentsList.length; i++) {
                  if (paymentsList[i].getAttribute('data-method-id') != 'GIFT_CERTIFICATE') {
                    paymentsList[i].className += ' d-none';
                  }
              }
          }
        }

        $.spinner().stop();
      },
      error: (data) => {
        applyErrorMessage(data.responseJSON.errorMessage);
        $.spinner().stop();
      }
    });
  });
}

function removeGiftCertificate() {
  $('body').on('click', '.remove-gift-certificate', (e) => {
    e.preventDefault();
    const elm = e.target;
    const url = elm.href;
    if (url) {
      $.spinner().start();
      $.ajax({
        url: url,
        complete: (data) => {
          $(elm).closest('.gift-certificate-card').remove();

          if (data.responseJSON.orderTotalSummary) {
            $('.order-total-summary').html(data.responseJSON.orderTotalSummary);
          }

          if (data.responseJSON.installments) {
            $('.card-installments').html(data.responseJSON.installments);
          }

          $('.payment-options-block').removeClass('payment-disabled');
          $.spinner().stop();
          location.reload();
        }
      });
    }
  });
}

module.exports = {
    submitGiftCertificate: submitGiftCertificate,
    removeGiftCertificate: removeGiftCertificate
};
