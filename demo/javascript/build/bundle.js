(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

const RED = 0;
const GREEN = 1;
const BLUE = 2;
const BORDER_ENERGY = 1000;
var Heap = require('heap');

/** Seam carver removes low energy seams in an image from HTML5 canvas. */
class SeamCarver {

    /**
     *
     * Init seam carver
     *
     * @param {HMLT5 canvas} canvas canvas with image on it.
     *
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.context = canvas.getContext("2d");
        this.imageData = this.context.getImageData(0, 0, this.width, this.height);
        this.picture = this.imageData.data;

        // Simple implementation of energy matrix as array of arrays.
        // Because we need to remove items, when removing the seam,
        // maybe some sort of linked structure is more efficient.
        this.energyMatrix = new Array(this.width);
        this.minsumMatrix = new Array(this.width);
        this.minxMatrix = new Array(this.width);
        for (var i = 0; i < this.width; i++) {
            this.energyMatrix[i] = new Float32Array(this.height);
            this.minsumMatrix[i] = new Float32Array(this.height);
            this.minxMatrix[i] = new Uint16Array(this.height);
        }

        console.time('createEnergyMatrix');

        this.createEnergyMatrix();

        console.timeEnd('createEnergyMatrix');
    }

    /**
     * Converts pixel to index.
     *
     * @param {number} x The x val
     * @param {number} y The y val
     * @return {number} Index of 1D array
     *
     */
    pixelToIndex(x, y) {
        if (x < 0 || x >= (this.width * 4) || y < 0 || y >= this.height) {
            throw new Error('IndexOutOfBoundsException : ' +  x + ',' + y);
        }
        // * 4 for rgba
        return ((y * this.width) + x) * 4;
    }

    indexToX(index) {
        return parseInt((index / 4) % this.width);
    }

    indexToY(index) {
        return parseInt(index / (this.width * 4));
    }


    rgbToNum(red, green, blue) {
        var rgb = red;
        rgb = (rgb << 8) + green;
        rgb = (rgb << 8) + blue;
        return rgb;
    }

    numToRgb(num) {
        var red = (num >> 16) & 0xFF;
        var green = (num >> 8) & 0xFF;
        var blue = num & 0xFF;
        return [red, green, blue];
    }

    isBorderPixel(x, y) {
        return (x <= 0 || y <= 0 || x >= this.width-1 || y >= this.height-1);
    }

    pixelInRange(x, y) {
        return (x >= 0 && y >= 0 && x <= this.width-1 && y <= this.height-1);
    }

    /**
     * Energy for single pixel.
     *
     * @param {number} x The x val.
     * @param {number} y The y val.
     * @return {number} The energy val.
     */
    energy(x, y) {
        if (this.isBorderPixel(x, y)) {
            return BORDER_ENERGY;
        }

        var pos_xant = this.pixelToIndex(x - 1, y);
        var pos_xpost = this.pixelToIndex(x + 1, y);
        var pos_yant = this.pixelToIndex(x, y - 1);
        var pos_ypost = this.pixelToIndex(x, y + 1);

        var p = this.picture; // Just to make it more readable ...

        var score = Math.sqrt(
            (p[pos_xpost+RED]   - p[pos_xant+RED])  *(p[pos_xpost+RED]   - p[pos_xant+RED]) +
            (p[pos_xpost+GREEN] - p[pos_xant+GREEN])*(p[pos_xpost+GREEN] - p[pos_xant+GREEN]) +
            (p[pos_xpost+BLUE]  - p[pos_xant+BLUE]) *(p[pos_xpost+BLUE]  - p[pos_xant+BLUE]) +
            (p[pos_ypost+RED]   - p[pos_yant+RED])  *(p[pos_ypost+RED]   - p[pos_yant+RED]) +
            (p[pos_ypost+GREEN] - p[pos_yant+GREEN])*(p[pos_ypost+GREEN] - p[pos_yant+GREEN]) +
            (p[pos_ypost+BLUE]  - p[pos_yant+BLUE]) *(p[pos_ypost+BLUE]  - p[pos_yant+BLUE])
        );
        return score;
    }

    /**
     * Calculate energy_matrix information for pixel x,y.
     * Assumes x and y in range.
     */
    recalculate(x, y) {
        var energy_cell = {};

        energy_cell.energy = this.energy(x, y);
        energy_cell.vminsum = Number.POSITIVE_INFINITY;

        // last row
        if (y >= this.height-1) {
            energy_cell.vminsum = energy_cell.energy;
            energy_cell.minx = x;
        } else {
            var cursum = 0;
            var curminx = 0;

            // below left
            if (x - 1 >= 0) {
                energy_cell.vminsum = this.minsumMatrix[x - 1][y + 1] + energy_cell.energy;
                energy_cell.minx = x - 1;
            }

            // below
            if (x < this.width) {
                cursum = this.minsumMatrix[x][y + 1] + energy_cell.energy;
                if (cursum < energy_cell.vminsum) {
                    energy_cell.vminsum = cursum;
                    energy_cell.minx = x;
                }
            }

            // below right
            if (x + 1 < this.width) {
                cursum = this.minsumMatrix[x + 1][y + 1] + energy_cell.energy;
                if (cursum < energy_cell.vminsum) {
                    energy_cell.vminsum = cursum;
                    energy_cell.minx = x + 1;
                }
            }
        }

        return energy_cell;
    }

    /**
     * Iterate from bottom to top. For each pixel calculate:
     *     * The energy for the pixel.
     *     * From the three pixels below the current pixel, calculate the
     *       `minx` pixel. The `minx` pixel is the pixel with the smallest
     *       cumulative energy (defined below).
     *     * Set the cumulative energy for this pixel as the energy of this
     *       pixel plus the cumulative energy of th `minx` pixel.
     *
     * The cumulative energy of the pixels in the bottom row is simply its own
     * energy.
     *
     */
    createEnergyMatrix() {
        // This has to be reverse order (bottom to top)
        this.maxVminsum = 0;
        for (var y = this.height - 1; y >= 0; y--) {
            // This can be in any order ...
            for (var x = 0; x < this.width; x++) {
                var energy = this.recalculate(x,y);
                this.maxVminsum = Math.max(energy.vminsum, this.maxVminsum);
                this.energyMatrix[x][y] = energy.energy;
                this.minsumMatrix[x][y] = energy.vminsum;
                this.minxMatrix[x][y] = energy.minx;
            }
        }
    }

    /**
     * Backtrack from smallest on first row to choosing always smallest child.
     *
     */
    findVerticalSeam() {
        var vseam = [];

        var xminsum = 0;
        var vminsum = Number.POSITIVE_INFINITY;

        // Find smallest sum on first row
        for (var x = 0; x < this.width; x++) {
            if (this.minsumMatrix[x][0] < vminsum) {
                vminsum = this.minsumMatrix[x][0];
                xminsum = x;
            }
        }

        vseam[0] = xminsum;

        // Follow down to get array
        var y = 0;
        while (y < this.height - 1) {
            xminsum = this.minxMatrix[xminsum][y]
            y++;
            vseam[y] = xminsum;
        }

        return vseam;
    }

    /**
     * Remove pixels from rgb, energy and vminsum representations
     * of image.
     *
     */
    removePixelsFromDataStructures(vseam) {
        this.imageData = this.context.createImageData(this.width - 1, this.height);
        for (var row = this.height - 1; row >= 0; row--) {
            var deletedCol = vseam[row];

            // copy across pixels before seam col
            for (var col = 0; col < deletedCol; col ++) {
                var oldPos = this.pixelToIndex(col, row);
                var pos = oldPos - (row * 4)
                for (var i = 0; i < 4; i ++) {
                    this.imageData.data[pos + i] = this.picture[oldPos + i];
                }
            }

            // Start at deleted col
            // Can ignore last column as we will delete it
            for (var col = deletedCol; col < this.width - 1; col ++) {

                // copy across pixels after seam col
                var pos = this.pixelToIndex(col, row) - (row * 4);
                var pos_right = this.pixelToIndex(col + 1, row);
                for (var i = 0; i < 4; i ++) {
                    this.imageData.data[pos + i] = this.picture[pos_right + i];
                }

                // copy across energy_matrix
                var energy_right = this.energyMatrix[col + 1][row];
                var minx_right = this.minxMatrix[col + 1][row];
                var minsum_right = this.minsumMatrix[col + 1][row];
                minx_right--;
                this.energyMatrix[col][row] = energy_right;
                this.minxMatrix[col][row] = minx_right;
                this.minsumMatrix[col][row] = minsum_right;
            }
        }

        // chop off last column
        this.energyMatrix.splice(this.width - 1, 1);
        this.minxMatrix.splice(this.width - 1, 1);
        this.minsumMatrix.splice(this.width - 1, 1);
        this.picture = this.imageData.data;
        this.width--;
    }

    /**
     * Recalculate energy only when necessary: pixels adjacent
     * (up, down and both sides) to the removed seam, ie the affected
     * pixels.
     * For any affected pixel, if the new energy is different to the previous one
     * it's vmin sum must be recalculated therefore it is added to an array
     * and returned by this method.
     *
     * @return {list} List of affected pixels for which the vminsum may be affected.
     */
    recalculateEnergiesAndFindAffectedPixels(vseam) {
        var queue = [];

        // bottom to top, ignore last row
        for (var row = this.height - 2; row >= 0; row--) {
            var deletedCol = vseam[row];
            var affectedCols = [];

            // TODO: check this covers all cases (up, down, left, right)
            for (var i = -1; i < 1; i ++) {
                var col = deletedCol + i;

                if (this.pixelInRange(col, row)) {
                    this.energyMatrix[col][row] = this.energy(col, row);
                    // enqueue pixel in range
                    affectedCols.push(col);
                }
            }
            queue[row] = affectedCols;
        }
        return queue;
    }

    /**
     * Recalculate vminsum for affected pixels
     */
    recalculateVminsumForAffectedPixels(queue) {
        var marked = {};
        var enqueued = {};
        var maxRow = -1;
        // start at second to last row
        var row = this.height - 2;
        var enqueuedCols = queue[row];
        // used later in loop so as not to go past borders
        var lastCol = this.width - 1;

        while (enqueuedCols) {

            // This iterates in topological order (bottom to top)
            var col = enqueuedCols.pop();
            var pixelIndex = this.pixelToIndex(col, row);
            if (enqueuedCols.length === 0) enqueuedCols = queue[--row];

            // already explored this pixel
            if (marked[pixelIndex]) continue;

            marked[pixelIndex] = true;

            var nodeEnergy = this.energyMatrix[col][row];
            var oldVminsum = this.minsumMatrix[col][row];
            this.minsumMatrix[col][row] = Number.POSITIVE_INFINITY;

            // check three parents in row below
            for (var i = Math.max(col - 1, 0); i < Math.min(col + 2, lastCol + 1); i ++) {
                var parentVminsum = this.minsumMatrix[i][row + 1];
                var newVminsum = parentVminsum + nodeEnergy;

                if (newVminsum < this.minsumMatrix[col][row]) {
                    this.minsumMatrix[col][row] = newVminsum;
                    this.minxMatrix[col][row] = i;
                }
            }

            // If we are on first row, no potentially affected children in row
            // above so skip next step.
            if (row === 0) continue;

            // Only enqueue the children if the vminsum has changed
            if (oldVminsum === this.minsumMatrix[col][row]) continue;

            // enqueue three affected children from row above
            for (var i = Math.max(col - 1, 0); i < Math.min(col + 2, lastCol + 1); i ++) {
                var childIndex = this.pixelToIndex(i, row - 1);
                if (!enqueued[childIndex]) {
                    enqueued[childIndex] = true;
                    queue[row - 1].push(i);
                }
            }
        }
    }

    /**
     * Removes vertical seam.
     * Recalculates pixels depending on removed pixel.
     */
    removeVerticalSeam(vseam) {
        this.removePixelsFromDataStructures(vseam);

        var affectedPixels = this.recalculateEnergiesAndFindAffectedPixels(vseam);

        this.recalculateVminsumForAffectedPixels(affectedPixels);
    }

    /*
     * Takes field as arg to print matrix, default is rgb, accepts energy.
     *
     */
    reDrawImage(options) {
        var field = options.field;
        var actualSize = options.actualSize;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.width = this.imageData.width;
        this.canvas.height = this.imageData.height;

        if (actualSize) {
            this.canvas.style.width = this.imageData.width + 'px';
            this.canvas.style.height = this.imageData.height + 'px';
        } else {
            this.canvas.style.cssText = '';
        }

        if (field === 'energy' || field === 'vminsum' || (field !== this.imageData.dataField)) {
            this.imageData = this.context.createImageData(this.width, this.height);
            this.imageData.dataField = field;

            for (var row = 0; row < this.height; row ++) {
                for (var col = 0; col < this.width; col ++) {
                    var pos = this.pixelToIndex(col, row);

                    if (field === 'energy') {
                        var val = this.energyMatrix[col][row];
                        var normalizedVal = Math.min(255, ((val / 255) * 255));
                    } else if (field === 'minsum') {
                        var val = this.minsumMatrix[col][row];
                        var normalizedVal = ((val - 1000) / (this.maxVminsum - 1000)) * 255
                    } else if (field === 'minx') {
                        var val = this.minxMatrix[col][row];
                        var direction = val - col + 1;
                        for (var i = 0; i < 3; i ++) {
                            this.imageData.data[pos + i] = 0;
                        }
                        if (direction >= 0 && direction <= 2) {
                            this.imageData.data[pos + direction] = 255;
                        }
                        this.imageData.data[pos + 3] = 255;
                        continue;
                    } else {
                        // rgb
                        for (var i = 0; i < 4; i ++) {
                            this.imageData.data[pos + i] = this.picture[pos + i];
                        }
                        continue;
                    }

                    for (var i = 0; i < 3; i ++) {
                        this.imageData.data[pos + i] = normalizedVal;
                    }
                    // make opaque
                    this.imageData.data[pos + 3] = 255;

                }
            }


        }

        this.context.putImageData(this.imageData, 0, 0);
    }

    /**
     * Prints one of the values of the energy_matrix. Useful for debugging.
     */
    printMatrix(field) {
        console.log(this.toString(field));
    }


    /**
     * Returns string of internal matrix
     */
    toString(field) {
        field = field || 'rgb';
        var lines = '';
        if (field === 'rgb') {
            for (var y = 0; y < this.height; y ++) {
                for (var x = 0; x < this.width; x ++) {
                    var pos = this.pixelToIndex(x, y)
                    var rgb = Array.prototype.slice.call(this.picture, pos, pos + 3);
                    lines += (this.rgbToNum(rgb[0], rgb[1], rgb[2]) / 100000).toFixed(2) + '\t';
                }
                lines += '\n';
            }
        } else {
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var val;

                    if (field === 'energy') {
                        val = this.energyMatrix[x][y];
                    } else if (field === 'minsum') {
                        val = this.minsumMatrix[x][y];
                    } else if (field === 'minx') {
                        val = this.minxMatrix[x][y];
                    }

                    if (val || val === 0) {
                        lines += val.toFixed(2) + "\t";
                    } else {
                        lines += '-----\t';
                    }

                }
                lines += '\n';
            }
        }
        return lines;
    }
}

module.exports = SeamCarver;

},{"heap":3}],2:[function(require,module,exports){
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
	// demo.image.src = 'images/12x10.png';
	// demo.image.src = 'images/70x70.png';
	// demo.image.src = 'images/200x100.png';
	demo.image.src = 'images/chameleon.png';
	// demo.image.src = 'images/HJocean.png';
	// demo.image.src = 'images/IMG_4445.jpg';
	// demo.image.src = 'images/white_building_in_field_by_mslash67.jpg';
	// demo.image.src = 'images/butterfly.png';
	// demo.image.src = 'images/1000x300.jpg';
	// demo.image.src = 'images/1000x500.jpg';
	// demo.image.src = 'images/1600x1200.jpg';
	// demo.image.src = 'https://cdn.hyperdev.com/us-east-1%3A095124f7-7022-4119-9d6a-68fd1e3dd7ef%2Fchameleon.png';
};

demo.reset();

},{"../../../SeamCarver":1,"keymaster":5}],3:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":4}],4:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(this);

},{}],5:[function(require,module,exports){
//     keymaster.js
//     (c) 2011-2013 Thomas Fuchs
//     keymaster.js may be freely distributed under the MIT license.

;(function(global){
  var k,
    _handlers = {},
    _mods = { 16: false, 18: false, 17: false, 91: false },
    _scope = 'all',
    // modifier keys
    _MODIFIERS = {
      '⇧': 16, shift: 16,
      '⌥': 18, alt: 18, option: 18,
      '⌃': 17, ctrl: 17, control: 17,
      '⌘': 91, command: 91
    },
    // special keys
    _MAP = {
      backspace: 8, tab: 9, clear: 12,
      enter: 13, 'return': 13,
      esc: 27, escape: 27, space: 32,
      left: 37, up: 38,
      right: 39, down: 40,
      del: 46, 'delete': 46,
      home: 36, end: 35,
      pageup: 33, pagedown: 34,
      ',': 188, '.': 190, '/': 191,
      '`': 192, '-': 189, '=': 187,
      ';': 186, '\'': 222,
      '[': 219, ']': 221, '\\': 220
    },
    code = function(x){
      return _MAP[x] || x.toUpperCase().charCodeAt(0);
    },
    _downKeys = [];

  for(k=1;k<20;k++) _MAP['f'+k] = 111+k;

  // IE doesn't support Array#indexOf, so have a simple replacement
  function index(array, item){
    var i = array.length;
    while(i--) if(array[i]===item) return i;
    return -1;
  }

  // for comparing mods before unassignment
  function compareArray(a1, a2) {
    if (a1.length != a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) return false;
    }
    return true;
  }

  var modifierMap = {
      16:'shiftKey',
      18:'altKey',
      17:'ctrlKey',
      91:'metaKey'
  };
  function updateModifierKey(event) {
      for(k in _mods) _mods[k] = event[modifierMap[k]];
  };

  // handle keydown event
  function dispatch(event) {
    var key, handler, k, i, modifiersMatch, scope;
    key = event.keyCode;

    if (index(_downKeys, key) == -1) {
        _downKeys.push(key);
    }

    // if a modifier key, set the key.<modifierkeyname> property to true and return
    if(key == 93 || key == 224) key = 91; // right command on webkit, command on Gecko
    if(key in _mods) {
      _mods[key] = true;
      // 'assignKey' from inside this closure is exported to window.key
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = true;
      return;
    }
    updateModifierKey(event);

    // see if we need to ignore the keypress (filter() can can be overridden)
    // by default ignore key presses if a select, textarea, or input is focused
    if(!assignKey.filter.call(this, event)) return;

    // abort if no potentially matching shortcuts found
    if (!(key in _handlers)) return;

    scope = getScope();

    // for each potential shortcut
    for (i = 0; i < _handlers[key].length; i++) {
      handler = _handlers[key][i];

      // see if it's in the current scope
      if(handler.scope == scope || handler.scope == 'all'){
        // check if modifiers match if any
        modifiersMatch = handler.mods.length > 0;
        for(k in _mods)
          if((!_mods[k] && index(handler.mods, +k) > -1) ||
            (_mods[k] && index(handler.mods, +k) == -1)) modifiersMatch = false;
        // call the handler and stop the event if neccessary
        if((handler.mods.length == 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91]) || modifiersMatch){
          if(handler.method(event, handler)===false){
            if(event.preventDefault) event.preventDefault();
              else event.returnValue = false;
            if(event.stopPropagation) event.stopPropagation();
            if(event.cancelBubble) event.cancelBubble = true;
          }
        }
      }
    }
  };

  // unset modifier keys on keyup
  function clearModifier(event){
    var key = event.keyCode, k,
        i = index(_downKeys, key);

    // remove key from _downKeys
    if (i >= 0) {
        _downKeys.splice(i, 1);
    }

    if(key == 93 || key == 224) key = 91;
    if(key in _mods) {
      _mods[key] = false;
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = false;
    }
  };

  function resetModifiers() {
    for(k in _mods) _mods[k] = false;
    for(k in _MODIFIERS) assignKey[k] = false;
  };

  // parse and assign shortcut
  function assignKey(key, scope, method){
    var keys, mods;
    keys = getKeys(key);
    if (method === undefined) {
      method = scope;
      scope = 'all';
    }

    // for each shortcut
    for (var i = 0; i < keys.length; i++) {
      // set modifier keys if any
      mods = [];
      key = keys[i].split('+');
      if (key.length > 1){
        mods = getMods(key);
        key = [key[key.length-1]];
      }
      // convert to keycode and...
      key = key[0]
      key = code(key);
      // ...store handler
      if (!(key in _handlers)) _handlers[key] = [];
      _handlers[key].push({ shortcut: keys[i], scope: scope, method: method, key: keys[i], mods: mods });
    }
  };

  // unbind all handlers for given key in current scope
  function unbindKey(key, scope) {
    var multipleKeys, keys,
      mods = [],
      i, j, obj;

    multipleKeys = getKeys(key);

    for (j = 0; j < multipleKeys.length; j++) {
      keys = multipleKeys[j].split('+');

      if (keys.length > 1) {
        mods = getMods(keys);
        key = keys[keys.length - 1];
      }

      key = code(key);

      if (scope === undefined) {
        scope = getScope();
      }
      if (!_handlers[key]) {
        return;
      }
      for (i = 0; i < _handlers[key].length; i++) {
        obj = _handlers[key][i];
        // only clear handlers if correct scope and mods match
        if (obj.scope === scope && compareArray(obj.mods, mods)) {
          _handlers[key][i] = {};
        }
      }
    }
  };

  // Returns true if the key with code 'keyCode' is currently down
  // Converts strings into key codes.
  function isPressed(keyCode) {
      if (typeof(keyCode)=='string') {
        keyCode = code(keyCode);
      }
      return index(_downKeys, keyCode) != -1;
  }

  function getPressedKeyCodes() {
      return _downKeys.slice(0);
  }

  function filter(event){
    var tagName = (event.target || event.srcElement).tagName;
    // ignore keypressed in any elements that support keyboard data input
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  }

  // initialize key.<modifier> to false
  for(k in _MODIFIERS) assignKey[k] = false;

  // set current scope (default 'all')
  function setScope(scope){ _scope = scope || 'all' };
  function getScope(){ return _scope || 'all' };

  // delete all handlers for a given scope
  function deleteScope(scope){
    var key, handlers, i;

    for (key in _handlers) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length; ) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);
        else i++;
      }
    }
  };

  // abstract key logic for assign and unassign
  function getKeys(key) {
    var keys;
    key = key.replace(/\s/g, '');
    keys = key.split(',');
    if ((keys[keys.length - 1]) == '') {
      keys[keys.length - 2] += ',';
    }
    return keys;
  }

  // abstract mods logic for assign and unassign
  function getMods(key) {
    var mods = key.slice(0, key.length - 1);
    for (var mi = 0; mi < mods.length; mi++)
    mods[mi] = _MODIFIERS[mods[mi]];
    return mods;
  }

  // cross-browser events
  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on'+event, function(){ method(window.event) });
  };

  // set the handlers globally on document
  addEvent(document, 'keydown', function(event) { dispatch(event) }); // Passing _scope to a callback to ensure it remains the same by execution. Fixes #48
  addEvent(document, 'keyup', clearModifier);

  // reset modifiers to false whenever the window is (re)focused.
  addEvent(window, 'focus', resetModifiers);

  // store previously defined key
  var previousKey = global.key;

  // restore previously defined key and return reference to our key object
  function noConflict() {
    var k = global.key;
    global.key = previousKey;
    return k;
  }

  // set window.key and window.key.set/get/deleteScope, and the default filter
  global.key = assignKey;
  global.key.setScope = setScope;
  global.key.getScope = getScope;
  global.key.deleteScope = deleteScope;
  global.key.filter = filter;
  global.key.isPressed = isPressed;
  global.key.getPressedKeyCodes = getPressedKeyCodes;
  global.key.noConflict = noConflict;
  global.key.unbind = unbindKey;

  if(typeof module !== 'undefined') module.exports = assignKey;

})(this);

},{}]},{},[2]);
