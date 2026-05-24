import ExpoModulesCore

#if canImport(acp_mobile_ffiFFI)
import acp_mobile_ffiFFI
#endif

#if canImport(acp_mobile_ffi)
import acp_mobile_ffi
#endif

private func acpNativeAvailabilityMessage() -> String {
  "ACP native core is not linked on iOS yet. Generate the Swift UniFFI bindings, bundle the Rust static library/XCFramework, then rebuild the Expo dev client. Use Import wallet until native iOS wiring is finished."
}

private func requireAcpNativeLinked() throws {
  #if canImport(acp_mobile_ffiFFI) && canImport(acp_mobile_ffi)
  return
  #else
  throw Exceptions.NotImplemented(acpNativeAvailabilityMessage())
  #endif
}

private func mapWalletError(_ error: AcpWalletException) -> Exception {
  switch error {
  case .InvalidAddress:
    return Exception(name: "ERR_INVALID_ADDRESS", description: error.localizedDescription)
  case .InvalidMnemonic:
    return Exception(name: "ERR_INVALID_MNEMONIC", description: error.localizedDescription)
  case .InvalidAmount:
    return Exception(name: "ERR_INVALID_AMOUNT", description: error.localizedDescription)
  case .InsufficientFunds:
    return Exception(name: "ERR_INSUFFICIENT_FUNDS", description: error.localizedDescription)
  case .Rpc(let message):
    return Exception(name: "ERR_RPC", description: message)
  case .Internal(let message):
    return Exception(name: "ERR_INTERNAL", description: message)
  @unknown default:
    return Exception(name: "ERR_INTERNAL", description: error.localizedDescription)
  }
}

public class ExpoAcpCoreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAcpCore")

    AsyncFunction("createWallet") { () -> [String: Any] in
      try requireAcpNativeLinked()
      #if canImport(acp_mobile_ffiFFI) && canImport(acp_mobile_ffi)
      do {
        let wallet = try acpCreateWalletFfi()
        return [
          "address": wallet.address,
          "mnemonic": wallet.mnemonic,
          "keystoreJson": wallet.keystoreJson,
        ]
      } catch let error as AcpWalletException {
        throw mapWalletError(error)
      }
      #else
      throw Exceptions.NotImplemented(acpNativeAvailabilityMessage())
      #endif
    }

    Function("validateAddress") { (address: String) -> Bool in
      #if canImport(acp_mobile_ffiFFI) && canImport(acp_mobile_ffi)
      return acpValidateAddressFfi(address: address)
      #else
      return false
      #endif
    }

    AsyncFunction("addressFromKeystore") { (keystoreJson: String) -> String in
      try requireAcpNativeLinked()
      #if canImport(acp_mobile_ffiFFI) && canImport(acp_mobile_ffi)
      do {
        return try acpAddressFromKeystoreFfi(keystoreJson: keystoreJson)
      } catch let error as AcpWalletException {
        throw mapWalletError(error)
      }
      #else
      throw Exceptions.NotImplemented(acpNativeAvailabilityMessage())
      #endif
    }

    AsyncFunction("estimateFeeDefault") { () -> [String: Any] in
      try requireAcpNativeLinked()
      #if canImport(acp_mobile_ffiFFI) && canImport(acp_mobile_ffi)
      do {
        let fee = try acpEstimateFeeDefaultFfi()
        return [
          "feeAcp": fee.feeAcp,
          "feeUnits": NSNumber(value: fee.feeUnits),
        ]
      } catch let error as AcpWalletException {
        throw mapWalletError(error)
      }
      #else
      throw Exceptions.NotImplemented(acpNativeAvailabilityMessage())
      #endif
    }

    AsyncFunction("signTransfer") { (rpcUrl: String, keystoreJson: String, toAddress: String, amountAcp: String, feeAcp: String?) -> [String: Any] in
      try requireAcpNativeLinked()
      #if canImport(acp_mobile_ffiFFI) && canImport(acp_mobile_ffi)
      do {
        let signed = try acpSignTransferFfi(
          rpcUrl: rpcUrl,
          keystoreJson: keystoreJson,
          toAddress: toAddress,
          amountAcp: amountAcp,
          feeAcp: feeAcp
        )
        return [
          "rawTx": signed.rawTx,
          "txid": signed.txid,
        ]
      } catch let error as AcpWalletException {
        throw mapWalletError(error)
      }
      #else
      throw Exceptions.NotImplemented(acpNativeAvailabilityMessage())
      #endif
    }
  }
}
