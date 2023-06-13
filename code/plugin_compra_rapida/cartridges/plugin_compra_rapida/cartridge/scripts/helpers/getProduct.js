"use strict";

var Logger = require('dw/system/Logger');
function getProduct (params) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var ProductMgr = require('dw/catalog/ProductMgr');

    try {
        var apiProduct = ProductFactory.get(params);
    } catch (error) {
        Logger.error('Error en helper getProduct, mensaje error : ' + error.message);
        return false;
    }
   
    if (!apiProduct.readyToOrder) {
        return false;
    }
    var productVariant = ProductMgr.getProduct(apiProduct.id);

    return productVariant.availabilityModel.inStock;
}

module.exports = {getProduct:getProduct}