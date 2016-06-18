"use strict";

window.demo = {};
var demo = window.demo;
demo.config = {
	drawField: 'vminsum',
	seamColor: "#32cd32",
	autoIterations: 0
};
var SeamCarver = require('../../../SeamCarver');
demo.image = new Image();
demo.canvas = document.querySelector('canvas.image');
demo.findSeam = function (ctx) {
	var vseam = demo.smc.findVerticalSeam();
	// draw vertical seam
	for (var y = 0; y < vseam.length; y ++) {
		var x = vseam[y];
		demo.ctx.strokeStyle = demo.config.seamColor;
		demo.ctx.lineWidth = 1;
		demo.ctx.strokeRect(x, y, 1, 1);
	}
	return vseam;
};

demo.removeSeam = function (vseam) {
	demo.smc.removeVerticalSeam(vseam);
	demo.smc.reDrawImage(demo.config.drawField);
};

var iteration = 0;

var iterate = function () {
	var vseam = demo.findSeam(demo.ctx);
	setTimeout(function () {
		demo.removeSeam(vseam)
		iteration++;
		if (iteration < demo.config.autoIterations) {
			iterate();
		}
	}, 0);
};

demo.image.onload = function () {
	demo.canvas.width = demo.image.width;
	demo.canvas.height = demo.image.height;
	demo.ctx = demo.canvas.getContext("2d");
	demo.ctx.drawImage(demo.image, 0, 0);
	demo.smc = new SeamCarver(demo.canvas);
	// iterate();
};

demo.canvas.addEventListener('click', function (event) {
	iterate();
});

demo.reDraw = function (field) {
	demo.config.drawField = field;
	demo.smc.reDrawImage(field);
}

// demo.image.src = 'images/3x4.png';
// demo.image.src = 'images/6x5.png';
// demo.image.src = 'images/70x70.png';
demo.image.src = 'images/chameleon.png';
// demo.image.src = 'images/HJocean.png';


