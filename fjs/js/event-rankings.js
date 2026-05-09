document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. 現在のHTMLファイル名から拡張子を除いた名前を取得
    const pathName = window.location.pathname.split('/').pop().replace('.html', '');
    
    // 2. 一致するJSONデータを取得
    const response = await fetch(`/db/${pathName}.json`);
    const data = await response.json();

    // Divisionのリストを取得
    const divisions = [...new Set(data.map(item => item.division))];
    let activeDivision = divisions[0] || 'スキー男子';

    const buttonsContainer = document.getElementById('division-buttons');
    const rankingsContainer = document.getElementById('rankings-container');

    // レンダリング関数
    const render = () => {
      // ボタンのレンダリング
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

      // 現在のDivisionのデータをフィルタリング
      const filteredData = data.filter(item => item.division === activeDivision);

      // リストのレンダリング
      rankingsContainer.innerHTML = filteredData.map(item => {
        // Rankが空欄の場合は '-' を表示
        const rankDisplay = item.place || '-';
        let medalClass = 'bg-slate-100 text-slate-800';
        if (item.place === 1) medalClass = 'bg-yellow-500 text-white';
        else if (item.place === 2) medalClass = 'bg-slate-300 text-slate-800';
        else if (item.place === 3) medalClass = 'bg-amber-700 text-white';

        return `
          <div class="grid grid-cols-[56px_1fr_auto] md:grid-cols-[80px_1fr_120px_120px] items-center border-b border-slate-100 hover:bg-slate-50 transition-colors">
            
            <div class="px-4 md:px-6 py-3 md:py-4">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${medalClass}">
                ${rankDisplay}
              </span>
            </div>
            
            <div class="px-4 md:px-6 py-3 md:py-4 flex flex-col gap-1">
              <span class="font-bold text-base text-slate-900">${item.athlete}</span>
              <span class="md:hidden text-xs text-slate-500">${item.nation}</span>
            </div>
            
            <div class="hidden md:flex px-6 py-4 items-center justify-end gap-2">
              <span class="text-sm text-slate-500">${item.nation}</span>
            </div>
            
            <div class="hidden md:block px-6 py-4 text-right">
              <span class="font-bold text-lg text-slate-900">${item.point.toLocaleString()}</span>
            </div>
            
            <div class="md:hidden flex flex-col items-end gap-1 py-3 pr-4">
              <span class="font-bold text-lg text-slate-900">${item.point.toLocaleString()}</span>
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
    };

    render();

  } catch (error) {
    console.error('ランキングデータの読み込みに失敗しました:', error);
  }
});