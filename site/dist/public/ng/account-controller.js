angular.module('myApp').controller('accountController', function($scope, authService) {
    $scope.showChangePWForm = false;


    $scope.changePWForm = function () {
      if ($scope.showChangePWForm) {
        $scope.showChangePWForm = false;
      } else {
        $scope.showChangePWForm = true;
      }
    }

    $scope.attemptChangePassword = function () {
      authService.changePassword(JSON.stringify($scope.user)).then(function (res) {
        var response = angular.fromJson(res).data;
        if (response.success) {
          // Take to login page to login with new details
          swal({
            html: true,
            title: "<b>Well done!</b>",
            text: "You have successfully changed your password!",
            type: "success"
            },
            function(){
              swal.close();
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
});
