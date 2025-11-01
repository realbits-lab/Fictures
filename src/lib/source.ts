import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

console.log('[SOURCE] Initializing source loader');
console.log('[SOURCE] Docs object:', {
  hasDocs: !!docs,
  docsType: typeof docs,
  hasToFumadocsSource: typeof docs?.toFumadocsSource,
});

const fumadocsSource = docs.toFumadocsSource();
console.log('[SOURCE] Fumadocs source:', {
  hasSource: !!fumadocsSource,
  sourceType: typeof fumadocsSource,
});

export const source = loader({
  baseUrl: '/docs',
  source: fumadocsSource,
});

console.log('[SOURCE] Source loaded:', {
  hasPageTree: !!source.pageTree,
  pageTreeType: typeof source.pageTree,
  hasGetPage: typeof source.getPage,
  hasGenerateParams: typeof source.generateParams,
});
