window.jQuery = window.$ = require('jquery');
var processInclude = require('./util');
window.slick = window.Slick = require('slick-carousel/slick/slick');
window.owlCarousel = window.OwlCarousel = require('owl.carousel');

$(document).ready(function () {
  processInclude(require('./components/menu'));
  processInclude(require('base/components/cookie'));
  processInclude(require('base/components/consentTracking'));
  processInclude(require('base/components/footer'));
  processInclude(require('./components/miniCart'));
  processInclude(require('base/components/collapsibleItem'));
  processInclude(require('base/components/search'));
  processInclude(require('base/components/clientSideValidation'));
  processInclude(require('base/components/countrySelector'));
  processInclude(require('./wishlistHeart'));
  processInclude(require('./product/base'));
});


require('base/thirdParty/bootstrap');
require('base/components/spinner');
require('./cartAbandoned');
