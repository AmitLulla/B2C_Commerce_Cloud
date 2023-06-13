'use strict';

var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

server.get('GetAttribute', function (req, res, next) {
  var displayName = '';
  if (req.querystring.displayName == 'filtroFit') {
    displayName = req.querystring.displayName;
  } else {
    displayName = req.querystring.displayName.toString().toLowerCase();
  }
  var coQuery = CustomObjectMgr.getAllCustomObjects(displayName);
  var attrObj = [];
  if (coQuery) {
    while (coQuery.hasNext()) {
      var currentCO = coQuery.next();
      attrObj.push({
        attrValor: currentCO.custom.attrValor,
        image: currentCO.custom.imagenFiltro
      });
    }
    var refinementValues = req.querystring.refinementValues;
    var cards = req.querystring.cards;
    res.render('/search/imageFilters', {
      attrObj: attrObj,
      refinementValues: JSON.parse(refinementValues),
      filter: displayName,
      cards: cards
    });
  }
  next();
});
module.exports = server.exports();
