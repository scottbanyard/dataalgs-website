angular.module('myApp')
.controller('contentController',
    ($scope, $compile, contentService, $state, $stateParams, jwtHelper) => {
    function getComments(){
        contentService.getComments({ pageID: $state.params.id })
            .then((res) => {
                var response = angular.fromJson(res).data;
                if (response.success){
                   $scope.comments = response.rows;
                }
                else
                  $scope.comments = [];
          });
    }

    function createImageURL(imageRow)
    {
        var {width,height,shapes,_} = JSON.parse(imageRow.Shapes);
        $scope['image'+imageRow.Id] =
            new CanvasState(width,height,shapes).imageURL();
    }

        $scope.makeComment = function() {
            if( "undefined" !== typeof $scope.newComment ){
                contentService.addComment({ token:localStorage.getItem('token'),
                                            comment: $scope.newComment,
                                            time: new Date().getTime(),
                                            pageID: $state.params.id});
                getComments();
            }
        }
        contentService.getPage({token:localStorage.getItem('token'),
                                  pageID: $state.params.id}
          ).then((res) => {
              var response = angular.fromJson(res).data;
              if (response.success){
                  response.imageRows.map(createImageURL);
                  console.log(response.htmlContent, $scope.image14);
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

    }

);

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
