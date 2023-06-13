'use strict';


var Site = require('dw/system/Site');
 var customPreferences = Site.current.preferences.custom;
 

module.exports = {
                    citysSelect  : 'locator_citys' in customPreferences ? JSON.parse(customPreferences.locator_citys) : []
                };