"use strict";
/* global request empty */

var Site = require("dw/system/Site");

/** @constructs returnsHelper */
function returnsHelper() {}

returnsHelper.prototype.getPreferences = function () {
  var currentSite = Site.getCurrent();
  return {
    retutnService: currentSite.getCustomPreferenceValue("retutnService"),
    serviceOptions: currentSite.getCustomPreferenceValue("serviceOptions"),
    banks: currentSite.getCustomPreferenceValue("banks"),
    categoryTree: currentSite.getCustomPreferenceValue("categoryTree"),
    clientBankType: currentSite.getCustomPreferenceValue("clientBankType"),
    paymentCodes : 'paymentCodes' in currentSite.preferences.custom ? JSON.parse(currentSite.getCustomPreferenceValue("paymentCodes")): []
  };
};

returnsHelper.prototype.createReturn = function(data, dataProducts) {
  var currentSite = Site.getCurrent();
  var Transaction = require("dw/system/Transaction");
  var CustomerMgr = require("dw/customer/CustomerMgr");
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");
  var ProductMgr = require('dw/catalog/ProductMgr');
  var OrderMgr = require('dw/order/OrderMgr');
  var apartamentData = currentSite.getCustomPreferenceValue("apartamentData");
  apartamentData = JSON.parse(apartamentData);
  var cityData = currentSite.getCustomPreferenceValue("cityData");
  cityData = JSON.parse(cityData);
  var dataUser = CustomerMgr.getCustomerByCustomerNumber(data.customerNo);
  var order = OrderMgr.getOrder(data.orderNumber);
  var bank = 0;
  var bono = 0;
  var docNum;
  var docTyp;

  function textClean(texto) {
    const acentos = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U'};
	  return texto.split('').map( letra => acentos[letra] || letra).join('').toString();	
}

// Envio de mail
function sendCodeEmail(email, orderNumber) {
  var emailHelpers = require("*/cartridge/scripts/helpers/codeEmail");
  var Site = require("dw/system/Site");
  var Resource = require("dw/web/Resource");

  var userObject = {
    orderNumber: orderNumber,
  };

  var emailObj = {
    to: email,
    subject: Resource.msg("send.mail", "return", null),
    from:
      Site.current.getCustomPreferenceValue("customerServiceEmail") ||
      "no-reply@testorganization.com",
  };

  emailHelpers.sendEmail(emailObj, "account/return/emailReturn", userObject);
}

  if(data.returnType == "bono") {
     bono = 1;
     docNum = data.docNumber;
     docTyp = data.docType;
  }else{
     bank = 1;
     docNum = data.docNumberBank;
     docTyp = data.typeDocBank;
  }

if(data.address){
  var adressData = data.address;
  adressData = adressData.split("-");
  var apartamentCode;
  var address = dataUser.addressBook.addresses;
  var addressAll = [];
  for (var i = 0; i < address.length; i++) {
addressAll.push(address[i]);
  }


  var address1;
  var address2;
  var depto;
  var receive;
  var city;
  addressAll.forEach(function (address) {
if (address.ID == adressData[0]){
  address1 = address.address1;
  address2 = address.address2;
  receive = address.firstName;
  depto = (address.custom.departamento).toLowerCase();
  city = address.custom.municipio;
  }
  });
  
  address1 = address1;
  depto = depto;
  address2 = address2;
  receive = receive;

  apartamentData.forEach(function (apartament) {
    if (textClean(depto) == textClean((apartament.nombreDepartamento).toLowerCase())){
      apartamentCode = apartament.idDepartamento;
      }
      });
      apartamentCode = apartamentCode;

var citiCode;
  cityData.forEach(function (cityD) {
    if (depto == (cityD.departamento).toLowerCase() && city == cityD.municipio){
      citiCode = cityD.codigo;
      }
      });
      citiCode = citiCode;
}else{

  var depto = (data.formAdepaSelectReturn).toLowerCase();
  var city = data.formAcitySelectReturn;
  var receive = data.formArecibe;
  var apartamentCode;
  var adressData = []; 
  adressData[1] = parseInt('0').toFixed();
  var address1 = data.formAdireccionCompleta;
  var address2 = data.formApiso;
  if(!data.formApiso){
    address2 = ' ';
  }

  apartamentData.forEach(function (apartament) {
    if (textClean(depto) == textClean((apartament.nombreDepartamento).toLowerCase())){
      apartamentCode = apartament.idDepartamento;
      }
      });
      apartamentCode = apartamentCode;
      var citiCode;
  cityData.forEach(function (cityD) {
    if (depto == (cityD.departamento).toLowerCase() && city == cityD.municipio){
      citiCode = cityD.codigo;
      }
      });
      citiCode = citiCode;

}
  return Transaction.wrap(function () {
    var noDevoluciones = order.custom.noDevoluciones;
    dataProducts.forEach(function (dataProduct) {
      
      var dataProduct = JSON.parse(dataProduct);
      if (dataProduct.id != 0) {
        noDevoluciones = order.custom.noDevoluciones + 1;
        var product = ProductMgr.getProduct(dataProduct.id);
        product = product;

        var insert = CustomObjectMgr.createCustomObject("devoluciones", data.orderNumber +'-'+ noDevoluciones);

        insert.custom.idSku = dataProduct.id;
        insert.custom.motivoDevolucion = dataProduct.return;
        insert.custom.numPedido = data.orderNumber;
        insert.custom.price = dataProduct.priceUnit;
        insert.custom.quantity = dataProduct.qty;
        insert.custom.productId = product.masterProduct.ID;
        insert.custom.clientEmail = dataUser.profile.email;
        insert.custom.clientName = dataUser.profile.firstName;
        insert.custom.clientLastName = dataUser.profile.lastName;
        insert.custom.nameProduct = product.name;
        insert.custom.urlProduct = product.pageURL;
        insert.custom.clientAddress = address1;
        insert.custom.clientDepartment = apartamentCode;
        insert.custom.seller = currentSite.ID;
        insert.custom.ean = dataProduct.id;
        insert.custom.clientDocument = dataUser.profile.custom.documentoIdentidad;
        insert.custom.clientDocumentType = dataUser.profile.custom.tipoDocumentoIdentidad.value;
        insert.custom.clientPhone = dataUser.profile.phoneHome;
        insert.custom.clientSameAddress = adressData[1];
        insert.custom.clientCity = citiCode;
        insert.custom.clientAddressPhone = dataUser.profile.phoneHome;
        insert.custom.clientAddressEmail = dataUser.profile.email;
        insert.custom.clientAddressPerson = receive;
        insert.custom.clientAddressComplementData = address2;
        insert.custom.clientBank = data.bankEntity;
        insert.custom.clientBankNumber = data.numberBank;
        insert.custom.clientBankType = data.accountType;
        insert.custom.clientBankPerson = data.ownersName;
        insert.custom.clientPaymentDocument = docNum;
        insert.custom.clientPaymentDocumentType = docTyp;
        insert.custom.bonoTienda = bono;
        insert.custom.cuentaBancaria = bank;

      }
      order.custom.noDevoluciones = noDevoluciones;
      });
      sendCodeEmail(dataUser.profile.email, data.orderNumber);

  });
}

module.exports = new returnsHelper();
