import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, Sparkles, User, RefreshCw, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import api from "../api/api";

const CHIPS = {
  en: ["How do I book a plumber?", "What are your charges?", "Book electrician service", "How does cashback work?"],
  te: ["ప్లంబర్ ఎలా బుక్ చేయాలి?", "మీ ధరలు ఏమిటి?", "ఎలక్ట్రీషియన్ బుక్ చేయండి", "క్యాష్‌బ్యాక్ ఎలా పని చేస్తుంది?"],
};

const synthAPI = typeof window !== "undefined" ? window.speechSynthesis : null;
let _voices = [];
const refreshVoices = () => { if (synthAPI) _voices = synthAPI.getVoices(); };
refreshVoices();
if (synthAPI) synthAPI.onvoiceschanged = refreshVoices;

function bestVoice(lang) {
  if (!_voices.length) refreshVoices();
  if (lang === "te") {
    return _voices.find(v => v.lang === "te-IN") || _voices.find(v => v.lang.startsWith("te")) || _voices.find(v => v.lang === "hi-IN") || _voices[0] || null;
  }
  return _voices.find(v => v.lang === "en-IN") || _voices.find(v => v.lang.startsWith("en")) || _voices[0] || null;
}

function speakText(text, lang, onStart, onEnd) {
  if (!synthAPI) { onEnd?.(); return; }
  synthAPI.cancel();
  const fire = () => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = bestVoice(lang);
    if (voice) u.voice = voice;
    if (lang === "te") { u.lang="te-IN"; u.rate=0.88; u.pitch=1.05; u.volume=1.0; }
    else { u.lang="en-IN"; u.rate=0.95; u.pitch=1.0; u.volume=1.0; }
    let ticker;
    u.onstart = () => {
      onStart?.();
      ticker = setInterval(() => {
        if (!synthAPI.speaking) { clearInterval(ticker); return; }
        if (synthAPI.paused) synthAPI.resume();
      }, 4000);
    };
    u.onend   = () => { clearInterval(ticker); onEnd?.(); };
    u.onerror = (e) => { clearInterval(ticker); if (e.error !== "interrupted" && e.error !== "canceled") console.warn("TTS:", e.error); onEnd?.(); };
    synthAPI.speak(u);
  };
  if (synthAPI.getVoices().length === 0) {
    synthAPI.onvoiceschanged = () => { _voices = synthAPI.getVoices(); synthAPI.onvoiceschanged = null; fire(); };
  } else { fire(); }
}

const SR = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export default function AskAI() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [msgs,      setMsgs]      = useState([{ role:"assistant", text:t("ai_greeting") }]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking,  setSpeaking]  = useState(false);
  const [interim,   setInterim]   = useState("");
  const [srError,   setSrError]   = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const recRef    = useRef(null);

  useEffect(() => {
    setMsgs([{ role:"assistant", text:t("ai_greeting") }]);
    setInput(""); setInterim(""); setSrError("");
  }, [lang]); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const send = useCallback(async (override) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput(""); setInterim(""); setSrError("");
    setMsgs(prev => [...prev, { role:"user", text }]);
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", {
        message: text,
        language: lang,
        history: msgs.slice(-6).map(m => ({ role:m.role, content:m.text })),
      });

      const reply = data.reply || (lang === "te" ? "సేవ అందుబాటులో లేదు." : "I'm here to help!");
      setMsgs(prev => [...prev, { role:"assistant", text:reply }]);

      // Handle booking intent from AI
      if (data.bookingAction === "OPEN_BOOKING") {
        const serviceId = data.bookingServiceId;
        const serviceName = data.bookingServiceName;
        setTimeout(() => {
          if (serviceId) {
            navigate(`/service/${serviceId}`);
          } else if (serviceName) {
            // Try to find service by name then navigate
            api.get("/config/our-services").then(r => {
              const found = (r.data || []).find(s => s.name.toLowerCase() === serviceName.toLowerCase());
              if (found) navigate(`/service/${found.id}`);
              else {
                api.get("/config/quick-services").then(r2 => {
                  const qFound = (r2.data || []).find(s => s.name.toLowerCase() === serviceName.toLowerCase());
                  if (qFound) navigate(`/service/${qFound.id}`);
                  else navigate("/");
                }).catch(() => navigate("/"));
              }
            }).catch(() => navigate("/"));
          }
        }, 1200);
      }
    } catch {
      setMsgs(prev => [...prev, {
        role:"assistant",
        text: lang === "te"
          ? "క్షమించండి, ప్రస్తుతం సేవ అందుబాటులో లేదు."
          : "Sorry, the assistant is unavailable right now. Please try again.",
      }]);
    } finally { setLoading(false); }
  }, [input, loading, lang, msgs, navigate]);

  const speakMsg = useCallback((text) => {
    if (!synthAPI) return;
    if (speaking) { synthAPI.cancel(); setSpeaking(false); return; }
    speakText(text, lang, () => setSpeaking(true), () => setSpeaking(false));
  }, [speaking, lang]);

  const stopSpeak = () => { synthAPI?.cancel(); setSpeaking(false); };

  const startRec = useCallback(() => {
    if (!SR) { setSrError("Speech recognition not supported in this browser."); return; }
    if (listening) return;
    if (recRef.current) { try { recRef.current.abort(); } catch {} recRef.current = null; }
    setSrError(""); setInterim("");
    const rec = new SR();
    rec.lang = lang === "te" ? "te-IN" : "en-IN";
    rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let finals = "", partials = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += tr; else partials += tr;
      }
      setInterim(partials);
      if (finals) { setInput(prev => (prev + (prev ? " " : "") + finals.trim())); setInterim(""); }
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      const msgs = { "no-speech": "No speech detected.", "not-allowed": "Microphone access denied.", "network": "Network error." };
      setSrError(msgs[e.error] || "Recognition failed — try again.");
      setListening(false); setInterim("");
    };
    rec.onend = () => { setListening(false); setInterim(""); inputRef.current?.focus(); };
    recRef.current = rec;
    try { rec.start(); } catch { setSrError("Could not start microphone."); setListening(false); }
  }, [lang, listening]);

  const stopRec = useCallback(() => {
    if (recRef.current) { try { recRef.current.stop(); } catch {} }
    setListening(false); setInterim("");
  }, []);

  const toggleMic = () => listening ? stopRec() : startRec();
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const chips = CHIPS[lang] || CHIPS.en;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto"
         style={{ height:"calc(100dvh - 7.5rem)", maxHeight:"820px" }}>

      {/* Header */}
      <div className="flex items-center gap-3 pb-3 flex-shrink-0">
        <div className="h-11 w-11 rounded-2xl gradient-primary flex items-center justify-center shadow-sm shadow-indigo-200">
          <Bot size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{t("ai_assistant")}</h1>
          <p className="text-xs text-gray-400">{t("ai_powered")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {speaking && (
            <button onClick={stopSpeak}
              className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-all">
              <VolumeX size={12} /> Stop
            </button>
          )}
          <button
            onClick={() => { stopSpeak(); setMsgs([{ role:"assistant", text:t("ai_greeting") }]); setInput(""); setSrError(""); }}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            title="Clear chat"
          >
            <RefreshCw size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="p-3 sm:p-4 space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""} animate-slide-up`}>
              <div className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0
                              ${m.role === "assistant" ? "bg-indigo-100 text-indigo-600" : "bg-gray-900 text-white"}`}>
                {m.role === "assistant" ? <Sparkles size={13} /> : <User size={13} />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line
                              ${m.role === "assistant"
                                ? "bg-gray-50 border border-gray-100 text-gray-800"
                                : "bg-indigo-600 text-white"}`}>
                {m.text}
              </div>
              {m.role === "assistant" && (
                <button
                  onClick={() => speakMsg(m.text)}
                  title={speaking ? "Stop" : "Read aloud"}
                  className={`self-end h-6 w-6 flex items-center justify-center rounded-lg transition-all flex-shrink-0
                              ${speaking ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"}`}>
                  {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-indigo-600 animate-pulse" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-1">
                {[0,1,2].map(j => (
                  <span key={j} className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay:`${j*150}ms` }} />
                ))}
              </div>
            </div>
          )}

          {msgs.length <= 1 && !loading && (
            <div className="pt-2 border-t border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t("quick_questions")}</p>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c, i) => (
                  <button key={i} onClick={() => send(c)}
                    className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600
                               hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 transition-all">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {interim && (
        <div className="flex-shrink-0 mt-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
          <p className="text-xs text-indigo-600 italic line-clamp-1">🎤 {interim}</p>
        </div>
      )}
      {srError && (
        <div className="flex-shrink-0 mt-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600">{srError}</p>
        </div>
      )}

      {/* Text input */}
      <div className="flex-shrink-0 mt-2 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={listening ? (lang === "te" ? "వింటున్నాం... మాట్లాడండి" : "Listening... speak now") : t("ai_placeholder")}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                     placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
                     transition-all min-h-[46px] max-h-28"
          style={{ overflowY:"auto" }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="h-[46px] w-[46px] flex-shrink-0 flex items-center justify-center rounded-2xl
                     bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40
                     transition-all active:scale-95 shadow-sm shadow-indigo-200"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Floating voice button */}
      {SR && (
        <div className="flex-shrink-0 flex flex-col items-center pt-2.5 pb-1 gap-1">
          {listening && (
            <div className="flex items-end gap-0.5 mb-1" style={{ height:"18px" }}>
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} className="w-1 rounded-full animate-wave-bar"
                  style={{ height:"100%", background:`hsl(${220 + i * 5},80%,60%)`, animationDelay:`${i * 65}ms`, animationDuration:`${0.55 + (i % 3) * 0.12}s`, transformOrigin:"bottom" }} />
              ))}
            </div>
          )}
          <button
            onClick={toggleMic}
            className={["relative flex items-center justify-center rounded-full w-[60px] h-[60px] shadow-xl transition-all duration-200 active:scale-95",
              listening ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "shadow-indigo-200"].join(" ")}
            style={!listening ? { background:"linear-gradient(135deg,#4f46e5,#2563eb)" } : {}}
            title={listening ? "Tap to stop" : "Tap to speak"}
          >
            {listening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400/50 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-red-300/30 animate-ping" style={{ animationDelay:"200ms" }} />
              </>
            )}
            {listening ? <MicOff size={23} className="text-white relative z-10" /> : <Mic size={23} className="text-white" />}
          </button>
          <p className="text-[10px] font-medium text-gray-400 text-center leading-tight">
            {listening ? (lang === "te" ? "ఆపడానికి నొక్కండి" : "Tap to stop recording") : (lang === "te" ? "🎤 తెలుగులో మాట్లాడండి" : "🎤 Tap to speak")}
          </p>
        </div>
      )}

      <p className="flex-shrink-0 text-center text-[9px] text-gray-300 pb-0.5 leading-none">
        {lang === "te" ? "🔊 స్పీకర్ నొక్కితే గొంతు వినిపిస్తుంది" : "🔊 Click the speaker icon next to any message to hear it"}
      </p>
    </div>
  );
}
