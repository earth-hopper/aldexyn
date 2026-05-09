// ナビゲーションバーのスタイル切り替え
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('bg-white', 'text-slate-900', 'shadow-sm', 'border-b', 'border-slate-100');
    navbar.classList.remove('text-white', 'bg-transparent');
  } else {
    navbar.classList.remove('bg-white', 'text-slate-900', 'shadow-sm', 'border-b', 'border-slate-100');
    navbar.classList.add('text-white', 'bg-transparent');
  }
});

// ティッカーの複製
document.querySelectorAll('.fwt-ticker-track').forEach(track => {
  const content = track.innerHTML;
  track.innerHTML = content + content + content + content;
});

// ハンバーガーメニューの開閉機能
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = menuToggle.querySelector('i');

menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('opacity-0');
  mobileMenu.classList.toggle('pointer-events-none');
  
  // アイコンの切り替え
  if (mobileMenu.classList.contains('opacity-0')) {
    menuIcon.className = 'ri-menu-line text-xl';
  } else {
    menuIcon.className = 'ri-close-line text-xl';
  }
});