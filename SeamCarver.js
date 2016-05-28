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
        this.width = canvas.width;
        this.height = canvas.height;
        var buffer = new ArrayBuffer(2 * this.width * this.height);
        this.picture = new Uint16Array(buffer);
        this.context = canvas.getContext("2d");
        for (var y = 0; y < this.height; y ++) {
            for (var x = 0; x < this.width; x ++) {
                var color = this.context.getImageData(x, y, 1, 1).data;
                var rgb = this.rgbToNum(color[0], color[1], color[2]);
                this.picture[this.pixelToIndex(x, y)] = rgb;
            }
        }

        // Simple implementation of energy matrix as array of arrays.
        // Because we need to remove items, when removing the seam,
        // maybe some sort of linked structure is more efficient.
        this.energy_matrix = new Array(this.width);
        for (var i = 0; i < this.width; i++) {
            this.energy_matrix[i] = new Array(this.height);
        }

        this.createEnergyMatrix();
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
        return (y * this.width) + x;
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
        var red = (rgb >> 16) & 0xFF;
        var green = (rgb >> 8) & 0xFF;
        var blue = rgb & 0xFF;
        return [red, green, blue];
    }

    /**
     * Energy for single pixel.
     *
     * @param {number} x The x val.
     * @param {number} y The y val.
     * @return {number} The energy val.
     */
    energy(x, y) {
        if (x <= 0 || y <= 0 || x >= this.width-1 || y >= this.height-1) {
            return BORDER_ENERGY;
        }
        var xant = this.context.getImageData(x - 1, y, 1, 1).data;
        var xpost = this.context.getImageData(x + 1, y, 1, 1).data;
        var yant = this.context.getImageData(x, y - 1, 1, 1).data;
        var ypost = this.context.getImageData(x, y + 1, 1, 1).data;

        return Math.sqrt(
            (xpost[RED] - xant[RED])*(xpost[RED] - xant[RED]) +
            (xpost[GREEN] - xant[GREEN])*(xpost[GREEN] - xant[GREEN]) +
            (xpost[BLUE] - xant[BLUE])*(xpost[BLUE] - xant[BLUE]) +
            (ypost[RED] - yant[RED])*(ypost[RED] - yant[RED]) +
            (ypost[GREEN] - yant[GREEN])*(ypost[GREEN] - yant[GREEN]) +
            (ypost[BLUE] - yant[BLUE])*(ypost[BLUE] - yant[BLUE])
        );
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
            energy_cell.minx = 0;
        } else {
            var cursum = 0;
            var curminx = 0;

            // below left
            if (x - 1 >= 0) {
                energy_cell.vminsum = this.energy_matrix[x - 1][y + 1].vminsum + energy_cell.energy;
                energy_cell.minx = x - 1;
            }

            // below
            cursum = this.energy_matrix[x][y + 1].vminsum + energy_cell.energy;
            if (cursum < energy_cell.vminsum) {
                energy_cell.vminsum = cursum;
                energy_cell.minx = x;
            }

            // below right
            if (x + 1 < this.width) {
                cursum = this.energy_matrix[x + 1][y + 1].vminsum + energy_cell.energy;
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
     *       `min_x` pixel. The `min_x` pixel is the pixel with the smallest
     *       cumulative energy (defined below).
     *     * Set the cumulative energy for this pixel as the energy of this
     *       pixel plus the cumulative energy of th `min_x` pixel.
     *
     * The cumulative energy of the pixels in the bottom row is simply its own
     * energy.
     *
     */
    createEnergyMatrix() {
        // This has to be reverse order (bottom to top)
        for (var y = this.height - 1; y >= 0; y--) {
            // This can be in any order ...
            for (var x = 0; x < this.width; x++) {
                this.energy_matrix[x][y] = this.recalculate(x,y);
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
            if (this.energy_matrix[x][0].vminsum < vminsum) {
                vminsum = this.energy_matrix[x][0].vminsum;
                xminsum = x;
            }
        }

        vseam[0] = xminsum;

        // Follow down to get array
        var y = 0;
        while (y < this.height - 1) {
            xminsum = this.energy_matrix[xminsum][y].minx
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
        for (var row = 0; row < vseam.length; row ++) {
            var deletedCol = vseam[row];

            // Can ignore last column as we will delete it
            for (var col = 0; col < this.width - 1; col ++) {
                if (col >= deletedCol) {
                    this.energy_matrix[col][row] = this.energy_matrix[col + 1][row];
                }
            }
        }
        this.energy_matrix.splice(this.width - 1, 1);
        this.width--;
    }

    /**
     * Prints one of the values of the energy_matrix. Useful for debugging.
     */
    printMatrix(field) {
        var line = "";
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var val = this.energy_matrix[x][y];
                if (val && field in val) {
                    line += val[field].toFixed(2) + "\t";
                } else {
                    line += '-----\t';
                }
            }
            console.log(line);
            line = "";
        }
    }
}

module.exports = SeamCarver;
