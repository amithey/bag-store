import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const products = [
  {
    id: "01",
    name: "תיק קוקו חום | Coco Brown",
    material: "חוט טריקו פרימיום בגוון חום עמוק",
    dimensions: "23x15 ס״מ",
    price_num: 150,
    image: "/images/bag_brown.jpg",
    images: ["/images/bag_brown.jpg"],
    image_fit: "cover",
    alt: "תיק סרוג חום עם תליון מוזהב",
    stock_status: "מוכן למסירה באשדוד והסביבה",
    description:
      "תיק צד קטן ונוח בגוון חום עמוק, עם סריגה צפופה ופרזול מוזהב. מתאים ליומיום, לאירוע קטן או כמתנה אישית.",
    category: "shoulder",
    is_active: true,
    sort_order: 10,
  },
  {
    id: "02",
    name: "תיק פסים שמנת | Stripes Flap",
    material: "חוטי כותנה שזורים בגווני שמנת, מוקה וחום",
    dimensions: "19x12 ס״מ",
    price_num: 150,
    image: "/images/bag_pattern.jpg",
    images: ["/images/bag_pattern.jpg"],
    image_fit: "cover",
    alt: "תיק סרוג בדוגמת פסים בגווני שמנת וחום",
    stock_status: "ייצור בהזמנה אישית, כ-7 ימי עבודה",
    description:
      "תיק ערב קטן בגווני שמנת וחום, עם אבזם מוזהב ורצועת שרשרת. יש לו נוכחות עדינה בלי להרגיש מוגזם.",
    category: "shoulder",
    is_active: true,
    sort_order: 20,
  },
  {
    id: "03",
    name: "תיק אפור מינימל | Slate Grey Mini",
    material: "חוט פוליאסטר עמיד בגוון אפור עם ברק עדין",
    dimensions: "22x15 ס״מ",
    price_num: 200,
    image: "/images/bag_grey.jpg",
    images: ["/images/bag_grey.jpg"],
    image_fit: "cover",
    alt: "תיק צד אפור קומפקטי עם סגירת לשונית",
    stock_status: "פריט אחרון מוכן למסירה",
    description:
      "דגם אפור, קל ונקי שמתאים כמעט לכל הופעה. שימושי ליום יום, ועדיין מרגיש כמו פריט שנבחר בכוונה.",
    category: "shoulder",
    is_active: true,
    sort_order: 30,
  },
  {
    id: "04",
    name: "תיק מנטה ידית | Mint Handbag",
    material: "חוט כותנה רך בגוון ירוק מנטה",
    dimensions: "24x16 ס״מ",
    price_num: 350,
    image: "/images/bag_green.jpg",
    images: ["/images/bag_green.jpg"],
    image_fit: "cover",
    alt: "תיק יד סרוג בגוון ירוק מנטה עם ידיות מובנות",
    stock_status: "ייצור בהזמנה אישית, כ-7 ימי עבודה",
    description:
      "תיק יד בגוון מנטה רך, עם ידיות סרוגות ורצועת שרשרת נשלפת. בחירה טובה למי שרוצה צבע עדין אבל לא שגרתי.",
    category: "hand",
    is_active: true,
    sort_order: 40,
  },
  {
    id: "05",
    name: "תיק כחול פליסה | Pleated Royal Blue",
    material: "חוט מקרמה כחול רויאל במבנה פליסה",
    dimensions: "23x20 ס״מ",
    price_num: 300,
    image: "/images/bag_blue.jpg",
    images: ["/images/bag_blue.jpg"],
    image_fit: "cover",
    alt: "תיק יד כחול בעיצוב פליסה אנכי",
    stock_status: "מוכן למסירה באשדוד והסביבה",
    description:
      "תיק יד כחול עם קיפולים אנכיים ורצועת שרשרת מוזהבת. הוא בולט, אבל נשאר אלגנטי ונקי.",
    category: "hand",
    is_active: true,
    sort_order: 50,
  },
  {
    id: "06",
    name: "תיק לילך מוזהב | Lilac Antler",
    material: "חוט טריקו פרימיום בגוון לילך",
    dimensions: "22x14 ס״מ",
    price_num: 150,
    image: "/images/bag_purple.jpg",
    images: ["/images/bag_purple.jpg"],
    image_fit: "cover",
    alt: "תיק סרוג לילך עם אבזם מוזהב",
    stock_status: "פריט יחיד מוכן למסירה באשדוד",
    description:
      "תיק כתף רך בגוון לילך, עם אבזם מוזהב ורצועה רחבה. עדין, נוח, ומתאים גם לשעות ארוכות מחוץ לבית.",
    category: "shoulder",
    is_active: true,
    sort_order: 60,
  },
  {
    id: "07",
    name: "תיק כסף פליסה | Pleated Silver",
    material: "חוט מקרמה אפור כסוף עם ברק עדין",
    dimensions: "22x18 ס״מ",
    price_num: 300,
    image: "/images/bag_silver.jpg",
    images: ["/images/bag_silver.jpg"],
    image_fit: "cover",
    alt: "תיק יד כסוף בעיצוב פליסה",
    stock_status: "ייצור בהזמנה אישית, כ-8 ימי עבודה",
    description:
      "דגם כסוף עם ידית קשיחה ורצועת שרשרת. מתאים לערב או לאירוע, בלי להרגיש כבד מדי.",
    category: "hand",
    is_active: true,
    sort_order: 70,
  },
];

const { data, error } = await supabase
  .from("products")
  .upsert(products, { onConflict: "id" })
  .select("id");

if (error) {
  console.error("Failed to seed products:", error);
  process.exit(1);
}

console.log(`Seeded ${data?.length || products.length} products.`);
