'use strict';

$(document).ready(function () {
    $('.url-referidos').click(function (e) {
        e.preventDefault();
        navigator.clipboard.writeText($(this).attr('href'));
      });
});