'use strict';

$(document).ready(function () {
   var element = '.' + $('#menu-dashboard').data('page-id');
   $(element).addClass('selected-option-dash');

   switch ($('#menu-dashboard').data('page-id')) {
      case 'account-page':
         $(element +'> span').addClass('my-user-img-n');
         break;
      case 'order-history':
         $(element +'> span').addClass('my-pedidos-img-n rectangle');
         break;
      case 'mis-productos':
         $(element +'> span').addClass('my-productos-img-n rectangle');
         break;
      case 'mis-referidos':
         $(element +'> span').addClass('my-referidos-img-n rectangle');
         break;
      case 'mis-tarjetas':
         $(element +'> span').addClass('my-tarjetas-img-n rectangle');
         break;
      case 'mis-direcciones':
         $(element +'> span').addClass('my-direcciones-img-n rectangle');
         break;
      default:
         $(element +'> span').addClass('my-user-img-n rectangle');
         break;
   }

   $("input[name$='defaultAdress']").change(function() {
      window.location.assign($("#setDefault").val() + '?addressId=' + this.value);
  });

});
