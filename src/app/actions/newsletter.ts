'use server';

import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();
const emailSchema = z.string().email();

export async function subscribeToNewsletter(email: string) {
  const validation = emailSchema.safeParse(email);
  if (!validation.success) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  try {
    // Check if the email already exists
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });
    
    if (existingSubscriber) {
      return { success: false, error: 'This email is already subscribed.' };
    }

    // Add the new subscriber
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        subscribedDate: new Date(),
      }
    });

    return { success: true };
  } catch (error: any) {

    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  } finally {
    await prisma.$disconnect();
  }
}

    