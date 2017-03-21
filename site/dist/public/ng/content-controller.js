angular.module('myApp')
.controller('contentController',
    ($scope, contentService) => {
        function getComments(){
            contentService.getComments({ pageID:1 })
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
        getComments();

        $scope.makeComment = function(){
            // TODO: don't allow if not logged in
            contentService.addComment( { token:localStorage.getItem('token'),
                                         comment: $scope.newComment} );
            getComments();
        }
    });
