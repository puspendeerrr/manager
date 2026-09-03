import { PrismaClient, TaskStatus, TaskPriority, ReminderInterval, ReminderState } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

async function main() {
  console.log('🌱 Starting database seed process...');

  // 1. Create or update Default Dev User
  const user = await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {
      name: 'Development User',
      email: 'dev@sonam.app',
      timezone: 'Asia/Kolkata',
      workStartHour: '09:00',
      workEndHour: '18:00',
      defaultReminderInterval: ReminderInterval.HOUR_1,
      enableNotifications: true,
    },
    create: {
      id: DEFAULT_USER_ID,
      name: 'Development User',
      email: 'dev@sonam.app',
      timezone: 'Asia/Kolkata',
      workStartHour: '09:00',
      workEndHour: '18:00',
      defaultReminderInterval: ReminderInterval.HOUR_1,
      enableNotifications: true,
    },
  });

  console.log(`👤 Seeded User: ${user.name} (${user.id})`);

  // Clean existing tasks & projects for a clean seed run
  await prisma.taskReminder.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});

  // 2. Create Projects
  const tshirProject = await prisma.project.create({
    data: {
      name: 'College T-Shirt Procurement',
      description: 'Vendor selection, quotation comparison, and bulk order for annual fest',
      color: '#722ed1',
      userId: user.id,
    },
  });

  const bdeProject = await prisma.project.create({
    data: {
      name: 'BDE Work & Client Relations',
      description: 'Business development outreach, pitch deck revisions, and client follow-ups',
      color: '#1890ff',
      userId: user.id,
    },
  });

  const personalProject = await prisma.project.create({
    data: {
      name: 'Personal & Health',
      description: 'Personal errands, fitness, and learning goals',
      color: '#52c41a',
      userId: user.id,
    },
  });

  console.log(`📁 Seeded Projects: ${tshirProject.name}, ${bdeProject.name}, ${personalProject.name}`);

  const now = dayjs();

  // 3. Seed Realistic Tasks for "College T-Shirt Procurement"
  const tshirtTasks = [
    {
      title: 'Find Ludhiana T-shirt manufacturers',
      description: 'Search online directories and collect phone numbers for top rated garment factories',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      deadline: now.subtract(2, 'day').toDate(),
      completedAt: now.subtract(2, 'day').toDate(),
      projectId: tshirProject.id,
      userId: user.id,
    },
    {
      title: 'Call 5 manufacturers for quotations',
      description: 'Contact factories in Ludhiana & Tirupur. Request quotes for 500 cotton round-neck t-shirts',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.URGENT,
      deadline: now.subtract(1, 'day').toDate(),
      completedAt: now.subtract(1, 'day').toDate(),
      projectId: tshirProject.id,
      userId: user.id,
    },
    {
      title: 'Collect quotations from all vendors',
      description: 'Ensure GST invoice breakdowns, screen printing charges, and delivery timelines are included',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      deadline: now.subtract(2, 'hour').toDate(),
      completedAt: now.subtract(1, 'hour').toDate(),
      projectId: tshirProject.id,
      userId: user.id,
    },
    {
      title: 'Compare vendor pricing & quality specs',
      description: 'Create a spreadsheet comparing price per unit, GSM quality, printing options, and lead time',
      status: TaskStatus.PENDING,
      priority: TaskPriority.URGENT,
      deadline: now.add(45, 'minute').toDate(), // Due soon today!
      reminderInterval: ReminderInterval.MINUTES_30,
      nextReminderAt: now.add(15, 'minute').toDate(),
      projectId: tshirProject.id,
      userId: user.id,
    },
    {
      title: 'Check T-shirt fabric samples',
      description: 'Inspect sample pieces sent by top 2 vendors for GSM thickness and stitching durability',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      deadline: now.add(1, 'day').hour(17).minute(0).toDate(),
      reminderInterval: ReminderInterval.HOUR_1,
      projectId: tshirProject.id,
      userId: user.id,
    },
    {
      title: 'Prepare vendor recommendation report',
      description: 'Draft 1-page summary note for fest committee approval',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      deadline: now.add(2, 'day').hour(15).minute(0).toDate(),
      reminderInterval: ReminderInterval.HOURS_2,
      projectId: tshirProject.id,
      userId: user.id,
    },
  ];

  for (const t of tshirtTasks) {
    const createdTask = await prisma.task.create({ data: t });
    if (createdTask.nextReminderAt) {
      await prisma.taskReminder.create({
        data: {
          taskId: createdTask.id,
          scheduledFor: createdTask.nextReminderAt,
          state: ReminderState.SCHEDULED,
        },
      });
    }
  }

  // 4. Seed Overdue & Additional Tasks
  const extraTasks = [
    {
      title: 'Submit Q3 BDE partnership pitch deck',
      description: 'Finalize slides for potential enterprise client meeting',
      status: TaskStatus.OVERDUE,
      priority: TaskPriority.URGENT,
      deadline: now.subtract(5, 'hour').toDate(),
      reminderInterval: ReminderInterval.HOUR_1,
      projectId: bdeProject.id,
      userId: user.id,
    },
    {
      title: 'Follow up with Bangalore distributor',
      description: 'Send follow-up email regarding signed NDA agreement',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      deadline: now.add(4, 'hour').toDate(),
      reminderInterval: ReminderInterval.HOUR_1,
      projectId: bdeProject.id,
      userId: user.id,
    },
    {
      title: 'Renew health insurance policy',
      description: 'Compare family health plans and complete online payment before expiry',
      status: TaskStatus.PENDING,
      priority: TaskPriority.LOW,
      deadline: now.add(3, 'day').toDate(),
      projectId: personalProject.id,
      userId: user.id,
    },
  ];

  for (const t of extraTasks) {
    const createdTask = await prisma.task.create({ data: t });
    if (t.status === TaskStatus.OVERDUE) {
      await prisma.taskReminder.create({
        data: {
          taskId: createdTask.id,
          scheduledFor: createdTask.deadline!,
          state: ReminderState.DUE,
        },
      });
    }
  }

  console.log(`✅ Seeded ${tshirtTasks.length + extraTasks.length} realistic tasks successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
