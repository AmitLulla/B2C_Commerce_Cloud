$(document).ready(function () {
  $('.owl-carousel').owlCarousel({
    loop: true,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
        nav: true
      },
      600: {
        items: 6,
        nav: true
      },
      1000: {
        items: 5,
        nav: true,
        loop: false
      }
    }
  });
});

