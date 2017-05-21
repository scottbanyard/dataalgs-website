angular.module('myApp')
.controller('canvasController',
    ( $scope, contentService ) => {
    // Main drawing canvas
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    // Colour picker, implemented by drawing an image on the
    var colourCanvas = document.getElementById('grad');
    var colourContext = colourCanvas.getContext('2d');

    // Filled whenever there is text input
    var openInput;

    var colImg = new Image();
    colImg.onload = () => {
        colourContext.drawImage(colImg,
                                0, 0, // top left
                                colourCanvas.width, colourCanvas.height);
    }
    colImg.src = "imgs/colours.png";

    // The actually selected colour that will be used when drawing the shapes
    colourCanvas.onclick = (event) => {
        $scope.$apply(() => {
            var col = currentColour(event);
            $scope.cssColour = rgbCSS(col);
            $scope.colour = rgb(col);
        })
    };
    // Used as a label so that the user can see more easily what they are choosing
    colourCanvas.onmousemove = (event) => {
        $scope.$apply(() => $scope.selected = rgbCSS(currentColour(event)));
    };
    // Keeps track of the shapes on the canvas
    var canvasState = new CanvasState(canvas.width,canvas.height);

    $scope.colour = {red : 122, green:122, blue:122};
    $scope.cssColour = "rgb(122,122,122)";
    $scope.selected = "white";
    $scope.shape = 'Circle';

    //Modified from a stackoverflow response. Adjusts the information about the clicked point into the canvas frame of reference
    function getMousePosition(thisCanvas,event)
    {
        var rect = thisCanvas.getBoundingClientRect();
        return {
            x: 0.5+Math.round((event.clientX-rect.left)
                        /(rect.right-rect.left)*thisCanvas.width),
            y: 0.5+Math.round((event.clientY-rect.top)
                        /(rect.bottom-rect.top)*thisCanvas.height)
        }
    }
    function dealWithText(shape,x){
        /* Shifts the rendered text in line with the textbox. Constants
           need to change if the number of pixels in the image or the font
           size changes*/
        shape.centre.y+=22;
        shape.centre.x+=7;
        shape.contents = x.target.value;
        shape.font   = "16pt Arial"
        shape.offset = parseInt(shape.font);
        shape.width  = context.measureText(x.target.value).width;
        canvasState.addShape(shape);
        openInput.destroy();
        openInput = undefined;
        canvasState.redrawAll(context);
    }
    function getBasicShape(coords)
    {
        return { kind:angular.copy($scope.shape),
                      centre:coords,
                      colour:angular.copy($scope.colour)};
    }
    // Based on the selection of shape, and the colour, adds a new shape to the CanvasState and orders a redraw.
    function newShape(event)
    {
        var coords = getMousePosition(canvas, event);
        var shape = getBasicShape(coords)
        switch ($scope.shape) {
            case 'Circle':
                shape.radius = 25;
                break;
            case 'Rectangle':
                shape.width = 50;
                shape.height = 50;
                break;
            case 'Text':
                if("undefined" != typeof openInput){
                    openInput.destroy();
                    canvasState.redrawAll(context);
                }
                openInput = new CanvasInput({
                    canvas : canvas,
                    x : coords.x,
                    y : coords.y,
                    fontSize : 20,
                    onsubmit : dealWithText.bind(null, shape)
                });
                openInput.focus();
            default:
               return;
        }
        canvasState.addShape(shape);
        canvasState.redrawAll(context);
    }

    // Returns the colour under the mouse when on the colour palette
    function currentColour(event){
        var coords = getMousePosition(colourCanvas,event);
        return colourContext.getImageData(coords.x, coords.y, 1, 1).data;
    }
    // Translates the raw colour data retrieved from the mouse into a red,green,blue format
    function rgb(data)
    {
        return {red : data[0], green :data[1], blue : data[2]};
    }
    // Translates from raw data into css
    function rgbCSS(data)
    {
        return ['rgb(',')'].join(data.slice(0,3).join(','));
    }
    /* Functions dealing with dragging shapes or drawing arrows */
    var hasHappened = false;
    var clk;
    canvas.onmousedown = (event) => {
        var startEvent = event;
        clk = setTimeout(() => {
            hasHappened = true;
            var coords = getMousePosition(canvas, startEvent);
            var isArrow = $scope.shape == 'Arrow';
            if($scope.shape == 'Line' || isArrow){
                var coords = getMousePosition(canvas, event);
                canvasState.createAndSelectLine(getBasicShape(coords), isArrow);
            }
            else
                canvasState.setSelectedShape(coords);
        },200);
    };
    canvas.onmousemove = (event) => {
        if( hasHappened ){
            canvasState.moveShape(getMousePosition(canvas, event));
            canvasState.redrawAll(context);
        }
    }
    canvas.onmouseup = (event) =>{
        clearTimeout(clk);
        canvasState.deselectShape()
        if( !hasHappened ){
            isClick = true;
            newShape(event);
        }
        else{
            canvasState.redrawAll(context);
        }
        hasHappened = false;
    };

    $scope.downloadCanvasImage = () => {
          var hiddenLink = document.createElement('a');
          if ($scope.name != "" || $scope.name != undefined) {
            hiddenLink.download = $scope.name + ".png";
          } else {
            hiddenLink.download = "Image.png";
          }
          hiddenLink.href = canvas.toDataURL();
          hiddenLink.click();
    }
    // Successful swal used to indicate a particular action (verb) has succeeded
    function successSwal(verb)
    {
        swal({
          html: true,
          title: "<b>Success!</b>",
          text: "You have successfully " + verb + " your image as <b> " + $scope.name + "</b>.",
          type: "success" }, () => swal.close());
    }
    // Generic error Swallow
    function errSwal(response)
    {
        swal({ title: "Error!",
               text: "There has been an error! Please try again.",
               type: "error" }, () =>swal.close());
        console.log(response.error);
    }
    // Crucial information to save a canvas
    function getSaveState()
    {
        var dimensions = { width : canvasState.width,
                           height : canvasState.height};
        return {
            token: localStorage.getItem('token'),
            name: $scope.name,
            shapes: JSON.stringify(canvasState),
            dimensions: JSON.stringify(dimensions)};
    }
    // Queries user as to whether they wish to overwrite a previous image
    // Upon 'confirm', overwrites the image
    function overwriteDialogue()
    {
        swal({
          title: "Overwrite?",
          text: "You have already created an image with this name!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, overwrite it!",
          closeOnConfirm: false
      }, () => contentService.saveCanvasImage(true, getSaveState())
              .then((res) => {
                  var response = angular.fromJson(res).data;
                  if (response.success)
                      successSwal("overwritten");
                  else
                      errSwal(response);
        }));
    }

    $scope.saveCanvasImage = () => {
        if ($scope.name == "" || $scope.name == undefined) {
          swal({
            html: true,
            title: "<b>Oops!</b>",
            text: "Please make sure you give your image a name in the text box above.",
            type: "warning"
            }, () => swal.close());
        } else {
          contentService.saveCanvasImage(false, getSaveState()).then((res) => {
              var response = angular.fromJson(res).data;
              if (response.success) {
                  successSwal("saved");
              } else if (response.canvas_exists) {
                  overwriteDialogue();
              } else {
                  errSwal(response);
              }
          });
        }
    }

    $scope.getCanvasImage = () => {
      $scope.canvasID = 4;
      contentService.getCanvasImage({ token: localStorage.getItem('token'), canvasID: $scope.canvasID }).then((res) => {
        var response = angular.fromJson(res).data;
        if (response.success) {
          console.log(response.canvas.Shapes);
        }
      });
    }

    $scope.getAllMyCanvases = () => {
      contentService.getAllMyCanvases({token: localStorage.getItem('token')}).then((res) => {
        var response = angular.fromJson(res).data;
        if (response.success) {
          console.log(response.canvases);
        }
      });
        console.log(JSON.stringify(canvasState));
    }

});
