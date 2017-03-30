angular.module('myApp')
.controller('canvasController',
    ( $scope ) => {
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        canvas.onclick = newShape;

        var colourCanvas = document.getElementById('grad');
        var colourContext = colourCanvas.getContext('2d');


        var colImg = new Image();
        colImg.onload = () => {
            colourCanvas.width = colImg.width;
            colourCanvas.height = colImg.height;
            colourContext.drawImage(colImg, 0, 0, colImg.width, colImg.height);
        }
        colImg.src = "imgs/colours.png";

        colourCanvas.onclick = (event) => {
            $scope.$apply(() => {
                var col = currentColour(event);
                $scope.cssColour = rgbCSS(col);
                $scope.colour = rgb(col);
            })
        };
        colourCanvas.onmousemove = (event) => {
            $scope.$apply(() => $scope.selected = rgbCSS(currentColour(event)));
        };

        var canvasState = new CanvasState();

        $scope.title = "Canvas controller";
        $scope.colour = {red : 122, green:122, blue:122};
        $scope.cssColour = "rgb(122,122,122)";
        $scope.selected = "white";
        $scope.shape = 'Circle';
        function getMousePosition(event)
        {
            var rect = canvas.getBoundingClientRect();
            return {
                x: Math.round((event.clientX-rect.left)
                            /(rect.right-rect.left)*canvas.width),
                y: Math.round((event.clientY-rect.top)
                            /(rect.bottom-rect.top)*canvas.height)
            }
        }

        function newShape(event)
        {
            var coords = getMousePosition(event);
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

        function redrawAll(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvasState.getShapes().map(drawShape);
        }

        function currentColour(event){
            var x = event.layerX;
            var y = event.layerY;
            return colourContext.getImageData(x, y, 1, 1).data;
        }
        function rgb(data)
        {
            return {red : data[0], green :data[1], blue : data[2]};
        }
        function rgbCSS(data)
        {
            return ['rgb(',')'].join(data.slice(0,3).join(','));
        }
});
