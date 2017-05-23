angular.module('myApp')
.controller('contentController',
    ($scope, $compile, contentService, $state, $stateParams, jwtHelper) => {

    // Uses the CanvasState object to create a URI for an embedded image
    function createImageURL(imageRow)
    {
        var {width,height,shapes,_} = JSON.parse(imageRow.Shapes);
        $scope['image'+imageRow.Id] =
            new CanvasState(width,height,shapes).imageURL();
    }

    /*
        Updates a comment with a rating, as well as sending that rating to be
        stored in the server
    */
    $scope.rateComment = (comment, rating) => {

        contentService.rateComment({token: localStorage.getItem('token'), commentID: comment.CommentID, rating: rating + comment.Rating}).then((res) => {
          var response = angular.fromJson(res).data;
          if (response.success) {
            getComments();
          }
        });
    }
    // Gets all the comments for the page
    function getComments(){
        contentService.getComments({ pageID: $state.params.id }).then((res) => {
             var response = angular.fromJson(res).data;
             if (response.success)
             {
                 $scope.comments = response.rows;
             }
             else
                 $scope.comments = [];
         });
    }

    $scope.makeComment = function() {
        if( "undefined" !== typeof $scope.newComment ){
            var commentRequest = { token:localStorage.getItem('token')
                                 , comment: $scope.newComment
                                 , time: new Date().getTime()
                                 , pageID: $state.params.id };
            contentService.addComment( commentRequest ).then((res) => {
                if (response.success) {
                    swal({
                      html: true,
                      title: "<b>Success!</b>",
                      text: "You have successfully made a comment.",
                      type: "success"
                  }, () => swal.close());
                  }
                }, (err) => {
                      swal({
                        title: "Error!",
                        text: "Please make sure you login to make a comment.",
                        type: "error"
                        }, () => swal.close());
                });
              // Reset the form object
              $scope.newComment = {};
              // Set back to pristine.
              $scope.commentForm.$setPristine();
              // Since Angular 1.3, set back to untouched state.
              $scope.commentForm.$setUntouched();
              getComments();
          }
      }

    /*
        Gets all the data for the page, including the rendered markup. If there
        are any images, causes each to be rendered using the createImageURL
        helper.
    */
    contentService.getPage({token:localStorage.getItem('token'),
                            pageID: $state.params.id}
          ).then((res) => {
              var response = angular.fromJson(res).data;
              if (response.success){
                  if (response.imageRows) {
                    response.imageRows.map(createImageURL);
                  }
                  $scope.pageInfo = response;
                  $scope.pageTitle = $scope.pageInfo.page.Title;

                  getComments();
                  if ($scope.pageInfo.page.PrivateEdit == 1) {
                    // Checks user is logged in and that they are the creator
                    var token = localStorage.getItem('token');
                    if (token && !jwtHelper.isTokenExpired(token)) {
                      var userID = jwtHelper.decodeToken(token).userID;
                      if (userID == $scope.pageInfo.page.Creator) {
                        $scope.showEditButton = true;
                      } else {
                        $scope.showEditButton = false;
                      }
                    }
                  } else {
                    // Public to edit so show edit button
                    $scope.showEditButton = true;
                  }
              } else {
                  $state.go('homePage');
              }
    }, (err) => {
          // Don't have the access rights to view page or it doesn't exist, take back to home page. (POST will return 403)
          $state.go('homePage');
    });

    $scope.editPage = function() {
      $state.go('createPage', {id:$scope.pageInfo.page.Id})
    }

});

// taken from http://stackoverflow.com/questions/17417607/angular-ng-bind-html-and-directive-within-it
  // declare a new module, and inject the $compileProvider
angular.module('myApp')
  .directive('compile', ['$compile', function ($compile) {
      return function(scope, element, attrs) {
          scope.$watch(
            function(scope) {
               // watch the 'compile' expression for changes
              return scope.$eval(attrs.compile);
            },
            function(value) {
              // when the 'compile' expression changes
              // assign it into the current DOM
              element.html(value);

              // compile the new DOM and link it to the current
              // scope.
              // NOTE: we only compile .childNodes so that
              // we don't get into infinite loop compiling ourselves
              $compile(element.contents())(scope);
            }
        );
    };
}]);
