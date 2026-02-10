# LokaClean SEO & Growth Hacking Instructions

## 1. Google Business Profile Optimization (Critical for Local SEO)
**Action:** Claim or Create "LokaClean" on Google Maps immediately.

- **Category:** `House Cleaning Service` (Primary), `Carpet Cleaning Service`, `Pool Cleaning Service` (Secondary).
- **Location:** Pin exactly at Kuta Mandalika center or your office.
- **Service Areas:** Add `Kuta`, `Mandalika`, `Praya`, `Selong Belanak`, `Mataram`, `Lombok Tengah`.
- **Photos:** Upload `logo.jpg`, `hero.png`, and real "Before/After" photos of your work.
- **Description:** 
  > "LokaClean adalah jasa kebersihan profesional di Kuta Mandalika & Lombok. Melayani villa cleaning, housekeeping harian, dan deep cleaning dengan standar hotel. Booking mudah via aplikasi. Terpercaya, transparan, dan berkualitas."

## 2. Facebook Pixel Integration
Add this code to your `index.html` head (replace `YOUR_PIXEL_ID` with your actual ID):

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
```

## 3. Performance & Images
- **WebP:** Convert all PNG/JPG images in `public/img` to WebP format for faster loading.
- **Lazy Loading:** Ensure all images below the fold use `loading="lazy"` (Already applied in Home code).

## 4. Next Steps
- Share the new landing pages (`/jasa-kebersihan-lombok`, etc.) on Facebook Groups "Lombok Community" and "Kuta Lombok Expats".
- Ask your first 5 customers to review you on Google Maps.
