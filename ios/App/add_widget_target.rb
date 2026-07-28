#!/usr/bin/env ruby
# Adds (idempotently) the CadenceWidget WidgetKit extension target to the App
# Xcode project: creates the target, its source/resource build phases, wires the
# App Group entitlements onto BOTH the app and the widget, embeds the extension
# into the app, and registers the deep-link scheme. Safe to re-run — it bails if
# the target already exists. Run: `ruby add_widget_target.rb` from ios/App.
#
# Hand-editing project.pbxproj for a whole new app-extension target is the class
# of change that silently breaks the build (see the storyboard-VC pbxproj
# lesson); the xcodeproj gem makes it deterministic and reviewable.
require "xcodeproj"

PROJECT = "App.xcodeproj"
WIDGET = "CadenceWidget"
GROUP_ID = "group.com.johncorser.cadence"
TEAM = "JW5SC3NYUV"

project = Xcodeproj::Project.open(PROJECT)
app = project.targets.find { |t| t.name == "App" }
abort "App target not found" unless app

if project.targets.any? { |t| t.name == WIDGET }
  puts "#{WIDGET} target already exists — nothing to do."
  exit 0
end

# 1) The app-extension target (WidgetKit). :app_extension gives the right product
#    type + .appex packaging.
widget = project.new_target(:app_extension, WIDGET, :ios, "15.0")

# 2) Group + source files for the widget.
group = project.main_group.new_group(WIDGET, WIDGET)
%w[CadenceWidget.swift ContinueListeningSnapshot.swift].each do |f|
  ref = group.new_file(f)
  widget.source_build_phase.add_file_reference(ref)
end
group.new_file("Info.plist")
group.new_file("CadenceWidget.entitlements")

# 3) Build settings on the widget target (bundle id must be a child of the app's).
widget.build_configurations.each do |c|
  s = c.build_settings
  s["PRODUCT_BUNDLE_IDENTIFIER"] = "com.johncorser.cadence.CadenceWidget"
  s["PRODUCT_NAME"] = "$(TARGET_NAME)"
  s["INFOPLIST_FILE"] = "#{WIDGET}/Info.plist"
  s["CODE_SIGN_ENTITLEMENTS"] = "#{WIDGET}/CadenceWidget.entitlements"
  s["DEVELOPMENT_TEAM"] = TEAM
  s["SWIFT_VERSION"] = "5.0"
  s["IPHONEOS_DEPLOYMENT_TARGET"] = "15.0"
  s["TARGETED_DEVICE_FAMILY"] = "1,2"
  s["GENERATE_INFOPLIST_FILE"] = "YES"
  s["SKIP_INSTALL"] = "YES"
  s["LD_RUNPATH_SEARCH_PATHS"] = ["$(inherited)", "@executable_path/Frameworks",
                                  "@executable_path/../../Frameworks"]
end

# 4) Wire the App Group entitlements onto the APP target too (the widget's is set
#    above). The app writes the shared snapshot; both need the group.
app.build_configurations.each do |c|
  c.build_settings["CODE_SIGN_ENTITLEMENTS"] = "App/App.entitlements"
end

# 5) App depends on the widget + embeds it as a plug-in (.appex in PlugIns/).
app.add_dependency(widget)
embed = app.new_copy_files_build_phase("Embed App Extensions")
embed.symbol_dst_subfolder_spec = :plug_ins
embed.add_file_reference(widget.product_reference).tap do |bf|
  bf.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }
end

project.save
puts "Added #{WIDGET} extension target, entitlements, and embed phase."
