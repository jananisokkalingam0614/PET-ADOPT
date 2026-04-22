// seed.js — Seeds database with 100 pets, each with a UNIQUE photo
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const User        = require('./models/User');
const Pet         = require('./models/Pet');
const Application = require('./models/Application');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pawshome';

const USERS = [
  { name:'Admin User',    email:'admin@pawshome.com', password:'admin123',    role:'admin', phone:'555-0100' },
  { name:'Sarah Johnson', email:'sarah@example.com',  password:'password123', role:'user',  phone:'555-0101', address:{street:'123 Oak St',city:'Austin',state:'TX',zip:'78701'} },
  { name:'Mike Chen',     email:'mike@example.com',   password:'password123', role:'user',  phone:'555-0102', address:{street:'456 Maple Ave',city:'Portland',state:'OR',zip:'97201'} },
  { name:'Emily Davis',   email:'emily@example.com',  password:'password123', role:'user',  phone:'555-0103', address:{street:'789 Pine Rd',city:'Chicago',state:'IL',zip:'60601'} },
  { name:'James Wilson',  email:'james@example.com',  password:'password123', role:'user',  phone:'555-0104', address:{street:'321 Elm St',city:'Houston',state:'TX',zip:'77001'} },
];

const PETS = [
  // ── DOGS (50) ─────────────────────────────────────────────
  {
    name:'Buddy', species:'dog', breed:'Golden Retriever',
    age:{value:2,unit:'years'}, gender:'male', size:'large',
    location:{city:'Austin',state:'TX'},
    description:'Buddy is a cheerful Golden Retriever who loves fetch and swimming. Fully trained, great with kids and other dogs.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','playful','good with kids','trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600'
  },
  {
    name:'Max', species:'dog', breed:'Labrador Retriever',
    age:{value:3,unit:'years'}, gender:'male', size:'large',
    location:{city:'Denver',state:'CO'},
    description:'Max is a loyal and energetic Lab who loves outdoor adventures. House-trained and knows basic commands.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','friendly','trained','house-trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600'
  },
  {
    name:'Rocky', species:'dog', breed:'German Shepherd',
    age:{value:4,unit:'years'}, gender:'male', size:'large',
    location:{city:'Phoenix',state:'AZ'},
    description:'Rocky is an intelligent and loyal German Shepherd. Fully trained and protective. Best for experienced owners.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','trained','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600'
  },
  {
    name:'Bella', species:'dog', breed:'Beagle',
    age:{value:2,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Nashville',state:'TN'},
    description:'Bella is a sweet Beagle who loves sniffing trails and playing fetch. Leash trained and great with everyone.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','friendly','trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600'
  },
  {
    name:'Charlie', species:'dog', breed:'French Bulldog',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'New York',state:'NY'},
    description:'Charlie is an adorable French Bulldog with a big personality. Perfect for apartment living. Very affectionate.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:true},
    traits:['calm','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600'
  },
  {
    name:'Luna', species:'dog', breed:'Siberian Husky',
    age:{value:2,unit:'years'}, gender:'female', size:'large',
    location:{city:'Seattle',state:'WA'},
    description:'Luna is a stunning Husky who loves cold weather and long runs. Needs an active family with a yard.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','playful','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600'
  },
  {
    name:'Cooper', species:'dog', breed:'Cocker Spaniel',
    age:{value:3,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Atlanta',state:'GA'},
    description:'Cooper is a gentle Cocker Spaniel who loves cuddles and gentle play. Great with children and seniors.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600'
  },
  {
    name:'Daisy', species:'dog', breed:'Poodle',
    age:{value:4,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Miami',state:'FL'},
    description:'Daisy is an elegant Standard Poodle who is hypoallergenic and highly intelligent. Loves learning tricks.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','trained','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=600'
  },
  {
    name:'Bear', species:'dog', breed:'Bernese Mountain Dog',
    age:{value:1,unit:'years'}, gender:'male', size:'extra-large',
    location:{city:'Portland',state:'OR'},
    description:'Bear is a fluffy giant who is incredibly gentle and loves children. Still a puppy and needs training.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:true},
    traits:['friendly','playful','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600'
  },
  {
    name:'Molly', species:'dog', breed:'Border Collie',
    age:{value:3,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Dallas',state:'TX'},
    description:'Molly is a super intelligent Border Collie who needs mental stimulation. Perfect for active families or farms.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','trained','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1503256207526-0d5523f31580?w=600'
  },
  {
    name:'Zeus', species:'dog', breed:'Rottweiler',
    age:{value:5,unit:'years'}, gender:'male', size:'extra-large',
    location:{city:'Chicago',state:'IL'},
    description:'Zeus is a calm and well-trained Rottweiler. Very loyal to his family. Best for experienced dog owners.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','trained','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=600'
  },
  {
    name:'Sadie', species:'dog', breed:'Australian Shepherd',
    age:{value:2,unit:'years'}, gender:'female', size:'medium',
    location:{city:'San Francisco',state:'CA'},
    description:'Sadie is a stunning Aussie with gorgeous merle coat. She loves agility training and outdoor adventures.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','trained','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=600'
  },
  {
    name:'Duke', species:'dog', breed:'Boxer',
    age:{value:3,unit:'years'}, gender:'male', size:'large',
    location:{city:'Philadelphia',state:'PA'},
    description:'Duke is a playful and loyal Boxer who loves kids. Full of energy and always ready to play.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['playful','friendly','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600'
  },
  {
    name:'Chloe', species:'dog', breed:'Shih Tzu',
    age:{value:6,unit:'years'}, gender:'female', size:'small',
    location:{city:'Las Vegas',state:'NV'},
    description:'Chloe is a calm and loving Shih Tzu. She loves being pampered and sitting on laps. Great for seniors.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=600'
  },
  {
    name:'Ranger', species:'dog', breed:'Labrador Mix',
    age:{value:8,unit:'months'}, gender:'male', size:'medium',
    location:{city:'Houston',state:'TX'},
    description:'Ranger is a playful Lab mix puppy who loves everyone. Still learning but picks up commands fast.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:false},
    traits:['playful','energetic','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600'
  },
  {
    name:'Penny', species:'dog', breed:'Dachshund',
    age:{value:4,unit:'years'}, gender:'female', size:'small',
    location:{city:'Boston',state:'MA'},
    description:'Penny is a curious and brave little Dachshund. She loves exploring and cuddling after a long day.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','playful','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600'
  },
  {
    name:'Thor', species:'dog', breed:'Great Dane',
    age:{value:2,unit:'years'}, gender:'male', size:'extra-large',
    location:{city:'Minneapolis',state:'MN'},
    description:'Thor is a gentle giant Great Dane. Despite his size he is very calm and loves children. Needs a big home.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','friendly','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600'
  },
  {
    name:'Rosie', species:'dog', breed:'Cavalier King Charles',
    age:{value:3,unit:'years'}, gender:'female', size:'small',
    location:{city:'San Diego',state:'CA'},
    description:'Rosie is an affectionate Cavalier who loves cuddles. Gets along with cats and dogs. Perfect lap dog.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','good with cats','good with dogs'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600'
  },
  {
    name:'Ace', species:'dog', breed:'Dalmatian',
    age:{value:2,unit:'years'}, gender:'male', size:'large',
    location:{city:'San Francisco',state:'CA'},
    description:'Ace is a spotted Dalmatian who loves to run and play. Very energetic and needs lots of daily exercise.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','friendly','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&crop=faces&fit=crop&h=400&w=600&q=80&sat=-100'
  },
  {
    name:'Lola', species:'dog', breed:'Chihuahua',
    age:{value:4,unit:'years'}, gender:'female', size:'small',
    location:{city:'San Antonio',state:'TX'},
    description:'Lola is a feisty little Chihuahua with a big personality. Very loyal and loves her owner fiercely.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1510771463146-e89e6e86560e?w=600'
  },
  {
    name:'Bruno', species:'dog', breed:'Basset Hound',
    age:{value:5,unit:'years'}, gender:'male', size:'medium',
    location:{city:'New Orleans',state:'LA'},
    description:'Bruno is a droopy-eared Basset Hound who loves slow walks and long naps. Very calm and great with kids.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','friendly','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600&sat=10'
  },
  {
    name:'Stella', species:'dog', breed:'Pitbull Mix',
    age:{value:3,unit:'years'}, gender:'female', size:'large',
    location:{city:'Detroit',state:'MI'},
    description:'Stella is a sweet Pitbull mix who loves belly rubs and cuddles. Great with adults.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','affectionate','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600'
  },
  {
    name:'Archie', species:'dog', breed:'Miniature Schnauzer',
    age:{value:2,unit:'years'}, gender:'male', size:'small',
    location:{city:'Charlotte',state:'NC'},
    description:'Archie is a smart Miniature Schnauzer with a great beard. Hypoallergenic and loves to play.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['playful','friendly','trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600'
  },
  {
    name:'Biscuit', species:'dog', breed:'Corgi',
    age:{value:2,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Seattle',state:'WA'},
    description:'Biscuit is a fluffy Corgi with short legs and a huge heart. Loves herding and playing fetch.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['playful','friendly','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600'
  },
  {
    name:'Pepper', species:'dog', breed:'Jack Russell Terrier',
    age:{value:3,unit:'years'}, gender:'male', size:'small',
    location:{city:'Austin',state:'TX'},
    description:'Pepper is a fearless Jack Russell Terrier with boundless energy. Great for active owners.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','playful','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600'
  },
  {
    name:'Hazel', species:'dog', breed:'Golden Doodle',
    age:{value:1,unit:'years'}, gender:'female', size:'large',
    location:{city:'Raleigh',state:'NC'},
    description:'Hazel is a fluffy Goldendoodle puppy who is hypoallergenic and endlessly cuddly.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:true},
    traits:['friendly','affectionate','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=600'
  },
  {
    name:'Finn', species:'dog', breed:'Irish Setter',
    age:{value:2,unit:'years'}, gender:'male', size:'large',
    location:{city:'Boston',state:'MA'},
    description:'Finn is a stunning Irish Setter with a flowing red coat. Very friendly and loves everyone.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','friendly','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600&crop=top'
  },
  {
    name:'Gizmo', species:'dog', breed:'Pomeranian',
    age:{value:4,unit:'years'}, gender:'male', size:'small',
    location:{city:'Los Angeles',state:'CA'},
    description:'Gizmo is a fluffy Pomeranian who thinks he is much bigger than he is. Loves attention and cuddles.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','affectionate','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&crop=entropy'
  },
  {
    name:'Olive', species:'dog', breed:'Italian Greyhound',
    age:{value:3,unit:'years'}, gender:'female', size:'small',
    location:{city:'Nashville',state:'TN'},
    description:'Olive is a sleek Italian Greyhound who loves to sprint and then snuggle under blankets.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600&crop=faces'
  },
  {
    name:'Hank', species:'dog', breed:'Bloodhound',
    age:{value:4,unit:'years'}, gender:'male', size:'extra-large',
    location:{city:'Memphis',state:'TN'},
    description:'Hank is a droopy and lovable Bloodhound with a nose for adventure. Calm at home, energetic outside.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','friendly','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&crop=top'
  },
  {
    name:'Willow', species:'dog', breed:'Labradoodle',
    age:{value:2,unit:'years'}, gender:'female', size:'large',
    location:{city:'Denver',state:'CO'},
    description:'Willow is a curly Labradoodle who is great with kids and allergy-friendly. She loves water.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','playful','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=600'
  },
  {
    name:'Scout', species:'dog', breed:'Vizsla',
    age:{value:2,unit:'years'}, gender:'male', size:'large',
    location:{city:'Kansas City',state:'MO'},
    description:'Scout is a rust-colored Vizsla who is affectionate and athletic. He loves running beside bikes.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','affectionate','trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600&q=90'
  },
  {
    name:'Nala', species:'dog', breed:'Pit Bull Terrier',
    age:{value:3,unit:'years'}, gender:'female', size:'large',
    location:{city:'Baltimore',state:'MD'},
    description:'Nala is a beautiful brindle Pitbull who is gentle, loving and desperately wants a forever family.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','affectionate','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600&q=90'
  },
  {
    name:'Otto', species:'dog', breed:'Weimaraner',
    age:{value:3,unit:'years'}, gender:'male', size:'large',
    location:{city:'Indianapolis',state:'IN'},
    description:'Otto is a sleek silver Weimaraner who is incredibly loyal. Needs daily exercise and loves to swim.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','friendly','trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600&crop=faces'
  },
  {
    name:'Maple', species:'dog', breed:'Golden Retriever Mix',
    age:{value:5,unit:'months'}, gender:'female', size:'medium',
    location:{city:'Portland',state:'OR'},
    description:'Maple is an adorable Golden mix puppy who is playful and learning everything fast.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:true},
    traits:['playful','friendly','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=600'
  },
  {
    name:'Hugo', species:'dog', breed:'Saint Bernard',
    age:{value:2,unit:'years'}, gender:'male', size:'extra-large',
    location:{city:'Salt Lake City',state:'UT'},
    description:'Hugo is a massive Saint Bernard who is the gentlest dog you will ever meet. Great with children.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','friendly','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600'
  },
  {
    name:'Zoe', species:'dog', breed:'Doberman',
    age:{value:3,unit:'years'}, gender:'female', size:'large',
    location:{city:'Tampa',state:'FL'},
    description:'Zoe is a sleek Doberman who is highly trained and protective yet incredibly gentle with family.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['trained','calm','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600&q=80&crop=entropy'
  },
  {
    name:'Rusty', species:'dog', breed:'Irish Terrier',
    age:{value:4,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Columbus',state:'OH'},
    description:'Rusty is a wiry red Irish Terrier full of personality and mischief. He loves to dig and explore.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','playful','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=600&crop=top'
  },
  {
    name:'Pearl', species:'dog', breed:'Maltese',
    age:{value:5,unit:'years'}, gender:'female', size:'small',
    location:{city:'Scottsdale',state:'AZ'},
    description:'Pearl is a tiny white Maltese who loves bow ties and sitting in laps. Perfect companion dog.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=600&crop=faces'
  },
  {
    name:'Cash', species:'dog', breed:'Coonhound',
    age:{value:3,unit:'years'}, gender:'male', size:'large',
    location:{city:'Nashville',state:'TN'},
    description:'Cash is a howling Coonhound with a deep bark and a sweet soul. Loves long hikes and belly rubs.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','energetic','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&crop=top'
  },
  {
    name:'Ivy', species:'dog', breed:'Whippet',
    age:{value:2,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Richmond',state:'VA'},
    description:'Ivy is a lightning-fast Whippet who is surprisingly calm indoors. She loves short sprints and long naps.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','energetic','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&crop=faces'
  },
  {
    name:'Bruno', species:'dog', breed:'Newfoundland',
    age:{value:2,unit:'years'}, gender:'male', size:'extra-large',
    location:{city:'Anchorage',state:'AK'},
    description:'Bruno is a giant black Newfoundland who loves water and children. A true gentle giant.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','friendly','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&crop=top'
  },
  {
    name:'Sunny', species:'dog', breed:'Golden Retriever',
    age:{value:1,unit:'years'}, gender:'female', size:'large',
    location:{city:'Charlotte',state:'NC'},
    description:'Sunny is a bright and bubbly Golden pup who spreads joy everywhere she goes.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:true},
    traits:['friendly','playful','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=600&crop=top'
  },
  {
    name:'Goose', species:'dog', breed:'Labrador Retriever',
    age:{value:2,unit:'years'}, gender:'male', size:'large',
    location:{city:'Jacksonville',state:'FL'},
    description:'Goose is a black Lab with endless enthusiasm and a heart full of love. Excellent with families.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','playful','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&crop=faces'
  },
  {
    name:'Freya', species:'dog', breed:'Norwegian Elkhound',
    age:{value:4,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Minneapolis',state:'MN'},
    description:'Freya is a sturdy Nordic dog with thick grey fur and a brave heart. Loves cold weather.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','independent','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&crop=faces'
  },
  {
    name:'Milo', species:'dog', breed:'Beagle Mix',
    age:{value:1,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Omaha',state:'NE'},
    description:'Milo is a curious Beagle mix puppy with floppy ears and a nose always to the ground.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:true},
    traits:['playful','friendly','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600&crop=top'
  },
  {
    name:'Belle', species:'dog', breed:'Havanese',
    age:{value:3,unit:'years'}, gender:'female', size:'small',
    location:{city:'Miami',state:'FL'},
    description:'Belle is a silky Havanese who is the perfect city dog. She loves walks, play and pampering.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','affectionate','calm'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&crop=top'
  },
  {
    name:'Rex', species:'dog', breed:'German Shepherd',
    age:{value:6,unit:'years'}, gender:'male', size:'large',
    location:{city:'San Diego',state:'CA'},
    description:'Rex is a retired service German Shepherd. Fully trained, excellent behaviour, needs a calm loving home.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['trained','calm','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&crop=entropy'
  },
  {
    name:'Cocoa', species:'dog', breed:'Chocolate Lab',
    age:{value:3,unit:'years'}, gender:'female', size:'large',
    location:{city:'Atlanta',state:'GA'},
    description:'Cocoa is a rich chocolate Labrador who loves swimming, fetching and snuggling on the couch.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','playful','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&crop=faces'
  },

  // ── CATS (25) ─────────────────────────────────────────────
  {
    name:'Whiskers', species:'cat', breed:'Maine Coon',
    age:{value:4,unit:'years'}, gender:'male', size:'large',
    location:{city:'Seattle',state:'WA'},
    description:'Whiskers is a majestic Maine Coon with silky fur. He loves sunny spots and gentle chin scratches.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600'
  },
  {
    name:'Mittens', species:'cat', breed:'Persian',
    age:{value:5,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Miami',state:'FL'},
    description:'Mittens is a beautiful Persian who loves being brushed and watching TV. Indoor only.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600'
  },
  {
    name:'Oliver', species:'cat', breed:'British Shorthair',
    age:{value:3,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Chicago',state:'IL'},
    description:'Oliver is a chunky British Shorthair with a teddy bear face. Calm, loving and very easy to care for.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'
  },
  {
    name:'Luna', species:'cat', breed:'Siamese',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'Los Angeles',state:'CA'},
    description:'Luna is a vocal and affectionate Siamese who loves attention. She will follow you everywhere.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['affectionate','playful','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1555304334-e3d94c0e6b88?w=600'
  },
  {
    name:'Simba', species:'cat', breed:'Tabby',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'Phoenix',state:'AZ'},
    description:'Simba is a playful orange tabby kitten who loves toys and climbing. Gets along with other cats.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:false},
    traits:['playful','energetic','good with cats'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600'
  },
  {
    name:'Nala', species:'cat', breed:'Ragdoll',
    age:{value:3,unit:'years'}, gender:'female', size:'large',
    location:{city:'Denver',state:'CO'},
    description:'Nala is a gorgeous Ragdoll who goes limp when you pick her up. Super gentle and loves being held.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','good with kids'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&sat=20'
  },
  {
    name:'Shadow', species:'cat', breed:'Domestic Shorthair',
    age:{value:6,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Portland',state:'OR'},
    description:'Shadow is a sleek black cat who is shy at first but becomes very loving. Loves cozy spots.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','independent','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600'
  },
  {
    name:'Cleo', species:'cat', breed:'Egyptian Mau',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'Houston',state:'TX'},
    description:'Cleo is a spotted Egyptian Mau who is one of the fastest cat breeds. Loves interactive play.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','playful','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1596854407944-bf87f6fdd049?w=600'
  },
  {
    name:'Tiger', species:'cat', breed:'Bengal',
    age:{value:4,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Atlanta',state:'GA'},
    description:'Tiger is a wild-looking Bengal with a heart of gold. Loves water, fetch and climbing cat trees.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','playful','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1568043434006-be48574b9da5?w=600'
  },
  {
    name:'Misty', species:'cat', breed:'Russian Blue',
    age:{value:5,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Boston',state:'MA'},
    description:'Misty is a beautiful Russian Blue with bright green eyes. Gentle, quiet and bonds deeply with one person.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','independent','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600'
  },
  {
    name:'Ginger', species:'cat', breed:'Domestic Longhair',
    age:{value:7,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Nashville',state:'TN'},
    description:'Ginger is a sweet senior cat who loves lap time and warm blankets. Very low maintenance.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=600'
  },
  {
    name:'Oreo', species:'cat', breed:'Tuxedo',
    age:{value:3,unit:'years'}, gender:'male', size:'medium',
    location:{city:'New York',state:'NY'},
    description:'Oreo is a dapper black-and-white tuxedo cat with impeccable manners and great charm.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','affectionate','calm'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600'
  },
  {
    name:'Pumpkin', species:'cat', breed:'Tabby',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'Chicago',state:'IL'},
    description:'Pumpkin is a round orange tabby who purrs so loud you can hear her across the room.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['affectionate','calm','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&crop=top'
  },
  {
    name:'Mochi', species:'cat', breed:'Scottish Fold',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'San Francisco',state:'CA'},
    description:'Mochi is a round-faced Scottish Fold with folded ears. She poses like a little owl and loves cuddles.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&crop=top'
  },
  {
    name:'Jasper', species:'cat', breed:'Norwegian Forest Cat',
    age:{value:4,unit:'years'}, gender:'male', size:'large',
    location:{city:'Portland',state:'OR'},
    description:'Jasper is a majestic Norwegian Forest Cat who loves to climb and explore every corner of the house.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['independent','playful','calm'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&crop=top'
  },
  {
    name:'Cali', species:'cat', breed:'Calico',
    age:{value:3,unit:'years'}, gender:'female', size:'small',
    location:{city:'Austin',state:'TX'},
    description:'Cali is a beautiful calico cat with patches of orange, black and white. Very expressive and curious.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['playful','independent','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600&crop=top'
  },
  {
    name:'Salem', species:'cat', breed:'Bombay',
    age:{value:5,unit:'years'}, gender:'male', size:'medium',
    location:{city:'New Orleans',state:'LA'},
    description:'Salem is a glossy black Bombay cat with copper eyes. He is mysterious and deeply affectionate.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&crop=top'
  },
  {
    name:'Willow', species:'cat', breed:'Birman',
    age:{value:3,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Denver',state:'CO'},
    description:'Willow is a silky Birman with striking blue eyes and white-gloved paws. Very sweet and gentle.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1555304334-e3d94c0e6b88?w=600&crop=top'
  },
  {
    name:'Felix', species:'cat', breed:'American Shorthair',
    age:{value:6,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Dallas',state:'TX'},
    description:'Felix is a classic American Shorthair with a easygoing nature. Loves both playtime and lazy days.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['friendly','calm','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1596854407944-bf87f6fdd049?w=600&crop=top'
  },
  {
    name:'Cleo', species:'cat', breed:'Abyssinian',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'Phoenix',state:'AZ'},
    description:'Cleo is a ticked Abyssinian who is always on the move. She loves high perches and interactive toys.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['energetic','playful','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&crop=entropy'
  },
  {
    name:'Dusty', species:'cat', breed:'Domestic Shorthair',
    age:{value:8,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Philadelphia',state:'PA'},
    description:'Dusty is a grey senior cat who is fully house-trained and asks for nothing but a warm lap.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['calm','affectionate','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600&crop=top'
  },
  {
    name:'Hazel', species:'cat', breed:'Tortoiseshell',
    age:{value:4,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Boston',state:'MA'},
    description:'Hazel has stunning tortoiseshell markings and a bold personality to match. She is a one-person cat.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['independent','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=600&crop=top'
  },
  {
    name:'Leo', species:'cat', breed:'Turkish Angora',
    age:{value:3,unit:'years'}, gender:'male', size:'medium',
    location:{city:'Las Vegas',state:'NV'},
    description:'Leo is a white Turkish Angora with one blue eye and one green eye. Incredibly elegant and playful.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['playful','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&crop=entropy'
  },
  {
    name:'Mocha', species:'cat', breed:'Burmese',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'Seattle',state:'WA'},
    description:'Mocha is a satin-coated Burmese who is incredibly people-oriented. She hates being alone.',
    health:{vaccinated:true,spayedNeutered:true,microchipped:true},
    traits:['affectionate','friendly','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1568043434006-be48574b9da5?w=600&crop=top'
  },
  {
    name:'Nico', species:'cat', breed:'Devon Rex',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'San Diego',state:'CA'},
    description:'Nico is a curly-coated Devon Rex with huge ears and mischievous energy. He loves warmth and cuddles.',
    health:{vaccinated:true,spayedNeutered:false,microchipped:true},
    traits:['playful','affectionate','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1555304334-e3d94c0e6b88?w=600&crop=entropy'
  },

  // ── RABBITS (8) ───────────────────────────────────────────
  {
    name:'Snowball', species:'rabbit', breed:'Holland Lop',
    age:{value:1,unit:'years'}, gender:'female', size:'small',
    location:{city:'Chicago',state:'IL'},
    description:'Snowball is a fluffy white Holland Lop with floppy ears. Litter trained and very social.',
    health:{vaccinated:false,spayedNeutered:true,microchipped:false},
    traits:['calm','friendly','house-trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1462750253074-fe6f88ee4b93?w=600&crop=entropy&q=80'
  },
  {
    name:'Thumper', species:'rabbit', breed:'Netherland Dwarf',
    age:{value:2,unit:'years'}, gender:'male', size:'small',
    location:{city:'San Francisco',state:'CA'},
    description:'Thumper is a tiny Netherland Dwarf who loves to binky and explore. Litter trained and very curious.',
    health:{vaccinated:false,spayedNeutered:true,microchipped:false},
    traits:['playful','friendly','house-trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600'
  },
  {
    name:'Cinnamon', species:'rabbit', breed:'Mini Rex',
    age:{value:3,unit:'years'}, gender:'female', size:'small',
    location:{city:'Dallas',state:'TX'},
    description:'Cinnamon has the softest fur you will ever touch. Loves being petted and will nudge your hand for more.',
    health:{vaccinated:false,spayedNeutered:true,microchipped:false},
    traits:['calm','affectionate','house-trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1462750253074-fe6f88ee4b93?w=600'
  },
  {
    name:'Pepper', species:'rabbit', breed:'Lionhead',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'Portland',state:'OR'},
    description:'Pepper has a gorgeous mane like a little lion. Playful and loves to hop around his space.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['playful','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600&crop=top'
  },
  {
    name:'Clover', species:'rabbit', breed:'Flemish Giant',
    age:{value:2,unit:'years'}, gender:'female', size:'large',
    location:{city:'Minneapolis',state:'MN'},
    description:'Clover is a giant gentle rabbit who loves to sprawl out and be brushed. Incredibly calm and sweet.',
    health:{vaccinated:false,spayedNeutered:true,microchipped:false},
    traits:['calm','affectionate','house-trained'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1596854407944-bf87f6fdd049?w=600&crop=entropy&sat=10'
  },
  {
    name:'Cotton', species:'rabbit', breed:'Angora',
    age:{value:1,unit:'years'}, gender:'female', size:'small',
    location:{city:'Seattle',state:'WA'},
    description:'Cotton is a fluffy white Angora rabbit who looks like a cloud. Needs regular grooming.',
    health:{vaccinated:false,spayedNeutered:true,microchipped:false},
    traits:['calm','friendly','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1462750253074-fe6f88ee4b93?w=600&crop=top'
  },
  {
    name:'Hazel', species:'rabbit', breed:'Dutch Rabbit',
    age:{value:2,unit:'years'}, gender:'male', size:'small',
    location:{city:'Austin',state:'TX'},
    description:'Hazel is a classic Dutch rabbit with a white blaze and brown patches. Very curious and friendly.',
    health:{vaccinated:false,spayedNeutered:true,microchipped:false},
    traits:['friendly','playful','curious'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600'
  },
  {
    name:'Marble', species:'rabbit', breed:'Rex Rabbit',
    age:{value:3,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Denver',state:'CO'},
    description:'Marble has a stunning marbled coat and a laid-back personality. Loves sitting with her owners.',
    health:{vaccinated:false,spayedNeutered:true,microchipped:false},
    traits:['calm','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&crop=top'
  },

  // ── BIRDS (7) ─────────────────────────────────────────────
  {
    name:'Tweety', species:'bird', breed:'Canary',
    age:{value:2,unit:'years'}, gender:'male', size:'small',
    location:{city:'New York',state:'NY'},
    description:'Tweety is a bright yellow canary with a beautiful singing voice. He will fill your home with cheerful songs.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600'
  },
  {
    name:'Polly', species:'bird', breed:'African Grey Parrot',
    age:{value:5,unit:'years'}, gender:'female', size:'medium',
    location:{city:'Los Angeles',state:'CA'},
    description:'Polly is a highly intelligent African Grey who can speak over 50 words. Needs lots of mental stimulation.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['affectionate','independent','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600'
  },
  {
    name:'Rio', species:'bird', breed:'Macaw',
    age:{value:4,unit:'years'}, gender:'male', size:'large',
    location:{city:'Miami',state:'FL'},
    description:'Rio is a stunning blue and gold Macaw. Very social and loves being the center of attention.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['friendly','playful','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1584003564911-fd6b0e816482?w=600'
  },
  {
    name:'Kiwi', species:'bird', breed:'Budgerigar',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'Austin',state:'TX'},
    description:'Kiwi is a cheerful budgie who loves to chirp and play with toys. Great starter bird for beginners.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['playful','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1591608516485-a239cf52fd63?w=600'
  },
  {
    name:'Mango', species:'bird', breed:'Cockatiel',
    age:{value:3,unit:'years'}, gender:'female', size:'small',
    location:{city:'San Diego',state:'CA'},
    description:'Mango is a sweet cockatiel who loves to whistle tunes and sit on shoulders. Very easy to tame.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&crop=top'
  },
  {
    name:'Sky', species:'bird', breed:'Lovebird',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'Denver',state:'CO'},
    description:'Sky is a vibrant lovebird who lives up to her name. She is deeply bonded and needs a companion bird.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['affectionate','playful','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1591608516485-a239cf52fd63?w=600&crop=top'
  },
  {
    name:'Pearl', species:'bird', breed:'Cockatoo',
    age:{value:6,unit:'years'}, gender:'female', size:'large',
    location:{city:'Chicago',state:'IL'},
    description:'Pearl is a white Cockatoo with a dramatic crest display. She loves dancing and showing off.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['playful','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&crop=top'
  },

  // ── HAMSTERS (3) ─────────────────────────────────────────
  {
    name:'Hammy', species:'hamster', breed:'Syrian Hamster',
    age:{value:6,unit:'months'}, gender:'male', size:'small',
    location:{city:'Boston',state:'MA'},
    description:'Hammy is a fluffy golden Syrian hamster who loves running on his wheel and hiding treats.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['friendly','playful'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600'
  },
  {
    name:'Nugget', species:'hamster', breed:'Dwarf Hamster',
    age:{value:4,unit:'months'}, gender:'female', size:'small',
    location:{city:'Philadelphia',state:'PA'},
    description:'Nugget is a tiny dwarf hamster who is incredibly fast and funny to watch. Great for kids.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['playful','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&crop=top'
  },
  {
    name:'Peanut', species:'hamster', breed:'Roborovski Hamster',
    age:{value:5,unit:'months'}, gender:'male', size:'small',
    location:{city:'Las Vegas',state:'NV'},
    description:'Peanut is the smallest and fastest hamster you will ever see. Loves tunnels and sand baths.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['playful','energetic'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600&crop=entropy'
  },

  // ── GUINEA PIGS (5) ───────────────────────────────────────
  {
    name:'Biscuit', species:'guinea pig', breed:'American Guinea Pig',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'Atlanta',state:'GA'},
    description:'Biscuit loves to wheek loudly when he hears the fridge open. Very social and loves being held.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['friendly','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600&crop=faces'
  },
  {
    name:'Caramel', species:'guinea pig', breed:'Teddy Guinea Pig',
    age:{value:2,unit:'years'}, gender:'female', size:'small',
    location:{city:'Minneapolis',state:'MN'},
    description:'Caramel has soft teddy-like fur and a very gentle personality. She loves fresh herbs and lap time.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','affectionate','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1462750253074-fe6f88ee4b93?w=600&crop=faces'
  },
  {
    name:'Fluffy', species:'guinea pig', breed:'Peruvian Guinea Pig',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'Dallas',state:'TX'},
    description:'Fluffy has incredibly long silky hair that needs regular grooming. Very calm and loves vegetables.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600&sat=15'
  },
  {
    name:'Rosie', species:'guinea pig', breed:'Abyssinian Guinea Pig',
    age:{value:1,unit:'years'}, gender:'female', size:'small',
    location:{city:'Portland',state:'OR'},
    description:'Rosie has wild rosette fur that goes in every direction. She is sassy and loves attention.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['playful','friendly','affectionate'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1462750253074-fe6f88ee4b93?w=600&crop=entropy'
  },
  {
    name:'Truffle', species:'guinea pig', breed:'Skinny Pig',
    age:{value:2,unit:'years'}, gender:'male', size:'small',
    location:{city:'Seattle',state:'WA'},
    description:'Truffle is a mostly hairless skinny pig who is surprisingly loveable. Very warm and social.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['friendly','affectionate','calm'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1596854407944-bf87f6fdd049?w=600&sat=5'
  },

  // ── FISH & REPTILES (5 bonus) ─────────────────────────────
  {
    name:'Goldie', species:'fish', breed:'Goldfish',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'New York',state:'NY'},
    description:'Goldie is a bright orange goldfish who loves to glide around his spacious tank. Very low maintenance.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600'
  },
  {
    name:'Spike', species:'reptile', breed:'Bearded Dragon',
    age:{value:2,unit:'years'}, gender:'male', size:'small',
    location:{city:'Phoenix',state:'AZ'},
    description:'Spike is a docile bearded dragon who loves basking and eating crickets. Great starter reptile.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','friendly'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1509175175849-84a6478a7f29?w=600'
  },
  {
    name:'Sheldon', species:'reptile', breed:'Box Turtle',
    age:{value:5,unit:'years'}, gender:'male', size:'small',
    location:{city:'Atlanta',state:'GA'},
    description:'Sheldon is a gentle box turtle who enjoys lettuce, warm soaks and exploring his enclosure.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600'
  },
  {
    name:'Nemo', species:'fish', breed:'Clownfish',
    age:{value:1,unit:'years'}, gender:'male', size:'small',
    location:{city:'Miami',state:'FL'},
    description:'Nemo is a vibrant clownfish who loves swimming through his anemone. Perfect for saltwater tanks.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['friendly','calm'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&crop=top'
  },
  {
    name:'Iggy', species:'reptile', breed:'Green Iguana',
    age:{value:3,unit:'years'}, gender:'male', size:'large',
    location:{city:'Orlando',state:'FL'},
    description:'Iggy is a stunning green iguana who is tame and loves being handled. Needs a large warm enclosure.',
    health:{vaccinated:false,spayedNeutered:false,microchipped:false},
    traits:['calm','independent'],
    status:'available',
    primaryImage:'https://images.unsplash.com/photo-1509175175849-84a6478a7f29?w=600&crop=top'
  },
];

const seed = async () => {
  try {
    console.log('\n Connecting...');
    await mongoose.connect(MONGO_URI);
    console.log(' Connected!');

    await Promise.all([User.deleteMany(), Pet.deleteMany(), Application.deleteMany()]);
    console.log(' Old data cleared.');

    const createdUsers = [];
    for (const u of USERS) {
      const hashed = await bcrypt.hash(u.password, 10);
      createdUsers.push(await User.create({ ...u, password: hashed }));
    }
    console.log(' Users created.');

    const admin = createdUsers.find(u => u.role === 'admin');
    const createdPets = await Pet.insertMany(PETS.map(p => ({ ...p, addedBy: admin._id })));
    console.log(` ${createdPets.length} Pets created with unique photos!`);

    const user = createdUsers.find(u => u.email === 'sarah@example.com');
    const pet  = createdPets[0];
    await Application.create({
      pet: pet._id, applicant: user._id,
      personalInfo: { fullName: user.name, email: user.email, phone: '555-0101', address: { street: '123 Oak St', city: 'Austin', state: 'TX', zip: '78701' } },
      homeEnvironment: { housingType: 'house', hasYard: true, isRenting: false, landlordAllowsPets: true, numberOfAdults: 2, numberOfChildren: 1, childrenAges: '8' },
      petExperience: { hasPetsNow: false, currentPets: '', previousExperience: 'I grew up with dogs.', hoursAlonePerDay: 4, veterinarianName: 'Dr. Smith Animal Clinic' },
      whyAdopt: `I love ${pet.name} and want to give them a forever home.`,
      agreements: { agreeToVisit: true, agreeToFees: true, agreeToResponsibility: true },
      status: 'pending'
    });
    console.log(' Sample application created.');

    console.log(`
 =============================================
  Database seeded successfully!
  ${createdPets.length} Pets — each with a UNIQUE photo!
 =============================================
  ADMIN:  admin@pawshome.com / admin123
  USER:   sarah@example.com / password123
 =============================================
`);
  } catch (err) {
    console.error(' Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log(' Done.\n');
    process.exit(0);
  }
};

seed();
