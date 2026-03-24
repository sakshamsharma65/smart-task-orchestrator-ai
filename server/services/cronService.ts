import cron from "node-cron";
import { storage } from "../storage";
import { EmailService } from "./email.service";

export function initCronJobs() {
  cron.schedule("0 5 * * *", async () => {
    const settings = await storage.getEmailSettings();
    if (!settings?.isActive || !settings.sendOnOverdue) return;

    const overdueTasks = await storage.getPendingOverdueTasksWithManagers();
    if (overdueTasks.length === 0) return;

    const emailService = new EmailService(settings);
    const managerReports: Record<string, { email: string; name: string; tasks: any[] }> = {};

    for (const task of overdueTasks) {
      // 1. Send Individual Email to Assignee
      await emailService.sendNotification({
        event: "sendOnOverdue",
        to: task.assigneeEmail,
        subject: `⚠️ Task Overdue: ${task.taskTitle}`,
        html: `<p>Hello ${task.assigneeName}, your task <b>${task.taskTitle}</b> is overdue.</p>`
      });
      await storage.markTaskAsNotified(task.taskId);

      // 2. Group tasks for Manager separate report
      if (task.managerEmail) {
        if (!managerReports[task.managerEmail]) {
          managerReports[task.managerEmail] = { email: task.managerEmail, name: task.managerName, tasks: [] };
        }
        managerReports[task.managerEmail].tasks.push(task);
      }
    }

    // 3. Send Grouped Summary Email to Managers
    for (const mEmail in managerReports) {
      const report = managerReports[mEmail];
      await emailService.sendEmail({
        to: report.email,
        subject: `Daily Overdue Report: ${report.tasks.length} Tasks Pending`,
        html: `
          <h2>Overdue Summary for ${report.name}</h2>
          <p>The following tasks in your teams are currently overdue:</p>
          <ul>
            ${report.tasks.map(t => `<li><b>${t.taskTitle}</b> - Assigned to: ${t.assigneeName}</li>`).join('')}
          </ul>
        `
      });
    }
  });
}