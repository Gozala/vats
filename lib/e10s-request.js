"use strict";

var { Vat } = require("vats");
var Q = require("q");

var vat = Vat('request');

exports.Request = function Request(options) {
  var qRequest = Q.post(vat, 'Request', { url: options.url });
  if ("onComplete" in options)
    Q.post(qRequest, "on", "complete", Q.def(options.onComplete));

  return {
    get: function() {
      Q.post(qRequest, 'get');
      return this;
    },
    post: function() {
      Q.post(qRequest, 'post');
      return this;
    }
  };
}
