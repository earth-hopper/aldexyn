// riders.js (一覧ページ専用)

const JSON_PATH = '/db/riders.json'; 
let allRiders = [];       // APIから取得した全データ
let filteredRiders = [];  // フィルター適用後のデータ
let currentDisplayCount = 0;
const ITEMS_PER_PAGE = 20;
let currentDiscipline = 'ALL'; // 現在選択されている種目（初期値はALL）

const PLACEHOLDER_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Cpath d='M0,0 L100,100 M100,0 L0,100' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='50' y='55' font-family='monospace' font-size='10' font-weight='bold' fill='%2394a3b8' text-anchor='middle'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

async function loadRiderList() {
    const container = document.getElementById('rider-list');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const filterContainer = document.getElementById('discipline-filters');
    if (!container) return;

    try {
        const response = await fetch(JSON_PATH);
        const riders = await response.json();

        // ソート: 1.画像あり優先 2.ポイント降順
        riders.sort((a, b) => {
            const aBlank = (!a.profile || a.profile.includes("_profile.jpg") && a.profile.length < 30);
            const bBlank = (!b.profile || b.profile.includes("_profile.jpg") && b.profile.length < 30);
            if (aBlank !== bBlank) return aBlank ? 1 : -1;
            return (Number(b.point) || 0) - (Number(a.point) || 0);
        });

        allRiders = riders;

        // --- フィルター初期設定 ---
        if (filterContainer) {
            // 重複を削除して種目一覧を抽出
            const disciplines = [...new Set(riders.map(r => r.discipline).filter(Boolean))].sort();
            
            // URLパラメータから初期種目を取得（Rankingsと同じ仕様）
            const urlParams = new URLSearchParams(window.location.search);
            const urlDisc = urlParams.get('discipline');
            if (urlDisc && (disciplines.includes(urlDisc) || urlDisc === 'ALL')) {
                currentDiscipline = urlDisc;
            }

            renderFilters(disciplines, filterContainer);
        }

        // フィルターを適用して初回レンダリング
        applyFilter(currentDiscipline);

        if (loadMoreBtn) {
            loadMoreBtn.onclick = renderRiders;
        }
    } catch (error) {
        console.error("一覧ロード失敗:", error);
        container.innerHTML = '<div class="col-span-full text-center border-2 border-slate-900 py-12"><p class="font-mono text-xs uppercase tracking-widest text-red-600 font-bold">SYSTEM ERROR: Data Unavailable</p></div>';
    }
}

// フィルターボタンを描画
function renderFilters(disciplines, container) {
    let html = createFilterButton('ALL', currentDiscipline === 'ALL');
    disciplines.forEach(disc => {
        html += createFilterButton(disc, currentDiscipline === disc);
    });
    container.innerHTML = html;
}

// 個別のフィルターボタンHTMLを生成（エディトリアル・ブルータリズムデザイン）
function createFilterButton(discipline, isActive) {
    const activeClass = isActive 
        ? 'bg-slate-900 text-white border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] translate-x-[-2px] translate-y-[-2px]' 
        : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-100 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]';
        
    return `<button onclick="handleFilterClick('${discipline}')" class="${activeClass} border-2 px-5 py-2 font-mono text-[10px] font-bold tracking-widest uppercase rounded-none transition-all duration-200 cursor-pointer focus:outline-none">${discipline}</button>`;
}

// フィルターがクリックされた時の処理（HTMLから呼ばれるためwindowに登録）
window.handleFilterClick = function(discipline) {
    if (currentDiscipline === discipline) return; // 同じものが押されたら何もしない
    
    currentDiscipline = discipline;
    
    // URLを更新 (シェア可能にするため)
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('discipline', discipline);
    window.history.pushState({}, '', newUrl);

    // ボタンの見た目を更新
    const filterContainer = document.getElementById('discipline-filters');
    if (filterContainer) {
        const disciplines = [...new Set(allRiders.map(r => r.discipline).filter(Boolean))].sort();
        renderFilters(disciplines, filterContainer);
    }

    // データを絞り込んで再描画
    applyFilter(discipline);
};

// データの絞り込みとリセット
function applyFilter(discipline) {
    if (discipline === 'ALL') {
        filteredRiders = allRiders;
    } else {
        filteredRiders = allRiders.filter(r => r.discipline === discipline);
    }
    
    currentDisplayCount = 0; // 読み込み件数をリセット
    const container = document.getElementById('rider-list');
    if (container) container.innerHTML = '';
    
    renderRiders();
}

// 選手カードを描画（ページネーション対応）
function renderRiders() {
    const container = document.getElementById('rider-list');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const nextCount = Math.min(currentDisplayCount + ITEMS_PER_PAGE, filteredRiders.length);
    
    let html = '';
    for (let i = currentDisplayCount; i < nextCount; i++) {
        const r = filteredRiders[i];
        const imgPath = (!r.profile || r.profile.includes("/_profile.jpg")) ? PLACEHOLDER_IMG : r.profile;
        const riderName = r.rider || "UNKNOWN DATA";
        const nation = r.nation || "---";
        const discipline = r.discipline || "N/A";

        html += `
        <a href="/riders/rider.html?id=${r.id}" class="block group h-full">
          <div class="bg-white border-2 border-slate-900 rounded-none flex flex-col h-full hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all">
            <div class="relative aspect-square border-b-2 border-slate-900 overflow-hidden bg-slate-50">
              <img src="${imgPath}" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';" class="w-full h-full object-cover">
              <div class="absolute top-1 left-1 px-2 py-1 bg-[#FF0000] text-white text-[9px] font-mono font-bold border border-slate-900">${discipline}</div>
            </div>
            <div class="p-4 text-center flex-grow flex flex-col justify-center">
              <h3 class="font-['Cinzel'] font-black text-lg text-slate-900 uppercase truncate">${riderName}</h3>
              <p class="font-mono text-[9px] text-slate-400 uppercase">${nation}</p>
            </div>
            <div class="mt-auto border-t-2 border-slate-900 flex justify-between px-4 py-2 bg-slate-50 font-mono text-[10px]">
              <span class="text-slate-500 uppercase">Total Pts</span>
              <span class="font-bold text-slate-900">${Number(r.point).toLocaleString()}</span>
            </div>
          </div>
        </a>`;
    }
    
    // 見つからなかった場合のメッセージ
    if (filteredRiders.length === 0) {
        html = '<div class="col-span-full py-12 text-center border-2 border-slate-200"><p class="font-mono text-[10px] uppercase tracking-widest text-slate-500">No riders found in this category.</p></div>';
    }

    container.insertAdjacentHTML('beforeend', html);
    currentDisplayCount = nextCount;
    
    // 「さらに読み込む」ボタンの表示制御
    if (loadMoreBtn) {
        if (currentDisplayCount >= filteredRiders.length) loadMoreBtn.classList.add('hidden');
        else loadMoreBtn.classList.remove('hidden');
    }
}

window.addEventListener('DOMContentLoaded', loadRiderList);