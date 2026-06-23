export type PlaceCategory =
  | "cotidiano"
  | "absurdo"
  | "colombiano"
  | "historico"
  | "aleatorio";

export const PLACE_CATEGORIES: { id: PlaceCategory; label: string }[] = [
  { id: "cotidiano", label: "Lugares cotidianos" },
  { id: "absurdo", label: "Lugares absurdos" },
  { id: "colombiano", label: "Lugares colombianos" },
  { id: "historico", label: "Lugares históricos" },
  { id: "aleatorio", label: "Aleatorio total" },
];

const COTIDIANOS = [
  "Transmilenio", "Tienda de barrio", "Plaza de mercado", "Discoteca", "Iglesia",
  "Aeropuerto", "Centro comercial", "Peluquería", "Hospital", "Restaurante",
  "Universidad", "Colegio", "Gimnasio", "Oficina pública", "Notaría",
  "Parqueadero", "Banco", "Farmacia", "Panadería", "Carnicería",
];

const ABSURDOS = [
  "Cárcel", "Motel", "Cementerio", "Estación de policía", "Finca abandonada",
  "Bodega secreta", "Túnel clandestino", "Avión aterrizando de emergencia",
  "Búnker bajo tierra", "Fábrica de confeti", "Museo de cosas raras",
  "Oficina de aduanas a las 3am", "Elevador atascado", "Puente colgante oxidado",
  "Casa embrujada en el barrio", "Subestación eléctrica", "Contenedor en el puerto",
];

const COLOMBIANOS = [
  "Transmilenio", "Tienda de barrio", "Plaza de mercado", "Finca cafetera",
  "Estadio de fútbol", "Río Magdalena", "Plaza de Bolívar", "Barrio popular",
  "Terminal de transporte", "Puesto de arepas", "Ciclovía dominical",
  "Corraleja", "Pueblo paisa", "Puerto fluvial", "Mercado de Paloquemao",
  "Catedral de Sal", "Malecón del río", "Vereda campesina", "Parque principal del pueblo",
];

const HISTORICOS = [
  "Casa colonial", "Fortaleza española", "Iglesia colonial", "Plaza histórica",
  "Museo nacional", "Biblioteca antigua", "Teatro del siglo XIX", "Estación de tren antigua",
  "Hacienda colonial", "Puente colonial", "Monasterio", "Ruinas arqueológicas",
];

export const PLACES_BY_CATEGORY: Record<Exclude<PlaceCategory, "aleatorio">, string[]> = {
  cotidiano: COTIDIANOS,
  absurdo: ABSURDOS,
  colombiano: COLOMBIANOS,
  historico: HISTORICOS,
};

export function getRandomPlace(category: PlaceCategory): string {
  if (category === "aleatorio") {
    const all = [...COTIDIANOS, ...ABSURDOS, ...COLOMBIANOS, ...HISTORICOS];
    return all[Math.floor(Math.random() * all.length)];
  }
  const list = PLACES_BY_CATEGORY[category];
  return list[Math.floor(Math.random() * list.length)];
}
