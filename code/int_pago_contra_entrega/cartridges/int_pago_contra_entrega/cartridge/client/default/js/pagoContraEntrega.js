
function createOptions (array) {
    var select = document.getElementById('citySelect');
    select.length=1;
    for (value in array.sort()) {
        var option = document.createElement("option");
        option.text = array[value];
        option.value = array[value];
        select.add(option);
       }
}

const applyPaymentMethod = (e, values) => {
    $.ajax({
        url: 'GetDepartaments-ApplyPaymentMethod',
        method: 'post',
        data: {city:values.city},
        async: true,
        success: function (data) {
            if(data.showPayment) {
                $('#li-payment-method-contra-entrega').show();
                $('#contra-entrega-card-content').show();
                $('#efecty-tab').hide();
                localStorage.setItem('method-id', 'PAGO_CONTRA_ENTREGA');

            } else {
                $('#li-payment-method-contra-entrega').length > 0 ? $('#li-payment-method-contra-entrega').hide() : null;
                $('#contra-entrega-card-content').hide();
                $('#efecty-tab').show();
                localStorage.setItem('method-id', 'MPEfecty');
            }
        }
    })
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

function getDepartaments(value) {
    $.ajax({
        url: 'GetDepartaments-GetCity',
        method: 'Get',
        data: {apt:value},
        async: true,
        success: function (data) {
            if(data.municipiosArray) {
                createOptions(data.municipiosArray)
            }
        }
    })
}

function updateGiftTotal () {
    $.ajax({
        url: 'CheckoutShippingServices-GetAmountGiftCertificate',
        method: 'GET',
        success: function (data) {
            if(data.data.insuficientBalance) {
                $("#saldoPending").html(data.data.saldoPending);
            }
        }
    })
}

$(document).ready(function () {
    var page = $('.page').data('action') ? $('.page').data('action'):null;
    if(page != null && page.indexOf('Address') != -1) {
        $('#shippingFormPatPrimo').removeClass('d-none');
        getDepartaments($('#depaSelect').val())
    }
    if ($('.page').data('action') === 'Address-EditAddress') {
        $('#depaSelect').on('change', function () {
            getDepartaments($(this).val())
        })
    }

    $(document).on('applyPaymentMethod', applyPaymentMethod);
    require('./components/toolTip');
    var addressHelpers = require('base/checkout/address');


    $('.info-pago-contra-entrega').on('click', function(e){
        var $shippingForm = $('.shipping-form.form-shipping-c');
        var methodID ='envioContraEntrega';
        var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
        var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
        urlParams.shipmentUUID = shipmentUUID;
        urlParams.methodID = methodID;
        urlParams.changePaymentMethod = false;
        $.ajax({
            url: 'CheckoutShippingServices-SelectShippingMethod',
            method: 'POST',
            data: urlParams,
            success: function (data) {
                if(data) {
                    $('body').trigger('checkout:updateCheckoutView',
                    {
                        order: data.order,
                        customer: data.customer,
                        options: { keepOpen: true }
                    });
                    $('body').trigger('checkout:shippingMethodSelected', data);
                    $('#totalEntregaReplace').html(app.resources.contraEntregaReplace.replace('$$','$ ' + getTotals(data.order.totals.grandTotalValue)));
                }
            }
        });
    });
    $('.payment-options li').on('click', function(){
        var actualizarShipping = true;
        if($('.payment-options').find('li.nav-item').length > 0){
            $('.payment-options').find('li.nav-item').each(function(i) {
                if($(this).hasClass('d-none') && $(this).data('method-id') == 'PAGO_CONTRA_ENTREGA') {
                    actualizarShipping = false;
                }
            });
        }
        if(actualizarShipping) {
            var paymentMethod = $(this).data('method-id');
            if(paymentMethod != 'PAGO_CONTRA_ENTREGA') {
                var $shippingForm = $('.shipping-form.form-shipping-c');
                var methodID = null;
                var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
                var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
                urlParams.shipmentUUID = shipmentUUID;
                urlParams.methodID = methodID;
                urlParams.changePaymentMethod = true;
                $.ajax({
                    url: 'CheckoutShippingServices-SelectShippingMethod',
                    method: 'POST',
                    data: urlParams,
                    success: function (data) {
                        if(data) {
                            $('body').trigger('checkout:updateCheckoutView',
                            {
                                order: data.order,
                                customer: data.customer,
                                options: { keepOpen: true }
                            }
                        );
                        $('body').trigger('checkout:shippingMethodSelected', data);
                        }
                    }
                })
                updateGiftTotal();
            } else {
                updateGiftTotal();
            }
        }
    });
})