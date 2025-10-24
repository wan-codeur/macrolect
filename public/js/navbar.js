// js/navbar.js

const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

menuBtn.addEventListener('click', () => {
  menu.classList.toggle('hidden');
});

// S'assurer que le menu reste caché sur desktop si on redimensionne
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) { // md breakpoint
    menu.classList.add('hidden');
  }
});
