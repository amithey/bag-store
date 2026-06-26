export type Product = {
  id: string;
  name: string;
  material: string;
  dimensions: string;
  price: string;
  priceNum: number;
  image: string;
  images: string[];
  imageFit: "cover" | "contain";
  alt: string;
  stockStatus: string;
  description: string;
  category: "shoulder" | "hand";
};

export const products: Product[] = [
  {
    id: "01",
    name: "תיק קוקו חום | Coco Brown",
    material: "חוט טריקו בגוון חום עמוק",
    dimensions: "23x15 ס״מ",
    price: "₪150",
    priceNum: 150,
    image: "/images/bag_brown.jpg",
    images: ["/images/bag_brown.jpg"],
    imageFit: "cover",
    alt: "תיק סרוג חום עם תליון מוזהב",
    stockStatus: "מוכן למסירה באשדוד והסביבה",
    description:
      "תיק צד קטן ונוח בגוון חום עמוק, עם סריגה צפופה ופרזול מוזהב. מתאים ליומיום, לאירוע קטן או כמתנה אישית.",
    category: "shoulder",
  },
  {
    id: "02",
    name: "תיק פסים שמנת | Stripes Flap",
    material: "חוטי כותנה שזורים בגווני שמנת, מוקה וחום",
    dimensions: "19x12 ס״מ",
    price: "₪150",
    priceNum: 150,
    image: "/images/bag_pattern.jpg",
    images: ["/images/bag_pattern.jpg"],
    imageFit: "cover",
    alt: "תיק סרוג בדוגמת פסים בגווני שמנת וחום",
    stockStatus: "ייצור בהזמנה אישית, כ-7 ימי עבודה",
    description:
      "תיק ערב קטן בגווני שמנת וחום, עם אבזם מוזהב ורצועת שרשרת. יש לו נוכחות עדינה בלי להרגיש מוגזם.",
    category: "shoulder",
  },
  {
    id: "03",
    name: "תיק אפור מינימל | Slate Grey Mini",
    material: "חוט פוליאסטר עמיד בגוון אפור עם ברק עדין",
    dimensions: "22x15 ס״מ",
    price: "₪200",
    priceNum: 200,
    image: "/images/bag_grey.jpg",
    images: ["/images/bag_grey.jpg"],
    imageFit: "cover",
    alt: "תיק צד אפור קומפקטי עם סגירת לשונית",
    stockStatus: "פריט אחרון מוכן למסירה",
    description:
      "דגם אפור, קל ונקי שמתאים כמעט לכל הופעה. שימושי ליום יום, ועדיין מרגיש כמו פריט שנבחר בכוונה.",
    category: "shoulder",
  },
  {
    id: "04",
    name: "תיק מנטה ידית | Mint Handbag",
    material: "חוט כותנה רך בגוון ירוק מנטה",
    dimensions: "24x16 ס״מ",
    price: "₪350",
    priceNum: 350,
    image: "/images/bag_green.jpg",
    images: ["/images/bag_green.jpg"],
    imageFit: "cover",
    alt: "תיק יד סרוג בגוון ירוק מנטה עם ידיות מובנות",
    stockStatus: "ייצור בהזמנה אישית, כ-7 ימי עבודה",
    description:
      "תיק יד בגוון מנטה רך, עם ידיות סרוגות ורצועת שרשרת נשלפת. בחירה טובה למי שרוצה צבע עדין אבל לא שגרתי.",
    category: "hand",
  },
  {
    id: "05",
    name: "תיק כחול פליסה | Pleated Royal Blue",
    material: "חוט מקרמה כחול רויאל במבנה פליסה",
    dimensions: "23x20 ס״מ",
    price: "₪300",
    priceNum: 300,
    image: "/images/bag_blue.jpg",
    images: ["/images/bag_blue.jpg"],
    imageFit: "cover",
    alt: "תיק יד כחול בעיצוב פליסה אנכי",
    stockStatus: "מוכן למסירה באשדוד והסביבה",
    description:
      "תיק יד כחול עם קיפולים אנכיים ורצועת שרשרת מוזהבת. הוא בולט, אבל נשאר אלגנטי ונקי.",
    category: "hand",
  },
  {
    id: "06",
    name: "תיק לילך מוזהב | Lilac Antler",
    material: "חוט טריקו בגוון לילך",
    dimensions: "22x14 ס״מ",
    price: "₪150",
    priceNum: 150,
    image: "/images/bag_purple.jpg",
    images: ["/images/bag_purple.jpg"],
    imageFit: "cover",
    alt: "תיק סרוג לילך עם אבזם מוזהב",
    stockStatus: "פריט יחיד מוכן למסירה באשדוד",
    description:
      "תיק כתף רך בגוון לילך, עם אבזם מוזהב ורצועה רחבה. עדין, נוח, ומתאים גם לשעות ארוכות מחוץ לבית.",
    category: "shoulder",
  },
  {
    id: "07",
    name: "תיק כסף פליסה | Pleated Silver",
    material: "חוט מקרמה אפור כסוף עם ברק עדין",
    dimensions: "22x18 ס״מ",
    price: "₪300",
    priceNum: 300,
    image: "/images/bag_silver.jpg",
    images: ["/images/bag_silver.jpg"],
    imageFit: "cover",
    alt: "תיק יד כסוף בעיצוב פליסה",
    stockStatus: "ייצור בהזמנה אישית, כ-8 ימי עבודה",
    description:
      "דגם כסוף עם ידית קשיחה ורצועת שרשרת. מתאים לערב או לאירוע, בלי להרגיש כבד מדי.",
    category: "hand",
  },
];

export type AnatomyPart = {
  number: string;
  title: string;
  body: string;
  x: number;
  y: number;
};

export const anatomyImage = {
  src: "/images/full/bag_pattern.jpg",
  alt: "תיק סרוג בעבודת יד בצילום חזיתי",
};

export const anatomyParts: AnatomyPart[] = [
  {
    number: "01",
    title: "שרשרת מוזהבת",
    body: "רצועת מתכת שמתאימה לדגם ומאפשרת לשאת את התיק בנוחות על הכתף.",
    x: 70,
    y: 20,
  },
  {
    number: "02",
    title: "סוגר סיבוב",
    body: "אבזם יציב שקל לפתוח ולסגור, ושומר על התיק מסודר גם כשמשתמשים בו הרבה.",
    x: 54,
    y: 50,
  },
  {
    number: "03",
    title: "טקסטורת סריגה",
    body: "דוגמת הסריגה נבחרת לפי הצורה והצבע, כדי שהתיק ירגיש מאוזן ולא עמוס.",
    x: 32,
    y: 44,
  },
  {
    number: "04",
    title: "תג מתכת",
    body: "תג קטן שמוסיף גימור נקי בלי לקחת את תשומת הלב מהסריגה עצמה.",
    x: 38,
    y: 62,
  },
  {
    number: "05",
    title: "בסיס מחוזק",
    body: "בסיס יציב שעוזר לתיק לשמור על צורה גם אחרי שמכניסים אליו דברים.",
    x: 78,
    y: 68,
  },
  {
    number: "06",
    title: "בטנה פנימית",
    body: "בטנה פנימית שמסתירה חיבורים, שומרת על פריטים קטנים ונותנת תחושה מסודרת מבפנים.",
    x: 50,
    y: 25,
  },
];

export type ProcessStep = {
  number: string;
  title: string;
  body: string[];
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "בחירת חומרים",
    body: [
      "מתחילים מבחירת חוט, צבע ופרזול שמתאימים לדגם ולשימוש שלו.",
      "אם הצבע או המרקם לא עובדים טוב יחד, מחליפים לפני שמתחילים לסרוג.",
    ],
  },
  {
    number: "02",
    title: "סריגה ידנית",
    body: [
      "כל תיק נסרג בנפרד, עם תשומת לב למתח אחיד ולצורה שנשמרת.",
      "זה תהליך איטי יותר, אבל הוא מאפשר לתקן ולדייק תוך כדי עבודה.",
    ],
  },
  {
    number: "03",
    title: "מבנה וגימור",
    body: [
      "מחברים בטנה, סוגר, שרשרת או ידיות לפי הדגם.",
      "בסוף בודקים שהסגירה עובדת, שהידיות יושבות טוב ושהתיק נוח לנשיאה.",
    ],
  },
  {
    number: "04",
    title: "מסירה אישית",
    body: [
      "התיק נארז ונמסר בתיאום אישי באזור אשדוד והסביבה.",
      "בהזמנות מיוחדות אפשר לתאם צבעים, מידות ופרטים קטנים לפני ההכנה.",
    ],
  },
];
