import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { CameraView, scanFromURLAsync, useCameraPermissions } from "expo-camera";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  SmartPayCapabilities,
  SmartPayExecution,
  SmartPayPaymentIntent,
  SmartPayQuote,
  SmartPayReceipt,
} from "@ancap/acp-api-client";
import { safeErrorMessage } from "@ancap/acp-wallet-sdk";
import { getApi } from "@/lib/api";
import {
  clearSmartPayHistory,
  loadSmartPayHistory,
  saveSmartPayHistoryEntry,
  type SmartPayHistoryEntry,
} from "@/lib/smart-pay-history";
import {
  clearSmartPaySession,
  loadSmartPaySession,
  saveSmartPaySession,
} from "@/lib/smart-pay-session";

export default function SmartPayScreen() {
  const [capabilities, setCapabilities] = useState<SmartPayCapabilities | null>(null);
  const [rawPayload, setRawPayload] = useState("");
  const [payloadSource, setPayloadSource] = useState<"camera" | "photo" | "paste" | "share">("paste");
  const [selectedAsset, setSelectedAsset] = useState("ACP");
  const [loadingCapabilities, setLoadingCapabilities] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [intent, setIntent] = useState<SmartPayPaymentIntent | null>(null);
  const [quote, setQuote] = useState<SmartPayQuote | null>(null);
  const [execution, setExecution] = useState<SmartPayExecution | null>(null);
  const [receipt, setReceipt] = useState<SmartPayReceipt | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAccepted, setConfirmationAccepted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<SmartPayHistoryEntry[]>([]);

  const supportedSymbols = useMemo(() => {
    const fromApi = capabilities?.supportedAssets?.map((item) => item.symbol).filter(Boolean) ?? [];
    const uniq = Array.from(new Set(fromApi));
    return uniq.length > 0 ? uniq : ["ACP", "wACP", "USDT"];
  }, [capabilities]);

  useEffect(() => {
    void (async () => {
      try {
        const [result, persisted, persistedHistory] = await Promise.all([
          getApi().getSmartPayCapabilities(),
          loadSmartPaySession(),
          loadSmartPayHistory(),
        ]);
        setCapabilities(result);
        setHistory(persistedHistory);
        if (persisted) {
          setRawPayload(persisted.rawPayload || "");
          setPayloadSource(persisted.payloadSource || "paste");
          setSelectedAsset(persisted.selectedAsset || "ACP");
          setIntent(persisted.intent ?? null);
          setQuote(persisted.quote ?? null);
          setExecution(persisted.execution ?? null);
          setReceipt(persisted.receipt ?? null);
          setShowConfirmation(false);
          setConfirmationAccepted(false);
        }
      } catch (e) {
        setError(safeErrorMessage(e, "Failed to load Smart Pay capabilities"));
      } finally {
        setLoadingCapabilities(false);
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!supportedSymbols.includes(selectedAsset)) {
      setSelectedAsset(supportedSymbols[0] ?? "ACP");
    }
  }, [selectedAsset, supportedSymbols]);

  useEffect(() => {
    if (!hydrated) return;
    void saveSmartPaySession({
      rawPayload,
      payloadSource,
      selectedAsset,
      intent,
      quote,
      execution,
      receipt,
    });
  }, [hydrated, rawPayload, payloadSource, selectedAsset, intent, quote, execution, receipt]);

  const onPaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text?.trim()) {
      setPayloadSource("paste");
      setRawPayload(text.trim());
    }
  };

  const onOpenCamera = async () => {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert("Smart Pay", "Camera permission is required to scan QR codes.");
        return;
      }
    }
    setShowCamera(true);
  };

  const onPickFromGallery = async () => {
    try {
      setBusy(true);
      setError("");
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Smart Pay", "Photo library permission is required to import QR images.");
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      if (!asset?.uri) throw new Error("Selected image has no URI");
      const scans = await scanFromURLAsync(asset.uri, ["qr"]);
      const first = scans.find((item) => typeof item.data === "string" && item.data.trim());
      if (!first?.data) {
        throw new Error("No QR code found in selected image");
      }
      setPayloadSource("photo");
      setRawPayload(first.data.trim());
    } catch (e) {
      setError(safeErrorMessage(e, "Gallery import failed"));
    } finally {
      setBusy(false);
    }
  };

  const onCameraScanned = ({ data }: { data: string }) => {
    const value = (data || "").trim();
    if (!value) return;
    setPayloadSource("camera");
    setRawPayload(value);
    setShowCamera(false);
  };

  const onResetConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationAccepted(false);
    setExecution(null);
    setReceipt(null);
  };

  const onClearSession = async () => {
    setRawPayload("");
    setPayloadSource("paste");
    setSelectedAsset(supportedSymbols[0] ?? "ACP");
    setIntent(null);
    setQuote(null);
    setExecution(null);
    setReceipt(null);
    setShowConfirmation(false);
    setConfirmationAccepted(false);
    setError("");
    await clearSmartPaySession();
  };

  const onClearHistory = async () => {
    setHistory([]);
    await clearSmartPayHistory();
  };

  const onResumeHistoryEntry = (entry: SmartPayHistoryEntry) => {
    setRawPayload(entry.intent.rawPayload || "");
    setPayloadSource(entry.intent.source);
    setSelectedAsset(entry.quote?.sourceAsset.symbol || entry.intent.asset.symbol || "ACP");
    setIntent(entry.intent);
    setQuote(entry.quote ?? null);
    setExecution(entry.execution);
    setReceipt(entry.receipt ?? null);
    setShowConfirmation(false);
    setConfirmationAccepted(false);
    setError("");
  };

  const onOpenConfirmation = () => {
    if (!intent || !quote) {
      Alert.alert("Smart Pay", "Get a quote first.");
      return;
    }
    setShowConfirmation(true);
    setConfirmationAccepted(false);
    setExecution(null);
    setReceipt(null);
  };

  const onParse = async () => {
    if (!rawPayload.trim()) {
      Alert.alert("Smart Pay", "Paste or enter a QR payload first.");
      return;
    }
    setBusy(true);
    setError("");
    setQuote(null);
    setExecution(null);
    setReceipt(null);
    setShowConfirmation(false);
    setConfirmationAccepted(false);
    try {
      const result = await getApi().parseSmartQr({
        source: payloadSource,
        rawPayload: rawPayload.trim(),
      });
      setIntent(result.paymentIntent);
    } catch (e) {
      setIntent(null);
      setError(safeErrorMessage(e, "Parse failed"));
    } finally {
      setBusy(false);
    }
  };

  const onQuote = async () => {
    if (!intent) {
      Alert.alert("Smart Pay", "Parse a payment intent first.");
      return;
    }
    setBusy(true);
    setError("");
    setExecution(null);
    setReceipt(null);
    setShowConfirmation(false);
    setConfirmationAccepted(false);
    try {
      const result = await getApi().quoteSmartPay({
        paymentIntentId: intent.id,
        sourcePreference: {
          preferredAsset: selectedAsset,
          allowedAssets: supportedSymbols,
          maxSlippageBps: 150,
          minAcpFeeReserve: capabilities?.minAcpFeeReserve ?? "1.0",
        },
      });
      setQuote(result.quote);
    } catch (e) {
      setQuote(null);
      setError(safeErrorMessage(e, "Quote failed"));
    } finally {
      setBusy(false);
    }
  };

  const onExecute = async () => {
    if (!intent || !quote) {
      Alert.alert("Smart Pay", "Get a quote first.");
      return;
    }
    if (!showConfirmation || !confirmationAccepted) {
      Alert.alert("Smart Pay", "Review and explicitly accept payment details before execute.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await getApi().executeSmartPay({
        paymentIntentId: intent.id,
        quoteId: quote.quoteId,
        confirmationAccepted,
        deviceContext: {
          platform: Platform.OS === "ios" ? "ios" : "android",
          appVersion: null,
        },
      });
      const receiptResult = await getApi().getSmartPayReceipt(result.execution.id);
      setExecution(result.execution);
      setReceipt(receiptResult);
      setHistory(
        await saveSmartPayHistoryEntry({
          id: result.execution.id,
          savedAt: new Date().toISOString(),
          intent,
          quote,
          execution: result.execution,
          receipt: receiptResult,
        })
      );
      setShowConfirmation(false);
      setConfirmationAccepted(false);
    } catch (e) {
      setError(safeErrorMessage(e, "Execute failed"));
    } finally {
      setBusy(false);
    }
  };

  const onRefreshExecution = async () => {
    if (!execution) return;
    setBusy(true);
    setError("");
    try {
      const [result, receiptResult] = await Promise.all([
        getApi().getSmartPayExecution(execution.id),
        getApi().getSmartPayReceipt(execution.id),
      ]);
      setExecution(result.execution);
      setReceipt(receiptResult);
      if (intent) {
        setHistory(
          await saveSmartPayHistoryEntry({
            id: result.execution.id,
            savedAt: new Date().toISOString(),
            intent,
            quote,
            execution: result.execution,
            receipt: receiptResult,
          })
        );
      }
    } catch (e) {
      setError(safeErrorMessage(e, "Refresh failed"));
    } finally {
      setBusy(false);
    }
  };

  const onRecover = async () => {
    if (!execution) return;
    setBusy(true);
    setError("");
    try {
      const result = await getApi().recoverSmartPay(execution.id, { clientKnownTxs: [] });
      const receiptResult = await getApi().getSmartPayReceipt(execution.id);
      setExecution(result.execution);
      setReceipt(receiptResult);
      if (intent) {
        setHistory(
          await saveSmartPayHistoryEntry({
            id: result.execution.id,
            savedAt: new Date().toISOString(),
            intent,
            quote,
            execution: result.execution,
            receipt: receiptResult,
          })
        );
      }
    } catch (e) {
      setError(safeErrorMessage(e, "Recover failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart Pay beta</Text>
      <Text style={styles.subtitle}>
        Minimal app wiring for the new Smart QR flow: paste payload → parse → quote → execute → refresh.
      </Text>
      <View style={styles.topActions}>
        <Pressable style={styles.secondary} onPress={onClearSession} disabled={busy}>
          <Text style={styles.secondaryText}>Reset session</Text>
        </Pressable>
      </View>

      {history.length ? (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.label}>Recent Smart Pay sessions</Text>
            <Pressable onPress={onClearHistory} disabled={busy}>
              <Text style={styles.inlineAction}>Clear history</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>Local device-only snapshots of recent execute/refresh/recover sessions.</Text>
          {history.map((entry) => (
            <Pressable
              key={entry.id}
              style={styles.historyItem}
              onPress={() => onResumeHistoryEntry(entry)}
            >
              <Text style={styles.historyTitle}>
                {entry.execution.status} · {entry.quote?.targetAmount ?? entry.intent.amount?.value ?? "—"} {entry.quote?.targetAsset.symbol ?? entry.intent.asset.symbol ?? "asset"}
              </Text>
              <Text style={styles.meta}>Recipient: {entry.intent.recipient.address}</Text>
              <Text style={styles.meta}>Execution: {entry.execution.id}</Text>
              <Text style={styles.meta}>Saved: {entry.savedAt}</Text>
              <Text style={styles.inlineHint}>Tap to restore this payment context.</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Capabilities</Text>
        {hydrated && (intent || quote || execution || rawPayload.trim()) ? (
          <Text style={styles.persistedNote}>Restored Smart Pay draft/session from secure device storage.</Text>
        ) : null}
        {loadingCapabilities ? (
          <ActivityIndicator color="#6ee7b7" />
        ) : (
          <>
            <Text style={styles.meta}>Enabled: {capabilities?.enabled ? "yes" : "no"}</Text>
            <Text style={styles.meta}>Networks: {capabilities?.supportedNetworks?.join(", ") || "—"}</Text>
            <Text style={styles.meta}>Assets: {supportedSymbols.join(", ")}</Text>
            <Text style={styles.meta}>Max slippage: {capabilities?.maxSlippageBps ?? "—"} bps</Text>
            <Text style={styles.meta}>ACP fee reserve: {capabilities?.minAcpFeeReserve ?? "—"}</Text>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>QR / payment payload</Text>
        <TextInput
          style={[styles.input, styles.payloadInput]}
          multiline
          value={rawPayload}
          onChangeText={(value) => {
            setPayloadSource("paste");
            setRawPayload(value);
          }}
          autoCapitalize="none"
          placeholder="Paste ACP URI, address, or EIP-681 payload"
          placeholderTextColor="#64748b"
        />
        <View style={styles.rowWrap}>
          <Pressable style={styles.secondary} onPress={onPaste} disabled={busy}>
            <Text style={styles.secondaryText}>Paste from clipboard</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onPickFromGallery} disabled={busy}>
            <Text style={styles.secondaryText}>Import QR image</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onOpenCamera} disabled={busy}>
            <Text style={styles.secondaryText}>Scan with camera</Text>
          </Pressable>
          <Pressable style={styles.primary} onPress={onParse} disabled={busy}>
            <Text style={styles.primaryText}>Parse</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Preferred source asset</Text>
        <View style={styles.chips}>
          {supportedSymbols.map((symbol) => {
            const active = symbol === selectedAsset;
            return (
              <Pressable
                key={symbol}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedAsset(symbol)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{symbol}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.primary} onPress={onQuote} disabled={busy || !intent}>
          <Text style={styles.primaryText}>Get quote</Text>
        </Pressable>
      </View>

      {intent ? (
        <View style={styles.card}>
          <Text style={styles.label}>Parsed payment intent</Text>
          <Text style={styles.value}>{intent.status} · {intent.network}</Text>
          <Text style={styles.meta}>Asset: {intent.asset.symbol || "unknown"}</Text>
          <Text style={styles.meta}>Recipient: {intent.recipient.address}</Text>
          <Text style={styles.meta}>Amount: {intent.amount?.value ?? "—"}</Text>
          <Text style={styles.meta}>Parse method: {intent.parseMethod}</Text>
          {intent.memo?.value ? <Text style={styles.meta}>Memo: {intent.memo.value}</Text> : null}
          {intent.warnings.length ? <Text style={styles.warning}>Warnings: {intent.warnings.join(" · ")}</Text> : null}
          {intent.riskFlags.length ? <Text style={styles.warning}>Risk flags: {intent.riskFlags.join(" · ")}</Text> : null}
        </View>
      ) : null}

      {quote ? (
        <View style={styles.card}>
          <Text style={styles.label}>Quote</Text>
          <Text style={styles.value}>{quote.mode}</Text>
          <Text style={styles.meta}>Source: {quote.requiredSourceAmount} {quote.sourceAsset.symbol}</Text>
          <Text style={styles.meta}>Target: {quote.targetAmount} {quote.targetAsset.symbol}</Text>
          <Text style={styles.meta}>Service fee: {quote.serviceFeeAcp} ACP</Text>
          <Text style={styles.meta}>Expires: {quote.expiresAt}</Text>
          {quote.networkFee.map((item, index) => (
            <Text key={`${item.network}-${item.assetSymbol}-${index}`} style={styles.meta}>
              Network fee: {item.amount} {item.assetSymbol} on {item.network}
            </Text>
          ))}
          {quote.route.map((step, index) => (
            <Text key={`${step.kind}-${index}`} style={styles.meta}>
              Route {index + 1}: {step.kind} {step.fromAsset} → {step.toAsset} ({step.network})
            </Text>
          ))}
          <Pressable style={styles.primary} onPress={onOpenConfirmation} disabled={busy}>
            <Text style={styles.primaryText}>Review confirmation</Text>
          </Pressable>
        </View>
      ) : null}

      {showConfirmation && intent && quote ? (
        <View style={[styles.card, styles.confirmCard]}>
          <Text style={styles.label}>Confirmation required</Text>
          <Text style={styles.value}>Review before execute</Text>
          <Text style={styles.meta}>Destination: {intent.recipient.address}</Text>
          <Text style={styles.meta}>Target asset: {quote.targetAsset.symbol} on {quote.targetAsset.network}</Text>
          <Text style={styles.meta}>Target amount: {quote.targetAmount}</Text>
          <Text style={styles.meta}>Source spend: {quote.requiredSourceAmount} {quote.sourceAsset.symbol}</Text>
          <Text style={styles.meta}>Service fee: {quote.serviceFeeAcp} ACP</Text>
          <Text style={styles.meta}>Max slippage: {quote.slippageBps} bps</Text>
          {intent.memo?.value ? <Text style={styles.meta}>Memo: {intent.memo.value}</Text> : null}
          {quote.networkFee.map((item, index) => (
            <Text key={`confirm-fee-${item.network}-${item.assetSymbol}-${index}`} style={styles.meta}>
              Network fee: {item.amount} {item.assetSymbol} on {item.network}
            </Text>
          ))}
          {quote.route.map((step, index) => (
            <Text key={`confirm-route-${step.kind}-${index}`} style={styles.meta}>
              Route {index + 1}: {step.kind} {step.fromAsset} → {step.toAsset} via {step.network}
            </Text>
          ))}
          {quote.warnings.length ? <Text style={styles.warning}>Quote warnings: {quote.warnings.join(" · ")}</Text> : null}
          {quote.riskFlags.length ? <Text style={styles.warning}>Quote risk flags: {quote.riskFlags.join(" · ")}</Text> : null}
          {intent.warnings.length ? <Text style={styles.warning}>Intent warnings: {intent.warnings.join(" · ")}</Text> : null}
          <Pressable
            style={[styles.confirmToggle, confirmationAccepted && styles.confirmToggleActive]}
            onPress={() => setConfirmationAccepted((current) => !current)}
          >
            <Text style={[styles.confirmToggleText, confirmationAccepted && styles.confirmToggleTextActive]}>
              {confirmationAccepted ? "Accepted: destination, amount, fees, and route" : "Tap to accept destination, amount, fees, and route"}
            </Text>
          </Pressable>
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={onResetConfirmation} disabled={busy}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={onExecute} disabled={busy || !confirmationAccepted}>
              <Text style={styles.primaryText}>Execute</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {execution ? (
        <View style={styles.card}>
          <Text style={styles.label}>Execution session</Text>
          <Text style={styles.value}>{execution.status}</Text>
          <Text style={styles.meta}>Execution ID: {execution.id}</Text>
          <Text style={styles.meta}>Recoverable: {execution.recoverable ? "yes" : "no"}</Text>
          <Text style={styles.meta}>Next action: {execution.nextAction || "—"}</Text>
          <Text style={styles.meta}>Updated: {execution.updatedAt}</Text>
          {execution.txRefs.map((tx) => (
            <Text key={`${tx.role}-${tx.txid}`} style={styles.meta}>
              {tx.role}: {tx.txid}
            </Text>
          ))}
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={onRefreshExecution} disabled={busy}>
              <Text style={styles.secondaryText}>Refresh status</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={onRecover} disabled={busy}>
              <Text style={styles.secondaryText}>Recover</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {execution && intent ? (
        <View style={styles.card}>
          <Text style={styles.label}>Receipt snapshot</Text>
          <Text style={styles.value}>{receipt?.targetAmountPaid ?? quote?.targetAmount ?? intent.amount?.value ?? "—"} {receipt?.targetAssetPaid ?? quote?.targetAsset.symbol ?? intent.asset.symbol ?? "asset"}</Text>
          <Text style={styles.meta}>Recipient: {receipt?.recipientAddress ?? intent.recipient.address}</Text>
          <Text style={styles.meta}>Source asset: {receipt?.sourceAssetSpent ?? quote?.sourceAsset.symbol ?? selectedAsset}</Text>
          <Text style={styles.meta}>Source spend: {receipt?.sourceAmountSpent ?? quote?.requiredSourceAmount ?? "—"}</Text>
          <Text style={styles.meta}>Service fee: {receipt?.serviceFeeAcp ?? quote?.serviceFeeAcp ?? "—"} ACP</Text>
          <Text style={styles.meta}>Receipt status: {execution.status}</Text>
          {receipt?.completedAt ? <Text style={styles.meta}>Completed at: {receipt.completedAt}</Text> : null}
          {receipt?.merchantLabel ? <Text style={styles.meta}>Merchant: {receipt.merchantLabel}</Text> : null}
          {execution.error ? <Text style={styles.warning}>Execution error: {execution.error}</Text> : null}
          {receipt?.routeSummary?.length ? receipt.routeSummary.map((line, index) => (
            <Text key={`receipt-route-${index}`} style={styles.meta}>
              {line}
            </Text>
          )) : quote?.route?.length ? quote.route.map((step, index) => (
            <Text key={`receipt-route-fallback-${step.kind}-${index}`} style={styles.meta}>
              Step {index + 1}: {step.kind} {step.fromAsset} → {step.toAsset} via {step.network}
            </Text>
          )) : null}
          {receipt?.networkFees?.length ? receipt.networkFees.map((fee, index) => (
            <Text key={`receipt-fee-${fee.network}-${fee.assetSymbol}-${index}`} style={styles.meta}>
              Network fee: {fee.amount} {fee.assetSymbol} on {fee.network}
            </Text>
          )) : null}
          {(receipt?.txRefs?.length ? receipt.txRefs : execution.txRefs).length ? (receipt?.txRefs ?? execution.txRefs).map((tx) => (
            <Text key={`receipt-${tx.role}-${tx.txid}`} style={styles.meta}>
              {tx.role} tx: {tx.txid}
            </Text>
          )) : <Text style={styles.meta}>No tx references reported yet.</Text>}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? <ActivityIndicator color="#6ee7b7" style={{ marginTop: 12 }} /> : null}

      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scan QR</Text>
            <Pressable style={styles.modalClose} onPress={() => setShowCamera(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => onCameraScanned({ data })}
          />
          <Text style={styles.modalHint}>Point camera at ACP / EIP-681 QR code.</Text>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: "#94a3b8", lineHeight: 20, marginBottom: 20 },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderColor: "#1e293b",
    borderWidth: 1,
  },
  confirmCard: {
    borderColor: "#f59e0b",
  },
  label: { color: "#94a3b8", marginBottom: 8 },
  value: { color: "#6ee7b7", fontSize: 18, fontWeight: "600", marginBottom: 8 },
  meta: { color: "#cbd5e1", marginTop: 4, fontSize: 13 },
  warning: { color: "#fbbf24", marginTop: 8, fontSize: 13 },
  persistedNote: { color: "#93c5fd", marginBottom: 10, fontSize: 13 },
  input: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    color: "#f5f7ff",
    padding: 12,
  },
  payloadInput: { minHeight: 120, textAlignVertical: "top" },
  topActions: { marginBottom: 16 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  rowWrap: { flexDirection: "row", gap: 12, marginTop: 12, flexWrap: "wrap" },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  chipText: { color: "#cbd5e1", fontWeight: "600" },
  chipTextActive: { color: "#042f1a" },
  historyItem: {
    marginTop: 12,
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#0b1220",
  },
  historyTitle: { color: "#f8fafc", fontWeight: "700", marginBottom: 6 },
  inlineAction: { color: "#93c5fd", fontWeight: "600" },
  inlineHint: { color: "#94a3b8", marginTop: 6, fontSize: 12 },
  confirmToggle: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#0f172a",
  },
  confirmToggleActive: {
    borderColor: "#10b981",
    backgroundColor: "#052e25",
  },
  confirmToggleText: {
    color: "#e2e8f0",
    textAlign: "center",
    fontWeight: "600",
  },
  confirmToggleTextActive: {
    color: "#6ee7b7",
  },
  secondary: {
    flex: 1,
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryText: { color: "#f5f7ff", textAlign: "center", fontWeight: "600" },
  primary: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryText: { color: "#042f1a", textAlign: "center", fontWeight: "700" },
  error: { color: "#f87171", marginTop: 8 },
  modalContainer: { flex: 1, backgroundColor: "#020617", paddingTop: 56, paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "700" },
  modalClose: {
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCloseText: { color: "#f8fafc", fontWeight: "600" },
  camera: { flex: 1, borderRadius: 16, overflow: "hidden" },
  modalHint: { color: "#94a3b8", marginTop: 16, marginBottom: 24, textAlign: "center" },
});
