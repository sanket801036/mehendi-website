/* ============================================================
   CONFIG - SIRF YEHI FILE EDIT KARNI HAI
   ------------------------------------------------------------
   Yahan naam, number, rates, photos aur reviews badlo.
   HTML/CSS ko haath lagane ki zaroorat nahi.
   Edit karke file save karo, phir browser refresh karo (Ctrl+R).
   ============================================================ */

const SITE = {
  // ---- Basic info ----
  brand:       "Mehendi by Swity",           // business ka naam (site pe upar dikhega)
  artist:      "Swity Tularam Kolhe",        // pura naam (Google/schema ke liye)
  artistShort: "Swity",                      // About section me "Namaste, main ___"
  tagline:     "Bridal se Party tak - har design me apnapan",

  // ---- Jagah ----
  city:       "Warud",                       // base sheher (hero me "Warud & aas-paas" dikhta hai)
  seoArea:    "Warud, Amravati",             // page title aur Google ke liye
  postalCode: "444906",                      // Google local search me madad karta hai
  areas:      "Warud, Morshi, Amravati, Katol, Nagpur aur aas-paas ke ilaake",

  // ---- Contact ----
  // WhatsApp: country code ke saath, bina + aur bina space ke. Jaise: 919145671694
  whatsapp: "919145671694",
  phone:    "+91 91456 71694",         // sirf dikhane ke liye (readable format)
  email:    "",                        // TODO: email daalo, warna email row hide rahega

  // ---- Social (khaali "" chhod do to icon apne aap hide ho jayega) ----
  instagram: "",                       // TODO: Instagram profile ka pura link
  facebook:  "",
  youtube:   "",

  // ---- Email form ----
  // web3forms.com pe apni email daalo -> free access key milegi -> yahan paste karo.
  // Jab tak ye khaali hai, "Email pe bhejo" button hide rahega (WhatsApp chalta rahega).
  web3formsKey: "",

  // ---- Stats (hero ke neeche wali patti) ----
  stats: [
    { value: 5,    suffix: "+", label: "Saal ka Experience" },
    { value: 200,  suffix: "+", label: "Bridal Mehendi" },
    { value: 1200, suffix: "+", label: "Happy Clients" },
    { value: 100,  suffix: "%", label: "Natural Henna" },
  ],
};

/* ============================================================
   GALLERY - designs ki photos
   ------------------------------------------------------------
   1) Photo ko  images/gallery/  folder me daalo
   2) Neeche list me ek line add karo
   category ye ho sakti hai: bridal | arabic | party | feet | kids
   price/mrp optional hain - daalo to design pe rate aur discount badge dikhega
   ============================================================ */

const GALLERY = [
  { file: "bridal-01.svg", category: "bridal", alt: "Full haath bridal mehendi design dulhan ke liye", title: "Full Haath Bridal", price: 3500, mrp: 4500 },
  { file: "bridal-02.svg", category: "bridal", alt: "Rajasthani style bridal mehendi dulha-dulhan motif ke saath" },
  { file: "arabic-01.svg", category: "arabic", alt: "Arabic mehendi design floral pattern ke saath", title: "Arabic Floral", price: 500, mrp: 700 },
  { file: "arabic-02.svg", category: "arabic", alt: "Indo-arabic mehendi design bel-buti ke saath" },
  { file: "party-01.svg",  category: "party",  alt: "Simple party mehendi design haath ke liye" },
  { file: "party-02.svg",  category: "party",  alt: "Karwa chauth ke liye festival mehendi design" },
  { file: "feet-01.svg",   category: "feet",   alt: "Bridal payal style feet mehendi design" },
  { file: "kids-01.svg",   category: "kids",   alt: "Bachcho ke liye cute cartoon mehendi design" },
];

// Filter tabs (category upar wali list se match honi chahiye)
const GALLERY_FILTERS = [
  { id: "all",    label: "Sab" },
  { id: "bridal", label: "Bridal" },
  { id: "arabic", label: "Arabic" },
  { id: "party",  label: "Party" },
  { id: "feet",   label: "Feet" },
  { id: "kids",   label: "Kids" },
];

/* ============================================================
   PACKAGES - rate cards
   featured: true  ->  card highlight hoga "Popular" tag ke saath
   ============================================================ */

const PACKAGES = [
  {
    name: "Simple / Party",
    price: 300,
    mrp: 400,
    unit: "se shuru (dono haath)",
    desc: "Festival, get-together ya casual function ke liye halka-phulka design.",
    features: ["Dono haath front side", "Arabic ya simple bel design", "30-40 minute", "Ghar pe service available"],
    featured: false,
  },
  {
    name: "Full Hand Special",
    price: 800,
    mrp: 1100,
    unit: "se shuru (dono haath)",
    desc: "Engagement, sangeet ya haldi ke liye detailed full-hand design.",
    features: ["Front + back full haath", "Indo-arabic / floral detailing", "1-1.5 ghante", "Design pehle finalize karenge"],
    featured: true,
  },
  {
    name: "Bridal Package",
    price: 3500,
    mrp: 4500,
    unit: "se shuru",
    desc: "Dulhan ke liye complete bridal mehendi - kohni tak ya usse bhi upar.",
    features: ["Haath kohni tak + paer", "Dulha-dulhan / portrait motif", "3-5 ghante", "Trial design + aftercare tips"],
    featured: false,
  },
  {
    name: "Bulk / Event",
    price: "Custom",
    unit: "rate - group ke hisaab se",
    desc: "Wedding, corporate event ya society function - ek saath kai logo ke liye.",
    features: ["10+ logo pe discount", "Zaroorat ho to extra artist", "Poori event coverage", "Advance booking zaroori"],
    featured: false,
  },
];

/* ============================================================
   REVIEWS - clients ke testimonials  (stars: 1 se 5)
   ============================================================ */

const TESTIMONIALS = [
  {
    name: "Pooja Sharma", occasion: "Bridal Mehendi", stars: 5,
    text: "Meri shaadi ki mehendi inhone lagayi thi. Design bilkul waisa hi mila jaisa maine socha tha, aur colour itna gehra aaya ki sab poochh rahe the kahan se karwayi. Time pe aayi aur poore 4 ghante bahut aaram se kaam kiya.",
  },
  {
    name: "Sneha Patil", occasion: "Karwa Chauth", stars: 5,
    text: "Ghar pe aake lagayi, bahut hi neat kaam. Cone bhi khud ka natural banaya hua tha, koi chemical wali smell nahi. Rate bhi bilkul reasonable hai.",
  },
  {
    name: "Aarti Deshmukh", occasion: "Sangeet Function", stars: 5,
    text: "Humare sangeet me 15 logo ki mehendi thi. Sab kuch time pe complete ho gaya aur har kisi ka design alag tha. Bahut patience se kaam karti hain.",
  },
  {
    name: "Nikita Jain", occasion: "Engagement", stars: 5,
    text: "Instagram pe design dekh ke book kiya tha. Jo photo dikhayi thi bilkul wahi design mila, balki usse bhi better. Highly recommended!",
  },
  {
    name: "Manisha Kulkarni", occasion: "Party Mehendi", stars: 4,
    text: "Simple design karwaya tha diwali ke liye. Jaldi ho gaya aur bahut sundar laga. Agli baar bridal ke liye zaroor aaungi.",
  },
];

/* ============================================================
   FAQ - aksar poochhe jaane wale sawaal
   ============================================================ */

const FAQS = [
  {
    q: "Booking kitne din pehle karni chahiye?",
    a: "Party ya simple mehendi ke liye 3-4 din pehle bata dijiye. Bridal ke liye kam se kam 15-20 din pehle, kyunki shaadi ke season me (Nov-Feb) dates jaldi bhar jaati hain.",
  },
  {
    q: "Kya aap ghar pe aake mehendi lagati hain?",
    a: "Haan bilkul. Sheher ke andar ghar aana free hai. Sheher se bahar ya zyada door ke area ke liye thoda travel charge lagta hai - wo booking ke time hi bata denge, baad me koi hidden charge nahi.",
  },
  {
    q: "Mehendi ka colour kitni der me aata hai aur kitna gehra hota hai?",
    a: "Cone hataane ke 6-8 ghante baad colour dikhna shuru hota hai aur 24-48 ghante me apne poore gehre rang pe aata hai. Hum 100% natural henna use karte hain - colour aapki skin aur aftercare pe depend karta hai. Poori aftercare tips hum khud bata denge.",
  },
  {
    q: "Kya henna me koi chemical ya black henna hoti hai?",
    a: "Bilkul nahi. Cone ghar pe fresh banaya jaata hai - sirf henna powder, nimbu, cheeni aur essential oils. Black henna (PPD) hum kabhi use nahi karte, wo skin ke liye nuksaandeh hoti hai.",
  },
  {
    q: "Final rate kaise tay hota hai?",
    a: "Upar diye gaye rate starting price hain. Final rate design ki detailing, haath pe kitna upar tak lagana hai, aur kitne log hain - isse tay hota hai. WhatsApp pe design ki photo bhej dijiye, exact rate turant bata denge.",
  },
  {
    q: "Group ya bulk booking pe discount milta hai?",
    a: "Haan. 10 ya usse zyada logo ki booking pe special group rate milta hai. Badi events ke liye hum extra artist bhi le aate hain taaki sabka kaam time pe ho jaaye.",
  },
  {
    q: "Advance payment deni padti hai?",
    a: "Bridal aur bulk booking me date block karne ke liye thoda advance lete hain, baaki amount kaam poora hone ke baad. Simple ya party mehendi me koi advance nahi.",
  },
];

/* ============================================================
   SERVICES - kya-kya karte hain
   icon options: bridal | party | leaf | star | kids | event
   ============================================================ */

const SERVICES = [
  { icon: "bridal", title: "Bridal Mehendi",
    desc: "Dulhan ke liye full detailed design - kohni tak ya usse upar, dulha-dulhan motif aur portrait ke saath." },
  { icon: "party", title: "Party & Family",
    desc: "Shaadi, sangeet, haldi ya birthday - ghar ki saari ladies ke liye ek saath quick aur sundar design." },
  { icon: "leaf", title: "Arabic Mehendi",
    desc: "Bold floral aur bel-buti wale flowy design jo kam time me bante hain aur bahut attractive lagte hain." },
  { icon: "star", title: "Indo-Arabic Fusion",
    desc: "Indian detailing aur Arabic boldness ka mix - aajkal sabse zyada demand isi design ki hai." },
  { icon: "kids", title: "Kids Special",
    desc: "Bachcho ke liye cute, chhote aur jaldi banne wale design - cartoon, star aur flower patterns." },
  { icon: "event", title: "Bulk / Event Booking",
    desc: "Corporate event, society function ya badi shaadi - 10+ logo ke liye special group rate." },
];

/* ============================================================
   PROCESS - kaam kaise hota hai
   ============================================================ */

const PROCESS = [
  { step: "01", title: "Enquiry bhejo",
    desc: "WhatsApp pe date, occasion aur kitne log - bas itna bata dijiye." },
  { step: "02", title: "Date confirm",
    desc: "Availability check karke rate bata denge aur aapki date block kar denge." },
  { step: "03", title: "Design finalize",
    desc: "Aap reference photo bhejiye ya humare designs me se chuniye. Sab pehle hi tay." },
  { step: "04", title: "Mehendi day",
    desc: "Time pe pahunchte hain, saara samaan saath laate hain. Aap bas aaram se baithiye." },
];

/* ---- Booking form ke dropdown options ---- */
const OCCASIONS = ["Shaadi / Wedding", "Engagement", "Sangeet", "Haldi", "Karwa Chauth", "Teej", "Diwali / Festival", "Birthday", "Corporate Event", "Aur koi"];
const SERVICE_TYPES = ["Bridal Mehendi", "Full Hand Special", "Simple / Party", "Arabic", "Indo-Arabic", "Kids", "Bulk / Event", "Pata nahi - suggest kijiye"];
