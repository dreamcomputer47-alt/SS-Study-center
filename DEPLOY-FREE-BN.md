# SS Study Centre — Free Testing Deployment

এই package-টি Render Free-তে Node.js website হিসেবে test করার জন্য প্রস্তুত।

## কীভাবে কাজ করবে
- Public website: ছাত্রছাত্রীরা যেকোনো device থেকে দেখতে পারবে।
- Admin: `/admin` — Surajit Sir laptop/phone থেকেও control করতে পারবেন।
- Daily Live Class: YouTube Live-এ class চালিয়ে Admin → Live Class-এ link দিয়ে ON করতে হবে।
- Subscribe: HTTPS online version-এ student notification permission দিলে browser/phone push notification পেতে পারে।
- নতুন YouTube video/PDF/image/current affairs এবং Live ON করলে notification তৈরি হয়।

## Free test-এর জন্য গুরুত্বপূর্ণ
Render Free service idle হলে sleep করতে পারে। তাই প্রথম visitor-এর সময় কিছুটা startup delay হতে পারে। Daily live class-এর ক্ষেত্রে class-এর আগে Sir একবার Admin panel খুলে Live Class ON করবেন; এতে service জেগে থাকবে এবং notification পাঠানোর সুযোগ থাকবে।

### Large video সম্পর্কে
Free test phase-এ class video YouTube-এ upload করে YouTube link ব্যবহার করাই সবচেয়ে নিরাপদ। Render-এর local upload storage permanent নয়। PDF/image/direct video upload-এর জন্য production-এ persistent cloud storage যোগ করা উচিত।

## Render setup
1. GitHub-এ এই project folder upload করুন।
2. Render → New → Blueprint/ Web Service → GitHub repository select করুন।
3. `render.yaml` ব্যবহার করলে build/start/health settings পাওয়া যাবে।
4. Environment variables দিন:
   - `ADMIN_PASSWORD` — Surajit Sir-এর জন্য নতুন strong password
   - `VAPID_SUBJECT` — যেমন `mailto:your-email@example.com`
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
5. Deploy করুন।
6. Deploy হওয়ার পরে `/admin` খুলে login করুন।

## VAPID keys
Local test-এ server নিজে keys তৈরি করতে পারে। Online Free deployment-এ environment variables-এ stable VAPID keys রাখা ভালো, কারণ Render-এর local disk permanent নয়।

একবার VAPID keys তৈরি করতে local project-এ `node`/`web-push` ব্যবহার করা যায়; keys কাউকে public chat-এ পাঠাবেন না। Public key browser-এ ব্যবহৃত হয়, private key secret রাখতে হবে।

## Daily class routine
1. YouTube-এ scheduled/live class তৈরি করুন।
2. Admin → Live Class → title + YouTube Live URL + schedule দিন।
3. Class শুরু হওয়ার কয়েক মিনিট আগে `Live class is ON` tick করে Save করুন।
4. Students যারা Subscribe করেছে তারা Live notification পেতে পারে।
5. Class শেষ হলে Live Class OFF করে Save করুন।

## Important
Free Render storage-কে permanent content storage হিসেবে ব্যবহার করবেন না। Free testing-এর সময় YouTube links দিয়ে classes চালানো সবচেয়ে reliable। পরে Supabase/Cloud storage যোগ করলে Admin uploads cross-device এবং persistent হবে।
