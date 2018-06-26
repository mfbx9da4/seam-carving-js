# Seam Carving JS

Javascript implementation of a content-aware image resizing algorithm called seam carving. <a href="https://en.wikipedia.org/wiki/Seam_carving">Seam carving</a> crops an image by removing the "least important" pixels in an image. An "unimportant" pixel is defined as a pixel which is very similar to its surrounding pixels. A seam is a one pixel column in the image which can zig-zag between adjancent columns.

## Install

    npm install seam-carving-js

## Install for contributors

OSX requires

    brew install pkg-config cairo libpng jpeg giflib
    xcode-select --install # el capitain only

Ubuntu

    sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

Everyone

    npm install

## Build

    gulp build
    
## Test

    npm run test

## Run demo

    npm install -g local-web-server
    ws # navigate to http://localhost:8000

## Current optimizations
- When we remove a seam not all pixels are recalculated instead only pixels either side of the seam are enqueued to be recalculated. If the min sum of the affected pixel has not changed we need not enqueue it's children.

## Potential optimizations

- Iterate arrays in a CPU cache efficient way
- Keep track of smallest on top row
- Have three matrices, one for minx, one for vminsum and one for energies so that we can use typed arrays
- Could convert picture rgba array to [`Uint32Array` rgb number array](https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/) to save space
- Do logical deletes on the energy matrix. This way the cost of deletion goes way down, with the cost of finding the neighbor when recalculating going up some. Would have to keep picture array as an array of `Uint8ClampedArray`s.
- Potentially could add the pixels which we need to recalculate the energy for to a queue of nodes and relax there edges to adjacent pixels. If we do not find a smaller vminsum for any pixel on the queue we do not need to iterate its descendants.
- There might be a (slightly) better way to remove the seam, with less conversion between coordinates.
