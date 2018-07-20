/* global ImageTracer */

// light jquery-like
const s = (q, p = document) => Array.from(p.querySelectorAll(q))

// called from parent to update image
window.update = base64Image => {
  s('#input')[0].src = base64Image
  updateSVG()
}

// called from parent to clear screen
window.emptyState = () => {
  s('#output')[0].src = 'assets/black1px.png?t=' + Date.now()
}

// update SVG output, using preset
const updateSVG = () => {
  window.emptyState()
  ImageTracer.imageToSVG(
    s('#input')[0].src,
    svgstr => {
      s('#output')[0].src = `data:image/svg+xml,${svgstr}`
    },
    s('#preset option:checked')[0].value
  )
}

// when preset changes, update SVG
s('#preset')[0].addEventListener('change', () => updateSVG())

// triger URL change to inform parent to reach in, get SVG, and close window
s('#finished')[0].addEventListener('click', () => {
  window.location.hash = Date.now()
})
