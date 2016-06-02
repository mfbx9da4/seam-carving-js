var Canvas = require('canvas');

module.exports = function convertImageToCanvas(image) {
    var canvas = new Canvas(image.width, image.height);
    canvas.getContext("2d").drawImage(image, 0, 0);
    return canvas;
};
