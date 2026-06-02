export const DEFAULT_OBJECTS = [
  "Mesa", "Silla", "Cama", "Puerta", "Espejo", "Lámpara", "Reloj", "Llave",
  "Teléfono", "Libro", "Lápiz", "Taza", "Plato", "Cuchara", "Tenedor",
  "Cuchillo", "Olla", "Sartén", "Botella", "Vaso", "Jarra", "Pan", "Queso",
  "Huevo", "Manzana", "Plátano", "Naranja", "Uvas", "Sandía", "Tomate",
  "Zanahoria", "Papa", "Lechuga", "Pizza", "Pastel", "Galleta", "Helado",
  "Café", "Leche", "Miel", "Arroz", "Sopa", "Jamón",
  "Sombrero", "Zapato", "Guante", "Bufanda", "Camisa", "Pantalón", "Vestido",
  "Gafas", "Anillo", "Collar", "Mochila", "Maleta", "Paraguas", "Bolsa",
  "Pelota", "Balón", "Globo", "Dado", "Trompo", "Cometa", "Muñeca", "Peluche",
  "Martillo", "Tijeras", "Destornillador", "Caja", "Cinta", "Cuerda",
  "Escoba", "Cubo", "Jabón", "Toalla", "Almohada", "Manta", "Peine", "Cepillo",
  "Guitarra", "Piano", "Flauta", "Tambor", "Violín", "Trompeta", "Acordeón",
  "Carro", "Bici", "Avión", "Barco", "Tren", "Cohete",
  "Maceta", "Vela", "Escalera", "Televisor", "Radio", "Computador", "Teclado",
  "Monitor", "Cámara", "Micrófono", "Audífonos", "Calculadora", "Regla",
  "Cuaderno", "Bolígrafo", "Goma", "Grapadora", "Pincel", "Pintura",
  "Espada", "Escudo", "Corona", "Trofeo", "Medalla", "Bandera", "Silbato",
  "Lupa", "Brújula", "Mapa", "Linterna", "Candado", "Ventilador", "Nevera",
  "Tostadora", "Cafetera", "Microondas", "Florero", "Sofá", "Cortina", "Alfombra",
  "Cuadro", "Marco", "Sobre", "Clip", "Moneda", "Rompecabezas",
  "Patines", "Skate", "Raqueta", "Sombrilla", "Botas", "Corbata", "Cinturón",
  "Fresa", "Limón", "Piña", "Mango", "Coco", "Brócoli", "Cebolla", "Ajo",
  "Champiñón", "Salchicha", "Tocino", "Mantequilla", "Yogurt", "Chocolate",
  "Caramelo", "Donut", "Waffle", "Taco", "Sandwich", "Hamburguesa",
  "Termo", "Lonchera", "Hervidor", "Colador", "Rallador", "Exprimidor",
  "Carretilla", "Pala", "Hacha", "Taladro", "Sierra", "Nuez",
];

export const FAVORITES_LIST_ID = "favoritos";
export const FAVORITES_LIST_NAME = "Favoritos";
export const RANDOM_LIST_ID = "aleatorio";
export const RANDOM_LIST_NAME = "Aleatorio";

export function getRandomObject(): string {
  return DEFAULT_OBJECTS[Math.floor(Math.random() * DEFAULT_OBJECTS.length)];
}
