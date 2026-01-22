import { getPrisma } from '@/lib/db';
import { NextResponse } from 'next/server';

const glutenData = [
  // UNSAFE - Grains
  { name: 'Wheat', category: 'grain', status: 'unsafe', description: 'Contains gluten. Includes all forms: durum, semolina, spelt, farro, einkorn, kamut.', tips: 'Check labels for "wheat" in any form.' },
  { name: 'Barley', category: 'grain', status: 'unsafe', description: 'Contains gluten. Used in beer, malt, and many soups.', tips: 'Malt and malt flavoring are usually from barley.' },
  { name: 'Rye', category: 'grain', status: 'unsafe', description: 'Contains gluten. Found in rye bread, some whiskeys.', tips: 'Often mixed with wheat flour in breads.' },
  { name: 'Triticale', category: 'grain', status: 'unsafe', description: 'A wheat-rye hybrid. Contains gluten.', tips: 'Sometimes found in cereals and breads.' },

  // SAFE - Grains
  { name: 'Rice', category: 'grain', status: 'safe', description: 'Naturally gluten-free. All varieties are safe.', tips: 'Watch for cross-contamination in bulk bins or flavored rice mixes.' },
  { name: 'Corn', category: 'grain', status: 'safe', description: 'Naturally gluten-free.', tips: 'Cornmeal, corn flour, and polenta are all safe.' },
  { name: 'Quinoa', category: 'grain', status: 'safe', description: 'Naturally gluten-free seed. High in protein.', tips: 'Look for certified GF to avoid cross-contamination.' },
  { name: 'Oats', category: 'grain', status: 'check', description: 'Naturally GF but often contaminated.', tips: 'Only eat oats labeled "certified gluten-free". Some celiacs react even to pure oats.' },
  { name: 'Buckwheat', category: 'grain', status: 'safe', description: 'Despite the name, not related to wheat. GF.', tips: 'Check that it was processed in a GF facility.' },
  { name: 'Millet', category: 'grain', status: 'safe', description: 'Naturally gluten-free grain.', tips: 'Good for baking and porridge.' },
  { name: 'Sorghum', category: 'grain', status: 'safe', description: 'Naturally gluten-free grain.', tips: 'Common in GF flour blends.' },
  { name: 'Teff', category: 'grain', status: 'safe', description: 'Naturally gluten-free ancient grain.', tips: 'Used to make injera bread.' },
  { name: 'Amaranth', category: 'grain', status: 'safe', description: 'Naturally gluten-free seed.', tips: 'High in protein and fiber.' },

  // UNSAFE - Hidden sources
  { name: 'Soy Sauce', category: 'sauce', status: 'unsafe', description: 'Traditional soy sauce contains wheat.', tips: 'Use tamari (check label) or coconut aminos instead.' },
  { name: 'Malt Vinegar', category: 'condiment', status: 'unsafe', description: 'Made from barley.', tips: 'Use apple cider, white, or balsamic vinegar instead.' },
  { name: 'Beer', category: 'beverage', status: 'unsafe', description: 'Made from barley or wheat.', tips: 'Look for gluten-free beer made from sorghum, rice, or GF grains.' },
  { name: 'Flour Tortillas', category: 'bread', status: 'unsafe', description: 'Made with wheat flour.', tips: 'Use corn tortillas or GF flour tortillas.' },

  // CHECK - Could be either
  { name: 'Modified Food Starch', category: 'additive', status: 'check', description: 'In the US, usually corn-based and safe. In other countries, may be wheat.', tips: 'US products typically safe; check with manufacturer if unsure.' },
  { name: 'Caramel Color', category: 'additive', status: 'safe', description: 'Almost always made from corn in the US.', tips: 'Generally safe; very rarely from barley.' },
  { name: 'Natural Flavors', category: 'additive', status: 'check', description: 'Could contain gluten but rarely does.', tips: 'Contact manufacturer if concerned. Usually safe.' },
  { name: 'Maltodextrin', category: 'additive', status: 'safe', description: 'Despite "malt" in name, usually from corn or potato.', tips: 'In US, typically gluten-free.' },
  { name: 'Dextrin', category: 'additive', status: 'check', description: 'Can be made from wheat.', tips: 'Check label or contact manufacturer.' },

  // SAFE - Common foods
  { name: 'Potatoes', category: 'vegetable', status: 'safe', description: 'All varieties naturally GF.', tips: 'Watch for cross-contamination in fries (shared fryers) or mashed potatoes (added flour).' },
  { name: 'Meat', category: 'protein', status: 'safe', description: 'Plain meat, poultry, fish are GF.', tips: 'Watch for marinades, breading, and processed meats.' },
  { name: 'Eggs', category: 'protein', status: 'safe', description: 'Naturally gluten-free.', tips: 'Restaurant scrambled eggs may have pancake batter added.' },
  { name: 'Dairy', category: 'dairy', status: 'safe', description: 'Plain milk, cheese, yogurt are GF.', tips: 'Check flavored products and processed cheese.' },
  { name: 'Fruits', category: 'produce', status: 'safe', description: 'All fresh fruits are naturally GF.', tips: 'Dried fruits may have flour added to prevent sticking.' },
  { name: 'Vegetables', category: 'produce', status: 'safe', description: 'All fresh vegetables are naturally GF.', tips: 'Watch for sauces and seasonings at restaurants.' },

  // Flours
  { name: 'Almond Flour', category: 'flour', status: 'safe', description: 'Made from ground almonds. Naturally GF.', tips: 'Great for baking. Check for cross-contamination.' },
  { name: 'Coconut Flour', category: 'flour', status: 'safe', description: 'Made from dried coconut. Naturally GF.', tips: 'Absorbs lots of liquid; needs recipe adjustments.' },
  { name: 'Rice Flour', category: 'flour', status: 'safe', description: 'Made from ground rice. Naturally GF.', tips: 'Common base for GF flour blends.' },
  { name: 'Tapioca Flour', category: 'flour', status: 'safe', description: 'Made from cassava root. Naturally GF.', tips: 'Also called tapioca starch. Good for binding.' },

  // Processed foods to watch
  { name: 'Salad Dressings', category: 'condiment', status: 'check', description: 'May contain wheat-based thickeners or malt vinegar.', tips: 'Read labels carefully. Oil and vinegar is usually safe.' },
  { name: 'Soup', category: 'prepared food', status: 'check', description: 'Often thickened with flour or contains barley.', tips: 'Read labels. Many canned soups contain wheat.' },
  { name: 'Candy', category: 'sweets', status: 'check', description: 'Many are safe but some contain wheat or malt.', tips: 'Check labels. Licorice usually contains wheat.' },
  { name: 'Ice Cream', category: 'dairy', status: 'check', description: 'Plain flavors usually safe.', tips: 'Watch for cookie, cake, or brownie flavors. Check for malt.' },
  { name: 'Chips', category: 'snack', status: 'check', description: 'Plain potato chips usually safe.', tips: 'Flavored chips may contain wheat. Check for malt flavoring.' },
];

export async function POST() {
  try {
    const prisma = await getPrisma();
    // Check if data already exists
    const count = await prisma.glutenInfo.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Data already seeded', count });
    }

    // Insert all data
    await prisma.glutenInfo.createMany({
      data: glutenData,
    });

    return NextResponse.json({ message: 'Seeded successfully', count: glutenData.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
