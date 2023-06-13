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

    model.title1 = content.title1;
    model.image1 = ImageTransformation.getScaledImage(content.image1);

    model.title2 = content.title2;
    model.image2 = ImageTransformation.getScaledImage(content.image2);

    model.title3 = content.title3;
    model.image3 = ImageTransformation.getScaledImage(content.image3);

    model.title4 = content.title4;
    model.image4 = ImageTransformation.getScaledImage(content.image4);

    model.title5 = content.title5;
    model.image5 = ImageTransformation.getScaledImage(content.image5);


    // instruct 24 hours relative pagecache
    var expires = new Date();
    expires.setDate(expires.getDate() + 1); // this handles overflow automatically
    response.setExpires(expires);

    return new Template('experience/components/homepage/beneficios').render(model).text;
};
