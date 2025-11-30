import { Planet, Star } from '../types';
import { randomUniform } from './math';

const CATALOG_PREFIXES = ['Kepler', 'Gliese', 'HD', 'HIP', 'K2', 'TOI', 'WASP', 'CoRoT', 'Luyten', 'Trappist', 'Ross', 'Wolf'];
const GREEK_ALPHABET = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
const CONSTELLATIONS = ['Centauri', 'Ceti', 'Eridani', 'Cygni', 'Lyrae', 'Scorpii', 'Andromedae', 'Draconis', 'Cassiopeiae', 'Orionis', 'Pegasi', 'Ursæ Majoris'];

const MYTHOLOGIES = {
    "Norse": ["Odin", "Thor", "Loki", "Freya", "Heimdall", "Tyr", "Baldr", "Frigg", "Skadi", "Njord", "Freyr", "Idunn", "Bragi", "Forseti", "Sif", "Hel", "Fenrir", "Jormungandr", "Surtr", "Ymir", "Aegir", "Ran", "Vidar", "Vali", "Magni", "Modi", "Thrud", "Ull", "Sol", "Mani"],
    "Greek": ["Zeus", "Hera", "Poseidon", "Demeter", "Ares", "Athena", "Apollo", "Artemis", "Hephaestus", "Aphrodite", "Hermes", "Dionysus", "Hades", "Hestia", "Persephone", "Eros", "Pan", "Nike", "Nemesis", "Tyche", "Hebe", "Helios", "Selene", "Eos", "Gaia", "Uranus", "Cronus", "Rhea", "Oceanus", "Tethys"],
    "Roman": ["Jupiter", "Juno", "Neptune", "Ceres", "Mars", "Minerva", "Apollo", "Diana", "Vulcan", "Venus", "Mercury", "Bacchus", "Pluto", "Vesta", "Proserpina", "Cupid", "Faunus", "Victoria", "Fortuna", "Juventas", "Sol", "Luna", "Aurora", "Terra", "Caelus", "Saturn", "Ops", "Janus", "Quirinus", "Bellona"],
    "Egyptian": ["Ra", "Osiris", "Isis", "Horus", "Set", "Anubis", "Thoth", "Bastet", "Sekhmet", "Hathor", "Ptah", "Maat", "Geb", "Nut", "Shu", "Tefnut", "Amun", "Mut", "Khonsu", "Sobek", "Khepri", "Atum", "Neith", "Serqet", "Bes", "Taweret", "Hapi", "Imhotep", "Khnum", "Anuket"],
    "Sumerian": ["Anu", "Enlil", "Enki", "Ninhursag", "Inanna", "Utu", "Nanna", "Marduk", "Nergal", "Ereshkigal", "Ninurta", "Nabu", "Ishtar", "Dumuzi", "Tiamat", "Apsu", "Kingu", "Lahmu", "Lahamu", "Anshar", "Kishar", "Sin", "Shamash", "Adad", "Ashur", "Gula", "Nisaba", "Nammu", "Ninkasi", "Geshtinanna"],
    "Celtic": ["Dagda", "Morrigan", "Lugh", "Brigid", "Nuada", "Ogma", "Manannan", "Danu", "Belenus", "Cernunnos", "Epona", "Aengus", "Boann", "Lir", "Macha", "Badb", "Nemain", "Goibniu", "Creidhne", "Luchta", "Dian Cecht", "Bodb Derg", "Midir", "Arianrhod", "Gwydion", "Rhiannon", "Pwyll", "Bran", "Math", "Taliesin"],
    "Japanese": ["Amaterasu", "Tsukuyomi", "Susanoo", "Izanagi", "Izanami", "Kagutsuchi", "Raijin", "Fujin", "Hachiman", "Inari", "Ebisu", "Daikokuten", "Bishamonten", "Benzaiten", "Fukurokuju", "Jurojin", "Hotei", "Uzume", "Sarutahiko", "Ninigi", "Konohanasakuya", "Omoikane", "Takemikazuchi", "Futsunushi", "Ryujin", "Suijin", "Owatatsumi", "Toyotama-hime", "Uke Mochi", "Kuraokami"],
    "Hindu": ["Indra", "Agni", "Varuna", "Vayu", "Soma", "Surya", "Yama", "Vishnu", "Shiva", "Brahma", "Lakshmi", "Parvati", "Saraswati", "Ganesha", "Kartikeya", "Hanuman", "Rama", "Krishna", "Durga", "Kali", "Sita", "Radha", "Kubera", "Kama", "Dyaus", "Prithvi", "Ushas", "Rudra", "Maruts", "Adityas"]
};

export function generateStarName(): string {
    const r = Math.random();
    if (r < 0.4) {
        // Catalog Style: Kepler-186
        const prefix = CATALOG_PREFIXES[Math.floor(Math.random() * CATALOG_PREFIXES.length)];
        const num = Math.floor(randomUniform(10, 9000));
        return `${prefix}-${num}`;
    } else if (r < 0.7) {
        // Bayer Style: Alpha Centauri
        const greek = GREEK_ALPHABET[Math.floor(Math.random() * GREEK_ALPHABET.length)];
        const constellation = CONSTELLATIONS[Math.floor(Math.random() * CONSTELLATIONS.length)];
        return `${greek} ${constellation}`;
    } else {
        // Hyphenated ID: TOI-123 A
        const prefix = CATALOG_PREFIXES[Math.floor(Math.random() * CATALOG_PREFIXES.length)];
        const num = Math.floor(randomUniform(100, 5000));
        return `${prefix}-${num}`;
    }
}

export function applySystemNaming(star: Star, planets: Planet[]) {
    // Pick a mythology
    const keys = Object.keys(MYTHOLOGIES);
    const theme = keys[Math.floor(Math.random() * keys.length)] as keyof typeof MYTHOLOGIES;
    const names = [...MYTHOLOGIES[theme]];

    // Shuffle names
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }

    planets.forEach((p, i) => {
        if (i < names.length) {
            p.name = names[i];
        } else {
            // Fallback if we run out of gods (unlikely given max planet count vs list size, but safe)
            p.name = `${theme}-${i+1}`;
        }
    });
}
