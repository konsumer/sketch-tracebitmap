@import "MochaJSDelegate.js";

const panelHeight = 300
const panelWidth = 300

function changePanelHeight(panel, height) {
  var frame = panel.frame();
  var previousHeight = frame.size.height;
  if (height == previousHeight) return;

  frame.origin.y += previousHeight - height;
  frame.size.height = height;
  panel.setFrame_display_animate(frame, true, true);
}

function expandPanel(panel) {
  changePanelHeight(panel, panelHeight + 70);
}

function minimizePanel(panel) {
  changePanelHeight(panel, panelHeight + 22);
}

function extractBase64FromSelection(selection) {
  if (selection.count() < 1 || selection.count() > 1) return undefined;

  var currentLayer = selection[0];
  if (currentLayer.class() == "MSBitmapLayer") {
    var data = currentLayer.image().data();
    return "data:image/png;base64," + data.base64EncodedStringWithOptions(null);
  } else {
    var fills = currentLayer.style().fills().reverse();
    var fill = fills.find(function(e) {
      return e.image()
    });

    if (fill) {
      var data = fill.image().data();
      return "data:image/png;base64," + data.base64EncodedStringWithOptions(null);
    } else return undefined;
  }
}

function onRun(context) {
  var threadDictionary = NSThread.mainThread().threadDictionary();
  var identifier = "co.awkward.alembic";
  if (threadDictionary[identifier]) return;

  var webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, panelWidth, panelHeight));
  var windowObject = webView.windowScriptObject();

  var selection = context.selection;
  var base64 = extractBase64FromSelection(selection);

  COScript.currentCOScript().setShouldKeepAround_(true);

  var panel = NSPanel.alloc().init();
  panel.setFrame_display(NSMakeRect(0, 0, panelWidth, panelHeight + 44), true);
  panel.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask | NSFullSizeContentViewWindowMask);
  panel.setBackgroundColor(NSColor.whiteColor());
  panel.setLevel(NSFloatingWindowLevel);
  panel.title = "Image Trace";
  panel.titlebarAppearsTransparent = true;
  panel.makeKeyAndOrderFront(null);
  panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
  panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
  panel.center()
  threadDictionary[identifier] = panel;

  var vibrancy = NSVisualEffectView.alloc().initWithFrame(NSMakeRect(0, 0, panelWidth, panelHeight + 44));
  vibrancy.setAppearance(NSAppearance.appearanceNamed(NSAppearanceNameVibrantLight));
  vibrancy.setBlendingMode(NSVisualEffectBlendingModeBehindWindow);
  vibrancy.autoresizingMask = NSViewHeightSizable;

  var delegate = new MochaJSDelegate({
    "webView:didFinishLoadForFrame:": (function(webView, webFrame) {
      if (base64 == undefined) {
        windowObject.evaluateWebScript("emptyState()");
      } else {
        expandPanel(panel);
        windowObject.evaluateWebScript("update('" + base64 + "')");
      }
    }),
    "webView:didChangeLocationWithinPageForFrame:": (function(webView, webFrame) {
      var svgCode = windowObject.evaluateWebScript("s('#output')[0].src").replace(/^data:image\/svg\+xml,/, '')
      var svgImporter = MSSVGImporter.svgImporter()
      svgImporter.prepareToImportFromData(NSString.stringWithString(svgCode).dataUsingEncoding(NSUTF8StringEncoding))
      var svgLayer = svgImporter.importAsLayer()
      svgLayer.setName('SVG Layer')
      context.document.currentPage().addLayers([svgLayer])
      panel.close()
      threadDictionary.removeObjectForKey(identifier);
      COScript.currentCOScript().setShouldKeepAround_(false);
    })
  })

  webView.setFrameLoadDelegate_(delegate.getClassInstance());

  webView.setDrawsBackground(false);
  var request = NSURLRequest.requestWithURL(context.plugin.urlForResourceNamed("webview.html"));
  webView.autoresizingMask = NSViewHeightSizable;
  webView.mainFrame().loadRequest(request);

  panel.contentView().addSubview(vibrancy);
  panel.contentView().addSubview(webView);

  var closeButton = panel.standardWindowButton(NSWindowCloseButton);
  closeButton.setCOSJSTargetFunction(function(sender) {
    panel.close();
    threadDictionary.removeObjectForKey(identifier);
    COScript.currentCOScript().setShouldKeepAround_(false);
  });
}

var onSelectionChanged = function(context) {
  // BUG: newSelection is empty when changing selection
  // WORKAROUND: document.selectedLayers().layers()
  // http://sketchplugins.com/d/112-bug-selectionchanged-finish-newselection-is-empty

  var threadDictionary = NSThread.mainThread().threadDictionary();
  var identifier = "com.jetboystudio.imagetrace";

  if (threadDictionary[identifier]) {
    var selection = context.actionContext.document.selectedLayers().layers();
    var base64 = extractBase64FromSelection(selection);
    var panel = threadDictionary[identifier];

    var webView = panel.contentView().subviews()[1];
    var windowObject = webView.windowScriptObject();

    expandPanel(panel);
    windowObject.evaluateWebScript(base64 == undefined ? null : "update('" + base64 + "')");
  }
};
