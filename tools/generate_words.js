/*
 * Word-list generator for "Sing That Song".
 *
 * Goal: every word should instantly make you think of a song. So the seed is
 * built from CONCRETE, EMOTIONAL, EVERYDAY words that actually show up in lots
 * of popular song titles and hooks (love, baby, heart, night, fire, rain, ...)
 * — NOT literary/abstract vocabulary (desperate, journal, isthmus) that nobody
 * connects to a song.
 *
 * Rules (from the spec):
 *   - Skip connector / stop words (the, and, or, in, a, ...).
 *   - Skip words too generic OR too obscure for the game.
 *   - Collapse forms to a single BASE word:
 *        close/closely -> close, owned -> own, babies -> baby, stars -> star.
 *   - One entry per concept.
 *
 * Run:  node tools/generate_words.js
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Connector / stop / too-common words to exclude entirely.
// ---------------------------------------------------------------------------
const STOP = new Set(`
a an the and or but nor for so yet of to in on at by from with without within into onto upon
is am are was were be been being do does did done doing have has had having will would shall
should can could may might must ought
i you he she it we they me him her us them my your his its our their mine yours hers ours theirs
this that these those there here who whom whose which what when where why how
not no yes if then else than as because while until since though although unless whether
out up down off over under again further too very just only also even still ever never
about above below between among through during before after around against along across behind
beside beyond near upon per via amid amidst
he's she's it's i'm you're we're they're i've you've we've they've i'll you'll he'll she'll we'll
they'll i'd you'd he'd she'd we'd they'd don't doesn't didn't won't wouldn't can't couldn't
shouldn't isn't aren't wasn't weren't hasn't haven't hadn't ain't
gonna wanna gotta let lets let's
oh odoo ooh ah aah eh uh um hmm hey yeah yea nah whoa woah la na da
the some any all each every both few more most other another such own same other
one two three four five six seven eight nine ten
am pm
get got getting gets
`.trim().split(/\s+/));

// ---------------------------------------------------------------------------
// BLOCK: words that are real but bad game words — too obscure, too clinical,
// or just don't evoke a song. Safety net on top of the curated seed.
// ---------------------------------------------------------------------------
const BLOCK = new Set(`
bumper desperate journal remembrance reminiscence reverie wistful forlorn melancholy
isthmus archipelago atoll peninsula plateau mesa butte fathom furlong league meridian
gazebo trellis hedge catacomb crypt sarcophagus
anvil bellows galoshes earmuff binocular kaleidoscope sundial pendulum metronome
solitude seclusion exile banishment alienation oppression bondage servitude tyranny
perseverance determination aspiration ambition cowardice timidity reluctance
luminous languid listless sluggish feeble frail fickle vacuous vapid
walrus possum skunk beaver otter minnow newt
caboose zeppelin blimp gramophone typewriter parchment ledger quill
inhabit reside meander loiter linger dwell perch roost
indifferent apathetic detached aloof bewildered baffled perplexed confounded
swan sparrow nightingale robin raven hawk crow finch wren lark heron crane
county meadow glade thicket bramble
`.trim().split(/\s+/));

// ---------------------------------------------------------------------------
// Curated seed — concrete, emotional, song-evocative words. Base forms; the
// normalizer collapses plurals/tenses and de-dupes across groups.
// ---------------------------------------------------------------------------
const GROUPS = {

love: `love lover baby darling honey sweetheart sugar babe sweetie boo valentine
kiss hug crush flame passion desire romance flirt tease
heart heartbreak heartache breakup affair fling
soulmate boyfriend girlfriend wedding marriage bride groom ring vow husband wife
cheat jealous faithful forever together apart lonely alone miss crazy mine`,

people: `girl boy man woman lady child kid mama papa mom dad mommy daddy
mother father brother sister son daughter family friend buddy homie stranger
angel devil hero king queen prince princess
soldier sailor cowboy gangster dancer singer dreamer fighter rebel outlaw
preacher gypsy fool sinner saint neighbor enemy crowd people
somebody nobody everybody darling baby man woman`,

body: `eyes face smile lips mouth kiss hair head hand fingers arms shoulder
neck heart skin blood bones body hips legs feet knees back ears
voice breath touch tears sweat heartbeat pulse scars tattoo`,

feeling: `happy sad blue lonely alone crazy mad wild scared afraid brave
strong weak hurt pain ache joy fear hope faith doubt trust pride shame
regret jealous broken lost free numb empty cold warm alive dead tired
drunk high low sorry sweet bitter restless reckless`,

feel_verbs: `cry laugh smile love hate miss need want feel hurt heal dream hope
pray wish believe fall rise hold break shake tremble burn fade breathe
scream shout whisper sigh ache long bleed shiver melt glow`,

nature: `sun moon stars sky clouds rain storm thunder lightning wind snow ice
fog rainbow sunrise sunset dawn dusk twilight
ocean sea waves shore beach sand island river stream lake water waterfall
mountain hill valley cliff canyon cave rock stone
forest woods tree leaves flower roses garden field grass meadow
desert dirt mud earth ground fire flame flames smoke ash dust`,

animals: `bird wings dove eagle wolf lion tiger bear fox
dog cat horse snake fish shark butterfly bee`,

time: `time day night morning noon midnight evening sunday monday friday saturday
today tomorrow yesterday week month year summer winter spring autumn season
hour minute moment forever eternity lifetime clock birthday holiday christmas weekend
youth ago tonight someday daylight`,

place: `home house room door window bed street road highway town city downtown
corner alley club bar church school hotel motel paradise hometown neighborhood
prison jail stage bridge castle tower garden kitchen backseat heaven hell
california hollywood vegas memphis nashville harlem
country county border bayou`,

motion: `road drive ride run walk fly dance move leave stay escape chase follow
wander journey gone away back return arrive rush hurry slow
train plane car bus boat ship bike wheels miles ticket suitcase`,

music: `song music melody beat rhythm sing dance radio record guitar piano drums
bass stage microphone party club disco groove jam choir band concert show
vinyl speakers clap whistle hum encore anthem lullaby serenade`,

color: `red blue green yellow black white gold golden silver purple pink
gray brown scarlet crimson neon`,

light: `light dark darkness shadow shine glow sparkle flash spotlight
moonlight sunlight starlight candle neon glitter shimmer flicker`,

money: `money cash dollar dime penny gold rich poor broke diamond jewels
treasure fortune bills gamble bet luck lucky jackpot lottery paycheck bank
gold ring crown`,

food: `wine whiskey beer liquor drink champagne coffee tea sugar honey candy
chocolate cake cherry lemon apple peach water smoke cigarette bottle glass
taste sweet hungry`,

clothes: `dress jeans shirt suit tie hat coat jacket boots shoes heels gloves
crown jewelry necklace ring lace silk leather pocket naked bare scarf`,

action: `jump fall rise swim climb fight kiss touch break burn shine spin turn
sleep wake hide find lose win give take save kill die live call knock
catch throw pull push lift bend wait stop start dance run walk fly drive`,

speech: `lies truth secret promise story words call prayer wish scream whisper
shout cry goodbye hello sorry blame forgive confess`,

mind: `dreams memory memories mind thoughts crazy fantasy nightmare wonder
imagine remember forget believe know hope`,

spirit: `god heaven hell angel devil soul spirit ghost faith prayer pray holy
sin sinner saint cross gospel hallelujah amen miracle glory bless`,

big_ideas: `life death dream hope faith freedom fate destiny luck magic miracle
glory fame power war peace victory trouble future change chance mystery
danger control young wild free`,

descriptors: `beautiful pretty gorgeous ugly big little tall high low fast slow
strong weak hard soft hot cold warm loud quiet sweet bitter new old young
rich poor true real fake free wild crazy lonely broken golden bright dark
lucky perfect dirty clean naked pure deep mad sweet`,

slang: `vibe mood party drunk high broke crazy wild fame spotlight hustle squad
crew homie crush ghost flex hype thrill`,

seasons: `christmas santa snow summer winter spring birthday weekend holiday
midnight sunshine rain`,

city: `street gun crime police jail prison hustle ghetto danger trouble blood
fight survive struggle rise hood block`,

drive: `drive car road highway wheels speed race cruise miles gas window radio
fast escape engine`,

compounds: `heartbreak heartache sunshine moonlight sunlight starlight midnight
sunrise sunset daylight firefly wildfire rainfall waterfall hometown downtown
heartbeat goodbye someday somebody nobody everybody forever tonight sunflower
lovesick homesick daydream nighttime lifetime heartland`,
};

// ---------------------------------------------------------------------------
// Light lemmatizer: collapse common inflections to a base form that exists.
// ---------------------------------------------------------------------------
function lemma(word, bases) {
  const has = (w) => bases.has(w);
  if (word.endsWith('ly')) { const a = word.slice(0, -2); if (has(a)) return a; }
  if (word.endsWith('ing') && word.length > 4) {
    const s = word.slice(0, -3);
    if (has(s)) return s;
    if (has(s + 'e')) return s + 'e';
    if (s.length > 1 && s[s.length-1] === s[s.length-2] && has(s.slice(0,-1))) return s.slice(0,-1);
  }
  if (word.endsWith('ed') && word.length > 3) {
    const s = word.slice(0, -2);
    if (has(s)) return s;
    if (has(s + 'e')) return s + 'e';
    if (s.endsWith('i') && has(s.slice(0,-1) + 'y')) return s.slice(0,-1) + 'y';
    if (s.length > 1 && s[s.length-1] === s[s.length-2] && has(s.slice(0,-1))) return s.slice(0,-1);
  }
  if (word.endsWith('ies') && word.length > 4) { const y = word.slice(0,-3) + 'y'; if (has(y)) return y; }
  if (word.endsWith('es') && word.length > 3) { const s = word.slice(0,-2); if (has(s)) return s; }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) { const s = word.slice(0,-1); if (has(s)) return s; }
  return word;
}

// ---------------------------------------------------------------------------
// Build the list.
// ---------------------------------------------------------------------------
let raw = [];
for (const key of Object.keys(GROUPS)) raw = raw.concat(GROUPS[key].trim().split(/\s+/));

raw = raw
  .map((w) => w.toLowerCase().replace(/[^a-z'-]/g, '').trim())
  .filter((w) => w.length >= 2)
  .filter((w) => !STOP.has(w) && !BLOCK.has(w));

const bases = new Set(raw);
const collapsed = raw.map((w) => lemma(w, bases));

const seen = new Set();
const words = [];
for (const w of collapsed) {
  if (STOP.has(w) || BLOCK.has(w) || w.length < 2 || seen.has(w)) continue;
  seen.add(w);
  words.push(w);
}
words.sort();

const out =
`/* AUTO-GENERATED by tools/generate_words.js — do not edit by hand.
 * ${words.length} song-evocative, base-form words.
 * Regenerate with:  node tools/generate_words.js
 */
window.WORDS = ${JSON.stringify(words)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'words.js'), out);
console.log(`Wrote words.js with ${words.length} words.`);
