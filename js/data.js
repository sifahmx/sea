/* Default website content. Everything here can be changed from the Admin page. */
window.DEFAULTS = {
  site: {
    name: "Sea Transport",
    tagline: "Travel Allowance Log",
    logo: "images/logo.png", // data URL or image link; empty = built-in logo
    primary: "#39bbb0",
    accent: "#f2b705",
    fuelUnit: "L"
  },
  hero: [
    {
      title: "Every trip, logged in seconds",
      text: "Record speedboat trips, staff on board and fuel usage from any phone, tablet or computer.",
      button: "Log a Trip",
      link: "#/new",
      image: "",
      gradient: "linear-gradient(135deg,#24497f 0%,#1f3b6e 55%,#152a50 100%)"
    },
    {
      title: "Clear records for travel allowance",
      text: "Search, filter and export trip records by month, boat or department. Ready for Excel.",
      button: "View Records",
      link: "#/records",
      image: "",
      gradient: "linear-gradient(135deg,#2f6db5 0%,#24558f 60%,#1f3b6e 100%)"
    },
    {
      title: "Paper or digital, your choice",
      text: "Print blank trip slips and monthly log sheets for the boat, then enter them later.",
      button: "Print Forms",
      link: "#/print",
      image: "",
      gradient: "linear-gradient(135deg,#1a5aa6 0%,#1f4a85 55%,#18325d 100%)"
    }
  ],
  home: {
    featuresTitle: "How it works",
    featuresText: "A simple workflow for sea transport and allowance records.",
    features: [
      { title: "Log a trip", text: "Fill in the boat, department, times, staff and fuel. Total hours are calculated for you.", link: "#/new" },
      { title: "Review records", text: "See all trips with totals for hours and fuel, filter by month, and export to CSV.", link: "#/records" },
      { title: "Print paper forms", text: "Use printable trip slips and log sheets when there is no device on board.", link: "#/print" }
    ],
    ctaTitle: "Ready to record a trip?",
    ctaText: "It takes less than a minute."
  },
  form: {
    title: "Log a Trip",
    intro: "Fill in the trip details below. Fields marked * are required."
  },
  labels: {
    nav: { home: "Home", new: "Log Trip", records: "Records", print: "Print Forms", admin: "Admin", cta: "New Trip", login: "Staff Login" },
    fields: {
      date: "Date", boat: "Speedboat Name", department: "Department",
      start: "Trip Start Time", end: "Trip End Time", hours: "Total Trip Hrs",
      details: "Trip Details", staff: "Staff Names", otherStaff: "Other staff not in the list",
      fuelTopUp: "Fuel Top up", fuelUsed: "Fuel Used", submittedBy: "Submitted By"
    },
    pages: {
      recordsTitle: "Trip Records",
      recordsText: "Search, filter, print and export all logged trips.",
      printTitle: "Print Forms",
      printText: "Blank paper forms for use on the boat. Enter them on the website later.",
      slipTitle: "Speedboat Trip Slip",
      sheetTitle: "Monthly Trip Log Sheet",
      successTitle: "Trip submitted",
      loginTitle: "Staff Login",
      loginText: "Log in with your name and PIN to add trips."
    }
  },
  footer: {
    about: "Sea transport trip and travel allowance records.",
    phone: "",
    email: "",
    address: "",
    copyright: "All rights reserved."
  },
  lists: {
    staff: [
      "Mohamed Zoreef", "Ahmed Shareef", "Yoosuf Irumeen", "Hussain Faheem", "Ahmed Huzam",
      "Abdulla Ismail", "Mohamed Solah", "Mohamed Naveen", "Ibrahim Unaish", "Ibrahim Rasheed",
      "Hassan Areesh", "Ahmed Qasim", "Adam Maashal", "Ibrahim Ijlal", "Abdulla Shiham",
      "Mohamed Jameel", "Ismail Yaish"
    ],
    departments: [
      "Southern Regional Department",
      "Customer Services and Billing Department",
      "Property Maintenance and Infrastructure Development Department",
      "Finance and Accounts Department",
      "Information Technology and Software Engineering Department",
      "Male' Transmission and Distribution Department",
      "Male' Power Generation Department",
      "Business Centre",
      "Hulhumale' Transmission and Distribution Department",
      "Corporate Affairs Department",
      "Water Sewerage and Waste Management",
      "Projects Planning and Development Department",
      "Legal Department",
      "Managing Director's Bureau",
      "Senior Management",
      "Villimale Power Generation Department",
      "Procurement Department",
      "Human Resources and Training Department",
      "Renewable Energy Department",
      "Internal Audit",
      "Hulhumale' Power Generation Department",
      "Northern Regional Department",
      "North Central Regional Department"
    ],
    boats: [
      "Hedheygiri speed", "Handhugiri speed", "Handheygiri dhoni", "Hired",
      "Furamaana 1", "Furamaana 2", "Furamaana 3", "Furamaana 4",
      "Furamaana 5", "Furamaana 6", "Furamaana 7", "Furamaana 8"
    ]
  }
};
