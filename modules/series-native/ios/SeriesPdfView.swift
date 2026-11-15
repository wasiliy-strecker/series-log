import ExpoModulesCore
import PDFKit
import UIKit

final class SeriesPdfView: ExpoView {
  private let pdf = PDFView()
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    pdf.autoScales = true
    pdf.displayMode = .singlePageContinuous
    pdf.displayDirection = .vertical
    pdf.backgroundColor = .secondarySystemBackground
    addSubview(pdf)
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    pdf.frame = bounds
  }
  func open(_ id: String) { pdf.document = PdfStore.shared.document(for: id) }
}
