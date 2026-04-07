import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Lottie from 'lottie-react';
import { Mic } from 'lucide-react';

export function AvatarGuide({ state, cardData, useSimli = false, onWalkComplete, onGreetingComplete }: {
  state: string;
  cardData?: any;
  useSimli?: boolean;
  onWalkComplete: () => void;
  onGreetingComplete: () => void;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const speakingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetch('https://assets2.lottiefiles.com/packages/lf20_xh83pj1c.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load Lottie animation", err));
  }, []);

  const connectToOpenAI = async () => {
    try {
      // 1. Get Ephemeral Token from our backend
      const tokenResponse = await fetch("/api/session", { method: "POST" });
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // 2. Create Peer Connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Set up Audio Element for playback
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 4. Add Microphone Track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      // 5. Create Data Channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      
      dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        
        if (event.type === "response.audio.delta") {
           setIsSpeaking(true);
           setIsThinking(false);
           
           // Debounce speaking state to prevent flickering
           clearTimeout(speakingTimeoutRef.current);
           speakingTimeoutRef.current = setTimeout(() => {
             setIsSpeaking(false);
           }, 500);
        }
        if (event.type === "input_audio_buffer.speech_started") {
           setIsUserSpeaking(true);
           setIsSpeaking(false); // Stop AI speaking visually if interrupted
        }
        if (event.type === "input_audio_buffer.speech_stopped") {
           setIsUserSpeaking(false);
           setIsThinking(true);
        }
        if (event.type === "response.created") {
           setIsThinking(false);
        }
      });

      // 6. Create Offer and Connect
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-mini-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = { type: "answer" as RTCSdpType, sdp: await sdpResponse.text() };
      await pc.setRemoteDescription(answer);
      
      setIsListening(true);
      
      // Trigger initial greeting once connected
      dc.addEventListener("open", () => {
         dc.send(JSON.stringify({
            type: "response.create",
            response: {
               instructions: "Say: Hi! I'm your virtual guide. How can I help you explore Michaelangelo's card today?"
            }
         }));
      });

    } catch (error) {
      console.error("Failed to connect to OpenAI Realtime API", error);
      setIsThinking(false);
    }
  };

  useEffect(() => {
    if (state === 'avatar_walking') {
      const timer = setTimeout(() => {
        onWalkComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (state === 'avatar_idle') {
      onGreetingComplete(); // Move to chat_active state immediately to start connection
    }
    
    if (state === 'chat_active' && !pcRef.current) {
      connectToOpenAI();
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (audioElRef.current) {
        audioElRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <motion.div
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end scale-75 md:scale-100 origin-bottom-right"
      initial={{ x: '120vw' }}
      animate={{ x: 0 }}
      transition={{
        duration: 1,
        ease: "linear"
      }}
    >
      <div className="flex items-end gap-4 relative">
        <div className="flex flex-col items-center">
          {/* Waveform / Thinking Indicator */}
          <div className="h-8 mb-2 flex items-end justify-center gap-1">
            {isThinking && !isUserSpeaking && (
              <div className="flex space-x-2 items-center h-full">
                <motion.div className="w-2.5 h-2.5 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                <motion.div className="w-2.5 h-2.5 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                <motion.div className="w-2.5 h-2.5 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center justify-center gap-1 h-full">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-blue-500 rounded-full"
                    animate={{ height: ['20%', '100%', '20%'] }}
                    transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.3, delay: Math.random() * 0.2 }}
                  />
                ))}
              </div>
            )}
          </div>

          <motion.div
            animate={
              state === 'avatar_walking'
                ? { y: [0, -25, 0] }
                : isSpeaking
                ? { y: [0, -4, 0], rotate: [0, -2, 2, 0], scale: [1, 1.02, 1] }
                : { y: 0, rotate: 0, scale: 1 }
            }
            transition={{
              repeat: state === 'avatar_walking' || isSpeaking ? Infinity : 0,
              duration: state === 'avatar_walking' ? 0.35 : isSpeaking ? 0.8 : 1.5,
              ease: "easeInOut"
            }}
            className="relative w-[110px] h-[110px] drop-shadow-2xl"
          >
            {/* User Speaking Indicator (Mic) */}
            {isUserSpeaking && (
              <motion.div 
                className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-2 shadow-lg z-30 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <Mic className="w-4 h-4 text-white" />
                </motion.div>
                {/* Ripple effect behind mic */}
                <motion.div
                  className="absolute inset-0 bg-blue-400 rounded-full -z-10"
                  animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              </motion.div>
            )}

            {/* Listening / Hearing Indicator Ring */}
            {isListening && !isSpeaking && !isThinking && (
              <motion.div
                className={`absolute inset-0 rounded-full border-4 ${isUserSpeaking ? 'border-blue-500' : 'border-green-400'}`}
                animate={
                  isUserSpeaking 
                    ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] } 
                    : { scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }
                }
                transition={{ repeat: Infinity, duration: isUserSpeaking ? 0.8 : 2 }}
              />
            )}
            
            {useSimli ? (
              // SIMLI AVATAR PLACEHOLDER
              <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center text-center p-2 border-4 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] relative z-10 overflow-hidden">
                <div className="text-[10px] text-blue-400 font-mono leading-tight mt-2">
                  SIMLI<br/>AVATAR<br/>READY
                </div>
                {isSpeaking && (
                  <div className="absolute bottom-4 w-8 h-1 bg-green-400 animate-pulse rounded-full"></div>
                )}
              </div>
            ) : animationData ? (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                className="w-full h-full relative z-10 drop-shadow-md" 
              />
            ) : (
              <div className="w-full h-full bg-slate-800 rounded-full relative z-10 flex items-center justify-center text-white text-xs">AI</div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
