'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function Commandes() {
  const router = useRouter()
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [isDark, setIsDark] = useState(true)

  // ÉTATS POUR LE MODAL D'INVESTISSEMENT
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [investAmount, setInvestAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rechargeBalance, setRechargeBalance] = useState(0)
  const [withdrawBalance, setWithdrawBalance] = useState(0)
  
  // ÉTAT POUR LES NOTIFICATIONS INTERNES (SANS ALERT)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  // --- RÉCUPÉRATION DES DONNÉES (LOGIQUE SÉCURISÉE) ---
  const fetchMyInvestments = useCallback(async () => {
    const phone = localStorage.getItem("userPhone") || localStorage.getItem("phone");
    
    if (!phone) {
      return router.push("/register");
    }

    try {
      // 1. Mise à jour des gains quotidiens via RPC
      await supabase.rpc('process_daily_roi');

      // 2. Lecture des investissements (Triés par date)
      const { data: invData, error: invError } = await supabase
        .from("investments")
        .select("*")
        .eq("user_phone", phone)
        .order('created_at', { ascending: false });

      if (invError) throw invError;
      setInvestments(invData || []);

      // 3. Lecture des soldes réels (Mapping exact : recharge_balance & withdraw_balance)
      const { data: userData } = await supabase
        .from("users")
        .select("recharge_balance, withdraw_balance")
        .eq("phone", phone)
        .single();

      if (userData) {
        setRechargeBalance(userData.recharge_balance || 0);
        setWithdrawBalance(userData.withdraw_balance || 0);
      }
    } catch (err) {
      console.error("Erreur de synchronisation:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    const timer = setInterval(() => setNow(new Date()), 1000);
    fetchMyInvestments();

    return () => clearInterval(timer);
  }, [fetchMyInvestments]);

  // Toast notification system
  const showFeedback = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const formatDateFr = (dateStr) => {
    if (!dateStr) return "--/--/----";
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTimeRemaining = (lastPayout, createdAt) => {
    const baseDate = lastPayout ? new Date(lastPayout) : new Date(createdAt);
    const next = new Date(baseDate.getTime() + (23 * 60 + 50) * 60 * 1000); 
    const diff = next - now;
    
    if (diff <= 0) return "DISTRIBUTION..."; 
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- MAPPING DES PACKS (MINIMUM 2000 F) ---
  const getDetectedPack = (amount) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 2000) return null;
    
    if (amt >= 2000 && amt <= 10000) return { name: "SaaS Software", percent: 5, days: 30 };
    if (amt > 10000 && amt <= 30000) return { name: "Digital Marketing", percent: 7, days: 30 };
    if (amt > 30000 && amt <= 50000) return { name: "E-Learning AI", percent: 10, days: 20 };
    if (amt > 50000 && amt <= 70000) return { name: "Blockchain Node", percent: 15, days: 20 };
    if (amt > 70000 && amt <= 100000) return { name: "Master Resell", percent: 20, days: 15 };
    if (amt > 100000) return { name: "Global Ecosystem", percent: 25, days: 10 };
    return null;
  };

  const currentPack = getDetectedPack(investAmount);
  const totalAvailable = rechargeBalance + withdrawBalance;

  // --- EXÉCUTION DE L'INVESTISSEMENT (RPC UNIQUE v4) ---
  const handleProcessInvestment = async () => {
    const phone = localStorage.getItem("userPhone") || localStorage.getItem("phone");
    const amount = parseFloat(investAmount);

    if (isSubmitting || !currentPack) return;
    if (amount > totalAvailable) {
      showFeedback("Solde total insuffisant", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.rpc('process_investment_v4', {
        p_user_phone: phone,
        p_amount: amount,
        p_pack_name: currentPack.name,
        p_daily_percent: currentPack.percent,
        p_days_left: currentPack.days
      });

      if (error) throw error;

      showFeedback("Contrat activé avec succès !");
      setIsModalOpen(false);
      setInvestAmount("");
      fetchMyInvestments(); 
    } catch (err) {
      showFeedback(err.message || "Erreur lors de la transaction", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{background: isDark ? "#050505" : "#fbfbfb", height: "100vh"}}></div>

  return (
    <div style={{...s.container, background: isDark ? "#050505" : "#fbfbfb", color: isDark ? "#fff" : "#000"}}>
      
      {/* SYSTÈME DE NOTIFICATION FLOTTANT */}
      {statusMsg.text && (
        <div style={{...s.toast, background: statusMsg.type === 'error' ? '#ff4d4d' : '#00c896'}}>
          {statusMsg.text}
        </div>
      )}

      <div style={s.header}>
        <button onClick={() => router.push("/dashboard")} style={{...s.backBtn, background: isDark ? "#111" : "#eee", color: isDark ? "#fff" : "#000"}}>❮</button>
        <h1 style={s.title}>TABLEAU DES ACTIFS</h1>
        <div style={{width:35}}></div> 
      </div>

      <div style={s.list}>
        {investments.map((inv) => {
          const startDate = new Date(inv.created_at);
          const endDate = inv.end_date ? new Date(inv.end_date) : new Date(startDate.getTime() + ((inv.total_days || 30) * 24 * 60 * 60 * 1000));
          
          const totalDuration = endDate.getTime() - startDate.getTime();
          const elapsedTotal = now.getTime() - startDate.getTime();
          const progressPercent = Math.min(100, Math.max(0, (elapsedTotal / totalDuration) * 100));

          const baseDateForGain = inv.last_payout ? new Date(inv.last_payout) : startDate;
          const elapsedSinceLastPayout = now.getTime() - baseDateForGain.getTime();
          
          const dailyGain = ((inv.amount || 0) * (inv.daily_percent || 0)) / 100;
          const liveGain = Math.min(dailyGain, (elapsedSinceLastPayout / (23.83 * 60 * 60 * 1000)) * dailyGain);

          const isActive = inv.status === 'active' && progressPercent < 100;

          return (
            <div key={inv.id} style={{...s.card, background: isDark ? "#0d0d0d" : "#fff", borderColor: isDark ? "#1a1a1a" : "#f0f0f0"}}>
              
              <div style={s.rowBetween}>
                <span style={s.packBadge}>{inv.pack_name || "PACK INVEST"}</span>
                <div style={{...s.statusBadge, color: isActive ? '#00c896' : '#ff4d4d'}}>
                  {isActive ? (
                    <div style={{display:'flex', alignItems:'center'}}>
                      <span className="pulse-dot"></span>
                      <span style={{fontSize:8, fontWeight:900}}>PRODUCTION LIVE</span>
                    </div>
                  ) : <span style={{fontSize:8, fontWeight:900}}>CONTRAT ACHEVÉ</span>}
                </div>
              </div>

              <div style={{textAlign:'center', margin:'12px 0'}}>
                <p style={s.miniLabel}>REVENUS À COLLECTER (24H)</p>
                <h2 style={s.liveAmount}>
                  {liveGain.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span style={{fontSize:11, marginLeft:4, color:'#00c896', fontFamily:'sans-serif'}}>F</span>
                </h2>
              </div>

              <div style={s.statsGrid}>
                <div style={s.statBox}>
                    <span style={s.miniLabel}>INVESTI</span>
                    <span style={s.statVal}>{(inv.amount || 0).toLocaleString()} F</span>
                </div>
                <div style={s.statBox}>
                    <span style={s.miniLabel}>GAIN /24H</span>
                    <span style={{...s.statVal, color:'#00c896'}}>+{dailyGain.toLocaleString()} F</span>
                </div>
                <div style={s.statBox}>
                    <span style={s.miniLabel}>RESTANT</span>
                    <span style={s.statVal}>{inv.days_left || 0} J</span>
                </div>
              </div>

              {isActive && (
                <div style={{...s.timerBox, background: isDark ? 'rgba(0,200,150,0.05)' : '#f0fffb'}}>
                  <span style={s.timerLabel}>PROCHAIN PROFIT</span>
                  <span style={s.timerVal}>{getTimeRemaining(inv.last_payout, inv.created_at)}</span>
                </div>
              )}

              <div style={{marginBottom:10}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                  <span style={s.dateTxt}>DEBUT: {formatDateFr(inv.created_at)}</span>
                  <span style={{...s.dateTxt, color: isActive ? '#00c896' : '#888'}}>FIN: {formatDateFr(endDate)}</span>
                </div>
                <div style={{...s.progressTrack, background: isDark ? "#1a1a1a" : "#eee"}}>
                  <div style={{ 
                    ...s.progressBar, 
                    width: `${progressPercent}%`,
                    background: isActive ? 'linear-gradient(90deg, #00c896, #00ffbf)' : '#333'
                  }}></div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
                  <span style={s.miniLabel}>PROGRESSION RÉELLE</span>
                  <span style={{...s.miniLabel, color: isActive ? '#00c896' : '#888'}}>{progressPercent.toFixed(2)}%</span>
                </div>
              </div>

              {!isActive ? (
                  <button onClick={() => setIsModalOpen(true)} style={s.renewBtn}>RÉINVESTIR MAINTENANT</button>
              ) : (
                <div style={s.cardFooter}>
                  <span>CONTRAT ID: {inv.id.substring(0,8).toUpperCase()}</span>
                  <span>PRODUCTION EN TEMPS RÉEL</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* MODAL D'ACHAT (DESIGN ÉPURÉ) */}
      {isModalOpen && (
        <div style={s.modalOverlay}>
          <div style={{...s.modalContent, background: isDark ? "#0d0d0d" : "#fff", borderColor: isDark ? "#1a1a1a" : "#eee"}}>
            <div style={s.modalHeader}>
              <h3 style={{...s.modalTitle, color: isDark ? "#fff" : "#000"}}>ACTIVER UN CONTRAT</h3>
              <button onClick={() => { setIsModalOpen(false); setInvestAmount(""); }} style={{...s.closeBtn, color: isDark ? "#fff" : "#000"}}>✕</button>
            </div>
            
            <p style={s.modalSubtitle}>Total disponible: <strong style={{color: '#00c896'}}>{totalAvailable.toLocaleString()} F</strong></p>
            
            <div style={s.inputWrapper}>
              <input
                type="number"
                placeholder="Montant (ex: 2000)"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                style={{...s.modalInput, background: isDark ? "#111" : "#fbfbfb", color: isDark ? "#fff" : "#000", borderColor: isDark ? "#222" : "#ddd"}}
              />
              <span style={s.currencyLabel}>F</span>
            </div>

            {currentPack && (
              <div style={s.packBox}>
                <span style={s.packTitle}>{currentPack.name}</span>
                <div style={s.packDetails}>
                  <span>Profit: <strong>+{currentPack.percent}% / jour</strong></span>
                  <span>Cycle: <strong>{currentPack.days} Jours</strong></span>
                </div>
              </div>
            )}

            <button 
              onClick={handleProcessInvestment} 
              disabled={isSubmitting || !currentPack}
              style={{
                ...s.modalSubmitBtn, 
                opacity: (isSubmitting || !currentPack) ? 0.5 : 1,
                cursor: (isSubmitting || !currentPack) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? "TRANSACTION EN COURS..." : "CONFIRMER L'INVESTISSEMENT"}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(0, 200, 150, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(0, 200, 150, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(0, 200, 150, 0); }
        }
        .pulse-dot {
          width: 7px; height: 7px; background: #00c896; border-radius: 50%;
          margin-right: 8px; animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  )
}

const s = {
  container: { minHeight: "100vh", padding: "12px", fontFamily: "'Inter', sans-serif", position: 'relative' },
  toast: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 25px', borderRadius: '12px', color: '#000', fontWeight: '900', fontSize: '11px', zIndex: 2000, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', transition: 'all 0.3s ease', textTransform: 'uppercase' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { border: 'none', width: 35, height: 35, borderRadius: '10px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  title: { fontSize: '10px', fontWeight: '900', letterSpacing:'1px', textTransform:'uppercase' },
  list: { display: 'flex', flexDirection: 'column', gap: 15 },
  card: { borderRadius: '20px', padding: '15px', border: '1px solid', position:'relative' },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  packBadge: { fontSize: '7px', fontWeight: '900', color: '#00c896', background: 'rgba(0,200,150,0.08)', padding: '4px 8px', borderRadius: '8px', textTransform:'uppercase' },
  statusBadge: { fontWeight: '900' },
  liveAmount: { fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing:'-1px', fontFamily:'monospace', color:'#00c896' },
  statsGrid: { display: 'flex', justifyContent: 'space-between', marginBottom: 12, textAlign:'center', gap: '5px' },
  statBox: { flex: 1 },
  statVal: { fontSize: '11px', fontWeight: '900', display:'block' },
  miniLabel: { fontSize: '7px', opacity: 0.5, fontWeight:'900', marginBottom: 4, textTransform:'uppercase', letterSpacing:0.5 },
  timerBox: { padding: '8px 12px', borderRadius: '12px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 },
  timerLabel: { fontSize: '7px', fontWeight:'900', opacity:0.7 },
  timerVal: { fontSize: '11px', fontWeight: '900', color: '#00c896', fontFamily: 'monospace' },
  dateTxt: { fontSize: '8px', fontWeight: '800', opacity: 0.5 },
  progressTrack: { width: '100%', height: '6px', borderRadius: '10px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '10px', transition: 'width 0.1s linear' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', fontSize: '6px', opacity: 0.2, fontWeight:'900', borderTop: '1px solid rgba(128,128,128,0.1)', paddingTop: 8, marginTop: 5 },
  renewBtn: { width:'100%', marginTop:5, padding: '12px', borderRadius: '12px', background: '#00c896', color: '#000', border: 'none', fontWeight: '900', fontSize: '10px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' },
  modalContent: { width: '100%', maxWidth: '360px', borderRadius: '20px', padding: '20px', border: '1px solid' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: '12px', fontWeight: '900', letterSpacing: '0.5px', margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', fontSize: '14px', cursor: 'pointer' },
  modalSubtitle: { fontSize: '10px', opacity: 0.6, marginBottom: 12, fontWeight: '600' },
  inputWrapper: { position: 'relative', marginBottom: 12 },
  modalInput: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid', fontSize: '14px', fontWeight: '700', outline: 'none' },
  currencyLabel: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#00c896' },
  packBox: { background: 'rgba(0, 200, 150, 0.05)', padding: '12px', borderRadius: '10px', marginBottom: 15, border: '1px solid rgba(0, 200, 150, 0.1)' },
  packTitle: { fontSize: '10px', fontWeight: '900', color: '#00c896', display: 'block', marginBottom: 5 },
  packDetails: { display: 'flex', justifyContent: 'space-between', fontSize: '9px', opacity: 0.8 },
  modalSubmitBtn: { width: '100%', padding: '12px', borderRadius: '10px', background: '#00c896', color: '#000', border: 'none', fontWeight: '900', fontSize: '10px', letterSpacing: '0.5px', cursor: 'pointer' }
}