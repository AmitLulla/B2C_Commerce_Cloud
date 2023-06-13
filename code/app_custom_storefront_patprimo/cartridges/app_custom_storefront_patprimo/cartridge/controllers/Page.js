'use strict';
var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.replace('Show', cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var Logger = require('dw/system/Logger');
    var PageMgr = require('dw/experience/PageMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var page = PageMgr.getPage(req.querystring.cid);

    if (page != null && page.isVisible()) {
        if (!page.hasVisibilityRules()) {
            res.cachePeriod = 168; // eslint-disable-line no-param-reassign
            res.cachePeriodUnit = 'hours'; // eslint-disable-line no-param-reassign
        }
        var Site = require('dw/system/Site');
        var customPreferences = Site.current.preferences.custom;
        var gtm_id = customPreferences.gtm_id;
        res.page(page.ID, {gtm_id:gtm_id});
    } else {
        var apiContent = ContentMgr.getContent(req.querystring.cid);

        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);

            if (content.template) {
                res.render(content.template, { content: content });
            } else {
                Logger.warn('Content asset with ID {0} is offline', req.querystring.cid);
                res.render('/components/content/offlineContent');
            }
        } else {
            Logger.warn('Content asset with ID {0} was included but not found', req.querystring.cid);
        }
    }

    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();