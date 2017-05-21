angular.module('myApp').factory('contentService', function ($http, $q) {

  var apiURL = 'api/';
  function standardPost(verb, request)
  {
      var deferred = $q.defer();

      $http.post(apiURL + verb, request)
      .then(deferred.resolve)
      .catch((err)=>{
          deferred.reject(err);
          console.log("Error on POST: " + JSON.stringify(err));
      })
      return deferred.promise;
  }
  return {

        getComments: standardPost.bind(null, "allComments")
        , getPage: standardPost.bind(null, "loadPage")
        , savePage: standardPost.bind(null, "savePage")
        , addComment: standardPost.bind(null,"makeComment")
        , getMyComments: standardPost.bind(null,"mycomments")
        , deleteComment: standardPost.bind(null,"deletecomment")
        , getMyPages: standardPost.bind(null,"mypages")
        , deletePage: standardPost.bind(null,"deletepage")
        , previewHTML: standardPost.bind(null,"previewHTML")
        , changeProfileIcon: standardPost.bind(null,"changeicon")
        , getProfileIcon: standardPost.bind(null,"geticon")
        , getCanvasImage: standardPost.bind(null,"getimage")
        , getAllMyCanvases: standardPost.bind(null,"getallimages")
        , deleteCanvasImage: standardPost.bind(null, "deleteimage")
        , saveCanvasImage: (overwrite, request) => {
              var verb = overwrite ? "update" : "save";
              return standardPost(verb + "image", request);
          }
        , getAllPublicPages:
        (request) => {
          var deferred = $q.defer();
          $http.get(apiURL + "getAllPublicPages")
            .then(function (result) {
                console.log(result)
                deferred.resolve(result.data);
          }, function (error) {
              pages = error;
              deferred.reject(error);
              console.log(error)
          });

          pages = deferred.promise;
          return deferred.promise;
        }
    }
});
