
function createBasketAbandoned() {
    $.ajax({
        url: app.urls.createCartAbandoned,
        type: 'get',
        success: function (data) {
            console.log(data);
            if (data.error && data.msj === 'not email') {
                timer.reset((window.timeForCartAbandoned * 60000));
            } else if (data.error && data.msj === 'time correct') {
                timer.reset((window.timeForCartAbandoned * 60000));
            } else if (data.error && data.msj === 'time in range') {
                timer.reset((window.timeForCartAbandoned * 60000));
            } else if (data.error && data.msj === 'already was cart abandoned') {
                timer.stop();
            } else if (!data.error && data.msj === 'create abandoned cart') {
                timer.stop();
                console.log('carrito abandonado-stop function');
            } else if (data.error) {
                timer.stop(); 
            }
        }
    })
}

function Timer(fn, t) {
    var timerObj = setInterval(fn, t);

    this.stop = function() {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    }

    // start timer using current settings (if it's not already running)
    this.start = function() {
        if (!timerObj) {
            this.stop();
            timerObj = setInterval(fn, t);
        }
        return this;
    }

    // start with new or original interval, stop current interval
    this.reset = function(newT = t) {
        t = newT;
        return this.stop().start();
    }
}
var timer;
function timeOut () {
    console.log('call timeOutFunction')
    if (timer) {
        timer.reset((window.timeForCartAbandoned * 60000))
    } else {
        timer = new Timer(function() {
            createBasketAbandoned();
        }, (window.timeForCartAbandoned * 60000));
    }
    
}


$(document).on(
  "click",
  "button.add-to-cart, button.add-to-cart-global, .add-to-cart-custom li",
  function () {
    if(window.enable_cart_abandoned) {
        console.log(new Date())
        var localStorage = window.localStorage;    
        localStorage.setItem('hasCartAbandoned', true);
        timeOut()
    }
  }
);


$(document).ready(function () {
    if(window.enable_cart_abandoned) {
        if ($("#thereIsCart").data("has-cart") === true || window.localStorage.hasCartAbandoned) {
            timeOut()
        } else {
            if(timer) {
                timer.stop();
            }
        }
    }
});
