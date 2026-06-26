/*
 * Word-list generator for "Sing That Song".
 *
 * Produces words.js — a curated list of words that commonly appear in popular
 * songs from roughly the last 40 years. Rules (from the spec):
 *   - Skip connector / stop words (the, and, or, in, a, ...).
 *   - Skip words that are too generic / would match almost any song.
 *   - Collapse similar forms to a single BASE word:
 *        close / closely        -> close
 *        own / owned / owning    -> own
 *        run / running / ran     -> run
 *        baby / babies           -> baby
 *   - One entry per concept.
 *
 * The seed below is hand-curated in base form already. The normalizer is a
 * safety net: it lowercases, trims, removes stop words, removes anything that
 * is just an inflection of a word already present, and de-duplicates.
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
// Curated seed. Grouped only for readability; groups are merged + deduped.
// All entries are intended to be BASE forms.
// ---------------------------------------------------------------------------
const GROUPS = {

love: `love lover beloved romance crush flame passion desire kiss hug embrace cuddle caress
sweetheart darling honey sugar valentine affection devotion adore cherish yearn long
heartbreak heartache breakup ex flirt tease seduce tempt romance fling affair
soulmate partner companion match boyfriend girlfriend bride groom wedding marriage husband wife
ring vow forever faithful loyal cheat betray jealous jealousy
heart soul spirit feeling emotion butterfly spark chemistry attraction`,

people: `baby girl boy man woman lady gentleman child kid son daughter brother sister mother father
mama papa mom dad mommy daddy grandma grandpa family kin folk friend buddy pal mate stranger
neighbor enemy foe rival hero villain angel devil saint sinner king queen prince princess
lord master servant slave fool clown jester dancer singer player gambler dreamer fighter
soldier sailor cowboy gypsy outlaw rebel preacher teacher healer leader follower
crowd people nation tribe gang crew band squad team partner twin
person someone somebody nobody everybody anybody yourself myself`,

body: `eye face smile lip mouth tongue tooth kiss hair head hand finger arm shoulder neck chest
heart skin bone blood vein body waist hip leg knee foot toe heel ankle back spine
ear nose cheek chin brow lash brain mind nerve breath voice throat
touch hold grip grab reach embrace shake shiver tremble sweat tear blush
muscle pulse heartbeat scar wound bruise tattoo`,

emotion: `joy happy glad cheer delight bliss ecstasy elation thrill excitement
sad sorrow grief pain hurt ache misery despair gloom blue melancholy lonely loneliness
fear afraid scared terror dread panic worry anxiety nervous
anger rage fury mad wrath bitter resentment hate hatred spite
hope faith doubt trust belief courage brave bold fearless strength weakness
shame guilt regret remorse pride ego vanity envy greed lust
peace calm serene content satisfy relief comfort ease
confusion chaos madness crazy wild restless reckless numb empty hollow lost
wonder awe amaze surprise shock astonish stun
desire want need crave hunger thirst longing wish dream`,

nature: `sun moon star sky cloud rain storm thunder lightning wind breeze hurricane tornado
snow ice frost hail sleet fog mist dew rainbow sunrise sunset dawn dusk twilight
ocean sea wave tide shore beach sand coast island bay gulf harbor lagoon
river stream creek lake pond pool waterfall flood current
mountain hill valley cliff canyon peak ridge slope cave rock stone boulder pebble
forest wood tree leaf branch root flower rose petal garden meadow field grass weed
desert dune dirt mud clay soil earth ground land
fire flame spark ember ash smoke heat blaze glow burn
water flow drip splash drop puddle wet damp dry
animal bird wing feather nest fly soar
wolf dog cat lion tiger bear fox horse deer rabbit snake fish shark dove eagle hawk crow
butterfly bee spider bug
season spring summer autumn fall winter weather climate`,

time: `time hour minute second moment instant day night morning noon evening midnight afternoon
today tomorrow yesterday week month year decade century forever eternity always never
past present future memory history beginning end finish start
clock watch hand tick bell alarm calendar date birthday anniversary holiday
youth young old age adult elder ancient new fresh modern ago later soon early late
forever moment lifetime ageless timeless deadline countdown`,

place: `home house room door window wall floor roof ceiling bed couch chair table kitchen
bedroom bathroom basement attic porch yard garden gate fence garage
city town village street road avenue alley lane highway boulevard sidewalk corner block
downtown uptown suburb country countryside ghetto slum
school church temple cathedral chapel bar club pub tavern saloon cafe diner restaurant
hotel motel inn shop store market mall office factory mill warehouse
park playground stadium arena theater cinema museum library station airport
bridge tunnel tower castle palace mansion cottage cabin shack tent
station platform corner crossroad junction
heaven hell paradise eden hometown neighborhood`,

travel: `road trip journey travel adventure voyage quest path way route map compass direction
walk run jog stroll wander roam drift ramble march hike climb crawl
drive ride race speed cruise coast park
car truck bus train plane jet boat ship sail bike bicycle motorcycle wheel engine
ticket suitcase bag luggage passport gas fuel tire mile
arrive leave depart return escape flee chase follow lead guide
north south east west forward backward
move motion go come stay leave stop wait rush hurry slow`,

music: `song music melody tune rhythm beat tempo harmony chord note key scale
sing sang voice sound noise echo silence quiet loud
band orchestra choir chorus verse line lyric word
guitar piano drum bass violin trumpet saxophone horn flute fiddle banjo keyboard
microphone speaker stage spotlight concert show gig festival tour album record
radio record vinyl tape stereo headphone groove jam riff solo
dance dancer disco party celebration groove move sway twist spin
clap snap hum whistle shout scream holler croon`,

color: `color red blue green yellow orange purple pink black white gray grey brown gold silver
crimson scarlet ruby cherry rose violet indigo turquoise teal navy emerald jade
amber bronze copper ivory pearl charcoal ebony
bright dark light pale faded neon glow shine shadow shade tint hue`,

light: `light dark shadow shine glow gleam glitter sparkle shimmer flash flicker beam ray
glare blaze radiance brilliance dim bright blind
candle lamp lantern torch flashlight neon spotlight streetlight starlight moonlight sunlight
firelight dawn glimmer twinkle`,

money: `money cash dollar dime penny coin gold silver fortune wealth rich poor broke
bill check bank loan debt credit pay paycheck wage salary bonus tip
buy sell trade deal bargain price cost cheap expensive afford spend save
treasure jewel diamond ring gem crown pearl ruby
gamble bet jackpot lottery luck win lose stake casino chip card dice game`,

food: `food eat drink taste hunger thirst feast meal bite chew swallow
bread wine beer whiskey vodka rum tequila champagne liquor booze drink shot bottle glass
coffee tea milk sugar honey salt spice pepper
apple cherry peach lemon orange grape strawberry banana melon berry fruit
chocolate candy cake pie cookie sweet
fire smoke cigarette weed
water juice soda
dinner breakfast lunch supper kitchen plate spoon fork knife cup`,

clothing: `dress shirt skirt jeans pants suit tie hat cap coat jacket sweater glove scarf
shoe boot heel sneaker sock sandal
shorts blouse gown robe gear outfit costume uniform
button zipper pocket collar sleeve hem lace silk velvet leather denim cotton wool fur
jewelry necklace bracelet earring ring crown belt
naked bare strip undress fashion style`,

action: `run walk jump leap fall rise stand sit lie kneel crawl climb dance spin twirl sway
dive swim float sink drown surf
fly soar glide drift hover land crash
fight punch hit slap kick push pull shove throw catch toss
hold grab grip squeeze release drop lift carry drag
break shatter crack smash crush burst explode
build make create form shape mold craft
open close shut lock unlock knock slam
turn twist bend fold wrap tie bind
cut tear rip slice burn freeze melt
shake tremble shiver quiver wave nod bow
chase follow lead guide find lose seek search hide hunt
give take steal rob borrow lend share keep
win lose beat defeat conquer surrender
work play rest sleep wake dream wait`,

speech: `say tell talk speak whisper shout scream yell cry sigh sing call answer ask beg plead
promise swear lie truth confess admit deny argue fight blame forgive
word lie secret story tale rumor gossip news message letter call phone text
prayer wish curse blessing toast cheer chant joke laugh smile`,

mind: `think know believe understand learn remember forget realize wonder imagine dream
feel sense notice see watch look stare glance gaze observe witness
decide choose pick plan hope expect doubt fear worry
mind brain thought idea memory dream vision fantasy nightmare illusion
reason sense wisdom knowledge truth lie secret mystery question answer
crazy insane mad sane foolish wise smart dumb clever genius`,

abstract: `life death birth fate destiny luck chance fortune karma curse blessing miracle
dream hope wish desire goal ambition purpose meaning reason cause
truth lie reality illusion fantasy myth legend story
freedom liberty justice equality peace war power control
choice decision change difference
beauty ugly grace charm magic spell wonder
chaos order balance harmony peace struggle conflict trouble
victory defeat success failure triumph loss
beginning end change journey
problem solution answer question mystery puzzle riddle
limit edge boundary line border
energy force power strength weakness
glory fame fortune respect honor dignity disgrace`,

religion: `god heaven hell angel devil demon saint sinner soul spirit ghost
faith prayer pray bless curse holy sacred sin salvation redemption forgiveness mercy grace
church temple cross bible gospel hymn choir preacher prophet
sky cloud light eternity afterlife resurrection ascend
believe worship praise glory hallelujah amen miracle`,

weatherverbs: `rain pour shine glow burn freeze melt thaw blow drift fade
storm thunder flash strike clear break shine`,

relationships: `friend enemy rival stranger lover partner mate companion
trust betray cheat lie forgive forget remember
together apart alone lonely separate divorce split
miss leave stay return wait
meet greet welcome goodbye farewell hello
fight argue makeup reconcile breakup
hold lose keep find lose
need want depend lean rely support help save rescue`,

descriptors: `beautiful pretty gorgeous lovely cute handsome ugly plain
big small tiny huge giant massive little large
high low tall short long deep shallow wide narrow thick thin
fast slow quick rapid sudden gradual
strong weak tough soft hard gentle rough smooth
hot cold warm cool freezing burning
loud quiet soft harsh sweet bitter sour
new old young ancient fresh stale
clean dirty pure filthy
rich poor full empty
true false real fake genuine
bright dark light heavy
wild calm gentle fierce
free trapped lost found broken whole
crazy sane mad wild
lucky unlucky blessed cursed
golden silver shining glowing fading
endless final lonely empty
perfect flawed broken`,

verbsfeel: `cry laugh smile frown weep sob tear grin
love hate adore despise miss long yearn crave
hurt heal ache suffer bleed
breathe gasp sigh choke
shiver tremble shake quiver
melt burn glow freeze
dream wake sleep rest dream
hope wish pray dream believe
fall rise float sink drown fly`,

objects: `phone letter pen paper book page photo picture frame mirror clock watch key lock chain
gun knife sword blade bullet trigger shield armor
bottle glass cup plate
candle match lighter cigarette
flag banner sign poster billboard
wheel engine motor machine gear button switch wire cable
bell whistle horn alarm siren drum
toy doll ball game card dice
rope chain string thread needle pin
box bag basket bucket jar
hammer nail tool blade
wallet purse bag pocket coin
camera screen tv television
star moon flag`,

city_life: `street light traffic crowd noise concrete neon siren subway taxi
crime cop police jail prison cell guard
drug dealer pusher addict junkie
gun shot violence danger fear
hustle grind struggle survive
dream escape rise fall
poverty wealth ghetto mansion`,

party: `party dance club night drink wine beer shot bottle
music beat dj song dance floor
crowd lights laser smoke
celebrate toast cheers
crazy wild reckless free
weekend friday saturday night
groove vibe mood feeling
high drunk wasted buzzed`,

seasons_holiday: `christmas santa snow gift present holiday
summer beach sun vacation
winter cold snow ice
spring flower bloom
fall leaf autumn
birthday cake candle wish
newyear midnight kiss
halloween ghost mask`,

war: `war battle fight soldier army gun bullet bomb
enemy victory defeat surrender
blood death wound scar
peace freedom flag nation
hero coward brave fear
fight survive struggle conquer
march drum trumpet`,

drive_car: `drive car road highway wheel engine gas speed
fast race chase cruise
window radio music
mile journey destination
crash wreck brake stop
night headlight neon
freedom escape open`,

dreams_sleep: `dream sleep wake night bed pillow blanket
nightmare fantasy vision
rest tired weary exhausted
yawn snore drift
awake asleep doze nap
moon star night dark
wish hope imagine`,

age_growth: `grow change become turn
young old age youth child adult
born die live survive
learn teach lesson
mistake regret wisdom
memory past childhood
future grow up down`,

generic_strong: `dream fire night light love heart soul home road rain star moon sun sky
time life death blood tear smile angel devil heaven hell
gold silver diamond shadow ghost storm wave ocean mountain river
freedom power glory victory war peace
king queen crown throne
magic miracle wonder mystery
forever never always tonight
broken empty lonely lost found
wild free crazy reckless
strong brave fearless
beautiful gorgeous shining golden
whisper scream shout cry`,

extra_nouns: `dawn daylight daybreak sunshine moonbeam stardust comet meteor galaxy universe cosmos planet
horizon skyline atmosphere heaven sphere orbit eclipse aurora
glacier iceberg avalanche volcano lava crater earthquake quake tremor
prairie plain swamp marsh jungle rainforest wilderness wildwood grove orchard vineyard
brook spring well fountain reservoir dam canal harbor port dock pier wharf jetty
reef shell coral seaweed pearl driftwood seashell
boulder gravel quartz crystal marble granite flint coal iron steel copper bronze rust
thorn vine ivy moss fern bloom blossom bud sprout seed pollen nectar
oak pine maple willow birch cedar palm bamboo cactus
robin sparrow swallow cardinal raven owl gull pigeon swan crane heron peacock parrot
lark nightingale finch wren bluebird hummingbird vulture falcon phoenix
butterfly moth dragonfly firefly ladybug cricket grasshopper ant beetle wasp hornet
rattlesnake serpent dragon lizard frog toad turtle crocodile alligator
mustang stallion mare colt pony donkey mule ox bull cow calf sheep lamb goat pig hog
hound puppy kitten mouse rat squirrel raccoon possum skunk beaver otter
whale dolphin seal walrus penguin octopus jellyfish stingray minnow trout salmon`,

extra_objects: `anchor rope sail mast oar paddle compass lantern beacon lighthouse
arrow bow spear dagger axe hatchet whip lasso noose shackle
crown scepter throne robe cloak veil mask disguise costume
locket pendant charm amulet talisman ribbon bow brooch
quilt blanket pillow cushion mattress hammock cradle rocker
fireplace hearth chimney furnace stove kettle pan pot cauldron
ladder staircase elevator escalator hallway corridor doorway threshold
windowpane curtain drape shade shutter blind
portrait painting sculpture statue monument mural canvas easel brush palette
violin cello harp accordion harmonica tambourine triangle cymbal gong xylophone
turntable amplifier cassette compact recorder jukebox gramophone needle vinyl
typewriter notebook journal diary scroll parchment envelope stamp postcard telegram
umbrella raincoat boot galoshes mitten earmuff
binocular telescope microscope magnifier lens prism kaleidoscope
balloon kite firework sparkler confetti streamer banner ribbon
marble jack yo top puzzle domino checker chess pawn knight bishop rook
swing slide seesaw carousel ferris roller coaster bumper
suitcase trunk backpack satchel briefcase duffel knapsack
shovel rake hoe plow pitchfork wheelbarrow scythe sickle
anvil forge bellows hammer chisel saw drill wrench screwdriver pliers nail screw bolt
fishing hook bait lure reel net trap snare cage leash collar
saddle bridle spur stirrup harness rein
crutch cane wheelchair bandage cast splint stretcher
syringe pill capsule tablet potion remedy tonic elixir`,

extra_verbs: `wander roam stray drift meander stroll saunter prowl creep sneak tiptoe stomp stumble
gallop trot canter prance scamper scurry dash sprint bolt flee
glide swoop dive plunge plummet tumble topple collapse crumble
stretch reach extend lean tilt slant
clutch clasp cling hug nestle snuggle cradle
fling hurl heave toss pitch chuck lob
shatter splinter crack snap fracture rupture
scatter sprinkle spill pour drench soak drip trickle ooze seep gush spurt
flicker flutter quiver wobble sway rock bob
shimmer glisten glitter sparkle twinkle gleam dazzle radiate
smolder simmer sizzle scorch singe char roast bake toast
freeze thaw shiver frost chill numb
whirl swirl spiral twist coil wind unwind tangle knot weave braid
carve etch engrave sculpt mold shape forge hammer
stitch sew knit mend patch darn weave spin
plant sow reap harvest gather pluck pick
wander gaze stare peer squint blink wink glance glare scowl frown
giggle chuckle snicker cackle howl roar bellow growl snarl hiss
mumble mutter murmur babble stammer stutter chatter ramble
hum croon serenade yodel chant recite rhyme
linger loiter dwell reside inhabit settle nest perch roost
vanish fade dissolve evaporate disappear emerge appear materialize
conquer vanquish triumph prevail overcome endure persist persevere
betray deceive mislead trick fool dupe swindle cheat con
rescue save shelter shield guard protect defend
forgive pardon absolve redeem atone repent confess`,

extra_adjectives: `radiant luminous brilliant dazzling gleaming glowing glittering shimmering sparkling
dim murky shadowy gloomy dreary bleak somber drab dull faded
vivid vibrant bold striking stunning breathtaking magnificent majestic glorious
delicate fragile tender gentle soft silken velvety smooth
rugged jagged rough coarse gritty harsh brittle
graceful elegant slender supple nimble agile swift fleet
clumsy awkward stiff rigid sluggish weary feeble frail
fierce savage ferocious vicious ruthless merciless brutal
serene tranquil peaceful placid mellow soothing
restless anxious uneasy frantic frenzied feverish
weary drowsy sleepy listless languid
giddy dizzy reckless careless carefree
solemn grave serious sober earnest
playful mischievous cheeky sassy sly cunning crafty
generous kind tender warm caring compassionate
selfish greedy stingy cruel cold heartless
honest sincere genuine faithful loyal devoted steadfast
fickle phony shallow hollow vacant
mysterious secretive elusive hidden veiled cryptic
infinite boundless endless eternal everlasting timeless ageless
fleeting fragile temporary momentary passing
sacred divine holy blessed heavenly celestial angelic
wicked sinister evil dreadful ghastly hideous monstrous
gorgeous ravishing alluring enchanting bewitching mesmerizing hypnotic
flawless pristine immaculate spotless
weathered worn tattered ragged shabby rusty crumbling`,

extra_abstract: `solitude isolation seclusion exile banishment alienation
longing yearning craving hunger thirst ache pining
nostalgia reminiscence remembrance reverie daydream fantasy
melancholy sorrow grief mourning lament woe anguish torment agony
serenity contentment fulfillment gratitude blessing
turmoil upheaval havoc mayhem pandemonium frenzy
courage valor bravery daring boldness gallantry heroism
cowardice timidity hesitation reluctance doubt uncertainty
temptation seduction allure enchantment fascination obsession
redemption salvation deliverance liberation emancipation
oppression bondage captivity servitude tyranny
rebellion revolt uprising revolution resistance defiance
wisdom insight enlightenment revelation epiphany
ignorance folly delusion illusion deception facade pretense
ambition aspiration determination perseverance
ruin downfall demise collapse decay decline
legacy heritage tradition custom ritual ceremony
prophecy omen premonition foreboding superstition
karma fate destiny providence fortune misfortune
infinity eternity oblivion void abyss chasm
silence stillness hush quietude
harmony discord dissonance cacophony
chaos disorder confusion bewilderment`,

extra_misc: `compass voyage odyssey pilgrimage expedition crusade
exile vagabond nomad wanderer drifter rover
horizon frontier outpost wilderness badland
saloon cantina speakeasy honkytonk
carnival circus parade pageant festival jubilee gala masquerade
midnight twilight nightfall daybreak gloaming
whirlwind tempest squall gale monsoon downpour drizzle cloudburst
blizzard flurry frostbite icicle snowflake snowdrift
ember cinder bonfire wildfire inferno blaze furnace
mirage oasis dune sandstorm
labyrinth maze dungeon catacomb crypt tomb grave cemetery graveyard
mansion estate manor villa chateau bungalow
hovel shanty hut hovel barn stable coop pen
attic cellar pantry parlor foyer balcony terrace veranda patio
fountain courtyard gazebo trellis hedge
treasure bounty loot plunder ransom dowry inheritance heirloom
crown jewel scepter regalia
quill ink scroll manuscript ledger
hourglass sundial pendulum metronome
chandelier candelabra
masterpiece symphony sonata ballad lullaby anthem hymn requiem serenade
overture finale encore refrain interlude prelude
brushstroke silhouette portrait
shadow reflection echo whisper murmur
heartbeat pulse breath sigh gasp whimper sob wail moan groan`,

slang_modern: `vibe mood feels flex hustle grind swag drip clout fame spotlight
party turnup squad crew gang homie buddy
crush ghost text dm scroll selfie
broke loaded stacked balling
chill relax cruise float coast
hype thrill rush adrenaline
escape breakout freedom
glow shine sparkle radiate
real fake phony genuine
struggle survive thrive rise grind`,

day_to_day: `coffee morning sunrise alarm wake breakfast commute rush
weekend friday monday work shift clock break lunch
weekend vacation getaway holiday staycation
dinner sunset evening relax unwind
bedtime pillow blanket dream snore
laundry dishes chores errands grocery
neighbor mailbox driveway sidewalk
paycheck bills rent mortgage budget savings
phone call message email notification
mirror reflection selfie photo memory`,

occupations: `doctor nurse lawyer judge officer detective sheriff marshal deputy
teacher professor scholar student
farmer rancher shepherd hunter fisher trapper miner
builder carpenter mason plumber electrician mechanic welder
pilot captain sailor astronaut diver
chef baker butcher waiter bartender barista
artist painter sculptor poet writer author novelist
actor actress comedian magician acrobat juggler
musician composer conductor drummer guitarist pianist violinist
banker merchant trader broker clerk cashier salesman
tailor barber stylist
priest pastor monk nun rabbi prophet
soldier general sergeant colonel admiral warrior knight gladiator
thief robber burglar bandit pirate smuggler outlaw
beggar peddler vendor
maid butler servant nanny gardener
explorer pioneer settler colonist
inventor scientist engineer architect
nurse healer surgeon dentist
postman driver conductor pilot
queen king emperor empress duke duchess baron count earl noble peasant`,

geography: `valley canyon gorge ravine gully ditch trench
plateau mesa butte cliff bluff precipice
summit pinnacle crest slope foothill
delta estuary inlet cove bay lagoon strait channel
peninsula isthmus archipelago atoll
tundra steppe savanna prairie heath moor fen bog
glade clearing thicket bramble underbrush
quarry mine cavern grotto tunnel shaft
crossroad junction fork detour bypass overpass underpass
boundary border frontier outskirt periphery
landmark milestone signpost waypoint
acre yard furlong league fathom
equator tropic pole hemisphere meridian
continent territory province region district county shire
metropolis capital colony settlement hamlet`,

sensory: `taste flavor savor aroma scent fragrance perfume odor stench reek
texture touch feel grain coarseness softness
sound tone pitch volume melody hum buzz hiss rustle crackle creak
sight glimpse view vista scene panorama spectacle
bitter sweet sour salty spicy savory bland tangy zesty
sweetness richness
glow brightness dimness brilliance
warmth coolness chill heat
itch tingle prickle sting throb pang ache
numbness dizziness
echo reverberation resonance vibration tremor`,

sports_games: `game match contest tournament championship league
ball bat racket club stick puck net hoop goal
score point goal touchdown homerun knockout
race lap track finish line trophy medal prize
team player coach referee umpire captain
win lose tie draw victory defeat champion underdog
dribble shoot pitch swing tackle dodge sprint dash
boxing wrestling fencing
swim dive surf ski skate sled snowboard
climb hike camp fish hunt
poker bet wager bluff jackpot
chess checker domino dice card deck shuffle deal`,

school: `school college university campus classroom lecture lesson study exam test quiz
homework assignment project essay report thesis
teacher student pupil scholar graduate
chalkboard desk locker hallway cafeteria gym library
grade diploma degree scholarship tuition
recess bell schedule semester
notebook pencil eraser ruler crayon marker
science math history geography literature
playground swing slide
graduation prom dance reunion
backpack lunchbox uniform`,

vehicles: `wagon carriage chariot cart buggy stagecoach
sedan coupe convertible jeep van minivan
truck pickup semi trailer tractor
motorcycle scooter moped
bicycle tricycle unicycle
sailboat yacht canoe kayak raft ferry barge tugboat steamboat
submarine destroyer battleship cruiser frigate
airplane jet helicopter glider blimp zeppelin rocket spaceship shuttle
train locomotive caboose boxcar subway monorail trolley tram
sleigh sled toboggan
ambulance firetruck police taxi limo limousine bus
spaceship satellite probe`,

weather_extra: `sunbeam sunray heatwave drought
breeze gust gale zephyr
dewdrop raindrop hailstone
thunderbolt lightningbolt cloudburst
overcast cloudy hazy foggy misty murky
humid muggy sticky balmy sweltering scorching
frigid frosty icy wintry
clear crisp brisk
rainbow halo
twister cyclone typhoon waterspout
flood deluge torrent downpour`,

numbers_qty: `million billion thousand hundred dozen
single double triple
half quarter third
plenty bunch heap pile bundle batch
crowd swarm flock herd pack school pride
ounce pound ton gram
inch mile yard
gallon quart liter
handful mouthful armful`,

fantasy: `dragon wizard witch sorcerer warlock mage
fairy elf dwarf goblin troll ogre giant
unicorn pegasus griffin phoenix mermaid centaur
vampire werewolf zombie skeleton phantom specter wraith
spell curse hex charm potion enchantment
wand staff crystal orb amulet talisman
castle dungeon tower keep moat drawbridge
quest prophecy destiny chosen
kingdom realm empire throne crown scepter
sword shield armor helmet gauntlet
treasure hoard relic artifact
beast monster creature fiend`,

emotions_extra: `wistful forlorn heartbroken devastated shattered
elated overjoyed thrilled ecstatic euphoric jubilant
furious livid seething irate enraged
terrified petrified horrified
envious resentful spiteful vindictive
grateful thankful appreciative
hopeful optimistic
hopeless desperate despairing
ashamed embarrassed humiliated mortified
proud triumphant victorious
content satisfied fulfilled
restless agitated frazzled overwhelmed
serene composed unflappable
bewildered baffled perplexed confounded
indifferent apathetic detached aloof
yearning aching pining longing`,

final_batch: `whirlpool undertow ripple foam spray surf swell breaker
moonlit starlit sunlit candlelit firelit
heartland homeland motherland fatherland borderland
crossfire backfire wildfire campfire
moonshine sunflower wildflower mayflower
heartstring shoestring drawstring
daydreamer troublemaker heartbreaker
nightfall waterfall pitfall windfall rainfall snowfall downfall
sunset sunrise moonrise
seashore lakeshore
backroad crossroad railroad
hillside seaside countryside bedside fireside roadside wayside
midnight midday midsummer midwinter
twilight starlight moonlight daylight spotlight limelight candlelight
heartbeat drumbeat downbeat upbeat offbeat
footstep doorstep
windowsill windowpane
keepsake namesake
heartache toothache headache
goodbye farewell hello
tonight midnight overnight
somehow somewhere someday sometime someone something nowhere nothing everything everywhere
anywhere anyhow anytime
heartfelt
homesick lovesick seasick
sundown showdown breakdown countdown rundown letdown meltdown
runaway castaway getaway hideaway breakaway giveaway faraway stowaway
outlaw outcast outlast outshine outlive outrun
sunburn heartburn
overflow overgrow overcome overthrow overboard
underdog underground undertow underdog
firefly fireworks firewood firefighter
moonwalk boardwalk sidewalk jaywalk
heartland wasteland wonderland dreamland fairyland grassland wetland farmland woodland
hometown downtown uptown
bittersweet
lovelorn
nevermore evermore furthermore
heaven-sent
wildcat bobcat tomcat copycat
sunbeam crossbeam
rosebud rosewood driftwood firewood
breathtaking spellbinding earthshaking groundbreaking
nightmare daymare
warpath warfare welfare nightmare
playground battleground fairground foreground background underground
heartthrob
candlestick lipstick drumstick matchstick broomstick
backbone wishbone jawbone trombone
moonbeam`,
};

// ---------------------------------------------------------------------------
// Light lemmatizer: collapse common inflections to a base form.
// Conservative — only collapses an inflected word when its base is also a real
// candidate. We build the candidate set first, then collapse.
// ---------------------------------------------------------------------------
function candidateBases(words) {
  return new Set(words);
}

// Try to reduce an inflected form to a base that exists in `bases`.
function lemma(word, bases) {
  const has = (w) => bases.has(w);

  // adverb -ly  (closely -> close, slowly -> slow)
  if (word.endsWith('ly')) {
    const a = word.slice(0, -2);
    if (has(a)) return a;
    const b = word.slice(0, -1); // -ly with kept e? rare
    if (has(b)) return b;
  }
  // -ing  (running -> run, loving -> love, dancing -> dance)
  if (word.endsWith('ing') && word.length > 4) {
    const stem = word.slice(0, -3);
    if (has(stem)) return stem;
    if (has(stem + 'e')) return stem + 'e';                 // dancing -> dance
    if (stem.length > 1 && stem[stem.length - 1] === stem[stem.length - 2]
        && has(stem.slice(0, -1))) return stem.slice(0, -1); // running -> run
  }
  // -ed  (owned -> own, loved -> love, cried -> cry)
  if (word.endsWith('ed') && word.length > 3) {
    const stem = word.slice(0, -2);
    if (has(stem)) return stem;
    if (has(stem + 'e')) return stem + 'e';                 // loved -> love
    if (stem.endsWith('i') && has(stem.slice(0, -1) + 'y')) return stem.slice(0, -1) + 'y'; // cried->cry
    if (stem.length > 1 && stem[stem.length - 1] === stem[stem.length - 2]
        && has(stem.slice(0, -1))) return stem.slice(0, -1);
  }
  // -ies -> y  (babies -> baby)
  if (word.endsWith('ies') && word.length > 4) {
    const y = word.slice(0, -3) + 'y';
    if (has(y)) return y;
  }
  // -es  (kisses -> kiss, wishes -> wish)
  if (word.endsWith('es') && word.length > 3) {
    const stem = word.slice(0, -2);
    if (has(stem)) return stem;
  }
  // plural -s  (stars -> star)  — but not -ss
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    const stem = word.slice(0, -1);
    if (has(stem)) return stem;
  }
  return word;
}

// ---------------------------------------------------------------------------
// Build the list.
// ---------------------------------------------------------------------------
let raw = [];
for (const key of Object.keys(GROUPS)) {
  raw = raw.concat(GROUPS[key].trim().split(/\s+/));
}

raw = raw
  .map((w) => w.toLowerCase().replace(/[^a-z'-]/g, '').trim())
  .filter((w) => w.length >= 2)
  .filter((w) => !STOP.has(w));

const bases = candidateBases(raw);
const collapsed = raw.map((w) => lemma(w, bases));

// Final dedupe, drop stop words again (lemma might produce one), sort.
const seen = new Set();
const words = [];
for (const w of collapsed) {
  if (STOP.has(w)) continue;
  if (w.length < 2) continue;
  if (seen.has(w)) continue;
  seen.add(w);
  words.push(w);
}
words.sort();

const out =
`/* AUTO-GENERATED by tools/generate_words.js — do not edit by hand.
 * ${words.length} curated, base-form words common in popular songs.
 * Regenerate with:  node tools/generate_words.js
 */
window.WORDS = ${JSON.stringify(words)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'words.js'), out);
console.log(`Wrote words.js with ${words.length} words.`);
