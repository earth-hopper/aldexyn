document.addEventListener('DOMContentLoaded', () => {
  const RANKINGS_URL = '/db/riders.json';
  
  let ridersData = [];
  let currentDiscipline = '';

  // DOM要素の取得
  const buttonsContainer = document.getElementById('division-buttons');
  const rankingsContainer = document.getElementById('rankings-container');

  // データのフェッチと初期化
  fetch(RANKINGS_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error('ネットワークエラーが発生しました。');
      }
      return response.json();
    })
    .then(data => {
      ridersData = data;
      
      // 種目（discipline）の一覧を抽出し、重複を削除してソート
      const disciplines = [...new Set(data.map(rider => rider.discipline))].sort();
      
      if (disciplines.length > 0) {
        // ▼【解決策】URLパラメータ、またはSessionStorageから以前の選択状態を取得
        const urlParams = new URLSearchParams(window.location.search);
        const urlDiscipline = urlParams.get('discipline');
        const storageDiscipline = sessionStorage.getItem('fwt_selected_discipline');

        // URLパラメータ優先 -> Storage -> デフォルト（最初の種目）の順で判定
        const savedDiscipline = urlDiscipline || storageDiscipline;

        if (savedDiscipline && disciplines.includes(savedDiscipline)) {
          currentDiscipline = savedDiscipline;
        } else {
          currentDiscipline = disciplines[0];
        }

        // URLにパラメータがない場合は、現在の状態をURLに反映（シェアしやすくするため）
        updateBrowserState(currentDiscipline);

        renderButtons(disciplines);
        renderRankings();
      }
    })
    .catch(error => {
      console.error('Error fetching riders:', error);
      rankingsContainer.innerHTML = '<div class="p-8 text-center text-red-600 text-sm">ランキングデータの読み込みに失敗しました。</div>';
    });

  /**
   * ブラウザのURLとSessionStorageを更新する
   */
  function updateBrowserState(disc) {
    // 1. Session Storage に保存
    sessionStorage.setItem('fwt_selected_discipline', disc);

    // 2. 履歴を汚さずにURLパラメータを更新（history.replaceStateを使用）
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('discipline', disc);
    window.history.replaceState({}, '', newUrl);
  }

  /**
   * カテゴリ切り替えボタンを描画する
   */
  function renderButtons(disciplines) {
    buttonsContainer.innerHTML = '';
    
    disciplines.forEach(disc => {
      const button = document.createElement('button');
      button.textContent = disc;
      
      // 基本となるTailwindクラス
      const baseClasses = 'px-5 py-2.5 text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase border rounded-full transition-all duration-300 outline-none';
      
      // 選択状態によるクラスの切り替え
      if (disc === currentDiscipline) {
        button.className = `${baseClasses} bg-slate-900 text-white border-slate-900 shadow-md`;
      } else {
        button.className = `${baseClasses} bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-900`;
      }
      
      // クリックイベント
      button.addEventListener('click', () => {
        if (currentDiscipline !== disc) {
          currentDiscipline = disc;
          
          // ▼【解決策】ボタンがクリックされたら状態を保存
          updateBrowserState(disc);

          renderButtons(disciplines); // ボタンのアクティブ状態を更新
          renderRankings();           // ランキングを再描画
        }
      });
      
      buttonsContainer.appendChild(button);
    });
  }

  /**
   * 選択された種目のランキングを描画する
   */
  function renderRankings() {
    rankingsContainer.innerHTML = '';

    // 現在の種目でフィルタリングし、ポイントの降順でソート
    const filteredRiders = ridersData
      .filter(rider => rider.discipline === currentDiscipline)
      .sort((a, b) => b.point - a.point);

    if (filteredRiders.length === 0) {
      rankingsContainer.innerHTML = '<div class="p-8 text-center text-slate-500 text-sm">該当するデータがありません。</div>';
      return;
    }

    filteredRiders.forEach((rider, index) => {
      const rank = index + 1;
      
      const rowItem = document.createElement('a');
      rowItem.href = `/riders/rider.html?id=${rider.id}`;
      rowItem.className = 'group block relative transition-colors duration-300 hover:bg-slate-50';
      
      rowItem.innerHTML = `
        <div class="md:hidden p-5 border-b border-slate-100 group-last:border-0">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="font-mono text-sm font-bold text-slate-400 w-6">#${rank}</span>
              <span class="font-extreme text-sm sm:text-base font-black text-slate-900 uppercase group-hover:text-red-600 transition-colors">${rider.rider}</span>
              <span class="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">${rider.nation}</span>
            </div>
            <span class="font-mono text-lg font-bold text-red-600">${rider.point}</span>
          </div>
          <div class="flex justify-between items-center text-[10px] text-slate-400 font-mono tracking-widest pl-9">
            <div class="flex gap-4">
              <span>BEST <span class="text-slate-700 ml-1">${rider.best}</span></span>
              <span>NEXT <span class="text-slate-700 ml-1">${rider.next}</span></span>
            </div>
            <i class="ri-arrow-right-line text-slate-300 group-hover:text-red-600 transition-colors text-lg"></i>
          </div>
        </div>
        
        <div class="hidden md:grid grid-cols-[80px_1fr_120px_120px_120px] items-center border-b border-slate-100 group-last:border-0 relative">
          <div class="px-6 py-5 font-mono text-sm font-bold text-slate-400">#${rank}</div>
          <div class="px-6 py-5 flex items-center gap-4">
            <span class="font-extreme text-lg font-black text-slate-900 uppercase group-hover:text-red-600 transition-colors truncate">${rider.rider}</span>
            <span class="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">${rider.nation}</span>
          </div>
          <div class="px-6 py-5 font-mono text-sm text-slate-600 text-right">${rider.best}</div>
          <div class="px-6 py-5 font-mono text-sm text-slate-600 text-right">${rider.next}</div>
          <div class="px-6 py-5 font-mono text-xl font-bold text-red-600 text-right pr-12">${rider.point}</div>
          
          <div class="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-600 text-xl flex items-center">
             <i class="ri-arrow-right-line"></i>
          </div>
        </div>
      `;
      
      rankingsContainer.appendChild(rowItem);
    });
  }
});