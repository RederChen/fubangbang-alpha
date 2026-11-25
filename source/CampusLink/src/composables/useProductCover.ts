import { ref, type Ref } from 'vue';
import { uploadImage } from '../api/product';
import { errorMessage } from '../api/request';

const COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_BYTES = 5 * 1024 * 1024;

interface ProductCoverOptions {
  fileInputRef: Ref<HTMLInputElement | null>;
  isSubmitting: Readonly<Ref<boolean>>;
  error: Ref<string>;
}

export function useProductCover({ fileInputRef, isSubmitting, error }: ProductCoverOptions) {
  const photoList = ref<{ url: string }[]>([]);
  const uploading = ref(false);

  function isBusy() {
    return uploading.value || isSubmitting.value;
  }

  function setCover(url: string | null) {
    // The page decides which draft/product URLs are allowed. Preserve supplied
    // strings, including legacy empty values; null explicitly clears the cover.
    photoList.value = url === null ? [] : [{ url }];
  }

  function triggerFileInput() {
    if (!isBusy()) fileInputRef.value?.click();
  }

  async function onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Clear even a rejected selection so the same file can be selected again.
    input.value = '';
    if (isBusy()) return;
    if (!COVER_MIME_TYPES.includes(file.type) || file.size > MAX_COVER_BYTES) {
      error.value = '请选择 5 MB 以内的 JPEG、PNG 或 WebP 图片';
      return;
    }
    uploading.value = true;
    error.value = '';
    try {
      setCover(await uploadImage(file));
    } catch (cause) {
      error.value = errorMessage(cause);
    } finally {
      uploading.value = false;
    }
  }

  function removePhoto(index: number) {
    if (!isBusy()) photoList.value.splice(index, 1);
  }

  return {
    photoList,
    uploading,
    triggerFileInput,
    onFilesSelected,
    removePhoto,
    setCover,
  };
}
