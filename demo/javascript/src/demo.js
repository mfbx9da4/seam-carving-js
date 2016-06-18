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
	smc.reDrawImage('energy');
};

image.onload = function () {
	canvas.width = image.width;
	canvas.height = image.height;
	window.ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	window.smc = new SeamCarver(canvas);

	var iteration = 0;

	var iterate = function () {
		var vseam = findSeam(ctx);
		setTimeout(function () {
			removeSeam(vseam)
			iteration++;
			console.info(iteration);
			if (iteration < 1000) {
				iterate();
			}
		}, 0);
	}
	iterate();

	// TODO: draw energy
};

// image.src = 'images/3x4.png';
// image.src = 'images/6x5.png';
image.src = 'images/70x70.png';
image.src = 'images/chameleon.png';
image.src = 'images/HJocean.png';


