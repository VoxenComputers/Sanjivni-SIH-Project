import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SpeechButton } from '../common/SpeechButton';
import { soundFx } from '../../utils/audio';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  Pill, 
  Brain, 
  MapPin, 
  User,
  ChevronRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  category?: 'medication' | 'cognitive' | 'geofence' | 'general';
}

export const CaregiverChatbot: React.FC = () => {
  const { patient, tasks, gameHistory, streak, totalStars, t, language } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const adherencePercent = Math.round((completedTasks / tasks.length) * 100);
  const medTasks = tasks.filter((t) => t.category === 'medication');
  const allMedsTaken = medTasks.every((t) => t.completed);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: `Hello Dr. Priya! I am SANJIVNI AI, monitoring ${patient.name} (${patient.honorific}). How can I assist you with his care routine or cognitive tracking today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
    },
  ]);

  const quickPrompts = [
    {
      label: 'Did Koka take his medicine?',
      icon: Pill,
      query: 'Did Koka take his medicine today?',
    },
    {
      label: "Summarize today's cognitive scores",
      icon: Brain,
      query: "Summarize Koka's recent cognitive scores and games.",
    },
    {
      label: 'Is Koka in the safe zone?',
      icon: MapPin,
      query: 'Is Koka currently inside the safe geofence zone?',
    },
    {
      label: "Check routine adherence",
      icon: ShieldCheck,
      query: "How is Koka's daily schedule adherence today?",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const generateBotResponse = (userQuery: string): { text: string; category: ChatMessage['category'] } => {
    const q = userQuery.toLowerCase();

    // 1. Medication queries
    if (q.includes('medicine') || q.includes('pill') || q.includes('dose') || q.includes('bp') || q.includes('দৰব') || q.includes('दवा')) {
      if (allMedsTaken) {
        return {
          text: `Yes! ${patient.honorific} has successfully taken all scheduled medications today, including his morning Amlodipine BP tablet (8:30 AM). Zero missed doses!`,
          category: 'medication',
        };
      } else {
        const pendingMeds = medTasks.filter((m) => !m.completed).map((m) => `${m.title} (${m.timeStr})`).join(', ');
        return {
          text: `Attention: ${patient.honorific} has completed ${medTasks.filter((m) => m.completed).length}/${medTasks.length} medication routines. Pending: ${pendingMeds}. Consider triggering an audio reminder.`,
          category: 'medication',
        };
      }
    }

    // 2. Cognitive & Game queries
    if (q.includes('cognitive') || q.includes('game') || q.includes('score') || q.includes('mmse') || q.includes('memory') || q.includes('মগজু') || q.includes('स्कोर')) {
      const recentGame = gameHistory[0];
      const avgAccuracy = gameHistory.length > 0 
        ? Math.round(gameHistory.reduce((acc, g) => acc + g.accuracy, 0) / gameHistory.length) 
        : 94;
      return {
        text: `${patient.name} currently maintains an active ${streak}-day memory streak with ${totalStars} XP! Last practice: ${recentGame ? `${recentGame.game} (${recentGame.accuracy}% accuracy, +${recentGame.score} XP)` : 'NER Memory Match'}. His 30-day MMSE stability curve is holding steady at 25.8/30 (MCI Stage 1 Stable).`,
        category: 'cognitive',
      };
    }

    // 3. Location & Safe zone queries
    if (q.includes('safe') || q.includes('zone') || q.includes('location') || q.includes('where') || q.includes('geofence') || q.includes('বেলতলা') || q.includes('सुरक्षित')) {
      return {
        text: `Koka is currently verified SAFE inside the Beltola Residence Geofenced Perimeter (26.1445° N, 91.7362° E). Distance from home center: ~120 meters. Smart tracking tag battery is at 88%. No wandering anomaly detected.`,
        category: 'geofence',
      };
    }

    // 4. Routine & Schedule queries
    if (q.includes('routine') || q.includes('schedule') || q.includes('task') || q.includes('adherence') || q.includes('কাম') || q.includes('दिनचर्या')) {
      return {
        text: `Today's routine adherence is currently at ${adherencePercent}% (${completedTasks} of ${tasks.length} tasks completed). Completed: Morning walking in Beltola garden, Namghar prayer, and breakfast.`,
        category: 'general',
      };
    }

    // 5. Doctor & Health Contacts
    if (q.includes('doctor') || q.includes('clinic') || q.includes('hospital') || q.includes('emergency')) {
      return {
        text: `Attending physician is ${patient.doctorName} at ${patient.clinic}. Next regular geriatric cognitive assessment is scheduled for the end of the month. Emergency daughter contact: Dr. Priya Baruah (+91 98640 12345).`,
        category: 'general',
      };
    }

    // Default intelligent response
    return {
      text: `Understood Dr. Priya. ${patient.name} is currently resting comfortably at home. His vitals are stable, routine adherence is at ${adherencePercent}%, and he has logged ${streak} consecutive days of neuroprotective memory exercises. Would you like me to check his medication or location status?`,
      category: 'general',
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    soundFx.playClickSound();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateBotResponse(text);
      soundFx.playSuccessChime();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: response.category,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-40">
        <button
          onClick={() => {
            soundFx.playClickSound();
            setIsOpen(!isOpen);
          }}
          className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-700 text-white border-3 border-emerald-900 shadow-xl hover:bg-emerald-800 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300"
          aria-label="Caregiver AI Assistant"
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white" />
          ) : (
            <>
              <Bot className="w-8 h-8 text-white group-hover:rotate-6 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Slide-over Chatbot Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-cream-50 dark:bg-stone-900 h-full shadow-2xl flex flex-col border-l-3 border-stone-300 dark:border-stone-700 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-emerald-800 dark:bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-emerald-950 dark:border-emerald-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center">
                  <Bot className="w-7 h-7 text-emerald-100" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <span>{t('chatbotTitle')}</span>
                    <span className="bg-emerald-600 text-emerald-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-400">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200 font-bold">
                    Monitoring {patient.name} • Beltola Residence
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-xl bg-emerald-750 hover:bg-emerald-900 flex items-center justify-center text-white border border-emerald-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Patient Status Quick Bar */}
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b-2 border-emerald-200 dark:border-emerald-800 px-4 py-2.5 flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Safe in Perimeter</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Meds: {allMedsTaken ? 'All Taken' : '1 Pending'}</span>
                <span>•</span>
                <span>Streak: {streak}d</span>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-3 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((qp, idx) => {
                const IconComponent = qp.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.query)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 hover:border-emerald-600 text-stone-800 dark:text-stone-100 text-xs font-black hover:bg-emerald-50 dark:hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-900">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3.5 text-sm font-bold shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-emerald-700 text-white border-2 border-emerald-900 rounded-tr-none'
                        : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border-2 border-stone-200 dark:border-stone-700 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.sender === 'bot' && (
                        <SpeechButton text={msg.text} size="sm" />
                      )}
                    </div>

                    <div
                      className={`text-[10px] font-black mt-2 text-right ${
                        msg.sender === 'user' ? 'text-emerald-200' : 'text-stone-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-1 border border-amber-700">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 border border-emerald-900">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-2 text-xs font-black text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-1">Checking patient telemetry...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-white dark:bg-stone-900 border-t-3 border-stone-200 dark:border-stone-700">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about medicine, scores, or location..."
                  className="flex-1 bg-stone-50 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-2xl px-4 py-3 text-stone-900 dark:text-stone-100 font-bold text-sm focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-stone-800 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="h-12 w-12 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white flex items-center justify-center border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
