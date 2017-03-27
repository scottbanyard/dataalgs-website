angular.module('myApp').factory('contentService', function ($http, $q) {

  var apiURL = 'https://localhost:8080/api/';

  return {
        getComments: function (request) {
          var deferred = $q.defer();

          $http.post(apiURL + "content", request)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error getting page POST: " + err);
          })
          return deferred.promise;
        },

        getPage: function (request) {
            var deferred = $q.defer();

            $http.post(apiURL + "loadPage", request)
            .then(function (res) {
              deferred.resolve(res);
            })
            .catch(function( err) {
              console.log("Error getting page POST: " + err);
            })
            return deferred.promise;
        },
        savePage: function (request) {
            var deferred = $q.defer();

            $http.post(apiURL + "savePage", request)
            .then(function (res) {
              deferred.resolve(res);
            })
            .catch(function( err) {
              console.log("Error saving page POST: " + err);
            })
            return deferred.promise;
        },
        addComment: function (commentData) {
          var deferred = $q.defer();

          $http.post(apiURL + "makeComment", commentData)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error making Comment POST: " + err);
          })
          return deferred.promise;
        }
    }
});
