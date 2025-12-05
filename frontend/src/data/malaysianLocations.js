export const malaysianStates = {
  "Johor": [
    "Johor Bahru", "Batu Pahat", "Muar", "Kluang", "Pontian", "Segamat", 
    "Kulai", "Kota Tinggi", "Mersing", "Tangkak"
  ],
  "Kedah": [
    "Alor Setar", "Sungai Petani", "Kulim", "Jitra", "Baling", "Langkawi", 
    "Kuala Kedah", "Pendang", "Kubang Pasu"
  ],
  "Kelantan": [
    "Kota Bharu", "Kuala Krai", "Tanah Merah", "Pasir Mas", "Gua Musang", 
    "Bachok", "Machang", "Pasir Puteh", "Tumpat", "Wakaf Bharu"
  ],
  "Melaka": [
    "Melaka City", "Alor Gajah", "Jasin", "Merlimau", "Masjid Tanah"
  ],
  "Negeri Sembilan": [
    "Seremban", "Port Dickson", "Nilai", "Rembau", "Tampin", "Kuala Pilah", 
    "Jelebu", "Jempol", "Senawang"
  ],
  "Pahang": [
    "Kuantan", "Temerloh", "Bentong", "Raub", "Jerantut", "Pekan", 
    "Kuala Lipis", "Cameron Highlands", "Mentakab", "Maran"
  ],
  "Penang": [
    "George Town", "Butterworth", "Bukit Mertajam", "Nibong Tebal", 
    "Permatang Pauh", "Tanjung Tokong", "Bayan Lepas", "Air Itam"
  ],
  "Perak": [
    "Ipoh", "Taiping", "Teluk Intan", "Sitiawan", "Kuala Kangsar", 
    "Lumut", "Parit Buntar", "Batu Gajah", "Kampar", "Tanjung Malim"
  ],
  "Perlis": [
    "Kangar", "Arau", "Padang Besar", "Kuala Perlis"
  ],
  "Sabah": [
    "Kota Kinabalu", "Sandakan", "Tawau", "Lahad Datu", "Keningau", 
    "Kota Belud", "Kudat", "Semporna", "Beaufort", "Ranau"
  ],
  "Sarawak": [
    "Kuching", "Miri", "Sibu", "Bintulu", "Limbang", "Sarikei", 
    "Sri Aman", "Kapit", "Betong", "Mukah"
  ],
  "Selangor": [
    "Shah Alam", "Petaling Jaya", "Subang Jaya", "Klang", "Kajang", 
    "Ampang", "Selayang", "Puchong", "Seri Kembangan", "Bangi", 
    "Cyberjaya", "Putrajaya", "Sepang", "Rawang", "Banting"
  ],
  "Terengganu": [
    "Kuala Terengganu", "Kemaman", "Dungun", "Chukai", "Kuala Berang", 
    "Marang", "Jerteh", "Besut", "Setiu"
  ],
  "Kuala Lumpur": [
    "Ampang", "Bandar Tun Razak", "Bangsar", "Bangsar South", "Batu", 
    "Brickfields", "Bukit Bintang", "Bukit Jalil", "Cheras", "Chinatown", 
    "Damansara Heights", "Desa Parkcity", "Golden Triangle", "Kepong", 
    "KLCC", "Lembah Pantai", "Mont Kiara", "Segambut", "Sentul", 
    "Seputeh", "Setapak", "Setiawangsa", "Sri Hartamas", "Sri Petaling", 
    "Sungai Besi", "Titiwangsa", "TTDI", "Wangsa Maju"
  ],
  "Labuan": [
    "Victoria", "Rancha-Rancha", "Pohon Batu", "Layang-Layangan"
  ],
  "Putrajaya": [
    "Putrajaya"
  ]
};

export const getStatesList = () => {
  return Object.keys(malaysianStates).sort();
};

export const getCitiesByState = (state) => {
  return malaysianStates[state] || [];
};