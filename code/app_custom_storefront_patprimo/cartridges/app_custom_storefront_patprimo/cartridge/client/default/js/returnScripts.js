'use strict';


function returnItems(id) {
  if ($('#' + id).prop('checked')) {
    $('#items').html(parseInt($('#qty-' + id).val()) + parseInt($('#items').html()));
    $('#summary').html(parseInt($('#basePriceValue-' + id).val() * $('#qty-' + id).val()) + parseInt($('#summary').html()));
    $('#qtySel-' + id).val(parseInt($('#qty-' + id).val()));
    $('#numberProducts').val($('#numberProducts').val() + $('#' + id).val() + ',');
    $('#dataReturn-'+ id).val('-{' + '"id":' + '"' + id + '"' + ',' + '"qty":' +parseInt($('#qty-' + id).val()) +','+ '"return":' + $('#return-' + id).val() + '}');
    var formater= parseInt($('#summary').html());
    $('#summary2').html(transformCol(formater));
  } else {
    $('#items').html(parseInt($('#items').html() - parseInt($('#qty-' + id).val())));
    $('#summary').html(parseInt($('#summary').html() - parseInt($('#basePriceValue-' + id).val() * $('#qty-' + id).val())));
    $('#qtySel-' + id).val(parseInt($('#qty-' + id).val()));
    $('#numberProducts').val(($('#numberProducts').val()).replace(id + ',', ''));
    $('#dataReturn-'+ id).val('');
    var formater= parseInt($('#summary').html());
    $('#summary2').html(transformCol(formater));
  }
}
// formato pesos colombianos
function transformCol(number){

  number += '';
  var x = number.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
          x1 = x1.replace(rgx, '$1' + '.' + '$2');
  }
  return x1 + x2;
}

function returnItemsSelect(id) {
  if ($('#' + id).prop('checked')) {
    $('#items').html(parseInt($('#items').html()) - parseInt($('#qtySel-' + id).val()));
    $('#items').html(parseInt($('#items').html()) + parseInt($('#qty-' + id).val()));
    $('#summary').html(parseInt($('#summary').html() - parseInt($('#basePriceValue-' + id).val() * $('#qtySel-' + id).val())));
    $('#summary').html(parseInt($('#basePriceValue-' + id).val() * $('#qty-' + id).val()) + parseInt($('#summary').html()));
    $('#qtySel-' + id).val(parseInt($('#qty-' + id).val()));
    var formater= parseInt($('#summary').html());
    $('#summary2').html(transformCol(formater));
  }if (!$('#' + id).prop('checked')) {
$('#' + id).prop('checked', true);
$('#items').html(parseInt($('#qty-' + id).val()) + parseInt($('#items').html()));
$('#summary').html(parseInt($('#basePriceValue-' + id).val() * $('#qty-' + id).val()) + parseInt($('#summary').html()));
var formater= parseInt($('#summary').html());
$('#summary2').html(transformCol(formater));

$('#qtySel-' + id).val(parseInt($('#qty-' + id).val()));
$('#numberProducts').val($('#numberProducts').val() + $('#' + id).val() + ',');

$('#dataReturn-'+ id).val('-{' + '"id":' + '"' + id + '"' + ',' + '"qty":' +parseInt($('#qty-' + id).val()) +',' + '"priceUnit":' + $('#basePriceValue-' + id).val() +','+ '"return":' + $('#return-' + id).val() + '}');
}
}

$('.return-items').on('click', function () {
  var id= $(this).attr('id');
  if(($( "#return-" + id).val()) != 0 && ($( "#qty-" + id).val()) != 0){
    returnItems(id);
  }else{
    $('#' + id).prop('checked', false);
  }
});

$('.count-select').on('change', function () {
  var id= $(this).attr('id');
   id = id.substr(4);
  if(($( "#return-" + id).val()) != 0){
    returnItemsSelect(id);
    if($('#qtySel-' + id).val() == 0) {
      $('#' + id).prop('checked', false);
    } 
  }
});

$('.return-data').on('change', function () {
  var id= $(this).attr('id');
  id = id.substr(7);
  $('#returnSel-' + id).val(parseInt($('#return-' + id).val()));
  if(($( "#qty-" + id).val()) != 0){
    returnItemsSelect(id);
    $('#option-' + id).attr("disabled", true);
  }
});

$('input:radio[name="address"]').change(
  function () {
    if (this.checked && this.id == 'other') {
      $('.others-address').removeClass('d-none');
      $('.other-address:first').prop("checked", true);
      $('#shippingFormPatPrimoReturn').addClass('d-none');
      $('.button-pash').removeClass('d-none');
      $("#other").prop('disabled', true);
    } else if (this.checked && this.id == 'default') {
      $('.others-address').addClass('d-none');
      $('#shippingFormPatPrimoReturn').addClass('d-none');
      $('.button-pash').removeClass('d-none');
      $("#other").prop('disabled', false);
    }
  });

  $('.button-pash').on('click', function () {
    $('#shippingFormPatPrimoReturn').removeClass('d-none');
    $('.button-pash').addClass('d-none');
    $('.others-address').addClass('d-none');
    $("#other").prop("checked", false);
    $("#default").prop("checked", false);
    $("#other").prop('disabled', false);
    var w = $(".other-address");
    for (var i = 0; i < w.length; i++) {
      if(w[i].checked == true)
      {
        w[i].checked = false;
    }
  };
  });

  $('input:radio[name="returnType"]').change(
    function () {
      if (this.checked && this.id == 'bono') {
        $('#shippingFormPatPrimoBono').removeClass('d-none');
        $('#shippingFormPatPrimoBank').addClass('d-none');
        $("#docNumber").val('');
        $("#docType").val('');
      } else if (this.checked && this.id == 'bank') {
        $('#shippingFormPatPrimoBono').addClass('d-none');
        $('#shippingFormPatPrimoBank').removeClass('d-none');
        $("#bankEntity").val('');
        $("#accountType").val('');
        $("#typeDocBank").val('');
        $("#numberBank").val('');
        $("#ownersName").val('');
        $("#docNumberBank").val('');
      }
    });

    $('.return-step1').on('click', function () {
      $( ".tablinks:nth-child(2)").addClass('active');
      $( ".tabcontent:nth-child(1)").removeClass('select-step');
      $( ".tabcontent:nth-child(2)").addClass('select-step');
      $( ".steps:nth-child(1)").addClass('d-none');
      $( ".steps:nth-child(2)").removeClass('d-none');
    });


function createOptions(array) {
  var select = document.getElementById('citySelectReturn');
  select.length = 1;
  var value = 0;
  for (value in array) {
    var option = document.createElement('option');
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
        createOptions(data.municipiosArray);
      }
    }
  });
}

$('#depaSelectReturn').on('change', function () {
  getDepartaments($(this).val());
});
$('#mercadoPagocedula').keyup(function () {
  var value = $(this).val();
  $('#docNumber').val(value);
});

// concatenar direccioon
window.addressComplete = '';
window.tipoVia = '';
window.street = '';
window.numberStreet = '';
window.numberStreetExtra = '';

$('#tipoVia').on('change', function () {
  window.tipoVia = $(this).val();
  window.addressComplete =
    ' ' +
    window.tipoVia +
    ' ' +
    window.street +
    ' # ' +
    window.numberStreet +
    ' - ' +
    window.numberStreetExtra;
  $('#direccionCompleta').val(window.addressComplete);
});

$('#street').on('focusout', function () {
  window.street = $(this).val();
  window.addressComplete =
    ' ' +
    window.tipoVia +
    ' ' +
    window.street +
    ' # ' +
    window.numberStreet +
    ' - ' +
    window.numberStreetExtra;
  $('#direccionCompleta').val(window.addressComplete);
});

$('#numberStreet').on('focusout', function () {
  window.numberStreet = $(this).val();
  window.addressComplete =
    ' ' +
    window.tipoVia +
    ' ' +
    window.street +
    ' # ' +
    window.numberStreet +
    ' - ' +
    window.numberStreetExtra;
  $('#direccionCompleta').val(window.addressComplete);
});

$('#numberStreetExtra').on('focusout', function () {
  window.numberStreetExtra = $(this).val();
  window.addressComplete =
    ' ' +
    window.tipoVia +
    ' ' +
    window.street +
    ' # ' +
    window.numberStreet +
    ' - ' +
    window.numberStreetExtra;
  $('#direccionCompleta').val(window.addressComplete);
});


var currentTab = 0;
showTab(currentTab);

function showTab(n) {

  var x = document.getElementsByClassName("tab-pash");
  x[n].style.display = "block";
  if (n == 0) {
    $(".tablinks:nth-child(2)").removeClass('active');
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("text-info").style.display = "inline";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
    document.getElementById("text-info").style.display = "none";
  }if (n == 1) {
    $(".tablinks:nth-child(2)").addClass('active');
    $(".tablinks:nth-child(3)").removeClass('active');
    
  }
  if (n == (x.length - 1)) {
    $(".tablinks:nth-child(3)").addClass('active');
    document.getElementById("nextBtn").innerHTML = "Continuar";
    
  }
   else {
    document.getElementById("nextBtn").innerHTML = "Continuar";
  }
  fixStepIndicator(n)
}

function nextPrev(n) {
  var x = document.getElementsByClassName("tab-pash");
  if (!validateCheck()) return false;
  if (n == 1 && !validateForm()) return false;
  $("#message-checks").addClass('d-none');
  x[currentTab].style.display = "none";
  currentTab = currentTab + n;
  if (currentTab >= x.length) {
    var data = $(".data-return");
    var dataProducts = [];
    for (var i = 0; i < data.length; i++) {
      dataProducts.push($(data[i]).val());
    }
    $("#dataProducts").val(dataProducts);
    $("input[name='totalProducts']").val($('#items').html());
    $("input[name='totalReturn']").val($('#summary').html());
    document.getElementById("returnData").submit();
    return false;
  }
  showTab(currentTab);
}

function validateForm() {
  var w, x, y, i, z, valid = true;
  x = document.getElementsByClassName("tab-pash");
  y = x[currentTab].getElementsByTagName("input");
  z = x[currentTab].getElementsByTagName("select");
  w = x[currentTab].getElementsByClassName("other-address");

  var addressSelect = false;

  if(w.length > 0){
    for (i = 0; i < w.length; i++) {
      if(w[i].checked == true  || $("#default").prop("checked") || $("#other").prop("checked"))
      {
        addressSelect = true;
    }
  };
  }else if($("#default").prop("checked") || $("#other").prop("checked")){
    addressSelect = true;
  }


  if(y['bono']){
    if ( !y['bono'].checked && !y['bank'].checked){
      $("#message-returnType").removeClass('d-none');
    }
    if(y['bono'].checked){
     $("#numberBank").val(' ');
     $("#ownersName").val(' ');
     $("#docNumberBank").val(' ');
     $("#bankEntity").val('1');
     $("#accountType").val('CA');
     $("#typeDocBank").val('nit');
    }if(y['bank'].checked){
      $("#docNumber").val(' ');
      $("#docType").val('nit');
    }
  }
  if (currentTab != 1) {
    for (i = 0; i < y.length; i++) {
      if (y[i].value == "") {
        y[i].className += " invalid";
        valid = false;
      } else {
        $(y[i]).removeClass("invalid");
      }
    }
    for (i = 0; i < z.length; i++) {
      if (z[i].value == "") {
        z[i].className += " is-invalid";
        valid = false;
      }else{
        $(z[i]).removeClass('is-invalid');
      }
      
    }
  } else {
    valid = true;
    if (addressSelect == false) {
      for (i = 0; i < y.length; i++) {
        if (y[i].value == "" && y[i].name != "formApiso") {
          y[i].className += " invalid";
          valid = false;
        } else {
          $(y[i]).removeClass("invalid");
        }
      }
      for (i = 0; i < z.length; i++) {
        if (z[i].value == "") {
          z[i].className += " is-invalid";
          valid = false;
        }else{
          $(z[i]).removeClass('is-invalid');
        }
        
      }
    }
  }


  if (valid) {
    document.getElementsByClassName("step")[currentTab].className += " finish";
  }
  return valid;
}


function validateCheck() {
  var checks = $(".return-items");
  var valid = false;
  for (var i = 0; i < checks.length; i++) {
    if($(checks[i]).prop('checked')){
      valid = true;
    }
  }
  if(!valid){
    $("#message-checks").removeClass('d-none');
}
  return valid;
}

function fixStepIndicator(n) {

  var i, x = document.getElementsByClassName("step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  x[n].className += " active";
}

$('.prevBtn').on('click', function () {
  nextPrev(-1);
});

$('.nextBtn').on('click', function () {
  $(".tablinks:nth-child(2)").addClass('active');
  nextPrev(1);
});

$("#numberBank").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9]/g, ''));
});
$("#ownersName").on('input', function(e) {
  $(this).val($(this).val().replace(/[^a-zA-Z\s]/g, ''));
});
$("#docNumberBank").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9a-zA-Z' ']/g, ''));
});
$("#docNumber").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9a-zA-Z]/g, ''));
});
$("#street").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9a-zA-Z]/g, ''));
});
$("#numberStreet").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9a-zA-Z]/g, ''));
});
$("#numberStreetExtra").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9a-zA-Z]/g, ''));
});
$("#piso").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9a-zA-Z]/g, ''));
});
$("#formArecibe").on('input', function(e) {
  $(this).val($(this).val().replace(/[^0-9a-zA-Z\s]/g, ''));
});