'use client'

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import { notifyError, notifySuccess, confirmAction } from "../../lib/alerts"

export default function WithdrawPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)
    const [method, setMethod] = useState('mobile') 
    const [cryptoNetwork, setCryptoNetwork] = useState('TRC20') 
    const [selectedWallet, setSelectedWallet] = useState("")
    const [selectedCountry, setSelectedCountry] = useState("")
    
    const [isCalculating, setIsCalculating] = useState(false)
    const [liveUsdtPrice, setLiveUsdtPrice] = useState(615) 
    const [dbFees, setDbFees] = useState({ tron: 1000, bep20: 300 })

    // CONFIGURATION STRICTE
    const MY_PROFIT_PCT = 0.10; // Tes 10% intouchables
    const NOW_SERVICE_FEE = 0.01; 
    const SLIPPAGE_BUFFER = 3; 

    useEffect(() => {
        const cachedRate = localStorage.getItem('last_usdt_rate')
        if (cachedRate) setLiveUsdtPrice(Number(cachedRate))

        const init = async () => {
            const phone = localStorage.getItem("phone")
            if (!phone) return router.push("/")

            // 1. Récupération User
            const { data: u } = await supabase.from("users").select("*").eq("phone", phone).single()
            if (u) { 
                setUser(u)
                setSelectedCountry(u.country_code || "TG")
            }

            // 2. Synchronisation Frais Réseau depuis la DB
            const { data: s } = await supabase.from("app_settings").select("key, value")
            if (s) {
                setDbFees({
                    tron: Number(s.find(x => x.key === 'tron_network_fee')?.value || 1000),
                    bep20: Number(s.find(x => x.key === 'bep20_network_fee')?.value || 300)
                })
            }

            // 3. Mise à jour Taux Live
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
                const data = await res.json()
                if(data.rates.XOF) {
                    const newRate = Math.round(data.rates.XOF)
                    setLiveUsdtPrice(newRate)
                    localStorage.setItem('last_usdt_rate', newRate.toString())
                }
            } catch (e) { console.log("Calcul sur taux de repli") }
        }
        init()
    }, [router])

    // LOGIQUE DE CALCUL "0 FRAIS PATRON"
    const amountNum = parseInt(amount) || 0
    const myProfit = Math.floor(amountNum * MY_PROFIT_PCT) // Ce qui va dans ta poche
    const remainingForClient = amountNum - myProfit // Base pour le calcul client
    
    const secureRate = liveUsdtPrice + SLIPPAGE_BUFFER 
    const usdtBase = remainingForClient / secureRate
    const serviceFeeUsdt = usdtBase * NOW_SERVICE_FEE
    
    // Frais de réseau convertis en USDT selon le choix
    const currentNetworkFeeCfa = cryptoNetwork === 'TRC20' ? dbFees.tron : dbFees.bep20
    const networkFeeUsdt = method === 'crypto' ? (currentNetworkFeeCfa / secureRate) : 0
    
    const finalReceiveUsdt = Math.max(0, usdtBase - serviceFeeUsdt - networkFeeUsdt).toFixed(2)
    const finalReceiveCfa = remainingForClient // Pour le mobile, il reçoit le reste net

    // PALIEERS DE SÉCURITÉ
    const minAmount = method === 'crypto' ? 10000 : 1000
    const isOverBalance = amountNum > (user?.withdraw_balance || 0)
    const isUnderMin = amountNum > 0 && amountNum < minAmount

    const getFilteredWallets = () => {
        if (!user) return []
        if (method === 'crypto') {
            const addr = cryptoNetwork === 'TRC20' ? user.usdt_trc20 : user.usdt_bep20
            return addr ? [{ label: `Wallet ${cryptoNetwork} : ${addr.substring(0,10)}...`, val: addr }] : []
        }
        const list = []
        if (user.wallet_number) list.push({ label: `Principal : ${user.wallet_number}`, val: user.wallet_number })
        if (user.wallet_number_2) list.push({ label: `Secondaire : ${user.wallet_number_2}`, val: user.wallet_number_2 })
        return list
    }

    const handleWithdraw = async () => {
        if (loading || isOverBalance || isUnderMin || !selectedWallet) return

        const confirmMsg = method === 'crypto' 
            ? `Confirmer le retrait de ${amountNum} F ?\n\nGain Patron : ${myProfit} F\nRéception estimée : ${finalReceiveUsdt} USDT\n(Réseau ${cryptoNetwork})`
            : `Confirmer le retrait de ${amountNum} F ?\n\nGain Patron : ${myProfit} F\nRéception nette : ${finalReceiveCfa} F`

        const confirmed = await confirmAction("VALIDATION RETRAIT", confirmMsg)
        if (!confirmed) return

        setLoading(true)
        try {
            // Appel RPC corrigé pour correspondre à la signature attendue
            const { error } = await supabase.rpc('process_withdrawal_v5', {
                p_user_phone: user.phone,
                p_amount: amountNum,
                p_fees: myProfit, // On informe la DB de ton gain
                p_receive_amount: method === 'crypto' ? parseFloat(finalReceiveUsdt) : finalReceiveCfa,
                p_country: selectedCountry,
                p_wallet: selectedWallet,
                p_network: method === 'crypto' ? cryptoNetwork : 'MOBILE',
                p_usdt_amount: method === 'crypto' ? parseFloat(finalReceiveUsdt) : 0
            })

            if (error) throw error

            notifySuccess("Demande envoyée", "Votre retrait est en cours de traitement.")
            router.push('/dashboard')
        } catch (err) {
            notifyError("Erreur SQL", err.message || "La fonction de retrait a échoué")
        } finally {
            setLoading(false)
        }
    }

    if (!user) return <div style={{background:'#050505', height:'100vh'}}></div>

    return (
        <div style={s.container}>
            <div style={s.header}>
                <button onClick={() => router.back()} style={s.backBtn}>❮</button>
                <div style={s.idBadge}>ID: {user.user_id_code}</div>
            </div>

            <div style={{...s.balanceCard, borderColor: isOverBalance ? '#ff4d4d' : '#222'}}>
                <p style={s.labelMin}>SOLDE DISPONIBLE</p>
                <h1 style={{...s.balanceText, color: isOverBalance ? '#ff4d4d' : '#00c896'}}>
                    {user.withdraw_balance?.toLocaleString()} <span style={{fontSize:18}}>F</span>
                </h1>
                <div style={s.progressBase}>
                    <div style={{
                        ...s.progressFill, 
                        width: `${Math.min((amountNum / user.withdraw_balance) * 100, 100)}%`,
                        background: isOverBalance ? '#ff4d4d' : '#00c896'
                    }}></div>
                </div>
            </div>

            <div style={s.methodSwitch}>
                <div onClick={() => setMethod('mobile')} style={{...s.mBtn, background: method === 'mobile' ? '#111' : 'transparent', color: method === 'mobile' ? '#00c896' : '#444'}}>MOBILE</div>
                <div onClick={() => setMethod('crypto')} style={{...s.mBtn, background: method === 'crypto' ? '#111' : 'transparent', color: method === 'crypto' ? '#f3ba2f' : '#444'}}>CRYPTO</div>
            </div>

            <div style={s.formCard}>
                <p style={s.labelMin}>MONTANT DU RETRAIT (FCFA)</p>
                <input 
                    type="number" 
                    placeholder="0" 
                    style={s.input} 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                />
                
                {isUnderMin && <p style={s.errorTag}>Minimum requis : {minAmount} F</p>}

                <div style={s.divider}></div>

                <div style={s.netBox}>
                    <div style={s.resRow}>
                        <span>Commission (10%)</span>
                        <span style={{color:'#ff4d4d'}}>- {myProfit} F</span>
                    </div>
                    <p style={{...s.labelMin, marginTop:15}}>VOUS RECEVEZ ENVIRON</p>
                    <h2 style={{margin:0, color: method === 'crypto' ? '#f3ba2f' : '#00c896', fontSize: 32}}>
                        {method === 'crypto' ? `${finalReceiveUsdt} USDT` : `${finalReceiveCfa.toLocaleString()} F`}
                    </h2>
                </div>

                {method === 'crypto' && (
                    <div style={{marginTop:20}}>
                        <p style={s.labelMin}>RÉSEAU BLOCKCHAIN</p>
                        <div style={s.networkGrid}>
                            <div onClick={() => setCryptoNetwork('TRC20')} style={{...s.netItem, borderColor: cryptoNetwork === 'TRC20' ? '#f3ba2f' : '#1a1a1a'}}>TRC20</div>
                            <div onClick={() => setCryptoNetwork('BEP20')} style={{...s.netItem, borderColor: cryptoNetwork === 'BEP20' ? '#f3ba2f' : '#1a1a1a'}}>BEP20</div>
                        </div>
                    </div>
                )}

                <div style={{marginTop:20}}>
                    <p style={s.labelMin}>COMPTE DE RÉCEPTION</p>
                    <select style={s.select} value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)}>
                        <option value="">Choisir un compte...</option>
                        {getFilteredWallets().map((w, i) => <option key={i} value={w.val}>{w.label}</option>)}
                    </select>
                </div>

                <button 
                    onClick={handleWithdraw} 
                    disabled={loading || isOverBalance || isUnderMin || !selectedWallet} 
                    style={{...s.mainBtn, background: (isOverBalance || isUnderMin) ? '#1a1a1a' : (method === 'crypto' ? '#f3ba2f' : '#00c896')}
                }>
                    {loading ? "TRAITEMENT..." : "CONFIRMER LE RETRAIT"}
                </button>
            </div>
        </div>
    )
}

const s = {
    container: { background: '#050505', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'system-ui' },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25, alignItems:'center' },
    backBtn: { background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#fff', borderRadius: 12, width: 40, height: 40, cursor:'pointer' },
    idBadge: { fontSize: 10, fontWeight: 900, color: '#00c896', background:'#0d0d0d', padding:'8px 12px', borderRadius:10, border:'1px solid #1a1a1a' },
    balanceCard: { background: '#0d0d0d', padding: 25, borderRadius: 28, border: '1px solid', textAlign: 'center', marginBottom: 20 },
    balanceText: { fontSize: 38, fontWeight: 900, margin: '8px 0', letterSpacing:'-1px' },
    progressBase: { width: '100%', height: 4, background: '#1a1a1a', borderRadius: 10, marginTop: 15, overflow: 'hidden' },
    progressFill: { height: '100%', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)' },
    labelMin: { fontSize: 9, fontWeight: 900, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase' },
    methodSwitch: { display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0d0d0d', padding: 4, borderRadius: 20, marginBottom: 20, border:'1px solid #1a1a1a' },
    mBtn: { padding: 14, textAlign: 'center', borderRadius: 16, fontSize: 11, fontWeight: 900, cursor: 'pointer', transition:'0.2s' },
    formCard: { background: '#0d0d0d', padding: 22, borderRadius: 28, border: '1px solid #1a1a1a' },
    input: { background: 'none', border: 'none', width: '100%', fontSize: 38, fontWeight: 900, color: '#fff', textAlign: 'center', outline: 'none', margin:'15px 0' },
    divider: { height: 1, background: '#1a1a1a', margin: '10px 0 20px 0' },
    netBox: { padding: 20, borderRadius: 22, background: '#080808', border: '1px solid #151515', textAlign: 'center' },
    resRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 5 },
    networkGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop:10 },
    netItem: { background: '#050505', padding: 15, borderRadius: 15, border: '2px solid', textAlign: 'center', fontSize: 12, fontWeight: 900, cursor:'pointer' },
    select: { width: '100%', background: '#050505', border: '1px solid #1a1a1a', padding: 18, borderRadius: 18, color: '#fff', fontSize: 13, fontWeight: 700, outline:'none' },
    mainBtn: { width: '100%', marginTop: 25, padding: 20, borderRadius: 20, border: 'none', color: '#000', fontWeight: 900, fontSize: 14, cursor:'pointer' },
    errorTag: { color: '#ff4d4d', fontSize: 10, fontWeight: 900, textAlign: 'center', marginTop: -10 }
}