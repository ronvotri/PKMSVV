/* PKMSVV: in-run Pokemon evolution; noncommercial offline addon.
 * Rules generated from PokeAPI species/evolution tables.
 * Source game: JPTER78/pokesurvivor (PolyForm Noncommercial).
 */
G.PKMSVVEvo = (() => {
  const RULES = (G.PKMSVV_EVOLUTION_DATA && G.PKMSVV_EVOLUTION_DATA.rules) || [];
  const BY_FROM = new Map();
  for (const r of RULES) {
    if (!BY_FROM.has(r.from)) BY_FROM.set(r.from, []);
    BY_FROM.get(r.from).push(r);
  }
  const HP_FACTOR = __PKMSVV_HP_FACTOR__;
  const BIOMES = ['Rừng', 'Hang pha lê', 'Núi lửa'];
  const DAY_SPAN = 240; // 4 minutes day, 4 minutes night, repeated within a run
  const S = id => (G.DEX_BY[id] && G.DEX_BY[id].name) || ('#' + id);
  const nice = s => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const daytime = t => Math.floor(t / DAY_SPAN) % 2 === 0 ? 'day' : 'night';
  const locationBiome = r => (r.location ? r.location.length : r.to) % 3;

  function reset(pl) {
    pl.pkmEvoShards = 0;
    pl.pkmEvoBossSeen = pl.bosses;
    pl.pkmEvoSteps = 0;
    pl.pkmEvoCasts = 0;
    pl.pkmEvoByMove = {};
    pl.pkmEvoByType = {};
    pl.pkmEvoDamage = 0;
    pl.pkmEvoLastX = pl.x; pl.pkmEvoLastY = pl.y;
    pl.pkmEvoSkipLevel = -1;
    pl.pkmEvoHistory = [];
  }
  function onCast(pl, m) {
    if (!m || pl.remote) return;
    pl.pkmEvoCasts = (pl.pkmEvoCasts || 0) + 1;
    pl.pkmEvoByMove = pl.pkmEvoByMove || {};
    pl.pkmEvoByType = pl.pkmEvoByType || {};
    pl.pkmEvoByMove[m.id] = (pl.pkmEvoByMove[m.id] || 0) + 1;
    pl.pkmEvoByType[m.type] = (pl.pkmEvoByType[m.type] || 0) + 1;
  }
  function onHurt(pl, d) { if (!pl.remote) pl.pkmEvoDamage = (pl.pkmEvoDamage || 0) + Math.max(0, d); }
  function tick(pl, t) {
    if (!pl || pl.dead) return;
    const x = pl.x, y = pl.y;
    if (Number.isFinite(pl.pkmEvoLastX) && Number.isFinite(pl.pkmEvoLastY)) {
      const dist = Math.hypot(x - pl.pkmEvoLastX, y - pl.pkmEvoLastY);
      if (dist < 80) pl.pkmEvoSteps += dist / 24;
    }
    pl.pkmEvoLastX = x; pl.pkmEvoLastY = y;
    if (pl.bosses > pl.pkmEvoBossSeen) {
      const n = pl.bosses - pl.pkmEvoBossSeen;
      pl.pkmEvoShards += n;
      G.Spawner.say('PKMSVV: +' + n + ' Mảnh Tiến Hóa! Mở khóa đá và trao đổi.', 3, true);
    }
    pl.pkmEvoBossSeen = pl.bosses;
  }
  function friendship(pl, t) {
    return Math.min(255, Math.floor(70 + (pl.level - 1) * 5 + t / 8));
  }
  function isItemEvolution(r) {
    return r.trigger === '2' || r.trigger === '3' || !!r.item || !!r.held;
  }
  function requirement(r) {
    const a = [];
    if (r.level) a.push('Lv. ' + r.level);
    if (r.item) a.push('đá/vật phẩm ' + nice(r.item) + ' (1 Mảnh)');
    if (r.trigger === '2') a.push('Dây Liên Kết (1 Mảnh)');
    if (r.held) a.push('vật phẩm ' + nice(r.held) + ' (1 Mảnh)');
    if (r.friendship) a.push('Thân thiết ' + r.friendship);
    if (r.beauty || r.affection) a.push('gắn bó đặc biệt');
    if (r.time) a.push(r.time === 'night' ? 'ban đêm' : r.time === 'day' ? 'ban ngày' : r.time);
    if (r.knownType) a.push('học chiêu hệ ' + nice(r.knownType));
    if (r.knownMove) a.push('học ' + nice(r.knownMove) + ' / 20 đòn thay thế');
    if (r.usedMove) a.push('dùng ' + nice(r.usedMove) + ' ' + (r.moveCount || 20) + ' lần / đòn thay thế');
    if (r.steps) a.push('di chuyển ' + r.steps + ' bước');
    if (r.damage) a.push('chịu ' + r.damage + ' sát thương');
    if (r.location) a.push('địa hình ' + BIOMES[locationBiome(r)] + ' (quy đổi)');
    if (r.rock) a.push('Hang pha lê');
    if (r.rain) a.push('đang mưa');
    if (r.flip) a.push('đảo chiều PC');
    if (r.multiplayer) a.push('thắng ít nhất 1 boss (thay multiplayer)');
    if (r.trigger === '15') a.push('thắng 3 boss (thay thử thách Kingambit)');
    if (r.candy) a.push('thắng 4 boss (thay ' + r.candy + ' Kẹo Meltan)');
    if (r.coins) a.push('tiêu ' + r.coins + ' Pokécoins (thay xu Gimmighoul)');
    if (r.party || r.partyType || r.tradeSpecies) a.push('thắng boss (thay đồng đội)');
    if (r.expression || r.nature || r.gender || r.stat != null) a.push('chọn nhánh/biến thể (quy đổi)');
    if (r.trigger === '5') a.push('xoay tại chỗ (quy đổi)');
    if (!a.length) a.push('thử thách đặc biệt: thắng 1 boss');
    return a.join(' · ');
  }
  function eligible(pl, t, r) {
    if (!pl || !r || pl.dex !== r.from || !G.DEX_BY[r.to] || !G.SPRITE_META[r.to] || r.special === 'shedinja') return false;
    if (r.level && pl.level < r.level) return false;
    if (isItemEvolution(r) && (pl.pkmEvoShards || 0) < 1) return false;
    if (r.friendship && friendship(pl, t) < r.friendship) return false;
    if ((r.beauty || r.affection) && friendship(pl, t) < 185) return false;
    if (r.time && r.time !== daytime(t) && !(r.time === 'dusk' && Math.floor(t) % DAY_SPAN < 30 && daytime(t) === 'night')) return false;
    if (r.knownType && !pl.moves.some(m => m.type === r.knownType)) return false;
    if (r.knownMove && !(pl.hasMove && pl.hasMove(r.knownMove)) && (pl.pkmEvoCasts || 0) < 20) return false;
    if (r.usedMove) {
      const actual = G.Moves.BY_ID[r.usedMove];
      const count = actual ? ((pl.pkmEvoByMove || {})[r.usedMove] || 0) : (pl.pkmEvoCasts || 0);
      if (count < (r.moveCount || 20)) return false;
    }
    if (r.steps && (pl.pkmEvoSteps || 0) < r.steps) return false;
    if (r.damage && (pl.pkmEvoDamage || 0) < r.damage) return false;
    if (r.rain && (!G.Weather.current || G.Weather.current.kind !== 'rain')) return false;
    if (r.rock && G.World.biome % 3 !== 1) return false;
    if (r.location && G.World.biome % 3 !== locationBiome(r)) return false;
    if (r.multiplayer && (pl.bosses || 0) < 1) return false;
    if (r.trigger === '15' && (pl.bosses || 0) < 3) return false;
    if (r.candy && (pl.bosses || 0) < 4) return false;
    if (r.coins && (!G.DB || !G.DB.save || (G.DB.save.coins || 0) < r.coins)) return false;
    if ((r.party || r.partyType || r.tradeSpecies) && (pl.bosses || 0) < 1) return false;
    if (r.trigger === '5' && (pl.bosses || 0) < 1) return false;
    if (!r.level && !isItemEvolution(r) && !r.friendship && !r.beauty && !r.affection &&
        !r.knownMove && !r.knownType && !r.usedMove && !r.steps && !r.damage &&
        !r.rain && !r.rock && !r.location && !r.multiplayer && !r.party &&
        !r.partyType && !r.tradeSpecies && !r.candy && !r.coins && r.trigger !== '5' && (pl.bosses || 0) < 1) return false;
    return true;
  }
  function evolve(pl, r) {
    if (!pl || !r || pl.dex !== r.from || !G.DEX_BY[r.to] || !G.SPRITE_META[r.to]) return false;
    const before = pl.mon, after = G.DEX_BY[r.to];
    if (isItemEvolution(r)) {
      if (!pl.pkmEvoShards) return false;
      pl.pkmEvoShards--;
    }
    if (r.coins) {
      if (!G.DB || !G.DB.save || G.DB.save.coins < r.coins) return false;
      G.DB.save.coins -= r.coins;
      G.DB.commit();
    }
    const fraction = pl.maxHp > 0 ? pl.hp / pl.maxHp : 1;
    pl.mon = after; pl.dex = after.dex;
    pl.baseAtk = after.atk; pl.baseSpd = after.spd;
    pl.maxHp = Math.max(1, Math.round(pl.maxHp + (after.hp - before.hp) * HP_FACTOR));
    pl.hp = Math.max(1, Math.min(pl.maxHp, fraction * pl.maxHp));
    pl.scale = G.Sprites.playerScale(after.dex);
    pl.r = G.Sprites.playerRadius(after.dex);
    pl.bodyH = G.Sprites.bodyHeight(after.dex, pl.scale);
    const dir = pl.anim.dir;
    pl.anim = new G.Sprites.Animator(after.dex, pl.scale, pl.shiny && G.Sprites.hasShiny(after.dex));
    pl.anim.dir = dir;
    pl.shiny = pl.shiny && G.Sprites.hasShiny(after.dex);
    pl.pkmEvoHistory.push({ from: r.from, to: r.to, at: pl.level });
    pl.pkmEvoSkipLevel = -1;
    G.Sprites.preload([after.dex], 8000, pl.shiny);
    G.FX.ring(pl.x, pl.y, 8, 130, '#ffe082', 0.9, 6);
    G.FX.burst(pl.x, pl.y - pl.bodyH / 2, '#e1b9ff', 44, 270);
    G.Audio.sfx('legend');
    G.Spawner.say('PKMSVV: ' + before.name + ' tiến hóa thành ' + after.name + '!', 4, true);
    return true;
  }
  function show(pl, routes, done) {
    const modal = document.createElement('div');
    modal.className = 'pkmsvv-evo';
    const panel = document.createElement('div');
    panel.className = 'pkmsvv-evo-panel';
    modal.appendChild(panel);
    const head = document.createElement('h2');
    head.textContent = '✨ TIẾN HÓA POKÉMON';
    const sub = document.createElement('p');
    sub.textContent = S(pl.dex) + ' · Lv. ' + pl.level + ' · ' + (pl.pkmEvoShards || 0) + ' Mảnh Tiến Hóa';
    panel.appendChild(head); panel.appendChild(sub);
    const hint = document.createElement('p');
    hint.textContent = 'Chọn dạng tiến hóa. Các chiêu thức, cấp và nâng cấp trận này được giữ lại.';
    panel.appendChild(hint);
    function exit() { modal.remove(); done(); }
    for (const r of routes) {
      const b = document.createElement('button');
      b.className = 'pkmsvv-evo-option';
      b.textContent = S(pl.dex) + ' → ' + S(r.to) + ' · ' + requirement(r);
      b.addEventListener('click', () => { if (evolve(pl, r)) exit(); });
      panel.appendChild(b);
    }
    const skip = document.createElement('button');
    skip.className = 'pkmsvv-evo-skip';
    skip.textContent = 'Giữ nguyên dạng hiện tại (hỏi lại ở cấp sau)';
    skip.addEventListener('click', () => { pl.pkmEvoSkipLevel = pl.level; exit(); });
    panel.appendChild(skip);
    document.body.appendChild(modal);
  }
  function tryOpen(pl, t, done) {
    if (!pl || pl.dead || pl.pkmEvoSkipLevel === pl.level) return false;
    const options = (BY_FROM.get(pl.dex) || []).filter(r => eligible(pl, t, r));
    if (!options.length) return false;
    show(pl, options, done);
    return true;
  }
  return { reset, tick, onCast, onHurt, eligible, evolve, requirement, friendship, tryOpen, routes: BY_FROM };
})();
