// In-memory storage for the session
const timeData = {
    weeks: {}
};

// Initialize the app
function init() {
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthName;

    // Generate weeks for current month
    generateWeeks(now);
    updateTotal();
}

function generateWeeks(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeksContainer = document.getElementById('weeksContainer');
    weeksContainer.innerHTML = '';

    // Calculate weeks
    let currentDate = new Date(firstDay);
    let weekNumber = 1;

    while (currentDate <= lastDay) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Don't go past end of month
        if (weekEnd > lastDay) {
            weekEnd.setTime(lastDay.getTime());
        }

        createWeekCard(weekNumber, weekStart, weekEnd);
        
        currentDate.setDate(currentDate.getDate() + 7);
        weekNumber++;
    }
}

function createWeekCard(weekNum, startDate, endDate) {
    const weeksContainer = document.getElementById('weeksContainer');
    const weekId = `week${weekNum}`;
    
    const card = document.createElement('div');
    card.className = 'week-card';
    card.innerHTML = `
        <div class="week-header">
            <div class="week-title">Week ${weekNum}</div>
            <div class="week-days" id="${weekId}-display">
                ${timeData.weeks[weekId] || 0}
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
                value="${timeData.weeks[weekId] || ''}"
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
    
    // Save to memory
    timeData.weeks[weekId] = value;
    
    // Update display with animation
    display.classList.add('success-animation');
    display.textContent = value;
    
    setTimeout(() => {
        display.classList.remove('success-animation');
    }, 500);
    
    updateTotal();
}

function updateTotal() {
    const total = Object.values(timeData.weeks).reduce((sum, days) => sum + days, 0);
    const totalElement = document.getElementById('totalDays');
    
    totalElement.classList.add('success-animation');
    totalElement.textContent = total;
    
    setTimeout(() => {
        totalElement.classList.remove('success-animation');
    }, 500);
}

// Initialize on load
init();
