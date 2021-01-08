import {html, render} from 'lit-html';

const QUARTER_CONTAINER_ITEMS = 4;

export const renderGallery = (container) => {
    let thumbSize = 78;
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

    render(template(generateSampleData(200), numColumns), container);
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
            callback(thumb.dataset.id);
        }
    });
}

const renderItem = (item) => {
    if (item.type === 'container') {
        return html`${renderContainer(item)}`;
    }
    return html`<div data-id="${item.item.id}" class="thumb ${item.size} anim${Math.floor(Math.random() * 10)}" style="background-image: url('${item.item.thumb}')"></div>`;
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
        results.push( { id: c, thumb: `./sampleimages/sample${parseInt(Math.random() * 7) + 1}.jpeg` } );
    }
    return results;
}
