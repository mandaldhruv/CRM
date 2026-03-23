import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth } from './firebase-config.js';

const redirectToLogin = () => {
    const currentPath = window.location.pathname.split(/[\\/]/).pop() || 'index.html';
    if (currentPath.toLowerCase() === 'login.html') {
        return;
    }

    window.location.replace('./login.html');
};

onAuthStateChanged(auth, (user) => {
    if (!user) {
        redirectToLogin();
        return;
    }

    document.documentElement.dataset.authReady = 'true';
    window.currentTenantUser = user;
});
