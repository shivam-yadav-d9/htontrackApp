import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { RequiredLabel } from "./RequiredLabel";
import { FormErrorText } from "./FormErrorText";
import { CharacterCounter } from "./CharacterCounter";

interface FormFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  showCounter?: boolean;
  hint?: string;
}

export function FormField({
  label,
  required = false,
  error,
  maxLength,
  showCounter = false,
  hint,
  value,
  style,
  multiline,
  ...rest
}: FormFieldProps) {
  const len = value?.length ?? 0;

  return (
    <View style={styles.wrapper}>
      <RequiredLabel label={label} required={required} />
      <TextInput
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          error ? styles.inputError : styles.inputDefault,
          style,
        ]}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
      <View style={styles.footer}>
        <FormErrorText error={error} />
        {showCounter && maxLength ? (
          <CharacterCounter current={len} max={maxLength} />
        ) : null}
      </View>
      {hint && !error ? (
        <React.Fragment>
          {/* hint rendered only when no error */}
          <FormErrorText error={undefined} />
        </React.Fragment>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  inputDefault: {
    borderColor: "#D1D5DB",
  },
  inputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});
