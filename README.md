# Vats #

## Motivation and Rationale ##

Currently access to a chrome module from add-on process requires boilerplate /
wrapper code in both (chrome, add-on) processes, this is specially painful for
a tests that use raw chrome access to an APIs that were never exposed through
low level modules that will have to be build from scratch.

Module vats will simplify E10S integration by providing de-sugared, low-level
access to all existing modules (from add-on process) without any wrapping code,
on top of which high level modules in add-on process could be build (most likely
high level modules will just be ported to the add-on process).

Proposal is based on well researched work that has being implemented and well
tested in other languages like [E][Vat in E], [C#][Project orleans] and also
being implemented as a libraries in JavaScript: [Q-comm], [web-send].

## Requirements and Scope ##

To address existing [E10S integration issues] module vats must provide
mechanics for:

- Building vats (as proposed in ES proposal for [Event-Loop Concurrency]).
- Using vats as workers (loading "chrome scripts") for accessing raw chrome
  APIs not exposed as modules.
- Using vats for de-sugared, low-level access to an existing (chrome) modules.
  This will allow implementing high level module in add-on- process by creating
  a vat wrapped (also please not that only wrapper on add-on process will be
  created and only for hight level modules).
- All the created Vats and the references created with in them have to be
  removed automatically on unload (optionally Vat and it's references could be
  removed by calling `detroy` method on it).

Optionally:

- Sugar APIs can be build on top using [Proxies] as being prototyped in:
  [meta-promise]. Sugared APIs will map as follows:

<table>
    <tr>
       <th>de-usgared</th>
       <th>sync</th>
        <th>async</th>
    </tr>
    <tr>
        <td>Q.get(promise, 'bar')</td>
        <td>promise.bar</td>
        <td>promise['! bar']</td>
     </tr>
     <tr>
        <td>Q.put(promise, 'bar', 'foo')</td>
        <td>promise.bar = 'foo'</td>
        <td>promise['! bar'] = 'foo' </td>
     </tr>
      <tr>
        <td>Q.post(promise, 'foo', a, b)</td>
        <td>promise.foo(a, b)</td>
        <td>promise['! foo'](a, b) </td>
     </tr>
</table>

- Generator may be used to add further syntax sugar for saving continuations on
  promise resolution / rejections. This was prototyped in an [actor] lib and
  would map de-sugared API as follows:

      Q.when(promise, function resolved(value) {
        callback(null, data + foo);
      }, function rejected(reason) {
        callback(new Error(reason));
      })


      try {
        callback(null, (yield promise) + foo);
      } catch(exception) {
        callback(exception);
      }

- Vats could be exposed for a content workers, that will allow similar wrappers
  (likely by third parties) in content context for a sugared access to a
  high-level APIs.

## Usage ##

API can be implemented as module accessible from the add-on process. Following
example uses vat to get raw access to the chrome API:

    const { Vat } = require("vats");
    const { Q } = require("q");

    // Returns promise for the `exports` object in the vat context.
    let vat = Vat({
      source: "new " + function Worker() {
        const { Cc, Ci } = require("chrome");
        exports.WM = Cc["@mozilla.org/appshell/window-mediator;1"].
                   getService(Ci.nsIWindowMediator);

      }
    });
    // Getting remote promise for `exports.WM`.
    let pWM = Q.get(vat, "WM");
    // Remote promise for `exports.WM.getMostRecentWindow("navigator:browser");
    let pActiveWindow = Q.post(pWM, "getMostRecentWindow", "navigator:browser");
    // Sets a property on the remote object (that returns promise that will
    // be fulfilled / get broken once operation in the chrome process is
    // performed.
    let onSet = Q.put(pActiveWindow, "location", "data:text/html,Hello Vat!");
    // Setting a callback to log a message when `location` property of the
    // active window will change and an errorback to be notified if race
    // condition occurred. Please note that failure will propagate across the
    // whole chain, meaning that Q.post failure, will be caught by onFailure.
    Q.when(onSet, function onFulfill() console.log("done"),
                  function onFailure(error) console.log("failed: " + error));

Also vats can be created out of chrome modules. Following example creates a
high-level "notifications" module using a vat wrapper:

    const { Vat } = require("vats");
    const { Q } = require("q");
    pNotifications = Vat({ module: "notifications" });
    exports.notify = function notify(options) {
      Q.post(pNotifications, "notify", options);
    }

[Q-comm]:https://github.com/kriskowal/q-comm
[web-send]:http://waterken.sourceforge.net/web_send/
[Event-Loop Concurrency]:http://wiki.ecmascript.org/doku.php?id=strawman:concurrency
[E10S integration issues]:http://etherpad.mozilla.com:9000/jetpack-e10s-issues
[Proxies]:http://wiki.ecmascript.org/doku.php?id=harmony:proxies
[Vat in E]:http://www.cypherpunks.to/erights/elib/concurrency/vat.html
[Project orleans]:http://research.microsoft.com/apps/pubs/?id=141999
[meta-promise]:https://github.com/Gozala/meta-promise
[actor]:https://github.com/Gozala/actor

