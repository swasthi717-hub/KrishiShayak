import { registerSW } from 'virtual:pwa-register'
export const updateSW = registerSW({
  onOfflineReady() { console.log('KrishiSahayak ready to work offline') }
})