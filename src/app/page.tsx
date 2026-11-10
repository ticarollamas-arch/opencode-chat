"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Paperclip, Plus, PanelLeftClose, PanelLeftOpen, Settings2, MessageSquare, Code2, FolderOpen, X, LoaderCircle, Square, Check, AlertCircle, Download, Menu } from "lucide-react";

type Chat = { id: string; title: string; updatedAt: number; };
type Msg = { id: string; role: "user"|"assistant"|"system"; text: string; time: number; status?: string; };
const STORE = "opencode-chat-v1";

export default function Home() {
  const [chats,setChats] = useState<Chat[]>([]);
  const [active,setActive] = useState("");
  const [messages,setMessages] = useState<Record<string,Msg[]>>({});
  const [input,setInput] = useState("");
  const [busy,setBusy] = useState(false);
  const [collapsed,setCollapsed] = useState(false);
  const [settings,setSettings] = useState(false);
  const [model,setModel] = useState("automatic");
  const [files,setFiles] = useState<File[]>([]);
  const [status,setStatus] = useState("Pronto para trabalhar");
  const [serverReady,setServerReady] = useState<boolean|null>(null);
  const [mobileNav,setMobileNav] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = messages[active] || [];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) {
        const data = JSON.parse(saved);
        setChats(data.chats || []); setMessages(data.messages || {});
        setActive(data.active || data.chats?.[0]?.id || "");
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (!active && chats.length) setActive(chats[0].id);
  }, [active,chats]);
  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify({chats,messages,active}));
  }, [chats,messages,active]);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [current.length,busy]);
  useEffect(() => { fetch("/api/health").then(r=>r.json()).then(d=>setServerReady(!!d.ok)).catch(()=>setServerReady(false)); }, []);

  function newChat() {
    const id = crypto.randomUUID();
    const c = {id,title:"Nova conversa",updatedAt:Date.now()};
    setChats(v=>[c,...v]); setMessages(v=>({...v,[id]:[]})); setActive(id); setInput(""); setFiles([]); setMobileNav(false);
  }
  function addMessage(id:string, msg:Msg) { setMessages(v=>({...v,[id]:[...(v[id]||[]),msg]})); }
  async function send() {
    const text = input.trim();
    if ((!text && !files.length) || busy) return;
    const id = active || crypto.randomUUID();
    if (!active) { const c={id,title:"Nova conversa",updatedAt:Date.now()}; setChats(v=>[c,...v]); setActive(id); }
    const attachmentNames = files.map(f=>f.name);
    const bodyText = text + (attachmentNames.length ? `\n\nArquivos anexados: ${attachmentNames.join(", ")}. (O upload binário precisa ser configurado no serviço de armazenamento.)` : "");
    addMessage(id,{id:crypto.randomUUID(),role:"user",text:bodyText,time:Date.now()});
    setChats(v=>v.map(c=>c.id===id?{...c,title:text.slice(0,42)||"Arquivos anexados",updatedAt:Date.now()}:c));
    setInput(""); setFiles([]); setBusy(true); setStatus("Enviando instrução ao OpenCode");
    try {
      const response = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:id,message:text || "Analise os arquivos anexados.",model})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível executar a tarefa.");
      addMessage(id,{id:crypto.randomUUID(),role:"assistant",text:data.message || "Instrução enviada ao OpenCode. Acompanhe a execução no servidor.",time:Date.now(),status:"sent"});
      setStatus("Instrução enviada");
    } catch(e) {
      addMessage(id,{id:crypto.randomUUID(),role:"assistant",text:`Não foi possível conectar ao executor.\n\n${e instanceof Error?e.message:"Erro desconhecido"}\n\nVerifique OPENCODE_SERVER_URL e mantenha o servidor OpenCode ativo.`,time:Date.now(),status:"error"});
      setStatus("Falha na conexão");
    } finally { setBusy(false); }
  }
  async function stop() {
    if (!active) return;
    try { await fetch("/api/chat",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:active})}); setStatus("Solicitação de interrupção enviada"); }
    catch { setStatus("Não foi possível interromper"); }
    setBusy(false);
  }
  function onFiles(list:FileList|null) { if (!list) return; setFiles(v=>[...v,...Array.from(list)]); }
  const sorted = useMemo(()=>[...chats].sort((a,b)=>b.updatedAt-a.updatedAt),[chats]);

  return <main className="shell">
    <aside className={`sidebar ${collapsed?"collapsed":""} ${mobileNav?"mobile-open":""}`}>
      <div className="brand"><div className="brandmark"><Code2 size={19}/></div>{!collapsed&&<span>OpenCode <b>Chat</b></span>}<button className="iconbtn sidebar-toggle" onClick={()=>setCollapsed(!collapsed)} title="Recolher menu">{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button></div>
      <button className="newchat" onClick={newChat}><Plus size={18}/>{!collapsed&&"Novo chat"}</button>
      {!collapsed&&<div className="section-label">Recentes</div>}
      <div className="chat-list">{sorted.map(c=><button key={c.id} className={`chat-item ${active===c.id?"selected":""}`} onClick={()=>{setActive(c.id);setMobileNav(false)}} title={c.title}><MessageSquare size={16}/>{!collapsed&&<span>{c.title}</span>}</button>)}</div>
      <div className="sidebar-bottom"><button className="chat-item" onClick={()=>setSettings(true)}><Settings2 size={17}/>{!collapsed&&"Configurações"}</button><div className="connection">{serverReady===null?"Verificando executor…":serverReady?"Executor conectado":"Executor não conectado" }<i className={serverReady?"online":"offline"}/></div></div>
    </aside>
    {mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)}/>}
    <section className="main">
      <header className="topbar"><button className="iconbtn mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="top-title">Workspace <span> / </span> {chats.find(c=>c.id===active)?.title||"Nova conversa"}</div><div className="top-actions"><span className="secure"><i/> Ambiente pessoal</span><button className="iconbtn" onClick={()=>setSettings(true)} title="Configurações"><Settings2 size={18}/></button></div></header>
      <div className="conversation">
        {current.length===0?<div className="welcome"><div className="welcome-icon"><Code2 size={27}/></div><h1>O que vamos construir hoje?</h1><p>Descreva uma ideia, peça uma implementação ou envie um projeto para trabalhar.</p><div className="suggestions"><button onClick={()=>setInput("Analise meu projeto e identifique melhorias de arquitetura, segurança e desempenho.")}><Code2 size={17}/> Analisar um projeto</button><button onClick={()=>setInput("Crie uma aplicação web completa, responsiva e pronta para produção.")}><FolderOpen size={17}/> Criar uma aplicação</button><button onClick={()=>setInput("Encontre e corrija os erros do projeto, execute testes e apresente um resumo.")}><Check size={17}/> Corrigir erros</button></div></div>:<div className="messages">{current.map(m=><article key={m.id} className={`message ${m.role}`}><div className="avatar">{m.role==="user"?"Você":<Code2 size={17}/>}</div><div className="message-body"><div className="message-role">{m.role==="user"?"Você":"OpenCode"}</div><div className="message-text">{m.text}</div>{m.status==="error"&&<div className="error-label"><AlertCircle size={14}/> Erro de execução</div>}</div></article>)}{busy&&<div className="working"><div className="avatar"><Code2 size={17}/></div><div><div className="message-role">OpenCode</div><div className="typing"><i/><i/><i/><span>{status}</span></div></div></div>}<div ref={endRef}/></div>}
      </div>
      <div className="composer-wrap"><div className="composer">
        {files.length>0&&<div className="file-chips">{files.map((f,i)=><span key={i}><Paperclip size={13}/>{f.name}<button onClick={()=>setFiles(v=>v.filter((_,n)=>n!==i))}><X size={13}/></button></span>)}</div>}
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Envie uma mensagem ao OpenCode..." rows={2}/>
        <div className="composer-tools"><div><button className="toolbtn" onClick={()=>fileRef.current?.click()} title="Anexar arquivos"><Plus size={19}/></button><input ref={fileRef} type="file" multiple hidden onChange={e=>onFiles(e.target.files)}/><button className="toolbtn model-select" onClick={()=>setSettings(true)}><Settings2 size={15}/> Modelo e API</button></div><button className="sendbtn" disabled={busy||(!input.trim()&&!files.length)} onClick={busy?stop:send}>{busy?<Square size={15} fill="currentColor"/>:<ArrowUp size={19}/>}</button></div>
      </div><div className="disclaimer">O OpenCode pode cometer erros. Revise alterações importantes antes de publicar.</div></div>
    </section>
    {settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Configurações</h2><p>Conexão com seu ambiente OpenCode</p></div><button className="iconbtn" onClick={()=>setSettings(false)}><X size={19}/></button></div><label>Modelo preferido</label><select value={model} onChange={e=>setModel(e.target.value)}><option value="automatic">Automático (configurado no OpenCode)</option><option value="manual">Selecionar no servidor OpenCode</option></select><div className="notice"><AlertCircle size={17}/><span>As chaves de API devem ser configuradas no servidor OpenCode ou em variáveis seguras do executor. Não as coloque no navegador.</span></div><div className="modal-foot"><button className="primary" onClick={()=>setSettings(false)}>Concluir</button></div></div></div>}
  </main>;
}
