document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    name: fd.get('name'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    password: fd.get('password')
  };

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json();

    if (json.success) {
      // stocker le nom de l'utilisateur dans localStorage
      localStorage.setItem("username", body.name);

      // On sauvegarde le nom d’utilisateur pour la navbar
      localStorage.setItem("username", body.name || fd.get('email'));

      // notification moderne
      showNotification("Inscription réussie ! Bienvenue " + body.name, "success");

      // redirection vers page d'accueil
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 2000);
    } else {
      showNotification(json.error || 'Erreur serveur', "error");
    }
  } catch (err) {
    showNotification("Erreur de connexion au serveur", "error");
  }
});

// Fonction pour afficher une notification moderne
function showNotification(message, type = "success") {
  const notif = document.createElement("div");
  notif.textContent = message;
  notif.className = `fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white text-sm z-50 transition
    ${type === "success" ? "bg-green-500" : "bg-red-500"}`;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.classList.add("opacity-0");
    setTimeout(() => notif.remove(), 500);
  }, 2500);
}
