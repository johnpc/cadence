#!/usr/bin/env ruby
# Ensures app source files are in the right Xcode targets (idempotent) — the
# project file is machine-generated and merge-hostile, so edits go through the
# xcodeproj gem like the other add_*.rb scripts.
#   cd ios/App && ruby add_app_sources.rb
require "xcodeproj"

project = Xcodeproj::Project.open(File.join(__dir__, "App.xcodeproj"))
app = project.targets.find { |t| t.name == "App" } or raise "App target not found"
tests = project.targets.find { |t| t.name == "AppTests" }

def ensure_file(project, target, group_path, rel)
  return if target.source_build_phase.files_references.any? { |f| f.real_path.to_s.end_with?(rel) }
  group = project.main_group.find_subpath(group_path, true)
  # new_file with the absolute path computes the right relative path even for a
  # group without its own folder (AppTests).
  ref = group.files.find { |f| f.real_path.to_s.end_with?(rel) } || group.new_file(File.join(__dir__, rel))
  target.add_file_references([ref])
  puts "  #{target.name} += #{rel}"
end

ensure_file(project, app, "App", "App/SceneDelegate.swift")
ensure_file(project, app, "App", "App/SecureSessionPlugin.swift")
ensure_file(project, app, "App", "App/AudioRouteLoss.swift")
ensure_file(project, app, "App", "App/KeychainStore.swift")
if tests
  # Host-less tests compile the pure sources under test directly (see add_test_target.rb).
  ensure_file(project, tests, "App", "App/AudioRouteLoss.swift")
  ensure_file(project, tests, "AppTests", "AppTests/AudioRouteLossTests.swift")
  ensure_file(project, tests, "App", "App/KeychainStore.swift")
  ensure_file(project, tests, "AppTests", "AppTests/KeychainStoreTests.swift")
end
project.save
puts "add_app_sources: targets up to date."
