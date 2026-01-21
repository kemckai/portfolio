# Tonmeister Portfolio Website

Professional bilingual (English/German) portfolio website for BA Tonmeister_in program application at mdw.ac.at.

## Project Structure

```
portfolio/
├── index.html          # Main HTML file with bilingual content
├── styles.css          # Professional styling and responsive design
├── script.js           # Language switching and interactive features
├── README.md          # This file
└── assets/
    ├── audio/         # Audio portfolio samples (MP3, WAV, etc.)
    ├── images/        # Profile photos and project images
    └── docs/          # CV/resume PDF files
```

## Setup Instructions

1. **Add Your Content**
   - Replace placeholder text in `index.html` with your specific information
   - Update email addresses and contact information
   - Add your social media links (LinkedIn, etc.)

2. **Add Audio Files**
   - Place your audio samples in `assets/audio/`
   - Update the audio source paths in the portfolio section
   - Supported formats: MP3, WAV, OGG
   - Recommended: Use MP3 for best browser compatibility

3. **Add CV/Resume**
   - Place your CV PDF in `assets/docs/cv.pdf`
   - Or update the file path in the CV section if using a different filename

4. **Add Images** (Optional)
   - Place profile photos or project images in `assets/images/`
   - Update image paths in HTML if you add images

5. **Customize Content**
   - Fill in all sections marked with `[Placeholder text]`
   - Update professional experience details
   - Add your musical background information
   - Include education details and coursework
   - Add project descriptions for audio portfolio items

## Content Guidelines

### Sections to Update

1. **About Section**
   - Personal introduction
   - Professional background summary
   - Motivation for Tonmeister program

2. **Professional Experience**
   - Audio engineering work and projects
   - IT professional background
   - Notable achievements and collaborations

3. **Musical Background**
   - Musical training and experience
   - Performance history
   - Connection to classical music

4. **Education**
   - Institution name for associate's degree
   - Relevant coursework
   - Prior experience/credits information

5. **Audio Portfolio**
   - Project titles and descriptions
   - Technical details (recording setup, mixing approach)
   - Categories for each project
   - External links (SoundCloud, Bandcamp, etc.)

6. **Contact Information**
   - Email address
   - Social media links
   - Location (if different from Texas, USA)

## Language Support

The website supports both English and German:
- Language preference is saved in browser localStorage
- Toggle button in header switches between languages
- All content sections are available in both languages
- Update both language versions when adding new content

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile, tablet, and desktop
- Graceful degradation for older browsers

## Deployment

### Local Testing
Simply open `index.html` in a web browser or use a local server:
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server
```

### Web Hosting
Upload all files to your web hosting service:
- GitHub Pages
- Netlify
- Vercel
- Traditional web hosting (cPanel, FTP, etc.)

Ensure all file paths remain relative (no absolute paths).

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --color-primary: #2c5aa0;
    --color-accent: #d4af37;
    /* ... */
}
```

### Typography
Font families are defined in CSS variables:
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...;
--font-heading: 'Georgia', 'Times New Roman', serif;
```

### Adding Sections
1. Add HTML structure in `index.html`
2. Add corresponding styles in `styles.css`
3. Update navigation menu if needed
4. Add bilingual content with `data-lang` attributes

## Notes

- All placeholder content is marked with `[brackets]` - replace these with your actual content
- Audio files should be optimized for web (compressed MP3s recommended)
- Keep file sizes reasonable for fast loading
- Test the site on multiple devices and browsers
- Ensure all links work before submitting your application

## Support

For questions or issues, refer to the HTML, CSS, and JavaScript comments for implementation details.
