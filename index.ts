import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';
import App from './App';

try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch (e) {
  console.warn(e);
}

registerRootComponent(App);
