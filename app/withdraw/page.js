'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Withdraw() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [wallets, setWallets] = useState([]) 
  const [selectedWalletId, setSelectedWalletId] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const phone = localStorage.getItem("phone")
      if (!phone) return router.push("/auth/login")

      // 1. Récupérer le solde
      const { data: userData } = await supabase.from("users").select("withdraw_balance").eq("phone", phone).single()
      if (userData) setBalance(userData.withdraw_balance || 0)

      // 2. Récupérer les portefeuilles enregistrés
      const { data: walletData } = await supabase.from("wallets").select("*").eq("user_phone", phone)
      if (walletData) setWallets(walletData)
      
      setFetching(false)
    }
    fetchData()
  }, [router])

  const handleWithdraw = async () => {
    const val = parseFloat(amount)
    const wallet = wallets.find(w => w.id === selectedWalletId)

    if (!val || val < 1000) return alert("Le minimum est de 1000 F")
    if (val > balance) return alert("Solde insuffisant")
    if (!wallet) return alert("Sélectionnez un portefeuille")

    setLoading(true)
    try {
      const phone = localStorage.getItem("phone")
      const { error } = await supabase.from("withdrawals").insert([{
        user_phone: phone,
        amount: val,
        method: wallet.network,
        receiver_phone: wallet.number,
        status: "pending"
      }])

      if (!error) {
        await supabase.from("users").update({ withdraw_balance: balance - val }).eq("phone", phone)
        alert("Retrait envoyé ! Validation sous 24h.")
        router.push("/dashboard")
      }
    } catch (err) { alert("Erreur technique") }
    setLoading(false)
  }

  if (fetching) return <div style={{background:'#0a0a0a', height:'100vh'}}></div>

  return (
    <div style={container}>
      <div style={header}>
        <button onClick={() => router.back()} style={backBtn}>←</button>
        <h2 style={{margin:0}}>Retrait</h2>
      </div>

      <div style={balanceCard}>
        <p style={{fontSize:'12px', opacity:0.6}}>SOLDE DISPONIBLE</p>
        <h1 style={{color:'#00c896', margin:'5px 0'}}>{balance.toLocaleString()} F</h1>
      </div>

      <div style={card}>
        {wallets.length > 0 ? (
          <>
            <p style={label}>Montant à retirer</p>
            <input 
              type="number" 
              placeholder="Ex: 5000" 
              style={input} 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <p style={label}>Portefeuille de réception</p>
            <select 
              style={selectStyle} 
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
            >
              <option value="">Cliquer pour choisir...</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.network} — {w.number}
                </option>
              ))}
            </select>

            <button 
              onClick={handleWithdraw} 
              disabled={loading} 
              style={{...submitBtn, opacity: loading ? 0.6 : 1}}
            >
              {loading ? "Chargement..." : "CONFIRMER LE RETRAIT"}
            </button>
          </>
        ) : (
          <div style={emptyState}>
            <div style={{fontSize:'40px', marginBottom:'15px'}}>🏦</div>
            <h3 style={{margin:'0 0 10px 0'}}>Aucun compte configuré</h3>
            <p style={{fontSize:'13px', opacity:0.6, marginBottom:'20px'}}>Vous devez enregistrer un compte Orange, MTN ou Wave avant de pouvoir retirer.</p>
            <button 
              onClick={() => router.push("/settings/wallet")} 
              style={setupBtn}
            >
              CONFIGURER MON PORTEFEUILLE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* --- STYLES --- */
const container = { minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: '20px', fontFamily: 'sans-serif' }
const header = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }
const backBtn = { background: 'none', border: 'none', color: 'white', fontSize: '24px' }
const balanceCard = { background: '#111', padding: '25px', borderRadius: '25px', textAlign: 'center', border: '1px solid #222', marginBottom: '20px' }
const card = { background: '#111', padding: '25px', borderRadius: '28px', border: '1px solid #222' }
const label = { fontSize: '12px', opacity: 0.5, marginBottom: '10px', marginTop: '15px', display:'block' }
const input = { width: '100%', background: '#000', border: '1px solid #333', padding: '16px', borderRadius: '15px', color: 'white', outline:'none', fontSize:'16px' }
const selectStyle = { width: '100%', background: '#000', border: '1px solid #333', padding: '16px', borderRadius: '15px', color: 'white', outline:'none', fontSize:'16px' }
const submitBtn = { width: '100%', background: '#00c896', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold', marginTop: '25px' }
const emptyState = { textAlign: 'center', padding: '20px 0' }
const setupBtn = { width: '100%', background: '#ffd700', color: '#000', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', fontSize: '13px' }