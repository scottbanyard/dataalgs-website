angular.module('myApp').controller('authController', ($scope, authService, $state) => {

  $scope.registerPerson = function() {
    authService.tryRegister(JSON.stringify($scope.user)).then(function (res) {
      var response = angular.fromJson(res).data;
      if (response.success) {
        // Take to login page to login with new details
        swal({
          html:true,
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
    },
    function(err) {
      console.log("Register Error :" + err);
    });
  }

  $scope.loginPerson = function() {
    authService.tryLogin(JSON.stringify($scope.user)).then(function (res) {
      var response = angular.fromJson(res).data;
      if (response.success) {
        $state.go('homePage');
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
    },
    function(err) {
      console.log("Login Error :" + err);
    });
  }
});
