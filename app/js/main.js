'use strict';

import FlickrGallery from "./modules/flickr-gallery";
import ProgressBar from './modules/progrss-bar';
import progrssBar from "./modules/progrss-bar";

const flickr = new FlickrGallery('.flickr-gallery');
const progressBar = new ProgressBar('.progressbar');

flickr.elRoot.addEventListener('update-progress', function (e) {
    progressBar.setValue(e.detail);
});

flickr.elRoot.addEventListener('reset-progress', function (e) {
    progressBar.reset();
});

console.log('main.js loaded.');
