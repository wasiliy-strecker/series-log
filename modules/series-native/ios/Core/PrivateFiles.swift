import Foundation

enum PrivateFiles {
  static func file(_ uri: String, maximumBytes: Int = 128 * 1024 * 1024,
                   roots: [URL] = applicationRoots) throws -> URL {
    guard let input = URL(string: uri), input.isFileURL,
          input.host == nil || input.host == "" || input.host == "localhost" else {
      throw SeriesError.inaccessibleFile
    }
    let url = input.standardizedFileURL.resolvingSymlinksInPath()
    guard roots.contains(where: {
      let root = $0.standardizedFileURL.resolvingSymlinksInPath().path
      return url.path.hasPrefix(root + "/")
    }) else { throw SeriesError.inaccessibleFile }
    let info = try url.resourceValues(forKeys: [.isRegularFileKey, .fileSizeKey])
    guard info.isRegularFile == true, let size = info.fileSize,
          size > 0, size <= maximumBytes else { throw SeriesError.inaccessibleFile }
    return url
  }

  static var applicationRoots: [URL] {
    let manager = FileManager.default
    return [manager.urls(for: .documentDirectory, in: .userDomainMask).first!,
            manager.urls(for: .libraryDirectory, in: .userDomainMask).first!,
            manager.temporaryDirectory]
  }

  static func excludeFromSystemBackup() throws {
    // Covers SQLite, the document vault and future children. Exports remain
    // explicit user-controlled copies in Files, including iCloud Drive if chosen.
    for var url in applicationRoots.prefix(2) {
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try url.setResourceValues(values)
    }
  }
}
