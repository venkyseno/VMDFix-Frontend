import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Sparkles, User, RefreshCw, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import api from "../api/api";

/* ─── Quick suggestion chips ─────────────────────────────────────────────── */
const CHIPS = {
  en: ["How do I book a plumber?", "What are your charges?", "How do I add an address?", "How does cashback work?"],
  te: ["ప్లంబర్ ఎలా బుక్ చేయాలి?", "మీ ధరలు ఏమిటి?", "చిరునామా ఎలా జోడించాలి?", "క్యాష్‌బ్యాక్ ఎలా పని చేస్తుంది?"],
};

/* ─── Text-to-speech ─────────────────────────────────────────────────────── */
const synthAPI = typeof window !== "undefined" ? window.speechSynthesis : null;

/* Force load voice list early (Chrome defers it) */
let _voices = [];
const refreshVoices = () => { if (synthAPI) _voices = synthAPI.getVoices(); };
refreshVoices();
if (synthAPI) synthAPI.onvoiceschanged = refreshVoices;

function bestVoice(lang) {
  if (!_voices.length) refreshVoices();
  if (lang === "te") {
    return (
      _voices.find(v => v.lang === "te-IN") ||
      _voices.find(v => v.lang.startsWith("te")) ||
      _voices.find(v => v.lang === "hi-IN") ||   // Hindi as fallback — similar script/phonetics
      _voices.find(v => v.lang === "en-IN") ||
      _voices[0] || null
    );
  }
  return (
    _voices.find(v => v.lang === "en-IN") ||
    _voices.find(v => v.lang.startsWith("en")) ||
    _voices[0] || null
  );
}

/**
 * speakText — fires TTS with fine-tuned params for fluent Telugu
 *
 * Telugu native-speaker characteristics we emulate:
 *  • Moderate pace (not too fast) — rate 0.88
 *  • Slightly rising pitch for question words — pitch 1.05
 *  • Full volume, no clipping
 *  • Chrome workaround: resume() loop prevents silent stall after ~15 s
 */
function speakText(text, lang, onStart, onEnd) {
  if (!synthAPI) { onEnd?.(); return; }
  synthAPI.cancel();

  const fire = () => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = bestVoice(lang);
    if (voice) u.voice = voice;

    if (lang === "te") {
      u.lang   = "te-IN";
      u.rate   = 0.88;   // natural Telugu pace
      u.pitch  = 1.05;   // slight lift — sounds less robotic
      u.volume = 1.0;
    } else {
      u.lang   = "en-IN";
      u.rate   = 0.95;
      u.pitch  = 1.0;
      u.volume = 1.0;
    }

    u.onstart = () => onStart?.();

    // Chrome TTS pauses silently on long text — keep it running
    let ticker;
    u.onstart = () => {
      onStart?.();
      ticker = setInterval(() => {
        if (!synthAPI.speaking) { clearInterval(ticker); return; }
        if (synthAPI.paused)    synthAPI.resume();
      }, 4000);
    };
    u.onend   = () => { clearInterval(ticker); onEnd?.(); };
    u.onerror = (e) => {
      clearInterval(ticker);
      if (e.error !== "interrupted" && e.error !== "canceled") console.warn("TTS:", e.error);
      onEnd?.();
    };

    synthAPI.speak(u);
  };

  // Voices may not be loaded yet on page load
  if (synthAPI.getVoices().length === 0) {
    synthAPI.onvoiceschanged = () => { _voices = synthAPI.getVoices(); synthAPI.onvoiceschanged = null; fire(); };
  } else {
    fire();
  }
}

/* ─── Speech-Recognition availability ───────────────────────────────────── */
const SR = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

/* ═══════════════════════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════════════════════ */
export default function AskAI() {
  const { t, lang } = useTranslation();

  const [msgs,       setMsgs]       = useState([{ role:"assistant", text:t("ai_greeting") }]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [listening,  setListening]  = useState(false);
  const [speaking,   setSpeaking]   = useState(false);
  const [interim,    setInterim]    = useState("");   // live partial transcript
  const [srError,    setSrError]    = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const recRef    = useRef(null);    // SpeechRecognition instance

  /* Reset greeting when language switches */
  useEffect(() => {
    setMsgs([{ role:"assistant", text:t("ai_greeting") }]);
    setInput(""); setInterim(""); setSrError("");
  }, [lang]);  // eslint-disable-line

  /* Auto-scroll */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  /* ── Send message ────────────────────────────────────────────────────── */
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
      // ★ NO auto-speak — user clicks the speaker icon per message
    } catch {
      setMsgs(prev => [...prev, {
        role:"assistant",
        text: lang === "te"
          ? "క్షమించండి, ప్రస్తుతం సేవ అందుబాటులో లేదు."
          : "Sorry, the assistant is unavailable right now. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, lang, msgs]);

  /* ── TTS: click speaker icon to read / stop that message ────────────── */
  const speakMsg = useCallback((text) => {
    if (!synthAPI) return;
    if (speaking) { synthAPI.cancel(); setSpeaking(false); return; }
    speakText(text, lang, () => setSpeaking(true), () => setSpeaking(false));
  }, [speaking, lang]);

  const stopSpeak = () => { synthAPI?.cancel(); setSpeaking(false); };

  /* ── Voice recording ─────────────────────────────────────────────────── */
  const startRec = useCallback(() => {
    if (!SR) { setSrError("Speech recognition not supported in this browser."); return; }
    if (listening) return;

    /* Tear down any old session */
    if (recRef.current) { try { recRef.current.abort(); } catch {} recRef.current = null; }

    setSrError(""); setInterim("");

    const rec = new SR();
    rec.lang             = lang === "te" ? "te-IN" : "en-IN";
    rec.continuous       = true;   // keep open until user taps Stop
    rec.interimResults   = true;   // show live partial text
    rec.maxAlternatives  = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      let finals = "", partials = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals   += t;
        else                       partials += t;
      }
      // Show live partial in italic preview
      setInterim(partials);
      // Append confirmed words to the text input
      if (finals) {
        setInput(prev => (prev + (prev ? " " : "") + finals.trim()));
        setInterim("");  // clear preview once finalised
      }
    };

    rec.onerror = (e) => {
      if (e.error === "aborted") return;  // user-initiated stop, not an error
      const msgs = {
        "no-speech":   lang === "te" ? "మాట్లాడే ధ్వని వినలేదు." : "No speech detected — please try again.",
        "not-allowed": lang === "te" ? "మైక్ అనుమతి అవసరం."     : "Microphone access denied.",
        "network":     lang === "te" ? "నెట్‌వర్క్ సమస్య."        : "Network error — check connection.",
      };
      setSrError(msgs[e.error] || (lang === "te" ? "గుర్తింపు విఫలమైంది." : "Recognition failed — try again."));
      setListening(false); setInterim("");
    };

    rec.onend = () => {
      setListening(false); setInterim("");
      inputRef.current?.focus();
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error("rec.start:", err);
      setSrError("Could not start microphone — check browser permissions.");
      setListening(false);
    }
  }, [lang, listening]);

  const stopRec = useCallback(() => {
    if (recRef.current) { try { recRef.current.stop(); } catch {} }
    setListening(false); setInterim("");
  }, []);

  const toggleMic = () => listening ? stopRec() : startRec();

  /* ── Keyboard ────────────────────────────────────────────────────────── */
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const chips = CHIPS[lang] || CHIPS.en;

  return (
    /* Full-height column layout */
    <div className="flex flex-col w-full max-w-2xl mx-auto"
         style={{ height:"calc(100dvh - 7.5rem)", maxHeight:"820px" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
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

      {/* ── Chat window ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="p-3 sm:p-4 space-y-3">

          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""} animate-slide-up`}>
              {/* Avatar */}
              <div className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0
                              ${m.role === "assistant" ? "bg-indigo-100 text-indigo-600" : "bg-gray-900 text-white"}`}>
                {m.role === "assistant" ? <Sparkles size={13} /> : <User size={13} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line
                              ${m.role === "assistant"
                                ? "bg-gray-50 border border-gray-100 text-gray-800"
                                : "bg-indigo-600 text-white"}`}>
                {m.text}
              </div>

              {/* Speaker icon — ONLY on assistant bubbles, click-to-play/stop */}
              {m.role === "assistant" && (
                <button
                  onClick={() => speakMsg(m.text)}
                  title={speaking ? "Stop" : "Read aloud"}
                  className={`self-end h-6 w-6 flex items-center justify-center rounded-lg transition-all flex-shrink-0
                              ${speaking
                                ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                : "bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"}`}>
                  {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>
              )}
            </div>
          ))}

          {/* Typing indicator */}
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

          {/* Quick suggestion chips (only on fresh chat) */}
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

      {/* ── Live interim transcript preview ────────────────────── */}
      {interim && (
        <div className="flex-shrink-0 mt-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
          <p className="text-xs text-indigo-600 italic line-clamp-1">🎤 {interim}</p>
        </div>
      )}

      {/* ── Error notice ────────────────────────────────────────── */}
      {srError && (
        <div className="flex-shrink-0 mt-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600">{srError}</p>
        </div>
      )}

      {/* ── Text input row ──────────────────────────────────────── */}
      <div className="flex-shrink-0 mt-2 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={listening
            ? (lang === "te" ? "వింటున్నాం... మాట్లాడండి" : "Listening... speak now")
            : t("ai_placeholder")}
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

      {/* ── Floating voice button ───────────────────────────────── */}
      {SR && (
        <div className="flex-shrink-0 flex flex-col items-center pt-2.5 pb-1 gap-1">

          {/* Waveform bars while listening */}
          {listening && (
            <div className="flex items-end gap-0.5 mb-1" style={{ height:"18px" }}>
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i}
                  className="w-1 rounded-full animate-wave-bar"
                  style={{
                    height:"100%",
                    background: `hsl(${220 + i * 5},80%,60%)`,
                    animationDelay:`${i * 65}ms`,
                    animationDuration:`${0.55 + (i % 3) * 0.12}s`,
                    transformOrigin:"bottom",
                  }}
                />
              ))}
            </div>
          )}

          {/* The big mic button */}
          <button
            onClick={toggleMic}
            className={[
              "relative flex items-center justify-center rounded-full",
              "w-[60px] h-[60px] shadow-xl transition-all duration-200 active:scale-95",
              listening
                ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                : "shadow-indigo-200",
            ].join(" ")}
            style={!listening ? { background:"linear-gradient(135deg,#4f46e5,#2563eb)" } : {}}
            title={listening ? "Tap to stop" : "Tap to speak"}
          >
            {/* Pulsing rings when active */}
            {listening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400/50 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-red-300/30 animate-ping" style={{ animationDelay:"200ms" }} />
              </>
            )}
            {listening
              ? <MicOff size={23} className="text-white relative z-10" />
              : <Mic    size={23} className="text-white" />
            }
          </button>

          <p className="text-[10px] font-medium text-gray-400 text-center leading-tight">
            {listening
              ? (lang === "te" ? "ఆపడానికి నొక్కండి" : "Tap to stop recording")
              : (lang === "te" ? "🎤 తెలుగులో మాట్లాడండి" : "🎤 Tap to speak")}
          </p>
        </div>
      )}

      {/* Helper text */}
      <p className="flex-shrink-0 text-center text-[9px] text-gray-300 pb-0.5 leading-none">
        {lang === "te" ? "🔊 స్పీకర్ నొక్కితే గొంతు వినిపిస్తుంది" : "🔊 Click the speaker icon next to any message to hear it"}
      </p>
    </div>
  );
}
