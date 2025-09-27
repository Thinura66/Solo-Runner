// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

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
const storage = getStorage(app);

const imageUrls = [];

let currentIndex = 0;
let intervalId;
const slideElement = document.getElementById('imagel');
const frameRate = 1000;


function showNextImage() {
    currentIndex = (currentIndex + 1) % imageUrls.length;
    slideElement.src = imageUrls[currentIndex];
    console.log(currentIndex);
}

function showPreviousImage() {
    currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    slideElement.src = imageUrls[currentIndex];
}

function startSlideshow() { 
    slideElement.src = imageUrls[currentIndex];
}
function zoomImage(factor) {
    const currentZoom = slideElement.style.transform.match(/scale\(([^)]+)\)/);
    const currentScale = currentZoom ? parseFloat(currentZoom[1]) : 1;
    const newScale = Math.max(1, currentScale + factor);
    slideElement.style.transform = `scale(${newScale})`;
}





function fetchImages(folderName) {
    const imagesContainer = document.getElementById('image-container');
    if (!imagesContainer) {
        console.error('Image container not found.');
        return;
    }

    if (!imagesContainer) {
        console.error('Image container not found.');
        return;
    }


    const listRef = ref(storage, folderName);

    listAll(listRef).then((result) => {
        let skipFirst = true; // Flag to skip the first image
        const promises = result.items.map((imageRef) => {
            if (skipFirst) {
                skipFirst = false;
                return Promise.resolve(null); // Skip the first image
            }

            return getDownloadURL(imageRef).then((url) => {
                imageUrls.push(url);
                startSlideshow();
                return url;
            }).catch((error) => {
                console.error('Error getting download URL:', error);
                return null;
            });
        });

        Promise.all(promises).then(() => {
            console.log('All image URLs:', imageUrls);
            // You can now use the imageUrls array as needed
        }).catch((error) => {
            console.error('Error processing images:', error);
        });
    }).catch((error) => {
        console.error('Error listing images:', error);
    });
}

// Ensure script runs after DOM has loaded
window.addEventListener('load', () => {
    const folderName = new URLSearchParams(window.location.search).get('id');
    if (folderName) {
        fetchImages(folderName);
    } else {
        console.error('Folder name not provided.');
    }
    document.getElementById('prevBtn').addEventListener('click', showPreviousImage);
    document.getElementById('nextBtn').addEventListener('click', showNextImage);
    document.getElementById('zoomInBtn').addEventListener('click', () => zoomImage(0.1));
    document.getElementById('zoomOutBtn').addEventListener('click', () => zoomImage(-0.1));
    
});



