"use strict";

var SeamCarver = require('../../../SeamCarver');
var image = new Image();
var canvas = document.querySelector('canvas.image');
image.onload = function () {
	canvas.width = image.width;
	canvas.height = image.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	var smc = new SeamCarver(canvas);

	var vseam = smc.findVerticalSeam();
	console.log(vseam);

	// draw vertical seam
	for (var y = 0; y < vseam.length; y ++) {
		var x = vseam[y];
		ctx.strokeStyle = "#32cd32";
		ctx.strokeRect(x, y, 1, 1);
	}

	smc.removeVerticalSeam(vseam);

	// TODO: draw energy
	// TODO: redraw image without vseam
};

// image.src = 'images/6x5.png';
// image.src = 'images/70x70.png';
image.src = 'images/chameleon.png';


