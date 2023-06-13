'use strict';

$(document).ready(function () {
    $('.boton-main.boton1-mainbanner, .boton-main.boton2-mainbanner').on('click', function(){
        var categoryURL = $(this).data('category-url');
        dataLayer.push({ ecommerce: null });
        dataLayer.push({
          event: "select_promotion",
          ecommerce: {
            items: [{
            component_id:  $('.component_id_mainBanner').val(),
            category_url:  categoryURL,
            banner_image_url: $('.image_banner').val()
            }]
          }
        });
    });
});