import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { getAdminClient } from '@/lib/supabase/server'
import { upsertProfile, deleteProfile } from '@/lib/supabase/queries/profiles'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  // Get the admin client (bypasses RLS for webhook operations)
  const supabase = getAdminClient()

  // Handle the webhook event
  const eventType = evt.type

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        const { id, email_addresses, username, first_name, last_name, image_url } = evt.data
        
        const primaryEmail = email_addresses?.find(
          (email) => email.id === evt.data.primary_email_address_id
        )?.email_address

        if (!primaryEmail) {
          console.error('No primary email found for user:', id)
          return new Response('No primary email', { status: 400 })
        }

        const { error } = await upsertProfile(supabase, {
          id,
          email: primaryEmail,
          username: username ?? null,
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          image_url: image_url ?? null,
        })

        if (error) {
          console.error('Error upserting profile:', error)
          return new Response('Database error', { status: 500 })
        }

        console.log(`Profile ${eventType === 'user.created' ? 'created' : 'updated'} for user:`, id)
        break
      }

      case 'user.deleted': {
        const { id } = evt.data

        if (!id) {
          return new Response('No user ID', { status: 400 })
        }

        const { error } = await deleteProfile(supabase, id)

        if (error) {
          console.error('Error deleting profile:', error)
          return new Response('Database error', { status: 500 })
        }

        console.log('Profile deleted for user:', id)
        break
      }

      default:
        console.log('Unhandled webhook event type:', eventType)
    }

    return new Response('Webhook processed', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Internal error', { status: 500 })
  }
}
