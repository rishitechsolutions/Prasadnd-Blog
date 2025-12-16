# Portfolio Website - Courtney Davis

A modern portfolio website with a split-screen layout (60% left content, 40% right fixed image) inspired by the Courtney theme.

## Features

- **Split Layout**: 60% scrollable content on the left, 40% fixed image on the right
- **Responsive Design**: Fully responsive for mobile, tablet, and desktop
- **Smooth Scrolling**: Smooth scroll navigation between sections
- **Animated Skills**: Skill bars animate on scroll
- **Modern UI**: Clean and minimalist design
- **Mobile Menu**: Hamburger menu for mobile devices

## Sections Included

1. **Hero Section** - Introduction with name and title
2. **About Section** - Personal introduction
3. **Services Section** - UI/UX Design, Logo Design, Branding
4. **Language Skills** - Animated progress bars
5. **Hard Skills** - Technical skills grid
6. **Reviews** - Client testimonials
7. **Blog Section** - Latest blog posts
8. **Contact Section** - Call to action

## How to Use

1. Open `index.html` in your web browser
2. No build process required - it's a static website
3. To customize:
   - Replace the placeholder image in the right panel (update the background-image in `.image-placeholder` in `styles.css`)
   - Modify content in `index.html`
   - Adjust colors and styling in `styles.css`

## File Structure

```
portfolio-website/
├── index.html      # Main HTML file
├── styles.css      # All styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Customization

### Change the Right Side Image

In `styles.css`, find the `.image-placeholder` class and update the `background` property:

```css
.image-placeholder {
    background: url('your-image-url.jpg') center/cover no-repeat;
}
```

### Change Colors

Update the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #000;
    --secondary-color: #666;
    --bg-color: #fff;
    --text-color: #333;
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Free to use and modify for your projects.

