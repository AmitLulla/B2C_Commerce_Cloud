"use strict";

var base = module.superModule;

var Resource = require("dw/web/Resource");

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users"s basket/order
 * @param {Object} options - The current order"s line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);

    
      this.estadoOrden = 'estadoOrden' in lineItemContainer.custom ? lineItemContainer.custom.estadoOrden.value : null;
      this.fechaEntrega ='fechaEntrega' in lineItemContainer.custom ? lineItemContainer.custom.fechaEntrega : null;

}

module.exports = OrderModel;
