'use client'

import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import Swal from 'sweetalert2'

/**
 * ADMIN MASTER FINAL - 2D INVEST
 * VERSION INTÉGRALE - REFAITE SANS AUCUNE SIMPLIFICATION
 * + REFONTE COMPLÈTE DU DESIGN DES TICKETS ET DÉTECTION ROBUSTE DES IMAGES
 */
export default function AdminFinalMaster() {
    const router = useRouter()
    const [view, setView] = useState("users")
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ 
        users: 0, dep: 0, with: 0, support: 0, 
        totalDeposited: 0, totalWithdrawn: 0, netFlow: 0 
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [filterStatus, setFilterStatus] = useState("all") 
    const [sending, setSending] = useState(false)

    const [supportSubView, setSupportSubView] = useState("reclamations") 

    const [activeChatPhone, setActiveChatPhone] = useState(null)
    const [activeUserInfo, setActiveUserInfo] = useState(null)
    const [chatMessages, setChatMessages] = useState([])
    const [adminReplyInput, setAdminReplyInput] = useState("")
    const [showAllMessages, setShowAllMessages] = useState(false) 
    const chatEndRef = useRef(null)
    const fileInputRef = useRef(null)

    const ADMIN_PHONE_BASE = "92360282"
    const BUCKET_NAME = "support_attachments"

    // --- CONSTANTES CSS ET DESIGN SACRÉES (CONSERVÉES À 100%) ---
    const s = {
        container: { display:'flex', background:'#050505', minHeight:'100vh', color:'#fff', fontFamily:'sans-serif' },
        sidebar: { width:'280px', background:'#000', padding:'25px', borderRight:'1px solid #151515', position:'sticky', top:0, height:'100vh', zIndex: 100 },
        logo: { color:'#00c896', textAlign:'center', marginBottom:'40px', fontSize:'22px', fontWeight:'900', letterSpacing: '1px' },
        navBtn: { width:'100%', background:'none', border:'none', color:'#666', padding:'16px', textAlign:'left', cursor:'pointer', marginBottom:'8px', borderRadius:'12px', fontSize:'14px', display:'flex', justifyContent:'space-between', alignItems:'center', transition: '0.3s' },
        navActive: { width:'100%', background:'rgba(0, 200, 150, 0.08)', border:'1px solid rgba(0, 200, 150, 0.1)', color:'#00c896', padding:'16px', textAlign:'left', fontWeight:'bold', marginBottom:'8px', borderRadius:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' },
        badge: { background: '#00c896', color: '#000', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' },
        badgeRed: { background: '#ff4d4d', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' },
        badgeNotify: { background: '#ffd700', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
        badgeCount: { color: '#444', fontSize: '11px', marginLeft: 5 },
        sysBox: { marginTop: '40px', padding: '20px', background: '#080808', borderRadius: '15px', border: '1px solid #111' },
        sysTitle: { fontSize: '10px', color: '#444', marginBottom: '15px', fontWeight: 'bold', textTransform: 'uppercase' },
        btnGains: { width:'100%', background:'#ffd700', border:'none', padding:'14px', borderRadius:'10px', cursor:'pointer', fontWeight:'bold', color: '#000', fontSize: '12px' },
        main: { flex:1, padding:'40px', maxWidth: '1400px', margin: '0 auto', minWidth: '0' },
        financeRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' },
        financeCard: { background: '#000', padding: '25px', borderRadius: '20px', border: '1px solid #151515', display: 'flex', flexDirection: 'column', gap: '10px' },
        finLabel: { fontSize: '11px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase' },
        finVal: { fontSize: '28px', fontWeight: '900' },
        header: { display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom:'30px' },
        headerRight: { display:'flex', alignItems:'center', gap:'15px' },
        title: { fontSize: '24px', margin: 0, fontWeight: '800' },
        tabRow: { display:'flex', gap: '15px', background: '#000', padding: '5px', borderRadius: '25px', border: '1px solid #151515' },
        tab: { background: 'none', border: 'none', color: '#444', fontSize: '12px', cursor: 'pointer', padding: '8px 20px', borderRadius: '20px', transition: '0.3s' },
        tabActive: { background: '#111', color: '#fff', fontSize: '12px', padding: '8px 20px', borderRadius: '20px', border: '1px solid #222' },
        searchContainer: { marginBottom: '25px', position: 'relative' },
        searchInput: { width: '100%', padding: '18px 25px', borderRadius: '18px', border: '1px solid #151515', background: '#000', color: '#fff', outline: 'none', fontSize: '14px' },
        btnRef: { background:'#fff', color:'#000', border:'none', width:'40px', height:'40px', borderRadius: '50%', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
        tableCard: { background:'#000', borderRadius:'24px', border:'1px solid #151515', overflow:'hidden' },
        table: { width:'100%', borderCollapse:'collapse' },
        thead: { background:'#080808' },
        th: { padding:'20px', fontSize:'11px', color: '#444', textAlign:'left', textTransform: 'uppercase', letterSpacing: '1px' },
        td: { padding:'22px 20px', borderTop:'1px solid #111', verticalAlign: 'middle' },
        tr: { transition: '0.2s' },
        small: { fontSize:'12px', color:'#555', display: 'block', marginTop: '4px' },
        detailsBox: { background:'#050505', padding:'15px', borderRadius:'12px', border:'1px solid #111' },
        balanceRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', gap:'20px', marginBottom: '5px' },
        miniature: { width: '50px', height: '50px', borderRadius: '8px', marginTop: '10px', cursor:'pointer', border: '1px solid #222', objectFit: 'cover' },
        btnAction: { background:'#080808', color:'#888', border:'1px solid #151515', padding:'10px', borderRadius:'10px', cursor:'pointer', fontSize:'10px', fontWeight: 'bold', textTransform: 'uppercase' },
        btnV: { background:'#00c896', color:'#000', border:'none', padding:'12px 20px', borderRadius:'10px', fontWeight:'900', cursor:'pointer', transition: '0.2s' },
        btnR: { background:'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border:'1px solid rgba(255, 77, 77, 0.2)', padding:'12px 20px', borderRadius:'10px', cursor:'pointer', transition: '0.2s' },
        statusTag: { padding: '6px 14px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', display: 'inline-block' },
        btnReset: { background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '10px', textDecoration: 'underline' },
        chatContainer: { display:'flex', flexDirection:'column', height:'75vh', background:'#000', borderRadius:'24px', border:'1px solid #151515', overflow:'hidden' },
        chatBox: { flex:1, padding:'25px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'15px', background: '#050505' },
        userBubble: { background:'#181818', padding:'15px', borderRadius:'18px 18px 18px 2px', border:'1px solid #222', color:'#eee', fontSize:'14px', maxWidth: '80%' },
        adminBubble: { background:'rgba(0, 200, 150, 0.1)', padding:'15px', borderRadius:'18px 18px 2px 18px', border:'1px solid #00c89644', color:'#fff', fontSize:'14px', maxWidth: '80%', alignSelf: 'flex-end' },
        systemBubble: { background:'rgba(255, 215, 0, 0.03)', border:'1px dashed #ffd70044', padding:'15px', borderRadius:'15px', width:'90%', alignSelf:'center', textAlign:'center', marginBottom: '10px' },
        replyInput: { flex:1, background:'#000', border:'1px solid #222', borderRadius:'25px', color:'#fff', padding:'12px 20px', outline:'none', fontSize: '14px' },
        fraudTag: { color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '4px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block', marginTop: '5px' },
        onlineDot: { width:'8px', height:'8px', borderRadius:'50%', background:'#00c896', display:'inline-block', marginRight:'8px', boxShadow: '0 0 10px #00c896' },
        btnSend: { background:'#34b7f1', width:'45px', height:'45px', borderRadius:'50%', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize: '18px' },
        glowBox: { background:'rgba(255, 215, 0, 0.05)', border:'1px solid #ffd700', borderRadius:'15px', padding:'15px', margin:'10px 0', boxShadow:'0 0 15px rgba(255,215,0,0.1)' }
    }

    // --- LOGIQUE DE SYNCHRONISATION ---
    useEffect(() => {
        const checkAdmin = () => {
            const phone = localStorage.getItem("phone")
            if (!phone || !phone.endsWith(ADMIN_PHONE_BASE)) {
                router.push("/") 
                return
            }
            loadData()
            loadStats()
        }
        checkAdmin()
    }, [view, filterStatus, supportSubView])

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, showAllMessages]);

    useEffect(() => {
        const channel = supabase.channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (payload) => {
                if (activeChatPhone && payload.new.user_phone === activeChatPhone) {
                    fetchChatHistory(activeChatPhone);
                }
                loadStats();
                if (view === "support_tickets") loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => { loadStats(); if(view === 'deposits') loadData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'withdraws' }, () => { loadStats(); if(view === 'withdraws') loadData(); })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [activeChatPhone, view])

    // --- FONCTIONS DATA ---
    async function loadStats() {
        try {
            const { count: u } = await supabase.from('users').select('*', { count: 'exact', head: true })
            const { count: d_pending } = await supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            const { count: w_pending } = await supabase.from('withdraws').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            const { count: s_unread } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('admin_read', false);
            
            const { data: depSum } = await supabase.from('deposits').select('amount').eq('status', 'approved')
            const { data: withSum } = await supabase.from('withdraws').select('amount').eq('status', 'approved')
            
            const totalDep = depSum?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
            const totalWit = withSum?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

            setStats({ 
                users: u || 0, dep: d_pending || 0, with: w_pending || 0, support: s_unread || 0,
                totalDeposited: totalDep, 
                totalWithdrawn: totalWit,
                netFlow: totalDep - totalWit
            })
        } catch (e) { console.error("Stats Error:", e) }
    }

    async function loadData() {
        setLoading(true)
        try {
            let query = supabase.from(view).select("*").order("created_at", { ascending: false })
            
            if (filterStatus === "pending" && view !== "users") {
                if (view === "support_tickets") query = query.eq('admin_read', false);
                else query = query.eq('status', 'pending')
            }

            const { data: res, error } = await query
            if (!error && res) {
                if (view === "support_tickets") {
                    const filteredBySubject = res.filter(m => {
                        const isReclamation = m.message_type === "RECLAMATION" || m.subject === "RECLAMATION" || (m.description && m.description.includes("ID Transaction"));
                        return supportSubView === "reclamations" ? isReclamation : !isReclamation;
                    });

                    const uniqueUsers = {};
                    filteredBySubject.forEach(msg => {
                        if (!uniqueUsers[msg.user_phone] || new Date(msg.created_at) > new Date(uniqueUsers[msg.user_phone].created_at)) {
                            uniqueUsers[msg.user_phone] = msg;
                        }
                    });
                    setData(Object.values(uniqueUsers));
                } else {
                    setData(res)
                }
            }
        } catch (e) { console.error("Data Error:", e) }
        setLoading(false)
    }

    async function fetchChatHistory(phone) {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_phone', phone)
            .order('created_at', { ascending: true });
        if (!error && data) setChatMessages(data);
        await supabase.from('support_tickets').update({ admin_read: true }).eq('user_phone', phone).eq('admin_read', false);
    }

    async function fetchTargetUserInfo(phone) {
        const { data } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle();
        if (data) setActiveUserInfo(data);
    }

    async function logAdminAction(action, target, details) {
        await supabase.from('admin_logs').insert({
            admin_phone: localStorage.getItem('phone'),
            action_type: action,
            target_phone: target,
            details: details,
            created_at: new Date()
        });
    }

    // --- ACTIONS SUPPORT ---
    async function sendAdminReply(predefinedMsg = null) {
        const messageToSend = predefinedMsg || adminReplyInput;
        if (!messageToSend.trim() || sending || !activeChatPhone) return;
        
        setSending(true);
        try {
            const { error: insError } = await supabase.from('support_tickets').insert({
                user_phone: activeChatPhone,
                subject: supportSubView === "reclamations" ? "RÉPONSE RÉCLAMATION" : "CHAT DIRECT",
                description: "RÉPONSE ADMINISTRATIVE",
                admin_reply: messageToSend,
                status: 'closed',
                user_read: false,
                admin_read: true,
                last_sender_type: 'admin',
                message_type: 'CHAT'
            });

            if (insError) throw insError;

            setAdminReplyInput("");
            await fetchChatHistory(activeChatPhone);
            loadData();
            loadStats();
        } catch (err) {
            Swal.fire("Erreur", "L'envoi a échoué", "error");
        } finally {
            setSending(false);
        }
    }

    async function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file || !activeChatPhone) return;
        setSending(true);
        const fileName = `admin/${Date.now()}-${file.name}`;
        try {
            const { error: upErr } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

            await supabase.from('support_tickets').insert({ 
                user_phone: activeChatPhone,
                description: "RÉPONSE ADMINISTRATIVE",
                admin_reply: publicUrl, 
                status: 'closed',
                user_read: false,
                admin_read: true,
                last_sender_type: 'admin',
                message_type: 'CHAT'
            });

            await fetchChatHistory(activeChatPhone);
        } catch (err) {
            Swal.fire("Erreur", "Téléchargement échoué", "error");
        } finally {
            setSending(false);
        }
    }

    // --- ACTIONS TRANSACTIONS ---
    async function processTransaction(item, newStatus) {
        if (isProcessing) return;
        
        if (view === 'deposits' && newStatus === 'success') {
            const { data: duplicate } = await supabase.from('deposits')
                .select('id')
                .eq('transaction_id', item.transaction_id)
                .eq('status', 'approved')
                .neq('id', item.id)
                .maybeSingle();
            
            if (duplicate) {
                const warn = await Swal.fire({
                    title: 'FRAUDE DÉTECTÉE !',
                    text: "Cet ID de transaction a déjà été validé pour un autre dépôt.",
                    icon: 'error',
                    showCancelButton: true,
                    confirmButtonText: 'FORCER QUAND MÊME',
                    cancelButtonText: 'ANNULER'
                });
                if (!warn.isConfirmed) return;
            }
        }

        let reason = "";
        if (newStatus === 'failed') {
            const { value: text, isConfirmed } = await Swal.fire({
                title: 'Raison du rejet',
                input: 'textarea',
                inputPlaceholder: 'Expliquez pourquoi...',
                showCancelButton: true,
                confirmButtonText: 'REJETER'
            });
            if (!isConfirmed) return;
            reason = text || "Opération rejetée par l'administration.";
        }

        setIsProcessing(true);
        try {
            if (newStatus === 'success') {
                if (view === 'deposits') {
                    const { error } = await supabase.rpc('approve_deposit', { 
                        dep_id: item.id, user_phone_param: item.user_phone, amount_param: Number(item.amount) 
                    });
                    if (error) throw error;
                    
                    await supabase.from('support_tickets').insert({
                        user_phone: item.user_phone,
                        subject: 'NOTIFICATION SYSTÈME',
                        description: `DÉPÔT VALIDÉ ✅`,
                        admin_reply: `Votre dépôt de ${item.amount} F a été crédité avec succès.`,
                        message_type: 'SYSTEM',
                        admin_read: true,
                        last_sender_type: 'admin'
                    });
                    
                    await logAdminAction('APPROVE_DEPOSIT', item.user_phone, { id: item.id, amount: item.amount });
                } else {
                    await supabase.from('withdraws').update({ status: 'approved' }).eq('id', item.id);
                    await supabase.from('support_tickets').insert({
                        user_phone: item.user_phone,
                        subject: 'NOTIFICATION SYSTÈME',
                        description: `RETRAIT PAYÉ 💸`,
                        admin_reply: `Votre retrait de ${item.amount} F a été transféré sur votre compte.`,
                        message_type: 'SYSTEM',
                        admin_read: true,
                        last_sender_type: 'admin'
                    });
                    await logAdminAction('APPROVE_WITHDRAW', item.user_phone, { id: item.id, amount: item.amount });
                }
            } else {
                if (view === 'withdraws') {
                    await supabase.rpc('reject_withdraw_and_refund', { 
                        withdraw_id: item.id, user_phone_param: item.user_phone, amount_param: Number(item.amount) 
                    });
                } else {
                    await supabase.from(view).update({ status: 'failed' }).eq('id', item.id);
                }
                
                await supabase.from('support_tickets').insert({
                    user_phone: item.user_phone,
                    subject: 'NOTIFICATION SYSTÈME',
                    description: `OPÉRATION REJETÉE ❌`,
                    admin_reply: `MOTIF : ${reason}`,
                    message_type: 'SYSTEM',
                    admin_read: true,
                    last_sender_type: 'admin'
                });
                
                await logAdminAction(`REJECT_${view.toUpperCase()}`, item.user_phone, { id: item.id, reason });
            }
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Action effectuée', showConfirmButton: false, timer: 2000 });
        } catch (err) {
            Swal.fire("Erreur", "L'opération a échoué.", "error");
        } finally {
            setIsProcessing(false);
            loadData();
            loadStats();
        }
    }

    // --- FONCTIONS SYSTÈME UTILISATEURS ---
    async function editBalance(user, field, label) {
        const { value: val } = await Swal.fire({
            title: `Modifier ${label}`,
            input: 'number',
            inputValue: user[field],
            showCancelButton: true
        })
        if (val !== undefined && val !== null) {
            await supabase.from('users').update({ [field]: Number(val) }).eq('phone', user.phone)
            await logAdminAction('EDIT_BALANCE', user.phone, { field, old: user[field], new: val });
            loadData(); 
            toastSuccess("Portefeuille mis à jour");
        }
    }

    async function toggleBan(user) {
        if (user.phone.endsWith(ADMIN_PHONE_BASE)) return;
        const newStatus = user.status === 'banned' ? 'active' : 'banned'
        const confirm = await Swal.fire({ title: `${newStatus === 'banned' ? 'Bannir' : 'Réactiver'} cet utilisateur ?`, showCancelButton: true })
        if (confirm.isConfirmed) {
            await supabase.from('users').update({ status: newStatus }).eq('phone', user.phone)
            await logAdminAction(newStatus === 'banned' ? 'BAN_USER' : 'UNBAN_USER', user.phone, {});
            loadData()
        }
    }

    async function runDailyGains() {
        const result = await Swal.fire({
            title: 'Lancer la distribution des gains ?',
            text: "Tous les utilisateurs recevront leur ROI quotidien.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#00c896',
            confirmButtonText: 'LANCER MAINTENANT'
        })
        if(result.isConfirmed) {
            setIsProcessing(true)
            const { error } = await supabase.rpc('process_daily_roi')
            setIsProcessing(false)
            if (error) Swal.fire("Erreur", "RPC failed.", "error")
            else { 
                await logAdminAction('RUN_DAILY_GAINS', 'ALL_SYSTEM', {});
                Swal.fire("Succès", "Gains distribués.", "success"); 
                loadData(); 
            }
        }
    }

    const toastSuccess = (msg) => {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: msg, showConfirmButton: false, timer: 2000 });
    }

    // --- FIX ULTIME : RENDU ROBUSTE DES TICKETS (PAYS, NUMERO, IMAGES) ---
    const renderParsedText = (text) => {
        if (!text) return null;
        
        // Si c'est une réclamation ou contient des données structurées
        if (text.includes("PAYS") || text.includes("ID TRANSACTION")) {
           const lines = text.split('\n');
           const cleanLines = [];
           let extractedImgUrl = null;

           // On analyse le texte ligne par ligne
           lines.forEach(line => {
               const trimLine = line.trim();
               if (!trimLine) return;

               // Détection ultra-robuste de l'URL d'image
               if (trimLine.includes('supabase.co') || trimLine.includes('support_attachments') || trimLine.startsWith('https')) {
                   // On nettoie la ligne pour enlever le "PREUVES PHOTOS" si collé
                   let potentialUrl = trimLine.replace("PREUVES PHOTOS", "").trim();
                   // On corrige le manque de :// sur le https
                   if (potentialUrl.startsWith("https") && !potentialUrl.includes("://")) {
                       potentialUrl = potentialUrl.replace("https", "https://");
                   } else if (potentialUrl.startsWith("//")) {
                       potentialUrl = `https:${potentialUrl}`;
                   }
                   extractedImgUrl = potentialUrl;
               } else if (!trimLine.includes("PREUVES PHOTOS") && !trimLine.includes("📷")) {
                   // On ignore l'horodatage et les textes d'ambiance
                   if (!/^\d{2}:\d{2}/.test(trimLine)) {
                       cleanLines.push(trimLine);
                   }
               }
           });

           return (
               <div style={{
                   background: '#111', 
                   border: '1px solid #222', 
                   borderRadius: '16px', 
                   padding: '20px', 
                   width: '100%', 
                   maxWidth: '450px',
                   boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
               }}>
                   {/* En-tête du ticket */}
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #222', paddingBottom:'12px', marginBottom:'15px'}}>
                       <span style={{color:'#ffd700', fontSize:'12px', fontWeight:'900', letterSpacing:'1px'}}>🎫 TICKET RÉCLAMATION</span>
                       <span style={{background:'#ffd700', color:'#000', fontSize:'9px', padding:'3px 8px', borderRadius:'20px', fontWeight:'bold'}}>À TRAITER</span>
                   </div>

                   {/* Contenu textuel splitté */}
                   <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                       {cleanLines.map((line, idx) => {
                           const parts = line.split(/[\s: ]/); // Split sur espace ou les deux points
                           const label = parts[0];
                           const value = line.substring(label.length).replace(/^[\s: ]+/, ''); // On garde le reste de la ligne

                           return (
                               <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom:'1px dashed #1a1a1a', paddingBottom:'6px'}}>
                                   <span style={{color:'#666', fontSize:'11px', fontWeight:'bold', textTransform:'uppercase'}}>{label}</span>
                                   <span style={{color:'#fff', fontSize:'13px', fontWeight:'500', textAlign:'right', wordBreak:'break-all'}}>{value || '---'}</span>
                               </div>
                           )
                       })}
                   </div>

                   {/* Image attachée (Preuve) */}
                   {extractedImgUrl && (
                       <div style={{marginTop:'20px'}}>
                           <span style={{color:'#ffd700', fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'8px'}}>🖼️ PIÈCE JOINTE :</span>
                           <div style={{background:'#050505', borderRadius:'12px', border:'1px solid #222', padding:'10px', textAlign:'center'}}>
                               <img 
                                   src={extractedImgUrl} 
                                   style={{maxWidth:'100%', borderRadius:'8px', cursor:'pointer'}} 
                                   onClick={() => window.open(extractedImgUrl, '_blank')} 
                                   alt="Preuve utilisateur"
                                   onError={(e) => {
                                       e.target.style.display = 'none';
                                       e.target.parentNode.innerHTML = `<span style="color:#ff4d4d; font-size:11px;">⚠️ Impossible de charger l'image</span>`;
                                   }}
                               />
                           </div>
                       </div>
                   )}
               </div>
           )
        }

        // Si le message est uniquement une image brute
        const isImageLink = text.includes('support_attachments') || /\.(jpg|png|jpeg|gif|webp)$/i.test(text);
        
        if (isImageLink) {
            let cleanUrl = text.trim();
            if (cleanUrl.startsWith('https') && !cleanUrl.includes("://")) {
                cleanUrl = cleanUrl.replace("https", "https://");
            } else if (cleanUrl.startsWith('//')) {
                cleanUrl = `https:${cleanUrl}`;
            }
            return (
                <div style={{marginTop: 5}}>
                    <img 
                        src={cleanUrl} 
                        style={{maxWidth:'200px', borderRadius:'12px', cursor:'pointer', border:'1px solid #222'}} 
                        onClick={() => window.open(cleanUrl, '_blank')} 
                        alt="pièce jointe" 
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = `<span style="color: #666; font-size: 11px;">[Image indisponible]</span>`;
                        }}
                    />
                </div>
            );
        }

        // Texte normal
        return <span>{text}</span>;
    };

    const getFilteredMessages = () => {
        if (showAllMessages || chatMessages.length <= 10) {
            return chatMessages;
        }
        return chatMessages.slice(chatMessages.length - 10);
    };

    return (
        <div style={s.container}>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
            
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .loader-btn { border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 16px; height: 16px; animation: spin 0.8s linear infinite; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: #151515; border-radius: 10px; }
                .row-pending { border-left: 3px solid #ffd700 !important; }

                @media (max-width: 768px) {
                    div[style*="display: flex"] { flex-direction: column; }
                    aside { width: 100% !important; height: auto !important; position: relative !important; border-right: none !important; border-bottom: 1px solid #151515; }
                    main { padding: 20px !important; }
                    div[style*="gridTemplateColumns: repeat(4"] { grid-template-columns: 1fr !important; }
                    
                    table, thead, tbody, th, td, tr { display: block; }
                    thead { display: none; } 
                    tr { 
                        background: #080808; 
                        margin-bottom: 15px; 
                        border-radius: 15px; 
                        border: 1px solid #151515;
                        padding: 15px;
                    }
                    td { 
                        padding: 10px 5px !important; 
                        border-top: none !important;
                        border-bottom: 1px solid #111;
                    }
                    td:last-child { border-bottom: none; }
                    
                    .tabRow { flex-direction: row !important; overflow-x: auto; }
                    .header { flex-direction: column; gap: 15px; align-items: flex-start !important; }
                }
            `}</style>

            <aside style={s.sidebar}>
                <h2 style={s.logo}>2D INVEST ADMIN</h2>
                <nav>
                    <button onClick={() => {setView("users"); setActiveChatPhone(null); setShowAllMessages(false)}} style={view === "users" ? s.navActive : s.navBtn}>
                        <span>👥 Utilisateurs</span> <span style={s.badgeCount}>{stats.users}</span>
                    </button>
                    <button onClick={() => {setView("deposits"); setActiveChatPhone(null); setShowAllMessages(false)}} style={view === "deposits" ? s.navActive : s.navBtn}>
                        <span>📥 Dépôts</span> {stats.dep > 0 && <span style={s.badge}>{stats.dep}</span>}
                    </button>
                    <button onClick={() => {setView("withdraws"); setActiveChatPhone(null); setShowAllMessages(false)}} style={view === "withdraws" ? s.navActive : s.navBtn}>
                        <span>📤 Retraits</span> {stats.with > 0 && <span style={s.badgeRed}>{stats.with}</span>}
                    </button>
                    <button onClick={() => {setView("support_tickets"); setActiveChatPhone(null); setShowAllMessages(false)}} style={view === "support_tickets" ? s.navActive : s.navBtn}>
                        <span>💬 Support</span> {stats.support > 0 && <span style={s.badgeNotify}>{stats.support}</span>}
                    </button>
                    
                    <div style={s.sysBox}>
                        <p style={s.sysTitle}>Système de Gains</p>
                        <button onClick={runDailyGains} disabled={isProcessing} style={s.btnGains}>
                            {isProcessing ? <div className="loader-btn" style={{margin:'0 auto'}}></div> : '🚀 DISTRIBUER GAINS'}
                        </button>
                    </div>
                </nav>
            </aside>

            <main style={s.main}>
                {!activeChatPhone && (
                    <div style={s.financeRow}>
                        <div style={s.financeCard}>
                            <span style={s.finLabel}>Volume Dépôts</span>
                            <span style={{...s.finVal, color: '#00c896'}}>{stats.totalDeposited.toLocaleString()} F</span>
                        </div>
                        <div style={s.financeCard}>
                            <span style={s.finLabel}>Volume Retraits</span>
                            <span style={{...s.finVal, color: '#ff4d4d'}}>{stats.totalWithdrawn.toLocaleString()} F</span>
                        </div>
                        <div style={s.financeCard}>
                            <span style={s.finLabel}>Flux Net</span>
                            <span style={{...s.finVal, color: '#ffd700'}}>{stats.netFlow.toLocaleString()} F</span>
                        </div>
                        <div style={{...s.financeCard, border: stats.netFlow < 0 ? '1px solid #ff4d4d' : '1px solid #151515'}}>
                            <span style={s.finLabel}>État Trésorerie</span>
                            <span style={{...s.finVal, color: stats.netFlow < 0 ? '#ff4d4d' : '#00c896'}}>{stats.netFlow < 0 ? 'DÉFICIT' : 'SÉCURISÉ'}</span>
                        </div>
                    </div>
                )}

                <header style={s.header}>
                    <h1 style={s.title}>{activeChatPhone ? `Chat avec ${activeChatPhone}` : `Gestion des ${view}`}</h1>
                    {!activeChatPhone && view === "support_tickets" && (
                         <div style={s.tabRow}>
                            <button onClick={() => setSupportSubView("reclamations")} style={supportSubView === 'reclamations' ? s.tabActive : s.tab}>⚠️ RÉCLAMATIONS</button>
                            <button onClick={() => setSupportSubView("chat")} style={supportSubView === 'chat' ? s.tabActive : s.tab}>💬 CHAT DIRECT</button>
                        </div>
                    )}
                    {!activeChatPhone && (
                        <div style={s.headerRight}>
                            <div style={s.tabRow}>
                                <button onClick={() => setFilterStatus("all")} style={filterStatus === 'all' ? s.tabActive : s.tab}>TOUT</button>
                                <button onClick={() => setFilterStatus("pending")} style={filterStatus === 'pending' ? s.tabActive : s.tab}>EN ATTENTE</button>
                            </div>
                            <button onClick={loadData} style={s.btnRef}>↻</button>
                        </div>
                    )}
                </header>

                <div style={s.searchContainer}>
                    <input type="text" placeholder="🔍 Rechercher numéro, TID ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={s.searchInput} />
                </div>

                {activeChatPhone ? (
                    <div style={s.chatContainer}>
                        {activeUserInfo && (
                            <div style={{display:'flex', gap:'20px', padding:'15px 25px', background:'#111', borderBottom:'1px solid #222', fontSize:'12px'}}>
                                <div><b>CLIENT:</b> {activeUserInfo.user_id_code}</div>
                                <div><b>DEP:</b> <span style={{color:'orange'}}>{activeUserInfo.recharge_balance} F</span></div>
                                <div><b>RET:</b> <span style={{color:'#00c896'}}>{activeUserInfo.withdraw_balance} F</span></div>
                                <div><b>STATUT:</b> {activeUserInfo.status === 'active' ? '🟢 OK' : '🔴 BAN'}</div>
                            </div>
                        )}
                        <div style={{padding:'15px 25px', background:'#080808', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #151515'}}>
                            <span style={{color:'#00c896', fontSize:'12px', fontWeight:'bold'}}>● RÉPONSE ADMINISTRATIVE</span>
                            <div style={{display:'flex', gap:'10px'}}>
                                <select onChange={(e) => sendAdminReply(e.target.value)} style={{background:'#111', color:'#ccc', border:'1px solid #333', borderRadius:'5px', padding:'5px'}}>
                                    <option value="">Réponses Rapides</option>
                                    <option value="Votre dépôt a été bien reçu et est en cours de validation.">✅ Dépôt Reçu</option>
                                    <option value="Retrait rejeté : numéro de retrait invalide.">❌ Retrait Rejeté</option>
                                    <option value="Veuillez patienter, nous vérifions votre transaction.">⏳ Vérification</option>
                                </select>
                                <button onClick={() => {setActiveChatPhone(null); setChatMessages([]); setShowAllMessages(false)}} style={{background:'#222', color:'#fff', border:'none', padding:'8px 15px', borderRadius:'10px', cursor:'pointer'}}>FERMER</button>
                            </div>
                        </div>
                        <div style={s.chatBox}>
                            {chatMessages.length > 10 && !showAllMessages && (
                                <button 
                                    onClick={() => setShowAllMessages(true)} 
                                    style={{background: '#111', color: '#888', border: '1px solid #222', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', alignSelf: 'center'}}
                                >
                                    Afficher les messages plus anciens ({chatMessages.length - 10})
                                </button>
                            )}

                            {getFilteredMessages().map((m, i) => (
                                <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {m.message_type === 'SYSTEM' ? (
                                        <div style={s.systemBubble}>
                                            <span style={{ fontSize: '10px', color: '#ffd700', fontWeight: 'bold' }}>SYSTEM : {m.description}</span>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>{m.admin_reply}</p>
                                        </div>
                                    ) : (
                                        <div style={m.last_sender_type === "admin" || m.admin_reply ? s.adminBubble : s.userBubble}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {m.description && m.description !== "RÉPONSE ADMINISTRATIVE" && (
                                                    <div>{renderParsedText(m.description)}</div>
                                                )}
                                                {m.admin_reply && (
                                                    <div style={{ borderTop: '1px solid rgba(0,200,150,0.2)', paddingTop: '10px' }}>
                                                        <div style={{ fontSize: '9px', color: '#00c896', fontWeight: 'bold', marginBottom: '5px' }}>ADMIN :</div>
                                                        {renderParsedText(m.admin_reply)}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '9px', color: '#444', marginTop: '8px', textAlign: 'right' }}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div style={{ padding: '20px', background: '#080808', borderTop: '1px solid #151515', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                            <button style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>📷</button>
                            <input
                                style={s.replyInput}
                                placeholder="Message..."
                                value={adminReplyInput}
                                onChange={(e) => setAdminReplyInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendAdminReply()}
                            />
                            <button onClick={() => sendAdminReply()} disabled={sending} style={s.btnSend}>
                                {sending ? <div className="loader-btn"></div> : '➤'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={s.tableCard}>
                        <table style={s.table}>
                            <thead>
                                <tr style={s.thead}>
                                    <th style={s.th}>Utilisateur / ID</th>
                                    <th style={s.th}>Données / Action Requise</th>
                                    <th style={s.th}>Opérations Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.filter(item => {
                                    const srch = searchTerm.toLowerCase();
                                    return (item.phone || item.user_phone || "").includes(srch) || (item.transaction_id || "").toLowerCase().includes(srch);
                                }).map((item) => (
                                    <tr 
                                        key={item.id || item.phone} 
                                        style={{...s.tr, cursor: view === 'support_tickets' ? 'pointer' : 'default'}} 
                                        className={item.status === 'pending' || item.admin_read === false ? "row-pending" : ""}
                                        onClick={() => {
                                            if (view === 'support_tickets') {
                                                setActiveChatPhone(item.user_phone);
                                                fetchTargetUserInfo(item.user_phone);
                                                fetchChatHistory(item.user_phone);
                                            }
                                        }}
                                    >
                                        <td style={s.td}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {view === 'users' && <div style={s.onlineDot}></div>}
                                                <b style={{ color: '#ffd700', fontSize: '15px' }}>{item.phone || item.user_phone}</b>
                                            </div>
                                            <span style={s.small}>ID: {item.user_id_code || '---'}</span>
                                            {item.is_duplicate && <span style={s.fraudTag}>⚠️ TENTATIVE FRAUDE</span>}
                                        </td>
                                        <td style={s.td}>
                                            {view === 'users' ? (
                                                <div style={s.detailsBox}>
                                                    <div style={s.balanceRow}><span>Dépôt:</span> <b style={{ color: 'orange' }}>{item.recharge_balance?.toLocaleString()} F</b></div>
                                                    <div style={s.balanceRow}><span>Retrait:</span> <b style={{ color: '#00c896' }}>{item.withdraw_balance?.toLocaleString()} F</b></div>
                                                </div>
                                            ) : view === 'support_tickets' ? (
                                                <div style={{ padding: '10px', background: '#080808', borderRadius: '10px' }}>
                                                    <span style={{ color: !item.admin_read ? '#ff4d4d' : '#666', fontWeight: !item.admin_read ? '900' : 'normal' }}>
                                                        {!item.admin_read && "🔴 NOUVEAU : "}
                                                        {item.description ? item.description.substring(0, 40) + "..." : "Voir discussion"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '10px', background: '#080808', borderRadius: '12px' }}>
                                                    <b style={{ color: view === 'deposits' ? '#00c896' : '#ff4d4d', fontSize: '18px' }}>{item.amount?.toLocaleString()} F</b>
                                                    <div style={{ fontSize: '10px', color: '#444' }}>TID: {item.transaction_id || item.method}</div>
                                                    {item.screenshot_url && <img src={item.screenshot_url} style={s.miniature} onClick={(e) => { e.stopPropagation(); window.open(item.screenshot_url, '_blank'); }} alt="screenshot" />}
                                                </div>
                                            )}
                                        </td>
                                        <td style={s.td} onClick={(e) => e.stopPropagation()}>
                                            {view === 'users' ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <button onClick={() => editBalance(item, 'recharge_balance', 'Dépôt')} style={s.btnAction}>DEP</button>
                                                    <button onClick={() => editBalance(item, 'withdraw_balance', 'Retrait')} style={s.btnAction}>RET</button>
                                                    <button onClick={() => toggleBan(item)} style={{ ...s.btnAction, gridColumn: 'span 2', color: item.status === 'banned' ? '#00c896' : '#ff4d4d' }}>
                                                        {item.status === 'banned' ? 'DÉBANNIR' : 'BANNIR'}
                                                    </button>
                                                </div>
                                            ) : view === 'support_tickets' ? (
                                                <span style={{fontSize: '11px', color: '#444'}}>Cliquez sur la ligne pour ouvrir le chat</span>
                                            ) : (
                                                item.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button onClick={() => processTransaction(item, 'success')} style={s.btnV}>VALIDER</button>
                                                        <button onClick={() => processTransaction(item, 'failed')} style={s.btnR}>REJETER</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ ...s.statusTag, color: item.status === 'approved' ? '#00c896' : '#ff4d4d' }}>{item.status.toUpperCase()}</span>
                                                        {view === 'deposits' && (
                                                            <button onClick={async () => {
                                                                const c = await Swal.fire({ title: 'Reset ?', showCancelButton: true });
                                                                if (c.isConfirmed) {
                                                                    await supabase.from(view).update({ status: 'pending' }).eq('id', item.id);
                                                                    loadData();
                                                                }
                                                            }} style={s.btnReset}>Annuler</button>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}