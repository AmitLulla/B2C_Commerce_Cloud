'use strict';
var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.replace('Show', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var PageMgr = require('dw/experience/PageMgr');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);

    var page = PageMgr.getPage('homepage');

    var Site = require('dw/system/Site');
    var customPreferences = Site.current.preferences.custom;
    var gtm_id = customPreferences.gtm_id;
    res.setViewData({
        gtm_id: gtm_id
      });

    if (page && page.isVisible()) {
        res.page('homepage',{gtm_id: gtm_id});
    } else {
        res.render('home/homePage');
    }
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();