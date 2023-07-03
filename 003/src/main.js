import { Canvas } from '@/modules/Canvas'
import '@/style.css'

document.addEventListener('DOMContentLoaded', () => {
  const canvas = new Canvas({ container: document.querySelector('#app') })
}, false)
