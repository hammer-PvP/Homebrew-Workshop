import {ID,FOLDER_NAME,PACKS,copy} from "./core.mjs";
export class Packs {
  static get(key) {const def=PACKS[key];return def?game.packs.get(`world.${def[0]}`):null;}
  static async ensure() {
    if(!game.user?.isGM)return;
    let folder=game.folders?.find(f=>f.type==="Compendium" && f.name===FOLDER_NAME);
    if(!folder)folder=await Folder.create({name:FOLDER_NAME,type:"Compendium",color:"#5e4c3b"});
    for(const [key,[name,label,type]] of Object.entries(PACKS)) {
      let pack=game.packs.get(`world.${name}`);
      if(!pack){try{pack=await foundry.documents.collections.CompendiumCollection.createCompendium({name,label,type,package:"world",...(type==="Item"?{system:"dnd5e"}:{})});}
        catch(error){console.warn(`${ID} | Could not create pack ${key}`,error);continue;}}
      if(pack?.folder?.id!==folder?.id && folder){try{await pack.setFolder(folder);}catch(error){console.warn(`${ID} | Could not group pack ${name}`,error);}}
    }
  }
  static async published() {
    const rows=[];
    for(const [key,type] of [["classes","class"],["subclasses","subclass"]]){
      const pack=this.get(key);if(!pack)continue;
      const index=await pack.getIndex({fields:["type","img"]});
      for(const entry of index)if(entry.type===type)rows.push({uuid:pack.getUuid(entry._id),name:entry.name,type,img:entry.img||"icons/svg/item-bag.svg",pack:pack.title});
    }
    return rows.sort((a,b)=>a.name.localeCompare(b.name));
  }
  static async publish(project,{asNew=false}={}) {
    if(!game.user?.isGM)throw new Error("Only GM can publish.");
    const pack=this.get(project.type==="class"?"classes":"subclasses");
    if(!pack)throw new Error("Workshop Compendium unavailable.");
    const data=copy(project.data); delete data._id;delete data.folder;delete data.sort;delete data.ownership;delete data._stats;
    data.type=project.type;
    data.flags ??={};data.flags[ID]={projectId:project.id};
    // Validate through D&D5e Item DataModel. No homebrew runtime/advancement flags.
    const normalized=new CONFIG.Item.documentClass(data,{temporary:true}).toObject();
    delete normalized._id;delete normalized.folder;delete normalized.sort;delete normalized.ownership;
    const uuid=(!asNew && project.publishedUuid)?project.publishedUuid:null;
    if(uuid){const original=await fromUuid(uuid);if(!original || original.pack!==pack.collection)throw new Error("Published source was not found in the Workshop pack.");
      await original.update(normalized,{diff:false});return original;}
    return Item.implementation.create(normalized,{pack:pack.collection});
  }
}
