'use client'

import { useState, useEffect } from "react"
import { supabase } from "../../../lib/supabase"
import { useRouter } from "next/navigation"
import Swal from 'sweetalert2'

const COUNTRIES_CONFIG = {
    "Togo": { prefix: "+228", length: 8, networks: ["T-Money", "Moov Money"] },
    "Bénin": { prefix: "+229", length: 8, networks: ["MTN MoMo", "Moov Money"] },
    "Côte d'Ivoire": { prefix: "+225", length: 10, networks: ["Orange Money", "MTN MoMo", "Moov Money", "Wave"] },
    "Sénégal": { prefix: "+221", length: 9, networks: ["Orange Money", "Free Money", "Wave"] },
    "Mali": { prefix: "+223", length: 8, networks: ["Orange Money", "Moov Money"] },
    "Burkina Faso": { prefix: "+226", length: 8, networks: ["Orange Money", "Moov Money"] }
}

export default function WalletSettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('mobile') // 'mobile' ou 'crypto'

    // États pour les formulaires
    const [mobileForm, setMobileForm] = useState({ country: "Togo", network: "T-Money", number: "", label: "" })
    const [cryptoForm, setCryptoForm] = useState({ type: "USDT_TRC20", address: "" })

    useEffect(() => {
        const loadUser = async () => {
            const phone = localStorage.getItem("phone")
            const { data } = await supabase.from("users").select("*").eq("phone", phone).single()
            if (data) setUser(data)
        }
        loadUser()
    }, [])

    const validateMobile = () => {
        const config = COUNTRIES_CONFIG[mobileForm.country]
        const cleanNumber = mobileForm.number.replace(/\s/g, '')
        if (cleanNumber.length !== config.length) {
            Swal.fire({ icon: 'error', title: 'Format invalide', text: `Au ${mobileForm.country}, le numéro doit comporter exactement ${config.length} chiffres.`, background: '#111', color: '#fff' })
            return false
        }
        return cleanNumber
    }

    const saveWallet = async (type, slot = null) => {
        setLoading(true)
        const phone = localStorage.getItem("phone")
        let updateData = {}

        try {
            if (type === 'mobile') {
                const cleanNum = validateMobile()
                if (!cleanNum) return setLoading(false)
                
                const finalValue = `[${mobileForm.country}] ${mobileForm.network} : ${cleanNum} (${mobileForm.label.toUpperCase()})`
                const column = slot === 1 ? "wallet_number" : "wallet_number_2"
                updateData = { [column]: finalValue }
            } else {
                if (cryptoForm.address.length < 20) throw new Error("Adresse Crypto trop courte ou invalide.")
                const column = cryptoForm.type === "USDT_BEP20" ? "usdt_bep20" : "usdt_trc20"
                updateData = { [column]: cryptoForm.address }
            }

            const { error } = await supabase.from("users").update(updateData).eq("phone", phone)
            if (error) throw error

            await Swal.fire({ icon: 'success', title: 'ENREGISTRÉ', background: '#111', color: '#fff', confirmButtonColor: '#00c896' })
            window.location.reload()
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, background: '#111', color: '#fff' })
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div style={s.container}>
            <div style={s.header}>
                <button onClick={() => router.back()} style={s.backBtn}>❮</button>
                <h2 style={s.title}>Gestion des Wallets</h2>
            </div>

            {/* SÉLECTEUR DE FLUX : MOBILE OU CRYPTO */}
            <div style={s.tabBar}>
                <button onClick={() => setActiveTab('mobile')} style={{...s.tab, borderBottom: activeTab === 'mobile' ? '3px solid #00c896' : 'none', color: activeTab === 'mobile' ? '#00c896' : '#555'}}>MOBILE MONEY</button>
                <button onClick={() => setActiveTab('crypto')} style={{...s.tab, borderBottom: activeTab === 'crypto' ? '3px solid #00c896' : 'none', color: activeTab === 'crypto' ? '#00c896' : '#555'}}>CRYPTO USDT</button>
            </div>

            {activeTab === 'mobile' ? (
                <div style={s.section}>
                    <p style={s.info}>Configurez jusqu'à 2 numéros de retrait mobile.</p>
                    
                    {/* SLOT 1 & 2 MOBILE */}
                    {[1, 2].map(slot => (
                        <div key={slot} style={s.card}>
                            <div style={s.slotTitle}>COMPTE MOBILE {slot}</div>
                            {user[`wallet_number${slot === 2 ? '_2' : ''}`] ? (
                                <div style={s.savedVal}>{user[`wallet_number${slot === 2 ? '_2' : ''}`]}</div>
                            ) : (
                                <div style={s.form}>
                                    <select style={s.input} onChange={(e) => setMobileForm({...mobileForm, country: e.target.value})}>
                                        {Object.keys(COUNTRIES_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select style={s.input} onChange={(e) => setMobileForm({...mobileForm, network: e.target.value})}>
                                        {COUNTRIES_CONFIG[mobileForm.country].networks.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <input type="tel" placeholder="Numéro sans préfixe" style={s.input} onChange={(e) => setMobileForm({...mobileForm, number: e.target.value})} />
                                    <input type="text" placeholder="Nom du titulaire" style={s.input} onChange={(e) => setMobileForm({...mobileForm, label: e.target.value})} />
                                    <button onClick={() => saveWallet('mobile', slot)} style={s.btnSave}>LIER LE NUMÉRO</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={s.section}>
                    <p style={s.info}>Enregistrez vos adresses USDT pour les gros retraits.</p>
                    
                    <div style={s.card}>
                        <div style={s.slotTitle}>USDT BEP20 (Binance Smart Chain)</div>
                        {user.usdt_bep20 ? <div style={s.savedVal}>{user.usdt_bep20}</div> : 
                            <div style={s.form}>
                                <input type="text" placeholder="Adresse Ox..." style={s.input} onChange={(e) => setCryptoForm({type: "USDT_BEP20", address: e.target.value})} />
                                <button onClick={() => saveWallet('crypto')} style={s.btnSave}>ENREGISTRER BEP20</button>
                            </div>
                        }
                    </div>

                    <div style={s.card}>
                        <div style={s.slotTitle}>USDT TRC20 (Réseau TRON)</div>
                        {user.usdt_trc20 ? <div style={s.savedVal}>{user.usdt_trc20}</div> : 
                            <div style={s.form}>
                                <input type="text" placeholder="Adresse T..." style={s.input} onChange={(e) => setCryptoForm({type: "USDT_TRC20", address: e.target.value})} />
                                <button onClick={() => saveWallet('crypto')} style={s.btnSave}>ENREGISTRER TRC20</button>
                            </div>
                        }
                    </div>
                </div>
            )}
        </div>
    )
}

const s = {
    container: { background: '#050505', minHeight: '100vh', padding: '20px', color: '#fff' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    backBtn: { background: '#111', border: '1px solid #222', color: '#fff', width: '40px', height: '40px', borderRadius: '12px' },
    title: { fontSize: '18px', fontWeight: '900' },
    tabBar: { display: 'flex', marginBottom: '25px', borderBottom: '1px solid #111' },
    tab: { flex: 1, padding: '15px', background: 'none', border: 'none', fontWeight: '900', fontSize: '12px', cursor: 'pointer' },
    section: { animation: 'fadeIn 0.5s ease' },
    info: { fontSize: '12px', color: '#666', marginBottom: '20px' },
    card: { background: '#0d0d0d', borderRadius: '20px', padding: '20px', marginBottom: '15px', border: '1px solid #1a1a1a' },
    slotTitle: { fontSize: '10px', color: '#00c896', fontWeight: '900', marginBottom: '15px', letterSpacing: '1px' },
    savedVal: { background: '#000', padding: '15px', borderRadius: '12px', fontSize: '13px', color: '#00c896', border: '1px solid #00c89633', wordBreak: 'break-all' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '12px', color: '#fff', outline: 'none' },
    btnSave: { background: '#00c896', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', marginTop: '10px' }
}