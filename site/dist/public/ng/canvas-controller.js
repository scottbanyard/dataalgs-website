angular.module('myApp')
.controller('canvasController',
    ( $scope ) => {
        // Main drawing canvas
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        canvas.onclick = newShape;

        // Colour picker, implemented by drawing an image on the
        var colourCanvas = document.getElementById('grad');
        var colourContext = colourCanvas.getContext('2d');


        var colImg = new Image();
        colImg.onload = () => {
            // colourCanvas.width = colImg.width;
            // colourCanvas.height = colImg.height;
            colourContext.drawImage(colImg, 0, 0, colourCanvas.width, colourCanvas.height);
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
        var canvasState = new CanvasState();

        $scope.title = "Canvas controller";
        $scope.colour = {red : 122, green:122, blue:122};
        $scope.cssColour = "rgb(122,122,122)";
        $scope.selected = "white";
        $scope.shape = 'Circle';

        //Modified from a stackoverflow response. Adjusts the information about the clicked point into the canvas frame of reference
        function getMousePosition(thisCanvas,event)
        {
            var rect = thisCanvas.getBoundingClientRect();
            return {
                x: Math.round((event.clientX-rect.left)
                            /(rect.right-rect.left)*thisCanvas.width),
                y: Math.round((event.clientY-rect.top)
                            /(rect.bottom-rect.top)*thisCanvas.height)
            }
        }

        // Based on the selection of shape, and the colour, adds a new shape to the CanvasState and orders a redraw.
        function newShape(event)
        {
            var coords = getMousePosition(canvas, event);
            var shape = { kind:angular.copy($scope.shape),
                          centre:coords,
                          colour:angular.copy($scope.colour)};
            if($scope.shape == 'Circle'){
                shape.radius = Math.round(7);
                canvasState.addShape(shape);
            }
            else if($scope.shape == 'Rectangle'){
                shape.width = 15;
                shape.height = 15;
                canvasState.addShape(shape);
            }
            redrawAll();
        }

        // Draws a single chape onto the canvas
        function drawShape(shape)
        {
            context.strokeStyle=toCSSColour(shape.colour);
            context.beginPath();
            var coords = shape.centre;
            if(shape.kind == 'Circle'){
                context.arc(coords.x, coords.y, shape.radius, 0, 2*Math.PI);
            }
            else if(shape.kind == 'Rectangle'){
                context.rect(coords.x-7, coords.y-7, shape.width, shape.height);
            }

            context.stroke();
            context.closePath();
        }

        // Retrieves all shapes from the canvasState and redraws them
        function redrawAll(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvasState.getShapes().map(drawShape);
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
});
