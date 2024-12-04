export * from './SelectAll.component';

export interface ISelectionHandler<T> {
  onSelectAll: (shouldSelectAll: boolean) => void;
  onSelect: (entity: T) => void;
  isSelected: (entity: T) => boolean;
  onDeleteMultiple?: () => void;
}
