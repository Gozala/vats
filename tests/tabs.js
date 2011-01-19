"use strict";

const Q = require("q");
const { Vat } = require("vats");

const utils = Vat({
  source: 'new ' + function ChromeWorker() {
    const C = eval('Components');

    const WM = C.classes["@mozilla.org/appshell/window-mediator;1"].
               getService(C.interfaces.nsIWindowMediator)

    exports.getActiveWindow = function getActiveWindow() {
      return WM.getMostRecentWindow("navigator:browser");
    };

    exports.getActiveTab = function getActiveTab() {
      return exports.getActiveWindow().gBrowser.selectedTab;
    };

    exports.getActiveTabWindow = function getActiveTabWindow() {
      return exports.getActiveWindow().gBrowser.
             getBrowserForTab(exports.getActiveTab()).contentWindow;
    };

    exports.getActiveTabLocation = function getActiveTabLocation() {
        return decodeURIComponent(exports.getActiveTabWindow().location);
    };
  }
});

exports["test simple tab api"] = function (assert, done) {
  let URI = "data:text/html,<h1>Hello vat!</h1>";

  let pTabs = Vat("tabs");                    // -> let tabs = require("tabs");
  let pTab = Q.get(pTabs, "0");               // -> let tab = tabs[0];
  let newURI = Q.put(pTab, "url", URI);       // -> tab.url = URL;
  
  Q.when(newURI, function() {
    Q.when(Q.post(utils, "getActiveTabLocation"), function (url) {
      assert.equal(url, URI, "tab location changed");
      done();
    }, function (reason) {
      done(assert.fail(reason));
    })
  })
};
