"use strict";

var SeamCarver = require('../../../SeamCarver');
var key = require('keymaster');

window.demo = {};
var demo = window.demo;
demo.config = {
	draw: {
		field:'rgb',
		actualSize: true
	},
	seamColor: "#32cd32",
	autoIterate: false,
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
	demo.smc.reDrawImage(demo.config.draw);
	demo.currentSeam = [];
};

demo.iteration = 0;

demo.iterate = function () {
	demo.findSeam(demo.ctx);
	setTimeout(function () {
		demo.removeSeam()
		demo.iteration++;
		if (demo.config.autoIterate) {
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
	demo.smc.reDrawImage(demo.config.draw);
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
	demo.config.autoIterate = !demo.config.autoIterate;
	demo.iterate();
});

key('f', function () {
	demo.findSeam();
});

key('a', function () {
	demo.toggleActualSize();
});

key('e', function () {
	demo.reDraw('energy');
});

key('s', function () {
	demo.reDraw('minsum');
});

key('c', function () {
	demo.reDraw('rgb');
});

key('x', function () {
	demo.reDraw('minx');
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
	demo.config.draw.field = field;
	demo.smc.reDrawImage(demo.config.draw);
};

demo.toggleActualSize = function () {
	demo.config.draw.actualSize = !demo.config.draw.actualSize;
	demo.smc.reDrawImage(demo.config.draw);
};

demo.reset = function () {
	demo.image.setAttribute('crossOrigin', '');
	demo.image.crossOrigin = 'Anonymous';
	// demo.image.src = 'images/3x4.png';
	demo.image.src = 'images/6x5.png';
	// demo.image.src = 'images/70x70.png';
	// demo.image.src = 'images/200x100.png';
	// demo.image.src = 'images/chameleon.png';
	// demo.image.src = 'images/HJocean.png';
	// demo.image.src = 'images/butterfly.png';
	// demo.image.src = 'images/1000x300.jpg';
	// demo.image.src = 'images/1000x500.jpg';
	// demo.image.src = 'images/1600x1200.jpg';
	// demo.image.src = 'https://cdn.hyperdev.com/us-east-1%3A095124f7-7022-4119-9d6a-68fd1e3dd7ef%2Fchameleon.png';
};

demo.reset();
