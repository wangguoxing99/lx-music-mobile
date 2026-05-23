import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { onKeyEvent, type RemoteKeyEvent } from '@/utils/remoteControl'

// ---- FocusedButton wrapper ----

interface FocusedBtnProps {
  size: number
  focused: boolean
  onPress: () => void
  children: React.ReactNode
}

const FocusedBtn = ({ size, focused, onPress, children }: FocusedBtnProps) => {
  const theme = useTheme()
  const borderColor = focused ? theme['c-highlight'] ?? '#4A90D9' : 'transparent'

  return (
    <TouchableOpacity
      style={{
        ...styles.cotrolBtn,
        width: size,
        height: size,
        borderWidth: focused ? 2 : 0,
        borderColor,
        borderRadius: size / 2,
        opacity: focused ? 1 : 0.85,
      }}
      activeOpacity={0.5}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  )
}

// ---- Sub-components with focus awareness ----

const PrevBtn = ({ size, focused }: { size: number; focused: boolean }) => {
  const theme = useTheme()
  const handlePlayPrev = () => { void playPrev() }
  return (
    <FocusedBtn size={size} focused={focused} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color={theme['c-button-font']} rawSize={size * 0.7} />
    </FocusedBtn>
  )
}

const NextBtn = ({ size, focused }: { size: number; focused: boolean }) => {
  const theme = useTheme()
  const handlePlayNext = () => { void playNext() }
  return (
    <FocusedBtn size={size} focused={focused} onPress={handlePlayNext}>
      <Icon name='nextMusic' color={theme['c-button-font']} rawSize={size * 0.7} />
    </FocusedBtn>
  )
}

const TogglePlayBtn = ({ size, focused }: { size: number; focused: boolean }) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  return (
    <FocusedBtn size={size} focused={focused} onPress={togglePlay}>
      <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} rawSize={size * 0.7} />
    </FocusedBtn>
  )
}

// ---- Main component ----

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  const containerStyle = useMemo(() => ({
    ...styles.conatiner,
    maxHeight,
  }), [maxHeight])
  const size = Math.min(Math.max(winSize.width * 0.33 * global.lx.fontSize * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)

  // Focus management for 3 buttons: [prev, toggle, next]
  const [focusIdx, setFocusIdx] = useState(1) // start on play/pause

  const handleKey = useCallback((event: RemoteKeyEvent): boolean => {
    switch (event.keyName) {
      case 'DPAD_LEFT':
        setFocusIdx(i => i > 0 ? i - 1 : i)
        return true
      case 'DPAD_RIGHT':
        setFocusIdx(i => i < 2 ? i + 1 : i)
        return true
      case 'DPAD_CENTER':
      case 'ENTER': {
        if (focusIdx === 0) { void playPrev() }
        else if (focusIdx === 1) { togglePlay() }
        else { void playNext() }
        return true
      }
      default:
        return false
    }
  }, [focusIdx])

  useEffect(() => {
    const unsub = onKeyEvent(handleKey)
    return unsub
  }, [handleKey])

  return (
    <View style={containerStyle}>
      <PrevBtn size={size} focused={focusIdx === 0} />
      <TogglePlayBtn size={size} focused={focusIdx === 1} />
      <NextBtn size={size} focused={focusIdx === 2} />
    </View>
  )
}


const styles = createStyle({
  conatiner: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: '4%',
    paddingVertical: 22,
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})