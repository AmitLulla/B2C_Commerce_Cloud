'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    model.mensaje_descuento = content.mensaje_descuento;
    model.titulo_newsletter = content.titulo_newsletter;
    model.subtitulo_newsletter = content.subtitulo_newsletter;
    model.placeholder_input = content.placeholder_input;
    model.texto_boton_newsletter = content.texto_boton_newsletter;
    model.titulo_referidos = content.titulo_referidos;
    model.subtitulo_referidos = content.subtitulo_referidos;
    model.texto_boton_referidos = content.texto_boton_referidos;
    model.customerAuthenticated = session.customerAuthenticated;
    model.actionFormCheckCustomerEmail = URLUtils.url('ReferidosAccount-CheckCustomerEmail', 'customerEmail', 'emailParam').relative().toString();
    model.urlReferido = URLUtils.https('ReferidosAccount-AddReferido', 'cuid', 'customerNoParam').toString();

    return new Template('experience/components/homepage/popupDescuento').render(model).text;
};