import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.newomen.app',
  appName: 'Newomen',
  webDir: 'dist',
  icon: {
    iconName: 'newomen-icon',
    iconBackgroundColor: '#1a1428',
    backgroundColor: '#1a1428',
    splashImageName: 'splash',
    imageFileName: 'newomen-icon',
    images: [
      {
        name: 'newomen-icon.png',
        width: 1024,
        height: 1024,
      }
    ]
  },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a1428",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#9b87f5",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#1a1428",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    Haptics: {
      enabled: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#9b87f5",
      sound: "beep.wav",
    },
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#1a1428",
    allowsLinkPreview: false,
    handleApplicationURL: false,
    scheme: "Newomen",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: "NewomenMobile",
    overrideUserAgent: "NewomenMobile",
  },
};

export default config;
