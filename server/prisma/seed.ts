import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function ensureDemoOwner() {
  const email = "owner@uzmedatlas.local";
  const password = process.env.CLINIC_PASSWORD || "clinic123";
  let owner = await prisma.clinicOwner.findUnique({ where: { email } });
  if (!owner) {
    owner = await prisma.clinicOwner.create({
      data: {
        email,
        name: "Demo Clinic Owner",
        passwordHash: hashPassword(password),
      },
    });
    console.log(`Created demo owner ${email} / ${password}`);
  }
  await prisma.clinic.updateMany({
    where: { ownerId: null },
    data: { ownerId: owner.id },
  });
  return owner;
}
type SpecialtySeed = {
  slug: string;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  explanationEn: string;
  explanationRu: string;
  keywords: string;
  sortOrder: number;
};

const specialties: SpecialtySeed[] = [
  {
    slug: "cardiology",
    nameEn: "Cardiology",
    nameRu: "Кардиология",
    descriptionEn: "Heart and blood vessel care, from check-ups to diagnostics.",
    descriptionRu: "Заболевания сердца и сосудов: консультации и диагностика.",
    explanationEn:
      "Chest discomfort, palpitations, high blood pressure, or a request for a heart check-up usually point to cardiology.",
    explanationRu:
      "Боль или дискомфорт в груди, сердцебиение, давление или желание проверить сердце обычно относятся к кардиологии.",
    keywords:
      "heart, chest, palpitations, pressure, blood pressure, tachycardia, cardiolog, ecg, echo, hypertension, arrhythmia, cardiac, сердце, груд, давлен, сердцебиен, кардио, экг, гипертон, аритм, инфаркт, сосуд",
    sortOrder: 1,
  },
  {
    slug: "neurology",
    nameEn: "Neurology",
    nameRu: "Неврология",
    descriptionEn: "Headaches, dizziness, nerve pain, and other nervous system concerns.",
    descriptionRu: "Головная боль, головокружение, онемение и другие жалобы по нервной системе.",
    explanationEn:
      "Headaches, dizziness, numbness, migraines, or seizures are often assessed by a neurologist.",
    explanationRu:
      "Головная боль, головокружение, онемение, мигрень или судороги чаще всего оценивает невролог.",
    keywords:
      "headache, dizzy, dizziness, migraine, numbness, seizure, stroke, nerve, neurolog, fainting, memory, голова, головн, головокруж, мигрен, онемен, судорог, неврол, инсульт, память, обморок",
    sortOrder: 2,
  },
  {
    slug: "orthopedics",
    nameEn: "Orthopedics",
    nameRu: "Ортопедия",
    descriptionEn: "Joints, bones, spine, and mobility problems.",
    descriptionRu: "Суставы, кости, позвоночник и проблемы с движением.",
    explanationEn:
      "Knee, hip, back, or joint pain — especially when walking — is typically an orthopedic question.",
    explanationRu:
      "Боль в колене, спине, тазобедренном суставе или при ходьбе обычно относится к ортопедии.",
    keywords:
      "knee, joint, bone, fracture, hip, ankle, shoulder, spine, back, walking, orthopedic, arthritis, meniscus, ligament, scoliosis, колено, сустав, кость, перелом, бедро, позвоночник, ортопед, ходьб, спина, артрит, мениск, связк, сколиоз",
    sortOrder: 3,
  },
  {
    slug: "ophthalmology",
    nameEn: "Ophthalmology",
    nameRu: "Офтальмология",
    descriptionEn: "Eye care, vision diagnostics, and surgery.",
    descriptionRu: "Зрение, диагностика глаз и офтальмологические операции.",
    explanationEn:
      "Blurred vision, eye pain, cataracts, or a wish to check eyesight belong to ophthalmology.",
    explanationRu:
      "Снижение зрения, боль в глазу, катаракта или желание проверить зрение — это офтальмология.",
    keywords:
      "eye, vision, cataract, retina, glasses, ophthalm, lasik, glaucoma, blurry, глаз, зрен, катаракт, сетчатк, офтальм, близору, глауком, лазер",
    sortOrder: 4,
  },
  {
    slug: "dentistry",
    nameEn: "Dentistry",
    nameRu: "Стоматология",
    descriptionEn: "Dental treatment, implants, and aesthetic dentistry.",
    descriptionRu: "Лечение зубов, имплантация и эстетическая стоматология.",
    explanationEn:
      "Tooth pain, implants, veneers, or a smile makeover are handled by dental clinics.",
    explanationRu:
      "Боль в зубе, импланты, виниры или восстановление улыбки — это стоматология.",
    keywords:
      "tooth, teeth, dental, implant, veneer, gum, smile, cavity, dentist, зуб, стомат, имплант, винир, десна, улыбк, кариес, челюст",
    sortOrder: 5,
  },
  {
    slug: "urology",
    nameEn: "Urology",
    nameRu: "Урология",
    descriptionEn: "Urinary tract and men's health.",
    descriptionRu: "Мочевыводящие пути и мужское здоровье.",
    explanationEn:
      "Urinary symptoms, kidney stones, or prostate concerns are usually seen in urology.",
    explanationRu:
      "Проблемы с мочеиспусканием, камни в почках или жалобы по простате относятся к урологии.",
    keywords:
      "urine, urinary, kidney, prostate, stone, urolog, bladder, моч, почк, простат, уролог, камень, камни, пузыр",
    sortOrder: 6,
  },
  {
    slug: "gynecology",
    nameEn: "Gynecology",
    nameRu: "Гинекология",
    descriptionEn: "Women's health, pregnancy planning, and gynecologic care.",
    descriptionRu: "Женское здоровье, планирование беременности и гинекологическая помощь.",
    explanationEn:
      "Cycle issues, pregnancy planning, or women's health check-ups are gynecology.",
    explanationRu:
      "Сбой цикла, планирование беременности или женский check-up — это гинекология.",
    keywords:
      "gynecolo, pregnancy, uterus, ovary, period, menstrual, women, fertility, гинекол, беременност, матка, яичник, цикл, месячн, женск, бесплод",
    sortOrder: 7,
  },
  {
    slug: "pediatrics",
    nameEn: "Pediatrics",
    nameRu: "Педиатрия",
    descriptionEn: "Medical care for children and adolescents.",
    descriptionRu: "Медицинская помощь детям и подросткам.",
    explanationEn:
      "If the patient is a child, a pediatric clinic is usually the right first step.",
    explanationRu:
      "Если нужна помощь ребенку, первым шагом обычно становится педиатрия.",
    keywords:
      "child, kid, baby, infant, pediatric, teenager, son, daughter, ребенок, детей, детск, педиатр, малыш, подросток, сын, дочь",
    sortOrder: 8,
  },
  {
    slug: "surgery",
    nameEn: "Surgery",
    nameRu: "Хирургия",
    descriptionEn: "Surgical consultations and planned operations.",
    descriptionRu: "Хирургические консультации и плановые операции.",
    explanationEn:
      "A planned operation, hernia, gallbladder, or a surgical second opinion points to surgery.",
    explanationRu:
      "Плановая операция, грыжа, желчный пузырь или второе хирургическое мнение — это хирургия.",
    keywords:
      "surgery, operation, hernia, gallbladder, laparoscopic, surgeon, appendix, операц, хирур, грыж, желчн, лапароскоп, аппендицит",
    sortOrder: 9,
  },
  {
    slug: "oncology",
    nameEn: "Oncology",
    nameRu: "Онкология",
    descriptionEn: "Cancer diagnostics and treatment planning.",
    descriptionRu: "Онкодиагностика и планирование лечения.",
    explanationEn:
      "A tumor, oncology second opinion, or cancer screening is handled by an oncology clinic.",
    explanationRu:
      "Опухоль, онкологическое второе мнение или скрининг рака — это онкология.",
    keywords:
      "cancer, tumor, oncology, chemotherapy, biopsy, malignant, онколог, опухол, рак, химиотерап, биопси, злокачеств",
    sortOrder: 10,
  },
  {
    slug: "gastroenterology",
    nameEn: "Gastroenterology",
    nameRu: "Гастроэнтерология",
    descriptionEn: "Stomach, intestine, liver, and digestive complaints.",
    descriptionRu: "Желудок, кишечник, печень и другие жалобы по пищеварению.",
    explanationEn:
      "Stomach pain, reflux, liver issues, or bowel symptoms are typically gastroenterology.",
    explanationRu:
      "Боль в желудке, изжога, печень или проблемы с кишечником обычно относятся к гастроэнтерологии.",
    keywords:
      "stomach, gastro, liver, intestine, reflux, ulcer, digestion, nausea, abdomen, желуд, гастро, печен, кишечн, изжог, язв, пищеварен, тошнот, живот",
    sortOrder: 11,
  },
  {
    slug: "diagnostics",
    nameEn: "Diagnostics",
    nameRu: "Диагностика",
    descriptionEn: "MRI, CT, ultrasound, laboratory tests, and check-up programs.",
    descriptionRu: "МРТ, КТ, УЗИ, анализы и check-up программы.",
    explanationEn:
      "If you need MRI, CT, a check-up, or tests without a clear specialty yet, start with diagnostics.",
    explanationRu:
      "Если нужны МРТ, КТ, check-up или обследования без точного направления, начните с диагностики.",
    keywords:
      "mri, ct, scan, ultrasound, checkup, check-up, lab, analysis, screening, diagnostic, мрт, кт, узи, чекап, check, анализ, скрининг, обследован, диагностик",
    sortOrder: 12,
  },
  {
    slug: "rehabilitation",
    nameEn: "Rehabilitation",
    nameRu: "Реабилитация",
    descriptionEn: "Recovery after injury, surgery, or a neurological event.",
    descriptionRu: "Восстановление после травмы, операции или неврологического события.",
    explanationEn:
      "Recovery after surgery, injury, or a stroke is a rehabilitation question.",
    explanationRu:
      "Восстановление после операции, травмы или инсульта — это реабилитация.",
    keywords:
      "rehab, recovery, physiotherapy, physical therapy, after surgery, stroke recovery, реабилитац, восстановлен, физиотерап, лфк, после операции, инсульт восстанов",
    sortOrder: 13,
  },
];

type ClinicSeed = {
  slug: string;
  nameEn: string;
  nameRu: string;
  city: string;
  addressEn: string;
  addressRu: string;
  descriptionEn: string;
  descriptionRu: string;
  phone: string;
  email: string;
  website?: string;
  languages: string[];
  coverColor: string;
  specialties: string[];
  responseHours?: number;
  coordinatorName?: string;
  services: Array<{
    specialty: string;
    nameEn: string;
    nameRu: string;
    descriptionEn: string;
    descriptionRu: string;
    priceUsd?: number;
  }>;
};

const clinics: ClinicSeed[] = [
  {
    slug: "atlas-medical-center",
    nameEn: "Atlas Medical Center",
    nameRu: "Atlas Medical Center",
    city: "tashkent",
    addressEn: "15 Amir Temur Avenue, Tashkent",
    addressRu: "Ташкент, проспект Амира Темура, 15",
    descriptionEn:
      "A multidisciplinary private hospital for international patients, with coordinated diagnostics, specialty consultations, and English-speaking coordinators.",
    descriptionRu:
      "Многопрофильная частная клиника для зарубежных пациентов: диагностика, консультации специалистов и координаторы на английском языке.",
    phone: "+998 71 200 15 15",
    email: "care@atlasmed.uz",
    website: "https://atlasmed.example",
    languages: ["en", "ru", "uz"],
    coverColor: "#1570ef",
    responseHours: 12,
    coordinatorName: "Malika Karimova",
    specialties: [
      "cardiology",
      "neurology",
      "orthopedics",
      "diagnostics",
      "surgery",
      "gastroenterology",
    ],
    services: [
      {
        specialty: "cardiology",
        nameEn: "Cardiologist consultation",
        nameRu: "Консультация кардиолога",
        descriptionEn: "Initial consultation with a cardiologist and review of previous tests.",
        descriptionRu: "Первичная консультация кардиолога и разбор предыдущих обследований.",
        priceUsd: 60,
      },
      {
        specialty: "cardiology",
        nameEn: "ECG",
        nameRu: "ЭКГ",
        descriptionEn: "Electrocardiogram with a written report.",
        descriptionRu: "Электрокардиограмма с письменным заключением.",
        priceUsd: 25,
      },
      {
        specialty: "cardiology",
        nameEn: "Echocardiography",
        nameRu: "Эхокардиография",
        descriptionEn: "Ultrasound assessment of heart structure and function.",
        descriptionRu: "УЗИ сердца: оценка структуры и функции.",
        priceUsd: 80,
      },
      {
        specialty: "diagnostics",
        nameEn: "MRI",
        nameRu: "МРТ",
        descriptionEn: "MRI of one region with a radiologist report.",
        descriptionRu: "МРТ одной зоны с заключением рентгенолога.",
        priceUsd: 180,
      },
      {
        specialty: "diagnostics",
        nameEn: "Executive check-up",
        nameRu: "Check-up",
        descriptionEn: "One-day screening program for international patients.",
        descriptionRu: "Однодневная программа обследования для зарубежных пациентов.",
        priceUsd: 320,
      },
      {
        specialty: "neurology",
        nameEn: "Neurologist consultation",
        nameRu: "Консультация невролога",
        descriptionEn: "Assessment of headaches, dizziness, and nerve symptoms.",
        descriptionRu: "Оценка головной боли, головокружения и неврологических жалоб.",
        priceUsd: 55,
      },
    ],
  },
  {
    slug: "silk-road-heart",
    nameEn: "Silk Road Heart Institute",
    nameRu: "Институт сердца Silk Road",
    city: "tashkent",
    addressEn: "42 Shota Rustaveli Street, Tashkent",
    addressRu: "Ташкент, улица Шота Руставели, 42",
    descriptionEn:
      "A cardiology-focused clinic with heart diagnostics, check-up programs, and second opinions for international patients.",
    descriptionRu:
      "Кардиологическая клиника: диагностика сердца, check-up и второе мнение для зарубежных пациентов.",
    phone: "+998 71 233 40 40",
    email: "hello@silkroadheart.uz",
    languages: ["en", "ru"],
    coverColor: "#8B2E2E",
    specialties: ["cardiology", "diagnostics"],
    services: [
      {
        specialty: "cardiology",
        nameEn: "Heart check-up",
        nameRu: "Check-up сердца",
        descriptionEn: "Cardiologist visit, ECG, echo, and basic lab panel.",
        descriptionRu: "Прием кардиолога, ЭКГ, эхокардиография и базовая лаборатория.",
        priceUsd: 210,
      },
      {
        specialty: "cardiology",
        nameEn: "Heart diagnostics",
        nameRu: "Диагностика сердца",
        descriptionEn: "Extended cardiac work-up with a written plan.",
        descriptionRu: "Расширенное обследование сердца с письменным планом.",
        priceUsd: 150,
      },
      {
        specialty: "diagnostics",
        nameEn: "Cardiac CT",
        nameRu: "КТ сердца",
        descriptionEn: "CT assessment of coronary arteries when indicated.",
        descriptionRu: "КТ-оценка коронарных артерий по показаниям.",
      },
    ],
  },
  {
    slug: "samarkand-orthopedic",
    nameEn: "Samarkand Orthopedic Clinic",
    nameRu: "Самаркандская ортопедическая клиника",
    city: "samarkand",
    addressEn: "8 University Boulevard, Samarkand",
    addressRu: "Самарканд, Университетский бульвар, 8",
    descriptionEn:
      "Joint, spine, and sports injury care with planned surgery and early rehabilitation in Samarkand.",
    descriptionRu:
      "Лечение суставов, позвоночника и спортивных травм: плановые операции и ранняя реабилитация в Самарканде.",
    phone: "+998 66 233 11 90",
    email: "info@samortho.uz",
    languages: ["en", "ru", "uz"],
    coverColor: "#3D5A4A",
    specialties: ["orthopedics", "surgery", "rehabilitation"],
    services: [
      {
        specialty: "orthopedics",
        nameEn: "Orthopedic consultation",
        nameRu: "Консультация ортопеда",
        descriptionEn: "In-person review of joint or spine complaints, including imaging.",
        descriptionRu: "Очный разбор жалоб по суставам или позвоночнику, включая снимки.",
        priceUsd: 50,
      },
      {
        specialty: "orthopedics",
        nameEn: "Knee diagnostics",
        nameRu: "Диагностика колена",
        descriptionEn: "Clinical exam plus a plan for MRI or ultrasound if needed.",
        descriptionRu: "Осмотр и план МРТ или УЗИ при необходимости.",
        priceUsd: 70,
      },
      {
        specialty: "surgery",
        nameEn: "Planned joint surgery",
        nameRu: "Плановая операция на суставе",
        descriptionEn: "Pre-operative assessment and surgery planning for international patients.",
        descriptionRu: "Предоперационная оценка и планирование операции для зарубежных пациентов.",
      },
      {
        specialty: "rehabilitation",
        nameEn: "Post-surgery rehabilitation",
        nameRu: "Реабилитация после операции",
        descriptionEn: "Physiotherapy program after orthopedic surgery.",
        descriptionRu: "Программа ЛФК и физиотерапии после ортопедической операции.",
        priceUsd: 40,
      },
    ],
  },
  {
    slug: "bukhara-vision",
    nameEn: "Bukhara Vision Center",
    nameRu: "Bukhara Vision Center",
    city: "bukhara",
    addressEn: "3 Lyabi-Hauz Street, Bukhara",
    addressRu: "Бухара, улица Ляби-Хауз, 3",
    descriptionEn:
      "An eye clinic in the historic center of Bukhara for diagnostics, cataract care, and vision check-ups.",
    descriptionRu:
      "Офтальмологическая клиника в историческом центре Бухары: диагностика, катаракта и проверка зрения.",
    phone: "+998 65 224 08 08",
    email: "clinic@bukharavision.uz",
    languages: ["en", "ru", "tr"],
    coverColor: "#4C3B8A",
    specialties: ["ophthalmology", "diagnostics"],
    services: [
      {
        specialty: "ophthalmology",
        nameEn: "Ophthalmologist consultation",
        nameRu: "Консультация офтальмолога",
        descriptionEn: "Full eye exam and treatment plan.",
        descriptionRu: "Полный осмотр и план лечения.",
        priceUsd: 45,
      },
      {
        specialty: "ophthalmology",
        nameEn: "Cataract diagnostics",
        nameRu: "Диагностика катаракты",
        descriptionEn: "Lens assessment and surgery counseling.",
        descriptionRu: "Оценка хрусталика и консультация по операции.",
        priceUsd: 90,
      },
      {
        specialty: "diagnostics",
        nameEn: "Vision check-up",
        nameRu: "Check-up зрения",
        descriptionEn: "Screening of visual acuity, pressure, and retina.",
        descriptionRu: "Проверка остроты зрения, давления и сетчатки.",
        priceUsd: 75,
      },
    ],
  },
  {
    slug: "tashkent-family",
    nameEn: "Tashkent Family Clinic",
    nameRu: "Семейная клиника Ташкента",
    city: "tashkent",
    addressEn: "27 Yusuf Khos Khojib Street, Tashkent",
    addressRu: "Ташкент, улица Юсуфа Хос Ходжиба, 27",
    descriptionEn:
      "Family-oriented private clinic for women and children, with pediatric, gynecology, and dental care under one roof.",
    descriptionRu:
      "Семейная частная клиника для женщин и детей: педиатрия, гинекология и стоматология в одном месте.",
    phone: "+998 71 256 77 20",
    email: "family@tashfamily.uz",
    languages: ["en", "ru", "kz"],
    coverColor: "#2F6B4F",
    specialties: ["pediatrics", "gynecology", "dentistry"],
    services: [
      {
        specialty: "pediatrics",
        nameEn: "Pediatric consultation",
        nameRu: "Консультация педиатра",
        descriptionEn: "Appointment for infants, children, and teenagers.",
        descriptionRu: "Прием для малышей, детей и подростков.",
        priceUsd: 40,
      },
      {
        specialty: "gynecology",
        nameEn: "Gynecologist consultation",
        nameRu: "Консультация гинеколога",
        descriptionEn: "Women's health visit with a written recommendation.",
        descriptionRu: "Прием по женскому здоровью с письменными рекомендациями.",
        priceUsd: 50,
      },
      {
        specialty: "dentistry",
        nameEn: "Family dental check-up",
        nameRu: "Семейный стоматологический осмотр",
        descriptionEn: "Dental exam and hygiene plan for adults or children.",
        descriptionRu: "Осмотр и план гигиены для взрослых или детей.",
        priceUsd: 35,
      },
    ],
  },
  {
    slug: "orient-dental",
    nameEn: "Orient Dental Studio",
    nameRu: "Orient Dental Studio",
    city: "tashkent",
    addressEn: "10 Navoi Street, Tashkent",
    addressRu: "Ташкент, улица Навои, 10",
    descriptionEn:
      "A private dental studio for implants, veneers, and smile reconstruction, with coordinators for international patients.",
    descriptionRu:
      "Частная стоматология: импланты, виниры и восстановление улыбки, с координацией для зарубежных пациентов.",
    phone: "+998 90 170 22 11",
    email: "smile@orientdental.uz",
    languages: ["en", "ru", "tr"],
    coverColor: "#0F766E",
    specialties: ["dentistry"],
    services: [
      {
        specialty: "dentistry",
        nameEn: "Dental consultation",
        nameRu: "Консультация стоматолога",
        descriptionEn: "Exam, photos, and a preliminary treatment plan.",
        descriptionRu: "Осмотр, фотофиксация и предварительный план лечения.",
        priceUsd: 30,
      },
      {
        specialty: "dentistry",
        nameEn: "Implant planning",
        nameRu: "Планирование имплантации",
        descriptionEn: "CBCT review and implant staging for visitors.",
        descriptionRu: "Разбор КЛКТ и этапность имплантации для приезжающих пациентов.",
      },
      {
        specialty: "dentistry",
        nameEn: "Aesthetic dentistry",
        nameRu: "Эстетическая стоматология",
        descriptionEn: "Veneers and smile design consultation.",
        descriptionRu: "Консультация по винирам и дизайну улыбки.",
        priceUsd: 80,
      },
    ],
  },
  {
    slug: "regenera-rehab",
    nameEn: "Regenera Rehab",
    nameRu: "Regenera Rehab",
    city: "tashkent",
    addressEn: "5 Botanical Street, Tashkent",
    addressRu: "Ташкент, Ботаническая улица, 5",
    descriptionEn:
      "A rehabilitation center for recovery after orthopedic surgery, injury, and neurological events.",
    descriptionRu:
      "Центр реабилитации после ортопедических операций, травм и неврологических событий.",
    phone: "+998 71 214 60 00",
    email: "team@regenera.uz",
    languages: ["en", "ru"],
    coverColor: "#C45C26",
    specialties: ["rehabilitation", "neurology", "orthopedics"],
    services: [
      {
        specialty: "rehabilitation",
        nameEn: "Rehabilitation program",
        nameRu: "Программа реабилитации",
        descriptionEn: "Individual physiotherapy plan for 5–10 days.",
        descriptionRu: "Индивидуальный план ЛФК на 5–10 дней.",
        priceUsd: 55,
      },
      {
        specialty: "neurology",
        nameEn: "Post-stroke assessment",
        nameRu: "Оценка после инсульта",
        descriptionEn: "Neurologist and rehab specialist joint visit.",
        descriptionRu: "Совместный прием невролога и реабилитолога.",
        priceUsd: 70,
      },
      {
        specialty: "orthopedics",
        nameEn: "After-injury consultation",
        nameRu: "Консультация после травмы",
        descriptionEn: "Mobility assessment and recovery roadmap.",
        descriptionRu: "Оценка движения и план восстановления.",
        priceUsd: 45,
      },
    ],
  },
  {
    slug: "nur-oncology",
    nameEn: "Nur Oncology Clinic",
    nameRu: "Онкологическая клиника Nur",
    city: "tashkent",
    addressEn: "19 Farobi Street, Tashkent",
    addressRu: "Ташкент, улица Фароби, 19",
    descriptionEn:
      "Oncology diagnostics, biopsy coordination, and second-opinion consultations for patients traveling to Tashkent.",
    descriptionRu:
      "Онкодиагностика, координация биопсии и второе мнение для пациентов, которые приезжают в Ташкент.",
    phone: "+998 71 202 09 09",
    email: "care@nuronco.uz",
    languages: ["en", "ru"],
    coverColor: "#1F3A5F",
    specialties: ["oncology", "diagnostics", "surgery"],
    services: [
      {
        specialty: "oncology",
        nameEn: "Oncologist consultation",
        nameRu: "Консультация онколога",
        descriptionEn: "Second opinion with review of existing medical reports.",
        descriptionRu: "Второе мнение с разбором имеющихся медицинских заключений.",
        priceUsd: 90,
      },
      {
        specialty: "diagnostics",
        nameEn: "Oncology screening",
        nameRu: "Онкоскрининг",
        descriptionEn: "Targeted imaging and lab package.",
        descriptionRu: "Прицельная визуализация и лабораторный пакет.",
      },
      {
        specialty: "surgery",
        nameEn: "Surgical oncology planning",
        nameRu: "Планирование онкохирургии",
        descriptionEn: "Multidisciplinary discussion of a possible operation.",
        descriptionRu: "Мультидисциплинарное обсуждение возможной операции.",
      },
    ],
  },
  {
    slug: "gastro-samarkand",
    nameEn: "GastroMed Samarkand",
    nameRu: "GastroMed Самарканд",
    city: "samarkand",
    addressEn: "14 Registan Street, Samarkand",
    addressRu: "Самарканд, улица Регистан, 14",
    descriptionEn:
      "Digestive health clinic with gastroscopy, ultrasound, and liver diagnostics for visiting patients.",
    descriptionRu:
      "Клиника пищеварения: гастроскопия, УЗИ и диагностика печени для приезжающих пациентов.",
    phone: "+998 66 237 45 00",
    email: "clinic@gastromed.uz",
    languages: ["en", "ru", "uz"],
    coverColor: "#5C6B2F",
    specialties: ["gastroenterology", "diagnostics"],
    services: [
      {
        specialty: "gastroenterology",
        nameEn: "Gastroenterologist consultation",
        nameRu: "Консультация гастроэнтеролога",
        descriptionEn: "Visit for stomach, liver, or bowel symptoms.",
        descriptionRu: "Прием при жалобах на желудок, печень или кишечник.",
        priceUsd: 50,
      },
      {
        specialty: "diagnostics",
        nameEn: "Abdominal ultrasound",
        nameRu: "УЗИ органов брюшной полости",
        descriptionEn: "Ultrasound of the abdomen with a same-day report.",
        descriptionRu: "УЗИ живота с заключением в тот же день.",
        priceUsd: 35,
      },
      {
        specialty: "gastroenterology",
        nameEn: "Endoscopy",
        nameRu: "Эндоскопия",
        descriptionEn: "Gastroscopy by appointment, with interpreter support.",
        descriptionRu: "Гастроскопия по записи, с поддержкой переводчика.",
      },
    ],
  },
  {
    slug: "central-diagnostics",
    nameEn: "Central Diagnostics",
    nameRu: "Central Diagnostics",
    city: "tashkent",
    addressEn: "1 Mustaqillik Square, Tashkent",
    addressRu: "Ташкент, площадь Мустакиллик, 1",
    descriptionEn:
      "A diagnostics center for MRI, CT, ultrasound, and laboratory check-up programs, including referrals to partner clinics.",
    descriptionRu:
      "Диагностический центр: МРТ, КТ, УЗИ и лабораторные check-up, с направлением в клиники-партнеры.",
    phone: "+998 71 140 00 01",
    email: "desk@centraldx.uz",
    languages: ["en", "ru", "ar"],
    coverColor: "#335C67",
    specialties: ["diagnostics", "cardiology", "neurology", "urology"],
    services: [
      {
        specialty: "diagnostics",
        nameEn: "MRI",
        nameRu: "МРТ",
        descriptionEn: "High-field MRI with English-language report on request.",
        descriptionRu: "МРТ с заключением на английском по запросу.",
        priceUsd: 170,
      },
      {
        specialty: "diagnostics",
        nameEn: "CT",
        nameRu: "КТ",
        descriptionEn: "Computed tomography of one region.",
        descriptionRu: "Компьютерная томография одной зоны.",
        priceUsd: 120,
      },
      {
        specialty: "diagnostics",
        nameEn: "Full check-up",
        nameRu: "Полный check-up",
        descriptionEn: "Laboratory panel, imaging, and a coordinating physician.",
        descriptionRu: "Лаборатория, визуализация и врач-координатор.",
        priceUsd: 280,
      },
      {
        specialty: "urology",
        nameEn: "Urologist consultation",
        nameRu: "Консультация уролога",
        descriptionEn: "Visit after diagnostics or for urinary symptoms.",
        descriptionRu: "Прием после обследований или при мочевых жалобах.",
        priceUsd: 45,
      },
    ],
  },
];

function inferCanonicalSlug(nameEn: string, nameRu: string) {
  const haystack = `${nameEn} ${nameRu}`.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ["mri", ["mri", "мрт"]],
    ["ct", ["ct", "кт"]],
    ["ultrasound", ["ultrasound", "узи", "echo", "эхо"]],
    ["checkup", ["checkup", "check-up", "чекап"]],
    ["endoscopy", ["endoscopy", "gastroscopy", "эндоскоп", "гастроскоп"]],
    ["surgery", ["surgery", "operation", "операц"]],
    ["consultation", ["consultation", "consult", "консультац"]],
  ];
  for (const [slug, aliases] of rules) {
    if (aliases.some((alias) => haystack.includes(alias))) return slug;
  }
  return null;
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  tashkent: { lat: 41.3111, lng: 69.2797 },
  samarkand: { lat: 39.6542, lng: 66.9597 },
  bukhara: { lat: 39.7681, lng: 64.4556 },
};

const DOCTOR_BY_SPECIALTY: Record<
  string,
  { nameEn: string; nameRu: string; roleEn: string; roleRu: string; years: number }
> = {
  cardiology: {
    nameEn: "Dr. Alisher Rakhimov",
    nameRu: "д-р Алишер Рахимов",
    roleEn: "Cardiologist",
    roleRu: "Кардиолог",
    years: 18,
  },
  neurology: {
    nameEn: "Dr. Dilnoza Yusupova",
    nameRu: "д-р Дилноза Юсупова",
    roleEn: "Neurologist",
    roleRu: "Невролог",
    years: 14,
  },
  orthopedics: {
    nameEn: "Dr. Bakhodir Saidov",
    nameRu: "д-р Баходир Саидов",
    roleEn: "Orthopedic surgeon",
    roleRu: "Ортопед-хирург",
    years: 16,
  },
  ophthalmology: {
    nameEn: "Dr. Nilufar Karimova",
    nameRu: "д-р Нилуфар Каримова",
    roleEn: "Ophthalmologist",
    roleRu: "Офтальмолог",
    years: 12,
  },
  dentistry: {
    nameEn: "Dr. Timur Ismailov",
    nameRu: "д-р Тимур Исмаилов",
    roleEn: "Dental surgeon",
    roleRu: "Стоматолог-хирург",
    years: 11,
  },
  urology: {
    nameEn: "Dr. Jasur Ergashev",
    nameRu: "д-р Жасур Эргашев",
    roleEn: "Urologist",
    roleRu: "Уролог",
    years: 15,
  },
  gynecology: {
    nameEn: "Dr. Madina Kholmatova",
    nameRu: "д-р Мадина Холматова",
    roleEn: "Gynecologist",
    roleRu: "Гинеколог",
    years: 13,
  },
  pediatrics: {
    nameEn: "Dr. Sevara Abdullaeva",
    nameRu: "д-р Севара Абдуллаева",
    roleEn: "Pediatrician",
    roleRu: "Педиатр",
    years: 10,
  },
  surgery: {
    nameEn: "Dr. Farrukh Nazarov",
    nameRu: "д-р Фаррух Назаров",
    roleEn: "General surgeon",
    roleRu: "Хирург",
    years: 20,
  },
  oncology: {
    nameEn: "Dr. Aziza Mirzaeva",
    nameRu: "д-р Азиза Мирзаева",
    roleEn: "Oncologist",
    roleRu: "Онколог",
    years: 17,
  },
  gastroenterology: {
    nameEn: "Dr. Rustam Khasanov",
    nameRu: "д-р Рустам Хасанов",
    roleEn: "Gastroenterologist",
    roleRu: "Гастроэнтеролог",
    years: 14,
  },
  diagnostics: {
    nameEn: "Dr. Elena Petrova",
    nameRu: "д-р Елена Петрова",
    roleEn: "Radiologist",
    roleRu: "Рентгенолог",
    years: 12,
  },
  rehabilitation: {
    nameEn: "Dr. Kamila Tursunova",
    nameRu: "д-р Камила Турсунова",
    roleEn: "Rehab physician",
    roleRu: "Врач ЛФК",
    years: 9,
  },
};

const EQUIPMENT_BY_SPECIALTY: Record<
  string,
  Array<{ nameEn: string; nameRu: string; descriptionEn: string; descriptionRu: string }>
> = {
  cardiology: [
    {
      nameEn: "Digital ECG system",
      nameRu: "Цифровой ЭКГ-комплекс",
      descriptionEn: "12-lead ECG with stress testing option.",
      descriptionRu: "12-канальная ЭКГ с возможностью нагрузочных проб.",
    },
    {
      nameEn: "Cardiac ultrasound",
      nameRu: "УЗИ сердца",
      descriptionEn: "Echo machine for transthoracic cardiac imaging.",
      descriptionRu: "Аппарат эхокардиографии.",
    },
  ],
  diagnostics: [
    {
      nameEn: "1.5T MRI scanner",
      nameRu: "МРТ 1.5 Тесла",
      descriptionEn: "High-field MRI for neurology and orthopedics.",
      descriptionRu: "Высокопольный МР-томограф.",
    },
    {
      nameEn: "64-slice CT",
      nameRu: "КТ 64 среза",
      descriptionEn: "Fast CT for chest, abdomen, and vessels.",
      descriptionRu: "Быстрый КТ для груди, живота и сосудов.",
    },
  ],
  orthopedics: [
    {
      nameEn: "Digital X-ray",
      nameRu: "Цифровой рентген",
      descriptionEn: "Low-dose orthopedic imaging.",
      descriptionRu: "Низкодозный рентген для ортопедии.",
    },
  ],
  ophthalmology: [
    {
      nameEn: "Optical coherence tomography",
      nameRu: "ОКТ глаза",
      descriptionEn: "Retina and optic nerve imaging.",
      descriptionRu: "Визуализация сетчатки и зрительного нерва.",
    },
  ],
  dentistry: [
    {
      nameEn: "Dental CBCT",
      nameRu: "Дентальный КТ",
      descriptionEn: "3D imaging for implants and surgery.",
      descriptionRu: "3D-снимки для имплантации и хирургии.",
    },
  ],
  gastroenterology: [
    {
      nameEn: "Video endoscope",
      nameRu: "Видеоэндоскоп",
      descriptionEn: "HD gastroscopy and colonoscopy.",
      descriptionRu: "HD-гастроскопия и колоноскопия.",
    },
  ],
};

function cityLabel(city: string) {
  if (city === "samarkand") return { en: "Samarkand", ru: "Самарканд", ruLoc: "Самарканде" };
  if (city === "bukhara") return { en: "Bukhara", ru: "Бухара", ruLoc: "Бухаре" };
  return { en: "Tashkent", ru: "Ташкент", ruLoc: "Ташкенте" };
}

function richClinicFields(clinic: ClinicSeed) {
  const hours = clinic.responseHours ?? 24;
  const city = cityLabel(clinic.city);
  const phoneDigits = clinic.phone.replace(/[^\d+]/g, "");
  const handle = clinic.slug.replace(/-/g, "");
  const SPEC_RU: Record<string, string> = {
    cardiology: "кардиология",
    neurology: "неврология",
    orthopedics: "ортопедия",
    ophthalmology: "офтальмология",
    dentistry: "стоматология",
    urology: "урология",
    gynecology: "гинекология",
    pediatrics: "педиатрия",
    surgery: "хирургия",
    oncology: "онкология",
    gastroenterology: "гастроэнтерология",
    diagnostics: "диагностика",
    rehabilitation: "реабилитация",
  };
  const topSpecs = clinic.specialties
    .slice(0, 3)
    .map((slug) => SPEC_RU[slug] || slug)
    .join(", ");

  return {
    shortName: clinic.nameEn.split(" ").slice(0, 2).join(" "),
    foundedYear: 2008 + (clinic.slug.length % 12),
    website: clinic.website || `https://${clinic.slug}.uz`,
    whatsapp: phoneDigits,
    telegram: `@${handle}`,
    instagram: `@${handle}`,
    coordinatorName: clinic.coordinatorName || "International desk",
    coordinatorRoleEn: "International patient coordinator",
    coordinatorRoleRu: "Координатор зарубежных пациентов",
    responseHours: hours,
    status: "published" as const,
    published: true,
    medicalTourism: clinic.languages.includes("en"),
    historyEn: `${clinic.nameEn} has served patients in ${city.en} for years, growing from a specialty practice into a coordinated private clinic with diagnostics and outpatient care.`,
    historyRu: `${clinic.nameRu} много лет принимает пациентов в ${city.ruLoc}: от профильного приёма до клиники с диагностикой и амбулаторной помощью.`,
    missionEn: `Deliver transparent, coordinated private care for local and international patients in ${city.en}.`,
    missionRu: `Прозрачная и понятная частная помощь для местных и зарубежных пациентов в ${city.ruLoc}.`,
    advantagesEn: `• Fast coordinator response (~${hours}h)\n• Specialties: ${topSpecs}\n• Reports available in English on request\n• Clear pricing before arrival`,
    advantagesRu: `• Быстрый ответ координатора (~${hours} ч)\n• Направления: ${topSpecs}\n• Заключения на английском по запросу\n• Понятные цены до приезда`,
    chiefDoctorName: DOCTOR_BY_SPECIALTY[clinic.specialties[0]]?.nameEn || "Dr. Lead Physician",
    chiefDoctorRoleEn: "Chief medical officer",
    chiefDoctorRoleRu: "Главный врач",
    chiefDoctorPhotoUrl: `/clinics/${clinic.slug}/logo.svg`,
    licenseInfoEn: `Licensed private medical facility in ${city.en}, Uzbekistan.`,
    licenseInfoRu: `Лицензированная частная медицинская организация, ${city.ru}, Узбекистан.`,
    afterRequestEn: `A coordinator will contact you within ${hours} hours on WhatsApp or your chosen channel. This is not a confirmed doctor appointment.`,
    afterRequestRu: `Координатор свяжется с вами в течение ${hours} часов в WhatsApp или другим указанным способом. Это не запись к врачу.`,
    whyChooseEn: `Choose ${clinic.nameEn} for coordinated pathways across ${topSpecs}, predictable timelines, and support for traveling patients.`,
    whyChooseRu: `Выбирайте ${clinic.nameRu} за согласованные маршруты по направлениям ${topSpecs}, понятные сроки и поддержку приезжающих пациентов.`,
    popularServicesEn: clinic.services
      .slice(0, 4)
      .map((s) => `• ${s.nameEn}${s.priceUsd != null ? ` — from $${s.priceUsd}` : ""}`)
      .join("\n"),
    popularServicesRu: clinic.services
      .slice(0, 4)
      .map((s) => `• ${s.nameRu}${s.priceUsd != null ? ` — от $${s.priceUsd}` : ""}`)
      .join("\n"),
    developmentPlansEn:
      "Expand day-care diagnostics, add tele-consult follow-ups, and grow English-speaking nursing support.",
    developmentPlansRu:
      "Расширение дневной диагностики, телеконсультации после визита и рост англоязычного медперсонала.",
    medicalTourismEn: clinic.languages.includes("en")
      ? "Airport transfer advice, hotel recommendations near the clinic, and English-speaking coordination."
      : null,
    medicalTourismRu: clinic.languages.includes("en")
      ? "Подсказки по трансферу из аэропорта, отелям рядом с клиникой и координация на английском."
      : null,
  };
}

/** @deprecated alias used by older call sites */
function trustFields(clinic: ClinicSeed) {
  return richClinicFields(clinic);
}

async function defaultScheduleJson() {
  const { DEFAULT_BRANCH_SCHEDULE } = await import("../src/lib/clinic-serialize");
  return DEFAULT_BRANCH_SCHEDULE;
}

async function enrichClinicRelations(clinicId: string, seed: ClinicSeed) {
  const scheduleJson = await defaultScheduleJson();
  const coords = CITY_COORDS[seed.city] || CITY_COORDS.tashkent;
  const specialtyRows = await prisma.specialty.findMany({
    where: { slug: { in: seed.specialties } },
  });
  const specialtyIdBySlug = new Map(specialtyRows.map((s) => [s.slug, s.id]));

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      photos: true,
      doctors: { include: { specialties: true } },
      equipment: true,
      certificates: true,
      branches: { include: { photos: true, specialties: true } },
      services: true,
    },
  });
  if (!clinic) return;

  // Clinic photos
  if (clinic.photos.length < 3) {
    await prisma.clinicPhoto.deleteMany({ where: { clinicId } });
    const categories = ["facade", "reception", "hall"] as const;
    await prisma.clinicPhoto.createMany({
      data: categories.map((category, index) => ({
        clinicId,
        url: `/clinics/${seed.slug}/photo-${index + 1}.svg`,
        category,
        altEn: `${seed.nameEn} — ${category}`,
        altRu: `${seed.nameRu} — ${category === "facade" ? "фасад" : category === "reception" ? "ресепшн" : "холл"}`,
        sortOrder: index + 1,
      })),
    });
  }

  // Main branch
  let branch = clinic.branches.find((b) => b.slug === "main") || clinic.branches[0];
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        clinicId,
        slug: "main",
        nameEn: `${seed.nameEn} — Main`,
        nameRu: `${seed.nameRu} — основной`,
        city: seed.city,
        addressEn: seed.addressEn,
        addressRu: seed.addressRu,
        phone: seed.phone,
        email: seed.email,
        whatsapp: seed.phone.replace(/[^\d+]/g, ""),
        telegram: `@${seed.slug.replace(/-/g, "")}`,
        website: seed.website || `https://${seed.slug}.uz`,
        descriptionEn: seed.descriptionEn,
        descriptionRu: seed.descriptionRu,
        scheduleJson,
        coverUrl: `/clinics/${seed.slug}/photo-1.svg`,
        lat: coords.lat,
        lng: coords.lng,
        sortOrder: 0,
        specialties: {
          create: seed.specialties
            .map((slug) => specialtyIdBySlug.get(slug))
            .filter(Boolean)
            .map((specialtyId) => ({ specialtyId: specialtyId! })),
        },
        photos: {
          create: [1, 2, 3].map((index) => ({
            url: `/clinics/${seed.slug}/photo-${index}.svg`,
            category: index === 1 ? "facade" : index === 2 ? "reception" : "rooms",
            altEn: `${seed.nameEn} branch photo ${index}`,
            altRu: `${seed.nameRu}, филиал, фото ${index}`,
            sortOrder: index,
          })),
        },
      },
      include: { photos: true, specialties: true },
    });
  } else {
    await prisma.branch.update({
      where: { id: branch.id },
      data: {
        phone: seed.phone,
        email: seed.email,
        whatsapp: seed.phone.replace(/[^\d+]/g, ""),
        telegram: `@${seed.slug.replace(/-/g, "")}`,
        website: seed.website || `https://${seed.slug}.uz`,
        descriptionEn: seed.descriptionEn,
        descriptionRu: seed.descriptionRu,
        scheduleJson,
        coverUrl: branch.coverUrl || `/clinics/${seed.slug}/photo-1.svg`,
        lat: branch.lat ?? coords.lat,
        lng: branch.lng ?? coords.lng,
        addressEn: seed.addressEn,
        addressRu: seed.addressRu,
        city: seed.city,
      },
    });
    if (branch.photos.length < 3) {
      await prisma.branchPhoto.deleteMany({ where: { branchId: branch.id } });
      await prisma.branchPhoto.createMany({
        data: [1, 2, 3].map((index) => ({
          branchId: branch!.id,
          url: `/clinics/${seed.slug}/photo-${index}.svg`,
          category: index === 1 ? "facade" : index === 2 ? "reception" : "rooms",
          altEn: `${seed.nameEn} branch photo ${index}`,
          altRu: `${seed.nameRu}, филиал, фото ${index}`,
          sortOrder: index,
        })),
      });
    }
    if (branch.specialties.length === 0) {
      await prisma.branchSpecialty.createMany({
        data: seed.specialties
          .map((slug) => specialtyIdBySlug.get(slug))
          .filter(Boolean)
          .map((specialtyId) => ({ branchId: branch!.id, specialtyId: specialtyId! })),
      });
    }
  }

  // Second branch for flagship clinic
  if (seed.slug === "atlas-medical-center") {
    const second = await prisma.branch.findFirst({
      where: { clinicId, slug: "yunusabad" },
    });
    if (!second) {
      await prisma.branch.create({
        data: {
          clinicId,
          slug: "yunusabad",
          nameEn: "Atlas — Yunusabad",
          nameRu: "Atlas — Юнусабад",
          city: "tashkent",
          addressEn: "8 Minor Street, Yunusabad, Tashkent",
          addressRu: "Ташкент, Юнусабад, улица Минор, 8",
          phone: "+998 71 200 15 16",
          email: "yunusabad@atlasmed.uz",
          whatsapp: "+998712001516",
          telegram: "@atlasmedyunusabad",
          website: "https://atlasmed.example",
          descriptionEn: "Outpatient diagnostics and cardiology consultations in Yunusabad.",
          descriptionRu: "Амбулаторная диагностика и кардиологический приём в Юнусабаде.",
          scheduleJson,
          coverUrl: `/clinics/${seed.slug}/photo-2.svg`,
          lat: 41.3642,
          lng: 69.2881,
          sortOrder: 1,
          specialties: {
            create: ["cardiology", "diagnostics", "neurology"]
              .map((slug) => specialtyIdBySlug.get(slug))
              .filter(Boolean)
              .map((specialtyId) => ({ specialtyId: specialtyId! })),
          },
          photos: {
            create: [
              {
                url: `/clinics/${seed.slug}/photo-2.svg`,
                category: "facade",
                altEn: "Yunusabad branch facade",
                altRu: "Филиал Юнусабад, фасад",
                sortOrder: 1,
              },
            ],
          },
        },
      });
    }
  }

  // Doctors — one per specialty (up to 4)
  const targetSpecs = seed.specialties.slice(0, 4);
  for (const [index, slug] of targetSpecs.entries()) {
    const specialtyId = specialtyIdBySlug.get(slug);
    const template = DOCTOR_BY_SPECIALTY[slug];
    if (!specialtyId || !template) continue;
    const exists = clinic.doctors.some((d) =>
      d.specialties.some((s) => s.specialtyId === specialtyId),
    );
    if (exists) continue;
    await prisma.doctor.create({
      data: {
        clinicId,
        nameEn: template.nameEn,
        nameRu: template.nameRu,
        roleEn: template.roleEn,
        roleRu: template.roleRu,
        experienceYears: template.years,
        photoUrl: `/clinics/${seed.slug}/logo.svg`,
        bioEn: `${template.roleEn} at ${seed.nameEn}. Focus on clear explanations for international patients.`,
        bioRu: `${template.roleRu} в ${seed.nameRu}. Понятные объяснения для зарубежных пациентов.`,
        sortOrder: index,
        specialties: { create: [{ specialtyId }] },
        branches: { create: [{ branchId: branch.id }] },
      },
    });
  }

  // Equipment
  const equipmentItems = targetSpecs.flatMap((slug) => EQUIPMENT_BY_SPECIALTY[slug] || []).slice(0, 5);
  if (clinic.equipment.length < 2 && equipmentItems.length) {
    await prisma.equipment.deleteMany({ where: { clinicId } });
    for (const [index, item] of equipmentItems.entries()) {
      await prisma.equipment.create({
        data: {
          clinicId,
          branchId: branch.id,
          nameEn: item.nameEn,
          nameRu: item.nameRu,
          descriptionEn: item.descriptionEn,
          descriptionRu: item.descriptionRu,
          sortOrder: index,
        },
      });
    }
  } else if (clinic.equipment.length === 0) {
    await prisma.equipment.create({
      data: {
        clinicId,
        branchId: branch.id,
        nameEn: "Diagnostic suite",
        nameRu: "Диагностический комплекс",
        descriptionEn: "Modern diagnostics for outpatient care.",
        descriptionRu: "Современная диагностика для амбулаторного приёма.",
      },
    });
  }

  // Certificates
  if (clinic.certificates.length < 2) {
    await prisma.certificate.deleteMany({ where: { clinicId } });
    await prisma.certificate.createMany({
      data: [
        {
          clinicId,
          branchId: branch.id,
          nameEn: "Medical activity license",
          nameRu: "Лицензия на медицинскую деятельность",
          issuerEn: "Ministry of Health of Uzbekistan",
          issuerRu: "Минздрав Республики Узбекистан",
          year: 2022,
          sortOrder: 1,
        },
        {
          clinicId,
          branchId: branch.id,
          nameEn: "Quality management certificate",
          nameRu: "Сертификат системы качества",
          issuerEn: "Independent audit body",
          issuerRu: "Независимый орган по сертификации",
          year: 2024,
          sortOrder: 2,
        },
      ],
    });
  }

  // Attach orphan services to main branch
  await prisma.service.updateMany({
    where: { clinicId, branchId: null },
    data: { branchId: branch.id },
  });

  // Attach doctors without branch links to main branch
  const doctors = await prisma.doctor.findMany({
    where: { clinicId },
    include: { branches: true },
  });
  for (const doctor of doctors) {
    if (doctor.branches.length === 0) {
      await prisma.doctorBranch.create({
        data: { doctorId: doctor.id, branchId: branch.id },
      });
    }
  }
}

async function ensureBranchesForExisting() {
  for (const seed of clinics) {
    const clinic = await findClinicForSeed(seed);
    if (!clinic) continue;
    await enrichClinicRelations(clinic.id, seed);
  }
}

/** Resolve seed clinic even if DB has accidental numeric slug suffix (atlas-medical-center1). */
async function findClinicForSeed(seed: ClinicSeed) {
  const exact = await prisma.clinic.findUnique({ where: { slug: seed.slug } });
  if (exact) return exact;

  const suffixMatch = await prisma.clinic.findFirst({
    where: {
      OR: [
        { slug: { startsWith: `${seed.slug}` } },
        { nameEn: seed.nameEn },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  if (!suffixMatch) return null;

  const isNumericSuffix =
    suffixMatch.slug === seed.slug ||
    new RegExp(`^${seed.slug}\\d+$`).test(suffixMatch.slug);
  if (!isNumericSuffix && suffixMatch.nameEn !== seed.nameEn) return null;

  if (suffixMatch.slug !== seed.slug) {
    const taken = await prisma.clinic.findUnique({ where: { slug: seed.slug } });
    if (!taken) {
      await prisma.clinic.update({
        where: { id: suffixMatch.id },
        data: { slug: seed.slug },
      });
      console.log(`Repaired clinic slug ${suffixMatch.slug} → ${seed.slug}`);
      return prisma.clinic.findUniqueOrThrow({ where: { id: suffixMatch.id } });
    }
  }

  return suffixMatch;
}

async function patchExisting() {
  for (const clinic of clinics) {
    const row = await findClinicForSeed(clinic);
    if (!row) continue;
    await prisma.clinic.update({
      where: { id: row.id },
      data: {
        slug: clinic.slug,
        nameEn: clinic.nameEn,
        nameRu: clinic.nameRu,
        city: clinic.city,
        addressEn: clinic.addressEn,
        addressRu: clinic.addressRu,
        descriptionEn: clinic.descriptionEn,
        descriptionRu: clinic.descriptionRu,
        phone: clinic.phone,
        email: clinic.email,
        languages: JSON.stringify(clinic.languages),
        logoUrl: `/clinics/${clinic.slug}/logo.svg`,
        coverColor: clinic.coverColor,
        ...richClinicFields(clinic),
      },
    });
  }
  const services = await prisma.service.findMany();
  for (const service of services) {
    const slug = inferCanonicalSlug(service.nameEn, service.nameRu);
    if (slug && service.canonicalSlug !== slug) {
      await prisma.service.update({
        where: { id: service.id },
        data: { canonicalSlug: slug },
      });
    }
  }
  await ensureBranchesForExisting();
  await ensureDemoOwner();
}

function svgLogo(name: string, color: string) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img">
  <rect width="160" height="160" rx="36" fill="${color}"/>
  <circle cx="80" cy="80" r="46" fill="none" stroke="#F6EFE3" stroke-width="6"/>
  <path d="M80 48v64M58 80h44" stroke="#F6EFE3" stroke-width="7" stroke-linecap="round"/>
  <text x="80" y="148" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#F6EFE3">${initials}</text>
</svg>`;
}

function svgPhoto(color: string, label: string, variant: number) {
  const shift = variant * 18;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="#1A2B2C"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#g)"/>
  <g opacity="0.18" fill="#F6EFE3">
    <rect x="${120 + shift}" y="180" width="420" height="640" rx="28"/>
    <rect x="${580 + shift}" y="120" width="360" height="420" rx="28"/>
    <rect x="${980 + shift}" y="260" width="430" height="520" rx="28"/>
  </g>
  <circle cx="${1280 - shift}" cy="220" r="90" fill="#F6EFE3" opacity="0.2"/>
  <text x="80" y="900" font-family="Georgia, serif" font-size="42" fill="#F6EFE3">${label}</text>
</svg>`;
}

function writeAssets() {
  const root = join(process.cwd(), "public", "clinics");
  mkdirSync(root, { recursive: true });
  for (const clinic of clinics) {
    const dir = join(root, clinic.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "logo.svg"), svgLogo(clinic.nameEn, clinic.coverColor));
    writeFileSync(join(dir, "photo-1.svg"), svgPhoto(clinic.coverColor, clinic.nameEn, 0));
    writeFileSync(join(dir, "photo-2.svg"), svgPhoto(clinic.coverColor, clinic.city, 1));
    writeFileSync(join(dir, "photo-3.svg"), svgPhoto(clinic.coverColor, clinic.nameEn, 2));
  }
}

async function main() {
  writeAssets();

  const owner = await ensureDemoOwner();

  if ((await prisma.clinic.count()) > 0) {
    await patchExisting();
    console.log("Database already has clinics. Rich clinic content updated.");
    return;
  }

  const specialtyIds = new Map<string, string>();
  for (const item of specialties) {
    const created = await prisma.specialty.create({ data: item });
    specialtyIds.set(item.slug, created.id);
  }

  for (const clinic of clinics) {
    const created = await prisma.clinic.create({
      data: {
        ownerId: owner.id,
        slug: clinic.slug,
        nameEn: clinic.nameEn,
        nameRu: clinic.nameRu,
        city: clinic.city,
        addressEn: clinic.addressEn,
        addressRu: clinic.addressRu,
        descriptionEn: clinic.descriptionEn,
        descriptionRu: clinic.descriptionRu,
        phone: clinic.phone,
        email: clinic.email,
        languages: JSON.stringify(clinic.languages),
        logoUrl: `/clinics/${clinic.slug}/logo.svg`,
        coverColor: clinic.coverColor,
        ...richClinicFields(clinic),
        specialties: {
          create: clinic.specialties.map((slug) => ({
            specialtyId: specialtyIds.get(slug)!,
          })),
        },
        photos: {
          create: [1, 2, 3].map((index) => ({
            url: `/clinics/${clinic.slug}/photo-${index}.svg`,
            category: index === 1 ? "facade" : index === 2 ? "reception" : "hall",
            altEn: `${clinic.nameEn} photo ${index}`,
            altRu: `${clinic.nameRu}, фото ${index}`,
            sortOrder: index,
          })),
        },
        services: {
          create: clinic.services.map((service) => ({
            specialtyId: specialtyIds.get(service.specialty)!,
            nameEn: service.nameEn,
            nameRu: service.nameRu,
            descriptionEn: service.descriptionEn,
            descriptionRu: service.descriptionRu,
            priceUsd: service.priceUsd ?? null,
            currency: "USD",
            unit: "",
            canonicalSlug: inferCanonicalSlug(service.nameEn, service.nameRu),
          })),
        },
      },
    });
    console.log("Created", created.slug);
  }

  await ensureBranchesForExisting();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
