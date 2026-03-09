// In-memory storage for the session - organized by month
const timeData = {
    months: {} // Format: { "2026-03": { week1: 5, week2: 3, ... }, ... }
};

// Track the currently selected date
let currentDate = new Date();

// Initialize the app
function init() {
    updateDisplay();
}

// Update the entire display for the current month
function updateDisplay() {
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthName;

    // Generate weeks for current month
    generateWeeks(currentDate);
    updateTotal();
}

// Change the selected month
function changeMonth(direction) {
    // direction: -1 for previous month, +1 for next month
    currentDate.setMonth(currentDate.getMonth() + direction);
    updateDisplay();
}

// Get the month key for storing data
function getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Get data for the current month
function getCurrentMonthData() {
    const monthKey = getMonthKey(currentDate);
    if (!timeData.months[monthKey]) {
        timeData.months[monthKey] = {};
    }
    return timeData.months[monthKey];
}

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

function formatDateRange(start, end) {
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('default', options)} - ${end.toLocaleDateString('default', options)}`;
}

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
