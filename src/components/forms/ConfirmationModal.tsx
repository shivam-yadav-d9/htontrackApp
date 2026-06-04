import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { AlertTriangle, CheckCircle, Info } from "lucide-react-native";

type ModalVariant = "confirm" | "success" | "warning" | "danger";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<ModalVariant, { icon: React.ReactNode; color: string; btnBg: string }> = {
  confirm: {
    icon: <Info size={28} color="#123C69" />,
    color: "#123C69",
    btnBg: "#E87525",
  },
  success: {
    icon: <CheckCircle size={28} color="#059669" />,
    color: "#059669",
    btnBg: "#059669",
  },
  warning: {
    icon: <AlertTriangle size={28} color="#D97706" />,
    color: "#D97706",
    btnBg: "#D97706",
  },
  danger: {
    icon: <AlertTriangle size={28} color="#DC2626" />,
    color: "#DC2626",
    btnBg: "#DC2626",
  },
};

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "confirm",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={[styles.iconWrap, { backgroundColor: config.color + "18" }]}>
                {config.icon}
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
                  <Text style={styles.cancelLabel}>{cancelLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: config.btnBg }]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmLabel}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
