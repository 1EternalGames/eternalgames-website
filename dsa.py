import os

# Define the CSS patches to remove black backgrounds and fix hover states in Light Mode
fixes = {
    "components/ArticleCard.module.css": """
/* --- Light Mode Fixes (No Black) --- */
:global([data-theme="light"]) .creditCapsule {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
}
:global([data-theme="light"]) .creditCapsule :global(span),
:global([data-theme="light"]) .creatorName {
    color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
    background-color: var(--accent);
    color: #fff;
}
/* Hover: Capsule becomes Accent, Icon Circle becomes WHITE */
:global([data-theme="light"]) .livingCardWrapper:hover .creditCapsule,
:global([data-theme="light"]) .livingCardWrapper.activeState .creditCapsule {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
}
:global([data-theme="light"]) .livingCardWrapper:hover .creditCapsule :global(span),
:global([data-theme="light"]) .livingCardWrapper.activeState .creditCapsule :global(span),
:global([data-theme="light"]) .livingCardWrapper:hover .creatorName,
:global([data-theme="light"]) .livingCardWrapper.activeState .creatorName {
    color: #fff !important;
}
:global([data-theme="light"]) .livingCardWrapper:hover .capsuleIcon,
:global([data-theme="light"]) .livingCardWrapper.activeState .capsuleIcon {
    background-color: #ffffff !important;
    color: var(--accent) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
""",

    "components/news/NewsGridCard.module.css": """
/* --- Light Mode Fixes (No Black) --- */
:global([data-theme="light"]) a.creatorCapsule,
:global([data-theme="light"]) div.creatorCapsule {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
}
:global([data-theme="light"]) .creatorCapsule :global(span) {
    color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
    background-color: var(--accent);
    color: #fff;
}
/* Hover: Capsule becomes Accent, Icon Circle becomes WHITE */
:global([data-theme="light"]) .cardContainer:hover a.creatorCapsule,
:global([data-theme="light"]) .cardContainer.activeState a.creatorCapsule {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
}
:global([data-theme="light"]) .cardContainer:hover .creatorCapsule :global(span),
:global([data-theme="light"]) .cardContainer.activeState .creatorCapsule :global(span) {
    color: #fff !important;
}
:global([data-theme="light"]) .cardContainer:hover .capsuleIcon,
:global([data-theme="light"]) .cardContainer.activeState .capsuleIcon {
    background-color: #ffffff !important;
    color: var(--accent) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
""",

    "components/CreatorCredit.module.css": """
/* --- Light Mode Fixes (No Black) --- */
:global([data-theme="light"]) .creditCapsule {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 0, 0, 0.1);
}
:global([data-theme="light"]) .creatorName,
:global([data-theme="light"]) .creatorLink,
:global([data-theme="light"]) .separator {
    color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
    background-color: var(--accent);
    color: #fff;
}
/* Hover: Capsule becomes Accent, Icon Circle becomes WHITE */
:global([data-theme="light"]) .creditCapsule:hover {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
}
:global([data-theme="light"]) .creditCapsule:hover .creatorName,
:global([data-theme="light"]) .creditCapsule:hover .creatorLink,
:global([data-theme="light"]) .creditCapsule:hover .separator {
    color: #fff !important;
}
:global([data-theme="light"]) .creditCapsule:hover .capsuleIcon {
    background-color: #ffffff !important;
    color: var(--accent) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
""",

    "components/TimelineCard.module.css": """
/* --- Light Mode Fixes (No Black) --- */
/* Credits in Timeline */
:global([data-theme="light"]) .creditCapsule {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 0, 0, 0.1);
}
:global([data-theme="light"]) .creditCapsule :global(span) {
    color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
    background-color: var(--accent);
    color: #fff;
}
/* Hover Logic for Timeline Credits */
:global([data-theme="light"]) .capsuleWrapper:hover .creditCapsule {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
}
:global([data-theme="light"]) .capsuleWrapper:hover .creditCapsule :global(span) {
    color: #fff !important;
}
:global([data-theme="light"]) .capsuleWrapper:hover .capsuleIcon {
    background-color: #ffffff !important;
    color: var(--accent) !important;
}

/* Flying Tags (Platforms, Genres, Status) */
:global([data-theme="light"]) .platformTagBase.flying,
:global([data-theme="light"]) .genrePill,
:global([data-theme="light"]) .shardPill,
:global([data-theme="light"]) .devPill {
    background-color: rgba(255, 255, 255, 0.95) !important;
    border: 1px solid var(--accent);
    color: var(--text-primary) !important;
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
}

/* Hover States for Flying Tags */
:global([data-theme="light"]) .genrePill:hover,
:global([data-theme="light"]) .shardPill.interactive:hover {
    background-color: var(--accent) !important;
    color: #fff !important;
    border-color: var(--accent) !important;
}

/* Ensure Price Pill text is visible */
:global([data-theme="light"]) .pricePill {
    color: #F59E0B !important; /* Gold text */
    border-color: #F59E0B !important;
    background-color: rgba(255,255,255,0.95) !important;
}
"""
}

for file_path, css_content in fixes.items():
    if os.path.exists(file_path):
        with open(file_path, "a", encoding="utf-8") as f:
            f.write(css_content)
        print(f"Patched {file_path}")
    else:
        print(f"Error: {file_path} not found.")