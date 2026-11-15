import UIKit
import UniformTypeIdentifiers
import ImageIO

// A Catalyst document picker is a native Mac file dialog. Selected files are
// copied into our container, so no long-lived external file access is needed.
final class PhotoImport: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  let picker: UIDocumentPickerViewController
  private var finished = false
  private let completion: (Result<[[String: Any]], Error>) -> Void

  init(multiple: Bool, completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
    picker = UIDocumentPickerViewController(forOpeningContentTypes: [.image], asCopy: true)
    picker.allowsMultipleSelection = multiple
    self.completion = completion
    super.init()
    picker.delegate = self
    picker.presentationController?.delegate = self
  }
  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    var copies: [URL] = []
    do {
      let photos = try urls.map { url -> [String: Any] in
        try autoreleasepool { () throws -> [String: Any] in
          let scoped = url.startAccessingSecurityScopedResource()
          defer { if scoped { url.stopAccessingSecurityScopedResource() } }
          let info = try url.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey])
          guard info.isRegularFile == true, let size = info.fileSize, size > 0, size <= 50 * 1024 * 1024,
                let source = CGImageSourceCreateWithURL(url as CFURL, nil),
                let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
                let width = properties[kCGImagePropertyPixelWidth] as? Int,
                let height = properties[kCGImagePropertyPixelHeight] as? Int,
                width > 0, height > 0, width <= 24000, height <= 24000 else { throw SeriesError.invalidInput }
          // Thumbnail decoding bounds memory and applies EXIF orientation. Encoding
          // fresh JPEG data removes location and capture metadata before JS reads it.
          let options: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceThumbnailMaxPixelSize: 1920, kCGImageSourceCreateThumbnailWithTransform: true]
          guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary),
                let bytes = UIImage(cgImage: image).jpegData(compressionQuality: 0.9) else { throw SeriesError.invalidInput }
          let copy = FileManager.default.temporaryDirectory.appendingPathComponent("series-photo-\(UUID().uuidString).jpg")
          try bytes.write(to: copy, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
          copies.append(copy)
          return ["uri": copy.absoluteString, "width": image.width, "height": image.height,
                  "fileName": url.deletingPathExtension().lastPathComponent + ".jpg"]
        }
      }
      finish(.success(photos))
    } catch {
      for copy in copies { try? FileManager.default.removeItem(at: copy) }
      finish(.failure(error))
    }
  }
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { cancel() }
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { cancel() }
  func cancel() { finish(.success([])) }
  private func finish(_ result: Result<[[String: Any]], Error>) {
    guard !finished else { return }
    finished = true
    completion(result)
  }
}

enum AppleSettings {
  static func openNotifications(completion: @escaping (Bool) -> Void) {
    #if targetEnvironment(macCatalyst)
    // There is no supported URL for a specific app's Mac notification pane.
    // The UI shows the localized System Settings path when this returns false.
    completion(false)
    #else
    UIApplication.shared.open(URL(string: UIApplication.openNotificationSettingsURLString)!, options: [:], completionHandler: completion)
    #endif
  }
}

enum MacWindow {
  static func configure() {
    #if targetEnvironment(macCatalyst)
    for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
      scene.sizeRestrictions?.minimumSize = CGSize(width: 640, height: 480)
    }
    #endif
  }
}
