# Toqan transcript analyzer — recovered architecture snapshot

Evidence level: historical persistent-memory summary; platform capabilities may have changed and must be re-verified before implementation.

Purpose: decompose one large transcript-processing agent into focused stages for segmentation, sentiment, entity extraction, and intent detection.

Historical architecture: agents processed transcript chunks and handed structured JSON between stages; database persistence, where used, was mediated by the platform's backend/app layer rather than assumed to be directly available to sandboxed agents.

Migration treatment: preserve the decomposition/contract pattern, not the historical platform claims. Re-check current Toqan APIs, connection model, and database permissions before any rebuild.
