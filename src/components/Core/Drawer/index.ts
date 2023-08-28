export function getSavedSidebarState() {
  const saved = localStorage.getItem('bb.sidebar.show');
  return saved == null ? true : saved == 'true';
}

export function saveSidebarState(state: boolean) {
  return localStorage.setItem('bb.sidebar.show', state.toString());
}
