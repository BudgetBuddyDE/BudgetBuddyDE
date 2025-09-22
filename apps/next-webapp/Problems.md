# Problems

## `<Drawer />`

- Sometimes the state can't be determined correctly
  ```
  ⨯ ReferenceError: window is not defined
      at getSavedState (src/components/Layout/Drawer/Drawer.store.ts:26:2)
      at eval (src/components/Layout/Drawer/Drawer.store.ts:12:8)
      at [project]/src/components/Layout/Drawer/Drawer.store.ts [app-ssr] (ecmascript) (src/components/Layout/Drawer/Drawer.store.ts:11:51)
      at [project]/src/components/Layout/Drawer/Drawer.tsx [app-ssr] (ecmascript) (src/components/Layout/Drawer/Drawer.tsx:6:0)
    24 |
    25 | function getSavedState() {
  > 26 |   if (!window) return true
      |  ^
    27 |   const state = window.localStorage.getItem('bb.sidebar.show');
    28 |   return state == null ? true : state == 'true';
    29 | } {
    digest: '1048807911'
  }
  ```

## `<EntityDrawer />`

- Sometimes the `shrink`-value is not correctly determined
  (See https://mui.com/material-ui/react-text-field/#shrink)

- Input `type="number"` doesn't work correctly on some devices
  (See https://mui.com/material-ui/react-text-field/#shrink)

- Default-value of `Autocomplete` doesn't work correctly
