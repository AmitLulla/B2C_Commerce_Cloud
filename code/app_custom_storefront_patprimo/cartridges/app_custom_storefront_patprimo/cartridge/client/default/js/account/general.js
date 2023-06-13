'use strict';

$('.icon-movil').on('click', function () {
    $(".menu-response").addClass("menu-activo");
   
});

$('#menu-cerrar').on('click', function () {
    $(".menu-response").removeClass("menu-activo");
});


