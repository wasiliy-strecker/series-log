// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "SeriesNativeCore",
  platforms: [.macOS(.v13)],
  products: [.library(name: "SeriesNativeCore", targets: ["SeriesNativeCore"])],
  targets: [
    .target(name: "SeriesNativeCore", path: "ios/Core"),
    .testTarget(name: "SeriesNativeCoreTests", dependencies: ["SeriesNativeCore"], path: "apple-tests"),
  ]
)
