'use strict';

$(document).ready(function () {
  $('.gridTwo').on('click', function () {
    var productGrid = document.querySelector('.product-grid');
    var product = document.querySelectorAll('.img-grid-patprimo');
    var banner = document.querySelectorAll('.img-grid-banner');
    var legend = document.querySelector('.count');
    var productsStyle = document.querySelectorAll('.productGrid');
    var containerFluid2 = document.querySelector('.content-plp');
    var buttonsCart = document.querySelectorAll('.selectCompraRapidaMobile');
    $('.productGrid').removeClass().addClass('productGrid col-12 col-md-6 col-sm-12 p-0 ');
    $('.variableGrid').removeClass().addClass('col-sm-12 col-md-12 variableGrid grid2by2');
    $('.img-grid-patprimo').removeClass().addClass('img-grid-patprimo img-grid-patprimo-control');
    $('.gridFour').addClass('gridIconOpacity');
    $('.gridTwo').removeClass('gridIconOpacity');
    $('.lower-badges').removeClass('lower-badges-2-colums-mobile');
    $('.selectCompraRapidaMobile').removeClass('hide-mobile');
    $('.selectCompraRapidaMobile').css('margin-top', '3%');
    $('.price').css('margin-top', '2%');
    if ($(window).width() > 800) {
      productGrid.style.width = '80vw';
      productGrid.style.margin = 'auto';
      legend.style.marginLeft = '9rem';

      $('.per').addClass('show-per');
      $('.showM').addClass('show-grid');
      $('.showM').addClass('show-grid');
      $('.pagination-grid').addClass('show-pag');
      var length = product.length;
      for (var index = 0; index < length; index++) {
        product[index].style.height = '45vw';
      }


      var lengthbanner = banner.length;
      if (lengthbanner > 0) {
        for (var indexBanner = 0; indexBanner < lengthbanner; indexBanner++) {
          banner[indexBanner].style.height = '45vw';
          banner[indexBanner].style.width = '219%';
        }
      }
    }

    if ($(window).width() < 800) {
        // small screen, load other JS files
      productGrid.style.width = '100vw';
      productGrid.style.margin = '0px';
      legend.style.paddingRight = '0px';
      legend.style.marginLeft = '5rem';
      legend.style.paddingLeft = '39px';
      legend.style.marginTop = '-12px';

      containerFluid2.style.paddingLeft = '0px';
      var length3 = product.length;
      for (var index3 = 0; index3 < length3; index3++) {
        product[index3].style.height = '115vw';
      }

      var sizeButtons = buttonsCart.length;
      for (var indexButtons = 0; indexButtons < sizeButtons; indexButtons++) {
        buttonsCart[indexButtons].style.display = 'flex';
      }

      var productos = productsStyle.length;
      for (var indexProductos = 0; indexProductos < productos; indexProductos++) {
        productsStyle[indexProductos].style.marginBottom = '-13px';
      }

      var hide = document.querySelector('.slot-banner');
      hide.style.display = 'none';

      var lengthbannermobile = banner.length;
      if (lengthbannermobile) {
        for (var indexbannerMobile = 0; indexbannerMobile < lengthbannermobile; indexbannerMobile++) {
          banner[indexbannerMobile].style.display = 'none';
        }
      }
    }
  });

  $('.gridFour').on('click', function () {
    var productGrid2 = document.querySelector('.product-grid');
    var legend = document.querySelector('.count');
    var containerFluid = document.querySelector('.content-plp');
    var imageSize = document.querySelectorAll('.img-grid-patprimo');
    var banner2 = document.querySelectorAll('.img-grid-banner');
    $('.productGrid').removeClass().addClass('productGrid col-6 col-md-3 col-sm-6  p-0');
    $('.variableGrid').removeClass('grid2by2');
    $('.img-grid-patprimo').removeClass().addClass('img-grid-patprimo');
    $('.gridFour').removeClass('gridIconOpacity');
    $('.gridTwo').addClass('gridIconOpacity');
    $('.lower-badges').addClass('lower-badges-2-colums-mobile');
    $('.selectCompraRapidaMobile').addClass('hide-mobile');

    if ($(window).width() > 800) {
      // small screen, load other JS files
      productGrid2.style.width = '100vw';
      productGrid2.style.margin = '0px';
      legend.style.paddingRight = '2rem';
      legend.style.marginLeft = '0rem';
      $('.per').removeClass('show-per');
      $('.showM').removeClass('show-grid');
      $('.showM').removeClass('show-grid');
      $('.pagination-grid').removeClass('show-pag');

      containerFluid.style.marginRight = '34px';

      var length = imageSize.length;
      for (var index = 0; index < length; index++) {
        imageSize[index].style.height = '31vw';
      }

      var lengthbanner2 = banner2.length;
      if (lengthbanner2) {
        for (var indexBanner2 = 0; indexBanner2 < lengthbanner2; indexBanner2++) {
          banner2[indexBanner2].style.height = '31vw';
          banner2[indexBanner2].style.width = '108%';
        }
      }
    }

    if ($(window).width() < 800) {
      // small screen, load other JS files
      productGrid2.style.width = '100vw';
      productGrid2.style.margin = '0px';
      legend.style.paddingRight = '0px';
      legend.style.marginLeft = '5rem';
      legend.style.paddingLeft = '39px';
      legend.style.marginTop = '-12px';
      containerFluid.style.paddingLeft = '0px';
      var length2 = imageSize.length;
      for (var index2 = 0; index2 < length2; index2++) {
        imageSize[index2].style.height = '58vw';
      }

      var showBanner = document.querySelector('.slot-banner');
      showBanner.style.display = 'block';

      var lengthbanner2Mobile = banner2.length;
      if (lengthbanner2Mobile) {
        for (var indexBanner2Mobile = 0; indexBanner2Mobile < lengthbanner2Mobile; indexBanner2Mobile++) {
          banner2[indexBanner2Mobile].style.display = 'block';
        }
      }
    }
  });


  $('#changingGrid').on('click', '.page-link', function () {
    if ($('div').hasClass('grid2by2')) {
      if ($(window).width() > 912) {
        $('.variableGrid').removeClass('grid2by2');
      }
    }

    document
  .querySelector('#changingGrid')
  .scrollIntoView({ behavior: 'smooth' });

    $('.gridFour').removeClass('gridIconOpacity');
    $('.gridTwo').addClass('gridIconOpacity');
  });


  $('#closeSide').on('click', function () {
    document.getElementById('sidebar').style.display = 'none';
  });

  $('.priceCollapse').on('click', function () {
    var icon = document.getElementById('iconDownPrice');

    if (icon.className == 'fa fa-chevron-right fa-sm') {
      $('#iconDownPrice').removeClass().addClass('fa fa-chevron-down fa-sm');
    } else if (icon.className == 'fa fa-chevron-down fa-sm') {
      $('#iconDownPrice').removeClass().addClass('fa fa-chevron-right fa-sm');
    }
  });


  $('.sizeCollapse').on('click', function () {
    var icon = document.getElementById('iconDownSize');

    if (icon.className == 'fa fa-chevron-right fa-sm') {
      $('#iconDownSize').removeClass().addClass('fa fa-chevron-down fa-sm');
    } else if (icon.className == 'fa fa-chevron-down fa-sm') {
      $('#iconDownSize').removeClass().addClass('fa fa-chevron-right fa-sm');
    }
  });

  $('.ColorCollapse').on('click', function () {
    var icon = document.getElementById('iconDownColor');

    if (icon.className == 'fa fa-chevron-right fa-sm') {
      $('#iconDownColor').removeClass().addClass('fa fa-chevron-down fa-sm');
    } else if (icon.className == 'fa fa-chevron-down fa-sm') {
      $('#iconDownColor').removeClass().addClass('fa fa-chevron-right fa-sm');
    }
  });

  $('.CollectionCollapse').on('click', function () {
    var icon = document.getElementById('iconDownCollection');

    if (icon.className == 'fa fa-chevron-right fa-sm') {
      $('#iconDownCollection').removeClass().addClass('fa fa-chevron-down fa-sm');
    } else if (icon.className == 'fa fa-chevron-down fa-sm') {
      $('#iconDownCollection').removeClass().addClass('fa fa-chevron-right fa-sm');
    }
  });
});
$('.show-side-bar').on('click', '.btn-filter-color', function () {
  if ($('.color-attribute').css('display') === 'block') {
    $('.color-attribute').hide('slow');
    $(this).toggleClass('title-close');
  } else {
    $('.color-attribute').show('slow');
    $(this).toggleClass('title-close');
  }
});
$('.show-side-bar').on('click', '.btn-filter-category', function () {
  if ($('.categories-filter-list').css('display') === 'block') {
    $('.categories-filter-list').hide('slow');
    $(this).toggleClass('title-close');
  } else {
    $('.categories-filter-list').show('slow');
    $(this).toggleClass('title-close');
  }
});

function clearFilterBtn() {
  if (!$('#btnFilterApplied  button').length > 0) {
    $.spinner().start();
    var query = $('#resetLink').data('href').split('?')[1];
    
    var filter =  $('#sideNavigation').data('filter') ? $('#sideNavigation').data('filter').toString().toString().toLowerCase() : null;
    var cards = $('#sideNavigation').data('cards') ? $('#sideNavigation').data('cards') : false;
    
    
    $(document).trigger('appyFilterCustom', {
      url: app.urls.getUrlFilters + query,
      filter: filter,
      cards: cards
    });

    $(document).trigger('appyFilterCustom', {
      url: $('#resetLink').data('href')
    });
    $.spinner().stop();
  } else if (window.arrayValues.length > 0) {
    var query = window.urlReset.split('?')[1];
    var filter =  $('#sideNavigation').data('filter') ? $('#sideNavigation').data('filter').toString().toString().toLowerCase(): null;
    var cards = $('#sideNavigation').data('cards') ? $('#sideNavigation').data('cards').toString().toLowerCase() :  false;
    
    $(document).trigger('appyFilterCustom', {
      url: app.urls.getUrlFilters + query,
      filter: filter,
      cards: cards
    });
  }
}


$('.refinements,.show-side-bar').on('click', '.topnav p', function () {
  $('#sideNavigation').css({ width: '50%' });
});

$('.refinements,.show-side-bar').on('click', '.closebtn', function () {
  clearFilterBtn();
  $('#sideNavigation').css('width', '0');
});

/* Modals Description and Characteristics Desktop */
$('.description-characteristics-section,.description-pdp').on('click', '.description p', function () {
  $('#modalsPDP').css({ width: '100%' });

  // Show the first tab by default
  $('.tabs-stage div').hide();
  $('.tabs-stage div:first').show();

  if ($('.tabs-nav li:first').hasClass('tab-active')) {
    $('.tabs-nav li:first').removeClass('tab-active');
  }

  if ($('.tabs-nav li:last').hasClass('tab-active')) {
    $('.tabs-nav li:last').removeClass('tab-active');
  }

  $('.tabs-nav li:last').removeClass('tab-active');
  $('.tabs-nav li:first').addClass('tab-active');


// Change tab class and display content
  $('.tabs-nav a').on('click', function (event) {
    event.preventDefault();
    $('.tabs-nav li').removeClass('tab-active');
    $(this).parent().addClass('tab-active');
    $('.tabs-stage div').hide();
    $($(this).attr('href')).show();
  });
});


$('.description-characteristics-section ,.description-pdp').on('click', '.back-pdp', function () {
  $('#modalsPDP').css({ width: '0' });
  $('.tabs-nav li:first').removeClass('tab-active');
  $(this).parent().removeClass('tab-active');
});


$('.description-characteristics-section,.characteristics-pdp').on('click', '.characteristics p', function () {
  $('#CharacteristicsPDP').css({ width: '100%' });

  // Show the first tab by default
  $('.tabs-stage-2 div').hide();
  $('.tabs-stage-2 div:first').show();
  $('.tabs-nav-2 li:first').removeClass('tab-active-2');
  $('.tabs-nav-2 li:last').addClass('tab-active-2');
  $('#carac2').css('display', 'block');
  $('#des2').css('display', 'none');


// Change tab class and display content
  $('.tabs-nav-2 a').on('click', function (event) {
    event.preventDefault();
    $('.tabs-nav-2 li').removeClass('tab-active-2');
    $(this).parent().addClass('tab-active-2');
    $('.tabs-stage-2 div').hide();
    $($(this).attr('href')).show();
  });
});

$('.description-characteristics-section,.characteristics-pdp').on('click', '.back-pdp', function () {
  $('#CharacteristicsPDP').css({ width: '0' });
  $('.tabs-nav-2 li:first').removeClass('tab-active-2');
  $(this).parent().removeClass('tab-active-2');
});

/* Modals Description and Characteristics Mobile */
$('.description-characteristics-section-mobile,.description-mobile-pdp').on('click', '.description-mobile p', function () {
  $('#description-mobile').css({ width: '100%' });
});

$('.description-characteristics-section ,.description-mobile-pdp').on('click', '.back-pdp-mobile', function () {
  $('#description-mobile').css({ width: '0' });
});

$('.description-characteristics-section-mobile,.characteristics-mobile-pdp').on('click', '.characteristics-mobile p', function () {
  $('#characteristics-mobile').css({ width: '100%' });
});

$('.description-characteristics-section ,.characteristics-mobile-pdp').on('click', '.back-pdp-mobile', function () {
  $('#characteristics-mobile').css({ width: '0' });
});


$('.size-container').on('click', 'button', function () {
  var query = $(this).data('href').split('?')[1];
  var filter = $(this).data('filter');
  var cards = $(this).data('cards');
  window.urlFilter = $(this).data('href');
  $(document).trigger('appyFilterCustom', {
    url: app.urls.getUrlFilters + query,
    filter: filter,
    cards: cards
  });
  $('#appyFilter').trigger('click');
});
