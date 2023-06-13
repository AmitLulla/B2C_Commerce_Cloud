var colorBtns = document.querySelectorAll(".color-btn");
var minusBtns = document.querySelectorAll(".minus-btn");
var plusBtns = document.querySelectorAll(".plus-btn");
var quantityFields = document.querySelectorAll(".quantity-field");
var totalCountLabel = document.getElementById("total-count");
var totalPriceLabel = document.getElementById("totalProductPrice");
var salePrice = document.getElementById("salePrice");

for (var i = 0; i < minusBtns.length; i++) {
  
  minusBtns[i].addEventListener("click", function(event) {
    if (event.target.tagName.toLowerCase() === 'button') {
      var index = Array.from(minusBtns).indexOf(this);
      var currentValue = parseInt(quantityFields[index].value);
      if (currentValue > 0) {
        quantityFields[index].value = currentValue - 1;
        colorBtns[index].classList.add("selected");
      }
      if((quantityFields[index].value <= 0)){
         colorBtns[index].classList.remove("selected");
      }
      if (quantityFields[index].value == 0) {
        minusBtns[index].disabled = true;
      }
      plusBtns[index].disabled = false;
      updateTotalCount();
    }
  });
}

for (var i = 0; i < plusBtns.length; i++) {
  plusBtns[i].addEventListener("click", function(event) {
    if (event.target.tagName.toLowerCase() === 'button') {
      var index = Array.from(plusBtns).indexOf(this);
      var currentValue = parseInt(quantityFields[index].value);
      quantityFields[index].value = currentValue + 1;
      if (quantityFields[index].value > 0) {
        minusBtns[index].disabled = false;
        colorBtns[index].classList.add("selected");
      }
      if((quantityFields[index].value <= 0)){
          colorBtns[index].classList.remove("selected");
      }
      if (quantityFields[index].value == 10) {
        plusBtns[index].disabled = true;
      }
      updateTotalCount();
    }
  });
}

function updateTotalCount() {
  var totalCount = 0; 
  var totalPrice = 0;
  for (var i = 0; i < quantityFields.length; i++) {
    totalCount += parseInt(quantityFields[i].value);
    totalPrice += parseInt(quantityFields[i].value);
  }
  totalCountLabel.innerText = totalCount;
  var totalPrice = parseInt(salePrice.getAttribute('data-total')) * parseInt(totalCount);
  salePrice.innerText = formatPrice(totalPrice);
}

function formatPrice(price) {
    var redond = Math.round(price);
    var num = redond;
    if (!isNaN(num)) {
        num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.');
        num = num.split('').reverse().join('').replace(/^[\.]/, '');
        return num;
    }
}