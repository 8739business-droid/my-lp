// Core Bloom AI Video Marketing Academy — build
// data/*.json + public/template.html -> dist/index.html (single self-contained file)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const D = p => path.join(ROOT, 'data', p);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const weeks = [1, 2, 3, 4, 5, 6].map(n => {
  const f = D(`week${n}.json`);
  if (!fs.existsSync(f)) { console.warn(`!! week${n}.json がありません`); return null; }
  return read(f);
}).filter(Boolean);

const prompts = read(D('prompts.json'));
const resources = read(D('resources.json'));
const meta = read(D('meta.json'));

// ---- per-lesson recommended settings + derived credit estimate ----
const setupFile = D('setup.json');
if (fs.existsSync(setupFile)) {
  const setup = read(setupFile);
  const U = setup.unit, M = setup.models;
  const mdl = k => M[k] || null;
  const vidCost = (key, secs, res) => {
    const m = mdl(key); if (!m || !m.perSec) return 0;
    const r = m.perSec[res || '720'];
    if (r == null) { console.warn(`!! ${key} に解像度 ${res} の単価がありません`); return 0; }
    return secs * r;
  };
  // 全額払った場合と、Unlimited 適用中に実際に減るぶんの2本立てで出す
  const costOf = s => {
    let full = 0, paid = 0;
    const addImg = (key, n) => { const m = mdl(key); if (!m || !n) return;
      const c = n * m.cr; full += c; if (!m.unlimited) paid += c; };
    const addVid = (key, n, secs, res) => { const m = mdl(key); if (!m || !n) return;
      const c = n * vidCost(key, secs, res); full += c; if (!m.unlimited) paid += c; };
    addImg(s.imageModel, s.images);
    addVid(s.videoModel, s.videos, s.videoSeconds || 5, s.videoRes);
    addVid(s.video2Model, s.videos2, s.video2Seconds || 5, s.video2Res);
    const extra = s.extraCredits || 0;   // Studio系はUnlimited対象外なので常に課金
    full += extra; paid += extra;
    return { full, paid };
  };
  weeks.forEach(w => w.lessons.forEach(l => {
    const s = setup.lessons[l.id];
    if (!s) { console.warn(`!! setup.json に ${l.id} がありません`); return; }
    const c = costOf(s);
    const fmt = n => `約 ${n < 10 ? n.toFixed(1) : Math.round(n)} cr（$${(n * U.usdPerCredit).toFixed(2)}）`;
    l.setup = {
      tag: s.tag || '',
      model: s.model,
      seconds: s.seconds,
      res: s.res,
      aspect: s.aspect,
      outputs: s.outputs,
      cap: s.cap,
      credits: c.full > 0 ? fmt(c.full) : 'クレジット消費なし',
      unlimited: c.full > 0 ? (c.paid > 0 ? fmt(c.paid) : '0 cr') : '—',
      save: s.save
    };
    l._gen = { stills: (s.images || 0), videos: (s.videos || 0) + (s.videos2 || 0), credits: c.full, paid: c.paid };
  }));
  // 週次の集計を budget に流し込む（手書きの数字とずれないように計算で出す）
  if (meta.budget) {
    meta.budget.weeks = weeks.map(w => {
      const g = w.lessons.map(l => l._gen || { stills: 0, videos: 0, credits: 0, paid: 0 });
      return {
        week: w.week,
        stills: g.reduce((s, x) => s + x.stills, 0),
        videos: g.reduce((s, x) => s + x.videos, 0),
        credits: Math.round(g.reduce((s, x) => s + x.credits, 0)),
        paid: Math.round(g.reduce((s, x) => s + x.paid, 0)),
        note: (setup.weekNotes && setup.weekNotes[w.week]) || ''
      };
    });
    meta.budget.unitCosts = setup.unitCosts || [];
  }
  weeks.forEach(w => w.lessons.forEach(l => { delete l._gen; }));
}

// ---- validation ----
const errors = [], warns = [];
const resIds = new Set(resources.items.map(r => r.id));
const required = ['id','day','title','subtitle','why','goals','duration','timeBreakdown','tools','prereq',
  'theory','steps','expected','assignment','success','rubric','pitfalls','nextHint'];
let lessonCount = 0;

weeks.forEach(w => {
  if (w.lessons.length !== 5) warns.push(`Week ${w.week}: レッスン数 ${w.lessons.length}（想定5）`);
  w.lessons.forEach(l => {
    lessonCount++;
    const tag = `W${w.week} ${l.id}`;
    required.forEach(k => { if (l[k] == null) errors.push(`${tag}: ${k} がありません`); });
    if (l.id !== `w${w.week}d${l.day}`) warns.push(`${tag}: id と week/day が不一致`);
    (l.resourceIds || []).forEach(r => { if (!resIds.has(r)) errors.push(`${tag}: 未知の resourceId "${r}"`); });
    (l.prompts || []).forEach((p, i) => { if (p.status !== '未検証') warns.push(`${tag}: prompt[${i}] の status が「未検証」でない`); });
    const sum = (l.timeBreakdown || []).reduce((s, t) => s + (+t.min || 0), 0);
    const dur = parseInt(String(l.duration).replace(/[^0-9]/g, ''), 10);
    if (dur && sum && sum !== dur) warns.push(`${tag}: timeBreakdown 合計 ${sum}分 ≠ duration ${dur}分`);
    const axes = (l.rubric || []).map(r => r.axis);
    meta.rubricAxes.forEach(a => { if (!axes.includes(a)) warns.push(`${tag}: ルーブリック軸「${a}」なし`); });
  });
});
prompts.prompts.forEach(p => { if (p.status !== '未検証') warns.push(`prompt ${p.id}: status が「未検証」でない`); });

// cross-link: resources referenced by no lesson
const used = new Set(weeks.flatMap(w => w.lessons.flatMap(l => l.resourceIds || [])));
resources.items.forEach(r => { if (!used.has(r.id)) warns.push(`resource "${r.id}" はどのレッスンからも参照されていません`); });

// ---- industry packs + prompt builder ----
const packs = ['food', 'realestate', 'recruit', 'construction']
  .map(id => { const f = D(`pack-${id}.json`); if (!fs.existsSync(f)) { console.warn(`!! pack-${id}.json がありません`); return null; } return read(f); })
  .filter(Boolean);
const CODES = ['T2I', 'I2I', 'I2V', 'T2V', 'V2V', 'SLOT', 'DOC'];
packs.forEach(p => {
  if (p.prompts.length !== 30) warns.push(`pack ${p.id}: ${p.prompts.length}本（想定30本）`);
  const subs = new Set(p.subcategories.map(s => s.id));
  p.prompts.forEach(q => {
    if (!q.flow || !CODES.includes(q.flow.code)) errors.push(`pack ${p.id} ${q.id}: flow.code が不正`);
    if (!subs.has(q.sub)) errors.push(`pack ${p.id} ${q.id}: 未知の sub "${q.sub}"`);
    if (q.status !== '未検証') warns.push(`pack ${p.id} ${q.id}: status が「未検証」でない`);
    ['title', 'purpose', 'model', 'text', 'effect', 'caution'].forEach(k => { if (!q[k]) errors.push(`pack ${p.id} ${q.id}: ${k} がありません`); });
  });
});
// ---- 「どこで作るか」を各動画プロンプトに付ける（本文からの推定。既定は素のモデル） ----
const surfacesFile = D('surfaces.json');
const surfaces = fs.existsSync(surfacesFile) ? read(surfacesFile) : null;
if (surfaces) {
  meta.surfaces = surfaces;
  const VIDEO = new Set(['I2V', 'T2V', 'V2V']);
  const pick = txt => {
    if (/Ad Multiplier|Ads Studio/i.test(txt)) return { w: 'Ads Studio の Ad Multiplier', n: 'Unlimited 対象外。常にクレジットを消費する' };
    if (/Genjutsu/i.test(txt)) return { w: 'Genjutsu（既存動画の部分編集）', n: '全体を作り直すより安い。Unlimited 対象外' };
    if (/Marketing Studio/i.test(txt)) return { w: 'Marketing Studio（テンプレート）', n: '素のモデルの3〜4倍かかり、Unlimited 対象外。型を借りる必要があるときだけ' };
    if (/Cinema Studio/i.test(txt)) return { w: 'Cinema Studio（ディレクターズパネル）', n: '演出を作り込む最終カット向け。Unlimited 対象外で高い' };
    if (/\bDoP\b/.test(txt)) return { w: 'Higgsfield DoP（プリセットのカメラ動作）', n: '尺は3秒か5秒のみ。単価が非公開なので生成ボタンで確認する' };
    return { w: '生成画面でモデルを選ぶ（image-to-video）', n: '最も安く、Seedance 2.0 系・Kling 3.0・Wan 2.7 なら Unlimited 対象' };
  };
  const tag = list => (list || []).forEach(q => {
    if (!q.flow || !VIDEO.has(q.flow.code) || q.flow.where) return;
    const hit = pick([q.model, q.text, q.note, q.label, q.title].filter(Boolean).join(' '));
    q.flow.where = hit.w; q.flow.whereNote = hit.n;
  });
  weeks.forEach(w => w.lessons.forEach(l => tag(l.prompts)));
  tag(prompts.prompts);
  packs.forEach(p => tag(p.prompts));
}

const builderFile = D('builder.json');
const builder = fs.existsSync(builderFile) ? read(builderFile) : null;
// ビルダーの費用計算にモデル単価を渡す（setup.json と同じ出どころにして食い違いを防ぐ）
const models = fs.existsSync(setupFile) ? read(setupFile).models : {};

// ---- emit ----
const payload = { weeks, prompts, resources, meta, packs, builder, models };
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(payload)
  .replace(/</g, '\\u003c')
  .split(LS).join('\\u2028')
  .split(PS).join('\\u2029');

const tpl = fs.readFileSync(path.join(ROOT, 'public', 'template.html'), 'utf8');
if (!tpl.includes('__DATA__')) { console.error('テンプレートに __DATA__ がありません'); process.exit(1); }
const out = tpl.replace('__DATA__', json);

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), out);

const packCount = packs.reduce((s, p) => s + p.prompts.length, 0);
console.log(`weeks=${weeks.length} lessons=${lessonCount} prompts=${prompts.prompts.length} packs=${packs.length}(${packCount}本) resources=${resources.items.length}`);
console.log(`dist/index.html = ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
if (warns.length) { console.log(`\n[警告 ${warns.length}]`); warns.slice(0, 40).forEach(w => console.log('  - ' + w)); }
if (errors.length) { console.log(`\n[エラー ${errors.length}]`); errors.forEach(e => console.log('  ! ' + e)); process.exit(1); }
console.log('\nOK');
