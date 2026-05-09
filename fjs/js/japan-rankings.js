document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. データの並行取得（sponsors.jsonも追加）
    const [rankingsRes, ridersRes, sponsorsRes] = await Promise.all([
      fetch('/db/japan-rankings.json'),
      fetch('/db/riders.json'),
      fetch('/db/sponsors.json')
    ]);
    const rankings = await rankingsRes.json();
    const riders = await ridersRes.json();
    window.sponsors = await sponsorsRes.json(); // windowオブジェクトに保持

    // 2. Divisionの初期設定
    const divisions = [...new Set(rankings.map(item => item.division))];
    let activeDivision = divisions[0] || 'Ski Men';

    const buttonsContainer = document.getElementById('division-buttons');
    const rankingsContainer = document.getElementById('rankings-container');

    // モーダル用DOMの作成
    const modal = document.createElement('div');
    modal.id = 'rider-modal';
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 hidden';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full shadow-xl relative flex flex-col overflow-hidden">
        <button id="close-modal-btn" class="absolute top-4 right-4 text-white hover:text-slate-200 text-xl font-bold bg-black/40 rounded-full w-8 h-8 flex items-center justify-center z-10">&times;</button>
        
        <div class="relative w-full h-48 bg-slate-100">
          <img id="modal-image" src="" alt="選手画像" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
            <h3 id="modal-name" class="text-2xl font-black mt-2 leading-tight"></h3>
            <div class="flex items-center gap-2 mt-2 text-xs font-medium text-slate-200 bg-black/40 px-2.5 py-1 rounded-md w-fit">
              <span id="modal-division"></span>
              <span>&bull;</span>
              <span id="modal-home"></span>
              <span>&bull;</span>
              <span id="modal-age"></span>
            </div>
          </div>
        </div>

        <div class="p-6 flex flex-col gap-5 overflow-y-auto max-h-[calc(85vh-12rem)] scrollbar-none">
          <p id="modal-comment" class="text-sm text-slate-600 leading-relaxed"></p>

          <div id="modal-sponsors-container" class="flex flex-col gap-4"></div>

          <a id="modal-gear-link" href="#" target="_blank" class="bg-slate-50 rounded-xl p-4 flex gap-4 border border-slate-100 items-center hover:bg-slate-100 transition-colors group">
            <img id="modal-gear-image" src="" alt="ギア画像" class="w-20 h-20 object-contain bg-white p-2 rounded border border-slate-200 shadow-sm flex-shrink-0">
            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">使用ギア</span>
              <div class="font-bold text-base text-slate-900 mt-0.5 truncate" id="modal-gear-name"></div>
              <div class="text-xs text-slate-500" id="modal-gear-sponsor"></div>
              <p class="text-xs text-slate-600 italic mt-1 line-clamp-2" id="modal-gear-comment"></p>
            </div>
            <svg class="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <div>
            <a id="modal-instagram" href="#" target="_blank" class="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity shadow-sm">
              Instagramを見る
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.classList.add('hidden');
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // レンダリング処理
    const render = () => {
      buttonsContainer.innerHTML = divisions.map(div => `
        <button 
          class="division-btn px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-full transition-colors ${
            activeDivision === div 
            ? 'bg-red-600 text-white' 
            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }" 
          data-division="${div}"
        >
          ${div}
        </button>
      `).join('');

      const filteredData = rankings.filter(item => item.division === activeDivision);

      rankingsContainer.innerHTML = filteredData.map(item => {
        const rankDisplay = item.place || '-';
        let medalClass = 'bg-slate-100 text-slate-800';
        if (item.place === 1) medalClass = 'bg-yellow-500 text-white';
        else if (item.place === 2) medalClass = 'bg-slate-300 text-slate-800';
        else if (item.place === 3) medalClass = 'bg-amber-700 text-white';

        return `
          <div class="grid grid-cols-[56px_1fr_auto] md:grid-cols-[80px_1fr_120px_120px_120px] items-center border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div class="px-4 md:px-6 py-3 md:py-4">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${medalClass}">
                ${rankDisplay}
              </span>
            </div>
            
            <div class="px-4 md:px-6 py-3 md:py-4 flex flex-col gap-1">
              <button class="athlete-trigger font-bold text-base text-slate-900 hover:underline text-left" 
                      data-name="${item.athlete}"
                      data-division="${item.division}"
                      data-place="${item.place}"
                      data-best="${item.best}"
                      data-next="${item.next}"
                      data-point="${item.point}">
                ${item.athlete}
              </button>
            </div>
            
            <div class="hidden md:flex px-6 py-4 items-center justify-end gap-2 text-right">
              <span class="font-semibold text-slate-900">${item.best.toLocaleString()}</span>
            </div>

            <div class="hidden md:flex px-6 py-4 items-center justify-end gap-2 text-right">
              <span class="font-semibold text-slate-900">${item.next.toLocaleString()}</span>
            </div>
            
            <div class="hidden md:block px-6 py-4 text-right">
              <span class="font-bold text-lg text-slate-900">${item.point.toLocaleString()}</span>
            </div>
            
            <div class="md:hidden flex flex-col items-end gap-1 py-3 pr-4">
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500">Best:</span>
                <span class="font-medium text-slate-900">${item.best.toLocaleString()}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500">Next:</span>
                <span class="font-medium text-slate-900">${item.next.toLocaleString()}</span>
              </div>
              <span class="font-bold text-base text-slate-900 mt-1">${item.point.toLocaleString()}</span>
            </div>
          </div>
        `;
      }).join('');

      // イベントリスナーの追加
      document.querySelectorAll('.division-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeDivision = e.target.getAttribute('data-division');
          render();
        });
      });

      // 選手名クリック時の処理
      document.querySelectorAll('.athlete-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.getAttribute('data-name');
          const rider = riders.find(r => r.name === name) || {};

          document.getElementById('modal-division').textContent = btn.getAttribute('data-division');
          document.getElementById('modal-name').textContent = name;

          // 追加情報の設定
          document.getElementById('modal-home').textContent = rider.home || '不明';
          document.getElementById('modal-age').textContent = rider.age ? `${rider.age}歳` : '-歳';
          document.getElementById('modal-image').src = rider.image || '/img/sample.jpg';
          
          document.getElementById('modal-comment').textContent = rider.comment || 'コメントは未設定です。';

          const riderSponsors = window.sponsors?.filter(s => s.name === name) || [];

          // スポンサー情報のコンテナ設定
          const sponsorContainer = document.getElementById('modal-sponsors-container');
          
          if (riderSponsors && riderSponsors.length > 0) {
            sponsorContainer.innerHTML = riderSponsors.map((sponsor, index) => {
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

          const instaLink = document.getElementById('modal-instagram');
          if (rider.instagram) {
            instaLink.href = `https://instagram.com/${rider.instagram.replace('@', '')}`;
            instaLink.style.display = 'flex';
          } else {
            instaLink.style.display = 'none';
          }

          modal.classList.remove('hidden');
        });
      });
    };

    render();
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error);
  }
});