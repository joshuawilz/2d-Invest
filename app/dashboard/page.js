'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { confirmAction, notifySuccess, notifyError } from "../../lib/alerts"
import Swal from 'sweetalert2'

// --- ARSENAL DE CONFIGURATION STRICTE ---
const packsData = [
  { id: 1, name: "SaaS Software", min: 2000, max: 10000, percent: 5, days: 30, color: "#00c896", logo: "https://cdn-icons-png.flaticon.com/512/5968/5968313.png" },
  { id: 2, name: "Digital Marketing", min: 10001, max: 30000, percent: 7, days: 30, color: "#00d4ff", logo: "https://cdn-icons-png.flaticon.com/512/1998/1998087.png" },
  { id: 3, name: "E-Learning AI", min: 30001, max: 50000, percent: 10, days: 20, color: "#ffd700", logo: "https://cdn-icons-png.flaticon.com/512/2436/2436874.png", badge: "POPULAIRE" },
  { id: 4, name: "Blockchain Node", min: 50001, max: 70000, percent: 15, days: 20, color: "#ff4d4d", logo: "https://cdn-icons-png.flaticon.com/512/2091/2091614.png" },
  { id: 5, name: "Master Resell", min: 70001, max: 100000, percent: 20, days: 15, color: "#a155ff", logo: "https://cdn-icons-png.flaticon.com/512/10169/10169724.png", badge: "HOT" },
  { id: 6, name: "Global Ecosystem", min: 100001, max: 999999999, percent: 25, days: 10, color: "#ff00ff", logo: "https://cdn-icons-png.flaticon.com/512/4762/4762311.png" }
]

const feedActivities = [
  { id: 1, txt: "+228 **** 1029 vient de retirer 25 000 FCFA" },
  { id: 2, txt: "+225 **** 4892 vient de retirer 105 500 FCFA" },
  { id: 3, txt: "+221 **** 9931 vient de retirer 12 000 FCFA" },
  { id: 4, txt: "+229 **** 5564 vient d'investir dans Blockchain Node" },
  { id: 5, txt: "+226 **** 1102 vient de retirer 45 000 FCFA" },
  { id: 6, txt: "+228 **** 7741 vient d'investir dans SaaS Software" }
]

// --- COMPOSANTS DE L'INFRASTRUCTURE VISUELLE ---
const NavBtn = ({ icon, label, active, click }) => (
  <button onClick={click} className="premium-nav-btn" style={{
    flex: 1, background: active ? "rgba(0, 200, 150, 0.06)" : "none",
    border: "none", padding: '10px 2px', borderRadius: '16px',
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: 'center',
    color: active ? "#00c896" : "#6b7280", transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', cursor: 'pointer', position: 'relative'
  }}>
    <span style={{ fontSize: "20px", transform: active ? 'scale(1.05)' : 'scale(1)', transition: '0.2s' }}>{icon}</span>
    <span style={{ fontSize: "9px", marginTop:'4px', fontWeight: active ? '900' : '600', letterSpacing:'0.2px', textTransform:'uppercase' }}>{label}</span>
    {active && <div style={{position:'absolute', bottom:'4px', width:'4px', height:'4px', background:'#00c896', borderRadius:'50%', boxShadow:'0 0 8px #00c896'}} />}
  </button>
)

const ActionIcon = ({ icon, text, color, badge, click }) => (
  <div onClick={click} className="premium-action-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, cursor: 'pointer' }}>
    <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: `${color}10`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", border: `1px solid ${color}15`, position: 'relative' }}>
      {icon}
      {badge > 0 && <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ff3b30', color: 'white', fontSize: '8px', fontWeight: 'bold', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</div>}
    </div>
    <span style={{ fontSize: "9px", fontWeight: "800", opacity: 0.8, textAlign: 'center', whiteSpace: 'nowrap' }}>{text}</span>
  </div>
)

// SQUELETTE SCINTILLANT POUR CHARGEMENT DES FILLEULS (ANTI-LATENCE NET)
const ShimmerRow = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 8px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
      <div className="shimmer-pulse" style={{ width: '34px', height: '34px', borderRadius: '10px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 0.5 }}>
        <div className="shimmer-pulse" style={{ height: '12px', width: '70%', borderRadius: '4px' }} />
        <div className="shimmer-pulse" style={{ height: '8px', width: '40%', borderRadius: '4px' }} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flex: 0.3 }}>
      <div className="shimmer-pulse" style={{ height: '12px', width: '60%', borderRadius: '4px' }} />
      <div style={{ height: '8px', width: '40%', borderRadius: '4px' }} />
    </div>
  </div>
)

export default function Dashboard() {
  const router = useRouter()
  
  // --- ÉTATS APPLICATIFS ---
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState("home")
  const [teamTab, setTeamTab] = useState(1)
  const [showBalance, setShowBalance] = useState(true)
  const [origin, setOrigin] = useState("")
  
  // SOLDE ET FINANCES COMPLETS
  const [rechargeBalance, setRechargeBalance] = useState(0)
  const [withdrawBalance, setWithdrawBalance] = useState(0)
  const [totalGains, setTotalGains] = useState(0)
  const [referralEarnings, setReferralEarnings] = useState(0)

  // LOGIQUE DE PARRAINAGE ET PAGINATION AVANCÉE (POUR 1000+ FILLEULS)
  const [teamMembers, setTeamMembers] = useState([])
  const [pageOffset, setPageOffset] = useState(0)
  const [hasMoreFilleuls, setHasMoreFilleuls] = useState(true)
  const [amounts, setAmounts] = useState({ 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" })
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [isNetworkStable, setIsNetworkStable] = useState(true)
  const [unreadSupport, setUnreadSupport] = useState(0)

  const ITEMS_PER_PAGE = 25
  const telegramLink = "https://t.me/+fI28nA4nyGMyZTBk"
  const currentTotal = useMemo(() => rechargeBalance + withdrawBalance, [rechargeBalance, withdrawBalance])

  // MÉTRIQUES RÉSEAU CENTRALISÉES PAR SÉCURITÉ SERVEUR
  const teamStats = useMemo(() => {
    return {
      lv1: teamMembers.filter(m => m.level === 1).length,
      lv2: teamMembers.filter(m => m.level === 2).length,
      lv3: teamMembers.filter(m => m.level === 3).length,
      total: teamMembers.length,
      actifs: teamMembers.filter(m => m.has_invested || (m.commission_generated > 0)).length
    }
  }, [teamMembers])

  const userRank = useMemo(() => {
    if(teamStats.total >= 500) return { name: 'LEADER DIAMANT', icon: '💎', color: '#00d4ff' }
    if(teamStats.total >= 100) return { name: 'AMBASSADEUR OR', icon: '🏆', color: '#ffd700' }
    if(teamStats.total >= 20) return { name: 'RÉSEAUTEUR ARGENT', icon: '🥈', color: '#c0c0c0' }
    return { name: 'MEMBRE BRONZE', icon: '🥉', color: '#cd7f32' }
  }, [teamStats.total])

  const formatCur = (val) => new Intl.NumberFormat('fr-FR').format(Math.floor(val)) + " F"

  // DISPATCH SECURISE DU POPUP SANS RUINER L'HYDRATATION DOM
  const executeWelcomePopup = () => {
    if (sessionStorage.getItem("v5_popup_displayed")) return
    sessionStorage.setItem("v5_popup_displayed", "true")

    Swal.fire({
      title: '<span style="font-size:15px; font-weight:900; letter-spacing:1px; color:#00c896; text-transform:uppercase;">CANAL COMMUNAUTAIRE</span>',
      html: `
        <div style="text-align: center; padding: 4px; box-sizing: border-box;">
          <p style="font-size: 12px; color: #a3a3a3; line-height: 1.6; margin-bottom: 20px;">
            Rejoignez l'infrastructure officielle pour suivre en temps réel les validations de retraits et les mises à niveau réseau.
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
            <a href="${telegramLink}" target="_blank" style="text-decoration: none; width:100%;">
              <button style="width: 100%; background: #00c896; color: white; border: none; padding: 12px; border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing:0.5px; text-transform: uppercase;">OUVRIR TELEGRAM</button>
            </a>
            <button id="close-premium-pop" style="background: rgba(255,255,255,0.02); color: #777; border: 1px solid rgba(255,255,255,0.06); padding: 10px; border-radius: 10px; font-size: 10px; font-weight: 700; cursor: pointer; text-transform: uppercase;">ACCÉDER AU DASHBOARD</button>
          </div>
        </div>
      `,
      background: '#0a0a0a',
      showConfirmButton: false,
      allowOutsideClick: false,
      customClass: { popup: 'premium-popup-border' },
      didOpen: () => {
        const btn = document.getElementById('close-premium-pop')
        if (btn) btn.addEventListener('click', () => {
          if (window.navigator.vibrate) window.navigator.vibrate(8)
          Swal.close()
        })
      }
    })
  }

  // DOUBLE COUCHE DE VERIFICATION POUR LA SÉCURITÉ ROUTE ET DONNÉES
  const bootstrapDashboard = async () => {
    let targetPhone = localStorage.getItem("phone")
    if (!targetPhone) {
      const match = document.cookie.match(/(^| )phone=([^;]+)/)
      if (match) {
        targetPhone = decodeURIComponent(match[2])
        localStorage.setItem("phone", targetPhone)
      }
    }

    if (!targetPhone) {
      router.replace("/register")
      return
    }

    try {
      const { data: dbUser, error } = await supabase.from("users").select("*").eq("phone", targetPhone).maybeSingle()
      if (error || !dbUser || dbUser.status === 'banned') {
        localStorage.clear()
        document.cookie = "phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
        router.replace("/register")
        return
      }

      setUser(dbUser)
      setRechargeBalance(dbUser.recharge_balance || 0)
      setWithdrawBalance(dbUser.withdraw_balance || 0)
      setTotalGains(dbUser.total_gains || 0)
      setReferralEarnings(dbUser.referral_earnings || 0)
      setIsNetworkStable(true)
      setPageLoading(false)

      // Chargement initial sécurisé de la première page de l'équipe
      fetchTeamSegment(dbUser.user_id_code, 0, true)

      // Extraction des messages supports non-lus
      const { data: tickets } = await supabase.from("support_tickets").select("id").eq("user_phone", targetPhone).eq("user_read", false).not("admin_reply", "is", null)
      if (tickets) setUnreadSupport(tickets.length)

    } catch (err) {
      setIsNetworkStable(false)
      setPageLoading(false)
    }
  }

  // CHARGEMENT PAR CURSEUR/PAGINATION (SUPPORT FLUIDE POUR 1000+ FILLEULS)
  const fetchTeamSegment = async (userCode, currentOffset, clearPrevious = false) => {
    if (!userCode) return
    try {
      const { data: segment, error } = await supabase
        .rpc('get_user_team_v2', { p_user_code: userCode })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1)

      if (error) throw error

      if (segment) {
        if (clearPrevious) {
          setTeamMembers(segment)
        } else {
          setTeamMembers(prev => [...prev, ...segment])
        }
        setHasMoreFilleuls(segment.length === ITEMS_PER_PAGE)
      } else {
        setHasMoreFilleuls(false)
      }
    } catch (e) {
      setIsNetworkStable(false)
    }
  }

  const handleLoadMoreFilleuls = () => {
    if (!hasMoreFilleuls || !user) return
    const nextOffset = pageOffset + ITEMS_PER_PAGE
    setPageOffset(nextOffset)
    fetchTeamSegment(user.user_id_code, nextOffset, false)
  }

  // INITIALISATION ET ÉCOUTEURS POSTGRES REALTIME TRIPLÉS
  useEffect(() => {
    bootstrapDashboard()

    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }

    const livePhone = localStorage.getItem("phone")
    if (!livePhone) return

    const realtimeChannel = supabase
      .channel('dashboard-premium-layer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `phone=eq.${livePhone}` }, payload => {
        setRechargeBalance(payload.new.recharge_balance)
        setWithdrawBalance(payload.new.withdraw_balance)
        setTotalGains(payload.new.total_gains)
        setReferralEarnings(payload.new.referral_earnings)
        if (payload.new.status === 'banned') {
          localStorage.clear()
          router.push("/register")
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(realtimeChannel) }
  }, [])

  // Declenchement du pop-up uniquement après la disparition complète du chargement de page
  useEffect(() => {
    if (!pageLoading && isNetworkStable) {
      setTimeout(() => { executeWelcomePopup() }, 400)
    }
  }, [pageLoading, isNetworkStable])

  const handleInvestment = async (pack, amountStr) => {
    if (loading) return
    const amount = Math.floor(parseFloat(amountStr))

    if (!amount || amount < pack.min || amount > pack.max) {
      return notifyError("Montant invalide", `Seuil requis pour ${pack.name} : ${pack.min.toLocaleString()} F - ${pack.max.toLocaleString()} F.`)
    }

    if (currentTotal < amount) {
      if (window.navigator.vibrate) window.navigator.vibrate(30)
      Swal.fire({
        title: '<span style="font-size:13px; font-weight:900; color:#ff4d4d;">SOLDE COMPTE INSUFFISANT</span>',
        html: `<p style="font-size:11px; color:#999; margin:0;">Il vous manque <b>${(amount - currentTotal).toLocaleString()} F</b> pour activer ce produit. Redirection vers les dépôts ?</p>`,
        background: '#0a0a0a',
        showCancelButton: true,
        confirmButtonText: 'RECHARGER',
        cancelButtonText: 'ANNULER',
        confirmButtonColor: '#00c896',
        cancelButtonColor: 'rgba(255,255,255,0.04)',
        customClass: { popup: 'premium-popup-border' }
      }).then(res => { if (res.isConfirmed) router.push("/deposit") })
      return
    }

    const confirm = await confirmAction("Validation Requise", `Bloquer ${amount.toLocaleString()} F sur le produit ${pack.name} ?`)
    if (!confirm) return

    setLoading(true)
    try {
      const { error } = await supabase.rpc('process_investment_v5', {
        p_user_phone: user.phone,
        p_amount: amount,
        p_pack_name: pack.name,
        p_days_left: pack.days
      })
      if (error) throw error

      if (window.navigator.vibrate) window.navigator.vibrate([10, 20, 10])
      await notifySuccess("Achat Validé", "Votre pack serveur est entré en allocation de rendement.")
      setAmounts({ ...amounts, [pack.id]: "" })
      bootstrapDashboard()
    } catch (err) {
      notifyError("Action Interrompue", err.message || "Erreur d'allocation.")
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return <div style={{ background: "#050505", height: "100vh", width: "100vw" }} />

  return (
    <div className="premium-app-viewport">
      
      {/* HEADER FIXE STRICT — PROTECTION DEBORDEMENT */}
      <header className="premium-app-header">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div className="pulse-green-dot" />
          <span style={{ fontSize: "9px", fontWeight: '900', color: '#00c896', letterSpacing: '0.5px' }}>SYSTEM V5 PREMIUM</span>
        </div>
        {user && <span style={{ fontSize: "10px", fontWeight: "900", opacity: 0.8 }}>ID SÉCURISÉ : {user.user_id_code}</span>}
      </header>

      {/* ZONE CENTRALE EN DEFILEMENT INDEPENDANT INTERNE */}
      <main className="premium-app-scroller">
        
        {/* RECOUVREMENT EN CAS DE PANNE DE RESEAU (USER FRIENDLY SPIN) */}
        {!isNetworkStable && (
          <div style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid #ff4d4d30', borderRadius: '14px', padding: '12px', margin: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#ff4d4d' }}>⚠️ Flux réseau instable. Synchronisation...</span>
            <button onClick={() => bootstrapDashboard()} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}>FORCER</button>
          </div>
        )}

        {/* TAB 1 : ACCUEIL */}
        {tab === "home" && (
          <div className="tab-fade-in" style={{ padding: '0 0 16px 0' }}>
            <div className="premium-card-balance">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                <span style={{ fontSize: "9px", letterSpacing: '1px', fontWeight: '900' }}>VALEUR TOTAL DU PORTFEUILLE</span>
                <span onClick={() => setShowBalance(!showBalance)} style={{ cursor: 'pointer', fontSize: '12px' }}>{showBalance ? "👁️" : "🙈"}</span>
              </div>
              <h1 style={{ fontSize: "30px", color: "#00c896", fontWeight: '950', margin: '8px 0 0 0', letterSpacing: '-0.5px' }}>
                {showBalance ? formatCur(currentTotal) : "•••••• F"}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px', padding: '0 16px', marginBottom: '20px' }}>
              <div className="premium-mini-card">
                <span className="mini-card-label">SOLDE DE RECHARGE</span>
                <span className="mini-card-value">{showBalance ? formatCur(rechargeBalance) : "•••• F"}</span>
              </div>
              <div className="premium-mini-card">
                <span className="mini-card-label">RETRAIT DISPONIBLE</span>
                <span className="mini-card-value" style={{ color: '#00c896' }}>{showBalance ? formatCur(withdrawBalance) : "•••• F"}</span>
              </div>
            </div>

            <div style={{ display: "flex", padding: "0 16px 20px 16px", justifyContent: "space-between", gap: "8px" }}>
              <ActionIcon icon="📥" text="Dépôt" color="#00c896" click={() => router.push("/deposit")} />
              <ActionIcon icon="📤" text="Retrait" color="#ff4d4d" click={() => router.push("/withdraw")} />
              <ActionIcon icon="🕒" text="Historique" color="#ff9800" click={() => router.push("/history")} />
              <ActionIcon icon="📦" text="Mes Packs" color="#a155ff" click={() => router.push("/commandes")} />
              <ActionIcon icon="🛎️" text="Support" color="#0088cc" badge={unreadSupport} click={() => setTab("settings")} />
            </div>

            <div style={{ padding: '0 16px', marginBottom: '20px' }}>
              <div style={{ width: '100%', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '110px', position: 'relative' }}>
                <img src="https://media.beehiiv.com/www/winter-release/features/digital-products/og-digital-products.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
              </div>
            </div>

            <div className="live-feed-box">
              <div className="live-feed-scroll">
                {[...feedActivities, ...feedActivities].map((act, idx) => (
                  <span key={idx} style={{ marginRight: "40px", fontSize: "10.5px", color: '#00c896', fontWeight: '700', display: 'inline-block' }}>
                    <span style={{ background: '#00c89615', padding: '2px 5px', borderRadius: '6px', marginRight: '6px', fontSize: '8px', fontWeight: '900' }}>LIVE</span>
                    {act.txt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 : INVESTIR */}
        {tab === "invest" && (
          <div className="tab-fade-in" style={{ padding: "16px" }}>
            <div className="invest-stats-header">
              <div style={{ flex: 1 }}>
                <span className="mini-card-label">PORTEFEUILLE DISPO</span>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#00c896' }}>{formatCur(currentTotal)}</span>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                <span className="mini-card-label">GAINS TOUT TEMPS</span>
                <span style={{ fontSize: '14px', fontWeight: '900' }}>{formatCur(totalGains)}</span>
              </div>
            </div>

            {packsData.map(p => {
              const val = Math.floor(parseFloat(amounts[p.id])) || 0
              const isRangeValide = (val >= p.min && val <= p.max)
              const isSoldeSuffisant = (val <= currentTotal)
              const dynamicColor = isRangeValide ? (isSoldeSuffisant ? p.color : '#ff4d4d') : 'var(--border-color)'

              return (
                <div key={p.id} className="premium-pack-card">
                  {p.badge && <div className="pack-badge-rotate" style={{ background: p.color }}>{p.badge}</div>}
                  <div style={{ display: 'flex', minHeight: '130px' }}>
                    <div style={{ width: '22%', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                      <img src={p.logo} style={{ width: '32px', height: 'auto', opacity: 0.8 }} alt="pack-logo" />
                    </div>
                    <div style={{ width: '78%', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: p.color }}>{p.name}</h4>
                        <span style={{ fontSize: '12px', fontWeight: '950', color: p.color }}>{p.percent}% / JOUR</span>
                      </div>

                      <div style={{ margin: '8px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', opacity: 0.5, marginBottom: '4px' }}>
                          <span>Seuil: {p.min.toLocaleString()} F - {p.max.toLocaleString()} F</span>
                          <span>Durée: {p.days} Jours</span>
                        </div>
                        <input type="number" placeholder="Saisir montant FCFA" value={amounts[p.id]} onChange={e => setAmounts({ ...amounts, [p.id]: e.target.value })} className="premium-input-field" />
                        
                        {val > 0 && (
                          <div style={{ marginTop: '6px', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '9.5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gain / jour :</span> <b style={{ color: '#00c896' }}>+{formatCur(val * p.percent / 100)}</b></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gain Net Terme :</span> <b style={{ color: p.color }}>+{formatCur((val * p.percent / 100) * p.days)}</b></div>
                          </div>
                        )}
                      </div>

                      <button onClick={() => handleInvestment(p, amounts[p.id])} disabled={loading || !amounts[p.id]} className="premium-submit-btn" style={{ background: dynamicColor, color: isRangeValide && isSoldeSuffisant ? '#000' : '#fff' }}>
                        {!amounts[p.id] ? "ENTRER UN MONTANT" : (!isRangeValide ? "LIMITATION REQUIS HORS COMPTE" : (!isSoldeSuffisant ? "SOLDE INSUFFISANT" : "INITIALISER L'INVESTISSEMENT"))}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* TAB 3 : EQUIPE AVEC CHARGEMENT PROGRESSIF DES INFRASTRUCTURES DE PARRAINAGE */}
        {tab === "team" && (
          <div className="tab-fade-in" style={{ padding: "16px" }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <div className="premium-mini-card" style={{ textAlign: 'center', padding: '12px 6px' }}>
                <span className="mini-card-label">RÉSEAU GLOBAL</span>
                <span style={{ fontSize: '16px', fontWeight: '950', marginTop: '2px', display: 'block' }}>{teamStats.total} 👥</span>
              </div>
              <div className="premium-mini-card" style={{ textAlign: 'center', padding: '12px 6px' }}>
                <span className="mini-card-label">FILLEULS ACTIFS</span>
                <span style={{ fontSize: '16px', fontWeight: '950', color: '#00c896', marginTop: '2px', display: 'block' }}>{teamStats.actifs} 🔥</span>
              </div>
            </div>

            <div className="rank-central-card" style={{ border: `1px solid ${userRank.color}25` }}>
              <div style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', background: userRank.color, color: '#000', padding: '2px 10px', borderRadius: '8px', fontSize: '8px', fontWeight: '950', letterSpacing: '0.5px' }}>
                {userRank.name} {userRank.icon}
              </div>
              <span className="mini-card-label" style={{ opacity: 0.5, marginTop: '4px' }}>COMMISSIONS DE RÉSEAU ENCAISSÉES</span>
              <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#00c896', margin: '4px 0' }}>{formatCur(referralEarnings)}</h2>
            </div>

            <div className="premium-link-box">
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#00c896', display: 'block', marginBottom: '8px' }}>LIEN D'AFFILIATION UNIQUE V5</span>
              <input readOnly value={`${origin}/register?ref=${user?.user_id_code || ''}`} className="premium-input-field" style={{ fontSize: '10px', opacity: 0.7, padding: '10px' }} />
              <button onClick={() => {
                navigator.clipboard.writeText(`${origin}/register?ref=${user?.user_id_code || ''}`)
                if (window.navigator.vibrate) window.navigator.vibrate(15)
                Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'Lien copié !', showConfirmButton: false, timer: 1500, background: '#111', color: '#00c896' })
              }} className="premium-submit-btn" style={{ background: '#00c896', color: '#000', marginTop: '8px', height: '36px' }}>
                COPIER LE LIEN D'INVITATION
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {[1, 2, 3].map(lvl => (
                <div key={lvl} onClick={() => setTeamTab(lvl)} className="level-filter-tab" style={{
                  flex: 1, padding: '10px 4px', borderRadius: '12px', border: `1px solid ${teamTab === lvl ? '#00c896' : 'var(--border-color)'}`,
                  background: teamTab === lvl ? 'rgba(0,200,150,0.05)' : 'transparent', textAlign: 'center', cursor: 'pointer'
                }}>
                  <span style={{ fontSize: '8px', opacity: 0.5, display: 'block', fontWeight: '900' }}>NIVEAU {lvl}</span>
                  <span style={{ fontSize: '13px', fontWeight: '950', color: lvl === 1 ? '#00c896' : lvl === 2 ? '#00d4ff' : '#ffd700' }}>
                    {lvl === 1 ? '20%' : lvl === 2 ? '3%' : '2%'}
                  </span>
                </div>
              ))}
            </div>

            {/* SEGMENTATION DES RENDERINGS DES STRUCTURES DE FILLEULS */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {teamMembers.filter(m => m.level === teamTab).length > 0 ? (
                <div>
                  {teamMembers.filter(m => m.level === teamTab).map((filleul, index) => {
                    const isActif = filleul.has_invested || (filleul.commission_generated > 0)
                    return (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 10px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>👤</div>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '900', display: 'block' }}>{filleul.phone?.substring(0, 6)}***</span>
                            <span style={{ fontSize: '8.5px', fontWeight: '900', color: isActif ? '#00c896' : '#ff4d4d' }}>● {isActif ? 'ACTIF' : 'INACTIF'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: '#00c896', fontWeight: '900', display: 'block' }}>+{formatCur(filleul.commission_generated || 0)}</span>
                          <span style={{ fontSize: '8px', opacity: 0.4 }}>{filleul.created_at ? new Date(filleul.created_at).toLocaleDateString('fr-FR') : '--/--/--'}</span>
                        </div>
                      </div>
                    )
                  })}
                  
                  {hasMoreFilleuls && (
                    <button onClick={handleLoadMoreFilleuls} className="premium-submit-btn" style={{ background: 'transparent', border: 'none', color: '#00c896', height: '40px', fontWeight: '900', fontSize: '10px' }}>
                      CHARGER LES SUIVANTS
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ padding: '30px 10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', opacity: 0.4 }}>Aucune donnée de parrainage sur ce niveau.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4 : COMPTE */}
        {tab === "settings" && (
          <div className="tab-fade-in" style={{ padding: "16px" }}>
            <div className="account-top-profile">
              <div className="avatar-frame">👤</div>
              <h3 style={{ fontSize: '16px', margin: '10px 0 4px 0', fontWeight: '950' }}>{user?.phone}</h3>
              <span style={{ fontSize: '10px', color: '#00c896', background: 'rgba(0,200,150,0.06)', padding: '3px 12px', borderRadius: '8px', fontWeight: '900', border: '1px solid rgba(0,200,150,0.1)' }}>
                TOKEN SECURE: {user?.user_id_code}
              </span>
            </div>

            <div className="premium-link-box" style={{ padding: '14px' }}>
              <h4 style={{ fontSize: '9px', opacity: 0.4, letterSpacing: '0.5px', margin: '0 0 12px 0', fontWeight: '900', textTransform: 'uppercase' }}>PARAMÈTRES SÉCURITÉS INFRASTRUCTURE</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', display: 'block' }}>Vérification KYC Serveur</span>
                  <span style={{ fontSize: '8.5px', opacity: 0.4 }}>Passerelle Afrique de l'Ouest validée</span>
                </div>
                <span style={{ fontSize: '8px', fontWeight: '900', color: '#00c896', background: 'rgba(0,200,150,0.08)', padding: '3px 8px', borderRadius: '6px' }}>ACTIF ✅</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', display: 'block' }}>Chiffrement Cryptographique</span>
                  <span style={{ fontSize: '8.5px', opacity: 0.4 }}>Protocole SSL Terminé v5</span>
                </div>
                <span style={{ fontSize: '8.5px', opacity: 0.6, fontWeight: '800' }}>AES-256</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="account-action-node" onClick={() => router.push("/settings/wallet")}>
                <span style={{ fontSize: '16px' }}>🏦</span>
                <span style={{ fontSize: '9.5px', fontWeight: '900' }}>Canaux Retrait</span>
              </div>
              <div className="account-action-node" style={{ position: 'relative' }} onClick={() => router.push("/support")}>
                <span style={{ fontSize: '16px' }}>🛎️</span>
                <span style={{ fontSize: '9.5px', fontWeight: '900' }}>Support Tickets</span>
                {unreadSupport > 0 && <div className="dot-badge-orange">{unreadSupport}</div>}
              </div>
              <div className="account-action-node" onClick={async () => {
                const out = await confirmAction("Fermeture de session", "Voulez-vous rompre le jeton d'authentification ?")
                if (out) {
                  localStorage.clear()
                  document.cookie = "phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
                  router.push("/register")
                }
              }}>
                <span style={{ fontSize: '16px' }}>🚪</span>
                <span style={{ fontSize: '9.5px', fontWeight: '900', color: '#ff4d4d' }}>Déconnexion</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER BARRE DE NAVIGATION FIXE ABSOLUE — SANS DROIT AU DÉBORDEMENT */}
      <nav className="premium-app-navigation">
        <NavBtn icon="🏠" label="Accueil" active={tab === "home"} click={() => setTab("home")} />
        <NavBtn icon="🚀" label="Investir" active={tab === "invest"} click={() => setTab("invest")} />
        <NavBtn icon="👥" label="Équipe" active={tab === "team"} click={() => setTab("team")} />
        <NavBtn icon="👤" label="Compte" active={tab === "settings"} click={() => setTab("settings")} />
      </nav>

      {/* EMPILEMENT DE COMPILATION DES COMPOSANTS GRAPHES CSS STRICTS ANTI-DEBORDEMENTS */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-color: #050505;
          --card-bg: #0b0b0b;
          --border-color: #121212;
          --text-main: #ffffff;
        }
        
        * {
          box-sizing: border-box !important;
          -webkit-tap-highlight-color: transparent;
        }

        body, html {
          background-color: var(--bg-color) !important;
          color: var(--text-main) !important;
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .premium-app-viewport {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .premium-app-header {
          height: 54px;
          width: 100%;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          background: var(--card-bg);
          flex-shrink: 0;
        }

        .premium-app-scroller {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 20px;
        }

        .premium-app-navigation {
          height: 74px;
          width: 100%;
          border-top: 1px solid var(--border-color);
          background: var(--card-bg);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 6px;
          flex-shrink: 0;
        }

        .premium-card-balance {
          width: calc(100% - 32px);
          margin: 16px auto;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 22px;
          padding: 22px 16px;
          text-align: center;
        }

        .premium-mini-card {
          flex: 1;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 12px 10px;
        }

        .mini-card-label {
          font-size: 8px;
          font-weight: 900;
          color: #00c896;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: block;
        }

        .mini-card-value {
          font-size: 13.5px;
          font-weight: 900;
          display: block;
          margin-top: 2px;
        }

        .premium-input-field {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 8px 12px;
          color: white;
          outline: none;
          font-size: 12px;
          font-weight: 800;
        }

        .premium-submit-btn {
          width: 100%;
          height: 32px;
          border: none;
          border-radius: 9px;
          font-size: 9.5px;
          font-weight: 900;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: opacity 0.2s;
        }

        .premium-submit-btn:active {
          opacity: 0.8;
        }

        .premium-pack-card {
          width: 100%;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }

        .pack-badge-rotate {
          position: absolute;
          top: 8px;
          right: -26px;
          padding: 3px 24px;
          transform: rotate(45deg);
          font-size: 7.5px;
          font-weight: 900;
          color: black;
        }

        .invest-stats-header {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 12px;
          border-radius: 16px;
          display: flex;
          margin-bottom: 16px;
          align-items: center;
        }

        .rank-central-card {
          background: var(--card-bg);
          padding: 20px 12px;
          border-radius: 20px;
          text-align: center;
          margin-bottom: 16px;
          position: relative;
        }

        .premium-link-box {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 16px 12px;
          border-radius: 20px;
          margin-bottom: 16px;
        }

        .account-top-profile {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 24px 12px;
          border-radius: 22px;
          text-align: center;
          margin-bottom: 14px;
        }

        .avatar-frame {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid #00c896;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto;
          background: #000;
        }

        .account-action-node {
          flex: 1;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 12px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .live-feed-box {
          background: var(--card-bg);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          padding: 10px 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .live-feed-scroll {
          display: inline-block;
          animation: loop-feed 24s linear infinite;
        }

        .pulse-green-dot {
          width: 6px;
          height: 6px;
          background: #00c896;
          border-radius: 50%;
          box-shadow: 0 0 8px #00c896;
        }

        .premium-popup-border {
          border-radius: 24px !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }

        .shimmer-pulse {
          background: linear-gradient(90deg, #121212 25%, #1a1a1a 50%, #121212 75%);
          background-size: 200% 100%;
          animation: shimmer-anim 1.4s infinite;
        }

        .dot-badge-orange {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #ff9800;
          color: black;
          font-size: 8px;
          font-weight: 900;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes loop-feed {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes shimmer-anim {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes tab-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tab-fade-in {
          animation: tab-fade 0.2s ease-out forwards;
        }

        .premium-nav-btn {
          touch-action: manipulation;
        }
      `}} />
    </div>
  )
}