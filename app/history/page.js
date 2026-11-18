'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import Swal from 'sweetalert2'

export default function HistoryPage() {
    const router = useRouter()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => { 
        fetchHistory() 
        const handleFocus = () => fetchHistory();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [])

    const fetchHistory = async () => {
        setLoading(true)
        const phone = localStorage.getItem("phone")
        if (!phone) return router.push("/register")

        try {
            // ON LIT TOUT DANS TRANSACTIONS (La nouvelle norme v5)
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_phone", phone)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTransactions(data || [])
        } catch (err) { 
            console.error("Erreur de récupération:", err) 
        } finally { 
            setLoading(false) 
        }
    }

    const handleCancelWithdraw = async (transactionId, amount) => {
        const result = await Swal.fire({
            title: 'Annuler le retrait ?',
            text: `Voulez-vous récupérer vos ${Number(amount).toLocaleString()} F sur votre solde ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00c896',
            cancelButtonColor: '#d33',
            confirmButtonText: 'OUI, ANNULER',
            cancelButtonText: 'NON',
            background: '#111',
            color: '#fff'
        })

        if (!result.isConfirmed) return

        setCancelling(true)
        try {
            const phone = localStorage.getItem("phone")
            
            // APPEL DE LA FONCTION SQL v5 (Celle qu'on a créée ensemble)
            const { error } = await supabase.rpc('cancel_withdrawal_v5', {
                p_transaction_id: transactionId,
                p_user_phone: phone
            })

            if (error) throw error

            // Mise à jour du cache local pour le dashboard
            const oldBalance = parseFloat(localStorage.getItem("cache_wb") || "0")
            localStorage.setItem("cache_wb", oldBalance + parseFloat(amount))
            
            Swal.fire({ icon: 'success', title: 'Succès', text: 'Retrait annulé et fonds reversés.', background: '#111', color: '#fff' })
            fetchHistory() 
        } catch (err) { 
            console.error(err)
            Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible d\'annuler ce retrait.', background: '#111', color: '#fff' })
        } finally { 
            setCancelling(false) 
        }
    }

    const filteredData = transactions.filter(t => {
        const type = t.type?.toUpperCase()
        if (filter === "deposits") return type.includes('DEPOSIT') || type.includes('DEPOT')
        if (filter === "withdrawals") return type === 'WITHDRAW' || type === 'RETRAIT'
        if (filter === "gains") return ['ROI', 'GAIN', 'REFERRAL', 'COMMISSION', 'WELCOME_BONUS'].includes(type)
        return true
    })

    return (
        <div style={s.container}>
            <div style={s.header}>
                <button onClick={() => router.push('/dashboard')} style={s.backBtn}>❮</button>
                <h1 style={s.title}>HISTORIQUE DES FLUX</h1>
                <div style={s.statusDot}></div>
            </div>

            <div style={s.tabsContainer}>
                {['all', 'deposits', 'withdrawals', 'gains'].map((f) => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)} 
                        style={{
                            ...s.tab, 
                            color: filter === f ? "#00c896" : "#666", 
                            borderBottom: filter === f ? "3px solid #00c896" : "3px solid transparent",
                            background: filter === f ? "rgba(0, 200, 150, 0.05)" : "transparent"
                        }}
                    >
                        {f === 'all' ? 'Tout' : f === 'deposits' ? 'Dépôts' : f === 'withdrawals' ? 'Retraits' : 'Gains'}
                    </button>
                ))}
            </div>

            <div style={s.list}>
                {loading ? (
                    <div style={s.statusMsg}>Synchronisation des données...</div>
                ) : filteredData.length === 0 ? (
                    <div style={s.emptyContainer}>
                        <div style={{fontSize: '40px', marginBottom: '10px'}}>📑</div>
                        Aucun mouvement enregistré
                    </div>
                ) : (
                    filteredData.map((item, i) => {
                        const status = item.status?.toUpperCase(); // On force la majuscule pour la comparaison
                        const type = item.type?.toUpperCase();
                        
                        const isPending = status === 'PENDING';
                        const isApprove = ['APPROVED', 'SUCCESS', 'COMPLETED', 'COMPLÉTÉ'].includes(status);
                        const isFailed = ['FAILED', 'REJECTED', 'ÉCHOUÉ'].includes(status);
                        const isCancelled = status === 'CANCELLED' || status === 'ANNULÉ';
                        
                        const isWithdraw = type === 'WITHDRAW' || type === 'RETRAIT';
                        const isDepot = type.includes('DEPOSIT') || type.includes('DEPOT');
                        const isReferral = ['REFERRAL', 'COMMISSION'].includes(type);

                        let label = "Gain de Cycle";
                        if (isDepot) label = "Recharge de Compte";
                        if (isWithdraw) label = "Demande de Retrait";
                        if (isReferral) label = "Prime d'Invitation";
                        if (type === 'WELCOME_BONUS') label = "Bonus de Bienvenue";

                        let statusText = "EN ATTENTE";
                        if (isApprove) statusText = isWithdraw ? "PAYÉ" : "APPROUVÉ";
                        else if (isFailed) statusText = "ÉCHOUÉ";
                        else if (isCancelled) statusText = "ANNULÉ";
                        else if (!isWithdraw && !isDepot) statusText = "COMPLÉTÉ";

                        return (
                            <div key={i} style={s.cardWrapper}>
                                <div style={{...s.card, borderLeft: isWithdraw ? '4px solid #ff4d4d' : '4px solid #00c896'}}>
                                    <div style={{...s.iconBox, background: isWithdraw ? 'rgba(255,77,77,0.1)' : 'rgba(0,200,150,0.1)'}}>
                                        {isReferral ? '👥' : (isDepot ? '📥' : (isWithdraw ? '📤' : '📈'))}
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={s.transName}>{label} {item.network ? `(${item.network})` : ''}</span>
                                            <span style={{...s.amount, color: isWithdraw ? '#ff4d4d' : '#00c896'}}>
                                                {isWithdraw ? '-' : '+'}{Number(item.amount).toLocaleString()} F
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                            <span style={s.dateText}>{new Date(item.created_at).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                                            
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {isWithdraw && isPending && (
                                                    <button onClick={() => handleCancelWithdraw(item.id, item.amount)} disabled={cancelling} style={s.cancelBtn}>ANNULER</button>
                                                )}
                                                <span style={{
                                                    ...s.statusBadge, 
                                                    color: isApprove || (!isWithdraw && !isDepot) ? '#00c896' : (isFailed || isCancelled) ? '#ff4d4d' : '#ff9800',
                                                    background: isApprove || (!isWithdraw && !isDepot) ? 'rgba(0,200,150,0.1)' : (isFailed || isCancelled) ? 'rgba(255,77,77,0.1)' : 'rgba(255,152,0,0.1)',
                                                    padding: '4px 8px',
                                                    borderRadius: '8px'
                                                }}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

const s = {
    container: { background: "#050505", minHeight: "100vh", color: "white", padding: "20px", fontFamily: "sans-serif", boxSizing: 'border-box' },
    header: { display: "flex", alignItems: "center", justifyContent:'space-between', marginBottom: 25 },
    backBtn: { background: "#111", border: "1px solid #222", color: "white", width: "45px", height: "45px", borderRadius: "15px", cursor: "pointer", fontSize: '18px' },
    title: { margin: 0, fontSize: '16px', fontWeight: '900', letterSpacing: '1px' },
    statusDot: { width: '10px', height: '10px', background: '#00c896', borderRadius: '50%', boxShadow: '0 0 10px #00c896' },
    tabsContainer: { display: "flex", background: '#111', borderRadius: '15px', padding: '5px', marginBottom: 25 },
    tab: { flex: 1, background: 'none', border: "none", fontSize: '11px', cursor: "pointer", fontWeight: "800", padding: "12px 0", borderRadius: '12px', transition: '0.3s' },
    list: { display:'flex', flexDirection:'column', gap:'15px', paddingBottom: 50 },
    cardWrapper: { display:'flex', flexDirection:'column', width: '100%' },
    card: { background: "#0f0f0f", padding: "18px", borderRadius: "22px", display: "flex", alignItems: "center", gap: 15, border: "1px solid #1a1a1a", boxSizing: 'border-box' },
    iconBox: { width: 45, height: 45, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: '20px' },
    transName: { fontSize: '13px', fontWeight: '700' },
    amount: { fontSize: '14px', fontWeight: '900' },
    dateText: { fontSize: '10px', color: '#555', fontWeight: 'bold' },
    statusBadge: { fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' },
    cancelBtn: { background: 'rgba(255,77,77,0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d', fontSize: '9px', fontWeight: '900', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' },
    statusMsg: { textAlign: 'center', marginTop: 50, fontSize: '13px', color: '#00c896', fontWeight: 'bold' },
    emptyContainer: { textAlign: 'center', marginTop: 80, fontSize: '14px', opacity: 0.4, fontWeight: 'bold' }
}