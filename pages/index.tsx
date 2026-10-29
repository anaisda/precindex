import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'

// ── HOOKS ────────────────────────────────────────────────────────────────────

function useIsMobile(bp = 860) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const fn = () => setM(window.innerWidth <= bp)
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return m
}

function useVisible(threshold = 0.12) {
  const [vis, setVis] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, vis }
}

// ── LIGHT-THEME MOLECULAR CANVAS ─────────────────────────────────────────────

function MolecularCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W; canvas.height = H

    type P = { x: number; y: number; vx: number; vy: number; r: number; phase: number; col: string; hub: boolean }

    const COLS = ['rgba(28,62,45,', 'rgba(194,72,43,', 'rgba(58,100,71,', 'rgba(122,158,133,']

    const build = (): P[] => {
      const centers = [[W*.22,H*.38],[W*.7,H*.3],[W*.5,H*.65],[W*.1,H*.62],[W*.85,H*.58]]
      return Array.from({ length: 120 }, (_, i) => {
        const hub = i < 6
        const c = centers[Math.floor(Math.random() * centers.length)]
        return {
          x: c[0] + (Math.random()-.5)*(hub?50:190),
          y: c[1] + (Math.random()-.5)*(hub?50:190),
          vx: (Math.random()-.5)*.22, vy: (Math.random()-.5)*.22,
          r: hub ? Math.random()*3+4 : Math.random()*2+.7,
          phase: Math.random()*Math.PI*2,
          col: hub ? 'rgba(194,72,43,' : COLS[Math.floor(Math.random()*COLS.length)],
          hub,
        }
      })
    }

    let ps = build()
    const start = performance.now()
    let t = 0

    const tick = () => {
      t += .007
      const entry = Math.min(1, (performance.now()-start)/2500)
      ctx.clearRect(0, 0, W, H)
      const mx = mouseRef.current.x; const my = mouseRef.current.y

      for (const p of ps) {
        p.x += p.vx + Math.sin(t*.52+p.phase)*.09
        p.y += p.vy + Math.cos(t*.4+p.phase)*.09
        if (p.x<8) p.vx+=.016; if (p.x>W-8) p.vx-=.016
        if (p.y<8) p.vy+=.016; if (p.y>H-8) p.vy-=.016
        p.vx*=.999; p.vy*=.999
        p.x=Math.max(0,Math.min(W,p.x)); p.y=Math.max(0,Math.min(H,p.y))
        const dx=p.x-mx; const dy=p.y-my
        const d=Math.sqrt(dx*dx+dy*dy)
        if (d<155 && d>1) { const f=(155-d)/155*.65; p.x+=(dx/d)*f; p.y+=(dy/d)*f }
      }

      for (let i=0;i<ps.length;i++) for (let j=i+1;j<ps.length;j++) {
        const a=ps[i]; const b=ps[j]
        const dx=a.x-b.x; const dy=a.y-b.y
        const d=Math.sqrt(dx*dx+dy*dy)
        const maxD=(a.hub||b.hub)?260:88
        if (d<maxD) {
          const alpha=(1-d/maxD)*.22*entry
          const pulse=Math.sin(t*1.3+(a.phase+b.phase)*.5)*.1+.9
          ctx.beginPath()
          ctx.strokeStyle=(a.hub||b.hub)?`rgba(194,72,43,${alpha*pulse*.6})`:`rgba(58,100,71,${alpha*pulse})`
          ctx.lineWidth=(a.hub||b.hub)?.8:.4
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke()
        }
      }

      for (const p of ps) {
        const pulse=Math.sin(t*1.85+p.phase)*.2+.8
        const alpha=entry*(p.hub?.88:.45+pulse*.28)
        if (p.hub) {
          const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*5)
          g.addColorStop(0,`rgba(194,72,43,${.1*entry})`); g.addColorStop(1,'rgba(194,72,43,0)')
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r*5,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
        }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*pulse,0,Math.PI*2)
        ctx.fillStyle=`${p.col}${alpha})`; ctx.fill()
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    const onMove=(e:MouseEvent)=>{ const r=canvas.getBoundingClientRect(); mouseRef.current={x:e.clientX-r.left,y:e.clientY-r.top} }
    const onResize=()=>{ W=canvas.offsetWidth; H=canvas.offsetHeight; canvas.width=W; canvas.height=H; ps=build() }
    window.addEventListener('mousemove',onMove)
    window.addEventListener('resize',onResize)
    return ()=>{ cancelAnimationFrame(rafRef.current); window.removeEventListener('mousemove',onMove); window.removeEventListener('resize',onResize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} aria-hidden="true" />
}

// ── LOGO MARK ────────────────────────────────────────────────────────────────

function LogoMark({ size='1rem', onDark=false }: { size?: string; onDark?: boolean }) {
  const [logoSrc, setLogoSrc] = useState<string|null>(null)
  useEffect(() => {
    const img=new Image(); img.onload=()=>setLogoSrc('/logo.png'); img.onerror=()=>setLogoSrc(''); img.src='/logo.png'
  }, [])
  const textCol = onDark ? '#F7F5EF' : '#151D18'
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:'.35em', lineHeight:1 }}>
      {logoSrc ? (
        <img src={logoSrc} alt="Precision Index" style={{ height:`calc(${size}*1.35)`, display:'block', objectFit:'contain' }} />
      ) : (
        <span style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:size, fontWeight:400, color:textCol, letterSpacing:'.03em' }}>Precision Index</span>
      )}
      <em style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:`calc(${size}*.9)`, fontStyle:'italic', color:'#C2482B', letterSpacing:'.02em', fontWeight:300 }}>Discovery</em>
    </div>
  )
}

// ── NAVBAR ───────────────────────────────────────────────────────────────────

const NAV_ITEMS=[
  {label:'DECODE',href:'#hero'},
  {label:'Science',href:'#science'},
  {label:'Technology',href:'#technology'},
  {label:'Applications',href:'#applications'},
  {label:'About',href:'#about'},
]

function Navbar({ scrolled }: { scrolled: boolean }) {
  const [hov,setHov]=useState<string|null>(null)
  const [open,setOpen]=useState(false)
  const isMobile=useIsMobile()
  const onDark = !scrolled

  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:990,
      padding:isMobile?'1rem 1.4rem':'1.1rem 3.5rem',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      background: scrolled?'rgba(8,6,20,0.92)':'transparent',
      backdropFilter: scrolled?'blur(24px)':'none',
      borderBottom: scrolled?'1px solid rgba(255,255,255,0.07)':'none',
      transition:'all .45s cubic-bezier(.16,1,.3,1)',
    }}>
      <a href="#hero" style={{ textDecoration:'none' }}>
        <LogoMark size={isMobile?'.88rem':'.96rem'} onDark={onDark} />
      </a>

      {!isMobile && (
        <div style={{ display:'flex', alignItems:'center', gap:'.1rem' }}>
          {NAV_ITEMS.map(item=>(
            <a key={item.href} href={item.href}
              style={{ position:'relative', padding:'.45rem .9rem', color: item.label==='DECODE'?(onDark?'#fff':'#151D18'):(onDark?'rgba(255,255,255,0.55)':'rgba(21,29,24,0.5)'), textDecoration:'none', fontSize:'.76rem', fontWeight:item.label==='DECODE'?500:400, letterSpacing:item.label==='DECODE'?'.1em':'.02em', fontFamily:item.label==='DECODE'?'JetBrains Mono,monospace':'inherit', transition:'all .2s ease' }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.color = onDark?'#fff':'#1C3E2D' }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.color = item.label==='DECODE'?(onDark?'#fff':'#151D18'):(onDark?'rgba(255,255,255,0.55)':'rgba(21,29,24,0.5)') }}
            >
              {item.label}
              {item.label==='DECODE'&&<span style={{ position:'absolute', bottom:2, left:'.9rem', right:'.9rem', height:1.5, background:'#C2482B', borderRadius:1 }}/>}
            </a>
          ))}
          <a href="#contact"
            style={{ marginLeft:'.8rem', padding:'.52rem 1.4rem', borderRadius:100, border:`1px solid ${onDark?'rgba(255,255,255,0.3)':'rgba(28,62,45,0.4)'}`, color:onDark?'#fff':'#1C3E2D', fontSize:'.76rem', fontWeight:400, textDecoration:'none', display:'flex', alignItems:'center', gap:'.4rem', transition:'all .28s ease', background:'transparent', whiteSpace:'nowrap' }}
            onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.background=onDark?'rgba(255,255,255,0.1)':'rgba(28,62,45,0.06)'; el.style.borderColor=onDark?'rgba(255,255,255,0.6)':'rgba(28,62,45,0.6)' }}
            onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.borderColor=onDark?'rgba(255,255,255,0.3)':'rgba(28,62,45,0.4)' }}
          >Contact <span style={{ fontSize:'.9rem' }}>→</span></a>
        </div>
      )}

      {isMobile && (
        <button onClick={()=>setOpen(o=>!o)} aria-label="Menu"
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'50%', width:38, height:38, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'relative', width:15, height:10 }}>
            {([0,4,8] as const).map((top,i)=>(
              <span key={i} style={{ position:'absolute', left:0, top:open?4:top, width:15, height:1.5, background:'#fff', opacity:open&&i===1?0:1, transform:open?(i===0?'rotate(45deg)':i===2?'rotate(-45deg)':'none'):'none', transition:'all .28s ease', borderRadius:1 }} />
            ))}
          </div>
        </button>
      )}

      {isMobile&&open&&(
        <div style={{ position:'absolute',top:'100%',left:0,right:0, background:'rgba(8,6,20,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'.8rem', display:'flex', flexDirection:'column', gap:'.1rem', animation:'fade-down .22s ease' }}>
          {NAV_ITEMS.map(item=>(
            <a key={item.href} href={item.href} onClick={()=>setOpen(false)}
              style={{ padding:'.82rem 1rem', color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'.95rem', fontWeight:300, borderRadius:10 }}>{item.label}</a>
          ))}
          <a href="#contact" onClick={()=>setOpen(false)} style={{ marginTop:'.35rem', textAlign:'center', background:'rgba(255,255,255,0.08)', color:'#fff', padding:'.85rem', borderRadius:10, textDecoration:'none', fontSize:'.9rem', border:'1px solid rgba(255,255,255,0.15)' }}>Contact →</a>
        </div>
      )}
    </nav>
  )
}

// ── ORGANIC MOLECULAR CANVAS (right-hero visual) ─────────────────────────────

function OrganicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H

    const onResize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H }
    window.addEventListener('resize', onResize)

    // Protein-like clusters floating around a large "cell" blob
    type Protein = { x:number; y:number; vx:number; vy:number; r:number; col:string; phase:number }
    const COLS = ['#e879f9','#f97316','#fb7185','#a78bfa','#4ade80','#facc15','#38bdf8']

    const proteins: Protein[] = Array.from({ length: 28 }, (_, i) => ({
      x: W * (.15 + Math.random() * .7),
      y: H * (.1  + Math.random() * .8),
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .28,
      r: 14 + Math.random() * 34,
      col: COLS[i % COLS.length],
      phase: Math.random() * Math.PI * 2,
    }))

    // Connector lines (simulate biological network)
    const links: [number,number][] = []
    for (let i=0;i<proteins.length;i++) for (let j=i+1;j<proteins.length;j++) {
      if (links.length < 40 && Math.random() < .18) links.push([i,j])
    }

    let t = 0
    const tick = () => {
      t += .006
      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#080614'
      ctx.fillRect(0, 0, W, H)

      // Large central "cell" blob — purple glow
      const cx = W * .52, cy = H * .48
      for (const [scale, alpha] of [[2.2, .08],[1.6,.14],[1.1,.2],[.7,.32],[.4,.45]] as [number,number][]) {
        const blobR = Math.min(W,H) * .32 * scale
        const blob = ctx.createRadialGradient(cx, cy, 0, cx, cy, blobR)
        blob.addColorStop(0, `rgba(160,80,255,${alpha})`)
        blob.addColorStop(.5,`rgba(100,40,180,${alpha*.6})`)
        blob.addColorStop(1, `rgba(60,0,120,0)`)
        ctx.fillStyle = blob; ctx.beginPath(); ctx.arc(cx, cy, blobR, 0, Math.PI*2); ctx.fill()
      }
      // Cell surface texture (overlapping ellipses)
      ctx.save(); ctx.globalAlpha = .22
      for (let i=0;i<8;i++) {
        const a = (i/8)*Math.PI*2+t*.08
        const ex = cx + Math.cos(a) * W*.14, ey = cy + Math.sin(a) * H*.18
        const g = ctx.createRadialGradient(ex,ey,0,ex,ey,W*.1)
        g.addColorStop(0,'rgba(200,100,255,.5)'); g.addColorStop(1,'rgba(120,40,200,0)')
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ex,ey,W*.1,0,Math.PI*2); ctx.fill()
      }
      ctx.restore()

      // Network connections
      for (const [a,b] of links) {
        const pa=proteins[a], pb=proteins[b]
        const dx=pb.x-pa.x, dy=pb.y-pa.y, dist=Math.sqrt(dx*dx+dy*dy)
        if (dist > W*.55) continue
        const alpha = Math.max(0, .45 - dist/(W*.55)) * (.5+Math.sin(t*1.2+pa.phase)*.2)
        const grad = ctx.createLinearGradient(pa.x,pa.y,pb.x,pb.y)
        grad.addColorStop(0,`${pa.col}${Math.round(alpha*255).toString(16).padStart(2,'0')}`)
        grad.addColorStop(1,`${pb.col}${Math.round(alpha*255).toString(16).padStart(2,'0')}`)
        ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y)
        ctx.strokeStyle=grad; ctx.lineWidth=.8; ctx.stroke()
      }

      // Protein clusters — organic flower-like shapes
      for (const p of proteins) {
        p.x += p.vx + Math.sin(t*.6+p.phase)*.15
        p.y += p.vy + Math.cos(t*.5+p.phase)*.15
        // bounce
        if (p.x < p.r) p.vx = Math.abs(p.vx)
        if (p.x > W-p.r) p.vx = -Math.abs(p.vx)
        if (p.y < p.r) p.vy = Math.abs(p.vy)
        if (p.y > H-p.r) p.vy = -Math.abs(p.vy)
        p.vx *= .998; p.vy *= .998

        const pulse = .85 + Math.sin(t*1.4+p.phase)*.15
        const rr = p.r * pulse

        // Glow halo
        const glo = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rr*2.8)
        const hex = p.col.replace('#','')
        const r0=parseInt(hex.slice(0,2),16), g0=parseInt(hex.slice(2,4),16), b0=parseInt(hex.slice(4,6),16)
        glo.addColorStop(0, `rgba(${r0},${g0},${b0},.28)`)
        glo.addColorStop(1, `rgba(${r0},${g0},${b0},0)`)
        ctx.beginPath(); ctx.arc(p.x,p.y,rr*2.8,0,Math.PI*2); ctx.fillStyle=glo; ctx.fill()

        // Petal lobes (protein-like flower shape)
        const nPetals = 4 + (p.r>30?2:0)
        for (let i=0;i<nPetals;i++) {
          const a = (i/nPetals)*Math.PI*2 + t*.25+p.phase
          const px = p.x+Math.cos(a)*rr*.72, py = p.y+Math.sin(a)*rr*.72
          const pg = ctx.createRadialGradient(px,py,0,px,py,rr*.68)
          pg.addColorStop(0,`rgba(${r0},${g0},${b0},.9)`)
          pg.addColorStop(.5,`rgba(${r0},${g0},${b0},.45)`)
          pg.addColorStop(1,`rgba(${r0},${g0},${b0},0)`)
          ctx.beginPath(); ctx.arc(px,py,rr*.68,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill()
        }
        // Core
        ctx.beginPath(); ctx.arc(p.x,p.y,rr*.38,0,Math.PI*2)
        ctx.fillStyle=`rgba(${r0},${g0},${b0},.95)`; ctx.fill()
        ctx.beginPath(); ctx.arc(p.x,p.y,rr*.18,0,Math.PI*2)
        ctx.fillStyle='rgba(255,255,255,.45)'; ctx.fill()
      }

      // Top-right corner accent glow
      const corner = ctx.createRadialGradient(W,0,0,W,0,W*.45)
      corner.addColorStop(0,'rgba(232,121,249,.12)'); corner.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle=corner; ctx.fillRect(0,0,W,H)

      rafRef.current = requestAnimationFrame(tick)
    }

    tick()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} aria-hidden="true" />
}

// ── DNA HELIX CANVAS ─────────────────────────────────────────────────────────

function DNACanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H

    const onResize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', onResize)

    // Floating micro-particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * 1, y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.00035 + 0.00012,
      drift: (Math.random() - 0.5) * 0.0003,
      opacity: Math.random() * 0.35 + 0.08,
    }))

    let t = 0
    const tick = () => {
      t += 0.008
      ctx.clearRect(0, 0, W, H)

      // Deep dark bg
      ctx.fillStyle = '#050b14'
      ctx.fillRect(0, 0, W, H)

      // Central radial glow
      const bg = ctx.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .45, W * .55)
      bg.addColorStop(0, 'rgba(0,50,80,.45)')
      bg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      // Floating particles
      for (const p of particles) {
        p.y -= p.speed; p.x += p.drift
        if (p.y < -0.02) p.y = 1.02
        if (p.x < -0.02) p.x = 1.02
        if (p.x >  1.02) p.x = -0.02
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100,210,240,${p.opacity})`
        ctx.fill()
      }

      // Helper: draw one DNA double-helix
      const drawHelix = (cx: number, radius: number, nBases: number, phase: number) => {
        const top = -H * .08, bot = H * 1.08
        const step = (bot - top) / nBases
        const turns = 4.5

        const s1: { x:number; y:number; z:number }[] = []
        const s2: { x:number; y:number; z:number }[] = []

        for (let i = 0; i < nBases; i++) {
          const y = top + i * step
          const a = phase + (i / nBases) * Math.PI * 2 * turns
          s1.push({ x: cx + Math.sin(a) * radius,           y, z: Math.cos(a) })
          s2.push({ x: cx + Math.sin(a + Math.PI) * radius, y, z: Math.cos(a + Math.PI) })
        }

        // Strand path helper
        const drawStrand = (nodes: typeof s1, r: number, g: number, b: number) => {
          ctx.beginPath()
          nodes.forEach((n, i) => {
            if (i === 0) { ctx.moveTo(n.x, n.y); return }
            const p = nodes[i-1]
            ctx.quadraticCurveTo(p.x, p.y, (p.x+n.x)/2, (p.y+n.y)/2)
          })
          const gr = ctx.createLinearGradient(0, top, 0, bot)
          gr.addColorStop(0,   `rgba(${r},${g},${b},0)`)
          gr.addColorStop(.1,  `rgba(${r},${g},${b},.65)`)
          gr.addColorStop(.9,  `rgba(${r},${g},${b},.65)`)
          gr.addColorStop(1,   `rgba(${r},${g},${b},0)`)
          ctx.strokeStyle = gr
          ctx.lineWidth = Math.max(1.2, radius * 0.03)
          ctx.stroke()
        }

        drawStrand(s1, 56, 189, 248)  // cyan-blue
        drawStrand(s2, 74, 222, 128)  // green

        // Base pair rungs every 2 nodes
        for (let i = 0; i < nBases; i += 2) {
          const a = (s1[i].z + 1) / 2
          ctx.beginPath()
          ctx.moveTo(s1[i].x, s1[i].y)
          ctx.lineTo(s2[i].x, s2[i].y)
          ctx.strokeStyle = `rgba(147,220,230,${.06 + a * .28})`
          ctx.lineWidth = Math.max(.5, radius * 0.014)
          ctx.stroke()
        }

        // Glowing nodes on both strands
        const drawNodes = (nodes: typeof s1, r: number, g: number, b: number) => {
          for (const n of nodes) {
            const depth = (n.z + 1) / 2
            const nr = Math.max(1.5, radius * .058 * (.5 + depth * .5))
            const glo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, nr * 4.5)
            glo.addColorStop(0, `rgba(${r},${g},${b},${.3 + depth * .4})`)
            glo.addColorStop(1, `rgba(${r},${g},${b},0)`)
            ctx.beginPath(); ctx.arc(n.x, n.y, nr * 4.5, 0, Math.PI * 2)
            ctx.fillStyle = glo; ctx.fill()
            ctx.beginPath(); ctx.arc(n.x, n.y, nr, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${r},${g},${b},${.75 + depth * .25})`; ctx.fill()
          }
        }

        drawNodes(s1, 56, 189, 248)
        drawNodes(s2, 74, 222, 128)
      }

      // Draw helices: one large centred, two flanking on desktop
      const mainR = Math.min(W * .07, 96)
      drawHelix(W * .5, mainR, 48, t)
      if (W > 768) {
        drawHelix(W * .16, Math.min(W * .038, 52), 34, t * .75 + 1.4)
        drawHelix(W * .84, Math.min(W * .038, 52), 34, t * .88 + 0.7)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    tick()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} aria-hidden="true" />
}

// ── HERO ─────────────────────────────────────────────────────────────────────

function Hero() {
  const [loaded,setLoaded]=useState(false)
  const isMobile=useIsMobile()

  useEffect(()=>{ const t=setTimeout(()=>setLoaded(true),100); return ()=>clearTimeout(t) },[])

  const fade=(d:number):React.CSSProperties=>({
    opacity:loaded?1:0, transform:loaded?'none':'translateY(24px)',
    transition:`all 1.1s cubic-bezier(.16,1,.3,1) ${d}s`,
  })

  return (
    <section id="hero" style={{ position:'relative', height:'100vh', minHeight:isMobile?620:700, overflow:'hidden', background:'#080614', display:'flex', flexDirection:isMobile?'column':'row' }}>

      {/* ── LEFT: text ────────────────────────────── */}
      <div style={{ position:'relative', flex:isMobile?'none':'0 0 50%', zIndex:3, display:'flex', flexDirection:'column', justifyContent:'center', padding:isMobile?'7rem 1.6rem 3rem':'0 4.5rem 0 5.5rem' }}>

        {/* DNA canvas ambiance (left only, faint) */}
        <div style={{ position:'absolute', inset:0, opacity:0.18, pointerEvents:'none' }}>
          <DNACanvas />
        </div>

        {/* Left-edge gradient so DNA canvas doesn't bleed */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, #080614 55%, transparent)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ ...fade(0.08) }}>
            <span className="mono" style={{ fontSize:'.56rem', letterSpacing:'.3em', textTransform:'uppercase', color:'rgba(200,160,255,0.6)', display:'block', marginBottom:'1.8rem' }}>Precision Index Discovery Presents</span>
          </div>

          {/* DECODE — huge display */}
          <div style={{ ...fade(0.18), marginBottom:'.15rem' }}>
            <span className="mono" style={{ fontSize:isMobile?'clamp(3.2rem,16vw,5.5rem)':'clamp(4rem,7.5vw,8.8rem)', fontWeight:700, letterSpacing:'.04em', color:'#FFFFFF', lineHeight:1, display:'block', textShadow:'0 0 80px rgba(194,72,43,0.2)' }}>DECODE</span>
          </div>

          <h1 className="serif" style={{
            ...fade(0.28),
            fontSize:isMobile?'clamp(1.7rem,7vw,2.6rem)':'clamp(1.9rem,3.2vw,3.8rem)',
            fontWeight:300, lineHeight:1.08, letterSpacing:'-.01em', color:'rgba(255,255,255,0.88)',
            margin:'0 0 1.8rem',
          }}>
            the molecular<br />landscape of{' '}
            <em style={{ fontStyle:'italic', color:'#e879f9' }}>disease.</em>
          </h1>

          <p style={{ ...fade(0.4), fontSize:isMobile?'.86rem':'.94rem', color:'rgba(255,255,255,0.45)', lineHeight:1.9, maxWidth:420, fontWeight:300, marginBottom:'2.4rem' }}>
            Next-generation protein biomarker discovery powered by proximity extension assay technology — simultaneously quantifying thousands of proteins with femtomolar sensitivity.
          </p>

          <div style={{ ...fade(0.52) }}>
            <a href="#indices"
              style={{ display:'inline-flex', alignItems:'center', gap:'.55rem', padding:'.82rem 2rem', borderRadius:100, background:'transparent', color:'#fff', border:'1.5px solid rgba(255,255,255,0.38)', fontSize:'.85rem', fontWeight:300, textDecoration:'none', transition:'all .28s ease', backdropFilter:'blur(6px)' }}
              onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='rgba(232,121,249,0.12)'; el.style.borderColor='rgba(232,121,249,0.55)' }}
              onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.borderColor='rgba(255,255,255,0.38)' }}
            >Explore the platform <span style={{ fontSize:'1rem' }}>→</span></a>
          </div>
        </div>
      </div>

      {/* ── RIGHT: organic molecular animation ── */}
      <div style={{ flex:1, position:'relative', minHeight:isMobile?'48vh':'auto', overflow:'hidden' }}>
        <OrganicCanvas />

        {/* Left-edge gradient so canvas blends into the dark left panel */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, #080614 0%, rgba(8,6,20,0.35) 28%, transparent 60%)', pointerEvents:'none' }}/>

        {/* "Interact with the molecular world" pill — from reference */}
        {!isMobile&&(
          <div style={{ position:'absolute', top:'46%', right:'2.5rem', zIndex:2, display:'flex', alignItems:'center', gap:'.65rem', opacity:loaded?1:0, transition:'opacity 1.5s 1.2s' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', border:'1px solid rgba(232,121,249,0.5)', background:'rgba(8,6,20,0.55)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(232,121,249,0.9)', boxShadow:'0 0 10px rgba(232,121,249,0.6)' }}/>
            </div>
            <div>
              <div style={{ fontSize:'.73rem', color:'rgba(255,255,255,0.75)', fontWeight:400 }}>Interact</div>
              <div style={{ fontSize:'.66rem', color:'rgba(255,255,255,0.38)', lineHeight:1.3 }}>with the molecular world</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom fade to paper */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'22%', background:'linear-gradient(to bottom, transparent, var(--paper))', zIndex:4, pointerEvents:'none' }}/>

      {/* Scroll to explore — from reference */}
      {!isMobile&&(
        <div style={{ position:'absolute', bottom:'2.8rem', left:'5.5rem', zIndex:5, display:'flex', alignItems:'center', gap:'.75rem', opacity:loaded?0.6:0, transition:'opacity 1.5s 1.3s' }}>
          <div style={{ width:20, height:32, borderRadius:10, border:'1px solid rgba(255,255,255,0.28)', display:'flex', justifyContent:'center', paddingTop:5 }}>
            <div style={{ width:2, height:8, background:'rgba(255,255,255,0.6)', borderRadius:1, animation:'scroll-pulse 2s ease-in-out infinite' }}/>
          </div>
          <span className="mono" style={{ fontSize:'.5rem', letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(255,255,255,0.38)' }}>Scroll to explore</span>
        </div>
      )}
    </section>
  )
}

// ── STATS BAND ────────────────────────────────────────────────────────────────

function StatsBar() {
  const { ref, vis } = useVisible(0.3)
  const isMobile = useIsMobile(600)
  const stats=[
    { num:'7',       label:'Clinical Indices',      sub:'from one finger-prick' },
    { num:'3',       label:'Global Facilities',     sub:'Stockholm · London · Dubai' },
    { num:'Olink',   label:'High-Plex Proteomics',  sub:'validated platform' },
    { num:'1',       label:'Sample. All Indices.',  sub:'cryogenically banked' },
  ]
  return (
    <div ref={ref} style={{ background:'var(--forest)', display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', overflow:'hidden' }}>
      {stats.map((s,i)=>(
        <div key={i} style={{
          padding:isMobile?'1.8rem 1.2rem':'3rem 3.5rem',
          borderRight:(isMobile?i%2===0:i<3)?'1px solid rgba(247,245,239,0.1)':'none',
          borderBottom:isMobile&&i<2?'1px solid rgba(247,245,239,0.1)':'none',
          opacity:vis?1:0, transform:vis?'none':'translateY(16px)',
          transition:`all .85s cubic-bezier(.16,1,.3,1) ${i*.1}s`,
          position:'relative',
        }}>
          <div style={{ position:'absolute', top:0, left:isMobile?'1.2rem':'3.5rem', right:isMobile?'1.2rem':'3.5rem', height:1, background:'linear-gradient(to right,transparent,rgba(194,72,43,0.5),transparent)', transform:vis?'scaleX(1)':'scaleX(0)', transition:`transform 1s cubic-bezier(.16,1,.3,1) ${i*.1+.28}s` }} />
          <div className="serif" style={{ fontSize:isMobile?'1.8rem':'2.6rem', fontWeight:300, color:'#F7F5EF', lineHeight:1, marginBottom:'.5rem' }}>{s.num}</div>
          <div style={{ fontSize:isMobile?'.72rem':'.78rem', color:'rgba(247,245,239,0.65)', letterSpacing:'.04em', marginBottom:'.2rem' }}>{s.label}</div>
          <div className="mono" style={{ fontSize:'.6rem', color:'rgba(247,245,239,0.3)', letterSpacing:'.06em' }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── BIOLOGICAL COMPLEXITY ─────────────────────────────────────────────────────

function BiologicalComplexity() {
  const { ref, vis } = useVisible(0.1)
  const isMobile = useIsMobile()

  return (
    <section style={{ background:'var(--white)', padding:isMobile?'5rem 1.4rem':'0', overflow:'hidden', position:'relative' }}>

      {/* Large editorial background text */}
      <div aria-hidden="true" style={{ position:'absolute', top:'5%', left:'-2%', fontFamily:'Playfair Display,serif', fontSize:'clamp(6rem,18vw,16rem)', fontWeight:300, color:'rgba(28,62,45,0.04)', lineHeight:1, pointerEvents:'none', userSelect:'none', whiteSpace:'nowrap' }}>BIOLOGY</div>

      <div ref={ref} style={{ maxWidth:1400, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', minHeight:isMobile?'auto':620 }}>

        {/* Text side */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:isMobile?'0':'7rem 5rem 7rem 5rem', position:'relative', zIndex:1 }}>
          <div style={{ opacity:vis?1:0, transform:vis?'none':'translateX(-28px)', transition:'all .9s cubic-bezier(.16,1,.3,1)', display:'inline-flex', alignItems:'center', gap:'.6rem', fontSize:'.6rem', letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(28,62,45,0.6)', marginBottom:'1.5rem' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#C2482B', animation:'organelle-float 3s ease-in-out infinite' }} />
            What This Is
          </div>

          <h2 className="serif" style={{ opacity:vis?1:0, transform:vis?'none':'translateY(24px)', transition:'all .95s cubic-bezier(.16,1,.3,1) .1s', fontSize:isMobile?'clamp(2.2rem,9vw,3rem)':'clamp(2.8rem,4.2vw,4.8rem)', fontWeight:300, lineHeight:1.05, color:'#151D18', marginBottom:'2rem' }}>
            See beyond<br />
            <em style={{ fontStyle:'italic', color:'#C2482B' }}>standard testing</em>
          </h2>

          <p style={{ opacity:vis?1:0, transform:vis?'none':'translateY(18px)', transition:'all .95s cubic-bezier(.16,1,.3,1) .22s', color:'rgba(21,29,24,0.56)', lineHeight:1.9, fontSize:isMobile?'.88rem':'.96rem', fontWeight:300, maxWidth:440, marginBottom:'2rem' }}>
            Precision 360 is a clinical-grade testing system delivered through partner clinics. A single finger-prick sample is collected at your appointment. One panel is run immediately to answer your headline question. Three additional samples are cryogenically banked, enabling analysis across any of the seven indices the moment your clinician needs to investigate further.
          </p>

          {/* Audience tags */}
          <div style={{ opacity:vis?1:0, transition:'opacity .9s .4s', display:'flex', gap:'1.2rem', alignItems:'center', flexWrap:'wrap' }}>
            {[{ c:'#C2482B', l:'Reproductive' },{ c:'#1C3E2D', l:'Metabolic' },{ c:'#C78B3A', l:'Oncological' },{ c:'#7A9E85', l:'Genomic' }].map((t,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'.45rem', fontSize:'.78rem', color:'rgba(21,29,24,0.5)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:t.c, animation:`organelle-float ${2.5+i*.4}s ease-in-out infinite` }} />{t.l}
              </div>
            ))}
          </div>
        </div>

        {/* Image side — biology microscopy */}
        <div style={{ position:'relative', minHeight:isMobile?280:620, overflow:'hidden' }}>
          <img
            src="https://images.pexels.com/photos/954583/pexels-photo-954583.jpeg?auto=compress&cs=tinysrgb&w=1260"
            alt="Biology microscopy"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'saturate(0.7) brightness(0.95)', opacity:vis?1:0, transform:vis?'scale(1)':'scale(1.06)', transition:'opacity 1.1s .2s, transform 1.4s .2s cubic-bezier(.16,1,.3,1)' }}
            onError={e=>{ (e.currentTarget as HTMLImageElement).style.display='none' }}
          />
          {/* Cell structure overlay */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.2 }} viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
            <circle cx="300" cy="300" r="180" fill="none" stroke="#F7F5EF" strokeWidth="1" strokeDasharray="6 4" />
            <circle cx="300" cy="300" r="100" fill="none" stroke="#F7F5EF" strokeWidth="0.8" />
            <circle cx="300" cy="300" r="35"  fill="rgba(247,245,239,0.15)" />
            {Array.from({length:8},(_,i)=>{ const a=(i/8)*Math.PI*2; return <circle key={i} cx={300+Math.cos(a)*140} cy={300+Math.sin(a)*140} r="8" fill="rgba(247,245,239,0.2)" /> })}
          </svg>
        </div>
      </div>
    </section>
  )
}

// ── PEA TECHNOLOGY ────────────────────────────────────────────────────────────

const PEA_STEPS = [
  {
    num:'01', title:'Biological Sample', col:'#3A6447',
    img:'https://images.pexels.com/photos/4226219/pexels-photo-4226219.jpeg?auto=compress&cs=tinysrgb&w=1260',
    body:'As little as 1 µL of plasma, serum, or cerebrospinal fluid contains thousands of target proteins for simultaneous measurement.',
  },
  {
    num:'02', title:'Target Recognition', col:'#C2482B',
    img:'https://images.pexels.com/photos/954583/pexels-photo-954583.jpeg?auto=compress&cs=tinysrgb&w=1260',
    body:'Two oligonucleotide-conjugated antibodies bind adjacent epitopes on the same target protein, each carrying a unique DNA tag.',
  },
  {
    num:'03', title:'Proximity Extension', col:'#C78B3A',
    img:'https://images.pexels.com/photos/1337382/pexels-photo-1337382.jpeg?auto=compress&cs=tinysrgb&w=1260',
    body:'Dual binding brings the DNA tags into close proximity, enabling hybridisation and template-dependent extension into a unique amplicon.',
  },
  {
    num:'04', title:'Signal Amplification', col:'#1C3E2D',
    img:'https://images.pexels.com/photos/3825572/pexels-photo-3825572.jpeg?auto=compress&cs=tinysrgb&w=1260',
    body:'The extended DNA product — unique to each target — is amplified and precisely quantified by real-time PCR or next-generation sequencing.',
  },
  {
    num:'05', title:'Multiplexed Profiling', col:'#C2482B',
    img:'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1260',
    body:'Thousands of these reactions run simultaneously in a single well, yielding quantitative measurements of up to 5,784 proteins per sample.',
  },
  {
    num:'06', title:'Biological Insight', col:'#3A6447',
    img:'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1260',
    body:'Raw protein abundance data flows through bioinformatics pipelines, transforming into pathway activations, disease signatures, and biomarker candidates.',
  },
]

function PEATechnology() {
  const { ref, vis } = useVisible(0.1)
  const [activeStep, setActiveStep] = useState(0)
  const isMobile = useIsMobile()
  const step = PEA_STEPS[activeStep]

  return (
    <section id="technology" style={{ background:'var(--sage-bg)', padding:isMobile?'5rem 1.4rem':'10rem 6rem', position:'relative', overflow:'hidden' }}>

      {/* Helix decorative SVG */}
      <svg style={{ position:'absolute', right:0, top:'10%', opacity:.06, pointerEvents:'none' }} width="200" height="400" viewBox="0 0 200 400">
        <path d="M100 0 Q160 50 100 100 Q40 150 100 200 Q160 250 100 300 Q40 350 100 400" fill="none" stroke="#1C3E2D" strokeWidth="3" strokeDasharray="8 4" style={{ animation:'helix-draw 3s ease forwards' }} strokeDashoffset="600"/>
        <path d="M100 0 Q40 50 100 100 Q160 150 100 200 Q40 250 100 300 Q160 350 100 400" fill="none" stroke="#C2482B" strokeWidth="1.5" strokeDasharray="6 4" style={{ animation:'helix-draw 3.5s ease .5s forwards' }} strokeDashoffset="600"/>
      </svg>

      <div style={{ maxWidth:1300, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div ref={ref} style={{ marginBottom:isMobile?'3.5rem':'5rem' }}>
          <div style={{ opacity:vis?1:0, transition:'opacity .7s', display:'inline-flex', alignItems:'center', gap:'.6rem', fontSize:'.6rem', letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(28,62,45,0.65)', marginBottom:'1.2rem' }}>
            <span style={{ width:22, height:1, background:'#3A6447', display:'block' }}/>How This Is Delivered
          </div>
          <h2 className="serif" style={{ opacity:vis?1:0, transform:vis?'none':'translateY(20px)', transition:'all .9s cubic-bezier(.16,1,.3,1) .1s', fontSize:isMobile?'clamp(2rem,8vw,2.7rem)':'clamp(2.5rem,3.8vw,4.5rem)', fontWeight:300, lineHeight:1.06, color:'#151D18', maxWidth:680 }}>
            The science behind<br />
            <em style={{ fontStyle:'italic', color:'#3A6447' }}>Precision 360.</em>
          </h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?'3rem':'5rem', alignItems:'start' }}>

          {/* Steps list */}
          <div>
            {PEA_STEPS.map((s,i)=>(
              <div key={i} onClick={()=>setActiveStep(i)}
                style={{ display:'flex', gap:'1.2rem', alignItems:'flex-start', padding:'1.25rem 1.4rem', marginBottom:'.4rem', borderRadius:12, cursor:'pointer', background:activeStep===i?'rgba(255,255,255,0.85)':'transparent', border:`1px solid ${activeStep===i?'rgba(28,62,45,0.15)':'transparent'}`, transition:'all .28s ease', boxShadow:activeStep===i?'0 4px 24px rgba(28,62,45,0.08)':'none', opacity:vis?1:0, transform:vis?'none':'translateX(-20px)', transitionDelay:vis?`${i*.08}s`:'0s' }}
              >
                <span className="mono" style={{ fontSize:'.62rem', color:activeStep===i?s.col:'rgba(21,29,24,0.22)', letterSpacing:'.14em', display:'block', paddingTop:'.15rem', transition:'color .28s', flexShrink:0 }}>{s.num}</span>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:isMobile?'.95rem':'1rem', fontWeight:500, color:activeStep===i?'#151D18':'rgba(21,29,24,0.45)', marginBottom:'.3rem', transition:'color .28s' }}>{s.title}</h3>
                  {activeStep===i&&(
                    <p style={{ fontSize:'.84rem', color:'rgba(21,29,24,0.58)', lineHeight:1.78, fontWeight:300, animation:'spore-rise .35s ease' }}>{s.body}</p>
                  )}
                </div>
                <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:activeStep===i?s.col:'rgba(21,29,24,0.12)', flexShrink:0, marginTop:'.35rem', transition:'all .28s ease', boxShadow:activeStep===i?`0 0 10px ${s.col}`:'none' }}/>
              </div>
            ))}
          </div>

          {/* Photo panel */}
          <div style={{ position:'sticky', top:'6rem' }}>
            {/* Large feature photo */}
            <div style={{ position:'relative', borderRadius:20, overflow:'hidden', height:isMobile?260:400, boxShadow:'0 20px 70px rgba(21,29,24,0.18)' }}>
              {PEA_STEPS.map((s,i)=>(
                <img key={i} src={s.img} alt={s.title}
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:i===activeStep?1:0, transition:'opacity .55s ease', filter:'saturate(1.1) brightness(0.96)' }}
                  onError={e=>{ (e.currentTarget as HTMLImageElement).style.opacity='0' }}
                />
              ))}
              {/* Gradient overlay — dark at bottom for legibility */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(21,29,24,0.82) 0%, rgba(21,29,24,0.18) 55%, transparent 100%)', zIndex:1 }}/>
              {/* Active step info overlaid on photo */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:2, padding:isMobile?'1.5rem':'2rem' }}>
                <span className="mono" style={{ fontSize:'.55rem', letterSpacing:'.22em', color:step.col, display:'block', marginBottom:'.5rem' }}>{step.num} — {step.title}</span>
                <p style={{ fontSize:isMobile?'.8rem':'.88rem', color:'rgba(247,245,239,0.8)', lineHeight:1.72, fontWeight:300 }}>{step.body}</p>
              </div>
            </div>

            {/* Thumbnail strip */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'.4rem', marginTop:'.5rem' }}>
              {PEA_STEPS.map((s,i)=>(
                <div key={i} onClick={()=>setActiveStep(i)}
                  style={{ position:'relative', height:56, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'all .25s ease', border:`2px solid ${activeStep===i?s.col:'transparent'}`, opacity:activeStep===i?1:0.55 }}
                >
                  <img src={s.img} alt={s.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e=>{ (e.currentTarget as HTMLImageElement).style.opacity='0' }}
                  />
                  <div style={{ position:'absolute', inset:0, background:'rgba(21,29,24,0.35)' }}/>
                  <span className="mono" style={{ position:'absolute', bottom:4, left:6, fontSize:'.42rem', color:'rgba(247,245,239,0.9)', letterSpacing:'.08em' }}>{s.num}</span>
                </div>
              ))}
            </div>

            <p style={{ marginTop:'1rem', fontSize:'.72rem', color:'rgba(21,29,24,0.35)', lineHeight:1.7, fontStyle:'italic' }}>
              Olink® PEA is developed by Olink Proteomics AB. Precision Index Discovery is an independent scientific user.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── PRODUCT PORTFOLIO ─────────────────────────────────────────────────────────

const INDICES=[
  { name:'Fertility Index',      badge:'REPRODUCTIVE',   col:'#C2482B', bg:'rgba(194,72,43,0.06)',   border:'rgba(194,72,43,0.18)',  desc:'Conception probability for the next cycle, plus the modifiable factors driving it. Available for both partners.' },
  { name:'Pregnancy Index',      badge:'OBSTETRIC',      col:'#3A6447', bg:'rgba(58,100,71,0.06)',   border:'rgba(58,100,71,0.18)',  desc:'Trimester-by-trimester surveillance across preeclampsia, gestational diabetes, placental function, preterm birth risk, and nutritional and hormonal foundations.' },
  { name:'Organ Index',          badge:'SYSTEMIC',       col:'#1C3E2D', bg:'rgba(28,62,45,0.06)',    border:'rgba(28,62,45,0.18)',   desc:'Red, amber, or green status across nine organ systems — cardiovascular, neurological, hepatic, renal, immune, gastrointestinal, vascular, pancreatic, metabolic.' },
  { name:'Vitality Index',       badge:'LONGEVITY',      col:'#C78B3A', bg:'rgba(199,139,58,0.06)',  border:'rgba(199,139,58,0.18)', desc:'Biological age and pace of ageing, measured by two independently validated clocks with molecular profile providing mechanistic context.' },
  { name:'Cancer Index',         badge:'ONCOLOGY',       col:'#7A9E85', bg:'rgba(122,158,133,0.08)', border:'rgba(122,158,133,0.2)', desc:'Multi-modal surveillance across tumour microenvironment protein signatures and circulating tumour DNA methylation patterns.' },
  { name:'Metabolomics Index',   badge:'CARDIOMETABOLIC', col:'#D4B86A', bg:'rgba(212,184,106,0.08)', border:'rgba(212,184,106,0.2)', desc:'Mass-spectrometry quantification of cardiometabolic, hormonal, nutritional, and elemental status.' },
  { name:'Genomics Index',       badge:'GENETIC',        col:'#151D18', bg:'rgba(21,29,24,0.04)',    border:'rgba(21,29,24,0.12)',   desc:'A one-time clinical-grade sequencing panel — pathogenic variants, pharmacogenomics, polygenic risk — that refines interpretation across all other indices longitudinally.' },
]

function ProductPortfolio() {
  const { ref, vis } = useVisible(0.1)
  const isMobile = useIsMobile()

  return (
    <section id="indices" style={{ background:'var(--white)', padding:isMobile?'5rem 1.4rem':'10rem 6rem', position:'relative', overflow:'hidden' }}>
      {/* Editorial background number */}
      <div aria-hidden="true" style={{ position:'absolute', bottom:'-5%', right:'-2%', fontFamily:'Playfair Display,serif', fontSize:'clamp(8rem,22vw,18rem)', fontWeight:300, color:'rgba(28,62,45,0.04)', lineHeight:1, pointerEvents:'none', userSelect:'none' }}>07</div>

      <div style={{ maxWidth:1300, margin:'0 auto' }}>
        <div ref={ref} style={{ marginBottom:isMobile?'3rem':'5rem', display:'flex', flexDirection:isMobile?'column':'row', justifyContent:'space-between', alignItems:isMobile?'flex-start':'flex-end', gap:'1.5rem' }}>
          <div>
            <div style={{ opacity:vis?1:0, transition:'opacity .7s', display:'inline-flex', alignItems:'center', gap:'.6rem', fontSize:'.6rem', letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(194,72,43,0.7)', marginBottom:'1.2rem' }}>
              <span style={{ width:22, height:1, background:'#C2482B', display:'block' }}/>The Seven Indices
            </div>
            <h2 className="serif" style={{ opacity:vis?1:0, transform:vis?'none':'translateY(18px)', transition:'all .9s cubic-bezier(.16,1,.3,1) .1s', fontSize:isMobile?'clamp(2rem,8vw,2.7rem)':'clamp(2.5rem,3.8vw,4.2rem)', fontWeight:300, lineHeight:1.06, color:'#151D18', maxWidth:600 }}>
              One sample. Seven windows into{' '}<em style={{ fontStyle:'italic', color:'#C2482B' }}>your biology.</em>
            </h2>
          </div>
          <p style={{ opacity:vis?1:0, transition:'opacity .9s .2s', color:'rgba(21,29,24,0.42)', fontSize:'.9rem', lineHeight:1.8, maxWidth:280, fontWeight:300 }}>
            Each index investigates a different biological system — independently, or together as a complete picture of health.
          </p>
        </div>

        {/* Grid: first card spans 2 cols */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gridTemplateRows:'auto', gap:'1rem' }}>
          {INDICES.map((p,i)=>(
            <div key={i}
              style={{
                gridColumn: !isMobile && i===0 ? 'span 2' : 'span 1',
                padding: i===0&&!isMobile ? '2.8rem 3rem' : '2rem 2rem',
                background: p.bg, border:`1px solid ${p.border}`,
                borderRadius:18, display:'flex', flexDirection:'column', gap:'1rem',
                cursor:'pointer',
                opacity:vis?1:0, transform:vis?'none':'translateY(24px)',
                transition:`all .88s cubic-bezier(.16,1,.3,1) ${i*.08}s`,
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 40px ${p.col}18`}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}
            >
              {/* Biology circle ornament */}
              <div style={{ width:34, height:34, borderRadius:'50%', border:`1.5px solid ${p.col}`, display:'flex', alignItems:'center', justifyContent:'center', opacity:.7 }}>
                <div style={{ width:11, height:11, borderRadius:'50%', background:p.col, opacity:.65 }}/>
              </div>
              <span className="mono" style={{ fontSize:'.55rem', letterSpacing:'.2em', textTransform:'uppercase', color:p.col, opacity:.75, display:'block' }}>{p.badge}</span>
              <h3 className="serif" style={{ fontSize:i===0&&!isMobile?'1.65rem':'1.22rem', fontWeight:400, color:'#151D18', lineHeight:1.2 }}>{p.name}</h3>
              <p style={{ fontSize:'.84rem', color:'rgba(21,29,24,0.52)', lineHeight:1.8, fontWeight:300 }}>{p.desc}</p>
              <a href="#contact"
                style={{ fontSize:'.76rem', color:p.col, textDecoration:'none', borderBottom:`1px solid ${p.col}44`, paddingBottom:'.12rem', transition:'border-color .22s', display:'inline-block', marginTop:'auto' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=p.col}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=`${p.col}44`}}
              >Learn more about this index →</a>
            </div>
          ))}
        </div>

        <div style={{ marginTop:'2.5rem', padding:'1.2rem 1.8rem', background:'rgba(28,62,45,0.04)', border:'1px solid rgba(28,62,45,0.08)', borderRadius:12 }}>
          <p style={{ fontSize:'.76rem', color:'rgba(21,29,24,0.38)', lineHeight:1.7 }}>
            Precision 360 panels are available exclusively through certified partner clinics. All assays validated using Karolinska Bridging Protocols, establishing clinical equivalence to matched venous blood. Powered by Olink® high-plex proteomics, Illumina® sequencing, and methylation arrays.
          </p>
        </div>
      </div>
    </section>
  )
}

// ── ABOUT ────────────────────────────────────────────────────────────────────

function About() {
  const { ref, vis } = useVisible(0.1)
  const isMobile = useIsMobile()
  const tr=(d:number):React.CSSProperties=>({ opacity:vis?1:0, transform:vis?'none':'translateY(22px)', transition:`all .9s cubic-bezier(.16,1,.3,1) ${d}s` })

  return (
    <section id="about" style={{ background:'var(--forest)', overflow:'hidden' }}>
      <div ref={ref} style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', minHeight:isMobile?'auto':600 }}>

        {/* Lab image */}
        <div style={{ position:'relative', minHeight:isMobile?240:600, overflow:'hidden', order:isMobile?-1:0 }}>
          <img
            src="https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1260"
            alt="Laboratory research"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'saturate(0.6) brightness(0.75)', opacity:vis?1:0, transform:vis?'scale(1)':'scale(1.05)', transition:'opacity 1.1s .15s, transform 1.5s .15s cubic-bezier(.16,1,.3,1)' }}
            onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, transparent 60%, rgba(28,62,45,0.85))', pointerEvents:'none' }}/>
        </div>

        {/* Text */}
        <div style={{ padding:isMobile?'4rem 1.4rem':'7rem 5rem', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ ...tr(0), display:'inline-flex', alignItems:'center', gap:'.6rem', fontSize:'.6rem', letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(247,245,239,0.4)', marginBottom:'1.5rem' }}>
            <span style={{ width:22, height:1, background:'rgba(247,245,239,0.3)', display:'block' }}/>About
          </div>
          <h2 className="serif" style={{ ...tr(0.12), fontSize:isMobile?'clamp(2rem,8vw,2.7rem)':'clamp(2.5rem,3.5vw,3.8rem)', fontWeight:300, lineHeight:1.06, color:'#F7F5EF', marginBottom:'1.8rem' }}>
            Designed for patients<br /><em style={{ fontStyle:'italic', color:'rgba(194,72,43,0.85)' }}>and clinicians</em>
          </h2>
          <div style={{ ...tr(0.2), marginBottom:'1.8rem', borderLeft:'2px solid rgba(247,245,239,0.2)', paddingLeft:'1.3rem' }}>
            <p className="serif" style={{ fontSize:isMobile?'.98rem':'1.08rem', fontStyle:'italic', color:'rgba(247,245,239,0.6)', lineHeight:1.62 }}>
              "When a test does not produce a clear answer, the cause is often located in a system that was not initially investigated."
            </p>
          </div>
          <p style={{ ...tr(0.28), color:'rgba(247,245,239,0.48)', lineHeight:1.9, fontSize:isMobile?'.88rem':'.94rem', fontWeight:300, marginBottom:'1.2rem' }}>
            Precision 360 is powered by Olink high-plex proteomics, combined with Illumina sequencing and methylation arrays — platforms routinely used in large-scale biobank and translational research settings. Samples are processed in our Stockholm, London, and Dubai facilities.
          </p>
          <div style={{ ...tr(0.36), display:'flex', flexDirection:'column', gap:'.7rem' }}>
            {[{title:'For Patients', body:'Explore the questions that matter — from fertility and pregnancy to metabolism and ageing. Connect with a certified partner clinic.'},{title:'For Clinicians', body:'Review each index, how to interpret results, and when to use it in practice. Partner with us to bring Precision 360 into your clinic.'},{title:'Locations', body:'Stockholm, Sweden · Dubai, UAE · London, UK'}].map((item,i)=>(
              <div key={i} style={{ display:'flex', gap:'1rem', padding:'.9rem 1rem', borderRadius:10, background:'rgba(247,245,239,0.05)', border:'1px solid rgba(247,245,239,0.07)' }}>
                <div style={{ width:3, background:'#C2482B', borderRadius:2, flexShrink:0 }}/>
                <div>
                  <span className="mono" style={{ fontSize:'.58rem', letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(247,245,239,0.35)', display:'block', marginBottom:'.3rem' }}>{item.title}</span>
                  <p style={{ fontSize:'.84rem', color:'rgba(247,245,239,0.45)', lineHeight:1.7, fontWeight:300 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── RESEARCH APPLICATIONS ─────────────────────────────────────────────────────

const AREAS=[
  { title:'Oncology',                col:'#C2482B', bg:'rgba(194,72,43,0.08)', border:'rgba(194,72,43,0.18)',  desc:'Tumour microenvironment profiling, liquid biopsy biomarkers, immunotherapy response characterisation across solid tumours and haematological malignancies.' },
  { title:'Immunology & Inflammation',col:'#3A6447', bg:'rgba(58,100,71,0.08)', border:'rgba(58,100,71,0.18)', desc:'Cytokine and chemokine profiling, immune cell activation, systemic inflammation indices in RA, SLE, IBD, and asthma.' },
  { title:'Neurology',                col:'#7A9E85', bg:'rgba(122,158,133,0.08)',border:'rgba(122,158,133,0.18)',desc:'CSF and blood-based biomarkers for neurodegeneration, neuroinflammation, Alzheimer\'s disease, multiple sclerosis, and ALS.' },
  { title:'Cardiovascular Disease',   col:'#C78B3A', bg:'rgba(199,139,58,0.08)', border:'rgba(199,139,58,0.18)', desc:'Cardiac injury biomarkers, ventricular remodelling, heart failure, and atherosclerosis — enabling risk stratification and treatment monitoring.' },
  { title:'Metabolic & Endocrine',    col:'#1C3E2D', bg:'rgba(28,62,45,0.08)',  border:'rgba(28,62,45,0.18)',  desc:'Adipokines, hepatokines, insulin signalling proteins, and metabolic stress markers in obesity, T2D, NAFLD, and NASH.' },
  { title:'Aging & Longevity',        col:'#D4B86A', bg:'rgba(212,184,106,0.08)',border:'rgba(212,184,106,0.2)', desc:'Proteomic hallmarks of biological ageing, frailty, cellular senescence, and the molecular basis of healthy longevity.' },
]

function ResearchApplications() {
  const { ref, vis } = useVisible(0.1)
  const isMobile = useIsMobile()

  return (
    <section id="applications" style={{ background:'var(--paper)', padding:isMobile?'5rem 1.4rem':'10rem 6rem', position:'relative', overflow:'hidden' }}>
      <div style={{ maxWidth:1300, margin:'0 auto' }}>
        <div style={{ marginBottom:isMobile?'3rem':'5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.6rem', fontSize:'.6rem', letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(194,72,43,0.7)', marginBottom:'1.2rem' }}>
            <span style={{ width:22, height:1, background:'#C2482B', display:'block' }}/>Research Applications
          </div>
          <h2 className="serif" style={{ fontSize:isMobile?'clamp(2rem,8vw,2.7rem)':'clamp(2.5rem,3.8vw,4.2rem)', fontWeight:300, lineHeight:1.06, color:'#151D18', maxWidth:680 }}>
            Better biological understanding<br />begins with{' '}
            <em style={{ fontStyle:'italic', color:'#3A6447' }}>better molecular insight</em>
          </h2>
        </div>

        <div ref={ref} style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:'1rem' }}>
          {AREAS.map((area,i)=>(
            <div key={i}
              style={{ padding:isMobile?'1.8rem':'2.2rem', background:area.bg, border:`1px solid ${area.border}`, borderRadius:16, display:'flex', flexDirection:'column', gap:'.85rem', opacity:vis?1:0, transform:vis?'none':'translateY(22px)', transition:`all .88s cubic-bezier(.16,1,.3,1) ${i*.08}s`, cursor:'default' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 10px 36px ${area.col}14`}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}
            >
              {/* Biology circle ornament */}
              <div style={{ width:30, height:30, borderRadius:'50%', border:`2px solid ${area.col}`, display:'flex', alignItems:'center', justifyContent:'center', opacity:.7 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:area.col, opacity:.6 }}/>
              </div>
              <h3 className="serif" style={{ fontSize:isMobile?'1.18rem':'1.26rem', fontWeight:300, color:'#151D18', lineHeight:1.2 }}>{area.title}</h3>
              <p style={{ fontSize:isMobile?'.84rem':'.87rem', color:'rgba(21,29,24,0.5)', lineHeight:1.82, fontWeight:300 }}>{area.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── SCIENCE ──────────────────────────────────────────────────────────────────

function Science() {
  const { ref, vis } = useVisible(0.1)
  const isMobile = useIsMobile()
  const pubs=[
    { year:'2024', title:'Proteomics atlas of human ageing',             journal:'Nature Medicine',                col:'#C2482B', desc:'Olink Explore profiled >3,000 plasma proteins in 53,000 UK Biobank participants, revealing protein trajectories of biological ageing and age-related disease risk.' },
    { year:'2023', title:'Pan-cancer plasma proteomics',                  journal:'Nature',                         col:'#3A6447', desc:'Largest cancer proteomics study to date, identifying shared and cancer-specific plasma protein biomarkers across 12 tumour types.' },
    { year:'2023', title:'COVID-19 severity immune signatures',           journal:'Science Translational Medicine',  col:'#C78B3A', desc:'Plasma proteomics identified targetable immune dysregulation signatures predicting ICU admission and mortality in hospitalised patients.' },
    { year:'2022', title:'Cardiovascular risk: 27-protein panel',         journal:'NEJM Evidence',                  col:'#1C3E2D', desc:'Olink-derived 27-protein panel outperforms conventional risk scores for 10-year cardiovascular event prediction in population cohorts.' },
  ]

  return (
    <section id="science" style={{ background:'var(--cream)', padding:isMobile?'5rem 1.4rem':'10rem 6rem' }}>
      <div style={{ maxWidth:1300, margin:'0 auto' }}>
        <div style={{ marginBottom:isMobile?'3rem':'4.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.6rem', fontSize:'.6rem', letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(28,62,45,0.6)', marginBottom:'1.2rem' }}>
            <span style={{ width:22, height:1, background:'#3A6447', display:'block' }}/>Scientific Evidence
          </div>
          <div style={{ display:'flex', flexDirection:isMobile?'column':'row', justifyContent:'space-between', alignItems:isMobile?'flex-start':'flex-end', gap:'1.5rem' }}>
            <h2 className="serif" style={{ fontSize:isMobile?'clamp(2rem,8vw,2.7rem)':'clamp(2.5rem,3.8vw,4.2rem)', fontWeight:300, lineHeight:1.06, color:'#151D18', maxWidth:500 }}>
              Validated by <em style={{ fontStyle:'italic', color:'#3A6447' }}>4,000+<br />peer-reviewed studies</em>
            </h2>
            <p style={{ fontSize:'.86rem', color:'rgba(21,29,24,0.38)', maxWidth:280, textAlign:isMobile?'left':'right', lineHeight:1.8 }}>Selected landmark publications using Olink PEA across clinical and translational research.</p>
          </div>
        </div>

        <div ref={ref}>
          {pubs.map((h,i)=>(
            <div key={i}
              style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'8px 76px 1fr 178px', gap:isMobile?'.5rem':'2.5rem', alignItems:'start', padding:isMobile?'1.5rem 0':'2rem .5rem', borderBottom:`1px solid rgba(21,29,24,0.07)`, opacity:vis?1:0, transform:vis?'none':'translateY(14px)', transition:`all .82s cubic-bezier(.16,1,.3,1) ${i*.09}s`, borderRadius:4, cursor:'default' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(28,62,45,0.03)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}
            >
              {!isMobile&&<div style={{ width:3, height:'100%', background:h.col, borderRadius:2, opacity:.7, alignSelf:'stretch' }}/>}
              <div className="mono" style={{ fontSize:'.85rem', color:h.col, opacity:.8, paddingTop:isMobile?0:'.1rem' }}>{h.year}</div>
              <div>
                <div className="serif" style={{ fontSize:isMobile?'1rem':'1.08rem', fontWeight:400, color:'#151D18', lineHeight:1.35, marginBottom:'.5rem' }}>{h.title}</div>
                <div style={{ fontSize:'.84rem', color:'rgba(21,29,24,0.48)', lineHeight:1.72, fontWeight:300 }}>{h.desc}</div>
              </div>
              <div style={{ fontSize:'.78rem', color:'rgba(21,29,24,0.35)', fontStyle:'italic', textAlign:isMobile?'left':'right', paddingTop:isMobile?0:'.1rem' }}>{h.journal}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CONTACT ──────────────────────────────────────────────────────────────────

function Contact() {
  const [form,setForm]=useState({ name:'', email:'', type:'Biomarker Discovery', message:'' })
  const [sent,setSent]=useState(false)
  const [loading,setLoading]=useState(false)
  const { ref, vis } = useVisible(0.1)
  const isMobile = useIsMobile()

  const submit=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); setLoading(true)
    await fetch('/api/contact',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setLoading(false); setSent(true)
  }

  const inp:React.CSSProperties={ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid rgba(21,29,24,0.12)', padding:'.88rem 0', color:'#151D18', fontSize:'.93rem', fontFamily:'inherit', outline:'none', fontWeight:300, transition:'border-color .28s' }

  return (
    <section id="contact" style={{ background:'var(--sage-bg)', padding:isMobile?'5rem 1.4rem':'10rem 6rem', position:'relative', overflow:'hidden' }}>
      {/* Biology circle decorations */}
      <div style={{ position:'absolute', top:'10%', right:'5%', width:220, height:220, borderRadius:'50%', border:'1px solid rgba(28,62,45,0.08)', pointerEvents:'none', animation:'organelle-float 6s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', top:'15%', right:'8%', width:120, height:120, borderRadius:'50%', border:'1px solid rgba(194,72,43,0.08)', pointerEvents:'none', animation:'organelle-float 4s ease-in-out infinite .8s' }}/>

      <div ref={ref} style={{ maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:isMobile?'4rem':'6rem', opacity:vis?1:0, transform:vis?'none':'translateY(20px)', transition:'all .9s cubic-bezier(.16,1,.3,1)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.6rem', fontSize:'.6rem', letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(194,72,43,0.7)', marginBottom:'1.5rem' }}>
            <span style={{ width:22, height:1, background:'#C2482B', display:'block' }}/>Get in Touch<span style={{ width:22, height:1, background:'#C2482B', display:'block' }}/>
          </div>
          <h2 className="serif" style={{ fontSize:isMobile?'clamp(2.2rem,9vw,3rem)':'clamp(3rem,5vw,5.2rem)', fontWeight:300, lineHeight:1.05, color:'#151D18', marginBottom:'1.5rem' }}>
            Take the{' '}<em style={{ fontStyle:'italic', color:'#C2482B' }}>next step</em>
          </h2>
          <p style={{ fontSize:isMobile?'.9rem':'.98rem', color:'rgba(21,29,24,0.48)', maxWidth:520, margin:'0 auto', lineHeight:1.88, fontWeight:300 }}>
            Patients begin with a question. Clinicians begin with a panel. Both paths lead to the same architecture — interpreted from your perspective.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1.2fr', gap:isMobile?'3.5rem':'8rem', opacity:vis?1:0, transition:'opacity .9s .22s' }}>
          <div>
            {[{label:'Email',val:'info@precisionindex.com'},{label:'Locations',val:'Stockholm · London · Dubai'}].map((item,i)=>(
              <div key={i} style={{ display:'flex', gap:'1.2rem', alignItems:'baseline', marginBottom:'.85rem' }}>
                <span className="mono" style={{ fontSize:'.58rem', letterSpacing:'.16em', textTransform:'uppercase', color:'rgba(21,29,24,0.32)', width:68, flexShrink:0 }}>{item.label}</span>
                <span style={{ fontSize:'.9rem', color:'rgba(21,29,24,0.55)', wordBreak:'break-word' }}>{item.val}</span>
              </div>
            ))}
            <div style={{ marginTop:'2rem', display:'flex', flexDirection:'column', gap:'.6rem' }}>
              {['For Patients','For Clinicians','Discuss a partnership'].map((action,i)=>(
                <a key={i} href={i===0?'#indices':i===1?'#about':'#contact'}
                  style={{ padding:'.78rem 1.1rem', borderRadius:10, border:'1px solid rgba(28,62,45,0.1)', background:'transparent', color:'rgba(21,29,24,0.5)', fontSize:'.84rem', textDecoration:'none', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all .24s ease' }}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement; el.style.background='rgba(28,62,45,0.06)'; el.style.borderColor='rgba(28,62,45,0.22)'; el.style.color='#1C3E2D'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.borderColor='rgba(28,62,45,0.1)'; el.style.color='rgba(21,29,24,0.5)'}}
                >{action}<span style={{ color:'#C2482B', opacity:.55 }}>→</span></a>
              ))}
            </div>
          </div>

          <div>
            {sent ? (
              <div style={{ paddingTop:'2rem' }}>
                <div className="serif" style={{ fontSize:'2.2rem', fontWeight:300, color:'#151D18', marginBottom:'.7rem' }}>Message received.</div>
                <p style={{ color:'rgba(21,29,24,0.5)', fontSize:'.92rem', lineHeight:1.75 }}>We will be in touch within two business days.</p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1.4rem' }}>
                {[{l:'Full Name',k:'name',t:'text',p:'Dr. Jane Smith'},{l:'Email Address',k:'email',t:'email',p:'jane@institution.edu'}].map(field=>(
                  <div key={field.k}>
                    <label style={{ display:'block', fontSize:'.6rem', letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(21,29,24,0.35)', marginBottom:'.4rem' }}>{field.l}</label>
                    <input type={field.t} placeholder={field.p} value={(form as Record<string,string>)[field.k]} onChange={e=>setForm(f=>({...f,[field.k]:e.target.value}))} required style={inp}
                      onFocus={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(28,62,45,0.45)'}}
                      onBlur={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(21,29,24,0.12)'}}/>
                  </div>
                ))}
                <div>
                  <label style={{ display:'block', fontSize:'.6rem', letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(21,29,24,0.35)', marginBottom:'.4rem' }}>Service of Interest</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{...inp,cursor:'pointer',background:'transparent'}}>
                    {['Patient Enquiry','Clinic Partnership','The Seven Indices','Fertility Index','Organ Index','Vitality Index','Cancer Index','Genomics Index','General Enquiry'].map(o=><option key={o} style={{background:'#F7F5EF'}}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.6rem', letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(21,29,24,0.35)', marginBottom:'.4rem' }}>Message</label>
                  <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4} required placeholder="Describe your project or research enquiry…" style={{...inp,resize:'vertical'}}
                    onFocus={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(28,62,45,0.45)'}}
                    onBlur={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(21,29,24,0.12)'}}/>
                </div>
                <button type="submit" disabled={loading}
                  style={{ marginTop:'.4rem', background:'#1C3E2D', color:'#F7F5EF', border:'none', borderRadius:100, padding:'.95rem 2.8rem', fontSize:'.88rem', fontWeight:400, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, fontFamily:'inherit', transition:'all .3s ease', width:isMobile?'100%':'fit-content', boxShadow:'0 4px 22px rgba(28,62,45,0.2)', letterSpacing:'.02em' }}
                  onMouseEnter={e=>{ if (!loading) { const el=e.currentTarget as HTMLElement; el.style.background='#2e5c42'; el.style.boxShadow='0 6px 32px rgba(28,62,45,0.3)'; el.style.transform='translateY(-2px)' }}}
                  onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='#1C3E2D'; el.style.boxShadow='0 4px 22px rgba(28,62,45,0.2)'; el.style.transform='none' }}
                >{loading?'Sending…':'Send message'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  const isMobile=useIsMobile(700)
  const cols=[
    { title:'Company', links:[{l:'About',h:'#about'},{l:'Technology',h:'#technology'},{l:'Contact',h:'#contact'}] },
    { title:'The Indices', links:[{l:'Fertility Index',h:'#indices'},{l:'Organ Index',h:'#indices'},{l:'Vitality Index',h:'#indices'},{l:'Cancer Index',h:'#indices'}] },
    { title:'Patients & Clinics', links:[{l:'For Patients',h:'#indices'},{l:'For Clinicians',h:'#about'},{l:'Partner Clinics',h:'#contact'}] },
  ]
  return (
    <footer style={{ background:'var(--forest)', padding:isMobile?'3.5rem 1.4rem 2rem':'5.5rem 6rem 3rem', borderTop:'1px solid rgba(247,245,239,0.07)' }}>
      <div style={{ maxWidth:1300, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'2.2fr 1fr 1fr 1fr', gap:isMobile?'2.5rem':'4rem', marginBottom:isMobile?'2.5rem':'4.5rem' }}>
          <div>
            <div style={{ marginBottom:'1rem' }}><LogoMark size='1.05rem' onDark={true} /></div>
            <div className="mono" style={{ fontSize:'.5rem', letterSpacing:'.28em', textTransform:'uppercase', color:'rgba(247,245,239,0.25)', marginBottom:'1.3rem' }}>Precision 360 Biosystem · Clinical Proteomics</div>
            <p style={{ color:'rgba(247,245,239,0.3)', fontSize:'.83rem', lineHeight:1.85, maxWidth:290 }}>
              A new architecture for precision medicine. Powered by Olink proteomics, Illumina sequencing, and methylation arrays. Stockholm · London · Dubai.
            </p>
            <div style={{ marginTop:'1.5rem', padding:'1rem 1.2rem', background:'rgba(247,245,239,0.04)', border:'1px solid rgba(247,245,239,0.06)', borderRadius:10 }}>
              <p style={{ fontSize:'.7rem', color:'rgba(247,245,239,0.22)', lineHeight:1.72 }}>Olink® is a trademark of Olink Proteomics AB. Precision Index Discovery is not affiliated with Olink Proteomics AB.</p>
            </div>
          </div>
          {cols.map(col=>(
            <div key={col.title}>
              <div className="mono" style={{ fontSize:'.58rem', letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(247,245,239,0.28)', marginBottom:'1.2rem' }}>{col.title}</div>
              <ul style={{ display:'flex', flexDirection:'column', gap:'.7rem' }}>
                {col.links.map(l=>(
                  <li key={l.l}>
                    <a href={l.h} style={{ color:'rgba(247,245,239,0.35)', fontSize:'.84rem', textDecoration:'none', transition:'color .25s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(247,245,239,0.78)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(247,245,239,0.35)'}}
                    >{l.l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(247,245,239,0.07)', paddingTop:'1.6rem', display:'flex', flexDirection:isMobile?'column':'row', gap:isMobile?'.5rem':0, justifyContent:'space-between', alignItems:isMobile?'flex-start':'center' }}>
          <span style={{ color:'rgba(247,245,239,0.22)', fontSize:'.72rem' }}>© 2026 Precision Index Discovery. All rights reserved.</span>
          <span style={{ color:'rgba(247,245,239,0.16)', fontSize:'.7rem' }}>Stockholm, Sweden · Developed by Baina Agency</span>
        </div>
      </div>
    </footer>
  )
}

// ── HOME ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [scrolled,setScrolled]=useState(false)
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>60)
    window.addEventListener('scroll',fn)
    const handleClick=(e:MouseEvent)=>{
      const anchor=(e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement|null
      if (!anchor) return
      const id=anchor.getAttribute('href')?.slice(1)
      if (!id) return
      const el=document.getElementById(id)||(id==='hero'?document.querySelector('section') as HTMLElement|null:null)
      if (!el) return
      e.preventDefault()
      el.scrollIntoView({ behavior:'smooth', block:'start' })
    }
    document.addEventListener('click',handleClick)
    return ()=>{ window.removeEventListener('scroll',fn); document.removeEventListener('click',handleClick) }
  },[])

  return (
    <>
      <Head>
        <title>Precision Index Discovery — DECODE Proteomics Platform</title>
        <meta name="description" content="Next-generation protein biomarker discovery. DECODE — high-multiplex proteomics powered by Olink PEA technology for pharmaceutical, academic and clinical research." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Precision Index Discovery — DECODE Proteomics Platform" />
        <meta property="og:description" content="Decode the molecular landscape of disease. High-sensitivity, multiplexed protein biomarker discovery." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar scrolled={scrolled} />
      <main style={{ overflowX:'hidden' }}>
        <Hero />
        <StatsBar />
        <BiologicalComplexity />
        <PEATechnology />
        <ProductPortfolio />
        <About />
        <ResearchApplications />
        <Science />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
