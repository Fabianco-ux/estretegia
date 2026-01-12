export function isEmbedMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('embed') === '1';
  } catch (_) {
    return false;
  }
}
