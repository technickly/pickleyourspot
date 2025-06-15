import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

type CourtMapping = {
  [key: string]: string;
};

const courtMappings: CourtMapping = {
  'Goldman Tennis Center': 'goldman-tennis-center',
  'Stern Grove': 'stern-grove',
  'Buena Vista': 'buena-vista',
  'Jackson': 'jackson-playground',
  'Moscone': 'moscone-recreation-center',
  'Parkside Square': 'parkside-square',
  'Presidio Wall': 'presidio-wall-playground',
  'Richmond': 'richmond-recreation-center',
  'Rossi': 'rossi-playground',
  'Upper Noe': 'upper-noe-playground'
};

async function scrapeCourtImage(courtName: string): Promise<string | null> {
  try {
    const urlSlug = courtMappings[courtName];
    if (!urlSlug) {
      console.log(`No mapping found for court: ${courtName}`);
      return null;
    }

    const url = `https://www.rec.us/sfrecpark/${urlSlug}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Look for the main court image
    const imageUrl = $('.facility-image img').first().attr('src');
    
    if (imageUrl) {
      return imageUrl.startsWith('http') ? imageUrl : `https://www.rec.us${imageUrl}`;
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping image for ${courtName}:`, error);
    return null;
  }
}

async function updateCourtImages() {
  console.log('Starting court image updates...');

  for (const [courtName, urlSlug] of Object.entries(courtMappings)) {
    try {
      const court = await prisma.court.findFirst({
        where: { name: courtName }
      });

      if (!court) {
        console.log(`Court not found: ${courtName}`);
        continue;
      }

      const newImageUrl = await scrapeCourtImage(courtName);
      
      if (newImageUrl) {
        await prisma.court.update({
          where: { id: court.id },
          data: { imageUrl: newImageUrl }
        });
        console.log(`Updated image for ${courtName}`);
      } else {
        console.log(`No new image found for ${courtName}`);
      }
    } catch (error) {
      console.error(`Error updating ${courtName}:`, error);
    }
  }

  console.log('Finished updating court images');
}

updateCourtImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 