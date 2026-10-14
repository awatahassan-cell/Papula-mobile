import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';

try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch (e) {
  console.warn(e);
}

import App from './App';

registerRootComponent(App);
