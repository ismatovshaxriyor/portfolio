import re

with open('/Users/shaxriyorismatov/Desktop/Personal Projects/portfolio/fronted/src/index.css', 'r') as f:
    css = f.read()

# 1. Remove box-shadow from transitions
css = re.sub(r',\s*box-shadow [^,;]+', '', css)
css = re.sub(r'box-shadow [^,;]+,\s*', '', css)

# Fix roadmap-node transition which might have dangling commas
css = re.sub(r'transition: (.*?),\s*background-color', r'transition: \1, background-color', css)

# 2. Add will-change and transform: translateZ(0) to main animated elements
elements_to_accelerate = ['.project-card', '.skill-panel', '.skill-logo-pill', '.roadmap-card', '.roadmap-node', '.about-card', '.skill-item']
for el in elements_to_accelerate:
    # Look for the block definition
    # We will insert will-change and backface-visibility inside if not present
    block_pattern = re.compile(re.escape(el) + r'\s*{([^}]*)}')
    match = block_pattern.search(css)
    if match:
        block_content = match.group(1)
        if 'will-change' not in block_content:
            new_content = block_content + '\n  will-change: transform, opacity;\n  transform: translateZ(0);\n  backface-visibility: hidden;'
            css = css.replace(match.group(0), f"{el} {{{new_content}}}")

# 3. width transition -> transform scaleX for .roadmap-core-progress-fill
css = css.replace('transition: width 360ms cubic-bezier(0.16, 1, 0.3, 1);', 
                  'transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);\n  transform-origin: left;\n  will-change: transform;\n  width: 100%;\n  transform: scaleX(var(--progress-scale, 0));')
# But in React, we need to pass `--progress-scale` instead of `width`! Wait, if I change the CSS to expect a variable, I must update the TSX files as well.
# Let's check where width is set inline.

# 4. Remove filter: blur()
css = css.replace('filter: blur(1.3px);', '/* filter: blur removed for perf */')
css = css.replace('filter: blur(1.8px);', '/* filter: blur removed for perf */')
css = css.replace('filter: blur(0.45px);', '/* filter removed */')
css = css.replace('filter: blur(0);', '/* filter removed */')
css = css.replace('transition: filter 240ms ease, opacity 240ms ease, transform 240ms ease;', 'transition: opacity 240ms ease, transform 240ms ease;')

with open('/Users/shaxriyorismatov/Desktop/Personal Projects/portfolio/fronted/src/index.css', 'w') as f:
    f.write(css)

print("Optimizations applied to index.css")
