import ProjectRepository from "../projects/project.repository.js";
import IssueRepository from "../issues/issue.repository.js";

function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default class AnalyticsService {
  constructor(
    projectRepository = new ProjectRepository(),
    issueRepository = new IssueRepository(),
  ) {
    this.projectRepository = projectRepository;
    this.issueRepository = issueRepository;
  }

  async workspace(workspaceId, uid, { includeIssues = false } = {}) {
    const projects = await this.projectRepository.listForWorkspace(
      workspaceId,
      uid,
    );
    const projectIssues = await Promise.all(
      projects.map(async (project) => ({
        project,
        issues: await this.issueRepository.list(project.id, uid),
      })),
    );
    const issues = projectIssues.flatMap(({ issues: rows }) => rows);
    const now = Date.now();
    const dueSoonLimit = now + 7 * 24 * 60 * 60 * 1000;
    const workload = new Map();
    const statusCounts = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
    };

    issues.forEach((issue) => {
      statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
      const assigneeId = issue.assigneeId || "unassigned";
      const current = workload.get(assigneeId) || {
        assigneeId: issue.assigneeId || null,
        total: 0,
        active: 0,
        overdue: 0,
      };
      current.total += 1;
      if (issue.status !== "done") current.active += 1;
      const dueDate = toMillis(issue.dueDate);
      if (dueDate !== null && issue.status !== "done" && dueDate < now) {
        current.overdue += 1;
      }
      workload.set(assigneeId, current);
    });

    const dueDates = issues
      .filter((issue) => issue.status !== "done")
      .map((issue) => toMillis(issue.dueDate))
      .filter((date) => date !== null);
    const projectsSummary = projectIssues.map(({ project, issues: rows }) => ({
      id: project.id,
      name: project.name,
      totalIssues: rows.length,
      completedIssues: rows.filter((issue) => issue.status === "done").length,
      activeIssues: rows.filter((issue) => issue.status !== "done").length,
    }));

    return {
      summary: {
        projectCount: projects.length,
        totalIssues: issues.length,
        completedIssues: statusCounts.done,
        activeIssues: issues.length - statusCounts.done,
        overdueIssues: dueDates.filter((date) => date < now).length,
        dueSoonIssues: dueDates.filter(
          (date) => date >= now && date <= dueSoonLimit,
        ).length,
      },
      statusCounts,
      workload: [...workload.values()].sort(
        (left, right) => right.active - left.active,
      ),
      projects: projectsSummary,
      ...(includeIssues ? { issues } : {}),
    };
  }
}