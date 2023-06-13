'use strict';

var ATTRIBUTE_NAME = 'color';
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

module.exports = function (object, hit) {
    Object.defineProperty(object, 'variationAttributes', {
        enumerable: true,
        value: (function () {
            var colors = hit.getRepresentedVariationValues(ATTRIBUTE_NAME);
            
            return [{
                attributeId: 'color',
                id: 'color',
                swatchable: true,
                values: collections.map(colors, function (color) {
                    var urlVariant = URLUtils.abs('Product-Variation','dwvar_' + hit.productID + '_color',color.value,'pid',hit.productID,'quantity',1).toString()
                    var apiImage = color.getImage('swatch', 0);
                    if (!apiImage) {
                        apiImage = color.getImage('hi-res', 0);
                        if (!apiImage) {
                            return {};
                        }
                       
                    }
                    var selected = object.imagesDefaultVariation.medium[0].url.toString().includes(color.ID);
                    if (!selected) {
                        selected = object.imagesDefaultVariation.medium[0].alt ? object.imagesDefaultVariation.medium[0].alt.toString().includes(color.ID): false;
                    }
                    return {
                        id: color.ID,
                        description: color.description,
                        displayValue: color.displayValue,
                        value: color.value,
                        selectable: true,
                        selected: selected,
                        urlCustom:  urlVariant,
                        images: {
                            swatch: [{
                                alt: apiImage.alt,
                                url: apiImage.URL.toString(),
                                title: apiImage.title
                            }]
                        },
                        url: URLUtils.url(
                            'Product-Show',
                            'pid',
                            hit.productID,
                            'dwvar_' + hit.productID + '_color',
                            color.value
                        ).toString()
                    };
                })
            }];
        }())
    });
};
