// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const pool = require('./db');


const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));
const port = process.env.PORT || 3000;

// parse bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// session store config
const sessionStore = new MySQLStore({}, pool.promise ? pool.promise() : pool);

// configure session middleware
app.use(session({
  key: 'macrolect_sid',
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // mettre true si HTTPS en production
    maxAge: 1000 * 60 * 60 * 24 // 1 jour
  }
}));

// ---- Helpers / middleware ----
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Veuillez crée un compte ou vous connecté et réessayer !' });
}

// ---- Routes d'auth ----
// Inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Champs manquants' });
    }

    // Vérifier si email existe déjà
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Insérer dans la DB
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, hash]
    );

    // Créer la session
    req.session.userId = result.insertId;
    req.session.userName = result.name;

    // Répondre une seule fois
    res.json({ success: true, userId: result.insertId, name: result.name });
    
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// Connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Champs manquants' });

    const [rows] = await pool.query('SELECT id, name, password_hash FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'Identifiants invalides' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Identifiants invalides' });

    // set session
    req.session.userId = user.id;
    req.session.userName = user.name;
    res.json({ success: true, userId: user.id, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Déconnexion
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Impossible de se déconnecter' });
    }
    res.clearCookie('macrolect_sid');
    res.json({ success: true });
  });
});

// Info utilisateur courant
app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ userId: req.session.userId, name: req.session.userName });
  }
  res.status(401).json({ error: 'Non authentifié' });
});

// ---- Routes produits & commentaires (exemples) ----

// Lister produits
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, description, price, image FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détails produit + commentaires
app.get('/api/products/:id', async (req, res) => {
  try {
    const pid = req.params.id;
    const [[product]] = await pool.query('SELECT id, title, description, price, image FROM products WHERE id = ?', [pid]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id as user_id, u.name as user_name
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.product_id = ?
       ORDER BY c.created_at DESC`, [pid]
    );
    res.json({ product, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const nodemailer = require('nodemailer');

// Transporter Nodemailer (utilise Gmail ici, mais tu peux mettre un SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // ton adresse gmail
    pass: process.env.MAIL_PASS  // mot de passe d'application Gmail
  }
});

// Route pour demander un devis
app.post('/api/devis', ensureAuthenticated, async (req, res) => {
  const { categorie } = req.body;

  try {
    // récupérer infos utilisateur depuis BDD
    const [rows] = await pool.query(
      'SELECT name, email, phone FROM users WHERE id = ?',
      [req.session.userId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const user = rows[0];

    // Préparer l'email
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: "wantechastuces@gmail.com",
      subject: `Demande de devis - ${categorie}`,
      text: `Bonjour,\n\nL'utilisateur ${user.name} a demandé un devis pour : ${categorie}.\n\nSes coordonnées :\n- Email : ${user.email}\n- Téléphone : ${user.phone}\n\nMessage : Merci de bien vouloir le contacter pour plus de détails.\n\nCordialement,\nVotre site web Macrolect`
    };

    // Envoyer
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Demande de devis envoyée avec succès !" });
  } catch (err) {
    console.error("Erreur envoi devis :", err);
    res.status(500).json({ error: "Impossible d'envoyer le mail" });
  }
});


// Poster un commentaire (seulement si connecté)
app.post('/api/products/:id/comments', ensureAuthenticated, async (req, res) => {
  try {
    const pid = req.params.id;
    const { content } = req.body;
    if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Commentaire vide' });

    const [result] = await pool.query('INSERT INTO comments (product_id, user_id, content) VALUES (?, ?, ?)', [pid, req.session.userId, content]);
    res.json({ success: true, commentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un article au panier
app.post('/api/panier', ensureAuthenticated, (req, res) => {
  const { article } = req.body;
  if (!req.session.panier) req.session.panier = [];
  req.session.panier.push(article);

  res.json({ success: true, panier: req.session.panier });
});

// Passer une commande
app.post('/api/commande', ensureAuthenticated, async (req, res) => {
  try {
    // récupérer infos utilisateur
    const [rows] = await pool.query(
      'SELECT name, email, phone FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const user = rows[0];
    const panier = req.session.panier || [];

    if (!panier.length) {
      return res.status(400).json({ error: "Votre panier est vide." });
    }

    // Préparer contenu du mail
    const contenuCommande = `
Nouvelle commande client :

Nom : ${user.name}
Email : ${user.email}
Téléphone : ${user.phone}

Articles demandés :
${panier.map((a, i) => `  ${i + 1}. ${a}`).join("\n")}

Message : Merci de contacter ce client dans les 48h qui suivent sa commande.
    `;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: "wantechastuces@gmail.com",
      subject: "Nouvelle commande client",
      text: contenuCommande
    };

    // Envoi du mail
    await transporter.sendMail(mailOptions);

    // vider le panier après confirmation
    req.session.panier = [];

    res.json({ success: true, message: "Commande envoyée avec succès !" });
  } catch (err) {
    console.error("Erreur envoi commande :", err);
    res.status(500).json({ error: "Impossible d'envoyer la commande" });
  }
});


// endpoint test pour vérifier si serveur OK
app.get('/', (req, res) => {
  res.send('Macrolect backend is running');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
