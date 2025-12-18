import os

css_files = [
    "components/ArticleCard.module.css",
    "components/TimelineCard.module.css",
    "components/news/NewsGridCard.module.css",
    "components/HorizontalShowcase.module.css"
]

# This patch disables heavy GPU effects: Filters, Box Shadows, and Pseudo-elements
css_patch = """
/* ULTRA PERFORMANCE PATCH */
.noCornerAnimation .monolithFrame::before,
.noCornerAnimation .newsCard::before,
.noCornerAnimation .timelineCard::before {
    display: none !important;
}

.noCornerAnimation,
.noCornerAnimation * {
    backdrop-filter: none !important;
    box-shadow: none !important;
    transform-style: flat !important; /* Kill 3D context */
    will-change: auto !important; /* Release GPU memory */
}

.noCornerAnimation .imageBadge,
.noCornerAnimation .creatorCapsule,
.noCornerAnimation .playButtonContainer {
    background-color: #000 !important; /* Fallback for glassmorphism */
    border: 1px solid #333 !important;
}
"""

for file_path in css_files:
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            content = f.read()
        
        # Only append if not already there
        if "ULTRA PERFORMANCE PATCH" not in content:
            with open(file_path, "a") as f:
                f.write(css_patch)
            print(f"🚀 Optimized: {file_path}")
        else:
            print(f"✅ Already Optimized: {file_path}")