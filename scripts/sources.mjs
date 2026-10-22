import {ID,PACKS} from "./core.mjs";
const KEY="allowedSourcesV1";
export class Sources {
  static register(){game.settings.register(ID,KEY,{scope:"world",config:false,type:Object,default:{initialized:false,packs:[]}});}
  static isOwn(pack){return Object.values(PACKS).some(def=>pack.collection===`world.${def[0]}`);}
  static nameOf(pack){return pack.metadata?.packageName || pack.metadata?.package || pack.collection.split(".")[0] || "world";}
  static groups(){
    const selected=new Set(this.allowed());const map=new Map();
    for(const pack of game.packs.filter(p=>p.documentName==="Item")) {
      if(this.isOwn(pack))continue;
      const id=this.nameOf(pack);if(!map.has(id))map.set(id,[]);
      map.get(id).push({collection:pack.collection,title:pack.title,checked:selected.has(pack.collection)});
    }
    return Array.from(map,([id,packs])=>({id,label:id==="world"?"World Compendiums":game.modules.get(id)?.title|| (id===game.system.id?game.system.title:id),packs:packs.sort((a,b)=>a.title.localeCompare(b.title))})).sort((a,b)=>a.label.localeCompare(b.label));
  }
  static allowed(){const data=game.settings.get(ID,KEY);if(data?.initialized)return data.packs||[];
    return game.packs.filter(p=>p.documentName==="Item"&&!this.isOwn(p)&&(p.collection.startsWith("dnd5e.")|| /SRD|free rules/i.test(p.title))).map(p=>p.collection);
  }
  static async save(packs){await game.settings.set(ID,KEY,{initialized:true,packs:[...new Set(packs)]});}
  static async reset(){await game.settings.set(ID,KEY,{initialized:false,packs:[]});}
  static async search(types,{query=""}={}){
    const search=query.toLocaleLowerCase(game.i18n.lang).trim();const results=[];
    const selected=new Set(this.allowed());
    for(const pack of game.packs.filter(p=>p.documentName==="Item"&&(this.isOwn(p)||selected.has(p.collection)))){
      let index;try{index=await pack.getIndex({fields:["type","img"]});}
      catch(error){console.warn(`${ID} | Unable to index ${pack.collection}`,error);continue;}
      for(const item of index){
        if(!types.includes(item.type)|| (search&&!String(item.name).toLocaleLowerCase(game.i18n.lang).includes(search)))continue;
        results.push({uuid:pack.getUuid(item._id),name:item.name,type:item.type,img:item.img||"icons/svg/item-bag.svg",packTitle:pack.title,collection:pack.collection});
      }
    }
    return results.sort((a,b)=>Number(!a.collection.startsWith("dnd5e."))-Number(!b.collection.startsWith("dnd5e."))||a.name.localeCompare(b.name));
  }
}
