/* global log, NSString, NSUTF8StringEncoding, MSSVGImporter */

import { trace } from './potrace'

export default ({ document, selection }) => {
  if (!selection) {
    return document.showMessage('You must select at least one image')
  }

  const images = Array.from(selection).filter(sel => sel.class() == 'MSBitmapLayer')

  if (!images.length) {
    return document.showMessage('You must select at least one image')
  }

  images.forEach(imageLayer => {
    trace(imageLayer, (err, svgCode) => {
      if (err) {
        log(err)
      }
      const svgImporter = MSSVGImporter.svgImporter()
      svgImporter.prepareToImportFromData(NSString.stringWithString(svgCode).dataUsingEncoding(NSUTF8StringEncoding))
      const svgLayer = svgImporter.importAsLayer()
      svgLayer.setName('SVG Layer')
      document.currentPage().addLayers([svgLayer])
    })
  })
}
