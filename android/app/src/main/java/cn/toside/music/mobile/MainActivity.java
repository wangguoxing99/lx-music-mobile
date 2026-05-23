package cn.toside.music.mobile;

import android.view.KeyEvent;

import com.reactnativenavigation.NavigationActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import cn.toside.music.mobile.remote.RemoteControlModule;

public class MainActivity extends NavigationActivity {

  private RemoteControlModule remoteControlModule;

  public void setRemoteControlModule(RemoteControlModule module) {
    this.remoteControlModule = module;
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    if (remoteControlModule != null && remoteControlModule.handleKeyEvent(event)) {
      return true;
    }
    return super.dispatchKeyEvent(event);
  }
}