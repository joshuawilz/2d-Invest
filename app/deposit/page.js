'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { notifyError, notifySuccess } from "../../lib/alerts"

export default function DepositPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [amount, setAmount] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("TG")
  const [showMethods, setShowMethods] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(true)

  const [cryptoEquivalent, setCryptoEquivalent] = useState("0.00")
  const [usdtToFcfaRate, setUsdtToFcfaRate] = useState(615) 
  const [dbNetworkFee, setDbNetworkFee] = useState(1000) // Valeur de repli (environ 1.6 USDT)
  const [isCalculating, setIsCalculating] = useState(false)
  
  const SERVICE_FEE_PCT = 0.01; 
  const SLIPPAGE_BUFFER = 3; 

  const countries = [
    { code: "TG", name: "Togo", flag: "🇹🇬" },
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
    { code: "BJ", name: "Bénin", flag: "🇧🇯" },
    { code: "SN", name: "Sénégal", flag: "🇸🇳" },
    { code: "ML", name: "Mali", flag: "🇲🇱" },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫" }
  ]

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setIsDark(savedTheme === 'dark')

    // Récupération immédiate du dernier taux en cache pour la rapidité
    const cachedRate = localStorage.getItem('last_usdt_rate')
    if (cachedRate) setUsdtToFcfaRate(Number(cachedRate))

    const init = async () => {
      const phone = localStorage.getItem("phone")
      if (!phone) return router.push("/")
      
      // 1. Synchronisation Utilisateur
      const { data: userData } = await supabase.from("users").select("*").eq("phone", phone).single()
      if (userData) {
        setUser(userData)
        setSelectedCountry(userData.country_code || "TG")
      }

      // 2. Synchronisation Frais Réseau (app_settings)
      const { data: settings } = await supabase.from("app_settings").select("key, value")
      if (settings) {
        const tronFee = settings.find(s => s.key === 'tron_network_fee')?.value
        if (tronFee) setDbNetworkFee(Number(tronFee))
      }

      // 3. Mise à jour Taux Live
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const dataRate = await res.json()
        if (dataRate.rates.XOF) {
          const newRate = dataRate.rates.XOF
          setUsdtToFcfaRate(newRate)
          localStorage.setItem('last_usdt_rate', newRate.toString())
        }
      } catch (e) { console.log("Utilisation du taux local") }
    }
    init()
  }, [router])

  // Calcul fluide avec animation haptique
  useEffect(() => {
    setIsCalculating(true)
    const timer = setTimeout(() => {
      const cleanAmount = parseFloat(amount)
      if (!isNaN(cleanAmount) && cleanAmount >= 2000) {
        const secureRate = usdtToFcfaRate - SLIPPAGE_BUFFER; 
        const baseInUsdt = cleanAmount / secureRate;
        const networkFeeInUsdt = dbNetworkFee / secureRate;
        
        // Formule : (Montant Voulu + 1%) + Frais Réseau Réels
        const totalToPay = (baseInUsdt * (1 + SERVICE_FEE_PCT)) + networkFeeInUsdt;
        setCryptoEquivalent(totalToPay.toFixed(2))
      } else {
        setCryptoEquivalent("0.00")
      }
      setIsCalculating(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [amount, usdtToFcfaRate, dbNetworkFee])

  const handleOpenMethods = () => {
    const cleanAmount = Math.floor(Number(amount))
    if (!cleanAmount || cleanAmount < 2000) return notifyError("Minimum 2 000 FCFA")
    setShowMethods(true)
  }

  const handleMobilePay = async () => {
    if (loading) return
    setShowMethods(false)
    setLoading(true)
    try {
      const response = await fetch('/api/payments/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id_code,
          phone: user.phone,
          amount: Math.floor(Number(amount)),
          country: selectedCountry
        })
      })
      const result = await response.json()
      if (result.success && result.payment_url) window.location.href = result.payment_url
      else router.push("/deposit/manual")
    } catch (err) { router.push("/deposit/manual") } 
    finally { setLoading(false) }
  }

  const handleCryptoPay = async () => {
    if (loading) return
    setShowMethods(false)
    setLoading(true)
    try {
      const response = await fetch('/api/payments/crypto/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdCode: user.user_id_code,
          amountCfa: Math.floor(Number(amount)),
          cryptoAmount: cryptoEquivalent,
          rateUsed: usdtToFcfaRate - SLIPPAGE_BUFFER,
          networkFeeApplied: dbNetworkFee
        })
      })
      const result = await response.json()
      if (result.success && result.payment_url) window.location.href = result.payment_url
      else notifyError("Erreur", result.error || "Échec génération")
    } catch (err) { notifyError("Échec Réseau", "Serveur injoignable") } 
    finally { setLoading(false) }
  }

  if (!user) return <div style={{background: isDark ? "#050505" : "#fbfbfb", height:"100vh"}}></div>

  return (
    <div style={{...s.container, background: isDark ? "#050505" : "#fbfbfb", color: isDark ? "#fff" : "#000"}}>
      
      <div style={s.header}>
        <button onClick={() => router.push('/dashboard')} style={{...s.backBtn, background: isDark ? "#111" : "#eee", color: isDark ? "#fff" : "#000"}}>❮</button>
        <div style={{textAlign:'right'}}>
            <span style={s.label}>COMPTE CLIENT</span>
            <span style={{fontSize:13, fontWeight:'900', color:'#00c896', display:'block'}}>ID: {user.user_id_code}</span>
        </div>
      </div>

      <div style={{...s.balanceCard, background: isDark ? "#0d0d0d" : "#fff", borderColor: isDark ? "#1a1a1a" : "#f0f0f0"}}>
        <p style={s.label}>SOLDE DE RECHARGE ACTUEL</p>
        <h2 style={s.balanceText}>{(user.recharge_balance || 0).toLocaleString()} <span style={{fontSize:14}}>FCFA</span></h2>
        <div style={{height:3, width:25, background:'#00c896', margin:'10px auto', borderRadius:5}}></div>
      </div>

      <div style={{...s.inputCard, background: isDark ? "#0d0d0d" : "#fff", borderColor: isDark ? "#1a1a1a" : "#f0f0f0", marginBottom: 15}}>
        <p style={s.label}>PAYS DE RÉSIDENCE</p>
        <select 
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          style={{...s.selectInput, color: isDark ? "#fff" : "#000", background: isDark ? "#111" : "#f9f9f9"}}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} &nbsp; {c.name}</option>
          ))}
        </select>
      </div>

      <div style={{...s.inputCard, background: isDark ? "#0d0d0d" : "#fff", borderColor: isDark ? "#1a1a1a" : "#f0f0f0"}}>
        <p style={s.label}>MONTANT À DÉPOSER (FCFA)</p>
        <input 
          type="number" 
          value={amount} 
          onChange={(e)=>setAmount(e.target.value)} 
          style={{...s.amountInput, color: isDark ? "#fff" : "#000"}} 
          placeholder="0" 
        />
        
        <div style={{marginTop: 15, paddingTop: 15, borderTop: isDark ? '1px solid #1a1a1a' : '1px solid #f0f0f0', textAlign: 'center'}}>
          <p style={{fontSize:10, opacity:0.6, margin:0, fontWeight:'bold'}}>TOTAL À ENVOYER</p>
          <p style={{
              fontSize:28, 
              fontWeight:'900', 
              color:'#ff9800', 
              margin:'4px 0 0 0',
              opacity: isCalculating ? 0.4 : 1,
              transition: '0.2s ease'
            }}>
            {cryptoEquivalent} <span style={{fontSize:16}}>USDT</span>
          </p>
          <p style={{fontSize:9, color: isDark ? '#444' : '#ccc', marginTop:8, fontWeight:'700'}}>
            * Crédit immédiat de {Number(amount).toLocaleString()} FCFA après confirmation
          </p>
        </div>
      </div>

      <div style={{marginTop: 30}}>
        <button onClick={handleOpenMethods} style={{...s.mainBtn, opacity: loading ? 0.6 : 1}} disabled={loading}>
          {loading ? "TRAITEMENT..." : "RECHARGER MAINTENANT"}
        </button>
      </div>

      {showMethods && (
        <div style={s.modalOverlay} onClick={() => !loading && setShowMethods(false)}>
          <div style={{...s.bottomSheet, background: isDark ? "#0d0d0d" : "#fff"}} onClick={(e) => e.stopPropagation()}>
            <div style={s.pullBar}></div>
            <h3 style={{textAlign: 'center', fontSize: 13, fontWeight: '900', marginBottom: 25, letterSpacing:1}}>MODE DE PAIEMENT</h3>

            <div style={{...s.paymentOption, borderColor: isDark ? "#1a1a1a" : "#eee"}} onClick={handleMobilePay}>
              <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                <div style={s.iconWrapper}>📱</div>
                <div>
                  <p style={{fontSize: 12, fontWeight: '900', margin: 0}}>MOBILE MONEY</p>
                  <p style={{fontSize: 9, opacity: 0.5, margin: 0}}>T-Money, Flooz, Wave, Orange...</p>
                </div>
              </div>
              <span style={{fontSize: 14, color: '#00c896'}}>❯</span>
            </div>

            <div style={{...s.paymentOption, borderColor: isDark ? "#1a1a1a" : "#eee", marginTop: 15}} onClick={handleCryptoPay}>
              <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                <div style={{...s.iconWrapper, background: 'rgba(255,152,0,0.1)', color: '#ff9800'}}>🪙</div>
                <div>
                  <p style={{fontSize: 12, fontWeight: '900', margin: 0}}>CRYPTOMONNAIES</p>
                  <p style={{fontSize: 9, opacity: 0.5, margin: 0}}>USDT (TRC20 / BEP20)</p>
                </div>
              </div>
              <span style={{fontSize: 14, color: '#ff9800'}}>❯</span>
            </div>

            <div style={{marginTop: 20, textAlign:'center'}}>
                <p style={{fontSize:8, opacity:0.4, fontWeight:'bold', textTransform:'uppercase'}}>Sécurité Blockchain Active</p>
            </div>

            <button onClick={() => setShowMethods(false)} style={s.cancelBtn}>ANNULER</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}

const s = {
  container: { minHeight: "100vh", padding: "20px", fontFamily: "system-ui", transition: 'background 0.3s' },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  backBtn: { border: "none", width: 42, height: 42, borderRadius: "14px", cursor:"pointer", display:'flex', alignItems:'center', justifyContent:'center' },
  balanceCard: { padding: "25px 20px", borderRadius: 28, border: "1px solid", textAlign:'center', marginBottom:20 },
  balanceText: { margin:0, color:'#00c896', fontSize: 34, fontWeight:'900', letterSpacing: '-1px' },
  inputCard: { padding: "20px", borderRadius: 24, border: "1px solid" },
  label: { fontSize: 9, opacity: 0.5, marginBottom: 10, fontWeight:'900', letterSpacing:'1.2px', textTransform:'uppercase' },
  selectInput: { width: "100%", padding: "16px", borderRadius: "14px", border: "1px solid #222", outline: "none", fontSize: 14, fontWeight: "900" },
  amountInput: { background: "none", border: "none", fontSize: 36, fontWeight: "900", width: "100%", outline: "none", textAlign:'center', letterSpacing:'-1px' },
  mainBtn: { width: "100%", padding: "20px", background: "#00c896", color: "black", border: "none", borderRadius: 20, fontWeight: "900", fontSize: 15, cursor:"pointer", boxShadow: '0 10px 20px rgba(0,200,150,0.2)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, backdropFilter: 'blur(8px)' },
  bottomSheet: { width: '100%', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: '20px 24px 40px 24px', animation: 'slideUp 0.4s cubic-bezier(0, 0.55, 0.45, 1)' },
  pullBar: { width: 45, height: 5, background: '#222', borderRadius: 10, margin: '0 auto 25px auto' },
  paymentOption: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: 22, border: '1px solid', cursor: 'pointer', transition: '0.2s' },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, background: 'rgba(0,200,150,0.1)', color: '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  cancelBtn: { width: "100%", padding: "15px", background: "none", color: "#666", border: "none", fontWeight: "900", fontSize: 12, cursor:"pointer", marginTop: 15 }
}