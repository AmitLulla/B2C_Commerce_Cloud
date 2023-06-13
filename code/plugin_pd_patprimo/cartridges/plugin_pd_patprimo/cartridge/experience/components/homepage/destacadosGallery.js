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

    
    model.cta1 = content.cta_1;
    model.cta2 = content.cta_2;
    model.cta3 = content.cta_3;
    model.cta4 = content.cta_4;
    model.cta5 = content.cta_5;
    
    model.image1 = ImageTransformation.getScaledImage(content.image1);
    model.image2 = ImageTransformation.getScaledImage(content.image2);
    model.image3 = ImageTransformation.getScaledImage(content.image3);
    model.image4 = ImageTransformation.getScaledImage(content.image4);
    model.image5 = ImageTransformation.getScaledImage(content.image5);

    model.categoryLink1 = URLUtils.url('Search-Show', 'cgid', content.categoryLink1.getID()).toString();
    model.categoryLink2 = URLUtils.url('Search-Show', 'cgid', content.categoryLink2.getID()).toString();
    model.categoryLink3 = URLUtils.url('Search-Show', 'cgid', content.categoryLink3.getID()).toString();
    model.categoryLink4 = URLUtils.url('Search-Show', 'cgid', content.categoryLink4.getID()).toString();
    model.categoryLink5 = URLUtils.url('Search-Show', 'cgid', content.categoryLink5.getID()).toString();

    // instruct 24 hours relative pagecache
    var expires = new Date();
    expires.setDate(expires.getDate() + 1); // this handles overflow automatically
    response.setExpires(expires);

    return new Template('experience/components/homepage/destacadosGallery').render(model).text;
};
