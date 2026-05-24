require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

generated_swift_dir = File.join(__dir__, 'generated', 'swift')
vendored_xcframework_dir = File.join(__dir__, 'native', 'acp_mobile_ffiFFI.xcframework')

Pod::Spec.new do |s|
  s.name           = 'ExpoAcpCore'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  source_files = ['**/*.{h,m,mm,swift,hpp,cpp}']

  if Dir.exist?(generated_swift_dir)
    module_map_path = File.join(__dir__, 'generated', 'swift', 'acp_mobile_ffiFFI.modulemap')
    if File.exist?(module_map_path)
      s.preserve_paths = ['generated/swift/**/*']
      s.pod_target_xcconfig = {
        'SWIFT_INCLUDE_PATHS' => '$(PODS_TARGET_SRCROOT)/generated/swift',
        'HEADER_SEARCH_PATHS' => '$(inherited) $(PODS_TARGET_SRCROOT)/generated/swift',
      }
    end
  else
    s.pod_target_xcconfig = {
      'SWIFT_ACTIVE_COMPILATION_CONDITIONS' => '$(inherited) ACP_IOS_NATIVE_MISSING',
    }
  end

  s.source_files = source_files

  if Dir.exist?(vendored_xcframework_dir)
    s.vendored_frameworks = 'native/acp_mobile_ffiFFI.xcframework'
  end
end
