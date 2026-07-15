# DROPi Marketing Website

Modern marketing website for DROPi - Autonomous Drone Delivery Platform.

## Features

- Responsive design (mobile, tablet, desktop)
- SEO optimized
- Fast performance with Vite
- Tailwind CSS styling
- React Router navigation
- Contact forms
- Blog section
- Pricing information
- Customer testimonials

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Pages

- **Home** - Landing page with hero section
- **How It Works** - Explanation of DROPi platform
- **Customers** - Information for customers
- **Merchants** - Information for merchants
- **Partners** - Partnership opportunities
- **Pricing** - Pricing information
- **Blog** - Blog articles and news
- **Contact** - Contact form
- **Privacy** - Privacy policy
- **Terms** - Terms of service

## Project Structure

```
src/
├── components/
│   ├── Navigation.jsx
│   ├── Footer.jsx
│   ├── Hero.jsx
│   ├── Features.jsx
│   ├── Testimonials.jsx
│   ├── CTA.jsx
│   └── ...
├── pages/
│   ├── HomePage.jsx
│   ├── HowItWorksPage.jsx
│   ├── CustomersPage.jsx
│   ├── MerchantsPage.jsx
│   ├── PartnersPage.jsx
│   ├── PricingPage.jsx
│   ├── BlogPage.jsx
│   ├── ContactPage.jsx
│   ├── PrivacyPage.jsx
│   ├── TermsPage.jsx
│   └── NotFoundPage.jsx
├── hooks/
│   ├── useForm.js
│   ├── useScroll.js
│   └── ...
├── utils/
│   ├── api.js
│   ├── constants.js
│   └── helpers.js
├── App.jsx
├── main.jsx
└── index.css
```

## Customization

### Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      accent: '#FF9500',
    },
  },
},
```

### Fonts

Update in `tailwind.config.js`:

```javascript
fontFamily: {
  sans: ['Your Font', 'sans-serif'],
},
```

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Traditional Hosting

```bash
npm run build
# Upload dist/ folder to your server
```

## Performance

- Optimized images
- Code splitting
- Lazy loading
- Minified CSS/JS
- CDN ready

## SEO

- Meta tags
- Open Graph
- Structured data
- Sitemap
- Robots.txt

## Analytics

Add your analytics provider:

```javascript
// src/utils/analytics.js
export const trackEvent = (event, data) => {
  // Send to your analytics service
}
```

## Support

For issues or questions, refer to:
- `/DROPI_CANONICAL/12_DOCUMENTATION/COMPLETE_GUIDE.md`
- `/DROPI_CANONICAL/12_DOCUMENTATION/DEPLOYMENT_GUIDE.md`

## License

MIT
