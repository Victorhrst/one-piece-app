import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const runtime = { window: {} };
vm.runInNewContext(readFileSync(new URL("public/data.js", root), "utf8"), runtime);
vm.runInNewContext(readFileSync(new URL("public/modules/blades.js", root), "utf8"), runtime);
const DATA = runtime.window.GRANDLINE_DATA;
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const state = {progress:0,query:"",rarity:"Toutes",bladeKind:"all",bladeSort:"alpha",bladeFavoritesOnly:false};
const favorites = new Set();
const context = {
  DATA, state, progressArc:() => state.progress === null || state.progress < 0 ? null : DATA.arcs[state.progress],
  escapeHtml, stripMarks:normalize, identityKey:normalize,
  safeCharacterName:name => name === "SECRET_IDENTITY" && state.progress < 30 ? null : name,
  heading:(eyebrow,title,description) => `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>`,
  progressHint:() => "CHOISIR_UN_ARC",
  favoriteButton:(type,key,name) => `<button data-favorite-type="${type}" data-favorite-key="${key}">${escapeHtml(name)}</button>`,
  isFavorite:(type,key) => favorites.has(`${type}:${key}`)
};
const pages = runtime.window.GRANDLINE_PAGE_FACTORIES.blades(context);
runtime.window.GRANDLINE_PAGES = {...pages,collectCharacters:() => []};
const cardKeys = html => Array.from(html.matchAll(/<a class="blade-card-open"[^>]*data-open-blade="([^"]+)"/g), match => match[1]);
const reset = () => Object.assign(state,{query:"",rarity:"Toutes",bladeKind:"all",bladeSort:"alpha",bladeFavoritesOnly:false});

assert.equal(DATA.blades.length, 26);
assert.equal(new Set(DATA.blades.map(pages.bladeKey)).size, DATA.blades.length, "Every blade must have a unique stable route");
for (const blade of DATA.blades) {
  assert.ok(Number.isInteger(blade.firstSeen) && DATA.arcs[blade.firstSeen], `${blade.name}: valid discovery arc`);
  assert.ok(blade.firstChapter <= DATA.arcs[blade.firstSeen].chapterEnd, `${blade.name}: chapter is not ahead of its discovery arc`);
  assert.ok(blade.lore.length && blade.traits.length && blade.ownerHistory.length, `${blade.name}: complete editorial record`);
  assert.ok(blade.source.startsWith("https://onepiece.fandom.com/wiki/"));
  for (const field of ["ownerHistory","lore","traits","smithHistory","statusHistory"]) {
    for (const entry of blade[field]) assert.ok(Number.isInteger(entry.from) && DATA.arcs[entry.from], `${blade.name}: dated ${field}`);
  }
}
assert.equal(DATA.blades.find(b => b.name === "Sandai Kitetsu").grade, "Wazamono");
assert.equal(DATA.blades.find(b => b.name === "Shigure").grade, "Wazamono");

for (let arc = 0; arc < DATA.arcs.length; arc++) {
  reset(); state.progress = arc;
  const unlocked = pages.collectBlades();
  assert.equal(cardKeys(pages.renderBlades()).length, unlocked.length, `All accessible blades render at arc ${arc}`);
  for (const blade of DATA.blades) {
    const html = pages.renderBladeDetail(pages.bladeKey(blade));
    if (blade.firstSeen > arc) {
      assert.ok(html.includes("Fiche indisponible"), `${blade.name}: direct route is locked at ${arc}`);
      assert.ok(!html.includes(blade.name), `${blade.name}: locked route does not disclose its name`);
    } else {
      assert.ok(html.includes("Histoire & moments marquants"));
      assert.ok(html.includes("Porteurs & détenteurs"));
      assert.ok(!html.includes("undefined") && !html.includes("[object Object]"));
    }
  }
  assert.ok(pages.renderBladeDetail("unknown-blade").includes("Fiche indisponible"));
}

// Future facts must not leak through markup, search, rank badges or progression rollback.
const originalBlades = DATA.blades;
const sentinel = {
  name:"Lame de test", kind:"Katana", firstSeen:0, firstChapter:1, gradeKnown:30, grade:"Saijō Ō Wazamono", note:"Une lame connue.",
  ownerHistory:[{from:0,name:"Porteur initial"},{from:30,name:"FUTURE_OWNER",role:"FUTURE_ROLE"}],
  lore:[{from:0,title:"Premier repère",text:"Histoire connue"},{from:30,title:"FUTURE_TITLE",text:"FUTURE_STORY"}],
  traits:[{from:0,label:"Forme",text:"Trait connu"},{from:30,label:"FUTURE_TRAIT",text:"FUTURE_POWER"}],
  smithHistory:[{from:30,name:"FUTURE_SMITH"}], statusHistory:[{from:0,label:"En usage"},{from:30,label:"FUTURE_STATUS"}]
};
DATA.blades = [sentinel];
for (const arc of [0,5,17,29,30,32,0]) {
  reset(); state.progress = arc;
  const html = pages.renderBladeDetail("lame-de-test");
  const revealed = arc >= 30;
  for (const token of ["FUTURE_OWNER","FUTURE_ROLE","FUTURE_TITLE","FUTURE_STORY","FUTURE_TRAIT","FUTURE_POWER","FUTURE_SMITH","FUTURE_STATUS"]) {
    assert.equal(html.includes(token),revealed, `${token}: spoiler boundary at ${arc}`);
  }
  assert.equal(pages.bladeGradeId(sentinel),revealed ? "supreme" : "unknown");
  for (const query of ["FUTURE_OWNER","FUTURE_SMITH","FUTURE_POWER","Saijo"]) assert.equal(pages.bladeMatchesQuery(sentinel,query),revealed, `${query}: safe search at ${arc}`);
}
sentinel.ownerHistory.push({from:0,name:"SECRET_IDENTITY"});
state.progress = 0;
assert.ok(!pages.renderBladeDetail("lame-de-test").includes("SECRET_IDENTITY"));
assert.equal(pages.bladeMatchesQuery(sentinel,"SECRET_IDENTITY"),false);
sentinel.note = '<script>alert("unsafe")</script>';
assert.ok(!pages.bladeCard(sentinel).includes("<script>"), "Editorial text is escaped");
DATA.blades = originalBlades;

reset(); state.progress = 32;
state.query = "zoro";
assert.ok(cardKeys(pages.renderBlades()).length >= 5, "Search includes known former and current owners");
state.query = "kozaburo";
assert.ok(cardKeys(pages.renderBlades()).includes("enma"), "Search includes revealed smiths");
state.progress = 5;
assert.equal(cardKeys(pages.renderBlades()).length,0,"Smith not searchable before reveal");
reset(); state.progress = 32; state.rarity = "Wazamono";
assert.deepEqual(cardKeys(pages.renderBlades()),["sandai-kitetsu","shigure"]);
reset(); state.bladeKind = "Naginata";
assert.deepEqual(cardKeys(pages.renderBlades()),["kessui","murakumogiri"]);
reset(); state.bladeSort = "grade";
const sorted = cardKeys(pages.renderBlades());
assert.ok(sorted.indexOf("yoru") < sorted.indexOf("wado-ichimonji"));
assert.ok(sorted.indexOf("wado-ichimonji") < sorted.indexOf("sandai-kitetsu"));
reset(); state.bladeSort = "discovery";
assert.equal(cardKeys(pages.renderBlades())[0],"wado-ichimonji");
reset(); state.bladeFavoritesOnly = true;
assert.ok(pages.renderBlades().includes("Aucune lame trouvée"));
favorites.add("blade:yoru");
assert.deepEqual(cardKeys(pages.renderBlades()),["yoru"]);
reset(); state.progress = -1;
assert.equal(pages.collectBlades().length,0);
assert.ok(pages.renderBlades().includes("CHOISIR_UN_ARC"));
state.progress = null;
assert.ok(pages.renderBladeDetail("yoru").includes("CHOISIR_UN_ARC"));
state.progress = 5;
assert.ok(!pages.renderCharacterBlades({name:"Roronoa Zoro"}).includes("enma"));
state.progress = 32;
assert.ok(pages.renderCharacterBlades({name:"Roronoa Zoro"}).includes("enma"));
console.log(`Lames : ${DATA.blades.length} fiches vérifiées sur ${DATA.arcs.length} arcs. Routes, recherche, filtres, favoris et frontières anti-spoilers : OK.`);
