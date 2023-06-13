'use strict';

var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');

function getTotals(input) {
  var redond = Math.round(input);
  var num = redond;

  if (!isNaN(num)) {
    num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');

    num = num.split('').reverse().join('').replace(/^[\.]/, '');

    return input = '$' + num;
  }
}

function createDiscountObject(collection, discounts) {
  var result = discounts;
  collections.forEach(collection, function (item) {
    if (!item.basedOnCoupon) {
      result[item.UUID] = {
        UUID: item.UUID,
        lineItemText: item.lineItemText,
        price: getTotals(item.price.value),
        type: 'promotion',
        callOutMsg: (typeof item.promotion !== 'undefined' && item.promotion !== null) ? item.promotion.calloutMsg : ''
      };
    }
  });

  return result;
}

function getDiscounts(lineItemContainer) {
  var discounts = {};

  collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
    var priceAdjustments = collections.map(
            couponLineItem.priceAdjustments, function (priceAdjustment) {
              return { callOutMsg: (typeof priceAdjustment.promotion !== 'undefined' && priceAdjustment.promotion !== null) ? priceAdjustment.promotion.calloutMsg : '' };
            });
    var priceCustom = collections.map(
      couponLineItem.priceAdjustments, function (priceAdjustment) {
        return { totalCupon: (priceAdjustment.price ? priceAdjustment.price.value: null)};
      });
    discounts[couponLineItem.UUID] = {
      type: 'coupon',
      UUID: couponLineItem.UUID,
      couponCode: couponLineItem.couponCode,
      applied: couponLineItem.applied,
      valid: couponLineItem.valid,
      relationship: priceAdjustments,
      priceCustom: priceCustom
    };
  });

  discounts = createDiscountObject(lineItemContainer.priceAdjustments, discounts);
  discounts = createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts);
 
  return Object.keys(discounts).map(function (key) {
    return discounts[key];
  });
}

function getOrderLevelDiscountTotal(lineItemContainer) {
  var totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
  var totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
  var orderDiscount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);

  return {
    value: orderDiscount.value,
    formatted: getTotals(orderDiscount)
  };
}

function getShippingLevelDiscountTotal(lineItemContainer) {
  var totalExcludingShippingDiscount = lineItemContainer.shippingTotalPrice;
  var totalIncludingShippingDiscount = lineItemContainer.adjustedShippingTotalPrice;
  var shippingDiscount = totalExcludingShippingDiscount.subtract(totalIncludingShippingDiscount);

  return {
    value: shippingDiscount.value,
    formatted: getTotals(shippingDiscount)
  };
}


function totals(lineItemContainer) {
  if (lineItemContainer) {
    base.call(this, lineItemContainer);
    this.subTotalValue = lineItemContainer.getAdjustedMerchandizeTotalPrice(false).value;
    this.grandTotalValue = lineItemContainer.totalGrossPrice.value;
    this.subTotal = getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false).value);
    this.totalShippingCost = getTotals(lineItemContainer.shippingTotalPrice.value);
    this.discounts = getDiscounts(lineItemContainer);
    this.orderLevelDiscountTotal = getOrderLevelDiscountTotal(lineItemContainer);
    this.shippingLevelDiscountTotal = getShippingLevelDiscountTotal(lineItemContainer);
    this.grandTotal = getTotals(lineItemContainer.totalGrossPrice.value);
  }
}

module.exports = totals;
