/**
 * React hook for DPAD focus management in remote-controlled lists.
 *
 * Usage:
 *   const { focusIndex, handleKey } = useFocusManager({
 *     count: items.length,
 *     onActivate: (i) => playItem(items[i]),
 *   })
 *
 *   // Subscribe to native key events (once per component):
 *   useEffect(() => onKeyEvent(handleKey), [handleKey])
 *
 *   // In render:
 *   <View>
 *     {items.map((item, i) => (
 *       <TouchableOpacity
 *         key={item.id}
 *         style={[styles.item, focusIndex === i && styles.focused]}
 *       />
 *     ))}
 *   </View>
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFocusManager, onKeyEvent, type RemoteKeyEvent } from '@/utils/remoteControl'

export interface UseFocusManagerOptions {
  count: number
  onActivate?: (index: number) => void
  initialIndex?: number
  wrap?: boolean
  columns?: number
  onFocusChange?: (from: number, to: number) => void
}

export interface UseFocusManagerReturn {
  focusIndex: number
  handleKey: (event: RemoteKeyEvent) => boolean
  setFocus: (index: number) => void
  resetFocus: () => void
}

export function useFocusManager(opts: UseFocusManagerOptions): UseFocusManagerReturn {
  const { count, onActivate, initialIndex, wrap, columns, onFocusChange } = opts

  const [focusIndex, setFocusIndex] = useState<number>(initialIndex ?? 0)

  const manager = useMemo(
    () =>
      createFocusManager({
        count,
        onActivate,
        initialIndex,
        wrap,
        columns,
        onFocusChange: (from, to) => {
          setFocusIndex(to)
          onFocusChange?.(from, to)
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, onActivate, wrap, columns],
  )

  // Re-sync manager.count when count changes (React Native re-render)
  useEffect(() => {
    manager.setIndex(Math.min(focusIndex, count - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const handleKey = useCallback(
    (event: RemoteKeyEvent) => manager.handleKey(event),
    [manager],
  )

  const setFocus = useCallback(
    (index: number) => {
      manager.setIndex(index)
      setFocusIndex(manager.getIndex())
    },
    [manager],
  )

  const resetFocus = useCallback(() => {
    manager.reset()
    setFocusIndex(manager.getIndex())
  }, [manager])

  return { focusIndex, handleKey, setFocus, resetFocus }
}