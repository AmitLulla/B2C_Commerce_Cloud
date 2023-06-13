'use strict'

function createOptions(array) {
    var select = document.getElementById('citySelect');
    select.length = 1;
    var value = 0;
    for (value in array) {
        var option = document.createElement("option");
        option.text = array[value];
        option.value = array[value];
        select.add(option);
    }
}


function getDepartaments(value) {
    $.ajax({
        url: 'GetDepartaments-GetCity',
        method: 'Get',
        data: { apt: value },
        async: true,
        success: function (data) {
            if (data.municipiosArray) {
                createOptions(data.municipiosArray)
            }
        }
    })
}

$('#depaSelect').on('change', function () {
    getDepartaments($(this).val())
})

$('#customerNotRegisterForm').submit(function (e) {
    var $form = $(this);
    e.preventDefault();
    var url = $form.attr('action');
    $form.spinner().start();

    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: $form.serialize(),
        success: function (data) {
            if (!data.error) {
                $('#shippingFormPatPrimo').removeClass('d-none');
                $('.shippingFormPatPrimo > input[name="key"]').val(data.key);
                $('#customerNotRegister').addClass('d-none');
            }
            $form.spinner().stop();
        },
        error: function (err) {
            console.log(err);
            $form.spinner().stop();
        }
    });
})

$('.shippingFormPatPrimo').submit(function (e) {
    var $form = $(this);
    e.preventDefault();
    var url = $form.attr('action');
    
    $form.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: $form.serialize(),
        success: function (data) {
            if (data.redirectUrl) {
                $('#modalSocialSelling').modal('toggle');
                $('.url-cocial-copy').attr('href',data.redirectUrl);
                $('.url-social-wa').attr('href',app.urls.urlWats + data.redirectUrl);
                $('.url-social-fb').attr('href',app.urls.urlFaceBook + data.redirectUrl);
            }
            $form.spinner().stop();
        },
        error: function (err) {
            console.log(err);
            $form.spinner().stop();
        }
    });
})
$(document).ready(function () {
    // Copy url
    $('.url-cocial-copy').click(function (e) {
        e.preventDefault();
        navigator.clipboard.writeText($(this).attr('href'));
    });

    $('#modalSocialSelling').on('hidden.bs.modal', function () { 
        location.reload();
    })
})