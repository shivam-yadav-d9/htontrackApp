export const validators = {
  required: (value?: string) =>
    value?.trim() ? "" : "This field is required.",

  email: (value?: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "")
      ? ""
      : "Please enter a valid email address.",

  mobile: (value?: string) =>
    /^[6-9]\d{9}$/.test(value || "")
      ? ""
      : "Please enter a valid 10-digit Indian mobile number.",

  minLength: (value: string, min: number) =>
    value.trim().length >= min ? "" : `Minimum ${min} characters required.`,

  maxLength: (value: string, max: number) =>
    value.trim().length <= max ? "" : `Maximum ${max} characters allowed.`,

  fileType: (mimeType?: string) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    return mimeType && allowed.includes(mimeType)
      ? ""
      : "File must be PDF, JPG, PNG, or WEBP.";
  },

  fileSize: (size?: number) => {
    const maxSize = 5 * 1024 * 1024;
    return size && size <= maxSize ? "" : "File size must be less than 5 MB.";
  },
};
