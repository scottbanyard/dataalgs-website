angular.module('myApp').controller('authController', ($rootScope, $scope, authService, $state) => {
    /*
        Attempts to register a new user, before redirecting them to the login
        page if their registration was successful
    */
  $scope.registerPerson = function() {
    authService.tryRegister(JSON.stringify($scope.user)).then(function (res) {
      var response = angular.fromJson(res).data;
      if (response.success) {
        // Take to login page to login with new details
        swal({
          html: true,
          title: "<b>Welcome " + $scope.user.firstName + "!</b>",
          text: "You have successfully registered!<br/>You will now be taken to the login page.",
          type: "success"
          },
          function(){
            swal.close();
            $state.go('loginPage');
        });
      } else {
        swal({
          title: "Error!",
          text: response.error,
          type: "error"
          },
          function(){
            swal.close();
        });
        console.log(response.error);
      }
  }, (err) => console.log("Registration Error :" + err));
  }
  // Attempt to log in a user
  $scope.loginPerson = function() {
    authService.tryLogin(JSON.stringify($scope.user)).then(function (res) {
      var response = angular.fromJson(res).data;
      if (response.success) {
        // Send message to navController to tell it user has logged in
        $rootScope.$broadcast("userLoggedIn", {});
        $state.go('homePage');
        localStorage.setItem('token', response.token);
      } else {
        // Show error via pop up, for now alert (I have used a much nicer pop up library before I'll have to find it)
        swal({
          title: "Error!",
          text: response.error,
          type: "error"
          },
          function(){
            swal.close();
        });
        console.log(response.error);
      }
  }, (err) => console.log("Login Error :" + err));
  }
});
