// Culturally Localized North Eastern Region (NER) Dataset
// Strictly organized by all 8 Official North-Eastern States of India:
// Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura.
// Dual-language native script mapping & reliable local image paths.

export type NERStateId =
  | 'arunachal'
  | 'assam'
  | 'manipur'
  | 'meghalaya'
  | 'mizoram'
  | 'nagaland'
  | 'sikkim'
  | 'tripura';

export interface RegionOption {
  id: NERStateId;
  name: string;
  nativeScript: string;
}

export const OFFICIAL_NER_REGIONS: RegionOption[] = [
  { id: 'arunachal', name: 'Arunachal Pradesh', nativeScript: 'अरुणाचल प्रदेश' },
  { id: 'assam', name: 'Assam', nativeScript: 'অসম' },
  { id: 'manipur', name: 'Manipur', nativeScript: 'ꯃꯅꯤꯄꯨꯔ' },
  { id: 'meghalaya', name: 'Meghalaya', nativeScript: 'Meghalaya' },
  { id: 'mizoram', name: 'Mizoram', nativeScript: 'Mizoram' },
  { id: 'nagaland', name: 'Nagaland', nativeScript: 'Nagaland' },
  { id: 'sikkim', name: 'Sikkim', nativeScript: 'सिक्किम' },
  { id: 'tripura', name: 'Tripura', nativeScript: 'ত্রিপুরা' },
];

export interface NERMemoryItem {
  id: string;
  name: string;
  localName: string;
  stateId: NERStateId;
  stateName: string;
  description: string;
  imageUrl: string;
  bgColor: string;
  borderColor: string;
}

export interface StateTriviaQuestion {
  id: string;
  name: string;
  stateId: NERStateId;
  stateName: string;
  description: string;
  funFact: string;
  imageUrl: string;
  options: string[];
  correctAnswer: string;
}

export interface NERStateProfile {
  id: NERStateId;
  name: string;
  nativeName: string;
  items: NERMemoryItem[];
  questions: StateTriviaQuestion[];
}

export const NER_STATES_DATA: Record<NERStateId, NERStateProfile> = {
  arunachal: {
    id: 'arunachal',
    name: 'Arunachal Pradesh',
    nativeName: 'अरुणाचल प्रदेश',
    items: [
      {
        id: 'ar_tawang',
        name: 'Tawang Monastery',
        localName: 'Tawang Gompa (1681)',
        stateId: 'arunachal',
        stateName: 'Arunachal Pradesh',
        description: 'Historic 17th-century Himalayan Buddhist monastery founded by Merak Lama Lodre Gyatso.',
        imageUrl: '/assets/images/arunachal-tawang.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
      {
        id: 'ar_hornbill',
        name: 'Great Indian Hornbill',
        localName: 'State Bird of Arunachal',
        stateId: 'arunachal',
        stateName: 'Arunachal Pradesh',
        description: 'Revered forest bird with a magnificent yellow casque beak, central to tribal folklore.',
        imageUrl: '/assets/images/arunachal-hornbill.jpg',
        bgColor: '#FFEDD5',
        borderColor: '#EA580C',
      },
      {
        id: 'ar_sela',
        name: 'Sela Pass & Sacred Lake',
        localName: 'Sela Pass (13,700 ft)',
        stateId: 'arunachal',
        stateName: 'Arunachal Pradesh',
        description: 'Snow-capped high mountain pass connecting Tawang with a crystal alpine lake.',
        imageUrl: '/assets/images/arunachal-sela-pass.jpg',
        bgColor: '#E0F2FE',
        borderColor: '#0284C7',
      },
      {
        id: 'ar_ziro',
        name: 'Ziro Valley Pine Hills',
        localName: 'Ziro (Apatani Heritage)',
        stateId: 'arunachal',
        stateName: 'Arunachal Pradesh',
        description: 'Idyllic pine-clad plateau known for indigenous sustainable paddy-fish cultivation.',
        imageUrl: '/assets/images/arunachal-ziro-valley.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#15803D',
      },
    ],
    questions: [
      {
        id: 'ar_q1',
        name: 'Tawang Monastery',
        stateId: 'arunachal',
        stateName: 'Arunachal Pradesh',
        description: 'Magnificent 400-year-old Buddhist fortress monastery surrounded by Himalayan peaks.',
        funFact: 'Founded in 1681, it is the largest monastery in India and second largest in the world.',
        imageUrl: '/assets/images/arunachal-tawang.jpg',
        options: ['Tawang Monastery', 'Rumtek Monastery', 'Golden Temple'],
        correctAnswer: 'Tawang Monastery',
      },
      {
        id: 'ar_q2',
        name: 'Great Indian Hornbill',
        stateId: 'arunachal',
        stateName: 'Arunachal Pradesh',
        description: 'The revered state bird of Arunachal Pradesh with striking yellow casque.',
        funFact: 'Tribal communities celebrate the hornbill for planting forest trees through seed dispersal.',
        imageUrl: '/assets/images/arunachal-hornbill.jpg',
        options: ['Great Indian Hornbill', 'Himalayan Monal', 'Kingfisher'],
        correctAnswer: 'Great Indian Hornbill',
      },
    ],
  },

  assam: {
    id: 'assam',
    name: 'Assam',
    nativeName: 'অসম',
    items: [
      {
        id: 'as_rhino',
        name: 'One-Horned Rhinoceros',
        localName: 'এশিঙীয়া গঁড় (Kaziranga)',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'Majestic prehistoric mammal grazing in Kaziranga National Park along the Brahmaputra.',
        imageUrl: '/assets/images/assam-rhino.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#15803D',
      },
      {
        id: 'as_dhol',
        name: 'Bihu Dhol & Pepa',
        localName: 'বিহু ঢোল আৰু পেঁপা',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'Traditional wood and buffalo horn instruments central to vibrant Rongali Bihu celebrations.',
        imageUrl: '/assets/images/assam-bihu-dhol.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
      {
        id: 'as_kamakhya',
        name: 'Kamakhya Temple',
        localName: 'কামাখ্যা দেৱালয় (গুৱাহাটী)',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'Sacred Shakti Peetha perched on Nilachal Hill in Guwahati overlooking the Brahmaputra.',
        imageUrl: '/assets/images/assam-kamakhya.jpg',
        bgColor: '#FFEDD5',
        borderColor: '#C2410C',
      },
      {
        id: 'as_tea',
        name: 'Assam Tea Garden',
        localName: 'অসমৰ চাহ বাগিচা',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'Vast emerald plantations producing rich, malty black tea enjoyed across the world.',
        imageUrl: '/assets/images/assam-tea.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#166534',
      },
      {
        id: 'as_muga',
        name: 'Muga Golden Silk',
        localName: 'মুগা ৰেচম (শুৱালকুছি)',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'Rare wild golden silk woven into prestigious Mekhela Sador garments in Sualkuchi.',
        imageUrl: '/assets/images/assam-muga-silk.jpg',
        bgColor: '#FEF08A',
        borderColor: '#CA8A04',
      },
      {
        id: 'as_majuli',
        name: 'Majuli River Island',
        localName: 'মাজুলী সত্ৰ আৰু নদীদ্বীপ',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'The world’s largest freshwater river island and cradle of Neo-Vaishnavite culture.',
        imageUrl: '/assets/images/assam-majuli.jpg',
        bgColor: '#E0F2FE',
        borderColor: '#0284C7',
      },
    ],
    questions: [
      {
        id: 'as_q1',
        name: 'One-Horned Rhinoceros',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'The world-famous pride of Kaziranga protected in lush floodplain grasslands.',
        funFact: 'Assam shelters two-thirds of the world’s entire one-horned rhino population.',
        imageUrl: '/assets/images/assam-rhino.jpg',
        options: ['One-Horned Rhino (Kaziranga)', 'Royal Bengal Tiger', 'Himalayan Yak'],
        correctAnswer: 'One-Horned Rhino (Kaziranga)',
      },
      {
        id: 'as_q2',
        name: 'Bihu Dhol & Pepa',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'Traditional folk percussion made from jackfruit wood and buffalo horn.',
        funFact: 'The beats of the dhol welcome the Assamese New Year during Bohag Bihu.',
        imageUrl: '/assets/images/assam-bihu-dhol.jpg',
        options: ['Bihu Dhol & Pepa', 'Tabla & Tanpura', 'Mridangam'],
        correctAnswer: 'Bihu Dhol & Pepa',
      },
      {
        id: 'as_q3',
        name: 'Kamakhya Temple',
        stateId: 'assam',
        stateName: 'Assam',
        description: 'Ancient temple on Nilachal Hill in Guwahati revered across the nation.',
        funFact: 'Hosts the historic Ambubachi Mela every monsoon celebrating Mother Earth.',
        imageUrl: '/assets/images/assam-kamakhya.jpg',
        options: ['Kamakhya Temple (Guwahati)', 'Ujjayanta Palace', 'Tawang Monastery'],
        correctAnswer: 'Kamakhya Temple (Guwahati)',
      },
    ],
  },

  manipur: {
    id: 'manipur',
    name: 'Manipur',
    nativeName: 'ꯃꯅꯤꯄꯨꯔ',
    items: [
      {
        id: 'mn_loktak',
        name: 'Loktak Lake Phumdis',
        localName: 'লোকটাক হ্ৰদ (Phumdis)',
        stateId: 'manipur',
        stateName: 'Manipur',
        description: 'The world’s only floating lake dotted with circular floating biomass islands.',
        imageUrl: '/assets/images/manipur-loktak.jpg',
        bgColor: '#E0F2FE',
        borderColor: '#0284C7',
      },
      {
        id: 'mn_sangai',
        name: 'Sangai Brow-Antlered Deer',
        localName: 'চাংগাই হৰিণা (Dancing Deer)',
        stateId: 'manipur',
        stateName: 'Manipur',
        description: 'Endangered deer species walking delicately on the floating phumdis of Keibul Lamjao.',
        imageUrl: '/assets/images/manipur-sangai.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
      {
        id: 'mn_kangla',
        name: 'Kangla Fort & Royal Gates',
        localName: 'কাংলা কোঁঠ (Imphal)',
        stateId: 'manipur',
        stateName: 'Manipur',
        description: 'Historic seat of Manipur’s Meitei monarchs with mythical Kangla Sha guardian dragons.',
        imageUrl: '/assets/images/manipur-kangla.jpg',
        bgColor: '#FFEDD5',
        borderColor: '#EA580C',
      },
      {
        id: 'mn_dance',
        name: 'Classical Manipuri Raas Leela',
        localName: 'মণিপুৰী ৰাসলীলা নৃত্য',
        stateId: 'manipur',
        stateName: 'Manipur',
        description: 'Graceful classical dance known for lyrical devotional movements and Potloi skirts.',
        imageUrl: '/assets/images/manipur-raas-leela.jpg',
        bgColor: '#FCE7F3',
        borderColor: '#DB2777',
      },
    ],
    questions: [
      {
        id: 'mn_q1',
        name: 'Loktak Floating Lake',
        stateId: 'manipur',
        stateName: 'Manipur',
        description: 'Freshwater lake famed for circular floating vegetational rings called Phumdis.',
        funFact: 'Keibul Lamjao on this lake is the only floating national park on Earth.',
        imageUrl: '/assets/images/manipur-loktak.jpg',
        options: ['Loktak Lake (Manipur)', 'Dal Lake (Kashmir)', 'Chilika Lake (Odisha)'],
        correctAnswer: 'Loktak Lake (Manipur)',
      },
      {
        id: 'mn_q2',
        name: 'Sangai Dancing Deer',
        stateId: 'manipur',
        stateName: 'Manipur',
        description: 'Rare brow-antlered deer adapted to walking on floating marshland.',
        funFact: 'It is the official state animal of Manipur and celebrated in traditional folk songs.',
        imageUrl: '/assets/images/manipur-sangai.jpg',
        options: ['Sangai Deer (Manipur)', 'Spotted Chital', 'Musk Deer'],
        correctAnswer: 'Sangai Deer (Manipur)',
      },
    ],
  },

  meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya',
    nativeName: 'Meghalaya',
    items: [
      {
        id: 'mg_rootbridge',
        name: 'Double Decker Living Root Bridge',
        localName: 'Jingkieng Jri (Nongriat)',
        stateId: 'meghalaya',
        stateName: 'Meghalaya',
        description: 'Centuries-old bioengineering bridges grown across rainforest streams from Ficus tree roots.',
        imageUrl: '/assets/images/meghalaya-root-bridge.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#15803D',
      },
      {
        id: 'mg_nohkalikai',
        name: 'Nohkalikai Waterfall',
        localName: 'Nohkalikai Falls (Sohra)',
        stateId: 'meghalaya',
        stateName: 'Meghalaya',
        description: 'India’s tallest plunge waterfall (1,115 feet) plunging into a turquoise lagoon near Cherrapunji.',
        imageUrl: '/assets/images/meghalaya-nohkalikai.jpg',
        bgColor: '#E0F2FE',
        borderColor: '#0284C7',
      },
      {
        id: 'mg_dawki',
        name: 'Dawki Umngot River',
        localName: 'Wah Umngot (Dawki)',
        stateId: 'meghalaya',
        stateName: 'Meghalaya',
        description: 'Crystal-clear emerald waters where wooden boats appear suspended in air.',
        imageUrl: '/assets/images/meghalaya-dawki.jpg',
        bgColor: '#CCFBF1',
        borderColor: '#0D9488',
      },
      {
        id: 'mg_mawlynnong',
        name: 'Mawlynnong Village',
        localName: "God's Own Garden",
        stateId: 'meghalaya',
        stateName: 'Meghalaya',
        description: 'Acclaimed as Asia’s cleanest village, celebrated for floral pathways and community cleanliness.',
        imageUrl: '/assets/images/meghalaya-mawlynnong.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
    ],
    questions: [
      {
        id: 'mg_q1',
        name: 'Living Root Bridges',
        stateId: 'meghalaya',
        stateName: 'Meghalaya',
        description: 'Botanical bridges hand-guided across swift rivers by Khasi and Jaintia villagers.',
        funFact: 'These bridges become stronger over generations as living tree roots continue to grow.',
        imageUrl: '/assets/images/meghalaya-root-bridge.jpg',
        options: ['Double Decker Root Bridge (Meghalaya)', 'Howrah Bridge', 'Pamban Bridge'],
        correctAnswer: 'Double Decker Root Bridge (Meghalaya)',
      },
      {
        id: 'mg_q2',
        name: 'Nohkalikai Waterfall',
        stateId: 'meghalaya',
        stateName: 'Meghalaya',
        description: 'Magnificent 1,115-foot plunge waterfall fed by Cherrapunji’s abundant clouds.',
        funFact: 'It is the highest plunge waterfall in India, cascading directly off the Sohra plateau.',
        imageUrl: '/assets/images/meghalaya-nohkalikai.jpg',
        options: ['Nohkalikai Falls (Meghalaya)', 'Jog Falls', 'Dudhsagar Falls'],
        correctAnswer: 'Nohkalikai Falls (Meghalaya)',
      },
    ],
  },

  mizoram: {
    id: 'mizoram',
    name: 'Mizoram',
    nativeName: 'Mizoram',
    items: [
      {
        id: 'mz_cheraw',
        name: 'Cheraw Bamboo Dance',
        localName: 'Cheraw (Bamboo Dance)',
        stateId: 'mizoram',
        stateName: 'Mizoram',
        description: 'Rhythmic folk dance where performers step in and out of clapping horizontal bamboo staves.',
        imageUrl: '/assets/images/mizoram-cheraw.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
      {
        id: 'mz_reiek',
        name: 'Reiek Heritage Peak',
        localName: 'Reiek Tlang Summit',
        stateId: 'mizoram',
        stateName: 'Mizoram',
        description: 'Towering cliff summit overlooking scenic Aizawl hills and a traditional model Mizo village.',
        imageUrl: '/assets/images/mizoram-reiek.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#15803D',
      },
      {
        id: 'mz_puan',
        name: 'Puan Handwoven Textile',
        localName: 'Puan Chei (Mizo Shawl)',
        stateId: 'mizoram',
        stateName: 'Mizoram',
        description: 'Intricately patterned handwoven shawl with bold red, black, and white traditional stripes.',
        imageUrl: '/assets/images/mizoram-puan.jpg',
        bgColor: '#FEE2E2',
        borderColor: '#DC2626',
      },
      {
        id: 'mz_vantawng',
        name: 'Vantawng Falls',
        localName: 'Vantawng Khawhthla',
        stateId: 'mizoram',
        stateName: 'Mizoram',
        description: 'Highest two-tiered waterfall in Mizoram, plunging 750 feet amidst thick bamboo forests.',
        imageUrl: '/assets/images/mizoram-vantawng.jpg',
        bgColor: '#E0F2FE',
        borderColor: '#0284C7',
      },
    ],
    questions: [
      {
        id: 'mz_q1',
        name: 'Cheraw Bamboo Dance',
        stateId: 'mizoram',
        stateName: 'Mizoram',
        description: 'Iconic dance performed with precision between rhythmic clapping bamboo poles.',
        funFact: 'Cheraw holds the world record for the largest synchronized bamboo dance performance.',
        imageUrl: '/assets/images/mizoram-cheraw.jpg',
        options: ['Cheraw Bamboo Dance (Mizoram)', 'Bihu Folk Dance', 'Kathakali'],
        correctAnswer: 'Cheraw Bamboo Dance (Mizoram)',
      },
    ],
  },

  nagaland: {
    id: 'nagaland',
    name: 'Nagaland',
    nativeName: 'Nagaland',
    items: [
      {
        id: 'nl_hornbill_fest',
        name: 'Hornbill Festival Kisama',
        localName: 'Festival of Festivals',
        stateId: 'nagaland',
        stateName: 'Nagaland',
        description: 'Grand cultural celebration bringing together all 16 Naga tribes in music, dance, and crafts.',
        imageUrl: '/assets/images/nagaland-hornbill-festival.jpg',
        bgColor: '#FFEDD5',
        borderColor: '#EA580C',
      },
      {
        id: 'nl_dzukou',
        name: 'Dzukou Valley of Lilies',
        localName: 'Dzukou Valley (2,452m)',
        stateId: 'nagaland',
        stateName: 'Nagaland',
        description: 'Enchanting valley of rolling emerald green hillocks and rare endemic Dzukou lilies.',
        imageUrl: '/assets/images/nagaland-dzukou.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#15803D',
      },
      {
        id: 'nl_shawl',
        name: 'Naga Tribal Warrior Shawl',
        localName: 'Tsungkotepsu Shawl',
        stateId: 'nagaland',
        stateName: 'Nagaland',
        description: 'Distinctive geometric handloom textile woven with symbolic warrior and animal motifs.',
        imageUrl: '/assets/images/nagaland-naga-shawl.jpg',
        bgColor: '#FEE2E2',
        borderColor: '#DC2626',
      },
      {
        id: 'nl_khonoma',
        name: 'Khonoma Green Village',
        localName: 'Asia’s First Green Village',
        stateId: 'nagaland',
        stateName: 'Nagaland',
        description: 'Historic Angami settlement famous for community forest protection and terraced agriculture.',
        imageUrl: '/assets/images/nagaland-khonoma.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
    ],
    questions: [
      {
        id: 'nl_q1',
        name: 'Hornbill Festival of Nagaland',
        stateId: 'nagaland',
        stateName: 'Nagaland',
        description: 'Annual cultural festival held every December at the Naga Heritage Village Kisama.',
        funFact: 'Named in honor of the revered Hornbill bird celebrated in tribal folk songs.',
        imageUrl: '/assets/images/nagaland-hornbill-festival.jpg',
        options: ['Hornbill Festival (Nagaland)', 'Pushkar Fair', 'Sunburn Goa'],
        correctAnswer: 'Hornbill Festival (Nagaland)',
      },
    ],
  },

  sikkim: {
    id: 'sikkim',
    name: 'Sikkim',
    nativeName: 'सिक्किम',
    items: [
      {
        id: 'sk_kanchenjunga',
        name: 'Mount Kanchenjunga Peak',
        localName: 'Khangchendzonga (28,169 ft)',
        stateId: 'sikkim',
        stateName: 'Sikkim',
        description: 'World’s 3rd highest mountain peak, venerated as the sacred guardian deity of Sikkim.',
        imageUrl: '/assets/images/sikkim-kanchenjunga.jpg',
        bgColor: '#E0F2FE',
        borderColor: '#0284C7',
      },
      {
        id: 'sk_rumtek',
        name: 'Rumtek Monastery',
        localName: 'Dharma Chakra Centre',
        stateId: 'sikkim',
        stateName: 'Sikkim',
        description: 'Grand golden Tibetan Buddhist Gompa perched near Gangtok, seat of the Gyalwang Karmapa.',
        imageUrl: '/assets/images/sikkim-rumtek.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
      {
        id: 'sk_red_panda',
        name: 'Himalayan Red Panda',
        localName: 'State Animal of Sikkim',
        stateId: 'sikkim',
        stateName: 'Sikkim',
        description: 'Gentle arboreal mammal with rust-red fur and striped tail, thriving in rhododendron forests.',
        imageUrl: '/assets/images/sikkim-red-panda.jpg',
        bgColor: '#FFEDD5',
        borderColor: '#EA580C',
      },
      {
        id: 'sk_gurudongmar',
        name: 'Gurudongmar Sacred Lake',
        localName: 'Gurudongmar (17,800 ft)',
        stateId: 'sikkim',
        stateName: 'Sikkim',
        description: 'One of the highest alpine lakes in the world, sacred to both Buddhists and Sikhs.',
        imageUrl: '/assets/images/sikkim-gurudongmar.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#166534',
      },
    ],
    questions: [
      {
        id: 'sk_q1',
        name: 'Mount Kanchenjunga',
        stateId: 'sikkim',
        stateName: 'Sikkim',
        description: 'The world’s 3rd highest peak rising above the mist across Sikkim.',
        funFact: 'Out of reverence, expeditions historically stopped short of the sacred summit.',
        imageUrl: '/assets/images/sikkim-kanchenjunga.jpg',
        options: ['Kanchenjunga (Sikkim)', 'Mount Everest', 'Nanda Devi'],
        correctAnswer: 'Kanchenjunga (Sikkim)',
      },
    ],
  },

  tripura: {
    id: 'tripura',
    name: 'Tripura',
    nativeName: 'ত্রিপুরা',
    items: [
      {
        id: 'tr_ujjayanta',
        name: 'Ujjayanta Royal Palace',
        localName: 'উজ্বয়ন্ত প্ৰাসাদ (Agartala)',
        stateId: 'tripura',
        stateName: 'Tripura',
        description: 'Grand neoclassical white palace built in 1901 by Maharaja Radha Kishore Manikya.',
        imageUrl: '/assets/images/tripura-ujjayanta.jpg',
        bgColor: '#FEF3C7',
        borderColor: '#D97706',
      },
      {
        id: 'tr_neermahal',
        name: 'Neermahal Water Palace',
        localName: 'নীৰমহল (Rudrasagar Lake)',
        stateId: 'tripura',
        stateName: 'Tripura',
        description: 'Picturesque royal summer fortress palace erected in the middle of Lake Rudrasagar.',
        imageUrl: '/assets/images/tripura-neermahal.jpg',
        bgColor: '#E0F2FE',
        borderColor: '#0284C7',
      },
      {
        id: 'tr_unakoti',
        name: 'Unakoti Rock Reliefs',
        localName: 'উনকৌটি শিৱৰ খোদিত মূৰ্তি',
        stateId: 'tripura',
        stateName: 'Tripura',
        description: 'Colossal 7th-century rock-cut carvings of Lord Shiva carved along forested hillsides.',
        imageUrl: '/assets/images/tripura-unakoti.jpg',
        bgColor: '#FFEDD5',
        borderColor: '#EA580C',
      },
      {
        id: 'tr_bamboo',
        name: 'Tripura Bamboo & Cane Crafts',
        localName: 'ত্ৰিপুৰাৰ বাঁহ-বেতৰ শিল্প',
        stateId: 'tripura',
        stateName: 'Tripura',
        description: 'Masterfully handwoven bamboo partitions, lamps, and furniture famed for craftsmanship.',
        imageUrl: '/assets/images/tripura-bamboo-craft.jpg',
        bgColor: '#DCFCE7',
        borderColor: '#15803D',
      },
      {
        id: 'tr_hojagiri',
        name: 'Hojagiri Reang Folk Dance',
        localName: 'হোজাগিৰি নৃত্য (Reang)',
        stateId: 'tripura',
        stateName: 'Tripura',
        description: 'Remarkable acrobatic folk dance balancing upon earthen pitchers and brass trays.',
        imageUrl: '/assets/images/tripura-hojagiri.jpg',
        bgColor: '#FCE7F3',
        borderColor: '#DB2777',
      },
    ],
    questions: [
      {
        id: 'tr_q1',
        name: 'Ujjayanta Palace',
        stateId: 'tripura',
        stateName: 'Tripura',
        description: 'Stately white neoclassical royal palace in the heart of Agartala.',
        funFact: 'Nobel Laureate Rabindranath Tagore was a frequent guest and named this palace.',
        imageUrl: '/assets/images/tripura-ujjayanta.jpg',
        options: ['Ujjayanta Palace (Tripura)', 'Mysore Palace', 'Victoria Memorial'],
        correctAnswer: 'Ujjayanta Palace (Tripura)',
      },
      {
        id: 'tr_q2',
        name: 'Neermahal Water Palace',
        stateId: 'tripura',
        stateName: 'Tripura',
        description: 'Stunning royal palace surrounded on all sides by the waters of Rudrasagar Lake.',
        funFact: 'It is one of only two water palaces in all of India.',
        imageUrl: '/assets/images/tripura-neermahal.jpg',
        options: ['Neermahal (Tripura)', 'Jal Mahal', 'Lake Palace Udaipur'],
        correctAnswer: 'Neermahal (Tripura)',
      },
    ],
  },
};

// Multi-language translation maps for North East cultural items
const REGION_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  arunachal: { hi: 'अरुणाचल प्रदेश', as: 'অৰুণাচল প্ৰদেশ', bn: 'অরুণাচল প্রদেশ', mni: 'অরুণাচল প্রদেশ', lus: 'Arunachal Pradesh', en: 'Arunachal Pradesh' },
  assam: { hi: 'असम', as: 'অসম', bn: 'আসাম', mni: 'অসম', lus: 'Assam', en: 'Assam' },
  manipur: { hi: 'मणिपुर', as: 'মণিপুৰ', bn: 'মণিপুর', mni: 'মণিপুর', lus: 'Manipur', en: 'Manipur' },
  meghalaya: { hi: 'मेघालय', as: 'মেঘালয়', bn: 'মেঘালয়', mni: 'মেঘালয়', lus: 'Meghalaya', en: 'Meghalaya' },
  mizoram: { hi: 'मिज़ोरम', as: 'মিজোৰাম', bn: 'মিজোরাম', mni: 'মিজোরাম', lus: 'Mizoram', en: 'Mizoram' },
  nagaland: { hi: 'नागालैंड', as: 'নাগালেণ্ড', bn: 'নাগাল্যান্ড', mni: 'নাগাল্যান্ড', lus: 'Nagaland', en: 'Nagaland' },
  sikkim: { hi: 'सिक्किम', as: 'ছিকিম', bn: 'সিকিম', mni: 'সিকিম', lus: 'Sikkim', en: 'Sikkim' },
  tripura: { hi: 'त्रिपुरा', as: 'ত্ৰিপুৰা', bn: 'ত্রিপুরা', mni: 'ত্রিপুরা', lus: 'Tripura', en: 'Tripura' },
};

const ITEM_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  ar_tawang: { hi: 'तवांग मठ', as: 'তাৱাং মঠ', bn: 'তাওয়াং মনাস্ট্রি', mni: 'তাৱাং গোম্পা', lus: 'Tawang Monastery', en: 'Tawang Monastery' },
  ar_hornbill: { hi: 'ग्रेट इंडियन हॉर्नबिल', as: 'ধনেশ পক্ষী', bn: 'হর্নবিল পাখি', mni: 'উচেক হর্নবিল', lus: 'Vaphai (Hornbill)', en: 'Great Indian Hornbill' },
  ar_sela: { hi: 'सेला दर्रा और पवित्र झील', as: 'চেলা পাছ আৰু পৱিত্ৰ হ্ৰদ', bn: 'সেলা পাস ও হ্রদ', mni: 'সেলা পাছ', lus: 'Sela Pass', en: 'Sela Pass & Sacred Lake' },
  ar_ziro: { hi: 'ज़ीरो घाटी चीड़ की पहाड़ियाँ', as: 'জিৰ’ উপত্যকাৰ পাইন বন', bn: 'জিরো উপত্যকা', mni: 'জিরো তম্পাক', lus: 'Ziro Valley', en: 'Ziro Valley Pine Hills' },
  as_tea: { hi: 'असम चाय बागान', as: 'অসমৰ চাহ বাগান', bn: 'আসাম চা বাগান', mni: 'অসমগী চা পাম', lus: 'Assam Thingpui Huan', en: 'Assam Tea Garden' },
  as_dhol: { hi: 'बिहू ढोल', as: 'বিহু ঢোল', bn: 'বিহু ঢোল', mni: 'বিহু পুং', lus: 'Bihu Khuang', en: 'Bihu Dhol' },
  as_rhino: { hi: 'काजीरंगा एक सींग वाला गैंडा', as: 'কাজিৰঙাৰ এশিঙীয়া গঁড়', bn: 'কাজিরাঙ্গার একশৃঙ্গ গণ্ডার', mni: 'কাজিরঙ্গাগী সামু', lus: 'Kaziranga Saikawp', en: 'Kaziranga One-Horned Rhino' },
  as_mask: { hi: 'माजुली पारंपरिक मुखौटा', as: 'মাজুলীৰ ঐতিহ্যমণ্ডিত মুখা', bn: 'মাজুলী ঐতিহ্যবাহী মুখোশ', mni: 'মাজুলীগী মৈথৈ মুখা', lus: 'Majuli Hmai Tuamna', en: 'Majuri Mukha Mask' },
  as_jaapi: { hi: 'असमिया जापी टोपी', as: 'অসমীয়া পৰম্পৰাগত জাপি', bn: 'আসামি জাপি টুপি', mni: 'অসমগী জাপি', lus: 'Assam Lukhum (Jaapi)', en: 'Assamese Jaapi Hat' },
  mn_loktak: { hi: 'लोकटक झील और फुमदी', as: 'লোকটক হ্ৰদ আৰু ফুমদি', bn: 'লোকটক হ্রদ ও ফুমদি', mni: 'লোকতাক পাৎ অমসুং ফুমদি', lus: 'Loktak Dil', en: 'Loktak Lake & Phumdis' },
  mn_sangai: { hi: 'सांगई हिरण', as: 'চাংগাই হৰিণ', bn: 'সাঙ্গাই হরিণ', mni: 'সঙ্গাই শজিক', lus: 'Sangai Sakhi', en: 'Sangai Brow-Antlered Deer' },
  mn_dance: { hi: 'मणिपुरी रासलीला नृत्य', as: 'মণিপুৰী ৰাসলীলা নৃত্য', bn: 'মণিপুরী রাসলীলা নৃত্য', mni: 'মণিপুরী রাসলীল', lus: 'Manipuri Lam', en: 'Manipuri Classical Raas Dance' },
  mn_kangla: { hi: 'कांगला किला', as: 'কাংলা দুৰ্গ', bn: 'কাংলা দুর্গ', mni: 'কাংলা কোন্নুং', lus: 'Kangla Kulh', en: 'Kangla Fort Historic Palace' },
  mg_bridge: { hi: 'जीवित जड़ पुल', as: 'জীৱন্ত শিপাৰ দলং', bn: 'জীবন্ত মূল সেতু', mni: 'হিংলিবা মখা থোং', lus: 'Zung Lei (Living Root Bridge)', en: 'Living Root Bridge' },
  mg_falls: { hi: 'नोहकालिकाई जलप्रपात', as: 'নোহকালিকাই জলপ্ৰপাত', bn: 'নোহকালিকাই জলপ্রপাত', mni: 'নোহকালিকাই ঈথক', lus: 'Nohkalikai Tuikhawhthla', en: 'Nohkalikai Falls' },
  mg_dawki: { hi: 'डावकी उमंगोत नदी', as: 'ডাউকী উমংগট নদী', bn: 'ডাউকি উমঙ্গট নদী', mni: 'ডাউকী তুরেল', lus: 'Dawki Luipui', en: 'Dawki Umngot Crystal River' },
  mg_cave: { hi: 'क्रेम लियात प्राह गुफा', as: 'ক্ৰেম লিয়াত প্ৰাহ গুহা', bn: 'ক্রেম লিয়াত প্রাহ গুহা', mni: 'ক্ৰেম সুরং', lus: 'Krem Puk', en: 'Krem Liat Prah Cave' },
  mz_cheraw: { hi: 'चेराव बांस नृत्य', as: 'চেৰাও বাঁহ নৃত্য', bn: 'চেরাও বাঁশ নৃত্য', mni: 'চেরাও ৱা শানবা', lus: 'Cheraw Kan (Bamboo Dance)', en: 'Cheraw Bamboo Dance' },
  mz_chapchar: { hi: 'चापचार कुट वसंत उत्सव', as: 'চাপচাৰ কুট উৎসৱ', bn: 'চাপচার কুট বসন্ত উৎসব', mni: 'চাপচার কুট কুহ্মৈ', lus: 'Chapchar Kut Kut Pui', en: 'Chapchar Kut Spring Festival' },
  mz_reiek: { hi: 'रेइक पर्वत शिखर', as: 'ৰেইক টিলা', bn: 'রেইক পাহাড় চূড়া', mni: 'রেইক চিংথোল', lus: 'Reiek Tlang Mawi', en: 'Reiek Tlang Mountain Peak' },
  mz_puan: { hi: 'मिज़ो पारंपरिक पुआन पोशाक', as: 'মিজো পুৱান পৰম্পৰাগত বস্ত্ৰ', bn: 'মিজো পুয়ান পোশাক', mni: 'মিজো পুয়ান ফী', lus: 'Mizo Puan Chei', en: 'Mizo Handwoven Puan' },
  nl_hornbill_fest: { hi: 'हॉर्नबिल उत्सव किसामा', as: 'হৰ্ণবিল মহোৎসৱ কিচামা', bn: 'হর্নবিল উৎসব কিসামা', mni: 'হর্নবিল কুহ্মৈ', lus: 'Hornbill Kut Kisama', en: 'Hornbill Festival Kisama' },
  nl_dzukou: { hi: 'द्जुकोऊ घाटी लिली फूल', as: 'ডিজুকৌ উপত্যকাৰ লিলি ফুল', bn: 'জুকো উপত্যকা লিলি ফুল', mni: 'জুকো তম্পাক লৈরাং', lus: 'Dzukou Phaizau', en: 'Dzukou Valley Lilies' },
  nl_shawl: { hi: 'नागा पारंपरिक शॉल', as: 'নাগা পৰম্পৰাগত চাদৰ', bn: 'নাগা ঐতিহ্যবাহী শাল', mni: 'নাগা খুদেই শাল', lus: 'Naga Puan Mawi', en: 'Naga Heritage Warrior Shawl' },
  nl_morung: { hi: 'पारंपरिक नागा मोरंग', as: 'পৰম্পৰাগত নাগা মৰুং', bn: 'ঐতিহ্যবাহী নাগা মোরুং', mni: 'নাগা মরুং য়ুম্থোল', lus: 'Naga Morung In', en: 'Traditional Naga Morung' },
  sk_kanchenjunga: { hi: 'कंचनजंगा पर्वत शिखर', as: 'কাঞ্চনজংঘা শৃংগ', bn: 'কাঞ্চনজঙ্ঘা পর্বত শৃঙ্গ', mni: 'কাঞ্চনজঙ্ঘা চিংথোল', lus: 'Kanchenjunga Tlang', en: 'Mount Kanchenjunga Peak' },
  sk_rumtek: { hi: 'रुमटेक मठ गंगटोक', as: 'ৰুমটেক মঠ গেংটক', bn: 'রুমটেক মনাস্ট্রি গ্যাংটক', mni: 'রুমটেक গোম্পা', lus: 'Rumtek Monastery', en: 'Rumtek Monastery Gangtok' },
  sk_tsomgo: { hi: 'त्सोमगो पवित्र हिमनद झील', as: 'ছমগো পৱিত্ৰ হ্ৰদ', bn: 'সোমগো পবিত্র হ্রদ', mni: 'সোমগো পাৎ', lus: 'Tsomgo Dil Mawi', en: 'Tsomgo Glacial Sacred Lake' },
  sk_orchid: { hi: 'सिक्किम नोबल डेंड्रोबियम ऑर्किड', as: 'ছিকিমৰ ৰাজকীয় অৰ্কিড', bn: 'সিকিম নোবেল অর্কিড', mni: 'সিকিমগী লৈরাং অৰ্কিদ', lus: 'Sikkim Orchid Mawi', en: 'Noble Dendrobium Orchid' },
  tr_ujjayanta: { hi: 'उज्जयंत राजमहल अगरतला', as: 'উজ্জয়ন্ত ৰাজপ্ৰসাদ আগৰতলা', bn: 'উজ্জয়ন্ত রাজপ্রাসাদ আগরতলা', mni: 'উজ্জয়ন্ত কোন্নুং', lus: 'Ujjayanta Lal In', en: 'Ujjayanta Royal Palace' },
  tr_unakoti: { hi: 'उनाकोटी पाषाण प्रतिमाएं', as: 'উনাকোটিৰ শিলৰ ভাস্কৰ্য্য', bn: 'উনাকোটি পাথরের খোদাই', mni: 'উনাকোতিগী নুংগী মমি', lus: 'Unakoti Lung Ker Mawi', en: 'Unakoti Rock-Cut Bas Reliefs' },
  tr_neermahal: { hi: 'नीरमहल जलमहल रुद्रसागर', as: 'নীৰমহল জলপ্ৰসাদ ৰুদ্ৰসাগৰ', bn: 'নীরমহল জলপ্রাসাদ রুদ্রসাগর', mni: 'নীরমহল ঈশিং কোন্নুং', lus: 'Neermahal Tui Lal In', en: 'Neermahal Water Palace' },
  tr_tripurasundari: { hi: 'त्रिपुरा सुंदरी शक्तिपीठ मंदिर', as: 'ত্ৰিপুৰা সুন্দৰী মন্দিৰ', bn: 'ত্রিপুরা সুন্দরী মন্দির উদয়পুর', mni: 'ত্রিপুরা সুন্দরী লাইশং', lus: 'Tripura Sundari Biak In', en: 'Tripura Sundari Shaktipeeth' },
};

// Helper: Get cultural memory items for a specific state, localized to active language
export const getRegionItems = (stateId: NERStateId = 'assam', lang?: string): NERMemoryItem[] => {
  const profile = NER_STATES_DATA[stateId] || NER_STATES_DATA.assam;
  if (!lang || lang === 'en') return profile.items;

  return profile.items.map((item) => ({
    ...item,
    name: ITEM_NAME_TRANSLATIONS[item.id]?.[lang] || item.name,
    stateName: REGION_NAME_TRANSLATIONS[item.stateId]?.[lang] || item.stateName,
  }));
};

// Helper: Get trivia questions for a specific state, localized to active language
export const getRegionQuestions = (stateId: NERStateId = 'assam', lang?: string): StateTriviaQuestion[] => {
  const profile = NER_STATES_DATA[stateId] || NER_STATES_DATA.assam;
  if (!lang || lang === 'en') return profile.questions;

  return profile.questions.map((q) => {
    const locName = ITEM_NAME_TRANSLATIONS[q.id]?.[lang] || q.name;
    const locState = REGION_NAME_TRANSLATIONS[q.stateId]?.[lang] || q.stateName;
    const locOptions = q.options.map((opt) => {
      // Find matching item
      const entry = Object.entries(ITEM_NAME_TRANSLATIONS).find(([_, dict]) => dict.en === opt);
      if (entry && entry[1][lang]) return entry[1][lang];
      return opt;
    });
    const correctEntry = Object.entries(ITEM_NAME_TRANSLATIONS).find(([_, dict]) => dict.en === q.correctAnswer);
    const locCorrect = correctEntry && correctEntry[1][lang] ? correctEntry[1][lang] : q.correctAnswer;

    return {
      ...q,
      name: locName,
      stateName: locState,
      options: locOptions,
      correctAnswer: locCorrect,
    };
  });
};

// Backwards compatibility export
export const NER_MEMORY_ITEMS = getRegionItems('assam');

export interface TriviaQuestion {
  id: string;
  question: string;
  subtext: string;
  photoUrl?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  audioPrompt: string;
}

export const SPHERICAL_TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 't-1',
    question: 'Whose photo is this in the yellow jersey?',
    subtext: 'Look at his bright smile! He plays football every Sunday.',
    photoUrl: 'rahul',
    options: ['Rahul (Grandson)', 'Bikash (Son)', 'Priya (Daughter)', 'Neighbour Nilav'],
    correctAnswer: 'Rahul (Grandson)',
    explanation: 'Yes! That is your beloved grandson Rahul. He visits you every Sunday!',
    audioPrompt: 'Yes, that is your grandson Rahul. He loves playing football with you.',
  },
];
