// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD5q89gMuu-pybVKAlW2KGZMgAVzEqVsAU",
  authDomain: "esp8266-d9fd0.firebaseapp.com",
  databaseURL: "https://esp8266-d9fd0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "esp8266-d9fd0",
  storageBucket: "esp8266-d9fd0.firebasestorage.app",
  messagingSenderId: "415048545383",
  appId: "1:415048545383:web:b0025aa7d24ec1668210c2"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
const vapidKey = 'BPy_Zys7O1q5YJKF_KfNk2bAG3jMEC7gdJt4E6TbKhvTl2SAT2VTHeq1q4VEE9BX-k9as9tEXUfq4KYWJ3mZTIE';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('firebase-messaging-sw.js')
    .then(r => console.log('SW registered:', r))
    .catch(e => console.error('SW failed:', e));
}

function initFCM() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    getFCMToken();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') getFCMToken();
    });
  }
}

function getFCMToken() {
  messaging.getToken({vapidKey}).then(token => {
    if (token) {
      console.log('FCM token:', token);
      firebase.database().ref('/fcmTokens/' + token).set(true);
    }
  }).catch(e => console.error('FCM token error:', e));
}

messaging.onMessage((payload) => {
  if (payload.notification && 'Notification' in window) {
    new Notification(payload.notification.title || 'ESP8266', {
      body: payload.notification.body || '',
      icon: '/favicon.ico'
    });
  }
});

initFCM();

// Predefined login credentials
const allowedEmail = "admin@gmail.com";
const allowedPassword = "admin123";

const loginForm = document.getElementById("loginForm");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Veuillez entrer email et mot de passe.");
    return;
  }

  if (email === allowedEmail && password === allowedPassword) {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        console.log("Connecte en tant que", userCredential.user.email);
        loginForm.style.display = "none";
        dashboard.style.display = "block";
        startDashboard();
      })
      .catch(error => {
        alert("Echec connexion Firebase: " + error.message);
      });
  } else {
    alert("Email ou mot de passe invalide.");
  }
});

function startDashboard() {
  const db = firebase.database();

  // ---- Master Control ----
  const masterRef = db.ref("/master");
  const masterStatus = document.getElementById("masterStatus");
  const masterOn = document.getElementById("masterOn");
  const masterOff = document.getElementById("masterOff");

  masterRef.on("value", (snapshot) => {
    const state = snapshot.val();
    masterStatus.innerText = state ? "ACTIF" : "DESACTIVE";
    masterStatus.className = state ? "status-on" : "status-off";
  });

  masterOn.onclick = () => { masterRef.set(true); };
  masterOff.onclick = () => { masterRef.set(false); };

  // ---- Sensors ----
  const tempValue = document.getElementById("tempValue");
  const humValue = document.getElementById("humValue");
  const flameValue = document.getElementById("flameValue");
  const flameUnit = document.getElementById("flameUnit");

  db.ref("/sensor/temperature").on("value", (snapshot) => {
    const val = snapshot.val();
    tempValue.innerText = val !== null && val !== undefined ? val.toFixed(1) : "--";
    // Color based on threshold
    if (val !== null && (val < 15 || val > 35)) {
      tempValue.style.color = "#d32f2f";
    } else {
      tempValue.style.color = "#388e3c";
    }
  });

  db.ref("/sensor/humidity").on("value", (snapshot) => {
    const val = snapshot.val();
    humValue.innerText = val !== null && val !== undefined ? val.toFixed(0) : "--";
    if (val !== null && (val < 30 || val > 70)) {
      humValue.style.color = "#d32f2f";
    } else {
      humValue.style.color = "#388e3c";
    }
  });

  db.ref("/sensor/flame").on("value", (snapshot) => {
    const val = snapshot.val();
    if (val === true) {
      flameValue.innerText = "OUI";
      flameValue.style.color = "#d32f2f";
      flameUnit.innerText = "Flamme detectee!";
    } else {
      flameValue.innerText = "NON";
      flameValue.style.color = "#388e3c";
      flameUnit.innerText = "Aucune flamme";
    }
  });

  // ---- Alert ----
  const alertBanner = document.getElementById("alertBanner");
  const alertReason = document.getElementById("alertReason");

  db.ref("/alert/active").on("value", (snapshot) => {
    const active = snapshot.val();
    if (active === true) {
      alertBanner.className = "alert-visible";
      sendAlertNotification();
    } else {
      alertBanner.className = "alert-hidden";
    }
  });

  db.ref("/alert/reason").on("value", (snapshot) => {
    const reason = snapshot.val();
    alertReason.innerText = reason || "--";
  });

  function sendAlertNotification() {
    const reason = alertReason.innerText !== "--" ? alertReason.innerText : "Alerte active!";
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerte ESP8266', { body: reason, icon: '/favicon.ico' });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'SHOW_ALERT', title: 'Alerte ESP8266', body: reason
          });
        }
      });
    }
  }
}

document.getElementById("logoutBtn").onclick = () => {
  firebase.auth().signOut()
    .then(() => {
      dashboard.style.display = "none";
      loginForm.style.display = "block";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    })
    .catch(error => {
      alert("Echec deconnexion: " + error.message);
    });
};
