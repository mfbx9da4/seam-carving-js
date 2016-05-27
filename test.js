"use strict";

var assert = require('chai').assert;
var fs = require('fs');
var canvas = require('canvas');
var SeamCarver = require('./SeamCarver.js');
var convertImageToCanvas = require('./convertImageToCanvas.js');

describe('SeamCarver', function () {
    function getSm(image, fn) {
        fs.readFile(__dirname + image, function(err, image){
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
            // assert.equal(sm.picture, [16737587, 16737689, 16737791, 16750899, 16751001, 16751103, 16763699, 16764057, 16764415, 16777011, 16777113, 16777215]);
            done();
        });
    });

    it('should give energy of pixel', function(done) {
        getSm("/images/3x4.png", function(sm) {
            assert.equal(sm.energy(0, 0), 1000);
            assert.equal(sm.energy(0, 3), 1000);
            assert.equal(sm.energy(2, 0), 1000);
            assert.equal(sm.energy(2, 3), 1000);
            assert.equal(sm.energy(1, 2), Math.sqrt(52024));
            assert.equal(sm.energy(1, 1), Math.sqrt(52225));
            done();
        });
    });

    it('should create an energy matrix to help find seam', function(done) {
        getSm("/images/3x4.png", function(sm) {
            assert.equal(sm.energy_matrix[0][3].energy, 1000);
            assert.equal(sm.energy_matrix[0][3].vminsum, 1000);
            assert.equal(sm.energy_matrix[0][3].minx, 0);
            assert.equal(sm.energy_matrix[1][2].energy, Math.sqrt(52024));
            assert.equal(sm.energy_matrix[1][2].vminsum, 1000 + Math.sqrt(52024));
            assert.equal(sm.energy_matrix[1][2].minx, 0);
            done();
        });
    });

    it('should calculate vertical seam  an energy matrix to help find seam', function(done) {
        getSm("/images/6x5.png", function(sm) {
            assert.deepEqual(sm.findVerticalSeam(), [3, 4, 3, 2, 1]);
            done();
        });
    });
});
