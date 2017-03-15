angular.module('myApp').factory('authService', function ($http, $q) {

  var apiURL = 'http://localhost:8080/api/';

  return {
        // Attempt logging in by contacting server with login details
        tryLogin: function (loginDetails) {
            var deferred = $q.defer();

            $http({
                url: apiURL + "login",
                method: "POST",
                params: { data: loginDetails }
            }).then(function (res) {
                deferred.resolve(res);
            })

            return deferred.promise;
        }
    }
});
