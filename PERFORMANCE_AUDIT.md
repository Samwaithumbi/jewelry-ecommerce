# Performance Audit Instructions

## Lighthouse Audit for Product Page

### Running the Audit

Since Lighthouse CI installation encountered issues, you can run the audit manually using Chrome DevTools:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open Chrome DevTools:**
   - Navigate to a product page (e.g., `http://localhost:3000/products/your-product-slug`)
   - Press `F12` or right-click and select "Inspect"
   - Go to the "Lighthouse" tab

3. **Configure the audit:**
   - Select "Performance"
   - Uncheck other categories (for a focused audit)
   - Set device to "Mobile" (most critical for e-commerce)
   - Click "Analyze page load"

4. **Review results:**
   - Target: 90+ Performance score
   - Fix anything below 80 before moving to Phase 2

### Common Performance Issues to Address

1. **Image Optimization**
   - Use Next.js Image component with proper sizing
   - Implement lazy loading for below-fold images
   - Serve WebP format when supported

2. **JavaScript Bundling**
   - Code split large components
   - Use dynamic imports for non-critical features
   - Remove unused dependencies

3. **CSS Optimization**
   - Remove unused CSS with Tailwind's purge
   - Minimize critical CSS inline
   - Load non-critical CSS asynchronously

4. **Font Loading**
   - Use `font-display: swap` for web fonts
   - Preload critical fonts
   - Consider system fonts for better performance

5. **Third-Party Scripts**
   - Defer non-essential scripts
   - Load scripts only when needed
   - Consider removing unnecessary tracking scripts

### Automated Lighthouse CI (Optional)

If you want to set up automated Lighthouse CI later:

```bash
npm install -g @lhci/cli
lhci autorun
```

Or add to package.json:
```json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

### Performance Budgets

Recommended budgets for this project:
- JavaScript: < 200KB gzipped
- CSS: < 50KB gzipped
- Images: < 500KB total per page
- Total transfer size: < 1MB

### Monitoring

After initial audit, consider:
- Regular audits before major releases
- Monitor Core Web Vitals in production
- Set up Real User Monitoring (RUM)
