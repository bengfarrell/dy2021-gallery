import {html, render} from 'lit-html';

const params = new URLSearchParams(document.location.href.split('?')[1] );

const QUARTER_CONTAINER_ITEMS = 4;
const BASE_DEVICE_PIXEL_RATIO_SIZE = 39;
const ASSET_CATEGORY = 'layer'
const THUMB_URI = 'http://artparty.ctlprojects.com/';
const THUMBS_PER_PAGE = 200;

let assets = undefined;

export const renderGallery = (container) => {
    let thumbSize = BASE_DEVICE_PIXEL_RATIO_SIZE * window.devicePixelRatio;
    let thumbMargin = parseInt(thumbSize / 6);
    let blockSize = thumbSize * 2 + thumbMargin * 2 * 2; // synchronize with full container size

    let numColumns;
    const colsfloat = container.getBoundingClientRect().width / blockSize;
    if (Math.ceil(colsfloat) - colsfloat < .5) {
        // smaller size change accomplished by rounding up
        numColumns = Math.ceil(colsfloat);
    } else {
        // smaller size change accomplished by rounding down
        numColumns = Math.floor(colsfloat);
    }

    // reverse above calculations to get new sizes that exactly fit container
    blockSize = Math.floor(container.getBoundingClientRect().width / numColumns);
    thumbSize = (3 * blockSize) / 8;
    thumbMargin = thumbSize / 6;

    document.documentElement.style.setProperty('--smallThumbSize', thumbSize + 'px');
    document.documentElement.style.setProperty('--smallThumbMargin', thumbMargin + 'px');

    if (params.has('fakedata')) {
        assets = generateSampleData(THUMBS_PER_PAGE);
        render(template(assets, numColumns), container);
    } else {
        loadData().then( (data) => {
            assets = Object.values(data.assets);
            render(template( assets, numColumns), container);
        });
    }
}

export const template = (data, numColumns) => {
    const grid = containerizeData(data, numColumns);
    return html`${grid.map((row) =>
            html`<div class="row">${row.map((item) => {
                return html`${renderItem(item)}`;
            })
        }</div>`
    )}`;
};

export const addInteractivity = (container, callback) => {
    container.addEventListener('click', event => {
        const thumb = event.target;
        if (thumb.classList.contains('thumb')) {
            callback(assets.find(a => a.unique_id === Number(thumb.dataset.id)));
        }
    });
}

export const getAssetImage = (item, size) => {
    if (item.thumb) {
        // using sample data set
        return item.thumb;
    }
    switch (size) {
        case 's':
            return `${THUMB_URI}/thumbnail/${ASSET_CATEGORY}/${item.unique_id}/50`;
        case 'm':
            return `${THUMB_URI}/thumbnail/${ASSET_CATEGORY}/${item.unique_id}/150`;
        case 'full':
            return `${THUMB_URI}/image/${ASSET_CATEGORY}/${item.unique_id}`;
    }
}

const renderItem = (item) => {
    if (item.type === 'container') {
        return html`${renderContainer(item)}`;
    }

    return html`<div data-id="${item.item.unique_id}" class="thumb ${item.size} anim${Math.floor(Math.random() * 10)}" style="background-image: url('${getAssetImage(item.item, item.size)}')"></div>`;
}

const renderContainer = (container) => {
    return html`<div class="grid-container ${container.size}">
        ${container.items.map(item => renderItem(item))}
    </div>`;
}

const containerizeData = (data, columns) => {
    // see how many quarter containers we can evenly fill
    let numQuarterContainers = Math.floor(data.length / QUARTER_CONTAINER_ITEMS);

    // start with items left over from dividing into 4x boxes for num of large items
    let largeItems = data.length % QUARTER_CONTAINER_ITEMS;

    // ratio big dots to 4x container
    const ratio = 1/21;
    while (largeItems / (numQuarterContainers * QUARTER_CONTAINER_ITEMS) < ratio) {
        numQuarterContainers --;
        largeItems += 4;
    }

    const quarterContainers = [];
    data.forEach( (item, index) => {
        if (index <= largeItems) {
            quarterContainers.push({ item: item, size: 'm' });
        } else {
            let currentQuarterContainer = quarterContainers[quarterContainers.length - 1];
            if (!currentQuarterContainer ||
                !currentQuarterContainer.items ||
                currentQuarterContainer.items.length >= QUARTER_CONTAINER_ITEMS ) {
                currentQuarterContainer = {type: 'container', size: 'quarter', items: []};
                quarterContainers.push(currentQuarterContainer);
            }
            currentQuarterContainer.items.push( { item, size: 's'} );
        }
    });

    // now organize into rows
    const rows = [ [] ];
    shuffleArray(quarterContainers).forEach( cont => {
        let currentRow = rows[rows.length - 1];
        if (currentRow.length >= columns) {
            currentRow = [];
            rows.push(currentRow);
        }
        currentRow.push(cont);
    });
    return rows;
}

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const generateSampleData = (numItems) => {
    const results = [];
    for (let c = 0; c < numItems; c++) {
        results.push( { unique_id: c, thumb: `./sampleimages/sample${parseInt(Math.random() * 7) + 1}.jpeg` } );
    }
    return results;
}

export const loadData = () => {
    const proxyUrl = params.has('proxy') ? (params.get('proxy') || 'https://cors-anywhere.herokuapp.com') : undefined;
    const targetUrl = `http://artparty.ctlprojects.com/list/${ASSET_CATEGORY}?count=${THUMBS_PER_PAGE}`;
    const uri = proxyUrl ? `${proxyUrl}/${targetUrl}` : `${targetUrl}`;

    return fetch(uri)
        .then(blob => blob.json())
        .then(data => {
            return data;
        })
        .catch(e => {
            console.error(e);
            return e;
        });
}
