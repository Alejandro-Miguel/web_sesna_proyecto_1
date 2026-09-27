/* ==========================================================================
   Datos del prototipo
   --------------------------------------------------------------------------
   Única fuente de contenido. En producción esto vendrá del CMS / API.
   - Los títulos de categoría y los títulos de documento reales se conservan.
   - Todo el texto corrido (descripciones, síntesis) es lorem ipsum.
   - Los documentos marcados con `placeholder: true` necesitan título real.
   ========================================================================== */
(function () {
  'use strict';

  var LOREM_S = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.';
  var LOREM_M = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus, posuere velit aliquet. Curabitur blandit tempus porttitor.';
  var LOREM_L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis risus eget urna mollis ornare vel eu leo. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla, maecenas sed diam eget risus varius blandit sit amet non magna.';

  /*
   * tone  → color de la etiqueta y del panel de portada ('guinda' | 'verde')
   * cover → variante visual del libro ('navy' | 'verde' | 'guinda' | 'oro')
   * pdf   → URL del archivo (placeholder)
   * video → URL de embed (YouTube / Vimeo / MP4). Vacío = placeholder.
   */
  window.SITE_DATA = {
    categories: [
      {
        id: 'contrataciones-publicas',
        num: '01',
        title: 'Contrataciones públicas',
        lead: LOREM_M,
        docs: [
          { id: 'obra', tag: 'Documento técnico', tone: 'guinda', cover: 'navy',
            title: 'Análisis normativo nacional obra pública',
            year: '2025', pages: '91 páginas', pdf: 'docs/analisis-normativo-obra-publica.pdf', video: '', synth: LOREM_L },
          { id: 'variables', tag: 'Documento técnico', tone: 'guinda', cover: 'guinda',
            title: 'Propuesta de variables estratégicas para el seguimiento de las contrataciones públicas en México',
            year: '2020–2026', pages: '34 páginas', pdf: 'docs/variables-estrategicas.pdf', video: '', synth: LOREM_L }
        ]
      },
      {
        id: 'conflicto-de-interes',
        num: '02',
        title: 'Conflicto de interés',
        lead: LOREM_M,
        docs: [
          { id: 'ci-1', placeholder: true, tag: 'Diagnóstico', tone: 'guinda', cover: 'oro',
            title: 'Lorem ipsum dolor sit amet consectetur adipiscing elit',
            year: '2024', pages: '48 páginas', pdf: '#', video: '', synth: LOREM_L },
          { id: 'ci-2', placeholder: true, tag: 'Documento técnico', tone: 'guinda', cover: 'guinda',
            title: 'Lorem ipsum dolor sit amet, consectetur adipiscing',
            year: '2025', pages: '26 páginas', pdf: '#', video: '', synth: LOREM_L }
        ]
      },
      {
        id: 'verificacion-patrimonial',
        num: '03',
        title: 'Verificación patrimonial',
        lead: LOREM_M,
        docs: [
          { id: 'vp-1', placeholder: true, tag: 'Documento técnico', tone: 'guinda', cover: 'navy',
            title: 'Lorem ipsum dolor sit amet consectetur',
            year: '2025', pages: '62 páginas', pdf: '#', video: '', synth: LOREM_L },
          { id: 'vp-2', placeholder: true, tag: 'Guía', tone: 'verde', cover: 'verde',
            title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do',
            year: '2023', pages: '', pdf: '#', video: '', synth: LOREM_L }
        ]
      },
      {
        id: 'deporte',
        num: '04',
        title: 'Deporte',
        lead: LOREM_M,
        docs: [
          { id: 'deporte', tag: 'Informe', tone: 'verde', cover: 'verde',
            title: 'Informe de resultados. Herramienta de autodiagnóstico de integridad y anticorrupción para el sector deporte',
            year: '2022–2025', pages: '', pdf: 'docs/informe-autodiagnostico-deporte.pdf', video: '', synth: LOREM_L },
          { id: 'dep-2', placeholder: true, tag: 'Guía', tone: 'guinda', cover: 'oro',
            title: 'Lorem ipsum dolor sit amet consectetur adipiscing',
            year: '2025', pages: '18 páginas', pdf: '#', video: '', synth: LOREM_L }
        ]
      }
    ],
    lorem: { s: LOREM_S, m: LOREM_M, l: LOREM_L }
  };
})();
