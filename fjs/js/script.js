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

// FOOTERの読み込み
document.addEventListener('DOMContentLoaded', () => {
  const footerContainer = document.getElementById('common-footer-container');

  if (footerContainer) {
    // 外部ファイル（footer.html）のパスを指定して読み込む
    // ※パスはディレクトリ構成に合わせて調整してください（例: './components/footer.html' など）
    fetch('/footer.html')
      .then(response => {
        // 読み込みに成功したかチェック
        if (!response.ok) {
          throw new Error('ネットワークレスポンスが正常ではありませんでした');
        }
        // レスポンスデータを文字列（テキスト）として返す
        return response.text();
      })
      .then(html => {
        // 取得したHTML文字列をコンテナに流し込む
        footerContainer.innerHTML = html;
      })
      .catch(error => {
        console.error('フッターの読み込みに失敗しました:', error);
        // エラー時のフォールバック（任意）
        footerContainer.innerHTML = '<p class="text-center text-red-500">共通コンポーネントの読み込みに失敗しました。</p>';
      });
  }
});