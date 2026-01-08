/**
 * Text-to-Speech utility using Web Speech API (best available technology)
 * Provides AI-powered voice synthesis for notifications
 */

/**
 * Check if browser supports Web Speech API (SpeechSynthesis)
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Check if a voice is a female/woman voice
 * Female voices typically have keywords like: female, woman, Zira, Google Indonesia Female, etc.
 */
function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const nameLower = voice.name.toLowerCase();
  
  // Common female voice indicators
  const femaleIndicators = [
    'female',
    'woman',
    'women',
    'zira', // Microsoft female voice
    'google indonesia female',
    'google indonesian female',
    'siti', // Common Indonesian female name
    'rina', // Common Indonesian female name
    'dwi', // Common Indonesian female name
    'google id female',
    'indonesian female'
  ];
  
  return femaleIndicators.some(indicator => nameLower.includes(indicator));
}

/**
 * Get the best Indonesian voice available - Prioritizes FEMALE voices for clearer Indonesian pronunciation
 * Female voices typically have better pronunciation for Indonesian language
 */
function getBestIndonesianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    return null;
  }
  
  // Filter Indonesian voices first
  const indonesianVoices = voices.filter(v => 
    v.lang.toLowerCase().includes('id') || 
    v.name.toLowerCase().includes('indonesian')
  );
  
  if (indonesianVoices.length === 0) {
    return null;
  }
  
  // Priority 1: Google Indonesian FEMALE voice (best quality)
  const googleIndonesianFemale = indonesianVoices.find(v => 
    v.name.toLowerCase().includes('google') && 
    isFemaleVoice(v)
  );
  
  if (googleIndonesianFemale) {
    console.log('[TTS] Using Google Indonesian Female voice:', googleIndonesianFemale.name);
    return googleIndonesianFemale;
  }
  
  // Priority 2: Any Indonesian FEMALE voice (preferred for clearer pronunciation)
  const indonesianFemale = indonesianVoices.find(v => isFemaleVoice(v));
  
  if (indonesianFemale) {
    console.log('[TTS] Using Indonesian Female voice:', indonesianFemale.name);
    return indonesianFemale;
  }
  
  // Priority 3: Google Indonesian voice (any gender)
  const googleIndonesian = indonesianVoices.find(v => 
    v.name.toLowerCase().includes('google')
  );
  
  if (googleIndonesian) {
    console.log('[TTS] Using Google Indonesian voice:', googleIndonesian.name);
    return googleIndonesian;
  }
  
  // Priority 4: Microsoft Indonesian voice
  const microsoftIndonesian = indonesianVoices.find(v => 
    v.name.toLowerCase().includes('microsoft')
  );
  
  if (microsoftIndonesian) {
    console.log('[TTS] Using Microsoft Indonesian voice:', microsoftIndonesian.name);
    return microsoftIndonesian;
  }
  
  // Priority 5: Any Indonesian voice by language code (id-id, id, etc.)
  const indonesianByLang = indonesianVoices.find(v => 
    v.lang.toLowerCase() === 'id-id' || 
    v.lang.toLowerCase() === 'id' ||
    v.lang.toLowerCase().startsWith('id-')
  );
  
  if (indonesianByLang) {
    console.log('[TTS] Using Indonesian voice by language code:', indonesianByLang.name);
    return indonesianByLang;
  }
  
  // Last resort: first Indonesian voice found
  if (indonesianVoices.length > 0) {
    console.log('[TTS] Using first available Indonesian voice:', indonesianVoices[0].name);
    return indonesianVoices[0];
  }
  
  return null;
}

/**
 * Get the best English voice available
 * Prefers natural-sounding English voices
 */
function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    return null;
  }
  
  // Filter English voices first
  const englishVoices = voices.filter(v => 
    v.lang.toLowerCase().startsWith('en')
  );
  
  if (englishVoices.length === 0) {
    return null;
  }
  
  // Priority 1: Google English voice (best quality)
  const googleEnglish = englishVoices.find(v => 
    v.name.toLowerCase().includes('google')
  );
  
  if (googleEnglish) {
    console.log('[TTS] Using Google English voice:', googleEnglish.name);
    return googleEnglish;
  }
  
  // Priority 2: Microsoft English voice (good quality)
  const microsoftEnglish = englishVoices.find(v => 
    v.name.toLowerCase().includes('microsoft')
  );
  
  if (microsoftEnglish) {
    console.log('[TTS] Using Microsoft English voice:', microsoftEnglish.name);
    return microsoftEnglish;
  }
  
  // Priority 3: US English voice (en-US)
  const usEnglish = englishVoices.find(v => 
    v.lang.toLowerCase() === 'en-us'
  );
  
  if (usEnglish) {
    console.log('[TTS] Using US English voice:', usEnglish.name);
    return usEnglish;
  }
  
  // Last resort: first English voice found
  if (englishVoices.length > 0) {
    console.log('[TTS] Using first available English voice:', englishVoices[0].name);
    return englishVoices[0];
  }
  
  return null;
}

/**
 * Speak text using Web Speech API with natural voice
 * @param text - The text to speak
 * @param options - Optional configuration for speech
 */
export function speakText(
  text: string,
  options: {
    lang?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('[TTS] Speech synthesis not supported in this browser');
      resolve();
      return;
    }

    // Cancel any ongoing speech to avoid overlapping
    window.speechSynthesis.cancel();

    // Wait for voices to be loaded if needed
    const loadVoices = (): void => {
      const voices = window.speechSynthesis.getVoices();
      
      // If voices are not loaded yet, wait for voiceschanged event
      if (voices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          loadVoices();
        }, { once: true });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language
      utterance.lang = options.lang || 'id-ID';
      
      // Voice parameters for natural AI-like speech
      // Adjusted for more natural Indonesian pronunciation
      utterance.pitch = options.pitch ?? 1.0; // Natural pitch
      utterance.rate = options.rate ?? 0.9; // Slightly slower for better clarity
      utterance.volume = options.volume ?? 0.95; // Slightly lower volume for comfort
      
      // Select best voice based on language
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        const isIndonesian = utterance.lang.toLowerCase().includes('id');
        const bestVoice = isIndonesian ? getBestIndonesianVoice() : getBestEnglishVoice();
        
        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang; // Use voice's native language code
          console.log('[TTS] Selected voice:', bestVoice.name, 'Language:', bestVoice.lang);
        } else {
          // Fallback to default voice
          const defaultVoice = voices.find(v => v.default) || voices[0];
          if (defaultVoice) {
            utterance.voice = defaultVoice;
            console.warn('[TTS] Using fallback voice:', defaultVoice.name);
          }
        }
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (error) => {
        console.warn('[TTS] Speech synthesis error:', error);
        resolve(); // Resolve instead of reject to fail gracefully
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    };

    // Start loading voices
    loadVoices();
  });
}

/**
 * Speak notification text with optimized settings for notifications
 * Uses natural Indonesian voice for better pronunciation
 * @param message - The notification message to speak
 * @param lang - Language code ('id' for Indonesian, 'en' for English). Defaults to 'id'
 * @param youngVoice - If true, uses higher pitch for younger voice. Defaults to false
 */
export function speakNotification(message: string, lang: 'id' | 'en' = 'id', youngVoice: boolean = false): Promise<void> {
  // Map language to speech synthesis language code
  const speechLang = lang === 'en' ? 'en-US' : 'id-ID';
  
  // Optimized settings for natural Indonesian speech
  if (lang === 'id') {
    return speakText(message, {
      lang: speechLang,
      pitch: youngVoice ? 1.3 : 1.0, // Higher pitch for younger voice (1.3), natural pitch otherwise (1.0)
      rate: youngVoice ? 0.95 : 0.85, // Slightly faster for younger voice, slower for clearer pronunciation
      volume: 0.95 // Comfortable volume
    });
  } else {
    // English settings
    return speakText(message, {
      lang: speechLang,
      pitch: youngVoice ? 1.3 : 1.0, // Higher pitch for younger voice
      rate: youngVoice ? 1.0 : 0.9, // Slightly faster for younger voice
      volume: 0.95
    });
  }
}

/**
 * Get available voices (useful for debugging or voice selection)
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }
  
  // Load voices (they might not be loaded immediately)
  const voices = window.speechSynthesis.getVoices();
  
  // If voices aren't loaded, wait for them
  if (voices.length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      // This is handled by the browser automatically
    }, { once: true });
  }
  
  return voices;
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

