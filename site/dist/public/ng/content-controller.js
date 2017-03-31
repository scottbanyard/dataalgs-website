angular.module('myApp')
.controller('contentController',
    ($scope, contentService, $state, $stateParams, jwtHelper) => {

        function getComments(){
            contentService.getComments({ pageID: $state.params.id })
                          .then((res) => {
                              var response = angular.fromJson(res).data;
                              if (response.success){
                                  $scope.comments = response.rows;
                              }
                              else
                                  $scope.comments = [];
                              }
                          );
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
                                      $scope.pageInfo = response;
                                      var content = $scope.pageInfo.htmlContent;
                                      getComments();
                                      if ($scope.pageInfo.page.PrivateEdit == 1) {
                                        // Checks user is logged in (verify JWT) and that they are the creator
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

 // input boxes content
 // htmlContent
