import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'tracker-journal-trades'

function uid(){ return Date.now().toString(36) }

export default function TradingJournal(){
  const [trades, setTrades] = useState([])
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)

  useEffect(()=>{ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) setTrades(JSON.parse(raw)) }catch(e){} }, [])
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)) }, [trades])

  function save(t){
    if(t.id) setTrades(prev=> prev.map(p=> p.id===t.id? t: p))
    else { t.id = uid(); t.createdAt = new Date().toISOString(); setTrades(prev=> [t, ...prev]) }
    setEditing(null)
  }

  function remove(id){ setTrades(prev=> prev.filter(p=> p.id!==id)) }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Trading Journal</h1>

      <div>
        <TradeForm onSave={save} editing={editing} onCancel={()=>setEditing(null)} />

        <section className="mt-6">
          <h2 className="text-lg font-medium mb-2">Entries</h2>
          <div className="space-y-3">
            {trades.length===0 && <div className="text-sm text-slate-500">No trades yet.</div>}
            {trades.map(t=> (
              <div key={t.id} className="p-3 border rounded bg-white dark:bg-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{t.instrument}</div>
                    <div className="text-sm text-slate-500">{t.date} • {t.entryTime} → {t.exitTime} • Price {t.entryPrice}</div>
                    <div className="mt-2 text-sm">
                      <div>SL: {t.stopLoss} • Target: {t.target} • Lots: {t.lots}</div>
                      <div>R:R Targeted: {t.rrTarget} • Achieved: {t.rrAchieved}</div>
                      <div>Strategy: {t.strategy}</div>
                      <div>Rules: {t.rules}</div>
                      <div>Emotions: {t.emotions}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {t.image && <img src={t.image} alt="trade" className="w-32 h-20 object-cover rounded border" />}
                    <div className="flex gap-2">
                        <button onClick={()=> setViewing(t)} className="px-2 py-1 bg-sky-500 text-white rounded text-sm">View</button>
                      <button onClick={()=> setEditing(t)} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm">Edit</button>
                      <button onClick={()=> remove(t.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {viewing && <DetailsModal item={viewing} onClose={()=> setViewing(null)} />}
    </div>
  )
}

function DetailsModal({item, onClose}){
  if(!item) return null
  const [fullImage, setFullImage] = useState(false)

  useEffect(()=>{
    function onKey(e){ if(e.key==='Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div onClick={e=>e.stopPropagation()} className="bg-white dark:bg-slate-800 p-4 rounded max-w-2xl w-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{item.instrument}</h3>
              <div className="text-sm text-slate-500">{item.date} • {item.entryTime} → {item.exitTime}</div>
            </div>
            <div>
              <button onClick={onClose} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">Close</button>
            </div>
          </div>

          <div className="mt-4 text-sm space-y-2">
            {item.image && (
              <img onClick={()=>setFullImage(true)} src={item.image} alt="trade" className="w-full h-64 object-contain rounded border cursor-zoom-in" />
            )}
            <div>Entry price: {item.entryPrice} • SL: {item.stopLoss} • Target: {item.target} • Lots: {item.lots}</div>
            <div>R:R Targeted: {item.rrTarget} • Achieved: {item.rrAchieved}</div>
            <div>Strategy: {item.strategy}</div>
            <div>Rules: {item.rules}</div>
            <div>Emotions: {item.emotions}</div>
          </div>
        </div>
      </div>

      {fullImage && (
        <div onClick={()=>setFullImage(false)} className="fixed inset-0 bg-black/90 flex items-center justify-center" style={{zIndex: 99999}}>
          <img src={item.image} alt="full" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  )
}


function TradeForm({onSave, editing, onCancel}){
  const today = new Date().toISOString().slice(0,10)
  const empty = {
    instrument: '', date: today, entryTime:'', exitTime:'', entryPrice:'', stopLoss:'', target:'', lots:'', rrTarget:'', rrAchieved:'', howFar:'', strategy:'', rules:'', emotions:'', image: null
  }
  const [state, setState] = useState(empty)

  useEffect(()=>{ if(editing) setState(editing); else setState(empty) }, [editing])

  function change(e){ const {name, value} = e.target; setState(s=> ({...s, [name]: value})) }

  function submit(e){ e.preventDefault(); onSave(state) }

  return (
    <form onSubmit={submit} className="p-4 border rounded bg-white dark:bg-slate-800">
      <div className="grid gap-2">
        <input name="instrument" placeholder="Instrument" value={state.instrument} onChange={change} className="p-2 border rounded" />
        <div className="grid grid-cols-3 gap-2">
          <input name="date" type="date" value={state.date} onChange={change} className="p-2 border rounded" />
          <input name="entryTime" placeholder="Entry time (e.g. 12:50)" value={state.entryTime} onChange={change} className="p-2 border rounded" />
          <input name="exitTime" placeholder="Exit time (e.g. 13:41)" value={state.exitTime} onChange={change} className="p-2 border rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input name="entryPrice" placeholder="Entry price" value={state.entryPrice} onChange={change} className="p-2 border rounded" />
          <input name="stopLoss" placeholder="Stop Loss" value={state.stopLoss} onChange={change} className="p-2 border rounded" />
          <input name="target" placeholder="Target" value={state.target} onChange={change} className="p-2 border rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="lots" placeholder="Lots" value={state.lots} onChange={change} className="p-2 border rounded" />
          <input name="howFar" placeholder="If TP hit, how far" value={state.howFar} onChange={change} className="p-2 border rounded" />
        </div>

        <label className="block">
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">Strategy</div>
          <textarea name="strategy" placeholder="Strategy" value={state.strategy} onChange={change} className="w-full p-2 border rounded h-24" />
        </label>

        <label className="block">
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">Emotions during trade</div>
          <textarea name="emotions" placeholder="Emotions during trade" value={state.emotions} onChange={change} className="w-full p-2 border rounded h-24" />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <input name="rrTarget" placeholder="Risk:Reward targeted (e.g. 1:2)" value={state.rrTarget} onChange={change} className="p-2 border rounded" />
          <input name="rrAchieved" placeholder="Risk:Reward achieved (e.g. 2R)" value={state.rrAchieved} onChange={change} className="p-2 border rounded" />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <input name="rules" placeholder="Rules followed or not" value={state.rules} onChange={change} className="p-2 border rounded" />
        </div>

        <label className="block">
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">Upload trade image (optional)</div>
          <input type="file" accept="image/*" onChange={async (e)=>{
            const f = e.target.files && e.target.files[0];
            if(!f) return;
            const reader = new FileReader();
            reader.onload = () => {
              const data = reader.result;
              setState(s=> ({...s, image: data}))
            };
            reader.readAsDataURL(f);
          }} className="p-1" />
          {state.image && <img src={state.image} alt="preview" className="mt-2 w-48 h-28 object-cover rounded border" />}
        </label>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-emerald-500 text-white rounded">{state.id? 'Save' : 'Add'}</button>
          {state.id && <button type="button" onClick={onCancel} className="px-3 py-1 bg-slate-300 dark:bg-slate-700 rounded">Cancel</button>}
        </div>
      </div>
    </form>
  )
}
