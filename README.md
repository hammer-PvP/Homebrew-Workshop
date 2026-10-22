# Homebrew Workshop — v0.0.1 (Architecture Reset)

**Foundry VTT:** 14 only  
**D&D5e:** 6.0.0 through 6.0.999  
**Module ID:** `homebrew-workshop`  
**Repository:** https://github.com/hammer-PvP/Homebrew-Workshop

## What this reset changes

This is a new foundation built around the **complete native Item document** and its native `system.advancement` data rather than the simplified level-specific schema in the v0.0.4 prototype.

The intended workflow is a book-friendly, native-first Workshop: authors assemble original D&D5e content; the system and any compatible Character Builder consume **native** results after publication. This module is **not a gameplay runtime**.

## Available in this first reset build

- GM-only Workshop launcher in the Compendium Directory, and under Configure Settings.
- Content-source settings: enable/disable Compendiums by package/pack; internal Workshop packs always available. Scrollable package lists with fixed header/footer.
- Dashboard showing the full planned content catalog, with **Class** and **Subclass** enabled; other categories are clearly disabled.
- New Class: Blank, Blank with Reference, or Use Existing Class. Source selection is staged until **Apply**.
- Class core: name, auto `hbw-` identifier (manual override), icon picker, Hit Die, Primary Ability with AND/OR, and native spellcasting fields.
- Imported Class/Subclass: stores the native document including **every Advancement without silently dropping unknown fields**, starting equipment, and descriptions. The Native Fields editor can edit full advancement data on this first build.
- Native 1–20 Level browser: shows advancements at their level(s), including multi-level `ItemChoice` and `ScaleValue` milestones; blank classes begin with empty levels except required Hit Points.
- Add native Advancement entries, edit/duplicate/remove, link Feature or Spell UUIDs from active Compendiums, apply to Draft only on confirmation.
- Subclass Draft: Parent Class selection and native subclass progression; no duplicate class chassis fields.
- Published Library: open native compendium documents or reopen into editing Draft; Publish as New or Update Existing.
- Automatically creates/uses **World Compendiums** grouped under Homebrew Workshop: Character Classes, Subclasses, Class Features, Feats, Spells, Spell Lists, Backgrounds, Species and Equipment.

## Intentionally not complete yet

This is an **initial foundation, not a claim of 100% Class conformance**. The following remain for the next steps:

- Book-language guided editing for every advancement field. Native JSON is temporarily offered as an advanced fallback, not the final authoring experience.
- Full Rich Text editor (currently HTML-preserving textarea + preview).
- Full Training choices/proficiency picker, mastery configuration, starting equipment shopping (Character Builder style), resource/ScaleValue configuration, and spell list builder.
- Standalone Feature, Feat, Spell, Background, Species editors and Equipment import.
- Comprehensive round-trip tests against every PHB 2024, Tasha's and Heroes of the Borderlands class in running Foundry.

## Important migration/data safety

The v0.0.4 settings remain untouched. This reset uses a **new World setting key** (`nativeDraftsV1`) rather than transforming or deleting older `draftProjects`. Existing Workshop World Compendiums and documents are retained and reused. Back up your World before testing a new major architecture build. 

Because this is a reset to v0.0.1 with the same module ID, Foundry may warn about the version change from 0.0.4. Review the package manually before replacing it.

## Installation

Extract the contents of `homebrew-workshop.zip` to `Data/modules/homebrew-workshop/` (so `module.json` is directly inside that directory), enable the module in a Foundry 14 D&D5e 6.0.x World, then open the **Compendium Packs** tab.

No code is pushed to GitHub automatically. Assets and references from official/premium publications are **not redistributed** inside this package.
