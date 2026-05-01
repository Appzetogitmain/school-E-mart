import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const Footer = () => {
  return (
    <footer className="bg-primary text-black pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center group cursor-pointer">
              <img src="/assets/logo.jpeg" alt="School E-Mart" className="h-10 w-auto bg-white rounded-lg p-1 transition-transform group-hover:scale-110" />
              <span className="ml-3 text-xl font-medium tracking-tight group-hover:text-accent-orange transition-colors">School E-Mart</span>
            </div>
            <p className="text-black/60 text-[13px] leading-relaxed font-normal">
              India's premier B2B marketplace for school supplies, uniforms, and educational technology. Streamlining institutional procurement through transparency and verified vendors.
            </p>
            <div className="flex space-x-4">
              {/* Social icons removed temporarily */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[15px] font-semibold mb-6 tracking-wide uppercase text-black/40">Quick Links</h4>
            <ul className="space-y-4 text-black/60 text-sm font-normal">
              <li><Link to={ROUTES.ABOUT} className="hover:text-accent-orange transition-colors">About Us</Link></li>
              <li><Link to={ROUTES.HOW_IT_WORKS} className="hover:text-accent-orange transition-colors">Buy/Sell With Us</Link></li>
              {/* <li><Link to={ROUTES.REGISTER} className="hover:text-accent-orange transition-colors text-accent-green font-medium">Sell with Us</Link></li> */}
              <li><Link to={ROUTES.PRIVACY} className="hover:text-accent-orange transition-colors">Privacy Policy</Link></li>
              <li><Link to={ROUTES.TERMS} className="hover:text-accent-orange transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[15px] font-semibold mb-6 tracking-wide uppercase text-black/40">Support</h4>
            <ul className="space-y-4 text-black/60 text-sm font-normal">
              <li><Link to={ROUTES.HELP_CENTER} className="hover:text-accent-orange transition-colors">Help Center</Link></li>
              <li><Link to={ROUTES.TRACK_ORDER} className="hover:text-accent-orange transition-colors">Track Order</Link></li>
              <li><Link to={ROUTES.REFUND_POLICY} className="hover:text-accent-orange transition-colors">Refund Policy</Link></li>
              {/* <li><a href="#" className="hover:text-accent-orange transition-colors">Complaint System</a></li> */}
              <li><Link to={ROUTES.SCHOOL_FAQ} className="hover:text-accent-orange transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-[15px] font-semibold mb-6 tracking-wide uppercase text-black/40">Contact Us</h4>
            <ul className="space-y-4 text-black/60 text-[13px] font-normal leading-relaxed">
              <li className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-accent-orange group-hover:bg-accent-orange group-hover:text-black transition-all">
                  <Phone size={16} />
                </div>
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-accent-orange group-hover:bg-accent-orange group-hover:text-black transition-all">
                  <Mail size={16} />
                </div>
                <span>support@schoolemart.com</span>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-accent-orange group-hover:bg-accent-orange group-hover:text-black transition-all shrink-0">
                  <MapPin size={16} />
                </div>
                <span className="text-black/50">123, Education Hub, Knowledge Park, New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="border-t border-black/10 pt-12 mb-12 space-y-10">
          {/* Categories Grid */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-semibold tracking-wider text-black titlecase">Categories</h4>
            <div className="space-y-2.5 text-[11px] text-black/40 leading-relaxed titlecase tracking-wide">
              <p><strong className="text-black/60">Furniture & Accessories</strong> - Boarding | Cafeteria | Classroom & Art Room | Library & Office | Play School & Day Care | Role Play | Storage & Laboratory</p>
              <p><strong className="text-black/60">Teaching & Learning</strong> - All Books | Educational Software | Montessori Language | Montessori Mathematics | Pre-School | Toddlers | Music | Note Books | Puzzle Games | Puzzle Mathematics | Puzzle Word | Text Books</p>
              <p><strong className="text-black/60">Toys & Sports</strong> - Fitness Indoor Play | Outdoor Play | Play School | Puppets</p>
              <p><strong className="text-black/60">Technology</strong> - Amplifiers & Speaker | Anti Virus & Office Software | Audio Accessories | Cameras & CCTV Accessories | Computer Accessories | Document Camera | DVR | Interactive Whiteboard | Laptops, Desktop & Monitors | Laser Pen | Networking & Internet Devices | Operating System | Pendrives & Memory Card | Printer & Inks | Projectors & Accessories | School Management | Student Assessment System | Podium</p>
              <p><strong className="text-black/60">Office & Stationery</strong> - Art & Craft | Binders | Corrections | Desk Accessories | Erasers & Sharpners | Files & Folders | Geometry Set | Markers & Highlighters | Office Electronics | Paper & Cards | Pencil Box | Pencils | Pens & Refills | Staplers & Punches | Sticky Notes</p>
              <p><strong className="text-black/60">Uniform, Shoes & Accessories</strong> - Caps, Tie & Belt | Formal Shoes | Formal Uniform | Lunch Box | Others | Sandals & Floaters | School Bags | Sneakers | Sports & Outdoor | Sports Uniform</p>
              <p><strong className="text-black/60">Electrical</strong> - Cables & Wires | Circuit Breaker | Conduits | Distribution Boards | Electrical Accessories | Electrical Appliances | Lights, Bulbs & Fittings | Power Back-up System | Switches & Accessories</p>
              <p><strong className="text-black/60">Bathroom</strong> - Bath Accessories | Commodes | Electronic Flushing System | Health Faucets | Mirrors | Quater & Half Turn Faucets | Sensor Taps | Showers | Single Liver | Special Needs Range | Urinals | Wash Basins | Wellness</p>
              <p><strong className="text-black/60">Plumbing</strong> - Consumables | Pipes & Fittings | Valves & Solvent | Water Tank | Other Accessories</p>
              <p><strong className="text-black/60">Transport</strong> - Bus Van</p>
            </div>
          </div>

          {/* Brands Section */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-semibold tracking-wider text-black titlecase">Brands selling on School E-Mart</h4>
            <div className="text-[11px] text-black/40 leading-loose titlecase tracking-wide">
              PLAY ON INDIA • WWWONLINEyogalifeCOM • EDU EDGE • NCOMPUTING ZERO CLIENT • ATHARVA BOOKS TRADING COMPANY • IDREAM • SUVEECHI • BRAINFEED • SIPOH CORP • MAHALAKSHMI ENTERPRISES • LITTLE FINGERS • LITTLE TIKES • K SQUARE EDUTAINMENT • GOGRAAMEEN • SKILL O FUN • PUNNKFUNNK • SMARTSTATION • ALTOP • SANDART • TELETUTOR • BUTTERFLYFIELDS • CHILDWOOD • INFINITI • NIKE • WORDSMITHS ENTERPRIZE • KIDKEN • RAJMANGAL PUBLISHERS • EUROPEAN EDUCATIONALL GROUP • NINGBO LTD • ALMOE DIGITAL SOLUTIONS • KRAB MEDIA AND MARKETING PVT LTD • WRITEONWALLS • VIEWSONIC • ICTS • LEARNERS WORLD • MAXHUB • S2S CLASSES
            </div>
          </div>

          {/* Search Keywords Section */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-semibold tracking-wider text-black titlecase">What schools are searching on School E-Mart</h4>
            <div className="text-[11px] text-black/40 leading-loose titlecase tracking-wide">
              Kids Study Table • Kids Table • Write On Wall • Toys For Baby • Train • Train Toy • Sandisk Cruzer Blade 4gb Usb 2.0 Pen Drive • Double Seater • Single Seater • Trapezium Table • Apple Table • Big Rectangle Table • Storage Shelf Open & "Shelfie" • Apsara Glass Marking Pencils • White Pack Of 10 • Promethean • Youtube • Plastic Big Blocks (Set Of 45pcs) • Germs • Call 99 • Fingers • Little Fingers • Ncomputting • Micro Comp • N Computting • X99biometric Attendance System • 88 • Rocker • Children Cot • Gorilla Scissor Small Gs-16 • 3 Shapes Puzzle • Car • Touch Tablets • Clothes • Jk A4 • Jk Copier A4 Paper • Toys Blocks • 6 Seater Classroom Kids Plastic Rectangle Table (Chairs Not Included) • L • A4 Copier Paper • Table And Chairs • Big Table And Chairs • Plastic Handle Chair • Plastic Toys • Plastic Balls • Play Area • Slate With Line • Sandisk Cruzer Blade Sdcz5008g I35 8gb Usb 2.0 Pen Drive • Blue Cot • Slate With Line & Square • Kangaro Dp-28paper Punch(Assorted) • Multicolour Swing • Lizol • Dettol • Odonil • Pulley • Smart Boards • Toy Trolley • Copier Paper • Trapezium Table Without Chairs (Red,Blue,Green,Yellow) • Cycle • Sandart School Starter Kit (25 Bookmarks Pack) • Learner World • Ok Play • Online • Jumbo File Folder • Learners World • Plastic Bench • Li • M • B • Dell Projector • X990 • X99attendance Biometrics & Rfid Device • Sandpit • Tricycle • Speedo Tricycle • Newspaper • Mind Map • Newspaper • Pencils Pack Of 1pencil • Okplay • Nets • Speedo • Pacer • Rack • Ball • Black And White Boards • Slide • Wooden Slide • Papers • Shoerack
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-black/5 text-center text-black/30 text-[11px] font-medium tracking-widest titlecase">
          <p>© {new Date().getFullYear()} School E-Mart. All Rights Reserved. Built with ❤️ for Education.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
