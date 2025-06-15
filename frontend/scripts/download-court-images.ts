import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Map court names to their location IDs
const courtMappings: { [key: string]: string } = {
  'Goldman Tennis Center': 'goldman-tennis-center',
  'Stern Grove': 'stern-grove',
  'Buena Vista': 'buena-vista-park',
  'Jackson': 'jackson-playground',
  'Moscone': 'moscone-recreation-center',
  'Parkside Square': 'parkside-square',
  'Presidio Wall': 'presidio-wall-playground',
  'Richmond': 'richmond-recreation-center',
  'Rossi': 'rossi-playground',
  'Upper Noe': 'upper-noe-recreation-center'
};

async function downloadAndResizeImage(url: string, filepath: string): Promise<void> {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    // Resize image to 800x600 while maintaining aspect ratio
    await sharp(response.data)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(filepath);

    console.log(`Successfully processed image: ${filepath}`);
  } catch (error) {
    console.error(`Error processing image from ${url}:`, error);
    throw error;
  }
}

async function scrapeAndDownloadImages() {
  // Create the target directory if it doesn't exist
  const targetDir = path.join(process.cwd(), 'public', 'images', 'courts');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const [courtName, slug] of Object.entries(courtMappings)) {
    try {
      console.log(`Processing ${courtName}...`);
      
      const url = `https://sfrecpark.org/locations/${slug}`;
      
      try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Try different image selectors
        const selectors = [
          '.location-image img',
          '.location-details img',
          '.main-image img',
          'img[alt*="location"]',
          'img[alt*="court"]',
          'img[alt*="tennis"]',
          'img[alt*="facility"]'
        ];

        let imageUrl = null;
        for (const selector of selectors) {
          const img = $(selector).first();
          if (img.length) {
            imageUrl = img.attr('src');
            if (imageUrl) {
              // Handle relative URLs
              if (imageUrl.startsWith('/')) {
                imageUrl = `https://sfrecpark.org${imageUrl}`;
              }
              break;
            }
          }
        }

        if (imageUrl) {
          const filename = `${slug}.jpg`;
          const filepath = path.join(targetDir, filename);
          await downloadAndResizeImage(imageUrl, filepath);
          console.log(`Downloaded and resized image for ${courtName}`);
        } else {
          console.log(`No image found for ${courtName}`);
        }
      } catch (error: any) {
        console.log(`Failed to fetch ${url}:`, error.message);
      }
    } catch (error) {
      console.error(`Error processing ${courtName}:`, error);
    }
  }

  console.log('Finished downloading court images!');
}

scrapeAndDownloadImages().catch(console.error); 