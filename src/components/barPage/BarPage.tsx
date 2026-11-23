import { IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import type { ReactNode } from 'react';
import { pageTitleProps, usePageBar } from './usePageBar';
import './barPage.css';

/** `tab-root`: a tab's first screen — its large title sits right under the status
 * bar / Dynamic Island, in the same row as the bar's buttons.
 * `detail`: a page whose art header runs under the status bar, with the Back
 * button floating over it on a legible pill. */
export type BarPageKind = 'tab-root' | 'detail';

/** How early (px) the bar starts to fill. A tab root's title already sits in the
 * bar's row, so it waits for the title; a detail page's title sits below its
 * art, so its bar fills as the title approaches (and a page too short to get
 * there fills over its last stretch of scroll — see endReveal). */
const REVEAL_LEAD: Record<BarPageKind, number> = { 'tab-root': 0, detail: 24 };

/** A page whose top bar floats over the content instead of taking a band of its
 * own. The bar starts clear and fades into a compact translucent bar with the
 * small title once the page's own title (`data-page-title`) scrolls under it. */
export function BarPage({
  kind,
  title,
  start,
  end,
  children,
}: {
  kind: BarPageKind;
  title: string;
  start?: ReactNode;
  end?: ReactNode;
  children: ReactNode;
}) {
  const bar = usePageBar(REVEAL_LEAD[kind]);
  return (
    <IonPage className={`bar-page bar-page--${kind}`}>
      <IonHeader ref={bar.ref} className="page-bar" data-bar="clear" data-testid="page-bar">
        <IonToolbar>
          {start && <IonButtons slot="start">{start}</IonButtons>}
          <IonTitle>{title}</IonTitle>
          {end && <IonButtons slot="end">{end}</IonButtons>}
        </IonToolbar>
      </IonHeader>
      <IonContent
        className="ion-padding"
        scrollEvents
        onIonScroll={bar.onScroll}
        onIonScrollEnd={bar.onScroll}
      >
        {kind === 'tab-root' && <TabTitle title={title} />}
        {children}
      </IonContent>
    </IonPage>
  );
}

/** The tab's large title — the page's real <h1>. */
function TabTitle({ title }: { title: string }) {
  return (
    <h1 className="bar-page__title cad-h1" data-testid="page-title" {...pageTitleProps}>
      {title}
    </h1>
  );
}
