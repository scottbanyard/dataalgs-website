angular.module('myApp').controller('dashboardController', function($rootScope, $scope, authService, $state) {
    $scope.showChangePWForm = false;
    $scope.showDeleteAccForm = false;
    $scope.showMyComments = false;

    $scope.showOrHidePWForm = function () {
      if ($scope.showChangePWForm) {
        $scope.showChangePWForm = false;
      } else {
        $scope.showChangePWForm = true;
        $scope.showDeleteAccForm = false;
        $scope.showMyComments = false;
      }
    }

    $scope.showOrHideDeleteForm = function () {
      if ($scope.showDeleteAccForm) {
        $scope.showDeleteAccForm = false;
      } else {
        $scope.showDeleteAccForm = true;
        $scope.showChangePWForm = false;
        $scope.showMyComments = false;
      }
    }

    $scope.showOrHideMyComments = function () {
      if ($scope.showMyComments) {
        $scope.showMyComments = false;
      } else {
        $scope.showMyComments = true;
        $scope.showDeleteAccForm = false;
        $scope.showChangePWForm = false;
      }
    }

    $scope.attemptDeleteAccount = function () {
      if ($scope.user.currentPassword == $scope.user.confirmPassword) {
          swal({
            title: "Are you sure?",
            text: "You will not be able to recover your account!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
          },
          // Callback for confirming delete account
            function(){
              authService.deleteAccount({user: $scope.user, token: localStorage.getItem('token')}).then(function (res) {
                var response = angular.fromJson(res).data;
                if (response.success) {
                  // Successfully deleted account
                  $state.go('homePage');
                  $rootScope.$broadcast("userLoggedOut", {});
                  swal({
                    html: true,
                    title: "<b>Success!</b>",
                    text: "You have successfully deleted your account.",
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
                console.log("Delete Account Error :" + err);
              });
          });
      } else {
        swal({
          title: "Error!",
          text: "Please enter the same password in both fields!",
          type: "error"
          },
          function(){
            swal.close();
        });
      }
    }

    $scope.attemptChangePassword = function () {
      if ($scope.user.newPassword == $scope.user.confirmPassword) {
        authService.changePassword({user: $scope.user, token: localStorage.getItem('token')}).then(function (res) {
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
      } else {
        swal({
          title: "Error!",
          text: "Please enter the same new password in both fields!",
          type: "error"
          },
          function(){
            swal.close();
        });
      }
    }

});
