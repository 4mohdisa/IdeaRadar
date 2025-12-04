import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { getAdminClient } from '@/lib/supabase/server'
import { upsertProfile, deleteProfile } from '@/lib/supabase/queries/profiles'

// Generate a unique username from name/email
function generateUsername(
  firstName: string | null,
  lastName: string | null,
  email: string,
  userId: string
): string {
  // Try to create username from first name + last name
  if (firstName && lastName) {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (base.length >= 3) {
      // Add last 4 chars of userId for uniqueness
      return `${base}${userId.slice(-4)}`
    }
  }
  
  // Try first name only
  if (firstName) {
    const base = firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (base.length >= 2) {
      return `${base}${userId.slice(-4)}`
    }
  }
  
  // Fall back to email prefix
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  if (emailPrefix.length >= 2) {
    return `${emailPrefix}${userId.slice(-4)}`
  }
  
  // Last resort: use part of userId
  return `user${userId.slice(-8)}`
}

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

        // For new users or users without username, auto-generate one
        let finalUsername = username ?? null
        
        if (!finalUsername && eventType === 'user.created') {
          // Generate username for new OAuth users
          finalUsername = generateUsername(first_name ?? null, last_name ?? null, primaryEmail, id)
          console.log('Generated username for new user:', finalUsername)
        } else if (!finalUsername && eventType === 'user.updated') {
          // Check if user already has a username in database
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', id)
            .maybeSingle() as { data: { username: string | null } | null }
          
          // If no username exists, generate one
          if (!existingProfile?.username) {
            finalUsername = generateUsername(first_name ?? null, last_name ?? null, primaryEmail, id)
            console.log('Generated username for existing user:', finalUsername)
          } else {
            finalUsername = existingProfile.username
          }
        }

        const { error } = await upsertProfile(supabase, {
          id,
          email: primaryEmail,
          username: finalUsername,
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
