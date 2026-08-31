// Demo comments only — do not present them as real visitor reviews.
// First import atlas-demo-comment-authors.json into the users collection.
const authors = ["66f0e1000000000000000001","66f0e1000000000000000002","66f0e1000000000000000003","66f0e1000000000000000004","66f0e1000000000000000005","66f0e1000000000000000006","66f0e1000000000000000007","66f0e1000000000000000008","66f0e1000000000000000009","66f0e1000000000000000010"].map((id) => new ObjectId(id));
if (db.users.countDocuments({ _id: { $in: authors } }) !== authors.length) {
  throw new Error("Import atlas-demo-comment-authors.json into users first");
}
const comments = [
  {
    "title": "NOTHING",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "The Dresden Dolls",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Kate Stephenson",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "New Constellations, support: Karolina Prasał",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Alex Spencer",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Bayonne",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Black Stone Cherry: The Celebrate Tour",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "The Pussycat Dolls: PCD FOREVER TOUR",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Devin Townsend",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "TR/ST — Live",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "As December Falls",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Lilyisthatyou: The Flowers Have Feelings Tour",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Vanessa Paradis",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Allegaeon x Gorod, support: Halysis",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "WITCHZ",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "JJ: Act II — Into The Unknown Tour",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Isabel van Gelder",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Stand Atlantic",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Węże",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Mad Tsai: The Bite Back Tour",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Stu Larsen, support: Imme & Julia Adriana",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Peter Hammill",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Father Of Peace: The Year Of Madness & The Mystery Century Tour",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Kiss Facility",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "The Amity Affliction, support: Silent Planet, Varials, Orthodox",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Vundabar and Yot Club",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "City of the Sun",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Future Palace",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "SKOLIM: Król Latino",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "JIMEK | Orchestra | Guests: History of Polish Hip-Hop, Chapter III: The Final",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Anastacia: #NTKTOUR 2026",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Xandria",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Declan Welsh and The Decadent West",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Cat Power: The Greatest Tour",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Yaelokre, support: Ben Caplan",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Happysad: XXV TOUR",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "GZUZ",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "ARK: HI-LO",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "BERRE: How Beautiful This Life Is EU Tour 2026",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Drink The Sea",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Simple Plan: BIGGER THAN YOU THINK! EU/UK Tour 2026",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "God Save The Queen",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Der Weg Einer Freiheit, support: Conjurer and Brnsjmin",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "BABE HAVEN + LATTER",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Temples, support: JEWLS",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Puscifer",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Eryk Moczko",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Kate Ryan: Génération Désenchantée — 25th Anniversary Tour",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Giselle",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Romeo and Juliet",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Wòlô bòskô",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Touching Theatre",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Bel Canto, or Opera 101",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Mothers of Kherson: World Premiere",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Butterfly in the Land of Shadows",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Madama Butterfly",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Little Theatre Academy",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Family Fun at the Wielki",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Grand Theatre for the Little Ones",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Opera Sound Hunters",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Symphony of Dance: an encore",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Detective B. Flat Major on the Track of Sounds",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "María de Buenos Aires",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Cinderella",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Juvenalia 5",
    "body": "[Demo comment] This festival looks like a fun day out. Check the timetable and entry conditions before visiting."
  },
  {
    "title": "Salome: Premiere",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Strauss, Mahler, Morawski-Dąbrowa",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Falstaff",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Martucci Jazz Ensemble: Three Worlds, One Sound",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Falla Reimagined: The Moisés Sánchez Trio",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Judith Triumphant / Antonio Vivaldi",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Giulio Cesare / Georg Friedrich Händel",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "A Ball at the Opera: Leszek Możdżer, Julian Tuwim",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "SOPRANISTI: Bruno de Sá and Pedro Beriso",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Snack Opera: Baroque Edition",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Explore the Secrets of Opera",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "An Upside-Down Christmas",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Coppélia: Premiere",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "New Year’s Eve Gala",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Symphony of Dance: an encore",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Cinderella",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Touching Theatre",
    "body": "[Demo comment] A promising programme for theatre and classical-music fans. Please verify the performance language and start time."
  },
  {
    "title": "Salome",
    "body": "[Demo comment] This production looks worth planning ahead for. Check the official venue page for seating and accessibility details."
  },
  {
    "title": "Falstaff",
    "body": "[Demo comment] Saved for a future visit. Please confirm the cast and any age guidance with the organiser."
  },
  {
    "title": "Warsaw Industry Week 2026",
    "body": "[Demo comment] This exhibition sounds interesting. It is worth checking opening hours and ticket availability before the visit."
  },
  {
    "title": "23rd Warsaw Art Fair",
    "body": "[Demo comment] A good cultural stop for Warsaw. Please confirm the venue details and any guided-tour times."
  },
  {
    "title": "elSol Festival 2026",
    "body": "[Demo comment] This festival looks like a fun day out. Check the timetable and entry conditions before visiting."
  },
  {
    "title": "Eleine, support: Rexoria, SerapiS Project",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "SPORTS",
    "body": "[Demo comment] This sporting event looks exciting. Check the official schedule and admission details before attending."
  },
  {
    "title": "Zimmer90: ARTHOUSE TOUR 2026",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Daniel Godson: TRASA ODPOWIEDZI",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "WaluśKraksaKryzys i HOUK!",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "Airbag",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "Illusion",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Karolina Czarnecka",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "VENJENT",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "The Howlers: EU Album Tour",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  },
  {
    "title": "Mammoth: The End Tour",
    "body": "[Demo comment] This looks like a great music night. Confirm the door time and venue rules with the organiser."
  },
  {
    "title": "wilt",
    "body": "[Demo comment] Added to my Warsaw music shortlist. It would be useful to see the final running order."
  },
  {
    "title": "KSU",
    "body": "[Demo comment] Looking forward to this live set — please check the official ticket page before going."
  }
];
const now = new Date();
const docs = comments.map(({ title, body }, index) => {
  const event = db.events.findOne({ title }, { _id: 1 });
  if (!event) throw new Error(`Event not found: ${title}`);
  return { event: event._id, author: authors[index % authors.length], body, createdAt: now, updatedAt: now };
});
db.eventcomments.insertMany(docs);
print(`Inserted ${docs.length} demo comments into eventcomments.`);
