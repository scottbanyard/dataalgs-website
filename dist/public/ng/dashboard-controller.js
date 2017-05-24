angular.module('myApp').controller('dashboardController', function($rootScope, $scope, authService, $state, contentService, jwtHelper) {

    // Initially disable all views of forms and tables
    $scope.showChangePWForm = false;
    $scope.showDeleteAccForm = false;
    $scope.showMyComments = false;
    $scope.showMyPages = false;
    $scope.showChangeIcon = false;
    $scope.showMyImages = false;

    // Setup profile icon selection for when changing profile icon
    $scope.selectedIcons = new Array(6);
    setupSelectedIcons();
    $scope.iconFilenames = ["cat.svg", "bear.svg", "dog.svg", "pattern.svg", "brush.svg", "algorithms.svg"];
    getProfileIcon();

    // Immediately check token expiry date set the welcome page to 'welcome *name*' using token payload.
    var token = localStorage.getItem('token');
    if (token && !jwtHelper.isTokenExpired(token)) {
       var tokenPayload = jwtHelper.decodeToken(token);
       $scope.name = tokenPayload.name + "!";
     } else {
       $scope.name = "";
     }

     // These functions are used for the Angular directive ng-show.
     // Once a option is selected to view, then the rest are set of false viewing with the selected set to true.
     // Functions like getMyImages and getMyComments are also called for the necessary selections.

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

    // This sends a call to the API to delete your account from the database.
    // It initially checks you've entered your confirmation password correctly, and double checks you want
    // to delete your account with a confirmation pop up.
    // The server deals with whether your password is correct, and returns an error message if it is not.
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

    // This sends a call to the API to change your password in the database.
    // This initially checks you've entered the correct confirmation password.
    // The server deals with whether your password is correct according to the database,
    // and returns a message saying whether it successfully changed or not.
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

    // This sends a call to the API asking it for all its canvas images.
    // If successful, it will return a list of objects where each object is an image containing the name, dimensions and shapes.
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

    // This is activated within the My Images table, where the user wants to view their image.
    // It opens up a modal (pop up) showing the image.
    $scope.viewImage = function (index) {
      var current = $scope.myImages[index];
      var {width,height,shapes,_} = JSON.parse(current.Shapes);
      $scope.modalImg = new CanvasState(width,height,shapes).imageURL();
      $scope.currentImage = current.Name;
    }

    // This is activated within the My Images table, where the user wants to edit their image.
    // It will take the user to the Image Editor page whilst passing in the URL the id of the respective image.
    // Upon loading the Image Editor it will detect an id has been supplied and will load that image up ready for editing.
    $scope.editImage = (id) => $state.go('canvasPage', {id : id});

    // This is activated within the My Images table, where the user wants to delete their image.
    // It will ask the user for a confirmation with a pop up whether they actually want to delete it,
    // and if so it will send a call to the API asking it to delete it from the database.
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

    // This sends a call to the API asking for all the user's comments.
    // If successful, it will return a list of objects where each object is a comment.
    // If unsuccessful, it will say there are no comments within the database for that user.
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

    // This is activated to delete a comment from the My Comments table.
    // It first checks whether the user is sure they want to delete their comment
    // with a pop up confirmation, and if accepted it will send a call to the API
    // asking it to delete the comment from the database.
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

    // This initialises all icons to be non-selected each time the page is loaded.
    function setupSelectedIcons() {
      for (var i = 0; i < $scope.selectedIcons.length; i++) {
        $scope.selectedIcons[i] = false;
      }
    }

    // This is called everytime an icon is clicked. It changes the CSS class of the selected
    // icon to indicate it is selected.
    $scope.changeIcon = function(index) {
      $scope.selectedIcons[index] = true;
      for (var i = 0; i < $scope.selectedIcons.length; i++) {
        if (i != index) {
          $scope.selectedIcons[i] = false;
        }
      }
    }

    // This is called when the user wants to save a change to their icon.
    // It checks the selected icons list, which contains bools, to check which
    // icon has been selected. It then sends a call to the API telling it
    // to update the icon for that user in the database.
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

    // This retrieves all of the user's pages from the database by sending a call to
    // the API. It returns a list of objects where each object is a page.
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

    // This retrieves the current user's profile icon by sending a call to the API asking
    // for the object from the database. It will return a string containing the filename
    // of the svg file.
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

    // This is activated in the My Pages table, where the user wants to view their page.
    // It attaches the page ID to the URL when taking the user to the content page, allowing
    // the content page to load up the correct page.
    $scope.takeToPage = function (pageID) {
      $state.go('contentPage', {id: pageID});
    }

    // This is activated in Create section, where the user wants to create a new page.
    // It passes in the URL a string 'new-page' so the create page knows that it doesn't
    // need to load up any pages (same page is used for editing pages).
    $scope.createNewPage = function () {
      $state.go('createPage', {id: "new-page"});
    }

    // This is activated in the Create section, where the user wants to create a new image.
    // It passes in the URL a string 'new-image' so the canvas page knows that it doesn't
    // need to load up any images (same page is used for editing images).
    $scope.createNewImage = function () {
      $state.go('canvasPage', {id: "new-image"});
    }

    // This is called in the My Pages table, where the user wants to delete a certain page.
    // They are first asked for confirmation with a pop up, and if accepted a message is
    // sent to the API asking for the page to be deleted from the database.
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

    // This is called within the My Pages table, where the user wants to edit their page.
    // The ID of the page is passed in the URL so that the create page knows that it needs
    // to load up the relevant page for editing.
    $scope.editPage = function(id) {
      $state.go('createPage', {id: id});
    }
});
