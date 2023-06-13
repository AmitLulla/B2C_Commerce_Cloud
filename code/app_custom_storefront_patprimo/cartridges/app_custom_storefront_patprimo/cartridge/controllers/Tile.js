'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');


server.replace('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
  var URLUtils = require('dw/web/URLUtils');
  var ProductFactory = require('*/cartridge/scripts/factories/product');
  var list, wishlist = [];

  list = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
  if (list) {
      for (var i = 0; i < list.items.length; i++) {
        wishlist.push(list.items[i].productID);
        
      }
  }

    // The req parameter has a property called querystring. In this use case the querystring could
    // have the following:
    // pid - the Product ID
    // ratings - boolean to determine if the reviews should be shown in the tile.
    // swatches - boolean to determine if the swatches should be shown in the tile.
    //
    // pview - string to determine if the product factory returns a model for
    //         a tile or a pdp/quickview display
  var productTileParams = { pview: 'tile' };
  Object.keys(req.querystring).forEach(function (key) {
    productTileParams[key] = req.querystring[key];
  });

  var product;
  var productUrl;
  var quickViewUrl;

    // TODO: remove this logic once the Product factory is
    // able to handle the different product types
  try {
    product = ProductFactory.get(productTileParams);
    productUrl = URLUtils.url('Product-Show', 'pid', product.id).relative().toString();
    quickViewUrl = URLUtils.url('Product-ShowQuickView', 'pid', product.id).relative().toString();
   
    
  } catch (e) {
    product = false;
    productUrl = URLUtils.url('Home-Show');// TODO: change to coming soon page
    quickViewUrl = URLUtils.url('Home-Show');
  }
  
 

  var context = {
    product: product,
    urls: {
      product: productUrl,
      quickView: quickViewUrl
    },
    display: {},
    wishlist: wishlist
  };

  Object.keys(req.querystring).forEach(function (key) {
    if (req.querystring[key] === 'true') {
      context.display[key] = true;
    } else if (req.querystring[key] === 'false') {
      context.display[key] = false;
    }
  });


  if (product) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productObj = ProductMgr.getProduct(product.id);
    context.productObj = productObj;
    context.index = req.querystring.index;
    context.slotID = req.querystring.slotID;
    context.carousel = req.querystring.carousel;
    context.slot = req.querystring.slot;
    context.slotHome = req.querystring.slotHome;
  }
  
  try {
   
    if (product.defaultVariants[1].values.length > 0 && product.variationAttributesCustom[0].values.length > 0) {
        if (product.defaultVariants[1].values[0].selectable === true) {
          product.defaultVariants[1].values[0].url = product.variationAttributesCustom[0].values[0].urlCustom;
        }
        
    }
  } catch (e){
      
  }


  res.render('product/gridTile.isml', context);

  next();
});

module.exports = server.exports();
