'use strict';

/**
 * @namespace Tile
 */

var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Tile-Show : Used to return data for rendering a product tile
 * @name Base/Tile-Show
 * @function
 * @memberof Tile
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - the Product ID
 * @param {querystringparameter} - ratings - boolean to determine if the reviews should be shown in the tile
 * @param {querystringparameter} - swatches - boolean to determine if the swatches should be shown in the tile
 * @param {querystringparameter} - pview - string to determine if the product factory returns a model for a tile or a pdp/quickview display
 * @param {querystringparameter} - quantity - Quantity
 * @param {querystringparameter} - dwvar_<pid>_color - Color Attribute ID
 * @param {querystringparameter} - dwvar_<pid>_size - Size Attribute ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var viewData = res.getViewData();

    var product;
    var productUrl;
    var quickViewUrl;

    try {
        product = viewData.product
        product.defaultVariants[1].values[0].url =  product.variationAttributesCustom[0].values[0].urlCustom;
        productUrl = URLUtils.url('Product-Show', 'pid', product.defaultVariant ? product.defaultVariant:product.id).relative().toString();
        quickViewUrl = URLUtils.url('Product-ShowQuickView', 'pid', product.id).relative().toString();
    } catch (e) {
        product = false;
        productUrl = URLUtils.url('Home-Show');// TODO: change to coming soon page
        quickViewUrl = URLUtils.url('Home-Show');
    }
    viewData.urls.product = productUrl;

    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
