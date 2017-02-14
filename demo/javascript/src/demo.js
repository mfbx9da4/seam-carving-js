"use strict";

var SeamCarver = require('../../../SeamCarver');
var key = require('keymaster');

window.demo = {};
var demo = window.demo;
demo.config = {
    draw: {
        field: 'rgb',
        actualSize: true
    },
    seamColor: "#32cd32",
    autoIterate: false,
    images: [
        'images/chameleon.png',
        'images/tower.jpg',
        'images/3x4.png',
        'images/6x5.png',
        'images/12x10.png',
        'images/70x70.png',
        'images/200x100.png',
        'images/HJocean.png',
        'images/IMG_4445.jpg',
        'images/white_building_in_field_by_mslash67.jpg',
        'images/butterfly.png',
        'images/1000x300.jpg',
        'images/1000x500.jpg',
        'images/1600x1200.jpg',
        'https://cdn.hyperdev.com/us-east-1%3A095124f7-7022-4119-9d6a-68fd1e3dd7ef%2Fchameleon.png',
        'https://cdn.hyperdev.com/us-east-1%3A095124f7-7022-4119-9d6a-68fd1e3dd7ef%2Fbutterfly.jpg',
        'https://cdn.hyperdev.com/us-east-1%3A095124f7-7022-4119-9d6a-68fd1e3dd7ef%2Fbamboo.jpg',
        'https://cdn.hyperdev.com/us-east-1%3A095124f7-7022-4119-9d6a-68fd1e3dd7ef%2Fanimals.jpg'
    ]
};
demo.iteration = 0;
demo.image = new Image();
demo.canvas = document.querySelector('canvas.image');
demo.selectImage = document.querySelector('#select-image');
demo.currentSeam = [];

demo.findSeam = function (ctx) {
    document.querySelector('.find-seam').style.display = 'none';
    document.querySelector('.remove-seam').style.display = 'block';
    demo.currentSeam = demo.smc.findVerticalSeam();
    // draw vertical seam
    for (var y = 0; y < demo.currentSeam.length; y ++) {
        var x = demo.currentSeam[y];
        demo.ctx.fillStyle = demo.config.seamColor;
        demo.ctx.fillRect(x, y, 1, 1);
    }
    return demo.currentSeam;
};

demo.removeSeam = function (options) {
    options = options || {};
    if (!('reDrawImage' in options)) {
        options.reDrawImage = true;
    }
    document.querySelector('.find-seam').style.display='block';
    document.querySelector('.remove-seam').style.display='none';
    if (demo.currentSeam.length === 0) return;
    demo.smc.removeVerticalSeam(demo.currentSeam);
    if (options.reDrawImage) {
        demo.smc.reDrawImage(demo.config.draw);
    }
    demo.currentSeam = [];
};

demo.iterate = function() {
    demo.config.autoIterate = !demo.config.autoIterate;
    demo.doIterate();
}

demo.doIterate = function () {
    demo.findSeam(demo.ctx);
    setTimeout(function () {
        demo.removeSeam({reDrawImage: true})
        demo.iteration++;
        if (demo.config.autoIterate) {
            demo.doIterate();
        } else {
            demo.smc.reDrawImage(demo.config.draw);
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
    document.querySelector('.find-seam').style.display='none';
    document.querySelector('.remove-seam').style.display='block';
});

key('r', function () {
    demo.removeSeam();
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

demo.createSelectImage = function () {
    demo.selectImage.innerHTML = '';
    demo.config.images.map(function (image) {
        var option = document.createElement('option');
        option.value = image;
        option.text = image;
        demo.selectImage.appendChild(option);
    });
    demo.selectImage.value = demo.config.images[0];
};

demo.changeImage = function (image) {
    demo.image.setAttribute('crossOrigin', '');
    demo.image.crossOrigin = 'Anonymous';
    demo.image.src = image || demo.image.src || demo.selectImage.value;
};

demo.reset = function () {
    demo.changeImage();
};

demo.createSelectImage();
demo.reset();
