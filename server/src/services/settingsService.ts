import { prisma } from '../utils/prisma';
import { UpdateSettingsDTO } from '@sonam/shared';

export class SettingsService {
  async getUserSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User settings not found');
    return user;
  }

  async updateUserSettings(userId: string, data: UpdateSettingsDTO) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.workStartHour !== undefined && { workStartHour: data.workStartHour }),
        ...(data.workEndHour !== undefined && { workEndHour: data.workEndHour }),
        ...(data.defaultReminderInterval !== undefined && { defaultReminderInterval: data.defaultReminderInterval }),
        ...(data.enableNotifications !== undefined && { enableNotifications: data.enableNotifications }),
      },
    });
  }
}

export const settingsService = new SettingsService();
