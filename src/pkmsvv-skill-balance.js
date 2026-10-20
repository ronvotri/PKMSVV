/* PKMSVV v0.5 — 103 auto-cast moves rebalance, six cycle-based buffs.
 * Never changes names, damage, sprite data, move pool, or evolved attack bonuses.
 * Cooldown tuning runs AFTER game moves definitions and BEFORE a run begins.
 */
G.PKMSVVBalance = (() => {
  const profiles = {
    melee:     {base:1.05,scale:1.10,min:1.40,max:2.55,floor:0.75},
    projectile:{base:1.40,scale:1.35,min:1.82,max:2.65,floor:0.80},
    homing:    {base:1.48,scale:1.35,min:1.90,max:2.80,floor:0.90},
    bounce:    {base:1.75,scale:1.30,min:2.30,max:3.10,floor:1.05},
    cone:      {base:2.00,scale:1.20,min:2.60,max:3.35,floor:1.15},
    beam:      {base:1.95,scale:1.20,min:2.80,max:4.10,floor:1.15},
    nova:      {base:2.50,scale:1.10,min:3.50,max:4.60,floor:1.50},
    boomerang: {base:1.85,scale:1.00,min:2.55,max:3.50,floor:1.05},
    chain:     {base:2.45,scale:0.95,min:3.05,max:3.95,floor:1.30},
    aura:      {base:0.75,scale:1.05,min:1.10,max:1.60,floor:0.55},
    orbit:     {base:0.43,scale:1.00,min:0.66,max:0.85,floor:0.60},
    mine:      {base:3.70,scale:1.05,min:4.60,max:5.90,floor:2.00},
    meteor:    {base:3.95,scale:1.05,min:5.10,max:6.10,floor:2.10},
    turret:    {base:6.90,scale:0.95,min:9.90,max:11.0,floor:4.20},
    trail:     {base:3.55,scale:1.20,min:3.80,max:4.50,floor:1.90},
    dash:      {base:2.85,scale:1.00,min:3.50,max:4.10,floor:1.65},
    charge:    {base:3.60,scale:1.05,min:5.50,max:6.65,floor:2.70},
    spin:      {base:2.05,scale:1.15,min:3.05,max:3.85,floor:1.20},
    quake:     {base:3.25,scale:1.05,min:4.10,max:5.00,floor:1.75},
    vortex:    {base:3.90,scale:1.05,min:6.50,max:7.60,floor:3.40},
    stun:      {base:3.70,scale:1.10,min:5.20,max:6.30,floor:2.00},
    shove:     {base:2.45,scale:1.00,min:3.30,max:4.15,floor:1.30},
    buff:      {base:16,scale:0,min:16,max:16,floor:16}
  };
  const moveDefs = Object.values(G.Moves.BY_ID);
  if (moveDefs.length !== 103 || Object.keys(profiles).length !== 23)
    throw Error('PKMSVV: unexpected upstream move pool; check rebalance before release.');
  const original = {};
  for (const m of moveDefs) {
    const p = profiles[m.kind];
    if (!p || !Number.isFinite(m.cd)) throw Error('PKMSVV: missing cooldown policy for ' + m.id);
    original[m.id] = m.cd;
    const initial = p.base + m.cd * p.scale;
    const volume = m.kind === 'nova' || m.kind === 'cone' ? Math.max(0, (m.count || 1) - 5) * 0.018 : 0;
    m.cd = Math.round(Math.max(p.min, Math.min(p.max, initial + volume)) * 100) / 100;
    if (m.kind === 'buff') {
      m.stacks = 1;
      m.ups = [
        { t:'Duy trì lâu hơn 25%',m:{dur:1.25} },
        { t:'Hiệu lực buff mạnh hơn 20%',m:{amount:1.20} },
        { t:'Duy trì lâu hơn 30%',m:{dur:1.30} },
        { t:'Duy trì vĩnh viễn (không cộng dồn)',m:{} }
      ];
      m.maxLvl = m.ups.length + 1;
    }
  }

  function effectiveCooldown(pl, m) {
    if (m.kind === 'buff') return m.cd; // No global CDR: early buffs must have OFF time.
    return Math.max(profiles[m.kind].floor, m.cd * Math.max(0.01, pl.cdMul));
  }
  function refreshBuff(pl, m) {
    if (m.kind !== 'buff' || m.lvl < m.def.maxLvl) return false;
    const b = pl.buffs && pl.buffs[m.stat];
    if (!b) return false;
    if (b.n === 1 && b.amount === m.amount && b.t === Infinity) return true;
    b.amount = m.amount;
    b.n = 1;
    b.t = Infinity;
    m.t = Infinity;
    return true;
  }
  const audit = () => moveDefs.map(m => ({
    id:m.id,name:m.name,kind:m.kind,originalCd:original[m.id],
    baseCd:m.cd,minEffective:profiles[m.kind].floor,
    duration:m.kind==='buff'?m.dur:null,
    uptime:m.kind==='buff'?Math.round(m.dur/m.cd*100):null,
    maxLvl:m.maxLvl
  }));
  return {profiles,effectiveCooldown,refreshBuff,audit};
})();
