"use strict";

var SeamCarver = require('../../../SeamCarver');
window.image = new Image();
window.canvas = document.querySelector('canvas.image');
window.findSeam = function () {
    var vseam = smc.findVerticalSeam();

    if (window.shouldPaintSeam) {
        // draw vertical seam
        for (var y = 0; y < vseam.length; y ++) {
            var x = vseam[y];
            window.ctx.strokeStyle = "#32cd32";
            window.ctx.lineWidth = 1;
            window.ctx.strokeRect(x, y, 1, 1);
        }
    }
    return vseam;
};

window.removeSeam = function (vseam) {
    smc.removeVerticalSeam(vseam);
    smc.reDrawImage();
};

image.onload = function () {
    var originalWidth = image.width;
    canvas.width = image.width;
    canvas.height = image.height;
    window.ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    window.smc = new SeamCarver(canvas);
    window.shouldPaintSeam = true;

    var iterate = function () {
        var seam = findSeam();
        setTimeout(function () {
            removeSeam(seam);
            if (canvas.width > image.width * 0.6) {
                iterate();
            }
        }, 0);
    }
    iterate();

    // TODO: draw energy
};

image.setAttribute('crossOrigin', '');
image.crossOrigin = "Anonymous";
// image.src = 'images/3x4.png';
// image.src = 'images/6x5.png';
image.src = 'images/70x70.png';
image.src = 'images/chameleon.png';
image.src = 'images/HJocean.png';
image.src = 'images/IMG_4445.jpg';
image.src = 'images/white_building_in_field_by_mslash67.jpg';


