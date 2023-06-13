'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');
var VariationAttributesModel = require('*/cartridge/models/product/productAttributes');


/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
function imagesDefaultVariation (apiProduct) {
    var ImageModel = require('*/cartridge/models/product/productImages');
    var imageProduct = apiProduct.variationModel.defaultVariant; 
    return !empty(imageProduct) ? new ImageModel(imageProduct, { types: ['medium'], quantity: 'all' }): null

}

function isProductAccessoriesType (product) {
    var hasAttr = false;
    if (product.defaultVariants.length === 1 && product.defaultVariants[0].id === 'color') {   
        hasAttr = true;
    }
    return hasAttr;
}
var conf = {
    attributes: '*',
    endPoint: 'Variation'
};

module.exports = function productTile(product, apiProduct, productType, options) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var productSearchHit = productHelper.getProductSearchHit(apiProduct);
   
    decorators.base(product, apiProduct, productType);
    Object.defineProperty(product, 'imagesDefaultVariation', {
        enumerable: true,
        value: imagesDefaultVariation(apiProduct)
    });
    decorators.images(product, apiProduct, { types: ['hi-res', 'large', 'medium', 'small'], quantity: 'all' });
    decorators.searchPrice(product, productSearchHit, promotionCache.promotions, productHelper.getProductSearchHit);
    decorators.searchVariationAttributes(product, productSearchHit);
    decorators.ratings(product);
    if (productType === 'set') {
        decorators.setProductsCollection(product, apiProduct);
    }
    try {
        var allAttributes = options.variationModel.productVariationAttributes;
        var attrValues = options.variationModel.getAllValues(allAttributes[1]);   
    } catch (error) {
        attrValues = null;
    }
    Object.defineProperty(product, 'defaultVariants', {
        enumerable: true,
        value:  options.variationModel
        ? (new VariationAttributesModel(
            options.variationModel,
            conf,
            conf.selectedOptionsQueryParams,
            1)).slice(0)
        : null
    });

    Object.defineProperty(product, 'defaultVariant', {
        enumerable: true,
        value: apiProduct.variationModel.defaultVariant ? apiProduct.variationModel.defaultVariant.ID : null
    });
    if (attrValues) {
        decorators.searchVariationAttributesCustom(product, productSearchHit,attrValues);
    }

    Object.defineProperty(product, 'isProductAccessoriesType', {
        enumerable: true,
        value: isProductAccessoriesType(product)
    });

    return product;
};
