'use strict';

var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

server.append('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
  var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
  var viewData = res.getViewData();
  var result = searchHelper.search(req, res);
  var URLUtils = require('dw/web/URLUtils');
  var productHelpers = require('~/cartridge/scripts/helpers/productHelpers');
  

  viewData.customAttr = result.productSearch.productSearch.category ? result.productSearch.productSearch.category.custom.filtroSubcategoria: null;
  session.custom.filtersApplied = '';
  var Site = require('dw/system/Site');
  var customPreferences = Site.current.preferences.custom;
  var gtm_id = customPreferences.gtm_id;
  viewData.gtm_id = gtm_id;
  viewData.busqueda = req.querystring.q;
  viewData.resultados = viewData.productSearch.count;
  if (req.querystring.cgid) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var categoria = CatalogMgr.getCategory(req.querystring.cgid);
    var categoriaActual = categoria.ID;
    var categoriaPadre = null;
    if (categoria.parent) {
      var categoriaPadre = categoria.parent.ID;
    }

    var categoriaObj = {
      categoriaActual: categoriaActual,
      categoriaPadre: categoriaPadre
    };
    viewData.categoriInfo = categoriaObj;
    viewData.sortinRule = viewData.productSearch.productSort.ruleId;
    viewData.page = viewData.productSearch.pageSize;
    viewData.categoryURL = URLUtils.https('Search-Show', 'cgid', categoria.ID).toString();
    viewData.imageURL = (categoria.custom.slotBannerImage && categoria.custom.slotBannerImage.absURL) ? categoria.custom.slotBannerImage.absURL : '';
  }
   var breadcrumb = productHelpers.getAllBreadcrumbs(categoriaActual,null,[]);

  viewData.breadcrumbs = breadcrumb.reverse();
  res.setViewData(viewData);
  return next();
}, pageMetaData.computedPageMetaData);


server.get(
  'GetUrlFilters',
  function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var Template = require('dw/util/Template');
    var HashMap = require('dw/util/HashMap');
    var result = searchHelper.search(req, res);
    var props = new HashMap();
    var propsFit = new HashMap();
    var count = result.productSearch.productIds.length;
    var canToDoRender = false;
    var displayName = req.querystring.displayName ? req.querystring.displayName : '';
    var cards = req.querystring.cards;
    var refs = result.productSearch.refinements;
    var contentFit;
    // for (var index = 0 in refs) {
    //    var displayName = displayN;
    var coQuery;
    try {
      coQuery = CustomObjectMgr.getAllCustomObjects(displayName);
    } catch (error) {
      coQuery = null;
    }

    var attrObj = [];
    if (coQuery) {
      while (coQuery.hasNext()) {
        var currentCO = coQuery.next();
        attrObj.push({
          attrValor: currentCO.custom.attrValor,
          image: currentCO.custom.imagenFiltro
        });
      }
      
      for(var index = 0 in refs){
        if(refs[index].displayName.toString().toLowerCase() == displayName.toString().toLowerCase()){
          var refinementValues = refs[index].values;
        }
      }
      
      var filtroFitTemplate = new Template('/search/imageFilters');
      propsFit.put('attrObj', attrObj);
      propsFit.put('refinementValues', refinementValues);
      propsFit.put('filter',displayName);
      propsFit.put('cards',cards);
      contentFit = filtroFitTemplate.render(propsFit);
    }
  //  }

    if (count > 0) {
      canToDoRender = true;
    }

    var sideBarTemplate = new Template('components/filters/sideBarFilter');
    props.put('productSearch', result.productSearch);
    props.put('isRender', true);
    var content = sideBarTemplate.render(props);
    res.json({ htmlTemplate: content.text,
      isRender: true,
      canToDoRender: canToDoRender,
      contentFit: contentFit ? contentFit.text : null });
    next();
  });


server.get('UpdateGridDL', function (req, res, next) {
  var CatalogMgr = require('dw/catalog/CatalogMgr');
  var ProductSearchModel = require('dw/catalog/ProductSearchModel');
  var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
  var ProductSearch = require('*/cartridge/models/search/productSearch');

  var apiProductSearch = new ProductSearchModel();
  apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
  apiProductSearch.search();

  if (!apiProductSearch.personalizedSort) {
      searchHelper.applyCache(res);
  }
  var productSearch = new ProductSearch(
      apiProductSearch,
      req.querystring,
      req.querystring.srule,
      CatalogMgr.getSortingOptions(),
      CatalogMgr.getSiteCatalog().getRoot()
  );
    var viewData =  {};
    var categoria = CatalogMgr.getCategory(req.querystring.cgid);
    var categoriaActual = categoria.ID;
    var categoriaPadre = null;
    if(categoria.parent) {
      var categoriaPadre =  categoria.parent.ID;
    }

    viewData.ordered_by = (productSearch && productSearch.productSearch && productSearch.productSearch.sortingRule && productSearch.productSearch.sortingRule.ID) ? productSearch.productSearch.sortingRule.ID : '';
    viewData.product_category = categoriaPadre ? categoriaPadre : '';
    viewData.product_subcategory = categoriaActual ? categoriaActual : '';
    if(productSearch.pageNumber == 0) {
      viewData.located_page = (((parseInt(productSearch.pageSize + 1, 10) * parseInt(productSearch.pageNumber + 1, 10))) - (parseInt(productSearch.pageSize))).toString()+' - '+(parseInt(productSearch.pageSize, 10) * parseInt(productSearch.pageNumber + 1, 10)).toString();
    } else {
      viewData.located_page = (((parseInt(productSearch.pageSize, 10) * parseInt(productSearch.pageNumber + 1, 10))) - (parseInt(productSearch.pageSize))).toString()+' - '+(parseInt(productSearch.pageSize, 10) * parseInt(productSearch.pageNumber + 1, 10)).toString();
    }
    viewData.number_results = productSearch.count ? productSearch.count : '';
    viewData.located_page = viewData.located_page ? viewData.located_page : '';
    res.json(viewData);
    next();
});

module.exports = server.exports();

