export const getDealUrl = (dealId: string): string =>
  `${window.location.origin}${window.location.pathname}#deal=${dealId}`;
