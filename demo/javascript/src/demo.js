"use strict";

var SeamCarver = require('../../../SeamCarver');
var key = require('keymaster');

window.demo = {};
var demo = window.demo;
demo.config = {
	drawField: 'rgb',
	seamColor: "#32cd32",
	autoIterations: 0,
	iterationState: 0
};
demo.image = new Image();
demo.canvas = document.querySelector('canvas.image');
demo.currentSeam = [];
demo.findSeam = function (ctx) {
	demo.currentSeam = demo.smc.findVerticalSeam();
	// draw vertical seam
	for (var y = 0; y < demo.currentSeam.length; y ++) {
		var x = demo.currentSeam[y];
		demo.ctx.fillStyle = demo.config.seamColor;
		demo.ctx.fillRect(x, y, 1, 1);
	}
	return demo.currentSeam;
};

demo.removeSeam = function () {
	if (demo.currentSeam.length === 0) return;
	demo.smc.removeVerticalSeam(demo.currentSeam);
	demo.smc.reDrawImage(demo.config.drawField);
	demo.currentSeam = [];
};

demo.iteration = 0;

demo.iterate = function () {
	demo.findSeam(demo.ctx);
	setTimeout(function () {
		demo.removeSeam()
		demo.iteration++;
		if (demo.iteration < demo.config.autoIterations) {
			demo.iterate();
		}
	}, 0);
};

demo.image.onload = function () {
	demo.canvas.width = demo.image.width;
	demo.canvas.height = demo.image.height;
	demo.ctx = demo.canvas.getContext("2d");
	demo.ctx.drawImage(demo.image, 0, 0);
	demo.smc = new SeamCarver(demo.canvas);
};

demo.canvas.addEventListener('click', function (event) {
	demo.iterate();
});

demo.togglePixelation = function () {
	if (demo.canvas.style.imageRendering === 'pixelated') {
		demo.canvas.style.imageRendering = 'auto';
	} else {
		demo.canvas.style.imageRendering = 'pixelated';
	}
}

key('i', function () {
	demo.iterate();
});

key('f', function () {
	demo.findSeam();
});

key('e', function () {
	demo.reDraw('energy');
});

key('s', function () {
	demo.reDraw('vminsum');
});

key('c', function () {
	demo.reDraw('rgb');
});

key('r', function () {
	demo.removeSeam();
});

key('p', function () {
	demo.togglePixelation();
});

key('esc', function () {
	demo.reset();
});

demo.reDraw = function (field) {
	demo.config.drawField = field;
	demo.smc.reDrawImage(field);
};

demo.reset = function () {
	demo.image.setAttribute('crossOrigin', '');
	demo.image.crossOrigin = 'Anonymous';
	// image.src = 'images/3x4.png';
	// image.src = 'images/6x5.png';
	// demo.image.src = 'images/3x4.png';
	// demo.image.src = 'images/6x5.png';
	// demo.image.src = 'images/70x70.png';
	// demo.image.src = 'images/200x100.png';
	demo.image.src = 'images/chameleon.png';
	// demo.image.src = 'images/HJocean.png';
	// image.src = 'images/IMG_4445.jpg';
	// image.src = 'images/white_building_in_field_by_mslash67.jpg';
};

demo.reset();
