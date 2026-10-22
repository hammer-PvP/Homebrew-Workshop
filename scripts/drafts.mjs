import {ID,copy,rid,homeId,advList} from "./core.mjs";
// New storage key by design: no destructive migration from legacy v0.0.4 drafts.
const KEY = "nativeDraftsV1";
const makeBase=(name,type)=>({
  name, type, img:type==="subclass"?"icons/svg/upgrade.svg":"icons/sundries/books/book-embossed-gold-red.webp",
  system:{identifier:homeId(name),description:{value:"",chat:""},advancement:[],source:{rules:"2024"}}
});
export class Drafts {
  static register() { game.settings.register(ID,KEY,{name:"Workshop native drafts (v1)",scope:"world",config:false,type:Object,default:{projects:[]}}); }
  static all() { return copy(game.settings.get(ID,KEY)?.projects ?? []); }
  static find(id) { return this.all().find(p=>p.id===id)||null; }
  static async setAll(projects) { await game.settings.set(ID,KEY,{projects}); }
  static async save(project) {
    const projects=this.all(); const idx=projects.findIndex(p=>p.id===project.id);
    const value=copy({...project,updatedAt:Date.now()});
    if(idx<0)projects.push(value); else projects[idx]=value;
    await this.setAll(projects);return value;
  }
  static async remove(id){await this.setAll(this.all().filter(p=>p.id!==id));}
  static async create(type) {
    const name=type==="class"?"New Class":"New Subclass";
    const p={id:rid(),type,step:"project",mode:"blank",reference:null,source:null,parent:null,
      data:makeBase(name,type), autoIdentifier:true,publishedUuid:null,createdAt:Date.now(),updatedAt:Date.now()};
    if(type==="class") {
      p.data.system.hd={denomination:"d8",spent:0}; p.data.system.levels=1;
      p.data.system.primaryAbility={value:[],all:false};
      p.data.system.spellcasting={progression:"none",ability:"",preparation:{formula:""}};
      p.data.system.startingEquipment=[];p.data.system.wealth="";
      const id=rid();p.data.system.advancement={[id]:{_id:id,type:"HitPoints",name:"Hit Points",configuration:{},value:{}}};
    }else {p.data.system.classIdentifier="";}
    await this.save(p);return p;
  }
  static async fromDocument(project,document,{asReference=false}={}) {
    if(!document || document.type!==project.type) throw new Error("Source document type does not match this Draft.");
    const next=copy(project);
    if(asReference){next.reference={uuid:document.uuid,name:document.name};return this.save(next);}
    next.data=copy(document.toObject());
    for(const k of ["_id","folder","sort","ownership","_stats"])delete next.data[k];
    next.data.name=project.mode==="editPublished" ? document.name : `${document.name} Homebrew`;
    next.data.system.identifier=homeId(next.data.name);
    next.autoIdentifier=true;next.mode="existing";
    next.source={uuid:document.uuid,name:document.name};
    if(project.type==="subclass")next.parent={identifier:next.data.system.classIdentifier,uuid:null,name:"Inherited parent"};
    return this.save(next);
  }
  static async editPublished(document) {
    const existing=this.all().find(p=>p.publishedUuid===document.uuid);
    if(existing)return existing;
    const p=await this.create(document.type);
    p.mode="editPublished";p.publishedUuid=document.uuid;
    const imported=await this.fromDocument(p,document);
    imported.mode="editPublished";imported.publishedUuid=document.uuid;
    await this.save(imported);return imported;
  }
}
