export type Card = {
  id: string;
  front: string;
  back: string;
  hint?: string;
};

export type Deck = {
  id: string;
  title: string;
  description: string;
  cards: Card[];
};

export const pigAnatomyDeck: Deck = {
  id: "pig-anatomy",
  title: "Fetal Pig Anatomy",
  description:
    "Core terms and structures encountered during a fetal pig dissection.",
  cards: [
    {
      id: "diaphragm",
      front: "Diaphragm",
      back: "Dome-shaped muscle separating the thoracic and abdominal cavities; primary muscle of respiration.",
    },
    {
      id: "pericardium",
      front: "Pericardium",
      back: "Double-walled sac of connective tissue surrounding the heart; reduces friction during contraction.",
    },
    {
      id: "trachea",
      front: "Trachea",
      back: "Cartilaginous tube carrying air from larynx to bronchi; held open by C-shaped cartilage rings.",
      hint: "Sometimes called the windpipe.",
    },
    {
      id: "esophagus",
      front: "Esophagus",
      back: "Muscular tube transporting food from the pharynx to the stomach via peristalsis. Lies dorsal to the trachea.",
    },
    {
      id: "liver",
      front: "Liver",
      back: "Largest abdominal organ; produces bile, detoxifies blood, stores glycogen. In the fetal pig, has 5 lobes.",
    },
    {
      id: "gallbladder",
      front: "Gallbladder",
      back: "Sac on the underside of the liver that stores and concentrates bile before release into the duodenum.",
    },
    {
      id: "spleen",
      front: "Spleen",
      back: "Long, flat, reddish organ along the greater curvature of the stomach; filters blood and recycles RBCs.",
    },
    {
      id: "pancreas",
      front: "Pancreas",
      back: "Granular gland in the mesentery near the duodenum; secretes digestive enzymes and insulin/glucagon.",
    },
    {
      id: "duodenum",
      front: "Duodenum",
      back: "First section of the small intestine; receives chyme from stomach and secretions from pancreas/liver.",
    },
    {
      id: "cecum",
      front: "Cecum",
      back: "Blind pouch at the junction of the small and large intestines; aids in fermentation of plant material.",
    },
    {
      id: "umbilical-cord",
      front: "Umbilical cord",
      back: "Connects fetus to placenta; contains two umbilical arteries and one umbilical vein.",
      hint: "Two arteries, one vein.",
    },
    {
      id: "ductus-arteriosus",
      front: "Ductus arteriosus",
      back: "Fetal shunt connecting pulmonary artery to aorta, bypassing non-functional fetal lungs. Closes at birth.",
    },
    {
      id: "foramen-ovale",
      front: "Foramen ovale",
      back: "Opening between the right and left atria in the fetal heart, allowing blood to bypass fetal lungs.",
    },
    {
      id: "kidney",
      front: "Kidney",
      back: "Bean-shaped organ on the dorsal body wall; filters blood to produce urine. Retroperitoneal.",
    },
    {
      id: "ureter",
      front: "Ureter",
      back: "Muscular tube carrying urine from kidney to urinary bladder.",
    },
    {
      id: "umbilical-vein",
      front: "Umbilical vein",
      back: "Carries oxygenated blood from placenta to fetal liver; bypasses liver via the ductus venosus.",
    },
    {
      id: "vena-cava",
      front: "Posterior vena cava",
      back: "Large vein returning deoxygenated blood from lower body to the right atrium of the heart.",
    },
    {
      id: "aorta",
      front: "Aorta",
      back: "Largest artery; carries oxygenated blood from the left ventricle to systemic circulation.",
    },
    {
      id: "thymus",
      front: "Thymus",
      back: "Bilobed gland in the upper thorax; matures T-lymphocytes. Prominent in fetus, regresses with age.",
    },
    {
      id: "thyroid",
      front: "Thyroid",
      back: "Dark, oval gland on the ventral surface of the trachea; secretes hormones regulating metabolism.",
    },
  ],
};

export const decks: Deck[] = [pigAnatomyDeck];
