var OrderMgr = require('dw/order/OrderMgr');
function getOrderData(orders) {
    var order;
    var shippingAddress;

   for (var key = 0 in orders) {
        order = OrderMgr.getOrder(orders[key].orderNumber);
        shippingAddress = order.shipments[0].shippingAddress;
        orders[key].shippingAddress = shippingAddress;
        orders[key].paymentInstruments = order.paymentInstruments;
        orders[key].shippingStatus  = order.getShippingStatus();
        orders[key].TrackingGuia  = order.custom.TrackingGuia ? order.custom.TrackingGuia:null;
        orders[key].NoGuia  = order.custom.NoGuia ? order.custom.NoGuia: null;
   }
    return orders;
}

module.exports = {getOrderData:getOrderData}