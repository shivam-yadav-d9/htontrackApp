import { useCallback, useEffect, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';

/**
 * Warns the user before navigating away from a form with unsaved changes.
 * - On Android: intercepts the hardware back button.
 * - Call `markClean()` when the form is submitted or saved.
 * - Call `markDirty()` whenever the user edits a field.
 */
export function useUnsavedChanges(onDiscard?: () => void) {
  const isDirty = useRef(false);

  const markDirty = useCallback(() => { isDirty.current = true; }, []);
  const markClean = useCallback(() => { isDirty.current = false; }, []);

  const confirmDiscard = useCallback(
    (onConfirm: () => void) => {
      if (!isDirty.current) {
        onConfirm();
        return;
      }
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Discard them and go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              isDirty.current = false;
              onDiscard?.();
              onConfirm();
            },
          },
        ],
      );
    },
    [onDiscard],
  );

  // Android hardware back button intercept
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDirty.current) return false; // let default back happen
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Discard them and go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              isDirty.current = false;
              onDiscard?.();
              BackHandler.exitApp(); // can't programmatically go back; user must tap header
            },
          },
        ],
      );
      return true; // block default back
    });
    return () => sub.remove();
  }, [onDiscard]);

  return { markDirty, markClean, confirmDiscard, isDirty };
}
