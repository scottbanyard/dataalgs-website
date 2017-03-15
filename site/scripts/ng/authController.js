angular.module('myApp').controller('authController', function($scope, authService) {

  $scope.registerPerson = function() {
    console.log("Registering with: " + $scope.user.email + " , and password: " + $scope.user.password);
    // Call register function
  }

  $scope.loginPerson = function() {
    console.log("Logging in with email: " + $scope.user.email + " , and password: " + $scope.user.password);
    authService.tryLogin(JSON.stringify($scope.user)).then(function (res) {
      console.log("Successful login");
      // Show logged in
    });
  }
});
