"use strict";

const RED = 0;
const GREEN = 1;
const BLUE = 2;
const BORDER_ENERGY = 1000;

class SeamCarver {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.picture = [];
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

        if (y  >= this.height-1) {
            energy_cell.vminsum = energy_cell.energy;
            energy_cell.minx = 0;
        } else {
            var cursum = 0;
            var curminx = 0;
            if (x - 1 >= 0) {
                energy_cell.vminsum = this.energy_matrix[x - 1][y + 1].vminsum + energy_cell.energy;
                energy_cell.minx = x - 1;
            }

            cursum = this.energy_matrix[x][y + 1].vminsum + energy_cell.energy;
            if (cursum < energy_cell.vminsum) {
                energy_cell.vminsum = cursum;
                energy_cell.minx = x;
            }

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

    createEnergyMatrix() {
        // This has to be reverse order (bottom to top)
        for (var y = this.height; y >= 0; y--) {
            // This can be in any order ...
            for (var x = 0; x < this.width; x++) {
                this.energy_matrix[x][y] = this.recalculate(x,y);
            }
        }
    }

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
     * Prints one of the values of the energy_matrix. Useful for debugging.
    */
    printMatrix(field) {
        var line = "";
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                line += this.energy_matrix[x][y][field] + "\t";
            }
            console.log(line);
            line = "";
        }
    }
}

module.exports = SeamCarver;
