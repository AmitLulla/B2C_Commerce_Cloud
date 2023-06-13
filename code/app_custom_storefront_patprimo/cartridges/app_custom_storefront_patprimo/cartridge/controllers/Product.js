'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Logger = require('dw/system/Logger');

server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
  var viewData = res.getViewData();
  var ProductMgr = require('dw/catalog/ProductMgr');
  var product = ProductMgr.getProduct(req.querystring.pid);
  var manufacturer = product.manufacturerName;
  var Site = require('dw/system/Site');
  var grupoAtributosID = Site.current.getCustomPreferenceValue('grupoAtributosID');
  var atributosPDP = [];
  if(viewData.product && viewData.product.attributes && viewData.product.attributes.length > 0) {
    for (var i = 0; i < viewData.product.attributes.length; i++) {
      var element =  viewData.product.attributes[i];
      if(element.ID == grupoAtributosID) {
        atributosPDP = element.attributes;
      }
    }
  }
  viewData.customAttrs = atributosPDP;
  viewData.import = manufacturer;
  var arraySizes = [];
  if ('variationAttributesCustom' in viewData.productVariant) {
      viewData.productVariant.variationAttributesCustom.forEach(function (item, index) {
        if(item.attributeId == 'size') { 
          item.values.forEach(function(value, i){
            arraySizes.push(value.value);
          });
        }
      });
  }
 
  try {
    var price1 = ( viewData.product.price.sales && viewData.product.price.sales.value) ? viewData.product.price.sales.value : '';
    var price2 = (viewData.product.price.list && viewData.product.price.list.value) ? viewData.product.price.list.value : '';
    var cat1 = product.masterProduct ? product.masterProduct.categoryAssignments[0].category.ID : +product.categoryAssignments[0].category.ID;
    var cat2 = '';
    if(product.masterProduct) {
      if(product.masterProduct.categoryAssignments.length > 1){
        cat2 =  product.masterProduct.categoryAssignments[1].category.ID;
      }
    } else {
      if( product.categoryAssignments.length > 1) {
        cat2 = product.categoryAssignments[1].category.ID;
      }
    }
    var prodObj = {
      item_id: product.masterProduct ? product.masterProduct.ID : product.ID,
      item_sku_id: product.masterProduct ? product.ID : '',
      final_price: price1,
      original_price: price2,
      item_category:cat1 || null, //Categoría del producto
      item_category2: cat2 || null, //Subcategoría del producto
      item_size: product.custom.size ? product.custom.size :'',
      item_color: product.custom.color ? product.custom.color : '',
      available_size: '['+arraySizes.toString()+']'
  
    };
  } catch (error) {
      Logger.error('Ocurrio un error al obtener la informacion del producto: ', error.message)
  }
  
 
  viewData.prodObj = prodObj ? prodObj : [];
  var Site = require('dw/system/Site');
  var customPreferences = Site.current.preferences.custom;
  var gtm_id = customPreferences.gtm_id;
  viewData.gtm_id = gtm_id;
  res.setViewData(viewData);
  next();
}, pageMetaData.computedPageMetaData);

server.get('Info', function( req, res, next){
  var ProductMgr = require('dw/catalog/ProductMgr');
  var ProductFactory = require('*/cartridge/scripts/factories/product');
  var productObj = ProductMgr.getProduct(req.querystring.pid);
  var productTileParams = { pview: 'tile', 'pid': req.querystring.pid};
  var product = ProductFactory.get(productTileParams);

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
  var prodObj = {
    item_name: productObj.name ? productObj.name : '',
    item_id: productObj.masterProduct ? productObj.masterProduct.ID : productObj.ID,
    item_sku_id: productObj.masterProduct ? productObj.ID : '',
    final_price: price1,
    original_price: price2,
    item_category:cat1 , //Categoría del producto
    item_category2: cat2, //Subcategoría del producto
    item_size: productObj.custom.size ? productObj.custom.size :'',
    item_color: productObj.custom.color ? productObj.custom.color : '',
    item_wishlist: '',
    item_list_name: '',
    index: req.querystring.index
  };
  res.json({prodObj: prodObj });
  next();

});

module.exports = server.exports();
