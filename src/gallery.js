import {html, render} from 'lit-html';

const params = new URLSearchParams(document.location.href.split('?')[1] );

const QUARTER_CONTAINER_ITEMS = 4;
const BASE_DEVICE_PIXEL_RATIO_SIZE = 39;
const ASSET_CATEGORY = 'all' // layer, composite
const THUMB_URI = 'https://artparty.ctlprojects.com';
const THUMBS_PER_PAGE = Number(params.get('thumbsperpage')) || 100;
const REMIX_APP = 'http://adobe.deyoungsters.com/remix';
let currentPage = 0;

const pages = [];
let assets = undefined;
let users = undefined;
let galleryContainer = undefined;
let paginationContainer = undefined;

export const renderGallery = (container, pagination) => {
    galleryContainer = container;
    paginationContainer = pagination;

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
        render(galleryTemplate(assets, numColumns), container);
    } if (params.has('dataurl') && pages.length > 0) {
        // static data is already loaded - we just need to refresh from new page
        // we're pretending the fetched assets are one page only, so populating from the
        // prev loaded pages 2D array
        const assets = pages[currentPage];
        const totalAssets = pages.map(page => page.length).reduce((prev, next) => prev + next);
        render(galleryTemplate( assets, numColumns), container);
        render(paginationTemplate(currentPage * THUMBS_PER_PAGE, currentPage * THUMBS_PER_PAGE + THUMBS_PER_PAGE, totalAssets), pagination);
    } else {
        loadData().then( (data) => {
            let pageStart = data.start;
            let pageEnd = data.start + data.assets.length;
            let totalAssets = data.total;
            if (params.has('dataurl')) {
                // a data url has been passed to load a static JSON asset file, we should divide
                // the set for pagination
                assets = paginateStaticData(data.assets);
                pageStart = 0;
                pageEnd = THUMBS_PER_PAGE;
                totalAssets = data.assets.length;
            } else {
                assets = data.assets;
            }
            users = data.users;
            render(galleryTemplate( assets, numColumns), container);
            render(paginationTemplate(pageStart, pageEnd, totalAssets), pagination);
        });
    }
}

export const renderModalInfo = (infoContainer, asset, user) => {
    render(
        html`<h3>${user.first} ${user.last}${user.last ? '.' : ''}</h3>
            <span>${user.age ? 'Age' : ''} ${user.age}</span>
            <button 
                    data-id=${asset.unique_id}
                    data-layer=${asset.asset_type}
                    @click=${(e) => remixImage(e)} 
                    id="remix-btn">
                <img src="assets/remix-icon.svg"/> Remix!
            </button>`
        , infoContainer);
};

export const remixImage = (e) => {
    let background = 'upload';
    if (e && e.dataset && e.dataset.id && e.dataset.layer) {
        background = getAssetImage({ unique_id: e.currentTarget.dataset.id, asset_type: e.currentTarget.dataset.layer }, 'full');
    }
    window.location.href = `${REMIX_APP}?background=${background}`;
};

const paginationTemplate = (pageStart, pageEnd, totalAssets) => {
    const numPages = Math.ceil(totalAssets / THUMBS_PER_PAGE);
    const currentPage = Math.floor(pageStart / THUMBS_PER_PAGE);

    if (numPages <= 1) {
        return html``;
    }

    let pages = [ ...Array(numPages-1).keys() ];
    const visiblePages = 5;
    if (pages.length > visiblePages) {
        if (currentPage < visiblePages/2) {
            pages = [ ...pages.slice(0, visiblePages), '...' ];
        } else if (currentPage > pages.length - visiblePages/2) {
            pages = [ '...', ...pages.slice(pages.length - visiblePages), pages.length ];
        } else {
            pages = [ ...pages.slice(currentPage - visiblePages/2, currentPage), '...', currentPage, '...', ...pages.slice(currentPage + 1, currentPage + visiblePages/2)];
        }
    }
    const links = ['Previous', ...pages, 'Next'];
    return html`${links.map( (page) => individualPageTemplate(page, numPages))}`;
};

const individualPageTemplate = (page, numPages) => {
    if (typeof page === 'number') {
        return html`<a data-page=${page+1} @click=${ (e) => navigatePage(e)} class="page ${page+1 === currentPage+1 ? 'current' : ''}">${page+1}</a>`;
    }

    if (page === '...') {
        return html`<span>${page}</span>`;
    }

    let disabled = false;
    if (page === 'Previous' && currentPage === 0) {
        disabled = true;
    }

    if (page === 'Next' && currentPage >= numPages - 1) {
        disabled = true;
    }

    if (disabled) {
        return html`<span class="disabled">${page}</span>`;
    }
    return html`<a data-page=${page} @click=${(e) => navigatePage(e)}>${page}</a>`;
}

const navigatePage = (event) => {
    if (event.target.dataset.page === 'Next') {
        currentPage ++;
    } else if (event.target.dataset.page === 'Previous') {
        currentPage --;
    } else {
        currentPage = event.target.dataset.page - 1;
    }
    renderGallery(galleryContainer, paginationContainer);
};

const galleryTemplate = (data, numColumns) => {
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
            const asset = assets.find(a => a.unique_id === Number(thumb.dataset.id));
            callback(asset, users[asset.user_id]);
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
            return `${THUMB_URI}/thumbnail/${item.asset_type}/${item.unique_id}/50`;
        case 'm':
            return `${THUMB_URI}/thumbnail/${item.asset_type}/${item.unique_id}/150`;
        case 'full':
            return `${THUMB_URI}/image/${item.asset_type}/${item.unique_id}`;
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

/**
 * for use on a full list of assets that are loaded from a static JSON file
 * we still want to paginate this data, so divide it up
 * @param assets
 * @return {*}
 */
const paginateStaticData = (assets) => {
    const numPages = Math.ceil(assets.length / THUMBS_PER_PAGE);
    pages.splice(0, pages.length);
    for (let c = 0; c < numPages; c++) {
        const page = assets.slice(THUMBS_PER_PAGE * c, THUMBS_PER_PAGE * c + THUMBS_PER_PAGE);
        pages.push(page);
    }
    return pages[0];
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
    // url of live server
    const serverUrl = `https://artparty.ctlprojects.com/list/${ASSET_CATEGORY}?__do_not_cache__=${Date.now()}&count=${THUMBS_PER_PAGE}&page=${currentPage}`;
    const targetUrl = params.has('dataurl') ? params.get('datarul') || './assets/sampledata.json' : serverUrl;
    const proxyUrl = params.has('proxy') ? (params.get('proxy') || 'https://cors-anywhere.herokuapp.com') : undefined;
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
