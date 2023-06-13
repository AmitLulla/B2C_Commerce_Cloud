'use strict';
var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var HashMap = require('dw/util/HashMap');
var flag = false;
var masterID;

function getProductCategories( pid) {
    var ProductMgr = require('dw/catalog/ProductMgr');

    var category;
    var product;
    var rtrnValue;
    if (pid) {
        product = ProductMgr.getProduct(pid);

        var list=product.getVariants();

       

        category = (product.variant && product.masterProduct.primaryCategory)
            ? product.masterProduct.primaryCategory
            : product.primaryCategory;
    }
    return category ? category.ID : null ;
}

function getMaster(pid){

    var ProductMgr = require('dw/catalog/ProductMgr');
    var product;
  
    if (pid) {
        product = ProductMgr.getProduct(pid);
    return  product.masterProduct.ID; 

 }
}

function getVariationModel(product, productVariables) {
    var variationModel = product.variationModel;
    if (!variationModel.master && !variationModel.selectedVariant) {
        variationModel = null;
    } else if (productVariables) {
        var variationAttrs = variationModel.productVariationAttributes;
        Object.keys(productVariables).forEach(function (attr) {
            if (attr && productVariables[attr].value) {
                var dwAttr = collections.find(variationAttrs,
                    function (item) { return item.ID === attr; });
                var dwAttrValue = collections.find(variationModel.getAllValues(dwAttr),
                    function (item) { return item.value === productVariables[attr].value; });
                if (dwAttr && dwAttrValue) {
                    try {
                        variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                    } catch (error) {
                        
                    }
                    
                }
            }
        });
    }
    return variationModel;
}

/**
 * Renders the Product Details Page
 * @param {Object} querystring - query string parameters
 * @param {Object} reqPageMetaData - request pageMetaData object
 * @param {Object} usePageDesignerTemplates - wether to use the page designer version of the product detail templates, defaults to false
 * @returns {Object} contain information needed to render the product page
 */
function showProductPage(querystring, reqPageMetaData) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper'); 
    var System = require('dw/system');
    var site = System.Site.getCurrent();
    var customPreferenceValue = site.getCustomPreferenceValue('customPDPCategories');
    var params = querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var canonicalUrl = URLUtils.url('Product-Show', 'pid', product.id);
    var breadcrumbs = base.getAllBreadcrumbs(null, product.id, []).reverse();
    var cat=null;
    var productVariant = ProductFactory.get(params);

    product.customPDP="false";
    
    cat= getProductCategories(product.id)

    //Custom Preference Calzoncillo Flag Validator
    if ( cat !== null ){
        for (let index = 0; index < customPreferenceValue.length; index++) {
            var customCategory= customPreferenceValue[index];
            if(customCategory === cat){
                product.customPDP="true"
            }
        }
    }
    
    if(flag != true ){
        if( product.customPDP === "true" && product.productType === "variant" ){
            var pids = {
                obj: []
            };

            pids.obj.push({
                pid: getMaster(product.id)
            });
            
            var json = pids.obj[0];// JSON.stringify(pids.a);

            product = ProductFactory.get(json);
            flag = true;

            product.customPDP="false";
    
            cat= getProductCategories(product.id)

            //Custom Preference Calzoncillo Flag Validator
            if ( cat !== null ){
                for (let index = 0; index < customPreferenceValue.length; index++) {
                    var customCategory= customPreferenceValue[index];
                    if(customCategory === cat){
                        product.customPDP="true"
                    }
                }
            }
        }
    }

    var template = 'product/productDetails';

    if (product.productType === 'bundle' && !product.template) {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set' && !product.template) {
        template = 'product/setDetails';
    } else if (product.template) {
        template = product.template;
    }else if (product.customPDP === "true"){
        template = 'product/productDetailsPDP'
    }

    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);
    var schemaData = require('*/cartridge/scripts/helpers/structuredDataHelper').getProductSchema(product);

    return {
        template: template,
        product: product,        
        addToCartUrl: addToCartUrl,
        resources: base.getResources(),
        breadcrumbs: breadcrumbs,
        canonicalUrl: canonicalUrl,
        schemaData: schemaData,
        productVariant: productVariant
    };
}

function getProductSearchHit(apiProduct) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchModel = new ProductSearchModel();
    searchModel.setSearchPhrase(apiProduct.ID);
    searchModel.search();

    if (searchModel.count === 0) {
        searchModel.setSearchPhrase(apiProduct.ID.replace(/-/g, ' '));
        searchModel.search();
    }

    var hit = searchModel.getProductSearchHit(apiProduct);
    if (!hit) {
        var tempHit = searchModel.getProductSearchHits().next();
        if (tempHit.firstRepresentedProductID === apiProduct.ID || tempHit.firstRepresentedProductID === apiProduct.variants[0].ID) {
            hit = tempHit;
        }
    }
    return hit;
}

base.getProductCategories;
base.getOptions;
base.getCurrentOptionModel;
base.getConfig;
base.getSelectedOptionsUrl;
base.getProductType;
base.getVariationModel = getVariationModel;
base.getLineItemOptions;
base.getDefaultOptions;
base.getLineItemOptionNames;
base.getAllBreadcrumbs;
base.getResources;
base.getPageDesignerProductPage;
base.getProductSearchHit = getProductSearchHit;
base.showProductPage = showProductPage;

module.exports = base;
