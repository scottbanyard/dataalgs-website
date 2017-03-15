angular.module('myApp').controller('authController', function($scope, authService) {

  $scope.registerPerson = function() {
    console.log("Registering with: " + $scope.user.email + " , and password: " + $scope.user.password);
    authService.tryRegister(JSON.stringify($scope.user)).then(function (response) {
      console.log("Successful register");
      // Take to login page to login with new details
    },
    function(err) {
      console.log("Register Error :" + err);
    });
  }

  $scope.loginPerson = function() {
    console.log("Logging in with email: " + $scope.user.email + " , and password: " + $scope.user.password);
    authService.tryLogin(JSON.stringify($scope.user)).then(function (response) {
      console.log("Successful login");
      // Show logged in
    },
    function(err) {
      console.log("Login Error :" + err);
    });
  }
});
