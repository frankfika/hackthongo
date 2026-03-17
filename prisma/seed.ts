import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../src/lib/security'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed script should not run in production. Aborting.');
    process.exit(1);
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin12345';
  const judgePassword = process.env.SEED_JUDGE_PASSWORD || 'judge12345';
  // Create default competition
  // Use upsert to avoid error if it already exists
  const competition = await prisma.competition.upsert({
    where: { id: 'default-competition' },
    update: {
      name: 'Global AI Hackathon 2026',
      tagline: 'Build the future of intelligent systems.',
      description: 'Join developers worldwide to create innovative AI solutions.',
      prizePool: '$50,000 USD',
      introMarkdown: '# Global AI Hackathon\n\nWelcome to the premier AI building event of the year. \n\n## Tracks\n- Generative AI\n- AI for Good\n- Enterprise Solutions\n\n## Judging Criteria\n1. Innovation (30%)\n2. Technical Complexity (30%)\n3. Business Value (20%)\n4. Presentation (20%)',
    },
    create: {
      id: 'default-competition',
      name: 'HackThonGo MVP',
      tagline: null,
      description: 'A simple hackathon management system.',
      prizePool: null,
      introMarkdown: null,
      introGitbookUrl: null,
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
      passwordHash: hashPassword(adminPassword),
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
      passwordHash: hashPassword(judgePassword),
      role: Role.JUDGE,
    },
  })
  
  const judge2 = await prisma.user.upsert({
    where: { email: 'judge2@example.com' },
    update: {},
    create: {
      email: 'judge2@example.com',
      name: 'Judge Two',
      passwordHash: hashPassword(judgePassword),
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
