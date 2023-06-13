'use strict';

var server = require('server');
server.extend(module.superModule);

server.get('AddProductCustom', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var params = req.querystring;
    var childProducts = [], options = [];
    var quantity, result;
    var product = ProductFactory.get(params);
    if (currentBasket) {
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(params.quantity, 10);
                result = cartHelper.addProductToCart(
                    currentBasket,
                    product.id,
                    quantity,
                    childProducts,
                    options
                );
            } 

            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }
    var reportingURL = cartHelper.getReportingUrlAddToCart(currentBasket, result.error);
    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var cartModel = new CartModel(currentBasket);

    var ProductMgr = require('dw/catalog/ProductMgr');
    var productObj = ProductMgr.getProduct(product.id);
    var price1 = ( product.price.sales && product.price.sales.value) ? product.price.sales.value : '';
    var price2 = (product.price.list && product.price.list.value) ? product.price.list.value :'';
    var cat1 = productObj.masterProduct ? "'"+productObj.masterProduct.categoryAssignments[0].category.ID+"'" : "'"+productObj.categoryAssignments[0].category.ID+"'";
    var cat2 = '';
    if(productObj.masterProduct) {
      if(productObj.masterProduct.categoryAssignments.length > 1){
        cat2 =  productObj.masterProduct.categoryAssignments[1].category.ID;
      }
    } else {
      if( productObj.categoryAssignments.length > 1) {
        cat2 = productObj.categoryAssignments[1].category.ID
      }
    }
    var arraySizes = [];
    if (product.variationAttributesCustom) {
      product.variationAttributesCustom.forEach(function (item, index) {
        if(item.attributeId == 'size') { 
          item.values.forEach(function(value, i){
            arraySizes.push(value.value);
          });
        }
      });
    }
   
    var prodObj = {
        item_name: productObj.name ? productObj.name : '',
        item_id: productObj.masterProduct ? productObj.masterProduct.ID : productObj.ID,
        item_sku_id: productObj.masterProduct ? productObj.ID : '',
        final_price: price1,
        original_price: price2,
        item_category:cat1 , //Categoría del producto
        item_category2: cat2, //Subcategoría del producto
        size: productObj.custom.size ? productObj.custom.size :'',
        color: productObj.custom.color ? productObj.custom.color : '',
        available_size: '['+arraySizes.toString()+']',
        quantity: quantity
      };
      if(params.slot) {
          prodObj.item_list_name = params.slot;
        }
        session.custom.hasCart = true;
    res.json({
        reportingURL: reportingURL,
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: {},
        error: result.error,
        pliUUID: result.uuid,
        minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal),
        prodObj: prodObj
    });
    next()
})

module.exports = server.exports();