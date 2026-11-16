import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Watch, Plus, Search, ShieldCheck, Trash2, Pencil, LockKeyhole, X, Check, Printer } from "lucide-react";
import { usePersonalCollection, usePersonalCollectionWatch, useCreatePersonalCollectionWatch, useUpdatePersonalCollectionWatch, useDeletePersonalCollectionWatch } from "@/hooks/use-personal-collection";
import { parsePriceInput } from "@/lib/utils";
import { buildPersonalInsuranceReportRows } from "@/lib/personal-insurance-report";
import type { PersonalCollectionInput } from "@shared/personal-collection";
import type { PersonalCollectionWatch } from "@shared/schema";
import "./personal-collection.css";

const euro = (cents?: number | null) => cents == null ? "—" : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
const dateText = (value?: string | null) => value ? new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"short", year:"numeric" }).format(new Date(`${value}T00:00:00`)) : "—";

export default function PersonalCollection() {
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, error, refetch } = usePersonalCollection();
  const watches = useMemo(() => (data ?? []).filter(w => `${w.manufacturer} ${w.model ?? ""} ${w.referenceNumber}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  const totalValue = (data ?? []).reduce((sum, w) => sum + (w.estimatedValue ?? 0), 0);
  return <div className="pc-page">
    <div className="pc-topline"><div><div className="pc-eyebrow">Away from the shop floor</div><h1>Personal collection</h1><p className="pc-intro">A private record of the watches you keep. Separate from stock, sales and every business workflow.</p></div><div className="pc-topline-actions"><Link href="/personal-collection/insurance-report" className="pc-action secondary"><Printer size={16}/> Insurance report</Link><Link href="/personal-collection/new" className="pc-action"><Plus size={17}/> Add a watch</Link></div></div>
    <div className="pc-statline"><div className="pc-stat"><b>{data?.length ?? "—"}</b><span>PERSONAL WATCHES</span></div><div className="pc-stat"><b>{euro(totalValue)}</b><span>ESTIMATED COLLECTION</span></div><div className="pc-stat"><b><ShieldCheck size={17} style={{display:"inline",verticalAlign:"-3px"}}/> Private</b><span>ONLY VISIBLE TO YOU</span></div></div>
    {isLoading ? <div aria-label="Loading collection">{[0,1,2].map(i=><div className="pc-skeleton" key={i}/>)}</div> : isError ? <div className="pc-state"><h2>Your collection is taking a moment</h2><p>{(error as Error)?.message || "We couldn't load these records."}</p><button className="pc-action" onClick={()=>refetch()}>Try again</button></div> : data?.length === 0 ? <div className="pc-empty"><div className="pc-empty-icon"><Watch/></div><h2>Make room for your keepers</h2><p>Your personal collection has its own place here—never counted as store inventory and never sent to a sales channel.</p><Link href="/personal-collection/new" className="pc-action"><Plus size={17}/> Add your first watch</Link></div> : <>
      <div className="pc-tools"><label className="pc-search"><Search aria-hidden="true"/><input className="pc-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a watch by name or reference" aria-label="Search personal collection"/></label></div>
      {watches.length ? <div className="pc-grid">{watches.map(w=><Link key={w.id} href={`/personal-collection/${w.id}`} className="pc-watch-card">
        <div className="pc-card-top"><span className="pc-card-mark"><Watch/></span><span className="pc-badge">{w.conditionGrade === "Not graded" ? w.condition : w.conditionGrade}</span></div>
        <h2>{w.manufacturer}{w.model ? ` ${w.model}` : ""}</h2><p>{w.subModel || `Ref. ${w.referenceNumber}`}{w.year ? ` · ${w.year}` : ""}</p>
        <div className="pc-card-foot"><span>{w.dateBought ? `Bought ${dateText(w.dateBought)}` : "Acquisition date not recorded"}</span><span className="pc-card-value">{w.estimatedValue ? euro(w.estimatedValue) : "View record"} <ArrowRight size={14} style={{display:"inline",verticalAlign:"-2px"}}/></span></div>
      </Link>)}</div> : <div className="pc-empty"><div className="pc-empty-icon"><Search/></div><h2>No watches found</h2><p>Try another manufacturer, model or reference number.</p><button className="pc-action secondary" onClick={()=>setQuery("")}>Clear search</button></div>}
    </>}
  </div>;
}

export function PersonalCollectionInsuranceReportPage() {
  const { data, isLoading, isError, error, refetch } = usePersonalCollection();
  const rows = useMemo(() => buildPersonalInsuranceReportRows(data ?? []), [data]);
  const preparedDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  useEffect(() => {
    document.body.classList.add("pc-insurance-print");
    return () => document.body.classList.remove("pc-insurance-print");
  }, []);

  const reportFields: Array<[keyof typeof rows[number], string]> = [
    ["referenceNumber", "Reference number"],
    ["serialNumber", "Serial number"],
    ["condition", "Condition"],
    ["acquisitionDate", "Date acquired"],
    ["purchaseAmount", "Purchase amount"],
    ["estimatedValue", "Estimated value"],
    ["warrantyCardDate", "Warranty card date"],
    ["warrantyExpiration", "Warranty expiration"],
  ];

  return <div className="pc-page pc-insurance-report">
    <div className="pc-report-toolbar pc-no-print">
      <Link href="/personal-collection" className="pc-back"><ArrowLeft size={16}/> Back to personal collection</Link>
      <button
        type="button"
        className="pc-action"
        onClick={() => window.print()}
        disabled={isLoading || isError || rows.length === 0}
      >
        <Printer size={16}/> Print / Save as PDF
      </button>
    </div>
    <header className="pc-report-header">
      <div className="pc-eyebrow">Private document · Personal collection</div>
      <h1>Insurance inventory report</h1>
      <p className="pc-intro">
        Prepared {preparedDate} from your Personal Collection records only. Missing details are marked “Not recorded”.
        Values are owner-entered estimates, not a professional appraisal.
      </p>
      <p className="pc-report-count">{data?.length ?? 0} {data?.length === 1 ? "watch" : "watches"} included</p>
    </header>

    {isLoading ? (
      <div aria-label="Loading personal collection report"><div className="pc-skeleton"/><div className="pc-skeleton"/></div>
    ) : isError ? (
      <div className="pc-state" role="alert">
        <h2>Your report could not be loaded</h2>
        <p>{(error as Error)?.message || "We couldn't load your personal collection records."}</p>
        <button type="button" className="pc-action" onClick={() => refetch()}>Try again</button>
      </div>
    ) : rows.length === 0 ? (
      <div className="pc-empty">
        <div className="pc-empty-icon"><Watch/></div>
        <h2>No personal watches to include</h2>
        <p>Add a watch to your private collection before preparing an insurance report.</p>
        <Link href="/personal-collection/new" className="pc-action pc-no-print"><Plus size={16}/> Add a watch</Link>
      </div>
    ) : (
      <div className="pc-report-list">
        {rows.map((row, index) => (
          <article className="pc-report-card" key={row.id}>
            <div className="pc-report-card-head">
              <div>
                <div className="pc-eyebrow">Watch {String(index + 1).padStart(2, "0")}</div>
                <h2>{row.identity}</h2>
              </div>
              <ShieldCheck className="pc-report-shield" aria-label="Personal collection record"/>
            </div>
            <dl className="pc-report-fields">
              {reportFields.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{row[key]}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    )}
  </div>;
}

type FormValues = {
 dateBought:string; referenceNumber:string; manufacturer:string; model:string; subModel:string;
 condition:"New"|"Pre-owned"|"Vintage"; conditionGrade:"Not graded"|"Mint"|"Excellent"|"Very Good"|"Good"|"Fair"|"Poor"; year:string; serialNumber:string;
 linkCount:string; bracelet:string; bezel:string; dial:string; box:boolean; boxForWholesale:boolean; papers:boolean;
 warrantyCardDate:string; warrantyExpiration:string; conditionNotes:string; contentsNotes:string; acquisitionPlatform:string; otherPlatform:string;
 tradeIn:boolean; boughtFrom:string; purchasePrice:string; estimatedValue:string; msrp:string;
 notes:string; fees:{label:string;amount:string}[]; technicalDetails:Record<string,string>;
};
const PLATFORM_OPTIONS = ["Chrono24", "eBay", "Auction house", "Boutique", "Dealer"];
const freshForm = ():FormValues=>({dateBought:"",referenceNumber:"",manufacturer:"",model:"",subModel:"",condition:"Pre-owned",conditionGrade:"Not graded",year:"",serialNumber:"",linkCount:"",bracelet:"",bezel:"",dial:"",box:false,boxForWholesale:false,papers:false,warrantyCardDate:"",warrantyExpiration:"",conditionNotes:"",contentsNotes:"",acquisitionPlatform:"",otherPlatform:"",tradeIn:false,boughtFrom:"",purchasePrice:"",estimatedValue:"",msrp:"",notes:"",fees:[],technicalDetails:{}});
function fromWatch(w:PersonalCollectionWatch):FormValues { const knownPlatform=PLATFORM_OPTIONS.includes(w.acquisitionPlatform||""); return { ...freshForm(), dateBought:w.dateBought||"",referenceNumber:w.referenceNumber,manufacturer:w.manufacturer,model:w.model||"",subModel:w.subModel||"",condition:w.condition as FormValues["condition"],conditionGrade:w.conditionGrade as FormValues["conditionGrade"],year:w.year?.toString()||"",serialNumber:w.serialNumber||"",linkCount:w.linkCount||"",bracelet:w.bracelet||"",bezel:w.bezel||"",dial:w.dial||"",box:w.box,boxForWholesale:w.boxForWholesale,papers:w.papers,warrantyCardDate:w.warrantyCardDate||"",warrantyExpiration:w.warrantyExpiration||"",conditionNotes:w.conditionNotes||"",contentsNotes:w.contentsNotes||"",acquisitionPlatform:knownPlatform?w.acquisitionPlatform||"":"Other",otherPlatform:knownPlatform?"":w.acquisitionPlatform||"",tradeIn:w.tradeIn,boughtFrom:w.boughtFrom||"",purchasePrice:w.purchasePrice==null?"":(w.purchasePrice/100).toFixed(2),estimatedValue:w.estimatedValue==null?"":(w.estimatedValue/100).toFixed(2),msrp:w.msrp==null?"":(w.msrp/100).toFixed(2),notes:w.notes||"",fees:(w.intakeFees||[]).map(f=>({label:f.label,amount:(f.amount/100).toFixed(2)})),technicalDetails:w.technicalDetails||{} }; }
const nullable=(s:string)=>s.trim()||null;
function euroInputToCents(value:string):number|null {
 if(!value.trim())return null;
 const cleaned=value.replace(/[€$\s]/g,"");
 if(!/^\d[\d.,]*$/.test(cleaned))throw new Error("Enter a valid non-negative euro amount.");
 const amount=parsePriceInput(value);
 if(!Number.isFinite(amount)||amount<0||amount>20_000_000)throw new Error("Enter an amount between €0 and €20,000,000.");
 return Math.round(amount*100);
}
function toPayload(v:FormValues):PersonalCollectionInput {
 return {
  dateBought:v.dateBought||null,referenceNumber:v.referenceNumber.trim(),manufacturer:v.manufacturer.trim(),model:nullable(v.model),subModel:nullable(v.subModel),
  condition:v.condition,conditionGrade:v.conditionGrade as any,year:v.year?Number(v.year):null,serialNumber:nullable(v.serialNumber),linkCount:nullable(v.linkCount),bracelet:nullable(v.bracelet),bezel:nullable(v.bezel),dial:nullable(v.dial),
  box:v.box,boxForWholesale:v.boxForWholesale,papers:v.papers,warrantyCardDate:v.warrantyCardDate||null,warrantyExpiration:v.warrantyExpiration||null,
  conditionNotes:nullable(v.conditionNotes),contentsNotes:nullable(v.contentsNotes),acquisitionPlatform:nullable(v.acquisitionPlatform==="Other"?v.otherPlatform:v.acquisitionPlatform),tradeIn:v.tradeIn,boughtFrom:nullable(v.boughtFrom),
  purchasePrice:euroInputToCents(v.purchasePrice),estimatedValue:euroInputToCents(v.estimatedValue),msrp:euroInputToCents(v.msrp),intakeFees:v.fees.filter(f=>f.label.trim()).map(f=>({label:f.label.trim(),amount:euroInputToCents(f.amount) ?? 0})),
  notes:nullable(v.notes),technicalDetails:Object.fromEntries(Object.entries(v.technicalDetails).filter(([k,val])=>k.trim()&&val.trim()))
 };
}

function Field({label,children,full=false,hint,required=false}:{label:string;children:React.ReactNode;full?:boolean;hint?:string;required?:boolean}) { return <div className={`pc-field${full?" full":""}`}><label>{label}{required&&<span className="pc-required"> *</span>}{children}</label>{hint&&<small>{hint}</small>}</div>; }
export function PersonalCollectionFormPage({edit=false}:{edit?:boolean}) {
 const params=useParams<{id:string}>(); const id=Number(params.id);
 const detail=usePersonalCollectionWatch(id); const create=useCreatePersonalCollectionWatch(); const update=useUpdatePersonalCollectionWatch(id);
 const [,setLocation]=useLocation(); const [values,setValues]=useState<FormValues>(freshForm); const [initId,setInitId]=useState<number|null>(null); const [validation,setValidation]=useState(""); const [expanded,setExpanded]=useState(false);
 useEffect(()=>{if(edit && detail.data && initId!==id){setValues(fromWatch(detail.data));setInitId(id);}},[edit,detail.data,id,initId]);
 const loading=edit&&detail.isLoading;
 const busy=create.isPending||update.isPending;
 const set=(key:keyof FormValues,value:any)=>setValues(v=>({...v,[key]:value}));
 const input=(key:keyof FormValues,props:React.InputHTMLAttributes<HTMLInputElement>={})=><input {...props} type={["dateBought","warrantyCardDate","warrantyExpiration"].includes(key)?"date":"text"} className="pc-input" value={values[key] as string} onChange={e=>set(key,e.target.value)}/>;
 const field=(key:keyof FormValues,label:string,placeholder="",extra?:{hint?:string;required?:boolean})=><Field label={label} {...extra}>{input(key,{placeholder})}</Field>;
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setValidation("");if(!values.referenceNumber.trim()||!values.manufacturer.trim()){setValidation("Reference number and manufacturer are required.");return;} if(values.year&&(!/^\d{4}$/.test(values.year)||Number(values.year)<1500||Number(values.year)>2200)){setValidation("Enter a year between 1500 and 2200.");return;} if(values.fees.some(f=>Boolean(f.label.trim())!==Boolean(f.amount.trim()))){setValidation("Complete or remove each itemized fee.");return;} try {const payload=toPayload(values);const saved=edit?await update.mutateAsync(payload):await create.mutateAsync(payload);setLocation(`/personal-collection/${saved.id}`);}catch(err){setValidation(err instanceof Error?err.message:"Your watch could not be saved. Please try again.");}};
 if(loading)return <div className="pc-page pc-form-shell"><div className="pc-skeleton"/><div className="pc-skeleton"/></div>;
 if(edit && (detail.isError||detail.data===null))return <div className="pc-page pc-state"><h2>Watch not found</h2><p>This personal record may have been removed.</p><Link className="pc-action" href="/personal-collection">Back to collection</Link></div>;
 return <div className="pc-page pc-form-shell">
  <Link href={edit?`/personal-collection/${id}`:"/personal-collection"} className="pc-back"><ArrowLeft size={16}/> {edit?"Back to watch":"Personal collection"}</Link>
  <div className="pc-form-head"><div><div className="pc-eyebrow">{edit?"Personal record":"A watch you keep"}</div><h1>{edit?"Edit watch":"Add to your collection"}</h1><p className="pc-intro">This record is private to you. It will never be counted as store stock or used in a sales workflow.</p></div><div className="pc-private-note"><LockKeyhole/> Private personal record</div></div>
  <form onSubmit={submit} noValidate>
   <section className="pc-form-section"><h2>Identity &amp; details</h2><div className="pc-fields">
    {field("dateBought","Date acquired")} {field("referenceNumber","Reference number","e.g. 126610LN",{required:true})}{field("manufacturer","Manufacturer","e.g. Rolex",{required:true})}{field("model","Model","e.g. Submariner")}{field("subModel","Sub-model","e.g. Date")}
    <Field label="Condition"><select className="pc-select" value={values.condition} onChange={e=>set("condition",e.target.value)}>{["New","Pre-owned","Vintage"].map(x=><option key={x}>{x}</option>)}</select></Field>
    <Field label="Condition grade"><select className="pc-select" value={values.conditionGrade} onChange={e=>set("conditionGrade",e.target.value)}>{["Not graded","Mint","Excellent","Very Good","Good","Fair","Poor"].map(x=><option key={x}>{x}</option>)}</select></Field>
    {field("year","Year","e.g. 2021")}{field("serialNumber","Serial number","")}{field("linkCount","Link count","e.g. 11 or 11.5")}{field("bracelet","Bracelet","e.g. Oyster, Jubilee, leather")}{field("bezel","Bezel","e.g. Fluted, ceramic")}{field("dial","Dial","e.g. Silver sunburst")}
    <div className="pc-field full"><div className="pc-checks">{(["box","boxForWholesale","papers"] as const).map(k=><label key={k} className="pc-check"><input type="checkbox" checked={values[k]} onChange={e=>set(k,e.target.checked)}/>{k==="boxForWholesale"?"Box for wholesale":k==="box"?"Box":"Papers"}</label>)}</div></div>
    {field("warrantyCardDate","Warranty card date")}{field("warrantyExpiration","Warranty expiration")}
    <Field label="Condition notes" full hint="Private reference only."><textarea className="pc-textarea" rows={3} value={values.conditionNotes} onChange={e=>set("conditionNotes",e.target.value)} placeholder="Describe wear, service or finish"/></Field>
    <Field label="Contents notes" full><textarea className="pc-textarea" rows={3} value={values.contentsNotes} onChange={e=>set("contentsNotes",e.target.value)} placeholder="What came with the watch"/></Field>
   </div></section>
   <section className="pc-form-section"><h2>Acquisition</h2><div className="pc-fields">
    <Field label="Platform"><select className="pc-select" value={values.acquisitionPlatform} onChange={e=>set("acquisitionPlatform",e.target.value)}><option value="">— None —</option>{PLATFORM_OPTIONS.map(x=><option key={x}>{x}</option>)}<option value="Other">Other</option></select></Field>
    {values.acquisitionPlatform==="Other"&&<Field label="Other platform"><input className="pc-input" value={values.otherPlatform} onChange={e=>set("otherPlatform",e.target.value)} placeholder="Enter the platform"/></Field>}
    <Field label="Bought from"><input className="pc-input" value={values.boughtFrom} onChange={e=>set("boughtFrom",e.target.value)} placeholder="Dealer, auction house or private seller"/></Field>
    <div className="pc-field full"><label className="pc-check"><input type="checkbox" checked={values.tradeIn} onChange={e=>set("tradeIn",e.target.checked)}/> Acquired as a trade-in</label></div>
   </div></section>
   <section className="pc-form-section"><h2>Personal valuation</h2><div className="pc-fields">{(["purchasePrice","estimatedValue","msrp"] as const).map((k,i)=><Field key={k} label={["What you paid","Estimated value","MSRP"][i]} hint="EUR"><input inputMode="decimal" className="pc-input" value={values[k]} onChange={e=>set(k,e.target.value)} placeholder="0,00"/></Field>)}</div>
    <div style={{marginTop:20}}><b style={{fontSize:13}}>Intake fees</b>{values.fees.map((fee,i)=><div className="pc-fee-row" key={i}><input aria-label="Fee label" className="pc-input" value={fee.label} placeholder="Fee label" onChange={e=>set("fees",values.fees.map((f,j)=>j===i?{...f,label:e.target.value}:f))}/><input aria-label="Fee amount in euros" inputMode="decimal" className="pc-input" value={fee.amount} placeholder="0,00" onChange={e=>set("fees",values.fees.map((f,j)=>j===i?{...f,amount:e.target.value}:f))}/><button type="button" aria-label="Remove fee" onClick={()=>set("fees",values.fees.filter((_,j)=>j!==i))}><X size={16}/></button></div>)}<button type="button" className="pc-add-fee" onClick={()=>set("fees",[...values.fees,{label:"",amount:""}])}><Plus size={14} style={{verticalAlign:"-3px"}}/> Add a fee</button></div>
   </section>
   <section className="pc-form-section"><h2>Private notes</h2><div className="pc-private-note" style={{marginBottom:10}}><LockKeyhole/> Private — visible only to you</div><textarea className="pc-textarea" rows={4} value={values.notes} onChange={e=>set("notes",e.target.value)} placeholder="Sourcing details, inspection notes or personal context."/></section>
   <section className="pc-form-section"><button type="button" className="pc-add-fee" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"−":"＋"} Technical details</button>{expanded&&<div className="pc-fields" style={{marginTop:17}}>{["Movement","Caliber","Case material","Case diameter","Water resistance","Power reserve","Crystal","Lug width","Other specification"].map(key=><Field key={key} label={key}><input className="pc-input" value={values.technicalDetails[key]||""} onChange={e=>set("technicalDetails",{...values.technicalDetails,[key]:e.target.value})}/></Field>)}</div>}</section>
   {validation&&<div className="pc-error" role="alert">{validation}</div>}
   {(create.isSuccess||update.isSuccess)&&<div className="pc-success" role="status">Saved. Opening your watch record…</div>}
   <div className="pc-form-footer"><span className="pc-private-note"><LockKeyhole/> This record stays outside business inventory.</span><div><Link className="pc-action secondary" href={edit?`/personal-collection/${id}`:"/personal-collection"}>Cancel</Link><button disabled={busy} className="pc-action" type="submit">{busy?"Saving…":edit?"Save changes":"Save watch"} <Check size={16}/></button></div></div>
  </form>
 </div>;
}

export function PersonalCollectionDetailPage() {
 const params=useParams<{id:string}>(); const id=Number(params.id);
 const {data:watch,isLoading,isError,error,refetch}=usePersonalCollectionWatch(id);
 const remove=useDeletePersonalCollectionWatch(); const [confirm,setConfirm]=useState(false);const [,setLocation]=useLocation(); const [deleteError,setDeleteError]=useState("");
 if(isLoading)return <div className="pc-page">{[0,1].map(i=><div className="pc-skeleton" key={i}/>)}</div>;
 if(isError)return <div className="pc-page pc-state"><h2>Could not open this watch</h2><p>{(error as Error)?.message}</p><button className="pc-action" onClick={()=>refetch()}>Try again</button></div>;
 if(!watch)return <div className="pc-page pc-state"><h2>Watch not found</h2><p>This personal record may have been removed.</p><Link className="pc-action" href="/personal-collection">Back to collection</Link></div>;
 const specs=watch.technicalDetails||{};
 const confirmDelete=async()=>{setDeleteError("");try{await remove.mutateAsync(id);setLocation("/personal-collection");}catch(e){setDeleteError(e instanceof Error?e.message:"Could not delete this watch.");}};
 return <div className="pc-page">
  <Link href="/personal-collection" className="pc-back"><ArrowLeft size={16}/> Your collection</Link>
  <section className="pc-detail-hero"><div className="pc-eyebrow">Personal collection · Ref. {watch.referenceNumber}</div><h1>{watch.manufacturer}{watch.model?` ${watch.model}`:""}</h1><p className="pc-intro">{watch.subModel||"A watch kept for yourself."}</p><div className="pc-detail-actions" style={{marginTop:20}}><Link href={`/personal-collection/${id}/edit`} className="pc-action secondary"><Pencil size={15}/> Edit record</Link><button className="pc-action danger" onClick={()=>setConfirm(true)}><Trash2 size={15}/> Delete</button></div><div className="pc-detail-meta"><span>{watch.year||"Year not recorded"}</span><span>{watch.condition} · {watch.conditionGrade}</span><span>Acquired <strong>{dateText(watch.dateBought)}</strong></span></div></section>
   <div className="pc-detail-grid"><section className="pc-detail-section"><h2>Details</h2><div className="pc-kv">{[
   ["Reference",watch.referenceNumber],["Serial number",watch.serialNumber],["Bracelet",watch.bracelet],["Link count",watch.linkCount],["Bezel",watch.bezel],["Dial",watch.dial],["Box",watch.box?"Included":watch.boxForWholesale?"Wholesale box only":"No"],["Box for wholesale",watch.boxForWholesale?"Yes":"No"],["Papers",watch.papers?"Included":"No"],["Warranty card",dateText(watch.warrantyCardDate)],["Warranty expires",dateText(watch.warrantyExpiration)],["Condition notes",watch.conditionNotes],["Contents",watch.contentsNotes],
  ].filter(([,value])=>value&&value!=="—").map(([key,value])=><div key={key as string}><span>{key}</span><strong>{String(value)}</strong></div>)}</div></section>
   <section className="pc-detail-section"><h2>Personal valuation</h2><div className="pc-kv">{[["Purchase price",euro(watch.purchasePrice)],["Estimated value",euro(watch.estimatedValue)],["MSRP",euro(watch.msrp)],["Acquired from",watch.boughtFrom||"—"],["Platform",watch.acquisitionPlatform||"—"],["Trade-in",watch.tradeIn?"Yes":"No"]].map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>{watch.intakeFees?.length>0&&<div style={{marginTop:20}}><span className="pc-eyebrow">Intake fees</span>{watch.intakeFees.map((f,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #e6ece4",fontSize:13}}><span>{f.label}</span><strong>{euro(f.amount)}</strong></div>)}</div>}</section></div>
   {Object.keys(specs).length>0&&<section className="pc-detail-section" style={{marginTop:14}}><h2>Technical details</h2><div className="pc-kv">{Object.entries(specs).map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div></section>}
   {watch.notes&&<section className="pc-detail-section" style={{marginTop:14}}><h2><LockKeyhole size={15} style={{display:"inline",verticalAlign:"-2px"}}/> Private notes</h2><div className="pc-private-box">{watch.notes}</div></section>}
  {confirm&&<div className="pc-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!remove.isPending)setConfirm(false)}}><section className="pc-modal" role="dialog" aria-modal="true" aria-labelledby="pc-delete-title"><h2 id="pc-delete-title">Remove this personal watch?</h2><p><strong>{watch.manufacturer} {watch.model||""}</strong> will be deleted from your private collection. This does not affect business inventory.</p>{deleteError&&<div role="alert" className="pc-error">{deleteError}</div>}<div className="pc-modal-actions"><button className="pc-action secondary" onClick={()=>setConfirm(false)} disabled={remove.isPending}>Keep watch</button><button className="pc-action danger" onClick={confirmDelete} disabled={remove.isPending}>{remove.isPending?"Deleting…":"Delete watch"}</button></div></section></div>}
 </div>;
}
