angular.module('myApp').factory('authService', function ($http, $q) {

  var apiURL = 'https://localhost:8080/api/';

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
        },

        // Attempt logging in by contacting server with login details
        changePassword: function (userDetails) {
          var deferred = $q.defer();

          $http.post(apiURL + "changepw", userDetails)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error Login POST: " + err);
          })
          return deferred.promise;
        },

        // Attempt to delete your account
        deleteAccount: function (userDetails) {
          var deferred = $q.defer();

          $http.post(apiURL + "deleteaccount", userDetails)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error Login POST: " + err);
          })
          return deferred.promise;
        },

    }
});
