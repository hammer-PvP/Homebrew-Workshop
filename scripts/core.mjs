export const ID = "homebrew-workshop";
export const FOLDER_NAME = "Homebrew Workshop";
export const PACKS = Object.freeze({
  classes:["homebrew-workshop-classes","Character Classes","Item"],
  subclasses:["homebrew-workshop-subclasses","Subclasses","Item"],
  features:["homebrew-workshop-features","Class Features","Item"],
  feats:["homebrew-workshop-feats","Feats","Item"],
  spells:["homebrew-workshop-spells","Spells","Item"],
  spellLists:["homebrew-workshop-spell-lists","Spell Lists","JournalEntry"],
  backgrounds:["homebrew-workshop-backgrounds","Backgrounds","Item"],
  species:["homebrew-workshop-species","Species","Item"],
  equipment:["homebrew-workshop-items","Equipment","Item"]
});
export const TYPES = [
  ["class","Class","shield"],["subclass","Subclass","sitemap"],
  ["feature","Class Feature","bolt"],["feat","Feat","star"],
  ["spell","Spell","wand-magic-sparkles"],["spellList","Spell List","book-open"],
  ["background","Background","scroll"],["species","Species","users"],
  ["equipment","Import Equipment","box"]
];
export const STEPS = {
  class: [["project","Project"],["basics","Class Basics"],["training","Proficiencies"],["equipment","Starting Equipment"],["magic","Spellcasting"],["progression","Progression 1–20"],["review","Review & Publish"]],
  subclass: [["project","Project"],["parent","Parent Class"],["progression","Progression"],["review","Review & Publish"]]
};
export const ABILITIES = [["str","Strength"],["dex","Dexterity"],["con","Constitution"],["int","Intelligence"],["wis","Wisdom"],["cha","Charisma"]];
export function copy(data) { return foundry.utils.deepClone(data); }
export function rid() { return foundry.utils.randomID(); }
export function slug(text) { return String(text ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "untitled"; }
export function homeId(text) { return "hbw-" + slug(text); }
export function esc(text) { return String(text ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]); }
export function advList(data) {
  const raw = data?.system?.advancement ?? [];
  if (Array.isArray(raw)) return copy(raw);
  if (raw?.toObject) {
    const v=raw.toObject(); return Array.isArray(v) ? copy(v) : Object.values(copy(v));
  }
  if (raw && typeof raw === "object") return Object.values(copy(raw));
  return [];
}
export function getLevel(adv) { return Number(adv?.level ?? 0) || 0; }
export function levelMentions(adv, level) {
  if (getLevel(adv) === level) return true;
  if (adv?.type === "ItemChoice" && Object.hasOwn(adv?.configuration?.choices ?? {}, String(level))) return true;
  const scale=adv?.type === "ScaleValue" ? (adv?.configuration?.scale ?? {}) : null;
  return Boolean(scale && Object.hasOwn(scale, String(level)));
}
export function summary(adv,level) {
  const t=adv?.type || "Unknown";
  if (t==="ItemGrant") return `${(adv.configuration?.items ?? []).length} granted item(s)`;
  if (t==="ItemChoice") return `Choose ${adv.configuration?.choices?.[String(level)]?.count ?? "—"}`;
  if (t==="Trait") return `${adv.configuration?.mode || "default"} · ${(adv.configuration?.grants??[]).length} grants, ${(adv.configuration?.choices??[]).length} choices`;
  if (t==="AbilityScoreImprovement") return `${adv.configuration?.points ?? 2} points`;
  if (t==="ScaleValue") return `Progression values`;
  return t;
}

export function writeAdvancements(doc,list){
  const original=doc?.system?.advancement;
  doc.system.advancement=Array.isArray(original)?copy(list):Object.fromEntries(copy(list).map(a=>[a._id||a.id||rid(),a]));
}
