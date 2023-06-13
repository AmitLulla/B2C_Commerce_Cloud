'use strict';

$(document).ready(function () {
    $('.seccion-descuentos-desktop .pleca-descuentos-estado-inicial').on('click', function (e) {
        if ($('.pleca-descuentos').hasClass('d-none')) {
            $('.pleca-descuentos').addClass('d-flex').removeClass('d-none');
            $(this).addClass('d-none').removeClass('d-block');
        } else {
            $(this).addClass('d-block').removeClass('d-none');
            $('.pleca-descuentos').addClass('d-none').removeClass('d-block');
        }
    });
    $('.seccion-descuentos-desktop .btn-close').on('click', function (e) {
        $('.seccion-descuentos-desktop .pleca-descuentos-estado-inicial').addClass('d-block').removeClass('d-none');
        $('.pleca-descuentos').addClass('d-none').removeClass('d-flex');
    });

    $('.check-customer-email').on('click', function (e) {
        if ($('.section-only-button').hasClass('d-none')) {
            $('.section-only-button').removeClass('d-none');
        } else {
            $('.section-only-button').addClass('d-none');
            $('.section-only-button').addClass('d-none');
        }

        if ($('.section-email-input').hasClass('d-none')) {
            $('.section-email-input').removeClass('d-none');
        } else {
            $('.section-email-input').addClass('d-none');
        }
        // $('.seccion-newsletter').addClass('seccion-newsletter-active');


    });

    $('form.form-email-referido').submit(function (e) {
        var $form = $(this);
        e.preventDefault();
        var url = $form.attr('action');
        url = url.replace('emailParam', $('.customerEmail').val());
        $form.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $form.spinner().stop();
                if (data.cuid) {
                    var urlReferido = $('.url-referidos').attr('href');
                    var urlReferidoWa = $('.url-referido-wa').attr('href');
                    var urlReferidoFb = $('.url-referido-fb').data('href');
                    urlReferido = urlReferido.replace('customerNoParam', data.cuid);
                    urlReferidoWa = urlReferidoWa.replace('customerNoParam', data.cuid);
                    urlReferidoFb = urlReferidoFb.replace('customerNoParam', data.cuid);
                    urlReferidoFb = urlReferidoFb +'&title=Regístrate y Gana un 20% Dcto, en tu primera compra en Pat primo';
                    $('.url-referidos').attr('href', urlReferido);
                    $('.url-referido-wa').attr('href', urlReferidoWa);
                    $('.url-referido-fb').data('href', urlReferidoFb);
                    //lanzar modal
                    $('#modalDescuento').modal('show');
                    $('#form-email-error-ref').removeClass('is-invalid');
                  
                }
            },
            error: function (err) {
                if (err.responseJSON.error) {
                    $('#form-email-error-ref').text(err.responseJSON.errorMessage);
                    $('#form-email-error-ref').siblings('.form-control').addClass('is-invalid');
                    
                }
                $form.spinner().stop();
            }
        });
        return false;
    });

    $('form.form-email-referido2').submit(function (e) {
        var $form = $(this);
        e.preventDefault();
        var url = $form.attr('action');
        url = url.replace('emailParam', $('.customerEmail-mobile').val());
        $form.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $form.spinner().stop();
                if (data.cuid) {
                    var urlReferido = $('.url-referidos').attr('href');
                    var urlReferidoWa = $('.url-referido-wa').attr('href');
                    var urlReferidoFb = $('.url-referido-fb').data('href');
                    urlReferido = urlReferido.replace('customerNoParam', data.cuid);
                    urlReferidoWa = urlReferidoWa.replace('customerNoParam', data.cuid);
                    urlReferidoFb = urlReferidoFb.replace('customerNoParam', data.cuid);
                    urlReferidoFb = urlReferidoFb +'&title=Regístrate y Gana un 20% Dcto, en tu primera compra en Pat primo';
                    $('.url-referidos').attr('href', urlReferido);
                    $('.url-referido-wa').attr('href', urlReferidoWa);
                    $('.url-referido-fb').data('href', urlReferidoFb);
                    //lanzar modal
                    $('#modalDescuento').modal('show');
                   
                    $('#form-email-error-ref2').removeClass('is-invalid');
                }
            },
            error: function (err) {
                if (err.responseJSON.error) {
                    $('#form-email-error-ref2').text(err.responseJSON.errorMessage);
                    $('#form-email-error-ref2').siblings('.form-control').addClass('is-invalid');
                }
                $form.spinner().stop();
            }
        });
        return false;
    });

    $(".url-referido-fb").on('click', function() {
        var fbUrl = 'https://www.facebook.com/sharer/sharer.php?u='+$(this).data("href")+'&amp;src=sdkpreparse';
        window.open(fbUrl,'sharer','toolbar=0,status=0,width=580,height=325');
      });

    

});

const plecaDescuento= document.querySelector(".pleca-descuentos-mobile");
const botonPleca = document.querySelector(".seccion-descuentos-mobile"); 
const botonCerrar=document.querySelector(".btn-close-mobile");
const botonreferidos=document.querySelector(".check-mobile-email");
const seccionMobile=document.querySelector(".section-only-button-mobile"); 
const ActivarReferidos=document.querySelector(".boton-activar-referidos"); 
const NewsletterSeccion=document.querySelector(".seccion-newsletter"); 
const ReferidosSeccion=document.querySelector(".seccion-referidos");

ActivarReferidos.addEventListener("click",function(){
    NewsletterSeccion.style.width = "50%";
    ReferidosSeccion.style.width = "45%";

})


botonPleca.addEventListener("click",function(){
    botonPleca.style.display = "none";
    plecaDescuento.style.display = "flex";
})
botonCerrar.addEventListener("click",function(){
    plecaDescuento.style.display = "none";
    botonPleca.style.display = "flex"
    botonreferidos.style.display = "flex";
})
botonreferidos.addEventListener("click",function(){
    botonreferidos.style.display = "none";
    seccionMobile.style.display = "none";

})


