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
  if ($('.owl-carousel').hasClass('size-filter')) {
    
    var owlStage = document.querySelectorAll('.owl-stage');
    var owlItem = owlStage[0].childNodes;
    var owlStageOuter = document.querySelectorAll('.owl-stage-outer');
    
 

    if($('.owl-carousel').hasClass('false')){
      

      if ($(window).width() > 800) {

        $('.refinement-bar').removeClass('pants');

         for (var item = 0; item < owlItem.length; item++) {
           owlItem[item].style.width = '9vw';
         }
  
  
         for (var indexStage = 0; indexStage < owlStage.length; indexStage++) {
           owlStage[indexStage].style.justifyContent = 'flex-start';
         }
      }


      if ($(window).width() < 800) {

        for (var indexStage2 = 0; indexStage2 < owlStage.length; indexStage2++) {
          owlStage[indexStage2].style.justifyContent = 'flex-start';
          owlStage[indexStage2].style.marginLeft =  '-10%';
        }
        
        for (var item2 = 0; item2 < owlItem.length; item2++) {
          owlItem[item2].style.width = '35vw';
          owlItem[item2].style.marginLeft = '25%';
        }

        
  
  
         for (var indexStageOuter2 = 0; indexStageOuter2 < owlStageOuter.length; indexStageOuter2++) {
           owlStageOuter[indexStageOuter2].style.marginLeft = '-5%';
           
         }
      }
    }

    if($('.owl-carousel').hasClass('true')){
      

      if ($(window).width() > 800) {

        $('.refinement-bar').removeClass('pants');

         for (var item = 0; item < owlItem.length; item++) {
           owlItem[item].style.width = '9vw';
         }
  
  
         for (var indexStage = 0; indexStage < owlStage.length; indexStage++) {
           owlStage[indexStage].style.justifyContent = 'flex-start';
         }
      }


      if ($(window).width() < 800) {

        for (var indexStage2 = 0; indexStage2 < owlStage.length; indexStage2++) {
          owlStage[indexStage2].style.justifyContent = 'flex-start';
          owlStage[indexStage2].style.marginLeft =  '-10%';
        }
        
        for (var item2 = 0; item2 < owlItem.length; item2++) {
          owlItem[item2].style.width = '35vw';
          owlItem[item2].style.marginLeft = '25%';
        }

  
  
         for (var indexStageOuter2 = 0; indexStageOuter2 < owlStageOuter.length; indexStageOuter2++) {
           owlStageOuter[indexStageOuter2].style.marginLeft = '-5%';
           
         }
      }
    }




  } else if ($('.owl-carousel').hasClass('color-fit')) {
    var outerColor = document.querySelectorAll('.owl-stage');
    var itemsColor = outerColor[0].childNodes;
    var outerStageColor = document.querySelector('.owl-stage-outer');
    

    if($('.owl-carousel').hasClass('true')){
      
        
      if ($(window).width() > 800) {
        outerColor[0].style.paddingRight = '6%';

        outerStageColor.style.left = '-45%';
        for (var colorIndex = 0; colorIndex < itemsColor.length; colorIndex++) {
          itemsColor[colorIndex].style.width = '13%';
        }
      }

      if ($(window).width() < 800) {
         outerColor[0].style.paddingLeft = '3rem';
         for (var colorIndex2 = 0; colorIndex2 < itemsColor.length; colorIndex2++) {
           itemsColor[colorIndex2].style.marginLeft = '111px';
         }
      }
    }

    if($('.owl-carousel').hasClass('false')){
      if ($(window).width() > 800) {
        $('.refinement-bar').addClass('pants');
        outerStageColor.style.left = '-30%';

        $('.pants').css('top','-42px');
        
        for (var colorIndex3 = 0; colorIndex3 < itemsColor.length; colorIndex3++) {
          itemsColor[colorIndex3].style.width = '10%';
        }
      }

      if ($(window).width() < 800) {
        $('.refinement-bar').removeClass('pants');
        outerStageColor.style.marginLeft = '-1%';
      }
    }

  } else if ($('.owl-carousel').hasClass('jeans-fit')) {
    var outerFit = document.querySelectorAll('.owl-stage');
    var itemsFit = outerFit[0].childNodes;

    

    if($('.owl-carousel').hasClass('true')){
     
     if ($(window).width() > 800) {
      outerFit[0].style.justifyContent = 'flex-start';
      for (var FitIndex = 0; FitIndex < itemsFit.length; FitIndex++) {
        itemsFit[FitIndex].style.width = '13%';
      }
      $('.cards-size').css('width','140px');
      $('.refinement-bar').removeClass('pants');
     }

     if ($(window).width() < 800) {
      for (var FitIndex2 = 0; FitIndex2 < itemsFit.length; FitIndex2++) {
        itemsFit[FitIndex2].style.width = '21%';
        itemsFit[FitIndex2].style.marginLeft = '120px';
      }

      for (var indexStage = 0; indexStage < outerFit.length; indexStage++) {
        outerFit[indexStage].style.marginLeft = '6%';
      }
     }
    }

    if($('.owl-carousel').hasClass('false')){
      
      if ($(window).width() > 800) {
        outerFit[0].style.justifyContent = 'flex-start';
        for (var FitIndex = 0; FitIndex < itemsFit.length; FitIndex++) {
          itemsFit[FitIndex].style.width = '13%';
        }
      }
       if ($(window).width() < 800) {
         for (var FitIndex2 = 0; FitIndex2 < itemsFit.length; FitIndex2++) {
           itemsFit[FitIndex2].style.width = '21%';
         }
      }
     }



  } else if ($('.owl-carousel').hasClass('price-fit')) {
    var outerPrice = document.querySelectorAll('.owl-stage');
    var itemsPrice = outerPrice[0].childNodes;

    if ($(window).width() > 800) {
      for (var priceIndex = 0; priceIndex < itemsPrice.length; priceIndex++) {
        itemsPrice[priceIndex].style.width = '46%';
      }

      $('.cards-size').css('width','263px');
      
    }


    if ($(window).width() < 800) {
      
      for (var priceIndex2 = 0; priceIndex2 < itemsPrice.length; priceIndex2++) {
        itemsPrice[priceIndex2].style.width = '210px';
        itemsPrice[priceIndex2].style. marginLeft= '112px';

      }

      $('.cards-size').css('width','220px');


    }
  }
});

