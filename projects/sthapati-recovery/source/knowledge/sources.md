# sources.md — Sthapati research record

> **Owns:** external evidence used by Sthapati's platform, prompting, evaluation and agent-reliability claims. Other files may summarize these claims but must not silently strengthen them.
>
> Checked: 2026-09-25. Prefer primary/official sources. Historical connector observations are explicitly separated from currently re-verified claims.

| ID | Claim supported | Source | Evidence status |
|---|---|---|---|
| S1 | MAST-Data contains 1,600+ annotated traces across 7 MAS frameworks; MAST has 14 failure modes in 3 categories and κ=0.88 human agreement. | NeurIPS 2025 proceedings, *Why Do Multi-Agent LLM Systems Fail?* — https://papers.nips.cc/paper_files/paper/2025/hash/b1041e52d3be19f0a9bc491657488e4a-Abstract-Datasets_and_Benchmarks_Track.html | `[verified]` primary proceedings page |
| S2 | The MAST intervention study reports maximum improvements of 15.6% with the same underlying model, while noting that simple interventions do not resolve all failures. | OpenReview paper, *Why Do Multi-Agent LLM Systems Fail?* — https://openreview.net/pdf?id=fAjbYBmonr | `[verified]` primary paper |
| S3 | OWASP released the Top 10 for Agentic Applications for 2026 in December 2025. | OWASP GenAI Security Project — https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ | `[verified]` official OWASP |
| S4 | Anthropic recommends clear/right-altitude prompts, minimal high-signal context, and starting with a minimal prompt on the best model before adding instructions/examples from observed failures. | Anthropic Engineering, *Effective context engineering for AI agents* (2025-09-29) — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | `[verified]` first-party |
| S5 | Claude Projects support project knowledge and project instructions; knowledge near the context limit can automatically switch to RAG and expand capacity. | Anthropic Help — https://support.anthropic.com/en/articles/9519177-how-can-i-create-and-manage-projects and https://support.anthropic.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects | `[verified]` first-party |
| S6 | Google Drive MCP `create_file` supports `disableConversionToGoogleType`; setting it true preserves the supplied MIME type instead of converting to a Google-native type. | Google Workspace Drive MCP reference — https://developers.google.com/workspace/drive/api/reference/mcp/tools_list/create_file | `[verified]` first-party Google |
| S7 | Claude Projects currently support 30 MB per project-knowledge file; chat uploads support up to 20 files per chat; RAG for Projects is limited to paid plans and can expand project knowledge capacity up to 10x. | Anthropic Help — https://support.anthropic.com/en/articles/8241126-what-kinds-of-documents-can-i-upload-to-claude-ai and https://support.anthropic.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects | `[verified]` first-party |
| S8 | The uploaded Sthapati bundle records that the Claude/Drive connector available on 2026-09-20 could not edit existing file content and used create-only ledger records. | Original Sthapati source bundle, `run-ledger.md` and `SETUP.md`, supplied 2026-09-25 | `[historical evidence]` not independently re-verified against the current Claude connector; the deployment round-trip remains mandatory |

## Limits and unresolved items

- The worked example's exact statement that “~37% of failures are inter-agent” should be treated as a historical summary of the MAST prevalence table, not a universal prior for hand-built systems.
- The worked example's statement that NIST AI RMF, ISO 42001 and the EU AI Act contain no reference to “agent” or “agentic” was not independently re-verified in this recovery pass. It is non-core example context and should not be promoted into a current platform rule without source-by-source checking.
- Claude-specific Google Drive connector capabilities can differ from Google's public Drive MCP surface. Run the ledger round-trip in the actual deployment environment before relying on create/update semantics.

## Claim map

- `worked-build.md`: MAST dataset/taxonomy and intervention claims → S1, S2; OWASP Agentic Top 10 → S3. The NIST/ISO/EU keyword statement is tracked as unresolved below.
- `instruction-craft.md` and `test-pack.md`: Anthropic minimal/right-altitude/evaluation guidance → S4.
- `project-anatomy.md`: Claude Project knowledge/instructions, file limits and RAG behavior → S5, S7.
- `run-ledger.md` and `SETUP.md`: file-format preservation via `disableConversionToGoogleType` → S6; Claude-specific create/update ledger behavior → S8 historical evidence pending deployment re-test.
