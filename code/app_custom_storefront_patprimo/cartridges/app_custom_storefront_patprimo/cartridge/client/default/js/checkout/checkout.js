"use strict";

var customerHelpers = require("base/checkout/customer");
var addressHelpers = require("base/checkout/address");
var shippingHelpers = require("./shipping");
var billingHelpers = require("base/checkout/billing");
var summaryHelpers = require("base/checkout/summary");
var formHelpers = require("base/checkout/formErrors");
var scrollAnimate = require("base/components/scrollAnimate");
var validationFormCustom = require("./identificate");
var scrollAnimate = require('base/components/scrollAnimate');


/**
 * Create the jQuery Checkout Plugin.
 *
 * This jQuery plugin will be registered on the dom element in checkout.isml with the
 * id of "checkout-main".
 *
 * The checkout plugin will handle the different state the user interface is in as the user
 * progresses through the varying forms such as shipping and payment.
 *
 * Billing info and payment info are used a bit synonymously in this code.
 *
 */
var methodLS =  localStorage.getItem('method-id');
if(methodLS == 'MPEfecty'){
  $('#li-payment-method-contra-entrega').hide();
  $('#efecty-tab').show();
}else{
  $('#li-payment-method-contra-entrega').show();
  $('#efecty-tab').hide();
}
function hidePayments() {
  $("#credit-card-content").addClass("d-none");
  $("#giftCertificate").addClass("d-none");
  $("#credit-card-content").removeClass("active");
  $("#gift-card-content").removeClass("active");
  $("#pagoContraEntrega").addClass("d-none");
  $("#mercadopago-content").addClass("d-none");
}
function showPaymentMethods(data) {
  $("#mercadopago-content").removeClass("d-none");
  if (data === "MPEfecty") {
    $("#efecty-content").removeClass("d-none");
  } else {
    $("#efecty-content").addClass("d-none");
  }
  switch (data) {
    case "MPDebitCard":
      if ($("#cardsMercadopago").hasClass("checkout-hidden")) {
        $(".js-mail-phone-container").addClass("checkout-hidden");
        $("#buttonCardMp").click();
      }

      $("#MPDebitCardMethods").removeClass("d-none");
      $("#MPDebitCardMethodsImg").removeClass("d-none");
      $(".title-debito-card").removeClass("title-none");
      $(".title-credit-card").addClass("title-none");
      $(".title-pay-pse").addClass("title-none");
      $(".title-efecty").addClass("title-none");
      // mercadopago payment methods
      $("#MPCreditCardMethods").addClass("d-none");
      $("#MPCreditCardMethodsImg").addClass("d-none");
      $("#MPEfectyMethods").addClass("d-none");
      $("#MPPseMethods").addClass("d-none");
      // others payment methods
      $("#credit-card-content").removeClass("active");
      $("#pagoContraEntrega").addClass("d-none");
      $("#giftCertificate").addClass("d-none");
      $("#installments-select").addClass("d-none");
      if (screen.width > 768) {
        $("input:radio[value=debvisa]:visible").trigger("click");
      } else {
        setTimeout(function () {
          $("input:radio[value=debvisa]:visible").trigger("click");
        }, 1000);
      }
      $("#cardsMercadopago").removeClass("d-none");
      $("#buttonCardMp").removeClass("d-none");
      $("#inputCodeMp").removeClass("d-none");
      if( !$('#useSameMailPhoneAsAddress').prop('checked') ) {
        $("input:checkbox[id=useSameMailPhoneAsAddress]:visible").trigger(
          "click"
        );
    }
      break;
    case "MPCreditCard":
      if ($("#cardsMercadopago").hasClass("checkout-hidden")) {
        $(".js-mail-phone-container").addClass("checkout-hidden");
        $("#buttonCardMp").click();
      }

      $("#MPCreditCardMethods").removeClass("d-none");
      $("#MPCreditCardMethodsImg").removeClass("d-none");
      $(".title-debito-card").addClass("title-none");
      $(".title-credit-card").removeClass("title-none");
      $(".title-pay-pse").addClass("title-none");
      $(".title-efecty").addClass("title-none");
      $("#MPDebitCardMethods").addClass("d-none");
      $("#MPDebitCardMethodsImg").addClass("d-none");
      $("#MPEfectyMethods").addClass("d-none");
      $("#MPPseMethods").addClass("d-none");
      $("#credit-card-content").removeClass("active");
      $("#pagoContraEntrega").addClass("d-none");
      $("#giftCertificate").addClass("d-none");
      $("#installments-select").removeClass("d-none");
      if (screen.width > 768) {
        $("input:radio[value=visa]:visible").trigger("click");
      } else {
        setTimeout(function () {
          $("input:radio[value=visa]:visible").trigger("click");
        }, 1000);
      }
      $("#cardsMercadopago").removeClass("d-none");
      $("#buttonCardMp").removeClass("d-none");
      $("#inputCodeMp").removeClass("d-none");
      if( !$('#useSameMailPhoneAsAddress').prop('checked') ) {
        $("input:checkbox[id=useSameMailPhoneAsAddress]:visible").trigger(
          "click"
        );
    }
      break;
    case "MPEfecty":
      if (!$("#cardsMercadopago").hasClass("checkout-hidden")) {
        $("#buttonCardMp").click();
      }
      if (!$(".js-mail-phone-container").hasClass("checkout-hidden")) {
        $(".js-mail-phone-container").addClass("checkout-hidden");
      }
      
      $("#MPEfectyMethods").removeClass("d-none");
      $("#MPDebitCardMethods").addClass("d-none");
      $("#MPCreditCardMethods").addClass("d-none");
      $(".container-p-credit-card").addClass("checkout-hidden");
      $(".pse-container").addClass("checkout-hidden");
      $(".title-credit-card").addClass("title-none");
      $(".title-pay-pse").addClass("title-none");
      $(".title-debito-card").addClass("title-none");
      $(".title-efecty").removeClass("title-none");
      $("#MPPseMethods").addClass("d-none");
      $("#credit-card-content").removeClass("active");
      $("#pagoContraEntrega").addClass("d-none");
      $("#giftCertificate").addClass("d-none");
      if (screen.width > 768) {
        $("input:radio[value=efecty]:visible").trigger("click");
      } else {
        setTimeout(function () {
          $("input:radio[value=efecty]:visible").trigger("click");
        }, 1000);
      }
      $("#cardsMercadopago").addClass("d-none");
      $("#buttonCardMp").addClass("d-none");
      $("#inputCodeMp").addClass("d-none");
      break;
    case "MPPse":
      if (!$("#cardsMercadopago").hasClass("checkout-hidden")) {
        $("#buttonCardMp").click();
      }
      if (!$(".js-mail-phone-container").hasClass("checkout-hidden")) {
        $(".js-mail-phone-container").addClass("checkout-hidden");
      }
      
      $("#MPPseMethods").removeClass("d-none");
      $(".pse-container").removeClass("checkout-hidden");
      $(".title-pay-pse").removeClass("title-none");
      $(".container-p-credit-card").addClass("checkout-hidden");
      $(".title-credit-card").addClass("title-none");
      $(".title-debito-card").addClass("title-none");
      $(".title-efecty").addClass("title-none");
      $("#MPDebitCardMethods").addClass("d-none");
      $("#MPCreditCardMethods").addClass("d-none");
      $("#MPEfectyMethods").addClass("d-none");
      $("#credit-card-content").removeClass("active");
      $("#pagoContraEntrega").addClass("d-none");
      $("#giftCertificate").addClass("d-none");
      if (screen.width > 768) {
        $("input:radio[value=pse]:visible").trigger("click");
      } else {
        setTimeout(function () {
          $("input:radio[value=pse]:visible").trigger("click");
        }, 1000);
      }
      $("#cardsMercadopago").addClass("d-none");
      $("#buttonCardMp").addClass("d-none");
      $("#inputCodeMp").addClass("d-none");
      break;
  }
}

function getTotals(input) {
    var redond = Math.round(input);
    var num = redond;
    if (!isNaN(num)) {
        num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');
        num = num.split('').reverse().join('').replace(/^[\.]/, '');
        return num;
    }
}

function validaFormShipping() {
  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  var forms = document.querySelectorAll(".shippingFormPatPrimo");
  var isValid = false;
  Array.prototype.slice
    .call(forms)

    .forEach(function (form) {
      if (!form.checkValidity()) {
        isValid = false;
      } else {
        isValid = true;
      }
      form.classList.add("was-validated");
    });
  return isValid;
}

function validaradioBtn() {
  var selected = false;
  document
    .querySelectorAll(".customerAddress")
    .forEach(function (element) {
      if (element.checked) {
        selected = true;
        return;
      }
      return;
    });
  return selected;
}

function validNotSpecial(str) {
  var regex = /^[A-Za-z0-9]+$/g;
  var l = str.val().length;
  if (!regex.test(str.val())) {
    str.val(str.val().substring(0, l - 1));
  }
}

(function ($) {
  $.fn.checkout = function () {
    // eslint-disable-line
    var plugin = this;

    //
    // Collect form data from user input
    //
    var formData = {
      // Customer Data
      customer: {},

      // Shipping Address
      shipping: {},

      // Billing Address
      billing: {},

      // Payment
      payment: {},

      // Gift Codes
      giftCode: {},
    };

    //
    // The different states/stages of checkout
    //
    var checkoutStages = [
      "customer",
      "shipping",
      "payment",
      "placeOrder",
      "submitted",
    ];

    /**
     * Updates the URL to determine stage
     * @param {number} currentStage - The current stage the user is currently on in the checkout
     */
    function updateUrl(currentStage) {
      history.pushState(
        checkoutStages[currentStage],
        document.title,
        location.pathname +
          "?stage=" +
          checkoutStages[currentStage] +
          "#" +
          checkoutStages[currentStage]
      );
    }

    //
    // Local member methods of the Checkout plugin
    //
    var members = {
      // initialize the currentStage variable for the first time
      currentStage: 0,

      /**
       * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
       * @returns {Object} a promise
       */
      updateStage: function (e) {
        var stage = checkoutStages[members.currentStage];
        var defer = $.Deferred(); // eslint-disable-line
        if (stage === "customer") {
          //
          // Clear Previous Errors
          //
          customerHelpers.methods.clearErrors();
          //
          // Submit the Customer Form
          //
          var customerFormSelector = customerHelpers.methods.isGuestFormActive()
            ? customerHelpers.vars.GUEST_FORM
            : customerHelpers.vars.REGISTERED_FORM;
          var customerForm = $(customerFormSelector);
          $.ajax({
            url: customerForm.attr("action"),
            type: "post",
            data: customerForm.serialize(),
            success: function (data) {
              if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
              } else {
                customerHelpers.methods.customerFormResponse(defer, data);
              }
            },
            error: function (err) {
              if (err.responseJSON && err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
              }
              // Server error submitting form
              defer.reject(err.responseJSON);
            },
          });
          return defer;
        } else if (stage === "shipping") {
          //
          // Clear Previous Errors
          // validar formulario y radio button
          formHelpers.clearPreviousErrors(".shipping-form");
          if (!$("#shippingFormPatPrimo").hasClass("d-none")) {
            var validForm = validaFormShipping();
            if (!validForm) {
              return defer;
            }
          } else if ($("#enviarDomicilio li").length > 0) {
            if (!validaradioBtn()) {
              return defer;
            }
          }
          //
          // Submit the Shipping Address Form
          //
          var isMultiShip = $("#checkout-main").hasClass("multi-ship");
          var formSelector = isMultiShip
            ? ".multi-shipping .active form"
            : ".single-shipping .shipping-form";
          var form = $(formSelector);

          if (isMultiShip && form.length === 0) {
            // disable the next:Payment button here
            $("body").trigger(
              "checkout:disableButton",
              ".next-step-button button"
            );
            // in case the multi ship form is already submitted
            var url = $("#checkout-main").attr("data-checkout-get-url");
            $.ajax({
              url: url,
              method: "GET",
              success: function (data) {
                // enable the next:Payment button here
                $("body").trigger(
                  "checkout:enableButton",
                  ".next-step-button button"
                );
                if (!data.error) {
                  $("body").trigger("checkout:updateCheckoutView", {
                    order: data.order,
                    customer: data.customer,
                  });
                  defer.resolve();
                } else if (
                  data.message &&
                  $(".shipping-error .alert-danger").length < 1
                ) {
                  var errorMsg = data.message;
                  var errorHtml =
                    '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                    'fade show" role="alert">' +
                    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                    "</button>" +
                    errorMsg +
                    "</div>";
                  $(".shipping-error").append(errorHtml);
                  scrollAnimate($(".shipping-error"));
                  defer.reject();
                } else if (data.redirectUrl) {
                  window.location.href = data.redirectUrl;
                }
              },
              error: function () {
                // enable the next:Payment button here
                $("body").trigger(
                  "checkout:enableButton",
                  ".next-step-button button"
                );
                // Server error submitting form
                defer.reject();
              },
            });
          } else {
            var shippingFormData;
            if (
              ($('#formIdentificate > div.submit-customer-div').data('submit-customer') &&
              $('#formIdentificate > div.submit-customer-div').data('submit-customer').length > 0 &&
              $("#shippingFormPatPrimo").hasClass("d-none")) ||
              ($(".info-hide").length > 0  &&
              !$("#enviarDomicilio li").hasClass("d-none") &&
              $("#shippingFormPatPrimo").hasClass("d-none"))
            ) {
              shippingFormData = form.serialize();
              $("body").trigger("checkout:serializeShipping", {
                form: form,
                data: shippingFormData,
                callback: function (data) {
                  shippingFormData = data;
                },
              });
              var uuidAddress = window.addressUUID;
              var email =
                $(".info-hide").length > 0 ? $(".info-hide").data("email") : null;
              var dataCustom = {
                dataCustom: uuidAddress,
                shippingMethodID: window.shippingMethodId,
                email: email,
              };
              var dataSerialize = $.param(dataCustom);
  
              if (dataSerialize.length > 0) {
                shippingFormData += "&" + dataSerialize;
              }
              
            } else {
              shippingFormData = $("#shippingFormPatPrimo form").serialize();
              $("body").trigger("checkout:serializeShipping", {
                form: $("#shippingFormPatPrimo form").serialize(),
                data: shippingFormData,
                callback: function (data) {
                  shippingFormData = data;
                },
              });
            }
            // disable the next:Payment button here
            $("body").trigger(
              "checkout:disableButton",
              ".next-step-button button"
            );
            $.ajax({
              url: form.attr("action"),
              type: "post",
              data: shippingFormData,
              success: function (data) {
                $('.grand-total-value').val(data.order.totals.grandTotalValue);
                var totalContraEntrega = getTotals(data.order.totals.grandTotalValue);
                $('#totalEntregaReplace').html(app.resources.contraEntregaReplace.replace('$$','$ ' + totalContraEntrega));
                // enable the next:Payment button here
                $("body").trigger(
                  "checkout:enableButton",
                  ".next-step-button button"
                );
                shippingHelpers.methods.shippingFormResponse(defer, data);
                $(document).trigger("applyPaymentMethod", {
                  city: data.address.city,
                });

                if(data.order.differenceGift) {
                  $('#saldoPending').html(data.order.differenceGift);
                  if ($('.gift-certificate-card').hasClass('d-none')) {
                    $('.gift-certificate-card').removeClass('d-none');
                  }
                }
                
                if ($('#checkout-main').data('checkout-stage') === 'payment' || $('.payment-form').css('display')=== 'block') {
                  getSavePayments();
                }
              },
              error: function (err) {
                // enable the next:Payment button here
                $("body").trigger(
                  "checkout:enableButton",
                  ".next-step-button button"
                );
                if (err.responseJSON && err.responseJSON.redirectUrl) {
                  window.location.href = err.responseJSON.redirectUrl;
                }
                // Server error submitting form
                defer.reject(err.responseJSON);
              },
            });
          }
          return defer;
        } else if (stage === "payment") {
          //
          // Submit the Billing Address Form
          //
          // cart abandoned
          window.localStorage.removeItem('hasCartAbandoned');
          formHelpers.clearPreviousErrors(".payment-form");
          $.spinner().start();       
         
   
          var billingAddressForm = $(
            "#dwfrm_billing .billing-address-block :input"
          ).serialize();

          $("body").trigger("checkout:serializeBilling", {
            form: $("#dwfrm_billing .billing-address-block"),
            data: billingAddressForm,
            callback: function (data) {
              if (data) {
                billingAddressForm = data;
              }
            },
          });

          var contactInfoForm = $(
            "#dwfrm_billing .contact-info-block :input"
          ).serialize();

          $("body").trigger("checkout:serializeBilling", {
            form: $("#dwfrm_billing .contact-info-block"),
            data: contactInfoForm,
            callback: function (data) {
              if (data) {
                contactInfoForm = data;
              }
            },
          });

          var activeTabId = $(".tab-pane.active").attr("id");
          var paymentInfoSelector =
            "#dwfrm_billing ." + activeTabId + " .payment-form-fields :input";
          var paymentInfoForm = $(paymentInfoSelector).serialize();


          $("body").trigger("checkout:serializeBilling", {
            form: $(paymentInfoSelector),
            data: paymentInfoForm,
            callback: function (data) {
              if (data) {
                paymentInfoForm = data;
              }
            },
          });

          var paymentForm =
            billingAddressForm + "&" + contactInfoForm + "&" + paymentInfoForm;

          if (
            $(".data-checkout-stage").data("customer-type") === "registered"
          ) {
            // if payment method is credit card
            if (
              $(".payment-information").data("payment-method-id") ===
              "CREDIT_CARD"
            ) {
              if (!$(".payment-information").data("is-new-payment")) {
                var cvvCode = $(
                  ".saved-payment-instrument." +
                    "selected-payment .saved-payment-security-code"
                ).val();

                if (cvvCode === "") {
                  var cvvElement = $(
                    ".saved-payment-instrument." +
                      "selected-payment " +
                      ".form-control"
                  );
                  cvvElement.addClass("is-invalid");
                  scrollAnimate(cvvElement);
                  defer.reject();
                  return defer;
                }

                var $savedPaymentInstrument = $(
                  ".saved-payment-instrument" + ".selected-payment"
                );

                paymentForm +=
                  "&storedPaymentUUID=" + $savedPaymentInstrument.data("uuid");

                paymentForm += "&securityCode=" + cvvCode;
              }
            }
          }
          // disable the next:Place Order button here
          $("body").trigger(
            "checkout:disableButton",
            ".next-step-button button"
          );

          $.ajax({
            url: $("#dwfrm_billing").attr("action"),
            method: "POST",
            data: paymentForm,
            success: function (data) {
              // enable the next:Place Order button here
              $("body").trigger(
                "checkout:enableButton",
                ".next-step-button button"
              );
              // look for field validation errors
              if (data.error) {
                if (data.insuficientBalance) {
                  $("#saldoPending").html(data.saldoPending);
                  $.spinner().stop(); 
                  return;
                }

                if (data.error) {
                  if (data.paymentMethod.value === "MercadoPago") {
                    defer.reject(data);
                    $.spinner().stop(); 
                    return;
                  }
                }

                if (data.fieldErrors.length) {
                  data.fieldErrors.forEach(function (error) {
                    if (Object.keys(error).length) {
                      formHelpers.loadFormErrors(".payment-form", error);
                    }
                  });
                }

                if (data.serverErrors.length) {
                  data.serverErrors.forEach(function (error) {
                    $(".error-message").show();
                    $(".error-message-text").text(error);
                    scrollAnimate($(".error-message"));
                  });
                }

                if (data.cartError) {
                  window.location.href = data.redirectUrl;
                }

                defer.reject();
              } else {
                if (
                  data.payment_type_id === "ticket" ||
                  data.payment_type_id === "bank_transfer"
                ) {
                  location.replace(data.continueUrl);
                } else {
                  var redirect = $("<form>").appendTo(document.body).attr({
                    method: "POST",
                    action: data.continueUrl,
                  });

                  $("<input>").appendTo(redirect).attr({
                    name: "orderID",
                    value: data.orderID,
                  });

                  $("<input>").appendTo(redirect).attr({
                    name: "orderToken",
                    value: data.orderToken,
                  });

                  redirect.submit();
                  defer.resolve(data);
                }

                // Populate the Address Summary
                //
              }
              $.spinner().stop(); 
            },
            error: function (err) {
              // enable the next:Place Order button here
              $("body").trigger(
                "checkout:enableButton",
                ".next-step-button button"
              );
              if (err.responseJSON && err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
              }
              $.spinner().stop();
            },
          });

          return defer;
        } else if (stage === "placeOrder") {
          // disable the placeOrder button here
          $("body").trigger(
            "checkout:disableButton",
            ".next-step-button button"
          );
          $.ajax({
            url: $(".place-order").data("action"),
            method: "POST",
            success: function (data) {
              // enable the placeOrder button here
              $("body").trigger(
                "checkout:enableButton",
                ".next-step-button button"
              );
              if (data.error) {
                if (data.cartError) {
                  window.location.href = data.redirectUrl;
                  defer.reject();
                } else {
                  // go to appropriate stage and display error message
                  defer.reject(data);
                }
              } else {
                var redirect = $("<form>").appendTo(document.body).attr({
                  method: "POST",
                  action: data.continueUrl,
                });

                $("<input>").appendTo(redirect).attr({
                  name: "orderID",
                  value: data.orderID,
                });

                $("<input>").appendTo(redirect).attr({
                  name: "orderToken",
                  value: data.orderToken,
                });

                redirect.submit();
                defer.resolve(data);
              }
            },
            error: function () {
              // enable the placeOrder button here
              $("body").trigger(
                "checkout:enableButton",
                $(".next-step-button button")
              );
            },
          });

          return defer;
        }
        var p = $("<div>").promise(); // eslint-disable-line
        setTimeout(function () {
          p.done(); // eslint-disable-line
        }, 500);
        return p; // eslint-disable-line
      },

      /**
       * Initialize the checkout stage.
       *
       * TODO: update this to allow stage to be set from server?
       */
      initialize: function () {
        // set the initial state of checkout
        members.currentStage = checkoutStages.indexOf(
          $(".data-checkout-stage").data("checkout-stage")
        );
        $(plugin).attr(
          "data-checkout-stage",
          checkoutStages[members.currentStage]
        );

        $("body").on("click", ".submit-customer-login", function (e) {
          e.preventDefault();
          members.nextStage();
        });

        $("body").on("click", ".submit-customer", function (e) {
          e.preventDefault();
          members.nextStage();
        });

        $("#infoStage").on("click", ".btn-continuar-to-shipping", function () {
          members.gotoStage("shipping");
        });

        $("#step-customer-bar,.step-customer-bar").on("click", function (e) {
          members.gotoStage("customer");
          if ($("#formIdentificate").css("display") === "none") {
            if ($(this).data("already-registered") === true) {
              $("#customerNotRegister").removeClass("d-none");
              $("#customerNotRegister").css("display", "block");
            } else {
              $("#formIdentificate").css("display", "block");
              $("#formIdentificate").removeClass("d-none");
              $("#customerNotRegister").addClass("d-none");
            }
            $("#infoStage").addClass("d-none");
          }
        });

        $(".regresar-link").on("click", function (e) {
          members.gotoStage("customer");

          var localStorage = window.localStorage;
          var isLogued= localStorage.getItem('logued');
          if (isLogued === "true") {
            $("#customerNotRegister").css('display','none');
            $("#customerNotRegister").addClass("d-none");
          } else {
            $("#customerNotRegister").css('display','block');
            $("#customerNotRegister").removeClass("d-none");
            $("#formIdentificate").addClass("d-none");
          }
        });

        $("#step-ship-bar").on("click", function (e) {
          var isPaymentUrl = window.location.hash === "#customer";
          var isPaymentStep = window.location.hash === "#payment";
          if (isPaymentStep && !isPaymentUrl) {
            members.gotoStage("shipping");
          }
        });

        //
        $('#customerNotRegisterForm input[name="phoneMobile"]').on(
          "keyup",
          function (e) {
            var limit = $(
              '#customerNotRegisterForm input[name="phoneMobile"]'
            ).val().length;
            window.valid = true;
            if (limit > 12) {
              var format = $(
                '#customerNotRegisterForm input[name="phoneMobile"]'
              ).val();
              var substring = format.substring(0, limit - 1);
              $('#customerNotRegisterForm input[name="phoneMobile"]').val(
                substring
              );
            }
            if (limit < 10) {
              window.valid = false;
            }
          }
        );

        $("#customerNotRegisterForm").on("submit", function (e) {
          e.preventDefault();
          if (!$(".company-information").hasClass("d-none")) {
            var nit = $(
              '.company-information input[name="dwfrm_customerNotRegisterForm_nit"]'
            ).val();
            var nitRepeat = $(
              '.company-information input[name="dwfrm_customerNotRegisterForm_confirmNit"]'
            ).val();
            if (nit != nitRepeat) {
              $("#nitWrong").html(app.resources.nitWrong);
              return;
            }
            $("#nitWrong").html('');
          }

          window.valid = true;
          if (
            $(
              '#customerNotRegisterForm input[name="dwfrm_customerNotRegisterForm_phoneMobile"]'
            ).val().length <= 6
          ) {
            window.valid = false;
          }

          if (!window.valid) {
            $("#wrongMsjTel").html(app.resources.telWrong);
            return;
          } else {
            $("#wrongMsjTel").html("");
          }

          validationFormCustom.updateCustomerGuest(
            $("#customerNotRegister form").serialize(),
            false
          );
          $("#contentAddress").removeClass("d-none");
          members.gotoStage("shipping");
        });

        $('input[name="selectAddress"]').click(function () {
          if ($(this).is(":checked")) {
            if ($(this).prop("value") === "enviarDomicilio") {
              if (window.localStorage.email.length > 0) {
                $(document).trigger("getAddress", {
                  email: window.localStorage.email,
                  url: window.localStorage.url,
                });
                $("#enviarDomicilio").show();
                $(".enviarDomicilio").show();
              } else {
                $("#shippingFormPatPrimo").removeClass("d-none");
              }
              $("#shippingMethods").removeClass("d-none");
              $(".submit-shipping").show();
              $(".submit-shipping").removeClass("d-none");
            }
            if ($(this).prop("value") === "recogerTienda") {
              $("#enviarDomicilio").hide();
              $(".enviarDomicilio").hide();
              $("#shippingMethods").addClass("d-none");
              $("#shippingFormPatPrimo").addClass("d-none");
            }
          }
        });

        // concatenar direccioon
        window.addressComplete = "";
        window.tipoVia = "";
        window.street = "";
        window.numberStreet = "";
        window.numberStreetExtra = "";

        $("#tipoVia").on("change", function () {
          window.tipoVia = $(this).val();
          window.addressComplete =
            " " +
            window.tipoVia +
            " " +
            window.street +
            " # " +
            window.numberStreet +
            " - " +
            window.numberStreetExtra;
          $("#direccionCompleta").val(window.addressComplete);
        });

        $("#street").on("focusout", function () {
          window.street = $(this).val();
          window.addressComplete =
            " " +
            window.tipoVia +
            " " +
            window.street +
            " # " +
            window.numberStreet +
            " - " +
            window.numberStreetExtra;
          $("#direccionCompleta").val(window.addressComplete);
        });

        $("#numberStreet").on("focusout", function () {
          window.numberStreet = $(this).val();
          window.addressComplete =
            " " +
            window.tipoVia +
            " " +
            window.street +
            " # " +
            window.numberStreet +
            " - " +
            window.numberStreetExtra;
          $("#direccionCompleta").val(window.addressComplete);
        });

        $("#numberStreetExtra").on("focusout", function () {
          window.numberStreetExtra = $(this).val();
          window.addressComplete =
            " " +
            window.tipoVia +
            " " +
            window.street +
            " # " +
            window.numberStreet +
            " - " +
            window.numberStreetExtra;
          $("#direccionCompleta").val(window.addressComplete);
        });

        $('input[name="shippingSelect"]').click(function () {
          if ($(this).is(":checked")) {
            window.shippingMethodId = $(this).val();
          }
        });

        $("#enviarDomicilio").on(
          "click",
          'input[name="savedAddress"]',
          function () {
            if ($(this).is(":checked")) {
              window.addressUUID = "";
              window.addressUUID = $(this).prop("value");
            }
          }
        );

        $("#enviarDomicilio").on("click", "#show-shipping-form", function () {
          $("#shippingFormPatPrimo").toggleClass("d-none");
          $("#enviarDomicilio li").addClass("d-none");
          if(!$("#shippingFormPatPrimo").hasClass('d-none')) {
            var url = $('#urlUpdateShippinCostDefault').data('update-shipping-cost-url');
            $.spinner().start();
            $('body').trigger('checkout:beforeShippingMethodSelected');
            $.ajax({
                url: url+'?defaultShippingAddress=true',
                type: 'post',
                dataType: 'json'
            })
                .done(function (data) {
                    if (data.error) {
                        //window.location.href = data.redirectUrl;
                        // createErrorNotification('TestError customer address');
                        $('#depaSelect').val($("#depaSelect option:first").val()).trigger('change');
                    } else {
                        $('body').trigger('checkout:updateCheckoutView',
                            {
                                order: data.order,
                                customer: data.customer,
                                options: { keepOpen: true }
                            }
                        );
                        $('body').trigger('checkout:postUpdateCheckoutView',
                            {
                                el: $('.shipping-method-list')
                            }
                        );
                    }
                    $('body').trigger('checkout:shippingMethodSelected', data);
                    $.spinner().stop();
                })
                .fail(function () {
                    $.spinner().stop();
             });
          }
        });

        $(".submit-shipping").on("click", function () {
          $(".shipping-summary").addClass("d-none");
            var url = $(".submit-shipping").data('url-getinfodl');
            
            if (!$(".domicilio-seleccion").is(":checked")) {
              
              $("#error-select-dir").removeClass("d-none");
              setTimeout(() => {
                $("#error-select-dir").addClass("d-none");
              }, 2500);
              
           }
              
       
            
            if(url) {
              $.ajax({
                url: url,
                method: 'GET',
                success: function (data) {
                  data = data.basketObj;
                  if(data.productArray) {
                    dataLayer.push({
                        ecommerce: null
                    });
                    dataLayer.push({
                        event: "checkout_shipping",
                        ecommerce: {
                            checkout_step: data.checkout_step, //Número de paso del checkout
                            total_cart_size: data.total_cart_size, //Número de productos en el carrito
                            total_cart_amount: data.total_cart_amount, //Total del carrito
                            cart_id: data.cart_id, //Id del carrito
                            email_name: data.email_name, //Email relacionado al usuario
                            coupon: data.coupon, //Opcional, si usa un cupón
                            shipping_type: data.shipping_type, //Tipo de envío seleccionado normal o express
                            items: data.productArray
                        }
                    });
                }
                }
            });
            }
          if($('.shipping-section#shippingMethods .shipping-form.form-shipping-c .shipping-method-list .shipping-method-option [id^=shippingMethod-envioExpress]').is(":checked")) {
            $('.payment-form ul.payment-options li.nav-item').each(function() {
              if($(this).data('method-id') == 'PAGO_CONTRA_ENTREGA'|| $(this).data('method-id') == 'MPEfecty') {
                $(this).addClass('d-none');
              } else {
                $(this).removeClass('d-none');
              }
            });
          } else {
            $('.payment-form ul.payment-options li.nav-item').each(function() {
                $(this).removeClass('d-none');
            });
          }
        });

   
  

        $(".payment-options>li").on("click", function () {
          if ($(this).data("method-id") === "GIFT_CERTIFICATE") {
            $('input[name$="billing_paymentMethod"]').val("GIFT_CERTIFICATE");
            hidePayments();
            $("#giftCertificate").toggleClass("d-none");
            $(".gift-certificate-card").removeClass("d-none");
            $("#gift-card-content").addClass("active");
            $("#mercadopago-content").removeClass("active");
          } else if ($(this).data("method-id") === "CREDIT_CARD") {
            $('input[name$="billing_paymentMethod"]').val("CREDIT_CARD");
            hidePayments();
            $("#credit-card-content").removeClass("d-none");
            $(".submit-payment").removeClass("d-none");
            $("#credit-card-content").addClass("active");
            $("#mercadopago-content").removeClass("active");
            $('#contra-entrega-card-content').removeClass('active');
          } else if ($(this).data("method-id") === "PAGO_CONTRA_ENTREGA") {
            if (
              !$("#li-payment-method-contra-entrega>a").hasClass("disabled")
            ) {
              $('input[name$="billing_paymentMethod"]').val(
                "PAGO_CONTRA_ENTREGA"
              );
              hidePayments();
              $("#pagoContraEntrega").removeClass("d-none");
              $(".submit-payment").removeClass("d-none");
              $(".contra-entrega-card-content").addClass("active");
              
            }
            $("#mercadopago-content").removeClass("active");

          } else if ($(this).data("method-id") === "MPCreditCard") {
            $('input[name$="billing_paymentMethod"]').val("MercadoPago");
            hidePayments();
            if ($('#checkout-main').data('checkout-stage') === 'payment' || $('.payment-form').css('display')=== 'block') {
              getSavePayments();
            }
            showPaymentMethods($(this).data("method-id"));
            $("#mercadopago-content-credit-card").removeClass("d-none");
            $(".submit-payment").removeClass("d-none");
            $("#mercadopago-content-credit-card").addClass("active");
            $('#contra-entrega-card-content').removeClass('active');
          } else if ($(this).data("method-id") === "MPDebitCard") {
            $('input[name$="billing_paymentMethod"]').val("MercadoPago");
            hidePayments();
            showPaymentMethods($(this).data("method-id"));
            $("#mercadopago-content-debit-card").removeClass("d-none");
            $(".submit-payment").removeClass("d-none");
            $("#mercadopago-content-debit-card").addClass("active");
            $('#contra-entrega-card-content').removeClass('active');
            if ($('#checkout-main').data('checkout-stage') === 'payment' || $('.payment-form').css('display')=== 'block') {
              getSavePayments();
            }
          } else if ($(this).data("method-id") === "MPEfecty") {
            $('input[name$="billing_paymentMethod"]').val("MercadoPago");
            hidePayments();
            showPaymentMethods($(this).data("method-id"));
            $("#mercadopago-content-efecty").removeClass("d-none");
            $(".submit-payment").removeClass("d-none");
            $("#mercadopago-content-efecty").addClass("active");
            $('#contra-entrega-card-content').removeClass('active');
          } else if ($(this).data("method-id") === "MPPse") {
            $('input[name$="billing_paymentMethod"]').val("MercadoPago");
            hidePayments();
            showPaymentMethods($(this).data("method-id"));
            $("#mercadopago-content-pse").removeClass("d-none");
            $(".submit-payment").removeClass("d-none");
            $("#mercadopago-content-pse").addClass("active");
            $('#contra-entrega-card-content').removeClass('active');
          }
        });

        $("#street,#numberStreet,#numberStreetExtra").on("keyup", function () {
          validNotSpecial($(this));
        });

        //
        // Handle Payment option selection
        //
        $('input[name$="paymentMethod"]', plugin).on("change", function () {
          $(".credit-card-form").toggle($(this).val() === "CREDIT_CARD");
        });

        //
        // Handle Next State button click
        //
        $(plugin).on("click", ".next-step-button button", function () {
          members.nextStage();
        });

        //
        // Handle Edit buttons on shipping and payment summary cards
        //
        $(".customer-summary .edit-button", plugin).on("click", function () {
          members.gotoStage("customer");
        });

        $(".shipping-summary .edit-button", plugin).on("click", function () {
          if (!$("#checkout-main").hasClass("multi-ship")) {
            $("body").trigger("shipping:selectSingleShipping");
          }

          members.gotoStage("shipping");
        });

        $(".payment-summary .edit-button", plugin).on("click", function () {
          members.gotoStage("payment");
        });

        //
        // remember stage (e.g. shipping)
        //
        updateUrl(members.currentStage);

        //
        // Listen for foward/back button press and move to correct checkout-stage
        //
        $(window).on("popstate", function (e) {
          //
          // Back button when event state less than current state in ordered
          // checkoutStages array.
          //
          if (
            e.state === null ||
            checkoutStages.indexOf(e.state) < members.currentStage
          ) {
            members.handlePrevStage(false);
          } else if (checkoutStages.indexOf(e.state) > members.currentStage) {
            // Forward button  pressed
            members.handleNextStage(false);
          }
        });

        //
        // Set the form data
        //
        plugin.data("formData", formData);
      },

      /**
       * The next checkout state step updates the css for showing correct buttons etc...
       */
      nextStage: function () {
        var promise = members.updateStage();

        promise.done(function () {
          // Update UI with new stage
          $(".error-message").hide();
          members.handleNextStage(true);
        });

        promise.fail(function (data) {
          // show errors
          if (data) {
            if (data.errorStage) {
              members.gotoStage(data.errorStage.stage);

              if (data.errorStage.step === "billingAddress") {
                var $billingAddressSameAsShipping = $(
                  'input[name$="_shippingAddressUseAsBillingAddress"]'
                );
                if ($billingAddressSameAsShipping.is(":checked")) {
                  $billingAddressSameAsShipping.prop("checked", false);
                }
              }
            }

            if (data.errorMessage) {
              $(".error-message").show();
              $(".error-message-text").text(data.errorMessage);
            }
          }
        });
      },

      /**
       * The next checkout state step updates the css for showing correct buttons etc...
       *
       * @param {boolean} bPushState - boolean when true pushes state using the history api.
       */
      handleNextStage: function (bPushState) {
        if (members.currentStage < checkoutStages.length - 1) {
          // move stage forward
          members.currentStage++;

          //
          // show new stage in url (e.g.payment)
          //
          if (bPushState) {
            updateUrl(members.currentStage);
          }
        }

        // Set the next stage on the DOM
        $(plugin).attr(
          "data-checkout-stage",
          checkoutStages[members.currentStage]
        );
      },

      /**
       * Previous State
       */
      handlePrevStage: function () {
        if (members.currentStage > 0) {
          // move state back
          members.currentStage--;
          updateUrl(members.currentStage);
        }

        $(plugin).attr(
          "data-checkout-stage",
          checkoutStages[members.currentStage]
        );
      },

      /**
       * Use window history to go to a checkout stage
       * @param {string} stageName - the checkout state to goto
       */
      gotoStage: function (stageName) {
        members.currentStage = checkoutStages.indexOf(stageName);
        updateUrl(members.currentStage);
        $(plugin).attr(
          "data-checkout-stage",
          checkoutStages[members.currentStage]
        );
        if(stageName == 'shipping'){
          if ($("#enviarDomicilio li").length > 0 && $('#shippingFormPatPrimo').hasClass('d-none')) {
            $('.customerAddress:checked').trigger('click');
          } else if($("#depaSelect option").length > 0) {
            updateShippingMethodList($('#shippingMethods.shipping-section form.shipping-form'));
          }
        }
      },
    };

    //
    // Initialize the checkout
    //
    members.initialize();

    return this;
  };
})(jQuery);

var exports = {
  initialize: function () {
    $("#checkout-main").checkout();
  },

  updateCheckoutView: function () {
    $("body").on("checkout:updateCheckoutView", function (e, data) {
      if (data.csrfToken) {
        $("input[name*='csrf_token']").val(data.csrfToken);
      }
      customerHelpers.methods.updateCustomerInformation(
        data.customer,
        data.order
      );
      shippingHelpers.methods.updateMultiShipInformation(data.order);
      summaryHelpers.updateTotals(data.order.totals);
      if (data.order.totals.giftCardTotals && data.order.totals.giftCardTotals.length > 0) {
        for (var i = 0; i < data.order.totals.giftCardTotals.length; i++) {
          $(`.gift-${data.order.totals.giftCardTotals[i].split('-')[0]}`).empty().text('$ ' + getTotals(data.order.totals.giftCardTotals[i].split('-')[1]));
        }
      }

      data.order.shipping.forEach(function (shipping) {
        shippingHelpers.methods.updateShippingInformation(
          shipping,
          data.order,
          data.customer,
          data.options
        );
      });
      billingHelpers.methods.updateBillingInformation(
        data.order,
        data.customer,
        data.options
      );
      billingHelpers.methods.updatePaymentInformation(data.order, data.options);
      summaryHelpers.updateOrderProductSummaryInformation(
        data.order,
        data.options
      );
    });
  },

  disableButton: function () {
    $("body").on("checkout:disableButton", function (e, button) {
      $(button).prop("disabled", true);
    });
  },

  enableButton: function () {
    $("body").on("checkout:enableButton", function (e, button) {
      $(button).prop("disabled", false);
    });
  },
};

[customerHelpers, billingHelpers, shippingHelpers, addressHelpers].forEach(
  function (library) {
    Object.keys(library).forEach(function (item) {
      if (typeof library[item] === "object") {
        exports[item] = $.extend({}, exports[item], library[item]);
      } else {
        exports[item] = library[item];
      }
    });
  }
);

function getSavePayments () {
  $.spinner().start();
  $.ajax({
      url: 'Checkout-getSavePayments',
      type: 'GET',
      success: function (data) {
        if (!data.error) {
          $('#cardsMercadopago').html(data.htmlTemplate)
          if(data.customerCards && data.customerCards.length === 1) {
            setTimeout(function() {
              $('#cardId').val(data.customerCards[0].id);
              $('#mpPaymentTypeId').val(data.customerCards[0].payment_method.payment_type_id);
              $.spinner().stop();
            },3000)
            $('.js-mp-customer-card:first').trigger('click');
          } else {
            $('#buttonCardMp').trigger('click');
            $.spinner().stop();
          }
        } else {
          $.spinner().stop();
          $('#buttonCardMp').trigger('click');
        }
        
        // $.spinner().stop();
      }
    })
}

function getShippingCostShippingAddress(el) {
  var url = '';
  if (el) {
    url = $('.shipping-method-list').data('select-shipping-address-url');
  }
  var addressID = el.attr("id");
  $.spinner().start();
  $('body').trigger('checkout:beforeShippingMethodSelected');
  $.ajax({
      url: url + '?addressID=' + addressID,
      type: 'post',
      dataType: 'json',
    })
    .done(function (data) {
      if (data.error) {
        window.location.href = data.redirectUrl;
      } else {
        $('body').trigger('checkout:updateCheckoutView', {
          order: data.order,
          customer: data.customer,
          options: {
            keepOpen: true
          },
        });
        $('body').trigger('checkout:postUpdateCheckoutView', {
          el: $('.shipping-method-list')
        });
      }
      $('body').trigger('checkout:shippingMethodSelected', data);
      $.spinner().stop();
    })
    .fail(function () {
      $.spinner().stop();
    });
}

function createErrorNotification(message) {
  var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error RedHatDisplayFont' +
  'fade show" role="alert">' +
  '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
  '<span aria-hidden="true">&times;</span>' +
  '</button>' + message + '</div>';

  $('.shipping-error-custom').append(errorHtml);
  scrollAnimate($('.shipping-error-custom'));
  setTimeout(function() {  $('.shipping-error-custom .alert-danger').remove(); }, 20000);
}

function updateShippingMethodList($shippingForm) {
  // delay for autocomplete!
  setTimeout(function () {
      var $shippingMethodList =  $shippingForm.find('.shipping-method-list');
      var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
      var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
      var url = $shippingMethodList.data('actionUrl');
      urlParams.shipmentUUID = shipmentUUID;
      var $spinner = $('.shipping-form');
      $spinner.spinner().start();
      $.ajax({
          url: 'CheckoutShippingServices-UpdateShippingMethodsList',
          type: 'post',
          dataType: 'json',
          data: urlParams,
          success: function (data) {
              if (data.error) {
                  // window.location.href = data.redirectUrl;
              // createErrorNotification('TestError update');

              } else {
                  $('body').trigger('checkout:updateCheckoutView',
                      {
                          order: data.order,
                          customer: data.customer,
                          options: { keepOpen: true }
                      });

                      $spinner.spinner().stop();
              }
          }
      });
  }, 300);
}

module.exports = exports;
