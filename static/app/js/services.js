'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1').
  provider('socket', function () {

    // when forwarding events, prefix the event name
    var prefix = 'socket:',
      ioSocket;

    // expose to provider
    this.$get = function ($rootScope, $timeout) {

      var socket = ioSocket || io.connect();

      var asyncAngularify = function (callback) {
        return function () {  
          var args = arguments;
          $timeout(function () {
            callback.apply(socket, args);
          }, 0);
        };
      };

      var addListener = function (eventName, callback) {
        socket.on(eventName, asyncAngularify(callback));
      };

      var wrappedSocket = {
        on: addListener,
        addListener: addListener,

        emit: function (eventName, data, callback) {
          if (callback) {
            socket.emit(eventName, data, asyncAngularify(callback));
          } else {
            socket.emit(eventName, data);
          }
        },

        removeListener: function () {
          var args = arguments;
          return socket.removeListener.apply(socket, args);
        },

        // when socket.on('someEvent', fn (data) { ... }),
        // call scope.$broadcast('someEvent', data)
        forward: function (events, scope) {
          if (events instanceof Array === false) {
            events = [events];
          }
          if (!scope) {
            scope = $rootScope;
          }
          events.forEach(function (eventName) {
            var prefixed = prefix + eventName;
            var forwardEvent = asyncAngularify(function (data) {
              scope.$broadcast(prefixed, data);
            });
            scope.$on('$destroy', function () {
              socket.removeListener(eventName, forwardEvent);
            });
            socket.on(eventName, forwardEvent);
          });
        }
      };

      return wrappedSocket;
    };

    this.prefix = function (newPrefix) {
      prefix = newPrefix;
    };

    this.ioSocket = function (socket) {
      ioSocket = socket;
    };
  });