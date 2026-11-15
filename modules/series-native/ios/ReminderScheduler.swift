import Foundation
import UserNotifications

actor ReminderScheduler {
  static let shared = ReminderScheduler()
  private let center = UNUserNotificationCenter.current()
  private let key = "series.reminders.v1"
  private let prefix = "series.reminder."
  private let capacity = 60 // Reserve capacity for the test and future app notifications.
  private var pendingSync: Task<[String], Error>?

  func sync(_ json: String, requestPermission: Bool = true) async throws -> [String] {
    guard let data = json.data(using: .utf8), data.count <= 4 * 1024 * 1024 else { throw SeriesError.invalidInput }
    let rules = try JSONDecoder().decode([ReminderRule].self, from: data)
    guard rules.count <= 10000, Set(rules.map(\.recordId)).count == rules.count else { throw SeriesError.invalidInput }
    for rule in rules { try rule.validate() }
    // Serialize across bridge calls and foreground refreshes, including awaits.
    let previous = pendingSync
    let task = Task { [self] in
      _ = try? await previous?.value
      return try await apply(rules, data: data, requestPermission: requestPermission)
    }
    pendingSync = task
    return try await task.value
  }

  func refresh() async {
    guard let data = UserDefaults.standard.data(forKey: key), let json = String(data: data, encoding: .utf8) else { return }
    _ = try? await sync(json, requestPermission: false)
  }

  private func stored() -> [ReminderRule] {
    guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
    return (try? JSONDecoder().decode([ReminderRule].self, from: data)) ?? []
  }

  private func authorized(request: Bool) async throws -> Bool {
    var settings = await center.notificationSettings()
    if settings.authorizationStatus == .notDetermined && request {
      _ = try await center.requestAuthorization(options: [.alert, .sound, .badge])
      settings = await center.notificationSettings()
    }
    return settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional || settings.authorizationStatus == .ephemeral
  }

  private func content(_ rule: ReminderRule) -> UNMutableNotificationContent {
    let result = UNMutableNotificationContent()
    result.title = rule.label
    let latest = rule.latestValue.map { NativeLanguage.text("Letzter Folgenstand: {p0}", $0) }
      ?? NativeLanguage.text("appleNotificationEmpty")
    result.body = NativeLanguage.text("{p0}\nZeit zum Weiterschauen. Halte deinen nächsten Folgenstand in SerienLog fest.", latest)
    result.sound = rule.deliveryMode == "punctualWithSound" ? .default : nil
    result.threadIdentifier = rule.recordId
    result.userInfo = ["recordId": rule.recordId]
    return result
  }

  private func apply(_ rules: [ReminderRule], data: Data, requestPermission: Bool) async throws -> [String] {
    let allowed = try await authorized(request: requestPermission && !rules.isEmpty)
    let existing = await center.pendingNotificationRequests().filter { $0.identifier.hasPrefix(prefix) }
    UserDefaults.standard.set(data, forKey: key)
    let desiredIds = Set(rules.map(\.recordId))
    let delivered = await center.deliveredNotifications()
    center.removeDeliveredNotifications(withIdentifiers: delivered.filter {
      guard let id = $0.request.content.userInfo["recordId"] as? String else { return false }
      return !desiredIds.contains(id)
    }.map { $0.request.identifier })
    guard allowed else {
      center.removePendingNotificationRequests(withIdentifiers: existing.map(\.identifier))
      return rules.isEmpty ? [] : [NativeLanguage.text("appleRemindersBlocked")]
    }
    let now = Date()
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = .autoupdatingCurrent
    var requests: [UNNotificationRequest] = []
    var finite: [(rule: ReminderRule, last: Date, count: Int)] = []
    var warnings: [String] = []
    // Give every series one slot before extending any bounded schedule.
    for rule in rules {
      guard requests.count < capacity else {
        warnings.append(NativeLanguage.text("appleReminderCapacity"))
        continue
      }
      if let components = try rule.repeatingComponents(now: now, calendar: calendar) {
        var matching = components
        matching.calendar = calendar
        let trigger = UNCalendarNotificationTrigger(dateMatching: matching, repeats: true)
        requests.append(UNNotificationRequest(identifier: prefix + rule.recordId + ".repeat", content: content(rule), trigger: trigger))
      } else {
        let next = try rule.next(after: now, calendar: calendar)
        requests.append(datedRequest(rule, date: next, index: 0, calendar: calendar))
        finite.append((rule, next, 1))
      }
    }
    while requests.count < capacity && !finite.isEmpty {
      for index in finite.indices where requests.count < capacity {
        let next = try finite[index].rule.next(after: finite[index].last, calendar: calendar)
        requests.append(datedRequest(finite[index].rule, date: next, index: finite[index].count, calendar: calendar))
        finite[index].last = next
        finite[index].count += 1
      }
    }
    let ids = Set(requests.map(\.identifier))
    center.removePendingNotificationRequests(withIdentifiers: existing.filter { !ids.contains($0.identifier) }.map(\.identifier))
    for request in requests {
      do { try await center.add(request) }
      catch {
        center.removePendingNotificationRequests(withIdentifiers: [request.identifier])
        warnings.append(NativeLanguage.text("{p0}: Erinnerung konnte nicht geplant werden.", request.content.title))
      }
    }
    // Verify what iOS actually kept instead of reporting a requested schedule.
    let pendingIds = Set(await center.pendingNotificationRequests().map(\.identifier))
    if !ids.isSubset(of: pendingIds) { warnings.append(NativeLanguage.text("appleReminderCapacity")) }
    if !finite.isEmpty { warnings.append(NativeLanguage.text("appleReminderWindowHint")) }
    return Array(Set(warnings)).sorted()
  }

  private func datedRequest(_ rule: ReminderRule, date: Date, index: Int, calendar: Calendar) -> UNNotificationRequest {
    var components = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    components.calendar = calendar
    components.timeZone = calendar.timeZone
    return UNNotificationRequest(identifier: prefix + rule.recordId + ".\(index)", content: content(rule),
      trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: false))
  }

  func status() async -> [String: Any] {
    _ = try? await pendingSync?.value
    let allowed = (try? await authorized(request: false)) ?? false
    let pending = await center.pendingNotificationRequests()
    let delivered = await center.deliveredNotifications()
    let schedules: [[String: Any]] = stored().map { rule in
      let requests = pending.filter { ($0.content.userInfo["recordId"] as? String) == rule.recordId }
      let dates = requests.compactMap { ($0.trigger as? UNCalendarNotificationTrigger)?.nextTriggerDate() }
      let notifications = delivered.filter { ($0.request.content.userInfo["recordId"] as? String) == rule.recordId }
      let finite = !requests.contains { $0.trigger?.repeats == true }
      return ["recordId": rule.recordId,
        "nextTriggerAtMillis": dates.min().map { $0.timeIntervalSince1970 * 1000 } as Any? ?? NSNull(),
        "scheduledThroughMillis": (finite ? dates.max() : nil).map { $0.timeIntervalSince1970 * 1000 } as Any? ?? NSNull(),
        "planningState": dates.isEmpty ? "failed" : "scheduled", "isExact": false,
        "deliveryFailed": false, "isNotificationActive": !notifications.isEmpty,
        "lastTriggeredAtMillis": notifications.map(\.date).max().map { $0.timeIntervalSince1970 * 1000 } as Any? ?? NSNull()]
    }
    return ["notifications": allowed, "exact": false, "doNotDisturb": NSNull(),
      "availability": ["normal": allowed ? "available" : "appBlocked", "punctualWithSound": allowed ? "available" : "appBlocked"],
      "schedules": schedules]
  }

  func acknowledge(_ id: String) async {
    let delivered = await center.deliveredNotifications()
    center.removeDeliveredNotifications(withIdentifiers: delivered.filter {
      ($0.request.content.userInfo["recordId"] as? String) == id
    }.map { $0.request.identifier })
  }

  func test(_ request: [String: String?]) async throws -> String {
    guard try await authorized(request: true) else { return "appBlocked" }
    let content = UNMutableNotificationContent()
    content.title = NativeLanguage.text("Test: {p0} · {p1}", NativeLanguage.appName, (request["label"] ?? nil) ?? "")
    content.body = NativeLanguage.text("appleTestReminderHint")
    content.sound = (request["deliveryMode"] ?? nil) == "punctualWithSound" ? .default : nil
    // Test deliberately opens the app, without claiming deep linking to a series.
    try await center.add(UNNotificationRequest(identifier: "series.test", content: content,
      trigger: UNTimeIntervalNotificationTrigger(timeInterval: 2, repeats: false)))
    return "posted"
  }
}

// This app has no remote notification SDK. Keep this delegate alive independently
// of React reloads so foreground notifications also appear.
final class SeriesNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
  static let shared = SeriesNotificationDelegate()
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .list, .sound])
  }
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void) {
    center.removeDeliveredNotifications(withIdentifiers: [response.notification.request.identifier])
    completionHandler()
  }
}
