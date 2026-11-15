import XCTest
@testable import SeriesNativeCore

final class NativeCoreTests: XCTestCase {
  func testLegacyBackupKeyMatchesIndependentPBKDF2Vector() throws {
    XCTAssertEqual(try BackupKey.derive(password: "Synthetic SerienLog ä🔑", salt: "99903f9f3ca67afe44b5d0edb16ce954", iterations: 600_000), "7bc1c8708387d7996ee2c300881b385721d16fb3e41e7afced65025e95d8e98b")
    XCTAssertEqual(try BackupKey.derive(password: "ä\0🔑", salt: "00112233445566778899aabbccddeeff", iterations: 600_000), "e0f50c715609766a22e73c2cffb6120f4b6cb32657db12ef09b30f7c79553360")
  }
  func testBackupRejectsInvalidParameters() {
    XCTAssertThrowsError(try BackupKey.derive(password: "password", salt: "00", iterations: 600_000))
    XCTAssertThrowsError(try BackupKey.derive(password: "password", salt: String(repeating: "0", count: 32), iterations: 1))
    XCTAssertThrowsError(try BackupKey.derive(password: String(repeating: "🔑", count: 513), salt: String(repeating: "0", count: 32), iterations: 600_000))
  }
  var utc: Calendar {
    var value = Calendar(identifier: .gregorian)
    value.timeZone = TimeZone(secondsFromGMT: 0)!
    return value
  }
  func date(_ string: String) -> Date { ISO8601DateFormatter().date(from: string)! }
  func rule(_ interval: String, day: Int = 1, month: Int = 2, start: Double? = nil) -> ReminderRule {
    ReminderRule(recordId: "counter", label: "Counter", interval: interval, day: day, month: month, hour: 9, minute: 30,
      deliveryMode: "punctualWithSound", startsAtMillis: start, latestValue: nil, latestUnit: "pieces")
  }
  func testMonthlyAndYearlyClampFebruaryAndLeapYears() throws {
    XCTAssertEqual(try rule("monthly", day: 31).next(after: date("2027-02-01T00:00:00Z"), calendar: utc), date("2027-02-28T09:30:00Z"))
    XCTAssertEqual(try rule("monthly", day: 31).next(after: date("2028-02-01T00:00:00Z"), calendar: utc), date("2028-02-29T09:30:00Z"))
    XCTAssertEqual(try rule("yearly", day: 29).next(after: date("2027-02-28T10:00:00Z"), calendar: utc), date("2028-02-29T09:30:00Z"))
  }
  func testWeeklyUsesISOWeekdayAndNextOccurrenceIsStrictlyFuture() throws {
    let monday = date("2026-11-09T09:30:00Z")
    XCTAssertEqual(try rule("weekly", day: 1).next(after: monday, calendar: utc), date("2026-11-16T09:30:00Z"))
    XCTAssertEqual(try rule("weekly", day: 1).repeatingComponents(now: monday, calendar: utc)?.weekday, 2)
  }
  func testHourlyPreservesAnchorAndDoesNotScheduleBeforeFutureStart() throws {
    let now = date("2026-11-05T08:00:00Z")
    let future = rule("hourly", start: date("2026-11-06T09:30:00Z").timeIntervalSince1970 * 1000)
    XCTAssertNil(try future.repeatingComponents(now: now, calendar: utc))
    XCTAssertEqual(try future.next(after: now, calendar: utc), date("2026-11-06T09:30:00Z"))
    let past = rule("hourly", start: date("2026-11-04T09:30:00Z").timeIntervalSince1970 * 1000)
    XCTAssertEqual(try past.next(after: now, calendar: utc), date("2026-11-05T08:30:00Z"))
    XCTAssertEqual(try past.repeatingComponents(now: now, calendar: utc)?.minute, 30)
  }
  func testShortMonthRulesAreBoundedAndNormalRulesCanRepeat() throws {
    let now = date("2026-11-05T08:00:00Z")
    XCTAssertNil(try rule("monthly", day: 31).repeatingComponents(now: now, calendar: utc))
    XCTAssertNotNil(try rule("monthly", day: 28).repeatingComponents(now: now, calendar: utc))
    XCTAssertThrowsError(try rule("weekly", day: 8).validate())
    XCTAssertThrowsError(try rule("hourly").validate())
  }
  func testDailyReminderAcrossDaylightSavingTransition() throws {
    var berlin = utc
    berlin.timeZone = TimeZone(identifier: "Europe/Berlin")!
    let r = ReminderRule(recordId: "counter", label: "Counter", interval: "daily", day: 1, month: nil, hour: 2, minute: 30,
      deliveryMode: "normal", startsAtMillis: nil, latestValue: nil, latestUnit: nil)
    let next = try r.next(after: date("2027-03-28T00:00:00Z"), calendar: berlin)
    XCTAssertEqual(berlin.component(.day, from: next), 28)
    XCTAssertEqual(berlin.component(.hour, from: next), 3)
  }
  func testPrivateFilesRejectSymlinksOutsideRootAndOversizedFiles() throws {
    let manager = FileManager.default
    let root = manager.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    let outside = manager.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try manager.createDirectory(at: root, withIntermediateDirectories: true)
    defer { try? manager.removeItem(at: root); try? manager.removeItem(at: outside) }
    let file = root.appendingPathComponent("safe.pdf")
    try Data([1, 2, 3]).write(to: file)
    try Data([4]).write(to: outside)
    let link = root.appendingPathComponent("escape.pdf")
    try manager.createSymbolicLink(at: link, withDestinationURL: outside)
    XCTAssertEqual(try PrivateFiles.file(file.absoluteString, roots: [root]), file.resolvingSymlinksInPath())
    XCTAssertThrowsError(try PrivateFiles.file(link.absoluteString, roots: [root]))
    XCTAssertThrowsError(try PrivateFiles.file(file.absoluteString, maximumBytes: 2, roots: [root]))
    XCTAssertThrowsError(try PrivateFiles.file("https://example.com/file.pdf", roots: [root]))
    XCTAssertThrowsError(try PrivateFiles.file(root.absoluteString, roots: [root]))
  }
}
