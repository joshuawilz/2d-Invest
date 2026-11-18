'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import Swal from 'sweetalert2'

const COUNTRIES = [
    { name: "Togo", flag: "🇹🇬" },
    { name: "Bénin", flag: "🇧🇯" },
    { name: "Côte d'Ivoire", flag: "🇨🇮" },
    { name: "Sénégal", flag: "🇸🇳" },
    { name: "Mali", flag: "🇲🇱" },
    { name: "Burkina Faso", flag: "🇧🇫" }
];

export default function SupportPage() {
    const router = useRouter()
    const [view, setView] = useState("menu") 
    const [loading, setLoading] = useState(false)
    const [tickets, setTickets] = useState([])
    const [unreadCount, setUnreadCount] = useState(0) 
    const [chatMsg, setChatMsg] = useState("")
    const [selectedFiles, setSelectedFiles] = useState([]) 
    const [previews, setPreviews] = useState([]) 
    const [showScrollBtn, setShowScrollBtn] = useState(false)
    
    const [claimForm, setClaimForm] = useState({ 
        country: "Togo", number: "", transactionId: "" 
    })

    const chatEndRef = useRef(null)
    const fileInputRef = useRef(null)
    const scrollContainerRef = useRef(null)
    const mainInputRef = useRef(null) // Ajout pour gérer le focus/blur

    const TELEGRAM_LINK = "https://t.me/+fI28nA4nyGMyZTBk"

    const scrollToBottom = (behavior = "smooth") => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior });
        }
    }

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        setShowScrollBtn(scrollHeight - scrollTop > clientHeight + 200);
    }

    const fetchUserTickets = async () => {
        const phone = localStorage.getItem("phone");
        if (!phone) return;
        const { data, error } = await supabase.from("support_tickets")
            .select("*")
            .eq("user_phone", phone)
            .order('created_at', { ascending: true });
        
        if (error) console.error("Erreur fetch:", error);
        if (data) {
            setTickets(data);
            if (view !== "chat") {
                const unread = data.filter(t => t.admin_reply && t.user_read === false).length;
                setUnreadCount(unread);
            } else {
                setUnreadCount(0);
            }
        }
    }

    const markAsRead = async () => {
        const phone = localStorage.getItem("phone");
        if (!phone) return;
        
        setUnreadCount(0);

        const { error } = await supabase
            .from("support_tickets")
            .update({ user_read: true })
            .eq("user_phone", phone)
            .eq("user_read", false);
        
        if (error) console.error("Erreur markAsRead:", error);
        
        fetchUserTickets();
    }

    useEffect(() => {
        if (view === "chat") {
            markAsRead();
        }
    }, [view, tickets.length]); 

    useEffect(() => {
        fetchUserTickets();
        const phone = localStorage.getItem("phone");
        if (!phone) return;

        const supportChannel = supabase
            .channel(`support_${phone}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'support_tickets',
                filter: `user_phone=eq.${phone}` 
            }, (payload) => {
                fetchUserTickets(); 
            })
            .subscribe();

        const withdrawalChannel = supabase
            .channel(`withdrawals_${phone}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'withdrawals',
                filter: `phone=eq.${phone}`
            }, async (payload) => {
                if (payload.new.status === 'cancelled') {
                    await supabase.from("support_tickets").insert([{
                        user_phone: phone,
                        subject: "NOTIFICATION",
                        description: `🚨 Votre retrait de ${payload.new.amount} F CFA a été annulé. Les fonds ont été retournés à votre solde.`,
                        status: "open",
                        admin_reply: "Le service financier a décliné la transaction. Veuillez vérifier vos informations de retrait ou contacter le support ici.",
                        user_read: false
                    }]);
                    fetchUserTickets();
                }
            })
            .subscribe();

        return () => { 
            supabase.removeChannel(supportChannel); 
            supabase.removeChannel(withdrawalChannel);
        }
    }, [view]); 

    useEffect(() => {
        if (view === "chat" && tickets.length > 0) {
            const timer = setTimeout(() => scrollToBottom("smooth"), 300);
            return () => clearTimeout(timer);
        }
    }, [tickets, view]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo en octets
        
        if (files.length > 0) {
            const validFiles = [];
            const newPreviews = [];
            
            files.forEach(file => {
                if (file.size > MAX_SIZE) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Fichier trop lourd',
                        text: `L'image "${file.name}" dépasse la limite autorisée de 5 Mo.`,
                        background: '#111',
                        color: '#fff'
                    });
                } else {
                    validFiles.push(file);
                    newPreviews.push(URL.createObjectURL(file));
                }
            });

            if (validFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...validFiles]);
                setPreviews(prev => [...prev, ...newPreviews]);
            }
        }
        // Reset l'input pour pouvoir re-sélectionner le même fichier au besoin
        e.target.value = '';
    }

    const removeFile = (index) => {
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    }

    const uploadFiles = async () => {
        let urls = [];
        for (const file of selectedFiles) {
            const fileName = `support/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const { error: upErr } = await supabase.storage
                .from('support_attachments')
                .upload(fileName, file);
            if (upErr) throw upErr;

            const { data } = supabase.storage
                .from('support_attachments')
                .getPublicUrl(fileName);
            urls.push(data.publicUrl);
        }
        return urls;
    }

    const handleSendChat = async (e) => {
        if (e) e.preventDefault();
        if (loading || (!chatMsg.trim() && selectedFiles.length === 0)) return;

        setLoading(true);
        
        // Cacher le clavier mobile pour laisser l'écran respirer
        if (mainInputRef.current) mainInputRef.current.blur();

        try {
            const phone = localStorage.getItem("phone");
            const imageUrls = await uploadFiles();
            const finalDescription = chatMsg.trim() + (imageUrls.length > 0 ? "\n" + imageUrls.join("\n") : "");

            const { error } = await supabase.from("support_tickets").insert([{ 
                user_phone: phone, 
                subject: "CHAT", 
                description: finalDescription,
                status: "open",
                user_read: true 
            }]);
            
            if (error) throw error;
            
            setChatMsg("");
            setSelectedFiles([]);
            setPreviews([]);
            fetchUserTickets(); 
        } catch (err) {
            console.error("Erreur envoi chat:", err);
            Swal.fire("Erreur", "Vérifiez votre connexion ou le format des images", "error");
        } finally {
            setLoading(false);
        }
    }

    const handleSendClaim = async () => {
        if (loading) return;
        
        const cleanNumber = claimForm.number.replace(/\s/g, '');
        if (!cleanNumber || !claimForm.transactionId) {
            Swal.fire({ title: "Incomplet", text: "Veuillez remplir tous les champs obligatoires.", icon: "warning", background: "#111", color: "#fff" });
            return;
        }

        setLoading(true);
        try {
            const phone = localStorage.getItem("phone");
            const imageUrls = await uploadFiles();
            const photoText = imageUrls.length > 0 ? "\n\nPREUVES PHOTOS:\n" + imageUrls.join("\n") : "";
            
            const fullDesc = `PAYS: ${claimForm.country}\nNUMÉRO: ${cleanNumber}\nID TRANSACTION: ${claimForm.transactionId}${photoText}`;

            const { error } = await supabase.from("support_tickets").insert([{ 
                user_phone: phone, 
                subject: "RECLAMATION", 
                description: fullDesc, 
                status: "open",
                user_read: true,
                country: claimForm.country,
                transaction_id: claimForm.transactionId,
                external_number: cleanNumber
            }]);

            if (error) throw error;

            Swal.fire({ title: "Succès", text: "Réclamation envoyée au service client.", icon: "success", background: "#111", color: "#fff" });
            setSelectedFiles([]);
            setPreviews([]);
            setClaimForm({ country: "Togo", number: "", transactionId: "" });
            setView("menu");
            fetchUserTickets();
        } catch (err) {
            console.error("Erreur réclamation:", err);
            Swal.fire("Erreur", "Impossible d'envoyer la réclamation", "error");
        } finally {
            setLoading(false);
        }
    }

    const renderContent = (text) => {
        if (!text) return null;
        const lines = text.split("\n");
        return lines.map((line, i) => {
            // Regex affinée pour n'interpréter que les URL d'images réelles
            const isImage = line.trim().match(/^https?:\/\/[^\s]+(\.(jpeg|jpg|gif|png|webp|svg)|supabase[^\s]+storage[^\s]+)/i);
            
            if (isImage) {
                return (
                    <div key={i} style={s.imgContainer}>
                        <img src={line.trim()} style={s.chatImg} alt="media support" />
                    </div>
                );
            }
            return <div key={i} style={s.textLine}>{line}</div>;
        });
    }

    return (
        <div style={s.container}>
            <div style={s.header}>
                <button onClick={() => {
                    if(view !== "menu") { setView("menu"); setSelectedFiles([]); setPreviews([]); }
                    else { router.back(); }
                }} style={s.backBtn}>❮</button>
                <div style={s.headerInfo}>
                    <div style={s.avatarWrapper}>
                        <div style={s.avatar}>2D</div>
                        <div style={s.pulse}></div>
                    </div>
                    <div>
                        <div style={s.headerName}>Support 2D Invest</div>
                        <div style={s.headerStatus}><span style={s.onlineDot}></span> En ligne</div>
                    </div>
                </div>
            </div>

            {view === "menu" && (
                <div style={s.menuList}>
                    <div style={s.card} onClick={() => setView("chat")}>
                        <div style={{...s.iconCircle, color:'#00c896', background:'#00c89615', position:'relative'}}>
                            💬
                            {unreadCount > 0 && <div style={s.badge}>{unreadCount}</div>}
                        </div>
                        <div style={s.cardText}>
                            <div style={s.cardTitle}>Contacter le Service Clientèle</div>
                            <div style={s.cardSub}>Support technique 24h/7j</div>
                        </div>
                    </div>
                    <div style={s.card} onClick={() => window.open(TELEGRAM_LINK, '_blank')}>
                        <div style={{...s.iconCircle, color:'#229ed9', background:'#229ed915'}}>✈️</div>
                        <div style={s.cardText}>
                            <div style={s.cardTitle}>Telegram Officiel</div>
                            <div style={s.cardSub}>Canal de diffusion 2D Invest</div>
                        </div>
                    </div>
                    <div style={s.card} onClick={() => setView("claim")}>
                        <div style={{...s.iconCircle, color:'#ff9800', background:'#ff980015'}}>📥</div>
                        <div style={s.cardText}>
                            <div style={s.cardTitle}>Dépôt non reçu</div>
                            <div style={s.cardSub}>Réclamation de transaction mobile</div>
                        </div>
                    </div>
                </div>
            )}

            {view === "chat" && (
                <div style={s.chatWrapper}>
                    <div style={s.chatScrollArea} ref={scrollContainerRef} onScroll={handleScroll}>
                        {tickets.length === 0 && !loading && <div style={{textAlign:'center', color:'#555', marginTop:'20px', fontSize:'13px'}}>Aucun message. Comment pouvons-nous vous aider ?</div>}
                        
                        {tickets.map((t, i) => (
                            <div key={i} style={t.admin_reply ? s.msgRowAdmin : s.msgRowUser}>
                                <div style={t.admin_reply ? s.bubbleAdmin : s.bubbleUser}>
                                    <div style={s.contentArea}>{renderContent(t.description)}</div>
                                    {t.admin_reply && (
                                        <div style={s.adminResponse}>
                                            <div style={s.adminTag}>RÉPONSE SUPPORT</div>
                                            {renderContent(t.admin_reply)}
                                        </div>
                                    )}
                                    <div style={s.msgMeta}>
                                        {new Date(t.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        {!t.admin_reply && <span style={{...s.check, color: '#555'}}> ✓✓</span>}
                                        {t.admin_reply && <span style={{color:'#00c896', fontWeight:'bold'}}> lu</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} style={{ float: "left", clear: "both", height: '10px' }} />
                    </div>

                    {showScrollBtn && <div style={s.scrollDownBtn} onClick={() => scrollToBottom()}>↓</div>}

                    {previews.length > 0 && (
                        <div style={s.previewTray}>
                            {previews.map((p, i) => (
                                <div key={i} style={s.pItem}>
                                    <img src={p} style={s.pImg} />
                                    <div style={s.pClose} onClick={() => removeFile(i)}>✕</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={s.inputSection}>
                        <form onSubmit={handleSendChat} style={s.inputBar}>
                            <button type="button" style={s.actionBtn} onClick={() => fileInputRef.current.click()} disabled={loading}>📸</button>
                            <input type="file" ref={fileInputRef} multiple style={{display:'none'}} onChange={handleFileChange} accept="image/*" />
                            <input 
                                ref={mainInputRef}
                                style={s.mainInput} 
                                placeholder={loading ? "Envoi en cours..." : "Écrivez votre message..."} 
                                value={chatMsg} 
                                onChange={(e) => setChatMsg(e.target.value)} 
                                disabled={loading} 
                            />
                            <button type="submit" style={{...s.sendActionBtn, opacity: loading ? 0.5 : 1}} disabled={loading}>
                                {loading ? <div style={s.spinner}></div> : <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {view === "claim" && (
                <div style={s.claimContainer}>
                    <h2 style={s.claimHeader}>Réclamation Transaction</h2>
                    <div style={s.fGroup}><label style={s.fLabel}>PAYS</label>
                        <select style={s.fSelect} value={claimForm.country} onChange={(e) => setClaimForm({...claimForm, country: e.target.value})}>
                            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                        </select>
                    </div>
                    <div style={s.fGroup}><label style={s.fLabel}>NUMÉRO UTILISÉ</label>
                        <input style={s.fInput} placeholder="Ex: 00228..." value={claimForm.number} onChange={(e) => setClaimForm({...claimForm, number: e.target.value})} />
                    </div>
                    <div style={s.fGroup}><label style={s.fLabel}>ID TRANSACTION / RÉFÉRENCE</label>
                        <input style={s.fInput} placeholder="ID reçu par SMS" value={claimForm.transactionId} onChange={(e) => setClaimForm({...claimForm, transactionId: e.target.value})} />
                    </div>

                    <div style={{marginBottom: '20px'}}>
                        <label style={s.fLabel}>PREUVES (CAPTURES D'ÉCRAN)</label>
                        <div style={{display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'10px'}}>
                            <div style={{...s.pImg, display:'flex', alignItems:'center', justifyContent:'center', border:'1px dashed #333', cursor:'pointer'}} onClick={() => fileInputRef.current.click()}>
                                <span style={{fontSize:'24px', color:'#555'}}>+</span>
                            </div>
                            {previews.map((p, i) => (
                                <div key={i} style={s.pItem}>
                                    <img src={p} style={s.pImg} />
                                    <div style={s.pClose} onClick={() => removeFile(i)}>✕</div>
                                </div>
                            ))}
                        </div>
                        <input type="file" ref={fileInputRef} multiple style={{display:'none'}} onChange={handleFileChange} accept="image/*" />
                    </div>

                    <button style={{...s.fSubmit, opacity: loading ? 0.6 : 1}} onClick={handleSendClaim} disabled={loading}>
                        {loading ? "TRAITEMENT..." : "ENVOYER LA RÉCLAMATION"}
                    </button>
                    <div style={{height:'40px'}}></div>
                </div>
            )}

            <style>{`
                @keyframes pulse { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(1.3); opacity: 0; } 100% { transform: scale(1.3); opacity: 0; } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

const s = {
    container: { background: '#050505', height: '100dvh', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' },
    header: { background: '#0f0f0f', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1a1a1a', zIndex: 100 },
    backBtn: { background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' },
    headerInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatarWrapper: { position: 'relative' },
    avatar: { width: '42px', height: '42px', background: 'linear-gradient(135deg, #00c896 0%, #008f6a 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' },
    pulse: { position: 'absolute', width: '100%', height: '100%', background: '#00c896', borderRadius: '14px', top: 0, left: 0, animation: 'pulse 2s infinite' },
    headerName: { fontSize: '15px', fontWeight: 'bold' },
    headerStatus: { fontSize: '10px', color: '#00c896', display: 'flex', alignItems: 'center', gap: '4px' },
    onlineDot: { width: '7px', height: '7px', background: '#00c896', borderRadius: '50%' },
    menuList: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' },
    card: { background: '#0f0f0f', borderRadius: '25px', padding: '20px', display: 'flex', alignItems: 'center', gap: '18px', border: '1px solid #1a1a1a', cursor: 'pointer' },
    iconCircle: { width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
    badge: { position: 'absolute', top: '-5px', right: '-5px', background: '#ff3b30', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', border: '2px solid #050505' },
    cardText: { flex: 1 },
    cardTitle: { fontSize: '15px', fontWeight: 'bold' },
    cardSub: { fontSize: '12px', color: '#555' },
    chatWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
    chatScrollArea: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '16px' },
    msgRowUser: { display: 'flex', justifyContent: 'flex-end' },
    msgRowAdmin: { display: 'flex', justifyContent: 'flex-start' },
    bubbleUser: { background: '#1a1a1a', padding: '12px 16px', borderRadius: '22px 22px 4px 22px', maxWidth: '85%', border: '1px solid #252525' },
    bubbleAdmin: { background: 'rgba(0,200,150,0.08)', padding: '12px 16px', borderRadius: '22px 22px 22px 4px', maxWidth: '85%', border: '1px solid #00c89622' },
    contentArea: { display: 'flex', flexDirection: 'column', gap: '8px' },
    textLine: { fontSize: '14px', lineHeight: '1.5', color: '#eee' },
    imgContainer: { borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', marginTop: '4px' },
    chatImg: { width: '100%', display: 'block', maxHeight: '350px', objectFit: 'cover' },
    adminResponse: { marginTop: '12px', borderTop: '1px solid #00c89622', paddingTop: '10px' },
    adminTag: { fontSize: '9px', color: '#00c896', fontWeight: 'bold', marginBottom: '4px' },
    msgMeta: { fontSize: '9px', opacity: 0.5, textAlign: 'right', marginTop: '6px' },
    check: { fontWeight: 'bold' },
    scrollDownBtn: { position: 'absolute', bottom: '100px', right: '20px', width: '38px', height: '38px', background: '#00c896', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer', zIndex: 10 },
    previewTray: { display: 'flex', gap: '12px', padding: '12px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a', overflowX: 'auto' },
    pItem: { position: 'relative', flexShrink: 0 },
    pImg: { width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #00c896' },
    pClose: { position: 'absolute', top: '-6px', right: '-6px', background: '#ff4d4d', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' },
    inputSection: { padding: '10px 10px 30px 10px', background: '#050505' },
    inputBar: { background: '#0f0f0f', borderRadius: '32px', display: 'flex', alignItems: 'center', padding: '6px 10px', border: '1px solid #1a1a1a' },
    actionBtn: { background: 'none', border: 'none', fontSize: '22px', padding: '0 12px', cursor: 'pointer' },
    mainInput: { flex: 1, background: 'none', border: 'none', padding: '12px 8px', color: 'white', fontSize: '15px', outline: 'none' },
    sendActionBtn: { background: '#229ed9', border: 'none', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    spinner: { width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    claimContainer: { padding: '20px', overflowY: 'auto' },
    claimHeader: { fontSize: '20px', fontWeight: 'bold', marginBottom: '25px' },
    fGroup: { marginBottom: '18px' },
    fLabel: { fontSize: '10px', fontWeight: 'bold', color: '#555', marginBottom: '8px', display: 'block' },
    fSelect: { width: '100%', background: '#0f0f0f', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '15px', color: 'white', outline: 'none' },
    fInput: { width: '100%', background: '#0f0f0f', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '15px', color: 'white', outline: 'none' },
    fSubmit: { width: '100%', background: '#00c896', color: '#000', padding: '18px', borderRadius: '15px', fontWeight: 'bold', border: 'none', marginTop: '10px', cursor: 'pointer' }
}