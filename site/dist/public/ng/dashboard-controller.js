angular.module('myApp').controller('dashboardController', function($rootScope, $scope, authService, $state, contentService, jwtHelper) {
    $scope.showChangePWForm = false;
    $scope.showDeleteAccForm = false;
    $scope.showMyComments = false;
    $scope.showMyPages = false;
    $scope.showChangeIcon = false;
    $scope.showMyImages = false;
    $scope.selectedIcons = new Array(6);
    setupSelectedIcons();
    $scope.iconFilenames = ["cat.svg", "bear.svg", "dog.svg", "pattern.svg", "brush.svg", "algorithms.svg"];
    getProfileIcon();

    var token = localStorage.getItem('token');
    if (token && !jwtHelper.isTokenExpired(token)) {
       var tokenPayload = jwtHelper.decodeToken(token);
       $scope.name = tokenPayload.name + "!";
     } else {
       $scope.name = "";
     }

     $scope.showOrHideMyImages = function () {
       if ($scope.showMyImages) {
         $scope.showMyImages = false;
       } else {
         $scope.getMyImages();
         $scope.showMyImages = true;
         $scope.showChangePWForm = false;
         $scope.showMyPages = false;
         $scope.showDeleteAccForm = false;
         $scope.showMyComments = false;
         $scope.showChangeIcon = false;
       }
     }

    $scope.showOrHidePWForm = function () {
      if ($scope.showChangePWForm) {
        $scope.showChangePWForm = false;
      } else {
        $scope.showChangePWForm = true;
        $scope.showMyPages = false;
        $scope.showDeleteAccForm = false;
        $scope.showMyComments = false;
        $scope.showChangeIcon = false;
        $scope.showMyImages = false;
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
        $scope.showMyImages = false;
        $scope.showChangeIcon = false;
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
        $scope.showMyImages = false;
        $scope.showChangeIcon = false;
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
        $scope.showChangeIcon = false;
        $scope.showMyImages = false;
        $scope.showChangePWForm = false;
      }
    }

    $scope.showOrHideChangeIcon = function () {
      if ($scope.showChangeIcon) {
        $scope.showChangeIcon = false;
      } else {
        $scope.showChangeIcon = true;
        $scope.showMyPages = false;
        $scope.showMyComments = false;
        $scope.showDeleteAccForm = false;
        $scope.showMyImages = false;
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

    $scope.getMyImages = function () {
      contentService.getAllMyCanvases({token : localStorage.getItem('token')}).then(function (res) {
        var response = angular.fromJson(res).data;
        if (response.success) {
          $scope.myImages = response.canvases;
          $scope.noImages = false;
          $scope.numberOfImages = response.canvases.length;
        } else {
          console.log(response.error);
          $scope.noImages = true;
          $scope.noImagesError = response.error;
        }
      });
    }

    $scope.viewImage = function (index) {
      var current = $scope.myImages[index];
      var {width,height,shapes,_} = JSON.parse(current.Shapes);
      $scope.modalImg = new CanvasState(width,height,shapes).imageURL();
      $scope.currentImage = current.Name;
    }
    $scope.editImage = function(canvasID) {
      $state.go('canvasPage', {id: canvasID});
    }

    $scope.confirmDeleteImage = function (canvasID) {
      swal({
        title: "Are you sure you want to delete this image?",
        text: "You will not be able to recover this!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        closeOnConfirm: false
      },
      // Callback for confirming delete comment
        function(){
          contentService.deleteCanvasImage({canvasID: canvasID, token: localStorage.getItem('token')}).then(function (res) {
            var response = angular.fromJson(res).data;
            if (response.success) {
              // Successfully deleted comment so refresh comments
              $scope.getMyImages();
              swal({
                html: true,
                title: "<b>Success!</b>",
                text: "You have successfully deleted that image.",
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

    function setupSelectedIcons() {
      for (var i = 0; i < $scope.selectedIcons.length; i++) {
        $scope.selectedIcons[i] = false;
      }
    }

    $scope.changeIcon = function(index) {
      $scope.selectedIcons[index] = true;
      for (var i = 0; i < $scope.selectedIcons.length; i++) {
        if (i != index) {
          $scope.selectedIcons[i] = false;
        }
      }
    }

    $scope.saveChangeIcon = function() {
      var index = -1;
      for (var i = 0; i < $scope.selectedIcons.length; i++) {
        if ($scope.selectedIcons[i]) {
          index = i;
        }
      }
      if (index != -1) {
        contentService.changeProfileIcon({token : localStorage.getItem('token'), icon: $scope.iconFilenames[index]}).then(function (res) {
          var response = angular.fromJson(res).data;
          if (response.success) {
            getProfileIcon();
            swal({
              html: true,
              title: "<b>Success!</b>",
              text: "You have successfully changed your profile icon.",
              type: "success"
              },
              function(){
                swal.close();
            });
          }
        })
      }
    }

    $scope.getMyPages = function () {
      contentService.getMyPages({token : localStorage.getItem('token')}).then(function (res) {
        var response = angular.fromJson(res).data;
        if (response.success) {
          $scope.myPages = response.pages;
          $scope.noPages = false;
          $scope.numberOfPages = response.pages.length;
        } else {
          // console.log(response.error);
          $scope.noPages = true;
          $scope.noPagesError = response.error;
        }
      });
    }

    function getProfileIcon() {
      contentService.getProfileIcon({token: localStorage.getItem('token')}).then(function (res) {
        var response = angular.fromJson(res).data;
        if (response.success) {
          $scope.myIcon = response.icon;
        } else {
          $scope.myIcon = "man.svg"; // default icon
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
