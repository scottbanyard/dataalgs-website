angular.module('myApp').factory('contentService', function ($http, $q) {

  var apiURL = 'https://localhost:8080/api/';

  return {
        getComments: function (request) {
          var deferred = $q.defer();

          $http.post(apiURL + "allComments", request)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error getting page POST: " + err);
          })
          return deferred.promise;
        },

        getAllPublicPages: function (request) {
          var pages = null;
          var deferred = $q.defer();

          $http.get(apiURL + "getAllPublicPages").then(function (result) {
              pages = result.data;
              deferred.resolve(pages);
          }, function (error) {
              pages = error;
              deferred.reject(pages);
          });

          pages = deferred.promise;
          return deferred.promise;
        },

        getPage: function (request) {
            var deferred = $q.defer();

            $http.post(apiURL + "loadPage", request)
            .then(function (res) {
              deferred.resolve(res);
            })
            .catch(function(err) {
              console.log("Error getting page POST: " + err);
              deferred.reject(err);
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
        },

        getMyComments: function (request) {
          var deferred = $q.defer();

          $http.post(apiURL + "mycomments", request)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error getting page POST: " + err);
          })
          return deferred.promise;
        },

        deleteComment: function (request) {
          var deferred = $q.defer();

          $http.post(apiURL + "deletecomment", request)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error deleting comment POST: " + err);
          })
          return deferred.promise;
        },

        getMyPages: function (request) {
          var deferred = $q.defer();

          $http.post(apiURL + "mypages", request)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error getting my pages POST: " + err);
          })
          return deferred.promise;
        },

        deletePage: function (request) {
          var deferred = $q.defer();

          $http.post(apiURL + "deletepage", request)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error getting page POST: " + err);
          })
          return deferred.promise;
        },

        previewHTML: function (request) {
          var deferred = $q.defer();

          $http.post(apiURL + "previewHTML", request)
          .then(function (res) {
            deferred.resolve(res);
          })
          .catch(function( err) {
            console.log("Error getting page POST: " + err);
          })
          return deferred.promise;
        }
    }
});
