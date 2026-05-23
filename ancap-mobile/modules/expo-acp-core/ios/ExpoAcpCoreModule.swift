import ExpoModulesCore

public class ExpoAcpCoreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAcpCore")

    AsyncFunction("createWallet") { () -> [String: Any] in
      throw Exceptions.NotImplemented("ACP native core is not linked on iOS yet. Use Import wallet or build with Swift UniFFI bindings.")
    }

    Function("validateAddress") { (_: String) -> Bool in
      return false
    }

    AsyncFunction("addressFromKeystore") { (_: String) -> String in
      throw Exceptions.NotImplemented("iOS native core pending")
    }

    AsyncFunction("estimateFeeDefault") { () -> [String: Any] in
      throw Exceptions.NotImplemented("iOS native core pending")
    }

    AsyncFunction("signTransfer") { (_: String, _: String, _: String, _: String, _: String?) -> [String: Any] in
      throw Exceptions.NotImplemented("iOS native core pending")
    }
  }
}
