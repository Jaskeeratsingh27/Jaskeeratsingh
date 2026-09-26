import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from control_plane import (  # noqa: E402
    AGENT_CONTRACTS,
    AgentContractEngine,
    AgentContractViolation,
    AgentRole,
    Approval,
    ApprovalLevel,
    JiraStatus,
    Job,
    MockToolAdapter,
    Orchestrator,
    PolicyEngine,
    PolicyViolation,
    ReconciliationEvidence,
    ReconciliationEvent,
    ReconciliationEventType,
    ReconciliationLedger,
    ReconciliationViolation,
    WorkflowEngine,
    WorkflowState,
    WorkflowViolation,
)


class PolicyTests(unittest.TestCase):
    def test_safe_write_does_not_require_human_approval(self):
        self.assertTrue(PolicyEngine.authorize("github.create_branch"))

    def test_merge_requires_l2(self):
        with self.assertRaises(PolicyViolation):
            PolicyEngine.authorize("github.merge_pull_request")
        approval = Approval(ApprovalLevel.L2, "human", "reviewed")
        self.assertTrue(PolicyEngine.authorize("github.merge_pull_request", approval))

    def test_unknown_operation_denied_by_default(self):
        with self.assertRaises(PolicyViolation):
            PolicyEngine.authorize("github.do_anything")

    def test_direct_main_write_is_blocked(self):
        with self.assertRaises(PolicyViolation):
            PolicyEngine.guard_branch_write("main")
        PolicyEngine.guard_branch_write("feature/test")


class AgentContractTests(unittest.TestCase):
    def test_exactly_four_roles_exist(self):
        self.assertEqual(
            set(AGENT_CONTRACTS),
            {
                AgentRole.ORCHESTRATOR,
                AgentRole.PROJECT_MANAGER,
                AgentRole.SOFTWARE_ENGINEER,
                AgentRole.QA_VALIDATOR,
            },
        )

    def test_engineer_can_commit_feature_branch_but_cannot_merge(self):
        self.assertTrue(
            AgentContractEngine.authorize(
                AgentRole.SOFTWARE_ENGINEER,
                "github.commit_feature_branch",
            )
        )
        with self.assertRaises(AgentContractViolation):
            AgentContractEngine.authorize(
                AgentRole.SOFTWARE_ENGINEER,
                "github.merge_pull_request",
            )

    def test_qa_cannot_implement(self):
        with self.assertRaises(AgentContractViolation):
            AgentContractEngine.authorize(
                AgentRole.QA_VALIDATOR,
                "github.commit_feature_branch",
            )

    def test_project_manager_cannot_write_code(self):
        with self.assertRaises(AgentContractViolation):
            AgentContractEngine.authorize(
                AgentRole.PROJECT_MANAGER,
                "github.commit_feature_branch",
            )

    def test_ungranted_operation_is_denied(self):
        with self.assertRaises(AgentContractViolation):
            AgentContractEngine.authorize(
                AgentRole.ORCHESTRATOR,
                "github.delete_repository",
            )


class IdempotencyTests(unittest.TestCase):
    def test_duplicate_operation_id_returns_same_result_without_reexecution(self):
        adapter = MockToolAdapter()
        first = adapter.execute(
            "RUN-1:create-branch",
            "github.create_branch",
            {"branch": "feature/a"},
        )
        second = adapter.execute(
            "RUN-1:create-branch",
            "github.create_branch",
            {"branch": "feature/a"},
        )
        self.assertIs(first, second)
        self.assertEqual(len(adapter.executed), 1)

    def test_operation_id_cannot_be_reused_for_different_request(self):
        adapter = MockToolAdapter()
        adapter.execute(
            "RUN-1:commit",
            "github.commit_feature_branch",
            {"branch": "feature/a"},
        )
        with self.assertRaises(PolicyViolation):
            adapter.execute(
                "RUN-1:commit",
                "github.commit_feature_branch",
                {"branch": "feature/b"},
            )

    def test_adapter_blocks_commit_to_main(self):
        adapter = MockToolAdapter()
        with self.assertRaises(PolicyViolation):
            adapter.execute(
                "RUN-2:commit",
                "github.commit_feature_branch",
                {"branch": "main"},
            )


class WorkflowTests(unittest.TestCase):
    def test_cannot_skip_qa_gate(self):
        job = Job("RUN-1", "GJM-1", "feature")
        job.state = WorkflowState.CODE_COMPLETE
        with self.assertRaises(WorkflowViolation):
            WorkflowEngine.transition(job, WorkflowState.REVIEW)

    def test_review_requires_qa_pass(self):
        job = Job("RUN-2", "GJM-2", "feature")
        job.state = WorkflowState.VALIDATION
        with self.assertRaises(WorkflowViolation):
            WorkflowEngine.transition(job, WorkflowState.REVIEW)
        job.qa_pass = True
        WorkflowEngine.transition(job, WorkflowState.REVIEW)
        self.assertEqual(job.state, WorkflowState.REVIEW)

    def test_ready_to_merge_requires_ci_and_human_approval(self):
        job = Job("RUN-3", "GJM-3", "feature")
        job.state = WorkflowState.REVIEW
        job.qa_pass = True
        with self.assertRaises(WorkflowViolation):
            WorkflowEngine.transition(job, WorkflowState.READY_TO_MERGE)
        job.ci_pass = True
        with self.assertRaises(WorkflowViolation):
            WorkflowEngine.transition(job, WorkflowState.READY_TO_MERGE)
        job.human_merge_approved = True
        WorkflowEngine.transition(job, WorkflowState.READY_TO_MERGE)
        self.assertEqual(job.state, WorkflowState.READY_TO_MERGE)

    def test_done_requires_merge_and_qa(self):
        job = Job("RUN-4", "GJM-4", "feature")
        job.state = WorkflowState.READY_TO_MERGE
        job.qa_pass = True
        with self.assertRaises(WorkflowViolation):
            WorkflowEngine.transition(job, WorkflowState.DONE)
        job.merged_or_closed = True
        WorkflowEngine.transition(job, WorkflowState.DONE)
        self.assertEqual(job.state, WorkflowState.DONE)

    def test_blocked_job_can_resume_to_previous_state(self):
        job = Job("RUN-5", "GJM-5", "feature", state=WorkflowState.IN_PROGRESS)
        WorkflowEngine.transition(job, WorkflowState.BLOCKED)
        self.assertEqual(job.previous_state, WorkflowState.IN_PROGRESS)
        WorkflowEngine.resume(job)
        self.assertEqual(job.state, WorkflowState.IN_PROGRESS)
        self.assertIsNone(job.previous_state)


class ReconciliationTests(unittest.TestCase):
    def test_pr_opened_maps_to_in_progress(self):
        decision = ReconciliationLedger().process(
            ReconciliationEvent("evt-1", ReconciliationEventType.PR_OPENED),
            ReconciliationEvidence(),
        )
        self.assertEqual(decision.desired_status, JiraStatus.IN_PROGRESS)

    def test_ci_failure_stays_in_progress_and_sets_blocked_label(self):
        decision = ReconciliationLedger().process(
            ReconciliationEvent("evt-2", ReconciliationEventType.CI_FAILED),
            ReconciliationEvidence(ci_pass=False),
        )
        self.assertEqual(decision.desired_status, JiraStatus.IN_PROGRESS)
        self.assertTrue(decision.blocked)
        self.assertIn("ci-blocked", decision.add_labels)

    def test_ci_pass_clears_block_but_does_not_advance_to_review(self):
        decision = ReconciliationLedger().process(
            ReconciliationEvent("evt-3", ReconciliationEventType.CI_PASSED),
            ReconciliationEvidence(ci_pass=True),
        )
        self.assertEqual(decision.desired_status, JiraStatus.IN_PROGRESS)
        self.assertIn("ci-blocked", decision.remove_labels)

    def test_pr_ready_requires_ci_and_qa(self):
        ledger = ReconciliationLedger()
        held = ledger.process(
            ReconciliationEvent("evt-4", ReconciliationEventType.PR_READY),
            ReconciliationEvidence(ci_pass=True, qa_pass=False),
        )
        self.assertIsNone(held.desired_status)

        ready = ledger.process(
            ReconciliationEvent("evt-5", ReconciliationEventType.PR_READY),
            ReconciliationEvidence(ci_pass=True, qa_pass=True),
        )
        self.assertEqual(ready.desired_status, JiraStatus.IN_REVIEW)

    def test_merge_requires_ci_qa_and_human_approval(self):
        ledger = ReconciliationLedger()
        held = ledger.process(
            ReconciliationEvent("evt-6", ReconciliationEventType.PR_MERGED),
            ReconciliationEvidence(ci_pass=True, qa_pass=True, human_merge_approved=False),
        )
        self.assertIsNone(held.desired_status)
        self.assertTrue(held.requires_human_approval)

        done = ledger.process(
            ReconciliationEvent("evt-7", ReconciliationEventType.PR_MERGED),
            ReconciliationEvidence(ci_pass=True, qa_pass=True, human_merge_approved=True),
        )
        self.assertEqual(done.desired_status, JiraStatus.DONE)

    def test_event_processing_is_idempotent(self):
        ledger = ReconciliationLedger()
        event = ReconciliationEvent("evt-8", ReconciliationEventType.CI_PASSED)
        evidence = ReconciliationEvidence(ci_pass=True)
        first = ledger.process(event, evidence)
        second = ledger.process(event, evidence)
        self.assertIs(first, second)

    def test_event_id_cannot_be_reused_with_different_evidence(self):
        ledger = ReconciliationLedger()
        event = ReconciliationEvent("evt-9", ReconciliationEventType.PR_READY)
        ledger.process(event, ReconciliationEvidence(ci_pass=True, qa_pass=False))
        with self.assertRaises(ReconciliationViolation):
            ledger.process(event, ReconciliationEvidence(ci_pass=True, qa_pass=True))

    def test_failure_recovery_sequence(self):
        ledger = ReconciliationLedger()

        opened = ledger.process(
            ReconciliationEvent("seq-1", ReconciliationEventType.PR_OPENED),
            ReconciliationEvidence(),
        )
        self.assertEqual(opened.desired_status, JiraStatus.IN_PROGRESS)

        failed = ledger.process(
            ReconciliationEvent("seq-2", ReconciliationEventType.CI_FAILED),
            ReconciliationEvidence(),
        )
        self.assertEqual(failed.desired_status, JiraStatus.IN_PROGRESS)
        self.assertTrue(failed.blocked)
        self.assertIn("ci-blocked", failed.add_labels)

        recovered = ledger.process(
            ReconciliationEvent("seq-3", ReconciliationEventType.CI_PASSED),
            ReconciliationEvidence(ci_pass=True),
        )
        self.assertEqual(recovered.desired_status, JiraStatus.IN_PROGRESS)
        self.assertIn("ci-blocked", recovered.remove_labels)

        review = ledger.process(
            ReconciliationEvent("seq-4", ReconciliationEventType.PR_READY),
            ReconciliationEvidence(ci_pass=True, qa_pass=True),
        )
        self.assertEqual(review.desired_status, JiraStatus.IN_REVIEW)

        held = ledger.process(
            ReconciliationEvent("seq-5", ReconciliationEventType.PR_MERGED),
            ReconciliationEvidence(ci_pass=True, qa_pass=True, human_merge_approved=False),
        )
        self.assertIsNone(held.desired_status)

        done = ledger.process(
            ReconciliationEvent("seq-6", ReconciliationEventType.PR_MERGED),
            ReconciliationEvidence(ci_pass=True, qa_pass=True, human_merge_approved=True),
        )
        self.assertEqual(done.desired_status, JiraStatus.DONE)


class OrchestratorTests(unittest.TestCase):
    def test_plan_uses_all_four_roles(self):
        plan = Orchestrator.build_feature_plan("add observability")
        agents = {step["agent"] for step in plan}
        self.assertEqual(
            agents,
            {"project_manager", "software_engineer", "qa_validator", "orchestrator"},
        )


if __name__ == "__main__":
    unittest.main()
