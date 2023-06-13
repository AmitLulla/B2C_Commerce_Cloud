'use strict';

var ATTRIBUTE_NAME = 'size';
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');
var getProductHelper = require('*/cartridge/scripts/helpers/getProduct');

module.exports = function (object, hit, attr) {
    Object.defineProperty(object, 'variationAttributesCustom', {
        enumerable: true,
        value: (function () {
            var sizes = attr;
            try {
                var colors = hit.getRepresentedVariationValues('color');
            } catch (error) {
                
            }

            var colorDefault;
            for (var i = 0 in colors) {
                var isColorDefault = object.imagesDefaultVariation ? object.imagesDefaultVariation.medium[0].url.includes(colors[i].value):object.images.medium[0].url.includes(colors[i].value);
                isColorDefault = object.imagesDefaultVariation ? object.imagesDefaultVariation.medium[0].title.includes(colors[i].value):object.images.medium[0].title.includes(colors[i].value);
                if (isColorDefault) {
                    colorDefault = colors[i].value;
                    break;
                }
            }
            var array = new dw.util.ArrayList();
            var product;
            var param = {
                variables:{
                    color : {
                        id: '',
                        value: ''
                    },
                    size : {
                        id: '',
                        value: ''
                    }
                }
            };
            
            return [{
                attributeId: 'size',
                id: 'size',
                swatchable: true,
                values: collections.map(sizes, function (size) {
                    return {
                        id: size.ID,
                        description: size.description,
                        displayValue: size.displayValue,
                        value: size.value,
                        selectable: true,
                        selected: true,
                        urlCustom: URLUtils.abs('Product-Variation','dwvar_' + hit.productID + '_size',size.value,'dwvar_' + hit.productID + '_color',colorDefault,'pid',hit.productID,'quantity',1).toString() ,
                        url: URLUtils.url(
                            'Product-Show',
                            'pid',
                            hit.productID,
                            'dwvar_' + hit.productID + '_size',
                            size.value
                        ).toString()
                    };
                })
            }];
        }())
    });
};
