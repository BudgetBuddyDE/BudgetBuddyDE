'use client';

import { StockPositionTable } from './StockPositionTable.component';

export const StockPositionTableWrapper = () => {
  return (
    <StockPositionTable
      // onAddPosition={handler.showCreateDialog}
      // onEditPosition={handler.showEditDialog}
      // onDeletePosition={(position) => {
      //   setShowDeletePositionDialog(true);
      //   setDeletePosition(position);
      // }}
      onAddPosition={() => {}}
      onEditPosition={() => {}}
      onDeletePosition={() => {}}
      withRedirect
    />
  );
};
