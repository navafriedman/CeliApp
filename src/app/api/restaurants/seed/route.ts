import { getPrisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GF-friendly restaurants in and around 11216 (Bed-Stuy/Crown Heights/Bushwick Brooklyn)
// Verified as open January 2025
const restaurantData = [
  {
    name: "Bunna Cafe",
    address: "1084 Flushing Ave, Brooklyn, NY 11237",
    phone: "(347) 295-2227",
    website: "https://www.bunnaethiopia.net",
    cuisineType: "Ethiopian",
    glutenFreeMenu: true,
    safetyRating: 5,
    notes: "100% vegan Ethiopian restaurant using 100% teff injera (naturally GF). One of the safest options for celiac! Open since 2014, still going strong. Weekend brunch includes complimentary coffee service.",
    dishes: [
      { name: "Messob Platter", description: "Assorted dishes on 100% teff injera", isSafe: true, rating: 5 },
      { name: "Misir Wot", description: "Spiced red lentils, naturally GF", isSafe: true, rating: 5 },
      { name: "Gomen", description: "Collard greens, naturally GF", isSafe: true, rating: 5 },
      { name: "Shiro", description: "Chickpea stew, naturally GF", isSafe: true, rating: 4 },
    ]
  },
  {
    name: "Toad Style",
    address: "93 Ralph Ave, Brooklyn, NY 11221",
    phone: "(347) 789-1589",
    website: "https://www.toadstylebk.com",
    cuisineType: "Vegan",
    glutenFreeMenu: true,
    safetyRating: 5,
    notes: "Scratch-made vegan food since 2015. ENTIRE MENU is soy-free, palm oil-free, and non-GMO. Everything GF except bread (can be omitted). All cheeses, ketchup, mustard, pickles made in-house. Sister cafe Familiars across the street.",
    dishes: [
      { name: "Cauliflower Basket", description: "Deep fried cauliflower, GF", isSafe: true, rating: 5 },
      { name: "Veggie Burger (no bun)", description: "House-made patty, ask for lettuce wrap", isSafe: true, rating: 5 },
      { name: "Pizza Fries", description: "GF fries with house toppings", isSafe: true, rating: 4 },
      { name: "Banh Mi (no bread)", description: "Get as a bowl instead", isSafe: true, rating: 4 },
    ]
  },
  {
    name: "Claro",
    address: "284 Third Ave, Brooklyn, NY 11215",
    phone: "(347) 721-3126",
    website: "https://www.clarobk.com",
    cuisineType: "Mexican/Oaxacan",
    glutenFreeMenu: true,
    safetyRating: 5,
    notes: "MICHELIN-STARRED and 100% gluten-free! Chef/owner T.J. Steele has celiac, so the entire restaurant is safe. House-made tortillas from stone-ground Oaxacan corn. Amazing mezcal selection. One of the best GF dining experiences in NYC.",
    dishes: [
      { name: "Tasting Menu", description: "Multi-course, entirely GF", isSafe: true, rating: 5 },
      { name: "House Tortillas", description: "Stone-ground Oaxacan criollo corn", isSafe: true, rating: 5 },
      { name: "Mole", description: "Traditional Oaxacan preparation", isSafe: true, rating: 5 },
      { name: "Any Menu Item", description: "Entire menu is GF - order freely!", isSafe: true, rating: 5 },
    ]
  },
  {
    name: "Superiority Burger",
    address: "119 Avenue A, New York, NY 10009",
    phone: "(212) 339-7425",
    website: "https://www.superiorityburger.com",
    cuisineType: "Vegetarian",
    glutenFreeMenu: false,
    safetyRating: 3,
    notes: "Famous veggie burgers - the burger itself has gluten, but many sides are GF. Very popular, expect a wait. Check Instagram for daily specials. Reservations available via Resy.",
    dishes: [
      { name: "Burnt Broccoli Salad", description: "Usually GF, confirm ingredients", isSafe: true, rating: 5 },
      { name: "Slaw", description: "Naturally GF side", isSafe: true, rating: 4 },
      { name: "Gelato", description: "Check daily flavors for GF options", isSafe: true, rating: 4 },
    ]
  },
  {
    name: "Nami Nori",
    address: "236 North 12th St, Brooklyn, NY 11211",
    phone: "(646) 692-4774",
    website: "https://www.naminori.nyc",
    cuisineType: "Japanese/Sushi",
    glutenFreeMenu: true,
    safetyRating: 4,
    notes: "Temaki (hand roll) focused sushi spot. Most items are naturally GF. Uses GF soy sauce. Furikake fries and spicy tuna dip are popular. Let them know about celiac for extra care.",
    dishes: [
      { name: "Temaki Rolls", description: "Hand rolls with nori - naturally GF", isSafe: true, rating: 5 },
      { name: "Spicy Tuna Dip", description: "Confirm no gluten additives", isSafe: true, rating: 4 },
      { name: "Sashimi", description: "Plain fish, naturally GF", isSafe: true, rating: 5 },
    ]
  },
  {
    name: "7 Grain Army",
    address: "128 Roebling St, Brooklyn, NY 11211",
    phone: "(718) 218-7790",
    website: "https://www.7grainarmy.com",
    cuisineType: "Bakery/Cafe",
    glutenFreeMenu: true,
    safetyRating: 5,
    notes: "DEDICATED GF BAKERY! All muffins, coffee cakes, and sandwiches made with ancient grains like fonio and quinoa. Closes by 3pm, come early for fresh baked goods. A holy grail for GF baked goods.",
    dishes: [
      { name: "Muffins", description: "Made with fonio/quinoa flour", isSafe: true, rating: 5 },
      { name: "Coffee Cake", description: "GF and delicious", isSafe: true, rating: 5 },
      { name: "Sandwiches", description: "On house-made GF bread", isSafe: true, rating: 5 },
    ]
  },
  {
    name: "Laser Wolf",
    address: "97 Wythe Ave, Brooklyn, NY 11249",
    phone: "(718) 276-8383",
    website: "https://www.laserwolfbk.com",
    cuisineType: "Israeli",
    glutenFreeMenu: false,
    safetyRating: 4,
    notes: "Rooftop Israeli grill at the Hoxton Hotel. Almost everything on menu is GF EXCEPT the pita. Unlimited mezze (salatim) with each meat order. Great for groups. Specify celiac when ordering.",
    dishes: [
      { name: "Grilled Meats", description: "All charcoal-grilled meats are GF", isSafe: true, rating: 5 },
      { name: "Salatim/Mezze", description: "Unlimited small plates - most GF", isSafe: true, rating: 4 },
      { name: "Hummus", description: "Naturally GF", isSafe: true, rating: 5 },
      { name: "Pita", description: "Contains gluten - AVOID", isSafe: false, rating: 0 },
    ]
  },
  {
    name: "The Butcher's Daughter",
    address: "271 Metropolitan Ave, Brooklyn, NY 11211",
    phone: "(212) 219-3434",
    website: "https://www.thebutchersdaughter.com",
    cuisineType: "Vegetarian/Cafe",
    glutenFreeMenu: true,
    safetyRating: 4,
    notes: "Plant-forward cafe near Bedford Ave and Domino Park. Many GF options clearly marked. Great for brunch. They understand celiac - just let server know.",
    dishes: [
      { name: "Acai Bowl", description: "Naturally GF", isSafe: true, rating: 5 },
      { name: "Kale Salad", description: "Naturally GF", isSafe: true, rating: 4 },
      { name: "GF Toast Options", description: "Ask for GF bread", isSafe: true, rating: 4 },
      { name: "Fresh Juices", description: "All naturally GF", isSafe: true, rating: 5 },
    ]
  },
  {
    name: "Ops",
    address: "346 Himrod St, Brooklyn, NY 11237",
    phone: "(718) 386-6792",
    website: "https://www.opsbushwick.com",
    cuisineType: "Italian/Pizza",
    glutenFreeMenu: false,
    safetyRating: 3,
    notes: "Natural wine bar with wood-fired pizza. They offer GF pizza crust. Small intimate space in Bushwick. Call ahead to confirm GF crust availability.",
    dishes: [
      { name: "GF Pizza", description: "GF crust option available", isSafe: true, rating: 4 },
      { name: "Salads", description: "Naturally GF", isSafe: true, rating: 4 },
      { name: "Vegetables", description: "Wood-fired veggies, naturally GF", isSafe: true, rating: 4 },
    ]
  },
  {
    name: "Diner",
    address: "85 Broadway, Brooklyn, NY 11249",
    phone: "(718) 486-3077",
    website: "https://www.dinernyc.com",
    cuisineType: "American",
    glutenFreeMenu: false,
    safetyRating: 3,
    notes: "Williamsburg institution since 1999. Menu changes daily based on local ingredients. Many dishes can be made GF - discuss with server. Under the Williamsburg Bridge.",
    dishes: [
      { name: "Grilled Fish", description: "Ask for GF preparation", isSafe: true, rating: 4 },
      { name: "Roasted Vegetables", description: "Naturally GF", isSafe: true, rating: 4 },
      { name: "Steak", description: "Plain preparation is GF", isSafe: true, rating: 4 },
    ]
  },
  {
    name: "Pura Vida",
    address: "174 N 4th St, Brooklyn, NY 11211",
    phone: "(347) 294-7374",
    website: "https://www.paboreal.co/pura-vida",
    cuisineType: "Health Food/Cafe",
    glutenFreeMenu: true,
    safetyRating: 4,
    notes: "Miami-based health cafe with Williamsburg location. Many GF options. Staff trained to ask about allergies when ordering. Great smoothie bowls and salads.",
    dishes: [
      { name: "Smoothie Bowls", description: "Most are naturally GF", isSafe: true, rating: 5 },
      { name: "Salads", description: "Check dressings for GF", isSafe: true, rating: 4 },
      { name: "Fresh Juices", description: "All naturally GF", isSafe: true, rating: 5 },
    ]
  },
  {
    name: "Uzuki",
    address: "69 Vanderbilt Ave, Brooklyn, NY 11205",
    phone: "(718) 858-8880",
    website: "https://www.uzukibk.com",
    cuisineType: "Japanese/Soba",
    glutenFreeMenu: true,
    safetyRating: 5,
    notes: "100% DEDICATED GF facility! Traditional Japanese soba made with buckwheat (naturally GF). One of the safest restaurants for celiac in Brooklyn. A must-visit!",
    dishes: [
      { name: "Soba Noodles", description: "100% buckwheat, GF facility", isSafe: true, rating: 5 },
      { name: "Tempura", description: "GF batter in dedicated facility", isSafe: true, rating: 5 },
      { name: "Any Menu Item", description: "Entire facility is GF", isSafe: true, rating: 5 },
    ]
  },
];

export async function POST() {
  try {
    const prisma = await getPrisma();
    // Check if restaurants already exist
    const count = await prisma.restaurant.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Restaurants already seeded', count });
    }

    // Insert all restaurants with their dishes
    for (const restaurant of restaurantData) {
      const { dishes, ...restaurantInfo } = restaurant;
      await prisma.restaurant.create({
        data: {
          ...restaurantInfo,
          dishes: {
            create: dishes,
          },
        },
      });
    }

    return NextResponse.json({ message: 'Seeded successfully', count: restaurantData.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
