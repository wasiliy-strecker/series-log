import Foundation
import CommonCrypto

// The v1 .slbackup format is shared with Android. Never change these parameters
// without a versioned backup migration and cross-platform vectors.
enum BackupKey {
  static func derive(password: String, salt: String, iterations: Int) throws -> String {
    guard password.utf16.count <= 1024, iterations == 600_000,
          salt.count == 32, salt.allSatisfy({ "0123456789abcdef".contains($0) }) else {
      throw SeriesError.invalidInput
    }
    let saltBytes = stride(from: 0, to: salt.count, by: 2).map { offset -> UInt8 in
      let start = salt.index(salt.startIndex, offsetBy: offset)
      return UInt8(salt[start..<salt.index(start, offsetBy: 2)], radix: 16)!
    }
    // Pass an explicit byte length, including embedded NULs and non-ASCII text.
    let passwordBytes = Array(password.utf8)
    var output = [UInt8](repeating: 0, count: 32)
    let result = passwordBytes.withUnsafeBytes { passwordBuffer in
      saltBytes.withUnsafeBytes { saltBuffer in
        CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2),
          passwordBuffer.baseAddress?.assumingMemoryBound(to: Int8.self), passwordBytes.count,
          saltBuffer.baseAddress?.assumingMemoryBound(to: UInt8.self), saltBytes.count,
          CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256), UInt32(iterations), &output, output.count)
      }
    }
    guard result == kCCSuccess else { throw SeriesError.invalidInput }
    return output.map { String(format: "%02x", $0) }.joined()
  }
}

enum SeriesError: LocalizedError {
  case invalidInput, inaccessibleFile, invalidPdf, busy, unavailable
  var errorDescription: String? {
    switch self {
    case .invalidInput: return "Invalid local service request."
    case .inaccessibleFile: return "The local file is unavailable."
    case .invalidPdf: return "The PDF is unreadable, encrypted or exceeds the supported size."
    case .busy: return "Another document operation is still open."
    case .unavailable: return "The requested service is unavailable."
    }
  }
}
