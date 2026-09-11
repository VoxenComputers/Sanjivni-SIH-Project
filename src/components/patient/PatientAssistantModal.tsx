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
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { SpeechButton } from '../common/SpeechButton';
import { sendPatientAiChat, PatientAiResponse } from '../../services/patientAiService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
  suggestedAction?: 'sos' | 'call_caregiver' | 'view_routine' | 'view_family';
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
    if (!isOpen && isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    }
  }, [isOpen, isListening]);

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
      const targetId = activePatientId || '70fde7c0-c85e-4c3d-bc49-8ea172128ebd';
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
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('[Patient AI] Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: `You are safe at home, ${patient.honorific}. Everything is on schedule. Let me know if you would like to see your daily routine or family book.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
            <div className="bg-emerald-800 dark:bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-emerald-900 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-white/15 border-2 border-emerald-400/80 flex items-center justify-center shadow-inner flex-shrink-0">
                  <HeartHandshake className="w-8 h-8 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Sanjivni Saathi</span>
                    <span className="bg-emerald-700 text-emerald-100 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-400">
                      Your Companion
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-200 font-bold mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Always by your side • Safe & Reassuring</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setIsOpen(false);
                }}
                className="w-11 h-11 rounded-2xl bg-emerald-900/80 hover:bg-emerald-700 flex items-center justify-center text-white border border-emerald-500/60 transition-colors cursor-pointer"
                aria-label="Close Assistant"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Reassurance & Caregiver Connected Bar */}
            <div className="bg-amber-50 dark:bg-amber-950/50 border-b-2 border-amber-200 dark:border-amber-900 px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>You are safe at home. Speak or type freely.</span>
              </div>
              <span className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-400 hidden sm:inline">
                Caregiver Connected
              </span>
            </div>

            {/* Active Voice Listening Banner */}
            {isListening && (
              <div className="bg-rose-50 dark:bg-rose-950/80 border-b-3 border-rose-400 dark:border-rose-700 p-3 px-4 flex items-center justify-between gap-3 text-rose-950 dark:text-rose-100 animate-pulse flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping"></span>
                  <span className="font-black text-sm sm:text-base">
                    🎤 Listening... Speak now (words appear in box below)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  Done Speaking
                </button>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAF8F5] dark:bg-stone-900">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[88%] sm:max-w-[80%]">
                    {msg.sender === 'bot' && (
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                    )}

                    <div
                      className={`rounded-3xl p-4 sm:p-5 shadow-sm text-left ${
                        msg.sender === 'user'
                          ? 'bg-emerald-700 text-white rounded-tr-sm font-bold text-lg sm:text-xl'
                          : msg.isEmergency
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-3 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100 rounded-tl-sm text-lg sm:text-xl font-bold'
                          : 'bg-white dark:bg-stone-800 border-3 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-tl-sm text-lg sm:text-xl font-bold'
                      }`}
                    >
                      {msg.isEmergency && (
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm font-black mb-2 uppercase tracking-wider">
                          <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
                          <span>Caregiver Alert Triggered</span>
                        </div>
                      )}

                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {/* Read Aloud Voice Button for Seniors */}
                      {msg.sender === 'bot' && (
                        <div className="mt-3.5 pt-2.5 border-t border-stone-100 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2">
                          <SpeechButton 
                            text={msg.text} 
                            label="Read Aloud" 
                            size="sm" 
                            className="text-xs font-black bg-stone-100 dark:bg-stone-700 hover:bg-emerald-100 text-stone-800 dark:text-stone-200"
                          />

                          {/* Quick Action Shortcuts */}
                          {msg.suggestedAction === 'sos' && (
                            <button
                              onClick={() => handleActionClick('sos')}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:translate-y-0.5 cursor-pointer"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>Emergency SOS</span>
                            </button>
                          )}

                          {msg.suggestedAction === 'view_routine' && (
                            <button
                              onClick={() => handleActionClick('view_routine')}
                              className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 hover:bg-emerald-200 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Daily Routine</span>
                            </button>
                          )}

                          {msg.suggestedAction === 'view_family' && (
                            <button
                              onClick={() => handleActionClick('view_family')}
                              className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-700 flex items-center gap-1 hover:bg-amber-200 cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5 text-amber-600" />
                              <span>Open Family Book</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-stone-400 mt-1 px-3">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-stone-500 font-bold text-sm bg-white dark:bg-stone-800 p-3.5 rounded-2xl border-2 border-stone-200 dark:border-stone-700 w-fit animate-pulse">
                  <HeartHandshake className="w-5 h-5 text-emerald-600 animate-spin" />
                  <span>Sanjivni Saathi is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Tap Suggestions */}
            <div className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800/80 border-t-2 border-stone-200 dark:border-stone-700 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
              <span className="text-xs font-black uppercase text-stone-500 dark:text-stone-400 flex-shrink-0">
                Tap to Ask:
              </span>
              <button
                onClick={() => handleQuickPrompt('What is my next task?')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-xs font-black text-stone-800 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>📅 Next Task</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('Did I take my medicines today?')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-xs font-black text-stone-800 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 cursor-pointer"
              >
                <Pill className="w-3.5 h-3.5 text-rose-500" />
                <span>💊 My Medicines</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('Tell me about my family')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-xs font-black text-stone-800 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>👨‍👩‍👦 My Family</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('I feel a bit restless')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-xs font-black text-stone-800 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0 hover:border-emerald-500 cursor-pointer"
              >
                <Smile className="w-3.5 h-3.5 text-amber-500" />
                <span>🧘 Feeling Restless</span>
              </button>
            </div>

            {/* Input Bar with Large Mic & Large Text Input */}
            <div className="p-3 sm:p-4 bg-white dark:bg-stone-900 border-t-3 border-stone-200 dark:border-stone-700 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2.5"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`h-13 w-13 rounded-2xl flex items-center justify-center border-b-4 active:border-b-0 active:translate-y-1 transition-all flex-shrink-0 shadow-md cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 hover:bg-rose-600 border-rose-700 text-white animate-pulse ring-4 ring-rose-400/50'
                      : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start speaking'}
                  title={isListening ? 'Listening... Tap to stop' : 'Tap to speak your question'}
                >
                  {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* Input Text Field (Senior-accessible font size: 18px / text-lg) */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isListening ? 'Listening... Speak now' : 'Ask your Saathi anything...'}
                  className="flex-1 bg-stone-50 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-2xl px-4 py-3 text-stone-900 dark:text-stone-100 font-bold text-base sm:text-lg focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-stone-800 transition-colors shadow-inner"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="h-13 w-13 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex-shrink-0 shadow-md cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
