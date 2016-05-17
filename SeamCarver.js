"use strict";

class SeamCarver {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.picture = [];
        var context = canvas.getContext("2d");
        for (var y = 0; y < this.height; y ++) {
            for (var x = 0; x < this.width; x ++) {
                var color = context.getImageData(x, y, 1, 1).data;
                var rgb = this.rgbToNum(color[0], color[1], color[2]);
                this.picture[this.pixelToIndex(x, y)] = rgb;
            }
        }
    }

    pixelToIndex(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new java.lang.IndexOutOfBoundsException();
        }
        return (y * this.width) + x;
    }

    indexToX(index) {
        return index % this.width;
    }

    indexToY(index) {
        return index / this.width;
    }


    rgbToNum(red, green, blue) {
        var rgb = red;
        rgb = (rgb << 8) + green;
        rgb = (rgb << 8) + blue;
        return rgb;
    }

    numToRgb(num) {
        var red = (rgb >> 16) & 0xFF;
        var green = (rgb >> 8) & 0xFF;
        var blue = rgb & 0xFF;
        return [red, green, blue];
    }


}

module.exports = SeamCarver;
