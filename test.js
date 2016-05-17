"use strict";

var assert = require('assert');
var fs = require('fs');
var canvas = require('canvas');
var SeamCarver = require('./SeamCarver.js');
var convertImageToCanvas = require('./convertImageToCanvas.js');

describe('SeamCarver', function () {
    function getSm(image, fn) {
        fs.readFile(__dirname + '/images/3x4.png', function(err, image){
            if (err) throw err;
            var img = new canvas.Image();
            img.src = image;
            var sm = new SeamCarver(convertImageToCanvas(img));
            fn(sm);
        });
    };

    it('should set width, height and pixels correctly', function(done) {
          getSm("/images/3x4.png", function(sm) {
              assert.equal(sm.width, 3);
              assert.equal(sm.height, 4);
              assert.equal(sm.picture.length, 12);
              assert.equal(sm.picture, [0, 0, 0]);
              done();
          });
    });
});
