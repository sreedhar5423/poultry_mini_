export const POULTRY_DISEASES = [
  {
    id: "cocci",
    key: "cocci",
    name: "Coccidiosis",
    scientificName: "Eimeria tenella / Eimeria necatrix",
    category: "Parasitic",
    severity: "High",
    mortalityRate: "10% - 50% (High in young chicks)",
    incubationPeriod: "4 - 7 Days",
    transmission: "Ingested oocysts from wet litter, contaminated feed, or water",
    shortDescription: "A severe intestinal parasitic infection causing gut wall destruction, bloody droppings, and severe emaciation.",
    description: "Coccidiosis is caused by microscopic protozoan parasites called Eimeria that invade and damage the epithelial cells of the intestinal lining. Wet bedding, high humidity, and crowding accelerate oocyst sporulation and outbreak severity.",
    symptoms: [
      "Bloody, dark red, or mucoid diarrhea",
      "Severe lethargy, huddling, and ruffled feathers",
      "Pale comb, wattles, and skin (due to anemia)",
      "Sharp decline in feed & water consumption",
      "Stunted growth and uneven flock weight"
    ],
    prevention: [
      "Maintain dry, clean litter and replace damp bedding around waterers immediately.",
      "Use anticoccidial feed additives or administer Coccidiosis vaccine at Day 1 in hatchery.",
      "Prevent overcrowding and maintain optimal ventilation to lower humidity.",
      "Sanitize feeding and watering equipment regularly with approved disinfectants."
    ],
    treatment: [
      "Administer Amprolium (0.024% in drinking water) for 3-5 consecutive days.",
      "Alternatively, use Sulfadimethoxine or Trimethoprim-Sulfa as prescribed by a veterinarian.",
      "Provide water-soluble Electrolytes and Vitamins (Vitamin A & K3) to assist intestinal clotting and recovery.",
      "Isolate severely affected birds and flush water lines thoroughly after treatment."
    ]
  },
  {
    id: "ncd",
    key: "ncd",
    name: "Newcastle Disease (NCD)",
    scientificName: "Avian Paramyxovirus type 1 (AOAV-1)",
    category: "Viral",
    severity: "Critical",
    mortalityRate: "Up to 100% in virulent outbreaks",
    incubationPeriod: "2 - 15 Days",
    transmission: "Airborne droppings, respiratory secretions, wild birds, equipment",
    shortDescription: "A highly contagious viral infection affecting respiratory, nervous, and digestive systems, capable of decimating whole flocks.",
    description: "Newcastle Disease is an acute, highly contagious viral disease affecting birds of all ages. Velogenic strains cause severe intestinal hemorrhages, respiratory distress, and central nervous system paralysis.",
    symptoms: [
      "Gasping, coughing, sneezing, and tracheal rales",
      "Watery bright green diarrhea",
      "Neurological signs: twisted neck (torticollis), circling, leg paralysis",
      "Swelling of head, eyes, and throat tissues",
      "Sudden drop in egg production with soft-shelled or misshapen eggs"
    ],
    prevention: [
      "Strict vaccination protocol using LaSota / B1 strains at Day 7, Day 21, and regular boosters.",
      "Enforce rigorous biosecurity: restrict farm visitors, sanitize vehicles, and exclude wild birds.",
      "Quarantine new birds for 30 days before introducing to main flock.",
      "Promptly incinerate or deep-bury dead birds to prevent viral dissemination."
    ],
    treatment: [
      "No specific antiviral treatment exists for Newcastle Disease.",
      "Provide supportive care: broad-spectrum antibiotics (e.g. Oxytetracycline) to prevent secondary bacterial infections.",
      "Administer high-potency multivitamins and stress-relief electrolyte powders in drinking water.",
      "Quarantine the entire affected house immediately and notify veterinary health officers."
    ]
  },
  {
    id: "salmo",
    key: "salmo",
    name: "Salmonella Infection (Pullorum / Fowl Typhoid)",
    scientificName: "Salmonella gallinarum / Salmonella pullorum",
    category: "Bacterial",
    severity: "High",
    mortalityRate: "20% - 80% in young chicks",
    incubationPeriod: "3 - 5 Days",
    transmission: "Egg-transmitted (vertical) and contaminated feed/water/rodents (horizontal)",
    shortDescription: "Bacterial infection causing systemic septicemia, chalky white diarrhea, and vent pasting in young birds.",
    description: "Salmonellosis encompasses Pullorum disease and Fowl Typhoid. It causes acute septicemic mortality in young chicks and chronic reproductive organ infection in mature layers, resulting in reduced hatchability.",
    symptoms: [
      "Chalky white, yellowish, or paste-like diarrhea (pasting of vent)",
      "Depression, somnolence, and huddling close to brooder heaters",
      "Labored breathing and gasping in severe systemic cases",
      "Shrunken, pale, shriveled combs in adult layers",
      "High mortality during the first 2-3 weeks of chick age"
    ],
    prevention: [
      "Source chicks exclusively from certified Salmonella-free breeder farms.",
      "Implement aggressive rodent and wild pest control programs.",
      "Pelletize feed at high temperatures (70°C+) to kill Salmonella organisms.",
      "Regularly test breeding stock and cull positive reactor birds."
    ],
    treatment: [
      "Administer antibiotic therapy: Enrofloxacin, Amoxicillin, or Trimethoprim-Sulfa for 5-7 days.",
      "Sanitize all drinking vessels with organic acidifiers or chlorine dioxide.",
      "Administer competitive exclusion probiotics post-antibiotic treatment to restore healthy gut microflora.",
      "Thoroughly clean and disinfect brooder houses prior to introducing fresh batches."
    ]
  },
  {
    id: "mareks",
    key: "mareks",
    name: "Marek's Disease",
    scientificName: "Gallid alphaherpesvirus 2 (MDV)",
    category: "Viral",
    severity: "Critical",
    mortalityRate: "10% - 30% (Up to 80% in susceptible flocks)",
    incubationPeriod: "3 - 4 Weeks",
    transmission: "Inhalation of infected feather follicle dander and dust",
    shortDescription: "A viral oncogenic herpesvirus causing T-cell lymphoma tumors and progressive leg/wing paralysis.",
    description: "Marek's Disease is a highly infectious neoplastic disease characterized by peripheral nerve enlargement and visceral tumors in kidneys, liver, spleen, and heart. The virus persists indefinitely in poultry dust and dander.",
    symptoms: [
      "Progressive asymmetrical paralysis (one leg stretched forward, one backward)",
      "Unilateral wing drooping and inability to stand",
      "Irregular, star-burst or gray pupil ('Grey Eye' / blindness)",
      "Emaciation, pale wattles, and skin leukosis tumors",
      "Weight loss despite normal appetite"
    ],
    prevention: [
      "In-ovo vaccination at Day 18 of embryonation or subcutaneous HVT/SB-1 vaccine at Day 1 in hatchery.",
      "Maintain clean chick rearing environments for the first 4-6 weeks to allow immunity development.",
      "Exhaustively vacuum dander and spray virucidal disinfectants between flock rotations.",
      "Select MDV-resistant genetic poultry lines."
    ],
    treatment: [
      "No effective treatment exists once clinical paralysis or lymphoma tumors appear.",
      "Affected birds should be humanely culled to reduce environmental dander contamination.",
      "Provide high-potency multivitamins to remaining unaffected flock members as supportive care."
    ]
  },
  {
    id: "ib",
    key: "ib",
    name: "Infectious Bronchitis (IB)",
    scientificName: "Infectious Bronchitis Virus (IBV Coronavirus)",
    category: "Viral",
    severity: "High",
    mortalityRate: "5% - 25% (Higher if complicated by Mycoplasma)",
    incubationPeriod: "18 - 36 Hours",
    transmission: "Airborne aerosols, respiratory discharge, contaminated equipment",
    shortDescription: "An extremely fast-spreading respiratory viral infection causing coughing, kidney damage, and watery egg whites.",
    description: "Infectious Bronchitis is a widespread, highly contagious viral disease affecting chickens of all ages. In layers, IB causes severe egg production drops, thin/misshapen shells, and permanent watery albumen (egg white).",
    symptoms: [
      "Tracheal rales, coughing, sneezing, and wet nostrils",
      "Sharp drop in egg production (up to 50%) with wrinkled or soft shells",
      "Watery egg albumen (thin inner egg white)",
      "Increased water intake and wet droppings (nephropathogenic strains)",
      "Excessive moisture and mucus in nostrils and trachea"
    ],
    prevention: [
      "Vaccinate with live IB Massachusetts strain at Day 1 - Day 7 via coarse spray or eye drop.",
      "Follow up with booster IB live/killed combination vaccines at 4-5 weeks and 14-16 weeks.",
      "Ensure optimal brooding temperatures and avoid chilly drafts.",
      "Maintain low dust and ammonia levels (< 15 ppm) in poultry houses."
    ],
    treatment: [
      "No direct antiviral therapy.",
      "Increase room temperature by 2-3°C during acute respiratory outbreak.",
      "Administer expectorant mucolytics (e.g. Bromhexine or Menthol oils) in drinking water.",
      "Supply broad-spectrum antibiotics to control secondary E. coli or Mycoplasma infections."
    ]
  },
  {
    id: "fowlpox",
    key: "fowlpox",
    name: "Fowl Pox",
    scientificName: "Avipoxvirus (Fowlpox virus)",
    category: "Viral",
    severity: "Moderate",
    mortalityRate: "Low (Dry Pox: 1-5%) to High (Wet Pox: 15-50%)",
    incubationPeriod: "4 - 10 Days",
    transmission: "Biting mosquitoes, skin abrasions, contact with pox scabs",
    shortDescription: "Viral infection producing wart-like nodular lesions on unfeathered skin (Dry Pox) or diphtheritic mouth membranes (Wet Pox).",
    description: "Fowl Pox progresses slowly through a flock. Mosquitoes act as mechanical vectors transferring the virus. The 'Wet Pox' form produces choking diphtheritic yellow membranes in the larynx and mouth.",
    symptoms: [
      "Wart-like pimples growing into dark scabs on comb, wattles, eyelids, and legs (Dry Pox)",
      "Yellowish, cheesy diphtheritic plaques inside mouth, trachea, and esophagus (Wet Pox)",
      "Difficulty eating, swallowing, and severe gasping for air",
      "Decreased egg production and slow weight gain",
      "Swollen eyelids sticking shut with purulent discharge"
    ],
    prevention: [
      "Vaccinate all birds at 6-8 weeks of age using Wing-Web inoculation method.",
      "Control mosquito populations around poultry farms using larvicides and netting.",
      "Avoid sharp equipment or overcrowding that causes skin scratches.",
      "Isolate birds with visible scabs to prevent mechanical spread."
    ],
    treatment: [
      "No specific cure; scabs will naturally slough off over 3-4 weeks.",
      "Apply iodine or antiseptic ointment carefully to dry scabs to prevent bacterial infection.",
      "Gently remove oral wet pox plaques if obstructing airway, and paint with Lugol's Iodine.",
      "Add Vitamin A supplements to drinking water to support mucosal epithelial healing."
    ]
  },
  {
    id: "coryza",
    key: "coryza",
    name: "Infectious Coryza",
    scientificName: "Avibacterium paragallinarum",
    category: "Bacterial",
    severity: "High",
    mortalityRate: "5% - 20%",
    incubationPeriod: "1 - 3 Days",
    transmission: "Direct contact, airborne droplets, contaminated drinking water",
    shortDescription: "Acute bacterial respiratory disease causing facial swelling, foul-smelling nasal discharge, and conjunctivitis.",
    description: "Infectious Coryza is a catarrhal bacterial respiratory disease. It causes acute swelling of facial tissues and wattles, foul nasal odor, and significant egg production drop in layers.",
    symptoms: [
      "Severe swelling of facial tissues, infraorbital sinuses, and wattles",
      "Foul-smelling, sticky nasal discharge clogging nostrils",
      "Swollen, glued-shut eyelids with foamy conjunctival fluid",
      "Reduced feed consumption and sharp egg drop (10% to 40%)",
      "Gasping and audible moist tracheal rales"
    ],
    prevention: [
      "Vaccinate with trivalent Coryza bacterin at 6-8 weeks and booster at 12-14 weeks.",
      "Practice strict 'All-In, All-Out' flock management.",
      "Never mix birds of different age groups or recovery status.",
      "Sanitize drinking water continuously with chlorine or iodine disinfectants."
    ],
    treatment: [
      "Treat promptly with Erythromycin, Sulfadimethoxine, or Oxytetracycline in drinking water for 5-7 days.",
      "Flush water lines and disinfect drinkers daily.",
      "Add multivitamins and stress formulas to boost immune recovery."
    ]
  },
  {
    id: "avian_flu",
    key: "avian_flu",
    name: "Avian Influenza (Bird Flu)",
    scientificName: "Influenza A Virus (H5N1 / H5N8 / H7N9)",
    category: "Viral",
    severity: "Critical",
    mortalityRate: "Up to 100% within 48 hours (HPAI strains)",
    incubationPeriod: "1 - 7 Days",
    transmission: "Migratory waterfowl droppings, direct bird contact, air, equipment",
    shortDescription: "A severe, highly contagious zoonotic viral infection causing high mortality, cyanotic combs, and facial edema.",
    description: "Highly Pathogenic Avian Influenza (HPAI) is a devastating viral infection affecting domestic and wild birds. It causes rapid systemic vascular breakdown, facial swelling, cyanotic wattles, and sudden mass mortality.",
    symptoms: [
      "Sudden death without prior warning signs",
      "Dark purple / blue discoloration (cyanosis) of comb, wattles, and legs",
      "Swollen head, eyelids, comb, wattles, and hocks",
      "Pinpoint hemorrhages (petechiae) on unfeathered shank skin",
      "Greenish watery diarrhea and severe respiratory collapse"
    ],
    prevention: [
      "Enforce maximum biosecurity: complete exclusion of wild waterfowl and migratory birds.",
      "Use dedicated farm boots, coveralls, and vehicle disinfection baths.",
      "Sanitize all farm water sources (prevent surface water contamination).",
      "Report suspected outbreaks immediately to government veterinary departments."
    ],
    treatment: [
      "Treatment is strictly prohibited in most jurisdictions to prevent viral mutation.",
      "Infected and exposed flocks must be humanely depopulated under official supervision."
    ]
  }
];

export const SYMPTOM_CHECKLIST = [
  {
    category: "Respiratory System",
    items: [
      { id: "gasping", label: "Gasping / Labored Breathing / Open Mouth", weight: { ncd: 3, ib: 3, coryza: 2, avian_flu: 3 } },
      { id: "coughing", label: "Coughing / Sneezing / Tracheal Rales", weight: { ncd: 2, ib: 3, coryza: 2 } },
      { id: "nasal_discharge", label: "Foul-Smelling / Sticky Nasal Discharge", weight: { coryza: 4, ib: 2 } },
      { id: "facial_swelling", label: "Swollen Head / Eyelids / Wattles", weight: { coryza: 3, avian_flu: 3, ncd: 2 } }
    ]
  },
  {
    category: "Digestive & Fecal System",
    items: [
      { id: "bloody_droppings", label: "Bloody or Mucoid Dark Red Droppings", weight: { cocci: 5 } },
      { id: "green_diarrhea", label: "Watery Bright Green Diarrhea", weight: { ncd: 4, avian_flu: 3 } },
      { id: "white_pasting", label: "Chalky White Diarrhea / Vent Pasting", weight: { salmo: 5 } },
      { id: "wet_litter", label: "Excessively Wet Litter / High Water Intake", weight: { cocci: 2, ib: 3 } }
    ]
  },
  {
    category: "Neurological & Nervous System",
    items: [
      { id: "twisted_neck", label: "Twisted Neck (Torticollis) / Circling", weight: { ncd: 5 } },
      { id: "paralysis", label: "Leg / Wing Paralysis (One leg forward/back)", weight: { mareks: 5, ncd: 2 } },
      { id: "tremors", label: "Tremors / Loss of Balance / Incoordination", weight: { ncd: 3, mareks: 2 } }
    ]
  },
  {
    category: "Physical & Flock Behavior",
    items: [
      { id: "ruffled_feathers", label: "Ruffled Feathers / Huddling / Severe Lethargy", weight: { cocci: 3, salmo: 3, ncd: 2, mareks: 2 } },
      { id: "pale_comb", label: "Pale Comb / Wattles / Anemia", weight: { cocci: 4, salmo: 2, mareks: 2 } },
      { id: "cyanotic_comb", label: "Dark Purple / Blue Comb & Wattles", weight: { avian_flu: 4, ncd: 2 } },
      { id: "pox_scabs", label: "Wart-like Nodules / Scabs on Comb & Eyelids", weight: { fowlpox: 5 } },
      { id: "egg_drop", label: "Sudden Egg Production Drop / Soft Shells", weight: { ib: 4, ncd: 3, avian_flu: 3, coryza: 2 } }
    ]
  }
];
