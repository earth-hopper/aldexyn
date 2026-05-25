// rider.js (個別ページ専用)

// 個別ページは「riders/」フォルダ内にあるため、1つ上の階層に戻る「../」を付与します
const JSON_PATH = '/db/riders.json'; 

// データが存在しない、またはリンク切れ（404）の場合のテクニカルSVGプレイスホルダー
const PLACEHOLDER_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Cpath d='M0,0 L100,100 M100,0 L0,100' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='50' y='55' font-family='monospace' font-size='10' font-weight='bold' fill='%2394a3b8' text-anchor='middle'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

async function loadRiderDetail() {
    const nameEl = document.getElementById('rider-name');
    if (!nameEl) return;

    try {
        const params = new URLSearchParams(window.location.search);
        const riderId = params.get('id');
        const response = await fetch(JSON_PATH);
        const riders = await response.json();
        const r = riders.find(item => item.id === riderId);

        if (!r) {
            nameEl.textContent = "ATHLETE NOT FOUND";
            return;
        }

        // 基本データ流し込み（空欄対策）
        document.getElementById('rider-name').textContent = r.rider || "UNKNOWN DATA";
        document.getElementById('rider-discipline').textContent = r.discipline || "N/A";
        document.getElementById('rider-home').textContent = r.home || r.nation || "---";
        
        // 画像の流し込み（onerrorで404時にプレイスホルダーに置換）
        const pImg = document.getElementById('rider-profile');
        if (pImg) {
            pImg.src = (!r.profile || r.profile.includes("/_profile.jpg")) ? PLACEHOLDER_IMG : r.profile;
            pImg.onerror = function() { this.onerror=null; this.src=PLACEHOLDER_IMG; };
        }
        
        const rImg = document.getElementById('rider-riding');
        if (rImg) {
            const ridingPath = (!r.riding || r.riding.includes("/_riding.jpg")) ? PLACEHOLDER_IMG : r.riding;
            rImg.src = ridingPath;
            rImg.onerror = function() { this.onerror=null; this.src=PLACEHOLDER_IMG; };
            
            const bgImg = document.getElementById('rider-riding-bg');
            if(bgImg) {
                bgImg.src = ridingPath;
                bgImg.onerror = function() { this.onerror=null; this.src=PLACEHOLDER_IMG; };
            }
        }

        // Instagram（無効化セーフガード）
        const insta = document.getElementById('rider-instagram');
        const instaText = document.getElementById('rider-instagram-text');
        if (insta && instaText) {
            if (r.instagram && r.instagram.trim() !== "") {
                insta.href = `https://instagram.com/${r.instagram.replace('@','')}`;
                instaText.textContent = r.instagram;
                insta.className = "inline-flex items-center gap-3 px-4 py-2 border border-slate-900 bg-white text-slate-900 hover:bg-slate-900 hover:text-white transition-colors duration-200 font-mono text-xs font-bold tracking-widest uppercase rounded-none group";
            } else {
                insta.removeAttribute('href');
                instaText.textContent = "NO INSTAGRAM";
                insta.className = "inline-flex items-center gap-3 px-4 py-2 border border-slate-200 bg-slate-50 text-slate-400 font-mono text-xs font-bold tracking-widest uppercase rounded-none cursor-not-allowed select-none";
                insta.innerHTML = `<i class="ri-instagram-line text-sm text-slate-300"></i><span>NO INSTAGRAM</span>`;
            }
        }

        // ★【バグ修正箇所】変数名を「rider」から「r」に修正し、正しく非表示を解除
        if (r.results && r.results.trim() !== "") {
            document.getElementById('rider-results').textContent = r.results;
            document.getElementById('sec-results').classList.remove('hidden');
        } else {
            document.getElementById('sec-results').classList.add('hidden');
        }

        if (r.comment && r.comment.trim() !== "") {
            document.getElementById('rider-comment').textContent = r.comment;
            document.getElementById('sec-comment').classList.remove('hidden');
        } else {
            document.getElementById('sec-comment').classList.add('hidden');
        }

        // スコアボード反映
        document.getElementById('rider-total-point').textContent = Number(r.point).toLocaleString();
        document.getElementById('rider-best').textContent = Number(r.best).toLocaleString();
        document.getElementById('rider-next').textContent = Number(r.next).toLocaleString();

        // 大会別リスト
        const tours = [
            {k:'hakuba-q4', n:'Hakuba 4*'}, {k:'arai-q3', n:'Arai 3*'},
            {k:'nakazato-q2', n:'Nakazato 2*'}, {k:'nakazato-q1', n:'Nakazato 1*'},
            {k:'arai-j3', n:'Arai Junior 3*'}, {k:'nakazato-j1', n:'Nakazato Junior 1*'}
        ];
        
        const tourListContainer = document.getElementById('tournaments-list');
        if (tourListContainer) {
            let tourHtml = '';
            tours.forEach(t => {
                const p = Number(r[t.k]) || 0;
                if (p > 0) {
                    tourHtml += `
                    <div class="flex justify-between items-center bg-white p-3 md:p-4 border-b border-slate-300 hover:bg-slate-50 transition-colors duration-150 rounded-none">
                        <div class="flex items-center gap-3">
                            <div class="w-1 h-6 bg-[#FF0000]"></div>
                            <div>
                                <p class="text-xs font-bold text-slate-900 tracking-wider">${t.n}</p>
                            </div>
                        </div>
                        <div class="text-right font-mono">
                            <p class="font-bold text-sm text-slate-900 font-['Cinzel'] tracking-wider">${p.toLocaleString()}</p>
                            <p class="text-[8px] text-slate-400 uppercase tracking-widest">PTS</p>
                        </div>
                    </div>`;
                }
            });
            tourListContainer.innerHTML = tourHtml || '<p class="p-4 font-mono text-[10px] tracking-widest text-slate-400 uppercase">No Data Available</p>';
        }

    } catch (e) {
        console.error("詳細ロード失敗:", e);
    }
}

window.addEventListener('DOMContentLoaded', loadRiderDetail);