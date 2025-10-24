document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fd.get('email'),
        password: fd.get('password')
      })
    });

    const json = await res.json();

    if (json.success) {
      // On sauvegarde le nom d’utilisateur pour la navbar
      localStorage.setItem("username", json.username || fd.get('email'));

      // Afficher notification et rediriger
      showNotification("Connexion réussie ! Bienvenue " + (json.username || ""), "success");
      setTimeout(() => {
        window.location.href = '/index';
      }, 2000);

    } else {
      if (json.error === "Identifiants invalides") {
        showNotification("Aucun compte trouvé. Redirection vers l’inscription...", "error");
        setTimeout(() => {
          window.location.href = '/register';
        }, 2500);
      } else {
        showNotification(json.error || "Erreur serveur", "error");
      }
    }
  } catch (err) {
    showNotification("Impossible de contacter le serveur", "error");
  }
});

// Fonction pour afficher une notification temporaire
function showNotification(message, type = "info") {
  const notif = document.createElement("div");
  notif.className =
    "fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-white z-50 transition-opacity duration-500 " +
    (type === "success" ? "bg-green-500" : "bg-red-500");

  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => notif.remove(), 500);
  }, 3000);
}
