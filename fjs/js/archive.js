document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("archive-container");
    if (!container) return;
  
    try {
      // データの取得
      const response = await fetch("/db/archive.json");
      if (!response.ok) throw new Error("Failed to fetch archive data.");
      const data = await response.json();
  
      // データのグルーピング (年 -> イベント -> 種目)
      const seasons = {};
      
      data.forEach(item => {
        // 日付から年を抽出 (文字列"2024"や"2024-02-24"に対応)
        const year = String(item.date).substring(0, 4);
        
        if (!seasons[year]) {
          seasons[year] = {};
        }
        
        if (!seasons[year][item.event]) {
          seasons[year][item.event] = {
            name: item.name,
            venue: item.venue,
            grade: item.grade.toUpperCase(), // FWQ ★★★★ のような表記に合わせる場合はここで変換可能
            date: String(item.date).length > 4 ? String(item.date).replace(/-/g, '.') : `${year}.TBA`,
            divisions: {}
          };
        }
        
        seasons[year][item.event].divisions[item.division] = {
          first: item.first || "-",
          second: item.second || "-",
          third: item.third || "-"
        };
      });
  
      // 年の降順でソートしてHTMLを生成
      const sortedYears = Object.keys(seasons).sort((a, b) => b - a);
      
      sortedYears.forEach(year => {
        // シーズンごとのラッパー
        const seasonDiv = document.createElement("div");
        seasonDiv.className = "border-t-2 border-slate-900";
        
        // シーズンヘッダー
        seasonDiv.innerHTML = `
          <div class="py-8 md:py-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
               <div class="w-2 h-2 bg-slate-900"></div>
               <h3 class="font-extreme text-xl md:text-3xl font-black tracking-[0.2em] text-slate-900 uppercase">Season ${year}</h3>
            </div>
          </div>
          <div class="w-full border-t border-slate-200 divide-y divide-slate-200 event-list"></div>
        `;
        
        const eventListContainer = seasonDiv.querySelector(".event-list");
        const events = seasons[year];
        
        // イベントごとのアコーディオン生成
        Object.keys(events).forEach(eventId => {
          const ev = events[eventId];
          
          // 星の数を短縮表記に変換するロジック (例: "Qualifier 4*" -> "FWQ ★★★★")
          let badgeText = ev.grade;
          if (ev.grade.includes("QUALIFIER")) {
            const stars = ev.grade.match(/\d/);
            badgeText = stars ? `FWQ ${'★'.repeat(parseInt(stars[0]))}` : "FWQ";
          }
          
          const eventAccordion = document.createElement("div");
          eventAccordion.className = "flex flex-col";
          
          // 種目ごとのリザルトブロック生成
          let podiumHtml = "";
          const divisionOrder = ["SKI MEN", "SKI WOMEN", "SNOWBOARD MEN", "SNOWBOARD WOMEN"];
          
          divisionOrder.forEach(divName => {
            if (ev.divisions[divName]) {
              const results = ev.divisions[divName];
              podiumHtml += `
                <div>
                  <h5 class="font-mono text-[10px] font-bold text-slate-900 tracking-[0.2em] uppercase mb-4 border-b border-slate-200 pb-2">${divName}</h5>
                  <ul class="space-y-3 font-mono text-[10px] sm:text-xs uppercase tracking-wider">
                    <li class="flex items-start gap-3"><span class="text-red-600 font-bold w-3">1</span> <span class="text-slate-900 font-semibold">${results.first}</span></li>
                    <li class="flex items-start gap-3"><span class="text-slate-400 font-bold w-3">2</span> <span class="text-slate-700">${results.second}</span></li>
                    <li class="flex items-start gap-3"><span class="text-slate-300 font-bold w-3">3</span> <span class="text-slate-600">${results.third}</span></li>
                  </ul>
                </div>
              `;
            }
          });
  
          eventAccordion.innerHTML = `
            <button class="accordion-toggle group flex flex-col lg:flex-row lg:items-center py-6 md:py-8 hover:bg-slate-50 transition-colors px-4 -mx-4 sm:px-6 sm:-mx-6 text-left w-full cursor-pointer justify-between">
              <div class="flex flex-col lg:flex-row lg:items-center w-full gap-4 shrink-0">
                <div class="w-full lg:w-1/5 shrink-0">
                  <p class="font-mono text-[10px] text-slate-500 tracking-[0.2em] font-medium">
                    <i class="ri-calendar-line text-red-600 mr-1 text-sm align-middle"></i>${ev.date}
                  </p>
                </div>
                <div class="w-full lg:w-1/4 flex items-center gap-4 shrink-0">
                  <span class="font-mono text-[10px] text-slate-500 tracking-[0.2em] uppercase">${ev.venue}</span>
                  <span class="bg-slate-900 text-white font-mono text-[10px] px-3 py-1.5 uppercase tracking-widest font-bold">${badgeText}</span>
                </div>
                <div class="w-full lg:w-auto flex-1 pr-4">
                  <h4 class="font-extreme text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-red-600 transition-colors">${ev.name}</h4>
                </div>
              </div>
              <div class="shrink-0 hidden lg:flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 group-hover:border-red-600 transition-colors">
                <i class="ri-add-line text-lg text-slate-400 group-hover:text-red-600 transition-transform duration-300 transform accordion-icon"></i>
              </div>
            </button>
            
            <div class="accordion-content overflow-hidden max-h-0 transition-all duration-500 ease-in-out bg-slate-50 border-t border-slate-100 opacity-0 px-4 -mx-4 sm:px-6 sm:-mx-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 md:py-10">
                ${podiumHtml}
              </div>
            </div>
          `;
          
          eventListContainer.appendChild(eventAccordion);
        });
        
        container.appendChild(seasonDiv);
      });
  
      // アコーディオンの開閉ロジックを追加
      const toggles = document.querySelectorAll('.accordion-toggle');
      toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
          const content = this.nextElementSibling;
          const icon = this.querySelector('.accordion-icon');
          
          // 開閉状態の切り替え
          if (content.style.maxHeight) {
            // 閉じる
            content.style.maxHeight = null;
            content.classList.remove('opacity-100');
            content.classList.add('opacity-0');
            icon.classList.remove('rotate-45');
          } else {
            // 開く
            content.style.maxHeight = content.scrollHeight + "px";
            content.classList.remove('opacity-0');
            content.classList.add('opacity-100');
            icon.classList.add('rotate-45');
          }
        });
      });
  
    } catch (error) {
      console.error("Error loading archive data:", error);
      container.innerHTML = `<p class="text-sm font-mono text-slate-500 tracking-wider">Failed to load archive data.</p>`;
    }
  });