import {html} from 'lit-html';

const QUARTER_CONTAINER_ITEMS = 4;
const FULL_CONTAINER_ITEMS = 4;

let expandedRow = undefined;
let hovered = undefined;

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
    return html`<div data-id="${item.item.id}" class="thumb ${item.size}" style="background-image: url('${item.item.thumb}')"></div>`;
}

const renderContainer = (container) => {
    return html`<div class="grid-container ${container.size}">
        ${container.items.map(item => renderItem(item))}
    </div>`;
}

const containerizeData = (data, columns) => {
    const predictedQuarterContainers = Math.ceil(data.length / QUARTER_CONTAINER_ITEMS);
    // const amtToFillLastQuarter = data.length % QUARTER_CONTAINER_ITEMS;
    const predictedFullContainers = Math.ceil(predictedQuarterContainers / FULL_CONTAINER_ITEMS);
    // const amtToFillLastFull = FULL_CONTAINER_ITEMS - predictedQuarterContainers % FULL_CONTAINER_ITEMS;
    const predictedRows = Math.ceil(predictedFullContainers / columns);
    // const amtToFillLastRow = columns - predictedFullContainers % columns;
    const numSmallToFillEvenly = predictedRows * QUARTER_CONTAINER_ITEMS * FULL_CONTAINER_ITEMS * columns;

    /* console.log('predictions for ', columns, ' columns');
    console.log('fill last quarter: ', amtToFillLastQuarter);
    console.log('fill last full: ', amtToFillLastFull);
    console.log('fill last row: ', amtToFillLastRow);
    console.log('num rows: ', predictedRows);
    console.log('to fill evenly:', numSmallToFillEvenly);
    console.log('delta: ', numSmallToFillEvenly - data.length); */

    // delta filling is the remainder of small dots we'd need to fill the last row evenly
    // instead of small dots, we'll be filling with larger dots to try to round out the result
    let deltaFilling = numSmallToFillEvenly - data.length;
    let originalDeltaFilling = deltaFilling;

    const fullContainers = [];
    // limit the big ones to half the fill weight so we don't go overboard
    while (deltaFilling > 12 && deltaFilling > originalDeltaFilling / 2) {
        // cast as quarter item
        fullContainers.push({ item: data.pop(), size: 'l' });
        deltaFilling -= QUARTER_CONTAINER_ITEMS * FULL_CONTAINER_ITEMS - 1; // trade 1 item for 15 spaces
    }

    const quarterContainers = [];
    while (deltaFilling > QUARTER_CONTAINER_ITEMS) {
        // cast as quarter item
        quarterContainers.push({ item: data.pop(), size: 'm' });
        deltaFilling -= QUARTER_CONTAINER_ITEMS - 1; // trade 1 item for 3 spaces
    }

    // still not perfectly even? make some duplicate small items, there should be 3 at most
    while (deltaFilling > 0) {
        data.push(data[deltaFilling]);
        deltaFilling --;
    }

    // fill quarter containers
    data.forEach(item => {
        let currentQuarterContainer = quarterContainers[quarterContainers.length - 1];
        if (!currentQuarterContainer ||
            !currentQuarterContainer.items ||
            currentQuarterContainer.items.length >= QUARTER_CONTAINER_ITEMS ) {
            currentQuarterContainer = {type: 'container', size: 'quarter', items: []};
            quarterContainers.push(currentQuarterContainer);
        }
        currentQuarterContainer.items.push( { item, size: 's'} );
    });

    // fill full size containers
    shuffleArray(quarterContainers).forEach( qt => {
        let currentFullContainer = fullContainers[fullContainers.length - 1];
        if (!currentFullContainer ||
            !currentFullContainer.items ||
            currentFullContainer.items.length >= FULL_CONTAINER_ITEMS ) {
            currentFullContainer = {type: 'container', size: 'full', items: []};
            fullContainers.push(currentFullContainer);
        }
        currentFullContainer.items.push(qt);
    });

    // now organize into rows
    const rows = [ [] ];
    shuffleArray(fullContainers).forEach( cont => {
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
