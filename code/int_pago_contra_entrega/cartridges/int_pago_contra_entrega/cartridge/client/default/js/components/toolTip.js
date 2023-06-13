'use strict';

$('.info-icon').on('mouseenter focusin', function () {
  $(this).find('.tooltip').removeClass('d-none');
});

$('.info-icon, .payment-options>li').on('mouseleave focusout', function () {
  $(this).find('.tooltip').addClass('d-none');
});

$('.payment-options>li').on('mouseenter focusin', function () {
  if ($(this).data('method-id') === 'PAGO_CONTRA_ENTREGA' && $(this).find('.info-pago-contra-entrega').hasClass('disabled')) {
    $(this).find('.tooltip').removeClass('d-none');
  }
});
