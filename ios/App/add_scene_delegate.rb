#!/usr/bin/env ruby
# Adds App/SceneDelegate.swift to the App target (idempotent). The UIScene life
# cycle is mandatory for apps built with the iOS 27 SDK — see SceneDelegate.swift.
#   cd ios/App && ruby add_scene_delegate.rb
require "xcodeproj"

project = Xcodeproj::Project.open(File.join(__dir__, "App.xcodeproj"))
app = project.targets.find { |t| t.name == "App" } or raise "App target not found"
if app.source_build_phase.files_references.any? { |f| f.path == "SceneDelegate.swift" }
  puts "SceneDelegate.swift already in the App target — nothing to do."
  exit 0
end
group = project.main_group["App"] or raise "App group not found"
ref = group.new_reference("SceneDelegate.swift")
app.add_file_references([ref])
project.save
puts "Added SceneDelegate.swift to the App target."
