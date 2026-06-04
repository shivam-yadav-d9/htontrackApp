import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '@/utils/storage';
import { api } from '@/services/api';
import { formatTime } from '@/utils/timeAgo';

const DRAFT_INTERVAL_MS = 12000; // 12 seconds

interface UseDraftOptions {
  formType: string;
  entityId?: string;
}

interface DraftState<T> {
  savedAt: string;       // "Draft saved at 6:42 PM" or ''
  hasDraft: boolean;
  loading: boolean;
}

function localKey(formType: string, entityId?: string) {
  return `draft_${formType}_${entityId ?? ''}`;
}

export function useDraft<T extends object>(
  { formType, entityId = '' }: UseDraftOptions,
  currentData: () => T,
  onRestore: (data: T) => void,
) {
  const [state, setState] = useState<DraftState<T>>({
    savedAt: '',
    hasDraft: false,
    loading: true,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const key = localKey(formType, entityId);

  // Load draft on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await storage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as { data: T; savedAt: string };
          onRestore(parsed.data);
          setState({ savedAt: `Draft saved at ${parsed.savedAt}`, hasDraft: true, loading: false });
          return;
        }
        // Try backend fallback
        try {
          const result = await api.get<{ draft_data: T; last_saved_at: string } | null>(
            `/drafts/${formType}?entity_id=${entityId}`
          );
          if (result) {
            onRestore(result.draft_data);
            setState({
              savedAt: `Draft saved at ${formatTime(result.last_saved_at)}`,
              hasDraft: true,
              loading: false,
            });
            return;
          }
        } catch {
          // backend unavailable — ok
        }
      } catch {
        // storage error
      }
      setState((s) => ({ ...s, loading: false }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback(async () => {
    const data = currentData();
    const savedAt = formatTime(new Date());
    const payload = JSON.stringify({ data, savedAt });
    try {
      await storage.setItem(key, payload);
      setState({ savedAt: `Draft saved at ${savedAt}`, hasDraft: true, loading: false });
      // Sync to backend (fire-and-forget)
      api.post('/drafts', { form_type: formType, entity_id: entityId, draft_data: data }).catch(() => {});
    } catch {
      // storage write failed — ignore
    }
  }, [currentData, key, formType, entityId]);

  const discardDraft = useCallback(async () => {
    try {
      await storage.removeItem(key);
      api.delete(`/drafts/${formType}?entity_id=${entityId}`).catch(() => {});
    } catch {
      // ignore
    }
    setState({ savedAt: '', hasDraft: false, loading: false });
  }, [key, formType, entityId]);

  // Auto-save timer
  const startAutoSave = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(saveDraft, DRAFT_INTERVAL_MS);
  }, [saveDraft]);

  const stopAutoSave = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { stopAutoSave(); };
  }, [stopAutoSave]);

  return { ...state, saveDraft, discardDraft, startAutoSave, stopAutoSave };
}
