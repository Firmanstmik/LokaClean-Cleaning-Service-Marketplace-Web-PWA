
/**
 * Simple translation helper for demo purposes.
 * Simulates translation from ID to EN without external API.
 */
export async function simpleTranslate(text: string, targetLang: 'en' | 'id' = 'en'): Promise<string> {
  // Simulate network delay for realistic UI feedback
  await new Promise(resolve => setTimeout(resolve, 600));

  if (!text) return "";

  // Simple dictionary for common cleaning terms
  const dictionary: Record<string, string> = {
    "pembersihan": "Cleaning",
    "mendalam": "Deep",
    "kamar mandi": "Bathroom",
    "kamar tidur": "Bedroom",
    "ruang tamu": "Living Room",
    "dapur": "Kitchen",
    "lantai": "Floor",
    "dasar": "Basic",
    "standar": "Standard",
    "premium": "Premium",
    "eksklusif": "Exclusive",
    "paket": "Package",
    "cuci": "Wash",
    "setrika": "Ironing",
    "piring": "Dishes",
    "baju": "Clothes",
    "sofa": "Sofa",
    "karpet": "Carpet",
    "jendela": "Window",
    "halaman": "Yard",
    "kos": "Boarding House",
    "apartemen": "Apartment",
    "rumah": "House",
    "kantor": "Office",
    "jam": "Hour",
    "menit": "Minute",
    "luas": "Area",
    "termasuk": "Includes",
    "tidak termasuk": "Excludes",
    "alat": "Equipment",
    "bahan": "Materials",
    "kimia": "Chemicals",
    "ramah lingkungan": "Eco-friendly",
    "kilat": "Express",
    "tuntas": "Thorough",
    "rapi": "Tidy",
    "wangi": "Fragrant",
    "bebas kuman": "Germ-free",
    "higienis": "Hygienic",
    "murah": "Cheap",
    "hemat": "Save",
    "terjangkau": "Affordable",
    "diskon": "Discount",
    "promo": "Promo",
    "terbaik": "Best",
    "pilihan": "Choice",
    "pelanggan": "Customer",
    "puas": "Satisfied",
    "garansi": "Warranty",
    "layanan": "Service",
    "jasa": "Service",
    "tukang": "Worker",
    "ahli": "Expert",
    "profesional": "Professional",
    "berpengalaman": "Experienced",
    "terlatih": "Trained",
    "terpercaya": "Trusted",
    "aman": "Safe",
    "nyaman": "Comfortable",
    "bersih": "Clean",
    "sehat": "Healthy",
    "keluarga": "Family",
    "anak": "Child",
    "hewan peliharaan": "Pet",
    "kucing": "Cat",
    "anjing": "Dog",
    "tanaman": "Plant",
    "taman": "Garden",
    "kolam renang": "Swimming Pool",
    "garasi": "Garage",
    "gudang": "Warehouse",
    "teras": "Terrace",
    "balkon": "Balcony",
    "atap": "Roof",
    "dinding": "Wall",
    "langit-langit": "Ceiling",
    "pintu": "Door",
    "kaca": "Glass",
    "kayu": "Wood",
    "keramik": "Ceramic",
    "marmer": "Marble",
    "granit": "Granite",
    "parket": "Parquet",
    "vinil": "Vinyl",
    "karpet bulu": "Fur Carpet",
    "sofa kulit": "Leather Sofa",
    "sofa kain": "Fabric Sofa",
    "kasur": "Mattress",
    "bantal": "Pillow",
    "guling": "Bolster",
    "selimut": "Blanket",
    "sprei": "Bed Sheet",
    "gorden": "Curtain",
    "vitrase": "Sheer Curtain",
    "taplak meja": "Table Cloth",
    "serbet": "Napkin",
    "handuk": "Towel",
    "keset": "Doormat",
    "satu": "One",
    "dua": "Two",
    "tiga": "Three",
    "empat": "Four",
    "lima": "Five",
    "enam": "Six",
    "tujuh": "Seven",
    "delapan": "Eight",
    "sembilan": "Nine",
    "sepuluh": "Ten"
  };

  let translated = text;

  // Case-insensitive replacement
  Object.keys(dictionary).forEach(key => {
    // Create a regex that matches the word boundary to avoid partial replacements
    // e.g. don't replace "kamar" in "sekamar"
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    translated = translated.replace(regex, (match) => {
        // Maintain capitalization of the original match if possible
        const replacement = dictionary[key];
        if (match[0] === match[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement.toLowerCase();
    });
  });

  // If the text seems unchanged and is short, try to look up direct phrases
  if (translated === text && dictionary[text.toLowerCase()]) {
      return dictionary[text.toLowerCase()];
  }

  // Fallback: If no significant translation happened (heuristic), 
  // maybe append [EN] to indicate it's a placeholder translation 
  // if user really wants to distinguish.
  // For now, let's just return the result of dictionary replacement.
  
  return translated;
}
