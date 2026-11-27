const ADN_PROJECT_ID = 'adn-e2e-project';

const EXTRA_SERVICES = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    nomenclatura: `EXTRA${number}`,
    nombreOriginal: `Servicio extra ${number}`,
    aliases: [`extra${number}`],
    tipoCobro: 'unidad'
  };
});

const ADN_SERVICES = [
  {
    nomenclatura: 'SENCHACURVA',
    nombreOriginal: 'ENCHAPE CURVO',
    aliases: ['sencha curva'],
    tipoCobro: 'unidad'
  },
  {
    nomenclatura: 'CSCURVA1',
    nombreOriginal: 'CURVA',
    aliases: ['curva'],
    tipoCobro: 'unidad'
  },
  {
    nomenclatura: 'SRNAR000',
    nombreOriginal: 'NARIZ',
    aliases: ['nariz', 'nar', 'narices'],
    tipoCobro: 'unidad'
  },
  ...EXTRA_SERVICES
];

const extraDetails = (first, last) => Array.from(
  { length: last - first + 1 },
  (_, index) => `extra${String(first + index).padStart(2, '0')}`
).join(' ');

const ADN_ROWS = [
  {
    id: 'row_1001',
    cant: '1',
    largo: '800',
    ancho: '300',
    detalle: 'base D1-005 pieza sencha curva + curva',
    rotar: '',
    l1: '',
    l2: '',
    a1: '',
    a2: ''
  },
  {
    id: 'row_1002',
    cant: '1',
    largo: '700',
    ancho: '300',
    detalle: 'entrepaño D1-005 curvado naranja',
    rotar: '',
    l1: '',
    l2: '',
    a1: '',
    a2: ''
  },
  {
    id: 'row_1003',
    cant: '1',
    largo: '600',
    ancho: '300',
    detalle: `refuerzo D1-005 pieza ${extraDetails(1, 6)}`,
    rotar: '',
    l1: '',
    l2: '',
    a1: '',
    a2: ''
  },
  {
    id: 'row_1004',
    cant: '1',
    largo: '500',
    ancho: '250',
    detalle: `pieza libre curvado naranja ${extraDetails(7, 7)}`,
    rotar: '',
    l1: '',
    l2: '',
    a1: '',
    a2: ''
  },
  {
    id: 'row_1005',
    cant: '1',
    largo: '900',
    ancho: '350',
    detalle: `base D2-010 pieza 2Lcurva ${extraDetails(8, 8)}`,
    rotar: '',
    l1: '',
    l2: '',
    a1: '',
    a2: ''
  },
  {
    id: 'row_1006',
    cant: '1',
    largo: '850',
    ancho: '350',
    detalle: `lateral D2-010 pieza curva ${extraDetails(9, 10)}`,
    rotar: '',
    l1: '',
    l2: '',
    a1: '',
    a2: ''
  },
  {
    id: 'row_1007',
    cant: '1',
    largo: '750',
    ancho: '350',
    detalle: `entrepaño D2-010 pieza ${extraDetails(11, 12)}`,
    rotar: '',
    l1: '',
    l2: '',
    a1: '',
    a2: ''
  }
];

const POSITIVE_SERVICE_NOMENCLATURES = [
  'SENCHACURVA',
  'CSCURVA1',
  ...EXTRA_SERVICES.map((service) => service.nomenclatura)
];

const createAdnProjectData = (userId) => ({
  proyecto: 'Proyecto ADN E2E',
  cliente: 'Cliente ADN E2E',
  fechaCreacion: '01/01/2024',
  ultimaModificacion: 1704067200000,
  ultimaModificacionStr: '01/01/2024 00:00',
  userId,
  moduleDetectionConfig: {
    designPrefixes: ['D'],
    groupIdPosition: 'afterDesign'
  },
  despieces: [
    {
      id: 'tab_e2e_primary',
      nombre: 'Mueble Principal',
      filas: ADN_ROWS,
      superGroups: []
    }
  ],
  serviciosGuardados: ADN_SERVICES
});

module.exports = {
  ADN_PROJECT_ID,
  ADN_ROWS,
  ADN_SERVICES,
  POSITIVE_SERVICE_NOMENCLATURES,
  createAdnProjectData
};
