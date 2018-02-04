# Flickr Gallery

## Notes

This is an assignment project of a simple Flickr Gallery.

### Main Features:

* ES6, SASS, HTML5
* The Gallery
    * Preload images for a better UX
    * Responsive design (the gallery should fit to any resolution)
    * Hover an image to show information such as author name, date taken, title (disabled for touch enabled devices)
    * Click on an image to view full size @ flickr.com
    * Click on the authors name to view more photos from that author
    * Enabled "history" functionality so you can go back to the main gallery
    * Generic (can be extracted and used in other projects / standalone gallery component)
* A neat progress bar to go along with the gallery
* Code is fully documented
* This lovely markdown file

### Dev tools / features:
* Webpack
* Webpack dev server (hot reload)
* Webpack production config
* Babel

The component is repsonsive and supports mobile devices, tablets and desktops.
I have only tested it on my own PC using Chrome.

I disabled all "hover" animations for 'touch-enabled' devices, so the animations are only shown when the code can't detect touch functionality.

## Install

Install dependencies
```
npm install
```

## Run (dev server)
```
npm start
```
Then browse to http://localhost:3000/

## Build (for production)
```
npm run build
```
Afterwards just open 'index.html' without a server (tested in Chrome).
