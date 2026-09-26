from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class ApprovalLevel(str, Enum):
    L0 = "L0"
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"


class WorkflowState(str, Enum):
    IDEA = "IDEA"
    DISCOVERY = "DISCOVERY"
    PLANNED = "PLANNED"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    CODE_COMPLETE = "CODE_COMPLETE"
    VALIDATION = "VALIDATION"
    REVIEW = "REVIEW"
    READY_TO_MERGE = "READY_TO_MERGE"
    DONE = "DONE"
    BLOCKED = "BLOCKED"
    INPUT_REQUIRED = "INPUT_REQUIRED"
    FAILED = "FAILED"
    CANCELED = "CANCELED"


POLICY: Dict[str, ApprovalLevel] = {
    "github.read_repository": ApprovalLevel.L0,
    "jira.read_issue": ApprovalLevel.L0,
    "github.create_branch": ApprovalLevel.L1,
    "github.commit_feature_branch": ApprovalLevel.L1,
    "github.open_pull_request": ApprovalLevel.L1,
    "jira.create_issue": ApprovalLevel.L1,
    "jira.add_comment": ApprovalLevel.L1,
    "github.merge_pull_request": ApprovalLevel.L2,
    "jira.transition_done": ApprovalLevel.L2,
    "github.create_release": ApprovalLevel.L2,
    "production.deploy": ApprovalLevel.L3,
    "github.delete_repository": ApprovalLevel.L3,
    "github.force_push_protected": ApprovalLevel.L3,
}

HAPPY_PATH = [
    WorkflowState.IDEA,
    WorkflowState.DISCOVERY,
    WorkflowState.PLANNED,
    WorkflowState.READY,
    WorkflowState.IN_PROGRESS,
    WorkflowState.CODE_COMPLETE,
    WorkflowState.VALIDATION,
    WorkflowState.REVIEW,
    WorkflowState.READY_TO_MERGE,
    WorkflowState.DONE,
]


@dataclass
class Approval:
    level: ApprovalLevel
    approved_by: str
    reason: str


@dataclass
class Job:
    run_id: str
    work_item_id: str
    goal: str
    state: WorkflowState = WorkflowState.IDEA
    qa_pass: bool = False
    ci_pass: bool = False
    merged_or_closed: bool = False
    approvals: List[Approval] = field(default_factory=list)
    events: List[str] = field(default_factory=list)


class PolicyViolation(RuntimeError):
    pass


class WorkflowViolation(RuntimeError):
    pass


class PolicyEngine:
    @staticmethod
    def required_level(operation: str) -> ApprovalLevel:
        if operation not in POLICY:
            raise PolicyViolation(f"Unknown operation is denied by default: {operation}")
        return POLICY[operation]

    @staticmethod
    def authorize(operation: str, approval: Optional[Approval] = None) -> bool:
        level = PolicyEngine.required_level(operation)
        if level in (ApprovalLevel.L0, ApprovalLevel.L1):
            return True
        if approval is None or approval.level != level:
            raise PolicyViolation(f"{operation} requires {level.value} approval")
        return True

    @staticmethod
    def guard_branch_write(branch: str) -> None:
        if branch in {"main", "master"}:
            raise PolicyViolation("Direct writes to protected branches are denied")


class WorkflowEngine:
    @staticmethod
    def transition(job: Job, target: WorkflowState) -> None:
        if target in {
            WorkflowState.BLOCKED,
            WorkflowState.INPUT_REQUIRED,
            WorkflowState.FAILED,
            WorkflowState.CANCELED,
        }:
            job.state = target
            job.events.append(f"transition:{target.value}")
            return

        try:
            current_index = HAPPY_PATH.index(job.state)
            target_index = HAPPY_PATH.index(target)
        except ValueError as exc:
            raise WorkflowViolation("Invalid happy-path transition") from exc

        if target_index != current_index + 1:
            raise WorkflowViolation(
                f"Cannot skip workflow gate: {job.state.value} -> {target.value}"
            )

        if target == WorkflowState.REVIEW and not job.qa_pass:
            raise WorkflowViolation("QA must pass before REVIEW")

        if target == WorkflowState.READY_TO_MERGE and not job.ci_pass:
            raise WorkflowViolation("Required CI must pass before READY_TO_MERGE")

        if target == WorkflowState.DONE:
            if not job.qa_pass or not job.merged_or_closed:
                raise WorkflowViolation("DONE requires QA pass and merged/formally closed work")

        job.state = target
        job.events.append(f"transition:{target.value}")


class Orchestrator:
    """Deterministic V1 planner. Model reasoning can sit above this boundary later."""

    @staticmethod
    def build_feature_plan(goal: str) -> List[Dict[str, str]]:
        return [
            {"agent": "project_manager", "action": "define_acceptance_criteria", "goal": goal},
            {"agent": "software_engineer", "action": "implement_on_feature_branch", "goal": goal},
            {"agent": "qa_validator", "action": "verify_acceptance_criteria", "goal": goal},
            {"agent": "orchestrator", "action": "request_merge_approval", "goal": goal},
        ]
