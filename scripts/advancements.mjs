import {rid,copy} from "./core.mjs";
export const ADV_TYPES=[
  {id:"ItemGrant",name:"Class Feature / Granted Item",desc:"Grant a Feature, Feat, Spell, or other Item"},
  {id:"ItemChoice",name:"Feature / Spell Choice",desc:"Choose one or more Items from an allowed pool"},
  {id:"Trait",name:"Proficiencies / Expertise / Weapon Mastery",desc:"Grant traits or let the player choose"},
  {id:"AbilityScoreImprovement",name:"Ability Score Improvement",desc:"ASI / Feat advancement"},
  {id:"ScaleValue",name:"Progression Value / Scaling",desc:"Values, dice, distances, or uses that scale"},
  {id:"ModifyItem",name:"Feature Improvement",desc:"Modify something already granted"},
  {id:"Subclass",name:"Subclass Selection",desc:"Select the subclass"},
  {id:"HitPoints",name:"Hit Points",desc:"Gain class hit points"}
];
export const LABELS=Object.fromEntries(ADV_TYPES.map(v=>[v.id,v.name]));
export function makeAdvancement(type,level){
  const common={_id:rid(),type,level,name:LABELS[type]??type,configuration:{},value:{}};
  switch(type){
    case "ItemGrant":common.configuration={items:[],optional:false,sorting:"m",spell:null};break;
    case "ItemChoice":common.configuration={allowDrops:true,choices:{[String(level)]:{count:1,replacement:false}},pool:[],restriction:{level:"",list:[],school:[],subtype:"",type:""},sorting:"a",spell:null,type:"feat"};break;
    case "Trait":common.configuration={allowReplacements:false,grants:[],choices:[],mode:"default"};break;
    case "AbilityScoreImprovement":common.configuration={cap:2,points:2,fixed:{},locked:[]};break;
    case "ScaleValue":common.configuration={identifier:"progression",type:"number",scale:{[String(level)]:{value:1}}};break;
    case "Subclass":common.configuration={};break;
    case "ModifyItem":common.configuration={};break;
    case "HitPoints":common.configuration={};break;
  }
  return common;
}
export function setPath(target,path,value){
  const keys=path.split(".");let owner=target;for(const key of keys.slice(0,-1)){if(!owner[key] || typeof owner[key]!=="object")owner[key]={};owner=owner[key];}owner[keys.at(-1)]=value;
}
export function advancementJson(raw){return JSON.stringify(copy(raw),null,2);}
