'use client'

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DepositConfirm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = searchParams.get("amount")
  const method = searchParams.get("method")
  
  const [transactionId, setTransactionId] = useState("")
  const [loading, setLoading] = useState(false)

  // TES NUMÉROS DE RÉCEPTION (À MODIFIER ICI)
  const paymentNumbers = {
    Orange: "07 00 00 00 00",
    MTN: "05 00 00 00 00",
    Moov: "01 01 01 01 01",
    Wave: "TRANSFERT DIRECT WAVE"
  }

  const handleFinalize = async () => {
    if (!transactionId) return alert("Veuillez entrer l'ID de transaction reçu par SMS")
    setLoading(true)

    try {
      // On met à jour la dernière demande de dépôt de l'utilisateur avec l'ID de transaction
      const phone = localStorage.getItem("phone")
      const { error } = await supabase
        .from("deposits")
        .update({ transaction_id: transactionId })
        .eq("user_phone", phone)
        .eq("status", "pending")
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error) {
        alert("Preuve de paiement reçue ! Votre compte sera crédité après vérification (5-15 min).")
        router.push("/dashboard")
      } else {
        alert("Erreur de mise à jour.")
      }
    } catch (err) {
      alert("Erreur technique.")
    }
    setLoading(false)
  }

  return (
    <div style={container}>
      <div style={header}>
        <button onClick={() => router.back()} style={backBtn}>←</button>
        <h2 style={{margin:0}}>Confirmation</h2>
      </div>

      <div style={instructionCard}>
        <p style={{textAlign:'center', fontSize:'14px', opacity:0.8}}>Envoyez exactement</p>
        <h1 style={{textAlign:'center', color:'#00c896', margin:'10px 0'}}>{amount} FCFA</h1>
        <p style={{textAlign:'center', fontSize:'12px', background:'#222', padding:'10px', borderRadius:'10px'}}>
           Via <b>{method} Money</b>
        </p>

        <div style={numberBox}>
          <p style={{fontSize:'11px', opacity:0.6, margin:0}}>NUMÉRO DE RÉCEPTION :</p>
          <h2 style={{margin:'5px 0', letterSpacing:'1px'}}>{paymentNumbers[method] || "Contactez le support"}</h2>
          <p style={{fontSize:'10px', color:'#ffd700'}}>Nom du compte: 2D INVEST OFFICIAL</p>
        </div>
      </div>

      <div style={inputSection}>
        <p style={label}>ID de Transaction (Ref)</p>
        <input 
          style={input} 
          placeholder="Copiez l'ID reçu par SMS ici..." 
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />
        <p style={{fontSize:'10px', opacity:0.5, marginTop:'10px'}}>
          Exemple : 1234567890 ou PP2304...
        </p>

        <button 
          onClick={handleFinalize} 
          disabled={loading}
          style={{...confirmBtn, opacity: loading ? 0.6 : 1}}
        >
          {loading ? "Vérification..." : "J'AI EFFECTUÉ LE PAIEMENT"}
        </button>
      </div>

      <div style={warningBox}>
        <p style={{margin:0, fontSize:'11px'}}>
          ⚠️ Attention : Toute fausse déclaration d'ID de transaction peut entraîner la suspension définitive de votre compte.
        </p>
      </div>
    </div>
  )
}

/* --- STYLES --- */
const container = { minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: '20px', fontFamily: 'sans-serif' }
const header = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }
const backBtn = { background: 'none', border: 'none', color: 'white', fontSize: '24px' }
const instructionCard = { background: '#111', padding: '25px', borderRadius: '25px', border: '1px solid #222', marginBottom: '20px' }
const numberBox = { marginTop: '20px', padding: '15px', background: '#000', borderRadius: '15px', border: '1px dashed #00c896', textAlign: 'center' }
const inputSection = { background: '#111', padding: '25px', borderRadius: '25px', border: '1px solid #222' }
const label = { fontSize: '13px', opacity: 0.6, marginBottom: '10px', display: 'block' }
const input = { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: 'white', outline: 'none' }
const confirmBtn = { width: '100%', background: '#00c896', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px', marginTop: '20px' }
const warningBox = { marginTop: '20px', padding: '15px', borderRadius: '15px', background: '#ff4d4d10', border: '1px solid #ff4d4d30', color: '#ff4d4d' }