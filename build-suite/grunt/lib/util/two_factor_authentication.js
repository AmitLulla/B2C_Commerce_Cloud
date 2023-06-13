'use strict';

const TLS_PROTOCOL = 'TLSv1_2_method';

var fs = require('fs');

/**
 * Module containing functions for handling 2FA requests
 */


/**
 * Checks if 2FA is enabled and returns true if so
 *
 * @param {object} options
 * @returns {boolean}
 */
function isTwoFactorEnabled(options) {
    if (!options.two_factor || !options.two_factor.enabled) {
        return false;
    }

    return options.two_factor.enabled.toString().toLowerCase() === 'true';
}

/**
 * Get the target URL depending on whether 2FA is enabled or not
 *
 * @param {object} options
 */
function getUrl(options) {
    if (exports.isTwoFactorEnabled(options)) {
        return options.two_factor.url;
    }

    return options.url;
}

/**
 * Set options for two factor auth if enabled
 *
 * @param {object} httpOptions
 * @param {object} options
 */
function initTwoFactorOptions(httpOptions, options) {
    if (!exports.isTwoFactorEnabled(options)) {
        return;
    }

    // Set proper options
    httpOptions.pfx = fs.readFileSync(options.two_factor.cert);
    httpOptions.passphrase = options.two_factor.password;
    httpOptions.secureProtocol = TLS_PROTOCOL;
}


exports.isTwoFactorEnabled = isTwoFactorEnabled;
exports.getUrl = getUrl;
exports.initTwoFactorOptions = initTwoFactorOptions;
