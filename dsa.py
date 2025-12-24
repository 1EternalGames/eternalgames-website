import os

fixes = {
    # 1. Timeline Credits (Homepage & Releases Page)
    "components/releases/ReleasesCredits.module.css": """
/* --- Light Mode Overrides (No Black) --- */
:global([data-theme="light"]) .creditsCapsule {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .creatorName,
:global([data-theme="light"]) .label,
:global([data-theme="light"]) .separator,
:global([data-theme="light"]) .creatorLink {
    color: var(--text-primary);
}
:global([data-theme="light"]) .capsuleIcon {
    background-color: var(--accent);
    color: #fff;
}

/* Hover State */
:global([data-theme="light"]) .creditsCapsule:hover {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
    box-shadow: 0 5px 20px color-mix(in srgb, var(--accent) 40%, transparent);
}
:global([data-theme="light"]) .creditsCapsule:hover .creatorName,
:global([data-theme="light"]) .creditsCapsule:hover .label,
:global([data-theme="light"]) .creditsCapsule:hover .separator,
:global([data-theme="light"]) .creditsCapsule:hover .creatorLink {
    color: #fff !important;
}
:global([data-theme="light"]) .creditsCapsule:hover .capsuleIcon {
    background-color: #fff !important;
    color: var(--accent) !important;
}
""",

    # 2. Timeline Card Buttons (Wishlist, Status Badge, Play Button)
    "components/TimelineCard.module.css": """
/* --- Light Mode Overrides (No Black) --- */

/* Status Badge (Released/Upcoming Circle) */
:global([data-theme="light"]) .statusBadge {
    background-color: rgba(255, 255, 255, 0.95) !important;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
:global([data-theme="light"]) .statusBadge.released {
    color: var(--accent);
    border-color: var(--accent);
}
:global([data-theme="light"]) .statusBadge.upcoming {
    color: var(--text-secondary);
}

/* Wishlist Button */
:global([data-theme="light"]) .wishlistButton {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: var(--accent);
    color: var(--accent) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
}
:global([data-theme="light"]) .wishlistButton:hover {
    background-color: var(--accent) !important;
    color: #fff !important;
    transform: scale(1.1);
}

/* Play Button (Video Overlay Trigger) */
:global([data-theme="light"]) .playButtonContainer {
    background-color: rgba(255, 255, 255, 0.95) !important;
    border-color: var(--accent);
    color: var(--text-primary);
}
:global([data-theme="light"]) .playButtonContainer:hover {
    background-color: var(--accent) !important;
    color: #fff !important;
}
""",

    # 3. Admin Pin Button
    "components/releases/AdminPinButton.module.css": """
/* --- Light Mode Overrides (No Black) --- */
:global([data-theme="light"]) .pinButton {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
:global([data-theme="light"]) .pinButton:hover,
:global([data-theme="light"]) .pinButton.pinned {
    background-color: var(--accent) !important;
    color: #fff !important;
    border-color: var(--accent);
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