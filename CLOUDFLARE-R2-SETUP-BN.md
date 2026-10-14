# SS Study Centre — Cloudflare R2 Storage Setup (বাংলা)

এই branch-এ Cloudflare R2 object storage-এর জন্য code প্রস্তুত করা হয়েছে। এটি এখনও `main`-এ merge করা হয়নি এবং live website-এ deploy করা হয়নি।

## এই পরিবর্তনে কী হবে
- নতুন video, PDF, image, faculty photo, current affairs attachment ও thumbnail R2-তে upload হবে।
- সাধারণ public media `uploads/` prefix-এ থাকবে।
- Paid e-book-এর মূল PDF `private-ebooks/` prefix-এ থাকবে; public media URL দিয়ে সেটি প্রকাশ করা হবে না। কেনা/অনুমোদিত student-এর existing login check রেখেই file serve হবে।
- `data/content.json` R2-তে `_system/content.json` নামে save/restore হবে, যাতে free Render instance restart/redeploy হলে settings ও content metadata হারিয়ে না যায়।
- প্রথম R2 start-এ server-এর local uploads/private e-books থাকলে R2-তে copy করে, তারপর content data seed করার চেষ্টা করবে।
- R2 credentials না দিলে app আগের মতো local storage mode-এ চলবে।

## নিরাপদ setup — deploy করার আগে
1. GitHub-এ বর্তমান `main` branch ও Render live service অপরিবর্তিত রাখুন।
2. R2 bucket তৈরি করার আগে Cloudflare account-এ billing/pricing review করুন। কোনো paid upgrade এখানে স্বয়ংক্রিয়ভাবে করা হয়নি।
3. Cloudflare R2 bucket তৈরি করুন এবং Object Read/Write permission-সহ access key তৈরি করুন। Secret key কাউকে chat-এ পাঠাবেন না।
4. Render-এর Environment settings-এ নিচের variable-গুলি যোগ করতে হবে:
   - `R2_ACCOUNT_ID`
   - `R2_BUCKET`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
5. Optional `R2_PUBLIC_URL` সেট করলে সেটি ওই bucket-এর public custom domain বা R2.dev URL-এর root হতে হবে। এটি set না করলে media app server-এর মাধ্যমে stream হবে; বড় video-র জন্য public media domain সাধারণত ভালো।
6. প্রথম deployment-এর আগে local/current content-এর আলাদা backup নিন। R2 bucket-এ আগে থেকেই `_system/content.json` তৈরি করবেন না; প্রথম startup বর্তমান local data seed করতে পারবে।
7. প্রথমে test branch/staging service-এ deploy করে ছোট image, PDF, video upload করে restart-এর পরে playback ও admin panel পরীক্ষা করুন। সফল না হওয়া পর্যন্ত live service-এ merge করবেন না।

## খরচ ও সীমাবদ্ধতা
- R2 storage/request charge Cloudflare-এর বর্তমান pricing ও usage-এর উপর নির্ভর করবে। বড় video এবং বেশি traffic-এর জন্য আগে estimate দেখে নিন।
- `R2_PUBLIC_URL` ছাড়া video app server দিয়ে stream হবে; এতে app hosting-এর bandwidth/limits ব্যবহার হবে।
- এটি content metadata-র একটি R2 copy রাখে, কিন্তু আলাদা versioned/off-site backup-এর বিকল্প নয়। নিয়মিত backup দরকার।
- Render free instance-এর local disk এখনও temporary; R2 config ঠিকভাবে দেওয়া ও পরীক্ষা করা না হলে persistence নিশ্চিত নয়।
- এই change live-এ deploy করা হয়নি; এটি code proposal মাত্র।

Cloudflare pricing: https://developers.cloudflare.com/r2/pricing/
Cloudflare R2 setup: https://developers.cloudflare.com/r2/get-started/
