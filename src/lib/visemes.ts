/**
 * Viseme-based Lip Sync System for AI Avatar
 *
 * This module provides phoneme-to-viseme mapping and mouth shape definitions
 * for realistic lip synchronization during speech output.
 */

export type VisemeName =
  // Consonants
  | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X' // X represents silence/rest
  | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S'
  | 'T' | 'U' | 'V' | 'W' | 'Y'

export interface Viseme {
  name: VisemeName
  phonemes: string[]
  mouthOpen: number // 0-1, how open the mouth is
  mouthWidth: number // 0-1, how wide the mouth is
  lipSpread: number // 0-1, how much lips are spread
  tongueVisible: boolean
  description: string
}

/**
 * Viseme definitions based on the "Preston Blair" phoneme set
 * Modified for simple 2D avatar representation
 */
export const VISEMES: Record<VisemeName, Viseme> = {
  X: {
    name: 'X',
    phonemes: ['sil', 'pause'],
    mouthOpen: 0,
    mouthWidth: 0.3,
    lipSpread: 0,
    tongueVisible: false,
    description: 'Closed mouth (rest position)'
  },
  B: {
    name: 'B',
    phonemes: ['b', 'p', 'm'],
    mouthOpen: 0.05,
    mouthWidth: 0.6,
    lipSpread: 0.4,
    tongueVisible: false,
    description: 'Lips pressed together (B, P, M)'
  },
  C: {
    name: 'C',
    phonemes: ['ch', 'j', 'sh', 'zh'],
    mouthOpen: 0.15,
    mouthWidth: 0.5,
    lipSpread: 0.5,
    tongueVisible: false,
    description: 'Rounded lips (CH, J, SH, ZH)'
  },
  D: {
    name: 'D',
    phonemes: ['d', 't', 'n'],
    mouthOpen: 0.1,
    mouthWidth: 0.4,
    lipSpread: 0.2,
    tongueVisible: true,
    description: 'Tongue behind teeth (D, T, N)'
  },
  E: {
    name: 'E',
    phonemes: ['aa', 'ae', 'ah', 'ax', 'ay'],
    mouthOpen: 0.4,
    mouthWidth: 0.4,
    lipSpread: 0.3,
    tongueVisible: false,
    description: 'Wide open (A sounds)'
  },
  F: {
    name: 'F',
    phonemes: ['f', 'v'],
    mouthOpen: 0.15,
    mouthWidth: 0.5,
    lipSpread: 0.6,
    tongueVisible: false,
    description: 'Top teeth on bottom lip (F, V)'
  },
  G: {
    name: 'G',
    phonemes: ['g', 'k', 'ng'],
    mouthOpen: 0.2,
    mouthWidth: 0.5,
    lipSpread: 0.3,
    tongueVisible: true,
    description: 'Back of mouth (G, K, NG)'
  },
  H: {
    name: 'H',
    phonemes: ['hh'],
    mouthOpen: 0.3,
    mouthWidth: 0.4,
    lipSpread: 0.2,
    tongueVisible: false,
    description: 'Open mouth for breath (H)'
  },
  L: {
    name: 'L',
    phonemes: ['l'],
    mouthOpen: 0.12,
    mouthWidth: 0.35,
    lipSpread: 0.25,
    tongueVisible: true,
    description: 'Tongue touches teeth (L)'
  },
  M: {
    name: 'M',
    phonemes: ['m'],
    mouthOpen: 0.02,
    mouthWidth: 0.55,
    lipSpread: 0.35,
    tongueVisible: false,
    description: 'Lips closed (M) - same as B'
  },
  N: {
    name: 'N',
    phonemes: ['n'],
    mouthOpen: 0.1,
    mouthWidth: 0.4,
    lipSpread: 0.2,
    tongueVisible: true,
    description: 'Tongue behind teeth (N) - same as D'
  },
  O: {
    name: 'O',
    phonemes: ['ao', 'ow', 'o', 'oy', 'uh'],
    mouthOpen: 0.25,
    mouthWidth: 0.35,
    lipSpread: 0.3,
    tongueVisible: false,
    description: 'Rounded lips (O sounds)'
  },
  P: {
    name: 'P',
    phonemes: ['p'],
    mouthOpen: 0.05,
    mouthWidth: 0.6,
    lipSpread: 0.4,
    tongueVisible: false,
    description: 'Lips pressed together (P) - same as B'
  },
  Q: {
    name: 'Q',
    phonemes: ['er', 'axr'],
    mouthOpen: 0.2,
    mouthWidth: 0.35,
    lipSpread: 0.3,
    tongueVisible: false,
    description: 'R-colored vowel (ER)'
  },
  R: {
    name: 'R',
    phonemes: ['r'],
    mouthOpen: 0.15,
    mouthWidth: 0.4,
    lipSpread: 0.35,
    tongueVisible: false,
    description: 'R sound - lips slightly rounded'
  },
  S: {
    name: 'S',
    phonemes: ['s', 'z'],
    mouthOpen: 0.08,
    mouthWidth: 0.45,
    lipSpread: 0.5,
    tongueVisible: true,
    description: 'Teeth close together (S, Z)'
  },
  T: {
    name: 'T',
    phonemes: ['t'],
    mouthOpen: 0.1,
    mouthWidth: 0.4,
    lipSpread: 0.2,
    tongueVisible: true,
    description: 'Tongue behind teeth (T) - same as D'
  },
  U: {
    name: 'U',
    phonemes: ['uw', 'w', 'y'],
    mouthOpen: 0.1,
    mouthWidth: 0.3,
    lipSpread: 0.4,
    tongueVisible: false,
    description: 'Tightly rounded (U, W, Y)'
  },
  V: {
    name: 'V',
    phonemes: ['v'],
    mouthOpen: 0.15,
    mouthWidth: 0.5,
    lipSpread: 0.6,
    tongueVisible: false,
    description: 'Top teeth on bottom lip (V) - same as F'
  },
  W: {
    name: 'W',
    phonemes: ['w'],
    mouthOpen: 0.12,
    mouthWidth: 0.3,
    lipSpread: 0.35,
    tongueVisible: false,
    description: 'Tightly rounded (W) - similar to U'
  },
  Y: {
    name: 'Y',
    phonemes: ['y', 'iy', 'ih', 'ix', 'ey', 'eh'],
    mouthOpen: 0.15,
    mouthWidth: 0.45,
    lipSpread: 0.45,
    tongueVisible: false,
    description: 'Smiling position (E and I sounds)'
  },
}

/**
 * Simple English text-to-phoneme conversion
 * This is a simplified version - for production use a proper phoneme engine like eSpeak or CMU Dict
 */
export function textToPhonemes(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/)
  const phonemes: string[] = []

  for (const word of words) {
    // Simple approximation based on letter patterns
    if (word === '') continue

    // Add silence between words
    if (phonemes.length > 0) {
      phonemes.push('sil')
    }

    // Convert word to phonemes (simplified)
    for (let i = 0; i < word.length; i++) {
      const char = word[i]
      const nextChar = word[i + 1]

      // Vowels
      if ('aeiou'.includes(char)) {
        if (char === 'a' && nextChar === 'i') {
          phonemes.push('ay')
          i++
        } else if (char === 'a') {
          phonemes.push('ae')
        } else if (char === 'e' && nextChar === 'e') {
          phonemes.push('iy')
          i++
        } else if (char === 'e') {
          phonemes.push('eh')
        } else if (char === 'i') {
          phonemes.push('ih')
        } else if (char === 'o' && nextChar === 'o') {
          phonemes.push('uw')
          i++
        } else if (char === 'o') {
          phonemes.push('ao')
        } else if (char === 'u') {
          phonemes.push('ah')
        }
      }
      // Common consonant patterns
      else if (char === 'b' || char === 'p') {
        phonemes.push('b')
      } else if (char === 'c' && nextChar === 'h') {
        phonemes.push('ch')
        i++
      } else if (char === 'c') {
        phonemes.push('k')
      } else if (char === 'd' || char === 't') {
        phonemes.push('d')
      } else if (char === 'f' || char === 'v') {
        phonemes.push('f')
      } else if (char === 'g' && nextChar !== 'h') {
        phonemes.push('g')
      } else if (char === 'h') {
        phonemes.push('hh')
      } else if (char === 'l') {
        phonemes.push('l')
      } else if (char === 'm') {
        phonemes.push('m')
      } else if (char === 'n') {
        phonemes.push('n')
      } else if (char === 'r') {
        phonemes.push('r')
      } else if (char === 's') {
        phonemes.push('s')
      } else if (char === 'w') {
        phonemes.push('w')
      } else if (char === 'y') {
        phonemes.push('y')
      }
    }
  }

  return phonemes
}

/**
 * Convert phonemes to visemes
 */
export function phonemesToVisemes(phonemes: string[]): VisemeName[] {
  const visemes: VisemeName[] = []

  for (const phoneme of phonemes) {
    // Find matching viseme
    for (const [key, viseme] of Object.entries(VISEMES)) {
      if (viseme.phonemes.includes(phoneme)) {
        visemes.push(key as VisemeName)
        break
      }
    }
    // Default to rest if no match
    if (visemes.length === phonemes.length - 1) {
      visemes.push('X')
    }
  }

  return visemes
}

/**
 * Direct text to visemes conversion
 */
export function textToVisemes(text: string): VisemeName[] {
  const phonemes = textToPhonemes(text)
  return phonemesToVisemes(phonemes)
}

/**
 * Get mouth shape data for a viseme
 */
export function getMouthShape(visemeName: VisemeName) {
  const viseme = VISEMES[visemeName]
  return {
    mouthOpen: viseme.mouthOpen,
    mouthWidth: viseme.mouthWidth,
    lipSpread: viseme.lipSpread,
    tongueVisible: viseme.tongueVisible,
  }
}

/**
 * Smooth interpolation between two viseme states
 */
export function interpolateVisemes(
  from: VisemeName,
  to: VisemeName,
  t: number // 0-1 interpolation factor
) {
  const fromViseme = VISEMES[from]
  const toViseme = VISEMES[to]

  return {
    mouthOpen: fromViseme.mouthOpen + (toViseme.mouthOpen - fromViseme.mouthOpen) * t,
    mouthWidth: fromViseme.mouthWidth + (toViseme.mouthWidth - fromViseme.mouthWidth) * t,
    lipSpread: fromViseme.lipSpread + (toViseme.lipSpread - fromViseme.lipSpread) * t,
    tongueVisible: t > 0.5 ? toViseme.tongueVisible : fromViseme.tongueVisible,
  }
}
