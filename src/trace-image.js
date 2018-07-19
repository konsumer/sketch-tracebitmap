/* global NSBitmapImageRep, NSString, NSUTF8StringEncoding, MSSVGImporter */
import { imagedataToSVG } from 'imagetracerjs'

export default ({ document, selection }) => {
  if (!selection) {
    return document.showMessage('You must select at least one image')
  }

  const images = Array.from(selection).filter(sel => sel.class() == 'MSBitmapLayer')

  if (!images.length) {
    return document.showMessage('You must select at least one image')
  }

  images.forEach(imageLayer => {
    const imageRep = NSBitmapImageRep.imageRepWithData(imageLayer.image().data())
    const width = imageRep.size().width
    const height = imageRep.size().height
    const data = imageLayer.image().data().toString()

    const svgCode = imagedataToSVG({
      width,
      height,
      data
    }, {scale: 5})

    const svgString = NSString.stringWithString(svgCode)
    const svgData = svgString.dataUsingEncoding(NSUTF8StringEncoding)
    const svgImporter = MSSVGImporter.svgImporter()
    svgImporter.prepareToImportFromData(svgData)
    const svgLayer = svgImporter.importAsLayer()
    svgLayer.setName('SVG Layer')
    document.currentPage().addLayers([svgLayer])
  })
}
