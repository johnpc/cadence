import { BarPage } from '../../components/barPage/BarPage';
import { Audiobooks } from './Audiobooks';

/** The Books tab: the audiobook library, under its large "Books" title. */
export function AudiobooksPage() {
  return (
    <BarPage kind="tab-root" title="Books">
      <Audiobooks />
    </BarPage>
  );
}
