'use strict';
/* global response */

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for the storefront.MainBanner component
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();
    var content = context.content;

    model.heading = content.heading;
    model.cta1 = content.cta_1;
    model.cta2 = content.cta_2;
    model.tagForCta = content.tag_cta
    model.image = ImageTransformation.getScaledImage(content.image);
    model.imageMobile = ImageTransformation.getScaledImage(content.imageMobile);
    model.categoryLink1 = URLUtils.url('Search-Show', 'cgid', content.categoryLink.getID()).toString();
    model.categoryLink2 = URLUtils.url('Search-Show', 'cgid', content.categoryLink2.getID()).toString();
    model.categoryURL1 = URLUtils.https('Search-Show', 'cgid', content.categoryLink.getID()).toString();
    model.categoryURL2 = URLUtils.https('Search-Show', 'cgid', content.categoryLink2.getID()).toString();
    model.component_id = content.component_id;

    // instruct 24 hours relative pagecache
    var expires = new Date();
    expires.setDate(expires.getDate() + 1); // this handles overflow automatically
    response.setExpires(expires);

    return new Template('experience/components/homepage/mainBannerCustom').render(model).text;
};
