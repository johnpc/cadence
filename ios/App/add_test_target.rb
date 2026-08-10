#!/usr/bin/env ruby
# Adds an `AppTests` unit-test target to App.xcodeproj (idempotent).
#
# Why a script, not a hand-edited pbxproj: the project file is machine-generated
# (Capacitor) and merge-hostile; the xcodeproj gem makes the edits deterministically.
# Run once locally, or in CI before the Swift test step:
#   cd ios/App && ruby add_test_target.rb
#
# Design: this is a LIBRARY-style (host-less) unit test. Rather than
# `@testable import App` — which drags the whole app module and its Capacitor/Pods
# framework dependencies into the test link — we compile the specific source files
# under test directly into the test bundle. NowPlayingBridge.swift only depends on
# Foundation/UIKit/MediaPlayer, so the tests need no app host and no Pods, which
# keeps the CI job fast and dependency-free.
require "xcodeproj"

project_path = File.join(__dir__, "App.xcodeproj")
project = Xcodeproj::Project.open(project_path)

app = project.targets.find { |t| t.name == "App" }
raise "App target not found" unless app

if project.targets.any? { |t| t.name == "AppTests" }
  puts "AppTests target already exists — nothing to do."
  exit 0
end

test_target = project.new_target(
  :unit_test_bundle, "AppTests", :ios, app.deployment_target
)

# The app sources under test (no Capacitor imports) compiled straight into the
# bundle, plus the test files themselves.
sources_under_test = ["App/NowPlayingBridge.swift"]
group = project.main_group.find_subpath("AppTests", true)
group.set_source_tree("<group>")

sources_under_test.each do |rel|
  ref = group.new_file(File.join(__dir__, rel))
  test_target.add_file_references([ref])
end
Dir[File.join(__dir__, "AppTests", "*.swift")].sort.each do |file|
  ref = group.new_file(file)
  test_target.add_file_references([ref])
end

test_target.build_configurations.each do |config|
  config.build_settings["PRODUCT_BUNDLE_IDENTIFIER"] = "com.johncorser.cadence.AppTests"
  config.build_settings["PRODUCT_NAME"] = "$(TARGET_NAME)"
  config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = app.deployment_target
  config.build_settings["SWIFT_VERSION"] = "5.0"
  config.build_settings["GENERATE_INFOPLIST_FILE"] = "YES"
  config.build_settings["CODE_SIGNING_ALLOWED"] = "NO"
end

# A shared scheme so `xcodebuild test -scheme AppTests` works in CI.
scheme = Xcodeproj::XCScheme.new
scheme.add_test_target(test_target)
scheme.save_as(project_path, "AppTests", true)

project.save
puts "Added AppTests target + scheme (host-less; compiles NowPlayingBridge.swift directly)."
