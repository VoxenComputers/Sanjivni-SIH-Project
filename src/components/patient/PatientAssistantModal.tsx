import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartHandshake, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  AlertTriangle, 
  PhoneCall, 
  Calendar, 
  Pill, 
  Users, 
  Smile,
  ShieldCheck,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useApp, DEFAULT_PATIENT_ID } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { SpeechButton } from '../common/SpeechButton';
import { sendPatientAiChat, PatientAiResponse } from '../../services/patientAiService';
import { useTts } from '../../hooks/useTts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
  suggestedAction?: 'sos' | 'call_caregiver' | 'view_routine' | 'view_family';
  isLiveGemini?: boolean;
}

export const PatientAssistantModal: React.FC = () => {
  const { 
    patient, 
    tasks, 
    familyMembers, 
    activePatientId, 
    language,
    setPatientTab,
    toggleWanderingSimulation
  } = useApp();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    return localStorage.getItem('sanjivni_auto_speak') !== 'false';
  });

  const { speak, stop, isSpeaking } = useTts();

  const handleToggleAutoSpeak = () => {
    soundFx.playClickSound();
    setAutoSpeak((prev) => {
      const next = !prev;
      localStorage.setItem('sanjivni_auto_speak', String(next));
      if (!next) {
        stop();
      }
      return next;
    });
  };

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-welcome',
      sender: 'bot',
      text: `Pranam ${patient.honorific} ${patient.name}! I am your Sanjivni Saathi. How can I help you today? You can ask me about your routine, your medicines, or your family.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Auto-scroll to bottom of chat feed
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping, isListening]);

  // Clean up speech recognition when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stop();
      if (isListening) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }
        setIsListening(false);
      }
    }
  }, [isOpen, isListening, stop]);

  /**
   * Toggle Voice Input:
   * 1. Initializes Web Speech API (SpeechRecognition / webkitSpeechRecognition).
   * 2. Captures live interim & final transcripts directly into inputText state.
   * 3. Handles errors & resets listening state on end or cancel.
   */
  const handleToggleVoiceInput = () => {
    soundFx.playClickSound();

    // If currently active, stop listening
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn('[Speech Recognition] Stop error:', err);
        }
      }
      setIsListening(false);
      return;
    }

    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      alert('Voice speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type your message.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Match current app language (defaulting to en-IN or hi-IN)
      recognition.lang =
        language === 'hi'
          ? 'hi-IN'
          : language === 'as'
          ? 'as-IN'
          : language === 'bn'
          ? 'bn-IN'
          : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      // Wire transcript directly to input state
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech Recognition Error:', event.error);
        setIsListening(false);

        if (event.error === 'not-allowed') {
          // Explicitly prompt via getUserMedia if browser blocked recognition
          navigator.mediaDevices?.getUserMedia({ audio: true }).catch(() => {});
          alert('Microphone access was denied. Please click the lock or camera icon in your browser address bar and choose "Allow" for Microphone.');
        } else if (event.error === 'no-speech') {
          // No speech detected - soft reset
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    // If listening is still active, stop it cleanly
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    soundFx.playClickSound();
    const userMsgId = `u-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const targetId = activePatientId || DEFAULT_PATIENT_ID;
      const response: PatientAiResponse = await sendPatientAiChat(
        text,
        targetId,
        messages.map((m) => ({ sender: m.sender, text: m.text })),
        { patient, tasks, familyMembers, language }
      );

      soundFx.playSuccessChime();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: response.isEmergency,
        suggestedAction: response.suggestedAction,
        isLiveGemini: response.isLiveGemini,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (autoSpeak) {
        speak(botMsg.text);
      }
    } catch (err) {
      console.warn('[Patient AI] Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: `You are safe at home, ${patient.honorific}. Everything is on schedule. Let me know if you would like to see your daily routine or family book.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (autoSpeak) {
        speak(fallbackMsg.text);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    soundFx.playClickSound();
    setInputText(prompt);
    handleSendMessage(prompt);
  };

  const handleActionClick = (action?: 'sos' | 'call_caregiver' | 'view_routine' | 'view_family') => {
    soundFx.playClickSound();
    if (action === 'sos') {
      toggleWanderingSimulation();
      setIsOpen(false);
    } else if (action === 'view_routine') {
      setPatientTab('routine');
      setIsOpen(false);
    } else if (action === 'view_family') {
      setPatientTab('reminisce');
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* High-Visibility Floating Action Button for Patient */}
      <div className="fixed bottom-24 md:bottom-8 right-4 sm:right-8 z-40">
        <button
          onClick={() => {
            soundFx.playClickSound();
            setIsOpen(true);
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-3.5 sm:px-5 sm:py-4 rounded-3xl shadow-xl hover:shadow-2xl border-3 border-emerald-400/80 active:translate-y-1 transition-all duration-200 cursor-pointer"
          aria-label="Open Sanjivni Saathi AI Assistant"
        >
          {/* Pulsing indicator halo */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white"></span>
          </span>

          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-7 h-7 text-white" />
          </div>

          <div className="text-left pr-1 hidden sm:block">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              Patient Companion
            </span>
            <h4 className="text-base sm:text-lg font-black tracking-tight leading-none text-white">
              Sanjivni Saathi
            </h4>
          </div>
        </button>
      </div>

      {/* Senior-Friendly Chatbot Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6">
          <div className="w-full max-w-2xl bg-[#FAF8F5] dark:bg-stone-900 h-[92vh] max-h-[780px] rounded-3xl shadow-2xl flex flex-col border-4 border-stone-300 dark:border-stone-700 animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-emerald-850 dark:bg-emerald-950 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b-2 border-emerald-900 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
                  <HeartHandshake className="w-6 h-6 text-emerald-100" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                      Sanjivni Saathi
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-500/40 whitespace-nowrap shadow-xs">
                      <Sparkles className="w-2.5 h-2.5 text-amber-300 flex-shrink-0" />
                      Gemini 3.6 Flash
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium flex items-center gap-1 mt-0.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                    <span>Safe & Reassuring Companion</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleToggleAutoSpeak}
                  title={autoSpeak ? 'Auto-Voice readout is ON (Sarvam AI & Browser Fallback)' : 'Auto-Voice readout is muted'}
                  className={`h-8 px-2.5 sm:px-3 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    autoSpeak
                      ? 'bg-emerald-700/90 hover:bg-emerald-700 text-white border-emerald-400/80 shadow-xs'
                      : 'bg-emerald-950/60 hover:bg-emerald-950 text-emerald-300 border-emerald-700/60'
                  }`}
                >
                  {autoSpeak ? (
                    <>
                      <Volume2 className={`w-3.5 h-3.5 text-amber-300 flex-shrink-0 ${isSpeaking ? 'animate-bounce' : ''}`} />
                      <span className="hidden sm:inline">Auto-Voice: ON</span>
                      <span className="sm:hidden">Voice ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-emerald-300/70 flex-shrink-0" />
                      <span className="hidden sm:inline">Auto-Voice: OFF</span>
                      <span className="sm:hidden">Voice OFF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    stop();
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                  aria-label="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reassurance & Caregiver Connected Bar */}
            <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 px-4 py-1.5 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Smile className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>You are safe at home. Speak or type freely.</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 hidden sm:inline">
                Caregiver Connected
              </span>
            </div>

            {/* Active Voice Listening Banner */}
            {isListening && (
              <div className="bg-rose-50 dark:bg-rose-950/80 border-b-2 border-rose-400 dark:border-rose-700 px-4 py-2 flex items-center justify-between gap-3 text-rose-950 dark:text-rose-100 animate-pulse flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                  <span className="font-bold text-xs sm:text-sm">
                    Listening... Speak now (words will appear below)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-[#FAF8F5] dark:bg-stone-900">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[92%] sm:max-w-[85%] ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl p-3.5 sm:p-4 shadow-xs text-left ${
                        msg.sender === 'user'
                          ? 'bg-emerald-700 text-white rounded-tr-xs font-bold text-sm sm:text-base border border-emerald-800'
                          : msg.isEmergency
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100 rounded-tl-xs text-sm sm:text-base font-bold'
                          : 'bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-tl-xs text-sm sm:text-base'
                      }`}
                    >
                      {msg.isEmergency && (
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-black mb-1.5 uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                          <span>Caregiver Alert Triggered</span>
                        </div>
                      )}

                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>

                      {/* Bot Response Actions & Aligned Footer */}
                      {msg.sender === 'bot' && (
                        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-700/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SpeechButton 
                              text={msg.text} 
                              label="Read Aloud" 
                              size="sm" 
                            />

                            {/* Quick Action Shortcuts */}
                            {msg.suggestedAction === 'sos' && (
                              <button
                                onClick={() => handleActionClick('sos')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer transition-all"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Emergency SOS</span>
                              </button>
                            )}

                            {msg.suggestedAction === 'view_routine' && (
                              <button
                                onClick={() => handleActionClick('view_routine')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 cursor-pointer transition-all"
                              >
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Daily Routine</span>
                              </button>
                            )}

                            {msg.suggestedAction === 'view_family' && (
                              <button
                                onClick={() => handleActionClick('view_family')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-300 dark:border-amber-700 hover:bg-amber-200 cursor-pointer transition-all"
                              >
                                <Users className="w-3.5 h-3.5 text-amber-600" />
                                <span>Family Book</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-800">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                              Gemini 3.6
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 mt-1 pr-1">
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-bold text-xs bg-white dark:bg-stone-800 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 w-fit animate-pulse shadow-xs">
                  <HeartHandshake className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Sanjivni Saathi is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Tap Suggestions */}
            <div className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800/90 border-t border-stone-200 dark:border-stone-700 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex-shrink-0">
                Tap to Ask:
              </span>
              <button
                onClick={() => handleQuickPrompt('What is my next task?')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Next Task</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('Did I take my medicines today?')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Pill className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span>My Medicines</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('Tell me about my family')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>My Family</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('I feel a bit restless')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Smile className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Feeling Restless</span>
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-xs ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400'
                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start speaking'}
                  title={isListening ? 'Listening... Tap to stop' : 'Tap to speak your question'}
                >
                  {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Input Text Field */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isListening ? 'Listening... Speak now' : 'Ask your Saathi anything...'}
                  className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-stone-900 dark:text-stone-100 font-medium text-sm sm:text-base focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-stone-800 transition-colors shadow-inner"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="h-11 w-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all flex-shrink-0 shadow-xs cursor-pointer active:scale-95"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
