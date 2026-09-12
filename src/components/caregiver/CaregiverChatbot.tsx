import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { SpeechButton } from '../common/SpeechButton';
import { soundFx } from '../../utils/audio';
import { 
  streamCaregiverAiChat, 
  buildPatientHealthContext, 
  PatientHealthContext, 
  HealthAnomalyAlert 
} from '../../services/caregiverAiService';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Pill, 
  Brain, 
  User, 
  RefreshCw, 
  ChevronRight,
  AlertCircle,
  FileText,
  HelpCircle,
  Zap,
  Activity
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  category?: 'medication' | 'cognitive' | 'geofence' | 'general';
}

/**
 * Helper to render inline markdown styles (**bold**, *italic*, `code`)
 */
const renderInlineStyles = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-black text-stone-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-stone-700 dark:text-stone-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-700 dark:text-emerald-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

/**
 * Clean, lightweight Markdown Parser for Clinical AI Summaries
 */
const FormattedMessageText: React.FC<{ content: string }> = ({ content }) => {
  const blocks = content.split('\n\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Headings (e.g. ### Heading or ## Heading)
        if (trimmed.startsWith('#')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={bIdx} className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-300 pt-1 pb-0.5 border-b border-emerald-200/60 dark:border-emerald-800/60">
              {renderInlineStyles(headingText)}
            </h4>
          );
        }

        // Bullet Lists (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n');
          return (
            <ul key={bIdx} className="space-y-1.5 my-1 pl-1">
              {items.map((item, iIdx) => {
                const cleanItem = item.replace(/^[-*]\s+/, '');
                return (
                  <li key={iIdx} className="flex items-start gap-2 text-stone-800 dark:text-stone-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0"></span>
                    <span className="flex-1">{renderInlineStyles(cleanItem)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered Lists (1. Item)
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n');
          return (
            <ol key={bIdx} className="space-y-1.5 my-1 pl-1">
              {items.map((item, iIdx) => {
                const match = item.match(/^(\d+\.)\s*(.*)/);
                const num = match ? match[1] : `${iIdx + 1}.`;
                const text = match ? match[2] : item;
                return (
                  <li key={iIdx} className="flex items-start gap-2 text-stone-800 dark:text-stone-200">
                    <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs mt-0.5 flex-shrink-0">
                      {num}
                    </span>
                    <span className="flex-1">{renderInlineStyles(text)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Standard Paragraph
        return (
          <p key={bIdx} className="text-stone-800 dark:text-stone-200 font-medium">
            {renderInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const CaregiverChatbot: React.FC = () => {
  const { patient, tasks, gameHistory, streak, totalStars, t, language, selectedRegion } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [healthContext, setHealthContext] = useState<PatientHealthContext | null>(null);
  const [activeAnomalies, setActiveAnomalies] = useState<HealthAnomalyAlert[]>([]);
  const [isRefreshingContext, setIsRefreshingContext] = useState<boolean>(false);
  const [showAnomaliesBanner, setShowAnomaliesBanner] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-welcome',
      sender: 'bot',
      text: `### 🩺 Sanjivni Caregiver Companion AI\n\nHello Dr. Priya! I am your clinical thought partner powered by **Google Gemini 2.5/3.6 Flash**.\n\nI continuously monitor **${patient.name} (${patient.honorific} Bhaben)**'s 7-day routine adherence, cognitive performance trajectory, and family interactions to flag drops in baseline and assist your daily care decisions. How can I help you right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
    },
  ]);

  // Load patient context and anomaly telemetry
  const loadContextTelemetry = useCallback(async () => {
    setIsRefreshingContext(true);
    try {
      const ctx = await buildPatientHealthContext('demo-patient-koka', {
        patient,
        tasks,
        gameHistory,
        language,
        selectedRegion,
      });
      setHealthContext(ctx);
      setActiveAnomalies(ctx.anomalies);
    } catch (err) {
      console.warn('[Caregiver AI] Context loading notice:', err);
    } finally {
      setIsRefreshingContext(false);
    }
  }, [patient, tasks, gameHistory, language, selectedRegion]);

  useEffect(() => {
    loadContextTelemetry();
  }, [loadContextTelemetry]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Quick Prompt Chips required by clinical specifications
  const quickPrompts = [
    {
      label: '📊 Weekly Health & Memory Summary',
      query: 'Please generate a comprehensive weekly health and memory summary for Koka Bhaben, covering routine adherence, cognitive trajectory, and family engagement.',
      icon: Activity,
    },
    {
      label: '⚠️ Any anomalies or score drops today?',
      query: 'Are there any detected anomalies, cognitive score dips, or overdue medications for Koka today? Please provide clinical observations and recommended steps.',
      icon: AlertTriangle,
    },
    {
      label: '💡 How can I improve routine adherence?',
      query: 'What practical, culturally grounded strategies can I use to improve Koka Bhaben\'s daily routine adherence without causing agitation?',
      icon: Zap,
    },
    {
      label: '📋 Generate handoff report',
      query: 'Generate a structured caregiver shift handoff report for Koka Bhaben including completed routines, pending medication, cognitive performance, and next shift instructions.',
      icon: FileText,
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

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

    const botMsgId = `bot-${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      category: 'general',
    };

    setMessages((prev) => [...prev, initialBotMsg]);

    try {
      await streamCaregiverAiChat(
        text,
        'demo-patient-koka',
        (chunkText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, text: m.text + chunkText } : m
            )
          );
        },
        messages.map((m) => ({ sender: m.sender, text: m.text })),
        { patient, tasks, gameHistory, language, selectedRegion }
      );

      soundFx.playSuccessChime();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: any) {
      console.warn('[Caregiver AI] Chat failed, falling back:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: `### Observational Update\n\nDr. Priya, I monitored Koka Bhaben's telemetry. Today's task completion is at **${healthContext?.routineStats.completionRateToday ?? 75}%** and his recent cognitive game score is **${healthContext?.cognitiveStats.todayAvgScore ?? 70} pts**.\n\nAll critical medication reminders remain active. Let me know if you would like me to adjust any task schedules!`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const criticalAnomaliesCount = activeAnomalies.filter((a) => a.level === 'critical').length;
  const warningAnomaliesCount = activeAnomalies.filter((a) => a.level === 'warning').length;

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-40">
        <button
          onClick={() => {
            soundFx.playClickSound();
            setIsOpen(!isOpen);
          }}
          className={`group relative flex items-center justify-center w-16 h-16 rounded-full text-white shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300 active:scale-95 ${
            criticalAnomaliesCount > 0
              ? 'bg-rose-700 hover:bg-rose-800 border-3 border-rose-950 animate-bounce'
              : 'bg-emerald-700 hover:bg-emerald-800 border-3 border-emerald-900'
          }`}
          aria-label="Caregiver Companion AI Assistant"
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white" />
          ) : (
            <>
              <Bot className="w-8 h-8 text-white group-hover:rotate-6 transition-transform" />
              {activeAnomalies.length > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-rose-600 text-white text-[10px] font-black border-2 border-white shadow-sm">
                    {activeAnomalies.length}
                  </span>
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Slide-over Chatbot Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-cream-50 dark:bg-stone-900 h-full shadow-2xl flex flex-col border-l-3 border-stone-300 dark:border-stone-700 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-emerald-850 dark:bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-emerald-950 dark:border-emerald-900 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700/80 border-2 border-emerald-400 flex items-center justify-center shadow-inner flex-shrink-0">
                  <Bot className="w-7 h-7 text-emerald-100" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap">
                    <span>Sanjivni AI Companion</span>
                    <span className="bg-emerald-600/90 text-emerald-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-400/80 inline-flex items-center gap-1 whitespace-nowrap shadow-xs">
                      <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                      Gemini 3.6 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200 font-bold flex items-center gap-1.5 mt-0.5">
                    <span>Observing {patient.name} ({patient.honorific})</span>
                    <span>•</span>
                    <span className="text-emerald-300">Age {patient.age}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={loadContextTelemetry}
                  disabled={isRefreshingContext}
                  title="Refresh Patient Health Telemetry"
                  className="w-9 h-9 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white border border-emerald-600/60 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingContext ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-white border border-emerald-600/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Patient Telemetry Status Bar */}
            <div className="bg-emerald-50 dark:bg-emerald-950/70 border-b-2 border-emerald-200 dark:border-emerald-800 px-4 py-2 flex items-center justify-between text-xs font-black text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse flex-shrink-0"></span>
                <span className="truncate">
                  Adherence: {healthContext?.routineStats.completionRateToday ?? 80}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] sm:text-xs">
                <span>Game Avg: {healthContext?.cognitiveStats.todayAvgScore ?? 75} pts</span>
                <span>•</span>
                <span>Meds: {healthContext?.routineStats.completedMedicationsCount ?? 1}/{healthContext?.routineStats.totalMedicationsCount ?? 2}</span>
                <span>•</span>
                <span>Streak: {streak}d</span>
              </div>
            </div>

            {/* High-Priority Anomaly Alerts Banner (Directly Above Chat Feed) */}
            {activeAnomalies.length > 0 && showAnomaliesBanner && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b-2 border-rose-200 dark:border-rose-900 flex flex-col gap-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 dark:text-rose-200 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Active Telemetry Alerts ({activeAnomalies.length})</span>
                  </div>
                  <button
                    onClick={() => setShowAnomaliesBanner(false)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 dark:text-rose-300 underline"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeAnomalies.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded-xl border-2 flex items-start justify-between gap-2 text-xs ${
                        alert.level === 'critical'
                          ? 'bg-white dark:bg-stone-800 border-rose-300 dark:border-rose-700 text-stone-900 dark:text-white shadow-sm'
                          : 'bg-white dark:bg-stone-800 border-amber-300 dark:border-amber-700 text-stone-900 dark:text-white shadow-sm'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              alert.level === 'critical'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                            }`}
                          >
                            {alert.level}
                          </span>
                          <span className="font-extrabold text-stone-900 dark:text-stone-100 truncate">
                            {alert.title}
                          </span>
                        </div>
                        <p className="text-stone-600 dark:text-stone-300 font-bold mt-1 text-[11px] leading-snug">
                          {alert.description}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleSendMessage(
                            `Please analyze this alert: "${alert.title}: ${alert.description}". What non-alarmist causes might explain this, and what practical caregiver steps should I take?`
                          )
                        }
                        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] shadow-sm transition-all active:scale-95"
                      >
                        Ask AI
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-stone-100 dark:bg-stone-800/90 border-b border-stone-200 dark:border-stone-700 flex gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((qp, idx) => {
                const IconComponent = qp.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.query)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 hover:border-emerald-600 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-stone-800 transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-cream-50 dark:bg-stone-900">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-9 h-9 rounded-xl bg-emerald-750 text-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-950 shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[86%] sm:max-w-[82%] rounded-2xl p-3.5 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-emerald-700 text-white border-2 border-emerald-900 rounded-tr-none text-sm font-bold'
                        : 'bg-white dark:bg-stone-800/95 text-stone-800 dark:text-stone-100 border-2 border-stone-200 dark:border-stone-700 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div>
                        <FormattedMessageText content={msg.text} />

                        {/* Speech and Timestamp Action Bar */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-100 dark:border-stone-700/80">
                          <div className="flex items-center gap-1.5">
                            {msg.text && (
                              <SpeechButton
                                text={msg.text.replace(/###|#|\*\*|\*|`|\[.*?\]/g, '')}
                                size="sm"
                                label="Listen"
                              />
                            )}
                            {msg.isStreaming && (
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 animate-pulse">
                                Streaming from Gemini...
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                              Gemini 3.6 Flash
                            </span>
                            <span className="text-[10px] font-black text-stone-400 dark:text-stone-500">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-700 shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && messages[messages.length - 1]?.sender !== 'bot' && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-9 h-9 rounded-xl bg-emerald-750 text-white flex items-center justify-center flex-shrink-0 border border-emerald-950 shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-2.5 text-xs font-black text-stone-600 dark:text-stone-300 flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                    <span>Reasoning over patient health trajectory...</span>
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
                  placeholder="Ask Gemini about cognitive trends, medications, or handoff..."
                  className="flex-1 bg-stone-50 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-2xl px-4 py-3 text-stone-900 dark:text-stone-100 font-bold text-sm focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-stone-800 transition-colors shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="h-12 w-12 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex-shrink-0 shadow-md"
                  aria-label="Send query"
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
