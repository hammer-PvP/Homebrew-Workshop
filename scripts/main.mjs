import {ID} from "./core.mjs";
import {Drafts} from "./drafts.mjs";
import {Sources} from "./sources.mjs";
import {Packs} from "./packs.mjs";
import {WorkshopApp,SourcePickerApp,SourceSettingsApp} from "./ui.mjs";
function buttonCompendium(app,element){
  if(!game.user?.isGM || !element||element.querySelector?.(".hbwn-launch"))return;
  const button=document.createElement("button");button.type="button";button.className="hbwn-launch";
  button.innerHTML='<i class="fa-solid fa-hammer"></i> Homebrew Workshop';
  button.addEventListener("click",event=>{event.preventDefault();WorkshopApp.open();});
  (element.querySelector(".directory-header .header-actions")||element.querySelector(".directory-header")||element).append(button);
}
Hooks.once("init",()=>{
  if(!Handlebars.helpers.eq)Handlebars.registerHelper("eq",(a,b)=>a===b);
  Drafts.register();Sources.register();
  game.settings.registerMenu(ID,"openWorkshop",{name:"Homebrew Workshop",label:"Open Workshop",hint:"Create native D&D5e content",icon:"fa-solid fa-hammer",type:WorkshopApp,restricted:true});
  game.settings.registerMenu(ID,"configureSources",{name:"Homebrew Workshop Sources",label:"Configure Sources",hint:"Allowed external Item Compendiums",icon:"fa-solid fa-sliders",type:SourceSettingsApp,restricted:true});
  Hooks.on("renderCompendiumDirectory",buttonCompendium);
  const api=Object.freeze({open:()=>WorkshopApp.open(),openSources:()=>SourceSettingsApp.open()});
  game.modules.get(ID).api=api;
});
Hooks.once("ready",async()=>{
  if(game.system.id!=="dnd5e")return;
  if(game.user.isGM){try{await Packs.ensure();}catch(error){console.error(`${ID} | pack setup failed`,error);}}
  console.info(`${ID} | Native authoring foundation v0.0.1 ready`);
});
