'use strict';

/**
 * Helper that sends an email to a customer. This will only get called if hook handler is not registered
 * @param {obj} emailObj - An object that contains information about email that will be sent
 * @param {string} emailObj.to - Email address to send the message to (required)
 * @param {string} emailObj.subject - Subject of the message to be sent (required)
 * @param {string} emailObj.from - Email address to be used as a "from" address in the email (required)
 * @param {int} emailObj.type - Integer that specifies the type of the email being sent out. See export from emailHelpers for values.
 * @param {string} template - Location of the ISML template to be rendered in the email.
 * @param {obj} context - Object with context to be passed as pdict into ISML template.
 */
function send(emailObj, template, context) {
  var Mail = require('dw/net/Mail');
  var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

  var email = new Mail();
  email.addTo(emailObj.to);
  email.setSubject(emailObj.subject);
  email.setFrom(emailObj.from);
  email.setContent(
    renderTemplateHelper.getRenderedHtml(context, template),
    'text/html',
    'UTF-8'
  );
  email.send();
}

module.exports = {
  send: send,
  sendEmail: function (emailObj, template, context) {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    return hooksHelper(
      'app.code.email',
      'sendEmail',
      [emailObj, template, context],
      send
    );
  }
};