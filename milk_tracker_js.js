// App state
let currentDate = new Date();
let milkData = {};
let selectedDate = null;
let defaultLiters = 1;
let pricePerLiter = 50;

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    updateCalendar();
    updateMonthlySummary();
    autoFillMissing();

    // Set up default liters change handler
    document.getElementById('defaultLiters').addEventListener('change', function () {
        defaultLiters = parseFloat(this.value);
        saveData();
        updateMonthlySummary();
    });

    // Set up price per liter change handler
    document.getElementById('pricePerLiter').addEventListener('input', function () {
        pricePerLiter = parseFloat(this.value) || 0;
        saveData();
        updateMonthlySummary();
    });
});

// Load data from localStorage
function loadData() {
    try {
        // Load milk data
        const savedMilkData = localStorage.getItem('milkTrackerData');
        if (savedMilkData) {
            milkData = JSON.parse(savedMilkData);
        }

        // Load default liters setting
        const savedDefault = localStorage.getItem('milkTrackerDefault');
        if (savedDefault) {
            defaultLiters = parseFloat(savedDefault);
            document.getElementById('defaultLiters').value = defaultLiters;
        }

        // Load price per liter setting
        const savedPrice = localStorage.getItem('milkTrackerPrice');
        if (savedPrice) {
            pricePerLiter = parseFloat(savedPrice);
            document.getElementById('pricePerLiter').value = pricePerLiter;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        // Reset to defaults if there's an error
        milkData = {};
        defaultLiters = 1;
        pricePerLiter = 50;
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('milkTrackerData', JSON.stringify(milkData));
        localStorage.setItem('milkTrackerDefault', defaultLiters.toString());
        localStorage.setItem('milkTrackerPrice', pricePerLiter.toString());
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Unable to save data. Please check if your browser allows localStorage.');
    }
}

// Update calendar display
function updateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month/year display
    document.getElementById('monthYear').textContent =
        new Date(year, month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Clear calendar
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell other-month';
        calendar.appendChild(emptyCell);
    }

    // Add days of current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';

        const currentDay = new Date(year, month, day);
        const dayKey = formatDateKey(currentDay);

        // Check if it's today
        if (currentDay.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // Add milk amount if exists
        if (milkData[dayKey] !== undefined) {
            const milkAmount = document.createElement('div');
            milkAmount.className = 'milk-amount';
            milkAmount.textContent = milkData[dayKey] + 'L';
            dayCell.appendChild(milkAmount);
        }

        // Add click handler
        dayCell.addEventListener('click', () => openEditModal(currentDay));

        calendar.appendChild(dayCell);
    }
}

// Change month
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateCalendar();
    updateMonthlySummary();
}

// Format date as key
function formatDateKey(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
}

// Open edit modal
function openEditModal(date) {
    selectedDate = date;
    const dateKey = formatDateKey(date);

    document.getElementById('selectedDate').textContent =
        date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

    // Set current value or default
    const currentValue = milkData[dateKey] === undefined ? 0 : milkData[dateKey];
    document.getElementById('milkLiters').value = currentValue;

    document.getElementById('editModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    selectedDate = null;
}

// Save milk entry
function saveMilkEntry() {
    if (!selectedDate) return;

    const dateKey = formatDateKey(selectedDate);
    const liters = parseFloat(document.getElementById('milkLiters').value);

    milkData[dateKey] = liters;
    localStorage.setItem('lastUpdate', formatDateKey(selectedDate))
    saveData();
    updateCalendar();
    updateMonthlySummary();
    closeModal();
}

// Auto-fill functionality
function autoFillMissing() {
    const today = new Date();
    let lastFilledDateKey = localStorage.getItem('lastUpdate');
    console.log(lastFilledDateKey);

    if (lastFilledDateKey === null && milkData) {
        lastFilledDateKey = Object.keys(milkData).sort((a, b) => new Date(b) - new Date(a))[0];
    }

    if (lastFilledDateKey) {
        let current = new Date(lastFilledDateKey);
        current.setDate(current.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        while (current < yesterday) {
            const key = formatDateKey(current);
            if (milkData[key] === undefined) {
                milkData[key] = defaultLiters;
            }
            current.setDate(current.getDate() + 1);
        }
        localStorage.setItem('lastUpdate', formatDateKey(yesterday))
        saveData();
        updateCalendar();
        updateMonthlySummary();
    }
}

// Update monthly summary
function updateMonthlySummary() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let totalLiters = 0;
    let daysWithData = 0;

    // Get all entries for current month
    for (const [dateKey, liters] of Object.entries(milkData)) {
        const entryDate = new Date(dateKey);
        if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
            totalLiters += liters;
            daysWithData++;
        }
    }

    const totalBill = totalLiters * pricePerLiter;
    const avgPerDay = daysWithData > 0 ? totalLiters / daysWithData : 0;

    // Update display
    document.getElementById('totalLiters').textContent = totalLiters.toFixed(1) + ' L';
    document.getElementById('totalBill').textContent = '₹' + totalBill.toFixed(2);
    document.getElementById('avgPerDay').textContent = avgPerDay.toFixed(1) + ' L';
    document.getElementById('daysRecorded').textContent = daysWithData;
}

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});