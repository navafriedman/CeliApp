import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// Gluten-free vegetarian/vegan recipes
const recipeData = [
  {
    title: "Quinoa Buddha Bowl",
    description: "Nourishing bowl packed with protein and veggies",
    category: "lunch",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    ingredients: `1 cup quinoa, rinsed
2 cups water or vegetable broth
1 can chickpeas, drained and rinsed
1 tbsp olive oil
1 tsp cumin
1 tsp smoked paprika
2 cups mixed greens
1 avocado, sliced
1 cup cherry tomatoes, halved
1/4 cup tahini
2 tbsp lemon juice
Salt and pepper to taste`,
    instructions: `1. Cook quinoa in water or broth according to package directions. Let cool slightly.

2. Toss chickpeas with olive oil, cumin, paprika, salt and pepper. Roast at 400°F for 20-25 minutes until crispy.

3. Make tahini dressing: whisk tahini with lemon juice and 2-3 tbsp water until smooth.

4. Assemble bowls: divide quinoa between bowls, top with greens, roasted chickpeas, avocado, and tomatoes.

5. Drizzle with tahini dressing and serve.`,
    notes: "All ingredients naturally GF. Great for meal prep - keeps 3-4 days in fridge (store dressing separately).",
    source: "CeliApp Kitchen",
  },
  {
    title: "Creamy Tomato Basil Soup",
    description: "Comforting classic made dairy-free and GF",
    category: "dinner",
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    ingredients: `2 tbsp olive oil
1 medium onion, diced
4 cloves garlic, minced
2 cans (28 oz each) crushed tomatoes
1 cup vegetable broth (check GF)
1 can full-fat coconut milk
1/2 cup fresh basil leaves
1 tsp dried oregano
Salt and pepper to taste
Red pepper flakes (optional)`,
    instructions: `1. Heat olive oil in a large pot over medium heat. Add onion and cook until soft, about 5 minutes.

2. Add garlic and cook for 1 minute until fragrant.

3. Add crushed tomatoes, vegetable broth, oregano, salt, and pepper. Bring to a simmer and cook for 20 minutes.

4. Add coconut milk and fresh basil. Use an immersion blender to puree until smooth (or transfer to a blender in batches).

5. Taste and adjust seasonings. Serve hot with GF bread if desired.`,
    notes: "Make sure your vegetable broth is certified GF. This freezes beautifully for up to 3 months.",
    source: "CeliApp Kitchen",
  },
  {
    title: "Thai Peanut Noodles",
    description: "Quick and flavorful rice noodle stir-fry",
    category: "dinner",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    ingredients: `8 oz rice noodles (pad thai style)
1/4 cup peanut butter (or almond butter)
3 tbsp tamari or coconut aminos
2 tbsp rice vinegar
1 tbsp maple syrup
1 tbsp sesame oil
1 tsp fresh ginger, grated
2 cloves garlic, minced
1 red bell pepper, sliced thin
2 cups shredded cabbage
3 green onions, sliced
1/4 cup crushed peanuts
Fresh cilantro for garnish
Lime wedges`,
    instructions: `1. Cook rice noodles according to package directions. Drain and rinse with cold water.

2. Make sauce: whisk together peanut butter, tamari, rice vinegar, maple syrup, sesame oil, ginger, and garlic.

3. Heat a large pan or wok over high heat. Add a bit of oil and stir-fry bell pepper and cabbage for 2-3 minutes.

4. Add noodles and sauce to the pan. Toss everything together until heated through and well coated.

5. Serve topped with green onions, crushed peanuts, cilantro, and lime wedges.`,
    notes: "Use tamari (check it's GF) instead of soy sauce. Coconut aminos is always GF and soy-free.",
    source: "CeliApp Kitchen",
  },
  {
    title: "Stuffed Bell Peppers",
    description: "Colorful peppers filled with seasoned rice and beans",
    category: "dinner",
    prepTime: 20,
    cookTime: 45,
    servings: 4,
    ingredients: `4 large bell peppers (any color)
1 cup white or brown rice
1 can black beans, drained and rinsed
1 can diced tomatoes
1 cup corn kernels (fresh or frozen)
1 tsp cumin
1 tsp chili powder
1/2 tsp garlic powder
Salt and pepper to taste
1 cup salsa
Fresh cilantro for topping
Avocado slices (optional)`,
    instructions: `1. Preheat oven to 375°F. Cook rice according to package directions.

2. Cut tops off peppers and remove seeds. Place in a baking dish.

3. In a large bowl, mix cooked rice, black beans, diced tomatoes, corn, cumin, chili powder, garlic powder, salt, and pepper.

4. Stuff each pepper with the rice mixture. Spoon salsa over each pepper.

5. Cover with foil and bake for 35-40 minutes. Remove foil and bake 5 more minutes.

6. Top with fresh cilantro and avocado slices before serving.`,
    notes: "Naturally GF Mexican-inspired dish. Check that your salsa doesn't contain any gluten additives.",
    source: "CeliApp Kitchen",
  },
  {
    title: "Overnight Oats (GF)",
    description: "Easy make-ahead breakfast with certified GF oats",
    category: "breakfast",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: `1/2 cup certified GF rolled oats
1/2 cup non-dairy milk
1/4 cup coconut yogurt
1 tbsp maple syrup or honey
1 tbsp chia seeds
1/2 tsp vanilla extract
Pinch of salt
Toppings: fresh berries, banana, nuts, nut butter`,
    instructions: `1. In a jar or container, combine oats, non-dairy milk, coconut yogurt, maple syrup, chia seeds, vanilla, and salt.

2. Stir well, cover, and refrigerate overnight (or at least 4 hours).

3. In the morning, stir and add more milk if desired for consistency.

4. Top with fresh fruit, nuts, or a drizzle of nut butter.

5. Can be eaten cold or heated in the microwave for 1-2 minutes.`,
    notes: "IMPORTANT: Only use certified GF oats - regular oats are cross-contaminated with wheat. Bob's Red Mill and Purely Elizabeth are safe brands.",
    source: "CeliApp Kitchen",
  },
  {
    title: "Chickpea Curry",
    description: "Rich and creamy Indian-inspired curry",
    category: "dinner",
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    ingredients: `2 tbsp coconut oil
1 large onion, diced
4 cloves garlic, minced
1 tbsp fresh ginger, grated
2 tbsp curry powder (check GF)
1 tsp garam masala
1/2 tsp turmeric
2 cans chickpeas, drained
1 can diced tomatoes
1 can full-fat coconut milk
2 cups fresh spinach
Salt to taste
Fresh cilantro for garnish
Cooked rice for serving`,
    instructions: `1. Heat coconut oil in a large pan over medium heat. Add onion and cook until softened, about 5 minutes.

2. Add garlic and ginger, cook for 1 minute. Add curry powder, garam masala, and turmeric. Stir for 30 seconds until fragrant.

3. Add chickpeas, diced tomatoes, and coconut milk. Bring to a simmer and cook for 15-20 minutes until thickened.

4. Stir in spinach and cook until wilted, about 2 minutes.

5. Season with salt to taste. Serve over rice with fresh cilantro.`,
    notes: "Some curry powders contain gluten fillers - check the label or buy from a dedicated spice company. This dish is naturally vegan.",
    source: "CeliApp Kitchen",
  },
  {
    title: "Zucchini Noodles with Pesto",
    description: "Light and fresh low-carb dinner",
    category: "dinner",
    prepTime: 15,
    cookTime: 5,
    servings: 2,
    ingredients: `4 medium zucchini
2 cups fresh basil leaves
1/3 cup pine nuts (or walnuts)
3 cloves garlic
1/2 cup olive oil
Salt and pepper to taste
Cherry tomatoes, halved
Nutritional yeast or vegan parmesan (optional)`,
    instructions: `1. Use a spiralizer or vegetable peeler to create zucchini noodles. Set aside on paper towels to absorb excess moisture.

2. Make pesto: In a food processor, blend basil, pine nuts, and garlic until finely chopped. With motor running, drizzle in olive oil. Season with salt and pepper.

3. Heat a large pan over medium-high heat. Add zucchini noodles and cook for 2-3 minutes until slightly softened but still al dente.

4. Toss with pesto and cherry tomatoes.

5. Serve immediately, topped with nutritional yeast if desired.`,
    notes: "Traditional pesto has parmesan - this version is vegan. Don't overcook the zoodles or they'll get mushy!",
    source: "CeliApp Kitchen",
  },
  {
    title: "Black Bean Tacos",
    description: "Quick weeknight tacos with all the fixings",
    category: "dinner",
    prepTime: 10,
    cookTime: 10,
    servings: 4,
    ingredients: `2 cans black beans, drained and rinsed
1 tbsp olive oil
1 tsp cumin
1 tsp chili powder
1/2 tsp garlic powder
Salt and pepper to taste
8 corn tortillas
Toppings:
- Shredded lettuce
- Diced tomatoes
- Sliced avocado
- Fresh cilantro
- Lime wedges
- Hot sauce
- Dairy-free sour cream`,
    instructions: `1. Heat olive oil in a pan over medium heat. Add black beans, cumin, chili powder, garlic powder, salt, and pepper.

2. Cook for 5-7 minutes, mashing some beans with a fork for texture. Add a splash of water if too dry.

3. Warm corn tortillas in a dry pan or directly over a gas flame for a few seconds each side.

4. Fill tortillas with seasoned black beans.

5. Top with lettuce, tomatoes, avocado, cilantro, and a squeeze of lime.`,
    notes: "Corn tortillas are naturally GF but check the package - some brands add wheat flour. Mission and La Banderita are usually safe.",
    source: "CeliApp Kitchen",
  },
  {
    title: "Roasted Vegetable Frittata",
    description: "Protein-packed egg dish with seasonal veggies",
    category: "breakfast",
    prepTime: 15,
    cookTime: 30,
    servings: 6,
    ingredients: `8 large eggs
1/4 cup non-dairy milk
Salt and pepper to taste
2 tbsp olive oil
1 small zucchini, diced
1 red bell pepper, diced
1/2 onion, diced
2 cups fresh spinach
2 cloves garlic, minced
Fresh herbs (basil, chives, or parsley)`,
    instructions: `1. Preheat oven to 375°F.

2. Whisk eggs with non-dairy milk, salt, and pepper in a bowl. Set aside.

3. Heat olive oil in a 10-inch oven-safe skillet over medium heat. Add zucchini, bell pepper, and onion. Cook for 5-7 minutes until softened.

4. Add spinach and garlic, cook for 1 minute until spinach wilts.

5. Pour egg mixture evenly over vegetables. Cook without stirring for 2 minutes until edges start to set.

6. Transfer to oven and bake for 15-20 minutes until eggs are set and top is lightly golden.

7. Let cool for 5 minutes before slicing. Top with fresh herbs.`,
    notes: "This is vegetarian but not vegan (contains eggs). Great for meal prep - refrigerate slices for quick breakfasts all week.",
    source: "CeliApp Kitchen",
  },
  {
    title: "Mango Coconut Chia Pudding",
    description: "Tropical make-ahead dessert or breakfast",
    category: "dessert",
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    ingredients: `1 can full-fat coconut milk
1/2 cup chia seeds
2 tbsp maple syrup
1 tsp vanilla extract
1 ripe mango, diced
Toasted coconut flakes
Fresh lime zest`,
    instructions: `1. In a bowl or jar, whisk together coconut milk, chia seeds, maple syrup, and vanilla extract.

2. Cover and refrigerate for at least 4 hours or overnight, stirring once or twice in the first hour.

3. The pudding should be thick and creamy. If too thick, add a splash more coconut milk.

4. Divide into serving dishes and top with fresh mango, toasted coconut flakes, and lime zest.

5. Can be stored in the fridge for up to 5 days.`,
    notes: "Naturally GF, vegan, and no refined sugar if you use maple syrup. Perfect for hot summer days!",
    source: "CeliApp Kitchen",
  },
  {
    title: "Mediterranean Grain Bowl",
    description: "Fresh and filling bowl with falafel-spiced chickpeas",
    category: "lunch",
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    ingredients: `1 cup millet or quinoa
1 can chickpeas, drained
2 tbsp olive oil
1 tsp cumin
1 tsp coriander
1/2 tsp garlic powder
Salt and pepper
1 cucumber, diced
1 cup cherry tomatoes, halved
1/4 red onion, thinly sliced
1/4 cup kalamata olives
Hummus for serving
Fresh parsley and mint`,
    instructions: `1. Cook millet or quinoa according to package directions.

2. Toss chickpeas with 1 tbsp olive oil, cumin, coriander, garlic powder, salt, and pepper. Spread on a baking sheet and roast at 400°F for 20-25 minutes until crispy.

3. While chickpeas roast, prep vegetables and make a simple dressing with remaining olive oil, lemon juice, salt, and pepper.

4. Assemble bowls with grains, roasted chickpeas, cucumber, tomatoes, red onion, and olives.

5. Add a generous dollop of hummus and drizzle with dressing. Top with fresh herbs.`,
    notes: "Both millet and quinoa are naturally GF. Check that your hummus is GF (most are, but some add flour as a thickener).",
    source: "CeliApp Kitchen",
  },
  {
    title: "Sweet Potato & Black Bean Chili",
    description: "Hearty one-pot meal perfect for cold days",
    category: "dinner",
    prepTime: 15,
    cookTime: 35,
    servings: 6,
    ingredients: `2 tbsp olive oil
1 large onion, diced
4 cloves garlic, minced
2 medium sweet potatoes, cubed
2 cans black beans, drained
1 can diced tomatoes
2 cups vegetable broth (check GF)
2 tbsp chili powder
1 tsp cumin
1 tsp smoked paprika
1/2 tsp cayenne (optional)
Salt and pepper to taste
Toppings: avocado, cilantro, lime`,
    instructions: `1. Heat olive oil in a large pot over medium heat. Add onion and cook until soft, about 5 minutes.

2. Add garlic and cook for 1 minute. Add sweet potatoes and stir.

3. Add black beans, diced tomatoes, vegetable broth, chili powder, cumin, smoked paprika, cayenne, salt, and pepper.

4. Bring to a boil, then reduce heat and simmer for 25-30 minutes until sweet potatoes are tender.

5. Taste and adjust seasonings. Serve hot with avocado, cilantro, and a squeeze of lime.`,
    notes: "Naturally GF and vegan. Freezes wonderfully - make a double batch for easy future meals!",
    source: "CeliApp Kitchen",
  },
];

export async function POST() {
  // Check if recipes already exist
  const count = await prisma.recipe.count();
  if (count > 0) {
    return NextResponse.json({ message: 'Recipes already seeded', count });
  }

  // Insert all recipes
  await prisma.recipe.createMany({
    data: recipeData,
  });

  return NextResponse.json({ message: 'Seeded successfully', count: recipeData.length });
}
