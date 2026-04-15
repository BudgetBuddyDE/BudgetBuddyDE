import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {TransactionAttachmentPreviewStrip} from './TransactionAttachmentPreviewStrip';

function makeAttachment(id: string): TAttachmentWithUrl {
  return {
    id: `01900000-0000-7000-8000-000000000${id}` as TAttachmentWithUrl['id'],
    ownerId: 'user-1' as TAttachmentWithUrl['ownerId'],
    fileName: `file-${id}.png`,
    fileExtension: 'png',
    contentType: 'image/png' as const,
    location: `path/${id}.png`,
    signedUrl: `https://example.com/${id}.png`,
    createdAt: new Date().toISOString(),
  };
}

describe('TransactionAttachmentPreviewStrip', () => {
  it.skip('renders up to two thumbnails and the remaining count', () => {
    render(
      <TransactionAttachmentPreviewStrip
        attachmentCount={4}
        previewLimit={2}
        attachments={[makeAttachment('one'), makeAttachment('two'), makeAttachment('three')]}
      />,
    );

    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByAltText('file-one.png')).toBeInTheDocument();
    expect(screen.getByAltText('file-two.png')).toBeInTheDocument();
    expect(screen.queryByAltText('file-three.png')).not.toBeInTheDocument();
  });

  it('does not render when there are no attachments', () => {
    const {container} = render(<TransactionAttachmentPreviewStrip attachmentCount={0} attachments={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
