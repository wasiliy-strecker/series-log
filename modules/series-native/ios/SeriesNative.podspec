Pod::Spec.new do |s|
  s.name = 'SeriesNative'
  s.version = '1.0.0'
  s.summary = 'Offline Apple services for Series Log'
  s.description = 'Local PDF viewing, backup export, photo import and local reminders.'
  s.license = { :type => 'Proprietary' }
  s.author = 'AppFabrik AI'
  s.homepage = 'https://github.com/wasiliy-strecker/series-log'
  s.source = { :git => 'https://github.com/wasiliy-strecker/series-log.git' }
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'PDFKit', 'UserNotifications', 'UIKit', 'ImageIO'
  s.source_files = '**/*.swift'
  s.resource_bundles = { 'SeriesNativeResources' => ['Resources/*.json'] }
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
