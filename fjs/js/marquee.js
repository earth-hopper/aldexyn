document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("marquee-container");
    if (!container) return;
  
    try {
      // 1. JSONデータをフェッチ
      const response = await fetch('/db/riders.json');
      if (!response.ok) throw new Error('ネットワークレスポンスが正常ではありませんでした');
      const riders = await response.json();
  
      // 2. データのクリーニング：コメントとプロフィール画像が存在する選手のみを抽出
      const validRiders = riders.filter(rider => 
        rider.comment && rider.comment.trim() !== "" && 
        rider.profile && rider.profile.trim() !== ""
      );
  
      if (validRiders.length === 0) {
        console.warn('表示可能なライダーのコメントがありません。');
        return;
      }
  
      // 3. 配列をランダムにシャッフル (フィッシャー–イェーツのシャッフル)
      for (let i = validRiders.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validRiders[i], validRiders[j]] = [validRiders[j], validRiders[i]];
      }
  
      // 4. HTML文字列の生成
      const cardsHTML = validRiders.map(rider => `
        <a href="/riders/rider.html?id=${rider.id}" class="group block w-[280px] md:w-[320px] shrink-0 bg-[#0a0e17] border border-white/10 overflow-hidden relative transition-all duration-500 hover:border-red-600/50 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(225,29,72,0.1)] flex flex-col h-[520px]">
          <div class="aspect-square w-full overflow-hidden relative border-b border-white/10">
            <img src="${rider.profile}" alt="${rider.rider}" class="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" loading="lazy">
            <div class="absolute bottom-3 left-3 bg-[#05070a]/90 backdrop-blur-md px-3 py-1.5 border border-white/10 flex items-center gap-2">
              <span class="text-xs font-bold text-white">${rider.nation}</span><span class="w-px h-3 bg-white/30"></span><span class="text-[10px] text-red-500 font-mono tracking-widest uppercase">${rider.discipline}</span>
            </div>
          </div>
          <div class="p-6 md:p-8 flex-grow flex flex-col relative bg-gradient-to-b from-transparent to-[#05070a]">
            <div class="absolute top-4 right-4 text-7xl text-white/5 font-display font-black leading-none group-hover:text-red-600/10 transition-colors">"</div>
            <p class="text-slate-300 text-sm font-medium leading-relaxed mb-6 line-clamp-3 relative z-10 group-hover:text-white transition-colors">
              ${rider.comment}
            </p>
            <div class="mt-auto">
              <h4 class="font-display font-black text-xl text-white uppercase tracking-tight group-hover:text-red-500 transition-colors">${rider.rider}</h4>
              <div class="flex items-center justify-between mt-3 border-t border-white/10 pt-3">
                <span class="font-mono text-[10px] text-slate-500 tracking-widest uppercase group-hover:text-slate-300 transition-colors">View Profile</span>
                <span class="text-slate-500 font-mono text-sm group-hover:text-red-500 group-hover:translate-x-1 transition-all">[+]</span>
              </div>
            </div>
          </div>
        </a>
      `).join('');
  
      // 5. 無限ループ（CSS）を成立させるため、生成したカード群を「2セット」連結して挿入する
      container.innerHTML = cardsHTML + cardsHTML;
  
      // 6. カードの枚数に応じてアニメーション速度を動的に設定（1枚あたり約6秒のスピード感）
      const animationDuration = validRiders.length * 6;
      container.style.animationDuration = `${animationDuration}s`;
  
    } catch (error) {
      console.error('ライダーデータの読み込みに失敗しました:', error);
    }
  });