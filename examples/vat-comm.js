
var chrome, addon, ID = 0;

var { Vat } = require("vats");
var { Peer } = require("peer");
var Q = require("q");

let Port = require('events').EventEmitter.compose({
  constructor: function () { return this },
  send: function (address, a, b) {
    console.log('>', address, a, b);
    require('timer').setTimeout(this._emit.bind(this, address, a, b))
  }
})

var server = Port();
var client = Port();
var send = server.send;
server.send = send.bind(client);
client.send = send.bind(server);

server.on("vat", function (id, options) {
  let local = Vat(options);
  console.log('<<<', id);
  Peer(server, id, local);
});

function create(options) {
  let id = ++ID
  let remote = Peer(client, id);
  console.log('>>>', id);
  client.send("vat", id, options);
  return remote;
}

var vat = create({ module: 'tabs' });
var tab = Q.get(vat, '0');
Q.when(Q.put(tab, 'url', 'data:text/html,<h1>Hello vat!</h1>'), function() {
  console.log('look at the tab!!');
}, function(reason) {
  console.error('failure: ' + reason);
})

