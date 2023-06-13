'use strict';

$(document).ready(function () {
    $('#autorizar-tratamiento-datos').removeAttr('checked');
    $('#autorizar-tratamiento-datos').on('change', function(e) {
        if($(this).is(':checked')) {
            $('.submit-referidos').removeAttr('disabled');
        } else {
            $('.submit-referidos').attr('disabled', true);
        }
    });
});