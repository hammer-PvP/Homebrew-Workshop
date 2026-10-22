import {ID,TYPES,STEPS,ABILITIES,copy,esc,homeId,slug,rid,getLevel,levelMentions,summary,advList,writeAdvancements} from "./core.mjs";
import {Drafts} from "./drafts.mjs";
import {Packs} from "./packs.mjs";
import {Sources} from "./sources.mjs";
import {ADV_TYPES,LABELS,makeAdvancement,setPath,advancementJson} from "./advancements.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
const B=`modules/${ID}/templates/`;
const popupError=(error)=>{console.error(`${ID} |`,error);ui.notifications.error(`Homebrew Workshop: ${error.message??error}`);};
async function confirmAction(message){
  if(foundry.applications.api.DialogV2?.confirm)return foundry.applications.api.DialogV2.confirm({window:{title:"Homebrew Workshop"},content:`<p>${esc(message)}</p>`});
  return Dialog.confirm({title:"Homebrew Workshop",content:`<p>${esc(message)}</p>`});
}
const valueOf=el=>el.type==="checkbox"?el.checked:el.type==="number"?Number(el.value):el.value;

export class SourcePickerApp extends HandlebarsApplicationMixin(ApplicationV2){
  constructor({types=["class"],title="Select source",onApply=()=>{}}={}){super();this.types=types;this.caption=title;this.onApply=onApply;this.query="";this.results=[];this.pending=null;}
  static DEFAULT_OPTIONS={classes:["hbwn","hbwn-picker"],tag:"section",position:{width:760,height:700},window:{title:"Select Compendium Content",resizable:true}};
  static PARTS={main:{template:B+"picker.hbs"}};
  async _prepareContext(){
    const all=await Sources.search(this.types,{query:this.query});this.results=all.slice(0,180);
    return {caption:this.caption,query:this.query,results:this.results,total:all.length,more:all.length>180,pending:this.pending};
  }
  _onRender(context,opts){super._onRender(context,opts);const root=this.element;
    const query=root.querySelector('[name="search"]');query?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();this.query=e.currentTarget.value;void this.render({force:true});}});
    root.querySelector('[data-action="search"]')?.addEventListener("click",()=>{this.query=query.value;void this.render({force:true});});
    root.querySelectorAll('[data-action="choose"]').forEach(el=>el.addEventListener("click",()=>{this.pending=this.results.find(x=>x.uuid===el.dataset.uuid);void this.render({force:true});}));
    root.querySelectorAll('[data-action="view"]').forEach(el=>el.addEventListener("click",async()=>{const doc=await fromUuid(el.dataset.uuid);doc?.sheet?.render({force:true});}));
    root.querySelector('[data-action="apply"]')?.addEventListener("click",async()=>{if(!this.pending)return;try{await this.onApply(this.pending);await this.close();}catch(e){popupError(e);}});
    root.querySelector('[data-action="cancel"]')?.addEventListener("click",()=>this.close());
  }
}
export class SourceSettingsApp extends HandlebarsApplicationMixin(ApplicationV2){
  static open(){const app=new this();void app.render({force:true});return app;}
  static DEFAULT_OPTIONS={classes:["hbwn","hbwn-sources"],tag:"section",position:{width:850,height:760},window:{title:"Homebrew Workshop — Content Sources",resizable:true}};
  static PARTS={main:{template:B+"sources.hbs"}};
  async _prepareContext(){return{groups:Sources.groups()};}
  _onRender(c,o){super._onRender(c,o);const root=this.element;
    root.querySelectorAll('[data-group-select]').forEach(el=>el.addEventListener("change",()=>{
      root.querySelectorAll('[data-group-pack]').forEach(child=>{if(child.dataset.groupPack===el.dataset.groupSelect)child.checked=el.checked;});
    }));
    root.querySelector('[data-action="save"]')?.addEventListener("click",async()=>{
      await Sources.save(Array.from(root.querySelectorAll('[data-group-pack]:checked')).map(x=>x.value));ui.notifications.info("Homebrew Workshop sources saved.");this.close();
    });
    root.querySelector('[data-action="reset"]')?.addEventListener("click",async()=>{await Sources.reset();void this.render({force:true});});
  }
}
export class WorkshopApp extends HandlebarsApplicationMixin(ApplicationV2){
  static #instance=null;
  static async open(){
    let a=this.#instance;if(!a||a._state===-2||a._state===-1){a=new this();this.#instance=a;}
    await a.render({force:true});if(a.element && a.rendered)a.bringToFront();return a;
  }
  constructor(options={}){super(options);this.projectId=null;this.view="home";this.level=1;this.working=null;this.pendingSource=null;this.pendingParent=null;this.busy=false;this.referenceCache=null;}
  static DEFAULT_OPTIONS={id:"homebrew-workshop-new",classes:["hbwn","hbwn-workshop"],tag:"section",position:{width:1280,height:850},window:{title:"Homebrew Workshop",resizable:true}};
  static PARTS={main:{template:B+"workshop.hbs"}};
  async _prepareContext(){
    const projects=Drafts.all().sort((a,b)=>b.updatedAt-a.updatedAt);
    const published=this.view==="published"?await Packs.published():[];
    const project=this.projectId?projects.find(x=>x.id===this.projectId):null;
    const steps=project?(STEPS[project.type]??[]).map(([id,label])=>({id,label,active:project.step===id})):[];
    const advs=project?advList(project.data):[];
    const chosen=advs.map((a,index)=>({...a,index,id:a._id||a.id||String(index),display:a.name||LABELS[a.type]||a.type||"Advancement",typeLabel:LABELS[a.type]||a.type,atLevel:getLevel(a)}));
    const levelItems=project?advs.filter(a=>levelMentions(a,this.level)).map(a=>({id:a._id||a.id,display:a.name||LABELS[a.type]||a.type,typeLabel:LABELS[a.type]||a.type,summary:summary(a,this.level),type:a.type})):[];
    const levelRows=Array.from({length:20},(_,i)=>({level:i+1,active:this.level===i+1,count:advs.filter(a=>levelMentions(a,i+1)).length}));
    let reference=[];
    if(project?.reference?.uuid && project.step==="progression"){
      if(this.referenceCache?.uuid!==project.reference.uuid){
        try{const source=await fromUuid(project.reference.uuid);this.referenceCache={uuid:project.reference.uuid,advancements:advList(source?.toObject()),name:source?.name||project.reference.name};}catch{this.referenceCache=null;}
      }
      reference=(this.referenceCache?.advancements??[]).filter(a=>levelMentions(a,this.level)).map(a=>({label:a.name||LABELS[a.type]||a.type,type:a.type}));
    }
    const doc=project?.data;
    const primary=doc?.system?.primaryAbility??{};
    const spell=doc?.system?.spellcasting??{};
    const magicConfig=Object.entries(CONFIG.DND5E?.spellProgressionTypes??{none:"None",full:"Full",half:"Half",third:"Third",pact:"Pact"})
      .map(([key,label])=>({key,label:typeof label==="string"?game.i18n.localize(label):label?.label||key,selected:spell.progression===key}));
    if(!magicConfig.some(x=>x.key==="none"))magicConfig.unshift({key:"none",label:"None",selected:spell.progression==="none"});
    const modes=[{id:"blank",label:"Blank Class"},{id:"reference",label:"Blank with Reference"},{id:"existing",label:"Use Existing Class"}];
    const newModes=(project?.type==="subclass"?modes.map(m=>({...m,label:m.label.replace("Class","Subclass")})):modes).map(m=>({...m,selected:project?.mode===m.id}));
    const selectedWorking=this.working?advancementJson(this.working):"";
    return {
      view:this.view,projects:projects.map(p=>({id:p.id,name:p.data.name,type:p.type,selected:this.projectId===p.id,mode:p.mode})),published,
      project,hasProject:!!project,steps,levelItems,levelRows,currentLevel:this.level,hasLevelItems:!!levelItems.length,
      reference,hasReference:reference.length>0,referenceName:this.referenceCache?.name??project?.reference?.name,
      abilities:ABILITIES.map(([id,label])=>({id,label,primary:(primary.value??[]).includes(id),spell:spell.ability===id})),
      primaryAll:Boolean(primary.all),hitDice:["d6","d8","d10","d12"].map(v=>({value:v,selected:(doc?.system?.hd?.denomination||"d8")===v})),
      spellProgressions:magicConfig,spell,advancements:chosen,advTypes:ADV_TYPES,newModes,
      pendingSource:this.pendingSource,pendingParent:this.pendingParent,working:this.working,workingJson:selectedWorking,
      workingHasGrant:this.working?.type==="ItemGrant",workingHasChoice:this.working?.type==="ItemChoice",workingIsTrait:this.working?.type==="Trait",
      workingIsAsi:this.working?.type==="AbilityScoreImprovement",workingIsScale:this.working?.type==="ScaleValue",
      workingType:this.working?.type,workingTypeLabel:LABELS[this.working?.type]??this.working?.type,
      workingCount:this.working?.configuration?.choices?.[String(this.level)]?.count??1,workingCountPath:`configuration.choices.${this.level}.count`,
      workingMode:this.working?.configuration?.mode??"default",
      workingGrantCount:this.working?.configuration?.items?.length??0,
      workingChoiceCount:this.working?.configuration?.pool?.length??0,
      startingCount:doc?.system?.startingEquipment?.length??0,trainingCount:advs.filter(a=>a.type==="Trait").length,
      nativeItems:advs.length,hasPublished:Boolean(project?.publishedUuid),displaySource:project?.source?.name||"—",
      advHasUnknown:advs.some(a=>!ADV_TYPES.some(t=>t.id===a.type))
    };
  }
  _onRender(context,options){super._onRender(context,options);const root=this.element;
    root.querySelectorAll('[data-action]').forEach(el=>el.addEventListener("click",e=>{e.preventDefault();void this.#action(el.dataset.action,el.dataset).catch(popupError);}));
    root.querySelectorAll('[data-data-path]').forEach(el=>el.addEventListener("change",e=>{void this.#field(e.currentTarget).catch(popupError);}));
    root.querySelectorAll('[data-array-path]').forEach(el=>el.addEventListener("change",e=>{void this.#field(e.currentTarget,true).catch(popupError);}));
    root.querySelectorAll('[data-working-path]').forEach(el=>el.addEventListener("input",()=>{
      if(!this.working)return;
      const path=el.dataset.workingPath;
      setPath(this.working,path,el.type==="number"?Number(el.value):el.value);
      const raw=root.querySelector('[name="nativeJson"]');if(raw)raw.value=advancementJson(this.working);
    }));
  }
  async #active(){return Drafts.find(this.projectId);}
  async #commit(p,{render=true}={}){await Drafts.save(p);if(render)await this.render({force:true});}
  async #field(el,isArray=false){const p=await this.#active();if(!p)return;
    const path=el.dataset.dataPath||el.dataset.arrayPath;
    if(path==="name"){
      p.data.name=el.value.trim()||"Untitled";
      if(p.autoIdentifier)setPath(p.data,"system.identifier",homeId(p.data.name));
    }else if(path==="identifier"){
      p.autoIdentifier=false;p.data.system.identifier=String(el.value||"").trim();
    }else if(path==="mode"){
      p.mode=el.value;this.pendingSource=null;
    }else if(isArray){
      const selected=Array.from(this.element.querySelectorAll(`[data-array-path="${path}"]:checked`)).map(x=>x.value);
      setPath(p.data,path,selected);
    }else setPath(p.data,path,valueOf(el));
    await this.#commit(p,{render:(["name","mode"].includes(path))});
  }
  async #openPicker({types,title,callback}){
    const app=new SourcePickerApp({types,title,onApply:async value=>{await callback(value);await this.render({force:true});}});await app.render({force:true});
  }
  async #sourceAction(kind){const p=await this.#active();const types=kind==="parent"?["class"]:[p.type];
    await this.#openPicker({types,title:kind==="parent"?"Select Parent Class":kind==="reference"?"Select Reference Class":"Select Existing Source",callback:async selection=>{
      if(kind==="parent")this.pendingParent=selection;else this.pendingSource=selection;
    }});
  }
  async #applySource(){const p=await this.#active();const pending=this.pendingSource;if(!p||!pending)throw new Error("No selected source.");
    const doc=await fromUuid(pending.uuid);if(!doc)throw new Error("Source no longer available.");
    if(p.mode==="reference")await Drafts.fromDocument(p,doc,{asReference:true});
    else if(p.mode==="existing"){
      if(advList(p.data).length>1 || p.data?.name!=="New Class"&&p.data?.name!=="New Subclass"){
        if(!await confirmAction("Apply this source? It replaces the current Draft content."))return;
      }
      await Drafts.fromDocument(p,doc);
    }else throw new Error("Select a source-based mode first.");
    this.pendingSource=null;this.working=null;this.referenceCache=null;await this.render({force:true});
  }
  async #applyParent(){const p=await this.#active();if(!p||!this.pendingParent)return;
    const doc=await fromUuid(this.pendingParent.uuid);if(!doc||doc.type!=="class")throw new Error("Parent Class not found.");
    p.parent={uuid:doc.uuid,name:doc.name,identifier:doc.system.identifier};
    setPath(p.data,"system.classIdentifier",doc.system.identifier);
    this.pendingParent=null;await this.#commit(p);
  }
  async #openIcon(){const p=await this.#active();if(!p)return;
    const picker=new FilePicker({type:"image",current:p.data.img,callback:async path=>{const fresh=await this.#active();fresh.data.img=path;await this.#commit(fresh);}});
    await picker.browse();
  }
  async #action(action,data){
    if(this.busy)return;
    if(action==="create"){
      if(!["class","subclass"].includes(data.type))return;
      const p=await Drafts.create(data.type);this.projectId=p.id;this.view="drafts";this.working=null;await this.render({force:true});return;
    }
    if(action==="show"){this.view=data.view;this.working=null;await this.render({force:true});return;}
    if(action==="sources"){SourceSettingsApp.open();return;}
    if(action==="project"){this.projectId=data.id;this.view="drafts";this.working=null;this.pendingSource=null;this.referenceCache=null;await this.render({force:true});return;}
    if(action==="publishedOpen"||action==="publishedEdit"){
      const doc=await fromUuid(data.uuid);if(!doc)throw new Error("Published document unavailable.");
      if(action==="publishedOpen"){doc.sheet.render({force:true});return;}
      const project=await Drafts.editPublished(doc);this.projectId=project.id;this.view="drafts";this.working=null;await this.render({force:true});return;
    }
    if(action==="delete"){
      if(!await confirmAction("Delete this Draft? Published content will remain unchanged."))return;
      await Drafts.remove(data.id);if(this.projectId===data.id)this.projectId=null;this.working=null;await this.render({force:true});return;
    }
    const p=await this.#active();if(!p)return;
    if(action==="step"){p.step=data.step;await this.#commit(p);return;}
    if(action==="level"){this.level=Number(data.level);this.working=null;await this.render({force:true});return;}
    if(action==="pickSource"){await this.#sourceAction("source");return;}
    if(action==="pickParent"){await this.#sourceAction("parent");return;}
    if(action==="applySource"){await this.#applySource();return;}
    if(action==="applyParent"){await this.#applyParent();return;}
    if(action==="icon"){await this.#openIcon();return;}
    if(action==="identifierAuto"){p.autoIdentifier=true;p.data.system.identifier=homeId(p.data.name);await this.#commit(p);return;}
    if(action==="resetEquipment"){
      if(!await confirmAction("Clear Starting Equipment for this Draft?"))return;
      p.data.system.startingEquipment=[];p.data.system.wealth="";await this.#commit(p);return;
    }
    if(action==="advEdit"){
      this.working=copy(advList(p.data).find(a=>String(a._id||a.id)===data.id));
      if(!this.working)throw new Error("Advancement not found.");await this.render({force:true});return;
    }
    if(action==="advAdd"){
      const type=this.element.querySelector('[name="addType"]')?.value||"ItemGrant";
      this.working=makeAdvancement(type,this.level);await this.render({force:true});return;
    }
    if(action==="advCancel"){this.working=null;await this.render({force:true});return;}
    if(action==="advApply"){
      const raw=this.element.querySelector('[name="nativeJson"]')?.value;
      let updated;try{updated=JSON.parse(raw);}catch(error){throw new Error(`Advancement JSON is invalid: ${error.message}`);}
      if(!updated||typeof updated!=="object"||Array.isArray(updated))throw new Error("Advancement must be an object.");
      if(!updated.type||!updated._id)throw new Error("Advancement requires type and _id.");
      const list=advList(p.data),idx=list.findIndex(x=>String(x._id||x.id)===updated._id);
      if(idx>=0)list[idx]=updated;else list.push(updated);
      writeAdvancements(p.data,list);await this.#commit(p);this.working=null;return;
    }
    if(action==="advDelete"){
      if(!await confirmAction("Remove this Advancement?"))return;
      writeAdvancements(p.data,advList(p.data).filter(a=>String(a._id||a.id)!==data.id));this.working=null;await this.#commit(p);return;
    }
    if(action==="advDuplicate"){
      const value=advList(p.data).find(x=>String(x._id||x.id)===data.id);if(!value)return;
      const next=copy(value);next._id=rid();writeAdvancements(p.data,[...advList(p.data),next]);await this.#commit(p);return;
    }
    if(action==="grantPicker"){
      if(!this.working)return;
      await this.#openPicker({types:["feat","spell","equipment","weapon","consumable","tool"],title:"Select Item to Grant",callback:async result=>{
        this.working.configuration??={};this.working.configuration.items??=[];
        this.working.configuration.items.push({uuid:result.uuid,sort:(this.working.configuration.items.length+1)*100,optional:false});
      }});return;
    }
    if(action==="choicePicker"){
      if(!this.working)return;
      const ty=this.working.configuration?.type==="spell"?["spell"]:["feat"];
      await this.#openPicker({types:ty,title:"Add Choice Option",callback:async result=>{
        this.working.configuration??={};this.working.configuration.pool??=[];
        this.working.configuration.pool.push({uuid:result.uuid,sort:(this.working.configuration.pool.length+1)*100});
      }});return;
    }
    if(action==="publish"){
      if(p.type==="subclass"&&!p.data.system.classIdentifier)throw new Error("A Subclass needs a Parent Class before publishing.");
      const asNew=data.mode==="new";
      if(!await confirmAction(asNew?"Publish as a new document in the Workshop Compendium?":"Update the existing published document?"))return;
      this.busy=true;try{
        const doc=await Packs.publish(p,{asNew});await Drafts.remove(p.id);this.projectId=null;this.working=null;this.view="published";
        ui.notifications.info(`Published ${doc.name} to Homebrew Workshop.`);await this.render({force:true});
      }finally{this.busy=false;}return;
    }
  }
}
