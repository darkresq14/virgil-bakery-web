import { getPayload } from 'payload'
import config from '../payload.config'
import { bakerySeed } from '../endpoints/seed/bakery'
import { createLocalReq } from 'payload'

async function runSeed() {
  const payload = await getPayload({ config })

  // Find or create an admin user to use for the seed
  let adminUser = await payload.find({
    collection: 'users',
    limit: 1,
    depth: 0,
  })

  if (adminUser.docs.length === 0) {
    console.log('Creating admin user...')
    adminUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Admin',
        email: 'admin@virgilbakery.com',
        password: 'admin123',
      },
    })
    console.log(`Created admin user: ${adminUser.id}`)
  }

  const user = adminUser.docs?.[0] || adminUser
  const req = await createLocalReq({ user }, payload)

  await bakerySeed({ payload, req })

  console.log('Done!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
