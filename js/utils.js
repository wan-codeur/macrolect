window.addEventListener("DOMContentLoaded", async () => {
  const userSection = document.getElementById("userSection");

  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include" // très important pour envoyer le cookie de session
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.name && userSection) {
        // Affichage nom + bouton déconnexion
        userSection.innerHTML = `
          <div class="flex items-center space-x-2">
            <div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
              <i class="fas fa-user-check"></i>
              <span>${data.name}</span>
            </div>
            <button id="logoutBtn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition flex items-center space-x-2">
              <i class="fas fa-sign-out-alt"></i>
              <span>Déconnexion</span>
            </button>
          </div>
        `;

        // Gestion du clic sur déconnexion
        document.getElementById("logoutBtn").addEventListener("click", async () => {
          try {
            const res = await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include"
            });
            const json = await res.json();
            if (json.success) {
              showNotification("Déconnecté avec succès", "success");
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              showNotification(json.error || "Erreur lors de la déconnexion", "error");
            }
          } catch (err) {
            showNotification("Impossible de contacter le serveur", "error");
          }
        });

      }
    } else {
      // pas connecté → laisser le bouton connexion par défaut
      console.log("Utilisateur non connecté");
    }
  } catch (err) {
    console.error("Erreur lors de la récupération de l'utilisateur :", err);
  }
});

async function demanderDevis(categorie) {
  try {
    const res = await fetch("/api/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ⚠️ important pour la session
      body: JSON.stringify({ categorie })
    });

    const data = await res.json();
    if (data.success) {
      showNotification("Votre demande de devis a été envoyée ✅", "success");
    } else {
      showNotification("Erreur : " + (data.error || "Impossible d'envoyer le devis ❌"), "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur réseau lors de l'envoi du devis ❌", "error");
  }
}


function showNotification(message, type = "success") {
  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.textContent = message;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 3000); // disparaît après 3 sec
}

document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-electricite').classList.remove('hidden');
      document.getElementById('modal-electricite').classList.add('flex');
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(el => {
    el.addEventListener('click', (e) => {
      document.getElementById('modal-electricite').classList.remove('flex');
      document.getElementById('modal-electricite').classList.add('hidden');
    });
  });

  document.querySelectorAll('[data-modal-open="industriel"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-industriel').classList.remove('hidden');
      document.getElementById('modal-industriel').classList.add('flex');
    });
  });
  document.querySelectorAll('[data-modal-close="industriel"]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('modal-industriel').classList.remove('flex');
      document.getElementById('modal-industriel').classList.add('hidden');
    });
  });

  document.querySelectorAll('[data-modal-open="climatisation"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-climatisation').classList.remove('hidden');
      document.getElementById('modal-climatisation').classList.add('flex');
    });
  });
  document.querySelectorAll('[data-modal-close="climatisation"]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('modal-climatisation').classList.remove('flex');
      document.getElementById('modal-climatisation').classList.add('hidden');
    });
  });

  document.querySelectorAll('[data-modal-open="pompe"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-pompe').classList.remove('hidden');
      document.getElementById('modal-pompe').classList.add('flex');
    });
  });
  document.querySelectorAll('[data-modal-close="pompe"]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('modal-pompe').classList.remove('flex');
      document.getElementById('modal-pompe').classList.add('hidden');
    });
  });

  document.querySelectorAll('[data-modal-open="groupe"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-groupe').classList.remove('hidden');
      document.getElementById('modal-groupe').classList.add('flex');
    });
  });
  document.querySelectorAll('[data-modal-close="groupe"]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('modal-groupe').classList.remove('flex');
      document.getElementById('modal-groupe').classList.add('hidden');
    });
  });

  document.querySelectorAll('[data-modal-open="suivi"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-suivi').classList.remove('hidden');
      document.getElementById('modal-suivi').classList.add('flex');
    });
  });
  document.querySelectorAll('[data-modal-close="suivi"]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('modal-suivi').classList.remove('flex');
      document.getElementById('modal-suivi').classList.add('hidden');
    });
  });

// Charger le panier depuis localStorage
let panier = JSON.parse(localStorage.getItem("panier")) || [];

// Sauvegarder le panier
function sauvegarderPanier() {
  localStorage.setItem("panier", JSON.stringify(panier));
}

// Ajouter au panier
async function ajouterAuPanier(article) {
  try {
    const res = await fetch("/api/panier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ article })
    });

    const data = await res.json();
    if (data.success) {
      panier.push(article);          // ajout côté front
      sauvegarderPanier();           // mise à jour localStorage
      showNotification("Article ajouté au panier ✅", "success");

      const btnCommande = document.getElementById("btn-commande");
      if (btnCommande) btnCommande.style.display = "block";
    } else {
      showNotification("Erreur : " + (data.error || "Impossible d’ajouter"), "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur réseau lors de l’ajout au panier", "error");
  }
}

// Vérifier à chaque chargement si le panier contient déjà quelque chose
document.addEventListener("DOMContentLoaded", () => {
  if (panier.length > 0) {
    const btnCommande = document.getElementById("btn-commande");
    if (btnCommande) btnCommande.style.display = "block";
  }
});

// Clic sur bouton passer commande
document.getElementById("btn-commande")?.addEventListener("click", passerCommande);

// Passer commande (infos récupérées en BDD via session, pas de prompt)
async function passerCommande() {
  try {
    const res = await fetch("/api/commande", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    const data = await res.json();
    if (data.success) {
      showNotification("Commande envoyée ✅ Vous serez contacté sous 48h.", "success");

      panier = [];                // vider panier local
      sauvegarderPanier();        // maj localStorage
      document.getElementById("btn-commande").style.display = "none"; // cacher bouton
    } else {
      showNotification("Erreur: " + data.error, "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur réseau ❌", "error");
  }
}
