'use strict';
var pagination = require('jquery-paginate');
/**
 * Update DOM elements with Ajax results
 *
 * @param {Object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @return {undefined}
 */
function updateDom($results, selector) {
  var $updates = $results.find(selector);
  $(selector).empty().html($updates.html());
}

/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 *
 * @param {Object} $results - jQuery DOM elementb
 * @return {undefined}
 */
function handleRefinements($results) {
  $('.refinement.active').each(function () {
    $(this).removeClass('active');
    var activeDiv = $results.find('.' + $(this)[0].className.replace(/ /g, '.'));
    activeDiv.addClass('active');
    activeDiv.find('button.title').attr('aria-expanded', 'false');
  });
  updateDom($results, '.refinements');
}

/**
 * Parse Ajax results and updated select DOM elements
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function parseResults(response) {
  var $results = $(response);
  var specialHandlers = {
      '.refinements': handleRefinements
  };

  [
      '.grid-header',
      '.header-bar',
      '.header.page-title',
      '.product-grid',
      '.show-more',
      '.filter-bar'
  ].forEach(function (selector) {
      updateDom($results, selector);
  });

  Object.keys(specialHandlers).forEach(function (selector) {
      specialHandlers[selector]($results);
  });

}

/**
 * This function retrieves another page of content to display in the content search grid
 * @param {JQuery} $element - the jquery element that has the click event attached
 * @param {JQuery} $target - the jquery element that will receive the response
 * @return {undefined}
 */
function getContent($element, $target) {
  var showMoreUrl = $element.data('url');
  $.spinner().start();
  $.ajax({
    url: showMoreUrl,
    method: 'GET',
    success: function (response) {
      $target.append(response);
      $.spinner().stop();
    },
    error: function () {
      $.spinner().stop();
    }
  });
}


/**
 * Update sort option URLs from Ajax response
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */

window.arrayValues = [];
function updateSortOptions(response) {
  var $tempDom = $('<div>').append($(response));
  var sortOptions = $tempDom.find('.grid-footer').data('sort-options').options;
  var urls = $tempDom.find('.grid-footer').data('shows');
  sortOptions.forEach(function (option) {
    $('option.' + option.id).val(option.url);
  });
}

module.exports = {
  filter: function () {
        // Display refinements bar when Menu icon clicked
    $('.container,.container-fluid').on('click', 'button.filter-results', function () {
      $('.refinement-bar, .modal-background').show();
      $('.refinement-bar').siblings().attr('aria-hidden', true);
      $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', true);
      $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', true);
      $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', true);
      $('.refinement-bar .close').focus();
    });
  },
  ChangeGrid: function () {
        // Display Product Grid Changed
    $('.gridThree').on('click', function () {

    });
  },


  closeRefinements: function () {
        // Refinements close button
    $('.container,.container-fluid').on('click', '.refinement-bar button.close, .modal-background', function () {
      $('.refinement-bar, .modal-background').hide();
      $('.refinement-bar').siblings().attr('aria-hidden', false);
      $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', false);
      $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', false);
      $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', false);
      $('.btn.filter-results').focus();
    });
  },

  resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
    $(window).resize(function () {
      $('.refinement-bar, .modal-background').hide();
      $('.refinement-bar').siblings().attr('aria-hidden', false);
      $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', false);
      $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', false);
      $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', false);
    });
  },

  sort: function () {
        // Handle sort order menu selection
    $('.container,.container-fluid').on('change', '[name=sort-order]', function (e) {
      var url = this.value;
      e.preventDefault();

      $.spinner().start();
      $(this).trigger('search:sort', this.value);
      $.ajax({
        url: this.value,
        data: { selectedUrl: this.value },
        method: 'GET',
        success: function (response) {
          $('.product-grid').empty().html(response);
          
          var product = document.querySelectorAll('.img-grid-patprimo');
          
        if($('.gridFour').hasClass('gridIconOpacity')){
            $('.productGrid').removeClass().addClass('productGrid col-12 col-md-6 col-sm-12 p-0 ');

           //Desktop
            if ($(window).width() > 800) {
              for(var index = 0; index < product.length; index++){
                product[index].style.height = '45vw';
              }
            } 

            //Mobile
            if ($(window).width() < 800) {
              for(var index2 = 0; index2 < product.length; index2++){
                product[index2].style.height = '115vw';
                } 
            }
             
          }
          $.spinner().stop();
          if(url.includes('UpdateGrid')){
            $.ajax({
              url: url.replace('UpdateGrid', 'UpdateGridDL'),
              data: { selectedUrl: url.replace('UpdateGrid', 'UpdateGridDL') },
              method: 'GET',
              success: function (response) {
                dataLayer.push({
                  event: "category_viewed",
                  ordered_by:  response.ordered_by,
                  product_category: response.product_category, //Categoría principal
                  product_subcategory: response.product_subcategory, //Categoría secundaria
                  number_results: response.number_results, //Cantidad de resultados
                  located_page: response.located_page //Rango de ubicación de página
              });
              },
              error: function () {
                $.spinner().stop();
              }
            });
          }
        },
        error: function () {
          $.spinner().stop();
        }
      });
    });
  },

  showMore: function () {
        // Show more products
    $('.container,.container-fluid').on('click', '.show-more button', function (e) {
      e.stopPropagation();
      var showMoreUrl = $(this).data('url');
      e.preventDefault();
      $.spinner().start();

      $.ajax({
        url: showMoreUrl,
        data: { selectedUrl: showMoreUrl, validation: true },
        method: 'GET',
        success: function (response) {
          updateSortOptions(response);
          $('.product-grid').empty().html(response);
          var product = document.querySelectorAll('.img-grid-patprimo');
          var start = showMoreUrl.indexOf('start');
          var string = showMoreUrl.substring(start);

          var indexStart = string.indexOf('start');
          var indexNum = string.indexOf('&');
          var numPage = '';
          numPage = string.substring(indexStart,indexNum);
          var nextPage = '';
          var currentPage = window.location.href;
          
          if(currentPage.includes('start')){
            var first = currentPage.indexOf('?');
            var index = currentPage.substring(0,first);
            
            if($('.gridFour').hasClass('gridIconOpacity')){
                $('.productGrid').removeClass().addClass('productGrid col-12 col-md-6 col-sm-12 p-0 ');   

                //Desktop
                if ($(window).width() > 800) {
                  for(var index = 0; index < product.length; index++){
                    product[index].style.height = '45vw';
                  }
                } 
    
                //Mobile
                if ($(window).width() < 800) {
                  for(var index2 = 0; index2 < product.length; index2++){
                    product[index2].style.height = '115vw';
                    } 
                }
            }
    
            var url = index + '?' + numPage;
            window.history.pushState({},'',url);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          else{

            if($('.gridFour').hasClass('gridIconOpacity')){
              $('.productGrid').removeClass().addClass('productGrid col-12 col-md-6 col-sm-12 p-0 ');   

               //Desktop
               if ($(window).width() > 800) {
                for(var index = 0; index < product.length; index++){
                  product[index].style.height = '45vw';
                }
              } 
  
              //Mobile
              if ($(window).width() < 800) {
                for(var index2 = 0; index2 < product.length; index2++){
                  product[index2].style.height = '115vw';
                  } 
              }
          }
            nextPage = currentPage + '?' + numPage;
            window.history.pushState({},'',nextPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          $.spinner().stop();
          if(showMoreUrl.includes('UpdateGrid')){
            $.ajax({
              url: showMoreUrl.replace('UpdateGrid', 'UpdateGridDL'),
              data: { selectedUrl: showMoreUrl.replace('UpdateGrid', 'UpdateGridDL') },
              method: 'GET',
              success: function (response) {
                var ordered_by = response.ordered_by;
                if(ordered_by == '') {
                  ordered_by = $('.options[name="sort-order"]').find(":selected").data('id');
                }
                dataLayer.push({
                  event: "category_viewed",
                  ordered_by:  ordered_by,
                  product_category: response.product_category, //Categoría principal
                  product_subcategory: response.product_subcategory, //Categoría secundaria
                  number_results: response.number_results, //Cantidad de resultados
                  located_page: response.located_page //Rango de ubicación de página
              });
              },
              error: function () {
                $.spinner().stop();
              }
            });
          }
        },
        error: function () {
          $.spinner().stop();
        }
      });
    });
  },
  getFilterUrl: function () {
    $('.container-fluid, .color-filters-side-bar').on(
      'click',
      '.color-filters-side-bar li button, .refinements li button, .refinement-bar button.reset, .filter-value button, .swatch-filter button',
        function (e) {
          var valuesBtn = {
              value: $(this).data('value') +'--'+ $(this).data('href'),
          };
          window.arrayValues.push($(this).data('value'))
          var query = $(this).data('href').split('?')[1];
          var filter = $(this).closest('.sidenav, .filters-button').data('filter') ? $(this).closest('.sidenav, .filters-button').data('filter').toString().toLowerCase() : null;
          var cards = $(this).closest('.sidenav').data('cards') ? $(this).closest('.sidenav').data('cards').toString().toLowerCase() : false;
          if(filter == 'filtrofit'){
            filter = 'filtroFit';
          }
          $.spinner().start();
          window.urlFilter = $(this).data('href');
          $.ajax({
              url: app.urls.getUrlFilters+query,
              data: {
                selectedUrl: $(this).data('href'),
                values:JSON.stringify(valuesBtn),
                displayName: filter,
                cards: cards
              },
              method: 'GET',
              success: function (response) {
                
                if (response.canToDoRender) {
                    $('.show-side-bar').empty().html(response.htmlTemplate);
                    $('.size-container').empty().html(response.contentFit);
                    $('#sideNavigation').css({'width':"50%"});
                    if ($('#sideNavigation .filter-Applied button:disabled').length > 0) {
                      $('#countfilters').append('('+($('#sideNavigation .filter-Applied button').length -1)+')');
                      $('.filters').append('('+($('#sideNavigation .filter-Applied button').length -1)+')');
                    } else {
                      $('#countfilters').append('('+ $('#sideNavigation .filter-Applied button').length +')');
                      $('.filters').append('('+ $('#sideNavigation .filter-Applied button').length +')');
                    }
                }
                $.spinner().stop();
              }
            });
        });
  },


  applyFilter: function () {
        // Handle refinement value selection and reset click
    $('.container,.container-fluid').on(
            'click',
            '#appyFilter',
            function (e) {
              e.preventDefault();
              e.stopPropagation();
              $.spinner().start();
              $(this).trigger('search:filter', e);
              var attributeId = '#' + $(this).find('span').last().attr('id');
              $.ajax({
                url:  window.urlFilter,
                data: {
                  page: $('.grid-footer').data('page-number'),
                  selectedUrl: $(this).data('href')
                },
                method: 'GET',

                success: function (response) {
                  window.urlReset = window.urlFilter;
                  parseResults(response);
                  $("#btnFilterApplied").empty();
                  $(".filter-Applied button").clone().attr("class", "swatch-filter filter-value filter-Applied-clonado").appendTo("#btnFilterApplied");
                  $( "#btnFilterApplied :disabled" ).addClass('d-none');
                  if ($('#sideNavigation .filter-Applied button:disabled').length > 0) {
                      $('.filters').empty().append('Filtros'+ '  ('+($('#sideNavigation .filter-Applied button').length -1)+')');
                      $('#countfilters').empty().append('('+($('#sideNavigation .filter-Applied button').length -1)+')');
                  } else {
                      $('.filters').empty().append('Filtros'+ '  ('+ $('#sideNavigation .filter-Applied button').length +')');
                      $('#countfilters').empty().append('('+ $('#sideNavigation .filter-Applied button').length +')');
                  }

                   var product = document.querySelectorAll('.img-grid-patprimo');
          
                  if($('.gridFour').hasClass('gridIconOpacity')){
                      $('.productGrid').removeClass().addClass('productGrid col-12 col-md-6 col-sm-12 p-0 ');

                        //Desktop
                          if ($(window).width() > 800) {
                            for(var index = 0; index < product.length; index++){
                              product[index].style.height = '45vw';
                            }
                          } 

                          //Mobile
                          if ($(window).width() < 800) {
                            for(var index2 = 0; index2 < product.length; index2++){
                              product[index2].style.height = '115vw';
                              } 
                          }        
                  }
                  $.spinner().stop();
                  $(attributeId).parent('button').focus();
                  window.arrayValues = [];
                },
                error: function () {
                  $.spinner().stop();
                  $(attributeId).parent('button').focus();
                }
              });
            });
  },

  removeFilter : function () {
    $('.search-results').on('click', '.filter-Applied-clonado', function () {
      var query = $(this).data('href').split('?')[1];
      
      var filter = $('.filters-button').data('filter') ? $('.filters-button').data('filter').toString().toLowerCase() : null;
      var cards = $('.filters-button').data('cards') ? $('.filters-button').data('cards') : false;
      
      window.urlFilter = $(this).data('href');
      $.spinner().start();
        $.ajax({
          url:  app.urls.getUrlFilters + query,
          data: {
            page: $('.grid-footer').data('page-number'),
            selectedUrl: $(this).data('href'),
            displayName: filter,
            cards: cards
          },
          method: 'GET',
    
          success: function (response) {
            if (response.canToDoRender) {
              $('.show-side-bar').empty().html(response.htmlTemplate);
              $('.filter-fit').empty().html(response.contentFit);
            }
                // $(this).trigger('search:filter', e);
                var attributeId = '#' + $('#appyFilter').find('span').last().attr('id');
                $.ajax({
                  url:  window.urlFilter,
                  data: {
                    page: $('.grid-footer').data('page-number'),
                    selectedUrl: $('#appyFilter').data('href')
                  },
                  method: 'GET',

                  success: function (response) {
                    window.urlReset = window.urlFilter;
                    parseResults(response);
                    $("#btnFilterApplied").empty();
                    $(".filter-Applied button").clone().attr("class", "swatch-filter filter-value filter-Applied-clonado").appendTo("#btnFilterApplied");
                    $( "#btnFilterApplied :disabled" ).addClass('d-none');
                    if ($('#sideNavigation .filter-Applied button:disabled').length > 0) {
                      $('.filters').empty().append('Filtros'+ '  ('+($('#sideNavigation .filter-Applied button').length -1)+')');
                      $('#countfilters').empty().append('('+($('#sideNavigation .filter-Applied button').length -1)+')');
                    } else {
                      $('.filters').empty().append('Filtros'+ '  ('+ $('#sideNavigation .filter-Applied button').length +')');
                      $('#countfilters').empty().append('('+$('#sideNavigation .filter-Applied button').length +')');
                    }
                    
                    $.spinner().stop();
                    $(attributeId).parent('button').focus();
                    window.arrayValues = [];
                  },
                  error: function () {
                    $.spinner().stop();
                    $(attributeId).parent('button').focus();
                  }
                });
            $.spinner().stop();
          },
          error: function () {
            $.spinner().stop();
          }
        });   
    });
  },
  
  //Clean all the filters button
  resetFilter: function () {
    $('.show-side-bar').on('click','#resetFilter', function() {
      $.spinner().start();
      var query =  $(this).data('href').split('?')[1];
      var filter = $('#sideNavigation').data('filter') ? $('#sideNavigation').data('filter').toString().toLowerCase() : null;
      var cards = $('#sideNavigation').data('cards') ? $('#sideNavigation').data('cards') : false;
    
      window.urlFilter = $(this).data('href');
      $(document).trigger("appyFilterCustom", {
        url: app.urls.getUrlFilters+query,
        filter: filter,
        cards: cards
      });
      $.ajax({
        url: $(this).data('href'),
        data: {
          page: $('.grid-footer').data('page-number'),
          selectedUrl: $(this).data('href'),
          filter: filter,
          cards: cards
        },
        method: 'GET',

        success: function (response) {
          window.urlReset = window.urlFilter;
          parseResults(response);
          $("#btnFilterApplied").empty();
          $(".filter-Applied").clone().appendTo("#btnFilterApplied")
          $.spinner().stop();
          window.arrayValues = [];
        },
        error: function () {
          $.spinner().stop();
        }
      });

    });
  },

  showContentTab: function () {
        // Display content results from the search
    $('.container,.container-fluid').on('click', '.content-search', function () {
      if ($('#content-search-results').html() === '') {
        getContent($(this), $('#content-search-results'));
      }
    });

        // Display the next page of content results from the search
    $('.container,.container-fluid').on('click', '.show-more-content button', function () {
      getContent($(this), $('#content-search-results'));
      $('.show-more-content').remove();
    });
  }
};

$(document).ready(function () {
  const appyFilterCustom = (e, data) => {
    e.preventDefault();
    e.stopPropagation();
    $.spinner().start();
    
    if(data.filter == 'filtrofit'){
      data.filter = 'filtroFit';
    }
    
    $.ajax({
      url:  data.url,
      data: {
        page: $('.grid-footer').data('page-number'),
        selectedUrl: $(this).data('href'),
        displayName: data.filter,
        cards: data.cards
      },
      method: 'GET',

      success: function (response) {
        
        if (response.canToDoRender) {
          
          $('.show-side-bar').empty().html(response.htmlTemplate);
          $('.size-container').empty().html(response.contentFit);
          
        }
        $.spinner().stop();
      },
      error: function () {
        $.spinner().stop();
      }
    });   
  }
  $(document).on('appyFilterCustom', appyFilterCustom);
})
