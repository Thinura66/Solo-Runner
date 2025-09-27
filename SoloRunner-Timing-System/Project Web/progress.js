import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDtR2rq3oPxYHr1c7axq5KArhQ4tpiNPGA",
    authDomain: "l1project-d8a11.firebaseapp.com",
    databaseURL: "https://l1project-d8a11-default-rtdb.firebaseio.com",
    projectId: "l1project-d8a11",
    storageBucket: "l1project-d8a11.appspot.com",
    messagingSenderId: "187527449437",
    appId: "1:187527449437:web:a29e960f97379aafe976b4"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Load Chart.js dynamically
function loadChartJs() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Chart.js'));
        document.head.appendChild(script);
    });
}

// Function to fetch data from Firebase and initialize the chart
function GetAllDataRealtime() {
    const dbRef = ref(db, `runner`);
    onValue(dbRef, (snapshot) => {
        const data = [];
        snapshot.forEach(childSnapshot => {
            data.push(childSnapshot.val());
        });
        initChart(data);
    }, {
        onlyOnce: false
    });
}

// Function to convert timing string to seconds
function timingToSeconds(timing) {
    const [hours, minutes, seconds, milliseconds] = timing.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

// Function to get the font sizes based on the window width
function getFontSizes() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 430) {
        return {
            titleSize: 10,
            tickSize: 8
        };
    } else {
        return {
            titleSize: 14,
            tickSize: 12
        };
    }
}

// Function to apply font sizes to the chart
function applyFontSizes(chart, fontSizes) {
    chart.options.scales.x.title.font.size = fontSizes.titleSize;
    chart.options.scales.x.ticks.font.size = fontSizes.tickSize;
    chart.options.scales.y.title.font.size = fontSizes.titleSize;
    chart.options.scales.y.ticks.font.size = fontSizes.tickSize;
    chart.update();
}

// Function to initialize the chart
function initChart(data) {
    const labels = data.map(entry => entry.Date || " ");
    const timings = data.map(entry => entry.Timing ? timingToSeconds(entry.Timing) : null);
    const fontSizes = getFontSizes();

    const ctx = document.getElementById('myChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Timing (in seconds)',
                    data: timings,
                    borderColor: 'rgba(30, 2, 249, 0.8)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.1  // Add tension to create a smooth curve
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Date',
                        font: {
                            size: fontSizes.titleSize
                        }
                    },
                    ticks: {
                        font: {
                            size: fontSizes.tickSize
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (seconds)',
                        font: {
                            size: fontSizes.titleSize
                        }
                    },
                    ticks: {
                        font: {
                            size: fontSizes.tickSize
                        }
                    }
                }
            }
        }
    });

    // Update chart font sizes on window resize
    window.addEventListener('resize', () => {
        const newFontSizes = getFontSizes();
        applyFontSizes(myChart, newFontSizes);
    });
}

// Load Chart.js and then fetch data
window.onload = async () => {
    try {
        await loadChartJs();
        GetAllDataRealtime();
    } catch (error) {
        console.error(error);
    }
};
