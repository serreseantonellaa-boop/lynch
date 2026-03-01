const hydra = new Hydra({ detectAudio: false })

// ─── AUDIO SETUP ───────────────────────────────────────────────
const audioContext = new AudioContext()
let analyser, dataArray

async function loadAudio(url) {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const source = audioContext.createBufferSource()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 256 // resolución del análisis

  source.buffer = audioBuffer
  source.loop = true // loop infinito

  source.connect(analyser)
  analyser.connect(audioContext.destination)

  dataArray = new Uint8Array(analyser.frequencyBinCount)
  source.start()
}

// el navegador requiere un gesto del usuario antes de reproducir audio
// al hacer click en cualquier parte arranca
document.addEventListener('click', () => {
  audioContext.resume()
}, { once: true })

loadAudio('./Ozeip.wav')

// ─── LECTORES DE FRECUENCIA ────────────────────────────────────
function getBass() {
  // Bajos: drones, ambiente (~0–500hz)
  if (!analyser) return 0
  analyser.getByteFrequencyData(dataArray)
  return dataArray.slice(0, 4).reduce((a, b) => a + b, 0) / (4 * 255)
}

function getMid() {
  // Medios: voz de Lynch (~500hz–3khz)
  if (!analyser) return 0
  analyser.getByteFrequencyData(dataArray)
  return dataArray.slice(4, 16).reduce((a, b) => a + b, 0) / (12 * 255)
}

function getHigh() {
  // Agudos: texturas, detalles (~3khz+)
  if (!analyser) return 0
  analyser.getByteFrequencyData(dataArray)
  return dataArray.slice(16, 32).reduce((a, b) => a + b, 0) / (16 * 255)
}

//HYDRA

osc(
  () => 30 + getBass() * 15,  // frecuencia del osc: sube cuando Lynch habla
  0.05,                       // velocidad de movimiento del osc
  10                          // contraste de color
)
  .color(
    () => 125/255 + getMid() * 0.4,  // rojo: reacciona a la voz
    1,
    () => 200/255 + getHigh() * 0.3  // azul: reacciona a agudos
  )
  .rotate(
    Math.PI / 6,
    () => 0.05 + getMid() * 0.04    // velocidad de rotación: sube con la voz
  )
  .kaleid(
    () => Math.floor(20 + getMid() * 6) // espejos: cambia con la voz
  )
  .layer(
    noise(
      () => 8 + getBass() * 4,        // escala del noise: crece con el ambiente
      () => 0.4 + getBass() * 0.5     // velocidad del noise: reactiva a bajos
    )
      .rotate(
        Math.PI / 8,
        () => 0.03 + getBass() * 0.04
      )
      .color(
        1, 1, 1,
        () => 0.3 + getBass() * 0.5   // opacidad del noise: aparece con bajos
      )
  )
  .out()