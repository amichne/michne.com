# Personal Site/Blog

Personal notebook for engineering notes and photography, built with 11ty.

## Setup

```bash
npm install
npm start
```

Site runs at http://localhost:8080

## Features

- Paper and ink themes with a saved preference
- Serif prose, monospace labels, and a repeated tilde mark
- A responsive photo archive
- Markdown content with camera metadata for photos
- A section index and reading position for posts
- Code copy with manual selection when clipboard access fails

## Structure

- `src/posts/` - Blog posts in markdown
- `src/photos/` - Photo posts with metadata
- `src/_includes/` - Layout templates
- `src/css/` - Styles
- `src/js/site.js` - Theme control, code copy, section index, and photo selection

## Adding Content

### Blog Post

Create `src/posts/YYYY-MM-DD-slug.md`:

```markdown
---
title: "Post Title"
date: 2025-01-15
tags: ["tag1", "tag2"]
---

Content here.
```

### Photo Post

Create `src/photos/YYYY-MM-DD-slug.md`:

```markdown
---
title: "Photo Title"
date: 2025-01-15
location: "Location"
image: "/photos/filename.jpg"
camera: "Camera model"
lens: "Lens model"
settings: "ISO, aperture, shutter"
---

Optional description.
```

Place images in `src/photos/` directory.

## Customization

Change `--paper`, `--ink`, `--accent`, and `--rule` in `src/css/style.css`.
The default palette uses warm paper. `[data-theme="dark"]` defines the ink theme.
Each section repeats its accent in the tilde mark, navigation, and links.

`src/js/site.js` owns the interactive controls.
The site keeps its content and links when JavaScript is unavailable.

## Build

```bash
npm run build
```

Output in `_site/` directory.
