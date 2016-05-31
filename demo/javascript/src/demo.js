"use strict";

var SeamCarver = require('../../../SeamCarver');
window.image = new Image();
window.canvas = document.querySelector('canvas.image');
window.findSeam = function (ctx) {
	var vseam = smc.findVerticalSeam();
	// draw vertical seam
	for (var y = 0; y < vseam.length; y ++) {
		var x = vseam[y];
		ctx.strokeStyle = "#32cd32";
		ctx.lineWidth = 1;
		ctx.strokeRect(x, y, 1, 1);
	}
	return vseam;
};

window.removeSeam = function (vseam) {
	smc.removeVerticalSeam(vseam);
	smc.reDrawImage();
};

image.onload = function () {
	canvas.width = image.width;
	canvas.height = image.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	window.smc = new SeamCarver(canvas);

	var vseam = findSeam(ctx);

	// TODO: draw energy
	// TODO: redraw image without vseam
};

// image.src = 'images/3x4.png';
// image.src = 'images/6x5.png';
image.src = 'images/70x70.png';
image.src = 'images/chameleon.png';


