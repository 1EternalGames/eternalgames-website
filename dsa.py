import os

updates = {
    "components/content/TableOfContents.module.css": """
/* --- Light Mode Overrides --- */
:global([data-theme="light"]) .tocContainer {
  background-color: #ffffff;
  border-color: var(--border-color);
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .listWrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
""",
    "components/CreatorCredit.module.css": """
/* --- Light Mode Overrides --- */
:global([data-theme="light"]) .creditCapsule {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0,0,0,0.1);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .creditCapsule :global(span),
:global([data-theme="light"]) .creatorLink {
  color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
  color: #fff;
  background-color: var(--accent);
}
/* Hover states for Light Mode */
:global([data-theme="light"]) .creditCapsule:hover {
  background-color: var(--accent);
  color: #fff;
}
:global([data-theme="light"]) .creditCapsule:hover .creatorLink,
:global([data-theme="light"]) .creditCapsule:hover :global(span) {
  color: #000;
}
:global([data-theme="light"]) .creditCapsule:hover .capsuleIcon {
  background-color: #000;
  color: var(--accent);
}
/* No-glass overrides */
:global([data-theme="light"] body.no-glass) .creditCapsule {
  background-color: rgba(255, 255, 255, 0.95) !important;
}
""",
    "components/ArticleCard.module.css": """
/* --- Light Mode Overrides --- */
:global([data-theme="light"]) .titleOverlay {
  background: linear-gradient(to top, rgba(255,255,255,0.98) 25%, rgba(255,255,255,0.7) 65%, transparent 100%);
}
:global([data-theme="light"]) .cardTitle {
  color: #1F2937;
  text-shadow: 0 2px 15px rgba(255,255,255,0.9);
}
:global([data-theme="light"]) .dateReadout {
  color: rgba(0,0,0,0.7);
}
:global([data-theme="light"]) .techDot {
  background-color: rgba(0,0,0,0.2);
}
/* Flying Tags in Light Mode */
:global([data-theme="light"]) .satelliteShardLink {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--accent);
  color: var(--text-primary);
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}
:global([data-theme="light"]) .satelliteShardLink:hover {
  background-color: var(--accent);
  color: #fff;
}
:global([data-theme="light"] body.no-glass) .satelliteShardLink {
  background: #fff !important;
}
/* Capsule Overrides inherit from CreatorCredit logic but defined locally here too */
:global([data-theme="light"]) .creditCapsule {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0,0,0,0.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .creditCapsule :global(span) {
  color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
  color: #fff;
}
:global([data-theme="light"]) .creditCapsule:hover :global(span) {
  color: #000;
}
:global([data-theme="light"]) .creditCapsule:hover .capsuleIcon {
  background-color: #000;
  color: var(--accent);
}
""",
    "components/news/NewsGridCard.module.css": """
/* --- Light Mode Overrides --- */
:global([data-theme="light"]) .imageBadge {
  background-color: rgba(255, 255, 255, 0.85);
  border-color: rgba(0,0,0,0.05);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  color: var(--text-primary);
}
:global([data-theme="light"] body.no-glass) .imageBadge {
  background-color: rgba(255, 255, 255, 0.95) !important;
}
:global([data-theme="light"]) a.creatorCapsule,
:global([data-theme="light"]) div.creatorCapsule {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0,0,0,0.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .creatorCapsule :global(span) {
  color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
  color: #fff;
}
:global([data-theme="light"]) .satelliteShardLink {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--accent);
  color: var(--text-primary);
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}
:global([data-theme="light"]) .satelliteShardLink:hover {
  background-color: var(--accent);
  color: #fff;
}
:global([data-theme="light"] body.no-glass) .satelliteShardLink {
  background: #fff !important;
}
:global([data-theme="light"]) .techDot {
  background-color: rgba(0,0,0,0.2);
}
""",
    "components/TimelineCard.module.css": """
/* --- Light Mode Overrides --- */
:global([data-theme="light"]) .cardBody {
  background: linear-gradient(180deg, var(--bg-secondary) 0%, #f3f4f6 100%);
}
:global([data-theme="light"]) .statusBadge.upcoming {
  background-color: rgba(255, 255, 255, 0.85);
  border-color: rgba(0,0,0,0.1);
}
:global([data-theme="light"]) .creditCapsule {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0,0,0,0.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .creditCapsule :global(span) {
  color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
  color: #fff;
}
:global([data-theme="light"]) .shardPill,
:global([data-theme="light"]) .genrePill,
:global([data-theme="light"]) .playButtonContainer {
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--text-primary);
  border-color: var(--accent);
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .shardPill {
  color: var(--accent);
}
:global([data-theme="light"]) .genrePill {
  color: var(--accent);
}
/* Ensure dark text on golden status pills for readability */
:global([data-theme="light"]) .statusPill.golden { color: #854D0E; border-color: #EAB308; }
:global([data-theme="light"]) .devPill {
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--accent);
}
:global([data-theme="light"]) .techDot {
  background-color: rgba(0,0,0,0.2);
}
""",
    "components/KineticReleaseTimeline.module.css": """
/* --- Light Mode Overrides --- */
:global([data-theme="light"]) .synopsisContainer {
  background-color: rgba(255, 255, 255, 0.75);
  border-color: rgba(0,0,0,0.05);
  color: var(--text-primary);
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
  backdrop-filter: blur(12px);
}
:global([data-theme="light"]) .dotBase {
  background-color: rgba(0,0,0,0.1);
}
:global([data-theme="light"]) .timelineSpineTrack {
  background-color: rgba(0,0,0,0.05);
}
""",
    "components/TagLinks.module.css": """
/* --- Light Mode Overrides --- */
:global([data-theme="light"]) .tagLink {
  background-color: rgba(0, 255, 240, 0.1);
  color: #008F86; /* Darker Cyan for better contrast on white */
  border: 1px solid rgba(0, 255, 240, 0.3);
  box-shadow: none;
}
:global([data-theme="light"]) .tagLink:hover {
  background-color: var(--accent);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 255, 240, 0.3);
}
"""
}

for file_path, css_content in updates.items():
    if os.path.exists(file_path):
        # Check if we already appended this to avoid duplication on multiple runs
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if "/* --- Light Mode Overrides --- */" not in content:
            with open(file_path, "a", encoding="utf-8") as f:
                f.write(css_content)
            print(f"Updated {file_path}")
        else:
            print(f"Skipped {file_path} (Already updated)")
    else:
        print(f"Warning: {file_path} not found.")