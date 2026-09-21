# Migration notes

The source Claude Project referenced `secondbrain-tool-reference.txt`, `agent_index.json`, and existing vault notes, but those dependencies are not present in the `chats-and-projects.zip` archive.

Therefore this migrated skill must not claim parser compatibility, existing-tag knowledge, or existing-note knowledge unless those files/vault contents are supplied in the active environment. The skill definition itself is canonical in GitHub; the user's actual Obsidian vault remains the knowledge source for note existence, tags, wikilinks, and PARA placement.
