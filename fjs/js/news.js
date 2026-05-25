document.addEventListener('DOMContentLoaded', () => {
  const JSON_URL = '/db/news.json'; // JSONファイルのパス
  const ITEMS_PER_PAGE = 20;        // 1ページあたりの表示件数
  
  let newsData = [];
  let currentPage = 1;

  const newsContainer = document.getElementById('news-container');
  const paginationContainer = document.getElementById('pagination-container');

  // JSONデータを取得して初期描画
  fetch(JSON_URL)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      newsData = data;
      renderPage(currentPage);
    })
    .catch(error => {
      console.error('Error fetching news:', error);
      newsContainer.innerHTML = '<div class="p-8 text-center text-red-600 font-mono text-sm tracking-widest">FAILED TO LOAD DATA.</div>';
    });

  // 日付文字列を YYYY.MM.DD 形式に変換する関数（YYYY/MM/DD と YYYY年MM月DD日 の両方に対応）
  function formatDateString(dateString) {
    const match = dateString.match(/(\d{4})[年\/](\d{1,2})[月\/](\d{1,2})日?/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}.${month}.${day}`;
    }
    return dateString; // マッチしない場合はそのまま返す
  }

  // 指定したページのニュースを描画する関数
  function renderPage(page) {
    newsContainer.innerHTML = ''; // コンテナをクリア
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = newsData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
      newsContainer.innerHTML = '<div class="p-8 text-center text-slate-500 font-mono text-sm tracking-widest">NO NEWS FOUND.</div>';
      return;
    }

    // 1カラムレイアウトのHTMLを生成
    pageData.forEach(item => {
      const formattedDate = formatDateString(item.timestamp);
      
      // ▼ ここから変更：リンク先がhttpから始まるか（外部リンク）どうかで処理を分ける
      const isExternal = item.target.startsWith('http');
      const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
      const iconClass = isExternal ? 'ri-arrow-right-up-line' : 'ri-arrow-right-line';
      // ▲ ここまで変更

      const articleHTML = `
        <a href="${item.target}" ${targetAttr} class="group bg-white p-5 md:p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50 transition-colors relative border-b border-slate-200">
          <div class="absolute top-0 left-0 w-1 h-full bg-red-600 scale-y-0 origin-top group-hover:scale-y-100 transition-transform duration-300 z-10 hidden md:block"></div>
          <div class="absolute top-0 left-0 w-full h-1 bg-red-600 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 z-10 md:hidden"></div>
          
          <div class="relative w-full md:w-[200px] shrink-0 aspect-video bg-slate-100 overflow-hidden">
            <img src="${item.thumbnail}" alt="News Image" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700">
          </div>
          
          <div class="flex-1 flex flex-col justify-center">
            <p class="font-mono text-[10px] md:text-xs text-red-600 font-bold tracking-widest uppercase mb-2">${formattedDate}</p>
            <h3 class="text-slate-900 text-base md:text-lg font-bold leading-relaxed tracking-tight group-hover:text-red-600 transition-colors">${item.title}</h3>
          </div>
          
          <div class="mt-2 md:mt-0 flex items-center justify-end md:justify-center shrink-0">
            <div class="w-10 h-10 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <i class="${iconClass} text-lg"></i>
            </div>
          </div>
        </a>
      `;
      newsContainer.insertAdjacentHTML('beforeend', articleHTML);
    });

    renderPagination(page);
  }

  // ページネーションを描画する関数
  function renderPagination(currentPage) {
    paginationContainer.innerHTML = ''; // コンテナをクリア
    const totalPages = Math.ceil(newsData.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) return; // 1ページしかない場合はページネーションを表示しない

    // [ < ] 前へボタン
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="ri-arrow-left-s-line text-lg"></i>';
    prevBtn.className = `w-10 h-10 flex items-center justify-center border-2 uppercase transition-colors text-xs font-bold ${currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-600'}`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    paginationContainer.appendChild(prevBtn);

    // ページ番号ボタン（最大5ページ分を表示するロジック）
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // 終端に達した場合の調整
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.innerText = i.toString().padStart(2, '0'); // 01, 02 のようにゼロ埋め
      
      if (i === currentPage) {
        pageBtn.className = 'w-10 h-10 flex items-center justify-center border-2 border-slate-900 bg-slate-900 text-xs font-bold text-white uppercase transition-colors';
      } else {
        pageBtn.className = 'w-10 h-10 flex items-center justify-center border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase transition-colors';
        pageBtn.addEventListener('click', () => changePage(i));
      }
      paginationContainer.appendChild(pageBtn);
    }

    // [ > ] 次へボタン
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="ri-arrow-right-s-line text-lg"></i>';
    nextBtn.className = `w-10 h-10 flex items-center justify-center border-2 uppercase transition-colors text-xs font-bold ${currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-600'}`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
  }

  // ページ切り替えとスクロール位置の調整
  function changePage(newPage) {
    currentPage = newPage;
    renderPage(currentPage);
    
    // ニュースセクションのトップへスムーズスクロール
    const newsSection = document.getElementById('news-container').parentElement;
    const offsetTop = newsSection.getBoundingClientRect().top + window.scrollY - 100; // ヘッダー分少しずらす
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }
});