export default ({ document, selection }) => {
  const images = Array.from(selection).filter(sel => sel.class() == 'MSBitmapLayer')

  if (!images.length) {
    return document.showMessage('You must select at least one image')
  }

  images.forEach(i => {
    console.log('image', i.fileName)
  })
}
