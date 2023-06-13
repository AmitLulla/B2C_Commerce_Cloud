$(document).ready(function () {
  $('.owl-carousel').owlCarousel({
    center: true,
    items: 7,
    loop: false,

    responsive: {
      0: {
        items: 4,

        nav: false,
        center: true,

        loop: false
      },
      600: {
        items: 3,
        nav: false
      },
      1000: {
        items: 5,
        nav: false,
        loop: false
      }
    }
  });


  var owlStage = $('.owl-stage');
  var owlItem1 = owlStage[0].children;


  if ($(window).width() < 800) {
    if ($('.owl-carousel').hasClass('size-filter')) {
      $(owlStage).css('justitfy-content', 'flex-start');


      for (var indexItem1 = 0; indexItem1 < owlItem1.length; indexItem1++) {
        $(owlItem1[indexItem1]).css('width', '14vw');
      }
    }
  }
});
