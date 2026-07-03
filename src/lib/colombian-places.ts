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
  { id: "historico", label: "Lugares historicos" },
  { id: "aleatorio", label: "Aleatorio total" },
];

const COTIDIANOS = [
  "Fila de banco en quincena",
  "Tienda de barrio con partido de fondo",
  "Peluqueria donde todos opinan",
  "Sala de espera de EPS",
  "Ascensor atascado en edificio residencial",
  "Cocina familiar antes del almuerzo",
  "Parqueadero de centro comercial",
  "Oficina de recursos humanos",
  "Porteria de conjunto cerrado",
  "Salon de belleza en diciembre",
  "Panaderia a las seis de la manana",
  "Farmacia de turno",
  "Lavadero de carros con secretos",
  "Clase de baile para principiantes",
  "Funeraria con reunion familiar incomoda",
  "Restaurante que perdio la reserva",
  "Buseta con frenos dramaticos",
  "Gimnasio el primer lunes de enero",
  "Notaria a punto de cerrar",
  "Terraza durante un aguacero",
  "Bodega de decoraciones navidenas",
  "Cafeteria universitaria sin cambio",
  "Sala de profesores en descanso",
  "Consultorio odontologico con musica romantica",
  "Mercado de pulgas con objetos misteriosos",
  "Recepcion de hotel economico",
  "Casa modelo de inmobiliaria exagerada",
  "Puesto de comidas despues de la rumba",
];

const ABSURDOS = [
  "Juzgado para electrodomesticos rebeldes",
  "Bunker secreto debajo de una panaderia",
  "Museo nacional de excusas malas",
  "Avion donde todos creen ser pilotos",
  "Circo administrado por una junta de vecinos",
  "Spa para celulares con ansiedad",
  "Academia de baile para fantasmas",
  "Banco que presta favores en vez de plata",
  "Laboratorio que inventa nuevos sabores de empanada",
  "Hotel cinco estrellas para plantas",
  "Terminal de buses hacia lugares imaginarios",
  "Ministerio de asuntos que pudieron ser un email",
  "Restaurante donde el menu juzga al cliente",
  "Elevador que solo sube emocionalmente",
  "Supermercado en pleno apocalipsis de bunuelos",
  "Oficina de quejas del destino",
  "Terapia de pareja para muebles",
  "Biblioteca donde los libros chismean",
  "Concurso nacional de silencios incomodos",
  "Estacion espacial con tienda de barrio",
  "Fabrica clandestina de refranes",
  "Tribunal supremo de las sobras de comida",
  "Reality show dentro de una fila",
  "Cementerio de grupos de WhatsApp abandonados",
  "Cirugia de emergencia para un tamal",
  "Subasta de objetos sin valor sentimental",
];

const COLOMBIANOS = [
  "TransMilenio en hora pico",
  "Plaza de mercado de Paloquemao",
  "Finca cafetera durante visita familiar",
  "Malecon del rio Magdalena",
  "Plaza principal de pueblo en fiestas patronales",
  "Puesto de arepas frente a una discoteca",
  "Ciclovia dominical con demasiada confianza",
  "Terminal de transporte en puente festivo",
  "Estadio antes de un clasico",
  "Chiva rumbera que se perdio",
  "Tienda de carretera con gallina incluida",
  "Festival de pueblo donde nadie sabe el programa",
  "Sancocho comunitario junto al rio",
  "Parque del barrio con torneo relampago",
  "Cabina de radio comunitaria",
  "Mirador con pareja peleando bajito",
  "Muelle turistico de Cartagena",
  "Callejon de Getsemani con guia improvisado",
  "Vereda reunida por una vaca perdida",
  "Salon comunal decorado para quince anos",
  "Casa de abuela en diciembre",
  "Paradero de bus intermunicipal bajo lluvia",
  "Puesto de obleas con fila de turistas",
  "Cancha sintetica despues de medianoche",
  "Feria ganadera con influencer urbano",
  "Cocina de restaurante corrientazo",
  "Taller mecanico con radio a todo volumen",
  "Tienda donde todos le deben al cuaderno",
];

const HISTORICOS = [
  "Casa colonial durante visita guiada",
  "Teatro antiguo antes de abrir telon",
  "Estacion de tren abandonada",
  "Museo nacional con pieza desaparecida",
  "Fortaleza de Cartagena de noche",
  "Biblioteca antigua con lector sospechoso",
  "Hacienda colonial convertida en hotel",
  "Puente historico que todos cruzan con miedo",
  "Iglesia colonial antes de una boda",
  "Archivo municipal lleno de secretos",
  "Plaza historica durante discurso oficial",
  "Monasterio donde alguien escondio un parlante",
  "Ruinas arqueologicas mal explicadas por un guia",
  "Camino real en una caminata escolar",
  "Casa museo donde el vigilante sabe demasiado",
  "Patio colonial durante un aguacero solemne",
  "Antigua estacion de policia convertida en cafe",
  "Salon de baile de otra epoca",
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
    return all[Math.floor(Math.random() * all.length)]!;
  }
  const list = PLACES_BY_CATEGORY[category];
  return list[Math.floor(Math.random() * list.length)]!;
}
