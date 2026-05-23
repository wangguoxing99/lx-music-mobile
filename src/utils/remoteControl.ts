/**
 * Remote Control Service — bridges hardware remote key events from the native
 * RemoteControlModule into the JS layer.
 *
 * Features:
 * 1. Media key mapping → player actions (play/pause/next/prev)
 * 2. DPAD navigation event bus → focus-aware components can subscribe
 * 3. A simple FocusManager for DPAD-driven UI navigation
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import { togglePlay, playNext, playPrev } from '@/core/player/player'
import { exitApp } from '@/utils/nativeModules/utils'

// ---- Types ----

export type RemoteKeyName =
  | 'DPAD_UP' | 'DPAD_DOWN' | 'DPAD_LEFT' | 'DPAD_RIGHT'
  | 'DPAD_CENTER' | 'ENTER'
  | 'MEDIA_PLAY_PAUSE' | 'MEDIA_PLAY' | 'MEDIA_PAUSE'
  | 'MEDIA_NEXT' | 'MEDIA_PREVIOUS' | 'MEDIA_STOP'
  | 'MEDIA_FAST_FORWARD' | 'MEDIA_REWIND' | 'MEDIA_CLOSE'
  | 'BACK' | 'MENU'

export interface RemoteKeyEvent {
  keyCode: number
  keyName: RemoteKeyName
  repeatCount: number
}

type KeyCallback = (event: RemoteKeyEvent) => boolean | void

// ---- Native bridge ----

const { RemoteControlModule } = NativeModules

let eventEmitter: NativeEventEmitter | null = null
const listeners: Set<KeyCallback> = new Set()
let isActive = false

// Directly handled keys (media transport) — consumed here, not forwarded to listeners
const MEDIA_KEYS: ReadonlySet<RemoteKeyName> = new Set([
  'MEDIA_PLAY_PAUSE', 'MEDIA_PLAY', 'MEDIA_PAUSE',
  'MEDIA_NEXT', 'MEDIA_PREVIOUS', 'MEDIA_STOP',
  'MEDIA_FAST_FORWARD', 'MEDIA_REWIND', 'MEDIA_CLOSE',
])

/**
 * Start listening for remote key events from the native module.
 * Idempotent — safe to call multiple times.
 */
export function startListening(): void {
  if (isActive || !RemoteControlModule || Platform.OS !== 'android') return

  eventEmitter = new NativeEventEmitter(RemoteControlModule)
  eventEmitter.addListener('RemoteControlKeyEvent', handleNativeEvent)
  isActive = true
  console.log('[RemoteControl] started listening')
}

/**
 * Stop listening and clean up.
 */
export function stopListening(): void {
  if (!isActive || !eventEmitter) return
  eventEmitter.removeAllListeners('RemoteControlKeyEvent')
  eventEmitter = null
  isActive = false
  listeners.clear()
  console.log('[RemoteControl] stopped')
}

/**
 * Subscribe to raw key events.
 * Return `true` from the callback to mark the event as consumed (preventing
 * default handling). Any other return (void/false) lets default handling run.
 */
export function onKeyEvent(cb: KeyCallback): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

// ---- Internal ----

function handleNativeEvent(nativeEvent: any): void {
  const event = nativeEvent as RemoteKeyEvent
  // console.log('[RemoteControl] key:', event.keyName)

  // 1. Notify subscribers first; if any returns true, stop
  for (const cb of listeners) {
    try {
      if (cb(event)) return
    } catch (e) {
      console.warn('[RemoteControl] listener error:', e)
    }
  }

  // 2. Default media key handling
  if (MEDIA_KEYS.has(event.keyName)) {
    handleMediaKey(event)
    return
  }
}

function handleMediaKey(event: RemoteKeyEvent): void {
  switch (event.keyName) {
    case 'MEDIA_PLAY_PAUSE':
    case 'MEDIA_PLAY':
      void togglePlay()
      break
    case 'MEDIA_PAUSE':
      // togglePlay handles both; no action needed
      break
    case 'MEDIA_NEXT':
      void playNext()
      break
    case 'MEDIA_PREVIOUS':
      void playPrev()
      break
    case 'MEDIA_STOP':
    case 'MEDIA_CLOSE':
      exitApp()
      break
    case 'MEDIA_FAST_FORWARD':
    case 'MEDIA_REWIND':
      // Seek handled by player; could add step-seek later
      break
  }
}

// ---- DPAD Focus Manager ----

/**
 * A lightweight focus manager for DPAD-driven UI.
 *
 * Usage:
 *   const { focusIndex, registerItem, handleKey } = useFocusManager({ count: items.length })
 *   // In each list item:
 *   <TouchableOpacity ref={registerItem(index)} style={focusIndex === index && focusedStyle} />
 *   // On the parent View:
 *   <View onKeyEvent={handleKey}>
 */

export interface FocusManagerOptions {
  /** Number of focusable items in the group */
  count: number
  /** Called when an item should be activated (DPAD_CENTER / ENTER) */
  onActivate?: (index: number) => void
  /** Initial focused index (default 0) */
  initialIndex?: number
  /** Whether the list wraps around (default true) */
  wrap?: boolean
  /** Number of columns for grid layouts (default 1 = vertical list) */
  columns?: number
  /** Called when focus changes */
  onFocusChange?: (from: number, to: number) => void
}

export function createFocusManager(opts: FocusManagerOptions) {
  const {
    count,
    onActivate,
    initialIndex = 0,
    wrap = true,
    columns = 1,
    onFocusChange,
  } = opts

  let currentIndex: number = initialIndex

  function clamp(index: number): number {
    if (wrap) {
      if (index < 0) return count - 1
      if (index >= count) return 0
    }
    return Math.max(0, Math.min(count - 1, index))
  }

  function handleKey(event: RemoteKeyEvent): boolean {
    let newIndex = currentIndex

    switch (event.keyName) {
      case 'DPAD_UP':
        newIndex = clamp(currentIndex - columns)
        break
      case 'DPAD_DOWN':
        newIndex = clamp(currentIndex + columns)
        break
      case 'DPAD_LEFT':
        newIndex = clamp(currentIndex - 1)
        break
      case 'DPAD_RIGHT':
        newIndex = clamp(currentIndex + 1)
        break
      case 'DPAD_CENTER':
      case 'ENTER':
        onActivate?.(currentIndex)
        return true
      default:
        return false // Not a DPAD navigation key
    }

    if (newIndex !== currentIndex) {
      const prev = currentIndex
      currentIndex = newIndex
      onFocusChange?.(prev, currentIndex)
    }
    return true
  }

  return {
    getIndex: () => currentIndex,
    setIndex: (i: number) => { currentIndex = clamp(i) },
    handleKey,
    reset: () => { currentIndex = clamp(initialIndex) },
  }
}

export type FocusManager = ReturnType<typeof createFocusManager>