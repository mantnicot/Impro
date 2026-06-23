export const COLOMBIAN_CHARACTERS = [
  "Ñero", "Costeño", "Paisa", "Rolo", "Boyacense", "Santandereano", "Llanero",
  "Taxista bogotano", "Vendedor ambulante", "Policía de barrio", "Tía chismosa",
  "Influencer", "Pastor evangélico", "Político corrupto", "Abogado intenso",
  "Médico arrogante", "Profesor universitario", "Celador", "Mototaxista", "Tendero",
  "Cafetero", "Vendedora de empanadas", "Repartidor de domicilios", "Guarda de seguridad",
  "Mesero apurado", "Conductor de buseta", "Vecina regañona", "Futbolista retirado",
  "Cantante de vallenato", "Turista perdido", "Ciclista enojado", "Doña del apartamento",
];

export const CHARACTER_TRAITS = [
  "Cree que sabe todo",
  "Habla demasiado rápido",
  "Siempre tiene hambre",
  "Se enamora fácilmente",
  "Es exageradamente celoso",
  "Todo le parece caro",
  "Vive endeudado",
  "Siempre llega tarde",
  "Habla gritando",
  "Cree que es famoso",
  "Es extremadamente religioso",
  "Tiene mala suerte",
  "Es excesivamente optimista",
  "No para de tomar café",
  "Cuenta chistes malos",
  "Dramatiza todo",
  "Habla en diminutivos",
  "Usa palabras en desuso",
  "Siempre está en el celular",
  "Cree que lo están grabando",
  "Menciona a su mamá en todo",
  "Insiste en regatear precios",
  "Canta sin querer",
  "Se ofende por nada",
];

export function getRandomCharacter(): string {
  return COLOMBIAN_CHARACTERS[Math.floor(Math.random() * COLOMBIAN_CHARACTERS.length)];
}

export function getRandomTrait(): string {
  return CHARACTER_TRAITS[Math.floor(Math.random() * CHARACTER_TRAITS.length)];
}
