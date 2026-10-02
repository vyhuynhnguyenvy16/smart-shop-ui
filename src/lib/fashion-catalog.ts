// Editorial demonstration catalog. Replace rows with catalog API records when available.
export const FASHION_CATEGORIES = ["Clothing", "Outerwear", "Denim", "Dresses", "Shoes", "Bags", "Accessories"] as const;

const rows = [
  [1,"The Everyday Poplin Shirt","clothing","apparel-1",79,99,"Crisp oversized cotton poplin for every day."],
  [2,"Relaxed Tailored Blazer","outerwear","apparel-2",159,199,"A softly structured layer with an easy fit."],
  [3,"Straight-Leg Indigo Jeans","denim","apparel-3",98,125,"A timeless straight leg cut in washed indigo."],
  [4,"The Black Slip Dress","dresses","apparel-4",119,149,"A fluid, understated dress for day or evening."],
  [5,"Longline Wool Coat","outerwear","outerwear-1",249,299,"Clean-lined warmth with a classic tailored silhouette."],
  [6,"Blue Oxford Shirt","clothing","outerwear-2",84,105,"A versatile blue shirt in soft cotton."],
  [7,"Ribbed Knit Cardigan","clothing","outerwear-3",110,140,"A soft knit layer with a relaxed shape."],
  [8,"Olive Utility Jacket","outerwear","outerwear-4",145,175,"An effortless utility layer with practical pockets."],
  [9,"Sculpted Shoulder Bag","bags","accessories-1",189,229,"A compact leather bag with clean lines."],
  [10,"Everyday Leather Tote","bags","accessories-2",210,250,"A spacious tote designed to go everywhere."],
  [11,"Classic Gold Hoops","accessories","accessories-3",55,69,"Polished hoops that finish every look."],
  [12,"Silk Neck Scarf","accessories","accessories-4",65,85,"A versatile silk accessory with a soft drape."],
  [13,"Retro Leather Sneakers","shoes","shoes-1",135,165,"Low-top leather sneakers for everyday wear."],
  [14,"Polished Leather Loafers","shoes","shoes-2",169,209,"A refined loafer with a comfortable sole."],
  [15,"Leather Ankle Boots","shoes","shoes-3",225,275,"Modern ankle boots in polished leather."],
  [16,"Minimal Strappy Sandals","shoes","shoes-4",125,155,"An understated sandal with a delicate strap."],
] as const;

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export const fashionCategories = FASHION_CATEGORIES.map((name, index) => ({id:index+1,name,slug:slug(name),parentId:null}));
export const fashionProducts = rows.map(([id,name,category,imageKey,basePrice,compareAtPrice,description]) => ({
  id, name, slug:slug(name), description, basePrice, compareAtPrice, status:"ACTIVE", imageKey,
  rating:4.7, reviewsCount:0, badge:id <= 4 ? "New" : null,
  categoryId:fashionCategories.find(c=>c.slug===category)?.id ?? 1,
  categoryName:fashionCategories.find(c=>c.slug===category)?.name ?? "Clothing",
  createdAt:new Date(2026,8,30-id).toISOString(),
  variants:["Black","Stone"].flatMap((color, ci)=>["S","M","L"].map((size,si)=>({id:id*100+ci*10+si+1,sku:`NL-${id}-${ci}-${si}`,color,size,price:basePrice,stock:12}))),
}));
