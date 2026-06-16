export interface PremiseCategory {
  id: string;
  title: string;
  emoji: string;
  accent: string;
  premises: string[];
}

export const PREMISE_CATEGORIES: PremiseCategory[] = [
  {
    id: "superhero",
    title: "Cosas que harías que no debería hacer un superhéroe",
    emoji: "🦸",
    accent: "from-red-500 to-orange-500",
    premises: [
      "Pedirle Uber a tu sidekick porque te dio pereza volar",
      "Usar la capa como toalla después de la ducha",
      "Subir un TikTok revelando tu identidad secreta",
      "Que te ganen en piedra, papel o tijera",
      "Pedir prestado el traje al villano para una fiesta",
      "Llorar viendo una novela y dejar caer lágrimas ácidas",
      "Usar los rayos láser para calentar pizza",
      "Perder el celular con todos los planes del universo",
      "Hacer fila en el banco con tu nombre real",
      "Confundir la señal de auxilio con un descuento",
      "Dejar la ciudad a medias porque te llegó la domiciliación",
      "Pedir permiso en la escuela para salvar el mundo",
      "Usar el superpoder de invisibilidad para colarse al cine",
      "Retirarte del equipo por un drama de WhatsApp",
      "Publicar tu ubicación mientras peleas con el villano",
    ],
  },
  {
    id: "cleaning",
    title: "Peores productos de limpieza",
    emoji: "🧴",
    accent: "from-emerald-500 to-teal-500",
    premises: [
      "Lejía con purpurina para que brille más sucio",
      "Ambientador con olor a trámite en la DIAN",
      "Esponja que solo limpia la mitad y cobra extra",
      "Desengrasante con sabor a arepa fría",
      "Trapo que deja más pelos que un gato en verano",
      "Limpiavidrios que empaña peor que un beso",
      "Jabón en polvo que se niega a trabajar los lunes",
      "Desinfectante con aroma a ex de tu ex",
      "Quitamanchas que convierte todo en café derramado",
      "Fregona con WiFi lento",
      "Cera para pisos resbalosos tipo pista de patinaje",
      "Detergente que solo funciona si le cantas",
      "Paño de microfibra hecho de lana de oveja rebelde",
      "Aspiradora que escupe lo que succiona",
      "Limpiador multiusos que solo sirve para estresarte",
    ],
  },
  {
    id: "doctor",
    title: "Cosas que no debería hacer un doctor",
    emoji: "🩺",
    accent: "from-sky-500 to-blue-600",
    premises: [
      "Decirte que busques en Google mientras te examina",
      "Firmar recetas con emojis",
      "Pedirte propina después de la consulta",
      "Usar el estetoscopio para escuchar reggaetón",
      "Decir «ups» en voz alta durante una cirugía",
      "Recetarte chocolate para todo",
      "Tomarte una selfie con tu radiografía",
      "Preguntarte si traes efectivo antes del diagnóstico",
      "Confundir tu rodilla con tu codo y insistir en que no",
      "Decir que la solución es «no te enfermes»",
      "Vender Avon en la sala de espera",
      "Usar un martillo de juguete para pruebas de reflejos",
      "Decirte que respires hondo y no volver a hablar",
      "Recetarte ver memes como terapia principal",
      "Salir corriendo cuando suena la alarma de incendios",
    ],
  },
  {
    id: "partner-mechanic",
    title: "Cosas que puedes decirle a tu pareja pero no a un mecánico",
    emoji: "💬",
    accent: "from-pink-500 to-rose-500",
    premises: [
      "Hoy te ves diferente… ¿será el filtro?",
      "¿Por qué siempre haces ese ruido raro?",
      "Amor, creo que estás muy caliente",
      "Nunca me escuchas cuando te hablo",
      "Otra vez llegaste tarde y sudado",
      "¿Seguro que sabes lo que haces?",
      "Me encanta cuando me llevas a dar una vuelta",
      "¿Por qué traes esa cara de enojado?",
      "Necesito más espacio… emocional, no en el baúl",
      "Eres mi motor preferido",
      "Cuando te apagas de repente me asustas",
      "¿Podemos hablar de lo de anoche?",
      "Te extraño cuando no respondes",
      "Hoy sí te veo reluciente",
      "No me gusta cómo tratas a los demás en la calle",
    ],
  },
  {
    id: "drunk-sports",
    title: "Deportes o actividades en el día pero borracho",
    emoji: "🍻",
    accent: "from-amber-500 to-yellow-500",
    premises: [
      "Yoga pero cada pose es un brindis",
      "Maratón de 42 km… hasta la esquina",
      "Natación sincronizada con hiccups",
      "Ajedrez donde el alfil es el mesero",
      "Crossfit levantando vasos vacíos",
      "Ciclismo en bicicleta estática del bar",
      "Paracaidismo desde la silla del balcón",
      "Tenis con raqueta de empanada",
      "Boxeo contra tu propio reflejo",
      "Escalada en roca… de la mesa del bar",
      "Golf pero la pelota es una aceituna",
      "Surf en la bañera con olas de cerveza",
      "Patinaje artístico sobre piso mojado",
      "Atletismo 100 metros planos al baño",
      "Pesca deportiva en el vaso de aguardiente",
    ],
  },
  {
    id: "commercials",
    title: "Peores comerciales",
    emoji: "📺",
    accent: "from-violet-500 to-purple-600",
    premises: [
      "Compra dos dolores de cabeza y llévate uno gratis",
      "El shampoo que solo funciona si gritas su nombre",
      "Seguro de vida para tu planta de escritorio",
      "Curso online: cómo procrastinar profesionalmente",
      "Agua embotellada con sabor a factura vencida",
      "Crema antiarrugas para tu historial crediticio",
      "Delivery de malas decisiones en 30 minutos",
      "Reloj inteligente que te juzga cada hora",
      "Desayuno cereal con leche de decepción",
      "App para encontrar tus llaves… y perderlas otra vez",
      "Colchón ortopédico para tu relación",
      "Barra de chocolate «sin culpa» con factura incluida",
      "Internet rápido que solo funciona de madrugada",
      "Perfume con aroma a lunes por la mañana",
      "Gimnasio donde pagas por no ir",
    ],
  },
];

export function getRandomPremise(categoryId: string, exclude?: string): string {
  const category = PREMISE_CATEGORIES.find((c) => c.id === categoryId);
  if (!category || category.premises.length === 0) return "…";

  const pool =
    exclude && category.premises.length > 1
      ? category.premises.filter((p) => p !== exclude)
      : category.premises;

  return pool[Math.floor(Math.random() * pool.length)]!;
}
