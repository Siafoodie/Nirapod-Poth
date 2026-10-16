require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const SafePlace = require("../models/SafePlace");

// Data source (document for T-10.1 AC):
// - Public directories / known Dhaka landmarks (approx coordinates)
// - Categories: police, hospital, pharmacy, shelter
// - For demo/academic use; production should use official GIS datasets

const places = [
  // ===== POLICE (Dhaka) =====
  { name: "Mirpur Model Police Station", category: "police", address: "Mirpur-10, Dhaka", lng: 90.368, lat: 23.8069, phone: "02-9000001", isOpen247: true },
  { name: "Gulshan Police Station", category: "police", address: "Gulshan-1, Dhaka", lng: 90.4152, lat: 23.7808, phone: "02-9880001", isOpen247: true },
  { name: "Dhanmondi Police Station", category: "police", address: "Dhanmondi, Dhaka", lng: 90.375, lat: 23.7461, phone: "02-9110001", isOpen247: true },
  { name: "Uttara West Police Station", category: "police", address: "Uttara Sector 7, Dhaka", lng: 90.391, lat: 23.875, phone: "02-8910001", isOpen247: true },
  { name: "Motijheel Police Station", category: "police", address: "Motijheel, Dhaka", lng: 90.417, lat: 23.733, phone: "02-9560001", isOpen247: true },
  { name: "Ramna Police Station", category: "police", address: "Ramna, Dhaka", lng: 90.401, lat: 23.738, phone: "02-9350001", isOpen247: true },
  { name: "Tejgaon Police Station", category: "police", address: "Tejgaon, Dhaka", lng: 90.392, lat: 23.763, phone: "02-9112001", isOpen247: true },
  { name: "Mohammadpur Police Station", category: "police", address: "Mohammadpur, Dhaka", lng: 90.358, lat: 23.763, phone: "02-9113001", isOpen247: true },
  { name: "Pallabi Police Station", category: "police", address: "Pallabi, Mirpur, Dhaka", lng: 90.365, lat: 23.825, phone: "02-9001001", isOpen247: true },
  { name: "Badda Police Station", category: "police", address: "Badda, Dhaka", lng: 90.425, lat: 23.78, phone: "02-9881001", isOpen247: true },
  { name: "Wari Police Station", category: "police", address: "Wari, Dhaka", lng: 90.42, lat: 23.71, phone: "02-7110001", isOpen247: true },
  { name: "Shahbagh Police Station", category: "police", address: "Shahbagh, Dhaka", lng: 90.395, lat: 23.739, phone: "02-9660001", isOpen247: true },
  { name: "Khilgaon Police Station", category: "police", address: "Khilgaon, Dhaka", lng: 90.425, lat: 23.75, phone: "02-7210001", isOpen247: true },
  { name: "Cantonment Police Station", category: "police", address: "Dhaka Cantonment", lng: 90.395, lat: 23.82, phone: "02-8710001", isOpen247: true },
  { name: "Savar Police Station", category: "police", address: "Savar, Dhaka", lng: 90.27, lat: 23.86, phone: "02-7700001", isOpen247: true },

  // ===== HOSPITALS =====
  { name: "Popular Hospital", category: "hospital", address: "Dhanmondi, Dhaka", lng: 90.3755, lat: 23.7465, phone: "02-9660015", isOpen247: true },
  { name: "Square Hospital", category: "hospital", address: "Panthapath, Dhaka", lng: 90.382, lat: 23.752, phone: "02-8159457", isOpen247: true },
  { name: "Evercare Hospital Dhaka", category: "hospital", address: "Bashundhara, Dhaka", lng: 90.43, lat: 23.81, phone: "02-8431661", isOpen247: true },
  { name: "Dhaka Medical College Hospital", category: "hospital", address: "Secretariate Road, Dhaka", lng: 90.398, lat: 23.726, phone: "02-55165088", isOpen247: true },
  { name: "BSMMU (PG Hospital)", category: "hospital", address: "Shahbagh, Dhaka", lng: 90.3955, lat: 23.7395, phone: "02-55165760", isOpen247: true },
  { name: "Kurmitola General Hospital", category: "hospital", address: "Kurmitola, Dhaka", lng: 90.4, lat: 23.84, phone: "02-55060001", isOpen247: true },
  { name: "Holy Family Red Crescent Hospital", category: "hospital", address: "Eskaton, Dhaka", lng: 90.405, lat: 23.747, phone: "02-8311721", isOpen247: true },
  { name: "Ibn Sina Hospital", category: "hospital", address: "Dhanmondi, Dhaka", lng: 90.377, lat: 23.748, phone: "02-8119513", isOpen247: true },
  { name: "Labaid Specialized Hospital", category: "hospital", address: "Dhanmondi, Dhaka", lng: 90.374, lat: 23.745, phone: "02-9676356", isOpen247: true },
  { name: "Birdem General Hospital", category: "hospital", address: "Shahbagh, Dhaka", lng: 90.396, lat: 23.738, phone: "02-9661551", isOpen247: true },
  { name: "United Hospital", category: "hospital", address: "Gulshan, Dhaka", lng: 90.416, lat: 23.804, phone: "02-8836000", isOpen247: true },
  { name: "Apollo Imperial Hospital", category: "hospital", address: "Chattogram Road (ref Dhaka network)", lng: 90.42, lat: 23.79, phone: "02-55000000", isOpen247: true },
  { name: "National Heart Foundation", category: "hospital", address: "Mirpur, Dhaka", lng: 90.365, lat: 23.804, phone: "02-58054708", isOpen247: true },
  { name: "Anwer Khan Modern Hospital", category: "hospital", address: "Dhanmondi, Dhaka", lng: 90.373, lat: 23.744, phone: "02-9670295", isOpen247: true },
  { name: "Sir Salimullah Medical College Hospital", category: "hospital", address: "Mitford, Dhaka", lng: 90.405, lat: 23.71, phone: "02-57315029", isOpen247: true },

  // ===== PHARMACIES =====
  { name: "Lazz Pharma", category: "pharmacy", address: "Mirpur, Dhaka", lng: 90.3685, lat: 23.8075, phone: "01700000001", isOpen247: false },
  { name: "Lazz Pharma Dhanmondi", category: "pharmacy", address: "Dhanmondi 27, Dhaka", lng: 90.376, lat: 23.747, phone: "01700000002", isOpen247: true },
  { name: "Medicine Point Gulshan", category: "pharmacy", address: "Gulshan-2, Dhaka", lng: 90.414, lat: 23.792, phone: "01700000003", isOpen247: true },
  { name: "Popular Pharmacy Uttara", category: "pharmacy", address: "Uttara Sector 3, Dhaka", lng: 90.39, lat: 23.87, phone: "01700000004", isOpen247: false },
  { name: "Health Care Pharmacy Banani", category: "pharmacy", address: "Banani, Dhaka", lng: 90.405, lat: 23.794, phone: "01700000005", isOpen247: true },
  { name: "Arogga Pharmacy Motijheel", category: "pharmacy", address: "Motijheel, Dhaka", lng: 90.418, lat: 23.732, phone: "01700000006", isOpen247: false },
  { name: "Wellbeing Pharmacy Mohammadpur", category: "pharmacy", address: "Mohammadpur, Dhaka", lng: 90.36, lat: 23.765, phone: "01700000007", isOpen247: true },
  { name: "City Pharmacy Tejgaon", category: "pharmacy", address: "Tejgaon, Dhaka", lng: 90.393, lat: 23.76, phone: "01700000008", isOpen247: false },
  { name: "Green Life Pharmacy", category: "pharmacy", address: "Green Road, Dhaka", lng: 90.385, lat: 23.75, phone: "01700000009", isOpen247: true },
  { name: "Trust Pharmacy Badda", category: "pharmacy", address: "Badda, Dhaka", lng: 90.426, lat: 23.781, phone: "01700000010", isOpen247: false },

  // ===== SHELTERS / CRISIS (safe spaces) =====
  { name: "BNWLA Crisis Centre", category: "shelter", address: "Dhaka", lng: 90.4, lat: 23.75, phone: "01715151515", isOpen247: true },
  { name: "Acid Survivors Foundation", category: "shelter", address: "Mohakhali, Dhaka", lng: 90.4, lat: 23.78, phone: "01713000000", isOpen247: false },
  { name: "Ain o Salish Kendra (ASK)", category: "shelter", address: "Lalmatia, Dhaka", lng: 90.37, lat: 23.755, phone: "02-8115851", isOpen247: false },
  { name: "BLAST Legal Aid", category: "shelter", address: "Kakrail, Dhaka", lng: 90.41, lat: 23.735, phone: "02-8391970", isOpen247: false },
  { name: "Naripokkho Support Point", category: "shelter", address: "Dhaka", lng: 90.39, lat: 23.76, phone: "02-8119868", isOpen247: false },
  { name: "Women Support Center Mirpur", category: "shelter", address: "Mirpur, Dhaka", lng: 90.37, lat: 23.81, phone: "109", isOpen247: true },
  { name: "One Stop Crisis Centre DMCH", category: "shelter", address: "DMCH, Dhaka", lng: 90.3985, lat: 23.7265, phone: "02-55165088", isOpen247: true },
  { name: "BRAC Gender Justice Desk", category: "shelter", address: "Mohakhali, Dhaka", lng: 90.402, lat: 23.777, phone: "16445", isOpen247: false },
  { name: "Police Women Help Desk Gulshan", category: "shelter", address: "Gulshan PS, Dhaka", lng: 90.415, lat: 23.781, phone: "999", isOpen247: true },
  { name: "Community Safe Space Uttara", category: "shelter", address: "Uttara, Dhaka", lng: 90.392, lat: 23.872, phone: "109", isOpen247: true },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected. Seeding", places.length, "places...");

  await SafePlace.deleteMany({}); // clean demo re-seed

  const docs = places.map((p) => ({
    name: p.name,
    category: p.category,
    address: p.address,
    phone: p.phone,
    isOpen247: p.isOpen247,
    city: "Dhaka",
    verified: true,
    source: "manual-seed-public-landmarks",
    coordinates: [p.lng, p.lat],
    location: { type: "Point", coordinates: [p.lng, p.lat] },
  }));

  await SafePlace.insertMany(docs);
  const count = await SafePlace.countDocuments();
  console.log("Done. Total safe places:", count);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
}); 