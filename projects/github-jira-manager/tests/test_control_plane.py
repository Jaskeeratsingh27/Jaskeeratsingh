import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from control_plane import (  # noqa: E402
    Approval,
    ApprovalLevel,
    Job,
    MockToolAdapter,
    Orchestrator,
    PolicyEngine,
    PolicyViolation,
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
