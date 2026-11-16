// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { withoutTotalCount } from './listQuery';

describe('withoutTotalCount', () => {
  it('turns the total count off on list reads', () => {
    expect(withoutTotalCount('/Items?IncludeItemTypes=Audio', 'GET')).toBe(
      '/Items?IncludeItemTypes=Audio&EnableTotalRecordCount=false',
    );
    expect(withoutTotalCount('/Artists?Filters=IsFavorite', 'GET')).toContain(
      '&EnableTotalRecordCount=false',
    );
    expect(withoutTotalCount('/Users/u1/Items?SortBy=PlayCount', 'GET')).toContain(
      'EnableTotalRecordCount=false',
    );
    expect(withoutTotalCount('/Playlists/p1/Items?userId=u', 'GET')).toContain(
      'EnableTotalRecordCount=false',
    );
    expect(withoutTotalCount('/Items', 'GET')).toBe('/Items?EnableTotalRecordCount=false');
  });

  it('leaves writes, other endpoints and explicit choices alone', () => {
    expect(withoutTotalCount('/Items/abc', 'DELETE')).toBe('/Items/abc');
    expect(withoutTotalCount('/Sessions/Playing', 'POST')).toBe('/Sessions/Playing');
    expect(withoutTotalCount('/Users/Me', 'GET')).toBe('/Users/Me');
    expect(withoutTotalCount('/Cadence/Config', 'GET')).toBe('/Cadence/Config');
    expect(withoutTotalCount('/Items?EnableTotalRecordCount=true', 'GET')).toBe(
      '/Items?EnableTotalRecordCount=true',
    );
  });
});
