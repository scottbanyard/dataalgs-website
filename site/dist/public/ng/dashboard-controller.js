angular.module('myApp').controller('dashboardController', function($rootScope, $scope, authService, $state, contentService) {
    $scope.showChangePWForm = false;
    $scope.showDeleteAccForm = false;
    $scope.showMyComments = false;
    $scope.showMyPages = false;

    $scope.showOrHidePWForm = function () {
      if ($scope.showChangePWForm) {
        $scope.showChangePWForm = false;
      } else {
        $scope.showChangePWForm = true;
        $scope.showMyPages = false;
        $scope.showDeleteAccForm = false;
        $scope.showMyComments = false;
      }
    }

    $scope.showOrHideDeleteForm = function () {
      if ($scope.showDeleteAccForm) {
        $scope.showDeleteAccForm = false;
      } else {
        $scope.showDeleteAccForm = true;
        $scope.showMyPages = false;
        $scope.showChangePWForm = false;
        $scope.showMyComments = false;
      }
    }

    $scope.showOrHideMyComments = function () {
      if ($scope.showMyComments) {
        $scope.showMyComments = false;
      } else {
        $scope.getMyComments();
        $scope.showMyComments = true;
        $scope.showMyPages = false;
        $scope.showDeleteAccForm = false;
        $scope.showChangePWForm = false;
      }
    }

    $scope.showOrHideMyPages = function () {
      if ($scope.showMyPages) {
        $scope.showMyPages = false;
      } else {
        $scope.getMyPages();
        $scope.showMyPages = true;
        $scope.showMyComments = false;
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

    $scope.getMyComments = function () {
      contentService.getMyComments({token : localStorage.getItem('token')}).then(function (res) {
        var response = angular.fromJson(res).data;
        if (response.success) {
          $scope.myComments = response.comments;
          $scope.noComments = false;
          $scope.numberOfComments = response.comments.length;
        } else {
          console.log(response.error);
          $scope.noComments = true;
          $scope.noCommentsError = response.error;
        }
      });
    }

    $scope.confirmDeleteComment = function (commentID) {
      swal({
        title: "Are you sure you want to delete this comment?",
        text: "You will not be able to recover this!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        closeOnConfirm: false
      },
      // Callback for confirming delete comment
        function(){
          contentService.deleteComment({commentID: commentID, token: localStorage.getItem('token')}).then(function (res) {
            var response = angular.fromJson(res).data;
            if (response.success) {
              // Successfully deleted comment so refresh comments
              $scope.getMyComments();
              swal({
                html: true,
                title: "<b>Success!</b>",
                text: "You have successfully deleted that comment.",
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
    }

    $scope.getMyPages = function () {
      contentService.getMyPages({token : localStorage.getItem('token')}).then(function (res) {
        var response = angular.fromJson(res).data;
        if (response.success) {
          $scope.myPages = response.pages;
          $scope.noPages = false;
          $scope.numberOfPages = response.pages.length;
        } else {
          console.log(response.error);
          $scope.noPages = true;
          $scope.noPagesError = response.error;
        }
      });
    }

    $scope.takeToPage = function (pageID) {
      $state.go('contentPage', {id: pageID});
    }

    $scope.createNewPage = function () {
      $state.go('createPage', {id: "new-page"});
    }

    $scope.confirmDeletePage = function (pageID, pageTitle) {
      swal({
        title: "Are you sure you want to delete this page?",
        text: "You will not be able to recover this!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        closeOnConfirm: false
      },
      // Callback for confirming delete page
        function(){
          contentService.deletePage({pageID: pageID, token: localStorage.getItem('token')}).then(function (res) {
            var response = angular.fromJson(res).data;
            if (response.success) {
              // Successfully deleted page so refresh comments
              $scope.getMyPages();
              swal({
                html: true,
                title: "<b>Success!</b>",
                text: "You have deleted the page '" + pageTitle + "'.",
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
    }

    $scope.editPage = function(id) {
      $state.go('createPage', {id: id});
    }
});
