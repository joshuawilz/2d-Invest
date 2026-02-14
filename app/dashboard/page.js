'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

// Fonction pour générer l'ID unique de 4 caractères (Chiffres + Lettres)
const generateReferralID = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let id = ""
  for(let i=0; i<4; i++){ id += chars.charAt(Math.floor(Math.random()*chars.length)) }
  return id
}

const packsData = [
  { id: 1, name: "Pack Beginner", min: 2000, max: 10000, percent: 5, days: 30, color: "#00c896" },
  { id: 2, name: "Starter", min: 10001, max: 30000, percent: 7, days: 30, color: "#00d4ff" },
  { id: 3, name: "Advanced", min: 30001, max: 50000, percent: 10, days: 20, color: "#ffd700" },
  { id: 4, name: "Pro", min: 50001, max: 70000, percent: 15, days: 20, color: "#ff4d4d" },
  { id: 5, name: "Elite", min: 70001, max: 100000, percent: 20, days: 15, color: "#a155ff" },
  { id: 6, name: "ULTIMATE VIP", min: 100001, max: 999999999, percent: 25, days: 10, color: "#ff00ff" }
]

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState("home")
  const [showPopup, setShowPopup] = useState(true)
  const [activities, setActivities] = useState([])
  const [investments, setInvestments] = useState([]) // Gardé pour l'affichage
  
  const [rechargeBalance, setRechargeBalance] = useState(0)
  const [withdrawBalance, setWithdrawBalance] = useState(0)
  const [totalGains, setTotalGains] = useState(0)
  const [referralEarnings, setReferralEarnings] = useState(0)
  const [teamStats, setTeamStats] = useState({ lv1: 0, lv2: 0, lv3: 0 })
  const [userRefID, setUserRefID] = useState("") 

  const [amounts, setAmounts] = useState({ 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" })

  useEffect(() => {
    const fetchUser = async () => {
      const phone = localStorage.getItem("phone")
      if (!phone) return router.push("/auth/login")
      
      const { data } = await supabase.from("users").select("*").eq("phone", phone).single()
      if (data) {
        if (!data.referral_id) {
          const newID = generateReferralID()
          await supabase.from("users").update({ referral_id: newID }).eq("phone", phone)
          setUserRefID(newID)
        } else {
          setUserRefID(data.referral_id)
        }

        setUser(data)
        setRechargeBalance(data.recharge_balance || 0)
        setWithdrawBalance(data.withdraw_balance || 0)
        setTotalGains(data.total_gains || 0)
        setReferralEarnings(data.referral_earnings || 0)
        setTeamStats({ lv1: data.count_lv1 || 0, lv2: data.count_lv2 || 0, lv3: data.count_lv3 || 0 })

        // Charger les investissements pour la section ajoutée
        const { data: invData } = await supabase.from("investments").select("*").eq("user_phone", phone).eq("status", "active")
        if (invData) setInvestments(invData)
      }
      generateFeed()
    }
    fetchUser()
  }, [router])

  const generateFeed = () => {
    const names = ["Ali", "John", "Mariam", "Kevin", "Sofia", "Eric", "Linda", "Paul", "Emma", "Noah"]
    setActivities(Array.from({ length: 15 }).map(() => ({
      id: Math.random(),
      txt: `${names[Math.floor(Math.random() * names.length)]} vient de retirer ${Math.floor(Math.random() * 90000 + 5000)} FCFA`
    })))
  }

  const handleInvest = async (pack, amountStr) => {
    const amount = parseFloat(amountStr);
    if (!amount || amount < pack.min || amount > pack.max) return alert("Montant invalide");
    const totalAvail = rechargeBalance + withdrawBalance;
    if (totalAvail < amount) return alert("Solde insuffisant !");

    let newRec = rechargeBalance; let newWit = withdrawBalance;
    if (newRec >= amount) { newRec -= amount; } else { let reste = amount - newRec; newRec = 0; newWit -= reste; }

    try {
      await supabase.from("users").update({ recharge_balance: newRec, withdraw_balance: newWit }).eq("phone", user.phone);
      await supabase.from("investments").insert([{ user_phone: user.phone, pack_name: pack.name, amount, daily_percent: pack.percent, days_left: pack.days, status: "active" }]);
      setRechargeBalance(newRec); setWithdrawBalance(newWit); alert("Investissement activé avec succès !");
      window.location.reload();
    } catch (err) { alert("Erreur technique."); }
  };

  if (!user) return <div style={{ background: "#0a0a0a", height: "100vh" }}></div>

  const refUrl = `https://2d-invest.com/register?ref=${userRefID}`;
  const telegramLink = "https://t.me/akoumath";

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white", fontFamily: "sans-serif", paddingBottom: 90 }}>

      {showPopup && (
        <div style={popupOverlay}>
          <div style={popupBox}>
            <div style={{ fontSize: "40px" }}>🚀</div>
            <h2 style={{margin:'15px 0'}}>Bienvenue sur 2D INVEST</h2>
            <p style={{fontSize:'12px', opacity:0.7, marginBottom:'20px'}}>La plateforme N°1 de valorisation de produits digitaux.</p>
            <button onClick={() => setShowPopup(false)} style={enterBtn}>Accéder au Tableau de Bord</button>
          </div>
        </div>
      )}

      {/* --- ACCUEIL --- */}
      {tab === "home" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={headerBar}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={statusDot}></div><span style={{ fontSize: "11px", fontWeight:'bold' }}>SÉCURISÉ</span>
            </div>
            <span style={{ fontSize: "12px", opacity: 0.6 }}>ID: {userRefID}</span>
          </div>
          <div style={mainBalanceCard}>
            <p style={{ fontSize: "13px", opacity: 0.7 }}>Capital Total</p>
            <h1 style={{ fontSize: "36px", color: "#00c896", fontWeight:'bold', margin:'10px 0' }}>{(rechargeBalance + withdrawBalance).toLocaleString()} F</h1>
            <div style={{height:'2px', width:'40px', background:'#00c896', margin:'0 auto'}}></div>
          </div>
          <div style={{ display: "flex", width: "95%", gap: "10px", marginBottom: "25px" }}>
            {/* CHANGÉ ICI : SOLDE DE RECHARGE ET RETRAIT */}
            <div style={miniCard}><span style={miniLabel}>Solde de recharge</span><span style={miniValue}>{rechargeBalance.toLocaleString()} F</span></div>
            <div style={miniCard}><span style={miniLabel}>Solde de retrait</span><span style={miniValue}>{withdrawBalance.toLocaleString()} F</span></div>
          </div>
          <div style={actionGrid}>
            <ActionIcon icon="📥" text="Recharger" color="#00c896" click={() => router.push("/deposit")} />
            <ActionIcon icon="📤" text="Retirer" color="#ff4d4d" click={() => router.push("/withdraw")} />
            <ActionIcon icon="🛎️" text="Support" color="#0088cc" click={() => window.open(telegramLink)} />
            <ActionIcon icon="🏦" text="Portefeuille" color="#ffd700" click={() => router.push("/settings/wallet")} />
          </div>

          {/* AJOUTÉ ICI : SECTION INVESTISSEMENT */}
          <div style={{width:'92%', marginBottom:'20px'}}>
             <h3 style={{fontSize:'14px', color:'#00c896', marginBottom:'10px'}}>Mes investissements actifs</h3>
             {investments.length > 0 ? investments.map((inv, idx) => (
               <div key={idx} style={{background:'#111', padding:'15px', borderRadius:'15px', border:'1px solid #222', marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
                 <span>{inv.pack_name}</span>
                 <span style={{color:'#00c896'}}>+{inv.daily_percent}% / j</span>
               </div>
             )) : <p style={{fontSize:'12px', opacity:0.5}}>Aucun pack actif</p>}
          </div>

          <div style={bannerContainer}><img src="https://media.beehiiv.com/www/winter-release/features/digital-products/og-digital-products.png" style={heroImg} /></div>
          <div style={feedContainer}><div style={feedBox}><div style={feedScroll}>{activities.concat(activities).map((a, i) => (<span key={i} style={activityItem}>⚡ {a.txt}</span>))}</div></div></div>
        </div>
      )}

      {/* --- INVESTIR (CODE ORIGINAL RESTAURÉ) --- */}
      {tab === "invest" && (
        <div style={{ padding: 20, animation: "fadeIn 0.5s ease" }}>
          <div style={premiumHeaderInvest}>
            <div style={investStatCard}>
                <span style={investStatLabel}>MES GAINS</span>
                <span style={investStatValue}>+{totalGains.toLocaleString()} F</span>
            </div>
            <div style={{width:'1px', background:'#222', height:'40px'}}></div>
            <div style={investStatCard}>
                <span style={investStatLabel}>DISPONIBLE</span>
                <span style={{...investStatValue, color:'#00c896'}}>{(rechargeBalance + withdrawBalance).toLocaleString()} F</span>
            </div>
          </div>
          
          {packsData.map(p => {
            const val = parseFloat(amounts[p.id]) || 0;
            const isValide = (val >= p.min && val <= p.max);
            const dailyReturn = (val * p.percent) / 100;
            const totalReturn = dailyReturn * p.days;

            return (
              <div key={p.id} style={{ ...productBox, borderLeft: `4px solid ${p.color}` }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h4 style={{ color: p.color, margin: 0, fontSize:'18px' }}>{p.name}</h4>
                    <span style={{fontSize:'12px', background:`${p.color}20`, color:p.color, padding:'4px 10px', borderRadius:'10px', fontWeight:'bold'}}>{p.percent}% / jour</span>
                </div>
                
                <input type="number" placeholder={`Min: ${p.min} F - Max: ${p.max} F`} value={amounts[p.id]} onChange={(e) => setAmounts({ ...amounts, [p.id]: e.target.value })} style={packInputStyle} />
                
                {val > 0 && (
                  <div style={calcGrid}>
                    <div style={calcItem}><p>Retour Quotidien</p><b>{dailyReturn.toLocaleString()} F</b></div>
                    <div style={calcItem}><p>Fin de Cycle ({p.days}j)</p><b>{totalReturn.toLocaleString()} F</b></div>
                  </div>
                )}

                <button onClick={() => handleInvest(p, amounts[p.id])} style={{ ...investButton, background: isValide ? p.color : '#222' }}>Activer l'investissement</button>
              </div>
            )
          })}
        </div>
      )}

      {/* --- ÉQUIPE (CODE ORIGINAL RESTAURÉ) --- */}
      {tab === "team" && (
        <div style={{ padding: 20, animation: "fadeIn 0.5s ease" }}>
          <div style={teamMainCard}>
            <div style={{fontSize: '12px', opacity: 0.8, color: '#FFD700', letterSpacing:'1px'}}>COMMISSIONS TOTALES</div>
            <div style={{fontSize: '36px', fontWeight: 'bold', margin: '10px 0'}}>{referralEarnings.toLocaleString()} F</div>
            <div style={{fontSize: '10px', background: 'rgba(255,215,0,0.1)', padding: '5px 15px', borderRadius: '20px', display: 'inline-block', color:'#FFD700'}}>Fonds retirables sans délai</div>
          </div>
          <div style={inviteBox}>
             <h4 style={{margin: '0 0 15px 0', fontSize: '14px', color:'#00c896'}}>Parrainage & Récompenses</h4>
             <div style={copyContainer}>
                <input readOnly value={refUrl} style={copyInputStyleRef} />
                <button onClick={() => {navigator.clipboard.writeText(refUrl); alert("Lien copié !")}} style={copyBtnStyle}>COPIER</button>
             </div>
             <button onClick={() => window.open(`https://wa.me/?text=Gagne des revenus journaliers avec 2D INVEST ! Inscris-toi ici : ${refUrl}`)} style={whatsappBtn}>📢 PARTAGER SUR WHATSAPP</button>
          </div>
          <div style={levelGrid}>
            <div style={{...levelCard, background: 'linear-gradient(to bottom, #111, #0a0a0a)'}}><span style={levelTitle}>NIVEAU 1</span><span style={{...levelPercent, color:'#00c896'}}>20%</span><div style={levelStat}>{teamStats.lv1} 👥</div></div>
            <div style={{...levelCard, background: 'linear-gradient(to bottom, #111, #0a0a0a)'}}><span style={levelTitle}>NIVEAU 2</span><span style={{...levelPercent, color:'#00d4ff'}}>3%</span><div style={levelStat}>{teamStats.lv2} 👥</div></div>
            <div style={{...levelCard, background: 'linear-gradient(to bottom, #111, #0a0a0a)'}}><span style={levelTitle}>NIVEAU 3</span><span style={{...levelPercent, color:'#ffd700'}}>2%</span><div style={levelStat}>{teamStats.lv3} 👥</div></div>
          </div>
        </div>
      )}

      {/* --- COMPTE (CODE ORIGINAL RESTAURÉ) --- */}
      {tab === "settings" && (
        <div style={{ padding: 20, animation: "fadeIn 0.5s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={avatar}>👤</div>
            <h3 style={{fontSize:'22px', marginTop:'15px'}}>{user.phone}</h3>
            <span style={{fontSize:'10px', color:'#00c896', background:'#00c89615', padding:'3px 10px', borderRadius:'10px'}}>ID Unique: {userRefID}</span>
          </div>

          <div style={horizontalIconRow}>
             <div style={iconBoxCompte} onClick={() => router.push("/settings/wallet")}>
                <div style={{...iconCircle, color: '#ffd700', background: '#ffd70015'}}>🏦</div>
                <span>Portefeuille</span>
             </div>
             <div style={iconBoxCompte} onClick={() => window.open(telegramLink)}>
                <div style={{...iconCircle, color: '#0088cc', background: '#0088cc15'}}>✈️</div>
                <span>Telegram</span>
             </div>
             <div style={iconBoxCompte} onClick={() => { localStorage.clear(); router.push("/auth/login") }}>
                <div style={{...iconCircle, color: '#ff4d4d', background: '#ff4d4d15'}}>🚪</div>
                <span>Sortie</span>
             </div>
          </div>

          <div style={aboutCard}>
             <h4 style={{color: '#00c896', marginBottom: '10px', display:'flex', alignItems:'center', gap:'8px'}}>📦 Expertise Digitale</h4>
             <p style={{fontSize: '12px', lineHeight: '1.6', opacity: 0.8, textAlign:'justify'}}>
                2D INVEST est une plateforme de haute technologie spécialisée dans la monétisation de <b>produits digitaux exclusifs</b>. 
                Nous convertissons vos investissements en puissants leviers commerciaux pour la vente de formations professionnelles, 
                de signaux de trading haute précision et de ressources numériques rares. 
                Notre modèle garantit une distribution équitable des profits générés par l'économie du futur.
             </p>
          </div>
          <p style={{textAlign:'center', fontSize:'9px', opacity:0.3, marginTop:'30px'}}>SECURE PROTOCOL • 2D INVEST v3.0</p>
        </div>
      )}

      {/* BARRE DE NAVIGATION BASSE */}
      <div style={bottomNav}>
        <NavBtn icon="🏠" label="Accueil" active={tab === "home"} click={() => setTab("home")} />
        <NavBtn icon="🚀" label="Investir" active={tab === "invest"} click={() => setTab("invest")} />
        <NavBtn icon="👥" label="Équipe" active={tab === "team"} click={() => setTab("team")} />
        <NavBtn icon="👤" label="Compte" active={tab === "settings"} click={() => setTab("settings")} />
      </div>

      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/* --- TOUS TES STYLES ORIGINAUX SONT ICI --- */
const ActionIcon = ({ icon, text, color, click }) => (
  <div onClick={click} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1, cursor:'pointer' }}>
    <div style={{ width: "52px", height: "52px", borderRadius: "18px", backgroundColor: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", border: `1px solid ${color}30` }}>{icon}</div>
    <span style={{ fontSize: "11px", fontWeight: "600" }}>{text}</span>
  </div>
)
const NavBtn = ({ icon, label, active, click }) => (
  <button onClick={click} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: active ? "#00c896" : "#555", transition:'0.3s' }}>
    <span style={{ fontSize: "26px" }}>{icon}</span>
    <span style={{ fontSize: "10px", fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
  </button>
)
const popupOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.95)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
const popupBox = { background: "#111", padding: "40px 20px", borderRadius: "30px", textAlign: "center", width: "85%", border:'1px solid #222' }
const enterBtn = { width: "100%", padding: "15px", background: "#00c896", color: "white", border: "none", borderRadius: "15px", fontWeight: "bold", fontSize:'15px' }
const headerBar = { width: "90%", display: "flex", justifyContent: "space-between", padding: "20px 0" }
const statusDot = { width: "8px", height: "8px", background: "#00c896", borderRadius: "50%", boxShadow:'0 0 10px #00c896' }
const mainBalanceCard = { width: "92%", background: "linear-gradient(135deg, #111 0%, #050505 100%)", padding: "35px 20px", borderRadius: "28px", border: "1px solid #222", marginBottom: "20px", textAlign:'center' }
const miniCard = { flex: 1, background: "#111", padding: "15px", borderRadius: "20px", border: "1px solid #222" }
const miniLabel = { fontSize: "10px", opacity: 0.6, color: "#00c896", display: "block", marginBottom:'5px' }
const miniValue = { fontSize: "14px", fontWeight: "bold" }
const actionGrid = { display: "flex", width: "100%", padding: "10px 0 25px 0" }
const bannerContainer = { width: "92%", borderRadius: "24px", overflow: "hidden", border:'1px solid #222' }
const heroImg = { width: "100%", display: "block", opacity: 0.9 }
const feedContainer = { width: "100%", marginTop: "20px" }
const feedBox = { background: "rgba(0, 200, 150, 0.05)", padding: "14px 0", overflow: "hidden", whiteSpace: "nowrap", borderTop:'1px solid #111', borderBottom:'1px solid #111' }
const feedScroll = { display: "inline-block", animation: "scroll 45s linear infinite" }
const activityItem = { marginRight: "50px", fontSize: "12px", color:'#00c896' }
const premiumHeaderInvest = { display: "flex", justifyContent: "space-between", alignItems:'center', marginBottom: 25, background: "#111", padding: "20px", borderRadius: 24, border:'1px solid #222' }
const investStatCard = { display:'flex', flexDirection:'column', flex:1, textAlign:'center' }
const investStatLabel = { fontSize:'9px', color:'#666', marginBottom:'8px', letterSpacing:'1.5px' }
const investStatValue = { fontSize:'18px', fontWeight:'bold' }
const productBox = { background: "#111", padding: "20px", borderRadius: "24px", marginBottom: "20px", border: "1px solid #222" }
const packInputStyle = { width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '14px', borderRadius: '15px', marginTop: 15, outline:'none' }
const calcGrid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'15px' }
const calcItem = { background:'#000', padding:'10px', borderRadius:'12px', border:'1px solid #111', textAlign:'center' }
const investButton = { marginTop: "15px", width: "100%", padding: "15px", border: "none", borderRadius: "15px", color: "white", fontWeight: "bold", fontSize:'14px', cursor:'pointer' }
const teamMainCard = { background: 'linear-gradient(135deg, #111 0%, #000 100%)', padding: '35px 20px', borderRadius: '28px', textAlign: 'center', border: '1px solid #222', marginBottom: '25px' }
const inviteBox = { background: '#111', padding: '22px', borderRadius: '24px', border: '1px solid #222', marginBottom: '25px' }
const copyContainer = { display: 'flex', background: '#000', borderRadius: '15px', overflow: 'hidden', border: '1px solid #222', marginBottom: '15px' }
const copyInputStyleRef = { flex: 1, background: 'none', border: 'none', color: '#888', padding: '14px', fontSize: '11px' }
const copyBtnStyle = { background: '#00c896', border: 'none', color: 'white', padding: '0 20px', fontSize: '12px', fontWeight: 'bold' }
const whatsappBtn = { width: '100%', background: '#25D366', color: 'white', border: 'none', padding: '14px', borderRadius: '15px', fontWeight: 'bold', fontSize: '12px' }
const levelGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }
const levelCard = { padding: '20px 10px', borderRadius: '20px', textAlign: 'center', border: '1px solid #222' }
const levelTitle = { fontSize: '9px', opacity: 0.5, display: 'block', marginBottom:'5px' }
const levelPercent = { fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }
const levelStat = { fontSize: '13px', fontWeight: 'bold' }
const horizontalIconRow = { display: 'flex', justifyContent: 'space-around', background: '#111', padding: '20px 10px', borderRadius: '24px', border: '1px solid #222', marginBottom: '25px' }
const iconBoxCompte = { textAlign: 'center', flex: 1, fontSize: '11px', fontWeight: '600' }
const iconCircle = { width: '45px', height: '45px', borderRadius: '15px', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }
const avatar = { width: "80px", height: "80px", background: "#111", borderRadius: "40px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "35px", border: "2px solid #00c896" }
const aboutCard = { background: '#111', padding: '25px', borderRadius: '24px', border: '1px solid #222' }
const bottomNav = { position: "fixed", bottom: 0, left: 0, right: 0, height: "85px", background: "rgba(10,10,10,0.95)", backdropFilter:'blur(10px)', display: "flex", borderTop: "1px solid #1a1a1a", zIndex: 100 }