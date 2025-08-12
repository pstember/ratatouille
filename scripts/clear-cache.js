#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCache() {
  console.log('🧹 Clearing cache...');
  
  try {
    // Clear all cache entries
    const deletedCache = await prisma.cache.deleteMany({});
    
    console.log(`✅ Cleared ${deletedCache.count} cache entries`);
    
    // Verify cache is empty
    const remainingCache = await prisma.cache.count();
    console.log(`📊 Remaining cache entries: ${remainingCache}`);
    
    if (remainingCache === 0) {
      console.log('🎉 Cache cleared successfully!');
    } else {
      console.log('⚠️  Some cache entries remain');
    }
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cache clear
clearCache()
  .then(() => {
    console.log('🎉 Cache clear completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cache clear failed:', error);
    process.exit(1);
  });
