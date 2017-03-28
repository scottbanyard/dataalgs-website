angular.module('myApp')
.controller('canvasController',
    ( $scope ) => {
        $scope.title = "Canvas controller";

    $scope.shape = 'Circle';
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    canvas.addEventListener("click", drawShape, false);

    function getMousePosition(event){
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((event.clientX-rect.left)
                        /(rect.right-rect.left)*canvas.width),
            y: Math.round((event.clientY-rect.top)
                        /(rect.bottom-rect.top)*canvas.height)
        }
    }

    function drawShape(event)
    {
        var coords = getMousePosition(event);
        context.beginPath();

        if($scope.shape == 'Circle')
            context.arc(coords.x, coords.y, 15, 0, 2*Math.PI);
        else if($scope.shape == 'Square'){
            context.rect(coords.x-7, coords.y-7, 15, 15);
        }

        context.stroke();
        context.closePath();
    }
});
