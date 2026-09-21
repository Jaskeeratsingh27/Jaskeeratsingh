---
name: Obsidian Academic Note-Taking System
description: Build a scalable personal knowledge repository for faster research, writing, and idea generation using atomic notes and topic-based organization
use_when: Starting academic research, managing large paper collections, writing papers faster, organizing knowledge for long-term use
trigger_with: "PhD/thesis research → Personal knowledge system → Note-taking workflow → Paper writing"
source: https://youtu.be/S_-uD3GtFno
generated_by: skill-brain v0.1.0 (Claude primary extraction)
model_agreement: High confidence (single model extraction)
difficulty: intermediate
---

# Obsidian Academic Note-Taking System

## Overview

Extracted from a comprehensive tutorial on building a personal Wikipedia-like knowledge system using Obsidian for academic research, paper writing, and faster learning.

This skill teaches the **fundamental mindset shift** from sequential note-taking (summaries, highlights) to **topic-based, atomic note-taking** that scales with your research over years.

**Key Result**: Finish PhD 5 months ahead of schedule with 4 first-author papers written, plus a searchable knowledge network of all research.

## Step-by-Step Process

### 1. ☐ Understand Why You Need a Strategy (Not Just Hard Work)
   - **Description**: Shift from grinding (78% of PhD students work >40hrs) to strategic knowledge organization
   - **Steps**:
     1. Study how Wikipedia organizes knowledge (concepts, links, citations—NOT summaries)
     2. Recognize that "more work" ≠ "better research"
     3. Accept that knowledge management is as important as domain expertise
     4. Commit to building a scalable system from day one
   - **Success criteria**: You understand why atomic notes + topic organization beats summarization
   - *Source: 00:00-04:33*

### 2. ☐ Set Up Obsidian with Folder Structure
   - **Description**: Create a vault with organized folders that will scale to hundreds of notes
   - **Steps**:
     1. Create `/sources` folder (for paper notes + PDFs)
     2. Create `/notes` folder (for topic notes)
     3. Create `/support` folder (for images, embeds, assets)
     4. Enable the "Editing Toolbar" plugin (easier formatting than raw markdown)
     5. Install "PDF++" plugin (for better PDF annotation linking)
   - **Success criteria**: Vault is organized, plugins installed, ready for first paper
   - *Source: 05:27-13:25*

### 3. ☐ Create Source Notes for Each Paper/Source
   - **Description**: Build immutable anchor notes that link to the actual source material
   - **Steps**:
     1. Create one note per paper (e.g., "Vanvic 2020")
     2. Add YAML frontmatter with: author, journal, title, tags
     3. Link properties to existing author/journal notes (creates backlinks)
     4. Embed or link to the PDF in `/support` folder
     5. Add a formatted title link + PDF link at top for quick access
     6. Extract key figures/screenshots relevant to your research
   - **Success criteria**: Each source note links to PDF, has properties, and can be queried in databases
   - *Source: 12:56-16:22*

### 4. ☐ Master Obsidian Databases (Bases)
   - **Description**: Use database queries to organize and filter notes like Excel spreadsheets
   - **Steps**:
     1. Create a "papers" database that queries `/sources` folder
     2. Add columns: author, journal, title, year, rating, tags
     3. Set filters (e.g., "only papers from 2024")
     4. Use preview feature (Cmd+hover) to quickly check papers
     5. Create multiple database views (reading list, foundational works, by year)
   - **Success criteria**: Can filter papers by any property; database replaces Zotero/citation manager
   - *Source: 16:22-21:06*

### 5. ☐ Execute the Mindset Shift: Atomic Topic Notes (Not Summaries)
   - **Description**: This is the core insight—extract claims into topic notes instead of writing summaries
   - **Steps**:
     1. **Read a source** and identify high-level topics it discusses
     2. **Create/find a topic note** (e.g., "Biodiversity" or "Climate Change Impacts")
     3. **Extract ONE claim** from the source as a short atomic sentence
     4. **Link back to source** using double brackets `[[Vanvic 2020]]`
     5. **Optional: Add PDF link** to the exact paragraph for verification
     6. Repeat for each claim across all topics in the paper
   - **Success criteria**: 
     - Each claim is a standalone sentence (atomic)
     - Every claim links to its source for verification
     - Topic notes contain 5-20 claims over time (not 50+ summaries)
   - *Source: 21:06-24:00*

### 6. ☐ Implement the Three-Type Note System
   - **Description**: Separate source/topic/argument notes to maintain rigor and enable reuse
   - **Steps**:
     1. **Source notes** (`/sources` folder): PDFs, properties, immutable
     2. **Topic notes** (`/notes` folder): Claims extracted from sources, linked back
     3. **Argument notes** (`/notes/arguments` folder): Your own ideas, questions, speculation
   - **Best practice**: 
     - Use callouts for summaries/author intent (so you know what's AI vs. original)
     - Add "in-links" to each claim (links back to source note AND PDF)
     - Keep topic notes updated as your understanding grows
   - **Success criteria**: Clear separation between "what they said," "what I understood," "what I think"
   - *Source: 22:12-35:11*

### 7. ☐ Use the Active Note-Taking Workflow
   - **Description**: Split-view reading + note-taking with stacked tabs for efficiency
   - **Steps**:
     1. Open source (PDF or web article) on the **left side**
     2. Open multiple topic notes as stacked tabs on the **right side**
     3. Read a passage → highlight on left
     4. Create/update relevant topic note on right with atomic claim
     5. Copy-paste link to PDF paragraph (Cmd+Shift+click → "Copy link to selection")
     6. Format link as `[PDF reference](link) - [source note](link)` for dual verification
   - **Pro tip**: Use Obsidian's block linking (^anchor) to link to specific sentences, not whole pages
   - **Success criteria**: Can complete one paper in 30-60 min with 5-10 new/updated topic notes
   - *Source: 38:22-47:03*

### 8. ☐ Harvest Ideas & Write Papers from Your Network
   - **Description**: Atomic notes become building blocks; knowledge network generates ideas automatically
   - **Steps**:
     1. **Use graph view** to visualize connections (topic nodes + source nodes)
     2. **Explore connections** (e.g., Fossil Fuels → Climate Change → Penguins)
     3. **Discover emergent ideas** (e.g., "How do fossil fuel projections impact penguin populations?")
     4. **Reuse atomic notes**: Collect 10-20 related claims from topic note
     5. **Use AI to draft** paragraphs from atomic sentences (they become topic sentences naturally)
     6. **Citations auto-flow**: Atomic notes already link sources, so citations are already there
   - **Success criteria**: Can write a 5-page section in 2-3 hours using atomic notes as building blocks
   - *Source: 47:03-53:43*

## Core Principles

1. **Think Like Wikipedia**: Organize by concepts and links, not by source or chronology
2. **Atomic Over Summary**: Short, reusable sentences beat long summaries (suitcase vs. wardrobe analogy)
3. **Topic-Driven Extraction**: Don't summarize papers—extract claims into your existing topics
4. **Verify Everything**: Every claim must link back to its source for double-checking
5. **Scale Over Time**: The system must work with 100 notes AND 1,000 notes
6. **Separate Layers**: Source (immutable), Topic (interpreted), Argument (your thinking)
7. **Knowledge Farming, Not Hunting**: Plant knowledge early, harvest when ready (not scrambling last-minute)

## Success Criteria

✓ Source notes created for all major papers with PDF links and properties
✓ Topic notes organized by concept, not by source; each claim links to source
✓ Database (base) successfully filters papers by author, journal, year, tags
✓ Can complete one paper in <1 hour with 5-10 new/updated topic notes
✓ Graph view shows interconnected knowledge network (100+ nodes)
✓ Can draft a paragraph using 8-10 atomic sentences from topic notes
✓ All claims are verified with direct PDF/web links
✓ Argument notes separate speculation from sourced claims

## Key Takeaways

- Most PhD students fail because they grind without strategy ("tactics without strategy is noise before defeat")
- Summarizing papers is a trap—you end up with a suitcase, not a wardrobe
- The real work is **extraction and linking**, not writing summaries
- Building the system takes discipline early, but pays off exponentially after 6+ months
- Idea generation is a **side effect** of a well-organized knowledge network (not a brainstorming ritual)
- Topic notes naturally become mini literature reviews as you accumulate claims
- Once you switch to digital atomic notes, you never go back to pen/paper + PDFs

## Common Anti-Patterns to Avoid

❌ **Summarizing papers** → Extract claims into topics instead; let abstracts do the summarizing  
❌ **Folder-based organization** → Organize by concepts/links, not by folder hierarchy  
❌ **One note per paper** → Create topic notes that pull from multiple papers  
❌ **Ignoring source verification** → Always link to specific PDF paragraphs, not just paper names  
❌ **Mixing source + your thinking** → Keep separate: source notes (immutable), argument notes (your ideas)  
❌ **Treating Obsidian as a reader/highlighter** → It's a **knowledge organizer**; read elsewhere, note here  
❌ **Overwhelming yourself with plugins** → Start simple; add plugins only when you hit friction  

## Recommended Patterns

### Pattern: The Three-Folder System
```
/sources
  ├── Vanvic 2020.md (immutable, PDF link + properties)
  ├── Urban 2024.md
  └── [properties: author, journal, year, rating]

/notes
  ├── Biodiversity.md (topic: claims + source links)
  ├── Climate Change.md
  ├── Ecosystem Resilience.md
  └── /arguments
      ├── Research Question: Penguin Population Trends.md
      └── Thesis: How climate impacts species X.md

/support
  ├── figures/ (screenshots from papers)
  └── images/ (any embedded assets)
```

### Pattern: Atomic Sentence Examples
```
✓ "Biodiversity decline reduces ecosystem resilience [in [[Vanvic 2020]]]"
✓ "Climate change effects are non-linear on biological processes [in [[Urban 2024]]]"
✗ "This paper discusses biodiversity and climate change" (too vague)
✗ "The study found many species are declining" (no topic anchor)
```

### Pattern: Dual Linking Strategy
```
Topic note example:
- Biodiversity decline → resilience loss → [PDF link to exact paragraph](link) - [[[Vanvic 2020]]]

This gives you:
1. PDF link to **verify the exact claim** (quick double-check)
2. Source note link to **explore all other topics** this paper discusses
```

### Pattern: Database Views for Different Use Cases
```
View 1: "Reading List" (unread papers filtered by year)
View 2: "Foundational Works" (papers sorted by rating, high-to-low)
View 3: "All Papers" (sortable by author, journal, year)
View 4: "Project-Specific" (only papers relevant to one research project)
```

## Implementation Timeline

| Phase | Timeline | Output |
|-------|----------|--------|
| **Setup** | Week 1 | Vault created, folders set, plugins installed |
| **Learning** | Week 1-2 | First 3-5 papers processed, system feels natural |
| **Scale** | Month 2-3 | 20-30 papers, 50-100 topic notes, database working |
| **Harvest** | Month 6+ | 100+ papers, 500+ claims, idea generation begins |
| **Exponential** | Year 1-2 | 200+ papers, knowledge network becomes indispensable |

## The Metaphor: Knowledge Farming vs. Hunting

**Hunters (most PhD students):**
- Get hungry (deadline arrives)
- Go hunt for papers again
- Re-read, re-learn, re-synthesize
- Exhausting, last-minute scramble

**Farmers (using this system):**
- Plant knowledge early (one claim at a time)
- Water + curate the garden (maintain links, update notes)
- Wait for growth
- Harvest when ready (paper writes itself from atomic notes)
- **The apple was already growing—just pick and bite**

## Obsidian Plugins You'll Need

| Plugin | Why | Optional? |
|--------|-----|-----------|
| **Editing Toolbar** | Easier formatting than markdown | No—use this first |
| **PDF++** | Auto-link PDF highlights; easier annotation | No—worth the setup |
| **Callout Manager** | Organize AI summaries separately from source notes | Yes—nice-to-have |
| **Commander** | Quick access to commands without memorizing shortcuts | Yes—speeds up workflow |

## Quick Reference: Obsidian Syntax You Need

- `[[Note Name]]` — Create a link to another note (or new note)
- `![[Note Name]]` — Embed entire note into current note
- `![[image.png]]` — Embed image
- `![[PDF.pdf#page=5]]` — Link to specific PDF page
- `[Display Text](link)` — External link with custom text
- `^anchor` — Create a blockquote anchor for precise linking
- `---` (top of file) — YAML properties (author, tags, etc.)
- `> [!note]` — Callouts (great for AI-generated summaries)

## Troubleshooting

**Q: My notes are getting disorganized**
A: You're mixing summaries with atomic claims. Create a new topic note instead of adding to existing ones.

**Q: I can't find my notes later**
A: Use databases (bases) to filter by tag/property. Don't rely on folders.

**Q: Linking to PDFs is tedious**
A: Install PDF++ plugin—it automates this for you.

**Q: Should I include my own opinions in topic notes?**
A: No—use **argument notes** for your thinking. Topic notes are purely extracted claims.

## References

**Source Video**: https://youtu.be/S_-uD3GtFno  
**Creator's Blog**: Referenced in video for Obsidian tutorials, bases guides, PDF++ setup  
**Course Mentioned**: 8-hour deep-dive video course on building a complete vault  
**Newsletter**: "Effortless Academic" (mentioned in video)  
**Status**: ✅ READY_TO_INSTALL

## Next Steps

1. **Install Obsidian** (free, open-source)
2. **Create vault** + 3 folders (sources, notes, support)
3. **Install plugins**: Editing Toolbar, PDF++
4. **Read first 2-3 papers** using split-view workflow
5. **Create 3-5 topic notes** with atomic claims
6. **Build your first database** (papers view)
7. **After 10-20 papers**, explore graph view and idea generation

---

**Skill Confidence**: High (extracted from detailed 53-min tutorial with clear methodology)
**Generated**: 2026-08-26
**Format**: Ready for Obsidian implementation
