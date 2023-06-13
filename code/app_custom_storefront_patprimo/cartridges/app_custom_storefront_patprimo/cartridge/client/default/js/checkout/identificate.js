// Flow to Checkout identificate
var formValidation = require('base/components/formValidation');
var isregister;
var scrollAnimate = require('base/components/scrollAnimate');
require('../loginCustom/loginCustom')

function identificate(url, formData, modalOpen , recorderUser) {
    $.ajax({
        url: url,
        method: 'POST',
        data: formData,
        async: true,
        success: function (data) {
            if(data.customerNo) {
                dataLayer.push({
                  event: "user_login",
                  user_id: data.customerNo
                });
              }
            var localStorage = window.localStorage;
            if (data.isRegister) {
                localStorage.setItem('email', data.email);
                localStorage.setItem('url', data.url);
                localStorage.setItem('logued', "true");
                isregister = true;
                if (modalOpen) {
                    $('#bodyModal').html(`<p>${data.msj.replace('@', '<b>' + data.email + '</b>')}</p>`)
                    $('#isRegisterModal').modal('toggle');
                }
                
                $('#infoStage').html(data.infoStage);
                if (data.openModalUpdate) {
                    showEditProfileForm(data.email);
                    $('#LoginCheckoutModalForm button.close').attr('onclick', `location.href="${app.urls.cartShow}"`)
                }
                if (recorderUser) {
                    $('.ctn-is-register').trigger('click');
                }
            } else {
                localStorage.setItem('email', '');
                localStorage.setItem('logued', "false");
                isregister = false;
                $('#step-customer-bar').attr('data-already-registered',true);
                $('#customerNotRegister').removeClass('d-none');
                $("#customerNotRegister").css('display','block');
                $('#formIdentificate').hide();
                var valueSplit = formData.split('=', 2);
                var email = unescape(valueSplit[1]).split('&')[0];
                $('input[type=email]').val(email);
            }

        }
    })
}

function updateCustomerGuest(email, isregister) {
    var formData;
    var url = $('.info-hide').length > 0 ? $('.info-hide').data('url') : $('#customerNotRegister form').data('action');
    if (!isregister) {
        formData = email;
    } else {
        formData = {
            dwfrm_coCustomer_email: email,
            csrf_token: $('input[name=csrf_token]').val()
        }
    }
    $.ajax({
        url: url,
        method: 'POST',
        data: formData,
        async: true,
        success: function (data) {
            if (!data.error) {
                // $('#datosContacto').addClass('d-none')
                $('#shipping-step').removeClass('d-none');
                $('.submit-shipping').removeClass('d-none');
                $('#step-ship-bar').addClass('background-select');
                $('#customerNotRegister').hide();
                $('#recibeName').val(data.recibeName);
            }
            if(data.basket && data.basketModel) {
                $('.coupons-and-promos').empty().append(data.basketModel.totals.discountsHtml);
                updateCartTotals(data.basketModel);
                if(data.basket.approachingDiscounts){
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                }
                validateBasket(data.basketModel);
                $('body').trigger('promotion:success', data.basketModel);
                $('.coupon-error-message').html('');
            }
        }
    })
}

function validationCustomerRegistration(form) {
    var missingFields = false;
    for (var i = 0; i < form.length; i++) {
        if (form[i].type != 'checkbox') {
            if (form[i].value.length === 0) {
                missingFields = true;
                return missingFields;
            }
        }
    }
    return missingFields;
}

function loginCheckout(data) {
    $.ajax({
        url: 'Account-Verify',
        method: 'POST',
        data: data,
        async: true,
        success: function (data) {
            console.log(data)
        }
    })
}

function showEditProfileForm(email) {
    $.ajax({
        url: 'Account-EditProfileCustom',
        method: 'GET',
        dataType: 'text',
        data:{csrf_token:$('.token-csrf').val(),email:email},
        success: function (data) {
            $('.modal-body-for-filed').html(data)
            $('#LoginCheckoutModalForm').modal('show');
        },
        error: function (err) {
            
        }
    })
}

function SubmitloginCheckout(data) {
    $.ajax({
        url: 'Account-Confirm',
        method: 'POST',
        data: data,
        async: true,
        success: function (data) {
            if (data.success) {
                $('#errorLoginCheckout').html('');
                showEditProfileForm();
            } else {
                $('#errorLoginCheckout').html(app.resources.codeWrong);
            }
        }
    })
}

function requiredFields () {
    $('.company-information').toggleClass('d-none');
    if($('.company-information').hasClass('d-none')){
        $('.company-information input[type=text]').removeAttr('required');
    } else {
        $('.company-information input[type=text]').attr('required',true);
    }
}

$(document).ready(function () {

    $("#LoginCheckoutModalForm").on("hidden.bs.modal", function () {
        if ($('.modal-update-active').data('update-modal') === true) {
            window.location.href = app.urls.cartShow;
        }
    });
   
    $('#formIdentificate').on('submit', function (e) {
        e.preventDefault();
        if ($('#formIdentificate :input[name=dwfrm_identificate_email]').val().length > 0 &&
            $('#formIdentificate :input[type=checkbox]').is(':checked') === true) {
            $('#formIdentificate button[type=submit]').removeAttr('role','tooltip');
            $('#formIdentificate :input[type=checkbox]').removeAttr('id','cb1');
            $('#formIdentificate div.invalid-feedback').empty();
            var formData = $(this).serialize();
            var url = $(this).data('action');
            var modalOpen = true;
            identificate(url, formData, modalOpen);
        } else {
            $('#formIdentificate button[type=submit]').attr('role','tooltip');
            $('#formIdentificate :input[type=checkbox]').attr('id','cb1');
        }
    })

    if ($('#checkout-main').data('customer-type') === 'registered') {
        var url = $('#formIdentificate').data('action');
        var formData = $('#formIdentificate').serialize();
        var modalOpen = false;
        identificate(url, formData, modalOpen);
    }

    if ($('#formIdentificate > div.submit-customer-div').data('submit-customer') && $('#formIdentificate > div.submit-customer-div').data('submit-customer').length > 0 &&
        $('#checkout-main').data('checkout-stage') === 'customer' &&
        $('#checkout-main').data('customer-type') === 'guest' ) {
        var formData = $('#formIdentificate').serialize();
        var url = $('#formIdentificate').data('action');
        var modalOpen = false;
        var recorderUser = true;
        identificate(url, formData, modalOpen, recorderUser);

    }

    $('.ctn-is-register').on('click', function () {
        $('#isRegisterModal').modal('hide');
        $('#infoStage').removeClass('d-none');
        $('#formIdentificate').addClass('d-none')
    })

    $('#infoStage').on('click', '.btn-continuar-to-shipping', function () {
        updateCustomerGuest($('.info-hide').data('email'), isregister);
        $('#contentAddress').removeClass('d-none');
    })

    $('#LoginCheckoutModalForm').submit('.btn-submit-edit-profile-form-custom', function (e) {
        var $form = $('#dwfrm_profile');
        e.preventDefault();
        var url = $form.attr('action');
        $form.spinner().start();
        $('form.edit-profile-form-custom').trigger('profile:edit', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                $form.spinner().stop();
                if (!data.success) {
                    formValidation($form, data);
                } else {
                    location.reload();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $form.spinner().stop();
            }
        });
        return false;
    });

    $('#infoStage').on('click', '#updateInfoUser', function () {
        $('form[name=login-form]>input[name=code]').val('');
        if ($('#checkout-main').data('customer-type') === 'registered') {
            showEditProfileForm();
        } else {
            var data = {
                loginEmail: $('.info-hide').data('email'),
                csrf_token: $('input[name=csrf_token]').val()
            }
            loginCheckout(data);
            $('.emailUser').html('');
            $('.emailUser').append($('.info-hide').data('email'));
            $('#LoginCheckoutModal').modal('show');
        }

    })

    $('#LoginCheckoutModal').on('click', '.submit-login-checkout', function () {
        var data = {
            csrf_token: $('input[name=csrf_token]').val(),
            formEmail: $('.info-hide').data('email'),
            loginPassword: $('form.login-custom-checkout input[name=code]').val()
        }
        SubmitloginCheckout(data)

    })

    $('#LoginCheckoutModalForm').on('click','#addCompanyInformation', function() {
        requiredFields();
    })

    $('#addCompanyInformation').on('click', function() {
        requiredFields();
    })

    $("#LoginCheckoutModalForm").on("hidden.bs.modal", function () {
        if (!$('#LoginCheckoutModal').is(':hidden')) {
            $('#LoginCheckoutModal').modal('hide');
            location.reload();
        }
       
    });

    $('#re-send-code').on('click', function () {
        var data = {};
        var email = $('.info-hide').data('email');
        var url = $(this).data('href');
        data.url = url;
        data.email = email;
        $(document).trigger("reSendCode",data);
    })

    $('#LoginCheckoutModalForm').on('submit','.edit-profile-form-custom', function (e) {
        e.preventDefault();
        if ($('.company-information').css('display') === 'block') {
            if ($('input[name=dwfrm_profile_customer_nit]').val() != $('input[name=confirmNit]').val()) {
                $("#LoginCheckoutModalForm #nitWrong").html(app.resources.nitWrong);
                return false;
            }else {
                $("#LoginCheckoutModalForm #nitWrong").html('');
            }
        }
    })

    const getAddress = (e, data) => {
        $.spinner().start();
        $.ajax({
            url: data.url,
            method: 'GET',
            data: { email: data.email },
            async: true,
            success: function (data) {
                var editLink = ''
                var html = '';
                if (data.address.length > 0) {
                    data.address.forEach(function (item, index) {
                        if (data.isAuthenticated) {
                            editLink = `<a class="d-flex justify-content-end" href="${app.urls.editAddress}?addressId=${encodeURIComponent(item.ID)}">
                            <img class="icons18x18 mr-1" alt="editAddress" src="${app.urls.iconEdit}" style="vertical-align: baseline !important;"/></a>`;    
                        }

                        html += `<li class="list-group-item list-group-item-${item.ID}">
                                    <div class="container-flex-direction">
                                        <div> 
                                            <input class="customerAddress customerAddress-${index}" type="radio" name="savedAddress" value="${item.uuid}" id="${item.ID}" ${index ==0 ?'checked' : ''}>
                                            <label for="savedAddress-${item.ID}">${item.ID}</label>
                                        </div>
                                        <div>${editLink}</div>
                                    </div>
                                    <p class="container"> ${item.address1} ${item.city}</p>
                                </li>`
                    })

                    $('.enviarDomicilio').removeClass('d-none');
                    $('#enviarDomicilio').html(`<ul class="list-group"> ${html} </ul>`);
                    html += '<a id="show-shipping-form">Agregar una nueva dirección</a>';
                    $('#enviarDomicilio').html(html)
                    getShippingCostShippingAddress($('.customerAddress:checked'));
                    $('.customerAddress:checked').trigger('click');
                } else {
                    $('#shippingFormPatPrimo').removeClass('d-none');
                }
                $.spinner().stop();
                $('.customerAddress').on('click', function (e) {
                    var urlParams = {};
                    urlParams.addressID =  $(this).attr("id");
                    var url = $(this).parents('form').data('select-shipping-address-url');
                    $.spinner().start();
                    $('body').trigger('checkout:beforeShippingMethodSelected');
                    $.ajax({
                        url: url+'?addressID='+urlParams.addressID,
                        type: 'post',
                        dataType: 'json',
                        data: urlParams
                    })
                        .done(function (data) {
                            if (data.error) {
                               // window.location.href = data.redirectUrl;
                            //    createErrorNotification('TestError customer address');
                               getShippingCostShippingAddress($('.customerAddress:checked'));
                            } else {
                                $('body').trigger('checkout:updateCheckoutView',
                                    {
                                        order: data.order,
                                        customer: data.customer,
                                        options: { keepOpen: true },
                                        urlParams: urlParams
                                    }
                                );
                                $('body').trigger('checkout:postUpdateCheckoutView',
                                    {
                                        el: $('.shipping-method-list')
                                    }
                                );
                            }
                            $('body').trigger('checkout:shippingMethodSelected', data);
                            $.spinner().stop();
                        })
                        .fail(function () {
                            $.spinner().stop();
                        });                    
                });
            }
        })
    }

    $(document).on('getAddress', getAddress);

});
function getShippingCostShippingAddress(el){
    var url = '';
    if(el) {
        url = el.parents('form').data('select-shipping-address-url');
    }
    var addressID = el.attr("id");
    $.spinner().start();
                    $('body').trigger('checkout:beforeShippingMethodSelected');
                    $.ajax({
                        url: url+'?addressID='+addressID,
                        type: 'post',
                        dataType: 'json',
                    })
                        .done(function (data) {
                            if (data.error) {
                                // window.location.href = data.redirectUrl;
                            //    createErrorNotification('TestError customer address');
                               getShippingCostShippingAddress($('.customerAddress:checked'));
                            } else {
                                $('body').trigger('checkout:updateCheckoutView',
                                    {
                                        order: data.order,
                                        customer: data.customer,
                                        options: { keepOpen: true },
                                    }
                                );
                                $('body').trigger('checkout:postUpdateCheckoutView',
                                    {
                                        el: $('.shipping-method-list')
                                    }
                                );
                            }
                            $('body').trigger('checkout:shippingMethodSelected', data);
                            $.spinner().stop();
                        })
                        .fail(function () {
                            $.spinner().stop();
                        });
}

function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
    'fade show" role="alert">' +
    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
    '<span aria-hidden="true">&times;</span>' +
    '</button>' + message + '</div>';

    $('.shipping-error-custom').append(errorHtml);
    scrollAnimate($('.shipping-error-custom'));
    setTimeout(function() {  $('.shipping-error-custom .alert-danger').remove(); }, 20000);
}

function updateCartTotals(data) {
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    $('.sub-totalQ').empty().append((data.totals.subTotal).substring(1));
    $('.minicart-link').attr({
        'aria-label': data.resources.minicartCountOfItems,
        title: data.resources.minicartCountOfItems
    });

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        if (data.totals.orderLevelDiscountTotal.value > 0) {
            $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
        }
        if (item.renderedPromotions) {
            $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        } else {
            $('.item-' + item.UUID).empty();
        }
        $('.uuid-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.line-item-price-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
    });
}
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                'fade show" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' + data.valid.message + '</div>';

            $('.cart-error').append(errorHtml);
        } else {
            $('.cart').empty().append('<div class="row"> ' +
                '<div class="col-12 text-center"> ' +
                '<h1>' + data.resources.emptyCartMsg + '</h1> ' +
                '</div> ' +
                '</div>'
            );
            $('.number-of-items').empty().append(data.resources.numberOfItems);
            $('.minicart-quantity').empty().append(data.numItems);
            $('.minicart-link').attr({
                'aria-label': data.resources.minicartCountOfItems,
                title: data.resources.minicartCountOfItems
            });
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');
        }

        $('.checkout-btn').addClass('disabled');
    } else {
        $('.checkout-btn').removeClass('disabled');
    }
}
module.exports = {
    validationCustomerRegistration: validationCustomerRegistration,
    updateCustomerGuest: updateCustomerGuest
};
