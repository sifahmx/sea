# Sea Transport – Travel Allowance Log

A website for recording speedboat trips: the date, boat, department, start and end times, total hours, trip details, staff and fuel.

## Pages
- **Home**: hero slider, monthly stats, quick links
- **Staff Login**: staff choose their name and enter their PIN. They must be logged in (or be the admin) to add a trip, and they stay logged in on that device for 30 days. The admin sets PINs in Admin › Staff Logins.
- **Log Trip**: the data entry form. Total hours are calculated automatically, including trips that pass midnight.
- **Records**: search and filter by month, boat or department, see totals, export to Excel (CSV) and print
- **Print Forms**: a blank single trip slip and a monthly log sheet for paper use, plus a printable slip for any saved trip
- **Admin** (PIN required): edit branding, logo, colours, hero slides, home page text, menu and field labels, the staff, department and boat lists, the footer, backup and restore, and the PIN

## Running it
- **Quick look:** double-click `index.html`. Data is saved in that browser only.
- **Shared online database:** upload the whole folder to any PHP host (for example Hostinger). The site detects `api.php` automatically and stores data in `/data`, so every device sees the same records. The footer shows which mode is active.
- **Locally with PHP:** run `php -S 127.0.0.1:8765` in this folder, then open http://127.0.0.1:8765

## Files
- `index.html`: the page shell
- `css/styles.css`: all styles, including print styles
- `js/data.js`: default content and lists
- `js/store.js`: storage (server or browser)
- `js/app.js`: pages and admin
- `api.php`: the optional server API (JSON files kept in `/data`)

Change the admin PIN after the first login.
