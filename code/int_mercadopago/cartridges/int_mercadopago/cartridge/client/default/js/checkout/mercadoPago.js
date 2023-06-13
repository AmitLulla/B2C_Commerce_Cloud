"use strict";

/* global jQuery Mercadopago */
(function ($) {
    /**
     * @constructor
     * @classdesc Integration class
     */
    function MercadoPago() {
        var that = this;

        var $content = $(".js-mercadopago-content");
        var $form = $content.find(".js-mp-form");

        var $elements = {
            paymentOptionTab: $(".js-payment-option-tab"),
            paymentTypeButton: $content.find(".js-toggle-payment-type"),
            customerCardsContainer: $content.find(".js-mp-customer-cards"),
            customerCard: $content.find(".js-mp-customer-card")
        };


        // Regular fields
        var fields = {
            cardType: {
                $el: $form.find(".js-mp-card-type"),
                disable: { other: false, stored: false },
                hide: { other: false, stored: true },
                errors: []
            },
            cardHolder: {
                $el: $form.find(".js-mp-card-holder"),
                disable: { other: true, stored: true },
                hide: { other: true, stored: true },
                errors: ["221", "316"]
            },
            cardNumber: {
                $el: $form.find(".js-mp-card-number"),
                disable: { other: true, stored: true },
                hide: { other: true, stored: true },
                errors: ["205", "E301"]
            },
            cardMonth: {
                $el: $form.find(".js-mp-card-month"),
                disable: { other: true, stored: true },
                hide: { other: true, stored: true },
                errors: ["208", "325"]
            },
            cardYear: {
                $el: $form.find(".js-mp-card-year"),
                disable: { other: true, stored: true },
                hide: { other: true, stored: true },
                errors: ["209", "326"]
            },
            cedcid: {
              $el: $form.find(".js-mp-cedcid"),
              disable: { other: true, stored: true },
              hide: { other: true, stored: true },
              errors: ["cedcid"]
          },
            securityCode: {
                $el: $form.find(".js-mp-security-code"),
                disable: { other: true, stored: false },
                hide: { other: true, stored: false },
                errors: ["224", "E302", "E203"]
            },
            email: {
                $el: $form.find(".js-mp-email"),
                disable: { other: false, stored: true },
                hide: { other: false, stored: true },
                errors: ["email"]
            },
            phone: {
                $el: $form.find(".js-mp-phone"),
                disable: { other: false, stored: true },
                hide: { other: false, stored: true },
                errors: ["phone"]
            },
            cedula: {
              $el: $form.find("js-mp-cedula"),
              disable: { other: false, stored: true },
              hide: { other: false, stored: true },
              errors: ["cedula"]
          },
            saveCard: {
                $el: $form.find(".js-mp-save-card"),
                disable: { other: true, stored: true },
                hide: { other: true, stored: true },
                errors: []
            },
            useSameMailPhoneAsAddress: {
                $el: $form.find(".js-mp-use-same"),
                disable: { other: false, stored: true },
                hide: { other: false, stored: true },
                errors: []
            }
        };

        // Extended fields
        fields.issuer = {
            $el: $form.find(".js-mp-issuer"),
            disable: { other: true, stored: true },
            hide: { other: true, stored: false },
            errors: ["issuer"]
        };
        fields.financialinstitution = {
            $el: $form.find(".js-mp-financialinstitution"),
            disable: { other: true, stored: true },
            hide: { other: true, stored: true },
            cardTypeID: "pse",
            errors: ["mercadoPagoFinancialinstitution"]
        };
        fields.installments = {
            $el: $form.find(".js-mp-installments"),
            disable: { other: true, stored: false },
            hide: { other: true, stored: false },
            errors: ["installments"]
        };
        fields.docType = {
            $el: $form.find(".js-mp-doc-type"),
            disable: { other: false, stored: false },
            hide: { other: false, stored: false },
            errors: ["212", "322"]
        };
        fields.docNumber = {
            $el: $form.find(".js-mp-doc-number"),
            $wrapper: $form.find(".js-mp-doc-wrapper"),
            $label: $form.find(".js-mp-doc-label"),
            $tooltip: $form.find(".js-mp-doc-tooltip"),
            disable: { other: false, stored: false },
            hide: { other: false, stored: false },
            errors: ["214", "324", "2067"]
        };

        // Hidden fields
        Object.defineProperty(fields, "cardId", {
            enumerable: false,
            value: {
                $el: $form.find(".js-mp-card-id")
            }
        });
        Object.defineProperty(fields, "token", {
            enumerable: false,
            value: {
                $el: $form.find(".js-mp-token")
            }
        });

        var methods = {
          paymentOption: {
            /**
             * @function handleChange
             * @description Handle change of payment method and set initial state of payment tab
             */
            handleChange: function () {
              var $activeTab = $(this);
              var methodId = $activeTab
                .closest(".js-method-id")
                .data("methodId");
              var initialState = $form.data("mpInitial");

              if (methodId === that.configuration.paymentMethodId) {
                methods.paymentOption.setInitialState[
                  initialState + "Payment"
                ]();
              }
            },
            setInitialState: {
              /**
               * @function newPayment
               * @description Set initial state for new payment section
               */
              newPayment: function () {
                var paymentMethodInput = fields.cardType.$el.filter(
                  function () {
                    return this.value === that.configuration.defaultCardType;
                  }
                );

                // Check default card type
                paymentMethodInput.prop("checked", true);
                methods.card.handleTypeChange.call(paymentMethodInput[0], {
                  data: { handleOther: true },
                });
              },
              /**
               * @function storedPayment
               * @description Set initial state for stored payment section
               */
              storedPayment: function () {
                var firstCard = $elements.customerCard.filter(":first");
                // Select first card
                methods.registeredCustomer.selectCustomerCard.call(
                  firstCard[0]
                );

                // Toggle payment type to stored
                $elements.paymentTypeButton.data("togglePaymentType", "stored");
                methods.registeredCustomer.togglePaymentType.call(
                  $elements.paymentTypeButton[0]
                );
              },
              /**
               * @function restoreStoredPayment
               * @description Restore stored payment section
               */
              restoreStoredPayment: function () {
                var firstCard = $elements.customerCard.filter(":first");
                // Select first card
                methods.registeredCustomer.selectCustomerCard.call(
                  firstCard[0]
                );

                // Show and set disabled to false for stored payment fields
                /* eslint-disable no-restricted-syntax */
                for (var field in fields) {
                  if (!fields[field].hide.stored) {
                    fields[field].$el
                      .closest(".js-mp-container")
                      .removeClass("checkout-hidden");
                  }
                  if (!fields[field].disable.stored) {
                    fields[field].$el.prop("disabled", false);
                  }
                }
                /* eslint-enable no-restricted-syntax */
              },
            },
          },

          token: {
            validateDocNumber: function ($docNumber) {
              if (
                $docNumber.attr("required") &&
                $docNumber.is(":visible") &&
                $docNumber.is(":enabled")
              ) {
                var fieldValueLength = $docNumber.val().length;
                if (+fieldValueLength === 0) {
                  return "214";
                } else if (
                  fieldValueLength > $docNumber.attr("maxlength") ||
                  fieldValueLength < $docNumber.attr("minlength")
                ) {
                  return "324";
                }
              }
              return null;
            },
            validateSecurityCode: function ($securityCode) {
              if (
                $securityCode.attr("required") &&
                $securityCode.is(":visible") &&
                $securityCode.is(":enabled")
              ) {
                var fieldValueLength = $securityCode.val().length;
                if (fieldValueLength < 3 || fieldValueLength > 4) {
                  return "E302";
                }
              }
              return null;
            },
            /**
             * @function populate
             * @description Create token and populate field with value during submit
             * @param {Event} event event
             * @param {Object} eventData event data
             */
            populate: function (event, eventData) {
              var validForm = true;
              // Continue default flow
              if (eventData && eventData.continue) {
                return;
              }
              // Stop default flow
              event.stopImmediatePropagation();
              var isOtherPaymentMethod =
                fields.cardType.$el.filter(":checked").data("mpCardType") ===
                that.configuration.otherPaymentMethod;
              var isMercadoPago =
                $('input[name$="billing_paymentMethod"]:enabled').val() ===
                that.configuration.paymentMethodId;

              /* eslint-disable no-else-return */
              if (isMercadoPago) {
                var $docNumber = fields.docNumber.$el;
                var docNumberErrorCode =
                  methods.token.validateDocNumber($docNumber);
                if (docNumberErrorCode) {
                  methods.token.errorResponse(docNumberErrorCode);
                  validForm = false;
                } else {
                  $docNumber.next(".invalid-feedback").hide();
                }
                var $securityCode = fields.securityCode.$el;
                var securityCodeErrorCode =
                  methods.token.validateSecurityCode($securityCode);
                if (securityCodeErrorCode) {
                  validForm = false;
                } else {
                  $securityCode.next(".invalid-feedback").hide();
                }
              }

              /* eslint-enable no-else-return */
              if (isOtherPaymentMethod || !isMercadoPago) {
                var submitPayment = $(".next-step-button .submit-payment");
                fields.token.$el.val("");
                submitPayment.trigger("click", { continue: true });
                return;
              }
              Mercadopago.createToken(
                $form,
                function (status, serviceResponse) {
                  Object.keys(fields).forEach(function (index) {
                    var field = fields[index];
                    if (
                      field.$el.attr("required") &&
                      field.$el.is(":visible") &&
                      field.$el.is(":enabled")
                    ) {
                      /* eslint-disable  eqeqeq */
                      if (field.$el.val().length > 0) {
                        if (index != "securityCode") {
                          field.$el.next(".invalid-feedback").hide();
                        }
                      } else if (
                        field.errors &&
                        field.errors.indexOf(index) != -1
                      ) {
                        if (index != "securityCode") {
                          methods.token.errorResponse(index);
                        }
                        validForm = false;
                      }
                      /* eslint-enable  eqeqeq */
                    }
                  });
                  if ((status === 200 || status === 201) && validForm) {
                    methods.token.successResponse(serviceResponse);
                  } else {
                    if (
                      fields.cardHolder.$el.attr("required") &&
                      fields.cardHolder.$el.is(":visible") &&
                      fields.cardHolder.$el.is(":enabled") &&
                      fields.cardHolder.$el.val().length === 0
                    ) {
                      methods.token.errorResponse(fields.cardHolder.errors[0]);
                      validForm = false;
                    }

                    if (
                      fields.securityCode.$el.attr("required") &&
                      fields.securityCode.$el.is(":visible") &&
                      fields.securityCode.$el.is(":enabled") &&
                      fields.securityCode.$el.val().length === 0
                    ) {
                      methods.token.errorResponse(
                        fields.securityCode.errors[0]
                      );
                      validForm = false;
                    } else if (
                      fields.securityCode.$el.attr("required") &&
                      fields.securityCode.$el.is(":visible") &&
                      fields.securityCode.$el.is(":enabled") &&
                      fields.securityCode.$el.val().length > 0
                    ) {
                      /* eslint-disable no-shadow */
                      var $securityCode = fields.securityCode.$el;
                      var securityCodeErrorCode =
                        methods.token.validateSecurityCode($securityCode);
                      /* *eslint-enable no-shadow */

                      methods.token.errorResponse(securityCodeErrorCode);
                      validForm = false;
                    }

                    if (
                      fields.installments.$el.attr("required") &&
                      fields.installments.$el.is(":visible") &&
                      fields.installments.$el.is(":enabled") &&
                      fields.installments.$el.val().length === 0
                    ) {
                      methods.token.errorResponse(
                        fields.installments.errors[0]
                      );
                      validForm = false;
                    }

                    /* eslint-disable no-shadow, block-scoped-var */
                    var docNumberErrorCode =
                      methods.token.validateDocNumber($docNumber);
                    /* eslint-disable no-shadow, block-scoped-var */
                    if (docNumberErrorCode) {
                      methods.token.errorResponse(docNumberErrorCode);
                    }

                    if (serviceResponse.cause) {
                      serviceResponse.cause.forEach(function (cause) {
                        methods.token.errorResponse(cause.code);
                      });
                    }
                  }
                }
              );
            },
            /**
             * @function successResponse
             * @description Success callback for token creation
             * @param {Object} serviceResponse service response
             */
            successResponse: function (serviceResponse) {
              var submitPayment = $(".next-step-button .submit-payment");
              /* eslint-disable  array-callback-return */
              Object.keys(fields).map(function (fieldKey) {
                var field = fields[fieldKey];
                field.$el.next(".invalid-feedback").hide();
              });
              /* eslint-enable  array-callback-return */

              fields.token.$el.val(serviceResponse.id);
              submitPayment.trigger("click", { continue: true });
            },
            /**
             * @function errorResponse
             * @description Error callback for token creation
             * @param {string} errorCode error code
             */
            errorResponse: function (errorCode) {
              var errorMessages = $form.data("mpErrorMessages");
              var errorField;

              // Set error code message if found, otherwise set default error message
              var errorMessage = errorMessages[errorCode]
                ? errorMessages[errorCode]
                : errorMessages.default;
              /* eslint-disable consistent-return */
              Object.keys(fields).forEach(function (index) {
                var field = fields[index];
                if (field.errors && field.errors.indexOf(errorCode) !== -1) {
                  errorField = field;
                  return true;
                }
              });
              /* eslint-enable consistent-return */
              if (errorField) {
                errorField.$el
                  .next(".invalid-feedback")
                  .focus()
                  .show()
                  .text(errorMessage);
              } else {
                $(".error-message").show();
                $(".error-message-text").text(errorMessage);
              }
            },
          },

          card: {
            /**
             * @function handleTypeChange
             * @description Handle credit card type change
             * @param {Event} e event
             */
            handleTypeChange: function (e) {
              var $el = $(this);
              var issuerMandatory = $el.data("mpIssuerRequired");
              var isOtherType =
                $el.data("mpCardType") ===
                that.configuration.otherPaymentMethod;
              var paymentTypeID = $el.val(); // master, visa, pse, boleto
              var mpPaymentTypeId = $el.data("mpPaymentTypeId"); // credit_card, bank_transfer, ticket

              // Handle fields for other payment method
              if (e.data.handleOther) {
                methods.card.handleOtherType(isOtherType, paymentTypeID);
              }

              if (
                that.preferences.enableInstallments === true &&
                !isOtherType
              ) {
                methods.installment.set($el.val());

                // Set issuer info
                if (issuerMandatory) {
                  methods.issuer.set($el);
                  fields.issuer.$el.prop("disabled", false);
                  fields.issuer.$el
                    .off("change")
                    .on("change", methods.installment.setByIssuerId);
                } else {
                  fields.issuer.$el.prop("disabled", true);
                }
              }
              $("#mpPaymentTypeId").val(mpPaymentTypeId);
            },
            /**
             * @function handleOtherType
             * @description Toggle other payment method
             * @param {boolean} isOtherType is other type
             * @param {string} cardTypeID cart type ID
             */
            handleOtherType: function (isOtherType, cardTypeID) {
              /* eslint-disable eqeqeq, no-restricted-syntax, guard-for-in */
              for (var field in fields) {
                var fieldsField = fields[field];
                if (fieldsField.hide.other) {
                  fieldsField.$el
                    .closest(".js-mp-container")
                    .toggleClass("checkout-hidden", isOtherType);
                }
                if (fieldsField.disable.other) {
                  fieldsField.$el.prop("disabled", isOtherType);
                }

                if (fieldsField.cardTypeID) {
                  fieldsField.$el.prop(
                    "disabled",
                    fieldsField.cardTypeID != cardTypeID
                  );
                  fieldsField.$el
                    .closest(".js-mp-container")
                    .toggleClass(
                      "checkout-hidden",
                      fieldsField.cardTypeID != cardTypeID
                    );
                }
              }
              /* eslint-enable eqeqeq, no-restricted-syntax, guard-for-in */
            },

            guessingPaymentMethod: function () {
              const cardnumber = document.getElementById(
                "mercadoPagoCardNumber"
              ).value;
              var bin = cardnumber.replace(" ", "").substring(0, 6);

              window.Mercadopago.getPaymentMethod(
                {
                  bin: bin,
                },
                methods.card.setPaymentMethodInfo
              );
            },

            setPaymentMethodInfo: function (status, response) {
              if (+status === 200 && response.length > 0) {
                var $paymentMethodElement = $("#cardType-" + response[0].id);
                methods.card.metthodPaymentSelected(response[0].id);
                $paymentMethodElement.prop("checked", true);
                methods.card.handleTypeChange.call($paymentMethodElement, {
                  data: { handleOther: false },
                });
              }
            },
            metthodPaymentSelected: function (payment) {
              switch (payment) {
                case "visa":
                  $("#select-visa").removeClass("card-select");
                  $("#select-debvisa").removeClass("card-select");
                  $("#select-master").addClass("card-select");
                  $("#select-debmaster").addClass("card-select");
                  $("#select-diners").addClass("card-select");
                  $("#select-amex").addClass("card-select");
                  $("#select-codensa").addClass("card-select");
                  break;
                case "master":
                  $("#select-master").removeClass("card-select");
                  $("#select-debmaster").removeClass("card-select");
                  $("#select-visa").addClass("card-select");
                  $("#select-debvisa").addClass("card-select");
                  $("#select-diners").addClass("card-select");
                  $("#select-amex").addClass("card-select");
                  $("#select-codensa").addClass("card-select");
                  break;
                case "diners":
                  $("#select-debvisa").addClass("card-select");
                  $("#select-visa").addClass("card-select");
                  $("#select-master").addClass("card-select");
                  $("#select-debmaster").addClass("card-select");
                  $("#select-amex").addClass("card-select");
                  $("#select-codensa").addClass("card-select");
                  $("#select-diners").removeClass("card-select");
                  break;
                case "codensa":
                  $("#select-codensa").removeClass("card-select");
                  $("#select-debvisa").addClass("card-select");
                  $("#select-visa").addClass("card-select");
                  $("#select-master").addClass("card-select");
                  $("#select-debmaster").addClass("card-select");
                  $("#select-diners").addClass("card-select");
                  $("#select-amex").addClass("card-select");
                  break;
                case "amex":
                  $("#select-amex").removeClass("card-select");
                  $("#select-visa").addClass("card-select");
                  $("#select-debvisa").addClass("card-select");
                  $("#select-master").addClass("card-select");
                  $("#select-debmaster").addClass("card-select");
                  $("#select-diners").addClass("card-select");
                  $("#select-codensa").addClass("card-select");

                  break;
              }
            },
          },
          installment: {
            /**
             * @function set
             * @description Set installments
             * @param {string} paymentMethodId payment method
             */
            set: function (paymentMethodId) {
              // Set installments info
              Mercadopago.getInstallments(
                {
                  payment_method_id: paymentMethodId,
                  amount: parseFloat($(".grand-total-value").val()),
                },
                methods.installment.handleServiceResponse
              );
            },
            /**
             * @function handleServiceResponse
             * @description Callback for installments
             * @param {number} status status
             * @param {Array} response response
             */
            handleServiceResponse: function (status, response) {
              fields.installments.$el.find("option").remove();

              if (+status !== 200 && +status !== 201) {
                return;
              }

              var $defaultOption = $(
                new Option(that.resourceMessages.defaultInstallments, "")
              );
              fields.installments.$el.append($defaultOption);

              if (response[0].payer_costs) {
                $.each(response[0].payer_costs, function (i, item) {
                  fields.installments.$el.append(
                    $("<option>", {
                      value: item.installments,
                      text: item.recommended_message || item.installments,
                    })
                  );

                  if (
                    fields.installments.$el.val() !== "" &&
                    fields.installments.$el.val() === item.installments
                  ) {
                    fields.installments.$el.val(item.installments);
                  }
                });
                $( "#installments" ).val(1);
              }
            },
            /**
             * @function handleServiceResponse
             * @description Set installments using issuer ID
             */
            setByIssuerId: function () {
              var issuerId = $(this).val();

              if (!issuerId || issuerId === "-1") {
                return;
              }

              Mercadopago.getInstallments(
                {
                  payment_method_id: fields.cardType.$el
                    .filter(":checked")
                    .val(),
                    amount: parseFloat($(".grand-total-value").val()),
                  issuer_id: issuerId,
                },
                methods.installment.handleServiceResponse
              );
            },
          },

          issuer: {
            /**
             * @function set
             * @description Set issuer
             * @param {jQuery} $element element
             */
            set: function ($element) {
              Mercadopago.getIssuers(
                $element.val(),
                methods.issuer.handleServiceResponse
              );
            },
            /**
             * @function handleServiceResponse
             * @description Callback for issuer
             * @param {number} status status
             * @param {Array} response response
             */
            handleServiceResponse: function (status, response) {
              fields.issuer.$el.find("option").remove();

              if (+status !== 200 && +status !== 201) {
                return;
              }

              var $defaultOption = $(
                new Option(that.resourceMessages.defaultIssuer, "")
              );
              fields.issuer.$el.append($defaultOption);

              $.each(response, function (i, item) {
                fields.issuer.$el.append(
                  $("<option>", {
                    value: item.id,
                    text:
                      item.name !== "default"
                        ? item.name
                        : that.configuration.defaultIssuer,
                  })
                );

                if (
                  fields.issuer.$el.val() !== "" &&
                  fields.issuer.$el.val() === item.id
                ) {
                  fields.issuer.$el.val(item.id);
                }
              });
            },
          },

          docType: {
            /**
             * @function init
             * @description Init identification document type
             */
            init: function () {
              Mercadopago.getIdentificationTypes(
                methods.docType.handleServiceResponse
              );
            },
            /**
             * @function handleServiceResponse
             * @description Callback for identification document type
             * @param {number} status status
             * @param {Array} response response
             */
            handleServiceResponse: function (status, response) {
              fields.docType.$el.find("option").remove();

              if (+status !== 200 && +status !== 201) {
                return;
              }

              $.each(response, function (i, item) {
                fields.docType.$el.append(
                  $("<option>", {
                    value: item.id,
                    text: item.name,
                    "data-min-length": item.min_length,
                    "data-max-length": item.max_length,
                  })
                );
              });

              fields.docType.$el.trigger("change");
            },
          },

          docNumber: {
            /**
             * @function setRange
             * @description Set range identification document number
             */
            setRange: function () {
              var $selectedOption = $(this).find("option:selected");
              var minLength = $selectedOption.data("minLength");
              var maxLength = $selectedOption.data("maxLength");

              // Set label
              var labelSecondPart =
                $selectedOption.val() === that.configuration.docTypeDNI
                  ? that.resourceMessages.docNumberLabelDNI
                  : that.resourceMessages.docNumberLabelOther;
              fields.docNumber.$label.text(
                that.resourceMessages.docNumberLabel + " " + labelSecondPart
              );

              // Set range
              fields.docNumber.$wrapper.addClass("required");
              fields.docNumber.$el.attr("maxlength", maxLength);
              fields.docNumber.$el.attr("minlength", minLength);

              // Set tooltip
              fields.docNumber.$tooltip.text(
                that.resourceMessages.docNumberTooltip
                  .replace("{0}", minLength)
                  .replace("{1}", maxLength)
              );
            },
          },

          registeredCustomer: {
            /**
             * @function togglePaymentType
             * @description Toggle payment type (new or stored)
             * @param {Event} event event
             */
            togglePaymentType: function (event) {
              var $el = $(this);
              var isNew = $el.data("togglePaymentType") === "new";

              $elements.customerCardsContainer.toggleClass(
                "checkout-hidden",
                isNew
              );

              // Disable and remove value to properly create token
              fields.cardId.$el.prop("disabled", isNew);
              if (isNew) {
                fields.cardId.$el.val("");
              }
              /* eslint-disable eqeqeq, no-restricted-syntax */
              for (var field in fields) {
                if (fields[field].hide.stored) {
                  fields[field].$el
                    .closest(".js-mp-container")
                    .toggleClass("checkout-hidden", !isNew);
                }
                if (fields[field].disable.stored) {
                  fields[field].$el.prop("disabled", !isNew);
                }
              }
              /* eslint-enable eqeqeq, no-restricted-syntax */

              // Set initial states
              if (isNew) {
                methods.paymentOption.setInitialState.newPayment();
              }
              // Only when triggered from event (to avoid recursion)
              if (event && !isNew) {
                methods.paymentOption.setInitialState.restoreStoredPayment();
              }

              // Change to opposite
              $el.data("togglePaymentType", isNew ? "stored" : "new");
              $el.text($el.data((isNew ? "stored" : "new") + "PaymentText"));
            },
            /**
             * @function selectCustomerCard
             * @description Select store credit card
             */
            selectCustomerCard: function (firstTime) {
              if (!firstTime ){
                $('.js-mp-customer-card:first').trigger('click');
                return;
              }
              var $el = $(this);
              $elements.customerCard.removeClass("selected-payment");
              if (firstTime && !firstTime.length > 0) {
                $(".js-mp-customer-cards div").removeClass("selected-payment");
              }
              
              $el.addClass("selected-payment");
              fields.cardId.$el.val($el.data("mpCustomerCard"));

              var paymentMethodInput = fields.cardType.$el.filter(function () {
                return this.value === $el.data("mpMethodId");
              });
              paymentMethodInput.prop("checked", true);
              methods.card.handleTypeChange.call(paymentMethodInput[0], {
                data: { handleOther: false },
              });
            },
          },
        };

        /**
         * @function initSDK
         * @description Init MercadoPago JS SDK by setting public key
         */
        function initSDK() {
            window.Mercadopago.setPublishableKey(that.preferences.publicKey);
        }

        /**
         * @function initAjaxListener
         * @description This function is necessary to listen to PlaceOrder errors and reset the credit-card token
         */
        function initAjaxListener() {
            $(document).ajaxComplete(function (event, xhr) {
                if (xhr && xhr.responseText && xhr.responseText.indexOf("resetMpToken") >= 0) {
                    if (Object.hasOwnProperty.call(Mercadopago, "tokenId")) {
                        Mercadopago.tokenId = "";
                    }
                    $("input[name*=\"mercadoPagoCreditCard_token\"]").val("");
                }
                if (xhr && xhr.responseText && xhr.responseText.indexOf("detailedError") >= 0) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.detailedError) {
                            $(".payment-summary .edit-button").trigger("click");
                            methods.token.errorResponse(response.detailedError);
                        }
                    } catch (ex) {
                        // do nothing
                    }
                }
            });
        }

        /**
         * @function events
         * @description Init events
         */
        function events() {
            $elements.paymentOptionTab.on(
                "click",
                methods.paymentOption.handleChange
            ); // By click
            fields.cardType.$el.on(
                "change",
                { handleOther: true },
                methods.card.handleTypeChange
            );
            fields.docType.$el.on("change", methods.docNumber.setRange);
            $elements.paymentTypeButton.on(
                "click",
                methods.registeredCustomer.togglePaymentType
            );
            $elements.customerCard.on(
                "click",
                methods.registeredCustomer.selectCustomerCard
            );

           $("#cardsMercadopago").on(
              "click" , ".js-mp-customer-card",
              methods.registeredCustomer.selectCustomerCard
          );
            $(".next-step-button .submit-payment").on(
                "click",
                methods.token.populate
            );
            fields.cardNumber.$el.on(
                "focusout",
                methods.card.guessingPaymentMethod
            );
            $("#mercadoPagoCardNumber").keyup(function(){
                var numberCard = ($("#mercadoPagoCardNumber").val()).split(' ').join('');
                if (numberCard.length === 6) {
                    const cardnumber = document.getElementById(
                        "mercadoPagoCardNumber"
                    ).value;
                    var bin = cardnumber.replace(" ", "").substring(0, 6);
                    window.Mercadopago.getPaymentMethod(
                        {
                            bin: bin
                        },
                        methods.card.setPaymentMethodInfo
                    );
                  }
              });
        }
       

        this.preferences = $form.data("mpPreferences");
        this.resourceMessages = $form.data("mpResourceMessages");
        this.configuration = $form.data("mpConfiguration");

        /**
         * @function init
         * @description Init integration
         */
        this.init = function () {
            if ($content.length > 0) {
                initSDK();
                if (that.preferences.enableDocTypeNumber) {
                    methods.docType.init();
                }
                events();
                methods.paymentOption.handleChange.call(
                    $elements.paymentOptionTab.filter(".enabled")
                ); // Initial
                initAjaxListener();
            }
        };
        if(!$("#cardsMercadopago").hasClass("checkout-hidden")){
          setTimeout(function() {
            var firstCard = $elements.customerCard.filter(":first");
            var firstTime = 'firstTime';
            methods.registeredCustomer.selectCustomerCard.call(firstCard[0], firstTime);
            $(".js-mail-phone-container").addClass("checkout-hidden");
            $('.js-mp-customer-card:first').trigger('click');
          },500)
        }

        $(".submit-shipping").on("click", function () {
          setTimeout(function() {
            $("input:radio[value=amex]:visible").trigger("click");
            $("input:radio[value=visa]:visible").trigger("click");
            $('#useSameMailPhoneAsAddress').prop('checked', true);
            if(!$("#cardsMercadopago").hasClass("checkout-hidden")){
            
           }
        }, 500);
        });
    }
    function createOptions(array) {
      var select = document.getElementById('citySelectNew');
      select.length = 1;
      var value = 0;
      for (value in array) {
          var option = document.createElement("option");
          option.text = array[value];
          option.value = array[value];
          select.add(option);
      }
  }
  
  
  function getDepartaments(value) {
      $.ajax({
          url: 'GetDepartaments-GetCity',
          method: 'Get',
          data: { apt: value },
          async: true,
          success: function (data) {
              if (data.municipiosArray) {
                  createOptions(data.municipiosArray)
              }
          }
      })
  }
  
  $('#depaSelectNew').on('change', function () {
      getDepartaments($(this).val())
  });
  $("#mercadoPagocedula").keyup(function () {
    var value = $(this).val();
    $("#docNumber").val(value);
});
    $(document).ready(new MercadoPago().init);
}(jQuery));
