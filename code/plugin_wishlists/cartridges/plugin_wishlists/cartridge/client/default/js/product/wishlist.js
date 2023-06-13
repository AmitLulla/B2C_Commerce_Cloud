'use strict';


/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked to add a product to the wishlist
 */

function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
        
    } else {
        status = 'alert-danger';
    }

    if ($('.add-to-wishlist-messages').length === 0) {
        button.append(
        '<div class="add-to-wishlist-messages"></div>'
        );
    }
    var scrollAnimate = require('base/components/scrollAnimate');
    var container = $('#msjWish');

    //container.append('<div class="alert alert-success add-to-wishlist-alert text-center ' + status + '"></div>');
    //scrollAnimate(container);

    container.append('<div class="add-to-wishlist-alert alert alert-success textAzulPat">' + data.msg + '</div>');

    setTimeout(function () {
        container.html('');
        $('.add-to-wishlist-messages').remove();
        button.removeAttr('disabled');
    }, 5000);
}

module.exports = {
    addToWishlist: function () {
        $('.add-to-wish-list').on('click', function (e) {
            e.preventDefault();
            var url = $(this).data('href');
            var button = $(this);
            var pid = $(this).closest('.product-detail').find('.product-id').html();
            var optionId = $(this).closest('.product-detail').find('.product-option').attr('data-option-id');
            var optionVal = $(this).closest('.product-detail').find('.options-select option:selected').attr('data-value-id');
            optionId = optionId || null;
            optionVal = optionVal || null;
            if (!url || !pid) {
                return;
            }

            $.spinner().start();
            $(this).attr('disabled', true);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: {
                    pid: pid,
                    optionId: optionId,
                    optionVal: optionVal
                },
                success: function (data) {
                    displayMessage(data, button);
                },
                error: function (err) {
                    displayMessage(err, button);
                }
            });
        });
    },
    addToWishlistRecommendations: function () {
        $('body').on('click', '.wishlistTile, .heartOver', function (e) {
            $(this).find('span>i').toggleClass('redPatPrimo');
            e.preventDefault();
            var icon = $(this).find($('span>i'));
            var url = $(this).attr('href');
            var pid = $(this).closest('.product').data('pid');
            var optionId = $(this).closest('.product-detail').find('.product-option').attr('data-option-id');
            var optionVal = $(this).closest('.product-detail').find('.options-select option:selected').attr('data-value-id');
            optionId = optionId || null;
            optionVal = optionVal || null;
            if (!url || !pid) {
                return;
            }

            $('.recommendations__title').spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: {
                    pid: pid,
                    optionId: optionId,
                    optionVal: optionVal
                },
                success: function (data) {
                    displayMessage(data, icon);
                },
                error: function (err) {
                    displayMessage(err, icon);
                }
            });
        });
    }
};
