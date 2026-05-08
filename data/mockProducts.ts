import type { Product, ProductCategory } from "@/types";

export const supportedCategories: ProductCategory[] = [
  "Cameras",
  "Laptops",
  "Bikes",
  "Monitors"
];

export const globalScamWarnings = [
  "Price is far below normal market value",
  "Seller refuses a public meetup or local pickup",
  "Listing uses stock photos only",
  "Seller will not share a serial number or proof of ownership",
  "Seller adds urgency pressure or says other buyers are waiting",
  "Seller asks for payment before pickup",
  "Answers are vague, copied, or avoid basic condition questions"
];

export const mockProducts: Product[] = [
  {
    id: "sony-a6400-2019",
    category: "Cameras",
    brand: "Sony",
    model: "A6400",
    year: 2019,
    msrp: 900,
    usedLow: 560,
    usedAvg: 680,
    usedHigh: 780,
    fairPrice: 650,
    depreciationPercent: 28,
    reliabilityScore: 8,
    demandScore: 9,
    scamRiskScore: 5,
    commonIssues: [
      { issue: "Shutter count above 75,000 can lower value", severity: "medium" },
      { issue: "Sensor dust from frequent lens swaps", severity: "medium" },
      { issue: "Loose micro HDMI door or worn ports", severity: "low" },
      { issue: "Autofocus hunting with damaged or cheap lenses", severity: "medium" },
      { issue: "Water damage around battery door and hot shoe", severity: "high" }
    ],
    bestYearsModels: ["2019-2024 A6400 bodies", "A6400 with kit lens under fair price", "Low shutter count body-only listings"],
    modelsToAvoid: ["Bodies with corrosion in battery bay", "Listings bundled with unknown manual lenses at inflated prices"],
    buyingChecklist: [
      "Check shutter count and ask for a recent sample photo",
      "Inspect sensor at f/16 against a bright wall",
      "Test autofocus with face and eye detection",
      "Check every dial, button, port, and battery door",
      "Confirm the serial number matches the body"
    ],
    sellerQuestions: [
      "What is the shutter count?",
      "Has the sensor ever been cleaned?",
      "Can you send a video showing autofocus and the rear screen working?",
      "Was it ever dropped, rained on, or repaired?",
      "Is the original battery and charger included?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "The A6400 holds value well because demand is high. Buy near the fair price if shutter count is reasonable and the sensor is clean."
  },
  {
    id: "canon-eos-r10-2022",
    category: "Cameras",
    brand: "Canon",
    model: "EOS R10",
    year: 2022,
    msrp: 980,
    usedLow: 620,
    usedAvg: 760,
    usedHigh: 880,
    fairPrice: 735,
    depreciationPercent: 25,
    reliabilityScore: 8,
    demandScore: 8,
    scamRiskScore: 4,
    commonIssues: [
      { issue: "Hot shoe cover missing or damaged", severity: "low" },
      { issue: "Sensor dust from careless lens changes", severity: "medium" },
      { issue: "Loose strap lugs after heavy use", severity: "medium" },
      { issue: "Rear screen hinge stiffness or wobble", severity: "medium" },
      { issue: "Gray-market body without warranty history", severity: "low" }
    ],
    bestYearsModels: ["2022-2025 EOS R10", "R10 with RF-S 18-150mm bundle", "Low-use creator kits with receipt"],
    modelsToAvoid: ["Bodies with impact marks around the viewfinder", "Listings without battery, charger, or body cap"],
    buyingChecklist: [
      "Confirm included lens mount and accessories",
      "Test mechanical and electronic shutter modes",
      "Check the articulating screen hinge",
      "Inspect the sensor and lens contacts",
      "Verify receipt or purchase source"
    ],
    sellerQuestions: [
      "Do you have the original receipt?",
      "Which lens is included, if any?",
      "Has it ever shown overheating warnings?",
      "Can you record a short video clip with it?",
      "Are there scratches on the sensor or rear screen?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "This is still a current-feeling Canon body with strong autofocus. Used prices are fair when the kit lens and accessories are included."
  },
  {
    id: "fujifilm-xt30-ii-2021",
    category: "Cameras",
    brand: "Fujifilm",
    model: "X-T30 II",
    year: 2021,
    msrp: 900,
    usedLow: 710,
    usedAvg: 830,
    usedHigh: 960,
    fairPrice: 800,
    depreciationPercent: 11,
    reliabilityScore: 8,
    demandScore: 9,
    scamRiskScore: 6,
    commonIssues: [
      { issue: "High resale demand can inflate pricing", severity: "medium" },
      { issue: "Dust under rear command dial", severity: "low" },
      { issue: "Sensor dust or oil spots", severity: "medium" },
      { issue: "Loose rubber grip from heat or heavy use", severity: "low" },
      { issue: "Unclear lens value in bundles", severity: "medium" }
    ],
    bestYearsModels: ["X-T30 II body-only near fair price", "Kits with XF 18-55mm under high market price", "Silver and black bodies with receipt"],
    modelsToAvoid: ["Listings priced like a new X-T50", "Bodies with sticky dials or broken exposure compensation"],
    buyingChecklist: [
      "Check all dials for clean clicks",
      "Inspect sensor and EVF for dust",
      "Test film simulation menu and autofocus",
      "Compare bundled lens value separately",
      "Look for receipt because Fujifilm scams are common"
    ],
    sellerQuestions: [
      "Is this the X-T30 II, not the original X-T30?",
      "Which lens comes with it?",
      "Can you send a photo of the serial number?",
      "Any sticky dials or buttons?",
      "Why are you selling it?"
    ],
    recommendation: "Risky purchase",
    recommendationExplanation: "The camera is reliable, but used demand is hot and scam risk is higher than average. Verify ownership and avoid rushed payment."
  },
  {
    id: "sony-a7-iii-2018",
    category: "Cameras",
    brand: "Sony",
    model: "A7 III",
    year: 2018,
    msrp: 2000,
    usedLow: 920,
    usedAvg: 1125,
    usedHigh: 1350,
    fairPrice: 1080,
    depreciationPercent: 46,
    reliabilityScore: 8,
    demandScore: 9,
    scamRiskScore: 6,
    commonIssues: [
      { issue: "High shutter count from wedding or event work", severity: "high" },
      { issue: "Worn card slot door or dual card slot errors", severity: "medium" },
      { issue: "Sensor dust and scratches from lens changes", severity: "high" },
      { issue: "Loose USB-C or HDMI ports", severity: "medium" },
      { issue: "Water damage around hot shoe", severity: "high" }
    ],
    bestYearsModels: ["A7 III bodies with under 50,000 shutter count", "Kits with genuine Sony batteries", "Body-only listings with receipt"],
    modelsToAvoid: ["Heavily used wedding bodies", "Bodies with shutter errors", "Listings that hide shutter count"],
    buyingChecklist: [
      "Get shutter count before meeting",
      "Take test shots at several apertures",
      "Test both memory card slots",
      "Inspect sensor with a flashlight at an angle",
      "Check IBIS by half-pressing shutter with a lens attached"
    ],
    sellerQuestions: [
      "What kind of work was it used for?",
      "What is the exact shutter count?",
      "Have either card slots ever failed?",
      "Can you send raw sample files?",
      "Are the batteries genuine Sony batteries?"
    ],
    recommendation: "Great deal",
    recommendationExplanation: "A clean A7 III near fair price is still a strong full-frame buy. The main risk is hidden professional wear."
  },
  {
    id: "canon-m50-mark-ii-2020",
    category: "Cameras",
    brand: "Canon",
    model: "M50 Mark II",
    year: 2020,
    msrp: 700,
    usedLow: 360,
    usedAvg: 455,
    usedHigh: 540,
    fairPrice: 430,
    depreciationPercent: 39,
    reliabilityScore: 7,
    demandScore: 6,
    scamRiskScore: 4,
    commonIssues: [
      { issue: "EF-M lens ecosystem is discontinued", severity: "medium" },
      { issue: "Autofocus limitations in 4K video", severity: "low" },
      { issue: "Battery door cracks", severity: "medium" },
      { issue: "Loose articulating screen hinge", severity: "medium" },
      { issue: "Kit lenses with dust or fungus", severity: "medium" }
    ],
    bestYearsModels: ["M50 Mark II under fair price", "Bundles with EF-M 22mm lens", "Low-use creator kits"],
    modelsToAvoid: ["Overpriced bundles near newer Canon R50 pricing", "Bodies with cracked battery doors"],
    buyingChecklist: [
      "Confirm this is Mark II, not original M50",
      "Test the screen hinge and touch controls",
      "Check lens autofocus and zoom smoothness",
      "Compare price against Canon R50 used listings",
      "Verify no fungus in bundled lenses"
    ],
    sellerQuestions: [
      "Is the battery door intact?",
      "Which lenses are included?",
      "Was it mostly used for video or photos?",
      "Can you send a video of the touchscreen working?",
      "Any issues with autofocus?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "Good starter camera if priced correctly, but avoid paying too close to newer Canon mirrorless options."
  },
  {
    id: "macbook-air-m1-2020",
    category: "Laptops",
    brand: "Apple",
    model: "MacBook Air M1",
    year: 2020,
    msrp: 999,
    usedLow: 430,
    usedAvg: 540,
    usedHigh: 690,
    fairPrice: 525,
    depreciationPercent: 47,
    reliabilityScore: 9,
    demandScore: 9,
    scamRiskScore: 7,
    commonIssues: [
      { issue: "Activation Lock or MDM enrollment", severity: "high" },
      { issue: "Battery cycle count above 600", severity: "medium" },
      { issue: "Keyboard shine and trackpad wear", severity: "low" },
      { issue: "Cracked display coating or pressure marks", severity: "high" },
      { issue: "Base 8GB RAM limits heavy workflows", severity: "medium" }
    ],
    bestYearsModels: ["2020 M1 with 16GB RAM", "Clean base model under fair price", "AppleCare history with receipt"],
    modelsToAvoid: ["Locked or managed devices", "Units with screen pressure damage", "Intel MacBook Air priced similarly"],
    buyingChecklist: [
      "Open System Settings and confirm no Activation Lock or MDM",
      "Check battery health and cycle count",
      "Run keyboard, speakers, camera, and ports",
      "Inspect screen on a white and black background",
      "Confirm storage size and RAM match the listing"
    ],
    sellerQuestions: [
      "Is Find My turned off and can you erase it in front of me?",
      "What are the battery cycle count and maximum capacity?",
      "Is it managed by a school or company?",
      "Do you have the original receipt?",
      "Any display marks or keyboard issues?"
    ],
    recommendation: "Great deal",
    recommendationExplanation: "The M1 Air is one of the best used laptop buys if it is unlocked, clean, and priced around fair value."
  },
  {
    id: "macbook-air-m2-2022",
    category: "Laptops",
    brand: "Apple",
    model: "MacBook Air M2",
    year: 2022,
    msrp: 1199,
    usedLow: 650,
    usedAvg: 790,
    usedHigh: 960,
    fairPrice: 760,
    depreciationPercent: 37,
    reliabilityScore: 8,
    demandScore: 9,
    scamRiskScore: 7,
    commonIssues: [
      { issue: "Activation Lock or MDM enrollment", severity: "high" },
      { issue: "Base 256GB model has slower storage than higher configs", severity: "medium" },
      { issue: "Midnight finish shows scratches and fingerprints", severity: "low" },
      { issue: "Battery cycles above 500", severity: "medium" },
      { issue: "Bent lid or display pressure marks", severity: "high" }
    ],
    bestYearsModels: ["2022 M2 with 16GB RAM", "512GB storage configs", "Clean base model below fair price"],
    modelsToAvoid: ["MDM locked devices", "Base 8GB/256GB units priced like upgraded configs", "Units with bent corners"],
    buyingChecklist: [
      "Confirm no Activation Lock or MDM",
      "Check battery health and cycle count",
      "Verify RAM and storage in About This Mac",
      "Inspect the lid, hinge, screen, and USB-C ports",
      "Confirm MagSafe cable and charger are included"
    ],
    sellerQuestions: [
      "Can you erase it and remove it from your Apple ID at meetup?",
      "What RAM and storage does it have?",
      "What is the battery health percentage?",
      "Any screen pressure marks?",
      "Is the charger included?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "A solid buy at fair price, especially with 16GB RAM or 512GB storage. Be strict about lock status."
  },
  {
    id: "dell-xps-13-9315-2022",
    category: "Laptops",
    brand: "Dell",
    model: "XPS 13",
    year: 2022,
    msrp: 999,
    usedLow: 410,
    usedAvg: 565,
    usedHigh: 720,
    fairPrice: 540,
    depreciationPercent: 46,
    reliabilityScore: 7,
    demandScore: 7,
    scamRiskScore: 4,
    commonIssues: [
      { issue: "Battery wear and swelling on older units", severity: "medium" },
      { issue: "Thermal throttling under sustained load", severity: "medium" },
      { issue: "USB-C ports loosen from heavy dock use", severity: "medium" },
      { issue: "Webcam or fingerprint reader driver issues", severity: "low" },
      { issue: "Tiny SSD capacity on base configs", severity: "low" }
    ],
    bestYearsModels: ["XPS 13 with 16GB RAM", "FHD+ display for better battery life", "Warranty-transferable Dell units"],
    modelsToAvoid: ["8GB RAM units over fair price", "Units with swelling battery", "Machines with BIOS passwords"],
    buyingChecklist: [
      "Run Dell diagnostics before buying",
      "Check battery health in BIOS or Windows report",
      "Test both USB-C ports with charging",
      "Check fan noise and keyboard deck heat",
      "Verify no BIOS password is set"
    ],
    sellerQuestions: [
      "Can you show the Dell service tag?",
      "Does it charge from both USB-C ports?",
      "Any fan noise or overheating?",
      "Is there a BIOS password?",
      "What are the exact RAM and SSD specs?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "Good value when discounted. Avoid high-priced base configs because Windows ultrabooks depreciate quickly."
  },
  {
    id: "thinkpad-x1-carbon-gen10-2022",
    category: "Laptops",
    brand: "Lenovo",
    model: "ThinkPad X1 Carbon",
    year: 2022,
    msrp: 1800,
    usedLow: 620,
    usedAvg: 835,
    usedHigh: 1050,
    fairPrice: 800,
    depreciationPercent: 56,
    reliabilityScore: 8,
    demandScore: 8,
    scamRiskScore: 5,
    commonIssues: [
      { issue: "Corporate BIOS password or Computrace lock", severity: "high" },
      { issue: "Battery capacity below 75 percent", severity: "medium" },
      { issue: "Shiny keyboard from heavy office use", severity: "low" },
      { issue: "Cracked carbon fiber lid corners", severity: "medium" },
      { issue: "Low-end 8GB soldered RAM configs", severity: "medium" }
    ],
    bestYearsModels: ["Gen 9 through Gen 11 with 16GB RAM", "WUXGA screens for battery life", "Units with warranty lookup available"],
    modelsToAvoid: ["BIOS locked machines", "8GB RAM configs for power users", "Corporate surplus with missing charger"],
    buyingChecklist: [
      "Check BIOS for password and Computrace state",
      "Use Lenovo warranty lookup with serial number",
      "Inspect hinges and lid corners",
      "Confirm RAM is enough because it is soldered",
      "Run keyboard, TrackPoint, trackpad, camera, and fingerprint tests"
    ],
    sellerQuestions: [
      "Was this a company laptop?",
      "Is there any BIOS password or asset management lock?",
      "What is the battery health?",
      "Can you send the serial number for warranty lookup?",
      "Does the TrackPoint and fingerprint reader work?"
    ],
    recommendation: "Great deal",
    recommendationExplanation: "Business laptops lose value fast, which can make a clean X1 Carbon a strong used buy. Check for corporate locks."
  },
  {
    id: "surface-laptop-5-2022",
    category: "Laptops",
    brand: "Microsoft",
    model: "Surface Laptop 5",
    year: 2022,
    msrp: 999,
    usedLow: 430,
    usedAvg: 585,
    usedHigh: 760,
    fairPrice: 550,
    depreciationPercent: 45,
    reliabilityScore: 7,
    demandScore: 7,
    scamRiskScore: 4,
    commonIssues: [
      { issue: "Alcantara keyboard staining on some models", severity: "low" },
      { issue: "Battery wear and limited repairability", severity: "medium" },
      { issue: "Cracked touchscreen corners", severity: "high" },
      { issue: "USB-C port looseness", severity: "medium" },
      { issue: "Overpriced low-RAM configurations", severity: "medium" }
    ],
    bestYearsModels: ["13.5 inch 16GB RAM models", "Metal keyboard deck models", "Units with Microsoft Complete history"],
    modelsToAvoid: ["8GB RAM units at high prices", "Cracked touchscreen listings", "Battery swelling symptoms"],
    buyingChecklist: [
      "Test touchscreen across the whole panel",
      "Check battery report",
      "Inspect keyboard deck and hinge stiffness",
      "Verify RAM and SSD size",
      "Test charger and USB-C charging"
    ],
    sellerQuestions: [
      "Any touchscreen dead zones?",
      "What is the battery cycle count?",
      "Is it the 8GB or 16GB model?",
      "Any cracks around the display corners?",
      "Does it include the Surface charger?"
    ],
    recommendation: "Overpriced",
    recommendationExplanation: "A good laptop, but used listings often ask too much for low-RAM configs. Buy only below fair price."
  },
  {
    id: "trek-marlin-5-2022",
    category: "Bikes",
    brand: "Trek",
    model: "Marlin 5",
    year: 2022,
    msrp: 740,
    usedLow: 320,
    usedAvg: 440,
    usedHigh: 560,
    fairPrice: 420,
    depreciationPercent: 43,
    reliabilityScore: 7,
    demandScore: 8,
    scamRiskScore: 6,
    commonIssues: [
      { issue: "Worn drivetrain from trail use", severity: "medium" },
      { issue: "Bent derailleur hanger", severity: "medium" },
      { issue: "Suspension fork service neglect", severity: "medium" },
      { issue: "Cracked frame near welds after crashes", severity: "high" },
      { issue: "Stolen bike risk without receipt", severity: "high" }
    ],
    bestYearsModels: ["2021-2024 Marlin 5 in correct size", "Hydraulic disc brake versions", "Lightly ridden neighborhood bikes"],
    modelsToAvoid: ["Wrong frame size", "Hard-used trail bikes with cheap upgrades", "Listings missing serial number"],
    buyingChecklist: [
      "Check frame serial number and ask for proof of ownership",
      "Inspect frame welds and fork stanchions",
      "Shift through all gears under load",
      "Spin wheels and check for wobbles",
      "Check brake pad life and rotor rub"
    ],
    sellerQuestions: [
      "What size is the frame?",
      "Do you have the original receipt or bike shop record?",
      "Has it been crashed?",
      "When was the chain last replaced?",
      "Can I test ride it before buying?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "A practical starter mountain bike if the size fits and it has proof of ownership. Avoid bikes with hidden crash damage."
  },
  {
    id: "specialized-rockhopper-2021",
    category: "Bikes",
    brand: "Specialized",
    model: "Rockhopper",
    year: 2021,
    msrp: 800,
    usedLow: 330,
    usedAvg: 455,
    usedHigh: 590,
    fairPrice: 435,
    depreciationPercent: 46,
    reliabilityScore: 7,
    demandScore: 8,
    scamRiskScore: 6,
    commonIssues: [
      { issue: "Entry-level fork feels rough if neglected", severity: "medium" },
      { issue: "Chain stretch and cassette wear", severity: "medium" },
      { issue: "Bent wheels from curb hits", severity: "medium" },
      { issue: "Hydraulic brake sponge if not serviced", severity: "low" },
      { issue: "Stolen bike risk on cash-only listings", severity: "high" }
    ],
    bestYearsModels: ["Sport or Comp trims at fair price", "Correct-size frame with hydraulic brakes", "Bike-shop maintained listings"],
    modelsToAvoid: ["Base trims priced like Comp trims", "Suspicious no-receipt listings", "Frames with dents near bottom bracket"],
    buyingChecklist: [
      "Confirm trim level and frame size",
      "Check serial number and ownership record",
      "Inspect drivetrain wear",
      "Bounce-test fork and check for oil leaks",
      "Test brakes on a short ride"
    ],
    sellerQuestions: [
      "Which Rockhopper trim is it?",
      "Do you have proof of purchase?",
      "Any crashes or frame dents?",
      "Has the fork ever been serviced?",
      "Are the tires tubeless or tubes?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "A solid used hardtail if the trim is priced honestly. Watch for entry-level bikes listed as higher trims."
  },
  {
    id: "giant-talon-2022",
    category: "Bikes",
    brand: "Giant",
    model: "Talon",
    year: 2022,
    msrp: 750,
    usedLow: 300,
    usedAvg: 420,
    usedHigh: 540,
    fairPrice: 400,
    depreciationPercent: 47,
    reliabilityScore: 7,
    demandScore: 7,
    scamRiskScore: 5,
    commonIssues: [
      { issue: "Worn chain and rear cassette", severity: "medium" },
      { issue: "Cheap pedals or grips added to hide wear", severity: "low" },
      { issue: "Wheel bearing play", severity: "medium" },
      { issue: "Fork stanchion scratches", severity: "high" },
      { issue: "Unclear model trim in listings", severity: "medium" }
    ],
    bestYearsModels: ["Talon 1 or 2 with hydraulic brakes", "29er versions in common sizes", "Low-mile local trail bikes"],
    modelsToAvoid: ["Talon 4 priced like Talon 1", "Visible fork scratches", "No serial number photo"],
    buyingChecklist: [
      "Confirm Talon trim level from components",
      "Check fork stanchions and seals",
      "Inspect wheel bearing play",
      "Measure chain wear if possible",
      "Verify serial number before payment"
    ],
    sellerQuestions: [
      "Is this a Talon 1, 2, 3, or 4?",
      "What size wheels and frame?",
      "Has it been ridden on trails or mainly pavement?",
      "Any fork leaks or scratches?",
      "Do you have the serial number?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "Good value when the trim is clear. Do not pay premium pricing for a lower trim or worn drivetrain."
  },
  {
    id: "cannondale-quick-2021",
    category: "Bikes",
    brand: "Cannondale",
    model: "Quick",
    year: 2021,
    msrp: 725,
    usedLow: 260,
    usedAvg: 380,
    usedHigh: 500,
    fairPrice: 360,
    depreciationPercent: 50,
    reliabilityScore: 8,
    demandScore: 6,
    scamRiskScore: 4,
    commonIssues: [
      { issue: "Worn brake pads from commuting", severity: "low" },
      { issue: "Bent wheels from potholes", severity: "medium" },
      { issue: "Dry chain and cassette wear", severity: "medium" },
      { issue: "Wrong size sold to casual buyers", severity: "medium" },
      { issue: "Missing lights, rack, or accessories from original setup", severity: "low" }
    ],
    bestYearsModels: ["Quick 3 or Quick 4 at fair price", "Disc brake models", "Commuter setups with rack and fenders included"],
    modelsToAvoid: ["Rim brake models priced like disc models", "Wrong frame size", "Neglected outdoor storage bikes"],
    buyingChecklist: [
      "Confirm frame size and fit",
      "Check wheels for true spin",
      "Inspect chain rust and gear shifting",
      "Test brakes and look at pad life",
      "Check for frame corrosion from outdoor storage"
    ],
    sellerQuestions: [
      "What size is the bike?",
      "Was it stored indoors?",
      "Any wheel wobbles or shifting issues?",
      "Does it include rack, lights, or fenders?",
      "Do you have proof of ownership?"
    ],
    recommendation: "Great deal",
    recommendationExplanation: "Hybrid bikes depreciate hard and are cheap to maintain. A clean Quick below fair price is an easy yes."
  },
  {
    id: "trek-fx-3-2022",
    category: "Bikes",
    brand: "Trek",
    model: "FX 3",
    year: 2022,
    msrp: 1000,
    usedLow: 520,
    usedAvg: 670,
    usedHigh: 820,
    fairPrice: 640,
    depreciationPercent: 36,
    reliabilityScore: 8,
    demandScore: 8,
    scamRiskScore: 5,
    commonIssues: [
      { issue: "Drivetrain wear from daily commuting", severity: "medium" },
      { issue: "Hydraulic brake service needed", severity: "low" },
      { issue: "Carbon fork damage after crashes", severity: "high" },
      { issue: "Wrong frame size", severity: "medium" },
      { issue: "Stolen bike risk in urban listings", severity: "high" }
    ],
    bestYearsModels: ["2021-2024 FX 3 Disc", "Correct frame size with receipt", "Commuter builds with accessories"],
    modelsToAvoid: ["Carbon fork impact damage", "No proof of ownership", "FX 1 or FX 2 mislisted as FX 3"],
    buyingChecklist: [
      "Verify it is actually an FX 3 Disc",
      "Inspect carbon fork for chips or cracks",
      "Check drivetrain and brakes",
      "Confirm serial number and ownership",
      "Test ride for fit and wheel alignment"
    ],
    sellerQuestions: [
      "Is this the FX 3 Disc model?",
      "What size frame is it?",
      "Do you have the original purchase record?",
      "Any crashes or fork damage?",
      "When was it last serviced?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "A strong used commuter buy, but demand keeps prices higher than basic hybrids. Ownership proof matters."
  },
  {
    id: "dell-ultrasharp-u2720q-2020",
    category: "Monitors",
    brand: "Dell",
    model: "UltraSharp U2720Q",
    year: 2020,
    msrp: 710,
    usedLow: 250,
    usedAvg: 335,
    usedHigh: 430,
    fairPrice: 320,
    depreciationPercent: 55,
    reliabilityScore: 8,
    demandScore: 8,
    scamRiskScore: 4,
    commonIssues: [
      { issue: "Backlight bleed visible on dark screens", severity: "medium" },
      { issue: "Dead or stuck pixels", severity: "medium" },
      { issue: "Missing USB-C cable or power brick", severity: "low" },
      { issue: "USB-C power delivery failure", severity: "medium" },
      { issue: "Scratched panel coating", severity: "high" }
    ],
    bestYearsModels: ["U2720Q and U2723QE if priced fairly", "Units with original stand and cables", "Seller willing to show pixel test"],
    modelsToAvoid: ["Cracked panels", "No stand at high price", "Units with USB-C charging issues"],
    buyingChecklist: [
      "Run full-screen white, black, red, green, and blue tests",
      "Test USB-C display and charging",
      "Check brightness uniformity",
      "Confirm stand, power cable, and USB-C cable",
      "Inspect panel coating under bright light"
    ],
    sellerQuestions: [
      "Any dead pixels or backlight bleed?",
      "Does USB-C charging work?",
      "Is the original stand included?",
      "Can you send a photo of a full white screen?",
      "Any scratches on the display surface?"
    ],
    recommendation: "Great deal",
    recommendationExplanation: "Dell UltraSharp monitors age well and used prices are much lower than MSRP. Test pixels before paying."
  },
  {
    id: "lg-27gl850-2019",
    category: "Monitors",
    brand: "LG",
    model: "27GL850",
    year: 2019,
    msrp: 500,
    usedLow: 170,
    usedAvg: 235,
    usedHigh: 310,
    fairPrice: 225,
    depreciationPercent: 55,
    reliabilityScore: 7,
    demandScore: 8,
    scamRiskScore: 3,
    commonIssues: [
      { issue: "IPS glow and backlight bleed", severity: "medium" },
      { issue: "Dead pixels", severity: "medium" },
      { issue: "Loose joystick control", severity: "low" },
      { issue: "Missing stand", severity: "low" },
      { issue: "Panel scratches from cleaning", severity: "medium" }
    ],
    bestYearsModels: ["27GL850 under fair price", "27GP850 if similarly priced", "Units with original stand"],
    modelsToAvoid: ["Panels with heavy bleed", "No stand unless discounted", "Listings claiming 4K when it is 1440p"],
    buyingChecklist: [
      "Confirm it is 1440p 144Hz, not 4K",
      "Run dead pixel test",
      "Check high refresh rate in display settings",
      "Inspect stand and VESA mounting screws",
      "Test DisplayPort and HDMI"
    ],
    sellerQuestions: [
      "Any dead pixels or heavy backlight bleed?",
      "Does it run at 144Hz over DisplayPort?",
      "Is the stand included?",
      "Can you show the model number sticker?",
      "Any scratches on the screen?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "Still a good gaming monitor, but prices should reflect its age and 1440p resolution."
  },
  {
    id: "asus-proart-pa278qv-2020",
    category: "Monitors",
    brand: "ASUS",
    model: "ProArt PA278QV",
    year: 2020,
    msrp: 300,
    usedLow: 150,
    usedAvg: 205,
    usedHigh: 260,
    fairPrice: 195,
    depreciationPercent: 35,
    reliabilityScore: 8,
    demandScore: 7,
    scamRiskScore: 3,
    commonIssues: [
      { issue: "Factory calibration report missing", severity: "low" },
      { issue: "Backlight uniformity issues", severity: "medium" },
      { issue: "Dead pixels", severity: "medium" },
      { issue: "Stand wobble from loose screws", severity: "low" },
      { issue: "Panel scratches", severity: "medium" }
    ],
    bestYearsModels: ["PA278QV under fair price", "Units with calibration sheet", "Designer setups with light use"],
    modelsToAvoid: ["Overpriced listings near new retail", "Damaged panels", "Missing stand at full price"],
    buyingChecklist: [
      "Run pixel and uniformity tests",
      "Check all inputs",
      "Inspect stand movement and height adjustment",
      "Confirm resolution is 2560x1440",
      "Ask about color work and hours used"
    ],
    sellerQuestions: [
      "Do you still have the calibration report?",
      "Any dead pixels?",
      "Was it used for color-critical work?",
      "Does the stand adjust properly?",
      "Any scratches or pressure marks?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "A good creator monitor if it is clean. Avoid paying too close to new price because discounts are common."
  },
  {
    id: "samsung-odyssey-g5-2021",
    category: "Monitors",
    brand: "Samsung",
    model: "Odyssey G5",
    year: 2021,
    msrp: 330,
    usedLow: 120,
    usedAvg: 185,
    usedHigh: 260,
    fairPrice: 175,
    depreciationPercent: 47,
    reliabilityScore: 6,
    demandScore: 7,
    scamRiskScore: 4,
    commonIssues: [
      { issue: "VA panel smearing in dark scenes", severity: "medium" },
      { issue: "Dead pixels", severity: "medium" },
      { issue: "Aggressive curve may not suit desk setups", severity: "low" },
      { issue: "Flicker with adaptive sync", severity: "medium" },
      { issue: "Missing VESA adapter or stand parts", severity: "low" }
    ],
    bestYearsModels: ["27 inch G5 priced well below fair", "Units with return history or receipt", "Flat-panel alternatives if color matters"],
    modelsToAvoid: ["Panels with flicker complaints", "Overpriced curved models", "Listings with no photos of the monitor on"],
    buyingChecklist: [
      "Test dark motion scenes for smearing",
      "Check adaptive sync at high refresh rate",
      "Run a dead pixel test",
      "Confirm stand pieces and power adapter",
      "Make sure the curve works for your desk"
    ],
    sellerQuestions: [
      "Any flicker with FreeSync or G-Sync?",
      "Can you show it running at full refresh rate?",
      "Are all stand parts included?",
      "Any dead pixels?",
      "Why are you selling it?"
    ],
    recommendation: "Risky purchase",
    recommendationExplanation: "Can be cheap, but panel quality varies. Buy only after seeing it on and testing motion."
  },
  {
    id: "benq-pd2700u-2018",
    category: "Monitors",
    brand: "BenQ",
    model: "PD2700U",
    year: 2018,
    msrp: 540,
    usedLow: 180,
    usedAvg: 260,
    usedHigh: 340,
    fairPrice: 245,
    depreciationPercent: 55,
    reliabilityScore: 8,
    demandScore: 6,
    scamRiskScore: 3,
    commonIssues: [
      { issue: "Backlight bleed on older panels", severity: "medium" },
      { issue: "Dead pixels", severity: "medium" },
      { issue: "HDMI handshake issues with older cables", severity: "low" },
      { issue: "Missing factory stand", severity: "low" },
      { issue: "Color drift from long daily use", severity: "medium" }
    ],
    bestYearsModels: ["PD2700U below fair price", "Units with low office use", "Seller showing 4K input working"],
    modelsToAvoid: ["Panels with visible scratches", "No stand unless discounted", "Units with color uniformity problems"],
    buyingChecklist: [
      "Run 4K input over HDMI or DisplayPort",
      "Test solid colors and grayscale",
      "Check stand adjustment",
      "Look for scratches under bright light",
      "Confirm power and display cables"
    ],
    sellerQuestions: [
      "Any dead pixels or backlight bleed?",
      "Does 4K work over the included cable?",
      "How many hours per day was it used?",
      "Is the original stand included?",
      "Any color uniformity issues?"
    ],
    recommendation: "Fair price",
    recommendationExplanation: "A practical 4K creator monitor at a low used price. Test panel uniformity because age matters."
  }
];

export function findProductById(id: string) {
  return mockProducts.find((product) => product.id === id);
}

export function getProductsByCategory(category: ProductCategory) {
  return mockProducts.filter((product) => product.category === category);
}

export function getAlternativeProducts(product: Product, limit = 3) {
  return mockProducts
    .filter((candidate) => candidate.category === product.category && candidate.id !== product.id)
    .sort((a, b) => {
      const aScore = a.reliabilityScore + a.demandScore - a.scamRiskScore;
      const bScore = b.reliabilityScore + b.demandScore - b.scamRiskScore;
      return bScore - aScore;
    })
    .slice(0, limit);
}
