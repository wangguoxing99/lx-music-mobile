import { useCallback, useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'
import { onKeyEvent, type RemoteKeyEvent } from '@/utils/remoteControl'

const BTN_SIZE = 24

const FOCUS_BORDER_COLOR = 'rgba(255,255,255,0.5)'

const handlePlayPrev = () => { void playPrev() }
const handlePlayNext = () => { void playNext() }

const PlayPrevBtn = ({ focused }: { focused: boolean }) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={{
        ...styles.cotrolBtn,
        borderWidth: focused ? 2 : 0,
        borderColor: FOCUS_BORDER_COLOR,
      }}
      activeOpacity={0.5}
      onPress={handlePlayPrev}
    >
      <Icon name='prevMusic' color={theme['c-button-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = ({ focused }: { focused: boolean }) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={{
        ...styles.cotrolBtn,
        borderWidth: focused ? 2 : 0,
        borderColor: FOCUS_BORDER_COLOR,
      }}
      activeOpacity={0.5}
      onPress={handlePlayNext}
    >
      <Icon name='nextMusic' color={theme['c-button-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ focused }: { focused: boolean }) => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={{
        ...styles.cotrolBtn,
        borderWidth: focused ? 2 : 0,
        borderColor: FOCUS_BORDER_COLOR,
      }}
      activeOpacity={0.5}
      onPress={togglePlay}
    >
      <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

export default () => {
  const isHorizontalMode = useHorizontalMode()

  // Focus: [prevBtn, toggleBtn, nextBtn] — prevBtn only in horizontal mode
  const maxIdx = isHorizontalMode ? 2 : 1 // 0=toggle, 1=next (horizontal: 0=prev,1=toggle,2=next)
  const [focusIdx, setFocusIdx] = useState(isHorizontalMode ? 1 : 0)

  const handleKey = useCallback((event: RemoteKeyEvent): boolean => {
    switch (event.keyName) {
      case 'DPAD_LEFT':
        setFocusIdx(i => i > 0 ? i - 1 : i)
        return true
      case 'DPAD_RIGHT':
        setFocusIdx(i => i < maxIdx ? i + 1 : i)
        return true
      case 'DPAD_CENTER':
      case 'ENTER': {
        if (isHorizontalMode) {
          if (focusIdx === 0) { void playPrev() }
          else if (focusIdx === 1) { togglePlay() }
          else { void playNext() }
        } else {
          if (focusIdx === 0) { togglePlay() }
          else { void playNext() }
        }
        return true
      }
      default:
        return false
    }
  }, [focusIdx, isHorizontalMode, maxIdx])

  useEffect(() => {
    const unsub = onKeyEvent(handleKey)
    return unsub
  }, [handleKey])

  return (
    <>
      {isHorizontalMode ? <PlayPrevBtn focused={focusIdx === 0} /> : null}
      <TogglePlayBtn focused={isHorizontalMode ? focusIdx === 1 : focusIdx === 0} />
      <PlayNextBtn focused={isHorizontalMode ? focusIdx === 2 : focusIdx === 1} />
    </>
  )
}


const styles = createStyle({
  cotrolBtn: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 1,
    textShadowRadius: 1,
    borderRadius: 23,
  },
})