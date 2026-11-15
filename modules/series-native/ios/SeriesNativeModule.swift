import ExpoModulesCore
import UIKit
import PDFKit
import UserNotifications

public final class SeriesNativeModule: Module {
  private var export: BackupExport?
  private var photos: PhotoImport?

  public func definition() -> ModuleDefinition {
    Name("SeriesNative")
    Events("localizationChanged")

    OnCreate {
      UNUserNotificationCenter.current().delegate = SeriesNotificationDelegate.shared
      try? PrivateFiles.excludeFromSystemBackup()
    }
    Function("getLocalization") { NativeLanguage.state() }
    AsyncFunction("setLanguage") { (language: String?) in
      try NativeLanguage.select(language)
      self.sendEvent("localizationChanged", NativeLanguage.state())
      await ReminderScheduler.shared.refresh()
      return NativeLanguage.state()
    }
    OnAppBecomesActive {
      DispatchQueue.main.async { MacWindow.configure() }
      self.sendEvent("localizationChanged", NativeLanguage.state())
      Task { await ReminderScheduler.shared.refresh() }
    }
    AsyncFunction("pickPhotos") { (multiple: Bool, promise: Promise) in
      guard self.photos == nil, self.export == nil else { throw SeriesError.busy }
      let presenter = try self.presenter()
      let operation = PhotoImport(multiple: multiple) { [weak self] result in
        self?.photos = nil
        switch result {
        case .success(let photos): promise.resolve(photos)
        case .failure(let error): promise.reject(error)
        }
      }
      self.photos = operation
      presenter.present(operation.picker, animated: true)
    }.runOnQueue(.main)
    AsyncFunction("deriveBackupKey") { (password: String, salt: String, iterations: Int) in
      try BackupKey.derive(password: password, salt: salt, iterations: iterations)
    }
    AsyncFunction("validatePdf") { (uri: String) in try PdfStore.document(uri).pageCount }
    AsyncFunction("openPdfPreview") { (uri: String) in try PdfStore.shared.open(uri) }.runOnQueue(.main)
    AsyncFunction("renderPdfPage") { (session: String, index: Int, width: Int) in
      try PdfStore.shared.render(session, index: index, width: width)
    }.runOnQueue(.main)
    AsyncFunction("closePdfPreview") { (session: String) in PdfStore.shared.close(session) }.runOnQueue(.main)
    View(SeriesPdfView.self) {
      Prop("session") { (view: SeriesPdfView, session: String) in view.open(session) }
    }
    AsyncFunction("openPdf") { (uri: String) in
      let controller = UINavigationController(rootViewController: PdfController(document: try PdfStore.document(uri)))
      try self.presenter().present(controller, animated: true)
    }.runOnQueue(.main)
    AsyncFunction("sharePdfs") { (uris: [String], promise: Promise) in
      try DocumentActions.share(uris, presenter: self.presenter()) { result in
        switch result {
        case .success: promise.resolve(nil)
        case .failure(let error): promise.reject(error)
        }
      }
    }.runOnQueue(.main)
    AsyncFunction("printPdf") { (uri: String, name: String, promise: Promise) in
      try DocumentActions.print(uri, name: name, presenter: self.presenter()) { result in
        switch result {
        case .success: promise.resolve(nil)
        case .failure(let error): promise.reject(error)
        }
      }
    }.runOnQueue(.main)
    AsyncFunction("saveBackupFile") { (uri: String, name: String, promise: Promise) in
      guard self.export == nil, self.photos == nil else { throw SeriesError.busy }
      let presenter = try self.presenter()
      let operation = try BackupExport(uri: uri, name: name) { [weak self] result in
        self?.export = nil
        promise.resolve(result)
      }
      self.export = operation
      presenter.present(operation.picker, animated: true)
    }.runOnQueue(.main)
    AsyncFunction("syncReminders") { (json: String) in try await ReminderScheduler.shared.sync(json) }
    AsyncFunction("reminderStatus") { await ReminderScheduler.shared.status() }
    AsyncFunction("acknowledge") { (id: String) in await ReminderScheduler.shared.acknowledge(id) }
    AsyncFunction("testReminder") { (request: [String: String?]) in try await ReminderScheduler.shared.test(request) }
    AsyncFunction("openReminderSettings") { (target: String, mode: String?, promise: Promise) in
      // Public Settings URL only. iOS has neither Android channels nor exact-alarm permissions.
      guard target == "notifications" || target == "channel" else { promise.resolve(false); return }
      AppleSettings.openNotifications { opened in promise.resolve(opened) }
    }.runOnQueue(.main)
    OnDestroy {
      DispatchQueue.main.async {
        self.photos?.cancel()
        self.photos = nil
        self.export?.cancel()
        self.export = nil
        PdfStore.shared.closeAll()
      }
    }
  }

  private func presenter() throws -> UIViewController {
    guard let presenter = appContext?.utilities?.currentViewController(),
          !presenter.isBeingDismissed, presenter.view.window != nil else { throw SeriesError.unavailable }
    return presenter
  }
}
