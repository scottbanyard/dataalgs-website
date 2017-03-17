angular.module('myApp').controller('authController', function($scope, authService) {

  $scope.registerPerson = function() {
    authService.tryRegister(JSON.stringify($scope.user)).then(function (res) {
      var response = angular.fromJson(res).data;
      if (response.success == '1') {
        // Take to login page to login with new details
        console.log("Take me to login page!");
        swal("Welcome " + $scope.user.firstName + "!", "You have successfully registered!", "success");
      } else {
        // Show error via pop up, for now alert (I have used a much nicer pop up library before I'll have to find it)
        swal("Error!", response.error, "error");
        console.log(response.error);
      }
    },
    function(err) {
      console.log("Register Error :" + err);
    });
  }

  $scope.loginPerson = function() {
    authService.tryLogin(JSON.stringify($scope.user)).then(function (res) {
      var response = angular.fromJson(res).data;
      if (response.success == '1') {
        // Take to home page and show signed in
        console.log("Take me to home page and show signed in!");
      } else {
        // Show error via pop up, for now alert (I have used a much nicer pop up library before I'll have to find it)
        swal("Error!", response.error, "error");
        console.log(response.error);
      }
    },
    function(err) {
      console.log("Login Error :" + err);
    });
  }
});
