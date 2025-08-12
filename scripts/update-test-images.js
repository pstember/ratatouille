#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of old image filenames to new SVG paths
const imageUpdates = {
  'chicken-pasta.jpg': '/images/chicken-pasta.svg',
  'beef-stir-fry.jpg': '/images/beef-stir-fry.svg',
  'salad.jpg': '/images/salad.svg',
  'margherita-pizza.jpg': '/images/margherita-pizza.svg',
  'chicken-salad.jpg': '/images/chicken-salad.svg',
  'chocolate-cookies.jpg': '/images/chocolate-cookies.svg'
};

async function updateTestImages() {
  console.log('🔄 Updating test images in database...');
  
  try {
    // Get all recipes with test images
    const recipes = await prisma.recipe.findMany({
      where: {
        image: {
          in: Object.keys(imageUpdates)
        }
      }
    });
    
    console.log(`📊 Found ${recipes.length} recipes to update`);
    
    // Update each recipe
    for (const recipe of recipes) {
      const newImagePath = imageUpdates[recipe.image];
      if (newImagePath) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { image: newImagePath }
        });
        console.log(`✅ Updated recipe "${recipe.title}": ${recipe.image} -> ${newImagePath}`);
      }
    }
    
    console.log('🎉 All test images updated successfully!');
    
    // Verify the updates
    const updatedRecipes = await prisma.recipe.findMany({
      where: {
        image: {
          startsWith: '/images/'
        }
      }
    });
    
    console.log(`📊 Verification: ${updatedRecipes.length} recipes now have correct image paths`);
    
  } catch (error) {
    console.error('❌ Error updating test images:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateTestImages()
  .then(() => {
    console.log('🎉 Database update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database update failed:', error);
    process.exit(1);
  });
