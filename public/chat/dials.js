
    // Global object to hold references to our widget controllers
    const cargoWidgets = {};

    /**
    * Initializes the monitoring widgets with the provided specifications.
    * This is the main entry point to set up the widgets.
    * @param {object} temperatureSpec - An object with temp ranges.
    * @param {object} humiditySpec - An object with humidity ranges.
    */
    window.setMonitor = function(temperatureSpec, humiditySpec) {
    if (!temperatureSpec || !temperatureSpec.Produce || !humiditySpec || !humiditySpec.Produce) {
    console.error("Invalid spec provided. Make sure 'Produce' property exists.");
    return;
}
    initializeCargoWidget('temperature-monitor', temperatureSpec, '°F');
    initializeCargoWidget('humidity', humiditySpec, '%');
}

    /**
    * Manually changes a widget's value after it has been initialized.
    * @param {string} name - The name of the widget ('temperature' or 'humidity').
    * @param {string} direction - 'up' or 'down'.
    * @param {number} amount - The value to change by.
    */
    window.setWidget = function(name, direction, amount=15) {
    const controller = cargoWidgets[name];

    if (!controller) {
    console.error(`Widget "${name}" not found.`);
    return;
}
    const currentValue = parseFloat(controller.valueElement.dataset.currentValue);
    let newValue = currentValue;
    if (direction === 'up') newValue += amount;
    else if (direction === 'down') newValue -= amount;
    controller.update(newValue);
}

    /**
    * Sets up and controls a single widget. (This is the core internal logic).
    * @param {string} containerId - The ID of the widget's container element.
    * @param {object} spec - The specification object for this metric.
    * @param {string} unit - The unit of measurement (e.g., '°F' or '%').
    */
    function initializeCargoWidget(containerId, spec, unit) {
    const containerEl = document.getElementById(containerId);
    if (!containerEl || !spec) return;
    const titleEl = containerEl.querySelector('.cargo-title');
    const widgetEl = containerEl.querySelector('.widget');
    const valueEl = containerEl.querySelector('.value');
    const unitEl = containerEl.querySelector('.unit');
    const statusLabelEl = containerEl.querySelector('.status-label');
    const produceName = spec.Produce;
    const statusPriority = ['good', 'caution', 'danger', 'damaged'];

    function parseRange(rangeStr) {
    if (!rangeStr) return { min: NaN, max: NaN };
    if (rangeStr.includes('<')) return { min: -Infinity, max: parseFloat(rangeStr.replace('<', '')) };
    if (rangeStr.includes('>')) return { min: parseFloat(rangeStr.replace('>', '')), max: Infinity };
    if (rangeStr.includes('-')) {
    const parts = rangeStr.split('-').map(parseFloat);
    return { min: parts[0], max: parts[1] };
}
    return { min: NaN, max: NaN };
}

    function updateWidget(val) {
    if (val === null || isNaN(val)) return;
    let currentStatus = 'unknown';
    for (const status of statusPriority) {
    const rangeStr = spec[status];
    if (!rangeStr) continue;
    const range = parseRange(rangeStr);
    if ((val > range.min && range.max === Infinity) || (val < range.max && range.min === -Infinity) || (val >= range.min && val <= range.max)) {
    currentStatus = status;
    break;
}
}
    valueEl.dataset.currentValue = val;
    valueEl.textContent = Math.round(val);
    statusLabelEl.textContent = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
    widgetEl.className = 'widget';
    widgetEl.classList.add(currentStatus);
}

    const baseTitle = titleEl.textContent.split(' ').pop();
    titleEl.textContent = `${produceName} ${baseTitle}`;
    unitEl.textContent = unit;

    const initialGoodRange = spec.good ? spec.good.split('-').map(parseFloat) : [40, 60];
    const initialValue = (initialGoodRange[0] + initialGoodRange[1]) / 2;
    updateWidget(initialValue);

    const widgetKey = containerId.split('-')[0];
    cargoWidgets[widgetKey] = {
    update: updateWidget,
    valueElement: valueEl
};
}

    // --- USAGE EXAMPLE ---
    // 1. Define the rules for your produce as simple objects.
    const tomatoTempSpec = {
    Produce: 'Tomatoes', caution: '<45', good: '45-65', danger: '65-80', damaged: '>80'
};
    const tomatoHumidSpec = {
    Produce: 'Tomatoes', danger: '<80', good: '80-95', caution: '>95'
};

    // 2. Call setMonitor() with your data to start the widgets.
    setMonitor(tomatoTempSpec, tomatoHumidSpec);

    // 3. After setup, you can update the values with setWidget() at any time.
    // For example: setWidget('temperature', 'up', 10);




