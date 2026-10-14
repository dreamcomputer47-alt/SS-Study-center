# SS Study Centre — Persistent Hosting Setup (বাংলা)

এই branch-এ production-এর জন্য Render persistent disk configuration প্রস্তুত করা হয়েছে। এটি এখনো `main`-এ merge করা হয়নি এবং live site-এ deploy করা হয়নি।

## কী পরিবর্তন হয়েছে
- `STORAGE_ROOT` environment variable যোগ হয়েছে।
- `uploads/`, `data/content.json`, `data/vapid.json`, এবং `private-ebooks/` persistent disk-এর নিচে রাখা যাবে।
- প্রথমবার storage path বদলালে app পুরনো local folders থেকে নতুন storage-এ missing files copy করার চেষ্টা করে; বিদ্যমান destination file overwrite করে না।
- Render config-এ paid Starter service এবং 5 GB persistent disk প্রস্তাব করা হয়েছে।

## খুব জরুরি: deploy-এর আগে বর্তমান data backup
Render Free-এর filesystem ephemeral। পুরনো free instance-এর local uploads/data নতুন deployment-এ স্বয়ংক্রিয়ভাবে পাওয়া যাবে—এমন নিশ্চয়তা নেই। তাই:
1. বর্তমান live website-এর সব গুরুত্বপূর্ণ ভিডিও, PDF, ছবি এবং content আলাদা করে laptop/backup-এ সংরক্ষণ করুন।
2. `data/content.json` ও `uploads/`-এর live copy যদি পাওয়া যায়, সেটি backup করুন।
3. backup যাচাই না করে branch merge করবেন না এবং Render deploy করবেন না।
4. বর্তমান production admin password এবং VAPID keys নিরাপদে সংরক্ষণ করুন। নতুন deployment-এ একই push keys রাখতে হবে।

## Render disk setup
Render Blueprint sync করলে paid service এবং disk-এর খরচ শুরু হতে পারে। Dashboard-এ পরিবর্তন review করে তারপর confirm করতে হবে।

- Service plan: Starter
- Disk mount path: `/opt/render/project/src/storage`
- Disk size: 5 GB
- Environment variable: `STORAGE_ROOT=/opt/render/project/src/storage`
- Health check: `/api/health`

শুধু এই mount path-এর ভেতরের ফাইল persistent হবে। code এবং `public/` assets repository থেকেই deploy হবে।

## আনুমানিক খরচ
Render-এর বর্তমান pricing অনুযায়ী Starter web service প্রায় US$7/month এবং persistent disk US$0.25/GB-month। 5 GB disk-সহ আনুমানিক US$8.25/month (বছরে প্রায় US$99), currency conversion ও tax-এর আগে। ভারতীয় টাকায় প্রকৃত charge exchange rate/tax অনুযায়ী বদলাবে। এই খরচ আগের ₹3,000–₹3,500/year budget-এর বেশি।

Pricing:
- https://render.com/pricing
- https://render.com/docs/disks

## Deploy-এর পরে পরীক্ষা
- `/api/health` returns `ok: true`
- Admin login works; production `ADMIN_PASSWORD` long and unique
- Upload a small test PDF, image and video; restart/redeploy; verify all still work
- Test private e-book download/access and push subscription
- Confirm old videos/content are present before making the domain public
- Then connect `ssstudycenter.in` and configure Google Search Console

## সীমাবদ্ধতা
এই পরিবর্তনটি local filesystem persistence-এর জন্য। এটি নিজে থেকে cloud backup, multi-instance scaling, database migration, or high-availability তৈরি করে না। Persistent disk এক service instance-এ ব্যবহার হয়; নিয়মিত আলাদা backup এখনও দরকার।
