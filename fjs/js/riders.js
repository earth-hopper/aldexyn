document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. 両方のファイルを読み込む
    const [ridersResponse, sponsorsResponse] = await Promise.all([
      fetch('/db/riders.json'),
      fetch('/db/sponsors.json')
    ]);
    const riders = await ridersResponse.json();
    const sponsors = await sponsorsResponse.json();

    // 2. ライダーと全スポンサー情報をマージする（配列として保持）
    const ridersWithSponsors = riders.map(rider => {
      // 同じ名前のスポンサーデータをすべて抽出
      const riderSponsors = sponsors.filter(s => s.name === rider.name);
      
      return {
        ...rider,
        sponsors: riderSponsors // 配列として保持
      };
    });

    // 4つのカテゴリーをデータから抽出
    const divisions = [...new Set(ridersWithSponsors.map(item => item.division))];
    let activeDivision = null; // 初期状態では全カテゴリーを表示
    let searchQuery = '';

    const buttonsContainer = document.getElementById('division-buttons');
    const container = document.getElementById('riders-container');
    const modal = document.getElementById('rider-modal');
    const searchInput = document.getElementById('search-input');
    const emptyMessage = document.getElementById('empty-message');

    // モーダルを閉じる処理（背景スクロール固定の解除）
    const closeModal = () => {
      modal.classList.add('hidden');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('width');
    };

    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const render = () => {
      // 絞り込みボタンのレンダリング
      buttonsContainer.innerHTML = divisions.map(div => `
        <button 
          class="division-btn px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-full transition-colors ${
            activeDivision === div 
            ? 'bg-red-600 text-white' 
            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }" 
          data-division="${div}"
        >
          ${div}
        </button>
      `).join('');

      // 分類および検索キーワードでフィルタリング
      const filteredRiders = ridersWithSponsors.filter(r => {
        const matchDivision = activeDivision ? r.division === activeDivision : true;
        const cleanSearch = searchQuery.toLowerCase().trim();
        const matchName = r.name.toLowerCase().includes(cleanSearch);

        return matchDivision && matchName;
      });

      // 表示切り替え
      if (filteredRiders.length === 0) {
        container.innerHTML = '';
        emptyMessage.classList.remove('hidden');
      } else {
        emptyMessage.classList.add('hidden');

        // ライダー一覧のレンダリング
        container.innerHTML = filteredRiders.map(rider => `
          <div class="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer athlete-trigger"
               data-name="${rider.name}">
            
            <div class="relative aspect-square w-full overflow-hidden bg-slate-100">
              <img src="${rider.image}" alt="${rider.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80"></div>
              <div class="absolute bottom-3 left-3 text-white">
                <span class="text-[10px] tracking-widest uppercase bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">${rider.division}</span>
              </div>
            </div>
            
            <div class="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 class="font-bold text-base text-slate-900 group-hover:text-red-600 transition truncate">${rider.name}</h3>
              </div>
              
              <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                <p class="text-xs text-slate-400 flex items-center gap-1.5 truncate max-w-[70%]">
                  <i class="ri-map-pin-line text-xs"></i> ${rider.home}
                </p>
                <span class="text-xs font-medium text-slate-500">${rider.age}歳</span>
              </div>
            </div>
          </div>
        `).join('');
      }

      // カテゴリ切り替えボタンのイベントリスナー
      document.querySelectorAll('.division-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const clickedDivision = e.target.getAttribute('data-division');
          if (activeDivision === clickedDivision) {
            activeDivision = null;
          } else {
            activeDivision = clickedDivision;
          }
          render();
        });
      });

      // 選手カードクリック時のモーダル表示イベント
      document.querySelectorAll('.athlete-trigger').forEach(card => {
        card.addEventListener('click', () => {
          const riderName = card.getAttribute('data-name');
          const rider = ridersWithSponsors.find(r => r.name === riderName);
          if (!rider) return;

          // 基本情報のセット
          document.getElementById('modal-name').textContent = rider.name;
          document.getElementById('modal-division').textContent = rider.division;
          document.getElementById('modal-home').textContent = rider.home || '不明';
          document.getElementById('modal-age').textContent = rider.age ? `${rider.age}歳` : '-歳';
          document.getElementById('modal-image').src = rider.image || '/img/sample.jpg';

          // コメント欄の挿入
          let modalComment = document.getElementById('modal-comment');
          if (!modalComment) {
            modalComment = document.createElement('p');
            modalComment.id = 'modal-comment';
            modalComment.className = 'text-sm text-slate-600 leading-relaxed';
            const gearLink = document.getElementById('modal-gear-link');
            gearLink.parentNode.insertBefore(modalComment, gearLink);
          }
          modalComment.textContent = rider.comment || 'コメントは未設定です。';

          // スポンサー情報のコンテナ設定
          let sponsorContainer = document.getElementById('modal-sponsors-container');
          if (!sponsorContainer) {
            sponsorContainer = document.createElement('div');
            sponsorContainer.id = 'modal-sponsors-container';
            sponsorContainer.className = 'flex flex-col gap-4';
            const modalCommentEl = document.getElementById('modal-comment');
            modalCommentEl.parentNode.insertBefore(sponsorContainer, document.getElementById('modal-gear-link').nextSibling);
          }

          // スポンサー・ギアリストの描画
          if (rider.sponsors && rider.sponsors.length > 0) {
            sponsorContainer.innerHTML = rider.sponsors.map((sponsor, index) => {
              const gearUrl = sponsor.gear_link;
              const href = (gearUrl && gearUrl !== 'undefined' && gearUrl !== '') 
                ? (gearUrl.startsWith('http') ? gearUrl : `https://${gearUrl}`) 
                : '#';

              return `
                <a href="${href}" target="_blank" class="bg-slate-50 rounded-xl p-4 flex gap-4 border border-slate-100 items-center hover:bg-slate-100 transition-colors group">
                  <img src="${sponsor.gear_image || '/img/logo.png'}" alt="ギア画像" class="w-20 h-20 object-contain bg-white p-2 rounded border border-slate-200 shadow-sm flex-shrink-0">
                  <div class="flex flex-col min-w-0 flex-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">使用ギア ${index + 1}</span>
                    <div class="font-bold text-base text-slate-900 mt-0.5 truncate">${sponsor.gear_name || '未設定'}</div>
                    <div class="text-xs text-slate-500">${sponsor.gear_sponsor || ''}</div>
                    <p class="text-xs text-slate-600 italic mt-1 line-clamp-2">${sponsor.gear_comment || ''}</p>
                  </div>
                  <svg class="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              `;
            }).join('');
            
            document.getElementById('modal-gear-link').style.display = 'none';
          } else {
            sponsorContainer.innerHTML = '';
            document.getElementById('modal-gear-link').style.display = 'none';
          }

          // Instagramリンクのセット
          const instaLink = document.getElementById('modal-instagram');
          const instaUrl = rider.instagram;
          if (instaUrl && instaUrl !== 'undefined') {
            instaLink.href = `https://instagram.com/${instaUrl.replace('@', '')}`;
            instaLink.style.display = 'flex';
          } else {
            instaLink.style.display = 'none';
          }

          // モーダル全体がViewportの高さに収まり、かつ本文部分がスクロールするように調整
          const modalContentArea = modal.querySelector('.overflow-y-auto');
          if (modalContentArea) {
            modalContentArea.className = 'overflow-y-auto w-full h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-900';
          }

          // 背景のスクロールを固定する処理を追加
          document.body.style.overflow = 'hidden';
          document.body.style.position = 'relative';
          document.body.style.width = '100%';

          modal.classList.remove('hidden');
        });
      });
    };

    // 検索バーの入力処理
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // 初回レンダリング
    render();

  } catch (error) {
    console.error('ライダー一覧の読み込みに失敗しました:', error);
  }
});