"use strict";

const comm = require("q-comm");
const Q = require("q");
const { Queue } = require("q/queue");

function Connection(port, id) {
  let address = "vat#" + id;
  let queue = Queue();
  let closed = Q.defer();
  port.on(address, queue.put);
  return {
    get: queue.get,
    put: port.send.bind(port, address),
    close: closed.resolve,
    closed: closed.promise
  };
}

exports.Peer = function Peer(port, id, object) {
  return comm.Peer(Connection(port, id), object);
}
