"use client";

import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./components/ThemeToggle";
import CognitiveOrb from "./components/CognitiveOrb";

type Message = {
  role: "user" | "ai";
  text: string;
  image?: string;
  reaction?: string;
  timestamp?: number;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  pinned?: boolean;
  folder?: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
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
  const [guestStartTime, setGuestStartTime] = useState<number | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [readingMessageIndex, setReadingMessageIndex] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          startNewChat();
        } else if (e.key === '/') {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cogniflux-chats');
    if (saved) setChats(JSON.parse(saved));
    
    const guestStart = localStorage.getItem('cogniflux-guest-start');
    if (guestStart) setGuestStartTime(parseInt(guestStart));
    
    // Restore draft
    const draft = localStorage.getItem('cogniflux-draft');
    if (draft) setInput(draft);
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (input) {
      localStorage.setItem('cogniflux-draft', input);
    } else {
      localStorage.removeItem('cogniflux-draft');
    }
  }, [input]);

  // Guest timer check (30 minutes)
  useEffect(() => {
    if (!isGuest || !guestStartTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - guestStartTime;
      if (elapsed > 1800000) setShowAuthPrompt(true); // 30 minutes
    }, 10000);
    
    return () => clearInterval(interval);
  }, [guestStartTime, isGuest]);

  // Save current chat
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      const updatedChats = chats.map(c => 
        c.id === currentChatId ? { ...c, messages, title: messages[0]?.text.slice(0, 50) || 'New Chat' } : c
      );
      setChats(updatedChats);
      localStorage.setItem('cogniflux-chats', JSON.stringify(updatedChats));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: Date.now()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setMessages([]);
    setMemory(null);
    setSignals([]);
    setReasoning([]);
    setShowHint(true);
  };

  const loadChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setShowSidebar(false);
    }
  };

  const deleteChat = (chatId: string) => {
    const updated = chats.filter(c => c.id !== chatId);
    setChats(updated);
    localStorage.setItem('cogniflux-chats', JSON.stringify(updated));
    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId(null);
    }
  };

  const togglePinChat = (chatId: string) => {
    const updated = chats.map(c => c.id === chatId ? {...c, pinned: !c.pinned} : c);
    setChats(updated);
    localStorage.setItem('cogniflux-chats', JSON.stringify(updated));
  };

  const speakMessage = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setReadingMessageIndex(index);
      utterance.onend = () => setReadingMessageIndex(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const editMessage = (index: number) => {
    setEditingMessageIndex(index);
    setEditText(messages[index].text);
  };

  const saveEdit = () => {
    if (editingMessageIndex !== null) {
      const updated = [...messages];
      updated[editingMessageIndex].text = editText;
      setMessages(updated);
      setEditingMessageIndex(null);
    }
  };

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

    // Start guest timer on first message
    if (isGuest && !guestStartTime) {
      const now = Date.now();
      setGuestStartTime(now);
      localStorage.setItem('cogniflux-guest-start', now.toString());
    }

    // Block if guest time expired
    if (isGuest && guestStartTime && (Date.now() - guestStartTime > 1800000)) {
      setShowAuthPrompt(true);
      return;
    }

    // Start new chat if none exists
    if (!currentChatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: input.slice(0, 50) || 'New Chat',
        messages: [],
        timestamp: Date.now()
      };
      setChats([newChat, ...chats]);
      setCurrentChatId(newChat.id);
    }

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

    setMessages(prev => [...prev, { role: "user", text: input, image: selectedImage || undefined, timestamp: Date.now() }]);
    setShowHint(false);
    setIsTyping(true);
    
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput("");
    setSelectedImage(null);
    localStorage.removeItem('cogniflux-draft');

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

    setIsTyping(false);
    setMessages(prev => [...prev, { role: "ai", text: data.reply, timestamp: Date.now() }]);
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
    <main className="relative flex h-screen overflow-hidden bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white transition-colors duration-500 font-sans">
      
      {/* Background Texture & Glow */}
      <div className="bg-noise" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] pointer-events-none" />
      
      {/* Dynamic Background Glow based on Memory */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${
         memory?.confusionScore === 'high' ? 'bg-blue-600' :
         memory?.userLevel === 'expert' ? 'bg-orange-600' :
         'bg-purple-600'
      }`} />

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setShowShortcuts(false)}>
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 text-center">⌨️ Keyboard Shortcuts</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <span>New Chat</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <span>Send Message</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <span>Show Shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl + /</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <span>Focus Input</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">/</kbd>
              </div>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full mt-6 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all">
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-white/10">
            <h2 className="text-2xl font-bold mb-4 text-center">Share Chat</h2>
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg break-all text-sm">
              {shareLink || 'Generating link...'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert('Link copied!');
                }}
                className="flex-1 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-white/10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Continue Your Journey</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Sign up to save your chats, unlock unlimited messages, and access advanced features.</p>
            
            <div className="space-y-3">
              <button onClick={() => window.location.href = '/signup'} className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all">
                Sign Up Free
              </button>
              <button onClick={() => window.location.href = '/login'} className="w-full p-3 border border-gray-300 dark:border-gray-600 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
                Sign In
              </button>
              <button onClick={() => setShowAuthPrompt(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel border-r border-gray-200 dark:border-white/10 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex gap-2 mb-4">
            <button onClick={startNewChat} className="flex-1 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New
            </button>
            <div className="relative group">
              <button className="p-3 border border-gray-300 dark:border-gray-600 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all" title="Export Chat">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <div className="absolute top-full mt-2 left-0 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-40 z-50">
                <button onClick={() => {
                  const text = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `chat-${Date.now()}.txt`;
                  a.click();
                }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  📄 Text File
                </button>
                <button onClick={() => {
                  const chatData = JSON.stringify(messages, null, 2);
                  const blob = new Blob([chatData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `chat-${Date.now()}.json`;
                  a.click();
                }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  📋 JSON
                </button>
                <button onClick={() => window.print()} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  🖨️ Print/PDF
                </button>
              </div>
            </div>
          </div>
          
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 mb-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {['all', 'work', 'personal', 'code'].map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all ${
                  selectedFolder === folder
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {folder === 'all' ? '📁 All' : folder === 'work' ? '💼 Work' : folder === 'personal' ? '👤 Personal' : '💻 Code'}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
            {chats
              .filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(chat => selectedFolder === 'all' || chat.folder === selectedFolder)
              .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
              .map(chat => (
              <div key={chat.id} className={`group p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all ${currentChatId === chat.id ? 'bg-blue-500/10 border border-blue-500/20' : ''}`}>
                <div onClick={() => loadChat(chat.id)} className="flex-1">
                  <div className="flex items-center gap-1">
                    {chat.pinned && <span className="text-xs">📌</span>}
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">{new Date(chat.timestamp).toLocaleDateString()}</p>
                    <span className="text-xs text-gray-400">• {chat.messages.length} msgs</span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); togglePinChat(chat.id); }} className="p-1 hover:bg-yellow-500/10 text-yellow-500 rounded transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-72">
      {/* Top Bar */}
      <div className="z-10 flex items-center justify-between p-4 lg:p-6 w-full border-b border-gray-200 dark:border-white/10 glass-panel">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-50" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest text-green-600 dark:text-green-400 uppercase">Adaptive System Online</span>
            <span className="text-[10px] text-gray-500 font-mono">Gemini 2.0 Flash • Latency: 45ms</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full">
                <button
                    onClick={generateReport}
                    disabled={generatingReport}
                    className="text-xs font-medium text-purple-600 dark:text-purple-300 hover:text-purple-500 transition-all disabled:opacity-50"
                >
                    {generatingReport ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/> : "📊"}
                </button>
                <button
                    onClick={() => setShowShortcuts(true)}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-all"
                    title="Keyboard Shortcuts"
                >
                    ⌨️
                </button>
                <button
                    onClick={() => {
                      const link = `${window.location.origin}/chat/${currentChatId}`;
                      setShareLink(link);
                      setShowShareModal(true);
                    }}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all"
                    title="Share Chat"
                >
                    🔗
                </button>
                <button
                    onClick={() => {
                      setMessages([]);
                      setMemory(null);
                      setReasoning([]);
                    }}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    title="Clear Chat"
                >
                    🗑️
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full">
              <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-1 rounded-full transition-all ${audioEnabled ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}
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
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <div className="glass-panel px-3 py-1.5 rounded-full text-xs text-gray-600 dark:text-gray-400">
                  {messages.length} messages • {messages.reduce((acc, m) => acc + m.text.split(' ').length, 0)} words
                </div>
              )}
              {isGuest && (
                <>
                  <a href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all">
                    Sign In
                  </a>
                  <a href="/signup" className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all">
                    Sign Up
                  </a>
                </>
              )}
            </div>
        </div>
      </div>

      <div className="flex flex-1 w-full gap-4 lg:gap-6 px-4 lg:px-6 pb-4 lg:pb-6 overflow-hidden">
        
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
            <div 
              ref={messagesContainerRef}
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                const isScrolledUp = target.scrollHeight - target.scrollTop - target.clientHeight > 100;
                setShowScrollButton(isScrolledUp);
              }}
              className="flex-1 overflow-y-auto p-8 pt-32 space-y-6 scrollbar-thin relative"
            >
                <div className={`transition-all duration-700 ${messages.length ? "opacity-0 h-0" : "opacity-100 h-auto"}`}>
                    <div className="flex flex-col items-center justify-center mt-12 gap-4 text-center">
                        <div className="p-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 animate-float">
                            <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-500 max-w-sm">I'm listening to your cognitive signals. Ask me anything, or express confusion, and I'll adapt.</p>
                        {showHint && (
                            <div className="flex flex-wrap gap-2 justify-center">
                              <button onClick={() => setInput("Write a Python function to sort a list")} className="text-xs px-3 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                  💻 Code example
                              </button>
                              <button onClick={() => setInput("Explain machine learning in simple terms")} className="text-xs px-3 py-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors border border-purple-500/20">
                                  🧠 Learn concept
                              </button>
                              <button onClick={() => setInput("Help me brainstorm startup ideas")} className="text-xs px-3 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20">
                                  💡 Brainstorm
                              </button>
                            </div>
                        )}
                    </div>
                </div>

                {messages.map((msg, i) => (
                    <div key={i} className={`group flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"} animate-[slideInRight_0.3s]`}>
                        <div className={`relative p-4 rounded-2xl backdrop-blur-md border ${
                            msg.role === "user" 
                                ? "bg-blue-600/90 dark:bg-blue-600/20 border-blue-500/30 text-white rounded-br-none shadow-[0_4px_15px_rgba(37,99,235,0.2)]" 
                                : "bg-white/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                        }`}>
                            {msg.image && (
                                <img src={msg.image} alt="User Upload" className="max-w-xs h-auto rounded-lg mb-3 border border-white/10 shadow-lg" />
                            )}
                            {editingMessageIndex === i ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">Save</button>
                                  <button onClick={() => setEditingMessageIndex(null)} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded-lg text-sm">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                              {msg.text.includes('```') ? (
                                msg.text.split('```').map((block, idx) => {
                                  if (idx % 2 === 0) {
                                    return <p key={idx} className="whitespace-pre-wrap leading-relaxed">{block}</p>;
                                  }
                                  const [lang, ...code] = block.split('\n');
                                  return (
                                    <div key={idx} className="relative my-3">
                                      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">{lang || 'code'}</div>
                                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                                        <code>{code.join('\n')}</code>
                                      </pre>
                                      <button
                                        onClick={() => navigator.clipboard.writeText(code.join('\n'))}
                                        className="absolute bottom-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
                                      >
                                        Copy code
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                              )}
                            </div>
                            {editingMessageIndex !== i && (
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                                <button
                                  onClick={() => speakMessage(msg.text, i)}
                                  className={`p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all ${readingMessageIndex === i ? 'animate-pulse bg-green-500/20' : ''}`}
                                  title="Read aloud"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </button>
                                <button
                                  onClick={() => navigator.clipboard.writeText(msg.text)}
                                  className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                  title="Copy"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                                {msg.role === "user" && (
                                  <button
                                    onClick={() => editMessage(i)}
                                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                    title="Edit"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                )}
                                {msg.role === "ai" && i === messages.length - 1 && (
                                  <button
                                    onClick={() => {
                                      setMessages(messages.slice(0, -1));
                                      sendMessage();
                                    }}
                                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                    title="Regenerate"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                  </button>
                                )}
                              </div>
                            )}
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              {msg.timestamp && (
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              )}
                              <span>•</span>
                              <span>{msg.text.split(' ').length} words</span>
                              {msg.role === "ai" && (
                                <div className="flex gap-1 ml-auto">
                                  <button onClick={() => {
                                    const updated = [...messages];
                                    updated[i].reaction = updated[i].reaction === '👍' ? undefined : '👍';
                                    setMessages(updated);
                                  }} className={`hover:scale-125 transition-transform ${msg.reaction === '👍' ? 'scale-125' : ''}`}>👍</button>
                                  <button onClick={() => {
                                    const updated = [...messages];
                                    updated[i].reaction = updated[i].reaction === '👎' ? undefined : '👎';
                                    setMessages(updated);
                                  }} className={`hover:scale-125 transition-transform ${msg.reaction === '👎' ? 'scale-125' : ''}`}>👎</button>
                                </div>
                              )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start gap-2 max-w-[80%] animate-[slideInRight_0.3s]">
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
                
                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="fixed bottom-32 right-8 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all animate-bounce"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </button>
                )}
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
                <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                     <span>Multimodal • Inference-Time • Adaptive • <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to send</span>
                     {isGuest && guestStartTime && (
                       <span className="text-orange-500">
                         ⏱️ Guest: {Math.max(0, Math.floor((1800000 - (Date.now() - guestStartTime)) / 60000))}m left
                       </span>
                     )}
                </div>
            </div>
        </div>

        {/* Cognitive Side Panel (HUD Style) */}
        <div className="w-64 xl:w-80 flex flex-col gap-4 hidden lg:flex">
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
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
      )}
    </main>
  );
}
