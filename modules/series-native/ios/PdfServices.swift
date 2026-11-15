import PDFKit
import UIKit

final class PdfStore {
  static let shared = PdfStore()
  private struct Session {
    let document: PDFDocument
    let directory: URL
  }
  private var sessions: [String: Session] = [:]

  static func document(_ uri: String) throws -> PDFDocument {
    let url = try PrivateFiles.file(uri, maximumBytes: 50 * 1024 * 1024)
    guard let document = PDFDocument(url: url), !document.isLocked,
          (1...2000).contains(document.pageCount) else { throw SeriesError.invalidPdf }
    for index in 0..<document.pageCount {
      guard let page = document.page(at: index) else { throw SeriesError.invalidPdf }
      let bounds = page.bounds(for: .cropBox)
      guard bounds.width.isFinite, bounds.height.isFinite, bounds.width > 0,
            bounds.height > 0, bounds.width <= 200_000, bounds.height <= 200_000 else {
        throw SeriesError.invalidPdf
      }
    }
    return document
  }

  // Session access and PDFView configuration run on the main queue. Validation
  // uses its own document on Expo's background queue.
  func open(_ uri: String) throws -> [String: Any] {
    guard sessions.count < 4 else { throw SeriesError.busy }
    let document = try Self.document(uri)
    let id = UUID().uuidString
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent("series-pdf-\(id)")
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    sessions[id] = Session(document: document, directory: directory)
    return ["session": id, "pages": (0..<document.pageCount).map { index in
      let bounds = document.page(at: index)!.bounds(for: .cropBox)
      return ["width": bounds.width, "height": bounds.height]
    }]
  }

  func document(for id: String) -> PDFDocument? { sessions[id]?.document }

  func render(_ id: String, index: Int, width: Int) throws -> String {
    guard let session = sessions[id], (32...2048).contains(width),
          index >= 0, index < session.document.pageCount,
          let page = session.document.page(at: index) else { throw SeriesError.invalidInput }
    let bounds = page.bounds(for: .cropBox)
    let height = Double(width) * bounds.height / bounds.width
    guard height.isFinite, height <= 16384, height * Double(width) <= 16_000_000 else {
      throw SeriesError.invalidPdf
    }
    let image = page.thumbnail(of: CGSize(width: Double(width), height: height), for: .cropBox)
    guard let data = image.pngData() else { throw SeriesError.invalidPdf }
    let url = session.directory.appendingPathComponent("page-\(index).png")
    try data.write(to: url, options: .atomic)
    return url.absoluteString
  }

  func close(_ id: String) {
    if let session = sessions.removeValue(forKey: id) { try? FileManager.default.removeItem(at: session.directory) }
  }
  func closeAll() { for id in Array(sessions.keys) { close(id) } }
}

final class PdfController: UIViewController {
  let document: PDFDocument
  init(document: PDFDocument) {
    self.document = document
    super.init(nibName: nil, bundle: nil)
  }
  required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }
  override func loadView() {
    let pdf = PDFView()
    pdf.document = document
    pdf.autoScales = true
    pdf.displayMode = .singlePageContinuous
    pdf.backgroundColor = .systemBackground
    view = pdf
    navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(close))
  }
  @objc private func close() { dismiss(animated: true) }
}

final class BackupExport: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  private let directory: URL
  private let name: String
  private let completion: ([String: String]) -> Void
  private var completed = false
  let picker: UIDocumentPickerViewController

  init(uri: String, name: String, completion: @escaping ([String: String]) -> Void) throws {
    guard !name.isEmpty, name.count <= 200, !name.contains("/"), !name.contains("\\"),
          name.lowercased().hasSuffix(".slbackup") else { throw SeriesError.invalidInput }
    let source = try PrivateFiles.file(uri)
    directory = FileManager.default.temporaryDirectory.appendingPathComponent("series-export-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let copy = directory.appendingPathComponent(name)
    do { try FileManager.default.copyItem(at: source, to: copy) }
    catch { try? FileManager.default.removeItem(at: directory); throw error }
    self.name = name
    self.completion = completion
    picker = UIDocumentPickerViewController(forExporting: [copy], asCopy: true)
    super.init()
    picker.delegate = self
    picker.presentationController?.delegate = self
  }
  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    finish(urls.isEmpty ? "cancelled" : "saved")
  }
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { finish("cancelled") }
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { finish("cancelled") }
  func cancel() { finish("cancelled") }
  private func finish(_ status: String) {
    guard !completed else { return }
    completed = true
    try? FileManager.default.removeItem(at: directory)
    completion(["status": status, "name": name])
  }
}


enum DocumentActions {
  static func share(_ uris: [String], presenter: UIViewController,
                    completion: @escaping (Result<Void, Error>) -> Void) throws {
    guard !uris.isEmpty, uris.count <= 100 else { throw SeriesError.invalidInput }
    let urls = try uris.map { uri -> URL in
      _ = try PdfStore.document(uri)
      return try PrivateFiles.file(uri, maximumBytes: 50 * 1024 * 1024)
    }
    let controller = UIActivityViewController(activityItems: urls, applicationActivities: nil)
    controller.completionWithItemsHandler = { _, _, _, error in
      completion(error.map { .failure($0) } ?? .success(()))
    }
    controller.popoverPresentationController?.sourceView = presenter.view
    controller.popoverPresentationController?.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
    presenter.present(controller, animated: true)
  }

  static func print(_ uri: String, name: String, presenter: UIViewController,
                    completion: @escaping (Result<Void, Error>) -> Void) throws {
    _ = try PdfStore.document(uri)
    let controller = UIPrintInteractionController.shared
    let info = UIPrintInfo(dictionary: nil)
    info.jobName = name
    info.outputType = .general
    controller.printInfo = info
    controller.printingItem = try PrivateFiles.file(uri, maximumBytes: 50 * 1024 * 1024)
    let handler: UIPrintInteractionController.CompletionHandler = { _, _, error in
      completion(error.map { .failure($0) } ?? .success(()))
    }
    let shown: Bool
    if UIDevice.current.userInterfaceIdiom == .pad {
      shown = controller.present(from: CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1),
        in: presenter.view, animated: true, completionHandler: handler)
    } else { shown = controller.present(animated: true, completionHandler: handler) }
    if !shown { completion(.failure(SeriesError.unavailable)) }
  }
}
