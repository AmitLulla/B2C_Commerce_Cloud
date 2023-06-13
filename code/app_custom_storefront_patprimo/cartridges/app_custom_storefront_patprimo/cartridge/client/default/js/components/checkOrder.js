'use strict';

var loginChange=
'<a class="login-reloader minus-track-login" href="javascript:location.reload()"><div class="row mt-3" ><div class="custom-icon col-sm-1 minus-m"><img class="lgo" src="https://cdn-icons-png.flaticon.com/512/271/271228.png" alt=""/></div><div class="col-md-10"><t class="title-card-mobile2">Inicia Sesion</t><br/><p class="sub-title-login mt-2">Inicia Sesion en tu cuenta y valida el estatus de tus compras</p></div></div></a>';
var errorMsj = '<div class="container alert alert-danger error-message" role="alert"><p class="error-message-text sub-title-login">'+app.resources.notFounfOrderMsj+'</p></div>';

$('form.trackorder').submit(function(e) {
    e.preventDefault();
    $('.hide-login').removeClass('d-none' );
    $.spinner().start();
        $.ajax({
            url: 'Order-Track',
            type: 'post',
            dataType: 'json',
            data: $(this).serialize(),
            success: function (data) {
                if(!data.error) {
                    $('.change-side').html(data.htmlTemplate);
                    $('.change-login').html(loginChange);
                } else {
                    $('#show-msj-error-not-found').append(errorMsj);
                    setTimeout(function(){
                        $('#show-msj-error-not-found').empty();
                    },2000);
                }
                $.spinner().stop();
            },
            error: function (err) {
                $.spinner().stop();
            }
        });
})