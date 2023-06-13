"use strict";

/* global $ */

var base = require("base/checkout/billing");
var cleave = require("base/components/cleave");

/**
 * @function updatePaymentInformation
 * @description Update payment details summary based on payment method
 * @param {Object} order - checkout model to use as basis of new truth
 */
base.methods.updatePaymentInformation = function (order) {
    // update payment details
    var $paymentSummary = $(".payment-details");
    var htmlToAppend = "";

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
        order.billing.payment.selectedPaymentInstruments.forEach(function (selectedPaymentInstrument) {
            if (selectedPaymentInstrument.paymentMethod === window.mercado_pago.creditCard) {
                htmlToAppend += "<span>" + order.resources.cardType + " "
                    + selectedPaymentInstrument.type
                    + "</span><div>"
                    + selectedPaymentInstrument.maskedCreditCardNumber
                    + "</div><div><span>"
                    + order.resources.cardEnding + " "
                    + selectedPaymentInstrument.expirationMonth
                    + "/" + selectedPaymentInstrument.expirationYear
                    + "</span></div>";
            } else if (selectedPaymentInstrument.paymentMethod === window.mercado_pago.mercadoPagoCard) {
                var paymentMethods = $(".js-mp-available-payment-methods").data("mpAvailablePaymentMethods");
                var paymentInstrumentType = selectedPaymentInstrument.type;
                var paymentMethod = paymentMethods.find(function (method) { return paymentInstrumentType === method.id; });
                var paymentMethodName = paymentMethod ? paymentMethod.name : paymentInstrumentType;

                htmlToAppend += "<span>"
                    + selectedPaymentInstrument.paymentMethod + " "
                    + paymentMethodName
                    + "</span><br/>";
            } else if (selectedPaymentInstrument.paymentMethod === window.mercado_pago.giftCertificate) {
                htmlToAppend += "<span>"
                    + order.resources.giftCertificate
                    + "</span><br/>";
            }
        });
    }

    $paymentSummary.empty().append(htmlToAppend);
};

/**
 * @function handlePaymentOptionChange
 * @description Handle payment option change
 */
base.methods.handlePaymentOptionChange = function () {
    var $activeTab = $(this);
    var activeTabId = $activeTab.attr("href");
    var $paymentInformation = $(".payment-information");
    var isNewPayment = $(".user-payment-instruments").hasClass("checkout-hidden");

    $(".payment-options [role=tab]").each(function (i, tab) {
        let otherTab = $(tab);
        let otherTabId = otherTab.attr("href");

        $(otherTabId).find("input, select").prop("disabled", otherTabId !== activeTabId);
    });

    if (activeTabId === "#credit-card-content") {
        // Restore
        $paymentInformation.data("is-new-payment", isNewPayment);
    } else {
        // Prevent rejection during payment submit
        $paymentInformation.data("is-new-payment", true);
    }
};

base.selectBillingAddress = function () {
    $(".payment-form .addressSelector").on("change", function () {
        var form = $(this).parents("form")[0];
        var selectedOption = $("option:selected", this);
        var optionID = selectedOption[0].value;

        if (optionID === "new") {
            // Show Address
            $(form).attr("data-address-mode", "new");
        } else {
            // Hide Address
            $(form).attr("data-address-mode", "shipment");
        }

        // Copy fields
        var attrs = selectedOption.data();
        var element;

        Object.keys(attrs).forEach(function (attr) {
            element = attr === "countryCode" ? "country" : attr;
            if (element === "cardNumber") {
                $(".cardNumber").data("cleave").setRawValue(attrs[attr]);
            } else if (element === "mercadoPagoCardNumber") {
                $(".mercadoPagoCardNumber").data("cleave").setRawValue(attrs[attr]);
            } else {
                $("[name$=" + element + "]", form).val(attrs[attr]);
            }
        });
    });
};

base.handleCreditCardNumber = function () {
    cleave.handleCreditCardNumber(".cardNumber", "#cardType");
    if ($(".mercadoPagoCardNumber").length > 0) {
        cleave.handleCreditCardNumber(".mercadoPagoCardNumber", "#cardType");
    }
};

/**
 * @function useSameMailPhoneAsAddress
 * @description fill user information for payment data
 */
base.useSameMailPhoneAsAddress = function () {
    var fillSameFields = function () {
        $(".js-mp-phone").val($("#phoneNumber").val());
        $(".js-mp-email").val($("#email").val());
        $(".js-mp-cedula").val($("#cedula").val());
    };

    $("#useSameMailPhoneAsAddress").change(function () {
        $(".js-mail-phone-container").toggleClass("checkout-hidden", this.checked);


        if (this.checked) {
            fillSameFields();
            $("#phoneNumber").on("change.usesame", fillSameFields);
            $("#email").on("change.usesame", fillSameFields);
            $("#cedula").on("change.usesame", fillSameFields);
        } else {
            $(".js-mp-phone").val("");
            $(".js-mp-email").val("");
            $(".js-mp-cedula").val("");
            $("#phoneNumber").off("change.usesame");
            $("#email").off("change.usesame");
            $("#cedula").off("change.usesame");
        }
    });
};

/**
 * @function changePaymentOption
 * @description Change payment option
 */
base.changePaymentOption = function () {
    $(".payment-options [role=tab]").on("click", base.methods.handlePaymentOptionChange); // By click
};

/**
 * @function initPaymentOption
 * @description Initiate payment option
 */
base.initPaymentOption = function () {
    // Initial
    $(".payment-options [role=tab].enabled").trigger("click");
    base.methods.handlePaymentOptionChange.call($(".payment-options [role=tab].active"));
};

module.exports = base;
