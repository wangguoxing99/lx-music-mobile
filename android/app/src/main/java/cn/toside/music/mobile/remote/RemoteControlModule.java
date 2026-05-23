package cn.toside.music.mobile.remote;

import android.view.KeyEvent;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import javax.annotation.Nonnull;

import cn.toside.music.mobile.MainActivity;

public class RemoteControlModule extends ReactContextBaseJavaModule {

    public static final String NAME = "RemoteControlModule";
    public static final String EVENT_NAME = "RemoteControlKeyEvent";
    private final ReactApplicationContext reactContext;

    public RemoteControlModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @Nonnull
    public String getName() {
        return NAME;
    }

    @Override
    public void initialize() {
        super.initialize();
        try {
            MainActivity activity = (MainActivity) getCurrentActivity();
            if (activity != null) {
                activity.setRemoteControlModule(this);
            }
        } catch (Exception ignored) {
            // Activity may not be ready yet; initialize() is called early
        }
    }

    /**
     * Called from MainActivity.dispatchKeyEvent to forward hardware key events
     */
    public boolean handleKeyEvent(KeyEvent event) {
        if (event.getAction() != KeyEvent.ACTION_DOWN) {
            return false;
        }

        int keyCode = event.getKeyCode();
        String keyCodeStr = keyCodeToName(keyCode);
        if (keyCodeStr == null) {
            return false;
        }

        WritableMap params = Arguments.createMap();
        params.putInt("keyCode", keyCode);
        params.putString("keyName", keyCodeStr);
        params.putInt("repeatCount", event.getRepeatCount());

        sendEvent(params);
        return true;
    }

    private void sendEvent(WritableMap params) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(EVENT_NAME, params);
        }
    }

    /**
     * Maps Android KeyEvent keycodes to friendly names.
     * Only remote-relevant keys are mapped; others return null (ignored).
     */
    private static String keyCodeToName(int keyCode) {
        switch (keyCode) {
            // D-Pad navigation keys
            case KeyEvent.KEYCODE_DPAD_UP:        return "DPAD_UP";
            case KeyEvent.KEYCODE_DPAD_DOWN:      return "DPAD_DOWN";
            case KeyEvent.KEYCODE_DPAD_LEFT:      return "DPAD_LEFT";
            case KeyEvent.KEYCODE_DPAD_RIGHT:     return "DPAD_RIGHT";
            case KeyEvent.KEYCODE_DPAD_CENTER:    return "DPAD_CENTER";
            case KeyEvent.KEYCODE_ENTER:          return "ENTER";
            case KeyEvent.KEYCODE_NUMPAD_ENTER:   return "ENTER";

            // Media transport keys
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:     return "MEDIA_PLAY_PAUSE";
            case KeyEvent.KEYCODE_MEDIA_PLAY:           return "MEDIA_PLAY";
            case KeyEvent.KEYCODE_MEDIA_PAUSE:          return "MEDIA_PAUSE";
            case KeyEvent.KEYCODE_MEDIA_NEXT:           return "MEDIA_NEXT";
            case KeyEvent.KEYCODE_MEDIA_PREVIOUS:       return "MEDIA_PREVIOUS";
            case KeyEvent.KEYCODE_MEDIA_STOP:           return "MEDIA_STOP";
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:   return "MEDIA_FAST_FORWARD";
            case KeyEvent.KEYCODE_MEDIA_REWIND:         return "MEDIA_REWIND";
            case KeyEvent.KEYCODE_MEDIA_CLOSE:          return "MEDIA_CLOSE";

            // Navigation / system keys
            case KeyEvent.KEYCODE_BACK:           return "BACK";
            case KeyEvent.KEYCODE_MENU:           return "MENU";

            default: return null;
        }
    }
}