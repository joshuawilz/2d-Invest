'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function DepositPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("KkiaPay") 
  const [manualPhone, setManualPhone] = useState("")
  const [reference, setReference] = useState("")
  const [screenshot, setScreenshot] = useState(null)
  const [loading, setLoading] = useState(false)

  const adminNumbers = {
    moov: "+22898127546",
    mix: "+22872018494"
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Numéro copié : " + text)
  }

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.kkiapay.me/k.js"
    script.async = true
    document.body.appendChild(script)

    const checkUser = async () => {
      const phone = localStorage.getItem("phone")
      if (!phone) return router.push("/auth/login")
      const { data } = await supabase.from("users").select("*").eq("phone", phone).single()
      if (data) setUser(data)
    }
    checkUser()
  }, [router])

  const handleKkiaPay = () => {
    if (!amount || amount < 2000) return alert("Le montant minimum est de 2 000 FCFA")
    if (window.openKkiapayWidget) {
      window.openKkiapayWidget({
        amount: amount,
        position: "center",
        callback: "",
        data: "Recharge 2D Invest",
        key: "787fd930093411f1af0faf42cfae880d",
        sandbox: true 
      })
      window.addEventListener("success", async (e) => {
        setLoading(true)
        const newBalance = (user.recharge_balance || 0) + Number(amount)
        const { error } = await supabase.from("users").update({ recharge_balance: newBalance }).eq("phone", user.phone)
        if (!error) {
          alert("✅ Paiement réussi ! Votre solde sera mis à jour d'ici 3 minutes.")
          router.push("/dashboard")
        }
        setLoading(false)
      })
    } else { alert("Le module charge encore...") }
  }

  const handleManualSubmit = async () => {
    if (!amount || amount < 2000) return alert("Minimum 2 000 FCFA")
    if (!manualPhone || !reference || !screenshot) return alert("Complétez tous les champs.")
    setLoading(true)
    try {
      const fileExt = screenshot.name.split('.').pop()
      const fileName = `${user.phone}_${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('reçus').upload(fileName, screenshot)
      if (uploadError) throw uploadError
      const { error } = await supabase.from("DEPOSITS").insert({
        user_phone: user.phone, amount: Number(amount), method: "MANUAL",
        sender: manualPhone, reference: reference, proof_url: fileName, status: "pending"
      })
      if (!error) {
        alert("📩 Reçu envoyé ! Votre compte sera crédité dans 3 minutes après vérification.")
        router.push("/dashboard")
      }
    } catch (err) { alert("Erreur : " + err.message) } finally { setLoading(false) }
  }

  if (!user) return <div style={{background:"#0a0a0a", height:"100vh"}}></div>

  return (
    <div style={containerStyle}>
      <div style={{display:"flex", alignItems:"center", gap:15, marginBottom:25}}>
        <button onClick={() => router.back()} style={backBtn}>❮</button>
        <h2 style={{margin:0, fontSize:20}}>Rechargement</h2>
      </div>

      <div style={cardStyle}>
        <p style={labelStyle}>Montant à recharger (FCFA)</p>
        <input type="number" placeholder="Min: 2000" value={amount} onChange={(e)=>setAmount(e.target.value)} style={inputAmount} />
      </div>

      <div style={{marginTop:25}}>
        <div onClick={() => setMethod("KkiaPay")} style={{...methodCard, border: method === "KkiaPay" ? "1px solid #00c896" : "1px solid #222"}}>
           🚀 <span>Paiement KkiaPay (Auto)</span>
        </div>
        <div onClick={() => setMethod("Manual")} style={{...methodCard, border: method === "Manual" ? "1px solid #ff9800" : "1px solid #222"}}>
           📑 <span>Transfert Manuel (T-Money/Moov)</span>
        </div>
      </div>

      <div style={{marginTop:25}}>
        {method === "KkiaPay" ? (
          <div>
            <button onClick={handleKkiaPay} style={mainBtn}>TESTER LE PAIEMENT</button>
            <p style={timeNotice}>⏳ Temps de traitement : ~3 min</p>
          </div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div style={infoBox}>
              <p style={{margin:0, fontSize:12, opacity:0.7, marginBottom:10}}>Cliquez sur un numéro pour le copier :</p>
              
              <div onClick={() => copyToClipboard(adminNumbers.moov)} style={copyRow}>
                <div style={{textAlign:'left'}}>
                  <span style={{fontSize:10, color:'#ff9800', display:'block'}}>MOOV MONEY</span>
                  <span style={{fontSize:16, fontWeight:'bold'}}>{adminNumbers.moov}</span>
                </div>
                <span style={copyBadge}>Copier</span>
              </div>

              <div onClick={() => copyToClipboard(adminNumbers.mix)} style={{...copyRow, marginTop:10}}>
                <div style={{textAlign:'left'}}>
                  <span style={{fontSize:10, color:'#00c896', display:'block'}}>MIX BY YAS (T-MONEY)</span>
                  <span style={{fontSize:16, fontWeight:'bold'}}>{adminNumbers.mix}</span>
                </div>
                <span style={copyBadge}>Copier</span>
              </div>

              <p style={{...timeNotice, marginTop:15}}>⏳ Crédité sous 3 minutes</p>
            </div>

            <input type="text" placeholder="Votre numéro d'envoi" value={manualPhone} onChange={(e)=>setManualPhone(e.target.value)} style={inputField} />
            <input type="text" placeholder="ID de la transaction" value={reference} onChange={(e)=>setReference(e.target.value)} style={inputField} />
            <label style={uploadArea}>
               {screenshot ? "✅ Reçu sélectionné" : "📸 Cliquez pour joindre le reçu"}
               <input type="file" accept="image/*" onChange={(e)=>setScreenshot(e.target.files[0])} style={{display:"none"}} />
            </label>
            <button onClick={handleManualSubmit} disabled={loading} style={{...mainBtn, background:"#ff9800"}}>
               {loading ? "Envoi..." : "VALIDER LE TRANSFERT"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* --- STYLES --- */
const containerStyle = { background: "#0a0a0a", minHeight: "100vh", color: "white", padding: 25, fontFamily: "sans-serif" }
const backBtn = { background: "#1a1a1a", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", cursor:"pointer" }
const cardStyle = { background: "#111", padding: 20, borderRadius: 20, border: "1px solid #222" }
const labelStyle = { fontSize: 11, opacity: 0.5, marginBottom: 5 }
const inputAmount = { background: "none", border: "none", color: "white", fontSize: 28, fontWeight: "bold", width: "100%", outline: "none" }
const methodCard = { background: "#111", padding: 18, borderRadius: 15, marginBottom: 10, cursor:"pointer", display:"flex", gap:10 }
const mainBtn = { width: "100%", padding: 18, background: "#00c896", color: "white", border: "none", borderRadius: 15, fontWeight: "bold", cursor:"pointer" }
const infoBox = { background: "#1a1a1a", padding: 15, borderRadius: 15, textAlign: "center", border: "1px dashed #333" }
const inputField = { background: "#111", border: "1px solid #222", padding: 15, borderRadius: 12, color: "white", outline:"none" }
const uploadArea = { border: "2px dashed #333", padding: 15, borderRadius: 12, textAlign: "center", fontSize: 13, cursor: "pointer", background: "#111", color: "#888" }
const timeNotice = { textAlign: "center", fontSize: 11, opacity: 0.5, color: "#ffd700" }

const copyRow = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  background: '#000', 
  padding: '12px 15px', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  border: '1px solid #222' 
}
const copyBadge = { 
  fontSize: 10, 
  background: '#333', 
  padding: '4px 8px', 
  borderRadius: '6px', 
  color: '#00c896', 
  fontWeight: 'bold', 
  textTransform: 'uppercase' 
}