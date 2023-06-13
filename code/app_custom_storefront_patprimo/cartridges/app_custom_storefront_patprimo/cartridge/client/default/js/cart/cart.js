var base = require('base/product/base');
var focusHelper = require('base/components/focus');
/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                'fade show" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' + data.valid.message + '</div>';

            $('.cart-error').append(errorHtml);
        } else {
            $('.cart').empty().append('<div class="row"> ' +
                '<div class="col-12 text-center"> ' +
                '<h1>' + data.resources.emptyCartMsg + '</h1> ' +
                '</div> ' +
                '</div>'
            );
            $('.number-of-items').empty().append(data.resources.numberOfItems);
            $('.minicart-quantity').empty().append(data.numItems);
            $('.minicartquantity').empty().append(data.numItems);
            $('.minicart-link').attr({
                'aria-label': data.resources.minicartCountOfItems,
                title: data.resources.minicartCountOfItems
            });
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');
        }

        $('.checkout-btn').addClass('disabled');
    } else {
        $('.checkout-btn').removeClass('disabled');
    }    
}
$(document).ready(function() {
    // show the alert
    $(".cart-error").first().hide().slideDown(500).delay(4000).slideUp(500, function () {
       $(this).remove(); 
    });
});
/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
function updateCartTotals(data) {
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total').empty().append(data.totals.grandTotal - data.totals.totalShippingCost);
    $('.grand-totalCart').empty().append('$' +(data.totals.grandTotalValue - parseInt(data.totals.totalShippingCost.replace(/\./g, '').replace(/\$/g,''))).toFixed().toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'));
    $('.sub-total').empty().append(data.totals.subTotal);
    $('.sub-totalQ').empty().append((data.totals.subTotal).substring(1));
    $('.minicart-quantity').empty().append(data.numItems);
    $('.minicartquantity').empty().append(data.numItems);
    $('.minicart-link').attr({
        'aria-label': data.resources.minicartCountOfItems,
        title: data.resources.minicartCountOfItems
    });    

    $('.subtotalsCart').empty().append(data.totals.subTotal);

    if (data.totals.orderLevelDiscountTotal.formatted > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }
    $('.minicartHeaderItemNumber').empty().append('Bolsa (' + data.numItems + ')');
    $('.cartHeaderAmount').empty().append('Verifica los productos de tu bolsa (' + data.numItems + ')');
    $('.cartHeaderAmountMobile').empty().append(data.numItems + ' ' + (data.numItems !=1 ? ' artículos' : ' artículo') + ' | ' + data.totals.grandTotal);
    data.items.forEach(function (item) {
        $('.uuid-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.line-item-price-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
        if (item.renderedPromotions) {
            $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        } else {
            $('.item-' + item.UUID).empty();            
        }
    });

    $('.title.cart.custom').empty().append(data.numItems);
    for (var i = 0; i < data.totals.discounts.length; i ++) {
        for (var UUID in data.totals.discounts) {
            if (data.totals.discounts[i].type != 'coupon') {
                $('.applied-promotion-discount-cart-'+ data.totals.discounts[i].UUID).empty().append('-' + data.totals.discounts[i].price.replace('-', ''));
            }
            if (data.totals.discounts[i].type === 'coupon') {
                if (data.totals.discounts[i].applied) {
                    $('.applied-promotion-discount-cart-'+ data.totals.discounts[i].UUID).empty().append('-$' + (data.totals.discounts[i].priceCustom[0].totalCupon.toFixed().toString().replace('Col', '').replace('-', '').replace(/\$/g,'').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')));
                }
                else {
                    $('.applied-promotion-discount-cart-'+ data.totals.discounts[i].UUID).empty().append('No aplicable');
                }
            }
        }
    }
}

function updateMensajeEnvioGratis(mensaje){
    $('.barra-envio-gratis-mensaje').empty().append(mensaje);
}
/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-light alert-dismissible valid-cart-error bckAzulPat fontSize14 ' +
        'fade show" role="alert" style="color: #fff">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';
    $('.cart-error').append(errorHtml);
    $(".alert-dismissible").slideDown(1500).fadeTo(6000, 200).slideUp(1500, function(){
        $(".alert-dismissible").alert('close');
    });
}

/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}

/**
 * Updates the availability of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateAvailability(data, uuid) {
    var lineItem;
    var messages = '';

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    if (lineItem != null) {
        $('.availability-' + lineItem.UUID).empty();

        if (lineItem.availability) {
            if (lineItem.availability.messages) {
                lineItem.availability.messages.forEach(function (message) {
                    messages += '<p class="line-item-attributes">' + message + '</p>';
                });
            }

            if (lineItem.availability.inStockDate) {
                messages += '<p class="line-item-attributes line-item-instock-date">'
                    + lineItem.availability.inStockDate
                    + '</p>';
            }
        }

        $('.availability-' + lineItem.UUID).html(messages);
    }
}

/**
 * Finds an element in the array that matches search parameter
 * @param {array} array - array of items to search
 * @param {function} match - function that takes an element and returns a boolean indicating if the match is made
 * @returns {Object|null} - returns an element of the array that matched the query.
 */
function findItem(array, match) { // eslint-disable-line no-unused-vars
    for (var i = 0, l = array.length; i < l; i++) {
        if (match.call(this, array[i])) {
            return array[i];
        }
    }
    return null;
}

/**
 * Updates details of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateProductDetails(data, uuid) {
    $('.card.product-info.uuid-' + uuid).replaceWith(data.renderedTemplate);
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#editProductModal').length !== 0) {
        $('#editProductModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade mt-4" id="editProductModal" tabindex="-1" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="modal-dialog quick-view-dialog editProductCart editProductModal">'
        + '<!-- Modal content-->'
        + '<div class="modal-content roundCorner7 " >'
        + '<div class="modal-header editModalHeader pt-3 pl-4 pb-0 roundCorner7">'
        + '<div class="col-sm-4 col-8 pl-sm-4 pl-0" >'
        + '    <span class="PlayfairDisplay fontWeight600 fontSize20" style="left: 10%;top: 0.5vw;" data-dismiss="modal" aria-label="Close">'
        + 'Edita tu producto'
        + '    </span>'
        + '</div>'
        + '<div class="col-sm-8 col-4" >'
        + '    <button type="button" class="close-PatPrimo-minicart border-0" style="left: 90%;top: 0.5vw;" data-dismiss="modal" aria-label="Close">'
        + '        <span aria-hidden="true">.</span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '</div>'
        + '<div class="modal-body pb-0 ml-sm-4 ml-0 modalBodyEditProduct"></div>'
        + '<div class="modal-footer pb-0"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
function fillModalElement(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#editProductModal .enter-message').text(data.enterDialogMessage);
            $('#editProductModal').modal('show');
            $('body').trigger('editproductmodal:ready');
            $.spinner().stop();
            var prodObj = data.prodObj;
            dataLayer.push({
                ecommerce: null
            });
            dataLayer.push({
                event: "edit_cart",
                ecommerce: {
                    total_cart_size: data.cartSize, //Número de productos en el carrito
                    total_cart_amount: data.total, //Total del carrito
                    coupon: data.coupon, //Opcional, si usa un cupón
                    items: [{
                            item_name: prodObj.item_name, //Nombre producto
                            item_id: prodObj.item_id, //ID del producto
                            item_sku_id: prodObj.item_sku_id, //SKU de producto
                            final_price: prodObj.final_price, //Precio del producto con descuento
                            original_price: prodObj.original_price, //Precio original del producto
                            item_category: prodObj.item_category, //Categoría principal del producto
                            item_category2: prodObj.item_category2, //Categoría secundaria del producto
                            quantity: prodObj.quantity
                        }
                    ]
                }
            });
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 */
function confirmDelete(actionUrl, productID, productName, uuid) {
    var $deleteConfirmBtn = $('.cart-delete-confirmation-btn');
    var $productToRemoveSpan = $('.product-to-remove');

    $deleteConfirmBtn.data('pid', productID);
    $deleteConfirmBtn.data('action', actionUrl);
    $deleteConfirmBtn.data('uuid', uuid);

    $productToRemoveSpan.empty().append(productName);
}

module.exports = function () {
    $('body').on('click', '.remove-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        confirmDelete(actionUrl, productID, productName, uuid);
    });

    $('body').on('afterRemoveFromCart', function (e, data) {
        e.preventDefault();
        confirmDelete(data.actionUrl, data.productID, data.productName, data.uuid);
    });

    $('.optional-promo').click(function (e) {
        e.preventDefault();
        $('.promo-code-form').toggle();
    });

    $('body').on('click', '.close-PatPrimo-minicart', function (e) {        
        $('.minicart .popover').removeClass('show'); 
    });

    $('body').on('click', '.cart-delete-confirmation-btn', function (e) {
        e.preventDefault();

        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.basket.items.length === 0) {
                    $('.cart').empty().append('<div class="row"> ' +
                        '<div class="col-12 text-center"> ' +
                        '<h1>' + data.basket.resources.emptyCartMsg + '</h1> ' +
                        '</div> ' +
                        '</div>'
                    );
                    $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
                    $('.minicart-quantity').empty().append(data.basket.numItems);
                    $('.minicartquantity').empty().append(data.basket.numItems);
                    $('.minicart-link').attr({
                        'aria-label': data.basket.resources.minicartCountOfItems,
                        title: data.basket.resources.minicartCountOfItems
                    });
                    $('.minicart .popover').empty();
                    $('.minicart .popover').removeClass('show');
                    $('body').removeClass('modal-open');
                    $('html').removeClass('veiled');                    
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                        }
                    }
                    $('.uuid-' + uuid).remove();
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    $('.progresoEnvio').remove();
                    $('.barraProgresoEnvio').append('<div class="progress-bar progressBarAzulPat progresoEnvio" role="progressbar" style="width:' + (data.basket.totals.subTotalValue*100/data.cantidadEnvioGratis) + '%; " aria-valuemin="0"></div>');
                    updateCartTotals(data.basket);
                    updateMensajeEnvioGratis(data.mensajeEnvioGratis);
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    validateBasket(data.basket);
                }

                $('body').trigger('cart:update', data);

                $.spinner().stop();
                var prodObj = data.prodObj;
                dataLayer.push({ ecommerce: null });
                dataLayer.push({
                event: "remove_from_cart",
                ecommerce: {
                items: [{
                item_name: prodObj.item_name, //Nombre de producto
                item_id: prodObj.item_id, //ID del producto
                item_sku_id: prodObj.item_sku_id, //SKU de producto
                final_price: prodObj.final_price, //Precio del producto con descuento
                original_price: prodObj.original_price, //Precio original del producto
                item_category: prodObj.item_category, //Categoría principal del producto
                item_category2: prodObj.item_category2, //Categoría secundaria del producto
                item_list_name: prodObj.item_list_name, //Lista de donde proviene el
                size: prodObj.size, //Atributo de tamaño escogido
                available_size: prodObj.available_size, //Atributo de tallas disponibles
                color: prodObj.color, //Atributo de color escogido
                quantity: prodObj.quantity
                }]
            }
            });
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });


    $('body').on('click', '.button-plus', function (e) {        
        var preSelectQty = $(this).attr('pre-select-qty');
        var productID = $(this).data('pid');
        var quantity = parseInt(preSelectQty) + 1;
        if (quantity == 2) {
            $('#minusButton-'+productID).addClass('button-minus').removeClass('remove-product').removeAttr('data-toggle');
        }    
        
        var url = $(this).data('action');
        var uuid = $(this).attr('data-num');
        var updateQuantityUrl = '/on/demandware.store/Sites-PatPrimo-Site/default/Cart-UpdateQuantity?pid=' + productID + '&quantity=' + quantity + '&uuid=' + uuid;
        var urlParams = {
            pid: productID,
            quantity: quantity,
            uuid: uuid
        };
        url = updateQuantityUrl;

        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            context: this,
            dataType: 'json',
            success: function (data) {
                $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
                updateCartTotals(data.basket);
                updateMensajeEnvioGratis(data.mensajeEnvioGratis);
                updateApproachingDiscounts(data.basket.approachingDiscounts);
                updateAvailability(data.basket, uuid);
                validateBasket(data.basket);
                $(this).attr('pre-select-qty', quantity);
                $('#minusButton-'+productID).attr('pre-select-qty', quantity).data('pre-select-qty', quantity).attr('value', quantity);
                $('#quantity-'+uuid).attr('pre-select-qty', quantity).attr('value', quantity);
                $('body').trigger('cart:update', data.basket);
                $('.progresoEnvio').remove();
                $('.barraProgresoEnvio').append('<div class="progress-bar progressBarAzulPat progresoEnvio" role="progressbar" style="width:' + (data.basket.totals.subTotalValue*100/data.cantidadEnvioGratis) + '%; " aria-valuemin="0"></div>');
                $.spinner().stop();
                if ($(this).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                    location.reload();
                }
                if ($(this).parents('.btn-group').hasClass('quantity') ) {
                    location.reload();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $(this).val(parseInt(preSelectQty, 10));
                    $.spinner().stop();
                }
            }
        });
    
    });

    $('body').on('click', '.button-minus', function (e) {
        var productID = $(this).data('pid');
        var preSelectQty = $(this).attr('pre-select-qty');
        var quantity = parseInt(preSelectQty) - 1;
        if (quantity < 1) {
            $('#minusButton-'+productID).addClass('remove-product').removeClass('button-minus');
            $(this).attr('data-toggle', 'modal');
        }
        else {            
            var url = $(this).data('action');
            var uuid = $(this).attr('data-num');
            var updateQuantityUrl = '/on/demandware.store/Sites-PatPrimo-Site/default/Cart-UpdateQuantity?pid=' + productID + '&quantity=' + quantity + '&uuid=' + uuid;
            var urlParams = {
                pid: productID,
                quantity: quantity,
                uuid: uuid
            };
            url = updateQuantityUrl;
    
            $(this).parents('.card').spinner().start();
    
            $('body').trigger('cart:beforeUpdate');
            $.ajax({
                url: url,
                type: 'get',
                context: this,
                dataType: 'json',
                success: function (data) {
                    $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
                    updateCartTotals(data.basket);
                    updateMensajeEnvioGratis(data.mensajeEnvioGratis);
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                    updateAvailability(data.basket, uuid);
                    validateBasket(data.basket);
                    $(this).attr('pre-select-qty', quantity);
                    $('body').trigger('cart:update', data.basket);
                    $('#plusButton-'+productID).attr('pre-select-qty', quantity).data('pre-select-qty', quantity).attr('value', quantity);
                    $('#quantity-'+uuid).attr('pre-select-qty', quantity).data('pre-select-qty', quantity).attr('value', quantity);
                    $('.progresoEnvio').remove();
                    $('.barraProgresoEnvio').append('<div class="progress-bar progressBarAzulPat progresoEnvio" role="progressbar" style="width:' + (data.basket.totals.subTotalValue*100/data.cantidadEnvioGratis) + '%; " aria-valuemin="0"></div>');
                    $.spinner().stop();
                    if ($(this).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                        location.reload();
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                        $(this).val(parseInt(preSelectQty, 10));
                        $.spinner().stop();
                    }
                }
            });
        }


    });

    $('body').on('change', '.quantity-form > .quantity', function () {
        var preSelectQty = $(this).data('pre-select-qty');
        var quantity = $(this).val();
        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var urlParams = {
            pid: productID,
            quantity: quantity,
            uuid: uuid
        };
        url = appendToUrl(url, urlParams);
        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            context: this,
            dataType: 'json',
            success: function (data) {
                $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
                
                updateCartTotals(data.basket);
                updateMensajeEnvioGratis(data.mensajeEnvioGratis);
                updateApproachingDiscounts(data.basket.approachingDiscounts);
                updateAvailability(data.basket, uuid);
                validateBasket(data.basket);
                $(this).data('pre-select-qty', quantity);
                $('body').trigger('cart:update', data.basket);                
                $.spinner().stop();
                if ($(this).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                    location.reload();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $(this).val(parseInt(preSelectQty, 10));
                    $.spinner().stop();
                }
            }
        });
    });

    $('.shippingMethods').change(function () {
        var url = $(this).attr('data-actionUrl');
        var urlParams = {
            methodID: $(this).find(':selected').attr('data-shipping-id')
        };
        // url = appendToUrl(url, urlParams);

        $('.totals').spinner().start();
        $('body').trigger('cart:beforeShippingMethodSelected');
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: urlParams,
            success: function (data) {
                if (data.error) {
                    window.location.href = data.redirectUrl;
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                }

                $('body').trigger('cart:shippingMethodSelected', data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.redirectUrl) {
                    window.location.href = err.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $('.promo-code-form').submit(function (e) {
        e.preventDefault();
        $.spinner().start();
        $('.coupon-missing-error').hide();
        $('.coupon-error-message').empty();
        if (!$('.coupon-code-field').val()) {
            $('.promo-code-form .form-control').addClass('is-invalid');
            $('.promo-code-form .form-control').attr('aria-describedby', 'missingCouponCode');
            $('.coupon-missing-error').show();
            $.spinner().stop();
            return false;
        }
        var $form = $('.promo-code-form');
        $('.promo-code-form .form-control').removeClass('is-invalid');
        $('.coupon-error-message').empty();
        $('body').trigger('promotion:beforeUpdate');

        $.ajax({
            url: $form.attr('action'),
            type: 'GET',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                if (data.error) {
                    $('.promo-code-form .form-control').addClass('is-invalid');
                    $('.promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
                    $('.coupon-error-message').empty().append(data.errorMessage).fadeTo(6000, 200).slideUp(1500, function(){
                        $('.coupon-error-message').empty();
                    });
                    $('body').trigger('promotion:error', data);
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    $('.subtotalsCart').empty().append(data.totals.subTotal);                    
                    $('body').trigger('promotion:success', data);       
                    for (var i = 0; i < data.totals.discounts.length; i ++) {                                               
                            if (data.totals.discounts[i].type === 'coupon') {                                
                                $('.promotion-name-' + data.totals.discounts[i].UUID ).empty().append(data.totals.discounts[i].couponCode);
                                $('.applied-promotion-discount-cart-' + data.totals.discounts[i].UUID).remove();
                                if (data.totals.discounts[i].applied) {                                    
                                    $('<span class="applied-promotion-discount-cart applied-promotion-discount-cart-' + data.totals.discounts[i].UUID + '">-$' + (data.totals.discounts[i].priceCustom[0].totalCupon * -1).toString().replace('Col', '').replace('-', '').replace(/\$/g,'').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + '</span>' ).insertAfter('.promotion-name-' + data.totals.discounts[i].UUID);
                                }
                                else {
                                    $('<span class="applied-promotion-discount-cart applied-promotion-discount-cart-' + data.totals.discounts[i].UUID + '">No aplicable</span>' ).insertAfter('.promotion-name-' + data.totals.discounts[i].UUID);
                                }
                            }
                    }
                    updateCartTotals(data);
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                }
                $('.coupon-code-field').val('');
                $('#redimirCuponCheckout').hide('fast');
                $.spinner().stop();
            },
            error: function (err) {
                $('body').trigger('promotion:error', err);
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.errorMessage);
                    $.spinner().stop();
                }
            }
        });
        return false;
    });

    $('#addCoupon').keypress(function(e) {
        if (e.which == 13) {
            return false;
        }
    });

    $('#addCoupon').on('keyup', function(e) {
        $('#invalidCouponCode').html('');
        if($(this).val().length === 0) {
            $('#redimirCuponCheckout').hide('fast');
        }else {
            $('#redimirCuponCheckout').show('slow');
        }
    })

    $('.add-coupon').on('submit',function(e){
        e.preventDefault();
        if ($('#addCoupon').val().length > 0) {
            $.ajax({
                url: $(this).attr('action'),
                type: 'GET',
                dataType: 'json',
                data: $(this).serialize(),
                success: function (data) {
                    if (data.error) {
                        $('.promo-code-form .form-control').addClass('is-invalid');
                        $('.promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
                        $('.coupon-error-message').empty().append(data.errorMessage).fadeTo(6000, 200).slideUp(1500, function(){
                            $('.coupon-error-message').empty();
                        });
                        $('body').trigger('promotion:error', data);
                    } else {
                        $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                        $('.subtotalsCart').empty().append(data.totals.subTotal);
                        validateBasket(data);
                        updateApproachingDiscounts(data.approachingDiscounts);
                        updateCartTotals(data);
                        $('body').trigger('promotion:success', data);
                        $('.coupon-error-message').html('');
                        setTimeout(function(){
                            $('#addCoupon').trigger('keyup');
                        }, 1000);
                        $('#redimirCuponCheckout').hide('fast');
                    }
                    $('.coupon-code-field').val('');
                    $('#redimirCuponCheckout').hide('fast');
                    $.spinner().stop();
                },
                error: function (err) {
                    $('body').trigger('promotion:error', err);
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        }
    })

    $('body').on('click', '.remove-coupon', function (e) {
        e.preventDefault();

        var couponCode = $(this).data('code');
        var uuid = $(this).data('uuid');
        var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
        var $productToRemoveSpan = $('.coupon-to-remove');

        $deleteConfirmBtn.data('uuid', uuid);
        $deleteConfirmBtn.data('code', couponCode);

        $productToRemoveSpan.empty().append(couponCode);
    });

    $('body').on('click', '.delete-coupon-confirmation-btn', function (e) {
        e.preventDefault();

        var url = $(this).data('action') ? $(this).data('action') : $('.add-coupon').data('action-remove-coupon');
        var uuid = $(this).data('uuid');
        var couponCode = $(this).data('code');
        var urlParams = {
            code: couponCode,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $('body').trigger('promotion:beforeUpdate');
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('.coupon-uuid-' + uuid).remove();
                $('.promotion-name-' + uuid).remove();
                $('.applied-promotion-discount-cart-' + uuid).empty();
                $('body').trigger('promotion:success', data);                
                validateBasket(data);                
                updateApproachingDiscounts(data.approachingDiscounts);
                $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                $('.subtotalsCart').empty().append(data.totals.subTotal);
                updateCartTotals(data);
                $.spinner().stop();                
            },
            error: function (err) {
                $('body').trigger('promotion:error', err);
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });
    $('body').on('click', '.cart-page .bonus-product-button', function () {
        $.spinner().start();
        $(this).addClass('launched-modal');
        $.ajax({
            url: $(this).data('url'),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                base.methods.editBonusProducts(data);
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });

    $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
        $('#chooseBonusProductModal').remove();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');

        if ($('.cart-page').length) {
            $('.launched-modal .btn-outline-primary').trigger('focus');
            $('.launched-modal').removeClass('launched-modal');
        } else {
            $('.product-detail .add-to-cart').focus();
        }
    });

    $('body').on('click', '.cart-page .product-edit .edit, .cart-page .bundle-edit .edit', function (e) {
        e.preventDefault();

        var editProductUrl = $(this).attr('href');
        getModalHtmlElement();
        fillModalElement(editProductUrl);
    });

    $('body').on('shown.bs.modal', '#editProductModal', function () {
        $('#editProductModal').siblings().attr('aria-hidden', 'true');
        $('#editProductModal .close').focus();
    });

    $('body').on('hidden.bs.modal', '#editProductModal', function () {
        $('#editProductModal').siblings().attr('aria-hidden', 'false');
    });

    $('body').on('keydown', '#editProductModal', function (e) {
        var focusParams = {
            event: e,
            containerSelector: '#editProductModal',
            firstElementSelector: '.close',
            lastElementSelector: '.update-cart-product-global',
            nextToLastElementSelector: '.modal-footer .quantity-select'
        };
        focusHelper.setTabNextFocus(focusParams);
    });

    $('body').on('product:updateAddToCart', function (e, response) {
        // update global add to cart (single products, bundles)
        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        $('.update-cart-product-global', dialog).attr('disabled',
            !$('.global-availability', dialog).data('ready-to-order')
            || !$('.global-availability', dialog).data('available')
        );
    });

    $('body').on('product:updateAvailability', function (e, response) {
        // bundle individual products
        $('.product-availability', response.$productContainer)
            .data('ready-to-order', response.product.readyToOrder)
            .data('available', response.product.available)
            .find('.availability-msg')
            .empty()
            .html(response.message);


        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        if ($('.product-availability', dialog).length) {
            // bundle all products
            var allAvailable = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('available'); });

            var allReady = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('ready-to-order'); });

            $('.global-availability', dialog)
                .data('ready-to-order', allReady)
                .data('available', allAvailable);

            $('.global-availability .availability-msg', dialog).empty()
                .html(allReady ? response.message : response.resources.info_selectforstock);
        } else {
            // single product
            $('.global-availability', dialog)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);
        }
    });

    $('body').on('product:afterAttributeSelect', function (e, response) {
        if ($('.modal.show .product-quickview .bundle-items').length) {
            $('.modal.show').find(response.container).data('pid', response.data.product.id);
            $('.modal.show').find(response.container).find('.product-id').text(response.data.product.id);
        } else {
            $('.modal.show .product-quickview').data('pid', response.data.product.id);
        }
    });

    $('body').on('change', '.quantity-select', function () {
        var selectedQuantity = $(this).val();
        $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
    });

    $('body').on('change', '.options-select', function () {
        var selectedOptionValueId = $(this).children('option:selected').data('value-id');
        $('.modal.show .update-cart-url').data('selected-option', selectedOptionValueId);
    });

    $('body').on('click', '.update-cart-product-global', function (e) {
        e.preventDefault();

        var updateProductUrl = $(this).closest('.cart-and-ipay').find('.update-cart-url').val();
        var selectedQuantity = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-quantity');
        var selectedOptionValueId = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-option');
        var uuid = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('uuid');

        var form = {
            uuid: uuid,
            pid: base.getPidValue($(this)),
            quantity: selectedQuantity,
            selectedOptionValueId: selectedOptionValueId
        };

        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        if (updateProductUrl) {
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function (data) {
                    $('#editProductModal').modal('hide');

                    
                    updateCartTotals(data.cartModel);
                    updateApproachingDiscounts(data.cartModel.approachingDiscounts);
                    updateAvailability(data.cartModel, uuid);
                    updateProductDetails(data, uuid);                    
                    if (data.uuidToBeDeleted) {
                        $('.uuid-' + data.uuidToBeDeleted).remove();
                    }

                    validateBasket(data.cartModel);

                    $('body').trigger('cart:update', data);
                    //$('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    $.spinner().stop();
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        }
    });

    base.selectAttribute();
    base.colorAttribute();
    base.removeBonusProduct();
    base.selectBonusProduct();
    base.enableBonusProductSelection();
    base.showMoreBonusProducts();
    base.addBonusProductsToCart();
    base.focusChooseBonusProductModal();
    base.trapChooseBonusProductModalFocus();
    base.onClosingChooseBonusProductModal();
};


