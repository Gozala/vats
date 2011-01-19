"use strict";

const { Request } = require("e10s-request");

exports["test request API"] = function (assert, done) {
  let request = Request({
    url: "about:buildconfig",
    onComplete: function (data) {
      assert.ok(0 < data.text.indexOf("<title>about:buildconfig</title>"),
                "callback includes expected text");
      done();
    }
  }).get()
};
