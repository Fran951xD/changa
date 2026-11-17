// Las 24 jurisdicciones y sus ciudades principales con el centro aproximado.
// shortcut: lista curada a mano (~10 ciudades por provincia); para cubrir todas las localidades del país, importar el listado del INDEC/Georef.
export type Province = { slug: string; name: string };

export const PROVINCES: Province[] = [
  { slug: "caba", name: "Ciudad de Buenos Aires" },
  { slug: "buenos-aires", name: "Buenos Aires" },
  { slug: "catamarca", name: "Catamarca" },
  { slug: "chaco", name: "Chaco" },
  { slug: "chubut", name: "Chubut" },
  { slug: "cordoba", name: "Córdoba" },
  { slug: "corrientes", name: "Corrientes" },
  { slug: "entre-rios", name: "Entre Ríos" },
  { slug: "formosa", name: "Formosa" },
  { slug: "jujuy", name: "Jujuy" },
  { slug: "la-pampa", name: "La Pampa" },
  { slug: "la-rioja", name: "La Rioja" },
  { slug: "mendoza", name: "Mendoza" },
  { slug: "misiones", name: "Misiones" },
  { slug: "neuquen", name: "Neuquén" },
  { slug: "rio-negro", name: "Río Negro" },
  { slug: "salta", name: "Salta" },
  { slug: "san-juan", name: "San Juan" },
  { slug: "san-luis", name: "San Luis" },
  { slug: "santa-cruz", name: "Santa Cruz" },
  { slug: "santa-fe", name: "Santa Fe" },
  { slug: "santiago-del-estero", name: "Santiago del Estero" },
  { slug: "tierra-del-fuego", name: "Tierra del Fuego" },
  { slug: "tucuman", name: "Tucumán" },
];

export const PROVINCE_BY_SLUG = new Map(PROVINCES.map((p) => [p.slug, p]));

/** Ciudades fuera de CABA y del GBA (que están en areas.ts con sus barrios y localidades). */
export const CITIES: Record<string, [string, number, number][]> = {
  "buenos-aires": [
    ["La Plata", -34.921, -57.955], ["Mar del Plata", -38.005, -57.543], ["Bahía Blanca", -38.719, -62.272],
    ["Tandil", -37.321, -59.135], ["Junín", -34.585, -60.959], ["Pergamino", -33.89, -60.573],
    ["Olavarría", -36.893, -60.322], ["Necochea", -38.554, -58.739], ["Azul", -36.777, -59.858],
    ["San Nicolás de los Arroyos", -33.335, -60.225], ["Zárate", -34.098, -59.028], ["Campana", -34.163, -58.959],
    ["Luján", -34.57, -59.105], ["Chivilcoy", -34.896, -60.017], ["Tres Arroyos", -38.377, -60.275],
    ["Villa Gesell", -37.264, -56.973], ["Pinamar", -37.108, -56.861], ["Mercedes", -34.651, -59.43],
    ["Cañuelas", -35.051, -58.761], ["Escobar", -34.348, -58.797], ["José C. Paz", -34.515, -58.768],
    ["San Miguel", -34.543, -58.712], ["Hurlingham", -34.588, -58.639], ["Florencio Varela", -34.827, -58.395],
    ["González Catán", -34.769, -58.646], ["Ensenada", -34.861, -57.912], ["Berisso", -34.873, -57.886],
  ],
  catamarca: [
    ["San Fernando del Valle de Catamarca", -28.469, -65.779], ["Belén", -27.649, -67.033], ["Andalgalá", -27.582, -66.317],
    ["Tinogasta", -28.066, -67.565], ["Santa María", -26.696, -66.048], ["Valle Viejo", -28.49, -65.73],
  ],
  chaco: [
    ["Resistencia", -27.451, -58.987], ["Presidencia Roque Sáenz Peña", -26.785, -60.439], ["Villa Ángela", -27.573, -60.715],
    ["Charata", -27.217, -61.188], ["Barranqueras", -27.483, -58.935], ["Fontana", -27.418, -59.023],
    ["Juan José Castelli", -25.947, -60.62],
  ],
  chubut: [
    ["Rawson", -43.3, -65.102], ["Trelew", -43.253, -65.309], ["Puerto Madryn", -42.769, -65.038],
    ["Comodoro Rivadavia", -45.864, -67.497], ["Esquel", -42.911, -71.319], ["Rada Tilly", -45.926, -67.553],
    ["Gaiman", -43.29, -65.493], ["Sarmiento", -45.588, -69.07],
  ],
  cordoba: [
    ["Córdoba", -31.42, -64.188], ["Río Cuarto", -33.123, -64.349], ["Villa María", -32.407, -63.24],
    ["San Francisco", -31.428, -62.083], ["Villa Carlos Paz", -31.424, -64.497], ["Alta Gracia", -31.659, -64.43],
    ["Río Tercero", -32.173, -64.114], ["Bell Ville", -32.626, -62.689], ["Jesús María", -30.981, -64.094],
    ["La Calera", -31.344, -64.336], ["Cosquín", -31.245, -64.466], ["Villa Allende", -31.295, -64.295],
    ["Marcos Juárez", -32.698, -62.106], ["Laboulaye", -34.127, -63.391], ["Villa Dolores", -31.946, -65.19],
  ],
  corrientes: [
    ["Corrientes", -27.469, -58.83], ["Goya", -29.14, -59.263], ["Paso de los Libres", -29.712, -57.087],
    ["Curuzú Cuatiá", -29.792, -58.054], ["Mercedes", -29.184, -58.075], ["Santo Tomé", -28.549, -56.041],
    ["Esquina", -30.015, -59.528], ["Ituzaingó", -27.59, -56.689],
  ],
  "entre-rios": [
    ["Paraná", -31.732, -60.523], ["Concordia", -31.393, -58.017], ["Gualeguaychú", -33.009, -58.517],
    ["Concepción del Uruguay", -32.484, -58.233], ["Villaguay", -31.865, -59.029], ["Victoria", -32.618, -60.155],
    ["Gualeguay", -33.142, -59.31], ["Chajarí", -30.751, -57.986], ["Colón", -32.223, -58.144],
    ["Federación", -30.987, -57.919], ["La Paz", -30.743, -59.645], ["Crespo", -32.029, -60.307],
  ],
  formosa: [
    ["Formosa", -26.185, -58.175], ["Clorinda", -25.285, -57.718], ["Pirané", -25.732, -59.108],
    ["El Colorado", -26.308, -59.372], ["Las Lomitas", -24.708, -60.594], ["Ingeniero Juárez", -23.896, -61.853],
  ],
  jujuy: [
    ["San Salvador de Jujuy", -24.185, -65.299], ["San Pedro de Jujuy", -24.231, -64.866], ["Palpalá", -24.256, -65.212],
    ["Libertador General San Martín", -23.807, -64.793], ["Perico", -24.381, -65.113], ["Humahuaca", -23.205, -65.35],
    ["Tilcara", -23.577, -65.396], ["La Quiaca", -22.105, -65.597],
  ],
  "la-pampa": [
    ["Santa Rosa", -36.62, -64.29], ["General Pico", -35.664, -63.759], ["Toay", -36.673, -64.379],
    ["General Acha", -37.377, -64.604], ["Eduardo Castex", -35.915, -64.295], ["Realicó", -35.037, -64.245],
  ],
  "la-rioja": [
    ["La Rioja", -29.413, -66.856], ["Chilecito", -29.163, -67.498], ["Aimogasta", -28.56, -66.813],
    ["Chamical", -30.36, -66.314], ["Chepes", -31.347, -66.598],
  ],
  mendoza: [
    ["Mendoza", -32.89, -68.845], ["Godoy Cruz", -32.925, -68.845], ["Guaymallén", -32.9, -68.79],
    ["Las Heras", -32.851, -68.828], ["Maipú", -32.983, -68.783], ["Luján de Cuyo", -33.04, -68.879],
    ["San Rafael", -34.618, -68.33], ["San Martín", -33.081, -68.468], ["Tunuyán", -33.577, -69.017],
    ["Malargüe", -35.475, -69.585], ["General Alvear", -34.977, -67.7], ["Rivadavia", -33.19, -68.461],
  ],
  misiones: [
    ["Posadas", -27.367, -55.896], ["Oberá", -27.487, -55.12], ["Eldorado", -26.405, -54.632],
    ["Puerto Iguazú", -25.598, -54.578], ["Apóstoles", -27.912, -55.754], ["Leandro N. Alem", -27.602, -55.323],
    ["Garupá", -27.481, -55.829], ["Jardín América", -27.043, -55.227], ["Puerto Rico", -26.808, -55.024],
    ["San Vicente", -26.996, -54.488],
  ],
  neuquen: [
    ["Neuquén", -38.952, -68.059], ["Cutral Có", -38.934, -69.23], ["Plaza Huincul", -38.926, -69.209],
    ["Centenario", -38.829, -68.132], ["Plottier", -38.966, -68.233], ["Zapala", -38.899, -70.066],
    ["San Martín de los Andes", -40.157, -71.353], ["Villa La Angostura", -40.762, -71.646], ["Chos Malal", -37.378, -70.271],
    ["Junín de los Andes", -39.951, -71.069], ["Rincón de los Sauces", -37.391, -68.928],
  ],
  "rio-negro": [
    ["Viedma", -40.813, -62.996], ["San Carlos de Bariloche", -41.134, -71.31], ["General Roca", -39.033, -67.583],
    ["Cipolletti", -38.934, -67.99], ["Villa Regina", -39.096, -67.084], ["Allen", -38.977, -67.827],
    ["Cinco Saltos", -38.822, -68.063], ["El Bolsón", -41.964, -71.534], ["San Antonio Oeste", -40.732, -64.948],
    ["Choele Choel", -39.29, -65.66], ["Catriel", -37.879, -67.795],
  ],
  salta: [
    ["Salta", -24.782, -65.423], ["San Ramón de la Nueva Orán", -23.137, -64.326], ["Tartagal", -22.516, -63.801],
    ["General Güemes", -24.667, -65.048], ["Metán", -25.497, -64.973], ["Cafayate", -26.073, -65.976],
    ["Rosario de la Frontera", -25.797, -64.972], ["Joaquín V. González", -25.12, -64.127], ["Rosario de Lerma", -24.978, -65.579],
    ["Cerrillos", -24.9, -65.488],
  ],
  "san-juan": [
    ["San Juan", -31.537, -68.536], ["Rawson", -31.577, -68.55], ["Rivadavia", -31.532, -68.594],
    ["Chimbas", -31.488, -68.531], ["Santa Lucía", -31.54, -68.497], ["Pocito", -31.678, -68.58],
    ["Caucete", -31.652, -68.282], ["Albardón", -31.433, -68.525], ["Jáchal", -30.241, -68.746],
  ],
  "san-luis": [
    ["San Luis", -33.301, -66.338], ["Villa Mercedes", -33.676, -65.458], ["Merlo", -32.343, -65.014],
    ["La Punta", -33.184, -66.312], ["Juana Koslay", -33.287, -66.257], ["Justo Daract", -33.86, -65.183],
    ["Santa Rosa del Conlara", -32.343, -65.208],
  ],
  "santa-cruz": [
    ["Río Gallegos", -51.623, -69.216], ["Caleta Olivia", -46.439, -67.528], ["Pico Truncado", -46.795, -67.957],
    ["Puerto Deseado", -47.75, -65.894], ["El Calafate", -50.338, -72.265], ["Las Heras", -46.542, -68.935],
    ["Puerto San Julián", -49.306, -67.729], ["Río Turbio", -51.535, -72.337], ["Perito Moreno", -46.59, -70.926],
  ],
  "santa-fe": [
    ["Santa Fe", -31.633, -60.7], ["Rosario", -32.947, -60.639], ["Rafaela", -31.253, -61.492],
    ["Venado Tuerto", -33.746, -61.969], ["Reconquista", -29.15, -59.651], ["Villa Gobernador Gálvez", -33.031, -60.633],
    ["Santo Tomé", -31.663, -60.765], ["Esperanza", -31.449, -60.931], ["San Lorenzo", -32.746, -60.737],
    ["Casilda", -33.044, -61.168], ["Funes", -32.917, -60.81], ["Granadero Baigorria", -32.857, -60.706],
    ["Cañada de Gómez", -32.817, -61.395], ["Sunchales", -30.944, -61.561], ["Villa Constitución", -33.233, -60.335],
    ["Firmat", -33.459, -61.483], ["Avellaneda", -29.118, -59.658],
  ],
  "santiago-del-estero": [
    ["Santiago del Estero", -27.795, -64.261], ["La Banda", -27.735, -64.24], ["Termas de Río Hondo", -27.497, -64.86],
    ["Frías", -28.639, -65.129], ["Añatuya", -28.461, -62.835], ["Fernández", -27.925, -63.896],
    ["Quimilí", -27.64, -62.417], ["Loreto", -28.3, -64.18],
  ],
  "tierra-del-fuego": [
    ["Ushuaia", -54.801, -68.303], ["Río Grande", -53.787, -67.709], ["Tolhuin", -54.511, -67.196],
  ],
  tucuman: [
    ["San Miguel de Tucumán", -26.808, -65.218], ["Yerba Buena", -26.816, -65.316], ["Tafí Viejo", -26.732, -65.259],
    ["Banda del Río Salí", -26.836, -65.163], ["Concepción", -27.343, -65.592], ["Aguilares", -27.431, -65.614],
    ["Monteros", -27.167, -65.498], ["Famaillá", -27.054, -65.403], ["Lules", -26.924, -65.338],
    ["Tafí del Valle", -26.852, -65.71],
  ],
};
