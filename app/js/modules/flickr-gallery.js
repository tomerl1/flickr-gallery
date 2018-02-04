import Point from "./point";

const feedUrl = 'https://api.flickr.com/services/feeds/photos_public.gne?format=json';

/* 
    This function is used as the callback for flickrs photos_public feed.
*/
function jsonFlickrFeed(data) {
    this.setData(data);
}

/* 
    An awesome Flickr Gallery that pulls the data from Flickrs photos_public feed.
*/
class FlickrGallery {
    constructor(selector) {
        if (!selector) {
            throw new Error('The selector can not be empty');
        }

        // init required properties
        this.elRoot = document.querySelector(selector);
        this.arrImages = [];
        this.history = [];

        // attach some events to the window
        window.addEventListener('resize', this.displayImages.bind(this));
        window.addEventListener('hashchange', this.handleHashChange.bind(this));

        // load flickr feed data
        this.registerFlickrCallback();
        this.createFeedRequest();
        this.detectTouchDevice();
    }

    /* 
        Try to detect if the browser is 'touch-enabled'.
        If it has touch then add the relevant class.
        Currently the 'touch' class will disable the 'hover' animations (It's still very pretty!). 
    */
    detectTouchDevice() {
        let hasTouch = true;

        // this function only works on the first load (when the document object is created)
        try {
            document.createEvent("TouchEvent");
        } catch (e) {
            hasTouch = false;
        }

        // console.log('hasTouch', hasTouch);
        if (hasTouch) {
            this.elRoot.classList.add('touch');
        }
    }

    /* 
        Handles location.hash changes.
        If a hash value is found it is passed as the author_id parameter to Flickr photos_public feed.
    */
    handleHashChange() {
        const authorId = window.location.hash.substr(1);
        if (authorId && authorId.length > 0) {
            // save the history!
            this.saveState();
            this.createFeedRequest(`&id=${authorId}`);
        }
        else {
            // mostly like a back button..
            this.loadFromState();
        }
    }

    /* 
        Saves the current state of the gallery so that we can pull it back later if we need to go back.
    */
    saveState() {
        this.history.push({
            data: JSON.parse(JSON.stringify(this.data))
        });
    }

    /* 
        Pops the previous state of the gallery from the history queue and then loads again to the UI.
    */
    loadFromState() {
        const prevValue = this.history.pop();
        this.setData(prevValue.data);
    }

    /* 
        Attach the callback function to the window
    */
    registerFlickrCallback() {
        const self = this;

        // if for some reason someone already defined the callback function
        // we have to make sure there is no conflict
        if (window.jsonFlickrFeed) {
            const original = window.jsonFlickrFeed;
            window.jsonFlickrFeed = function () {
                original.apply(window, arguments);
                jsonFlickrFeed.apply(self, arguments);
            }
        }
        else {
            window.jsonFlickrFeed = function (data) {
                jsonFlickrFeed.apply(self, arguments);
            }
        }
    }

    /* 
        Creates a script tag that will trigger a call to Flickrs photo_public feed
    */
    createFeedRequest(params) {
        params = params || '';
        const script = document.createElement('script');
        script.src = feedUrl + params;
        document.body.appendChild(script);
        this.script = script;

        const event = new CustomEvent('reset-progress');
        this.elRoot.dispatchEvent(event);
    }

    /* 
        Sets new data for the gallery (but only if we have any data).
    */
    setData(data) {
        if (!data) {
            console.log('oops.. no data');
            return;
        }

        // console.log('got data...', data);
        this.data = data;
        if (this.script) {
            document.body.removeChild(this.script);
            this.script = undefined;
        }

        this.preloadImages(this.data.items);
    }

    /* 
        Preloads the images for the gallery.
        This makes the user experience much nicer and it also enables the use of a progress bar.
    */
    preloadImages(items) {
        this.arrImages = [];

        // preload data info
        this.preload = {
            count: items.length,
            current: 0,
            percent: function () {
                return Math.round((this.current / this.count) * 100);
            },
            isDone: function () {
                return this.current === this.count;
            }
        }

        items.forEach(element => {
            this.preloadImage(element);
        });
    }

    /* 
        Creates an Image object to load the picture into the browsers cache.
        This function triggers and update-progress event to enable the use of progress bars.        
    */
    preloadImage(image) {
        const url = image.media.m;
        const img = new Image();
        this.arrImages.push(img);
        img.dataset['flickr'] = JSON.stringify(image);

        img.onload = (e) => {
            this.preload.current++;
            const event = new CustomEvent('update-progress', { detail: this.preload.percent() });
            this.elRoot.dispatchEvent(event);

            if (this.preload.isDone()) {
                // attempt to ensure that all progress bar animations are completed
                // and allow some additional time to end
                setTimeout(() => {
                    this.displayImages();
                }, 50);
            }
        }

        img.src = url;
    }

    /*  
        Gets an HTML string for the sepcified image and size.
        The image has to include all relevant dataset values (flickrs data).
    */
    getImageHtml(image, size) {
        const flickrData = JSON.parse(image.dataset['flickr']);
        const dateTaken = new Date(flickrData.date_taken);
        const formattedDate = `${dateTaken.getDate().toString().padStart(2, '0')}-${(dateTaken.getMonth() + 1).toString().padStart(2, '0')}-${dateTaken.getFullYear()}`;
        const author = flickrData.author.replace(/(.*)"(.*)"(.*)/, "$2");

        // template literal - the power of ES6!
        return `<div class="image-wrapper" style="height:${size.height}px;">
            <a class="gallery-image" style="width:${size.width}px;height:${size.height}px;" target="_blank" title="${flickrData.title}" href="${flickrData.link}">
                <img src="${image.src}" alt="${flickrData.title}" />
            </a>
            <div class="image-author">
                <div class="image-author-inner ellipsis">
                    by <a href="#${flickrData.author_id}" title="@${author} | ${flickrData.title}" data-author-id="${flickrData.author_id}">${author}</a>
                </div>
            </div>
            <div class="image-date"><span class="image-date-inner ellipsis">${formattedDate}</span></div>
        </div>`;
    }

    /* 
        Render the images to the root element.
    */
    displayImages() {
        // reset!
        this.elRoot.innerHTML = '';

        const images = this.arrImages;
        const width = this.elRoot.offsetWidth - 40;
        const defaultRowHeight = 200;
        const height = defaultRowHeight; // some default height
        const border = 0;
        const maxRowHeight = 500;

        let totalWidth = 0;
        let widths = [];
        let currentWidth = 0;

        // calculate the width of each image
        images.forEach((img, i) => {
            const size = this.getSize(img);

            // check if the size requries adjusments (most images will require the adjustment)
            if (size.y !== height) {
                // scale the width with the height
                size.x = Math.floor(size.x * (height / size.y));
            }

            totalWidth += size.x;
            widths.push(size.x);
        });

        const rowsCount = Math.ceil(totalWidth / width);
        const perRowWidth = totalWidth / rowsCount;
        console.log('rows count', rowsCount);

        const rows = this.generateRows(images, widths, perRowWidth);

        let rowNum = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const lastRow = i === rows.length - 1;
            let availableRowWidth = width;

            rowNum = i + 1;
            currentWidth = -1 * border;

            // Ratio of actual width of row to total width of images to be used.
            let ratio = availableRowWidth / row.width;
            let imageCount = row.images.length;

            // new height is not original height * ratio
            const rowHeight = Math.min(Math.floor(height * ratio), maxRowHeight);
            ratio = rowHeight / defaultRowHeight;

            // create and render a new row
            const domRow = this.createDomRow(rowHeight + border);
            this.elRoot.appendChild(domRow);

            let { imagesHtml, rowWidth } = this.generateImagesHtml(row, ratio, border, currentWidth, rowHeight);

            if (this.writeImagesHtml(domRow, imagesHtml)) {
                continue; // this row is empty, skip to the next row
            }

            // try to adjust images widths to fill the full length(width) of the row
            this.adjustToFill(rowWidth, availableRowWidth, domRow, imageCount);
        }
    }

    /* 
        Generates and array of rows.
        Each row holds an array of images to place inside the row and the total width of that row.
        It converts a flat array of images into a matrix of rows and images.
    */
    generateRows(images, widths, perRowWidth) {
        const imagesCount = images.length;

        let rows = [];
        let totalWidth = 0;
        let baseLine = 0; // used as an "image index", we need this because we need to 'unflat' the images array

        while (baseLine < imagesCount) {
            const row = {
                width: 0,
                images: []
            };

            let i = 0;

            while ((totalWidth + widths[baseLine + i] / 2 <= perRowWidth * (rows.length + 1))
                && (baseLine + i < imagesCount)) {
                totalWidth += widths[baseLine + i];
                row.width += widths[baseLine + i];

                row.images.push({
                    width: widths[baseLine + i],
                    image: images[baseLine + i]
                });

                i++;
            }

            baseLine += i;
            rows.push(row);
        }

        return rows;
    }

    /* 
        Generates the HTML for the given row
    */
    generateImagesHtml(row, ratio, border, currentWidth, rowHeight) {
        let imagesHtml = [];

        for (let j = 0; j < row.images.length; j++) {
            var image = row.images[j].image;

            // calculate new width based on ratio
            var ratioWidth = Math.floor(row.images[j].width * ratio);
            currentWidth += ratioWidth + border;

            imagesHtml.push(this.getImageHtml(image, {
                width: ratioWidth,
                height: rowHeight
            }));
        }

        return { imagesHtml: imagesHtml.join(''), rowWidth: currentWidth };
    }

    /* 
        Creates a new row dom element.
    */
    createDomRow(height) {
        const domRow = document.createElement("div");
        domRow.className = "gallery-row";
        domRow.style.height = height + 'px';
        return domRow;
    }

    /* 
        Write the given HTML into the specified row.
        Returns true it the HTML is empty, otherwise returns false.
    */
    writeImagesHtml(domRow, html) {
        let isEmpty = false;

        // remove empty rows...
        if (html === '') {
            domRow.parentElement.removeChild(domRow);
            isEmpty = true;
        }

        // add the html for the images
        domRow.innerHTML = html;
        return isEmpty;
    }

    /* 
        Adjust the width the of the given images to the specified width the the row
    */
    adjustToFill(currentWidth, availableRowWidth, domRow, imageCount) {
        let i = 0;
        while (currentWidth < availableRowWidth) {
            const imageContainer = domRow.querySelector('.image-wrapper:nth-child(' + (i + 1) + ') .gallery-image');
            imageContainer.style.width = (imageContainer.offsetWidth + 1) + 'px';
            // next image in the row
            i = (i + 1) % imageCount;
            currentWidth++;
        }

        i = 0;
        while (currentWidth > availableRowWidth) {
            const imageContainer = domRow.querySelector('.image-wrapper:nth-child(' + (i + 1) + ') .gallery-image');
            imageContainer.style.width = (imageContainer.offsetWidth - 1) + 'px';
            // next image in the row
            i = (i + 1) % imageCount;
            currentWidth--;
        }
    }

    /* 
        Gets the dimenstions of the specified img.
    */
    getSize(img) {
        return new Point(img.naturalWidth, img.naturalHeight);
    }
}

export default FlickrGallery; 
