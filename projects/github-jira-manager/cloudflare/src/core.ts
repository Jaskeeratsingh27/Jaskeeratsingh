export type ReconciliationType =
  | "pr_opened"
  | "ci_failed"
  | "ci_passed"
  | "pr_ready"
  | "pr_merged";

export interface Evidence {
  ciPass: boolean;
  qaPass: boolean;
  humanMergeApproved: boolean;
}

export interface Decision {
  desiredStatus: string | null;
  reason: string;
  addLabels: string[];
  removeLabels: string[];
  blocked: boolean;
}

export function reconcile(
  eventType: ReconciliationType,
  evidence: Evidence,
): Decision {
  switch (eventType) {
    case "pr_opened":
      return {
        desiredStatus: "In Progress",
        reason: "A reviewable pull request exists.",
        addLabels: [],
        removeLabels: ["ci-blocked"],
        blocked: false,
      };

    case "ci_failed":
      return {
        desiredStatus: "In Progress",
        reason:
          "CI failed. Jira stays In Progress and receives the ci-blocked label.",
        addLabels: ["ci-blocked"],
        removeLabels: [],
        blocked: true,
      };

    case "ci_passed":
      return {
        desiredStatus: "In Progress",
        reason:
          "CI passed. Clear the CI block; independent QA is still required.",
        addLabels: [],
        removeLabels: ["ci-blocked"],
        blocked: false,
      };

    case "pr_ready":
      if (evidence.ciPass && evidence.qaPass) {
        return {
          desiredStatus: "In Review",
          reason: "CI and independent QA passed.",
          addLabels: [],
          removeLabels: ["ci-blocked"],
          blocked: false,
        };
      }
      return {
        desiredStatus: null,
        reason: "PR readiness cannot advance Jira without CI and QA evidence.",
        addLabels: [],
        removeLabels: [],
        blocked: false,
      };

    case "pr_merged":
      if (
        evidence.ciPass &&
        evidence.qaPass &&
        evidence.humanMergeApproved
      ) {
        return {
          desiredStatus: "Done",
          reason: "Merged after CI, QA, and explicit human approval.",
          addLabels: [],
          removeLabels: ["ci-blocked"],
          blocked: false,
        };
      }
      return {
        desiredStatus: null,
        reason:
          "Merge event lacks required CI, QA, or human-approval evidence.",
        addLabels: [],
        removeLabels: [],
        blocked: false,
      };
  }
}

export function extractWorkItem(...values: unknown[]): string | null {
  const pattern = /\b[A-Z][A-Z0-9]+-\d+\b/;
  for (const value of values) {
    if (typeof value !== "string") continue;
    const match = value.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export function normalizeGitHubEvent(
  eventName: string,
  body: any,
): { type: ReconciliationType | null; workItemId: string | null } {
  if (eventName === "pull_request") {
    const pr = body?.pull_request ?? {};
    const workItemId = extractWorkItem(
      pr?.head?.ref,
      pr?.title,
      pr?.body,
    );
    if (body?.action === "opened" || body?.action === "reopened") {
      return { type: "pr_opened", workItemId };
    }
    if (body?.action === "ready_for_review") {
      return { type: "pr_ready", workItemId };
    }
    if (body?.action === "closed" && Boolean(pr?.merged)) {
      return { type: "pr_merged", workItemId };
    }
    return { type: null, workItemId };
  }

  if (eventName === "workflow_run" && body?.action === "completed") {
    const run = body?.workflow_run ?? {};
    const workItemId = extractWorkItem(run?.head_branch, run?.name);
    return {
      type: run?.conclusion === "success" ? "ci_passed" : "ci_failed",
      workItemId,
    };
  }

  return { type: null, workItemId: null };
}
