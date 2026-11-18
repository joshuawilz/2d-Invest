'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Swal from 'sweetalert2'

export default function ManualDeposit() {
  const router = useRouter()
  
  // INITIALISATION À VIDE POUR ÉVITER LE BUG TOGO PAR DÉFAUT
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(5) // Réglé sur 5 secondes selon tes ordres
  const [form, setForm] = useState({ sender: "", ref: "" })
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(null)

  const merchantConfig = {
    TG: { name: "Togo", nets: [{ n: "TMONEY", v: "+22872018494", c: "#ff9800" }, { n: "FLOOZ", v: "+22898127546", c: "#00c896" }] },
    CI: { name: "Côte d'Ivoire", nets: [{ n: "Orange Money", v: "+22507XXXXXXXX", c: "#ff6b00" }, { n: "MTN Money", v: "+22505XXXXXXXX", c: "#ffcc00" }] },
    BJ: { name: "Bénin", nets: [{ n: "MTN Bénin", v: "+229XXXXXXXX", c: "#ffcc00" }, { n: "Moov Bénin", v: "+229XXXXXXXX", c: "#00c896" }] },
    ML: { name: "Mali", nets: [{ n: "Orange Mali", v: "+223XXXXXXXX", c: "#ff6b00" }, { n: "Moov Mali", v: "+223XXXXXXXX", c: "#00c896" }] },
    BF: { name: "Burkina", nets: [{ n: "Orange BF", v: "+226XXXXXXXX", c: "#ff6b00" }, { n: "Moov BF", v: "+226XXXXXXXX", c: "#00c896" }] },
    SN: { name: "Sénégal", nets: [{ n: "Wave", v: "+221XXXXXXXX", c: "#00aaff" }, { n: "Orange SN", v: "+221XXXXXXXX", c: "#ff6b00" }] }
  }

  useEffect(() => {
    const c = localStorage.getItem("pending_deposit_country")
    const a = localStorage.getItem("pending_deposit_amount") || "2000"
    const p = localStorage.getItem("phone") || ""

    if (!c || !merchantConfig[c]) {
      router.push("/")
      return
    }

    // ON FIXE LES DONNÉES RÉELLES IMMÉDIATEMENT
    setData({ phone: p, amount: a, country: c })

    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); setLoading(false); return 0; }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  const handleRefChange = (val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    setForm({ ...form, ref: clean })
  }

  const handleCopy = (val, idx) => {
    navigator.clipboard.writeText(val.replace(/\s/g, ''))
    setCopied(idx)
    if (window.navigator.vibrate) window.navigator.vibrate(50)
    setTimeout(() => setCopied(null), 2000)
  }

  const sendProof = async () => {
    if (form.sender.length < 8 || form.ref.length < 4) {
      Swal.fire({ title: 'Attention', text: 'Veuillez remplir tous les champs.', icon: 'warning', background: '#111', color: '#fff' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem("user_id_code"),
          amount: data.amount,
          senderNumber: form.sender,
          smsReference: form.ref,
          country: data.country
        })
      })
      const result = await res.json()
      if (result.success) router.push("/deposit-confirm")
      else throw new Error(result.message)
    } catch (e) {
      Swal.fire({ title: 'Erreur', text: e.message, icon: 'error', background: '#111', color: '#fff' })
    } finally { setSubmitting(false) }
  }

  // PROTECTION CONTRE LE RENDU PRÉMATURÉ
  if (!data) return <div style={{background:'#000', height:'100vh'}} />

  const active = merchantConfig[data.country]

  if (loading) return (
    <div style={s.loaderPage}>
      <div style={s.spinner}></div>
      <p style={s.loadText}>SYSTÈME AUTOMATIQUE INDISPONIBLE</p>
      <p style={s.loadSub}>BASCULEMENT VERS LA PASSERELLE MANUELLE {active.name.toUpperCase()}...</p>
      <div style={s.progress}><div style={{...s.bar, width: `${(1 - timer/5) * 100}%`}}></div></div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.infoBanner}>
          ⚠️ Le dépôt automatique ne répond pas. Veuillez suivre les instructions manuelles ci-dessous.
        </div>

        <div style={s.header}>
          <span style={s.status}>● MODE MANUEL ACTIF</span>
          <div style={s.badge}>{active.name}</div>
        </div>

        <h2 style={s.title}>Finaliser le dépôt</h2>
        <p style={s.desc}>Envoyez exactement <b style={{color: '#00c896'}}>{parseInt(data.amount).toLocaleString()} F</b> via :</p>

        <div style={s.netBox}>
          {active.nets.map((n, i) => (
            <div key={i} style={{...s.netRow, borderColor: n.c + '55'}}>
              <div style={s.netInfo}>
                <span style={{color: n.c, fontSize: '10px', fontWeight: 'bold'}}>{n.n}</span>
                <div style={s.num}>{n.v}</div>
              </div>
              <button onClick={() => handleCopy(n.v, i)} style={{...s.copyBtn, background: n.c}}>
                {copied === i ? "OK" : "COPIER"}
              </button>
            </div>
          ))}
        </div>

        <div style={s.form}>
          <div style={s.inputBox}>
            <label style={s.label}>NUMÉRO D'ENVOI</label>
            <input type="tel" placeholder="Votre numéro" style={s.input} 
              value={form.sender} onChange={e => setForm({...form, sender: e.target.value})} />
          </div>

          <div style={s.inputBox}>
            <label style={s.label}>RÉFÉRENCE / ID TRANSACTION</label>
            <input type="text" placeholder="ID Reçu par SMS" style={s.input} 
              value={form.ref} onChange={e => handleRefChange(e.target.value)} />
          </div>

          <button onClick={sendProof} disabled={submitting} style={s.btn}>
            {submitting ? "VÉRIFICATION..." : "J'AI ENVOYÉ LE PAIEMENT"}
          </button>
        </div>

        <button onClick={() => router.back()} style={s.back}>ANNULER</button>
      </div>
      <style jsx global>{`
        body { background: #000; margin: 0; font-family: sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const s = {
  page: { background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" },
  loaderPage: { background: "#000", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px" },
  spinner: { width: "35px", height: "35px", border: "3px solid #111", borderTopColor: "#00c896", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" },
  loadText: { color: "#ff4444", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px" },
  loadSub: { color: "#666", fontSize: "11px", marginTop: "5px" },
  progress: { width: "120px", height: "2px", background: "#111", marginTop: "20px", borderRadius: "5px", overflow: "hidden" },
  bar: { height: "100%", background: "#00c896", transition: "width 0.5s ease" },
  card: { background: "#080808", width: "100%", maxWidth: "380px", borderRadius: "24px", border: "1px solid #1a1a1a", padding: "24px" },
  infoBanner: { background: "rgba(255, 68, 68, 0.1)", color: "#ff4444", padding: "12px", borderRadius: "12px", fontSize: "11px", marginBottom: "20px", border: "1px solid rgba(255, 68, 68, 0.2)", lineHeight: "1.4" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  status: { color: "#00c896", fontSize: "9px", fontWeight: "bold" },
  badge: { background: "#111", color: "#fff", padding: "5px 12px", borderRadius: "8px", fontSize: "10px", border: "1px solid #222" },
  title: { color: "#fff", fontSize: "22px", margin: "0 0 5px 0" },
  desc: { color: "#555", fontSize: "14px", margin: "0 0 25px 0" },
  netBox: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "25px" },
  netRow: { background: "#000", border: "1px solid", padding: "14px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  num: { color: "#fff", fontSize: "17px", fontWeight: "bold" },
  copyBtn: { border: "none", color: "#000", padding: "8px 14px", borderRadius: "8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputBox: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "10px", color: "#444", fontWeight: "bold" },
  input: { background: "#000", border: "1px solid #1a1a1a", padding: "15px", borderRadius: "12px", color: "#fff", outline: "none" },
  btn: { background: "#fff", color: "#000", border: "none", padding: "18px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  back: { background: "none", border: "none", color: "#333", width: "100%", marginTop: "15px", fontSize: "11px", cursor: "pointer" }
}