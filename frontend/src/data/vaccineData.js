export const MASTER_VACCINATION_SCHEDULE = [
  {
    dayOffset: 1,
    ageLabel: "Day 1 (Hatchery)",
    vaccineName: "Marek's Disease Vaccine (HVT / SB-1)",
    diseaseTarget: "Marek's Disease",
    route: "Subcutaneous Injection (Neck) or In-Ovo",
    dosage: "0.2 ml per chick",
    type: "Live Viral",
    importance: "Critical",
    notes: "Administered at hatchery. Provides lifelong protection against viral nerve paralysis and tumors."
  },
  {
    dayOffset: 7,
    ageLabel: "Day 7 (1 Week)",
    vaccineName: "Newcastle Disease + IB Combined (B1 / LaSota + Mass)",
    diseaseTarget: "Newcastle Disease & Infectious Bronchitis",
    route: "Eye Drop / Coarse Spray / Drinking Water",
    dosage: "1 dose per bird",
    type: "Live Attenuated",
    importance: "Critical",
    notes: "Withhold water for 1-2 hours prior to administration if giving via drinking water. Use skimmed milk powder (2g/L) as stabilizer."
  },
  {
    dayOffset: 14,
    ageLabel: "Day 14 (2 Weeks)",
    vaccineName: "Gumboro Disease Vaccine (IBD Intermediate Strain)",
    diseaseTarget: "Infectious Bursal Disease (Gumboro)",
    route: "Drinking Water",
    dosage: "1 dose per bird",
    type: "Live Virus",
    importance: "High",
    notes: "Protects the Bursa of Fabricius and prevents immunosuppression. Ensure chlorine-free fresh water."
  },
  {
    dayOffset: 21,
    ageLabel: "Day 21 (3 Weeks)",
    vaccineName: "Newcastle Disease Booster (LaSota Strain)",
    diseaseTarget: "Newcastle Disease Booster",
    route: "Drinking Water / Eye Drop",
    dosage: "1 dose per bird",
    type: "Live Virus",
    importance: "Critical",
    notes: "Boosts antibody titers against respiratory and neurological NCD outbreaks."
  },
  {
    dayOffset: 28,
    ageLabel: "Day 28 (4 Weeks)",
    vaccineName: "Gumboro (IBD) Booster",
    diseaseTarget: "Infectious Bursal Disease (IBD)",
    route: "Drinking Water",
    dosage: "1 dose per bird",
    type: "Live Virus",
    importance: "High",
    notes: "Reinforces immune defense during rapid growth phase."
  },
  {
    dayOffset: 42,
    ageLabel: "Week 6 (42 Days)",
    vaccineName: "Fowl Pox Vaccine",
    diseaseTarget: "Fowl Pox",
    route: "Wing-Web Puncture",
    dosage: "Double-needle stab in wing web",
    type: "Live Virus",
    importance: "Medium",
    notes: "Check for 'take' (small scab formation) at injection site 7-10 days post vaccination."
  },
  {
    dayOffset: 56,
    ageLabel: "Week 8 (56 Days)",
    vaccineName: "Infectious Coryza Bacterin",
    diseaseTarget: "Infectious Coryza",
    route: "Intramuscular / Subcutaneous",
    dosage: "0.5 ml per bird",
    type: "Killed Bacterin",
    importance: "High (Layers & Breeders)",
    notes: "Essential for multi-age farms or areas endemic with Coryza."
  },
  {
    dayOffset: 112,
    ageLabel: "Week 16 (112 Days)",
    vaccineName: "NCD + IB + EDS Killed Combination (Killed Oil Emulsion)",
    diseaseTarget: "Newcastle, IB & Egg Drop Syndrome",
    route: "Intramuscular (Breast Muscle)",
    dosage: "0.5 ml per bird",
    type: "Killed Inactivated",
    importance: "Critical (Layers)",
    notes: "Administered before point of lay (POL) to maintain high antibody protection throughout lay cycle."
  }
];

export const DEFAULT_BATCHES = [
  {
    id: "batch-1",
    name: "Batch #101 - Commercial Layers",
    flockType: "Layers",
    flockSize: 500,
    hatchDate: "2026-08-20",
    completedVaccines: [1, 7, 14]
  },
  {
    id: "batch-2",
    name: "Batch #102 - Quick Broilers",
    flockType: "Broilers",
    flockSize: 1000,
    hatchDate: "2026-09-01",
    completedVaccines: [1]
  }
];
