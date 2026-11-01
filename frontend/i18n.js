'use strict';
/* GBLMS — Bengali for EVERY page (About, OPAC, E-Library, Services, Helpdesk, Portal). Remembered in localStorage.lang; the home page uses the same key. */
(() => {
const BN_HOME = {
      // Navigation
      "GBLMS": "জিবিএলএমএস",
      "About Library": "লাইব্রেরি পরিচিতি",
      "History": "ইতিহাস",
      "Vision": "ভিশন",
      "Mission": "মিশন",
      "Team": "টিম",
      "Book Search": "বই অনুসন্ধান",
      "Title": "শিরোনাম",
      "Author": "লেখক",
      "ISBN": "আইএসবিএন",
      "Advanced": "উন্নত",
      "E-Library": "ই-লাইব্রেরি",
      "Ebooks": "ই-বুক",
      "Student Panel": "স্টুডেন্ট প্যানেল",
      "Services": "সেবাসমূহ",
      "Admin": "অ্যাডমিন",
      "Support": "সহায়তা",
      "Hardware": "হার্ডওয়্যার",
      "Design": "ডিজাইন",
      "Guidelines": "নির্দেশিকা",

      // Hero
      "GONO BISHWABIDYALAYA": "গণ বিশ্ববিদ্যালয়",
      "Your Library, Reimagined as Liquid Glass.": "আপনার লাইব্রেরি, নতুন রূপে।",
      "GBLMS — the Gono Bishwabidyalay Library Management System. Search, locate, borrow and research across print and digital collections.": "জিবিএলএমএস — গণ বিশ্ববিদ্যালয় লাইব্রেরি ম্যানেজমেন্ট সিস্টেম। মুদ্রিত ও ডিজিটাল সংগ্রহে খুঁজুন, বই নিন ও গবেষণা করুন।",
      "Explore Smart Tools": "স্মার্ট টুলস দেখুন",
      "Browse Books": "বই ব্রাউজ করুন",

      // Book - Cover & Pages
      "PORTAL CORE": "পোর্টাল কোর",
      "p. 144": "পৃষ্ঠা ১৪৪",
      "GBLMS ARCHIVE": "জিবিএলএমএস আর্কাইভ",
      "Intelligent Knowledge Management": "ইন্টেলিজেন্ট নলেজ ম্যানেজমেন্ট",
      "A modern architecture for digital repositories, semantic citation graphs, and AI-assisted cataloging at Gono Bishwabidyalay.": "গণ বিশ্ববিদ্যালয়ে ডিজিটাল সংগ্রহশালা, সেমান্টিক সাইটেশন ও এআই ক্যাটালগিংয়ের আধুনিক রূপরেখা।",
      "UNIVERSAL CORE": "ইউনিভার্সাল কোর",
      "ED. 2024": "সংস্করণ ২০২৪",
      "INDEX": "সূচি",
      "p. 132": "পৃষ্ঠা ১৩২",
      "Algorithms": "অ্যালগরিদম",
      "Archiving": "আর্কাইভিং",
      "Cataloging": "ক্যাটালগিং",
      "Databases": "ডাটাবেজ",
      "Dublin Core": "ডাবলিন কোর",
      "Fines & Dues": "জরিমানা ও বকেয়া",
      "Metadata": "মেটাডেটা",
      "Ontology": "অনটোলজি",
      "Repository": "সংগ্রহশালা",
      "Z39.50 Spec": "Z39.50 স্পেক",
      "SUBJECT INDEX": "বিষয় সূচি",
      "REFERENCES": "রেফারেন্স",
      "p. 131": "পৃষ্ঠা ১৩১",
      "Selected References": "নির্বাচিত রেফারেন্স",
      "Cormen, T. H. et al.": "করমেন, টি. এইচ. প্রমুখ",
      "Introduction to Algorithms": "অ্যালগরিদম পরিচিতি",
      "Silberschatz, A. et al.": "সিলবারশাতজ, এ. প্রমুখ",
      "Operating System Concepts": "অপারেটিং সিস্টেম কনসেপ্টস",
      "Harari, Y. N.": "হারারি, ওয়াই. এন.",
      "Sapiens: Brief History of Humankind": "স্যাপিয়েন্স: মানবজাতির সংক্ষিপ্ত ইতিহাস",
      "Martin, R. C.": "মার্টিন, আর. সি.",
      "Clean Code: Agile Software Craft": "ক্লিন কোড: অ্যাজাইল সফটওয়্যার ক্রাফট",
      "Thiel, P.": "থিয়েল, পি.",
      "Zero to One: Notes on Startups": "জিরো টু ওয়ান: স্টার্টআপের কথা",
      "GONO BISHWABIDYALAY": "গণ বিশ্ববিদ্যালয়",
      "LIBRARY": "লাইব্রেরি",
      "PRESERVATION": "সংরক্ষণ",
      "p. 50": "পৃষ্ঠা ৫০",
      "CHAPTER 3": "অধ্যায় ৩",
      "Digital Archiving": "ডিজিটাল আর্কাইভিং",
      "The transition from physical shelves to distributed repositories demands resilient metadata standards for discovery.": "শারীরিক তাক থেকে ডিজিটাল সংগ্রহশালায় রূপান্তরের জন্য প্রয়োজন টেকসই মেটাডেটা মানদণ্ড।",
      "ARCHIVAL SCIENCE": "আর্কাইভাল বিজ্ঞান",
      "p. 51": "পৃষ্ঠা ৫১",
      "Standards like Dublin Core and MARC 21 provide the structural backbone for cross-institution catalog search and persistent identifiers.": "ডাবলিন কোর ও মার্ক ২১-এর মতো মানদণ্ড আন্তঃপ্রতিষ্ঠান ক্যাটালগ অনুসন্ধান ও শনাক্তকরণ নিশ্চিত করে।",
      "“A library is not a luxury but one of the necessities of life.”": "“লাইব্রেরি কোনো বিলাসিতা নয়, জীবনের এক অপরিহার্য প্রয়োজন।”",
      "— Henry Ward Beecher": "— হেনরি ওয়ার্ড বিচার",
      "SECTION 3.2": "বিভাগ ৩.২",
      "SERVICES": "সেবাসমূহ",
      "p. 26": "পৃষ্ঠা ২৬",
      "CHAPTER 2": "অধ্যায় ২",
      "The Reference Desk": "রেফারেন্স ডেস্ক",
      "Modern reference desks unite physical help desks with responsive real-time digital discovery portals.": "আধুনিক রেফারেন্স ডেস্ক ভৌত সহায়তা ও রিয়েল-টাইম ডিজিটাল পোর্টালের সংযোগ ঘটায়।",
      "CONSULTATION": "পরামর্শ",
      "p. 27": "পৃষ্ঠা ২৭",
      "AI-assisted discovery helps patrons identify primary sources swiftly, empowering librarians to lead complex academic inquiries.": "এআই-চালিত অনুসন্ধান প্রাথমিক উৎস দ্রুত শনাক্ত করতে সাহায্য করে এবং গবেষণায় গতি আনে।",
      "“Knowledge is of two kinds: we know it, or we know where to find it.”": "“জ্ঞান দুই প্রকার: হয় আমরা তা জানি, অথবা জানি তা কোথায় পাওয়া যাবে।”",
      "— Samuel Johnson": "— স্যামুয়েল জনসন",
      "SECTION 2.1": "বিভাগ ২.১",
      "FOUNDATIONS": "ভিত্তি",
      "p. 2": "পৃষ্ঠা ২",
      "CHAPTER 1": "অধ্যায় ১",
      "Dawn of Knowledge": "জ্ঞানের সূচনা",
      "From clay tablets to distributed networks, the human drive to curate thought remains our greatest shared endeavor.": "মাটির ফলক থেকে ডিজিটাল নেটওয়ার্ক—জ্ঞান সংরক্ষণের এই মানবযাত্রা আমাদের সর্বশ্রেষ্ঠ যৌথ প্রচেষ্টা।",
      "p. 3": "পৃষ্ঠা ৩",
      "The modern university library serves as a dynamic crossroad uniting digital scholarship and heritage collections into one seamless ecosystem.": "আধুনিক বিশ্ববিদ্যালয় লাইব্রেরি ডিজিটাল গবেষণা ও ঐতিহ্যবাহী সংগ্রহকে এক মেলবন্ধনে রূপ দেয়।",
      "“Libraries store the energy that fuels the imagination.”": "“লাইব্রেরি সেই শক্তি সঞ্চয় করে যা কল্পনাকে সমৃদ্ধ করে।”",
      "— Sidney Sheldon": "— সিডনি শেলডন",
      "SECTION 1.1": "বিভাগ ১.১",
      "MONOGRAPH SERIES": "মনোগ্রাফ সিরিজ",
      "VOL. IV": "খণ্ড ৪",
      "GBLMS EDITION": "জিবিএলএমএস সংস্করণ",
      "Intelligent": "ইন্টেলিজেন্ট",
      "Knowledge": "নলেজ",
      "Management": "ম্যানেজমেন্ট",
      "Architecture of Modern Digital Repositories & Semantic Discovery": "আধুনিক ডিজিটাল সংগ্রহশালা ও সেমান্টিক অনুসন্ধানের রূপরেখা",
      "GONO BISHWABIDYALAYA PRESS": "গণ বিশ্ববিদ্যালয় প্রেস",
      "CORE ARCHIVE": "মূল আর্কাইভ",
      "2024": "২০২৪",
      "CONTENTS": "সূচিপত্র",
      "p. v": "পৃষ্ঠা ৫",
      "Table of Contents": "সূচিপত্র",
      "1. Dawn of Knowledge": "১. জ্ঞানের সূচনা",
      "2. The Reference Desk": "২. রেফারেন্স ডেস্ক",
      "3. Digital Archiving": "৩. ডিজিটাল আর্কাইভিং",
      "4. Intelligent Discovery": "৪. ইন্টেলিজেন্ট ডিসকভারি",
      "5. Campus Case Studies": "৫. ক্যাম্পাস কেস স্টাডিজ",
      "6. Selected References": "৬. নির্বাচিত রেফারেন্স",
      "PRELIMINARY": "প্রারম্ভিক",

      // Carousel & Collections
      "EDITOR'S COLLECTIONS": "সম্পাদকের সংগ্রহ",
      "Curated Masterworks": "বাছাই করা সেরা বই",
      "View All ↗": "সব দেখুন",
      "View All": "সব দেখুন",
      "NEW YORK TIMES BESTSELLER": "নিউ ইয়র্ক টাইমস বেস্টসেলার",
      "BUSINESS": "ব্যবসা",
      "FANTASY": "কল্পকাহিনী",
      "HISTORY": "ইতিহাস",
      "SOFTWARE": "সফটওয়্যার",
      "TECH": "প্রযুক্তি",
      "Zero to One": "জিরো টু ওয়ান",
      "Peter Thiel": "পিটার থিয়েল",
      "The Hobbit": "দ্য হবিট",
      "J.R.R. Tolkien": "জে.আর.আর. টলকিন",
      "Sapiens: A Brief History of Humankind": "স্যাপিয়েন্স: মানবজাতির সংক্ষিপ্ত ইতিহাস",
      "Yuval Noah Harari": "ইউভাল নোয়াহ হারারি",
      "Clean Code": "ক্লিন কোড",
      "Robert C. Martin": "রবার্ট সি. মার্টিন",
      "The Innovators": "দ্য ইনোভেটরস",
      "Walter Isaacson": "ওয়াল্টার আইজ্যাকসন",

      // Discover / Search
      "DISCOVER": "অনুসন্ধান",
      "Find your next book": "আপনার পরবর্তী বই খুঁজুন",
      "All": "সব",
      "Business": "ব্যবসা",
      "Fiction": "কথাসাহিত্য",
      "Law": "আইন",
      "CSE": "সিএসই",
      "Search by title, author or ISBN…": "শিরোনাম, লেখক বা আইএসবিএন দিয়ে খুঁজুন…",
      "Search by title, author, or keyword...": "শিরোনাম, লেখক বা বিষয় দিয়ে খুঁজুন...",
      "Database System Concepts": "ডাটাবেজ সিস্টেম কনসেপ্টস",
      "Silberschatz": "সিলবারশাতজ",
      "Principles of Economics": "অর্থনীতির মূলনীতি",
      "N. G. Mankiw": "এন. জি. ম্যানকিউ",
      "Constitutional Law of Bangladesh": "বাংলাদেশের সাংবিধানিক আইন",
      "Mahmudul Islam": "মাহমুদুল ইসলাম",
      "No books found.": "কোনো বই পাওয়া যায়নি।",
      "● Available": "● পাওয়া যাচ্ছে",
      "● Borrowed": "● ধার নেওয়া হয়েছে",
      "Rack C-12": "র‍্যাক C-12",
      "Rack C-14": "র‍্যাক C-14",
      "Rack C-2": "র‍্যাক C-2",
      "Rack A-2": "র‍্যাক A-2",
      "Rack A-3": "র‍্যাক A-3",
      "Rack B-2": "র‍্যাক B-2",
      "Rack B-4": "র‍্যাক B-4",
      "Rack A-1": "র‍্যাক A-1",

      // New Arrivals
      "Full name": "পূর্ণ নাম",
      "Send a message": "বার্তা পাঠান",
      "Message the library": "লাইব্রেরিকে বার্তা পাঠান",
      "My Portal": "আমার পোর্টাল",
      "Close": "বন্ধ করুন",
      "Send": "পাঠান",
      "NEW ARRIVALS": "নতুন সংযোজন",
      "Fresh on our shelves": "আমাদের তাকে নতুন বই",
      "Log in": "লগ ইন",
      "Log in as": "যেভাবে লগ ইন করবেন",
      "Choose how you want to continue.": "কীভাবে চালিয়ে যেতে চান বেছে নিন।",
      "User": "ইউজার",
      "Manage books, members and notices": "বই, সদস্য ও নোটিশ পরিচালনা করুন",
      "Borrow, reserve and read": "বই নিন, রিজার্ভ করুন ও পড়ুন",
      "Psychology": "মনোবিজ্ঞান",
      "Economics": "অর্থনীতি",
      "Technology": "প্রযুক্তি",
      "Sociology": "সমাজবিজ্ঞান",

      // My Account
      "MY ACCOUNT": "আমার অ্যাকাউন্ট",
      "Your library account, at a glance": "আপনার লাইব্রেরি অ্যাকাউন্ট, এক নজরে",
      "Books borrowed": "ধার নেওয়া বই",
      "Due soon": "শীঘ্রই ফেরত",
      "Reservations": "রিজার্ভেশন",
      "Fines": "জরিমানা",
      "Currently borrowed": "বর্তমানে ধার নেওয়া",
      "Active": "সক্রিয়",
      "Urgent": "জরুরি",
      "Queued": "অপেক্ষমাণ",
      "Clear": "পরিশোধিত",
      "3 Books": "৩টি বই",
      "1 Book": "১টি বই",
      "2 Books": "২টি বই",
      "Operating Systems": "অপারেটিং সিস্টেম",
      "Sapiens": "স্যাপিয়েন্স",
      "Due Oct 12": "ফেরত ১২ অক্টোবর",
      "Due Oct 20": "ফেরত ২০ অক্টোবর",
      "Due Oct 24": "ফেরত ২৪ অক্টোবর",
      "Renew": "নবায়ন",
      "Renewed": "নবায়ন হয়েছে",
      "Sample data shown. Sign in to see your real account.": "নমুনা তথ্য দেখানো হচ্ছে। আসল অ্যাকাউন্ট দেখতে সাইন ইন করুন।",
      "Sign in": "সাইন ইন",

      // Notice Board
      "NOTICE BOARD": "নোটিশ বোর্ড",
      "Latest Notices": "সর্বশেষ নোটিশ",
      "Notice Board": "নোটিশ বোর্ড",
      "Academic": "একাডেমিক",
      "Library": "লাইব্রেরি",
      "Events": "ইভেন্ট",
      "OCT": "অক্টো.",
      "SEP": "সেপ্টে.",
      "10": "১০",
      "08": "০৮",
      "20": "২০",
      "05": "০৫",
      "02": "০২",
      "Extended library hours during mid-term exams": "মিডটার্ম পরীক্ষার সময় লাইব্রেরির সময় বাড়ানো হয়েছে",
      "Mid-term question bank updated for CSE": "সিএসই-র মিডটার্ম প্রশ্নব্যাংক হালনাগাদ করা হয়েছে",
      "Book fair and author talk at the central library": "কেন্দ্রীয় লাইব্রেরিতে বইমেলা ও লেখক আলোচনা",
      "Return overdue books to avoid fines": "জরিমানা এড়াতে মেয়াদোত্তীর্ণ বই ফেরত দিন",
      "New IEEE Xplore access guide for students": "শিক্ষার্থীদের জন্য নতুন IEEE Xplore গাইড",

      // Smart Tools
      "SMART TOOLS": "স্মার্ট টুলস",
      "Smart Tools for Study and Research": "পড়াশোনা ও গবেষণার স্মার্ট টুলস",
      "AI Chatbot & Voice": "এআই চ্যাটবট ও ভয়েস",
      "Ask by typing or speaking.": "লিখে বা বলে জিজ্ঞাসা করুন।",
      "Interactive Floor Map": "ইন্টারঅ্যাকটিভ ফ্লোর ম্যাপ",
      "Find the rack and shelf for any subject.": "যেকোনো বিষয়ের র‍্যাক ও শেলফ খুঁজুন।",
      "E-Library & Question Bank": "ই-লাইব্রেরি ও প্রশ্নব্যাংক",
      "IEEE Xplore, SpringerLink, past papers.": "IEEE Xplore, SpringerLink ও পুরনো প্রশ্ন।",
      "Research & Plagiarism Check": "গবেষণা ও প্লাগিয়ারিজম চেক",
      "Submit a paper for similarity review.": "সাদৃশ্য যাচাইয়ের জন্য পেপার জমা দিন।",

      // Modals
      "Floor Map & Rack Locator": "ফ্লোর ম্যাপ ও র‍্যাক লোকেটর",
      "Type a subject to highlight its rack.": "র‍্যাক দেখতে বিষয় লিখুন।",
      "Search subject: CSE, Law, English, Business…": "বিষয় খুঁজুন: সিএসই, আইন, ইংরেজি, ব্যবসা…",
      "English": "ইংরেজি",
      "Software": "সফটওয়্যার",
      "Science": "বিজ্ঞান",
      "Journals": "জার্নাল",
      "Plagiarism Check": "প্লাগিয়ারিজম চেক",
      "Paper title": "গবেষণাপত্রের শিরোনাম",
      "Submit for Check": "যাচাইয়ের জন্য জমা দিন",
      "Please add a title and choose a file.": "অনুগ্রহ করে শিরোনাম দিন ও ফাইল নির্বাচন করুন।",
      "Scanning…": "স্ক্যান করা হচ্ছে…",
      "Past Papers": "পুরনো প্রশ্ন",
      "CSE Final 2025 (PDF)": "সিএসই ফাইনাল ২০২৫ (পিডিএফ)",
      "EEE Midterm 2025 (PDF)": "ইইই মিডটার্ম ২০২৫ (পিডিএফ)",
      "BBA Final 2024 (PDF)": "বিবিএ ফাইনাল ২০২৪ (পিডিএফ)",

      // Chat
      "GBLMS Assistant": "জিবিএলএমএস সহকারী",
      "Find CSE syllabus books": "সিএসই সিলেবাসের বই খুঁজুন",
      "Check room availability": "রুম খালি আছে কিনা দেখুন",
      "Library hours": "লাইব্রেরির সময়সূচি",
      "Hi! I'm the Gono Bishwabidyalay library assistant. How can I help?": "হ্যালো! আমি গণ বিশ্ববিদ্যালয় লাইব্রেরির সহকারী। কীভাবে সাহায্য করতে পারি?",
      "Ask anything…": "যেকোনো কিছু জিজ্ঞাসা করুন…",
      "Ask anything about the library...": "লাইব্রেরি সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন...",

      // Footer
      "Gono Bishwabidyalay Library Management System. Knowledge, within reach.": "গণ বিশ্ববিদ্যালয় লাইব্রেরি ম্যানেজমেন্ট সিস্টেম। জ্ঞান, হাতের নাগালে।",
      "Quick Links": "দ্রুত লিংক",
      "Home": "হোম",
      "Resources & Databases": "রিসোর্স ও ডাটাবেজ",
      "Past Question Bank": "প্রশ্নব্যাংক",
      "Contact": "যোগাযোগ",
      "Location": "ঠিকানা",
      "Gono Bishwabidyalay, Mirzanagar, Savar, Dhaka, Bangladesh": "গণ বিশ্ববিদ্যালয়, মির্জানগর, সাভার, ঢাকা, বাংলাদেশ",
      "Sat–Thu, 8:00 AM – 8:00 PM": "শনি–বৃহস্পতি, সকাল ৮টা – রাত ৮টা",
      "Open in Maps ↗": "ম্যাপে দেখুন",
      "Open in Maps": "ম্যাপে দেখুন",
      "© 2026 Gono Bishwabidyalay · GBLMS. All rights reserved.": "© ২০২৬ গণ বিশ্ববিদ্যালয় · জিবিএলএমএস। সর্বস্বত্ব সংরক্ষিত।"
};
const BN_PAGES = {
  /* ── shared header, login box, footer ── */
  "Skip to content": "মূল অংশে যান", "Toggle dark or light mode": "ডার্ক বা লাইট মোড পরিবর্তন করুন", "Menu": "মেনু", "Main": "মূল মেনু", "GBLMS home": "জিবিএলএমএস হোম", "Social media": "সোশ্যাল মিডিয়া",
  "Home": "হোম", "About Library": "লাইব্রেরি সম্পর্কে", "OPAC Search": "ওপ্যাক সার্চ", "E-Library": "ই-লাইব্রেরি", "Services": "সেবাসমূহ", "Helpdesk": "হেল্পডেস্ক",
  "History": "ইতিহাস", "Vision": "ভিশন", "Mission": "মিশন", "Team": "টিম", "Title": "শিরোনাম", "Author": "লেখক", "ISBN": "আইএসবিএন", "Advanced": "উন্নত", "Books": "বই", "Journals": "জার্নাল", "Notes & sheets": "নোট ও শিট", "Question banks": "প্রশ্নব্যাংক",
  "Log in": "লগ ইন", "Admin panel": "অ্যাডমিন প্যানেল", "Student Panel": "স্টুডেন্ট প্যানেল", "Quick Links": "দ্রুত লিংক", "Resources & Databases": "রিসোর্স ও ডাটাবেজ", "Contact": "যোগাযোগ", "Location": "অবস্থান",
  "Open in Maps": "ম্যাপে দেখুন", "Send a message": "বার্তা পাঠান",
  "Gono Bishwabidyalay Library Management System. Knowledge, within reach.": "গণ বিশ্ববিদ্যালয় লাইব্রেরি ম্যানেজমেন্ট সিস্টেম। জ্ঞান, হাতের নাগালে।",
  "© 2026 Gono Bishwabidyalay · GBLMS. All rights reserved.": "© ২০২৬ গণ বিশ্ববিদ্যালয় · জিবিএলএমএস। সর্বস্বত্ব সংরক্ষিত।",
  "Gono Bishwabidyalay, Mirzanagar, Savar, Dhaka, Bangladesh": "গণ বিশ্ববিদ্যালয়, মির্জানগর, সাভার, ঢাকা, বাংলাদেশ",
  "Sat–Thu, 8:00 AM – 8:00 PM": "শনি–বৃহস্পতি, সকাল ৮:০০ – রাত ৮:০০",
  "Full name": "পূর্ণ নাম", "Student ID": "স্টুডেন্ট আইডি", "Email": "ইমেইল", "Phone number": "ফোন নম্বর", "Department": "বিভাগ", "Select department": "বিভাগ বেছে নিন", "Batch": "ব্যাচ", "Semester": "সেমিস্টার", "Select": "বেছে নিন", "Password": "পাসওয়ার্ড",
  "Admin username": "অ্যাডমিন ইউজারনেম", "Admin log in": "অ্যাডমিন লগ ইন", "User log in": "ইউজার লগ ইন", "Create your account": "আপনার অ্যাকাউন্ট তৈরি করুন", "Create account": "অ্যাকাউন্ট তৈরি করুন", "Create an account": "অ্যাকাউন্ট তৈরি করুন", "I already have an account": "আমার আগেই অ্যাকাউন্ট আছে",
  "Fill in your student details to join the library.": "লাইব্রেরিতে যোগ দিতে আপনার শিক্ষার্থী তথ্য দিন।", "Enter your details to continue.": "চালিয়ে যেতে আপনার তথ্য দিন।", "Please fill in all the fields.": "অনুগ্রহ করে সব ঘর পূরণ করুন।", "Please wait…": "অনুগ্রহ করে অপেক্ষা করুন…", "← Back": "← ফিরে যান", "e.g. 45": "যেমন: ৪৫",
  "Something went wrong. Please try again.": "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।",

  /* ── About ── */
  "About the Library": "লাইব্রেরি সম্পর্কে", "A home for learning at Gono Bishwabidyalay": "গণ বিশ্ববিদ্যালয়ে শেখার একটি ঠিকানা",
  "The central library supports teaching, learning and research with print collections, digital resources and a calm place to study.": "কেন্দ্রীয় লাইব্রেরি ছাপা সংগ্রহ, ডিজিটাল রিসোর্স এবং পড়াশোনার একটি শান্ত পরিবেশ দিয়ে শিক্ষা, শেখা ও গবেষণাকে সহায়তা করে।",
  "Library in numbers": "সংখ্যায় লাইব্রেরি", "Library in numbers ": "সংখ্যায় লাইব্রেরি", "Our history": "আমাদের ইতিহাস", "What we value": "আমরা যা মূল্য দিই", "Visit us": "আমাদের এখানে আসুন",
  "Gono Bishwabidyalay was founded to widen access to higher education. From a small reading room the library has grown into a central collection serving every department, with print books, journals, past question papers and an expanding digital library.": "উচ্চশিক্ষার সুযোগ প্রসারিত করতে গণ বিশ্ববিদ্যালয় প্রতিষ্ঠিত হয়েছিল। ছোট একটি পাঠকক্ষ থেকে লাইব্রেরিটি আজ প্রতিটি বিভাগের সেবায় নিয়োজিত একটি কেন্দ্রীয় সংগ্রহশালায় পরিণত হয়েছে, যেখানে আছে ছাপা বই, জার্নাল, পুরোনো প্রশ্নপত্র এবং ক্রমবর্ধমান ডিজিটাল লাইব্রেরি।",
  "To be a welcoming, technology-enabled library where every student and researcher can find, use and create knowledge.": "এমন একটি আন্তরিক ও প্রযুক্তিনির্ভর লাইব্রেরি হওয়া, যেখানে প্রত্যেক শিক্ষার্থী ও গবেষক জ্ঞান খুঁজে পাবেন, ব্যবহার করবেন এবং সৃষ্টি করবেন।",
  "To collect, organise and share quality learning resources, teach information skills, and give every member quick, fair and friendly service.": "মানসম্মত শিক্ষা উপকরণ সংগ্রহ, সাজানো ও ভাগ করে নেওয়া, তথ্যদক্ষতা শেখানো এবং প্রত্যেক সদস্যকে দ্রুত, ন্যায্য ও বন্ধুত্বপূর্ণ সেবা দেওয়া।",
  "Access for all": "সবার জন্য প্রবেশাধিকার", "Resources and help are open to every student, teacher and staff member.": "রিসোর্স ও সহায়তা প্রতিটি শিক্ষার্থী, শিক্ষক ও কর্মীর জন্য উন্মুক্ত।",
  "Accuracy": "নির্ভুলতা", "A well-organised catalogue so you find the right item quickly.": "সুগঠিত ক্যাটালগ, যাতে আপনি দ্রুত সঠিক বইটি খুঁজে পান।",
  "Service": "সেবা", "Friendly, prompt support from the library team.": "লাইব্রেরি টিমের আন্তরিক ও দ্রুত সহায়তা।",
  "Print volumes": "ছাপা বই", "E-resources": "ই-রিসোর্স", "Reading seats": "পাঠ আসন", "Departments served": "সেবাপ্রাপ্ত বিভাগ",
  "Library management team": "লাইব্রেরি ব্যবস্থাপনা টিম", "The people who run the library and are happy to help. Reach them on social media or WhatsApp.": "যাঁরা লাইব্রেরি পরিচালনা করেন এবং সাহায্য করতে আগ্রহী। সোশ্যাল মিডিয়া বা হোয়াটসঅ্যাপে তাঁদের সঙ্গে যোগাযোগ করুন।",
  "Chief Librarian": "প্রধান গ্রন্থাগারিক", "Head of the Library": "লাইব্রেরি প্রধান", "Leads collection development, services and library policy.": "সংগ্রহ উন্নয়ন, সেবা ও লাইব্রেরি নীতিমালার নেতৃত্ব দেন।",
  "Assistant Librarian": "সহকারী গ্রন্থাগারিক", "Cataloguing & OPAC": "ক্যাটালগিং ও ওপ্যাক", "Maintains the catalogue and helps with research queries.": "ক্যাটালগ হালনাগাদ রাখেন এবং গবেষণা সংক্রান্ত প্রশ্নে সহায়তা করেন।",
  "Library Officer": "লাইব্রেরি কর্মকর্তা", "Circulation desk": "সার্কুলেশন ডেস্ক", "Handles borrowing, returns, renewals and reservations.": "বই ধার, ফেরত, নবায়ন ও রিজার্ভেশন দেখাশোনা করেন।",
  "Address": "ঠিকানা", "Opening hours": "খোলার সময়", "Phone": "ফোন", "Contact the library": "লাইব্রেরির সঙ্গে যোগাযোগ করুন",

  /* ── OPAC ── */
  "OPAC": "ওপ্যাক", "Search the library catalogue": "লাইব্রেরি ক্যাটালগে খুঁজুন",
  "Find any print or digital title by title, author, subject or ISBN, and see live availability.": "শিরোনাম, লেখক, বিষয় বা আইএসবিএন দিয়ে যেকোনো ছাপা বা ডিজিটাল বই খুঁজুন এবং সরাসরি প্রাপ্যতা দেখুন।",
  "Search in": "যেখানে খুঁজবেন", "All fields": "সব ক্ষেত্র", "Subject": "বিষয়", "Publisher": "প্রকাশক", "Search": "খুঁজুন",
  "Type a title, author, subject or ISBN…": "শিরোনাম, লেখক, বিষয় বা আইএসবিএন লিখুন…", "Filters & sorting": "ফিল্টার ও সাজানো", "Category / section": "বিভাগ / শাখা", "All": "সব", "Language": "ভাষা",
  "Year from": "সাল থেকে", "Year to": "সাল পর্যন্ত", "e.g. 2015": "যেমন: ২০১৫", "e.g. 2026": "যেমন: ২০২৬", "Sort by": "সাজান", "Title A–Z": "শিরোনাম (A–Z)", "Author A–Z": "লেখক (A–Z)", "Newest first": "নতুন আগে", "Recently added": "সম্প্রতি যোগ হয়েছে",
  "Available now only": "শুধু এখন পাওয়া যায় এমন", "Availability": "প্রাপ্যতা", "Reset filters": "ফিল্টার মুছুন", "E-copy": "ই-কপি", "All on loan": "সব ধার দেওয়া আছে",
  "No titles found": "কোনো বই পাওয়া যায়নি", "Try fewer words, a different field, or clear the filters.": "কম শব্দ লিখুন, অন্য ক্ষেত্র বেছে নিন বা ফিল্টার মুছে দিন।", "Could not load the catalogue": "ক্যাটালগ লোড করা যায়নি",
  "← Previous": "← আগের", "Next →": "পরের →", "Edition": "সংস্করণ", "Year": "সাল", "Shelf / rack": "তাক / র‍্যাক", "Category": "ধরন", "Read PDF": "পিডিএফ পড়ুন", "Log in to read the PDF": "পিডিএফ পড়তে লগ ইন করুন",
  "Edit in admin panel": "অ্যাডমিন প্যানেলে সম্পাদনা", "Borrow in my portal": "আমার পোর্টালে ধার নিন", "Reserve in my portal": "আমার পোর্টালে রিজার্ভ করুন", "Log in to borrow": "ধার নিতে লগ ইন করুন",

  /* ── E-Library ── */
  "Books, journals, notes and more": "বই, জার্নাল, নোট এবং আরও অনেক কিছু",
  "Digital books, journals, lecture notes, sheets and question banks provided by the university. Browse freely; sign in to read or download.": "বিশ্ববিদ্যালয় প্রদত্ত ডিজিটাল বই, জার্নাল, লেকচার নোট, শিট ও প্রশ্নব্যাংক। স্বাধীনভাবে ঘুরে দেখুন; পড়তে বা ডাউনলোড করতে সাইন ইন করুন।",
  "Search title, author, subject…": "শিরোনাম, লেখক, বিষয় খুঁজুন…", "Resource type": "রিসোর্সের ধরন", "Notes & sheets ": "নোট ও শিট", "Other": "অন্যান্য", "Log in to open files": "ফাইল খুলতে লগ ইন করুন",
  "Nothing here yet": "এখানে এখনও কিছু নেই", "No items match your filters.": "আপনার ফিল্টারের সাথে কোনো আইটেম মেলেনি।", "The library has not published any digital items yet. Please check back soon.": "লাইব্রেরি এখনও কোনো ডিজিটাল আইটেম প্রকাশ করেনি। অনুগ্রহ করে শীঘ্রই আবার দেখুন।",
  "Could not load the E-Library": "ই-লাইব্রেরি লোড করা যায়নি", "Type": "ধরন", "File": "ফাইল", "Read online": "অনলাইনে পড়ুন", "Download": "ডাউনলোড", "Log in to read or download": "পড়তে বা ডাউনলোড করতে লগ ইন করুন",
  "Book": "বই", "Notes": "নোট", "Question bank": "প্রশ্নব্যাংক", "Journal": "জার্নাল", "Notes & sheets  ": "নোট ও শিট",

  /* ── Services ── */
  "Everything the library offers": "লাইব্রেরি যা যা দেয়", "From borrowing a textbook to getting help with a research paper, these are the services available to members.": "পাঠ্যবই ধার নেওয়া থেকে গবেষণাপত্রে সহায়তা পাওয়া পর্যন্ত — সদস্যদের জন্য এই সেবাগুলো রয়েছে।",
  "Lending & circulation": "ধার ও সার্কুলেশন", "Borrow books with your library account, renew online and reserve titles that are on loan.": "লাইব্রেরি অ্যাকাউন্ট দিয়ে বই ধার নিন, অনলাইনে নবায়ন করুন এবং ধার দেওয়া বই রিজার্ভ করুন।",
  "OPAC catalogue": "ওপ্যাক ক্যাটালগ", "Search the whole collection by title, author, subject or ISBN and see live availability.": "শিরোনাম, লেখক, বিষয় বা আইএসবিএন দিয়ে পুরো সংগ্রহ খুঁজুন এবং সরাসরি প্রাপ্যতা দেখুন।",
  "E-library": "ই-লাইব্রেরি", "Read or download e-books, journals, lecture notes, question banks and more provided by the university.": "বিশ্ববিদ্যালয় প্রদত্ত ই-বুক, জার্নাল, লেকচার নোট, প্রশ্নব্যাংকসহ আরও অনেক কিছু পড়ুন বা ডাউনলোড করুন।",
  "Reading halls": "পাঠকক্ষ", "Quiet reading areas and group study tables for individual and team work.": "একক ও দলগত কাজের জন্য শান্ত পাঠ-এলাকা ও গ্রুপ স্টাডি টেবিল।",
  "Photocopy & print": "ফটোকপি ও প্রিন্ট", "Low-cost photocopying and printing at the service counter.": "সার্ভিস কাউন্টারে স্বল্পমূল্যে ফটোকপি ও প্রিন্ট।",
  "Research support": "গবেষণা সহায়তা", "Help with literature search, referencing and accessing licensed databases.": "সাহিত্য অনুসন্ধান, রেফারেন্সিং এবং লাইসেন্সপ্রাপ্ত ডাটাবেজে প্রবেশে সহায়তা।",
  "Wi-Fi & computers": "ওয়াই-ফাই ও কম্পিউটার", "Internet-connected computers and campus Wi-Fi inside the library.": "লাইব্রেরির ভেতরে ইন্টারনেট-সংযুক্ত কম্পিউটার ও ক্যাম্পাস ওয়াই-ফাই।",
  "Information skills sessions": "তথ্যদক্ষতা সেশন", "Short orientation and workshop sessions for new students and researchers.": "নতুন শিক্ষার্থী ও গবেষকদের জন্য সংক্ষিপ্ত ওরিয়েন্টেশন ও কর্মশালা।",
  "Borrowing rules at a glance": "ধার নেওয়ার নিয়ম এক নজরে", "These limits are set by the library and always shown here as currently in force.": "এই সীমাগুলো লাইব্রেরি নির্ধারণ করে এবং এখানে সবসময় বর্তমানে কার্যকর অবস্থায় দেখানো হয়।",
  "days per loan": "দিন প্রতি ধার", "books at a time": "একসাথে বই", "renewals × days": "নবায়ন × দিন", "fine per overdue day": "মেয়াদোত্তীর্ণ প্রতি দিনে জরিমানা", "Where": "কোথায়",
  "Search the catalogue": "ক্যাটালগে খুঁজুন", "Browse the E-Library": "ই-লাইব্রেরি ঘুরে দেখুন", "Ask the Helpdesk": "হেল্পডেস্কে জিজ্ঞাসা করুন",

  /* ── Helpdesk ── */
  "We are here to help": "আমরা সাহায্য করতে এখানে আছি", "Ask a question, report a problem or request a book. The library team replies by email.": "প্রশ্ন করুন, সমস্যা জানান বা বই চেয়ে অনুরোধ করুন। লাইব্রেরি টিম ইমেইলে উত্তর দেবে।",
  "Send us a message": "আমাদের বার্তা পাঠান", "Contact details": "যোগাযোগের তথ্য", "Your name": "আপনার নাম", "Topic": "বিষয়", "Message": "বার্তা", "How can we help?": "আমরা কীভাবে সাহায্য করতে পারি?", "Send message": "বার্তা পাঠান", "Sending…": "পাঠানো হচ্ছে…",
  "General question": "সাধারণ প্রশ্ন", "Account or login problem": "অ্যাকাউন্ট বা লগ ইন সমস্যা", "Book request / purchase suggestion": "বইয়ের অনুরোধ / কেনার পরামর্শ", "E-library access": "ই-লাইব্রেরি অ্যাক্সেস", "Fines and payments": "জরিমানা ও পরিশোধ", "Complaint or feedback": "অভিযোগ বা মতামত",
  "Frequently asked questions": "সচরাচর জিজ্ঞাসা",
  "How do I get a library account?": "আমি কীভাবে লাইব্রেরি অ্যাকাউন্ট পাব?", "Use Log in → User → Create an account and fill in your student details. You can start borrowing and reading e-resources immediately.": "লগ ইন → ইউজার → অ্যাকাউন্ট তৈরি করুন-এ গিয়ে আপনার শিক্ষার্থী তথ্য দিন। এরপর সঙ্গে সঙ্গে বই ধার নিতে ও ই-রিসোর্স পড়তে পারবেন।",
  "How many books can I borrow and for how long?": "আমি কয়টি বই কত দিনের জন্য ধার নিতে পারব?", "The current limits are shown on the Services page and in your portal. Loans can be renewed if nobody has reserved the book.": "বর্তমান সীমা সেবাসমূহ পেজে ও আপনার পোর্টালে দেখানো আছে। কেউ রিজার্ভ না করে থাকলে ধার নেওয়া বই নবায়ন করা যায়।",
  "How is the fine calculated?": "জরিমানা কীভাবে হিসাব করা হয়?", "A daily fine applies for each day a book is overdue. You can see any outstanding fine in My loans, and pay it at the circulation desk.": "বই ফেরতের মেয়াদ পার হলে প্রতিদিনের জন্য জরিমানা প্রযোজ্য। বকেয়া জরিমানা আমার ধার-এ দেখা যাবে এবং সার্কুলেশন ডেস্কে পরিশোধ করা যাবে।",
  "I cannot open an e-library file. What should I do?": "আমি ই-লাইব্রেরির ফাইল খুলতে পারছি না। কী করব?", "Log in first — files are for members only. If it still fails, send us the title and what you see on the screen using the form on this page.": "আগে লগ ইন করুন — ফাইল শুধু সদস্যদের জন্য। তারপরও না খুললে এই পেজের ফর্মে বইয়ের নাম ও স্ক্রিনে যা দেখছেন তা জানান।",
  "Can I suggest a book for the library?": "আমি কি লাইব্রেরির জন্য বই প্রস্তাব করতে পারি?", "Yes. Choose “Book request / purchase suggestion” in the form and include the title, author and edition.": "হ্যাঁ। ফর্মে “বইয়ের অনুরোধ / কেনার পরামর্শ” বেছে নিয়ে বইয়ের নাম, লেখক ও সংস্করণ লিখুন।",
  "Thank you! Your message has been sent. We will reply by email.": "ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে। আমরা ইমেইলে উত্তর দেব।", "Please enter your name, a valid email and a message.": "অনুগ্রহ করে আপনার নাম, সঠিক ইমেইল ও একটি বার্তা লিখুন।",
  "Could not load this page": "এই পেজ লোড করা যায়নি",

  /* ── Portal (member + admin) ── */
  "Website": "ওয়েবসাইট", "Log out": "লগ আউট", "Loading…": "লোড হচ্ছে…", "Administrator": "অ্যাডমিনিস্ট্রেটর", "Member": "সদস্য", "ADMIN PORTAL": "অ্যাডমিন পোর্টাল", "MEMBER PORTAL": "সদস্য পোর্টাল", "My profile": "আমার প্রোফাইল",
  "My library": "আমার লাইব্রেরি", "Browse books": "বই ব্রাউজ করুন", "My loans": "আমার ধার", "Reservations": "রিজার্ভেশন", "Profile": "প্রোফাইল", "Overview": "ওভারভিউ", "Loans": "ধার", "Members": "সদস্য", "Notices": "নোটিশ", "Messages": "বার্তা", "Pages": "পেজ", "Settings": "সেটিংস",
  "Manage the catalogue, e-library, loans, members, notices, website content and settings.": "ক্যাটালগ, ই-লাইব্রেরি, ধার, সদস্য, নোটিশ, ওয়েবসাইটের বিষয়বস্তু ও সেটিংস পরিচালনা করুন।",
  "+ Add book": "+ বই যোগ করুন", "+ Add member": "+ সদস্য যোগ করুন", "+ Issue book": "+ বই ইস্যু করুন", "+ New notice": "+ নতুন নোটিশ", "+ Upload file": "+ ফাইল আপলোড",
  "Active": "সক্রিয়", "Active loans": "চলমান ধার", "All departments": "সব বিভাগ", "Author / teacher": "লেখক / শিক্ষক", "Available only": "শুধু পাওয়া যায় এমন", "Book issued": "বই ইস্যু হয়েছে", "Books borrowed": "ধার নেওয়া বই", "Borrow": "ধার নিন", "Cancel": "বাতিল",
  "Change password": "পাসওয়ার্ড পরিবর্তন", "Complete your profile": "আপনার প্রোফাইল সম্পূর্ণ করুন", "Add your phone, department, batch and semester so the library can reach you.": "আপনার ফোন, বিভাগ, ব্যাচ ও সেমিস্টার যোগ করুন, যাতে লাইব্রেরি আপনার সাথে যোগাযোগ করতে পারে।",
  "Copies": "কপি", "Current password": "বর্তমান পাসওয়ার্ড", "Currently borrowed": "বর্তমানে ধার নেওয়া", "Date": "তারিখ", "Delete": "মুছুন", "Departments": "বিভাগসমূহ", "Description": "বিবরণ", "Details": "বিস্তারিত", "Due within 3 days": "৩ দিনের মধ্যে ফেরত", "E-library: books and notes": "ই-লাইব্রেরি: বই ও নোট",
  "Edit": "সম্পাদনা", "Facebook": "ফেসবুক", "Featured": "বিশেষ", "Fine paid": "জরিমানা পরিশোধিত", "Footer": "ফুটার", "Hidden": "লুকানো", "Home page": "হোম পেজ", "Icon": "আইকন", "Intro text": "ভূমিকা", "Label": "লেবেল", "Library rules": "লাইব্রেরির নিয়ম", "LinkedIn": "লিংকডইন", "Logo": "লোগো",
  "Management team": "ব্যবস্থাপনা টিম", "Mark read": "পঠিত করুন", "Mark returned": "ফেরত হিসেবে চিহ্নিত করুন", "Member email": "সদস্যের ইমেইল", "Messages from the contact form": "যোগাযোগ ফর্মের বার্তা", "My reservations": "আমার রিজার্ভেশন", "Name": "নাম", "New": "নতুন", "New password (min 8 characters)": "নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)",
  "No PDF": "পিডিএফ নেই", "No cover": "কভার নেই", "No file": "ফাইল নেই", "No logo": "লোগো নেই", "No messages yet.": "এখনও কোনো বার্তা নেই।", "No notices.": "কোনো নোটিশ নেই।", "No books found.": "কোনো বই পাওয়া যায়নি।", "No e-books or notes yet. The library staff will upload them here.": "এখনও কোনো ই-বুক বা নোট নেই। লাইব্রেরি কর্মীরা এখানে আপলোড করবেন।",
  "Notice board": "নোটিশ বোর্ড", "Notice saved": "নোটিশ সংরক্ষিত হয়েছে", "On loan": "ধার দেওয়া", "Open": "খুলুন", "Open profile": "প্রোফাইল খুলুন", "Open reservations": "রিজার্ভেশন খুলুন", "Outstanding fines": "বকেয়া জরিমানা", "Overdue": "মেয়াদোত্তীর্ণ", "Overdue loans": "মেয়াদোত্তীর্ণ ধার", "Profile photo": "প্রোফাইল ছবি",
  "Rack": "র‍্যাক", "Read": "পড়ুন", "Ready — borrow it now": "প্রস্তুত — এখনই ধার নিন", "Remove": "সরান", "Remove photo": "ছবি সরান", "Remove the current PDF": "বর্তমান পিডিএফ সরান", "Remove the current cover": "বর্তমান কভার সরান", "Renew": "নবায়ন", "Reserve": "রিজার্ভ", "Role": "ভূমিকা", "Role / position": "ভূমিকা / পদ",
  "Save About page": "‘সম্পর্কে’ পেজ সংরক্ষণ", "Save Helpdesk page": "হেল্পডেস্ক পেজ সংরক্ষণ", "Save Services page": "সেবা পেজ সংরক্ষণ", "Save departments": "বিভাগ সংরক্ষণ", "Save profile": "প্রোফাইল সংরক্ষণ", "Save rules": "নিয়ম সংরক্ষণ", "Save website content": "ওয়েবসাইটের বিষয়বস্তু সংরক্ষণ",
  "Show in New Arrivals": "নতুন সংযোজনে দেখান", "Social media links": "সোশ্যাল মিডিয়া লিংক", "Subject / category": "বিষয় / ধরন", "Subject / keywords": "বিষয় / কীওয়ার্ড", "Summary (shown in the catalogue)": "সারসংক্ষেপ (ক্যাটালগে দেখানো হয়)", "Suspended": "স্থগিত", "Titles / copies": "বই / কপি", "Unpaid fines": "অপরিশোধিত জরিমানা", "Update password": "পাসওয়ার্ড হালনাগাদ",
  "View page": "পেজ দেখুন", "Visible": "দৃশ্যমান", "Visible to members": "সদস্যদের কাছে দৃশ্যমান", "Answer": "উত্তর", "Question": "প্রশ্ন", "Student ID ": "স্টুডেন্ট আইডি", "Publisher ": "প্রকাশক", "X (Twitter)": "এক্স (টুইটার)", "WhatsApp": "হোয়াটসঅ্যাপ", "YouTube": "ইউটিউব", "Instagram": "ইনস্টাগ্রাম",
  "Phone, email, address, opening hours and map link are edited in the Website tab.": "ফোন, ইমেইল, ঠিকানা, খোলার সময় ও ম্যাপ লিংক ‘ওয়েবসাইট’ ট্যাবে সম্পাদনা করা যায়।", "These appear in the footer of the website.": "এগুলো ওয়েবসাইটের ফুটারে দেখানো হয়।", "The borrowing rules shown on this page come from the Settings tab.": "এই পেজে দেখানো ধার নেওয়ার নিয়ম ‘সেটিংস’ ট্যাব থেকে আসে।",
  "Please choose an image file": "অনুগ্রহ করে একটি ছবির ফাইল বেছে নিন", "One department per line": "প্রতি লাইনে একটি বিভাগ", "Services page": "সেবা পেজ", "Helpdesk page": "হেল্পডেস্ক পেজ", "About Library page": "‘লাইব্রেরি সম্পর্কে’ পেজ", "About (short)": "সংক্ষেপে পরিচিতি", "About text": "পরিচিতি লেখা",

  /* ── chatbot (shared) ── */
  "GBLMS Assistant": "জিবিএলএমএস সহকারী", "Close chat": "চ্যাট বন্ধ করুন", "Open AI chatbot": "এআই চ্যাটবট খুলুন", "Voice input": "ভয়েস ইনপুট", "Send message ": "বার্তা পাঠান"
};
const BN = Object.assign({}, BN_HOME, BN_PAGES);

/* ───────── engine ───────── */
const KEY = 'lang', BD = '০১২৩৪৫৬৭৮৯', bd = s => String(s).replace(/\d/g, d => BD[d]);
const getLang = () => { try { return localStorage.getItem(KEY) === 'bn' ? 'bn' : 'en'; } catch (_) { return 'en'; } };
let lang = getLang();
BN['GBLMS'] = BN['GBLMS'] || 'জিবিএলএমএস'; BN['Portal'] = BN['Portal'] || 'পোর্টাল';

// text that carries numbers (counts, page numbers, sizes …)
const PAT = [
  [/^(\d+) titles? found$/, m => `${bd(m[1])}টি শিরোনাম পাওয়া গেছে`],
  [/^(\d+) items?$/, m => `${bd(m[1])}টি আইটেম`],
  [/^(\d+) available$/, m => `${bd(m[1])}টি পাওয়া যাচ্ছে`],
  [/^(\d+) of (\d+) copies available$/, m => `${bd(m[2])}টির মধ্যে ${bd(m[1])}টি কপি পাওয়া যাচ্ছে`],
  [/^All (\d+) copies on loan$/, m => `সব ${bd(m[1])}টি কপি ধার দেওয়া আছে`],
  [/^Page (\d+) of (\d+)$/, m => `পৃষ্ঠা ${bd(m[1])} / ${bd(m[2])}`],
  [/^Download (.+)$/, m => `ডাউনলোড ${bd(m[1])}`],
  [/^Welcome back, (.+)\.$/, m => `স্বাগতম, ${m[1]}।`],
  [/^[\d,.+×৳\s]{1,9}$/, m => /\d/.test(m[0]) ? bd(m[0]) : null]
];
function tx(s) {
  const k = s.replace(/\s+/g, ' ').trim(); if (!k) return null;
  if (Object.prototype.hasOwnProperty.call(BN, k)) return BN[k];
  for (const [re, fn] of PAT) { const m = k.match(re); if (m) { const r = fn(m); if (r) return r; } }
  return null;
}
const SKIP = 'script, style, textarea, code, pre, [data-nobn], #drawer, #chatbtn';
const ATTRS = ['placeholder', 'aria-label', 'title'];
const textInfo = new WeakMap(), attrInfo = new WeakMap();

function doText(n) {
  const p = n.parentNode; if (!p || p.nodeType !== 1 || (p.closest && p.closest(SKIP))) return;
  let info = textInfo.get(n);
  if (!info || n.nodeValue !== info.out) info = { orig: n.nodeValue, out: null };      // new text, or changed by the page itself
  if (lang === 'bn') {
    const t = tx(info.orig);
    if (t) {
      if (p.tagName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', info.orig.trim());   // keep the real value (e.g. "All") when the label changes
      const out = info.orig.match(/^\s*/)[0] + t + info.orig.match(/\s*$/)[0];
      n.nodeValue = out; info.out = out;
    } else info.out = null;
  } else if (info.out !== null) { n.nodeValue = info.orig; info.out = null; }
  textInfo.set(n, info);
}
function doAttrs(el) {
  if (!el.getAttribute || (el.closest && el.closest(SKIP))) return;
  let rec = attrInfo.get(el); if (!rec) attrInfo.set(el, rec = {});
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a); let r = rec[a];
    if (!r || cur !== r.out) r = rec[a] = { orig: cur, out: null };
    if (lang === 'bn') { const t = tx(r.orig); if (t) { el.setAttribute(a, t); r.out = t; } else r.out = null; }
    else if (r.out !== null) { el.setAttribute(a, r.orig); r.out = null; }
  }
}
let titleOrig = null, titleOut = null;
function doTitle() {
  if (titleOrig === null || document.title !== titleOut) titleOrig = document.title;
  if (lang === 'bn') { titleOut = titleOrig.split(' · ').map(p => tx(p) || p).join(' · '); document.title = titleOut; }
  else if (titleOut !== null) { document.title = titleOrig; titleOut = null; }
}
function walk(root) {
  if (root.nodeType === 3) { doText(root); return; }
  if (root.nodeType !== 1) return;
  doAttrs(root); root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(doAttrs);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) doText(n);
}
function syncUi() {
  document.documentElement.lang = lang;
  document.querySelectorAll('#lang').forEach(b => { const t = lang === 'bn' ? 'EN' : 'বাং'; if (b.textContent !== t) b.textContent = t; b.setAttribute('aria-label', lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'); b.title = b.getAttribute('aria-label'); b.setAttribute('data-nobn', ''); });
}

/* watch the page: anything added later (API results, dialogs, toasts …) is translated too */
const obs = new MutationObserver(muts => { pending.push(...muts); if (!raf) raf = requestAnimationFrame(flush); });
let pending = [], raf = 0;
const OPTS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
function flush() {
  raf = 0; obs.disconnect();
  try {
    const list = pending.splice(0);
    for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
    }
    syncUi(); if (lang === 'bn' || titleOut !== null) doTitle();
  } finally { obs.observe(document.documentElement, OPTS); }
}
function setLang(l, silent) {
  lang = l === 'bn' ? 'bn' : 'en';
  try { localStorage.setItem(KEY, lang); } catch (_) { }
  obs.disconnect(); walk(document.body); doTitle(); syncUi(); obs.observe(document.documentElement, OPTS);
  if (!silent) window.dispatchEvent(new CustomEvent('gb:lang', { detail: lang }));
}
document.addEventListener('click', e => { if (e.target.closest('#lang')) setLang(lang === 'bn' ? 'en' : 'bn'); });
addEventListener('storage', e => { if (e.key === KEY) setLang(getLang()); });          // another tab changed it

const st = document.createElement('style');
st.textContent = `html[lang=bn] body, html[lang=bn] input, html[lang=bn] select, html[lang=bn] textarea, html[lang=bn] button, html[lang=bn] h1, html[lang=bn] h2, html[lang=bn] h3, html[lang=bn] h4, html[lang=bn] .btn, html[lang=bn] .pill { font-family: 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif !important; letter-spacing: normal !important; } html[lang=bn] body { line-height: 1.7; }`;
document.head.append(st);
window.GBI18N = { get lang() { return lang; }, set: setLang, t: s => (lang === 'bn' && tx(s)) || s, sync: syncUi };
lang = getLang(); document.documentElement.lang = lang;
if (lang === 'bn') { walk(document.body); doTitle(); }
syncUi(); obs.observe(document.documentElement, OPTS);

})();
