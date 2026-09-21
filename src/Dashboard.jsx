import React, { useMemo } from 'react'

export default function Dashboard({trades=[]}){
  // trades: array of trade objects with rrAchieved (e.g. '2R' or '-1R') or numeric
  const parsed = useMemo(()=> trades.map(t=>{
    let rr = 0
    if(t.rrAchieved && typeof t.rrAchieved === 'string'){
      const m = t.rrAchieved.match(/(-?\d+(?:\.\d+)?)/)
      if(m) rr = Number(m[1])
    }else if(typeof t.rrAchieved === 'number') rr = t.rrAchieved
    const win = rr>0
    const time = t.entryTime || ''
    const day = t.date || ''
    return {...t, rr: rr, win, time, day}
  }), [trades])

  const totals = useMemo(()=>{
    const total = parsed.length
    const wins = parsed.filter(p=>p.win).length
    const avg = total? (parsed.reduce((s,p)=>s+(p.rr||0),0)/total) : 0

    // daywise win rate
    const byDay = {}
    parsed.forEach(p=>{
      if(!byDay[p.day]) byDay[p.day] = {total:0, wins:0}
      byDay[p.day].total +=1
      if(p.win) byDay[p.day].wins +=1
    })

    // time buckets (morning: 05-11, midday: 11-15, afternoon: 15-20, night: else)
    const buckets = {Morning:{total:0,wins:0}, Midday:{total:0,wins:0}, Afternoon:{total:0,wins:0}, Night:{total:0,wins:0}}
    parsed.forEach(p=>{
      const hm = (p.time||'').split(':')
      let h = parseInt(hm[0]||'-1')
      let bucket = 'Night'
      if(h>=5 && h<11) bucket = 'Morning'
      else if(h>=11 && h<15) bucket = 'Midday'
      else if(h>=15 && h<20) bucket = 'Afternoon'
      buckets[bucket].total +=1
      if(p.win) buckets[bucket].wins +=1
    })

    return {total, wins, avg, byDay, buckets}
  }, [parsed])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 border rounded bg-white dark:bg-slate-800">
          <div className="text-sm text-slate-500">Total trades</div>
          <div className="text-2xl font-bold">{totals.total}</div>
        </div>
        <div className="p-4 border rounded bg-white dark:bg-slate-800">
          <div className="text-sm text-slate-500">Win rate</div>
          <div className="text-2xl font-bold">{totals.total? Math.round((totals.wins/totals.total)*100) + '%': '—'}</div>
        </div>
        <div className="p-4 border rounded bg-white dark:bg-slate-800">
          <div className="text-sm text-slate-500">Average R:R</div>
          <div className="text-2xl font-bold">{totals.avg.toFixed(2)}</div>
        </div>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white dark:bg-slate-800">
          <h3 className="font-medium mb-2">Day-wise Win Rate</h3>
          {Object.keys(totals.byDay).length===0 && <div className="text-sm text-slate-500">No data</div>}
          {Object.entries(totals.byDay).map(([day, v])=> (
            <div key={day} className="flex justify-between text-sm py-1">
              <div>{day}</div>
              <div>{v.total? Math.round((v.wins/v.total)*100) + '%' : '—'} ({v.wins}/{v.total})</div>
            </div>
          ))}
        </div>

        <div className="p-4 border rounded bg-white dark:bg-slate-800">
          <h3 className="font-medium mb-2">Time-wise Win Rate</h3>
          {Object.entries(totals.buckets).map(([k,v])=> (
            <div key={k} className="flex justify-between text-sm py-1">
              <div>{k}</div>
              <div>{v.total? Math.round((v.wins/v.total)*100) + '%' : '—'} ({v.wins}/{v.total})</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
