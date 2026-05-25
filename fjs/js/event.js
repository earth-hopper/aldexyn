document.addEventListener('DOMContentLoaded', () => {
  const RESULTS_URL = '/db/results.json';
  
  let eventData = [];
  let currentDiscipline = '';

  // DOM要素の取得
  const buttonsContainer = document.getElementById('division-buttons');
  const rankingsContainer = document.getElementById('rankings-container');
  
  if (!rankingsContainer) return;

  // HTMLから現在の大会IDを取得（例: "hakuba-q4"）
  const eventId = rankingsContainer.getAttribute('data-event-id');

  // データのフェッチと初期化
  fetch(RESULTS_URL)
    .then(response => {
      if (!response.ok) throw new Error('ネットワークエラーが発生しました。');
      return response.json();
    })
    .then(data => {
      // 該当する大会のデータのみを抽出し、順位(place)が空でないものを取得
      eventData = data.filter(d => d.event__1 === eventId && d.place !== "");
      
      // 種目（event）の一覧を抽出し、重複を削除してソート
      const disciplines = [...new Set(eventData.map(d => d.event))].sort();
      
      if (disciplines.length > 0) {
        // 大会ごとにSessionStorageを分けるためのキー
        const storageKey = `fwt_${eventId}_selected_discipline`;
        
        // URLパラメータ優先 -> Storage -> デフォルト（最初の種目）
        const urlParams = new URLSearchParams(window.location.search);
        const urlDiscipline = urlParams.get('discipline');
        const storageDiscipline = sessionStorage.getItem(storageKey);

        const savedDiscipline = urlDiscipline || storageDiscipline;

        if (savedDiscipline && disciplines.includes(savedDiscipline)) {
          currentDiscipline = savedDiscipline;
        } else {
          currentDiscipline = disciplines[0];
        }

        updateBrowserState(currentDiscipline, storageKey);
        renderButtons(disciplines, storageKey);
        renderRankings();
      } else {
        rankingsContainer.innerHTML = '<div class="p-8 text-center text-slate-500 text-sm">大会結果がまだありません。</div>';
      }
    })
    .catch(error => {
      console.error('Error fetching results:', error);
      rankingsContainer.innerHTML = '<div class="p-8 text-center text-red-600 text-sm">データの読み込みに失敗しました。</div>';
    });

  /**
   * ブラウザのURLとSessionStorageを更新する
   */
  function updateBrowserState(disc, storageKey) {
    sessionStorage.setItem(storageKey, disc);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('discipline', disc);
    window.history.replaceState({}, '', newUrl);
  }

  /**
   * カテゴリ切り替えボタンを描画する
   */
  function renderButtons(disciplines, storageKey) {
    buttonsContainer.innerHTML = '';
    
    disciplines.forEach(disc => {
      const button = document.createElement('button');
      button.textContent = disc;
      
      const baseClasses = 'px-5 py-2.5 text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase border rounded-full transition-all duration-300 outline-none';
      
      if (disc === currentDiscipline) {
        button.className = `${baseClasses} bg-slate-900 text-white border-slate-900 shadow-md`;
      } else {
        button.className = `${baseClasses} bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-900`;
      }
      
      button.addEventListener('click', () => {
        if (currentDiscipline !== disc) {
          currentDiscipline = disc;
          updateBrowserState(disc, storageKey);
          renderButtons(disciplines, storageKey);
          renderRankings();
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

    // 現在の種目でフィルタリングし、順位（place）で昇順ソート
    const filteredResults = eventData
      .filter(d => d.event === currentDiscipline)
      .sort((a, b) => a.place - b.place);

    if (filteredResults.length === 0) {
      rankingsContainer.innerHTML = '<div class="p-8 text-center text-slate-500 text-sm">該当するデータがありません。</div>';
      return;
    }

    filteredResults.forEach((result) => {
      // 選手名からIDを生成 ("Yuki Shibata" -> "yuki_shibata")
      const riderId = result.athlete.toLowerCase().replace(/ /g, '_');
      
      const rowItem = document.createElement('a');
      rowItem.href = `/riders/rider.html?id=${riderId}`;
      rowItem.className = 'group block relative transition-colors duration-300 hover:bg-slate-50';
      
      // 4カラム構成（Rank, Rider, Nation, Point）のHTML
      rowItem.innerHTML = `
        <div class="md:hidden p-5 border-b border-slate-100 group-last:border-0">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <span class="font-mono text-sm font-bold text-slate-400 w-6">#${result.place}</span>
              <span class="font-extreme text-sm sm:text-base font-black text-slate-900 uppercase group-hover:text-red-600 transition-colors">${result.athlete}</span>
            </div>
            <i class="ri-arrow-right-line text-slate-300 group-hover:text-red-600 transition-colors text-lg"></i>
          </div>
          <div class="flex justify-between items-center pl-9">
            <span class="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">${result.nation}</span>
            <span class="font-mono text-lg font-bold text-red-600">${result.point}</span>
          </div>
        </div>
        
        <div class="hidden md:grid grid-cols-[80px_1fr_120px_120px] items-center border-b border-slate-100 group-last:border-0 relative">
          <div class="px-6 py-5 font-mono text-sm font-bold text-slate-400">#${result.place}</div>
          <div class="px-6 py-5 flex items-center gap-4">
            <span class="font-extreme text-lg font-black text-slate-900 uppercase group-hover:text-red-600 transition-colors truncate">${result.athlete}</span>
          </div>
          <div class="px-6 py-5 flex justify-end">
             <span class="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">${result.nation}</span>
          </div>
          <div class="px-6 py-5 font-mono text-xl font-bold text-red-600 text-right pr-12">${result.point}</div>
          
          <div class="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-600 text-xl flex items-center">
             <i class="ri-arrow-right-line"></i>
          </div>
        </div>
      `;
      
      rankingsContainer.appendChild(rowItem);
    });
  }
});