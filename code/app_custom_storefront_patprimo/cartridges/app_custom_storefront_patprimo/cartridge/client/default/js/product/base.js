"use strict";
var focusHelper = require("base/components/focus");
var countEvent = true;

/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
  var pid;

  if ($("#quickViewModal").hasClass("show") && !$(".product-set").length) {
    pid = $($el)
      .closest(".modal-content")
      .find(".product-quickview")
      .data("pid");
  } else if ($(".product-set-detail").length || $(".product-set").length) {
    pid = $($el).closest(".product-detail").find(".product-id").text();
  } else {
    pid = $('.product-detail:not(".bundle-item")').data("pid");
  }

  return pid;
}

/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
  var quantitySelected;
  if ($el && $(".set-items").length) {
    quantitySelected = $($el)
      .closest(".product-detail")
      .find(".quantity-select");
  } else if ($el && $(".custom-pdp-items").length) {
    quantitySelected = $($el)
      .closest(".custom-pdp-item")
      .find(".quantity-select");
  } else if ($el && $(".product-bundle").length) {
    var quantitySelectedModal = $($el)
      .closest(".modal-footer")
      .find(".quantity-select");
    var quantitySelectedPDP = $($el)
      .closest(".bundle-footer")
      .find(".quantity-select");
    if (quantitySelectedModal.val() === undefined) {
      quantitySelected = quantitySelectedPDP;
    } else {
      quantitySelected = quantitySelectedModal;
    }
  } else {
    quantitySelected = $(".quantity-select");
  }
  return quantitySelected;
}

/**
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */
function getQuantitySelected($el) {
  return getQuantitySelector($el).val();
}

/**
 * Process the attribute values for an attribute that has image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 * @param {Object} msgs - object containing resource messages
 */
function processSwatchValues(attr, $productContainer, msgs) {
  attr.values.forEach(function (attrValue) {
    var valida = true;
    if ($("#idCustomPDP").text() === "true") {
      valida = ($($productContainer.children()[1]).find('.attrIdT').text() === attrValue.id);
    }

    if (valida) {
      var $attrValue = $productContainer.find(
        '[data-attr="' +
          attr.id +
          '"] [data-attr-value="' +
          attrValue.value +
          '"]'
      );
      var $swatchButton = $attrValue.parent();

      if (attrValue.selected) {
        $attrValue.siblings(".selected-assistive-text").text(msgs.assistiveSelectedText);
        $(".attribute.mt-0 .selected-color .color-name").text(
          attrValue.displayValue
        );
        console.log('reach');
        $attrValue.addClass("selected");
        console.log('reach1');
      } else {
        $attrValue.removeClass("selected");
        $attrValue.siblings(".selected-assistive-text").empty();
      }

      if (attrValue.url) {
        $swatchButton.attr("data-url", attrValue.url);
        // $('.color-attribute-' + $($productContainer.children()[0]).find('.attrIdT').text()).attr('data-url', attrValue.url);
      } else {
        $swatchButton.removeAttr("data-url");
      }

      // Disable if not selectable
      $attrValue.removeClass("selectable unselectable");

      $attrValue.addClass(attrValue.selectable ? "selectable" : "unselectable");
    }
  });
}

//for zindex processSwatchValue
function processSwatchValuesForZIndex(attr, response, msgs) {
  var colorAttribute = null;
  var sizeAttributes = null;
  var variationAttribute = response.product.variationAttributes || null;

  if (variationAttribute && variationAttribute.length > 0) {
    colorAttribute = variationAttribute[0];
    sizeAttributes = variationAttribute[1];
    if (colorAttribute.values && colorAttribute.values.length > 0) {
      colorAttribute.values.forEach(function (color) {
        if (color.selected) {
          var classValue =
            "color-code swatch-filter-editProductCart-" +
            color.value.toLowerCase();
            var classColorValue = color.value.toLowerCase();
            var spanColorContainer = $('span[data-selected-color=color-container]');
            Array.from(spanColorContainer).forEach(function(item){
              var spanAttrValue = $(item).attr('data-attr');
              if(spanAttrValue && spanAttrValue== 'mobile-selected-color'){
                $(item).attr("class", classValue + ' selected-cl');
              }
              else{
                $(item).attr("class", classValue);
              }
            });
          // $('span[data-selected-color=color-container]').attr("class", classValue);
          $("#mobileSpanColor").attr("class", classValue);
          $("#zIndexselectedColor").attr("value", classColorValue);
        }
      });
    }
  }

  $("#productImage").attr("src", response.product.images["large"][0].url);
  const $picklist = $("#zIndexselectedColor");
  const $desktopSizepicklist = $("#selectDesktopSize");
  const $mobileSizepicklist = $("#selectMobileSize");

  $picklist.children("option").each(function (index) {
    const $option = $(this);
    const attrValue = colorAttribute.values[index];
    if (attrValue.selected) {
      $option.attr("selected", "selected");
    } else {
      $option.removeAttr("selected");
    }

    if (attrValue.url) {
      $option.attr("data-url", attrValue.url);
      $option.attr("value", attrValue.url);
    } else {
      $option.removeAttr("data-url");
      $option.attr("value", null);
    }

    if (attrValue.value) {
      $option.attr("data-attr-value", attrValue.value);
    } else {
      $option.removeAttr("data-attr-value");
    }
    $option.removeClass("selectable unselectable");
    $option.addClass(attrValue.selectable ? "selectable" : "unselectable");
  });

  $desktopSizepicklist.children("option").each(function (index) {
    const $option = $(this);
    const attrValue = sizeAttributes.values[index];
    if (attrValue.selected) {
      $option.attr("selected", "selected");
    } else {
      $option.removeAttr("selected");
    }
    if (attrValue.url) {
      $option.attr("value", attrValue.url);
    } else {
      $option.attr("value", null);
    }

    if (attrValue.value) {
      $option.attr("data-attr-value", attrValue.value);
    } else {
      $option.removeAttr("data-attr-value");
    }
    $option.removeClass("selectable unselectable");
  });

  $mobileSizepicklist.children("option").each(function (index) {
    const $option = $(this);
    const attrValue = sizeAttributes.values[index];
    if (attrValue.selected) {
      $option.attr("selected", "selected");
    } else {
      $option.removeAttr("selected");
    }

    if (attrValue.url) {
      $option.attr("value", attrValue.url);
    } else {
      $option.attr("value", null);
    }

    if (attrValue.value) {
      $option.attr("data-attr-value", attrValue.value);
    } else {
      $option.removeAttr("data-attr-value");
    }
    $option.removeClass("selectable unselectable");
  });
}

function processSwatchValuesCustom(attr, $productContainer, msgs) {
  attr.values.forEach(function (attrValue) {
   
    if ($('#idCustomPDP').text() === 'true') {
      var containerBoxer = $('div.swatch-column div.color-swatches-'+ window.color);
      for (var i = 0; i < containerBoxer.length; i++) {
        if (containerBoxer[i].children[0].getAttribute('data-color') === attrValue.id) {
          containerBoxer[i].children[0].setAttribute('data-url',attrValue.url);
          containerBoxer[i].children[0].setAttribute('data-select-update',true);
          break;
        }
        
      }
    }
  });
}

/**
 * Process attribute values associated with an attribute that does not have image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processNonSwatchValues(attr, $productContainer) {
  var $attr = '[data-attr="' + attr.id + '"]';
  var $defaultOption = $productContainer.find(
    $attr + " .select-" + attr.id + " option:first"
  );
  $defaultOption.attr("value", attr.resetUrl);

  attr.values.forEach(function (attrValue) {
    var $attrValue = $productContainer.find(
      $attr + ' [data-attr-value="' + attrValue.value + '"]'
    );
    $attrValue.attr("value", attrValue.url).removeAttr("disabled");

    if (!attrValue.selectable) {
      $attrValue.attr("disabled", true);
    }
    // var sizePicklistValueSwatch = document.getElementById("selectDesktopSize").id === "selectDesktopSize";
    // console.log({sizePicklistValueSwatch});
    if(true){
      console.log('If True Conditional Attribute');
      if(attrValue.selectable){
        $attrValue.addClass("selectable");
      }
      if (attrValue.selected) {
        $attrValue.addClass("selected");
        $(".attribute.mt-0 .select-size .select-size-section").text(
          attrValue.displayValue
        );
      }
      else{
        $attrValue.removeClass("selected");
      }
    }
    
  });
}

/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 *
 * @param {Object} attrs - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {jQuery} $productContainer - DOM element for a given product
 * @param {Object} msgs - object containing resource messages
 */
function updateAttrs(attrs, $productContainer, msgs) {
  // Currently, the only attribute type that has image swatches is Color.
  var attrsWithSwatches = ["color"];
  attrs.forEach(function (attr) {
    if (attrsWithSwatches.indexOf(attr.id) > -1) {
      if ($('#idCustomPDP').text() === 'true') {
        processSwatchValuesCustom(attr, $productContainer, msgs);
      } else {
        processSwatchValues(attr, $productContainer, msgs);
      }
      
    } else {
      processNonSwatchValues(attr, $productContainer);
    }
  });
}

function updateAttrsForZIndex(attrs, response, msgs) {
  // Currently, the only attribute type that has image swatches is Color.
  var attrsWithSwatches = ["color"];

  attrs.forEach(function (attr) {
    if (attrsWithSwatches.indexOf(attr.id) > -1) {
      processSwatchValuesForZIndex(attr, response, msgs);
    }
    // else {
    //   processNonSwatchValues(attr, response);
    // }
  });
}

/**
 * Updates the availability status in the Product Detail Page
 *
 * @param {Object} response - Ajax response object after an
 *                            attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAvailability(response, $productContainer) {
  var availabilityValue = "";
  var availabilityMessages = response.product.availability.messages;
  if (!response.product.readyToOrder) {
    availabilityValue =
      "<li><div>" + response.resources.info_selectforstock + "</div></li>";
  } else {
    availabilityMessages.forEach(function (message) {
      availabilityValue += "<li><div>" + message + "</div></li>";
    });
  }

  $($productContainer).trigger("product:updateAvailability", {
    product: response.product,
    $productContainer: $productContainer,
    message: availabilityValue,
    resources: response.resources,
  });
}

/**
 * Generates html for product attributes section
 *
 * @param {array} attributes - list of attributes
 * @return {string} - Compiled HTML
 */
function getAttributesHtml(attributes) {
  if (!attributes) {
    return "";
  }

  var html = "";

  attributes.forEach(function (attributeGroup) {
    if (attributeGroup.ID === "mainAttributes") {
      attributeGroup.attributes.forEach(function (attribute) {
        html +=
          '<div class="attribute-values">' +
          attribute.label +
          ": " +
          attribute.value +
          "</div>";
      });
    }
  });

  return html;
}

/**
 * @typedef UpdatedOptionValue
 * @type Object
 * @property {string} id - Option value ID for look up
 * @property {string} url - Updated option value selection URL
 */

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * Updates DOM using post-option selection Ajax response
 *
 * @param {OptionSelectionResponse} optionsHtml - Ajax response optionsHtml from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */
function updateOptions(optionsHtml, $productContainer) {
  // Update options
  $productContainer.find(".product-options").empty().html(optionsHtml);
}

/**
 * Dynamically creates Bootstrap carousel from response containing images
 * @param {Object[]} imgs - Array of large product images,along with related information
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function createCarousel(imgs, $productContainer) {
  var carousel = $productContainer.find(".carousel");
  $(carousel).carousel("dispose");
  var carouselId = $(carousel).attr("id");
  $(carousel)
    .empty()
    .append(
      '<ol class="carousel-indicators"></ol><div class="carousel-inner" role="listbox"></div><a class="carousel-control-prev" href="#' +
        carouselId +
        '" role="button" data-slide="prev"><span class="fa fa-angle-left  ml-3 fa-3x" style="color: #000;" aria-hidden="true"></span><span class="sr-only">' +
        $(carousel).data("prev") +
        '</span></a><a class="carousel-control-next" href="#' +
        carouselId +
        '" role="button" data-slide="next"><span class="fa fa-angle-right  ml-3 fa-3x "  style="color: #000;" aria-hidden="true"></span><span class="sr-only">' +
        $(carousel).data("next") +
        "</span></a>"
    );
  for (var i = 0; i < imgs.length; i++) {
    if ($("img").hasClass("img-grid-patprimo-control")) {
      $(
        '<div class="carousel-item"><img src="' +
          imgs[i].url +
          '" class="img-grid-patprimo  img-grid-patprimo-control" alt="' +
          imgs[i].alt +
          " image number " +
          parseInt(imgs[i].index, 10) +
          '" title="' +
          imgs[i].title +
          '" itemprop="image" /></div>'
      ).appendTo($(carousel).find(".carousel-inner"));
    } else {
      $(
        '<div class="carousel-item"><img src="' +
          imgs[i].url +
          '" class="img-grid-patprimo"  alt="' +
          imgs[i].alt +
          " image number " +
          parseInt(imgs[i].index, 10) +
          '" title="' +
          imgs[i].title +
          '" itemprop="image" /></div>'
      ).appendTo($(carousel).find(".carousel-inner"));
    }

    // $('<div class="carousel-item"><img src="' + imgs[i].url + '" class="img-grid-patprimo" alt="' + imgs[i].alt + ' image number ' + parseInt(imgs[i].index, 10) + '" title="' + imgs[i].title + '" itemprop="image" /></div>').appendTo($(carousel).find('.carousel-inner'));
    $(
      '<li data-target="#' +
        carouselId +
        '" data-slide-to="' +
        i +
        '" class=""></li>'
    ).appendTo($(carousel).find(".carousel-indicators"));
  }
  $($(carousel).find(".carousel-item")).first().addClass("active");
  $($(carousel).find(".carousel-indicators > li")).first().addClass("active");
  if (imgs.length === 1) {
    $(
      $(carousel).find('.carousel-indicators, a[class^="carousel-control-"]')
    ).detach();
  }
  $(carousel).carousel();
  $($(carousel).find(".carousel-indicators")).attr("aria-hidden", true);
}
function updateProductImagesPDP(imgs) {
  if(imgs && imgs.length > 1){
    var imagesElements = "";
    imagesElements =
      '<div class="primary-images col-md-12 col-sm-6"><div class="row no-gutters text-center">';
    for (var i = 0; i < imgs.length; i++) {
      imagesElements +=
        '<div class="col-md-6 mt-1 pr-1"><img alt="' +
        imgs[i].alt +
        '" class="img-fluid" itemprop="image" onclick="openImageModal(`' +
        imgs[i].url +
        "`," +
        i +
        ')" src="' +
        imgs[i].url +
        '"></div>';
    }
    imagesElements += " </div></div>";
    $(".pdp-grid-desktop").empty().append(imagesElements);
  }
}

function updateModalZoomPDP(productImages) {
  if (productImages) {
    var imagesElements = '<div class="modal-thumbnails-container">';
    if (productImages["small"] && productImages["small"].length > 0) {
      for (var i = 0; i < productImages["small"].length; i++) {
        imagesElements +=
          '<img class="modal-thumbnail" id="thumbnail-' +
          i +
          '" src="' +
          productImages["small"][i].url +
          '" onclick="changeModalImage(' +
          i +
          ');" />';
      }
    }
    imagesElements += "</div>";
    imagesElements += '<div class="modal-images-container">';
    if (productImages["hi-res"] && productImages["hi-res"].length > 0) {
      for (var i = 0; i < productImages["hi-res"].length; i++) {
        imagesElements +=
          '<img class="modal-image" src="' +
          productImages["hi-res"][i].url +
          '" id="preview-' +
          i +
          '" />';
      }
    }
    imagesElements += "</div>";
    $("#image-modal .image-modal-container").empty().append(imagesElements);
  }
}

function createCarouselCustom(
  imgs,
  $productContainer,
  productSelectedURL,
  sizeObject
) {
  var carousel = $productContainer.find(".carousel");
  var carousel2 = $productContainer.find(".carousel");
  var selectCustom = $productContainer.find(".select-compra-rapida-mobile");
  $(carousel).carousel("dispose");
  var carouselId = $(carousel).attr("id");
  var wishListSection =
    '<a class="heartOver wishlistTile" href="' +
    app.urls.wishlist +
    '" title="${Resource.msg("wishlist.addto.wishlist.heart", "wishlist", null)}"><span class="fa-stack fa-lg fa-inverse" ><i class="box  fa fa-heart fa-inverse fa-lg" ></i></span></a>';
  var key = 0,
    key2 = 0;
  var lisHtml = "";
  var optionSelect = "";
  var twoByTwo = true;
  for (key in sizeObject.values.reverse()) {
    if (sizeObject.values[key].url) {
      lisHtml += '<li class="list-group RedHatDisplayFont productSizes" data-custom-url="' + sizeObject.values[key].url + '" data-value="' + sizeObject.values[key].value + '">' + sizeObject.values[key].displayValue + '</li>';
    }
    else {
      lisHtml += '<li class="nonAvailableSize disabled list-group RedHatDisplayFont productSizes" data-custom-url="' + sizeObject.values[key].url + '" data-value="' + sizeObject.values[key].value + '">' + sizeObject.values[key].displayValue + '</li>';
    }
  }

  if (screen.width < 768) {
    for (key2 in sizeObject.values.reverse()) {
      optionSelect +=
        '<option data-custom-url="' +
        sizeObject.values[key2].url +
        '" value="' +
        sizeObject.values[key2].value +
        '" data-value="' +
        sizeObject.values[key2].value +
        '">' +
        sizeObject.values[key2].displayValue +
        "</option>";
    }
    selectCustom.html(
      '<option selected disabled value="">Selecciona talla</option>'
    );
    selectCustom.append(optionSelect);
  }
  var listComplete = '<div class="sizes RedHatDisplayFont fontSize14 fontWeight600 justify-content-center" >Agregar al carrito<ul class="size-list add-to-cart-custom">' + lisHtml + '</ul></div>';
  var sizesSeCtion = '<div class="sizes RedHatDisplayFont justify-content-center">' + listComplete + '</div>';

  $(carousel)
    .empty()
    .append(
      "<a href=" +
        productSelectedURL +
        '><ol class="carousel-indicators"></ol><div class="carousel-inner" role="listbox"></div><div class="lower-badges RedHatDisplayFont "><span class="badge spaceSpan font-weight-light rounded-0"> Reserva Día Sin IVA</span><span></span><span class="badge spaceSpan  font-weight-light rounded-0"> Envío gratis </span></div><a class="carousel-control-prev" style="width:1rem" href="#' +
        carouselId +
        '" role="button" data-slide="prev"><span class="fa fa-angle-left  ml-3 fa-3x" style="color: #000;" aria-hidden="true"></span><span class="sr-only">' +
        $(carousel).data("prev") +
        '</span></a><a class="carousel-control-next"  style="width: 1rem" href="#' +
        carouselId +
        '" role="button" data-slide="next"><span class="fa fa-angle-right  ml-3 fa-3x "  style="color: #000;" aria-hidden="true"></span><span class="sr-only">' +
        $(carousel).data("next") +
        "</span></a>" +
        wishListSection +
        "</a>" +
        sizesSeCtion
    );

  for (var i = 0; i < imgs.length; i++) {
    if ($("img").hasClass("img-grid-patprimo-control")) {
      $(
        '<div class="carousel-item"><img src="' +
          imgs[i].url +
          '" class="img-grid-patprimo img-grid-patprimo-control" alt="' +
          imgs[i].alt +
          " image number " +
          parseInt(imgs[i].index, 10) +
          '" title="' +
          imgs[i].title +
          '" itemprop="image" /></div>'
      ).appendTo($(carousel).find(".carousel-inner"));
    } else {
      $(
        '<div class="carousel-item"><img src="' +
          imgs[i].url +
          '" class="img-grid-patprimo" alt="' +
          imgs[i].alt +
          " image number " +
          parseInt(imgs[i].index, 10) +
          '" title="' +
          imgs[i].title +
          '" itemprop="image" /></div>'
      ).appendTo($(carousel).find(".carousel-inner"));
    }
  }
  $($(carousel).find(".carousel-item")).first().addClass("active");
  $($(carousel).find(".carousel-indicators > li")).first().addClass("active");

  if (imgs.length === 1) {
    $(
      $(carousel).find('.carousel-indicators, a[class^="carousel-control-"]')
    ).detach();
  }
  $(carousel).carousel();
  $($(carousel).find('.carousel-indicators')).attr('aria-hidden', true);

  if($('.gridFour').hasClass('gridIconOpacity')){
    var product = document.querySelectorAll('.img-grid-patprimo');
    if ($(window).width() < 800) {
      for(var index = 0; index < product.length; index++){
        product[index].style.height = '115vw';
      }
    }
  }
}

function createCarouselCustomCart(
  imgs,
  $productContainer,
  productSelectedURL,
  sizeObject
) {
  var carousel = $productContainer.find(".carousel");
  var selectCustom = $productContainer.find(".select-compra-rapida-mobile");
  $(carousel).carousel("dispose");
  var carouselId = $(carousel).attr("id");
  var wishListSection =
    '<a class="heartOver wishlistTile" href="' +
    app.urls.wishlist +
    '" title="${Resource.msg("wishlist.addto.wishlist.heart", "wishlist", null)}"><span class="fa-stack fa-lg fa-inverse" ><i class="box  fa fa-heart fa-inverse fa-lg" ></i></span></a>';
  var key = 0,
    key2 = 0;
  var lisHtml = "";
  var optionSelect = "";
  var twoByTwo = true;
  for (key in sizeObject.values.reverse()) {
    lisHtml +=
      ' <li data-custom-url="' +
      sizeObject.values[key].url +
      '" data-value="' +
      sizeObject.values[key].value +
      '">' +
      sizeObject.values[key].displayValue +
      "</li>";
  }

  if (screen.width < 768) {
    for (key2 in sizeObject.values.reverse()) {
      optionSelect +=
        '<option data-custom-url="' +
        sizeObject.values[key2].url +
        '" value="' +
        sizeObject.values[key2].value +
        '" data-value="' +
        sizeObject.values[key2].value +
        '">' +
        sizeObject.values[key2].displayValue +
        "</option>";
    }
    selectCustom.html(
      '<option selected disabled value="">Selecciona talla</option>'
    );
    selectCustom.append(optionSelect);
  }
  var listComplete =
    '<ul class="size-list RedHatDisplayFont  add-to-cart-custom">' +
    lisHtml +
    "</ul>";
  var sizesSeCtion = '<div class="sizes">' + listComplete + "</h3></div>";

  $(carousel)
    .empty()
    .append(
      "<a href=" +
        productSelectedURL +
        '><div class="carousel-item"><img src="' +
        imgs[0].url +
        '" class="img-grid-patprimo" alt="' +
        imgs[0].alt +
        " image number " +
        '" title="' +
        imgs[0].title +
        '" itemprop="image" style="width: 161px; height:227px" /></div></a>'
    );

  for (var i = 0; i < imgs.length; i++) {
    if ($("img").hasClass("img-grid-patprimo-control")) {
      $(
        '<div class="carousel-item"><img src="' +
          imgs[i].url +
          '" class="img-grid-patprimo img-grid-patprimo-control" alt="' +
          imgs[i].alt +
          " image number " +
          parseInt(imgs[i].index, 10) +
          '" title="' +
          imgs[i].title +
          '" itemprop="image" /></div>'
      ).appendTo($(carousel).find(".carousel-inner"));
    } else {
      $(
        '<div class="carousel-item"><img src="' +
          imgs[i].url +
          '" class="img-grid-patprimo" alt="' +
          imgs[i].alt +
          " image number " +
          parseInt(imgs[i].index, 10) +
          '" title="' +
          imgs[i].title +
          '" itemprop="image" /></div>'
      ).appendTo($(carousel).find(".carousel-inner"));
    }
  }
  $($(carousel).find(".carousel-item")).first().addClass("active");
  $($(carousel).find(".carousel-indicators > li")).first().addClass("active");
  if (imgs.length === 1) {
    $(
      $(carousel).find('.carousel-indicators, a[class^="carousel-control-"]')
    ).detach();
  }
  $(carousel).carousel();
  $($(carousel).find(".carousel-indicators")).attr("aria-hidden", true);
}

/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {Object} response - response from Ajax call
 * @param {Object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {Object[]} response.product.variationAttributes - Product attributes
 * @param {Object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */
function handleVariantResponse(response, $productContainer) {
  var isChoiceOfBonusProducts =
    $productContainer.parents(".choose-bonus-product-dialog").length > 0;
  var isVaraint;
  if (response.product.variationAttributes) {
    updateAttrs(
      response.product.variationAttributes,
      $productContainer,
      response.resources
    );
    isVaraint = response.product.productType === "variant";
    if (isChoiceOfBonusProducts && isVaraint) {
      $productContainer
        .parent(".bonus-product-item")
        .data("pid", response.product.id);

      $productContainer
        .parent(".bonus-product-item")
        .data("ready-to-order", response.product.readyToOrder);
    }
  }

  // Update primary images
  var primaryImageUrls = response.product.images.large;
  createCarousel(primaryImageUrls, $productContainer);
  if ($(".pdp-grid-desktop")) {
    updateProductImagesPDP(primaryImageUrls);
  }
  if ($("#image-modal .image-modal-container")) {
    updateModalZoomPDP(response.product.images);
  }

  // Update pricing
  if (!isChoiceOfBonusProducts) {
    var $priceSelector = $(".prices .price", $productContainer).length
      ? $(".prices .price", $productContainer)
      : $(".prices .price");
    $priceSelector.replaceWith(response.product.price.html);
  }

  // Update promotions
  $productContainer
    .find(".promotions")
    .empty()
    .html(response.product.promotionsHtml);

  updateAvailability(response, $productContainer);

  if (isChoiceOfBonusProducts) {
    var $selectButton = $productContainer.find(".select-bonus-product");
    $selectButton.trigger("bonusproduct:updateSelectButton", {
      product: response.product,
      $productContainer: $productContainer,
    });
  } else {
    // Enable "Add to Cart" button if all required attributes have been selected
    $(
      "button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global"
    )
      .trigger("product:updateAddToCart", {
        product: response.product,
        $productContainer: $productContainer,
      })
      .trigger("product:statusUpdate", response.product);
  }

  // Update attributes
  $productContainer
    .find(".main-attributes")
    .empty()
    .html(getAttributesHtml(response.product.attributes));
}

//for z index

function handleVariantResponseForZIndex(response, $productContainer) {
  var isChoiceOfBonusProducts =
    $productContainer.parents(".choose-bonus-product-dialog").length > 0;
  var isVaraint;
  if (response.product.variationAttributes) {
    updateAttrsForZIndex(
      response.product.variationAttributes,
      response,
      response.resources
    );
  }
}

/**
 * @typespec UpdatedQuantity
 * @type Object
 * @property {boolean} selected - Whether the quantity has been selected
 * @property {string} value - The number of products to purchase
 * @property {string} url - Compiled URL that specifies variation attributes, product ID, options,
 *     etc.
 */

/**
 * Updates the quantity DOM elements post Ajax call
 * @param {UpdatedQuantity[]} quantities -
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function updateQuantities(quantities, $productContainer) {
  if ($productContainer.parent(".bonus-product-item").length <= 0) {
    var optionsHtml = quantities
      .map(function (quantity) {
        var selected = quantity.selected ? " selected " : "";
        return (
          '<option value="' +
          quantity.value +
          '"  data-url="' +
          quantity.url +
          '"' +
          selected +
          ">" +
          quantity.value +
          "</option>"
        );
      })
      .join("");
    if ($("#idCustomPDP").text() === "true") {
      getQuantitySelector($productContainer).empty().html(optionsHtml);
      var idTypeColor = $productContainer.find(".attrIdT").html();
      $(".color-attribute-" + idTypeColor).trigger("click");
    } else {
      getQuantitySelector($productContainer).empty().html(optionsHtml);
    }
  }
}

function handleVariantResponseCustom(response, $productContainer) {
  var isChoiceOfBonusProducts =
    $productContainer.parents(".choose-bonus-product-dialog").length > 0;
  var isVaraint;
  var sizeObject = response.product.variationAttributes[1];
  if (response.product.variationAttributes) {
    updateAttrs(
      response.product.variationAttributes,
      $productContainer,
      response.resources
    );
    isVaraint = response.product.productType === "variant";
    if (isChoiceOfBonusProducts && isVaraint) {
      $productContainer
        .parent(".bonus-product-item")
        .data("pid", response.product.id);

      $productContainer
        .parent(".bonus-product-item")
        .data("ready-to-order", response.product.readyToOrder);
    }
  }

  // Update primary images
  var primaryImageUrls = response.product.images.medium;
  var productSelectedURL = response.product.selectedProductUrl;
  if ($('div.carouselCart').length) {
    createCarouselCustomCart(primaryImageUrls, $productContainer, productSelectedURL, sizeObject);
    $('.colorName').empty().append(
      response.product.variationAttributes[0].displayValue
  );
  $('.sizeName').empty().append(
    response.product.variationAttributes[1].displayValue
  );

  var optionSizes ="";
  for (key in response.product.variationAttributes[1].values.reverse()) {
    optionSizes += '<option value="' + (response.product.variationAttributes[1].values[key].url ) + '" data-attr-value="' + (response.product.variationAttributes[1].values[key].url )+ '" ' + (response.product.variationAttributes[1].values[key].selected ? 'selected' : '') + ' ' + (!response.product.variationAttributes[1].values[key].url ? 'disabled' : '') + ' class="RedHatDisplayFont ' + (!response.product.variationAttributes[1].values[key].url ? 'unavailable' : '') + ' mr-2">' + response.product.variationAttributes[1].values[key].displayValue + '</option>';
  }
  $('.editProductSizes').empty().append(optionSizes);  
  
  } else {
    createCarouselCustom(
      primaryImageUrls,
      $productContainer,
      productSelectedURL,
      sizeObject
    );
  }
  // Update pricing
  if (!isChoiceOfBonusProducts) {
    var $priceSelector = $(".prices .price", $productContainer).length
      ? $(".prices .price", $productContainer)
      : $(".prices .price");
    $priceSelector.replaceWith(response.product.price.html);
  }

  // Update promotions
  $productContainer
    .find(".promotions")
    .empty()
    .html(response.product.promotionsHtml);

  updateAvailability(response, $productContainer);

  if (isChoiceOfBonusProducts) {
    var $selectButton = $productContainer.find(".select-bonus-product");
    $selectButton.trigger("bonusproduct:updateSelectButton", {
      product: response.product,
      $productContainer: $productContainer,
    });
  } else {
    // Enable "Add to Cart" button if all required attributes have been selected
    $(
      "button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global"
    )
      .trigger("product:updateAddToCart", {
        product: response.product,
        $productContainer: $productContainer,
      })
      .trigger("product:statusUpdate", response.product);
  }

  // Update attributes
  $productContainer
    .find(".main-attributes")
    .empty()
    .html(getAttributesHtml(response.product.attributes));
}

/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(
  selectedValueUrl,
  $productContainer,
  $customProductContainer,
  target
) {
  if ($("#idCustomPDP").text() === "true") {
    $("#error_global").text("");
    window.color = '';
  }
  if (selectedValueUrl) {
    $("body").trigger("product:beforeAttributeSelect", {
      url: selectedValueUrl,
      container: $productContainer,
    });

    var attrContainer =
      $customProductContainer && $customProductContainer.length
        ? $customProductContainer
        : $productContainer;

    $.ajax({
      url: selectedValueUrl,
      method: "GET",
      success: function (data) {
        if ($('#idCustomPDP').text() === 'true' && target) {
            window.color  = target.closest('select').data('select-color');
        }
        if ($('.page').data('querystring').indexOf('cgid') != -1 || $('.page').data('action').indexOf('Cart') != -1 || $('.page').data('action').indexOf('Search') != -1) {
          handleVariantResponseCustom(data, $productContainer);
        } else {
          handleVariantResponse(data, $productContainer);
        }
        handleVariantResponseForZIndex(data, $productContainer);

        updateOptions(data.product.optionsHtml, $productContainer);
        if (!$customProductContainer) {
          updateQuantities(data.product.quantities, $productContainer);
        }
        $("body").trigger("product:afterAttributeSelect", {
          data: data,
          container: attrContainer,
        });
        $.spinner().stop();
      },
      error: function () {
        $.spinner().stop();
      },
    });
  }
}

/**
 * Custom function - Updates total quantities for the custom component customSelectedProducts.isml
 * This works for the custom PDP for PatPrimo
 */
function updateCustomTotals() {
  var qtyTotal = 0;
  for (var i = 0; i < $(".quantity-select").length; i++) {
    var y = $($(".quantity-select")[i]).val();
    qtyTotal = parseInt(qtyTotal) + parseInt(y);
  }

  $("#custom-price-total").text(qtyTotal);
  var price = $(".custom_attr_price").find(".value").attr("content");
  var priceTotal = parseFloat(price) * parseInt(qtyTotal);
  $("#custom-numberPrice-total").text("$ " + priceTotal.toFixed(2));
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @return {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl() {
  return $(".add-to-cart-url").val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
  var $html = $("<div>").append($.parseHTML(html));

  var body = $html.find(".choice-of-bonus-product");
  var footer = $html.find(".modal-footer").children();

  return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @param {Object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
  $(".modal-body").spinner().start();

  if ($("#chooseBonusProductModal").length !== 0) {
    $("#chooseBonusProductModal").remove();
  }
  var bonusUrl;
  if (data.bonusChoiceRuleBased) {
    bonusUrl = data.showProductsUrlRuleBased;
  } else {
    bonusUrl = data.showProductsUrlListBased;
  }

  var htmlString =
    "<!-- Modal -->" +
    '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">' +
    '<span class="enter-message sr-only" ></span>' +
    '<div class="modal-dialog choose-bonus-product-dialog" ' +
    'data-total-qty="' +
    data.maxBonusItems +
    '"' +
    'data-UUID="' +
    data.uuid +
    '"' +
    'data-pliUUID="' +
    data.pliUUID +
    '"' +
    'data-addToCartUrl="' +
    data.addToCartUrl +
    '"' +
    'data-pageStart="0"' +
    'data-pageSize="' +
    data.pageSize +
    '"' +
    'data-moreURL="' +
    data.showProductsUrlRuleBased +
    '"' +
    'data-bonusChoiceRuleBased="' +
    data.bonusChoiceRuleBased +
    '">' +
    "<!-- Modal content-->" +
    '<div class="modal-content">' +
    '<div class="modal-header">' +
    '    <span class="">' +
    data.labels.selectprods +
    "</span>" +
    '    <button type="button" class="close pull-right" data-dismiss="modal">' +
    '        <span aria-hidden="true">&times;</span>' +
    '        <span class="sr-only"> </span>' +
    "    </button>" +
    "</div>" +
    '<div class="modal-body"></div>' +
    '<div class="modal-footer"></div>' +
    "</div>" +
    "</div>" +
    "</div>";
  $("body").append(htmlString);
  $(".modal-body").spinner().start();

  $.ajax({
    url: bonusUrl,
    method: "GET",
    dataType: "json",
    success: function (response) {
      var parsedHtml = parseHtml(response.renderedTemplate);
      $("#chooseBonusProductModal .modal-body").empty();
      $("#chooseBonusProductModal .enter-message").text(
        response.enterDialogMessage
      );
      $("#chooseBonusProductModal .modal-header .close .sr-only").text(
        response.closeButtonText
      );
      $("#chooseBonusProductModal .modal-body").html(parsedHtml.body);
      $("#chooseBonusProductModal .modal-footer").html(parsedHtml.footer);
      $("#chooseBonusProductModal").modal("show");
      $.spinner().stop();
    },
    error: function () {
      $.spinner().stop();
    },
  });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response, showMinicart) {
  $(".minicart").trigger("count:update", response);
  var messageType = response.error ? "alert-danger" : "alert-success";
  $(".minicartHeaderItemNumber")
    .empty()
    .append("Bolsa (" + response.quantityTotal + ")");
  // show add to cart toast
  if (
    response.newBonusDiscountLineItem &&
    Object.keys(response.newBonusDiscountLineItem).length !== 0
  ) {
    chooseBonusProducts(response.newBonusDiscountLineItem);
  } else {
    if ($(".add-to-cart-messages").length === 0) {
      $("body").append('<div class="add-to-cart-messages"></div>');
    }
    if (!showMinicart) {
      $(".add-to-cart-messages").append(
        '<div class="alert ' +
          messageType +
          ' add-to-basket-alert text-center" role="alert">' +
          response.message +
          "</div>"
      );

      setTimeout(function () {
        $(".add-to-basket-alert").remove();
      }, 5000);
    } else {
      var url = $(".minicart").data("action-url");
      var count = parseInt($(".minicart .minicart-quantity").text(), 10);
      var updateMiniCart = true;
      if (count !== 0 && $(".minicart .popover.show").length === 0) {
        if (!updateMiniCart) {
          $(".minicart .popover").addClass("show");
          return;
        }

        $(".minicart .popover").addClass("show");
        $(".minicart .popover").spinner().start();
        $.get(url, function (data) {
          $(".minicart .popover").empty();
          $(".minicart .popover").append(data);
          updateMiniCart = false;
          $.spinner().stop();
        });
      }
      // $('html, body').animate(
      //   {
      //     scrollTop: $('.minicart').offset().top - 100
      //   }, 1000
      //       );
    }
  }
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
  var childProducts = [];
  $(".bundle-item").each(function () {
    childProducts.push({
      pid: $(this).find(".product-id").text(),
      quantity: parseInt($(this).find("label.quantity").data("quantity"), 10),
    });
  });

  return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
  var options = $productContainer
    .find(".product-option")
    .map(function () {
      var $elOption = $(this).find(".options-select");
      var urlValue = $elOption.val();
      var selectedValueId = $elOption
        .find('option[value="' + urlValue + '"]')
        .data("value-id");
      return {
        optionId: $(this).data("option-id"),
        selectedValueId: selectedValueId,
      };
    })
    .toArray();

  return JSON.stringify(options);
}

/**
 * Makes a call to the server to report the event of adding an item to the cart
 *
 * @param {string | boolean} url - a string representing the end point to hit so that the event can be recorded, or false
 */
function miniCartReportingUrl(url) {
  if (url) {
    $.ajax({
      url: url,
      method: "GET",
      success: function () {
        // reporting urls hit on the server
      },
      error: function () {
        // no reporting urls hit on the server
      },
    });
  }
}
$("body").on("mouseenter focusin", ".carousel,.slide", function () {
  $(this)
    .find("a.carousel-control-prev, a.carousel-control-next")
    .css("opacity", 1);
  if (screen.width > 768) {
    $(this).find("div.sizes").addClass("sizes-hover");
  }
});
$("body").on("mouseleave focusout", ".carousel,.slide", function () {
  $(this)
    .find("a.carousel-control-prev, a.carousel-control-next")
    .css("opacity", 0);
  if (screen.width > 768) {
    $(this).find("div.sizes").removeClass("sizes-hover");
  }
});

module.exports = {
  attributeSelect: attributeSelect,
  methods: {
    editBonusProducts: function (data) {
      chooseBonusProducts(data);
    },
  },

  focusChooseBonusProductModal: function () {
    $("body").on("shown.bs.modal", "#chooseBonusProductModal", function () {
      $("#chooseBonusProductModal").siblings().attr("aria-hidden", "true");
      $("#chooseBonusProductModal .close").focus();
    });
  },

  onClosingChooseBonusProductModal: function () {
    $("body").on("hidden.bs.modal", "#chooseBonusProductModal", function () {
      $("#chooseBonusProductModal").siblings().attr("aria-hidden", "false");
    });
  },

  trapChooseBonusProductModalFocus: function () {
    $("body").on("keydown", "#chooseBonusProductModal", function (e) {
      var focusParams = {
        event: e,
        containerSelector: "#chooseBonusProductModal",
        firstElementSelector: ".close",
        lastElementSelector: ".add-bonus-products",
      };
      focusHelper.setTabNextFocus(focusParams);
    });
  },

  selectMobileColorAttribute: function (){
    $(document).on("click", '#mobileColorSelectEnable', function () {
      $('.color-listview').css('display', 'block');
    });
    $(document).on("click", '.mobile-color-attr-list .mobile-color-attr-item', function (e) {
      e.preventDefault();
      if ($(this).attr("disabled")) {
        return;
      }
      
      var $productContainer =$(".product-detail");

      var url = $(this).attr("data-url");
      attributeSelect(url, $productContainer);
      $('.color-listview').css('display', 'none');
    });
  },

  selectDesktopColorAttribute: function (){
    $(document).on("click", '.product-size-btn', function (e) {
      e.preventDefault();
      if ($(this).attr("disabled")) {
        return;
      }      
      var $productContainer =$(".product-detail");
      var url = $(this).attr("value");
      attributeSelect(url, $productContainer);
      $.spinner().start();
    });
  },

  colorAttribute: function () {
    $(document).on('click', '[data-attr="color"] button, button.color-attribute', function (e) {
      e.preventDefault();
      if ($(this).attr("disabled")) {
        return;
      }
      var $productContainer = $(this).closest(".set-item");
      var $customProductContainer = $(this).closest(".custom-pdp-item");

      if (!$productContainer.length) {
        $productContainer = $(this).closest(".product-detail");
      }

      var url = $(this).attr("data-url");
      attributeSelect(url, $productContainer, $customProductContainer);
    });
  },

  colorAttributeCustom: function () {
    $(document).on("click", ".swatch-custom", function (e) {
      e.preventDefault();

      if ($(this).find("span").hasClass("selected")) {
        return;
      }
      if ($(this).attr("disabled")) {
        return;
      }
      var $productContainer = $(this).closest(".set-item");

      if (!$productContainer.length) {
        $productContainer = $(this).closest(".product-tile");
      }

      attributeSelect($(this).attr('data-url'), $productContainer);
      $(this).parent('div.swatch-mobile').children().find('span').removeClass('selectedSwatch');
      $(this).find('span').addClass('selectedSwatch');
    });
  },

  selectAttribute: function () {
    $(document).on(
      "change",
      'select[class*="select-"], .options-select, .size-select',
      function (e) {
        e.preventDefault();
        var $productContainer = $(this).closest(".set-item");
        if (!$productContainer.length) {
          $productContainer = $(this).closest(".custom-pdp-item");
        }
        if (!$productContainer.length) {
        $productContainer = $(this).closest('.product-detail');
        //$productContainer = $('.pdp-grid-desktop');
        }
        if (!$productContainer.length) {
          $productContainer = $("#product-detail-container");
        }
      var seleccion= $(this).children("option:selected");
      
      attributeSelect(e.currentTarget.value, $productContainer,null, seleccion);
    });
  },

  availability: function () {
    $(document).on("change", ".quantity-select", function (e) {
      if (countEvent) {
        e.preventDefault();

        var $productContainer = $(this).closest(".set-item");
        if (!$productContainer.length) {
          $productContainer = $(this).closest(".custom-pdp-item");
        }
        if (!$productContainer.length) {
          $productContainer = $(this)
            .closest(".modal-content")
            .find(".product-quickview");
        }

        if ($(".bundle-items", $productContainer).length === 0) {
          attributeSelect(
            $(e.currentTarget).find("option:selected").data("url"),
            $productContainer
          );
        }
        countEvent = false;
        updateCustomTotals();
      } else {
        countEvent = true;
      }
    });
  },

  addToCart: function () {
    $(document).on('click', 'button.add-to-cart, button.add-to-cart-global', function () {
      var addToCartUrl;
      var pid;
      var pidsObj;
      var setPids;

      $('body').trigger('product:beforeAddToCart', this);

      // if (($('.set-items').length || $('.custom-pdp-items').length) && $(this).hasClass('add-to-cart-global')) {
      if ($('#idCustomPDP').text() === 'true') {
        setPids = [];

        var $products = $('.set-items').length ? $('.product-detail') :$('div.swatch-column div.color-swatches');
        
        $products.each(function (index) {
            if ($products[index].children[0].getAttribute('data-select-update')) {
              var color = $products[index].children[0].getAttribute('data-color')
                $.ajax({
                  url: $products[index].children[0].getAttribute('data-url'),
                  method: 'GET',
                  async: false,
                  success: function (data) {
                    
                    if ($(`input[name=quantity_${color}]`).val() > 0) {
                        setPids.push({
                          pid: data.product.id,
                          qty: $(`input[name=quantity_${color}]`).val(),
                          options: getOptions($(this))
                        });
                    }

                  },
                  error: function () {
                    $.spinner().stop();
                    },
                });
            } else {
              // setPids.push({
              //   pid: $(this).find('.product-id').text(),
              //   qty: $(this).find('.quantity-select').val(),
              //   options: getOptions($(this))
              // });
            }
          // }
        });
      
        if (setPids.length > 0) {
          pidsObj = JSON.stringify(setPids);
        } else {
          $('#error_global').text('Selecciona un producto');
          $.spinner().stop();
          return;
        }
      }

      pid = getPidValue($(this));
      if (!pid) {
        pid = $(this).data('pid');
      }

      var $productContainer = $(this).closest('.product-detail');
      if (!$productContainer.length) {
        $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
      }

      addToCartUrl = getAddToCartUrl();

      var form = {
        pid: pid,
        pidsObj: pidsObj,
        childProducts: getChildProducts(),
        quantity: getQuantitySelected($(this))
      };

      if (!$('.bundle-item').length) {
        form.options = getOptions($productContainer);
      }

      if($('#'+form.pid+'-slot')) {
        form.slot = $('#'+form.pid+'-slot').val();
      }

      $(this).trigger('updateAddToCartFormData', form);
      if (addToCartUrl) {
        $.ajax({
          url: addToCartUrl,
          method: 'POST',
          data: form,
          success: function (data) {
            handlePostCartAdd(data);
            $('body').trigger('product:afterAddToCart', data);
            $.spinner().stop();
            miniCartReportingUrl(data.reportingURL);
            var prodObj = data.prodObj;
            dataLayer.push({ ecommerce: null });
            dataLayer.push({
              event: "add_to_cart",
              ecommerce: {
                items: [{
                  item_name: prodObj.item_name, //Nombre de producto
                  item_id: prodObj.item_id, //ID del producto
                  item_sku_id: prodObj.item_sku_id, //SKU de producto
                  final_price: prodObj.final_price, //Precio del producto con descuento
                  original_price: prodObj.original_price, //Precio original del producto
                  item_category: prodObj.item_category, //Categoría principal del producto
                  item_category2: prodObj.item_category2, //Categoría secundaria del producto
                  item_list_name: prodObj.item_list_name ? prodObj.item_list_name : '', //Lista de donde proviene el
                  size: prodObj.size, //Atributo de tamaño escogido
                  available_size: prodObj.available_size, //Atributo de tallas disponibles
                  color: prodObj.color, //Atributo de color escogido
                  quantity: prodObj.quantity
                }]
              }
            });
          },
          error: function () {
            $.spinner().stop();
          }
        });
      }
    });
  },
  addToCartCustom: function () {
    $(document).on("click", "ul.add-to-cart-custom>li", function () {
      var showMinicart = false,
        urlCustom;
      $(this).spinner().start();
      if (
        $(".page").data("action") &&
        $(".page").data("action").indexOf("Search-Show") != -1
      ) {
        showMinicart = true;
      }

      if (
        typeof $(this).data("custom-url") === "string" &&
        $(this).data("custom-url").indexOf("?") != -1
      ) {
        urlCustom =
          app.urls.urlAddToCartCustom +
          "?" +
          $(this).data("custom-url").split("?")[1];
      } else {
        urlCustom =
          app.urls.urlAddToCartCustom +
          "?" +
          "pid=" +
          $(this).data("custom-url") +
          "&quantity=" +
          1;
      }

      if (
        $("#" + $(this).parents(".product").data("pid") + "-slot") &&
        $("#" + $(this).parents(".product").data("pid") + "-slot").val()
      ) {
        urlCustom =
          urlCustom +
          "&slot=" +
          $("#" + $(this).parents(".product").data("pid") + "-slot").val();
      }

      $.ajax({
        url: urlCustom,
        method: "GET",
        success: function (data) {
          handlePostCartAdd(data, showMinicart);
          $("body").trigger("product:afterAddToCart", data);
          $.spinner().stop();
          miniCartReportingUrl(data.reportingURL);
          var prodObj = data.prodObj;
          dataLayer.push({ ecommerce: null });
          dataLayer.push({
            event: "add_to_cart",
            ecommerce: {
              items: [
                {
                  item_name: prodObj.item_name, //Nombre de producto
                  item_id: prodObj.item_id, //ID del producto
                  item_sku_id: prodObj.item_sku_id, //SKU de producto
                  final_price: prodObj.final_price, //Precio del producto con descuento
                  original_price: prodObj.original_price, //Precio original del producto
                  item_category: prodObj.item_category, //Categoría principal del producto
                  item_category2: prodObj.item_category2, //Categoría secundaria del producto
                  item_list_name: prodObj.item_list_name
                    ? prodObj.item_list_name
                    : "", //Lista de donde proviene el
                  size: prodObj.size, //Atributo de tamaño escogido
                  available_size: prodObj.available_size, //Atributo de tallas disponibles
                  color: prodObj.color, //Atributo de color escogido
                  quantity: prodObj.quantity,
                },
              ],
            },
          });
        },
        error: function () {
          $.spinner().stop();
        },
      });
    });
  },
  addToCartCustomMobile: function () {
    $(".select-compra-rapida-mobile").on("change", function () {
      var selectedOption = $("option:selected", this);
      var customUrl = selectedOption.data("custom-url");
      var showMinicart = false,
        urlCustom;
      $(this).spinner().start();
      if (
        $(".page").data("action") &&
        $(".page").data("action").indexOf("Search-Show") != -1
      ) {
        showMinicart = true;
      }
      if (
        typeof $(this).data("custom-url") === "string" &&
        $(this).data("custom-url").indexOf("?") != -1
      ) {
        urlCustom = app.urls.urlAddToCartCustom + "?" + customUrl.split("?")[1];
      } else {
        urlCustom =
          app.urls.urlAddToCartCustom +
          "?" +
          "pid=" +
          customUrl +
          "&quantity=" +
          1;
      }
      window.urlCustom = urlCustom;
      window.showMinicart = showMinicart;
    });
    if (
      $("#" + $(this).parents(".product").data("pid") + "-slot") &&
      $("#" + $(this).parents(".product").data("pid") + "-slot").val()
    ) {
      window.urlCustom =
        window.urlCustom +
        "&slot=" +
        $("#" + $(this).parents(".product").data("pid") + "-slot").val();
    }

    $(".btn-compra-rapida-mobile").on("click", function () {
      $.ajax({
        url: window.urlCustom,
        method: "GET",
        success: function (data) {
          handlePostCartAdd(data, window.showMinicart);
          $("body").trigger("product:afterAddToCart", data);
          $.spinner().stop();
          miniCartReportingUrl(data.reportingURL);
          var prodObj = data.prodObj;
          dataLayer.push({ ecommerce: null });
          dataLayer.push({
            event: "add_to_cart",
            ecommerce: {
              items: [
                {
                  item_name: prodObj.item_name, //Nombre de producto
                  item_id: prodObj.item_id, //ID del producto
                  item_sku_id: prodObj.item_sku_id, //SKU de producto
                  final_price: prodObj.final_price, //Precio del producto con descuento
                  original_price: prodObj.original_price, //Precio original del producto
                  item_category: prodObj.item_category, //Categoría principal del producto
                  item_category2: prodObj.item_category2, //Categoría secundaria del producto
                  item_list_name: prodObj.item_list_name
                    ? prodObj.item_list_name
                    : "", //Lista de donde proviene el
                  size: prodObj.size, //Atributo de tamaño escogido
                  available_size: prodObj.available_size, //Atributo de tallas disponibles
                  color: prodObj.color, //Atributo de color escogido
                  quantity: prodObj.quantity,
                },
              ],
            },
          });
        },
        error: function () {
          $.spinner().stop();
        },
      });
    });
  },
  selectBonusProduct: function () {
    $(document).on("click", ".select-bonus-product", function () {
      var $choiceOfBonusProduct = $(this).parents(".choice-of-bonus-product");
      var pid = $(this).data("pid");
      var maxPids = $(".choose-bonus-product-dialog").data("total-qty");
      var submittedQty = parseInt(
        $choiceOfBonusProduct.find(".bonus-quantity-select").val(),
        10
      );
      var totalQty = 0;
      $.each(
        $("#chooseBonusProductModal .selected-bonus-products .selected-pid"),
        function () {
          totalQty += $(this).data("qty");
        }
      );
      totalQty += submittedQty;
      var optionID = $choiceOfBonusProduct
        .find(".product-option")
        .data("option-id");
      var valueId = $choiceOfBonusProduct
        .find(".options-select option:selected")
        .data("valueId");
      if (totalQty <= maxPids) {
        var selectedBonusProductHtml =
          "" +
          '<div class="selected-pid row" ' +
          'data-pid="' +
          pid +
          '"' +
          'data-qty="' +
          submittedQty +
          '"' +
          'data-optionID="' +
          (optionID || "") +
          '"' +
          'data-option-selected-value="' +
          (valueId || "") +
          '"' +
          ">" +
          '<div class="col-sm-11 col-9 bonus-product-name" >' +
          $choiceOfBonusProduct.find(".product-name").html() +
          "</div>" +
          '<div class="col-1"><i class="fa fa-times" aria-hidden="true"></i></div>' +
          "</div>";
        $("#chooseBonusProductModal .selected-bonus-products").append(
          selectedBonusProductHtml
        );
        $(".pre-cart-products").html(totalQty);
        $(".selected-bonus-products .bonus-summary").removeClass(
          "alert-danger"
        );
      } else {
        $(".selected-bonus-products .bonus-summary").addClass("alert-danger");
      }
    });
  },
  removeBonusProduct: function () {
    $(document).on("click", ".selected-pid", function () {
      $(this).remove();
      var $selected = $(
        "#chooseBonusProductModal .selected-bonus-products .selected-pid"
      );
      var count = 0;
      if ($selected.length) {
        $selected.each(function () {
          count += parseInt($(this).data("qty"), 10);
        });
      }

      $(".pre-cart-products").html(count);
      $(".selected-bonus-products .bonus-summary").removeClass("alert-danger");
    });
  },
  enableBonusProductSelection: function () {
    $("body").on("bonusproduct:updateSelectButton", function (e, response) {
      $("button.select-bonus-product", response.$productContainer).attr(
        "disabled",
        !response.product.readyToOrder || !response.product.available
      );
      var pid = response.product.id;
      $("button.select-bonus-product", response.$productContainer).data(
        "pid",
        pid
      );
    });
  },
  showMoreBonusProducts: function () {
    $(document).on("click", ".show-more-bonus-products", function () {
      var url = $(this).data("url");
      $(".modal-content").spinner().start();
      $.ajax({
        url: url,
        method: "GET",
        success: function (html) {
          var parsedHtml = parseHtml(html);
          $(".modal-body").append(parsedHtml.body);
          $(".show-more-bonus-products:first").remove();
          $(".modal-content").spinner().stop();
        },
        error: function () {
          $(".modal-content").spinner().stop();
        },
      });
    });
  },
  addBonusProductsToCart: function () {
    $(document).on("click", ".add-bonus-products", function () {
      var $readyToOrderBonusProducts = $(
        ".choose-bonus-product-dialog .selected-pid"
      );
      var queryString = "?pids=";
      var url = $(".choose-bonus-product-dialog").data("addtocarturl");
      var pidsObject = {
        bonusProducts: [],
      };

      $.each($readyToOrderBonusProducts, function () {
        var qtyOption = parseInt($(this).data("qty"), 10);

        var option = null;
        if (qtyOption > 0) {
          if (
            $(this).data("optionid") &&
            $(this).data("option-selected-value")
          ) {
            option = {};
            option.optionId = $(this).data("optionid");
            option.productId = $(this).data("pid");
            option.selectedValueId = $(this).data("option-selected-value");
          }
          pidsObject.bonusProducts.push({
            pid: $(this).data("pid"),
            qty: qtyOption,
            options: [option],
          });
          pidsObject.totalQty = parseInt($(".pre-cart-products").html(), 10);
        }
      });
      queryString += JSON.stringify(pidsObject);
      queryString =
        queryString + "&uuid=" + $(".choose-bonus-product-dialog").data("uuid");
      queryString =
        queryString +
        "&pliuuid=" +
        $(".choose-bonus-product-dialog").data("pliuuid");
      $.spinner().start();
      $.ajax({
        url: url + queryString,
        method: "POST",
        success: function (data) {
          $.spinner().stop();
          if (data.error) {
            $("#chooseBonusProductModal").modal("hide");
            if ($(".add-to-cart-messages").length === 0) {
              $("body").append('<div class="add-to-cart-messages"></div>');
            }
            $(".add-to-cart-messages").append(
              '<div class="alert alert-danger add-to-basket-alert text-center"' +
                ' role="alert">' +
                data.errorMessage +
                "</div>"
            );
            setTimeout(function () {
              $(".add-to-basket-alert").remove();
            }, 3000);
          } else {
            $(".configure-bonus-product-attributes").html(data);
            $(".bonus-products-step2").removeClass("hidden-xl-down");
            $("#chooseBonusProductModal").modal("hide");

            if ($(".add-to-cart-messages").length === 0) {
              $("body").append('<div class="add-to-cart-messages"></div>');
            }
            $(".minicart-quantity").html(data.totalQty);
            $(".minicartHeaderItemNumber")
              .empty()
              .append("Bolsa (" + response.quantityTotal + ")");
            $(".add-to-cart-messages").append(
              '<div class="alert alert-success add-to-basket-alert text-center"' +
                ' role="alert">' +
                data.msgSuccess +
                "</div>"
            );
            setTimeout(function () {
              $(".add-to-basket-alert").remove();
              if ($(".cart-page").length) {
                location.reload();
              }
            }, 1500);
          }
        },
        error: function () {
          $.spinner().stop();
        },
      });
    });
  },

  getPidValue: getPidValue,
  getQuantitySelected: getQuantitySelected,
  miniCartReportingUrl: miniCartReportingUrl,
};

$(document).ready(function () {
  $(".prodTile, .prodLink").on("click", function () {
    var url = $(this).data("url-product-info");
    $.ajax({
      url: url,
      method: "GET",
      success: function (data) {
        dataLayer.push({ ecommerce: null });
        dataLayer.push({
          event: "select_item",
          ecommerce: {
            items: [data.prodObj],
          },
        });
      },
    });
  });

  if ($('#idCustomPDP').text() === 'true') {
    if ($('.color-swatches').length > 0) {
      $('.color-swatches')[0].children[0].click();
    }
  }
});
