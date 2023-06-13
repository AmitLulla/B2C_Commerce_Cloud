'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');
var customPreferences = Site.current.preferences.custom;

// pago contra entrega configuraciones
base.compraMinima = 'compraMinima' in customPreferences ? customPreferences.compraMinima : null;
base.shippingMethodNotApply = 'shippingMethodNotApply' in customPreferences ? customPreferences.shippingMethodNotApply: null;

// Checkout config
base.tipoVia = 'tipoVia' in customPreferences ? JSON.parse(customPreferences.tipoVia) : null;

module.exports = base;