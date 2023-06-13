'use strict';

var formValidation = require('../components/formValidation');
require('../components/checkOrder');

$('#sendCode').on('click', function () {
    var data = {}
    var email = $('#form-email').val();
    var sendCodeUrl =  $('#sendCodeUrl').val();
    data.email = email;
    data.url = sendCodeUrl;
    $('#sendCode').prop('disabled', true);
    setTimeout(function() {
          $('#sendCode').prop('disabled', false);
    }, 5000);
    $(document).trigger("reSendCode",data);
  });

$(document).ready(function () {
  const reSendCode = (e, data) => {
    $.spinner().start();
    $.ajax({
      url: data.url,
      type: 'post',
      dataType: 'json',
      data: {'data': data.email},
      success: function (data) {
        $('#sendCodeMessage').removeClass('d-none');
        setTimeout(function() {
              $('#sendCodeMessage').addClass('d-none');
        }, 5000);
        $.spinner().stop();
      },
      error: function (data) {
      }
    });
  }
  $(document).on('reSendCode', reSendCode);
})



window.onload = function() {
  

  if($(window).width() < 900 ){
      
      $('.clase-mod-js-deck').removeClass('list-group m-3 m-1 rectangle-login-card');
      $('.clase-mod-js-card').removeClass('list-group-item m-1' );
      $('.custom-a-js').removeClass('float-left' );
      $('.custom-icon').removeClass('col-sm-1 offset-md-1 justify-content-end' );
      $('.custom-tit-js').removeClass('float-left ml-3' );
      $('.custom-body-card').removeClass('col-md-10 justify-content-start' );
      $('.ls').removeClass('col-md-10' );
      $('.js-center').addClass('text-center' );
      $('.custom-a-js2').removeClass('float-right' );

      $('.margin-birth-js').removeClass('row  margin-birth separator form-group div-fnacimiento margin-mobile' );
      
      $('.hide-tracking').addClass('d-none')
      $('.custom-a-js2').removeClass('col-lg-3' );
      $('.js-custom-sub-login').addClass('text-center float-right' );

      $('.txt1').addClass('d-none' );
      $('.txt2').removeClass('d-none' );

       
      $('#login-form-email').attr('placeholder', "*Ingresa tu correo electrónico")

      
      $('.custom-clas-phone1').removeClass('col-3 col')
      $('.custom-clas-phone2').removeClass('col-9 col')

      $('.custom-clas-phone1').addClass('col-3 col')
      $('.custom-clas-phone2').addClass('col-9 col')
      
      $('.custom-clas-phone1','.custom-clas-phone2').addClass('col')
      $('.custom-class-gender').addClass('col')
      $('.margin-birth-js').addClass('col-12')
     

      $('.custom-class-gender').removeClass('col-lg-3')
      
      
      
      $('.custom-a-js2').addClass('float-left' );
      $('.custom-body-card').addClass('card-title text-center' );

      $('.custom-tit-js').addClass('text-center' );
      $('.clase-mod-js-card').addClass('card card-mobile');
      $('.clase-mod-js-deck').addClass('card-deck');
      $('.custom-icon').addClass('card-img-top' );

      
  } 
 

}

module.exports = {
  verify: function () {
    $('form.login-custom').submit(function (e) {
      var form = $(this);
      e.preventDefault();
      var url = form.attr('action');
      form.spinner().start();
      $('form.login-custom').trigger('login:submit', e);
      $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: form.serialize(),
        success: function (data) {
          form.spinner().stop();
          if (!data.success) {
            formValidation(form, data);
            $('#login').removeClass('active');
            $('#register').addClass('active');
            $('.txt2').addClass('d-none');
            if($(window).width() < 900){
              $('.txt3').removeClass('d-none');
            }           
            $('#registration-form-email').val(data.user);
            $('#title-custom').text(data.message);
          } else {
            $('#login').removeClass('active');
            $('#loginconfirm').addClass('active');
            $('#form-email').val(data.user);
            $('#title-custom').text(data.message);
            $('#email-confirmation-span').html(data.user);
          }
        },
        error: function (data) {
          if (data.responseJSON.redirectUrl) {
            window.location.href = data.responseJSON.redirectUrl;
          } else {
            $('#login').removeClass('active');
            $('#register').addClass('active');
            form.spinner().stop();
          }
        }
      });
      return false;
    });
  },
  confirm: function () {
    $('form.login-custom-confirm').submit(function (e) {
      var form = $(this);
      e.preventDefault();
      var url = form.attr('action');
      form.spinner().start();
      $('form.login-custom-confirm').trigger('login:submit', e);
      $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: form.serialize(),
        success: function (data) {
          form.spinner().stop();
          if (!data.success) {
            formValidation(form, data);
            $('form.login-custom-confirm').trigger('login:error', data);
          } else {
            $('form.login-custom-confirm').trigger('login:success', data);
            if(data.customerNo) {
              dataLayer.push({
                event: "user_login",
                user_id: data.customerNo
              });
            }
            location.href = data.redirectUrl;
          }
        },
        error: function (data) {
          if (data.responseJSON.redirectUrl) {
            window.location.href = data.responseJSON.redirectUrl;
          } else {
            $('form.login-custom-confirm').trigger('login:error', data);
            form.spinner().stop();
          }
        }
      });
      return false;
    });
  }
};