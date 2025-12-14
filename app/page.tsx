"use client";

import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./components/ThemeToggle";
import CognitiveOrb from "./components/CognitiveOrb";

type Message = {
  role: "user" | "ai";
  text: string;
  image?: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [memory, setMemory] = useState<any>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [memoryUpdated, setMemoryUpdated] = useState(false);
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOrbState = () => {
    if (generatingReport) return "processing";
    if (loading) return "processing";
    if (isListening) return "listening";
    if (isSpeaking) return "speaking";
    return "idle";
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  async function generateReport() {
    if (messages.length === 0) return;
    setGeneratingReport(true);
    
    try {
        const res = await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
        });
        const data = await res.json();
        setReportContent(data.report);
        setShowReport(true);
    } catch (e) {
        console.error("Report generation failed", e);
    } finally {
        setGeneratingReport(false);
    }
  }

  async function sendMessage() {
    if ((!input && !selectedImage) || loading) return;

    setLoading(true);
    let newSignals = [...signals];

    if (lastQuestion && lastQuestion !== input) {
      newSignals.push("rephrase");
    }

    if (
      input.toLowerCase().includes("don't") ||
      input.toLowerCase().includes("dont") ||
      input.toLowerCase().includes("not") ||
      input.toLowerCase().includes("didn't")
    ) {
      newSignals.push("frustration");
    }

    setMessages(prev => [...prev, { role: "user", text: input, image: selectedImage || undefined }]);
    setShowHint(false);
    
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput("");
    setSelectedImage(null);

    let imageToSend = null;
    if (currentImage) {
        imageToSend = currentImage.split(",")[1];
    }

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: currentInput,
        signals: newSignals,
        image: imageToSend,
      }),
    });

    const data = await res.json();

    setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
    const prevMemory = memory;
    setMemory(data.memory);
    setMemoryUpdated(true);
    setTimeout(() => setMemoryUpdated(false), 1000);
    
    const newReasoning = [];
    if (newSignals.includes("rephrase")) {
      newReasoning.push("Rephrase detected → Simplifying explanation");
    }
    if (data.memory.confusionScore === "high") {
      newReasoning.push("Cognitive load rising → Slower pacing");
    }
    if (newSignals.includes("frustration")) {
      newReasoning.push("Frustration detected → Calm, supportive tone");
    }
    if (prevMemory && prevMemory.userLevel !== data.memory.userLevel) {
      newReasoning.push(`User model: ${data.memory.userLevel}`);
    }
    if (newReasoning.length > 0) {
      setReasoning(newReasoning);
    }
    
    setSignals(newSignals);
    setLastQuestion(currentInput);
    setLoading(false);

    if (audioEnabled) {
      try {
        const audioRes = await fetch("/api/speak", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: data.reply,
            memory: data.memory,
          }),
        });
  
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          if (audioData.audio) {
            const audio = new Audio(`data:audio/mpeg;base64,${audioData.audio}`);
            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => setIsSpeaking(false);
            audio.play();
          }
        }
      } catch (e) {
        console.error("Audio fetch error", e);
      }
    }
  }

  const startListening = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert('Speech recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      recognition.start();
    } catch (error) {
      console.error('Speech recognition failed:', error);
      alert('Microphone access denied or not available');
    }
  };

  return (
    <main className="relative flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white transition-colors duration-500 font-sans">
      
      {/* Background Texture & Glow */}
      <div className="bg-noise" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] pointer-events-none" />
      
      {/* Dynamic Background Glow based on Memory */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${
         memory?.confusionScore === 'high' ? 'bg-blue-600' :
         memory?.userLevel === 'expert' ? 'bg-orange-600' :
         'bg-purple-600'
      }`} />

      {/* Report Modal */}
      {showReport && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[slideInLeft_0.3s]">
          <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-2xl">✨</span> Cognitive Journey Report
              </h2>
              <button onClick={() => setShowReport(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white">✕</button>
            </div>
            <div className="p-8 overflow-y-auto whitespace-pre-wrap leading-relaxed text-sm text-gray-700 dark:text-gray-300 font-mono scrollbar-thin">
              {reportContent}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex justify-end gap-3">
              <button onClick={() => window.print()} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Save PDF</button>
              <button onClick={() => setShowReport(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="z-10 flex items-center justify-between p-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-50" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest text-green-600 dark:text-green-400 uppercase">Adaptive System Online</span>
            <span className="text-[10px] text-gray-500 font-mono">Gemini 2.5 Flash • Latency: 45ms</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full">
            {messages.length > 0 && (
                <button
                    onClick={generateReport}
                    disabled={generatingReport}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-all disabled:opacity-50"
                >
                    {generatingReport ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/> : "📊 Report"}
                </button>
            )}
            <div className="w-px h-4 bg-gray-300 dark:bg-white/10" />
            <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-1.5 rounded-full transition-all ${audioEnabled ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={audioEnabled ? "Voice On" : "Voice Off"}
            >
                {audioEnabled ? (
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-4 0c-4.01.91-7 4.49-7 8.77s2.99 7.86 7 8.77v-2.06c-2.89-.86-5-3.54-5-6.71s2.11-5.85 5-6.71V3.23zM9 15c0 1.66 1.34 3 3 3s3-1.34 3-3V9c0-1.66-1.34-3-3-3S9 7.34 9 9v6z"/></svg>
                ) : (
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11h-1.7c0 5.8-4.7 9-9.1 9-2.9 0-5.4-1.4-7-3.6l1.4-1.4c1.2 1.6 3.2 2.7 5.6 2.7 3.5 0 6.7-2.6 6.7-6.7h-1.6l2.9-2.9 2.8 2.9zM7.8 7.8L5.4 5.4C4.3 6.4 3.5 7.6 3 9h1.7c.4-.9 1.1-1.7 1.8-2.4l1.3 1.2zM12 3c-1.6 0-3 1.3-3 3v2l2 2V6c0-.6.4-1 1-1s1 .4 1 1v2.6l2 2V6c0-1.7-1.4-3-3-3z"/></svg>
                )}
            </button>
            <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full gap-6 px-6 pb-6 overflow-hidden">
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative rounded-3xl overflow-hidden glass-panel shadow-2xl">
            
            {/* Header / Orb */}
            <div className="absolute top-0 left-0 w-full p-8 z-10 bg-gradient-to-b from-white/90 dark:from-gray-900/80 to-transparent pointer-events-none flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-br from-gray-900 via-blue-800 to-gray-600 dark:from-white dark:via-blue-100 dark:to-gray-400 bg-clip-text text-transparent drop-shadow-sm tracking-tight">Cogniflux</h1>
                    <p className="text-blue-600/80 dark:text-blue-400/80 text-sm mt-2 font-medium tracking-wide">Cognitive Co-Pilot • v2.5</p>
                </div>
                <div className="scale-90 pointer-events-auto">
                    <CognitiveOrb 
                        state={getOrbState()} 
                        confusionScore={memory?.confusionScore || "low"} 
                        userLevel={memory?.userLevel || "intermediate"} 
                    />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 pt-32 space-y-6 scrollbar-thin">
                <div className={`transition-all duration-700 ${messages.length ? "opacity-0 h-0" : "opacity-100 h-auto"}`}>
                    <div className="flex flex-col items-center justify-center mt-12 gap-4 text-center">
                        <div className="p-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 animate-float">
                            <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-500 max-w-sm">I'm listening to your cognitive signals. Ask me anything, or express confusion, and I'll adapt.</p>
                        {showHint && (
                            <button 
                                onClick={() => setInput("I don't understand this code")}
                                className="text-sm px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                            >
                                Try: "I don't understand"
                            </button>
                        )}
                    </div>
                </div>

                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"} animate-[slideInRight_0.3s]`}>
                        <div className={`p-4 rounded-2xl backdrop-blur-md border ${
                            msg.role === "user" 
                                ? "bg-blue-600/90 dark:bg-blue-600/20 border-blue-500/30 text-white rounded-br-none shadow-[0_4px_15px_rgba(37,99,235,0.2)]" 
                                : "bg-white/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                        }`}>
                            {msg.image && (
                                <img src={msg.image} alt="User Upload" className="max-w-xs h-auto rounded-lg mb-3 border border-white/10 shadow-lg" />
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6">
                <div className="glass-input rounded-2xl p-2 flex items-center gap-2 shadow-2xl relative">
                    
                    {/* Hidden File Input */}
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    
                    {/* Image Preview Thumbnail */}
                    {selectedImage && (
                        <div className="absolute -top-24 left-4 w-20 h-20 rounded-lg border border-blue-500/50 overflow-hidden shadow-lg animate-[slideInLeft_0.2s]">
                            <img src={selectedImage} className="w-full h-full object-cover" />
                            <button onClick={() => setSelectedImage(null)} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity">✕</button>
                        </div>
                    )}

                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        title="Upload Image"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>

                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        disabled={loading}
                        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 px-2 outline-none"
                        placeholder="Type a message or upload an image..."
                    />

                    <button
                        onClick={startListening}
                        className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                    </button>

                    <button
                        onClick={sendMessage}
                        disabled={loading || (!input && !selectedImage)}
                        className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
                <div className="text-center mt-2">
                     <span className="text-[10px] text-gray-500 dark:text-gray-500">Multimodal • Inference-Time • Adaptive</span>
                </div>
            </div>
        </div>

        {/* Cognitive Side Panel (HUD Style) */}
        <div className="w-80 flex flex-col gap-4 hidden lg:flex">
            {/* Memory Card */}
            <div className={`glass-panel p-6 rounded-3xl transition-all duration-500 border-l-4 ${
                memory?.confusionScore === 'high' ? 'border-l-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)]' :
                memory?.confusionScore === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
            }`}>
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-wider uppercase">Live Memory</h3>
                </div>

                {memory ? (
                    <div className="space-y-4">
                         {/* Confusion Meter */}
                         <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Cognitive Load</span>
                                <span className={memory.confusionScore === 'high' ? 'text-blue-500 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}>{memory.confusionScore.toUpperCase()}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${
                                    memory.confusionScore === 'high' ? 'w-[90%] bg-blue-500 animate-pulse' :
                                    memory.confusionScore === 'medium' ? 'w-[50%] bg-yellow-500' : 'w-[20%] bg-green-500'
                                }`} />
                            </div>
                         </div>
                         
                         {/* User Level */}
                         <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                            <span className="text-xs text-gray-500">User Model</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{memory.userLevel}</span>
                         </div>

                         {/* Active Signals */}
                         <div className="space-y-2">
                            <span className="text-xs text-gray-500">Detected Signals</span>
                            <div className="flex flex-wrap gap-2">
                                {memory.detectedSignals.length > 0 ? (
                                    memory.detectedSignals.map((s: string, i: number) => (
                                        <span key={i} className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                                            {s}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[10px] text-gray-500 italic">Listening...</span>
                                )}
                            </div>
                         </div>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-xs text-gray-500 italic">
                        No cognitive data yet
                    </div>
                )}
            </div>

            {/* Reasoning Feed */}
            {reasoning.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl flex-1 border-l-4 border-l-purple-500/50">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-4">Internal Monologue</h3>
                    <div className="space-y-3">
                        {reasoning.map((r, i) => (
                            <div key={i} className="text-xs text-purple-700 dark:text-purple-300/80 pl-3 border-l border-purple-500/20 leading-relaxed animate-[slideInRight_0.3s]">
                                {r}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

      </div>
    </main>
  );
}
