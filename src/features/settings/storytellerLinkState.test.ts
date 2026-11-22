import { describe, expect, it } from 'vitest';
import { linkErrorMessage } from './storytellerLinkState';
import { HttpError, Unauthenticated } from '../../lib/jellyfinErrors';

describe('linkErrorMessage', () => {
  it('names bad credentials for a 401 (the fetch layer turns it into Unauthenticated)', () => {
    expect(linkErrorMessage(new Unauthenticated())).toBe('Wrong username or password.');
    expect(linkErrorMessage(new HttpError(401))).toBe('Wrong username or password.');
  });
  it('says Storyteller is unreachable for a 502', () => {
    expect(linkErrorMessage(new HttpError(502))).toMatch(/unreachable/);
  });
  it('explains a missing bridge for a 404', () => {
    expect(linkErrorMessage(new HttpError(404))).toMatch(/no Storyteller bridge/);
  });
  it('falls back to a generic retry message', () => {
    expect(linkErrorMessage(new Error('boom'))).toBe('Could not connect. Try again.');
    expect(linkErrorMessage(null)).toBe('Could not connect. Try again.');
  });
});
