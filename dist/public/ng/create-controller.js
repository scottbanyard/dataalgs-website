angular.module('myApp').controller('createController', ($rootScope, $scope, contentService, $state) => {
  $scope.page = {};
  // https://github.com/inacho/bootstrap-markdown-editor for api
  $('#myEditor').markdownEditor({
    // Activate the preview:
    preview: true,
    code: true,
    /*
        Called when the user click on the preview button. Sends
        the contents of the editing page to the server, where the markdown is
        rendered as html. It then uses the HTML as the contents of the page.
    */
    onPreview: (content, callback) => {

      contentService.previewHTML({token:localStorage.getItem('token'),
                                  content: content}).then((res) => {
        var response = angular.fromJson(res).data;
        if (response.success) {
            var imageTag = new RegExp("{{ image(\\d+) }}",'g');
            response.htmlContent = response.htmlContent.replace(imageTag, (_,id) =>{
                var imageData =response.imageRows.find((x)=>x.Id==id);
                if (imageData) {
                  var {width,height,shapes,_} = JSON.parse(imageData.Shapes);
                  var sta = new CanvasState(width,height,shapes);
                  return sta.imageURL();
                }
                console.log("Failed to get image",id);
                return "";
            });
          callback(response.htmlContent);
        }
      });
    }
  });

  /* Leads a previously created set of markdown*/
  function loadMarkdown()
  {
      contentService.getPage({token:localStorage.getItem('token'),
                              pageID: $state.params.id}).then((res) => {
          var response = angular.fromJson(res).data;
          if (response.success)
          {
              // Puts page information into $scope
              $scope.pageInfo = response;
              $scope.page.Title = angular.copy($scope.pageInfo.page.Title);
              $scope.page.PrivateView = angular.copy($scope.pageInfo.page.PrivateView);
              $scope.page.PrivateEdit = angular.copy($scope.pageInfo.page.PrivateEdit);
              $scope.page.LastEdit = angular.copy($scope.pageInfo.page.LastEdit);
              $scope.page.Views = angular.copy($scope.pageInfo.page.Views);
              // Sets the content of the editor
              $('#myEditor').markdownEditor('setContent', $scope.pageInfo.page.Content);
          }
          else
          {
              $state.go('homePage');
          }
    }, // Don't have the access rights to view page or it doesn't exist, take back to home page. (POST will return 403)
    (err) => $state.go('homePage')
    );
  }

  // Use page ID 0 for new page - if it's not 0, then load markdown of page to
  // edit
  if ($state.params.id != "new-page") {
    loadMarkdown();
  }
  /* Returns the appropriate error for the transgression */
  function getError() {
      // Undefined when new page, blank if deleted from a loaded page
      if (typeof $scope.page.Title == "undefined" || $scope.page.Title == "")
          return "Please fill in the title of the page!";
      else if (typeof $scope.page.PrivateView == "undefined")
          return "Please fill in whether you would like to make the page viewable to the public or private.";
      else if (typeof $scope.page.PrivateEdit == "undefined")
          return "Please fill in whether you would like to make the page editable to the public or private.";
      else if ($("#myEditor").val() == "")
          return "Please add some content to your page!";
      else
          return "";
  }

  // A specific markdown example page
  $scope.goToMarkdownExample = () => $state.go('contentPage', {id: 19});

  /* Save the page to the server*/
  $scope.savePage = () => {
    var error = getError();

    // If error, produce an alert, else proceed to saving page
    if (error != "") {
      swal({
        title: "Error!",
        text: error,
        type: "error"
        }, () => swal.close());
    } else if ($scope.pageInfo != undefined) {
        // Loaded page, so save page with its state.params.id (update the page)
        contentService.savePage(
            { token: localStorage.getItem('token')
            , Title: $scope.page.Title
            , Content: $("#myEditor").val()
            , PrivateView: $scope.page.PrivateView
            , PrivateEdit: $scope.page.PrivateEdit
            , LastEdit: new Date().getTime()
            , Views: $scope.page.Views
            , pageID: $state.params.id
            }).then((res) => {
                swal({
                  html: true,
                  title: "<b>Success!</b>",
                  text: "You have successfully updated your page.",
                  type: "success"
              }, () => swal.close());
        });

      } else {
        // New page, so save with null pageID
        contentService.savePage(
            { token: localStorage.getItem('token')
            , Title: $scope.page.Title
            , Content: $("#myEditor").val()
            , PrivateView: $scope.page.PrivateView
            , PrivateEdit: $scope.page.PrivateEdit
            , LastEdit: new Date().getTime()
            , pageID: null
            }).then((res) => {
                var response = angular.fromJson(res).data;
                if (response.success) {
                  swal({
                    html: true,
                    title: "<b>Success!</b>",
                    text: "You have successfully created a new page.",
                    type: "success"
                    }, () => {
                      swal.close();
                      $state.go('createPage', {id: response.id});
                  });
               }
         });
      }
    }
});
