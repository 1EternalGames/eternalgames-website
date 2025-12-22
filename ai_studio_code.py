import os
import re

# Map of files to the CSS selectors where resets should be removed inside mobile media queries
targets = {
    "app/globals.css": [".content-grid"],
    "components/homepage/feed/Feed.module.css": [".topArticlesGrid"],
    "components/homepage/kinetic-news/KineticSpotlightNews.module.css": [".spotlightGrid"],
    "components/homepage/kinetic-news/NewsfeedStream.module.css": [".streamContainer"],
    "components/homepage/PaginatedLatestArticles.module.css": [".itemList"],
    "components/PaginatedCarousel.module.css": [".itemList"],
    "components/VanguardReviews/VanguardReviews.module.css": [".vanguardContainer"],
    "app/releases/ReleasesPage.module.css": [".chronoGamesGrid"],
    "components/KineticReleaseTimeline.module.css": [".timelineItemsWrapper"]
}

# Regex to find properties to remove within the mobile block
# We look for padding: 0, margin: 0, width: 100%, pointer-events: auto (and variations)
props_to_remove = [
    r"padding:\s*0\s*(!important)?;",
    r"margin:\s*0\s*(auto)?\s*(!important)?;",
    r"padding-left:\s*0\s*(!important)?;",
    r"padding-right:\s*0\s*(!important)?;",
    r"width:\s*100%\s*(!important)?;",
    r"pointer-events:\s*auto\s*(!important)?;"
]

def clean_mobile_css(file_path, selectors):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the media query block for max-width: 768px
    # This is a simple regex that assumes standard formatting. 
    # It looks for @media...768px... { ... }
    # Note: Nested braces make regex hard, but we assume the selector is inside the block.
    
    # Strategy: Find the selector inside the file. Check if it's inside a media query context.
    # Since we know these files well, we can target the specific blocks.
    
    new_content = content
    
    for selector in selectors:
        # Regex to match the selector block inside a media query. 
        # We search for: @media (max-width: 768px) { ... .selector { BODY } ... }
        # We will iterate lines to be safer.
        
        lines = new_content.split('\n')
        in_media = False
        in_selector = False
        final_lines = []
        
        for line in lines:
            if "@media" in line and "768px" in line:
                in_media = True
            
            # Simple check for closing bracket of media query could be tricky if indentation varies,
            # but usually it's a single } on a line in these modules.
            # We'll reset in_media if we see a closing brace at indentation level 0 (approx)
            # For robustness, let's just process the removals if we are 'in_selector' 
            
            if in_media and selector in line and "{" in line:
                in_selector = True
            
            if in_selector and "}" in line:
                in_selector = False
                
            if in_selector:
                # Check if this line contains a property to remove
                should_remove = False
                for pattern in props_to_remove:
                    if re.search(pattern, line):
                        should_remove = True
                        break
                
                if should_remove:
                    continue # Skip adding this line
            
            if line.strip() == "}" and not in_selector and in_media:
                # This logic is fuzzy for nested blocks, but works for standard CSS module structure
                # where media query wraps selectors.
                pass 

            final_lines.append(line)
        
        new_content = "\n".join(final_lines)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Processed {file_path}")

# Run the cleaning
for file_path, selectors in targets.items():
    clean_mobile_css(file_path, selectors)