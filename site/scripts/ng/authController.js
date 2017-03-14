angular.module('myApp').controller('authController', function($scope) {

  $scope.registerPerson = function() {
    console.log("Registering with: " + $scope.email + " , and password: " + $scope.password);
    // Call register function
  }

  $scope.loginPerson = function() {
    console.log("Logging in with: " + $scope.email + " , and password: " + $scope.password);
    // Call login function
  }
});
