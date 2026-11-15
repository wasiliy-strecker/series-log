import Foundation

final class NativeLanguage {
  static let supported = ["de", "en", "es", "fr", "it", "pt"]
  static var appName: String {
    ["de": "SerienLog", "en": "Series Log", "es": "Diario de series", "fr": "Journal de séries", "it": "Diario delle serie", "pt": "Diário de séries"][language]!
  }
  static let preferenceKey = "series.language"
  static var language: String {
    if let preference = UserDefaults.standard.string(forKey: preferenceKey), supported.contains(preference) {
      return preference
    }
    return Locale.preferredLanguages.compactMap { locale -> String? in
      let base = locale.lowercased().split(whereSeparator: { $0 == "-" || $0 == "_" }).first.map(String.init) ?? ""
      return supported.contains(base) ? base : nil
    }.first ?? "en"
  }
  static func state() -> [String: Any] {
    ["language": language, "formatLocale": Locale.autoupdatingCurrent.identifier.replacingOccurrences(of: "_", with: "-"),
     "preference": UserDefaults.standard.string(forKey: preferenceKey) as Any? ?? NSNull()]
  }
  static func select(_ value: String?) throws {
    guard value == nil || supported.contains(value!) else { throw SeriesError.invalidInput }
    if let value { UserDefaults.standard.set(value, forKey: preferenceKey) }
    else { UserDefaults.standard.removeObject(forKey: preferenceKey) }
  }
  private static let catalogs: [String: [String: String]] = {
    let host = Bundle(for: NativeLanguage.self)
    guard let url = host.url(forResource: "SeriesNativeResources", withExtension: "bundle"),
          let bundle = Bundle(url: url) else { return [:] }
    return Dictionary(uniqueKeysWithValues: supported.map { language in
      let values = bundle.url(forResource: language, withExtension: "json")
        .flatMap { try? Data(contentsOf: $0) }
        .flatMap { try? JSONDecoder().decode([String: String].self, from: $0) } ?? [:]
      return (language, values)
    })
  }()
  static func text(_ key: String, _ arguments: String...) -> String {
    var result = catalogs[language]?[key] ?? catalogs["en"]?[key] ?? key
    for (index, value) in arguments.enumerated() {
      result = result.replacingOccurrences(of: "{p\(index)}", with: value)
    }
    return result
  }
}
