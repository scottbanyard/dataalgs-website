angular.module('myApp').factory('authService', function ($http, $q) {

  var apiURL = 'http://localhost:8080/api/';

  return {
        // Attempt logging in by contacting server with login details
        tryLogin: function (userDetails) {
          var deferred = $q.defer();

          $http.post(apiURL + "login", userDetails)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error Login POST: " + err);
          })
          return deferred.promise;
        },

        // Register person
        tryRegister: function (userDetails) {
          var deferred = $q.defer();

          $http.post(apiURL + "register", userDetails)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error Register POST: " + err);
          })
          return deferred.promise;
        }
    }
});
