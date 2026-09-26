import { describe, expect, it } from "vitest";
import {
  extractWorkItem,
  normalizeGitHubEvent,
  reconcile,
} from "../src/core";

describe("reconciliation", () => {
  it("maps CI failure to In Progress + ci-blocked", () => {
    const result = reconcile("ci_failed", {
      ciPass: false,
      qaPass: false,
      humanMergeApproved: false,
    });
    expect(result.desiredStatus).toBe("In Progress");
    expect(result.addLabels).toContain("ci-blocked");
    expect(result.blocked).toBe(true);
  });

  it("does not mark merged work Done without all terminal evidence", () => {
    const held = reconcile("pr_merged", {
      ciPass: true,
      qaPass: true,
      humanMergeApproved: false,
    });
    expect(held.desiredStatus).toBeNull();

    const done = reconcile("pr_merged", {
      ciPass: true,
      qaPass: true,
      humanMergeApproved: true,
    });
    expect(done.desiredStatus).toBe("Done");
  });
});

describe("GitHub normalization", () => {
  it("extracts Jira key from PR branch", () => {
    const normalized = normalizeGitHubEvent("pull_request", {
      action: "opened",
      pull_request: {
        head: { ref: "SCRUM-18-cloudflare-deployment" },
        title: "Deploy",
      },
    });
    expect(normalized.type).toBe("pr_opened");
    expect(normalized.workItemId).toBe("SCRUM-18");
  });

  it("normalizes workflow failures", () => {
    const normalized = normalizeGitHubEvent("workflow_run", {
      action: "completed",
      workflow_run: {
        head_branch: "SCRUM-18-cloudflare-deployment",
        conclusion: "failure",
      },
    });
    expect(normalized.type).toBe("ci_failed");
    expect(normalized.workItemId).toBe("SCRUM-18");
  });
});

describe("key extraction", () => {
  it("returns null when there is no key", () => {
    expect(extractWorkItem("feature/no-ticket")).toBeNull();
  });
});
