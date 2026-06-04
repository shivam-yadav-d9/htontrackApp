import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FileText, Image as ImageIcon, X } from "lucide-react-native";

interface FilePreviewCardProps {
  name: string;
  size?: number;
  mimeType?: string;
  onRemove?: () => void;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType?: string) {
  return mimeType?.startsWith("image/") ?? false;
}

export function FilePreviewCard({ name, size, mimeType, onRemove }: FilePreviewCardProps) {
  const Icon = isImage(mimeType) ? ImageIcon : FileText;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon size={20} color="#123C69" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {size ? <Text style={styles.size}>{formatSize(size)}</Text> : null}
      </View>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.remove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    borderWidth: 1.5,
    borderColor: "#C7D7F5",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E3A5F",
  },
  size: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  remove: {
    padding: 4,
  },
});
