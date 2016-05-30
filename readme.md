##Install

OSX requires

    brew install pkg-config cairo libpng jpeg giflib
    xcode-select --install # el capitain only

Ubuntu 

    sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

Everyone

    npm install

##Test

    npm run test

##Optimizations

- Iterate arrays in a CPU cache efficient way
- Keep track of smallest on top row
- Have two matrices, one for min_x and one for energies so that we can use typed arrays
- Could convert picture rgba array to [`Uint32Array` rgb number array](https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/) to save space
- Logical deletes

##Todo
- Test remove vertical seam
- Draw energy
