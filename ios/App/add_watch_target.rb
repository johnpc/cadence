#!/usr/bin/env ruby
# Adds (idempotently) the CadenceWatch watchOS app target to the App Xcode
# project: creates the watchOS app target, its source build phase, embeds it into
# the iOS app (Embed Watch Content), and sets signing to match. Safe to re-run —
# bails if the target already exists. Run: `ruby add_watch_target.rb` from ios/App.
#
# A modern single-target watchOS app (watchOS 9+) is a product-type application
# on the WATCHOS platform, embedded in the phone app's .app/Watch folder.
require "xcodeproj"

PROJECT = "App.xcodeproj"
WATCH = "CadenceWatch"
TEAM = "JW5SC3NYUV"
BUNDLE = "com.johncorser.cadence.watchkitapp"

project = Xcodeproj::Project.open(PROJECT)
app = project.targets.find { |t| t.name == "App" }
abort "App target not found" unless app
if project.targets.any? { |t| t.name == WATCH }
  puts "#{WATCH} target already exists — nothing to do."
  exit 0
end

# 1) watchOS app target.
watch = project.new_target(:application, WATCH, :watchos, "9.0")

# 2) Group + Swift sources.
group = project.main_group.new_group(WATCH, WATCH)
%w[CadenceWatchApp.swift NowPlayingView.swift WatchConnector.swift NowPlaying.swift].each do |f|
  watch.source_build_phase.add_file_reference(group.new_file(f))
end
group.new_file("Info.plist")

# 3) Build settings.
watch.build_configurations.each do |c|
  s = c.build_settings
  s["PRODUCT_BUNDLE_IDENTIFIER"] = BUNDLE
  s["PRODUCT_NAME"] = "$(TARGET_NAME)"
  s["INFOPLIST_FILE"] = "#{WATCH}/Info.plist"
  s["DEVELOPMENT_TEAM"] = TEAM
  s["CODE_SIGN_STYLE"] = "Automatic"
  s["SWIFT_VERSION"] = "5.0"
  s["WATCHOS_DEPLOYMENT_TARGET"] = "9.0"
  s["TARGETED_DEVICE_FAMILY"] = "4" # Apple Watch
  s["SDKROOT"] = "watchos"
  s["GENERATE_INFOPLIST_FILE"] = "YES"
  s["SKIP_INSTALL"] = "NO"
  s["INFOPLIST_KEY_WKApplication"] = "YES"
  s["INFOPLIST_KEY_WKCompanionAppBundleIdentifier"] = "com.johncorser.cadence"
end

# 4) Embed the watch app into the iOS app (.app/Watch), with the watch as a
#    dependency so it builds first.
app.add_dependency(watch)
embed = app.new_copy_files_build_phase("Embed Watch Content")
embed.symbol_dst_subfolder_spec = :products_directory
embed.dst_path = "$(CONTENTS_FOLDER_PATH)/Watch"
embed.add_file_reference(watch.product_reference).tap do |bf|
  bf.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }
end

project.save
puts "Added #{WATCH} watchOS target (#{BUNDLE}) + embed phase."
