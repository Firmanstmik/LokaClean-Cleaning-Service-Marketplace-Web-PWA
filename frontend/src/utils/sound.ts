/**
 * Sound utility for notification sounds
 */

// Store a persistent AudioContext to avoid creating new one each time
let audioContextInstance: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContextInstance) {
    const win = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextCtor = win.AudioContext || win.webkitAudioContext;
    if (!AudioContextCtor) return null;

    try {
      audioContextInstance = new AudioContextCtor();
    } catch (error) {
      console.warn('[Sound] Failed to create AudioContext:', error);
      return null;
    }
  }
  
  // Resume AudioContext if suspended (browser requires user interaction first)
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume().catch(() => {
      // Silently fail - user interaction might be required
    });
  }
  
  return audioContextInstance;
}

/**
 * Play a notification sound when order is confirmed/OTW
 * Uses Web Audio API to generate a cleaning service-themed notification sound
 * Fresh, clean, and pleasant - like a gentle bell chime that evokes cleanliness
 */
export async function playOrderNotificationSound() {
  try {
    const audioContext = getAudioContext();
    if (!audioContext) {
      console.warn('[Sound] AudioContext not available');
      return;
    }

    // Ensure AudioContext is running (browser may suspend it)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        console.warn('[Sound] Failed to resume AudioContext:', error);
        return;
      }
    }

    // Create a cleaning service-themed notification sound
    // Fresh and clean feeling - like a gentle bell or chime that evokes cleanliness
    // Pleasant, welcoming, and professional - perfect for a cleaning service
    const duration = 0.5; // Comfortable duration - not too short, not too long
    const now = audioContext.currentTime;
    
    // Create a master gain node for overall volume control
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    
    // Fresh, clean chime pattern - like a gentle bell that evokes cleanliness
    // Uses pleasant frequencies that create a "fresh and clean" feeling
    // Three-tone ascending pattern: like a gentle "ding-ding-ding" that's welcoming
    const frequencies = [
      659.25,  // E5 - First clean, clear note (fresh feeling)
      783.99,  // G5 - Second uplifting note (clean feeling)
      880.00   // A5 - Third bright note (sparkling clean feeling)
    ];
    const delays = [0, 0.1, 0.2]; // Cascading effect for pleasant flow
    const volumes = [0.2, 0.22, 0.24]; // Slightly increasing volume for uplifting feel
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Use 'sine' for pure, clean tone - like a gentle bell (perfect for cleaning service)
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      // Connect oscillator -> gain -> master gain -> destination
      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      
      // Smooth envelope: gentle fade in, smooth fade out - like a gentle bell
      const startTime = now + delays[index];
      const noteDuration = 0.25; // Comfortable duration for each note
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volumes[index], startTime + 0.05); // Gentle fade in
      gainNode.gain.setValueAtTime(volumes[index], startTime + noteDuration * 0.4); // Hold
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration); // Smooth exponential fade out
      
      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
    
    // Overall master gain envelope - smooth and pleasant
    // Creates a fresh, clean sound that's welcoming and professional
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1, now + 0.05); // Gentle start
    masterGain.gain.setValueAtTime(1, now + duration * 0.7); // Hold
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Smooth end

    // Note: We don't close the AudioContext here because we reuse it
    // The AudioContext will be reused for subsequent sound plays
  } catch (error) {
    console.warn('[Sound] Failed to play notification sound:', error);
    // Silently fail - sound is a nice-to-have, not critical
  }
}

/**
 * Play a celebratory thank you sound (more joyful and uplifting)
 * Uses Web Audio API to generate a pleasant celebration sound
 */
export async function playThankYouSound() {
  try {
    const audioContext = getAudioContext();
    if (!audioContext) {
      console.warn('[Sound] AudioContext not available');
      return;
    }

    // Ensure AudioContext is running (browser may suspend it)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        console.warn('[Sound] Failed to resume AudioContext:', error);
        return;
      }
    }

    // Create a celebratory, joyful sound - ascending major chord progression
    // More uplifting and celebratory than the notification sound
    const duration = 0.8; // Longer for more celebration feel
    const now = audioContext.currentTime;
    
    // Create a master gain node for overall volume control
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    
    // Ascending major chord progression (C major - F major - G major) - very celebratory
    // Creates a feeling of success and gratitude
    const chordProgressions = [
      [523.25, 659.25, 783.99], // C5, E5, G5 (C major)
      [698.46, 880.00, 1046.50], // F5, A5, C6 (F major)
      [783.99, 987.77, 1174.66]  // G5, B5, D6 (G major)
    ];
    const delays = [0, 0.2, 0.4]; // Staggered timing for cascading celebration effect
    
    chordProgressions.forEach((frequencies, chordIndex) => {
      frequencies.forEach((freq, noteIndex) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Use 'sine' for pure, pleasant tone
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        // Connect oscillator -> gain -> master gain -> destination
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        // Create smooth envelope: quick fade in, gentle fade out
        const startTime = now + delays[chordIndex] + (noteIndex * 0.05); // Slight stagger within chord
        const noteDuration = 0.4;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05); // Quick fade in
        gainNode.gain.setValueAtTime(0.2, startTime + noteDuration * 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration); // Gentle exponential fade out
        
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
      });
    });
    
    // Overall master gain envelope for smooth start/end
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1, now + 0.05);
    masterGain.gain.setValueAtTime(1, now + duration * 0.7);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Note: We don't close the AudioContext here because we reuse it
  } catch (error) {
    console.warn('[Sound] Failed to play thank you sound:', error);
    // Silently fail - sound is a nice-to-have, not critical
  }
}

