import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface FieldData {
  id: string;
  nationalPhoneNumber?: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  regularOpeningHours?: {
    periods?: Array<{
      open: {
        day: number;
        hour: number;
        minute: number;
      };
      close?: {
        day: number;
        hour: number;
        minute: number;
      };
    }>;
  };
  displayName: {
    text: string;
  };
}

function parseOpeningHours(regularOpeningHours?: any): {
  openingTime: string;
  closingTime: string;
} {
  // Default hours if no opening hours provided
  const defaultOpeningTime = '09:00:00';
  const defaultClosingTime = '22:00:00';

  if (
    !regularOpeningHours?.periods ||
    regularOpeningHours.periods.length === 0
  ) {
    return {
      openingTime: defaultOpeningTime,
      closingTime: defaultClosingTime,
    };
  }

  // Find the most common opening and closing times
  const openingTimes: string[] = [];
  const closingTimes: string[] = [];

  regularOpeningHours.periods.forEach((period: any) => {
    if (period.open) {
      const hour = period.open.hour || 9;
      const minute = period.open.minute || 0;
      openingTimes.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`,
      );
    }
    if (period.close) {
      const hour = period.close.hour || 22;
      const minute = period.close.minute || 0;
      closingTimes.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`,
      );
    }
  });

  // Use the first available time or default
  const openingTime =
    openingTimes.length > 0 ? openingTimes[0] : defaultOpeningTime;
  const closingTime =
    closingTimes.length > 0 ? closingTimes[0] : defaultClosingTime;

  return { openingTime, closingTime };
}

function generateAmenities(fieldData: FieldData): any {
  const amenities = {
    hasParking: true,
    hasShowers: true,
    hasLighting: true,
    hasCanteen: Math.random() > 0.5,
    hasLockers: Math.random() > 0.7,
    hasFirstAid: Math.random() > 0.8,
    surface: 'synthetic', // Most modern fields have synthetic surface
    fieldSize: '5v5', // Assuming futbol 5 based on the data
  };

  // Add rating-based amenities (higher rated fields likely have more amenities)
  if (fieldData.rating && fieldData.rating >= 4.5) {
    amenities.hasCanteen = true;
    amenities.hasLockers = true;
  }

  return amenities;
}

function generateBasePrice(rating?: number): number {
  // Base price calculation based on rating
  const basePrice = 5000; // Base price in ARS per hour
  const ratingMultiplier = rating ? (rating / 5) * 1.5 + 0.5 : 1;
  return Math.round(basePrice * ratingMultiplier);
}

async function main() {
  console.log('Starting seed...');

  // Read the JSON file
  const jsonPath = path.join(__dirname, 'federal.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as FieldData[];

  console.log(`Found ${jsonData.length} fields to seed`);

  // // Delete existing fields
  // await prisma.field.deleteMany();
  // console.log('Deleted existing fields');

  // Process each field
  for (const fieldData of jsonData) {
    try {
      const { openingTime, closingTime } = parseOpeningHours(
        fieldData.regularOpeningHours,
      );
      const amenities = generateAmenities(fieldData);
      const basePricePerHour = generateBasePrice(fieldData.rating);

      // Clean phone number
      const phone = fieldData.nationalPhoneNumber?.replace(/\s/g, '') || null;

      // Create field using raw SQL to handle PostGIS geography type
      await prisma.$executeRaw`
        INSERT INTO fields (
          name,
          address,
          location,
          phone,
          opening_time,
          closing_time,
          base_price_per_hour,
          amenities,
          created_at,
          updated_at,
          latitude,
          longitude
        ) VALUES (
          ${fieldData.displayName.text},
          ${fieldData.formattedAddress},
          ST_SetSRID(ST_MakePoint(${fieldData.location.longitude}, ${fieldData.location.latitude}), 4326)::geography,
          ${phone},
          ${openingTime}::time,
          ${closingTime}::time,
          ${basePricePerHour},
          ${JSON.stringify(amenities)}::jsonb,
          timezone('utc'::text, now()),
          timezone('utc'::text, now()),
          ${fieldData.location.latitude},
          ${fieldData.location.longitude}
        )
      `;

      console.log(`✓ Created field: ${fieldData.displayName.text}`);
    } catch (error) {
      console.error(
        `✗ Error creating field ${fieldData.displayName.text}:`,
        error,
      );
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
