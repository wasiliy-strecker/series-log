import Foundation

struct ReminderRule: Codable, Equatable {
  let recordId: String
  let label: String
  let interval: String
  let day: Int
  let month: Int?
  let hour: Int
  let minute: Int
  let deliveryMode: String
  let startsAtMillis: Double?
  let latestValue: String?
  let latestUnit: String?

  func validate() throws {
    guard !recordId.isEmpty, recordId.count <= 200, label.count <= 1000,
          ["hourly", "daily", "weekly", "monthly", "yearly"].contains(interval),
          (1...31).contains(day), (0...23).contains(hour), (0...59).contains(minute),
          ["normal", "punctualWithSound"].contains(deliveryMode),
          interval != "weekly" || day <= 7,
          interval != "yearly" || (1...12).contains(month ?? 0),
          interval != "hourly" || (startsAtMillis?.isFinite == true && startsAtMillis! > 0)
    else { throw SeriesError.invalidInput }
  }

  func next(after now: Date, calendar: Calendar) throws -> Date {
    if interval == "hourly", let milliseconds = startsAtMillis {
      let start = Date(timeIntervalSince1970: milliseconds / 1000)
      return start > now ? start : start.addingTimeInterval(
        (floor(now.timeIntervalSince(start) / 3600) + 1) * 3600)
    }
    var components = DateComponents()
    components.hour = hour
    components.minute = minute
    components.second = 0
    if interval == "weekly" { components.weekday = day % 7 + 1 }
    if interval == "daily" || interval == "weekly" {
      guard let date = calendar.nextDate(after: now, matching: components,
        matchingPolicy: .nextTime, repeatedTimePolicy: .first) else { throw SeriesError.invalidInput }
      return date
    }
    // Clamp imported 29th/30th/31st reminders exactly as Android does, including
    // February. Calendar triggers alone would silently skip those months.
    let current = calendar.dateComponents([.year, .month], from: now)
    for offset in 0...24 {
      var target = current
      if interval == "yearly" {
        target.year = current.year! + offset
        target.month = month
      } else {
        let base = calendar.date(from: current)!
        target = calendar.dateComponents([.year, .month], from:
          calendar.date(byAdding: .month, value: offset, to: base)!)
      }
      target.day = 1
      let first = calendar.date(from: target)!
      target.day = min(day, calendar.range(of: .day, in: .month, for: first)!.count)
      let midnight = calendar.date(from: target)!
      let date = calendar.date(bySettingHour: hour, minute: minute, second: 0,
                              of: midnight, matchingPolicy: .nextTime, repeatedTimePolicy: .first)!
      if date > now { return date }
    }
    throw SeriesError.invalidInput
  }

  func repeatingComponents(now: Date, calendar: Calendar) throws -> DateComponents? {
    var components = DateComponents()
    components.second = 0
    components.minute = minute
    if interval == "hourly" {
      let next = try next(after: now, calendar: calendar)
      // A recurring calendar trigger cannot delay its first delivery until a
      // future start date. Such rules use a visible, bounded schedule instead.
      guard next.timeIntervalSince(now) <= 3600 else { return nil }
      components.minute = calendar.component(.minute, from: next)
      components.second = calendar.component(.second, from: next)
      return components
    }
    components.hour = hour
    if interval == "weekly" { components.weekday = day % 7 + 1 }
    if interval == "monthly" || interval == "yearly" {
      guard day <= 28 else { return nil }
      components.day = day
    }
    if interval == "yearly" { components.month = month }
    return components
  }
}
