import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


  const firebaseConfig = {
    apiKey: "AIzaSyDaiz3Nhf4q5gNB3V28JY8MFTT-EzA-_pU",
    authDomain: "mywebdb-ae0d5.firebaseapp.com",
    databaseURL: "https://mywebdb-ae0d5-default-rtdb.firebaseio.com",
    projectId: "mywebdb-ae0d5",
    storageBucket: "mywebdb-ae0d5.appspot.com",
    messagingSenderId: "200100505946",
    appId: "1:200100505946:web:91a6241ad7aa895d092b63"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  
  const submit = document.getElementById('signup');

  submit.addEventListener("click", function(event){
    event.preventDefault()

    const username = document.getElementById('userid').value;
    const password = document.getElementById('password').value;
    const email = username + "@example.com";
    
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        alert("Create Success, Please Login")
        window.location.href = "login.html" ;
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(errorMessage)
        window.location.href = "signup.html" ;
    });

})