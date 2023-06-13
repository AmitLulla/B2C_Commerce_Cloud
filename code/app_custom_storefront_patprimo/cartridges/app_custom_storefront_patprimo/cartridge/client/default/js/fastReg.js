'use strict'

function isEmail(email) {
    var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!regex.test(email)) {
        return false;
    }
    else {
        return true;
    }
}
var url = $(".UrlFastReg").val();
    function FastReg(email) {
      $.ajax({
        url: url,
        method: "get",
        data: { email: email },
        async: true,
        success: function (data) {
          if (!data.success) {
            $(".errormail").removeClass("d-none");
            setTimeout(() => {
              $(".errormail").addClass("d-none");
            }, 3000);
          }else{
            $(".errormail4").removeClass("d-none");
            setTimeout(() => {
              $(".errormail4").addClass("d-none");
              // Logout();
            }, 3000);
            location.href = data.redirectUrl;
          }
        },
      });
    }
    function Logout() {
        $.ajax({
            url: "Login-Logout",
            method: "get",
            async: true,
            success: function (data) {
            },
          });
    }

    

    $('#sendReg').on('click', function () { 
        var email = $("#mailReg").val();
        var validEmail = isEmail(email);
        if(!validEmail){
            $(".errormail2").removeClass('d-none');
            setTimeout(() => {
                $(".errormail2").addClass('d-none');
            }, 3000);
        }else{
            if(!$("#checkDisclaimer").prop('checked')){
                $(".errormail3").removeClass('d-none');
            setTimeout(() => {
                $(".errormail3").addClass('d-none');
            }, 3000);
            }else{
                FastReg(email);
            }
        }
    });

    $('#sendNewsLetterReg').on('click', function () {
      var email = $("#newsLetterReg").val();
        var validEmail = isEmail(email);
        if(!validEmail){
          $(".errormail2").removeClass('d-none');
          setTimeout(() => {
              $(".errormail2").addClass('d-none');
          }, 3000);
      }else{
        FastReg(email);
      }
    });