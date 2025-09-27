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

function addRowToTable(index,date, stime, etime, timing, rtime, svideo) {
    let trow = document.createElement("tr");
    trow.id = `row-${index}`;
    let td1 = document.createElement('td');
    let td2 = document.createElement('td');
    let td3 = document.createElement('td');
    let td4 = document.createElement('td');
    let td5 = document.createElement('td');
    let td6 = document.createElement('td');

    td1.innerHTML = date || '<span style="color:red;">Not Completed</span>';
    td2.innerHTML = stime || '<span style="color:red;">Not Completed</span>';
    td3.innerHTML = etime || '<span style="color:red;">Not Completed</span>';
    td4.innerHTML = timing || '<span style="color:red;">Not Completed</span>';
    td5.innerHTML = rtime || '<span style="color:red;">Not Completed</span>';

    let a1 = document.createElement('a');
    if (svideo) {
        a1.href = svideo;
        a1.innerHTML = 'Start Action';
        a1.target = '_blank';
    } else {
        a1.innerHTML = '<button class="custom-button" ><center><a>Click Here</a></center></button>';
    }

    td6.appendChild(a1);

     td6.addEventListener('click', () => {
        window.location.href = `imageDisplay.html?id=${index}`;
    });

    trow.appendChild(td1);
    trow.appendChild(td2);
    trow.appendChild(td3);
    trow.appendChild(td4);
    trow.appendChild(td5);
    trow.appendChild(td6);

    document.getElementById('tbody1').appendChild(trow);
}

function addItemsToTable(students) {
    const tbody = document.getElementById('tbody1');
    tbody.innerHTML = "";

    // Check if there are more than one student
    if (students.length > 1) {
        // Remove the last student before adding rows to the table
        students.pop();
        students.pop();
    }

    students.forEach((element, index) => {
        console.log(index);
        addRowToTable(
            index,
            element.Date, 
            element.Starttime, 
            element.Rtime, 
            element.EndTime, 
            element.Timing,  
            element.starting
        );
    });

}

function GetAllDataRealtime() {
    const dbRef = ref(db, `runner`);
    onValue(dbRef, (snapshot) => {
        var students = [];
        //console.log(students);
        snapshot.forEach(childSnapshot => {
            students.push(childSnapshot.val());
        });
        addItemsToTable(students);
    }, {
        onlyOnce: false
    });
}

window.onload = GetAllDataRealtime;
