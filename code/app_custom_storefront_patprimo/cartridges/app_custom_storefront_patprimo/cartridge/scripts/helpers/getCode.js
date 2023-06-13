"use strict";

function createCode() {
    var passwordCode = '';
    var codelength = 4;
    const uletter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const vletter = "abcdefghijklmnopqrstuvwxyz";
    const numberChar = "0123456789";
    const specialChar = '$%/()[]{}=?!.,-_*|+~#';
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    passwordCode = uletter.charAt(Math.floor(Math.random() * uletter.length));
    passwordCode += numberChar.charAt(Math.floor(Math.random() * numberChar.length));

    for (let index = 0; index < codelength; index++) {
        passwordCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    passwordCode += vletter.charAt(Math.floor(Math.random() * vletter.length));
    passwordCode += specialChar.charAt(Math.floor(Math.random() * specialChar.length));
    return passwordCode;
}

module.exports = {createCode:createCode}