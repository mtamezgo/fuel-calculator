// Constants for conversions
const LITERS_PER_GALLON = 3.78541;

// Application State
let state = {
    exchangeRate: 0,
    basePrice: 0,
    gallons: 0,
    liters: 0,
    concepts: [],
    presets: [],
    decimalPlaces: 4, // 2 or 4
    margin: 0, // Margin value (can be entered in any format)
    marginInputType: 'mxnLtr', // Which cell was last edited for margin
    draggedRow: null // For drag and drop
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPresets();
    initializeEventListeners();
    addDefaultConcept();
});

// Initialize event listeners
function initializeEventListeners() {
    // Exchange rate fetch button
    document.getElementById('fetchExchangeRate').addEventListener('click', fetchExchangeRate);

    // Input fields
    document.getElementById('exchangeRate').addEventListener('input', handleExchangeRateChange);
    document.getElementById('basePrice').addEventListener('input', handleBasePriceChange);
    document.getElementById('gallons').addEventListener('input', handleGallonsChange);
    document.getElementById('liters').addEventListener('input', handleLitersChange);

    // Add concept button
    document.getElementById('addConcept').addEventListener('click', addConcept);

    // Preset buttons
    document.getElementById('savePreset').addEventListener('click', savePreset);
    document.getElementById('loadPreset').addEventListener('click', handleLoadPreset);
    document.getElementById('updatePreset').addEventListener('click', updatePreset);
    document.getElementById('deletePreset').addEventListener('click', handleDeletePreset);

    // Toggle decimals button
    document.getElementById('toggleDecimals').addEventListener('click', toggleDecimals);

    // Share to WhatsApp button
    document.getElementById('shareWhatsApp').addEventListener('click', shareToWhatsApp);
}

// Number formatting utilities
function formatNumber(value, decimals = null) {
    const places = decimals !== null ? decimals : state.decimalPlaces;
    const formatted = parseFloat(value).toFixed(places);
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

function parseFormattedNumber(value) {
    if (typeof value === 'number') return value;
    return parseFloat(value.toString().replace(/,/g, '')) || 0;
}

function toggleDecimals() {
    state.decimalPlaces = state.decimalPlaces === 4 ? 2 : 4;
    const button = document.getElementById('toggleDecimals');
    button.textContent = state.decimalPlaces === 4 ? 'Switch to 2 Decimals' : 'Switch to 4 Decimals';
    recalculateAll();
}

// Conversion utilities
function gallonsToLiters(gallons) {
    return gallons * LITERS_PER_GALLON;
}

function litersToGallons(liters) {
    return liters / LITERS_PER_GALLON;
}

function usdPerGalToMxnPerLtr(usdPerGal, exchangeRate) {
    if (!exchangeRate) return 0;
    const usdPerLtr = usdPerGal / LITERS_PER_GALLON;
    return usdPerLtr * exchangeRate;
}

function mxnPerLtrToUsdPerGal(mxnPerLtr, exchangeRate) {
    if (!exchangeRate) return 0;
    const usdPerLtr = mxnPerLtr / exchangeRate;
    return usdPerLtr * LITERS_PER_GALLON;
}

function mxnToUsd(mxn, exchangeRate) {
    if (!exchangeRate) return 0;
    return mxn / exchangeRate;
}

function usdToMxn(usd, exchangeRate) {
    if (!exchangeRate) return 0;
    return usd * exchangeRate;
}

// Fetch exchange rate from API
async function fetchExchangeRate() {
    const button = document.getElementById('fetchExchangeRate');
    const info = document.getElementById('exchangeRateInfo');

    button.disabled = true;
    button.textContent = 'Fetching...';
    info.textContent = 'Fetching current exchange rate...';

    try {
        // Using exchangerate-api.com (free tier - 1500 requests/month)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }

        const data = await response.json();
        const rate = data.rates.MXN;

        document.getElementById('exchangeRate').value = rate.toFixed(4);
        state.exchangeRate = rate;

        const date = new Date(data.time_last_updated * 1000);
        info.textContent = `Rate updated: ${rate.toFixed(4)} MXN/USD (as of ${date.toLocaleDateString()})`;
        info.style.color = '#28a745';

        recalculateAll();
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        info.textContent = 'Error fetching rate. Please enter manually.';
        info.style.color = '#dc3545';
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch Current Rate';
    }
}

// Handle input changes
function handleExchangeRateChange(e) {
    state.exchangeRate = parseFloat(e.target.value) || 0;
    recalculateAll();
}

function handleBasePriceChange(e) {
    state.basePrice = parseFloat(e.target.value) || 0;
    recalculateAll();
}

function handleGallonsChange(e) {
    state.gallons = parseFloat(e.target.value) || 0;
    // Update liters
    state.liters = gallonsToLiters(state.gallons);
    document.getElementById('liters').value = state.liters.toFixed(2);
    recalculateAll();
}

function handleLitersChange(e) {
    state.liters = parseFloat(e.target.value) || 0;
    // Update gallons
    state.gallons = litersToGallons(state.liters);
    document.getElementById('gallons').value = state.gallons.toFixed(2);
    recalculateAll();
}

// Add default concept (Molecule Price)
function addDefaultConcept() {
    const concept = {
        id: Date.now(),
        name: 'Molecule Price',
        inputType: 'usdGal',
        value: 0,
        isBase: true
    };

    state.concepts.push(concept);
    renderConcept(concept);
}

// Add new concept
function addConcept() {
    const concept = {
        id: Date.now(),
        name: 'New Concept',
        inputType: 'mxnLtr',
        value: 0,
        isBase: false
    };

    state.concepts.push(concept);
    renderConcept(concept);
}

// Render a concept row
function renderConcept(concept) {
    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    row.id = `concept-${concept.id}`;
    row.draggable = true;
    row.className = 'draggable-row';

    // Get values for display
    const mxnLtrVal = concept.isBase ? calculateMxnLtr(concept) : (concept.inputType === 'mxnLtr' ? concept.value : calculateMxnLtr(concept));
    const mxnVal = concept.isBase ? calculateMxn(concept) : (concept.inputType === 'mxn' ? concept.value : calculateMxn(concept));
    const usdVal = concept.isBase ? calculateUsd(concept) : (concept.inputType === 'usd' ? concept.value : calculateUsd(concept));
    const usdGalVal = concept.isBase ? state.basePrice : (concept.inputType === 'usdGal' ? concept.value : calculateUsdGal(concept));

    // All cells are now editable with formatted values
    row.innerHTML = `
        <td><span class="drag-handle">⋮⋮</span> <input type="text" value="${concept.name}" onchange="updateConceptName(${concept.id}, this.value)" ${concept.isBase ? 'disabled' : ''}></td>
        <td><input type="text" value="${formatNumber(mxnLtrVal)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="updateConceptValueFromCell(${concept.id}, this.value, 'mxnLtr')"></td>
        <td><input type="text" value="${formatNumber(mxnVal)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="updateConceptValueFromCell(${concept.id}, this.value, 'mxn')"></td>
        <td><input type="text" value="${formatNumber(usdVal)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="updateConceptValueFromCell(${concept.id}, this.value, 'usd')"></td>
        <td><input type="text" value="${formatNumber(usdGalVal)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="${concept.isBase ? 'updateBasePriceFromCell(this.value)' : `updateConceptValueFromCell(${concept.id}, this.value, 'usdGal')`}"></td>
        <td>
            ${!concept.isBase ? `<button class="btn-danger" onclick="deleteConcept(${concept.id})">Delete</button>` : ''}
        </td>
    `;

    // Add drag and drop event listeners
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);

    tbody.appendChild(row);
}

// Drag and drop handlers
function handleDragStart(e) {
    state.draggedRow = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (state.draggedRow !== this) {
        // Get the IDs from the dragged and target rows
        const draggedId = parseInt(state.draggedRow.id.replace('concept-', ''));
        const targetId = parseInt(this.id.replace('concept-', ''));

        // Find indices in state.concepts
        const draggedIndex = state.concepts.findIndex(c => c.id === draggedId);
        const targetIndex = state.concepts.findIndex(c => c.id === targetId);

        // Reorder the array
        const [removed] = state.concepts.splice(draggedIndex, 1);
        state.concepts.splice(targetIndex, 0, removed);

        // Re-render
        recalculateAll();
    }

    return false;
}

function handleDragEnd() {
    this.style.opacity = '1';
    state.draggedRow = null;
}

// Helper functions for input formatting
function removeCommas(input) {
    input.value = input.value.replace(/,/g, '');
}

function addCommas(input) {
    const value = parseFloat(input.value) || 0;
    input.value = formatNumber(value);
}

// Calculate values for each column
function calculateMxnLtr(concept) {
    if (concept.isBase) {
        return usdPerGalToMxnPerLtr(state.basePrice, state.exchangeRate);
    }

    switch(concept.inputType) {
        case 'mxnLtr':
            return concept.value;
        case 'mxn':
            return state.liters ? concept.value / state.liters : 0;
        case 'usd':
            return state.liters ? usdToMxn(concept.value, state.exchangeRate) / state.liters : 0;
        case 'usdGal':
            return usdPerGalToMxnPerLtr(concept.value, state.exchangeRate);
        default:
            return 0;
    }
}

function calculateMxn(concept) {
    if (concept.isBase) {
        return calculateMxnLtr(concept) * state.liters;
    }

    switch(concept.inputType) {
        case 'mxnLtr':
            return concept.value * state.liters;
        case 'mxn':
            return concept.value;
        case 'usd':
            return usdToMxn(concept.value, state.exchangeRate);
        case 'usdGal':
            return usdPerGalToMxnPerLtr(concept.value, state.exchangeRate) * state.liters;
        default:
            return 0;
    }
}

function calculateUsd(concept) {
    if (concept.isBase) {
        return state.basePrice * state.gallons;
    }

    switch(concept.inputType) {
        case 'mxnLtr':
            return mxnToUsd(concept.value * state.liters, state.exchangeRate);
        case 'mxn':
            return mxnToUsd(concept.value, state.exchangeRate);
        case 'usd':
            return concept.value;
        case 'usdGal':
            return concept.value * state.gallons;
        default:
            return 0;
    }
}

function calculateUsdGal(concept) {
    if (concept.isBase) {
        return state.basePrice;
    }

    switch(concept.inputType) {
        case 'mxnLtr':
            return mxnPerLtrToUsdPerGal(concept.value, state.exchangeRate);
        case 'mxn':
            return state.gallons ? mxnToUsd(concept.value, state.exchangeRate) / state.gallons : 0;
        case 'usd':
            return state.gallons ? concept.value / state.gallons : 0;
        case 'usdGal':
            return concept.value;
        default:
            return 0;
    }
}

// Update concept name
function updateConceptName(id, name) {
    const concept = state.concepts.find(c => c.id === id);
    if (concept) {
        concept.name = name;
    }
}

// Update concept value
function updateConceptValue(id, value, inputType) {
    const concept = state.concepts.find(c => c.id === id);
    if (concept) {
        concept.value = parseFloat(value) || 0;
        concept.inputType = inputType;
        recalculateAll();
    }
}

// Update concept value from table cell (handles formatted input)
function updateConceptValueFromCell(id, value, inputType) {
    const concept = state.concepts.find(c => c.id === id);
    if (concept) {
        concept.value = parseFormattedNumber(value);
        concept.inputType = inputType;
        recalculateAll();
    }
}

// Update base price
function updateBasePrice(value) {
    state.basePrice = parseFloat(value) || 0;
    document.getElementById('basePrice').value = state.basePrice.toFixed(4);
    recalculateAll();
}

// Update base price from table cell (handles formatted input)
function updateBasePriceFromCell(value) {
    state.basePrice = parseFormattedNumber(value);
    document.getElementById('basePrice').value = state.basePrice.toFixed(4);
    recalculateAll();
}

// Delete concept
function deleteConcept(id) {
    state.concepts = state.concepts.filter(c => c.id !== id);
    document.getElementById(`concept-${id}`).remove();
    renderSummaryRows();
}

// Recalculate all rows
function recalculateAll() {
    document.getElementById('tableBody').innerHTML = '';
    state.concepts.forEach(concept => renderConcept(concept));
    renderSummaryRows();
}

// Calculate margin values
function calculateMarginMxnLtr() {
    switch(state.marginInputType) {
        case 'mxnLtr':
            return state.margin;
        case 'mxn':
            return state.liters ? state.margin / state.liters : 0;
        case 'usd':
            return state.liters ? usdToMxn(state.margin, state.exchangeRate) / state.liters : 0;
        case 'usdGal':
            return usdPerGalToMxnPerLtr(state.margin, state.exchangeRate);
        default:
            return 0;
    }
}

function calculateMarginMxn() {
    switch(state.marginInputType) {
        case 'mxnLtr':
            return state.margin * state.liters;
        case 'mxn':
            return state.margin;
        case 'usd':
            return usdToMxn(state.margin, state.exchangeRate);
        case 'usdGal':
            return usdPerGalToMxnPerLtr(state.margin, state.exchangeRate) * state.liters;
        default:
            return 0;
    }
}

function calculateMarginUsd() {
    switch(state.marginInputType) {
        case 'mxnLtr':
            return mxnToUsd(state.margin * state.liters, state.exchangeRate);
        case 'mxn':
            return mxnToUsd(state.margin, state.exchangeRate);
        case 'usd':
            return state.margin;
        case 'usdGal':
            return state.margin * state.gallons;
        default:
            return 0;
    }
}

function calculateMarginUsdGal() {
    switch(state.marginInputType) {
        case 'mxnLtr':
            return mxnPerLtrToUsdPerGal(state.margin, state.exchangeRate);
        case 'mxn':
            return state.gallons ? mxnToUsd(state.margin, state.exchangeRate) / state.gallons : 0;
        case 'usd':
            return state.gallons ? state.margin / state.gallons : 0;
        case 'usdGal':
            return state.margin;
        default:
            return 0;
    }
}

// Update margin value from cell
function updateMarginFromCell(value, inputType) {
    state.margin = parseFormattedNumber(value);
    state.marginInputType = inputType;
    renderSummaryRows();
}

// Render summary rows (Total Cost, Margin, Sale Price)
function renderSummaryRows() {
    // Calculate totals
    let totalMxnLtr = 0;
    let totalMxn = 0;
    let totalUsd = 0;
    let totalUsdGal = 0;

    state.concepts.forEach(concept => {
        totalMxnLtr += calculateMxnLtr(concept);
        totalMxn += calculateMxn(concept);
        totalUsd += calculateUsd(concept);
        totalUsdGal += calculateUsdGal(concept);
    });

    // Calculate margin values
    const marginMxnLtr = calculateMarginMxnLtr();
    const marginMxn = calculateMarginMxn();
    const marginUsd = calculateMarginUsd();
    const marginUsdGal = calculateMarginUsdGal();

    // Calculate sale price (total + margin)
    const salePriceMxnLtr = totalMxnLtr + marginMxnLtr;
    const salePriceMxn = totalMxn + marginMxn;
    const salePriceUsd = totalUsd + marginUsd;
    const salePriceUsdGal = totalUsdGal + marginUsdGal;

    document.getElementById('totalMxnLtr').textContent = formatNumber(totalMxnLtr);
    document.getElementById('totalMxn').textContent = formatNumber(totalMxn);
    document.getElementById('totalUsd').textContent = formatNumber(totalUsd);
    document.getElementById('totalUsdGal').textContent = formatNumber(totalUsdGal);

    document.getElementById('marginMxnLtr').innerHTML = `<input type="text" value="${formatNumber(marginMxnLtr)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="updateMarginFromCell(this.value, 'mxnLtr')">`;
    document.getElementById('marginMxn').innerHTML = `<input type="text" value="${formatNumber(marginMxn)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="updateMarginFromCell(this.value, 'mxn')">`;
    document.getElementById('marginUsd').innerHTML = `<input type="text" value="${formatNumber(marginUsd)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="updateMarginFromCell(this.value, 'usd')">`;
    document.getElementById('marginUsdGal').innerHTML = `<input type="text" value="${formatNumber(marginUsdGal)}" onfocus="removeCommas(this)" onblur="addCommas(this)" onchange="updateMarginFromCell(this.value, 'usdGal')">`;

    document.getElementById('salePriceMxnLtr').textContent = formatNumber(salePriceMxnLtr);
    document.getElementById('salePriceMxn').textContent = formatNumber(salePriceMxn);
    document.getElementById('salePriceUsd').textContent = formatNumber(salePriceUsd);
    document.getElementById('salePriceUsdGal').textContent = formatNumber(salePriceUsdGal);
}

// Share to WhatsApp function
async function shareToWhatsApp() {
    const button = document.getElementById('shareWhatsApp');
    const originalText = button.textContent;

    try {
        button.disabled = true;
        button.textContent = '📸 Capturing...';

        // Check if html2canvas is loaded
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }

        // Get the table wrapper element
        const tableWrapper = document.querySelector('.table-wrapper');

        if (!tableWrapper) {
            throw new Error('Table wrapper not found');
        }

        // Temporarily hide the drag handles and action buttons for cleaner screenshot
        const dragHandles = document.querySelectorAll('.drag-handle');
        const actionButtons = document.querySelectorAll('tbody .btn-danger');

        dragHandles.forEach(handle => handle.style.visibility = 'hidden');
        actionButtons.forEach(btn => btn.style.visibility = 'hidden');

        // Small delay to ensure styles are applied
        await new Promise(resolve => setTimeout(resolve, 100));

        // Capture the table as canvas
        const canvas = await html2canvas(tableWrapper, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: true,
            useCORS: true,
            allowTaint: true,
            windowWidth: tableWrapper.scrollWidth,
            windowHeight: tableWrapper.scrollHeight
        });

        // Show drag handles and buttons again
        dragHandles.forEach(handle => handle.style.visibility = '');
        actionButtons.forEach(btn => btn.style.visibility = '');

        // Convert canvas to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });

        if (!blob) {
            throw new Error('Failed to create image blob');
        }

        // Create a File object from the blob
        const file = new File([blob], 'fuel-calculation.jpg', { type: 'image/jpeg' });

        // Check if Web Share API is available (works on mobile)
        if (navigator.share) {
            try {
                // Try to share with file
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Fuel Price Breakdown',
                        text: 'Check out this fuel price calculation',
                        files: [file]
                    });
                } else {
                    // Share without file, just download it
                    throw new Error('File sharing not supported');
                }
            } catch (shareError) {
                if (shareError.name === 'AbortError') {
                    // User cancelled the share
                    button.textContent = originalText;
                    button.disabled = false;
                    return;
                }
                // Fall through to download method
                throw shareError;
            }
        } else {
            // Desktop fallback: Download image and provide options
            const url = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.download = 'fuel-calculation.jpg';
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show options dialog
            const choice = confirm(
                'Image downloaded to your computer!\n\n' +
                'Click OK to open WhatsApp Web\n' +
                'Click Cancel to open WhatsApp Desktop app\n\n' +
                '(You\'ll need to manually attach the downloaded image)'
            );

            if (choice) {
                // Open WhatsApp Web
                window.open('https://web.whatsapp.com/', '_blank');
            } else {
                // Try to open WhatsApp Desktop app using custom protocol
                const whatsappDesktop = document.createElement('a');
                whatsappDesktop.href = 'whatsapp://';
                whatsappDesktop.click();

                // Fallback to web if desktop app isn't installed
                setTimeout(() => {
                    const openWeb = confirm(
                        'WhatsApp Desktop app not detected.\n\n' +
                        'Would you like to open WhatsApp Web instead?'
                    );
                    if (openWeb) {
                        window.open('https://web.whatsapp.com/', '_blank');
                    }
                }, 1500);
            }
        }

        button.textContent = originalText;
        button.disabled = false;

    } catch (error) {
        console.error('Error in shareToWhatsApp:', error);
        button.textContent = originalText;
        button.disabled = false;

        // Show drag handles and buttons if they were hidden
        const dragHandles = document.querySelectorAll('.drag-handle');
        const actionButtons = document.querySelectorAll('tbody .btn-danger');
        dragHandles.forEach(handle => handle.style.visibility = '');
        actionButtons.forEach(btn => btn.style.visibility = '');

        alert(`Error: ${error.message}\n\nPlease make sure:\n1. You have data in the table\n2. Your browser supports this feature\n3. Try refreshing the page`);
    }
}

// Preset management
function savePreset() {
    const nameInput = document.getElementById('presetName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Please enter a preset name');
        return;
    }

    const preset = {
        id: Date.now(),
        name: name,
        exchangeRate: state.exchangeRate,
        basePrice: state.basePrice,
        gallons: state.gallons,
        liters: state.liters,
        margin: state.margin,
        marginInputType: state.marginInputType,
        concepts: JSON.parse(JSON.stringify(state.concepts)),
        createdAt: new Date().toISOString()
    };

    state.presets.push(preset);
    savePresetsToStorage();
    populatePresetDropdown();

    nameInput.value = '';
    alert(`Preset "${name}" saved successfully!`);
}

function handleLoadPreset() {
    const select = document.getElementById('presetSelect');
    const selectedId = parseInt(select.value);

    if (!selectedId) {
        alert('Please select a preset to load');
        return;
    }

    loadPreset(selectedId);
}

function loadPreset(id) {
    const preset = state.presets.find(p => p.id === id);
    if (!preset) return;

    // Load preset data
    state.exchangeRate = preset.exchangeRate;
    state.basePrice = preset.basePrice;
    state.gallons = preset.gallons;
    state.liters = preset.liters;
    state.margin = preset.margin || 0;
    state.marginInputType = preset.marginInputType || 'mxnLtr';
    state.concepts = JSON.parse(JSON.stringify(preset.concepts));

    // Update UI
    document.getElementById('exchangeRate').value = state.exchangeRate.toFixed(4);
    document.getElementById('basePrice').value = state.basePrice.toFixed(4);
    document.getElementById('gallons').value = state.gallons.toFixed(2);
    document.getElementById('liters').value = state.liters.toFixed(2);

    recalculateAll();

    alert(`Preset "${preset.name}" loaded successfully!`);
}

function updatePreset() {
    const select = document.getElementById('presetSelect');
    const selectedId = parseInt(select.value);

    if (!selectedId) {
        alert('Please select a preset to update');
        return;
    }

    const preset = state.presets.find(p => p.id === selectedId);
    if (!preset) return;

    if (!confirm(`Update preset "${preset.name}" with current values?`)) return;

    // Update preset with current state
    preset.exchangeRate = state.exchangeRate;
    preset.basePrice = state.basePrice;
    preset.gallons = state.gallons;
    preset.liters = state.liters;
    preset.margin = state.margin;
    preset.marginInputType = state.marginInputType;
    preset.concepts = JSON.parse(JSON.stringify(state.concepts));
    preset.updatedAt = new Date().toISOString();

    savePresetsToStorage();
    populatePresetDropdown();

    alert(`Preset "${preset.name}" updated successfully!`);
}

function handleDeletePreset() {
    const select = document.getElementById('presetSelect');
    const selectedId = parseInt(select.value);

    if (!selectedId) {
        alert('Please select a preset to delete');
        return;
    }

    const preset = state.presets.find(p => p.id === selectedId);
    if (!preset) return;

    if (!confirm(`Are you sure you want to delete preset "${preset.name}"?`)) return;

    state.presets = state.presets.filter(p => p.id !== selectedId);
    savePresetsToStorage();
    populatePresetDropdown();

    alert(`Preset "${preset.name}" deleted successfully!`);
}

function populatePresetDropdown() {
    const select = document.getElementById('presetSelect');
    const currentValue = select.value;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Select a Preset --</option>';

    // Add all presets as options
    state.presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        select.appendChild(option);
    });

    // Restore selection if it still exists
    if (currentValue && state.presets.find(p => p.id === parseInt(currentValue))) {
        select.value = currentValue;
    }
}

// LocalStorage functions
function savePresetsToStorage() {
    localStorage.setItem('fuelCalculatorPresets', JSON.stringify(state.presets));
}

function loadPresets() {
    const stored = localStorage.getItem('fuelCalculatorPresets');
    if (stored) {
        state.presets = JSON.parse(stored);
        populatePresetDropdown();
    }
}

// Make functions globally accessible
window.updateConceptName = updateConceptName;
window.updateConceptValue = updateConceptValue;
window.updateConceptValueFromCell = updateConceptValueFromCell;
window.updateBasePrice = updateBasePrice;
window.updateBasePriceFromCell = updateBasePriceFromCell;
window.updateMarginFromCell = updateMarginFromCell;
window.deleteConcept = deleteConcept;
window.removeCommas = removeCommas;
window.addCommas = addCommas;
