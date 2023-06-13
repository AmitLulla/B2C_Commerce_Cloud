$(document).ready(function () {
    $('.owl-carousel').owlCarousel({
       loop:true,
       margin:5,
       nav:false,
       responsiveClass:true,
       responsive:{
           0:{
               items:2.8
           },
           600:{
               items:2.8
           },
           1000:{
               items:2.8
           }
       }
    });
    $('.text-fichas').on('click', function(){
        dataLayer.push({ ecommerce: null });
            dataLayer.push({
            event: "select_promotion",
            ecommerce: {
                items: [{
                component_id: $('.component_id').val(),
                category_url: $(this).data('category-url'),
                banner_image_url_1: $(this).parent().data('image-url')
                }]
            }
            });
    });
   });