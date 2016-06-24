"use strict";

const RED = 0;
const GREEN = 1;
const BLUE = 2;
const BORDER_ENERGY = 1000;

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
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new java.lang.IndexOutOfBoundsException();
        }
        // * 4 for rgba
        return ((y * this.width) + x) * 4;
    }

    indexToX(index) {
        return index % this.width;
    }

    indexToY(index) {
        return index / this.width;
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
     * Removes vertical seam.
     * Recalculates pixels depending on removed pixel.
     *
     */
    removeVerticalSeam(vseam) {
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

        // now update energy matrix
        for (var row = this.height - 1; row >= 0; row--) {
            for (var col = 0; col < this.width; col++) {
                // TODO recalculate energy only when necessary: pixels adjacent (up, down and both sides) to the removed seam.
                var energy = this.recalculate(col, row);
                this.energyMatrix[col][row] = energy.energy;
                this.minsumMatrix[col][row] = energy.vminsum;
                this.minxMatrix[col][row] = energy.minx;
            }
        }
    }

    /**
     * Takes field as arg to print matrix, default is rgb, accepts energy.
     *
     */
    reDrawImage(options) {
        var field = options.field;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.width = this.imageData.width;
        this.canvas.height = this.imageData.height;

        if (options.actualSize) {
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
                        var direction = col - val + 1;
                        for (var i = 0; i < 3; i ++) {
                            this.imageData.data[pos + i] = 0;
                        }
                        if (direction >= 0 && direction <= 2) this.imageData.data[pos + direction] = 255;
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

                    if (val) {
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
