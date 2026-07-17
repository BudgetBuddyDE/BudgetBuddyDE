import {describe, expect, it} from 'vitest';
import {validateAttachmentFiles} from './attachment-mutations';

describe('attachment validation', () => {
  it('accepts supported receipt images within limits', () => {
    expect(validateAttachmentFiles([new File(['image'], 'receipt.png', {type: 'image/png'})])).toBeUndefined();
  });
  it('rejects unsafe types, excessive sizes, and excessive counts', () => {
    expect(validateAttachmentFiles([new File(['text'], 'receipt.txt', {type: 'text/plain'})])).toContain('Only');
    const oversized = new File(['x'], 'large.jpg', {type: 'image/jpeg'});
    Object.defineProperty(oversized, 'size', {value: 21 * 1024 * 1024});
    expect(validateAttachmentFiles([oversized])).toContain('20 MB');
    expect(
      validateAttachmentFiles(
        Array.from({length: 11}, (_, index) => new File(['x'], `${index}.png`, {type: 'image/png'})),
      ),
    ).toContain('at most 10');
  });
});
