angular.module('myApp').controller('createController', ($rootScope, $scope, contentService, $state) => {
  $scope.page = {};
  // https://github.com/inacho/bootstrap-markdown-editor for api
  $('#myEditor').markdownEditor({
    // Activate the preview:
    preview: true,
    code: true,
    // This callback is called when the user click on the preview button:
    onPreview: function (content, callback) {

      contentService.previewHTML({token:localStorage.getItem('token'),
                                  content: content}).then((res) => {
        var response = angular.fromJson(res).data;
        if (response.success) {
            var scopedImageTag = new RegExp("{{ image(\\d+) }}",'g');
            response.htmlContent = response.htmlContent.replace(scopedImageTag, (_,id) =>{
                var imageData =response.imageRows.find((x)=>x.Id==id);
                if (imageData) {
                  var {width,height,shapes,_} = JSON.parse(imageData.Shapes);
                  var sta = new CanvasState(width,height,shapes);
                  return sta.imageURL();
                }
                console.log("Failed to get image");
                return "";
            });
          callback(response.htmlContent);
        }
      });
    }
  });

  function loadMarkdown() {
      contentService.getPage({token:localStorage.getItem('token'),
                              pageID: $state.params.id}
      ).then((res) => {
          var response = angular.fromJson(res).data;
          if (response.success){
          $scope.pageInfo = response;
          $scope.page.Title = angular.copy($scope.pageInfo.page.Title);
          $scope.page.PrivateView = angular.copy($scope.pageInfo.page.PrivateView);
          $scope.page.PrivateEdit = angular.copy($scope.pageInfo.page.PrivateEdit);
          $scope.page.LastEdit = angular.copy($scope.pageInfo.page.LastEdit);
          $scope.page.Views = angular.copy($scope.pageInfo.page.Views);
          $('#myEditor').markdownEditor('setContent', $scope.pageInfo.page.Content); // Sets the content of the editor
      }
      else {
          $state.go('homePage');
      }
    }, (err) => {
          // Don't have the access rights to view page or it doesn't exist, take back to home page. (POST will return 403)
          $state.go('homePage');
    });
  }

  // Use page ID 0 for new page - if it's not 0, then load markdown of page to edit
  if ($state.params.id != "new-page") {
    loadMarkdown();
  }

  function getError() {
    var error = "";
    // Undefined when new page, blank if deleted from a loaded page
    if (typeof $scope.page.Title == "undefined" || $scope.page.Title == "") {
      error = "Please fill in the title of the page!";
    } else if (typeof $scope.page.PrivateView == "undefined") {
      error = "Please fill in whether you would like to make the page viewable to the public or private.";
    } else if (typeof $scope.page.PrivateEdit == "undefined") {
      error = "Please fill in whether you would like to make the page editable to the public or private.";
    } else if ($("#myEditor").val() == "") {
      error = "Please add some content to your page!";
    }
    return error;
  }

  $scope.savePage = function () {
    var error = getError();

    // If error, produce an alert, else proceed to saving page
    if (error != "") {
      swal({
        title: "Error!",
        text: error,
        type: "error"
        },
        function(){
          swal.close();
      });
    } else {
      // If undefined then it's a new page, otherwise it is a loaded page that you are updating
      if ($scope.pageInfo != undefined) {
        contentService.savePage({ token: localStorage.getItem('token'),
                                  Title: $scope.page.Title,
                                  Content: $("#myEditor").val(),
                                  PrivateView: $scope.page.PrivateView,
                                  PrivateEdit: $scope.page.PrivateEdit,
                                  LastEdit: new Date().getTime(),
                                  Views: $scope.page.Views,
                                  pageID: $state.params.id
                                  }).then((res) => {
                                    swal({
                                      html: true,
                                      title: "<b>Success!</b>",
                                      text: "You have successfully updated your page.",
                                      type: "success"
                                      },
                                      function(){
                                        swal.close();
                                    });
        });

      } else {
        contentService.savePage({ token: localStorage.getItem('token'),
                                  Title: $scope.page.Title,
                                  Content: $("#myEditor").val(),
                                  PrivateView: $scope.page.PrivateView,
                                  PrivateEdit: $scope.page.PrivateEdit,
                                  LastEdit: new Date().getTime(),
                                  pageID: null
                                  }).then((res) => {
                                    swal({
                                      html: true,
                                      title: "<b>Success!</b>",
                                      text: "You have successfully created a new page.",
                                      type: "success"
                                      },
                                      function(){
                                        swal.close();
                                    });
        });
      }
    }
  }
});
