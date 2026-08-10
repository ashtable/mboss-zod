import { describe, expect, it } from 'vitest';

import * as mbossZod from './index.js';

describe('@mboss/zod entrypoint', () => {
  it('is importable', () => {
    expect(mbossZod).toBeTypeOf('object');
  });
});
