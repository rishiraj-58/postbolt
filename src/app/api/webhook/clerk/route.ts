import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    // Get the headers
    const headersList = await headers();
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error: Missing svix headers', { status: 400 });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response('Error: Missing webhook secret', { status: 500 });
    }

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new Response('Error verifying webhook', { status: 400 });
    }

    // Handle the webhook event
    const eventType = evt.type;

    if (eventType === 'user.created') {
      const { id, email_addresses } = evt.data;
      const email = email_addresses[0]?.email_address;

      if (!email) {
        return new Response('Error: No email found', { status: 400 });
      }

      try {
        // Create a new user in the database
        await prisma.user.create({
          data: {
            authId: id,
            email: email,
            // Create a usage limit record for the user
            usageLimit: {
              create: {
                maxPosts: 10,
                postsGenerated: 0,
                isPremium: false,
              },
            },
          },
        });

        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error('Error creating user:', error);
        return new Response(`Error creating user: ${error.message || 'Unknown error'}`, { status: 500 });
      }
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses } = evt.data;
      const email = email_addresses[0]?.email_address;

      if (!email) {
        return new Response('Error: No email found', { status: 400 });
      }

      try {
        // Update the user in the database
        await prisma.user.update({
          where: { authId: id },
          data: { email: email },
        });

        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error('Error updating user:', error);
        return new Response(`Error updating user: ${error.message || 'Unknown error'}`, { status: 500 });
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;

      try {
        // Delete the user from the database (cascade will delete their posts and usage limit)
        await prisma.user.delete({
          where: { authId: id },
        });

        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error('Error deleting user:', error);
        return new Response(`Error deleting user: ${error.message || 'Unknown error'}`, { status: 500 });
      }
    }

    // Return a 200 response for events we don't handle
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return new Response(`Internal server error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
} 