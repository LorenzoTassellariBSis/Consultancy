// In-memory storage for the session - organized by month
const timeData = {
    months: {} // Format: { "2026-03": { week1: 5, week2: 3, ... }, ... }
};

// Track the currently selected date
let currentDate = new Date();

/**
 * Initialize the application and render the initial month view.
 *
 * Builds the UI for the currently selected month and updates displayed totals.
 */
function init() {
    updateDisplay();
}

/**
 * Refreshes the UI to show the currently selected month and its weeks.
 *
 * Updates the month label, regenerates week cards for the current month, and recalculates the monthly total.
 */
function updateDisplay() {
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthName;

    // Generate weeks for current month
    generateWeeks(currentDate);
    updateTotal();
}

/**
 * Change the currently selected month by one step and refresh the display.
 * @param {number} direction - Month step: `-1` to move to the previous month, `+1` to move to the next month.
 */
function changeMonth(direction) {
    // direction: -1 for previous month, +1 for next month
    currentDate.setMonth(currentDate.getMonth() + direction);
    updateDisplay();
}

/**
 * Produce a month key in "YYYY-MM" format for the given date.
 * @param {Date} date - The date to extract year and month from.
 * @returns {string} The month key formatted as "YYYY-MM".
 */
function getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Retrieve the data object for the currently selected month, creating an empty month entry if one does not exist.
 * @returns {Object} The month data object stored in `timeData.months` for the current month key (format "YYYY-MM").
 */
function getCurrentMonthData() {
    const monthKey = getMonthKey(currentDate);
    if (!timeData.months[monthKey]) {
        timeData.months[monthKey] = {};
    }
    return timeData.months[monthKey];
}

/**
 * Generate and render week cards for the month containing the given date.
 *
 * Builds contiguous 7-day week ranges starting at the month's first day (each range clamped to the month's end),
 * clears the weeks container in the DOM, and creates a card for each week using the current month's data.
 *
 * @param {Date} date - A Date object representing any day within the month to render.
 */
function generateWeeks(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeksContainer = document.getElementById('weeksContainer');
    weeksContainer.innerHTML = '';

    // Get data for this month
    const monthData = getCurrentMonthData();

    // Calculate weeks
    let currentWeekDate = new Date(firstDay);
    let weekNumber = 1;

    while (currentWeekDate <= lastDay) {
        const weekStart = new Date(currentWeekDate);
        const weekEnd = new Date(currentWeekDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Don't go past end of month
        if (weekEnd > lastDay) {
            weekEnd.setTime(lastDay.getTime());
        }

        createWeekCard(weekNumber, weekStart, weekEnd, monthData);
        
        currentWeekDate.setDate(currentWeekDate.getDate() + 7);
        weekNumber++;
    }
}

/**
 * Create and append a week card UI element for a specific week of a month.
 *
 * The card shows the week label, the current stored days for that week (default 0),
 * a short date range, a numeric input (0–7) prefilled from monthData, and a Save button
 * that calls saveDays with the corresponding week id.
 *
 * @param {number} weekNum - Sequential week number within the month (used for labels and ids).
 * @param {Date} startDate - Start date of the week.
 * @param {Date} endDate - End date of the week (clamped to the month).
 * @param {Object<string,number>} monthData - Mapping of week ids (e.g., "week1") to stored days worked.
 */
function createWeekCard(weekNum, startDate, endDate, monthData) {
    const weeksContainer = document.getElementById('weeksContainer');
    const weekId = `week${weekNum}`;
    
    const card = document.createElement('div');
    card.className = 'week-card';
    card.innerHTML = `
        <div class="week-header">
            <div class="week-title">Week ${weekNum}</div>
            <div class="week-days" id="${weekId}-display">
                ${monthData[weekId] || 0}
            </div>
        </div>
        <div style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.5rem;">
            ${formatDateRange(startDate, endDate)}
        </div>
        <div class="input-group">
            <input 
                type="number" 
                id="${weekId}-input" 
                min="0" 
                max="7" 
                placeholder="Enter days worked"
                value="${monthData[weekId] || ''}"
            >
            <button onclick="saveDays('${weekId}')">Save</button>
        </div>
    `;
    
    weeksContainer.appendChild(card);
}

/**
 * Format a short, localized date range for display.
 * @param {Date} start - The start date of the range.
 * @param {Date} end - The end date of the range.
 * @returns {string} A localized short date range (e.g., "Mar 1 - Mar 7").
 */
function formatDateRange(start, end) {
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('default', options)} - ${end.toLocaleDateString('default', options)}`;
}

/**
 * Validate and store the entered days for a given week into the current month's data, then refresh the UI display and monthly total.
 * 
 * @param {string} weekId - The identifier for the week (used as the DOM element id prefix and as the key in the month data, e.g., "week1").
 */
function saveDays(weekId) {
    const input = document.getElementById(`${weekId}-input`);
    const display = document.getElementById(`${weekId}-display`);
    const value = parseInt(input.value) || 0;
    
    // Validate input
    if (value < 0 || value > 7) {
        alert('Please enter a value between 0 and 7 days');
        return;
    }
    
    // Save to current month's data
    const monthData = getCurrentMonthData();
    monthData[weekId] = value;
    
    // Update display with animation
    display.classList.add('success-animation');
    display.textContent = value;
    
    setTimeout(() => {
        display.classList.remove('success-animation');
    }, 500);
    
    updateTotal();
}

/**
 * Update the displayed monthly total of days worked.
 *
 * Computes the sum of all week values for the current month, sets that sum
 * as the text content of the element with id "totalDays", and triggers a
 * brief success animation on the element.
 */
function updateTotal() {
    const monthData = getCurrentMonthData();
    const total = Object.values(monthData).reduce((sum, days) => sum + days, 0);
    const totalElement = document.getElementById('totalDays');
    
    totalElement.classList.add('success-animation');
    totalElement.textContent = total;
    
    setTimeout(() => {
        totalElement.classList.remove('success-animation');
    }, 500);
}

// Initialize on load
init();
