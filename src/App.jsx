import React, { useEffect, useMemo, useState } from 'react'
import TradingJournal from './TradingJournal'

const STORAGE_KEY = 'tracker-journal-entries'

function todayStr() {
  return new Date().toISOString().slice(0,10)
}

function uid(){ return Date.now().toString(36) }

export default function App(){
  const [entries, setEntries] = useState([])
  const [editing, setEditing] = useState(null)
  const [dark, setDark] = useState(() => true)
  const [viewing, setViewing] = useState(null)
  const [page, setPage] = useState('today')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try{
      const raw = localStorage.getItem(STORAGE_KEY)
      if(raw) setEntries(JSON.parse(raw))
    }catch(e){ console.error(e) }
  }, [])

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(()=>{
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const today = todayStr()
  const todays = useMemo(()=> entries.filter(e=> e.date===today).sort((a,b)=> (a.start||'')> (b.start||'')?1:-1), [entries, today])

  function saveEntry(payload){
    if(payload.id){
      setEntries(prev=> prev.map(p=> p.id===payload.id? payload : p))
    }else{
      payload.id = uid(); payload.createdAt = new Date().toISOString();
      setEntries(prev=> [payload, ...prev])
    }
    setEditing(null)
  }

  function remove(id){ setEntries(prev=> prev.filter(p=> p.id!==id)) }

  const totals = useMemo(()=>{
    const byCat = { Work:0, Health:0, Learning:0, Personal:0 }
    let sum=0
    todays.forEach(e=>{ const d = Number(e.duration)||0; byCat[e.category] = (byCat[e.category]||0)+d; sum+=d })
    return { byCat, sum, count: todays.length }
  }, [todays])

  return (
    <div className="container">
      <div className="flex gap-6">
        <aside className={`${sidebarCollapsed ? 'w-12' : 'w-48'} shrink-0 transition-width`}>
          <div className="flex flex-col gap-2">
            <button onClick={()=> setSidebarCollapsed(s => !s)} className="p-2 rounded bg-slate-100 dark:bg-slate-800">{sidebarCollapsed ? '»' : '«'}</button>
            <nav className="space-y-2">
              <button onClick={()=>setPage('today')} className={`w-full text-left p-2 rounded flex items-center gap-2 ${page==='today'?'bg-emerald-100 dark:bg-emerald-800':''}`}>
                <span className="font-medium">{sidebarCollapsed ? 'T' : 'Today'}</span>
              </button>
              <button onClick={()=>setPage('trading')} className={`w-full text-left p-2 rounded flex items-center gap-2 ${page==='trading'?'bg-emerald-100 dark:bg-emerald-800':''}`}>
                <span className="font-medium">{sidebarCollapsed ? 'J' : 'Trading Journal'}</span>
              </button>
            </nav>
            <div className="mt-4">
              <button onClick={()=>setDark(d=>!d)} className="mt-2 px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded">{dark? 'Dark' : 'Light'}</button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {page==='today' && (
            <>
              <header className="mb-6">
                <h1 className="text-2xl font-semibold">Tracker Journal</h1>
              </header>
              <section className="mb-6">
                <ProgressBar value={Math.min(100, Math.round((totals.sum/480)*100))} />
                <ActivityForm onSave={saveEntry} editing={editing} onCancel={()=>setEditing(null)} />
              </section>

              <section className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium mb-2">Today&apos;s Timeline</h2>
                  <Timeline items={todays} onEdit={setEditing} onDelete={remove} onView={setViewing} />
                </div>
                <div>
                  <h2 className="text-lg font-medium mb-2">Summary</h2>
                  <Analytics totals={totals} />
                </div>
              </section>
            </>
          )}

          {page==='trading' && (
            <TradingJournal />
          )}
        </main>
        {viewing && <DetailsModal item={viewing} onClose={()=> setViewing(null)} />}
      </div>
    </div>
  )
}

function ProgressBar({value=0}){
  return (
    <div className="mb-4">
      <div className="text-sm mb-1">Daily completion: {value}%</div>
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
        <div style={{width: `${value}%`}} className="h-3 bg-emerald-500"></div>
      </div>
    </div>
  )
}

function ActivityForm({onSave, editing, onCancel}){
  const empty = { title:'', category:'Work', start:'', duration:'30', notes:'', date: todayStr() }
  const [state, setState] = useState(empty)

  useEffect(()=>{ if(editing) setState(editing); else setState(empty) }, [editing])

  function change(e){ const {name, value} = e.target; setState(s=> ({...s, [name]: value})) }

  function submit(e){ e.preventDefault(); onSave({...state, date: state.date||todayStr()}) }

  return (
    <form onSubmit={submit} className="p-4 border rounded bg-white dark:bg-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input name="title" value={state.title} onChange={change} placeholder="Activity name" className="p-2 border rounded md:col-span-2" required />
        <select name="category" value={state.category} onChange={change} className="p-2 border rounded">
          <option>Work</option>
          <option>Health</option>
          <option>Learning</option>
          <option>Personal</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input name="start" type="time" value={state.start} onChange={change} className="p-2 border rounded" />
        <input name="duration" type="number" min="1" value={state.duration} onChange={change} className="p-2 border rounded" placeholder="Duration (minutes)" />
        <input name="date" type="date" value={state.date} onChange={change} className="p-2 border rounded" />
      </div>
      <div className="mb-2"><textarea name="notes" value={state.notes} onChange={change} placeholder="Notes" className="w-full p-2 border rounded" /></div>
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1 bg-emerald-500 text-white rounded">{state.id? 'Save' : 'Add'}</button>
        {state.id && <button type="button" onClick={() => onCancel()} className="px-3 py-1 bg-slate-300 dark:bg-slate-700 rounded">Cancel</button>}
      </div>
    </form>
  )
}

function Timeline({items, onEdit, onDelete, onView}){
  if(items.length===0) return <div className="text-sm text-slate-500">No activities logged today.</div>
  return (
    <div className="space-y-2">
      {items.map(it=> (
        <div key={it.id} className="p-3 border rounded bg-white dark:bg-slate-800 flex justify-between items-start">
          <div>
            <div className="font-medium">{it.title} <span className="text-sm text-slate-400">· {it.category}</span></div>
            <div className="text-sm text-slate-500">{it.start || '—'} • {Math.round((Number(it.duration)||0)/60*100)/100} hrs</div>
            {it.notes && <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{it.notes}</div>}
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <button onClick={()=> onView && onView(it)} className="px-2 py-1 bg-sky-500 text-white rounded text-sm">View</button>
            <button onClick={()=> onEdit(it)} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm">Edit</button>
            <button onClick={()=> onDelete(it.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
          </div>
        </div>
      ))}
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
              <h3 className="text-lg font-medium">{item.title} <span className="text-sm text-slate-400">· {item.category}</span></h3>
              <div className="text-sm text-slate-500">{item.start || '—'} • {Math.round((Number(item.duration)||0)/60*100)/100} hrs</div>
            </div>
            <div>
              <button onClick={onClose} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">Close</button>
            </div>
          </div>
          {item.notes && <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">{item.notes}</div>}
        </div>
      </div>

      {fullImage && item.image && (
        <div onClick={()=>setFullImage(false)} className="fixed inset-0 bg-black/90 flex items-center justify-center z-60">
          <img src={item.image} alt="full" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  )
}

function Analytics({totals}){
  return (
    <div className="p-4 border rounded bg-white dark:bg-slate-800">
      <div className="mb-2">Total tracked: <strong>{(totals.sum/60).toFixed(2)} hrs</strong></div>
      <div className="mb-2">Entries: <strong>{totals.count}</strong></div>
      <div>
        {Object.entries(totals.byCat).map(([k,v])=> (
          <div key={k} className="flex justify-between text-sm py-1" >
            <div className="text-slate-600 dark:text-slate-300">{k}</div>
            <div className="font-medium">{(v/60).toFixed(2)} h</div>
          </div>
        ))}
      </div>
    </div>
  )
}
