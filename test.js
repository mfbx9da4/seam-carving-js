"use strict";

var assert = require('chai').assert;
var fs = require('fs');
var canvas = require('canvas');
var SeamCarver = require('./SeamCarver.js');
var convertImageToCanvas = require('./convertImageToCanvas.js');

describe('SeamCarver', function() {
    function initSeamCarver(image, fn) {
        fs.readFile(__dirname + image, function(err, image){
            if (err) throw err;
            var img = new canvas.Image();
            img.src = image;
            var sm = new SeamCarver(convertImageToCanvas(img));
            fn(sm);
        });
    };

    it('should set width, height and pixels correctly', function(done) {
        initSeamCarver("/images/3x4.png", function(sm) {
            assert.equal(sm.width, 3);
            assert.equal(sm.height, 4);
            assert.equal(sm.picture.length, 12 * 4);
            assert.equal(sm.energyMatrix.length, 3);
            assert.equal(sm.energyMatrix[0].length, 4, 'height incorrect');
            done();
        });
    });

    it('should set width, height and pixels correctly for 6x5', function(done) {
        initSeamCarver("/images/6x5.png", function(sm) {
            assert.equal(sm.width, 6);
            assert.equal(sm.height, 5);
            assert.equal(sm.picture.length, 30 * 4);
            assert.equal(sm.energyMatrix.length, 6);
            assert.equal(sm.energyMatrix[0].length, 5, 'height incorrect');
            done();
        });
    });

    it('should give energy of pixel', function(done) {
        initSeamCarver("/images/3x4.png", function(sm) {
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
        initSeamCarver("/images/3x4.png", function(sm) {
            assert.equal(sm.energyMatrix[0][3], 1000);
            assert.equal(sm.minsumMatrix[0][3], 1000);
            assert.equal(sm.minxMatrix[0][3], 0);
            assert.equal(parseInt(sm.energyMatrix[1][2]), parseInt(Math.sqrt(52024)));
            assert.equal(parseInt(sm.minsumMatrix[1][2]), parseInt(1000 + Math.sqrt(52024)));
            assert.equal(sm.minxMatrix[1][2], 0);
            done();
        });
    });

    it('should calculate vertical seam  an energy matrix to help find seam', function(done) {
        initSeamCarver("/images/6x5.png", function(sm) {
            assert.deepEqual(sm.findVerticalSeam(), [3, 4, 3, 2, 1]);
            done();
        });
    });

    it('should remove a vertical seam', function(done) {
        initSeamCarver("/images/6x5.png", function(sm) {
            assert.equal(sm.energyMatrix.length, 6);
            sm.energyMatrix.forEach(function(col) {assert.equal(col.length, 5);});
            var vseam = [3, 4, 3, 2, 1];
            assert.deepEqual(vseam, sm.findVerticalSeam());
            sm.printMatrix('rgb');
            sm.printMatrix('energy');
            sm.printMatrix('minx');

            // remove first seam
            sm.removeVerticalSeam(vseam);
            console.log('remove', vseam);
            sm.printMatrix('rgb');
            sm.printMatrix('energy');
            sm.printMatrix('minx');

            assert.equal(sm.energyMatrix.length, 5,
                         'Did not remove one col from energyMatrix');
            sm.energyMatrix.forEach(function(col) {assert.equal(col.length, 5);});

            assert.equal(sm.picture.length, 5 * 5 * 4,
                         'Did not remove col from picture');

            // remove second seam
            vseam = sm.findVerticalSeam()
            sm.removeVerticalSeam(vseam);
            console.log('remove', vseam);
            sm.printMatrix('rgb');
            sm.printMatrix('energy');
            sm.printMatrix('minx');


            assert.equal(sm.energyMatrix.length, 4,
                         'Did not remove one col from energyMatrix');
            sm.energyMatrix.forEach(function(col) {assert.equal(col.length, 5);});

            assert.equal(sm.picture.length, 4 * 5 * 4,
                         'Did not remove col from picture');

            // remove third seam
            vseam = sm.findVerticalSeam()
            sm.removeVerticalSeam(vseam);
            console.log('remove', vseam);
            sm.printMatrix('rgb');
            sm.printMatrix('energy');
            sm.printMatrix('minx');

            done();
        });
    });

    it('should throw if vseam invalid')
});
