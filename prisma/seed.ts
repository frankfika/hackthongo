import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default competition
  // Use upsert to avoid error if it already exists
  const competition = await prisma.competition.upsert({
    where: { id: 'default-competition' },
    update: {},
    create: {
      id: 'default-competition',
      name: 'HackThonGo MVP',
      description: 'A simple hackathon management system.',
      startTime: new Date(),
      endTime: new Date(new Date().setDate(new Date().getDate() + 7)),
      status: 'REGISTRATION',
      registrationForm: [
        { id: 'name', label: 'Name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', required: false },
      ],
      submissionForm: [
        { id: 'projectName', label: 'Project Name', type: 'text', required: true },
        { id: 'description', label: 'Description', type: 'textarea', required: true },
        { id: 'repoUrl', label: 'Repository URL', type: 'url', required: true },
        { id: 'demoUrl', label: 'Demo URL', type: 'url', required: false },
      ],
    },
  })

  console.log({ competition })

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: 'admin123', // Plain text for MVP
      role: Role.ADMIN,
    },
  })

  console.log({ admin })

  // Create some judges
  const judge1 = await prisma.user.upsert({
    where: { email: 'judge1@example.com' },
    update: {},
    create: {
      email: 'judge1@example.com',
      name: 'Judge One',
      passwordHash: 'judge123',
      role: Role.JUDGE,
    },
  })
  
  const judge2 = await prisma.user.upsert({
    where: { email: 'judge2@example.com' },
    update: {},
    create: {
      email: 'judge2@example.com',
      name: 'Judge Two',
      passwordHash: 'judge123',
      role: Role.JUDGE,
    },
  })

  console.log({ judge1, judge2 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
