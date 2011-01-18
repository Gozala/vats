var chrome, addon, ID = 0;

var { Vat } = require("vats");
var Q = require("q");

var vat = Vat({ module: 'tabs' });
console.log('vat>', vat)
var tab = Q.get(vat, '0');


Q.when(Q.put(tab, 'url', 'data:text/html,<h1>Hello vat!</h1>'), function() {
  console.log('look at the tab!!');
}, function(reason) {
  console.error('failure: ' + reason);
})
