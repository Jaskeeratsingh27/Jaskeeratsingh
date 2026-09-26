from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, FrozenSet, List, Optional


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


class JiraStatus(str, Enum):
    TO_DO = "To Do"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    DONE = "Done"
    BLOCKED = "Blocked"


class AgentRole(str, Enum):
    ORCHESTRATOR = "orchestrator"
    PROJECT_MANAGER = "project_manager"
    SOFTWARE_ENGINEER = "software_engineer"
    QA_VALIDATOR = "qa_validator"


@dataclass(frozen=True)
class AgentContract:
    role: AgentRole
    mission: str
    allowed_operations: FrozenSet[str]
    forbidden_operations: FrozenSet[str]
    required_outputs: FrozenSet[str]


AGENT_CONTRACTS: Dict[AgentRole, AgentContract] = {
    AgentRole.ORCHESTRATOR: AgentContract(
        role=AgentRole.ORCHESTRATOR,
        mission="Plan, delegate, reconcile evidence, and request approvals.",
        allowed_operations=frozenset(
            {
                "plan.create",
                "delegate",
                "project.read_state",
                "reconciliation.decide",
                "approval.request",
            }
        ),
        forbidden_operations=frozenset(
            {
                "github.commit_feature_branch",
                "github.merge_pull_request",
                "qa.self_certify",
            }
        ),
        required_outputs=frozenset({"status", "evidence", "next_action", "blockers"}),
    ),
    AgentRole.PROJECT_MANAGER: AgentContract(
        role=AgentRole.PROJECT_MANAGER,
        mission="Keep Jira operational state aligned to verified engineering state.",
        allowed_operations=frozenset(
            {
                "jira.read_issue",
                "jira.create_issue",
                "jira.add_comment",
                "jira.transition_non_terminal",
                "jira.link_issue",
            }
        ),
        forbidden_operations=frozenset(
            {
                "github.commit_feature_branch",
                "github.merge_pull_request",
                "jira.transition_done_without_evidence",
            }
        ),
        required_outputs=frozenset({"status", "jira_changes", "evidence", "blockers"}),
    ),
    AgentRole.SOFTWARE_ENGINEER: AgentContract(
        role=AgentRole.SOFTWARE_ENGINEER,
        mission="Implement changes on feature branches and produce reviewable pull requests.",
        allowed_operations=frozenset(
            {
                "github.read_repository",
                "github.create_branch",
                "github.commit_feature_branch",
                "github.open_pull_request",
                "github.update_pull_request",
            }
        ),
        forbidden_operations=frozenset(
            {
                "github.merge_pull_request",
                "github.force_push_protected",
                "secrets.modify",
                "qa.self_certify",
            }
        ),
        required_outputs=frozenset({"status", "changes", "pr", "test_evidence", "blockers"}),
    ),
    AgentRole.QA_VALIDATOR: AgentContract(
        role=AgentRole.QA_VALIDATOR,
        mission="Independently verify acceptance criteria, CI, regressions, and policy compliance.",
        allowed_operations=frozenset(
            {
                "github.read_repository",
                "github.read_pull_request",
                "github.read_checks",
                "tests.run",
                "qa.report",
            }
        ),
        forbidden_operations=frozenset(
            {
                "github.commit_feature_branch",
                "github.merge_pull_request",
                "acceptance_criteria.waive",
            }
        ),
        required_outputs=frozenset({"status", "verdict", "evidence", "risks"}),
    ),
}


POLICY: Dict[str, ApprovalLevel] = {
    "github.read_repository": ApprovalLevel.L0,
    "github.read_pull_request": ApprovalLevel.L0,
    "github.read_checks": ApprovalLevel.L0,
    "jira.read_issue": ApprovalLevel.L0,
    "github.create_branch": ApprovalLevel.L1,
    "github.commit_feature_branch": ApprovalLevel.L1,
    "github.open_pull_request": ApprovalLevel.L1,
    "github.update_pull_request": ApprovalLevel.L1,
    "jira.create_issue": ApprovalLevel.L1,
    "jira.add_comment": ApprovalLevel.L1,
    "jira.transition_non_terminal": ApprovalLevel.L1,
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

RESUMABLE_EXCEPTION_STATES = {
    WorkflowState.BLOCKED,
    WorkflowState.INPUT_REQUIRED,
}


@dataclass(frozen=True)
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
    previous_state: Optional[WorkflowState] = None
    qa_pass: bool = False
    ci_pass: bool = False
    human_merge_approved: bool = False
    merged_or_closed: bool = False
    approvals: List[Approval] = field(default_factory=list)
    events: List[str] = field(default_factory=list)


class PolicyViolation(RuntimeError):
    pass


class WorkflowViolation(RuntimeError):
    pass


class ReconciliationViolation(RuntimeError):
    pass


class AgentContractViolation(RuntimeError):
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


class AgentContractEngine:
    @staticmethod
    def authorize(role: AgentRole, operation: str) -> bool:
        contract = AGENT_CONTRACTS[role]
        if operation in contract.forbidden_operations:
            raise AgentContractViolation(
                f"{role.value} is forbidden from performing {operation}"
            )
        if operation not in contract.allowed_operations:
            raise AgentContractViolation(
                f"{role.value} has no grant for {operation}; deny by default"
            )
        return True


class WorkflowEngine:
    @staticmethod
    def transition(job: Job, target: WorkflowState) -> None:
        if target in RESUMABLE_EXCEPTION_STATES:
            if job.state not in RESUMABLE_EXCEPTION_STATES:
                job.previous_state = job.state
            job.state = target
            job.events.append(f"transition:{target.value}")
            return

        if target in {WorkflowState.FAILED, WorkflowState.CANCELED}:
            job.previous_state = None
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

        if target == WorkflowState.READY_TO_MERGE:
            if not job.ci_pass:
                raise WorkflowViolation("Required CI must pass before READY_TO_MERGE")
            if not job.human_merge_approved:
                raise WorkflowViolation("Human approval is required before READY_TO_MERGE")

        if target == WorkflowState.DONE:
            if not job.qa_pass or not job.merged_or_closed:
                raise WorkflowViolation("DONE requires QA pass and merged/formally closed work")

        job.state = target
        job.events.append(f"transition:{target.value}")

    @staticmethod
    def resume(job: Job) -> None:
        if job.state not in RESUMABLE_EXCEPTION_STATES:
            raise WorkflowViolation(f"{job.state.value} is not resumable")
        if job.previous_state is None:
            raise WorkflowViolation("No previous state recorded for resume")
        restored = job.previous_state
        job.previous_state = None
        job.state = restored
        job.events.append(f"resume:{restored.value}")


class ReconciliationEventType(str, Enum):
    PR_OPENED = "pr_opened"
    CI_FAILED = "ci_failed"
    CI_PASSED = "ci_passed"
    PR_READY = "pr_ready"
    PR_MERGED = "pr_merged"


@dataclass(frozen=True)
class ReconciliationEvent:
    event_id: str
    event_type: ReconciliationEventType


@dataclass(frozen=True)
class ReconciliationEvidence:
    ci_pass: bool = False
    qa_pass: bool = False
    human_merge_approved: bool = False


@dataclass(frozen=True)
class ReconciliationDecision:
    desired_status: Optional[JiraStatus]
    reason: str
    requires_human_approval: bool = False


class ReconciliationEngine:
    @staticmethod
    def decide(
        event: ReconciliationEvent,
        evidence: ReconciliationEvidence,
    ) -> ReconciliationDecision:
        if event.event_type == ReconciliationEventType.PR_OPENED:
            return ReconciliationDecision(
                JiraStatus.IN_PROGRESS,
                "A reviewable implementation branch/PR exists.",
            )

        if event.event_type == ReconciliationEventType.CI_FAILED:
            # Deliberate V1.2 failure-probe defect: tests require BLOCKED.
            return ReconciliationDecision(
                JiraStatus.IN_REVIEW,
                "CI failed; work must not advance.",
            )

        if event.event_type == ReconciliationEventType.CI_PASSED:
            return ReconciliationDecision(
                JiraStatus.IN_PROGRESS,
                "CI passed; QA evidence is still required before review.",
            )

        if event.event_type == ReconciliationEventType.PR_READY:
            if evidence.ci_pass and evidence.qa_pass:
                return ReconciliationDecision(
                    JiraStatus.IN_REVIEW,
                    "CI and independent QA passed; ready for human review.",
                )
            return ReconciliationDecision(
                None,
                "PR readiness cannot advance Jira without both CI and QA evidence.",
            )

        if event.event_type == ReconciliationEventType.PR_MERGED:
            if evidence.ci_pass and evidence.qa_pass and evidence.human_merge_approved:
                return ReconciliationDecision(
                    JiraStatus.DONE,
                    "Merged after CI, QA, and explicit human approval.",
                )
            return ReconciliationDecision(
                None,
                "Merge event lacks required CI/QA/human-approval evidence.",
                requires_human_approval=not evidence.human_merge_approved,
            )

        raise ReconciliationViolation(f"Unhandled event: {event.event_type}")


class ReconciliationLedger:
    def __init__(self) -> None:
        self._processed: Dict[str, tuple[ReconciliationEvent, ReconciliationEvidence, ReconciliationDecision]] = {}

    def process(
        self,
        event: ReconciliationEvent,
        evidence: ReconciliationEvidence,
    ) -> ReconciliationDecision:
        if not event.event_id:
            raise ReconciliationViolation("event_id is required")

        if event.event_id in self._processed:
            prior_event, prior_evidence, prior_decision = self._processed[event.event_id]
            if prior_event != event or prior_evidence != evidence:
                raise ReconciliationViolation(
                    "event_id reuse with different event/evidence is denied"
                )
            return prior_decision

        decision = ReconciliationEngine.decide(event, evidence)
        self._processed[event.event_id] = (event, evidence, decision)
        return decision


class MockToolAdapter:
    """Deterministic adapter used to validate policy and idempotency before live APIs."""

    def __init__(self) -> None:
        self.executed: Dict[str, Dict[str, Any]] = {}

    def execute(
        self,
        operation_id: str,
        operation: str,
        payload: Optional[Dict[str, Any]] = None,
        approval: Optional[Approval] = None,
    ) -> Dict[str, Any]:
        if not operation_id:
            raise PolicyViolation("Mutating operations require an operation_id")

        payload = payload or {}

        if operation_id in self.executed:
            prior = self.executed[operation_id]
            if prior["operation"] != operation or prior["payload"] != payload:
                raise PolicyViolation("operation_id reuse with different request is denied")
            return prior

        PolicyEngine.authorize(operation, approval)

        if operation == "github.commit_feature_branch":
            branch = str(payload.get("branch", ""))
            PolicyEngine.guard_branch_write(branch)

        result = {
            "operation_id": operation_id,
            "operation": operation,
            "payload": payload,
            "status": "executed",
        }
        self.executed[operation_id] = result
        return result


class Orchestrator:
    """Deterministic planner and delegation boundary."""

    @staticmethod
    def build_feature_plan(goal: str) -> List[Dict[str, str]]:
        return [
            {"agent": "project_manager", "action": "define_acceptance_criteria", "goal": goal},
            {"agent": "software_engineer", "action": "implement_on_feature_branch", "goal": goal},
            {"agent": "qa_validator", "action": "verify_acceptance_criteria", "goal": goal},
            {"agent": "orchestrator", "action": "request_merge_approval", "goal": goal},
        ]
